import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitEntry>();

// Cleanup old memory entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    memoryStore.forEach((entry, key) => {
      if (entry.resetAt < now) memoryStore.delete(key);
    });
  }, 5 * 60 * 1000);
}

export interface RateLimitOptions {
  /** Max number of requests allowed */
  limit: number;
  /** Window duration in seconds */
  windowSecs: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

// Initialize Upstash Redis only if env vars are present
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

let upstashRatelimit: Ratelimit | null = null;

if (redisUrl && redisToken) {
  upstashRatelimit = new Ratelimit({
    redis: new Redis({
      url: redisUrl,
      token: redisToken,
    }),
    limiter: Ratelimit.slidingWindow(100, '60 s'),
    analytics: true,
  });
}

export async function rateLimit(key: string, options: RateLimitOptions): Promise<RateLimitResult> {
  // Use Upstash if configured
  if (upstashRatelimit) {
    try {
      // Create a dynamic ratelimiter if options differ from default (100 per 60s)
      let limiter = upstashRatelimit;
      if (options.limit !== 100 || options.windowSecs !== 60) {
          limiter = new Ratelimit({
            redis: new Redis({
              url: redisUrl!,
              token: redisToken!,
            }),
            limiter: Ratelimit.slidingWindow(options.limit, `${options.windowSecs} s`),
            analytics: true,
          });
      }

      const { success, remaining, reset } = await limiter.limit(key);
      return { success, remaining, resetAt: reset };
    } catch (error) {
      console.warn("Upstash rate limit failed, falling back to memory:", error);
      // Fallback to memory below if Upstash call fails
    }
  }

  // Memory Fallback
  const now = Date.now();
  const windowMs = options.windowSecs * 1000;

  let entry = memoryStore.get(key);

  if (!entry || entry.resetAt < now) {
    entry = { count: 1, resetAt: now + windowMs };
    memoryStore.set(key, entry);
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
