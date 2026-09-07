import { describe, it, expect } from 'vitest';
import * as RT from '@midnight-ntwrk/compact-runtime';
import {
  Contract,
  ledger,
  pureCircuits,
} from '../src/managed/exposure-proof/contract/index.js';
import {
  createVantagePrivateState,
  createWitnesses,
  LoanStatus,
  PrivateLoanRecord,
  VantagePrivateState,
} from '../src/witnesses.js';

// Helper utilities for generating test keys and identifiers
const makeId = (prefix: string, id: number): Uint8Array => {
  const bytes = new Uint8Array(32);
  const enc = new TextEncoder().encode(`${prefix}_${id}`);
  bytes.set(enc.subarray(0, 32));
  return bytes;
};

const COIN_PUBLIC_KEY = '0'.repeat(64);
const CONTRACT_ADDRESS = RT.sampleContractAddress();

describe('Vantage Compact Smart Contract & Zero-Knowledge Circuits', () => {
  const witnesses = createWitnesses();

  // Test setup helper
  const setupTestContext = (privateState: VantagePrivateState) => {
    const contract = new Contract(witnesses);
    const ctor = contract.initialState(
      RT.createConstructorContext(privateState, COIN_PUBLIC_KEY)
    );
    const ctx = RT.createCircuitContext(
      CONTRACT_ADDRESS,
      COIN_PUBLIC_KEY,
      ctor.currentContractState,
      privateState
    );
    return { contract, ctx };
  };

  describe('1. Pure Circuits & Cryptographic Primitives', () => {
    it('computes deterministic genesis root', () => {
      const root1 = pureCircuits.get_genesis_root();
      const root2 = pureCircuits.get_genesis_root();
      expect(root1).toBeInstanceOf(Uint8Array);
      expect(root1.length).toBe(32);
      expect(root1).toEqual(root2);
    });

    it('computes deterministic 32-byte loan commitments', () => {
      const borrower = makeId('borrower', 1);
      const lender = makeId('lender_a', 1);
      const amount = 30000n;
      const nonce = makeId('nonce', 101);

      const commitment1 = pureCircuits.compute_loan_commitment(
        borrower,
        lender,
        amount,
        nonce
      );
      const commitment2 = pureCircuits.compute_loan_commitment(
        borrower,
        lender,
        amount,
        nonce
      );

      expect(commitment1).toBeInstanceOf(Uint8Array);
      expect(commitment1.length).toBe(32);
      expect(commitment1).toEqual(commitment2);
    });

    it('computes distinct commitments for different nonces', () => {
      const borrower = makeId('borrower', 1);
      const lender = makeId('lender_a', 1);
      const amount = 30000n;
      const nonce1 = makeId('nonce', 101);
      const nonce2 = makeId('nonce', 102);

      const comm1 = pureCircuits.compute_loan_commitment(borrower, lender, amount, nonce1);
      const comm2 = pureCircuits.compute_loan_commitment(borrower, lender, amount, nonce2);

      expect(comm1).not.toEqual(comm2);
    });

    it('computes deterministic nullifiers for loan closure', () => {
      const commitment = makeId('comm', 1);
      const nonce = makeId('nonce', 1);

      const nul1 = pureCircuits.compute_nullifier(commitment, nonce);
      const nul2 = pureCircuits.compute_nullifier(commitment, nonce);

      expect(nul1).toBeInstanceOf(Uint8Array);
      expect(nul1.length).toBe(32);
      expect(nul1).toEqual(nul2);
    });
  });

  describe('2. Loan Registration Circuit (Issuer Flow)', () => {
    it('successfully registers a loan commitment & updates borrower portfolio accumulator', () => {
      const borrower = makeId('borrower', 1);
      const privateState = createVantagePrivateState(borrower, []);
      const { contract, ctx } = setupTestContext(privateState);

      const lender = makeId('lender_a', 1);
      const amount = 35000n;
      const nonce = makeId('nonce', 1);

      const regCall = contract.impureCircuits.register_loan(
        ctx,
        borrower,
        lender,
        amount,
        nonce
      );

      const onChainLedger = ledger(regCall.context.currentQueryContext.state);
      const expectedCommitment = pureCircuits.compute_loan_commitment(
        borrower,
        lender,
        amount,
        nonce
      );

      expect(onChainLedger.loan_commitments.member(expectedCommitment)).toBe(true);
      expect(onChainLedger.loan_commitments.size()).toBe(1n);

      // Verify per-borrower portfolio accumulator updated on-chain
      expect(onChainLedger.borrower_portfolios.member(borrower)).toBe(true);
      const expectedRoot = pureCircuits.update_portfolio_root(
        pureCircuits.get_genesis_root(),
        expectedCommitment
      );
      expect(onChainLedger.borrower_portfolios.lookup(borrower)).toEqual(expectedRoot);
    });

    it('rejects registering duplicate loan commitments', () => {
      const borrower = makeId('borrower', 1);
      const privateState = createVantagePrivateState(borrower, []);
      const { contract, ctx } = setupTestContext(privateState);

      const lender = makeId('lender_a', 1);
      const amount = 35000n;
      const nonce = makeId('nonce', 1);

      const firstCall = contract.impureCircuits.register_loan(
        ctx,
        borrower,
        lender,
        amount,
        nonce
      );

      expect(() =>
        contract.impureCircuits.register_loan(
          firstCall.context,
          borrower,
          lender,
          amount,
          nonce
        )
      ).toThrow('Loan commitment already registered');
    });

    it('rejects loan registration with zero or negative amount', () => {
      const borrower = makeId('borrower', 1);
      const privateState = createVantagePrivateState(borrower, []);
      const { contract, ctx } = setupTestContext(privateState);

      const lender = makeId('lender_a', 1);
      const nonce = makeId('nonce', 1);

      expect(() =>
        contract.impureCircuits.register_loan(ctx, borrower, lender, 0n, nonce)
      ).toThrow('Loan amount must be greater than zero');
    });
  });

  describe('3. Exposure Verification Circuit (Borrower Flow & Anti-Omission Gate)', () => {
    it('passes verification for zero-loan borrowers with an empty witness vector', () => {
      const newBorrower = makeId('new_borrower', 10);
      // Brand new borrower with no loans registered on-chain
      const privateState = createVantagePrivateState(newBorrower, []);
      const { contract, ctx } = setupTestContext(privateState);

      // Zero active loans trivially satisfy <= 2 lenders and <= ₹1,00,000
      const proveCall = contract.impureCircuits.prove_exposure_within_limit(
        ctx,
        2n,
        100000n
      );

      expect(proveCall.result).toEqual([]);
      expect(proveCall.proofData.publicTranscript.length).toBeGreaterThan(0);
    });

    it('rejects zero-loan borrower who tries to supply an uncommitted loan in witness', () => {
      const newBorrower = makeId('new_borrower', 11);
      const fakeLoan: PrivateLoanRecord = {
        lender_id: makeId('lender_x', 1),
        amount: 10000n,
        nonce: makeId('nonce_fake', 1),
        status: LoanStatus.ACTIVE,
      };

      const privateState = createVantagePrivateState(newBorrower, [fakeLoan]);
      const { contract, ctx } = setupTestContext(privateState);

      // Borrower has 0 on-chain loans but supplied a non-empty witness
      expect(() =>
        contract.impureCircuits.prove_exposure_within_limit(ctx, 2n, 100000n)
      ).toThrow('Borrower has no on-chain loans but non-empty witness was supplied');
    });

    it('passes verification when borrower is strictly within limits', () => {
      const borrower = makeId('borrower', 1);
      const lenderA = makeId('lender_a', 1);
      const amountA = 30000n;
      const nonceA = makeId('nonce', 1);

      const loan1: PrivateLoanRecord = {
        lender_id: lenderA,
        amount: amountA,
        nonce: nonceA,
        status: LoanStatus.ACTIVE,
      };

      const privateState = createVantagePrivateState(borrower, [loan1]);
      const { contract, ctx } = setupTestContext(privateState);

      // Register loan on ledger first
      const afterReg = contract.impureCircuits.register_loan(
        ctx,
        borrower,
        lenderA,
        amountA,
        nonceA
      );

      // Prove exposure within threshold: max 2 lenders, max ₹1,00,000
      const proveCall = contract.impureCircuits.prove_exposure_within_limit(
        afterReg.context,
        2n,
        100000n
      );

      expect(proveCall.result).toEqual([]);
    });

    it('passes boundary condition: exactly at threshold cap (2 lenders, ₹1,00,000)', () => {
      const borrower = makeId('borrower', 2);
      const lenderA = makeId('lender_a', 1);
      const lenderB = makeId('lender_b', 2);
      const amountA = 50000n;
      const amountB = 50000n;
      const nonceA = makeId('nonce', 201);
      const nonceB = makeId('nonce', 202);

      const loan1: PrivateLoanRecord = {
        lender_id: lenderA,
        amount: amountA,
        nonce: nonceA,
        status: LoanStatus.ACTIVE,
      };
      const loan2: PrivateLoanRecord = {
        lender_id: lenderB,
        amount: amountB,
        nonce: nonceB,
        status: LoanStatus.ACTIVE,
      };

      const privateState = createVantagePrivateState(borrower, [loan1, loan2]);
      const { contract, ctx } = setupTestContext(privateState);

      // Register both loans on-chain
      const reg1 = contract.impureCircuits.register_loan(ctx, borrower, lenderA, amountA, nonceA);
      const reg2 = contract.impureCircuits.register_loan(reg1.context, borrower, lenderB, amountB, nonceB);

      // Verify exact boundary: max 2 lenders, max ₹1,00,000
      const proveCall = contract.impureCircuits.prove_exposure_within_limit(
        reg2.context,
        2n,
        100000n
      );

      expect(proveCall.result).toEqual([]);
    });

    it('PREVENTS LOAN OMISSION: rejects proof if borrower omits a registered loan from witness', () => {
      const borrower = makeId('borrower', 100);
      const lenderA = makeId('lender_a', 1);
      const lenderB = makeId('lender_b', 2);
      const lenderC = makeId('lender_c', 3);

      const amountA = 30000n;
      const amountB = 40000n;
      const amountC = 50000n; // Total = 120,000 > 100,000 cap!

      const nonceA = makeId('nonce', 1001);
      const nonceB = makeId('nonce', 1002);
      const nonceC = makeId('nonce', 1003);

      const loanA: PrivateLoanRecord = { lender_id: lenderA, amount: amountA, nonce: nonceA, status: LoanStatus.ACTIVE };
      const loanB: PrivateLoanRecord = { lender_id: lenderB, amount: amountB, nonce: nonceB, status: LoanStatus.ACTIVE };
      const loanC: PrivateLoanRecord = { lender_id: lenderC, amount: amountC, nonce: nonceC, status: LoanStatus.ACTIVE };

      // Set up context with full 3-loan witness to register all on-chain
      const fullPrivateState = createVantagePrivateState(borrower, [loanA, loanB, loanC]);
      const { contract, ctx } = setupTestContext(fullPrivateState);

      // Issuer registers all 3 loans on-chain
      let currentCtx = contract.impureCircuits.register_loan(ctx, borrower, lenderA, amountA, nonceA).context;
      currentCtx = contract.impureCircuits.register_loan(currentCtx, borrower, lenderB, amountB, nonceB).context;
      currentCtx = contract.impureCircuits.register_loan(currentCtx, borrower, lenderC, amountC, nonceC).context;

      // Malicious attempt: borrower creates a pruned witness omitting Loan C
      // They claim they only have [Loan A, Loan B] (₹70k exposure, 2 lenders)
      const prunedOmissionState = createVantagePrivateState(borrower, [loanA, loanB]);
      const maliciousCtx = { ...currentCtx, currentPrivateState: prunedOmissionState };

      // Verification MUST fail because running_root != on_chain_portfolio_root
      expect(() =>
        contract.impureCircuits.prove_exposure_within_limit(maliciousCtx, 2n, 100000n)
      ).toThrow('Borrower witness omitted registered loans or does not match portfolio root');
    });

    it('fails verification when total exposure exceeds the amount limit', () => {
      const borrower = makeId('borrower', 3);
      const lenderA = makeId('lender_a', 1);
      const lenderB = makeId('lender_b', 2);
      const amountA = 60000n;
      const amountB = 50000n; // Total = 110,000 > 100,000
      const nonceA = makeId('nonce', 301);
      const nonceB = makeId('nonce', 302);

      const loan1: PrivateLoanRecord = { lender_id: lenderA, amount: amountA, nonce: nonceA, status: LoanStatus.ACTIVE };
      const loan2: PrivateLoanRecord = { lender_id: lenderB, amount: amountB, nonce: nonceB, status: LoanStatus.ACTIVE };

      const privateState = createVantagePrivateState(borrower, [loan1, loan2]);
      const { contract, ctx } = setupTestContext(privateState);

      const reg1 = contract.impureCircuits.register_loan(ctx, borrower, lenderA, amountA, nonceA);
      const reg2 = contract.impureCircuits.register_loan(reg1.context, borrower, lenderB, amountB, nonceB);

      // Threshold is ₹1,00,000
      expect(() =>
        contract.impureCircuits.prove_exposure_within_limit(reg2.context, 2n, 100000n)
      ).toThrow('Total credit exposure exceeds allowed regulatory cap');
    });

    it('fails verification when active lender count exceeds allowed cap', () => {
      const borrower = makeId('borrower', 4);
      const lenderA = makeId('lender_a', 1);
      const lenderB = makeId('lender_b', 2);
      const lenderC = makeId('lender_c', 3);
      const amount = 20000n; // Total = 60,000 <= 100,000, but 3 lenders > max 2
      const nonceA = makeId('nonce', 401);
      const nonceB = makeId('nonce', 402);
      const nonceC = makeId('nonce', 403);

      const loans: PrivateLoanRecord[] = [
        { lender_id: lenderA, amount, nonce: nonceA, status: LoanStatus.ACTIVE },
        { lender_id: lenderB, amount, nonce: nonceB, status: LoanStatus.ACTIVE },
        { lender_id: lenderC, amount, nonce: nonceC, status: LoanStatus.ACTIVE },
      ];

      const privateState = createVantagePrivateState(borrower, loans);
      const { contract, ctx } = setupTestContext(privateState);

      let currentCtx = ctx;
      for (let i = 0; i < loans.length; i++) {
        currentCtx = contract.impureCircuits.register_loan(
          currentCtx,
          borrower,
          loans[i].lender_id,
          loans[i].amount,
          loans[i].nonce
        ).context;
      }

      // Max allowed lenders is 2, but borrower has 3
      expect(() =>
        contract.impureCircuits.prove_exposure_within_limit(currentCtx, 2n, 100000n)
      ).toThrow('Active loan count exceeds allowed limit');
    });

    it('rejects falsified loan status: marking active loan as closed without on-chain nullifier', () => {
      const borrower = makeId('borrower', 50);
      const lenderA = makeId('lender_a', 1);
      const amountA = 25000n;
      const nonceA = makeId('nonce', 501);

      // Borrower registers loan as active on-chain
      const loanReal: PrivateLoanRecord = { lender_id: lenderA, amount: amountA, nonce: nonceA, status: LoanStatus.ACTIVE };
      const privateState = createVantagePrivateState(borrower, [loanReal]);
      const { contract, ctx } = setupTestContext(privateState);

      const reg = contract.impureCircuits.register_loan(ctx, borrower, lenderA, amountA, nonceA);

      // Malicious attempt: borrower sets loan status to CLOSED in their witness without loan being repaid
      const loanFalsified: PrivateLoanRecord = { lender_id: lenderA, amount: amountA, nonce: nonceA, status: LoanStatus.CLOSED };
      const falsifiedState = createVantagePrivateState(borrower, [loanFalsified]);
      const maliciousCtx = { ...reg.context, currentPrivateState: falsifiedState };

      expect(() =>
        contract.impureCircuits.prove_exposure_within_limit(maliciousCtx, 2n, 100000n)
      ).toThrow('Closed loan has no on-chain nullifier record');
    });
  });

  describe('4. Loan Closure & Nullifier Lifecycle', () => {
    it('successfully closes a loan and drops it from active exposure while maintaining portfolio integrity', () => {
      const borrower = makeId('borrower', 6);
      const lenderA = makeId('lender_a', 1);
      const lenderB = makeId('lender_b', 2);
      const lenderC = makeId('lender_c', 3);
      const amount = 25000n;
      const nonceA = makeId('nonce', 601);
      const nonceB = makeId('nonce', 602);
      const nonceC = makeId('nonce', 603);

      const commA = pureCircuits.compute_loan_commitment(borrower, lenderA, amount, nonceA);

      // Initial state: Borrower has 3 active loans
      const loanA: PrivateLoanRecord = { lender_id: lenderA, amount, nonce: nonceA, status: LoanStatus.ACTIVE };
      const loanB: PrivateLoanRecord = { lender_id: lenderB, amount, nonce: nonceB, status: LoanStatus.ACTIVE };
      const loanC: PrivateLoanRecord = { lender_id: lenderC, amount, nonce: nonceC, status: LoanStatus.ACTIVE };

      const privateState3 = createVantagePrivateState(borrower, [loanA, loanB, loanC]);
      const { contract, ctx } = setupTestContext(privateState3);

      // Register all 3 loans on ledger
      let currentCtx = contract.impureCircuits.register_loan(ctx, borrower, lenderA, amount, nonceA).context;
      currentCtx = contract.impureCircuits.register_loan(currentCtx, borrower, lenderB, amount, nonceB).context;
      currentCtx = contract.impureCircuits.register_loan(currentCtx, borrower, lenderC, amount, nonceC).context;

      // Close Loan A on-chain
      const closeCall = contract.impureCircuits.close_loan(currentCtx, commA, nonceA);
      currentCtx = closeCall.context;

      const currentLedger = ledger(currentCtx.currentQueryContext.state);
      const expectedNullifier = pureCircuits.compute_nullifier(commA, nonceA);
      expect(currentLedger.nullifiers.member(expectedNullifier)).toBe(true);

      // Borrower updates their private state: Loan A is marked CLOSED (kept in vector to preserve portfolio root)
      const loanAClosed: PrivateLoanRecord = { ...loanA, status: LoanStatus.CLOSED };
      const updatedPrivateState = createVantagePrivateState(borrower, [loanAClosed, loanB, loanC]);
      const updatedCtx = { ...currentCtx, currentPrivateState: updatedPrivateState };

      // Now borrower proves exposure against max 2 lenders: MUST PASS because loan A is legitimately closed!
      const proveAfterClose = contract.impureCircuits.prove_exposure_within_limit(
        updatedCtx,
        2n,
        100000n
      );

      expect(proveAfterClose.result).toEqual([]);
    });

    it('rejects double-closing the same loan', () => {
      const borrower = makeId('borrower', 7);
      const lenderA = makeId('lender_a', 1);
      const amount = 20000n;
      const nonceA = makeId('nonce', 701);
      const commA = pureCircuits.compute_loan_commitment(borrower, lenderA, amount, nonceA);

      const privateState = createVantagePrivateState(borrower, []);
      const { contract, ctx } = setupTestContext(privateState);

      const reg = contract.impureCircuits.register_loan(ctx, borrower, lenderA, amount, nonceA);
      const close1 = contract.impureCircuits.close_loan(reg.context, commA, nonceA);

      // Closing a second time must fail
      expect(() =>
        contract.impureCircuits.close_loan(close1.context, commA, nonceA)
      ).toThrow('Loan already closed/nullified');
    });
  });
});
