import { NextResponse } from 'next/server';

export const revalidate = 30;

/**
 * Reads the live USDC balance from the prize-pool vault PDA on-chain.
 *
 * The blockbite-vesting program derives every stream's vault as:
 *   PDA(["vault", authority, stream_id_le_bytes], programId)
 *
 * For the public prize pool we expose two env vars:
 *   - NEXT_PUBLIC_PRIZE_POOL_AUTHORITY (32-byte pubkey, base58)
 *   - NEXT_PUBLIC_PRIZE_POOL_STREAM_ID (u64 as decimal string)
 *
 * If either is missing we treat the prize pool as "not yet initialized"
 * and return 0 — the frontend renders that gracefully ("PRIZE POOL · 0 USDC").
 */
// Production fallbacks — these are public on-chain addresses, not secrets, so
// hardcoding them lets the API work in any environment (Vercel preview/prod,
// local dev, CI) without having to copy env vars by hand. Env vars still
// override these for mainnet swap-overs.
const DEFAULT_PROGRAM_ID = 'DvhxiL5PF8Cq3icqcjdbQvtMhJcj6LWheUgovRpaXTFf';
const DEFAULT_AUTHORITY  = '35z7X59rtyts557Up1RAwpyYN7x2cFqcDc7RjPuNxFzr';
const DEFAULT_STREAM_ID  = '1';

export async function GET() {
  const programId   = process.env.NEXT_PUBLIC_VESTING_PROGRAM_ID   ?? DEFAULT_PROGRAM_ID;
  const authority   = process.env.NEXT_PUBLIC_PRIZE_POOL_AUTHORITY ?? DEFAULT_AUTHORITY;
  const streamIdStr = process.env.NEXT_PUBLIC_PRIZE_POOL_STREAM_ID ?? DEFAULT_STREAM_ID;

  try {
    const { Connection, PublicKey } = await import('@solana/web3.js');
    const { getAccount } = await import('@solana/spl-token');

    const rpc = process.env.NEXT_PUBLIC_RPC_URL ?? 'https://api.devnet.solana.com';
    const streamId = BigInt(streamIdStr);
    const streamIdBuf = Buffer.alloc(8);
    streamIdBuf.writeBigUInt64LE(streamId);

    const conn       = new Connection(rpc, 'confirmed');
    const vesting    = new PublicKey(programId);
    const authPk     = new PublicKey(authority);
    const [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('vault'), authPk.toBuffer(), streamIdBuf],
      vesting,
    );
    const acc = await getAccount(conn, vaultPda);
    // SPL token amounts are u64. USDC has 6 decimals → divide by 1e6.
    return NextResponse.json({
      balance: Number(acc.amount) / 1e6,
      source: 'on-chain',
      vault: vaultPda.toBase58(),
    });
  } catch (err) {
    return NextResponse.json({
      balance: 0,
      source: 'error',
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
