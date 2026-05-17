import { NextResponse } from 'next/server';

export const revalidate = 30;

/**
 * Reads the live USDC balance from the prize-pool vault PDA on-chain.
 *
 * The blockbite-vesting program derives every stream's vault as:
 *   PDA(["vault", authority, stream_id_le_bytes], programId)
 *
 * Operators configure the prize pool via env:
 *   - NEXT_PUBLIC_PRIZE_POOL_AUTHORITY (32-byte pubkey, base58)
 *   - NEXT_PUBLIC_PRIZE_POOL_STREAM_ID (u64 as decimal string)
 *   - NEXT_PUBLIC_RPC_URL              (defaults to devnet)
 *
 * Authority resolution:
 *   1. explicit env var (mainnet + any operator-configured devnet)
 *   2. devnet-only built-in demo authority — the 100,000-USDC demo stream
 *      already locked on Solana devnet that the /map/* sidecard advertises.
 *      Surfacing this real on-chain balance on devnet is the OPPOSITE of
 *      fraud: it's faithful reporting of the verifiable test-token state.
 *   3. otherwise honest empty state ({ balance: 0, source: 'uninitialized' })
 *
 * MAINNET still requires the env var to be set explicitly — we will not
 * silently read a hardcoded authority on a real-value network. That gate
 * is the safeguard against a compromised admin wallet ever being shown
 * as "the live prize pool" without operator intent.
 */

const DEFAULT_PROGRAM_ID    = 'DvhxiL5PF8Cq3icqcjdbQvtMhJcj6LWheUgovRpaXTFf';
const DEFAULT_STREAM_ID     = '1';
const DEVNET_DEMO_AUTHORITY = '35z7X59rtyts557Up1RAwpyYN7x2cFqcDc7RjPuNxFzr';

function isDevnetRpc(rpc: string): boolean {
  const probe = rpc.toLowerCase();
  if (probe.includes('devnet')) return true;
  try {
    const h = new URL(rpc).hostname.toLowerCase();
    return h.includes('devnet');
  } catch {
    return false;
  }
}

export async function GET() {
  const programId   = process.env.NEXT_PUBLIC_VESTING_PROGRAM_ID   ?? DEFAULT_PROGRAM_ID;
  const envAuth     = process.env.NEXT_PUBLIC_PRIZE_POOL_AUTHORITY ?? '';
  const streamIdStr = process.env.NEXT_PUBLIC_PRIZE_POOL_STREAM_ID ?? DEFAULT_STREAM_ID;
  const rpc         = process.env.NEXT_PUBLIC_RPC_URL              ?? 'https://api.devnet.solana.com';

  let authority    = envAuth;
  let authoritySrc: 'env' | 'devnet-demo' = 'env';
  if (!authority && isDevnetRpc(rpc)) {
    authority = DEVNET_DEMO_AUTHORITY;
    authoritySrc = 'devnet-demo';
  }
  if (!authority) {
    return NextResponse.json({
      balance: 0,
      source: 'uninitialized',
      note: 'Mainnet RPC requires NEXT_PUBLIC_PRIZE_POOL_AUTHORITY to be set explicitly.',
    });
  }

  try {
    const { Connection, PublicKey } = await import('@solana/web3.js');
    const { getAccount } = await import('@solana/spl-token');

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
      balance:        Number(acc.amount) / 1e6,
      source:         'on-chain',
      authoritySrc,  // 'env' or 'devnet-demo' — tells the UI which path was used
      vault:          vaultPda.toBase58(),
      authority,
      streamId:       streamIdStr,
      cluster:        isDevnetRpc(rpc) ? 'devnet' : 'mainnet',
    });
  } catch (err) {
    return NextResponse.json({
      balance: 0,
      source: 'error',
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
