'use client';

import React, { useState } from 'react';
import { useVantageStore } from '@/lib/store';
import Image from 'next/image';

type Tab = 'issuer' | 'borrower' | 'verifier' | 'explainer';

const tabs: { id: Tab; label: string }[] = [
  { id: 'issuer',    label: 'Issuer' },
  { id: 'borrower',  label: 'Borrower' },
  { id: 'verifier',  label: 'Verifier' },
  { id: 'explainer', label: 'How it works' },
];

export const Header: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    loadScenario,
    resetAll,
    onChainCommitments,
    onChainNullifiers,
  } = useVantageStore();

  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-outline-variant bg-surface-bright/95 backdrop-blur-sm">
      {/* ── Status bar ─────────────────────────────────────────────── */}
      <div className="bg-primary px-4 sm:px-6">
        <div className="mx-auto flex max-w-container items-center justify-between py-1.5">
          <span className="flex items-center gap-2 text-2xs font-medium text-primary-dim tracking-wide">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-dim animate-proof" />
            Midnight Preview Testnet
          </span>
          <span className="font-mono text-2xs text-primary-dim/80">
            Commitments:&nbsp;
            <strong className="text-white">{onChainCommitments.length}</strong>
            &nbsp;·&nbsp;Nullifiers:&nbsp;
            <strong className="text-white">{onChainNullifiers.length}</strong>
          </span>
        </div>
      </div>

      {/* ── Main bar ───────────────────────────────────────────────── */}
      <div className="mx-auto flex max-w-container items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Logo: V-mark only — show left ~30% of the wide PNG */}
        <div className="flex-shrink-0">
          <div className="relative h-9 w-9 overflow-hidden">
            <Image
              src="/logo.png"
              alt="Vantage"
              fill
              sizes="36px"
              className="object-cover object-left"
              priority
            />
          </div>
        </div>

        {/* ── Desktop nav ────────────────────────────────────────────── */}
        <nav className="hidden md:flex items-center gap-1 rounded-lg bg-surface-container p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={[
                'rounded-md px-4 py-1.5 text-sm font-semibold transition-colors',
                activeTab === t.id
                  ? 'bg-surface-bright text-primary shadow-card'
                  : 'text-on-surface-v hover:text-on-surface',
              ].join(' ')}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {/* ── Desktop quick-test + reset ──────────────────────────────── */}
        <div className="hidden lg:flex items-center gap-2">
          <span className="text-2xs font-semibold text-outline">Quick test:</span>
          <button
            onClick={() => loadScenario('compliant_2_loans')}
            className="rounded-md border border-primary/30 bg-primary-light px-2.5 py-1 text-2xs font-semibold text-primary transition hover:bg-primary-dim/20"
            title="2 loans — compliant"
          >
            Compliant
          </button>
          <button
            onClick={() => loadScenario('exceeds_amount')}
            className="rounded-md border border-amber-600/30 bg-amber-50 px-2.5 py-1 text-2xs font-semibold text-amber-900 transition hover:bg-amber-100"
            title="Exceeds ₹1L cap"
          >
            Exceeds Cap
          </button>
          <button
            onClick={() => loadScenario('exceeds_lenders')}
            className="rounded-md border border-amber-600/30 bg-amber-50 px-2.5 py-1 text-2xs font-semibold text-amber-900 transition hover:bg-amber-100"
            title="3 lenders — over cap"
          >
            3 Lenders
          </button>
          <button
            onClick={resetAll}
            className="rounded-md border border-outline-variant px-2.5 py-1 text-2xs font-semibold text-on-surface-v transition hover:bg-surface-container"
          >
            Reset
          </button>
        </div>

        {/* ── Mobile hamburger ────────────────────────────────────────── */}
        <button
          className="md:hidden rounded-lg border border-outline-variant p-2 text-on-surface-v"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* ── Mobile drawer ──────────────────────────────────────────────── */}
      {menuOpen && (
        <div className="md:hidden border-t border-outline-variant bg-surface-bright px-4 pb-4 pt-2 space-y-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); setMenuOpen(false); }}
              className={[
                'w-full text-left rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors',
                activeTab === t.id
                  ? 'bg-primary text-on-primary'
                  : 'text-on-surface-v hover:bg-surface-container',
              ].join(' ')}
            >
              {t.label}
            </button>
          ))}
          {/* Mobile quick-test row */}
          <div className="pt-2 flex flex-wrap gap-2 border-t border-outline-variant mt-2">
            <button onClick={() => { loadScenario('compliant_2_loans'); setMenuOpen(false); }}
              className="rounded-md border border-primary/30 bg-primary-light px-2.5 py-1 text-2xs font-semibold text-primary">
              Compliant
            </button>
            <button onClick={() => { loadScenario('exceeds_amount'); setMenuOpen(false); }}
              className="rounded-md border border-amber-600/30 bg-amber-50 px-2.5 py-1 text-2xs font-semibold text-amber-900">
              Exceeds Cap
            </button>
            <button onClick={() => { loadScenario('exceeds_lenders'); setMenuOpen(false); }}
              className="rounded-md border border-amber-600/30 bg-amber-50 px-2.5 py-1 text-2xs font-semibold text-amber-900">
              3 Lenders
            </button>
            <button onClick={() => { resetAll(); setMenuOpen(false); }}
              className="rounded-md border border-outline-variant px-2.5 py-1 text-2xs font-semibold text-on-surface-v">
              Reset
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
