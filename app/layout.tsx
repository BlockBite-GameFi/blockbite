import type { Metadata } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'BlockBlast Web3 — Skill-Based Arcade on Solana',
  description: 'The ultimate skill-based arcade GameFi. Buy tickets, play Block Blast, compete on the weekly leaderboard, and win USDC prizes. Built on Solana.',
  keywords: ['BlockBlast', 'Web3', 'GameFi', 'Solana', 'USDC', 'Play to Earn', 'Blockchain Gaming'],
  openGraph: {
    title: 'BlockBlast Web3 — Win USDC Playing Block Blast',
    description: 'Compete weekly for USDC prizes in the ultimate skill-based arcade on Solana.',
    type: 'website',
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
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='6' fill='%230A0A1A'/><rect x='4' y='4' width='10' height='10' rx='2' fill='%2300F5FF'/><rect x='18' y='4' width='10' height='10' rx='2' fill='%23FF00FF'/><rect x='4' y='18' width='10' height='10' rx='2' fill='%23FFD700'/><rect x='18' y='18' width='10' height='10' rx='2' fill='%2300FF88'/></svg>" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
