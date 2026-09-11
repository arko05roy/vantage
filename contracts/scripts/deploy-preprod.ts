/**
 * Vantage — Preprod deployment (real network), per midnight-preprod-deploy skill.
 *
 * Guardrails honored:
 *   - Wallet seed is accepted ONLY via the ephemeral `SEED` env var. It is never
 *     printed, persisted, or committed.
 *   - A submission is not "deployed" until the Preprod indexer (API v4) returns
 *     the contract action / transaction — CLI output alone does not count.
 *   - Only public deployment facts are saved to deployment.preprod.json.
 *
 * Usage:
 *   SEED=<64-hex> npm run deploy:preprod          # full flow (fund check → dust → deploy → verify)
 *   SEED=<64-hex> npm run deploy:preprod -- --status   # print balances only
 *
 * Generate a fresh seed locally:  openssl rand -hex 32
 * Fund the printed mn_addr_… unshielded address via the Preprod faucet
 * (https://midnight-tmnight-preprod.nethermind.dev/) — 1,000 tNIGHT suffices.
 *
 * Prereq: local proof server on :6300 (`docker compose up -d proof-server`).
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
  DustAddress,
  MidnightBech32m,
} from '@midnightntwrk/wallet-sdk';
import { ttlOneHour } from '@midnight-ntwrk/midnight-js-utils';
import * as ledger from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { unshieldedToken } from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { sampleSigningKey } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { setNetworkId, getNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import {
  createUnprovenDeployTx,
  submitDeployTx,
} from '@midnight-ntwrk/midnight-js-contracts';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { Contract } from '../src/managed/exposure-proof/contract/index.js';
import { createWitnesses, createVantagePrivateState } from '../src/witnesses.js';

const FAUCET_URL = 'https://midnight-tmnight-preprod.nethermind.dev/';
const FUNDING_WAIT_MS = 20 * 60 * 1000;
const STATUS_ONLY = process.argv.includes('--status');

const CONFIG = {
  indexerHttpUrl: 'https://indexer.preprod.midnight.network/api/v4/graphql',
  indexerWsUrl: 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
  node: 'https://rpc.preprod.midnight.network',
  proofServer: 'http://localhost:6300',
};

const currentDir = path.resolve(new URL(import.meta.url).pathname, '..');
const DEPLOYMENT_PATH = path.resolve(currentDir, '..', 'deployment.preprod.json');
const MANAGED_PATH = path.resolve(currentDir, '..', 'src', 'managed', 'exposure-proof');

type CircuitId = 'register_loan' | 'prove_exposure_within_limit' | 'close_loan';

const log = (msg: string) => console.log(msg);

const getSeed = (): string => {
  const seed = process.env.SEED?.trim();
  if (!seed || !/^[0-9a-fA-F]{64}$/.test(seed)) {
    throw new Error(
      'Missing wallet seed. Run with:  SEED=<64-hex> npm run deploy:preprod\n' +
        'Generate one with:  openssl rand -hex 32\n' +
        'The seed is never stored or printed.',
    );
  }
  return seed.toLowerCase();
};

const deriveKeys = (seed: string) => {
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

/** Verify a deploy on the public indexer — independent of CLI output. */
const indexerVerify = async (contractAddress: string, txIds: (string | null | undefined)[]) => {
  const gql = async (query: string, variables: Record<string, unknown>) => {
    const res = await fetch(CONFIG.indexerHttpUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });
    if (!res.ok) throw new Error(`indexer HTTP ${res.status}`);
    return res.json() as Promise<any>;
  };

  const action = await gql(
    `query($address: String!) { contractAction(address: $address, offset: null) { __typename ... on ContractDeploy { address transaction { hash block { height } } } } }`,
    { address: contractAddress },
  );
  const deploy = action?.data?.contractAction;
  const found = Boolean(deploy?.address);
  log(`\n  Indexer contractAction(${contractAddress.slice(0, 16)}…): ${found ? 'FOUND' : 'not found yet'}`);
  if (found) {
    log(`    tx hash: ${deploy.transaction?.hash ?? 'n/a'}  block: ${deploy.transaction?.block?.height ?? 'n/a'}`);
  }

  for (const id of txIds.filter(Boolean) as string[]) {
    try {
      const r = await gql(
        `query($id: HexEncoded!) { transactions(offset: { identifier: $id }) { hash identifier block { height } status } }`,
        { id },
      );
      const tx = r?.data?.transactions?.[0];
      log(`    tx ${id.slice(0, 18)}… → ${tx ? `${tx.status ?? 'seen'} @ block ${tx.block?.height ?? '?'}` : 'not found yet'}`);
    } catch (e: any) {
      log(`    tx ${id.slice(0, 18)}… → lookup failed (${e?.message})`);
    }
  }
  return found;
};

