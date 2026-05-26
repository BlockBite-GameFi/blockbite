import type { Metadata } from 'next';
import '../styles/globals.css';
import './globals.css';
import AppWalletProvider from "@/components/AppWalletProvider";
import { AppProvider } from '@/lib/useApp';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: 'BlockBite TDP — Token Distribution Protocol on Solana',
  description: 'BlockBite TDP: Programmable cliff, linear, and milestone vesting streams with game-based, oracle, multisig, and manual verification. Built for Web3 projects that take anti-dump seriously.',
  keywords: ['BlockBite', 'TDP', 'Token Distribution Protocol', 'Vesting', 'Solana', 'Web3', 'Cliff', 'Milestone', 'Streaming'],
  openGraph: {
    title: 'BlockBite TDP — Programmable Token Distribution Protocol',
    description: 'Cliff, linear, and milestone vesting streams with optional game-based or oracle verification. Built for Web3 projects on Solana.',
    type: 'website',
    url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://blockbite-game.vercel.app',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BlockBite TDP — Token Distribution Protocol',
    description: 'Programmable vesting streams with milestone verification. Anti-dump by default. 100% on-chain on Solana.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600;700&family=Montserrat:wght@400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700;800;900&family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
        {/* favicon is auto-injected from app/icon.png by Next.js Metadata Files convention */}
      </head>
      <body style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <AppProvider>
          <AppWalletProvider>
            {children}
          </AppWalletProvider>
        </AppProvider>
        <Analytics />
      </body>
    </html>
  );
}
