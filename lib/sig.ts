/**
 * Ed25519 wallet signature verification.
 * Uses tweetnacl — falls back gracefully if unavailable.
 */
import { PublicKey } from '@solana/web3.js';

export async function verifySig(
  addr: string,
  message: string,
  signatureBase64: string,
): Promise<boolean> {
  try {
    const nacl = await import('tweetnacl');
    const msgBytes = new TextEncoder().encode(message);
    const sigBytes = Buffer.from(signatureBase64, 'base64');
    const pubkeyBytes = new PublicKey(addr).toBytes();
    return nacl.default.sign.detached.verify(msgBytes, sigBytes, pubkeyBytes);
  } catch {
    return false;
  }
}
