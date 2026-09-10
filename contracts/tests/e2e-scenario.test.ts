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
} from '../src/witnesses.js';

// Helper utilities
const makeId = (text: string): Uint8Array => {
  const bytes = new Uint8Array(32);
  const enc = new TextEncoder().encode(text);
  bytes.set(enc.subarray(0, 32));
  return bytes;
};

const toHex = (bytes: Uint8Array): string =>
  '0x' + Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');

const COIN_PUBLIC_KEY = '0'.repeat(64);
const CONTRACT_ADDRESS = RT.sampleContractAddress();

describe('Vantage End-to-End Multi-Party Lifecycle Integration Test', () => {
  const witnesses = createWitnesses();

  it('executes full 7-step Indian microfinance credit exposure lifecycle', () => {
    // -------------------------------------------------------------
    // Step 1: Genesis Deployment of Vantage Contract
    // -------------------------------------------------------------
    const borrowerId = makeId('priya_sharma_aadhaar_hash_9821');
    const emptyState = createVantagePrivateState(borrowerId, []);
    const contract = new Contract(witnesses);

    const ctorCtx = RT.createConstructorContext(emptyState, COIN_PUBLIC_KEY);
    const ctorResult = contract.initialState(ctorCtx);
    let currentCtx = RT.createCircuitContext(
      CONTRACT_ADDRESS,
      COIN_PUBLIC_KEY,
      ctorResult.currentContractState,
      emptyState
    );

    let onChainLedger = ledger(currentCtx.currentQueryContext.state);
    expect(onChainLedger.loan_commitments.isEmpty()).toBe(true);
    expect(onChainLedger.nullifiers.isEmpty()).toBe(true);
    expect(onChainLedger.borrower_portfolios.isEmpty()).toBe(true);

    // -------------------------------------------------------------
    // Step 2: Bandhan MFI disburses Loan 1 (₹40,000)
    // -------------------------------------------------------------
    const lender1 = makeId('mfi_bandhan_kolkata');
    const amount1 = 40000n;
    const nonce1 = makeId('entropy_salt_loan_1_bandhan');
    const comm1 = pureCircuits.compute_loan_commitment(borrowerId, lender1, amount1, nonce1);

    const reg1 = contract.impureCircuits.register_loan(
      currentCtx,
      borrowerId,
      lender1,
      amount1,
      nonce1
    );
    currentCtx = reg1.context;
    onChainLedger = ledger(currentCtx.currentQueryContext.state);

    expect(onChainLedger.loan_commitments.member(comm1)).toBe(true);
    expect(onChainLedger.borrower_portfolios.member(borrowerId)).toBe(true);
    const rootAfterLoan1 = pureCircuits.update_portfolio_root(
      pureCircuits.get_genesis_root(),
      comm1
    );
    expect(onChainLedger.borrower_portfolios.lookup(borrowerId)).toEqual(rootAfterLoan1);

    // -------------------------------------------------------------
    // Step 3: Fusion Microfinance disburses Loan 2 (₹50,000)
    // -------------------------------------------------------------
    const lender2 = makeId('mfi_fusion_delhi');
    const amount2 = 50000n;
    const nonce2 = makeId('entropy_salt_loan_2_fusion');
    const comm2 = pureCircuits.compute_loan_commitment(borrowerId, lender2, amount2, nonce2);

    const reg2 = contract.impureCircuits.register_loan(
      currentCtx,
      borrowerId,
      lender2,
      amount2,
      nonce2
    );
    currentCtx = reg2.context;
    onChainLedger = ledger(currentCtx.currentQueryContext.state);

    expect(onChainLedger.loan_commitments.member(comm2)).toBe(true);
    const rootAfterLoan2 = pureCircuits.update_portfolio_root(rootAfterLoan1, comm2);
    expect(onChainLedger.borrower_portfolios.lookup(borrowerId)).toEqual(rootAfterLoan2);

    // -------------------------------------------------------------
    // Step 4: Borrower Vault generates ZK Compliance Proof
    // Total exposure: ₹40k + ₹50k = ₹90,000 across 2 lenders
    // -------------------------------------------------------------
    const loanRecord1: PrivateLoanRecord = {
      lender_id: lender1,
      amount: amount1,
      nonce: nonce1,
      status: LoanStatus.ACTIVE,
    };
    const loanRecord2: PrivateLoanRecord = {
      lender_id: lender2,
      amount: amount2,
      nonce: nonce2,
      status: LoanStatus.ACTIVE,
    };

    const borrowerState2Loans = createVantagePrivateState(borrowerId, [loanRecord1, loanRecord2]);
    const borrowerCtx = {
      ...currentCtx,
      currentPrivateState: borrowerState2Loans,
    };

    // Prove <= 2 lenders and <= ₹1,00,000 cap
    const proveResult1 = contract.impureCircuits.prove_exposure_within_limit(
      borrowerCtx,
      2n,
      100000n
    );
    expect(proveResult1.result).toEqual([]);
    expect(proveResult1.proofData.publicTranscript.length).toBeGreaterThan(0);

    // -------------------------------------------------------------
    // Step 5: Verifier Audits Proof Package
    // Verifies consistency with on-chain accumulator root
    // -------------------------------------------------------------
    const onChainRoot = onChainLedger.borrower_portfolios.lookup(borrowerId);
    expect(onChainRoot).toEqual(rootAfterLoan2);
    // Verifier confirms zero PII revealed
    expect(toHex(comm1)).not.toContain('40000');
    expect(toHex(comm2)).not.toContain('50000');

    // -------------------------------------------------------------
    // Step 6: CreditAccess Grameen disburses Loan 3 (₹25,000)
    // Borrower now has 3 active loans (₹1,15,000 total) -> EXCEEDS LIMITS
    // -------------------------------------------------------------
    const lender3 = makeId('mfi_creditaccess_bangalore');
    const amount3 = 25000n;
    const nonce3 = makeId('entropy_salt_loan_3_creditaccess');
    const comm3 = pureCircuits.compute_loan_commitment(borrowerId, lender3, amount3, nonce3);

    const reg3 = contract.impureCircuits.register_loan(
      currentCtx,
      borrowerId,
      lender3,
      amount3,
      nonce3
    );
    currentCtx = reg3.context;
    onChainLedger = ledger(currentCtx.currentQueryContext.state);

    const loanRecord3: PrivateLoanRecord = {
      lender_id: lender3,
      amount: amount3,
      nonce: nonce3,
      status: LoanStatus.ACTIVE,
    };

    const borrowerState3Loans = createVantagePrivateState(borrowerId, [
      loanRecord1,
      loanRecord2,
      loanRecord3,
    ]);
    const borrowerCtx3Loans = {
      ...currentCtx,
      currentPrivateState: borrowerState3Loans,
    };

    // Over-lending check: 3 loans > 2 max lenders cap
    expect(() =>
      contract.impureCircuits.prove_exposure_within_limit(borrowerCtx3Loans, 2n, 100000n)
    ).toThrow('Active loan count exceeds allowed limit');

    // Anti-omission check: Borrower attempts to hide Loan 3 to cheat
    const maliciousOmissionState = createVantagePrivateState(borrowerId, [loanRecord1, loanRecord2]);
    const maliciousCtx = {
      ...currentCtx,
      currentPrivateState: maliciousOmissionState,
    };
    expect(() =>
      contract.impureCircuits.prove_exposure_within_limit(maliciousCtx, 2n, 100000n)
    ).toThrow('Borrower witness omitted registered loans or does not match portfolio root');

    // -------------------------------------------------------------
    // Step 7: Repayment & Nullifier Lifecycle Recovery
    // Borrower repays Loan 1 (Bandhan MFI). Bandhan publishes nullifier.
    // -------------------------------------------------------------
    const close1 = contract.impureCircuits.close_loan(currentCtx, comm1, nonce1);
    currentCtx = close1.context;
    onChainLedger = ledger(currentCtx.currentQueryContext.state);

    const expectedNullifier1 = pureCircuits.compute_nullifier(comm1, nonce1);
    expect(onChainLedger.nullifiers.member(expectedNullifier1)).toBe(true);

    // Borrower updates local vault: Loan 1 is CLOSED (retains record to match portfolio root)
    const loanRecord1Closed: PrivateLoanRecord = { ...loanRecord1, status: LoanStatus.CLOSED };
    const borrowerStateAfterRepayment = createVantagePrivateState(borrowerId, [
      loanRecord1Closed,
      loanRecord2,
      loanRecord3,
    ]);
    const borrowerCtxAfterRepayment = {
      ...currentCtx,
      currentPrivateState: borrowerStateAfterRepayment,
    };

    // Active exposure now: Fusion (₹50k) + CreditAccess (₹25k) = ₹75,000 across 2 active lenders
    // MUST PASS VERIFICATION!
    const proveAfterRepay = contract.impureCircuits.prove_exposure_within_limit(
      borrowerCtxAfterRepayment,
      2n,
      100000n
    );
    expect(proveAfterRepay.result).toEqual([]);
  });
});
