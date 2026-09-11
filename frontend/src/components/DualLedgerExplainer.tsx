'use client';

import React from 'react';
import { useVantageStore } from '@/lib/store';
import { LoanStatus } from '@/lib/types';

const STEPS = [
  {
    number: '01',
    actor: 'Lending Institution',
    action: 'Register a loan',
    detail:
      'The MFI disburses a loan and calls the Compact circuit. The circuit writes a 32-byte SHA-256 commitment of (borrowerId, amount, nonce) to Midnight\'s public ledger. Nothing else — no name, no amount — is ever on-chain.',
  },
  {
    number: '02',
    actor: 'Borrower',
    action: 'Build private witness',
    detail:
      'The borrower receives the secret nonce from the institution and adds the loan locally to their browser vault. The vault accumulates all loans into a portfolio root using a folded hash. This data never leaves the device.',
  },
  {
    number: '03',
    actor: 'Borrower',
    action: 'Generate ZK proof',
    detail:
      'The Compact circuit (compiled to WASM) evaluates constraints: active_loan_count ≤ threshold_count AND total_exposure ≤ threshold_amount. If both pass, it produces a proof envelope that certifies compliance without revealing any individual loan value.',
  },
  {
    number: '04',
    actor: 'Verifying Lender',
    action: 'Check proof',
    detail:
      'The verifier receives the proof ID and checks it against the on-chain accumulator root. They receive only a yes/no — compliant or non-compliant. No loan amounts, lender names, or PII is disclosed at any point.',
  },
];