async function main() {
  setNetworkId('preprod');

  log('────────────────────────────────────────────────────────');
  log('  Vantage :: Preprod deploy (skill: midnight-preprod-deploy)');
  log('────────────────────────────────────────────────────────');

  const res = await fetch(`${CONFIG.proofServer}/health`).catch(() => null);
  if (!res?.ok) {
    throw new Error('Proof server not reachable on :6300 — run `docker compose up -d proof-server`.');
  }
  log('✔ Proof server healthy on :6300');

  const seed = getSeed();
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
  };

  log('  Building wallet facade (shielded + unshielded + dust)…');
  const wallet = await WalletFacade.init({
    configuration: { ...shieldedConfig, ...unshieldedConfig, ...dustConfig },
    shielded: (cfg) => ShieldedWallet(cfg).startWithSecretKeys(shieldedSecretKeys),
    unshielded: (cfg) =>
      UnshieldedWallet(cfg).startWithPublicKey(PublicKey.fromKeyStore(unshieldedKeystore)),
    dust: (cfg) =>
      DustWallet(cfg).startWithSecretKey(
        dustSecretKey,
        ledger.LedgerParameters.initialParameters().dust,
      ),
  });
  await wallet.start(shieldedSecretKeys, dustSecretKey);

  try {
    log(`\n  Unshielded address: ${unshieldedAddress}`);

    const currentNight = () =>
      Rx.firstValueFrom(
        wallet.state().pipe(
          Rx.map((s: any) => s.unshielded.balances[unshieldedToken().raw] ?? 0n),
        ),
      );
    const currentDust = async () =>
      (await Rx.firstValueFrom(wallet.state())).dust.balance(new Date());

    await new Promise((r) => setTimeout(r, 8_000)); // brief connect window
    let night = await currentNight();
    let dust = await currentDust();
    log(`  tNIGHT raw balance: ${night} (${formatNight(night)} tNIGHT)`);
    log(`  tDUST raw balance:  ${dust} (${formatDust(dust)} DUST)`);

    if (STATUS_ONLY) return;

    if (night === 0n) {
      log(`\n  Wallet unfunded. Fund it, then re-run:`);
      log(`    faucet → ${FAUCET_URL}`);
      log(`    paste unshielded address: ${unshieldedAddress}`);
      log('  Waiting up to 20 min for funds to land…');
      night = await Promise.race([
        Rx.firstValueFrom(
          wallet.state().pipe(
            Rx.throttleTime(10_000),
            Rx.map((s: any) => s.unshielded.balances[unshieldedToken().raw] ?? 0n),
            Rx.filter((b: bigint) => b > 0n),
          ),
        ),
        new Promise<bigint>((resolve) => setTimeout(() => resolve(0n), FUNDING_WAIT_MS)),
      ]);
      if (night === 0n) {
        throw new Error('No tNIGHT arrived within 20 minutes. Fund the address and re-run.');
      }
      log(`✔ tNIGHT received: ${formatNight(night)}`);
    }

    log('  Syncing wallet (first Preprod sync may take a few minutes)…');
    const synced = await wallet.waitForSyncedState();

    const unregistered = synced.unshielded.availableCoins.filter(
      (coin: any) => coin.meta?.registeredForDustGeneration !== true,
    );
    if (unregistered.length === 0) {
      log('✔ All NIGHT already registered for DUST generation');
    } else {
      const dustReceiver = MidnightBech32m.parse(
        String(DustAddress.encodePublicKey(getNetworkId(), synced.dust.publicKey)),
      ).decode(DustAddress, getNetworkId());
      const recipe = await wallet.registerNightUtxosForDustGeneration(
        unregistered,
        unshieldedKeystore.getPublicKey(),
        (payload) => unshieldedKeystore.signData(payload),
        dustReceiver,
      );
      const finalized = await wallet.finalizeRecipe(recipe);
      await wallet.submitTransaction(finalized);
      log(`✔ DUST registration tx submitted (${unregistered.length} UTXO(s))`);
    }

    dust = await Rx.firstValueFrom(
      wallet.state().pipe(
        Rx.throttleTime(5_000),
        Rx.filter((s: any) => s.isSynced),
        Rx.map((s: any) => s.dust.balance(new Date())),
        Rx.filter((b: bigint) => b > 0n),
      ),
    );
    log(`✔ Spendable tDUST: ${formatDust(dust)}`);

    // Providers — full set required by submitDeployTx
    const zkConfigProvider = new NodeZkConfigProvider<CircuitId>(MANAGED_PATH);
    const walletAndMidnightProvider = {
      getCoinPublicKey: () => shieldedSecretKeys.coinPublicKey,
      getEncryptionPublicKey: () => shieldedSecretKeys.encryptionPublicKey,
      balanceTx: async (tx: any, ttl: Date = ttlOneHour()) => {
        const recipe = await wallet.balanceUnboundTransaction(
          tx,
          { shieldedSecretKeys, dustSecretKey },
          { ttl },
        );
        return await wallet.finalizeRecipe(recipe);
      },
      submitTx: (tx: any) => wallet.submitTransaction(tx),
    };
    const providers = {
      privateStateProvider: levelPrivateStateProvider({
        privateStateStoreName: 'vantage-private-state',
        signingKeyStoreName: 'vantage-signing-keys',
        privateStoragePasswordProvider: () =>
          process.env.PRIVATE_STATE_PASSWORD ?? 'Vantage-Preprod-2026',
        accountId: unshieldedAddress,
      }),
      publicDataProvider: indexerPublicDataProvider(CONFIG.indexerHttpUrl, CONFIG.indexerWsUrl),
      zkConfigProvider,
      proofProvider: httpClientProofProvider(CONFIG.proofServer, zkConfigProvider),
      walletProvider: walletAndMidnightProvider,
      midnightProvider: walletAndMidnightProvider,
    };

    const compiled = CompiledContract.withCompiledFileAssets(
      CompiledContract.withWitnesses(
        CompiledContract.make('exposure-proof', Contract),
        createWitnesses() as any,
      ),
      MANAGED_PATH,
    );
    const genesisBorrower = new Uint8Array(32);
    const initialPrivateState = createVantagePrivateState(genesisBorrower, []);
    const signingKey = sampleSigningKey();

    // Deterministic address BEFORE submission (skill requirement)
    const unproven = await createUnprovenDeployTx(
      { zkConfigProvider, walletProvider: walletAndMidnightProvider } as any,
      { compiledContract: compiled as any, initialPrivateState, signingKey } as any,
    );
    const contractAddress = unproven.public.contractAddress;
    log(`\n  Deterministic contract address (pre-submit):\n    ${contractAddress}`);

    // Submit; tolerate Preprod's normal-closure finalization-watcher drop
    let finalized: any = null;
    let submitError: any = null;
    try {
      finalized = await submitDeployTx(providers as any, {
        compiledContract: compiled as any,
        initialPrivateState,
        signingKey,
        privateStateId: 'vantagePrivateState',
      } as any);
    } catch (e: any) {
      submitError = e;
      log(`  submit returned early (${e?.message ?? e}) — verifying via indexer instead`);
    }

    const txIds = [
      finalized?.public?.txId,
      (unproven.public as any)?.txId,
      (unproven.public as any)?.identifiers?.[0],
    ];

    // Independent indexer verification (skill: never trust CLI output alone)
    let found = false;
    for (let attempt = 0; attempt < 12 && !found; attempt++) {
      if (attempt > 0) {
        log(`  …waiting for indexer (attempt ${attempt + 1}/12)`);
        await new Promise((r) => setTimeout(r, 15_000));
      }
      found = await indexerVerify(contractAddress, txIds).catch(() => false);
    }

    if (!found) {
      log('\n  ⚠ Deploy tx submitted but not yet visible on the indexer.');
      log('     Re-check later: contractAction query for the address above.');
      if (submitError) log(`     (submit error was: ${submitError?.message})`);
      process.exit(3);
    }

    const record = {
      network: 'preprod',
      contractAddress,
      deployTxId: finalized?.public?.txId ?? null,
      deployerUnshieldedAddress: unshieldedAddress,
      indexer: CONFIG.indexerHttpUrl,
      deployedAt: new Date().toISOString(),
      toolchain: {
        compactCompiler: '0.31.1',
        compactRuntime: '0.16.0',
        midnightJs: '4.1.1',
        walletSdk: '1.2.0',
      },
      explorers: {
        midnightexplorer: `https://preprod.midnightexplorer.com/contract/${contractAddress}`,
        subscan: 'https://midnight-preprod.subscan.io/',
      },
    };
    fs.writeFileSync(DEPLOYMENT_PATH, JSON.stringify(record, null, 2) + '\n');

    log('\n────────────────────────────────────────────────────────');
    log('  ✅ DEPLOYED + INDEXER-VERIFIED ON PREPROD');
    log(`  Contract: ${contractAddress}`);
    if (record.deployTxId) log(`  Tx:       ${record.deployTxId}`);
    log(`  Saved → contracts/deployment.preprod.json`);
    log('────────────────────────────────────────────────────────\n');
  } finally {
    await wallet.stop();
  }
}

main().catch((err) => {
  console.error('\n❌ Preprod deploy failed:', err?.message ?? err);
  process.exit(1);
});
