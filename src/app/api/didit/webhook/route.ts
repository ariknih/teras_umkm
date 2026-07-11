import { NextRequest, NextResponse } from 'next/server'
import { DataStore } from '@/lib/data-store'
import crypto from 'crypto'

/**
 * Didit Webhook V3 Handler
 * Verifies X-Signature-V2 (HMAC-SHA256 of canonicalised body)
 * then dispatches on status (case-sensitive literals).
 *
 * Canonicalisation: shortenFloats → sortKeys → JSON.stringify (unescaped Unicode)
 */

// Whole-number floats (1.0 → 1) — matches Didit server canonicalization
function shortenFloats(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(shortenFloats)
  if (v && typeof v === 'object') {
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, shortenFloats(x)])
    )
  }
  if (typeof v === 'number' && !Number.isInteger(v) && v % 1 === 0) return Math.trunc(v)
  return v
}

// Recursive lexicographic key sort (array order preserved)
function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys)
  if (v && typeof v === 'object') {
    return Object.keys(v as object)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = sortKeys((v as Record<string, unknown>)[k])
        return acc
      }, {})
  }
  return v
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()

    // 1. Read signature headers
    const sig = req.headers.get('x-signature-v2') ?? ''
    const ts = Number(req.headers.get('x-timestamp'))
    const secret = process.env.DIDIT_WEBHOOK_SECRET

    // 2. Freshness check — reject if older/newer than 300s (replay protection)
    if (!ts || Math.abs(Date.now() / 1000 - ts) > 300) {
      console.error('[Didit Webhook] Stale or missing timestamp')
      return new NextResponse('stale', { status: 401 })
    }

    // 3. Verify HMAC signature using X-Signature-V2
    if (secret) {
      if (!sig) {
        console.error('[Didit Webhook] Missing x-signature-v2 header')
        return new NextResponse('missing signature', { status: 401 })
      }

      const parsed = JSON.parse(rawBody)
      const canonical = JSON.stringify(sortKeys(shortenFloats(parsed)))

      const expected = crypto
        .createHmac('sha256', secret)
        .update(canonical, 'utf8')
        .digest('hex')

      try {
        if (
          sig.length !== expected.length ||
          !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
        ) {
          console.error('[Didit Webhook] Signature mismatch')
          return new NextResponse('bad sig', { status: 401 })
        }
      } catch (err) {
        console.error('[Didit Webhook] Signature comparison failed:', err)
        return new NextResponse('bad sig', { status: 401 })
      }
    } else {
      console.warn('[Didit Webhook] DIDIT_WEBHOOK_SECRET not configured — skipping verification')
    }

    const payload = JSON.parse(rawBody)
    console.log('[Didit Webhook] Received:', JSON.stringify(payload, null, 2))

    const { event_id, session_id, status, vendor_data } = payload
    const userId = vendor_data

    if (!userId) {
      console.warn('[Didit Webhook] No vendor_data (userId) in payload')
      return NextResponse.json({ received: true })
    }

    // 4. Dispatch on status — case-sensitive literals (V3 spec)
    switch (status) {
      case 'Approved':
        await DataStore.updateKycStatus(userId, 'VERIFIED', session_id)
        console.log(`[Didit Webhook] User ${userId} KYC VERIFIED`)
        break
      case 'Declined':
        await DataStore.updateKycStatus(userId, 'REJECTED', session_id)
        console.log(`[Didit Webhook] User ${userId} KYC DECLINED`)
        break
      case 'In Review':
      case 'Resubmitted':
      case 'Awaiting User':
      case 'In Progress':
      case 'Not Started':
        await DataStore.updateKycStatus(userId, 'PENDING', session_id)
        console.log(`[Didit Webhook] User ${userId} KYC status: ${status}`)
        break
      case 'Kyc Expired':
        await DataStore.updateKycStatus(userId, 'NOT_SUBMITTED', session_id)
        console.log(`[Didit Webhook] User ${userId} KYC expired — needs re-verification`)
        break
      case 'Abandoned':
      case 'Expired':
        // No-op: user didn't finish or session timed out
        console.log(`[Didit Webhook] User ${userId} KYC ${status} — no action`)
        break
      default:
        console.warn(`[Didit Webhook] Unknown status: ${status}`)
    }

    // 5. Return 2xx immediately (Didit timeout = 5s)
    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('[Didit Webhook] Error:', err)
    // Always 200 so Didit doesn't retry endlessly
    return NextResponse.json({ received: true, error: err.message })
  }
}
