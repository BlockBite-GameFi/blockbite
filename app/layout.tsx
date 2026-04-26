import type { Metadata } from 'next';
import '../styles/globals.css';
import AppWalletProvider from "@/components/AppWalletProvider";

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
    description: 'Buy tickets, play blocks, bite into the prize pool. 100% on-chain, zero RNG, pure skill.',
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
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='12' fill='%230A0A1E'/><rect x='4' y='4' width='26' height='26' rx='5' fill='%2300F5FF'/><rect x='34' y='4' width='26' height='26' rx='5' fill='%23FF00FF'/><rect x='4' y='34' width='26' height='26' rx='5' fill='%23FFD700'/><rect x='34' y='34' width='26' height='26' rx='5' fill='%2300FF88'/><circle cx='32' cy='32' r='16' fill='%230A0A1E'/><rect x='22' y='18' width='5' height='9' rx='2' fill='white'/><rect x='31' y='16' width='5' height='9' rx='2' fill='white'/><rect x='45' y='25' width='9' height='5' rx='2' fill='white'/><rect x='47' y='34' width='9' height='5' rx='2' fill='white'/><circle cx='14' cy='14' r='4' fill='%230A0A1E'/><circle cx='15' cy='13' r='1.5' fill='white'/></svg>" />
      </head>
      <body>
        <AppWalletProvider>
          {children}
        </AppWalletProvider>
      </body>
    </html>
  );
}
