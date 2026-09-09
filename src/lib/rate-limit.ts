import { headers } from 'next/headers'

// ponytail: in-memory, single-instance only — resets on redeploy and isn't
// shared across instances. Fine at this app's current scale; upgrade to a
// KV-backed limiter (e.g. Upstash) if it ever runs multi-instance.
const buckets = new Map<string, { count: number; resetAt: number }>()

export async function getClientIp(): Promise<string> {
  try {
    const headerList = await headers()
    const forwardedFor = headerList.get('x-forwarded-for')
    return (
      headerList.get('cf-connecting-ip') ||
      (forwardedFor ? forwardedFor.split(',')[0].trim() : null) ||
      headerList.get('x-real-ip') ||
      'unknown'
    )
  } catch {
    return 'unknown'
  }
}

// Returns true if the call is allowed, false if the caller is over the limit.
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (bucket.count >= limit) return false
  bucket.count++
  return true
}
