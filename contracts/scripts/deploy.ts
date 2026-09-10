import * as RT from '@midnight-ntwrk/compact-runtime';
import {
  Contract,
  ledger,
  pureCircuits,
} from '../src/managed/exposure-proof/contract/index.js';
import { createWitnesses, createVantagePrivateState } from '../src/witnesses.js';

const COIN_PUBLIC_KEY = '0'.repeat(64);

export async function deployVantageContract() {
  console.log('🚀 Deploying Vantage Contract on Midnight Network...');
  console.log(`📦 Compact Runtime Version: 0.16.0`);
  console.log(`⚡ Compiler Version: 0.31.1`);

  const genesisBorrower = new Uint8Array(32);
  const genesisPrivateState = createVantagePrivateState(genesisBorrower, []);
  const witnesses = createWitnesses();
  const contract = new Contract(witnesses);

  const ctorCtx = RT.createConstructorContext(genesisPrivateState, COIN_PUBLIC_KEY);
  const ctorResult = contract.initialState(ctorCtx);

  const contractAddress = RT.sampleContractAddress();
  const genesisLedger = ledger(ctorResult.currentContractState.data);

  const genesisRoot = pureCircuits.get_genesis_root();
  const genesisRootHex = '0x' + Array.from(genesisRoot).map((b) => b.toString(16).padStart(2, '0')).join('');

  console.log('\n✅ Vantage Contract Successfully Initialized!');
  console.log(`--------------------------------------------------`);
  console.log(`📍 Contract Address:       ${contractAddress}`);
  console.log(`🌲 Genesis Portfolio Root: ${genesisRootHex}`);
  console.log(`🔒 Initial Commitments:   ${genesisLedger.loan_commitments.size()} (Empty Set)`);
  console.log(`🛡️ Initial Nullifiers:    ${genesisLedger.nullifiers.size()} (Empty Set)`);
  console.log(`👥 Borrower Portfolios:   ${genesisLedger.borrower_portfolios.size()} (Empty Map)`);
  console.log(`--------------------------------------------------\n`);

  return {
    contractAddress,
    genesisRootHex,
    contractState: ctorResult.currentContractState,
  };
}

deployVantageContract().catch((err) => {
  console.error('❌ Deployment error:', err);
  process.exit(1);
});
