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
  snarkProof?: string;
  isValid: boolean;
  generatedAt: string;
  
  // Real Proving Pipeline Telemetry
  stage1LatencyMs: number; // In-browser Compact ZKIR & Constraint evaluation time
  stage2LatencyMs: number | null; // Proof Server SNARK synthesis time (if connected)
  stage2Status: 'online' | 'unreachable' | 'error';
  totalLatencyMs: number;
  proofEnvelopeType: 'Groth16/Plonk SNARK Envelope (Stage 1 + 2)' | 'ZKIR Constraint Vector (Stage 1 Verified)';
  evaluatedConstraintsCount: number;
  witnessIntegrity: 'Valid (Hash Chain Matches On-Chain Root)' | 'Diverged';
  
  circuitVersion?: string;
  rawProofData?: any;
}

export interface DualLedgerState {
  loanCommitments: Set<string>;
  nullifiers: Set<string>;
  borrowerPortfolios: Map<string, string>;
}
