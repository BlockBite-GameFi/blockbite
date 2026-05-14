/**
 * Shared in-memory waitlist store.
 * Used as a fallback when Vercel KV is not configured.
 * Both the POST and GET route modules import from here so they share
 * the same Set/counter within a single server process.
 * NOTE: This resets on cold start. Configure Vercel KV for true persistence.
 */
export const memEmails = new Set<string>();
export let memCount = 0;
export function memAdd(email: string): boolean {
  if (memEmails.has(email)) return false;
  memEmails.add(email);
  memCount++;
  return true;
}
export function memGetCount(): number {
  return memCount;
}
