import { headers } from 'next/headers'
import { db } from '@/lib/db'

// Resolves the real client IP, resistant to client-supplied header spoofing.
// - cf-connecting-ip is only trusted when TRUST_CLOUDFLARE_IP=1 is set for this
//   deployment — Cloudflare overwrites this header at its own edge, but only if
//   Cloudflare is actually the entry point; otherwise a client could set it
//   themselves. Verify with `curl -sI https://<domain> | grep -i server` (look
//   for `server: cloudflare`) before enabling per environment.
// - x-real-ip is Vercel's own edge-set header — a client cannot override what
//   Vercel itself writes there, unlike x-forwarded-for (whose first entry is
//   client-controlled), so that's the default trust source instead.
// Returns null when no trusted IP is resolvable (e.g. local dev) so callers can
// skip the IP-keyed check instead of lumping all such requests into one shared
// "unknown" bucket that could lock out unrelated users.
export async function getClientIp(): Promise<string | null> {
  try {
    const headerList = await headers()
    if (process.env.TRUST_CLOUDFLARE_IP === '1') {
      const cf = headerList.get('cf-connecting-ip')
      if (cf) return cf
    }
    return headerList.get('x-real-ip') || null
  } catch {
    return null
  }
}

// ponytail: sliding-window log against Postgres (the DB this app already
// hard-depends on for login itself), not Redis/Upstash — correct at window
// boundaries and cheap at this app's login volume. If login ever becomes
// high-QPS, upgrade to an Upstash INCR+TTL counter instead of scaling this
// COUNT-then-INSERT query.
// ponytail: count-then-insert isn't atomic, so two concurrent requests at the
// limit boundary could both slip through — acceptable for a defense-in-depth
// check backed by password verification as the real security boundary.
export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  try {
    const since = new Date(Date.now() - windowMs)
    const count = await db.rateLimitAttempt.count({ where: { key, createdAt: { gte: since } } })
    if (count >= limit) return false
    await db.rateLimitAttempt.create({ data: { key } })
    return true
  } catch (e) {
    // ponytail: fail open on limiter errors — a DB hiccup here must not take
    // down logins/OTP entirely; the password/OTP check remains the real gate.
    console.error('[rate-limit] check failed, allowing request:', e)
    return true
  }
}

// Best-effort: clears a key's attempt history, e.g. after a successful login
// so earlier failed attempts don't count against the next window.
export async function resetRateLimit(key: string): Promise<void> {
  try {
    await db.rateLimitAttempt.deleteMany({ where: { key } })
  } catch (e) {
    console.error('[rate-limit] reset failed:', e)
  }
}

// Deletes attempt rows older than `retentionMs`. Called from the scheduled
// purge cron (see /api/cron/purge-audit-logs) — the longest rate-limit window
// in this app is 10 minutes, so a 1-hour retention is generous headroom.
export async function purgeExpiredRateLimitAttempts(retentionMs: number) {
  const cutoff = new Date(Date.now() - retentionMs)
  return db.rateLimitAttempt.deleteMany({ where: { createdAt: { lt: cutoff } } })
}
