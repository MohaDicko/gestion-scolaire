/**
 * Simple in-memory rate limiter for Next.js API Routes.
 * Uses a sliding window algorithm. No external dependencies required.
 * 
 * For production at scale, replace with @upstash/ratelimit + Redis.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    store.forEach((entry, key) => {
      if (entry.resetAt < now) store.delete(key);
    });
  }, 5 * 60 * 1000);
}

export interface RateLimitOptions {
  /** Max number of requests allowed */
  limit: number;
  /** Window duration in seconds */
  windowSecs: number;
}

export function rateLimit(key: string, options: RateLimitOptions): { success: boolean; remaining: number; resetAt: number } {
  const now      = Date.now();
  const windowMs = options.windowSecs * 1000;

  let entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    entry = { count: 1, resetAt: now + windowMs };
    store.set(key, entry);
    return { success: true, remaining: options.limit - 1, resetAt: entry.resetAt };
  }

  entry.count++;

  if (entry.count > options.limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { success: true, remaining: options.limit - entry.count, resetAt: entry.resetAt };
}

/**
 * Helper: get client IP from Next.js request
 */
export function getClientIp(request: Request): string {
  const headers = request.headers;
  return (
    headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  );
}
