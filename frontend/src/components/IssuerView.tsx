'use client';

import React, { useState } from 'react';
import { useVantageStore } from '@/lib/store';
import { generateRandomNonce } from '@/lib/midnight-client';

const LENDERS = [
  'Bandhan MFI',
  'Fusion Microfinance',
  'CreditAccess Grameen',
  'Muthoot Microfin',
  'Arohan Financial',
];

const QUICK_AMOUNTS = [25000, 35000, 40000, 50000, 60000];

/** Clipboard copy helper with transient feedback */
function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };
  return { copied, copy };
}

export const IssuerView: React.FC = () => {
  const { borrowerId, borrowerName, registerLoanOnChain, lastIssuedResult, onChainCommitments, setActiveTab } =
    useVantageStore();

  const [lenderName, setLenderName] = useState('Bandhan MFI');
  const [amount, setAmount] = useState(35000);
  const [nonce, setNonce] = useState(() => generateRandomNonce());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { copied, copy } = useCopy();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;
    setIsSubmitting(true);
    try {
      await registerLoanOnChain(borrowerId, lenderName, amount, nonce);
      setNonce(generateRandomNonce());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-container px-4 py-8 sm:px-6">
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
          Lending Institution
        </p>
        <h2 className="text-2xl font-bold text-on-surface sm:text-3xl">Register a Loan</h2>
        <p className="mt-1 text-sm text-on-surface-v max-w-2xl">
          Record a disbursed loan on Midnight&apos;s public ledger. Only a cryptographic commitment is
          published — no borrower identity or loan amount is ever exposed.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* ── Left: Form ───────────────────────────────────────────────────── */}
        <div className="lg:col-span-7 space-y-5">
          {/* Registration form */}
          <div className="rounded-xl border border-outline-variant bg-surface-bright p-6 shadow-card">
            <h3 className="text-sm font-bold text-on-surface-v uppercase tracking-wider mb-5">
              Loan Details
            </h3>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Borrower reference */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-v mb-1.5">
                  Borrower Reference ID
                </label>
                <div className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container px-3 py-2.5">
                  <span className="font-mono text-xs text-on-surface font-semibold truncate flex-1">
                    {borrowerName}
                  </span>
                  <span className="font-mono text-2xs text-outline truncate max-w-[140px]">
                    {borrowerId.substring(0, 16)}…
                  </span>
                </div>
              </div>

              {/* Lender selection */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-v mb-1.5">
                  Lender Institution (NBFC-MFI)
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {LENDERS.map((mfi) => (
                    <button
                      key={mfi}
                      type="button"
                      onClick={() => setLenderName(mfi)}
                      className={[
                        'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors',
                        lenderName === mfi
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container text-on-surface-v hover:bg-surface-high',
                      ].join(' ')}
                    >
                      {mfi}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={lenderName}
                  onChange={(e) => setLenderName(e.target.value)}
                  placeholder="Custom lender name"
                  className="w-full rounded-lg border border-outline-variant bg-surface-bright px-3 py-2.5 text-sm text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                  required
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-v mb-1.5">
                  Disbursement Amount (INR)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-sm font-bold text-outline">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={1000}
                    step={1000}
                    max={100000}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full rounded-lg border border-outline-variant bg-surface-bright pl-7 pr-4 py-2.5 font-mono text-sm font-bold text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                    required
                  />
                </div>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {QUICK_AMOUNTS.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setAmount(v)}
                      className="rounded-md bg-surface-container px-2.5 py-1 text-2xs font-semibold text-on-surface-v hover:bg-surface-high transition-colors"
                    >
                      ₹{(v / 1000).toFixed(0)}k
                    </button>
                  ))}
                </div>
              </div>

              {/* Nonce */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-on-surface-v">
                    Loan Nonce (entropy salt)
                  </label>
                  <button
                    type="button"
                    onClick={() => setNonce(generateRandomNonce())}
                    className="text-2xs font-semibold text-primary hover:underline"
                  >
                    Regenerate
                  </button>
                </div>
                <input
                  type="text"
                  value={nonce}
                  onChange={(e) => setNonce(e.target.value)}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container px-3 py-2.5 font-mono text-xs text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                  required
                />
                <p className="mt-1 text-2xs text-outline">
                  256-bit entropy ensuring the commitment hash cannot be brute-forced.
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-primary py-3 text-sm font-bold text-on-primary shadow-card transition hover:bg-primary-c disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent spin" />
                    Writing to Midnight ledger…
                  </>
                ) : (
                  'Register Loan On-Chain'
                )}
              </button>

              <p className="text-center text-2xs text-outline">
                Only a commitment hash is published — loan amount and borrower identity remain private.
              </p>
            </form>
          </div>

          {/* Commitments log */}
          <div className="rounded-xl border border-outline-variant bg-surface-bright p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-on-surface-v uppercase tracking-wider">
                Public Ledger Commitments
              </h3>
              <span className="font-mono text-xs font-bold text-primary bg-primary-light px-2.5 py-1 rounded-md">
                {onChainCommitments.length} registered
              </span>
            </div>

            {onChainCommitments.length === 0 ? (
              <div className="rounded-lg border border-dashed border-outline-variant py-10 text-center text-xs text-outline">
                No commitments yet. Register a loan to see the on-chain record.
              </div>
            ) : (
              <div className="divide-y divide-outline-variant max-h-56 overflow-y-auto">
                {onChainCommitments.map((item, idx) => (
                  <div key={item.txHash + idx} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0 space-y-0.5">
                      <p className="font-mono text-xs font-bold text-primary truncate">
                        {item.commitment.substring(0, 22)}…
                      </p>
                      <p className="font-mono text-2xs text-outline truncate">
                        {item.timestamp}
                      </p>
                    </div>
                    <button
                      onClick={() => copy(item.commitment, `c_${idx}`)}
                      className="shrink-0 rounded-md border border-outline-variant px-2.5 py-1 text-2xs font-semibold text-on-surface-v hover:bg-surface-container transition"
                    >
                      {copied === `c_${idx}` ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Result panel ───────────────────────────────────────────── */}
        <div className="lg:col-span-5 space-y-5">
          {/* Latest disbursement result */}
          <div className="rounded-xl border border-primary-c bg-primary p-6 text-on-primary shadow-card-md">
            <div className="flex items-center justify-between mb-5">
              <span className="text-xs font-bold uppercase tracking-wider text-primary-dim">
                Latest result
              </span>
              <span className="font-mono text-2xs text-primary-dim/70">
                {lastIssuedResult?.timestamp ?? '—'}
              </span>
            </div>

            {lastIssuedResult ? (
              <div className="space-y-4">
                {/* Amount summary */}
                <div className="rounded-lg bg-black/25 p-4 border border-white/10">
                  <p className="text-xs font-semibold text-primary-dim mb-0.5">Disbursed &amp; committed</p>
                  <p className="text-2xl font-bold text-white">
                    ₹{lastIssuedResult.amount.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-primary-dim/90 mt-0.5">
                    Lender: <strong className="text-white">{lastIssuedResult.lenderName}</strong>
                  </p>
                </div>

                {/* Commitment hash */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-2xs font-bold uppercase tracking-wider text-primary-dim/90">
                      On-chain commitment (public)
                    </span>
                    <button
                      onClick={() => copy(lastIssuedResult.commitment, 'res_comm')}
                      className="text-2xs font-semibold text-primary-dim hover:text-white transition"
                    >
                      {copied === 'res_comm' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="rounded-lg bg-black/30 border border-white/10 px-3 py-2.5 font-mono text-xs text-primary-dim break-all select-all">
                    {lastIssuedResult.commitment}
                  </div>
                </div>

                {/* Nonce output */}
                <div className="rounded-lg border border-amber-400/40 bg-amber-950/40 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                      Loan nonce — hand to borrower
                    </span>
                    <button
                      onClick={() => copy(lastIssuedResult.nonce, 'res_nonce')}
                      className="rounded-md border border-amber-400/40 bg-amber-500/20 px-2.5 py-1 text-2xs font-bold text-amber-200 hover:bg-amber-500/30 transition"
                    >
                      {copied === 'res_nonce' ? 'Copied' : 'Copy nonce'}
                    </button>
                  </div>
                  <div className="rounded-md bg-black/50 border border-amber-500/20 px-3 py-2 font-mono text-xs text-amber-200 break-all select-all">
                    {lastIssuedResult.nonce}
                  </div>
                  <p className="mt-2 text-2xs text-amber-300/80 leading-relaxed">
                    Wave 1 (PRD §8.1): The borrower pastes this nonce in their vault to bind the loan to their private witness.
                  </p>
                </div>

                {/* CTA */}
                <button
                  onClick={() => setActiveTab('borrower')}
                  className="w-full rounded-lg border border-white/20 bg-white/10 py-2.5 text-sm font-bold text-white hover:bg-white/20 transition"
                >
                  Continue to Borrower Vault
                </button>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-primary-dim/60">
                Register a loan to see the cryptographic result here.
              </div>
            )}
          </div>

          {/* Privacy note */}
          <div className="rounded-xl border border-outline-variant bg-surface-bright p-6 shadow-card">
            <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-v mb-3">
              Dual-Ledger Privacy Guarantee
            </h4>
            <p className="text-xs text-on-surface-v leading-relaxed">
              On Midnight, registering a loan publishes only a 32-byte commitment hash. No loan amount, no
              borrower identity, and no lender name is written to the public chain — only the hash that
              proves the loan exists without revealing its contents.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
