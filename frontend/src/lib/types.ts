export enum LoanStatus {
  INACTIVE = 0,
  ACTIVE = 1,
  CLOSED = 2,
}

export interface PrivateLoanRecord {
  id: string;
  lender_id: string;
  lender_name: string;
  amount: bigint;
  nonce: string; // Hex string (32 bytes)
  status: LoanStatus;
  disbursedAt: string;
  commitment?: string;
}

export interface OnChainCommitment {
  commitment: string;
  borrowerId: string;
  timestamp: string;
  txHash: string;
}

export interface OnChainNullifier {
  nullifier: string;
  commitment: string;
  timestamp: string;
  txHash: string;
}

export interface ZkProofResult {
  proofId: string;
  borrowerId: string;
  maxLenderCount: number;
  maxTotalExposure: number;
  portfolioRoot: string;
  publicTranscript: string;
  isValid: boolean;
  generatedAt: string;
  rawProofData?: any;
}

export interface DualLedgerState {
  loanCommitments: Set<string>;
  nullifiers: Set<string>;
  borrowerPortfolios: Map<string, string>;
}
