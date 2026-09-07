'use client';

import React, { useState } from 'react';
import { useVantageStore } from '@/lib/store';
import {
  Wallet,
  Plus,
  ShieldCheck,
  Cpu,
  Key,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  ClipboardPaste,
  FileCheck,
  Check,
  Copy,
  Trash2,
  Lock,
} from 'lucide-react';
import { LoanStatus, type PrivateLoanRecord } from '@/lib/types';

export const BorrowerView: React.FC = () => {
  const {
    borrowerId,
    borrowerName,
    privateLoans,
    addPrivateLoan,
    removePrivateLoan,
    repayAndCloseLoan,
    isGeneratingProof,
    proofProgressStep,
    lastGeneratedProof,
    generateProof,
    lastIssuedResult,
    setActiveTab,
  } = useVantageStore();

  // Form State for manual loan entry (Fix 2)
  const [lenderName, setLenderName] = useState<string>('Bandhan MFI');
  const [amount, setAmount] = useState<number>(35000);
  const [nonce, setNonce] = useState<string>('');

  // Regulatory Thresholds (Fix 4: Defaults 2 lenders, ₹1,00,000)
  const [maxLenders, setMaxLenders] = useState<number>(2);
  const [maxAmount, setMaxAmount] = useState<number>(100000);

  const [proofError, setProofError] = useState<string | null>(null);
  const [copiedProof, setCopiedProof] = useState<boolean>(false);

  // Quick import from last issued result
  const handleImportFromIssuer = () => {
    if (lastIssuedResult) {
      setLenderName(lastIssuedResult.lenderName);
      setAmount(lastIssuedResult.amount);
      setNonce(lastIssuedResult.nonce);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.startsWith('0x') && text.length === 66) {
        setNonce(text.trim());
      } else {
        alert('Clipboard does not contain a valid 32-byte (66-char) hex nonce.');
      }
    } catch {
      // Fallback
    }
  };

  const handleAddLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !nonce) {
      alert('Please enter both amount and 32-byte secret nonce.');
      return;
    }
    addPrivateLoan(lenderName, amount, nonce.trim());
    setNonce('');
  };

  const handleGenerateProof = async () => {
    setProofError(null);
    try {
      await generateProof(maxLenders, maxAmount);
    } catch (err: any) {
      setProofError(err.message || 'Proof generation failed');
    }
  };

  const handleCopyProof = (proofJson: string) => {
    navigator.clipboard.writeText(proofJson);
    setCopiedProof(true);
    setTimeout(() => setCopiedProof(false), 2000);
  };

  // Calculate local exposure metrics
  const activeLoans = privateLoans.filter((l) => l.status === LoanStatus.ACTIVE);
  const totalActiveExposure = activeLoans.reduce((sum, l) => sum + Number(l.amount), 0);
  const isWithinLimits = activeLoans.length <= maxLenders && totalActiveExposure <= maxAmount;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
      {/* Title & Context */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs uppercase tracking-wider">
          <Wallet className="h-4 w-4" />
          Borrower Local Private Vault & Zero-Knowledge Prover
        </div>
        <h2 className="font-headline text-3xl font-bold tracking-tight text-slate-900 mt-1">
          Prove Regulatory Compliance Without Disclosing PII
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Your loan details, amounts, and lender identities are stored locally in your browser. The Compact circuit computes a mathematical zero-knowledge proof against the Midnight blockchain, proving compliance without disclosing your financial history.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Private Loan Portfolio & Manual Entry */}
        <div className="lg:col-span-7 space-y-6">
          {/* Private Vault Portfolio Summary */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Client-Side Private State
                </div>
                <div className="font-headline text-lg font-bold text-slate-900 flex items-center gap-2 mt-0.5">
                  <span>{borrowerName}</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                    <Lock className="h-3 w-3" />
                    Vault Encrypted
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-right">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Active Loans</div>
                  <div className={`font-mono text-base font-bold ${activeLoans.length > maxLenders ? 'text-rose-600' : 'text-slate-900'}`}>
                    {activeLoans.length} / {maxLenders} Max
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Total Exposure</div>
                  <div className={`font-mono text-base font-bold ${totalActiveExposure > maxAmount ? 'text-rose-600' : 'text-emerald-800'}`}>
                    ₹{totalActiveExposure.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>

            {/* Loans Table (Fix 6: Explicit Status Badges & Repay Button) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Private Loan Records ({privateLoans.length})
                </span>
                {lastIssuedResult && (
                  <button
                    type="button"
                    onClick={handleImportFromIssuer}
                    className="flex items-center gap-1 text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 bg-emerald-50 border border-emerald-200/80 px-2 py-1 rounded"
                  >
                    <ClipboardPaste className="h-3 w-3" />
                    Import Last Issued Loan
                  </button>
                )}
              </div>

              {privateLoans.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                  Your private vault is empty (Zero Loans). Add a loan manually below or test the zero-loan proof generation.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden bg-slate-50/50">
                  {privateLoans.map((loan, idx) => (
                    <div key={loan.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-slate-50/80 transition">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{loan.lender_name}</span>
                          {/* Fix 6: Status Badges */}
                          {loan.status === LoanStatus.ACTIVE ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                              ACTIVE
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                              <CheckCircle className="h-3 w-3 text-slate-500" />
                              REPAID / CLOSED
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
                          <span>Amount: <strong className="text-slate-800">₹{Number(loan.amount).toLocaleString('en-IN')}</strong></span>
                          <span>•</span>
                          <span className="truncate max-w-[120px] text-slate-400">Nonce: {loan.nonce.substring(0, 10)}...</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {/* Fix 6: Repay & Close Button */}
                        {loan.status === LoanStatus.ACTIVE && (
                          <button
                            type="button"
                            onClick={() => repayAndCloseLoan(loan)}
                            className="rounded-lg border border-emerald-600/40 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-900 hover:bg-emerald-100 transition"
                            title="Publishes nullifier on Midnight and updates loan to CLOSED"
                          >
                            Repay & Close
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removePrivateLoan(loan.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                          title="Remove from local view"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Fix 2: Manual Loan Entry Form with Nonce Field */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <h3 className="font-headline text-base font-bold text-slate-900 mb-1 flex items-center justify-between">
              <span>Add Loan to Local Private Vault</span>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                Wave 1 Manual Nonce Binding
              </span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter the loan amount and secret Nonce provided by the issuing MFI. This updates your local witness state without sending anything over the network.
            </p>

            <form onSubmit={handleAddLoan} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Lender Name
                  </label>
                  <input
                    type="text"
                    value={lenderName}
                    onChange={(e) => setLenderName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Loan Amount (₹ INR)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 font-bold text-slate-400">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="1000"
                      step="1000"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 pl-7 pr-3 py-2 text-sm font-bold text-slate-900 focus:border-emerald-600 focus:outline-none font-mono"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Fix 2: Nonce Input Field with Paste Button */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-600">
                    <Key className="h-3.5 w-3.5 text-amber-600" />
                    Loan Nonce (Secret 32-Byte Hex)
                  </label>
                  <button
                    type="button"
                    onClick={handlePasteClipboard}
                    className="flex items-center gap-1 text-[11px] font-semibold text-emerald-800 hover:text-emerald-950"
                  >
                    <ClipboardPaste className="h-3 w-3" />
                    Paste Nonce
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="0x..."
                  value={nonce}
                  onChange={(e) => setNonce(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono text-slate-800 bg-slate-50 focus:border-emerald-600 focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-slate-800 transition"
              >
                <Plus className="h-4 w-4" />
                Add Loan to Private Witness
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Zero-Knowledge Proof Generator */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headline text-lg font-bold text-slate-900 flex items-center gap-2">
                <Cpu className="h-5 w-5 text-emerald-700" />
                ZK Proof Generator
              </h3>
              <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                Compact 0.31.1
              </span>
            </div>

            {/* Threshold Configuration (Fix 4 Applied) */}
            <div className="space-y-4 rounded-xl bg-slate-50 p-4 border border-slate-200/80 mb-5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
                RBI Regulatory Limit Parameters
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Max Lenders Cap
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={maxLenders}
                    onChange={(e) => setMaxLenders(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-bold text-slate-900 bg-white font-mono"
                  />
                  <span className="text-[10px] text-slate-400">Default: 2 Lenders</span>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Exposure Cap (₹)
                  </label>
                  <input
                    type="number"
                    step="5000"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-bold text-slate-900 bg-white font-mono"
                  />
                  <span className="text-[10px] text-slate-400">Default: ₹1,00,000</span>
                </div>
              </div>
            </div>

            {/* Prover Action Button */}
            <button
              type="button"
              disabled={isGeneratingProof}
              onClick={handleGenerateProof}
              className={`w-full flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold text-white shadow-md transition ${
                isWithinLimits
                  ? 'bg-gradient-to-r from-emerald-800 to-emerald-950 hover:from-emerald-700 hover:to-emerald-900'
                  : 'bg-gradient-to-r from-amber-700 to-slate-900 hover:from-amber-600'
              } disabled:opacity-50`}
            >
              {isGeneratingProof ? (
                <>
                  <Cpu className="h-4 w-4 animate-spin text-emerald-300" />
                  Synthesizing Zero-Knowledge Proof...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4 text-emerald-300" />
                  Generate ZK Compliance Proof
                </>
              )}
            </button>

            {/* Real-time ZK synthesis steps */}
            {isGeneratingProof && (
              <div className="mt-4 rounded-xl border border-emerald-300/60 bg-emerald-50/80 p-3.5 text-xs text-emerald-950 animate-pulse">
                <div className="font-bold flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-600 animate-ping"></div>
                  Prover Execution Progress
                </div>
                <div className="font-mono text-[11px] text-emerald-800 mt-1 font-semibold">
                  {proofProgressStep}
                </div>
              </div>
            )}

            {/* Circuit Error / Assertion Failure */}
            {proofError && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Proof Generation Rejected (Circuit Constraint Failed)
                </div>
                <p className="font-mono text-[11px] text-rose-800 leading-relaxed font-semibold">
                  {proofError}
                </p>
                <p className="text-[11px] text-rose-600/90 pt-1">
                  The Compact circuit enforced the boundary limits or anti-omission accumulator check and mathematically failed the assertion.
                </p>
              </div>
            )}

            {/* Proof Result Package */}
            {lastGeneratedProof && !proofError && (
              <div className="mt-5 rounded-2xl border-2 border-emerald-600/30 bg-gradient-to-b from-slate-900 to-emerald-950 p-5 text-white shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 font-mono text-[11px] font-bold text-emerald-300">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                    ZK Proof Synthesized
                  </span>
                  <span className="font-mono text-[11px] text-emerald-400/70">
                    {lastGeneratedProof.generatedAt}
                  </span>
                </div>

                <div className="rounded-xl bg-black/40 border border-emerald-500/20 p-3 space-y-2 text-xs">
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-slate-400">Proof ID:</span>
                    <span className="text-emerald-300 font-bold">{lastGeneratedProof.proofId}</span>
                  </div>
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-slate-400">Threshold Proved:</span>
                    <span className="text-white font-bold">
                      &le; {lastGeneratedProof.maxLenderCount} Lenders &bull; &le; ₹{lastGeneratedProof.maxTotalExposure.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                      Portfolio Accumulator Root (Public)
                    </span>
                    <div className="font-mono text-[10px] text-emerald-200 break-all select-all bg-black/60 p-1.5 rounded border border-emerald-900/50">
                      {lastGeneratedProof.portfolioRoot}
                    </div>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                      Public Transcript Signature
                    </span>
                    <div className="font-mono text-[10px] text-emerald-200/80 break-all select-all bg-black/60 p-1.5 rounded border border-emerald-900/50">
                      {lastGeneratedProof.publicTranscript.substring(0, 36)}...
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyProof(JSON.stringify(lastGeneratedProof, null, 2))}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-emerald-400/30 bg-emerald-900/40 px-3 py-2.5 text-xs font-bold text-emerald-200 hover:bg-emerald-800/50 transition"
                  >
                    {copiedProof ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    Copy Proof Package
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('verifier')}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2.5 text-xs font-bold text-slate-950 shadow-md hover:bg-emerald-400 transition"
                  >
                    <span>Submit to Verifier</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
