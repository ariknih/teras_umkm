import { NextRequest, NextResponse } from 'next/server'
import { purgeExpiredAuditLogsAction } from '@/app/actions/audit'
import { purgeExpiredRateLimitAttempts } from '@/lib/rate-limit'

// Vercel Cron calls this with `Authorization: Bearer $CRON_SECRET` — see
// vercel.json for the schedule. Enforces the audit log retention policy
// (AUDIT_LOG_RETENTION_DAYS in src/app/actions/audit.ts) and clears out old
// rate-limit attempt rows (longest window is 10 min, so 1hr retention here
// is generous headroom) — reuses this existing daily cron slot instead of
// provisioning a second one.
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [auditResult, rateLimitResult] = await Promise.all([
    purgeExpiredAuditLogsAction(),
    // Table may not exist yet on a deploy that ran before `prisma db push` —
    // don't let that discard the audit purge result that already succeeded.
    purgeExpiredRateLimitAttempts(60 * 60 * 1000).catch(() => ({ count: 0 }))
  ])
  return NextResponse.json({ ...auditResult, rateLimitDeletedCount: rateLimitResult.count })
}
