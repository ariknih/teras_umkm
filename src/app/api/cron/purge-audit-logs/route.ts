import { NextRequest, NextResponse } from 'next/server'
import { purgeExpiredAuditLogsAction } from '@/app/actions/audit'

// Vercel Cron calls this with `Authorization: Bearer $CRON_SECRET` — see
// vercel.json for the schedule. Enforces the audit log retention policy
// (AUDIT_LOG_RETENTION_DAYS in src/app/actions/audit.ts).
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await purgeExpiredAuditLogsAction()
  return NextResponse.json(result)
}
