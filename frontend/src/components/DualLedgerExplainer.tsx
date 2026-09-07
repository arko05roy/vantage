'use client';

import React from 'react';
import { useVantageStore } from '@/lib/store';
import {
  Layers,
  Globe,
  Lock,
  Cpu,
  ArrowRight,
  ShieldCheck,
  Hash,
  Database,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { LoanStatus } from '@/lib/types';

export const DualLedgerExplainer: React.FC = () => {
  const {
    borrowerId,
    privateLoans,
    onChainCommitments,
    onChainNullifiers,
    onChainPortfolioRoots,
  } = useVantageStore();

  const currentOnChainRoot = onChainPortfolioRoots.get(borrowerId);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
      {/* Title & Context */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs uppercase tracking-wider">
          <Layers className="h-4 w-4" />
          Midnight Network Dual-Ledger Model (Fix 5 Architectural Visualizer)
        </div>
        <h2 className="font-headline text-3xl font-bold tracking-tight text-slate-900 mt-1">
          Dual-Ledger Zero-Knowledge Architecture
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Midnight splits state into two distinct realms: <strong>Public On-Chain State</strong> (immutable, decentralized, shared ledger) and <strong>Private Off-Chain State</strong> (local witness data stored exclusively on client devices). Compact circuits bridge the two through zero-knowledge proofs.
        </p>
      </div>

      {/* 3-Column Interactive Architecture Diagram */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Realm: Public Ledger */}
        <div className="lg:col-span-4 rounded-2xl border-2 border-emerald-800/30 bg-white p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 font-mono text-xs font-bold text-emerald-900">
                <Globe className="h-3.5 w-3.5 text-emerald-700" />
                Public Ledger (On-Chain)
              </span>
              <span className="text-[11px] font-bold text-slate-400 uppercase">Visible to All</span>
            </div>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Maintained on Midnight nodes. Stores only cryptographic hashes, nullifiers, and accumulator roots.
            </p>

            <div className="space-y-3 font-mono text-xs">
              {/* loan_commitments */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                <div className="flex justify-between text-slate-500 font-bold text-[11px] mb-1">
                  <span>loan_commitments: Set&lt;Bytes&lt;32&gt;&gt;</span>
                  <span className="text-emerald-800">{onChainCommitments.length}</span>
                </div>
                <div className="text-[10px] text-slate-400 space-y-1 max-h-20 overflow-y-auto">
                  {onChainCommitments.length === 0 ? (
                    <div>[Empty Set]</div>
                  ) : (
                    onChainCommitments.map((c, i) => (
                      <div key={i} className="truncate text-emerald-900 font-semibold">
                        {c.commitment.substring(0, 18)}...
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* nullifiers */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                <div className="flex justify-between text-slate-500 font-bold text-[11px] mb-1">
                  <span>nullifiers: Set&lt;Bytes&lt;32&gt;&gt;</span>
                  <span className="text-emerald-800">{onChainNullifiers.length}</span>
                </div>
                <div className="text-[10px] text-slate-400 space-y-1 max-h-20 overflow-y-auto">
                  {onChainNullifiers.length === 0 ? (
                    <div>[Empty Set]</div>
                  ) : (
                    onChainNullifiers.map((n, i) => (
                      <div key={i} className="truncate text-slate-700 font-semibold">
                        {n.nullifier.substring(0, 18)}...
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* borrower_portfolios root */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                <div className="flex justify-between text-slate-500 font-bold text-[11px] mb-1">
                  <span>borrower_portfolios: Map</span>
                  <span className="text-emerald-800">Active</span>
                </div>
                <div className="text-[10px] text-emerald-900 font-semibold truncate bg-white p-1 rounded border border-slate-200">
                  {currentOnChainRoot || 'Genesis Root (0 loans)'}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
            <Eye className="h-3.5 w-3.5 text-emerald-600" />
            <span>Publicly auditable, zero PII</span>
          </div>
        </div>

        {/* Center: Compact ZK Prover Circuit */}
        <div className="lg:col-span-4 rounded-2xl border-2 border-emerald-600 bg-gradient-to-b from-emerald-950 via-slate-900 to-emerald-950 p-6 text-white shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl"></div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 font-mono text-xs font-bold text-emerald-300">
                <Cpu className="h-3.5 w-3.5 text-emerald-400" />
                Compact ZK Circuits
              </span>
              <span className="text-[11px] font-mono text-emerald-400 font-semibold">exposure-proof.compact</span>
            </div>
            <p className="text-xs text-emerald-200/80 mb-4 leading-relaxed">
              ZK constraints executed inside the client browser. Synthesizes a cryptographic proof that witness values satisfy regulatory limits.
            </p>

            <div className="space-y-3 font-mono text-xs">
              {/* Circuit 1 */}
              <div className="rounded-xl bg-black/50 border border-emerald-500/30 p-3">
                <div className="text-[11px] font-bold text-emerald-300">
                  1. prove_exposure_within_limit()
                </div>
                <div className="text-[10px] text-slate-300 mt-1 space-y-0.5">
                  <div>&bull; Reconstructs portfolio root</div>
                  <div>&bull; Asserts running_root == on_chain_root</div>
                  <div>&bull; active_count &le; 2 Lenders</div>
                  <div>&bull; total_exposure &le; ₹1,00,000 INR</div>
                </div>
              </div>

              {/* Circuit 2 */}
              <div className="rounded-xl bg-black/50 border border-emerald-500/30 p-3">
                <div className="text-[11px] font-bold text-emerald-300">
                  2. register_loan() & close_loan()
                </div>
                <div className="text-[10px] text-slate-300 mt-1 space-y-0.5">
                  <div>&bull; compute_loan_commitment(bId, lId, amt, nonce)</div>
                  <div>&bull; compute_nullifier(comm, nonce)</div>
                  <div>&bull; disclose(commitment) &rarr; on-chain Set</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-emerald-800/40 flex items-center justify-between text-[11px] text-emerald-300">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Soundness & Completeness
            </span>
            <span className="font-bold">Zero-Knowledge</span>
          </div>
        </div>

        {/* Right Realm: Private Client Vault */}
        <div className="lg:col-span-4 rounded-2xl border-2 border-slate-300 bg-white p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 font-mono text-xs font-bold text-slate-900">
                <Lock className="h-3.5 w-3.5 text-slate-700" />
                Private Witness (Off-Chain)
              </span>
              <span className="text-[11px] font-bold text-rose-600 uppercase">Local Only</span>
            </div>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Stored exclusively in the borrower&apos;s local storage. Never transmitted over the internet or exposed to lenders.
            </p>

            <div className="space-y-3 font-mono text-xs">
              {/* Borrower ID Witness */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                <div className="flex justify-between text-slate-500 font-bold text-[11px] mb-1">
                  <span>witness get_borrower_id()</span>
                </div>
                <div className="text-[10px] text-slate-800 font-semibold truncate bg-white p-1 rounded border border-slate-200">
                  {borrowerId}
                </div>
              </div>

              {/* Private Loan Records */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                <div className="flex justify-between text-slate-500 font-bold text-[11px] mb-1">
                  <span>witness get_loan_records(): Vector&lt;8&gt;</span>
                  <span className="text-slate-800">{privateLoans.length} Loans</span>
                </div>
                <div className="text-[10px] text-slate-600 space-y-1 max-h-24 overflow-y-auto">
                  {privateLoans.length === 0 ? (
                    <div>[0 active loans in local vault]</div>
                  ) : (
                    privateLoans.map((l, i) => (
                      <div key={i} className="flex justify-between items-center bg-white p-1 rounded border border-slate-100">
                        <span className="font-bold text-slate-900">{l.lender_name}</span>
                        <span className="font-bold text-emerald-800">₹{Number(l.amount).toLocaleString('en-IN')}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
            <EyeOff className="h-3.5 w-3.5 text-rose-500" />
            <span>Encrypted local storage, never shared</span>
          </div>
        </div>
      </div>
    </div>
  );
};