export const DualLedgerExplainer: React.FC = () => {
  const { borrowerId, privateLoans, onChainCommitments, onChainNullifiers, onChainPortfolioRoots } =
    useVantageStore();

  const currentRoot = onChainPortfolioRoots.get(borrowerId);
  const activeLoans = privateLoans.filter((l) => l.status === LoanStatus.ACTIVE);

  return (
    <div className="mx-auto max-w-container px-4 py-8 sm:px-6">
      {/* ── Page header ──────────────────────────────────────────── */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
          Architecture
        </p>
        <h2 className="text-2xl font-bold text-on-surface sm:text-3xl">How Vantage Works</h2>
        <p className="mt-1 text-sm text-on-surface-v max-w-2xl">
          Midnight splits state into two realms: a public ledger (hashes only) and a private local
          witness (loan details on your device). Zero-knowledge circuits bridge them — you can prove
          compliance without disclosing anything.
        </p>
      </div>

      {/* ── Two-ledger diagram ────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-8">
        {/* Public ledger */}
        <div className="card border-primary/30 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-on-surface">Public Ledger</h3>
            <span className="rounded-md bg-primary-light px-2.5 py-1 text-2xs font-bold text-primary">
              On-chain · Visible to all
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {/* Commitments */}
            <div className="rounded-lg bg-surface-container border border-outline-variant p-3">
              <div className="flex justify-between text-on-surface-v font-bold text-2xs mb-2 uppercase tracking-wider">
                <span>loan_commitments</span>
                <span className="text-primary">{onChainCommitments.length}</span>
              </div>
              {onChainCommitments.length === 0 ? (
                <span className="text-outline text-2xs">[ empty ]</span>
              ) : (
                <div className="space-y-1 max-h-20 overflow-y-auto">
                  {onChainCommitments.map((c, i) => (
                    <div key={i} className="text-2xs text-primary truncate">
                      {c.commitment.substring(0, 24)}…
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Nullifiers */}
            <div className="rounded-lg bg-surface-container border border-outline-variant p-3">
              <div className="flex justify-between text-on-surface-v font-bold text-2xs mb-2 uppercase tracking-wider">
                <span>loan_nullifiers</span>
                <span className="text-on-surface">{onChainNullifiers.length}</span>
              </div>
              {onChainNullifiers.length === 0 ? (
                <span className="text-outline text-2xs">[ empty ]</span>
              ) : (
                <div className="space-y-1 max-h-16 overflow-y-auto">
                  {onChainNullifiers.map((n, i) => (
                    <div key={i} className="text-2xs text-on-surface-v truncate">{n.nullifier.substring(0, 24)}…</div>
                  ))}
                </div>
              )}
            </div>

            {/* Portfolio root */}
            <div className="rounded-lg bg-surface-container border border-outline-variant p-3">
              <div className="text-on-surface-v font-bold text-2xs mb-2 uppercase tracking-wider">
                borrower_portfolio_root
              </div>
              {currentRoot ? (
                <div className="text-2xs text-primary break-all">{currentRoot}</div>
              ) : (
                <span className="text-outline text-2xs">[ not yet set ]</span>
              )}
            </div>
          </div>
        </div>

        {/* Private ledger */}
        <div className="card border-outline-variant shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-on-surface">Private Witness</h3>
            <span className="rounded-md bg-surface-high px-2.5 py-1 text-2xs font-bold text-outline">
              Off-chain · Only on your device
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="rounded-lg bg-surface-container border border-outline-variant p-3">
              <div className="text-on-surface-v font-bold text-2xs mb-2 uppercase tracking-wider">
                private_loans ({activeLoans.length} active)
              </div>
              {activeLoans.length === 0 ? (
                <span className="text-outline text-2xs">[ no active loans ]</span>
              ) : (
                <div className="space-y-1.5">
                  {activeLoans.map((l, i) => (
                    <div key={l.id} className="text-2xs text-on-surface-v">
                      <span className="font-semibold text-on-surface">{l.lender_name}</span>
                      &nbsp;·&nbsp;₹{Number(l.amount).toLocaleString('en-IN')}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <p className="text-amber-800 text-2xs font-bold uppercase tracking-wider mb-1.5">
                Loan amounts — never on-chain
              </p>
              <p className="text-amber-700 text-2xs leading-relaxed">
                The actual figures exist only here, in your browser&apos;s in-memory state. The ZK
                circuit reads them to prove compliance, but publishes only a root hash.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Step-by-step flow ─────────────────────────────────────── */}
      <div className="card shadow-card mb-6">
        <h3 className="text-sm font-bold text-on-surface-v uppercase tracking-wider mb-6">
          End-to-End Flow
        </h3>
        <div className="space-y-0">
          {STEPS.map((step, idx) => (
            <div key={step.number} className="relative flex gap-5">
              {/* Vertical line */}
              {idx < STEPS.length - 1 && (
                <div className="absolute left-5 top-10 bottom-0 w-px bg-outline-variant" />
              )}
              <div className="shrink-0 h-10 w-10 rounded-full border-2 border-primary bg-primary-light flex items-center justify-center font-mono text-xs font-bold text-primary z-10">
                {step.number}
              </div>
              <div className="pb-8 min-w-0">
                <p className="text-2xs font-bold uppercase tracking-wider text-outline mb-0.5">
                  {step.actor}
                </p>
                <p className="text-sm font-bold text-on-surface mb-1">{step.action}</p>
                <p className="text-xs text-on-surface-v leading-relaxed">{step.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tech spec ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'ZK Circuit', value: 'Midnight Compact 0.31.1', note: 'Compiled to WASM' },
          { label: 'Runtime', value: '@midnight-ntwrk/compact-runtime 0.16.0', note: 'ZKIR simulation + Stage 1 execution' },
          { label: 'Proof server', value: 'midnightnetwork/proof-server', note: 'Docker port 6300 · Stage 2 SNARK' },
        ].map((item) => (
          <div key={item.label} className="card shadow-card text-center">
            <p className="text-2xs font-bold uppercase tracking-wider text-outline mb-1">{item.label}</p>
            <p className="text-xs font-bold text-on-surface font-mono mb-0.5">{item.value}</p>
            <p className="text-2xs text-outline">{item.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
