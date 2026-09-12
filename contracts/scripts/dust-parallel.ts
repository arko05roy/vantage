/**
 * Vantage — Preprod DUST synchronization, per midnight-preprod-deploy skill
 * (`npm run dust-parallel`). Faithful port of the reference implementation:
 * downloads ordered dust-ledger-event ranges over parallel indexer
 * subscriptions, replays them in order into the local DustLocalState, and
 * saves a resumable checkpoint to dust-snapshot.json. This bypasses the
 * wallet's serial sync (historical tNIGHT→tDUST sync failure).
 *
 * Guardrails: SEED arrives only via the env var; the snapshot stores public
 * state only and is gitignored; .dust-ranges/ is gitignored.
 *
 * Usage:  SEED=<64-hex> npm run dust-parallel
 */
import { Buffer } from 'node:buffer';
import { createWriteStream } from 'node:fs';
import { mkdir, readFile, rename, rm, truncate, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { WebSocket } from 'ws';
import { createClient } from 'graphql-ws';
import { HDWallet, Roles } from '@midnightntwrk/wallet-sdk';
import * as ledger from '@midnight-ntwrk/midnight-js-protocol/ledger';

const seed = process.env.SEED;
if (!seed || !/^[0-9a-fA-F]{64}$/.test(seed)) {
  throw new Error('SEED must be a 64-character hex string');
}
const currentDir = path.resolve(new URL(import.meta.url).pathname, '..');
const snapshotPath = process.env.DUST_SNAPSHOT ?? path.resolve(currentDir, '..', 'dust-snapshot.json');
const rangeSize = Number(process.env.DUST_RANGE_SIZE ?? '20000');
const concurrency = Number(process.env.DUST_CONCURRENCY ?? '4');
const wsUrl = 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws';
const workDir = path.resolve(currentDir, '..', '.dust-ranges');
const subscription = `subscription DustLedgerEvents($id: Int) {
  dustLedgerEvents(id: $id) {
    type: __typename
    id
    raw
    maxId
  }
}`;

type DustEvent = {
  id: number;
  raw: string;
  maxId: number;
};

const hdWallet = HDWallet.fromSeed(Buffer.from(seed, 'hex'));
if (hdWallet.type !== 'seedOk') throw new Error('Failed to restore HD wallet');
const derivation = hdWallet.hdWallet.selectAccount(0).selectRoles([Roles.Dust]).deriveKeysAt(0);
if (derivation.type !== 'keysDerived') throw new Error('Failed to derive DUST key');
hdWallet.hdWallet.clear();
const dustSecretKey = ledger.DustSecretKey.fromSeed(derivation.keys[Roles.Dust]);

// Bootstrap a fresh checkpoint when none exists yet (empty DustLocalState at
// offset 0 — event replay applies all subsequent ParamChanges anyway).
const snapshotText = await readFile(snapshotPath, 'utf8').catch(() => undefined);
const snapshot = snapshotText
  ? (JSON.parse(snapshotText) as { state: string; offset?: string })
  : {
      publicKey: { publicKey: dustSecretKey.publicKey.toString() },
      state: Buffer.from(
        new ledger.DustLocalState(ledger.LedgerParameters.initialParameters().dust).serialize(),
      ).toString('hex'),
      protocolVersion: '0',
      networkId: 'preprod',
      offset: '0',
    };
const initialOffset = BigInt(snapshot.offset ?? '0');
let localState = ledger.DustLocalState.deserialize(Buffer.from(snapshot.state, 'hex'));

const firstEvent = await new Promise<DustEvent>((resolve, reject) => {
  const client = createClient({ url: wsUrl, webSocketImpl: WebSocket });
  let dispose = () => {};
  dispose = client.subscribe(
    {
      query: subscription,
      variables: { id: Number(initialOffset) },
    },
    {
      next: (payload) => {
        const event = (payload.data as { dustLedgerEvents: DustEvent }).dustLedgerEvents;
        resolve(event);
        dispose();
        void Promise.resolve(client.dispose()).catch(() => {});
      },
      error: reject,
      complete: () => {},
    },
  );
});

const tip = firstEvent.maxId;
const firstId = Number(initialOffset) + 1;
if (firstId > tip) {
  console.log(`DUST checkpoint is already at the event tip: ${tip}`);
  process.exit(0);
}

await mkdir(workDir, { recursive: true });

// The indexer starves concurrent catch-up streams after an initial burst, so
// each worker owns one large contiguous span and resumes from its last event
// id whenever the stream goes idle. Per-span .meta files make partial
// downloads resumable across restarts.
const spans: Array<{ start: number; end: number; path: string; meta: string }> = [];
const spanSize = Math.max(rangeSize, Math.ceil((tip - firstId + 1) / concurrency));
for (let start = firstId; start <= tip; start += spanSize) {
  const end = Math.min(start + spanSize - 1, tip);
  const path = `${workDir}/${String(start).padStart(10, '0')}-${String(end).padStart(10, '0')}.bin`;
  spans.push({ start, end, path, meta: `${path}.meta` });
}
for (const span of spans) {
  const meta = await readFile(span.meta, 'utf8')
    .then((text) => JSON.parse(text) as { start?: number; end?: number; lastId?: number; done?: boolean })
    .catch(() => undefined);
  if (meta?.start !== span.start || meta?.end !== span.end || meta?.lastId === undefined) {
    await rm(span.path, { force: true });
    await rm(span.meta, { force: true });
  }
}

console.log(`DUST checkpoint: ${initialOffset}`);
console.log(`DUST event tip: ${tip}`);
console.log(`Downloading ${spans.length} ordered spans of ~${spanSize} events...`);

const IDLE_MS = 30_000;
const downloadSpan = async ({ start, end, path: filePath, meta }: (typeof spans)[number]) => {
  const prior = await readFile(meta, 'utf8')
    .then((text) => JSON.parse(text) as { lastId?: number; offset?: number; done?: boolean })
    .catch(() => undefined);
  if (prior?.done) {
    console.log(`DUST span ${start}-${end} already downloaded`);
    return;
  }
  // Resume state: (lastId, offset) always describes a whole-event prefix —
  // both are only updated together inside write callbacks.
  const resumeFrom = prior?.lastId !== undefined && prior?.offset !== undefined ? prior.lastId : start - 1;
  if (resumeFrom > start - 1) {
    await truncate(filePath, prior!.offset!);
  }

  await new Promise<void>((resolve, reject) => {
    const output = createWriteStream(filePath, {
      flags: resumeFrom > start - 1 ? 'a' : 'w',
      mode: 0o600,
    });
    let settled = false;
    let lastId = resumeFrom;
    let flushedOffset = prior?.offset ?? 0;
    let flushedLastId = resumeFrom;
    let received = 0;
    let client: ReturnType<typeof createClient> | undefined;
    let dispose = () => {};
    let idleTimer: NodeJS.Timeout | undefined;

    const stopStream = () => {
      dispose();
      void Promise.resolve(client?.dispose()).catch(() => {});
    };
    const saveProgress = async (done: boolean) => {
      await writeFile(
        meta,
        JSON.stringify({ start, end, lastId: flushedLastId, offset: flushedOffset, done }),
        { mode: 0o600 },
      );
    };
    const finish = () => {
      if (settled) return;
      settled = true;
      if (idleTimer) clearInterval(idleTimer);
      stopStream();
      output.end(async () => {
        await saveProgress(true).catch(() => {});
        console.log(`Downloaded DUST events ${start}-${end} (${received} events this run)`);
        resolve();
      });
    };
    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      if (idleTimer) clearInterval(idleTimer);
      stopStream();
      output.destroy();
      reject(error);
    };

    const subscribeFrom = (fromId: number) => {
      stopStream();
      client = createClient({ url: wsUrl, webSocketImpl: WebSocket });
      dispose = client.subscribe(
        {
          query: subscription,
          variables: { id: fromId },
        },
        {
          next: (payload) => {
            const event = (payload.data as { dustLedgerEvents: DustEvent }).dustLedgerEvents;
            if (event.id <= lastId) return;
            lastId = event.id;
            if (event.id > end) {
              finish();
              return;
            }
            received += 1;
            const raw = Buffer.from(event.raw, 'hex');
            output.write(raw, () => {
              flushedOffset += raw.length;
              flushedLastId = event.id;
            });
            if (event.id === end) finish();
          },
          error: () => {
            if (settled) return;
            console.log(`  span ${start}-${end}: stream error at event ${lastId}, resuming…`);
            subscribeFrom(lastId);
          },
          complete: () => {
            if (!settled) subscribeFrom(lastId);
          },
        },
      );
    };

    output.on('error', fail);
    subscribeFrom(resumeFrom);
    idleTimer = setInterval(() => {
      if (settled || lastId >= end) return;
      // No usable event since the previous check: lastId only advances in `next`.
      const stalledAt = lastId;
      void saveProgress(false);
      setTimeout(() => {
        if (!settled && lastId === stalledAt && lastId < end) {
          console.log(`  span ${start}-${end}: idle at event ${lastId}, resuming…`);
          subscribeFrom(lastId);
        }
      }, IDLE_MS);
    }, IDLE_MS);
  });
};

await Promise.all(spans.map(downloadSpan));

console.log('Replaying downloaded DUST ranges in ledger order...');
for (const span of spans) {
  const rawEvents = await readFile(span.path);
  const replayed = localState.replayRawEvents(dustSecretKey, rawEvents);
  localState = replayed.state;
  console.log(`Replayed through DUST event ${span.end}`);
}

snapshot.state = Buffer.from(localState.serialize()).toString('hex');
snapshot.offset = String(tip);
const temporaryPath = `${snapshotPath}.tmp`;
await writeFile(temporaryPath, JSON.stringify(snapshot), { mode: 0o600 });
await rename(temporaryPath, snapshotPath);
console.log(`Saved DUST checkpoint at event ${tip}: ${snapshotPath}`);
