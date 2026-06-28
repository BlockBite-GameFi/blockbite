/**
 * Solana network configuration — single source of truth.
 * All other files import from here; never hard-code RPC or mints elsewhere.
 */

import { PublicKey } from '@solana/web3.js';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

// ── Network ────────────────────────────────────────────────────────
// Change to Mainnet before production launch.
// Vercel env var NEXT_PUBLIC_SOLANA_NETWORK overrides this default.
export const ACTIVE_NETWORK: WalletAdapterNetwork =
  (process.env.NEXT_PUBLIC_SOLANA_NETWORK as WalletAdapterNetwork | undefined) ??
  WalletAdapterNetwork.Devnet;

export const IS_DEVNET = ACTIVE_NETWORK === WalletAdapterNetwork.Devnet;

// ── RPC endpoint ───────────────────────────────────────────────────
// Priority: NEXT_PUBLIC_RPC_URL env var (set in Vercel dashboard) → Ankr free public
// → official Solana public endpoint.
//
// WHY NOT api.devnet.solana.com:
//   Solana's shared public RPC permanently blocks getProgramAccounts (used by
//   Anchor's program.account.*.all() and .allWithFilter()) — it returns HTTP 403
//   "Access forbidden". This restriction is intentional and will not be lifted.
//   Ankr's free public endpoint (no API key required) supports this method.
//
// For higher throughput set NEXT_PUBLIC_RPC_URL to a dedicated node, e.g.:
//   Helius devnet: https://devnet.helius-rpc.com/?api-key=YOUR_KEY  (free tier)
//   QuickNode:     https://YOUR_SLUG.solana-devnet.quiknode.pro/YOUR_KEY/
// api.devnet.solana.com is the only reliably free devnet endpoint in 2026.
// Ankr and dRPC now require API keys / paid tier.
// For production, set NEXT_PUBLIC_RPC_URL to a dedicated Helius/QuickNode key.
export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ??
  (IS_DEVNET
    ? 'https://api.devnet.solana.com'
    : 'https://api.mainnet-beta.solana.com');

// ── USDC SPL Mint addresses ────────────────────────────────────────
// Devnet:  BlockBite mock-USDC (mint authority = team wallet). Circle's official
//          devnet USDC has no public faucet API, so for autonomous funding we
//          control our own 6-decimal mint and treat it AS USDC. The prize-pool
//          vault was seeded with 100k of this mint via scripts/setup-prize-pool.
//          Override with NEXT_PUBLIC_USDC_MINT_DEVNET for any other test setup.
// Mainnet: Circle's production USDC.
export const USDC_MINT_DEVNET  = new PublicKey(
  process.env.NEXT_PUBLIC_USDC_MINT_DEVNET ?? 'ZLkYWYvM4ZEDcPcvmcxmcgTgvsWRCXqg9ZYyQuf7njU',
);
export const USDC_MINT_MAINNET = new PublicKey(
  process.env.NEXT_PUBLIC_USDC_MINT_MAINNET ?? 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
);
export const USDC_MINT = IS_DEVNET ? USDC_MINT_DEVNET : USDC_MINT_MAINNET;
export const USDC_DECIMALS = 6;

// ── Platform wallets ───────────────────────────────────────────────
// These receive the non-prize-pool share of ticket revenue.
export const TEAM_WALLET  = new PublicKey('ETcQvsQek2w9feLfsqoe4AypCWfnrSwQiv3djqocaP2m');
// FEE_WALLET reads from env — never hard-code. Set NEXT_PUBLIC_FEE_WALLET in Vercel dashboard.
export const FEE_WALLET   = new PublicKey(
  process.env.NEXT_PUBLIC_FEE_WALLET ?? 'ETcQvsQek2w9feLfsqoe4AypCWfnrSwQiv3djqocaP2m',
);

// ── Token amounts ──────────────────────────────────────────────────
/** Convert a human USDC amount to raw u64 lamports (6 decimals). */
export function toUsdcLamports(amount: number): bigint {
  return BigInt(Math.round(amount * 10 ** USDC_DECIMALS));
}

/** Convert raw u64 lamports back to human USDC. */
export function fromUsdcLamports(lamports: bigint): number {
  return Number(lamports) / 10 ** USDC_DECIMALS;
}

// ── Solana Explorer link ───────────────────────────────────────────
export function explorerTx(sig: string): string {
  return `https://explorer.solana.com/tx/${sig}${IS_DEVNET ? '?cluster=devnet' : ''}`;
}

export function explorerAddr(addr: string): string {
  return `https://explorer.solana.com/address/${addr}${IS_DEVNET ? '?cluster=devnet' : ''}`;
}
