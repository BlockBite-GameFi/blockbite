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
export async function GET() {
  const programId   = process.env.NEXT_PUBLIC_VESTING_PROGRAM_ID;
  const authority   = process.env.NEXT_PUBLIC_PRIZE_POOL_AUTHORITY;
  const streamIdStr = process.env.NEXT_PUBLIC_PRIZE_POOL_STREAM_ID;

  if (!programId || !authority || !streamIdStr) {
    return NextResponse.json({
      balance: 0,
      source: 'placeholder',
      note: 'prize pool stream not yet initialized — set NEXT_PUBLIC_PRIZE_POOL_AUTHORITY and NEXT_PUBLIC_PRIZE_POOL_STREAM_ID after calling create_stream',
    });
  }

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
