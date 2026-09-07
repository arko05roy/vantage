'use client';

import React from 'react';
import { useVantageStore } from '@/lib/store';
import {
  ShieldCheck,
  Building2,
  Wallet,
  CheckCircle2,
  Layers,
  Sparkles,
  RotateCcw,
  ExternalLink,
  Cpu,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    loadScenario,
    resetAll,
    onChainCommitments,
    onChainNullifiers,
  } = useVantageStore();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      {/* Top Banner: Regulatory & Network Status */}
      <div className="border-b border-emerald-900/10 bg-emerald-950 px-4 py-1.5 text-xs text-emerald-100 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-800/60 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400"></span>
              MIDNIGHT DUAL-LEDGER
            </span>
            <span className="hidden sm:inline text-emerald-300/80">
              Compact Engine v0.31.1 • RBI NBFC-MFI Regulatory Exposure Protocol
            </span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] text-emerald-300/90">
            <span>Commitments: <strong className="text-white">{onChainCommitments.length}</strong></span>
            <span>•</span>
            <span>Nullifiers: <strong className="text-white">{onChainNullifiers.length}</strong></span>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-950 text-white shadow-md shadow-emerald-900/20 ring-1 ring-emerald-700/50">
            <ShieldCheck className="h-6 w-6 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-headline text-xl font-bold tracking-tight text-slate-900">
                VANTAGE
              </h1>
              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Wave 1
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Zero-Knowledge Credit Exposure Verification
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 rounded-xl bg-slate-100 p-1 ring-1 ring-slate-200/80">
          <button
            onClick={() => setActiveTab('issuer')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
              activeTab === 'issuer'
                ? 'bg-white text-emerald-900 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="h-4 w-4 text-emerald-700" />
            1. Issuer Portal
          </button>
          <button
            onClick={() => setActiveTab('borrower')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
              activeTab === 'borrower'
                ? 'bg-white text-emerald-900 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wallet className="h-4 w-4 text-emerald-700" />
            2. Borrower Vault
          </button>
          <button
            onClick={() => setActiveTab('verifier')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
              activeTab === 'verifier'
                ? 'bg-white text-emerald-900 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-700" />
            3. Verifier Portal
          </button>
          <button
            onClick={() => setActiveTab('explainer')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
              activeTab === 'explainer'
                ? 'bg-white text-emerald-900 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="h-4 w-4 text-emerald-700" />
            Dual-Ledger Architecture
          </button>
        </nav>

        {/* Preset Scenarios Dropdown / Reset */}
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400">Quick Test:</span>
            <button
              onClick={() => loadScenario('compliant_2_loans')}
              className="rounded-md border border-emerald-300/80 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 transition hover:bg-emerald-100"
              title="2 Loans (₹40k + ₹50k = ₹90k <= ₹100k cap)"
            >
              ✅ Compliant (2 Loans)
            </button>
            <button
              onClick={() => loadScenario('exceeds_amount')}
              className="rounded-md border border-amber-300/80 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 transition hover:bg-amber-100"
              title="2 Loans (₹60k + ₹55k = ₹115k > ₹100k cap)"
            >
              ❌ Exceeds Cap (₹1.15L)
            </button>
            <button
              onClick={() => loadScenario('exceeds_lenders')}
              className="rounded-md border border-amber-300/80 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 transition hover:bg-amber-100"
              title="3 Loans from 3 Lenders (> 2 Lenders Cap)"
            >
              ❌ 3 Lenders Cap
            </button>
          </div>

          <button
            onClick={resetAll}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
            title="Reset All State"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="flex md:hidden border-t border-slate-200 bg-slate-50 px-2 py-1.5 overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab('issuer')}
          className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
            activeTab === 'issuer' ? 'bg-emerald-900 text-white' : 'text-slate-600'
          }`}
        >
          <Building2 className="h-3.5 w-3.5" />
          Issuer
        </button>
        <button
          onClick={() => setActiveTab('borrower')}
          className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
            activeTab === 'borrower' ? 'bg-emerald-900 text-white' : 'text-slate-600'
          }`}
        >
          <Wallet className="h-3.5 w-3.5" />
          Borrower
        </button>
        <button
          onClick={() => setActiveTab('verifier')}
          className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
            activeTab === 'verifier' ? 'bg-emerald-900 text-white' : 'text-slate-600'
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Verifier
        </button>
        <button
          onClick={() => setActiveTab('explainer')}
          className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
            activeTab === 'explainer' ? 'bg-emerald-900 text-white' : 'text-slate-600'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          Architecture
        </button>
      </div>
    </header>
  );
};
