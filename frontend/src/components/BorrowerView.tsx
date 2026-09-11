'use client';

import React, { useState } from 'react';
import { useVantageStore } from '@/lib/store';
import { LoanStatus } from '@/lib/types';

const LENDERS = [
  'Bandhan MFI',
  'Fusion Microfinance',
  'CreditAccess Grameen',
  'Muthoot Microfin',
  'Arohan Financial',
];

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

  const [lenderName, setLenderName] = useState('Bandhan MFI');
  const [amount, setAmount] = useState(35000);
  const [nonce, setNonce] = useState('');
  const [maxLenders, setMaxLenders] = useState(2);
  const [maxAmount, setMaxAmount] = useState(100000);
  const [proofError, setProofError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const activeLoans = privateLoans.filter((l) => l.status === LoanStatus.ACTIVE);
  const totalExposure = activeLoans.reduce((s, l) => s + Number(l.amount), 0);
  const lenderCount = activeLoans.length;
  const withinLimits = lenderCount <= maxLenders && totalExposure <= maxAmount;

  const exposurePct = Math.min((totalExposure / maxAmount) * 100, 100);
  const lenderPct = Math.min((lenderCount / maxLenders) * 100, 100);

  const handleImportFromIssuer = () => {
    if (lastIssuedResult) {
      setLenderName(lastIssuedResult.lenderName);
      setAmount(lastIssuedResult.amount);
      setNonce(lastIssuedResult.nonce);
    }
  };

  const handlePasteNonce = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim().startsWith('0x') && text.trim().length === 66) {
        setNonce(text.trim());
      }
    } catch { /* permission denied — ignore */ }
  };

  const handleAddLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nonce) return;
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

  const handleCopyProof = () => {
    if (!lastGeneratedProof) return;
    navigator.clipboard.writeText(JSON.stringify(lastGeneratedProof, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-container px-4 py-8 sm:px-6">
      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
          Borrower
        </p>
        <h2 className="text-2xl font-bold text-on-surface sm:text-3xl">Prove Your Exposure</h2>
        <p className="mt-1 text-sm text-on-surface-v max-w-2xl">
          Your loan details are stored only in your browser. Generate a zero-knowledge proof that you are
          within regulatory limits — without revealing which lenders you have or how much you owe.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* ── Left: Private vault ──────────────────────────────────────── */}
        <div className="lg:col-span-7 space-y-5">

          {/* Portfolio summary */}
          <div className="card shadow-card">
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="text-2xs font-semibold uppercase tracking-wider text-outline mb-0.5">
                  Private — only you can see this
                </p>
                <h3 className="text-base font-bold text-on-surface">{borrowerName}</h3>
              </div>
              <span className="rounded-full border border-primary/30 bg-primary-light px-2.5 py-1 text-2xs font-bold text-primary">
                Vault encrypted
              </span>
            </div>

            {/* Exposure meters */}
            <div className="mt-5 grid grid-cols-2 gap-4">
              {/* Lenders */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-semibold text-on-surface-v">Active lenders</span>
                  <span className={`font-mono font-bold ${lenderCount > maxLenders ? 'text-error' : 'text-on-surface'}`}>
                    {lenderCount} / {maxLenders}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-surface-high overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${lenderCount > maxLenders ? 'bg-error' : 'bg-primary'}`}
                    style={{ width: `${lenderPct}%` }}
                  />
                </div>
              </div>
              {/* Amount */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-semibold text-on-surface-v">Total exposure</span>
                  <span className={`font-mono font-bold ${totalExposure > maxAmount ? 'text-error' : 'text-on-surface'}`}>
                    ₹{totalExposure.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-surface-high overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${totalExposure > maxAmount ? 'bg-error' : 'bg-primary'}`}
                    style={{ width: `${exposurePct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Loan list */}
          <div className="card shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-on-surface-v uppercase tracking-wider">
                Private Loan Records ({privateLoans.length})
              </h3>
              {lastIssuedResult && (
                <button
                  onClick={handleImportFromIssuer}
                  className="text-2xs font-semibold text-primary hover:underline"
                >
                  Import last issued loan
                </button>
              )}
            </div>

            {privateLoans.length === 0 ? (
              <div className="rounded-lg border border-dashed border-outline-variant py-10 text-center text-xs text-outline">
                Your vault is empty. Add a loan using the form below, or use a Quick Test scenario.
              </div>
            ) : (
              <div className="divide-y divide-outline-variant rounded-lg border border-outline-variant overflow-hidden">
                {privateLoans.map((loan) => (
                  <div
                    key={loan.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-bright px-4 py-3 hover:bg-surface-low transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-on-surface truncate">{loan.lender_name}</span>
                        {loan.status === LoanStatus.ACTIVE ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary-light px-2 py-0.5 text-2xs font-bold text-primary">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                            Active
                          </span>
                        ) : (
                          <span className="rounded-full bg-surface-high px-2 py-0.5 text-2xs font-bold text-outline">
                            Repaid
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 font-mono text-xs text-outline">
                        <span>₹{Number(loan.amount).toLocaleString('en-IN')}</span>
                        <span>·</span>
                        <span className="truncate max-w-[120px]">nonce: {loan.nonce.substring(0, 10)}…</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {loan.status === LoanStatus.ACTIVE && (
                        <button
                          onClick={() => repayAndCloseLoan(loan)}
                          className="rounded-md border border-primary/30 bg-primary-light px-2.5 py-1 text-2xs font-bold text-primary hover:bg-primary-dim/20 transition"
                        >
                          Repay &amp; Close
                        </button>
                      )}
                      <button
                        onClick={() => removePrivateLoan(loan.id)}
                        className="rounded-md p-1.5 text-outline hover:bg-error-container hover:text-error transition"
                        title="Remove"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add loan form */}
          <div className="card shadow-card">
            <h3 className="text-sm font-bold text-on-surface-v uppercase tracking-wider mb-1">
              Add Loan to Private Vault
            </h3>
            <p className="text-xs text-outline mb-5">
              Enter the loan details and the secret nonce provided by the issuing institution.
              Nothing is sent over the network.
            </p>

            <form onSubmit={handleAddLoan} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-v mb-1.5">
                    Lender
                  </label>
                  <select
                    value={lenderName}
                    onChange={(e) => setLenderName(e.target.value)}
                    className="w-full rounded-lg border border-outline-variant bg-surface-bright px-3 py-2.5 text-sm text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    {LENDERS.map((l) => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-v mb-1.5">
                    Amount (INR)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-sm font-bold text-outline">₹</span>
                    <input
                      type="number"
                      min={1000}
                      step={1000}
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full rounded-lg border border-outline-variant bg-surface-bright pl-7 pr-3 py-2.5 font-mono text-sm font-bold text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Nonce */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-on-surface-v">
                    Loan Nonce (32-byte hex from issuer)
                  </label>
                  <button type="button" onClick={handlePasteNonce} className="text-2xs font-semibold text-primary hover:underline">
                    Paste from clipboard
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="0x…"
                  value={nonce}
                  onChange={(e) => setNonce(e.target.value)}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container px-3 py-2.5 font-mono text-xs text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg border border-outline-variant bg-surface-container py-2.5 text-sm font-bold text-on-surface hover:bg-surface-high transition"
              >
                Add to Private Witness
              </button>
            </form>
          </div>
        </div>

        {/* ── Right: ZK Proof generator ──────────────────────────────────── */}
        <div className="lg:col-span-5 space-y-5">
          <div className="card shadow-card">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-on-surface">ZK Proof Generator</h3>
              <span className="rounded-md bg-surface-container px-2.5 py-1 font-mono text-2xs font-bold text-on-surface-v">
                Compact 0.31.1
              </span>
            </div>

            {/* Thresholds */}
            <div className="rounded-lg bg-surface-container border border-outline-variant p-4 mb-5">
              <p className="text-2xs font-bold uppercase tracking-wider text-on-surface-v mb-3">
                RBI Regulatory Limits
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-semibold text-outline mb-1.5">Max lenders</label>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    value={maxLenders}
                    onChange={(e) => setMaxLenders(Number(e.target.value))}
                    className="w-full rounded-lg border border-outline-variant bg-surface-bright px-3 py-2 font-mono text-sm font-bold text-on-surface outline-none focus:border-primary"
                  />
                  <p className="text-2xs text-outline mt-1">Default: 2</p>
                </div>
                <div>
                  <label className="block text-2xs font-semibold text-outline mb-1.5">Cap (₹)</label>
                  <input
                    type="number"
                    step={5000}
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(Number(e.target.value))}
                    className="w-full rounded-lg border border-outline-variant bg-surface-bright px-3 py-2 font-mono text-sm font-bold text-on-surface outline-none focus:border-primary"
                  />
                  <p className="text-2xs text-outline mt-1">Default: ₹1,00,000</p>
                </div>
              </div>
            </div>

            {/* Generate button */}
            <button
              type="button"
              disabled={isGeneratingProof}
              onClick={handleGenerateProof}
              className={[
                'w-full rounded-lg py-3 text-sm font-bold text-on-primary shadow-card transition disabled:opacity-50 flex items-center justify-center gap-2',
                withinLimits ? 'bg-primary hover:bg-primary-c' : 'bg-error hover:bg-error/90',
              ].join(' ')}
            >
              {isGeneratingProof ? (
                <>
                  <span className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent spin" />
                  Synthesizing proof…
                </>
              ) : (
                'Generate ZK Compliance Proof'
              )}
            </button>

            {/* Proof progress */}
            {isGeneratingProof && proofProgressStep && (
              <div className="mt-4 rounded-lg border border-primary/30 bg-primary-light px-4 py-3 text-xs text-primary animate-proof">
                <p className="font-bold mb-0.5">Prover pipeline running</p>
                <p className="font-mono text-2xs">{proofProgressStep}</p>
                <p className="text-2xs text-primary/70 mt-1">
                  Zero-knowledge proof runs entirely on your device — no loan data is sent anywhere.
                </p>
              </div>
            )}

            {/* Error */}
            {proofError && (
              <div className="mt-4 rounded-lg border border-error/30 bg-error-container p-4 text-xs text-error space-y-1.5">
                <p className="font-bold">Proof rejected — circuit constraint failed</p>
                <p className="font-mono text-2xs leading-relaxed">{proofError}</p>
              </div>
            )}

            {/* Result */}
            {lastGeneratedProof && !proofError && (
              <div className="mt-5 rounded-xl bg-primary p-5 text-on-primary space-y-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-bold text-primary-dim">
                    <span className="h-2 w-2 rounded-full bg-primary-dim animate-proof" />
                    ZK Proof Synthesized
                  </span>
                  <span className="font-mono text-2xs text-primary-dim/70">
                    {lastGeneratedProof.generatedAt}
                  </span>
                </div>

                {/* Telemetry */}
                <div className="rounded-lg bg-black/25 px-4 py-3 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-primary-dim/80">
                    <span>Stage 1 — WASM ZKIR</span>
                    <strong className="text-primary-dim">{lastGeneratedProof.stage1LatencyMs} ms</strong>
                  </div>
                  <div className="flex justify-between text-primary-dim/80">
                    <span>Stage 2 — Proof server</span>
                    {lastGeneratedProof.stage2LatencyMs !== null ? (
                      <strong className="text-primary-dim">{lastGeneratedProof.stage2LatencyMs} ms</strong>
                    ) : (
                      <span className="text-amber-300 text-2xs">Standalone mode (Docker offline)</span>
                    )}
                  </div>
                  <div className="border-t border-white/10 pt-2 flex justify-between font-bold">
                    <span className="text-white">Total latency</span>
                    <span className="text-white">{lastGeneratedProof.totalLatencyMs} ms</span>
                  </div>
                  <div className="border-t border-white/10 pt-2 space-y-1 text-primary-dim/70">
                    <div className="flex justify-between">
                      <span>Proof envelope</span>
                      <span className="text-primary-dim">{lastGeneratedProof.proofEnvelopeType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Constraints evaluated</span>
                      <span className="text-white">{lastGeneratedProof.evaluatedConstraintsCount} (0 violations)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Threshold proven</span>
                      <span className="text-white">
                        &le;{lastGeneratedProof.maxLenderCount} lenders · &le;₹{lastGeneratedProof.maxTotalExposure.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Proof ID */}
                <div className="space-y-1 text-xs font-mono">
                  <p className="text-2xs font-bold uppercase tracking-wider text-primary-dim/70">Proof reference ID</p>
                  <div className="rounded-md bg-black/30 px-3 py-2 text-primary-dim break-all select-all text-2xs">
                    {lastGeneratedProof.proofId}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyProof}
                    className="flex-1 rounded-lg border border-white/20 bg-white/10 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition"
                  >
                    {copied ? 'Copied' : 'Copy proof package'}
                  </button>
                  <button
                    onClick={() => setActiveTab('verifier')}
                    className="flex-1 rounded-lg bg-primary-dim py-2.5 text-xs font-bold text-primary hover:bg-primary-dim/80 transition"
                  >
                    Submit to Verifier
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Proof history placeholder (no emojis) */}
          {!lastGeneratedProof && (
            <div className="card shadow-card text-center py-8">
              <p className="text-xs text-outline mb-1 font-semibold">No proof generated yet</p>
              <p className="text-2xs text-outline/70">
                Add loans to your vault, then click &ldquo;Generate ZK Compliance Proof&rdquo; above.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
