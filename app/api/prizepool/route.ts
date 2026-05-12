import { NextResponse } from 'next/server';

export const revalidate = 30;

export async function GET() {
  try {
    const { Connection, PublicKey } = await import('@solana/web3.js');
    const { getAccount, getAssociatedTokenAddress } = await import('@solana/spl-token');

    const rpc = process.env.NEXT_PUBLIC_RPC_URL ?? 'https://api.devnet.solana.com';
    const programId = process.env.NEXT_PUBLIC_VESTING_PROGRAM_ID;
    const schedPda  = process.env.NEXT_PUBLIC_BATCH_SCHEDULE_PDA;
    const usdcMint  = process.env.NEXT_PUBLIC_USDC_MINT_DEVNET
      ?? '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';

    if (!programId || !schedPda) {
      return NextResponse.json({ balance: 0, note: 'program not deployed yet' });
    }

    const conn = new Connection(rpc, 'confirmed');
    const vesting  = new PublicKey(programId);
    const schedule = new PublicKey(schedPda);
    const [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('vault'), schedule.toBuffer()],
      vesting,
    );
    const usdc = new PublicKey(usdcMint);
    const ata  = await getAssociatedTokenAddress(usdc, vaultPda, true);
    const acc  = await getAccount(conn, ata);
    return NextResponse.json({ balance: Number(acc.amount) / 1e6 });
  } catch {
    return NextResponse.json({ balance: 0 });
  }
}
