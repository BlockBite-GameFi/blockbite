import type { Metadata } from 'next';
import '../styles/globals.css';
import './globals.css';
import AppWalletProvider from "@/components/AppWalletProvider";
import { AppProvider } from '@/lib/useApp';

export const metadata: Metadata = {
  title: 'BlockBite — Skill-Based Web3 Arcade on Solana',
  description: 'BlockBite: Buy tickets, play the ultimate block-puzzle arcade, climb the monthly leaderboard, and win real USDC prizes — all on-chain on Solana.',
  keywords: ['BlockBite', 'Web3', 'GameFi', 'Solana', 'USDC', 'Play to Earn', 'Blockchain Gaming', '8-bit', 'Arcade'],
  openGraph: {
    title: 'BlockBite — Bite Into the Prize Pool',
    description: 'Compete monthly for USDC prizes in the ultimate skill-based arcade GameFi on Solana.',
    type: 'website',
    url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://blockbite-game.vercel.app',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BlockBite — Web3 Arcade on Solana',
    description: 'Buy tickets, play blocks, bite into the prize pool. 100% on-chain, deterministic levels, pure skill.',
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
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
        {/* favicon is auto-injected from app/icon.png by Next.js Metadata Files convention */}
      </head>
      <body>
        <AppProvider>
          <AppWalletProvider>
            {children}
          </AppWalletProvider>
        </AppProvider>
      </body>
    </html>
  );
}
