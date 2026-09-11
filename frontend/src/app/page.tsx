'use client';

import React from 'react';
import { useVantageStore } from '@/lib/store';
import { Header } from '@/components/Header';
import { IssuerView } from '@/components/IssuerView';
import { BorrowerView } from '@/components/BorrowerView';
import { VerifierView } from '@/components/VerifierView';
import { DualLedgerExplainer } from '@/components/DualLedgerExplainer';

export default function Home() {
  const { activeTab } = useVantageStore();

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
      <Header />

      <main className="flex-1 pb-16">
        {activeTab === 'issuer'    && <IssuerView />}
        {activeTab === 'borrower'  && <BorrowerView />}
        {activeTab === 'verifier'  && <VerifierView />}
        {activeTab === 'explainer' && <DualLedgerExplainer />}
      </main>

      <footer className="border-t border-outline-variant bg-surface-bright py-8 px-4 sm:px-6">
        <div className="mx-auto max-w-container">
          {/* Brand row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-on-surface-v">
            <div className="flex items-center gap-3">
              <span className="font-bold text-on-surface">Vantage</span>
              <span className="text-outline">·</span>
              <span>Midnight Network WaveHack 2026</span>
              <span className="text-outline">·</span>
              <a
                href="https://docs.midnight.network/"
                target="_blank"
                rel="noreferrer"
                className="font-semibold hover:text-primary transition-colors"
              >
                Midnight Docs
              </a>
            </div>
            <span className="text-2xs font-mono text-outline">RBI NBFC-MFI Compliance · Compact 0.31.1</span>
          </div>

          {/* Disclaimer */}
          <p className="mt-4 pt-4 border-t border-outline-variant text-2xs text-outline leading-relaxed max-w-3xl">
            <strong>Disclaimer:</strong> Institution names used in test scenarios (Bandhan MFI,
            Fusion Microfinance, CreditAccess Grameen, Muthoot Microfin, Arohan Financial) are
            referenced strictly for illustrative purposes to model real-world Indian microfinance
            regulations. No formal partnership, commercial endorsement, or institutional affiliation
            is implied.
          </p>
        </div>
      </footer>
    </div>
  );
}
