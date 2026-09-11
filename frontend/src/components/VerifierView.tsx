'use client';

import React, { useState } from 'react';
import { useVantageStore } from '@/lib/store';
import { ZkProofResult } from '@/lib/types';

export const VerifierView: React.FC = () => {
  const {
    lastGeneratedProof,
    verifyProof,
    onChainCommitments,
    onChainNullifiers,
    onChainPortfolioRoots,
    borrowerId,
    borrowerName,
  } = useVantageStore();

  const [customProofJson, setCustomProofJson] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<{
    status: 'idle' | 'verified' | 'failed';
    reason?: string;
    verifiedAt?: string;
  }>({ status: 'idle' });

  const activeProof: ZkProofResult | null = customProofJson
    ? (() => { try { return JSON.parse(customProofJson) as ZkProofResult; } catch { return null; } })()
    : lastGeneratedProof;

  const handleVerify = async () => {
    if (!activeProof) return;
    setIsVerifying(true);
    try {
      const res = await verifyProof(activeProof);
      setResult({
        status: res.isValid ? 'verified' : 'failed',
        reason: res.reason,
        verifiedAt: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="mx-auto max-w-container px-4 py-8 sm:px-6">
      {/* ── Page header ──────────────────────────────────────────── */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
          Verifying Lender
        </p>
        <h2 className="text-2xl font-bold text-on-surface sm:text-3xl">
          Check a Proof
        </h2>
        <p className="mt-1 text-sm text-on-surface-v max-w-2xl">
          Evaluate a borrower&apos;s zero-knowledge proof against the Midnight blockchain. You receive a
          pass or fail — no loan amounts, lender names, or personal data are ever shared with you.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* ── Left: Proof input + verify ───────────────────────────── */}
        <div className="lg:col-span-7 space-y-5">
          <div className="rounded-xl border border-outline-variant bg-surface-bright p-6 shadow-card">
            <h3 className="text-sm font-bold text-on-surface-v uppercase tracking-wider mb-5">
              Proof Package
            </h3>

            {activeProof ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-surface-container border border-outline-variant divide-y divide-outline-variant overflow-hidden">
                  <Row label="Proof ID" value={<span className="font-mono text-2xs break-all">{activeProof.proofId}</span>} />
                  <Row label="Borrower" value={<span className="font-mono text-xs font-bold">{borrowerName}</span>} />
                  <Row
                    label="Claimed threshold"
                    value={
                      <span className="rounded-md bg-primary-light px-2 py-0.5 text-2xs font-bold text-primary">
                        &le;{activeProof.maxLenderCount} lenders · &le;₹{activeProof.maxTotalExposure.toLocaleString('en-IN')}
                      </span>
                    }
                  />
                  <Row
                    label="Generated at"
                    value={<span className="font-mono text-2xs">{activeProof.generatedAt}</span>}
                  />
                </div>

                <div>
                  <p className="text-2xs font-bold uppercase tracking-wider text-outline mb-1.5">
                    Portfolio accumulator root
                  </p>
                  <div className="rounded-lg border border-outline-variant bg-surface-container px-3 py-2.5 font-mono text-2xs text-on-surface break-all select-all">
                    {activeProof.portfolioRoot}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isVerifying}
                  onClick={handleVerify}
                  className="w-full rounded-lg bg-primary py-3 text-sm font-bold text-on-primary shadow-card transition hover:bg-primary-c disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isVerifying ? (
                    <>
                      <span className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent spin" />
                      Verifying on Midnight…
                    </>
                  ) : (
                    'Verify Cryptographic Proof'
                  )}
                </button>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-outline-variant py-12 text-center text-xs text-outline space-y-1">
                <p className="font-semibold">No proof loaded</p>
                <p>Switch to the Borrower view to generate a proof, or paste proof JSON below.</p>
              </div>
            )}

            {/* Manual JSON input */}
            <div className="mt-6 pt-5 border-t border-outline-variant">
              <label className="block text-xs font-semibold text-on-surface-v mb-1.5">
                Paste proof JSON (optional)
              </label>
              <textarea
                rows={4}
                placeholder='{"proofId": "…", "portfolioRoot": "…", "publicTranscript": "…"}'
                value={customProofJson}
                onChange={(e) => setCustomProofJson(e.target.value)}
                className="w-full rounded-lg border border-outline-variant bg-surface-container px-3 py-2.5 font-mono text-xs text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
          </div>

          {/* On-chain state summary */}
          <div className="rounded-xl border border-outline-variant bg-surface-bright p-6 shadow-card">
            <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-v mb-4">
              On-Chain Ledger State
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-surface-container px-4 py-3 text-center">
                <p className="font-mono text-xl font-bold text-primary">{onChainCommitments.length}</p>
                <p className="text-2xs font-semibold text-outline mt-0.5">Loan commitments</p>
              </div>
              <div className="rounded-lg bg-surface-container px-4 py-3 text-center">
                <p className="font-mono text-xl font-bold text-on-surface">{onChainNullifiers.length}</p>
                <p className="text-2xs font-semibold text-outline mt-0.5">Nullifiers (repaid)</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Result + disclosure matrix ───────────────────── */}
        <div className="lg:col-span-5 space-y-5">
          {/* Verification result */}
          <div className="rounded-xl border border-outline-variant bg-surface-bright p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-on-surface">Verification Status</h3>
              {result.verifiedAt && (
                <span className="font-mono text-2xs text-outline">{result.verifiedAt}</span>
              )}
            </div>

            {result.status === 'verified' && (
              <div className="rounded-xl border-2 border-primary bg-primary-light p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-on-primary shrink-0">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-base font-extrabold text-primary">Compliance Verified</p>
                    <p className="text-xs font-semibold text-primary/70">Zero-knowledge soundness confirmed</p>
                  </div>
                </div>

                <div className="rounded-lg bg-white border border-primary/20 divide-y divide-primary/10 overflow-hidden text-xs">
                  <Row label="Regulatory status"
                    value={<span className="rounded bg-primary-light px-2 py-0.5 font-bold text-primary">Eligible for credit</span>} />
                  <Row label="Active lender cap" value={<span className="font-bold">&le; 2 institutions</span>} />
                  <Row label="Total exposure cap" value={<span className="font-bold">&le; ₹1,00,000 INR</span>} />
                  <Row label="Ledger consistency" value={<span className="font-bold text-primary">Verified on-chain</span>} />
                </div>

                <p className="text-xs text-primary/80 leading-relaxed">
                  The borrower has mathematically proven compliance with RBI microfinance exposure caps.
                  No personal data was disclosed during this verification.
                </p>
              </div>
            )}

            {result.status === 'failed' && (
              <div className="rounded-xl border-2 border-error bg-error-container p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-error flex items-center justify-center text-white shrink-0">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-base font-extrabold text-error">Verification Rejected</p>
                    <p className="text-xs font-semibold text-error/70">Constraint or ledger mismatch</p>
                  </div>
                </div>
                <p className="rounded-lg border border-error/20 bg-white px-4 py-3 font-mono text-xs text-error leading-relaxed">
                  {result.reason}
                </p>
              </div>
            )}

            {result.status === 'idle' && (
              <div className="py-10 text-center text-xs text-outline">
                Load a proof and click &ldquo;Verify Cryptographic Proof&rdquo; to audit against Midnight ledger state.
              </div>
            )}
          </div>

          {/* Privacy disclosure matrix */}
          <div className="rounded-xl border border-outline-variant bg-surface-bright p-6 shadow-card">
            <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-v mb-4">
              Information Disclosure
            </h4>
            <div className="divide-y divide-outline-variant text-xs">
              <DisclosureRow label="Borrower Aadhaar / name" disclosed={false} />
              <DisclosureRow label="Individual loan amounts" disclosed={false} />
              <DisclosureRow label="Lender identities" disclosed={false} />
              <DisclosureRow label="Regulatory compliance result" disclosed={true} public />
            </div>
            <p className="mt-4 text-2xs text-outline leading-relaxed">
              Loan details are never shared with verifiers — only a mathematical yes/no result is produced.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Small shared sub-components ────────────────────────────────── */

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 gap-4 text-xs">
      <span className="text-on-surface-v font-semibold shrink-0">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

function DisclosureRow({ label, disclosed, public: isPub }: { label: string; disclosed: boolean; public?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 text-xs">
      <span className="text-on-surface-v">{label}</span>
      {disclosed ? (
        <span className="rounded-md bg-primary-light px-2.5 py-0.5 font-bold text-primary text-2xs">
          {isPub ? 'Public (math result)' : 'Disclosed'}
        </span>
      ) : (
        <span className="rounded-md bg-surface-high px-2.5 py-0.5 font-bold text-outline text-2xs">
          Private (not disclosed)
        </span>
      )}
    </div>
  );
}
