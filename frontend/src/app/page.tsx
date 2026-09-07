'use client';

import React from 'react';
import { useVantageStore } from '@/lib/store';
import { Header } from '@/components/Header';
import { IssuerView } from '@/components/IssuerView';
import { BorrowerView } from '@/components/BorrowerView';
import { VerifierView } from '@/components/VerifierView';
import { DualLedgerExplainer } from '@/components/DualLedgerExplainer';
import { ShieldCheck, Lock, ExternalLink } from 'lucide-react';

export default function Home() {
  const { activeTab } = useVantageStore();

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-900">
      <div>
        <Header />

        <main className="pb-16">
          {activeTab === 'issuer' && <IssuerView />}
          {activeTab === 'borrower' && <BorrowerView />}
          {activeTab === 'verifier' && <VerifierView />}
          {activeTab === 'explainer' && <DualLedgerExplainer />}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 px-4 sm:px-8">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-950 text-white">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
            </div>
            <span className="font-headline font-bold text-slate-900">Vantage</span>
            <span>&bull;</span>
            <span>Midnight Network WaveHack 2026</span>
          </div>

          <div className="flex items-center gap-6 font-medium">
            <span className="flex items-center gap-1 text-emerald-800 font-semibold">
              <Lock className="h-3.5 w-3.5" />
              RBI NBFC-MFI Compliance Engine
            </span>
            <a
              href="https://docs.midnight.network/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-slate-900 transition"
            >
              <span>Midnight Docs</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
