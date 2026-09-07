import type { Metadata } from 'next';
import './globals.css';
import { VantageStoreProvider } from '@/lib/store';

export const metadata: Metadata = {
  title: 'Vantage — Zero-Knowledge Credit Exposure Verification on Midnight',
  description: 'Privacy-preserving credit exposure verification for Indian microfinance (NBFC-MFIs) powered by Midnight Network dual-ledger ZK circuits.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Manrope:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-emerald-100 selection:text-emerald-900">
        <VantageStoreProvider>
          {children}
        </VantageStoreProvider>
      </body>
    </html>
  );
}
