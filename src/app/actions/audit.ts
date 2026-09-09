'use server'

import { DataStore } from '@/lib/data-store'
import { getCurrentUser } from './auth'

import { headers } from 'next/headers'

// ═══════════════════════════════════════════════════════════════════════════
// Audit Log Actions
// ═══════════════════════════════════════════════════════════════════════════

export async function getAuditLogsAction(filter?: {
  actor?: 'MEMBER' | 'ADMIN'
  module?: string
  limit?: number
}) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') return []
  try {
    return await DataStore.getAuditLogs(filter)
  } catch (_) {
    return []
  }
}

// Retention policy (ISO 27001 A.5.33): audit log rows are kept for 12 months,
// then purged by a scheduled job (see /api/cron/purge-audit-logs). Change
// this single number if the retention requirement changes.
//
// This is an exported 'use server' function, so it's independently reachable
// over the network regardless of the cron route's own CRON_SECRET check —
// the guard has to live here too, or that check is decorative.
export async function purgeExpiredAuditLogsAction() {
  const headerList = await headers()
  const authHeader = headerList.get('authorization')
  const isCron = !!process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`

  if (!isCron) {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN' || user.isSuperAdmin !== true) {
      throw new Error('Unauthorized: hanya cron job atau superadmin yang dapat memicu retensi audit log.')
    }
  }

  const result = await DataStore.purgeExpiredAuditLogs(365)
  return { success: true, deletedCount: (result as any)?.count ?? 0 }
}
