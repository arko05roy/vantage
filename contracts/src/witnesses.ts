import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';
import type { Ledger, Witnesses } from './managed/exposure-proof/contract/index.js';

export enum LoanStatus {
  INACTIVE = 0,
  ACTIVE = 1,
  CLOSED = 2,
}

export interface PrivateLoanRecord {
  lender_id: Uint8Array;
  amount: bigint;
  nonce: Uint8Array;
  status: LoanStatus;
}

export interface VantagePrivateState {
  readonly borrowerId: Uint8Array;
  readonly loans: PrivateLoanRecord[];
}

export const createVantagePrivateState = (
  borrowerId: Uint8Array,
  loans: PrivateLoanRecord[] = []
): VantagePrivateState => {
  // Pad or trim loans vector to exactly 8 elements as required by the Compact Vector<8, ...>
  const paddedLoans: PrivateLoanRecord[] = [];
  for (let i = 0; i < 8; i++) {
    if (i < loans.length) {
      paddedLoans.push(loans[i]);
    } else {
      paddedLoans.push({
        lender_id: new Uint8Array(32),
        amount: 0n,
        nonce: new Uint8Array(32),
        status: LoanStatus.INACTIVE,
      });
    }
  }

  return {
    borrowerId,
    loans: paddedLoans,
  };
};

export const createWitnesses = (): Witnesses<VantagePrivateState> => ({
  get_borrower_id: ({
    privateState,
  }: WitnessContext<Ledger, VantagePrivateState>): [VantagePrivateState, Uint8Array] => [
    privateState,
    privateState.borrowerId,
  ],

  get_loan_records: ({
    privateState,
  }: WitnessContext<Ledger, VantagePrivateState>): [
    VantagePrivateState,
    {
      lender_id: Uint8Array;
      amount: bigint;
      nonce: Uint8Array;
      status: number;
    }[]
  ] => [
    privateState,
    privateState.loans.map((loan) => ({
      lender_id: loan.lender_id,
      amount: loan.amount,
      nonce: loan.nonce,
      status: loan.status,
    })),
  ],
});
