/**
 * IP-based sliding-window rate limiter backed by Vercel KV.
 * Falls back to "allow" gracefully when KV is unavailable (dev / cold start).
 */

async function getKV() {
  try {
    const { kv } = await import('@vercel/kv');
    return kv;
  } catch {
    return null;
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // epoch ms
}

/**
 * Sliding-window rate limit.
 * @param key      Unique key (e.g. `rl:waitlist:1.2.3.4`)
 * @param limit    Max requests allowed in the window
 * @param windowMs Window length in milliseconds
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const kv = await getKV();
  if (!kv) return { allowed: true, remaining: limit, resetAt: Date.now() + windowMs };

  const now = Date.now();
  const windowStart = now - windowMs;
  const kvKey = `rl:${key}`;

  try {
    // Store each request as a timestamped member in a sorted set
    // Score = timestamp so we can trim old entries with zremrangebyscore
    const pipe = kv.pipeline();
    pipe.zadd(kvKey, { score: now, member: `${now}-${Math.random()}` });
    pipe.zremrangebyscore(kvKey, 0, windowStart);
    pipe.zcard(kvKey);
    pipe.expire(kvKey, Math.ceil(windowMs / 1000) + 5);
    const results = await pipe.exec();

    const count = (results?.[2] as number) ?? 1;
    const resetAt = now + windowMs;
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      resetAt,
    };
  } catch {
    return { allowed: true, remaining: limit, resetAt: Date.now() + windowMs };
  }
}

/** Extract best-effort IP from Next.js request headers. */
export function getIP(req: { headers: { get(k: string): string | null } }): string {
  return (
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}
