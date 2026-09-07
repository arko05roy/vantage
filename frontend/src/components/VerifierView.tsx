'use client';

import React, { useState } from 'react';
import { useVantageStore } from '@/lib/store';
import {
  CheckCircle2,
  ShieldCheck,
  FileSearch,
  AlertTriangle,
  Lock,
  EyeOff,
  Check,
  RefreshCw,
  ExternalLink,
  Cpu,
} from 'lucide-react';
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

  const [customProofJson, setCustomProofJson] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<{
    status: 'idle' | 'verified' | 'failed';
    reason?: string;
    verifiedAt?: string;
  }>({ status: 'idle' });

  const activeProof = customProofJson
    ? (() => {
        try {
          return JSON.parse(customProofJson) as ZkProofResult;
        } catch {
          return null;
        }
      })()
    : lastGeneratedProof;

  const handleVerify = async () => {
    if (!activeProof) return;
    setIsVerifying(true);
    try {
      const res = await verifyProof(activeProof);
      if (res.isValid) {
        setVerificationResult({
          status: 'verified',
          verifiedAt: new Date().toLocaleTimeString(),
        });
      } else {
        setVerificationResult({
          status: 'failed',
          reason: res.reason || 'Cryptographic proof failed verification on-chain',
          verifiedAt: new Date().toLocaleTimeString(),
        });
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const currentOnChainRoot = onChainPortfolioRoots.get(borrowerId);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
      {/* Title & Context */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs uppercase tracking-wider">
          <CheckCircle2 className="h-4 w-4" />
          MFI Credit Officer & Regulator Verification Portal
        </div>
        <h2 className="font-headline text-3xl font-bold tracking-tight text-slate-900 mt-1">
          Zero-Knowledge Proof Verification
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Evaluate the borrower&apos;s cryptographic proof against the Midnight blockchain. Confirm regulatory limit compliance without having access to the borrower&apos;s loan history or sensitive financial PII.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Proof Verification Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <h3 className="font-headline text-lg font-bold text-slate-900 mb-2 flex items-center justify-between">
              <span>Incoming Zero-Knowledge Proof Package</span>
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md">
                Ledger Verifier
              </span>
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Load the borrower&apos;s proof package from their local vault or paste raw proof JSON.
            </p>

            {activeProof ? (
              <div className="space-y-4">
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
                  <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200/60">
                    <span className="text-slate-500 font-semibold">Proof Identifier:</span>
                    <span className="font-mono font-bold text-emerald-950">{activeProof.proofId}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200/60">
                    <span className="text-slate-500 font-semibold">Target Borrower:</span>
                    <span className="font-mono font-bold text-slate-800">{borrowerName}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200/60">
                    <span className="text-slate-500 font-semibold">Claimed Compliance Threshold:</span>
                    <span className="font-mono font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                      &le; {activeProof.maxLenderCount} Lenders &bull; &le; ₹{activeProof.maxTotalExposure.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      Portfolio Accumulator Root
                    </span>
                    <div className="font-mono text-xs text-slate-800 bg-white p-2 rounded border border-slate-200 break-all select-all">
                      {activeProof.portfolioRoot}
                    </div>
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      Public Transcript Signature
                    </span>
                    <div className="font-mono text-xs text-slate-700 bg-white p-2 rounded border border-slate-200 break-all select-all">
                      {activeProof.publicTranscript}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isVerifying}
                  onClick={handleVerify}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-950 px-6 py-3.5 text-sm font-bold text-white shadow-md hover:from-emerald-700 hover:to-emerald-900 transition disabled:opacity-50"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Verifying Proof on Midnight Dual-Ledger...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4 text-emerald-300" />
                      Verify Cryptographic Proof
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400 space-y-2">
                <FileSearch className="h-8 w-8 mx-auto text-slate-300" />
                <p>No proof package loaded. Switch to Borrower Vault to generate a proof or paste proof JSON below.</p>
              </div>
            )}

            {/* Custom Proof JSON Input */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Manual Proof Package Input (Optional JSON Override)
              </label>
              <textarea
                rows={3}
                placeholder='{"proofId": "...", "portfolioRoot": "...", "publicTranscript": "..."}'
                value={customProofJson}
                onChange={(e) => setCustomProofJson(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-xs font-mono text-slate-700 focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Verification Results & Audit Transparency */}
        <div className="lg:col-span-5 space-y-6">
          {/* Result Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <h3 className="font-headline text-base font-bold text-slate-900 mb-4 flex items-center justify-between">
              <span>Verification Status</span>
              <span className="text-xs font-mono text-slate-400">
                {verificationResult.verifiedAt || 'Awaiting Check'}
              </span>
            </h3>

            {verificationResult.status === 'verified' && (
              <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50/80 p-5 text-emerald-950 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md">
                    <Check className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-headline text-lg font-extrabold text-emerald-950">
                      COMPLIANCE VERIFIED
                    </div>
                    <div className="text-xs font-semibold text-emerald-800">
                      Zero-Knowledge Soundness Confirmed
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-white/90 border border-emerald-200 p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-semibold text-emerald-900">
                    <span>Regulatory Status:</span>
                    <span className="rounded bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800">
                      ELIGIBLE FOR CREDIT
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Active Lenders Cap:</span>
                    <span className="font-bold text-slate-900">&le; 2 Institutions</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Total Exposure Cap:</span>
                    <span className="font-bold text-slate-900">&le; ₹1,00,000 INR</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>On-Chain Consistency:</span>
                    <span className="font-bold text-emerald-700">100% Matching Ledger</span>
                  </div>
                </div>

                <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                  The borrower has mathematically proven compliance with RBI microfinance exposure caps. No PII was disclosed during this verification.
                </p>
              </div>
            )}

            {verificationResult.status === 'failed' && (
              <div className="rounded-2xl border-2 border-rose-400 bg-rose-50 p-5 text-rose-950 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-600 text-white shadow-md">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-headline text-lg font-extrabold text-rose-950">
                      VERIFICATION REJECTED
                    </div>
                    <div className="text-xs font-semibold text-rose-700">
                      Constraint or Ledger Mismatch
                    </div>
                  </div>
                </div>

                <p className="font-mono text-xs text-rose-800 bg-white/80 p-3 rounded-lg border border-rose-200 font-semibold leading-relaxed">
                  {verificationResult.reason}
                </p>
              </div>
            )}

            {verificationResult.status === 'idle' && (
              <div className="py-8 text-center text-slate-400 text-xs">
                Click &quot;Verify Cryptographic Proof&quot; to audit the proof against Midnight ledger state.
              </div>
            )}
          </div>

          {/* Privacy Audit Transparency Matrix */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <EyeOff className="h-4 w-4 text-emerald-700" />
              Information Disclosure Audit
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">Borrower Aadhaar / Name</span>
                <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  0 Revealed (Private)
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">Individual Loan Amounts</span>
                <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  0 Revealed (Private)
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">Lender Identities & Locations</span>
                <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  0 Revealed (Private)
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-600">Regulatory Compliance Fact</span>
                <span className="font-mono font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded">
                  Mathematical Truth (Public)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
