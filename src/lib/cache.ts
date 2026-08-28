/**
 * Universal Server Cache with Redis and High-Performance In-Memory Fallback.
 * Provides instant read acceleration, TTL expiration, and pattern-based invalidation.
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

// In-Memory LRU / Map Fallback
const memoryStore = new Map<string, CacheEntry<any>>()
const MAX_MEMORY_ITEMS = 1000

// Clean up expired items periodically in memory
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of memoryStore.entries()) {
      if (entry.expiresAt > 0 && entry.expiresAt < now) {
        memoryStore.delete(key)
      }
    }
  }, 60000)
}

/**
 * Get item from cache (Redis REST if available, otherwise Memory)
 */
export async function getCache<T>(key: string): Promise<T | null> {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN

  // 1. Try Upstash Redis REST API if configured
  if (upstashUrl && upstashToken) {
    try {
      const res = await fetch(`${upstashUrl}/get/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${upstashToken}` },
        cache: 'no-store'
      })
      if (res.ok) {
        const data = await res.json()
        if (data.result !== null && data.result !== undefined) {
          try {
            return JSON.parse(data.result) as T
          } catch {
            return data.result as T
          }
        }
      }
    } catch (e) {
      console.warn(`[Redis Cache] GET error for key "${key}", falling back to memory:`, e)
    }
  }

  // 2. Memory Cache Fallback
  const entry = memoryStore.get(key)
  if (!entry) return null

  if (entry.expiresAt > 0 && entry.expiresAt < Date.now()) {
    memoryStore.delete(key)
    return null
  }

  return entry.value as T
}

/**
 * Set item in cache with TTL in seconds (default 300s / 5 minutes)
 */
export async function setCache<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN

  // 1. Try Upstash Redis REST API if configured
  if (upstashUrl && upstashToken) {
    try {
      const payload = typeof value === 'string' ? value : JSON.stringify(value)
      await fetch(`${upstashUrl}/set/${encodeURIComponent(key)}/${encodeURIComponent(payload)}${ttlSeconds > 0 ? `?EX=${ttlSeconds}` : ''}`, {
        headers: { Authorization: `Bearer ${upstashToken}` },
        cache: 'no-store'
      })
    } catch (e) {
      console.warn(`[Redis Cache] SET error for key "${key}":`, e)
    }
  }

  // 2. Always maintain memory cache
  if (memoryStore.size >= MAX_MEMORY_ITEMS) {
    const oldestKey = memoryStore.keys().next().value
    if (oldestKey) memoryStore.delete(oldestKey)
  }

  memoryStore.set(key, {
    value,
    expiresAt: ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : 0
  })
}

/**
 * Delete a specific key from cache
 */
export async function deleteCache(key: string): Promise<void> {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (upstashUrl && upstashToken) {
    try {
      await fetch(`${upstashUrl}/del/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${upstashToken}` },
        cache: 'no-store'
      })
    } catch (e) {
      console.warn(`[Redis Cache] DEL error for key "${key}":`, e)
    }
  }

  memoryStore.delete(key)
}

/**
 * Invalidate multiple keys matching a prefix/pattern
 */
export async function invalidateCachePattern(prefix: string): Promise<void> {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (upstashUrl && upstashToken) {
    try {
      const keysRes = await fetch(`${upstashUrl}/keys/${encodeURIComponent(prefix)}*`, {
        headers: { Authorization: `Bearer ${upstashToken}` },
        cache: 'no-store'
      })
      if (keysRes.ok) {
        const keysData = await keysRes.json()
        if (Array.isArray(keysData.result) && keysData.result.length > 0) {
          await fetch(`${upstashUrl}/del/${keysData.result.map((k: string) => encodeURIComponent(k)).join('/')}`, {
            headers: { Authorization: `Bearer ${upstashToken}` },
            cache: 'no-store'
          })
        }
      }
    } catch (e) {
      console.warn(`[Redis Cache] Invalidation error for prefix "${prefix}":`, e)
    }
  }

  for (const key of memoryStore.keys()) {
    if (key.startsWith(prefix)) {
      memoryStore.delete(key)
    }
  }
}

/**
 * Cache Wrapper: Returns cached data if available, otherwise executes fetchFn and caches result
 */
export async function cacheWrap<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  const cached = await getCache<T>(key)
  if (cached !== null && cached !== undefined) {
    return cached
  }

  const fresh = await fetchFn()
  if (fresh !== null && fresh !== undefined) {
    await setCache(key, fresh, ttlSeconds)
  }
  return fresh
}
