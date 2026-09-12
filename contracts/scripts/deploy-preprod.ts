/**
 * Vantage — Preprod deployment (real network), per midnight-preprod-deploy skill.
 * Faithful port of the reference deploy-current.ts adapted to exposure-proof:
 *   - Dust wallet is RESTORED from dust-snapshot.json (run `npm run dust-parallel`
 *     first) — the shielded wallet is never started, so there is no multi-hour
 *     merkle replay.
 *   - Submission waits only for `Submitted`: Preprod closes the long-lived RPC
 *     finalization watcher with a normal closure.
 *   - A submission is not "deployed" until the Preprod indexer (API v4) returns
 *     the contract action — CLI output alone does not count.
 *   - SEED arrives only via the ephemeral env var; only public deployment facts
 *     are saved to deployment.preprod.json.
 *
 * Usage:  SEED=<64-hex> npm run deploy:preprod
 * Prereq: proof server on :6300 + `SEED=<64-hex> npm run dust-parallel` once.
 */
import { Buffer } from 'node:buffer';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { WebSocket } from 'ws';
import { Agent, setGlobalDispatcher } from 'undici';
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
  ShieldedCoinPublicKey,
  ShieldedEncryptionPublicKey,
} from '@midnightntwrk/wallet-sdk';
import { PublicKeys } from '@midnightntwrk/wallet-sdk/shielded/v1';
import { makeDefaultSubmissionService } from '@midnightntwrk/wallet-sdk-capabilities/submission';
import * as ledger from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { setNetworkId, getNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import * as ExposureProof from '../src/managed/exposure-proof/contract/index.js';
import { createWitnesses, createVantagePrivateState } from '../src/witnesses.js';

// @ts-expect-error The Node ws implementation supplies the runtime WebSocket API.
globalThis.WebSocket = WebSocket;

// The local proof server can take >5 min per circuit proof; undici's default
// 300s headers/body timeouts would abort the request mid-proof.
setGlobalDispatcher(new Agent({ headersTimeout: 0, bodyTimeout: 0 }));

const seed = process.env.SEED;
if (!seed || !/^[0-9a-fA-F]{64}$/.test(seed)) {
  throw new Error('SEED must be a 64-character hex string');
}

const indexer = 'https://indexer.preprod.midnight.network/api/v4/graphql';
const indexerWs = 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws';
const nodeUrl = 'https://rpc.preprod.midnight.network';
const proofServer = 'http://127.0.0.1:6300';
const zkConfigPath = fileURLToPath(
  new URL('../src/managed/exposure-proof', import.meta.url),
);
const snapshotPath = fileURLToPath(new URL('../dust-snapshot.json', import.meta.url));
const deploymentPath = fileURLToPath(new URL('../deployment.preprod.json', import.meta.url));

const snapshot = await readFile(snapshotPath, 'utf8').catch(() => undefined);
if (!snapshot) {
  throw new Error(
    'No dust-snapshot.json — run `SEED=<64-hex> npm run dust-parallel` first to synchronize tDUST.',
  );
}

setNetworkId('preprod');

const hdWallet = HDWallet.fromSeed(Buffer.from(seed, 'hex'));
if (hdWallet.type !== 'seedOk') throw new Error('Failed to restore HD wallet');
const derivation = hdWallet.hdWallet
  .selectAccount(0)
  .selectRoles([Roles.Zswap, Roles.NightExternal, Roles.Dust])
  .deriveKeysAt(0);
if (derivation.type !== 'keysDerived') throw new Error('Failed to derive wallet keys');
hdWallet.hdWallet.clear();

const shieldedSecretKeys = ledger.ZswapSecretKeys.fromSeed(derivation.keys[Roles.Zswap]);
const dustSecretKey = ledger.DustSecretKey.fromSeed(derivation.keys[Roles.Dust]);
const unshieldedKeystore = createKeystore(derivation.keys[Roles.NightExternal], getNetworkId());
const unshieldedAddress = String(unshieldedKeystore.getBech32Address());

const sharedConnection = {
  networkId: getNetworkId(),
  indexerClientConnection: {
    indexerHttpUrl: indexer,
    indexerWsUrl: indexerWs,
    bufferSize: 20_000,
    resumeThreshold: 500,
  },
};
const shieldedConfig = {
  ...sharedConnection,
  provingServerUrl: new URL(proofServer),
  relayURL: new URL(nodeUrl.replace(/^http/, 'ws')),
};
const unshieldedConfig = {
  ...sharedConnection,
  txHistoryStorage: new NoOpTransactionHistoryStorage(),
};
const dustConfig = {
  ...shieldedConfig,
  batchUpdates: { size: 1_000, timeout: 10, spacing: 1 },
  costParameters: {
    additionalFeeOverhead: 300_000_000_000_000n,
    feeBlocksMargin: 5,
  },
};
const rpcSubmission = makeDefaultSubmissionService({ relayURL: shieldedConfig.relayURL });

const wallet = await WalletFacade.init({
  configuration: {
    ...shieldedConfig,
    ...unshieldedConfig,
    ...dustConfig,
  },
  shielded: (cfg) => ShieldedWallet(cfg).startWithSecretKeys(shieldedSecretKeys),
  unshielded: (cfg) =>
    UnshieldedWallet(cfg).startWithPublicKey(PublicKey.fromKeyStore(unshieldedKeystore)),
  dust: (cfg) => DustWallet(cfg).restore(snapshot),
  // Preprod's RPC currently closes long-lived watch subscriptions normally
  // before the SDK's "Finalized" waiter resolves. Submission to the node is
  // sufficient here; deploy visibility is verified through the indexer.
  submissionService: () => ({
    submitTransaction: ((transaction: ledger.FinalizedTransaction) =>
      rpcSubmission.submitTransaction(transaction, 'Submitted')) as any,
    close: () => rpcSubmission.close(),
  }),
});

const signTransactionIntents = (
  tx: { intents?: Map<number, any> },
  proofMarker: 'proof' | 'pre-proof',
): void => {
  if (!tx.intents) return;
  for (const segment of tx.intents.keys()) {
    const intent = tx.intents.get(segment);
    if (!intent) continue;
    const cloned = ledger.Intent.deserialize(
      'signature',
      proofMarker,
      'pre-binding',
      intent.serialize(),
    );
    const signature = unshieldedKeystore.signData(cloned.signatureData(segment));
    if (cloned.fallibleUnshieldedOffer) {
      cloned.fallibleUnshieldedOffer = cloned.fallibleUnshieldedOffer.addSignatures(
        cloned.fallibleUnshieldedOffer.inputs.map(
          (_input: unknown, index: number) =>
            cloned.fallibleUnshieldedOffer!.signatures.at(index) ?? signature,
        ),
      );
    }
    if (cloned.guaranteedUnshieldedOffer) {
      cloned.guaranteedUnshieldedOffer = cloned.guaranteedUnshieldedOffer.addSignatures(
        cloned.guaranteedUnshieldedOffer.inputs.map(
          (_input: unknown, index: number) =>
            cloned.guaranteedUnshieldedOffer!.signatures.at(index) ?? signature,
        ),
      );
    }
    tx.intents.set(segment, cloned);
  }
};

/** Independent verification through the Preprod indexer (skill requirement). */
const indexerVerify = async (contractAddress: string, txIds: (string | null | undefined)[]) => {
  const gql = async (query: string, variables: Record<string, unknown>) => {
    const res = await fetch(indexer, {
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
  console.log(
    `  Indexer contractAction(${contractAddress.slice(0, 16)}…): ${found ? 'FOUND' : 'not found yet'}`,
  );
  if (found) {
    console.log(
      `    tx hash: ${deploy.transaction?.hash ?? 'n/a'}  block: ${deploy.transaction?.block?.height ?? 'n/a'}`,
    );
  }

  for (const id of txIds.filter(Boolean) as string[]) {
    try {
      const r = await gql(
        `query($id: HexEncoded!) { transactions(offset: { identifier: $id }) { hash identifier block { height } status } }`,
        { id },
      );
      const tx = r?.data?.transactions?.[0];
      console.log(
        `    tx ${id.slice(0, 18)}… → ${tx ? `${tx.status ?? 'seen'} @ block ${tx.block?.height ?? '?'}` : 'not found yet'}`,
      );
    } catch (e: any) {
      console.log(`    tx ${id.slice(0, 18)}… → lookup failed (${e?.message})`);
    }
  }
  return { found, txHash: deploy?.transaction?.hash ?? null, block: deploy?.transaction?.block?.height ?? null };
};

try {
  console.log('────────────────────────────────────────────────────────');
  console.log('  Vantage :: Preprod deploy (skill: midnight-preprod-deploy)');
  console.log('────────────────────────────────────────────────────────');
  console.log(`  Unshielded address: ${unshieldedAddress}`);
  console.log('  Starting wallet from synchronized DUST checkpoint (shielded skipped)…');
  await wallet.unshielded.start();
  await (wallet as unknown as {
    pendingTransactionsService: { start: () => Promise<void> };
  }).pendingTransactionsService.start();
  await wallet.unshielded.waitForSyncedState(0n);
  await wallet.dust.start(dustSecretKey);
  const dustState = await wallet.dust.waitForSyncedState(0n);
  await writeFile(snapshotPath, await wallet.dust.serializeState(), { mode: 0o600 });
  const dustBalance = dustState.balance(new Date());
  console.log(`  Spendable tDUST raw balance: ${dustBalance}`);
  if (dustBalance <= 0n) {
    throw new Error('The synchronized wallet has no spendable tDUST');
  }

  const publicKeys = PublicKeys.fromSecretKeys(shieldedSecretKeys);
  const coinKey = new ShieldedCoinPublicKey(
    Buffer.from(publicKeys.coinPublicKey as unknown as string, 'hex'),
  );
  const encryptionKey = new ShieldedEncryptionPublicKey(
    Buffer.from(publicKeys.encryptionPublicKey as unknown as string, 'hex'),
  );
  const emittedTxIds: string[] = [];
  const walletProvider = {
    getCoinPublicKey: () => coinKey.toHexString(),
    getEncryptionPublicKey: () => encryptionKey.toHexString(),
    balanceTx: async (transaction: any, ttl?: Date) => {
      const recipe = await wallet.balanceUnboundTransaction(
        transaction,
        { shieldedSecretKeys, dustSecretKey },
        {
          ttl: ttl ?? new Date(Date.now() + 30 * 60 * 1000),
          tokenKindsToBalance: ['unshielded', 'dust'],
        },
      );
      signTransactionIntents(recipe.baseTransaction, 'proof');
      if (recipe.balancingTransaction) {
        signTransactionIntents(recipe.balancingTransaction, 'pre-proof');
      }
      return wallet.finalizeRecipe(recipe);
    },
    submitTx: async (transaction: any) => {
      const identifiers = transaction.identifiers().map(String);
      const deployAddresses = [...(transaction.intents?.values() ?? [])]
        .flatMap((intent: any) => intent.actions ?? [])
        .filter((action: unknown) => action instanceof ledger.ContractDeploy)
        .map((action: ledger.ContractDeploy) => String(action.address));
      emittedTxIds.push(...identifiers);
      console.log(`  Finalized transaction identifier(s): ${identifiers.join(', ')}`);
      console.log(`  Deployment address in transaction: ${deployAddresses.join(', ')}`);
      return wallet.submitTransaction(transaction);
    },
  };

  const compiledContract = CompiledContract.make('exposure-proof', ExposureProof.Contract).pipe(
    CompiledContract.withWitnesses(createWitnesses() as any),
    CompiledContract.withCompiledFileAssets(zkConfigPath),
  );
  const zkConfigProvider = new NodeZkConfigProvider(zkConfigPath);
  const providers = {
    privateStateProvider: levelPrivateStateProvider({
      midnightDbName: './vantage-preprod-private-state',
      privateStateStoreName: 'vantage-private-state',
      signingKeyStoreName: 'vantage-signing-keys',
      accountId: unshieldedAddress,
      privateStoragePasswordProvider: () =>
        process.env.PRIVATE_STATE_PASSWORD ?? 'Vantage-Preprod-2026',
    }),
    publicDataProvider: indexerPublicDataProvider(indexer, indexerWs),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(proofServer, zkConfigProvider),
    walletProvider,
    midnightProvider: walletProvider,
  };

  const initialPrivateState = createVantagePrivateState(new Uint8Array(32), []);

  console.log('  Proving and submitting exposure-proof deployment…');
  const contract = await deployContract(providers as any, {
    compiledContract: compiledContract as any,
    privateStateId: 'vantagePrivateState',
    initialPrivateState,
    args: [],
  } as any);
  const contractAddress = contract.deployTxData.public.contractAddress;
  console.log(`  Deterministic contract address: ${contractAddress}`);

  // Skill: a submission is incomplete until the Preprod indexer returns it.
  let found = false;
  let txHash: string | null = null;
  let block: number | null = null;
  for (let attempt = 0; attempt < 12 && !found; attempt++) {
    if (attempt > 0) {
      console.log(`  …waiting for indexer (attempt ${attempt + 1}/12)`);
      await new Promise((r) => setTimeout(r, 15_000));
    }
    const v = await indexerVerify(contractAddress, emittedTxIds).catch(() => null);
    found = Boolean(v?.found);
    txHash = v?.txHash ?? null;
    block = v?.block ?? null;
  }

  const record = {
    network: 'preprod',
    contractAddress,
    deployTxHash: txHash,
    deployTxIdentifiers: emittedTxIds,
    blockHeight: block,
    deployerUnshieldedAddress: unshieldedAddress,
    indexer,
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
  await writeFile(deploymentPath, JSON.stringify(record, null, 2) + '\n');

  if (!found) {
    console.log('\n  ⚠ Deploy tx submitted but not yet visible on the indexer.');
    console.log('     Re-check later: contractAction query for the address above.');
    process.exit(3);
  }

  console.log('\n────────────────────────────────────────────────────────');
  console.log('  ✅ DEPLOYED + INDEXER-VERIFIED ON PREPROD');
  console.log(`  Contract: ${contractAddress}`);
  if (txHash) console.log(`  Tx hash:  ${txHash}`);
  if (block) console.log(`  Block:    ${block}`);
  console.log('  Saved → contracts/deployment.preprod.json');
  console.log('────────────────────────────────────────────────────────\n');
} finally {
  await wallet.stop();
}
