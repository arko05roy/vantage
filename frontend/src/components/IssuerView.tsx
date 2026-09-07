'use client';

import React, { useState } from 'react';
import { useVantageStore } from '@/lib/store';
import {
  Building2,
  Send,
  Copy,
  Check,
  Sparkles,
  Key,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Hash,
  Coins,
  UserCheck,
} from 'lucide-react';
import { generateRandomNonce } from '@/lib/midnight-client';

const POPULAR_MFIS = [
  'Bandhan MFI',
  'Fusion Microfinance',
  'CreditAccess Grameen',
  'Muthoot Microfin',
  'Arohan Financial',
];

export const IssuerView: React.FC = () => {
  const {
    borrowerId,
    borrowerName,
    registerLoanOnChain,
    lastIssuedResult,
    onChainCommitments,
    setActiveTab,
  } = useVantageStore();

  const [lenderName, setLenderName] = useState<string>('Bandhan MFI');
  const [amount, setAmount] = useState<number>(35000);
  const [nonce, setNonce] = useState<string>(() => generateRandomNonce());
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleRegenerateNonce = () => {
    setNonce(generateRandomNonce());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;
    setIsSubmitting(true);
    try {
      await registerLoanOnChain(borrowerId, lenderName, amount, nonce);
      // Generate fresh nonce for next loan
      setNonce(generateRandomNonce());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
      {/* Title & Context */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs uppercase tracking-wider">
          <Building2 className="h-4 w-4" />
          MFI Loan Disbursement & Ledger Registration Portal
        </div>
        <h2 className="font-headline text-3xl font-bold tracking-tight text-slate-900 mt-1">
          Issue Microfinance Loan on Midnight
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          When an NBFC-MFI disburses credit, it publishes only a 32-byte cryptographic commitment to Midnight&apos;s public ledger. No raw borrower PII, Aadhaar numbers, or loan amounts are ever published.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Loan Registration Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <h3 className="font-headline text-lg font-bold text-slate-900 mb-4 flex items-center justify-between">
              <span>Loan Disbursement Details</span>
              <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                Public Ledger Writer
              </span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Borrower Target */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Target Borrower Identifier
                </label>
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-mono text-slate-700">
                  <UserCheck className="h-4 w-4 text-emerald-700 shrink-0" />
                  <span className="truncate flex-1 font-semibold">{borrowerName}</span>
                  <span className="text-[10px] text-slate-400 truncate max-w-[140px]">
                    {borrowerId.substring(0, 16)}...
                  </span>
                </div>
              </div>

              {/* Lender Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Lender Institution (NBFC-MFI)
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {POPULAR_MFIS.map((mfi) => (
                    <button
                      key={mfi}
                      type="button"
                      onClick={() => setLenderName(mfi)}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                        lenderName === mfi
                          ? 'bg-emerald-800 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {mfi}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={lenderName}
                  onChange={(e) => setLenderName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>

              {/* Amount in INR (Fix 3) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Disbursement Amount (₹ INR)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 font-bold text-slate-500">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 pl-8 pr-4 py-2.5 text-base font-bold text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                    required
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  {[25000, 35000, 40000, 50000, 60000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmount(val)}
                      className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-200"
                    >
                      ₹{(val / 1000).toFixed(0)}k
                    </button>
                  ))}
                </div>
              </div>

              {/* Nonce Generation */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Loan Nonce (Entropy Salt)
                  </label>
                  <button
                    type="button"
                    onClick={handleRegenerateNonce}
                    className="flex items-center gap-1 text-[11px] font-semibold text-emerald-800 hover:text-emerald-950"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Regenerate Salt
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={nonce}
                    onChange={(e) => setNonce(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-mono text-slate-700 bg-slate-50 focus:border-emerald-600 focus:outline-none"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Random 256-bit entropy ensuring the loan commitment hash cannot be reverse-engineered via brute force.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-950 px-6 py-3.5 text-sm font-bold text-white shadow-md hover:from-emerald-700 hover:to-emerald-900 transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Writing Commitment to Midnight Ledger...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 text-emerald-300" />
                    Disburse & Register On-Chain Commitment
                  </>
                )}
              </button>
            </form>
          </div>

          {/* On-Chain Registered Commitments Log */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <h3 className="font-headline text-base font-bold text-slate-900 mb-3 flex items-center justify-between">
              <span>Public Ledger Commitments</span>
              <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                Total: {onChainCommitments.length}
              </span>
            </h3>

            {onChainCommitments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                No loan commitments registered on-chain yet. Use the form above to disburse your first loan.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                {onChainCommitments.map((item, idx) => (
                  <div key={item.txHash + idx} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-emerald-900">
                          {item.commitment.substring(0, 18)}...
                        </span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-mono text-slate-500">
                          {item.timestamp}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 truncate max-w-sm">
                        Tx: {item.txHash}
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopy(item.commitment, `item_${idx}`)}
                      className="rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      {copiedField === `item_${idx}` ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Result Panel (Fix 1 Applied) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border-2 border-emerald-800/30 bg-gradient-to-b from-emerald-950 to-slate-950 p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-800/60 px-3 py-1 font-mono text-xs font-semibold text-emerald-300">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                Latest Disbursement Result
              </span>
              <span className="font-mono text-xs text-emerald-400/80">
                {lastIssuedResult ? lastIssuedResult.timestamp : 'Waiting for event'}
              </span>
            </div>

            {lastIssuedResult ? (
              <div className="space-y-5">
                {/* Summary Banner */}
                <div className="rounded-xl bg-emerald-900/40 border border-emerald-700/40 p-4">
                  <div className="text-xs text-emerald-300 font-semibold uppercase tracking-wider">
                    Disbursed & Committed
                  </div>
                  <div className="text-2xl font-bold font-headline text-white mt-1">
                    ₹{lastIssuedResult.amount.toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-emerald-200/80 mt-0.5">
                    Lender: <strong>{lastIssuedResult.lenderName}</strong>
                  </div>
                </div>

                {/* 32-Byte Commitment Hash */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300/80">
                      On-Chain Loan Commitment (Public)
                    </span>
                    <button
                      onClick={() => handleCopy(lastIssuedResult.commitment, 'res_comm')}
                      className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300"
                    >
                      {copiedField === 'res_comm' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      Copy
                    </button>
                  </div>
                  <div className="rounded-lg bg-black/40 border border-emerald-800/50 p-2.5 font-mono text-xs text-emerald-200 break-all select-all">
                    {lastIssuedResult.commitment}
                  </div>
                </div>

                {/* Fix 1: Dedicated Nonce Output Field with Copy Button */}
                <div className="rounded-xl bg-amber-950/40 border border-amber-500/40 p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300">
                      <Key className="h-3.5 w-3.5 text-amber-400" />
                      Loan Nonce (Secret Salt for Borrower)
                    </span>
                    <button
                      onClick={() => handleCopy(lastIssuedResult.nonce, 'res_nonce')}
                      className="flex items-center gap-1 rounded bg-amber-500/20 border border-amber-400/30 px-2.5 py-1 text-xs font-bold text-amber-200 hover:bg-amber-500/30 transition"
                    >
                      {copiedField === 'res_nonce' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      Copy Nonce
                    </button>
                  </div>
                  <div className="rounded-lg bg-black/60 border border-amber-700/50 p-2.5 font-mono text-xs text-amber-200 break-all select-all">
                    {lastIssuedResult.nonce}
                  </div>
                  <p className="text-[11px] text-amber-300/80 mt-2 leading-relaxed">
                    💡 <strong>Wave 1 Simplification (PRD §8.1)</strong>: Hand this Nonce to the borrower. The borrower pastes it into their local Vantage Vault to link this loan into their private ZK witness.
                  </p>
                </div>

                {/* Action: Jump to Borrower View */}
                <button
                  onClick={() => setActiveTab('borrower')}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-lg hover:bg-emerald-500 transition"
                >
                  <span>Go to Borrower Vault & Add Loan</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="py-12 text-center text-emerald-400/60 text-xs">
                <Coins className="h-10 w-10 mx-auto mb-2 opacity-40" />
                Register a loan to view the cryptographic commitment and secret nonce output.
              </div>
            )}
          </div>

          {/* Privacy Guarantee Note */}
          <div className="rounded-xl border border-slate-200 bg-emerald-50/50 p-4 text-xs text-slate-700 space-y-1.5">
            <div className="font-bold text-emerald-950 flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-emerald-700" />
              Dual-Ledger Privacy Guarantee
            </div>
            <p className="text-slate-600 leading-relaxed">
              On Midnight, registering a loan does not disclose the loan amount (₹{amount.toLocaleString('en-IN')}) or the borrower identity to other competing lenders. Only a cryptographic binding hash is placed on-chain.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
