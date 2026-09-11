import type { Metadata } from 'next';
import './globals.css';
import { VantageStoreProvider } from '@/lib/store';

export const metadata: Metadata = {
  title: 'Vantage — Zero-Knowledge Credit Exposure Oracle on Midnight',
  description:
    'Privacy-preserving credit exposure verification for Indian microfinance (NBFC-MFIs) built on Midnight Network dual-ledger ZK circuits.',
  icons: { icon: '/logo.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-surface text-on-surface antialiased">
        <VantageStoreProvider>{children}</VantageStoreProvider>
      </body>
    </html>
  );
}
