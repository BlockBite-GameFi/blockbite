/**
 * Ed25519 wallet signature verification via Web Crypto API (Node 18+).
 * No extra packages — uses @solana/web3.js for PublicKey parsing only.
 */
import { PublicKey } from '@solana/web3.js';

export async function verifySig(
  addr: string,
  message: string,
  signatureBase64: string,
): Promise<boolean> {
  try {
    const msgBytes = new TextEncoder().encode(message);
    const sigBytes = Buffer.from(signatureBase64, 'base64');
    const pubkeyBytes = new PublicKey(addr).toBytes();

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      pubkeyBytes,
      { name: 'Ed25519' },
      false,
      ['verify'],
    );

    return await crypto.subtle.verify('Ed25519', cryptoKey, sigBytes, msgBytes);
  } catch {
    return false;
  }
}
