'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  LoanStatus,
  type PrivateLoanRecord,
  type OnChainCommitment,
  type OnChainNullifier,
  type ZkProofResult,
} from './types';
import {
  midnightClient,
  encodeIdentifier,
  toHex,
  fromHex,
  generateRandomNonce,
  type OffChainPrivateState,
} from './midnight-client';

interface VantageStoreContextType {
  activeTab: 'issuer' | 'borrower' | 'verifier' | 'explainer';
  setActiveTab: (tab: 'issuer' | 'borrower' | 'verifier' | 'explainer') => void;
  borrowerId: string;
  setBorrowerId: (id: string) => void;
  borrowerName: string;
  setBorrowerName: (name: string) => void;
  
  // Borrower Private Vault
  privateLoans: PrivateLoanRecord[];
  addPrivateLoan: (lenderName: string, amount: number, nonce: string) => void;
  updatePrivateLoanStatus: (loanId: string, status: LoanStatus) => void;
  removePrivateLoan: (loanId: string) => void;

  // Issuer State
  lastIssuedResult: {
    commitment: string;
    nonce: string;
    amount: number;
    lenderName: string;
    borrowerId: string;
    txHash: string;
    timestamp: string;
  } | null;
  registerLoanOnChain: (
    borrowerId: string,
    lenderName: string,
    amount: number,
    nonce?: string
  ) => Promise<{ commitment: string; nonce: string; txHash: string }>;

  // On-Chain Ledger
  onChainCommitments: OnChainCommitment[];
  onChainNullifiers: OnChainNullifier[];
  onChainPortfolioRoots: Map<string, string>;

  // Zero-Knowledge Proof Engine
  isGeneratingProof: boolean;
  proofProgressStep: string;
  lastGeneratedProof: ZkProofResult | null;
  generateProof: (maxLenders: number, maxAmount: number) => Promise<ZkProofResult>;
  verifyProof: (proof: ZkProofResult) => Promise<{ isValid: boolean; reason?: string }>;

  // Repayment & Closure
  repayAndCloseLoan: (loan: PrivateLoanRecord) => Promise<void>;

  // Preset scenarios
  loadScenario: (scenario: 'compliant_2_loans' | 'compliant_1_loan' | 'exceeds_amount' | 'exceeds_lenders' | 'zero_loans') => void;
  resetAll: () => void;
}

const VantageStoreContext = createContext<VantageStoreContextType | null>(null);

const DEFAULT_BORROWER_ID = toHex(encodeIdentifier('borrower_priya_sharma_9821'));
const DEFAULT_BORROWER_NAME = 'Priya Sharma (NBFC-MFI Borrower)';

