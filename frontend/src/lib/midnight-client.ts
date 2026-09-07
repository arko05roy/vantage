import * as RT from '@midnight-ntwrk/compact-runtime';
import {
  Contract,
  ledger,
  pureCircuits,
  type Witnesses,
  type Ledger,
} from './managed/contract/index.js';
import { LoanStatus, type PrivateLoanRecord, type DualLedgerState, type ZkProofResult } from './types.js';

// Utility: convert hex string to Uint8Array (32 bytes)
export const fromHex = (hex: string): Uint8Array => {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(32);
  for (let i = 0; i < Math.min(clean.length / 2, 32); i++) {
    bytes[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
};

// Utility: convert Uint8Array to hex string
export const toHex = (bytes: Uint8Array): string => {
  return '0x' + Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
};

// Utility: encode readable text into 32-byte hash/identifier
export const encodeIdentifier = (text: string): Uint8Array => {
  const bytes = new Uint8Array(32);
  const enc = new TextEncoder().encode(text);
  bytes.set(enc.subarray(0, 32));
  return bytes;
};

// Utility: generate a secure random 32-byte hex nonce
export const generateRandomNonce = (): string => {
  const bytes = new Uint8Array(32);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 32; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return toHex(bytes);
};

const COIN_PUBLIC_KEY = '0'.repeat(64);
const CONTRACT_ADDRESS = RT.sampleContractAddress();

export interface OffChainPrivateState {
  readonly borrowerId: Uint8Array;
  readonly loans: {
    lender_id: Uint8Array;
    amount: bigint;
    nonce: Uint8Array;
    status: number;
  }[];
}

export const createWitnesses = (): Witnesses<OffChainPrivateState> => ({
  get_borrower_id: ({ privateState }) => [privateState, privateState.borrowerId],
  get_loan_records: ({ privateState }) => [privateState, privateState.loans],
});

export class MidnightVantageClient {
  private witnesses = createWitnesses();
  private contract = new Contract(this.witnesses);

  // Pure functions
  getGenesisRoot(): string {
    return toHex(pureCircuits.get_genesis_root());
  }

  computeCommitment(
    borrowerIdHex: string,
    lenderIdHex: string,
    amount: bigint,
    nonceHex: string
  ): string {
    const bId = fromHex(borrowerIdHex);
    const lId = fromHex(lenderIdHex);
    const nce = fromHex(nonceHex);
    const commitment = pureCircuits.compute_loan_commitment(bId, lId, amount, nce);
    return toHex(commitment);
  }

  computeNullifier(commitmentHex: string, nonceHex: string): string {
    const comm = fromHex(commitmentHex);
    const nce = fromHex(nonceHex);
    return toHex(pureCircuits.compute_nullifier(comm, nce));
  }

  updatePortfolioRoot(currentRootHex: string, commitmentHex: string): string {
    const root = fromHex(currentRootHex);
    const comm = fromHex(commitmentHex);
    return toHex(pureCircuits.update_portfolio_root(root, comm));
  }

  // Create initial empty simulation context
  createGenesisContext(privateState: OffChainPrivateState) {
    const ctor = this.contract.initialState(
      RT.createConstructorContext(privateState, COIN_PUBLIC_KEY)
    );
    return RT.createCircuitContext(
      CONTRACT_ADDRESS,
      COIN_PUBLIC_KEY,
      ctor.currentContractState,
      privateState
    );
  }

  // Register loan circuit invocation
  registerLoan(
    context: any,
    borrowerIdHex: string,
    lenderIdHex: string,
    amount: bigint,
    nonceHex: string
  ) {
    const bId = fromHex(borrowerIdHex);
    const lId = fromHex(lenderIdHex);
    const nce = fromHex(nonceHex);

    const result = this.contract.impureCircuits.register_loan(
      context,
      bId,
      lId,
      amount,
      nce
    );
    return result;
  }

  // Prove exposure within limit circuit invocation
  proveExposure(
    context: any,
    maxLenderCount: number,
    maxTotalExposure: number
  ) {
    const result = this.contract.impureCircuits.prove_exposure_within_limit(
      context,
      BigInt(maxLenderCount),
      BigInt(maxTotalExposure)
    );
    return result;
  }

  // Close loan circuit invocation
  closeLoan(context: any, commitmentHex: string, nonceHex: string) {
    const comm = fromHex(commitmentHex);
    const nce = fromHex(nonceHex);
    return this.contract.impureCircuits.close_loan(context, comm, nce);
  }

  // Read public ledger from query context state
  getLedger(state: any): Ledger {
    return ledger(state);
  }
}

export const midnightClient = new MidnightVantageClient();
