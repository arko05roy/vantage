/**
 * Vantage — Preprod wallet status, per midnight-preprod-deploy skill (`npm run status`).
 * Restores the wallet from the ephemeral SEED env var and prints tNIGHT / tDUST
 * balances plus per-wallet sync progress. Never persists or prints the seed.
 *
 * Usage:  SEED=<64-hex> npm run status
 */
import { WebSocket } from 'ws';
(globalThis as any).WebSocket = WebSocket;

import { Buffer } from 'node:buffer';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as Rx from 'rxjs';
import {
  HDWallet,
  Roles,
  WalletFacade,
  ShieldedWallet,
  DustWallet,
  UnshieldedWallet,
  createKeystore,
  PublicKey,
  NoOpTransactionHistoryStorage,
} from '@midnightntwrk/wallet-sdk';
import * as ledger from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { unshieldedToken } from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { setNetworkId, getNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

const CONFIG = {
  indexerHttpUrl: 'https://indexer.preprod.midnight.network/api/v4/graphql',
  indexerWsUrl: 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
  node: 'https://rpc.preprod.midnight.network',
  proofServer: 'http://localhost:6300',
};

export const getSeed = (): string => {
  const seed = process.env.SEED?.trim();
  if (!seed || !/^[0-9a-fA-F]{64}$/.test(seed)) {
    throw new Error('Missing wallet seed. Run with:  SEED=<64-hex> npm run status');
  }
  return seed.toLowerCase();
};

export const deriveKeys = (seed: string) => {
  const hd = HDWallet.fromSeed(Buffer.from(seed, 'hex'));
  if (hd.type !== 'seedOk') throw new Error('Invalid seed');
  const result = hd.hdWallet
    .selectAccount(0)
    .selectRoles([Roles.Zswap, Roles.NightExternal, Roles.Dust])
    .deriveKeysAt(0);
  if (result.type !== 'keysDerived') throw new Error('Key derivation failed');
  hd.hdWallet.clear();
  return result.keys;
};

const formatNight = (raw: bigint) =>
  `${raw / 1_000_000n}.${(raw % 1_000_000n).toString().padStart(6, '0')}`;
const formatDust = (raw: bigint) =>
  `${raw / 1_000_000_000_000_000n}.${(raw % 1_000_000_000_000_000n).toString().padStart(15, '0')}`;

const fmtProgress = (p: any) =>
  `${p?.appliedIndex ?? '?'}/${p?.highestIndex ?? '?'} rel:${p?.highestRelevantIndex ?? '?'} ${p?.isStrictlyComplete?.() ? 'SYNCED' : 'syncing'}`;

const SNAPSHOT_PATH = path.resolve(
  new URL(import.meta.url).pathname,
  '..',
  '..',
  'dust-snapshot.json',
);

export async function buildWallet(seed: string) {
  setNetworkId('preprod');
  const keys = deriveKeys(seed);
  const shieldedSecretKeys = ledger.ZswapSecretKeys.fromSeed(keys[Roles.Zswap]);
  const dustSecretKey = ledger.DustSecretKey.fromSeed(keys[Roles.Dust]);
  const unshieldedKeystore = createKeystore(keys[Roles.NightExternal], getNetworkId());
  const unshieldedAddress = String(unshieldedKeystore.getBech32Address());

  const shieldedConfig = {
    networkId: getNetworkId(),
    indexerClientConnection: {
      indexerHttpUrl: CONFIG.indexerHttpUrl,
      indexerWsUrl: CONFIG.indexerWsUrl,
      bufferSize: 20_000,
      resumeThreshold: 500,
    },
    provingServerUrl: new URL(CONFIG.proofServer),
    relayURL: new URL(CONFIG.node.replace(/^http/, 'ws')),
  };
  const unshieldedConfig = {
    networkId: getNetworkId(),
    indexerClientConnection: {
      indexerHttpUrl: CONFIG.indexerHttpUrl,
      indexerWsUrl: CONFIG.indexerWsUrl,
    },
    txHistoryStorage: new NoOpTransactionHistoryStorage(),
  };
  const dustConfig = {
    ...shieldedConfig,
    costParameters: { additionalFeeOverhead: 300_000_000_000_000n, feeBlocksMargin: 5 },
    batchUpdates: { size: 1_000, timeout: 10, spacing: 1 },
  };

  const dustSnapshot = fs.existsSync(SNAPSHOT_PATH)
    ? fs.readFileSync(SNAPSHOT_PATH, 'utf8')
    : undefined;
  const wallet = await WalletFacade.init({
    configuration: { ...shieldedConfig, ...unshieldedConfig, ...dustConfig },
    shielded: (cfg) => ShieldedWallet(cfg).startWithSecretKeys(shieldedSecretKeys),
    unshielded: (cfg) =>
      UnshieldedWallet(cfg).startWithPublicKey(PublicKey.fromKeyStore(unshieldedKeystore)),
    dust: (cfg) =>
      dustSnapshot
        ? DustWallet(cfg).restore(dustSnapshot)
        : DustWallet(cfg).startWithSecretKey(
            dustSecretKey,
            ledger.LedgerParameters.initialParameters().dust,
          ),
  });
  await wallet.start(shieldedSecretKeys, dustSecretKey);
  return { wallet, shieldedSecretKeys, dustSecretKey, unshieldedKeystore, unshieldedAddress };
}

async function main() {
  const seed = getSeed();
  const { wallet, unshieldedAddress } = await buildWallet(seed);
  try {
    console.log(`Unshielded address: ${unshieldedAddress}`);
    const checkpointTimer = setInterval(() => {
      void (wallet as any).dust
        ?.serializeState?.()
        .then((snap: string) => fs.writeFileSync(SNAPSHOT_PATH, snap, { mode: 0o600 }))
        .catch(() => {});
    }, 30_000);
    const sub = wallet
      .state()
      .pipe(Rx.throttleTime(5_000))
      .subscribe((s: any) => {
        const night = s.unshielded.balances[unshieldedToken().raw] ?? 0n;
        const dust = s.dust.balance(new Date());
        console.log(
          `tNIGHT ${formatNight(night)} | tDUST ${formatDust(dust)} | ` +
            `shielded[${fmtProgress(s.shielded.progress)}] ` +
            `unshielded[${fmtProgress(s.unshielded.progress)}] ` +
            `dust[${fmtProgress(s.dust.progress)}]`,
        );
      });
    await new Promise((r) => setTimeout(r, Number(process.env.STATUS_SECONDS ?? 60) * 1000));
    sub.unsubscribe();
    clearInterval(checkpointTimer);
  } finally {
    await wallet.stop();
  }
}

const isMain = process.argv[1]?.endsWith('status.ts');
if (isMain) {
  main().catch((err) => {
    console.error('status failed:', err?.message ?? err);
    process.exit(1);
  });
}
