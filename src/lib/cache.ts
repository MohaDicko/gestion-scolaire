import { Redis } from '@upstash/redis';

// Initialize Upstash Redis
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = redisUrl && redisToken ? new Redis({
  url: redisUrl,
  token: redisToken,
}) : null;

// Local Memory Fallback
const memoryCache = new Map<string, { value: any; expiresAt: number }>();

/**
 * Get data from cache
 * @param key Cache key
 * @returns Parsed JSON data or null if missing/expired
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
  if (redis) {
    try {
      const data = await redis.get<T>(key);
      return data ?? null;
    } catch (error) {
      console.warn("Redis get failed, falling back to memory cache:", error);
    }
  }
  
  // Memory fallback
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value as T;
}

/**
 * Set data in cache
 * @param key Cache key
 * @param value Data to cache (must be JSON serializable)
 * @param ttlSecs Time-to-live in seconds
 */
export async function setCachedData(key: string, value: any, ttlSecs: number): Promise<void> {
  if (redis) {
    try {
      await redis.set(key, value, { ex: ttlSecs });
      return;
    } catch (error) {
      console.warn("Redis set failed, falling back to memory cache:", error);
    }
  }

  // Memory fallback
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSecs * 1000
  });
}

/**
 * Invalidate a specific cache key
 * @param key Cache key
 */
export async function invalidateCache(key: string): Promise<void> {
  if (redis) {
    try {
      await redis.del(key);
      return;
    } catch (error) {
      console.warn("Redis del failed, falling back to memory cache:", error);
    }
  }
  
  memoryCache.delete(key);
}
