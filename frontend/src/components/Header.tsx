'use client';

import React, { useState } from 'react';
import { useVantageStore } from '@/lib/store';
import { LACE_INSTALL_URL } from '@/lib/lace-wallet';
import Image from 'next/image';

type Tab = 'issuer' | 'borrower' | 'verifier' | 'explainer';

const truncateAddress = (addr: string) =>
  addr.length > 24 ? `${addr.slice(0, 20)}…${addr.slice(-6)}` : addr;

const DEPLOYED_CONTRACT = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? '';
const hasDeployedContract = /^[0-9a-fA-F]{64}$/.test(DEPLOYED_CONTRACT) && !/^0+$/.test(DEPLOYED_CONTRACT);

const WalletButton: React.FC<{ className?: string }> = ({ className }) => {
  const { laceInstalled, walletStatus, walletConnection, walletError, connectWallet, disconnectWallet } =
    useVantageStore();

  if (!laceInstalled) {
    return (
      <a
        href={LACE_INSTALL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`rounded-md border border-outline-variant px-2.5 py-1 text-2xs font-semibold text-on-surface-v transition hover:bg-surface-container ${className ?? ''}`}
        title="Install the Midnight Lace wallet extension"
      >
        Install Lace
      </a>
    );
  }

  if (walletStatus === 'connected' && walletConnection) {
    return (
      <button
        onClick={disconnectWallet}
        className={`rounded-md border border-primary/40 bg-primary-light px-2.5 py-1 font-mono text-2xs font-semibold text-primary transition hover:bg-primary-dim/20 ${className ?? ''}`}
        title={`${walletConnection.shieldedAddress} — click to disconnect`}
      >
        ⬤ {truncateAddress(walletConnection.shieldedAddress)}
      </button>
    );
  }

  return (
    <button
      onClick={connectWallet}
      disabled={walletStatus === 'connecting'}
      className={`rounded-md border border-primary/40 bg-primary px-2.5 py-1 text-2xs font-semibold text-white transition hover:bg-primary-dim disabled:opacity-60 ${className ?? ''}`}
      title={walletError ?? 'Connect Midnight Lace wallet (Preprod)'}
    >
      {walletStatus === 'connecting' ? 'Connecting…' : 'Connect Lace'}
    </button>
  );
};

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
            Midnight Preprod
          </span>
          <span className="font-mono text-2xs text-primary-dim/80">
            {hasDeployedContract && (
              <>
                Contract:&nbsp;
                <a
                  href={`https://preprod.midnightexplorer.com/contract/${DEPLOYED_CONTRACT}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white underline decoration-primary-dim/60 underline-offset-2"
                  title="Verify contract on Midnight Preprod explorer"
                >
                  {DEPLOYED_CONTRACT.slice(0, 8)}…{DEPLOYED_CONTRACT.slice(-6)}
                </a>
                &nbsp;·&nbsp;
              </>
            )}
            Commitments:&nbsp;
            <strong className="text-white">{onChainCommitments.length}</strong>
            &nbsp;·&nbsp;Nullifiers:&nbsp;
            <strong className="text-white">{onChainNullifiers.length}</strong>
          </span>
        </div>
      </div>

      {/* ── Main bar ───────────────────────────────────────────────── */}
      <div className="mx-auto flex max-w-container items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Logo — full image, no text addons */}
        <div className="flex-shrink-0">
          <Image
            src="/logo.png"
            alt="Vantage"
            width={120}
            height={36}
            className="h-9 w-auto object-contain"
            priority
          />
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

        {/* ── Wallet connect (always visible) ─────────────────────────── */}
        <WalletButton className="hidden md:inline-flex" />

        {/* ── Mobile hamburger ────────────────────────────────────────── */}
        <button
          className="md:hidden rounded-lg border border-outline-variant p-2 text-on-surface-v ml-auto"
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
            <WalletButton />
          </div>
        </div>
      )}
    </header>
  );
};