export const VantageStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<'issuer' | 'borrower' | 'verifier' | 'explainer'>('issuer');
  const [borrowerId, setBorrowerId] = useState<string>(DEFAULT_BORROWER_ID);
  const [borrowerName, setBorrowerName] = useState<string>(DEFAULT_BORROWER_NAME);

  const [privateLoans, setPrivateLoans] = useState<PrivateLoanRecord[]>([]);
  const [lastIssuedResult, setLastIssuedResult] = useState<VantageStoreContextType['lastIssuedResult']>(null);

  const [onChainCommitments, setOnChainCommitments] = useState<OnChainCommitment[]>([]);
  const [onChainNullifiers, setOnChainNullifiers] = useState<OnChainNullifier[]>([]);
  const [onChainPortfolioRoots, setOnChainPortfolioRoots] = useState<Map<string, string>>(new Map());

  const [isGeneratingProof, setIsGeneratingProof] = useState<boolean>(false);
  const [proofProgressStep, setProofProgressStep] = useState<string>('');
  const [lastGeneratedProof, setLastGeneratedProof] = useState<ZkProofResult | null>(null);

  // Synchronized Compact Circuit Context
  const [circuitContext, setCircuitContext] = useState<any>(null);

  // Helper: Build 8-element padded witness array for Compact runtime
  const buildOffChainWitness = useCallback((bIdHex: string, loans: PrivateLoanRecord[]): OffChainPrivateState => {
    const padded: OffChainPrivateState['loans'] = [];
    for (let i = 0; i < 8; i++) {
      if (i < loans.length) {
        padded.push({
          lender_id: fromHex(loans[i].lender_id),
          amount: BigInt(loans[i].amount),
          nonce: fromHex(loans[i].nonce),
          status: loans[i].status,
        });
      } else {
        padded.push({
          lender_id: new Uint8Array(32),
          amount: 0n,
          nonce: new Uint8Array(32),
          status: LoanStatus.INACTIVE,
        });
      }
    }
    return {
      borrowerId: fromHex(bIdHex),
      loans: padded,
    };
  }, []);

  // Initialize Genesis Context on mount
  useEffect(() => {
    try {
      const initialWitness = buildOffChainWitness(borrowerId, []);
      const ctx = midnightClient.createGenesisContext(initialWitness);
      setCircuitContext(ctx);
    } catch (e) {
      console.error('Failed to initialize genesis context:', e);
    }
  }, [borrowerId, buildOffChainWitness]);

  // Issuer: Register a loan on-chain
  const registerLoanOnChain = async (
    targetBorrowerId: string,
    lenderName: string,
    amount: number,
    customNonce?: string
  ) => {
    const nonce = customNonce || generateRandomNonce();
    const lenderId = toHex(encodeIdentifier(lenderName.toLowerCase().replace(/\s+/g, '_')));
    const commitment = midnightClient.computeCommitment(targetBorrowerId, lenderId, BigInt(amount), nonce);
    const txHash = '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('');
    const timestamp = new Date().toLocaleTimeString();

    // Execute in Compact runtime if context is ready
    let updatedCtx = circuitContext;
    if (updatedCtx) {
      try {
        const res = midnightClient.registerLoan(
          updatedCtx,
          targetBorrowerId,
          lenderId,
          BigInt(amount),
          nonce
        );
        updatedCtx = res.context;
        setCircuitContext(updatedCtx);
      } catch (err: any) {
        console.warn('Circuit registration note:', err.message);
      }
    }

    // Update on-chain commitments
    setOnChainCommitments((prev) => [
      { commitment, borrowerId: targetBorrowerId, timestamp, txHash },
      ...prev,
    ]);

    // Update on-chain portfolio root
    setOnChainPortfolioRoots((prev) => {
      const nextMap = new Map(prev);
      const currentRoot = nextMap.get(targetBorrowerId) || midnightClient.getGenesisRoot();
      const newRoot = midnightClient.updatePortfolioRoot(currentRoot, commitment);
      nextMap.set(targetBorrowerId, newRoot);
      return nextMap;
    });

    const result = {
      commitment,
      nonce,
      amount,
      lenderName,
      borrowerId: targetBorrowerId,
      txHash,
      timestamp,
    };
    setLastIssuedResult(result);
    return { commitment, nonce, txHash };
  };

  // Borrower: Add loan to private vault
  const addPrivateLoan = (lenderName: string, amount: number, nonce: string) => {
    const lender_id = toHex(encodeIdentifier(lenderName.toLowerCase().replace(/\s+/g, '_')));
    const commitment = midnightClient.computeCommitment(borrowerId, lender_id, BigInt(amount), nonce);
    const newRecord: PrivateLoanRecord = {
      id: 'loan_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      lender_id,
      lender_name: lenderName,
      amount: BigInt(amount),
      nonce,
      status: LoanStatus.ACTIVE,
      disbursedAt: new Date().toLocaleDateString(),
      commitment,
    };
    setPrivateLoans((prev) => [...prev, newRecord]);
  };

  const updatePrivateLoanStatus = (loanId: string, status: LoanStatus) => {
    setPrivateLoans((prev) =>
      prev.map((l) => (l.id === loanId ? { ...l, status } : l))
    );
  };

  const removePrivateLoan = (loanId: string) => {
    setPrivateLoans((prev) => prev.filter((l) => l.id !== loanId));
  };

  // Borrower: Generate Zero-Knowledge Compliance Proof
  const generateProof = async (
    maxLenders: number,
    maxAmount: number
  ): Promise<ZkProofResult> => {
    setIsGeneratingProof(true);
    setProofProgressStep('1/4: Encapsulating local private witness state...');
    await new Promise((r) => setTimeout(r, 400));

    try {
      setProofProgressStep('2/4: Reconstructing borrower portfolio hash chain...');
      await new Promise((r) => setTimeout(r, 400));

      setProofProgressStep('3/4: Querying Midnight public ledger commitments & nullifiers...');
      await new Promise((r) => setTimeout(r, 400));

      setProofProgressStep('4/4: Executing Compact zero-knowledge boundary constraints...');
      
      const witness = buildOffChainWitness(borrowerId, privateLoans);
      
      // Calculate local expected root
      let runningRoot = midnightClient.getGenesisRoot();
      let activeCount = 0;
      let totalExposure = 0n;

      for (const loan of privateLoans) {
        if (loan.status !== LoanStatus.INACTIVE) {
          const comm = midnightClient.computeCommitment(
            borrowerId,
            loan.lender_id,
            loan.amount,
            loan.nonce
          );
          runningRoot = midnightClient.updatePortfolioRoot(runningRoot, comm);
          if (loan.status === LoanStatus.ACTIVE) {
            activeCount += 1;
            totalExposure += loan.amount;
          }
        }
      }

      // Check against on-chain root
      const onChainRoot = onChainPortfolioRoots.get(borrowerId) || midnightClient.getGenesisRoot();
      if (runningRoot !== onChainRoot) {
        throw new Error('Borrower witness omitted registered loans or does not match on-chain portfolio root');
      }

      if (activeCount > maxLenders) {
        throw new Error(`Active loan count (${activeCount}) exceeds allowed limit (${maxLenders})`);
      }
      if (Number(totalExposure) > maxAmount) {
        throw new Error(`Total credit exposure (₹${Number(totalExposure).toLocaleString('en-IN')}) exceeds allowed regulatory cap (₹${maxAmount.toLocaleString('en-IN')})`);
      }

      // Generate simulated ZK proof transcript
      const transcriptBytes = new Uint8Array(64);
      crypto.getRandomValues(transcriptBytes);
      const publicTranscript = toHex(transcriptBytes);

      const proofResult: ZkProofResult = {
        proofId: 'zkp_' + Date.now().toString(36),
        borrowerId,
        maxLenderCount: maxLenders,
        maxTotalExposure: maxAmount,
        portfolioRoot: runningRoot,
        publicTranscript,
        isValid: true,
        generatedAt: new Date().toLocaleTimeString(),
      };

      setLastGeneratedProof(proofResult);
      return proofResult;
    } finally {
      setIsGeneratingProof(false);
      setProofProgressStep('');
    }
  };

  // Verifier: Verify Proof on Ledger
  const verifyProof = async (proof: ZkProofResult): Promise<{ isValid: boolean; reason?: string }> => {
    await new Promise((r) => setTimeout(r, 600));
    const onChainRoot = onChainPortfolioRoots.get(proof.borrowerId) || midnightClient.getGenesisRoot();
    if (proof.portfolioRoot !== onChainRoot) {
      return { isValid: false, reason: 'Portfolio root in proof does not match on-chain ledger state' };
    }
    if (!proof.publicTranscript || proof.publicTranscript.length < 32) {
      return { isValid: false, reason: 'Invalid zero-knowledge public transcript signature' };
    }
    return { isValid: true };
  };

  // Repay and Close Loan
  const repayAndCloseLoan = async (loan: PrivateLoanRecord) => {
    const commitment = midnightClient.computeCommitment(
      borrowerId,
      loan.lender_id,
      loan.amount,
      loan.nonce
    );
    const nullifier = midnightClient.computeNullifier(commitment, loan.nonce);
    const txHash = '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('');
    const timestamp = new Date().toLocaleTimeString();

    // Update on-chain nullifiers
    setOnChainNullifiers((prev) => [
      { nullifier, commitment, timestamp, txHash },
      ...prev,
    ]);

    // Update local private loan status
    updatePrivateLoanStatus(loan.id, LoanStatus.CLOSED);
  };

  // Preset Scenarios
  const loadScenario = (scenario: 'compliant_2_loans' | 'compliant_1_loan' | 'exceeds_amount' | 'exceeds_lenders' | 'zero_loans') => {
    resetAll();
    const bId = DEFAULT_BORROWER_ID;
    setBorrowerId(bId);
    setBorrowerName(DEFAULT_BORROWER_NAME);

    if (scenario === 'zero_loans') {
      return;
    }

    if (scenario === 'compliant_1_loan') {
      const nce1 = '0x1111111111111111111111111111111111111111111111111111111111111111';
      registerLoanOnChain(bId, 'Bandhan MFI', 35000, nce1);
      addPrivateLoan('Bandhan MFI', 35000, nce1);
    } else if (scenario === 'compliant_2_loans') {
      const nce1 = '0x1111111111111111111111111111111111111111111111111111111111111111';
      const nce2 = '0x2222222222222222222222222222222222222222222222222222222222222222';
      registerLoanOnChain(bId, 'Bandhan MFI', 40000, nce1);
      registerLoanOnChain(bId, 'Fusion Microfinance', 50000, nce2);
      addPrivateLoan('Bandhan MFI', 40000, nce1);
      addPrivateLoan('Fusion Microfinance', 50000, nce2);
    } else if (scenario === 'exceeds_amount') {
      const nce1 = '0x1111111111111111111111111111111111111111111111111111111111111111';
      const nce2 = '0x2222222222222222222222222222222222222222222222222222222222222222';
      registerLoanOnChain(bId, 'Bandhan MFI', 60000, nce1);
      registerLoanOnChain(bId, 'Fusion Microfinance', 55000, nce2); // Total = ₹115,000 > ₹100,000
      addPrivateLoan('Bandhan MFI', 60000, nce1);
      addPrivateLoan('Fusion Microfinance', 55000, nce2);
    } else if (scenario === 'exceeds_lenders') {
      const nce1 = '0x1111111111111111111111111111111111111111111111111111111111111111';
      const nce2 = '0x2222222222222222222222222222222222222222222222222222222222222222';
      const nce3 = '0x3333333333333333333333333333333333333333333333333333333333333333';
      registerLoanOnChain(bId, 'Bandhan MFI', 25000, nce1);
      registerLoanOnChain(bId, 'Fusion Microfinance', 25000, nce2);
      registerLoanOnChain(bId, 'CreditAccess Grameen', 25000, nce3); // 3 lenders > max 2
      addPrivateLoan('Bandhan MFI', 25000, nce1);
      addPrivateLoan('Fusion Microfinance', 25000, nce2);
      addPrivateLoan('CreditAccess Grameen', 25000, nce3);
    }
  };

  const resetAll = () => {
    setPrivateLoans([]);
    setOnChainCommitments([]);
    setOnChainNullifiers([]);
    setOnChainPortfolioRoots(new Map());
    setLastIssuedResult(null);
    setLastGeneratedProof(null);
  };

  return (
    <VantageStoreContext.Provider
      value={{
        activeTab,
        setActiveTab,
        borrowerId,
        setBorrowerId,
        borrowerName,
        setBorrowerName,
        privateLoans,
        addPrivateLoan,
        updatePrivateLoanStatus,
        removePrivateLoan,
        lastIssuedResult,
        registerLoanOnChain,
        onChainCommitments,
        onChainNullifiers,
        onChainPortfolioRoots,
        isGeneratingProof,
        proofProgressStep,
        lastGeneratedProof,
        generateProof,
        verifyProof,
        repayAndCloseLoan,
        loadScenario,
        resetAll,
      }}
    >
      {children}
    </VantageStoreContext.Provider>
  );
};

export const useVantageStore = () => {
  const context = useContext(VantageStoreContext);
  if (!context) {
    throw new Error('useVantageStore must be used within a VantageStoreProvider');
  }
  return context;
};
