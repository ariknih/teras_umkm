'use server'

import { DataStore } from '@/lib/data-store'
import { getCurrentUser } from './auth'

// ═══════════════════════════════════════════════════════════════════════════
// Audit Log Actions
// ═══════════════════════════════════════════════════════════════════════════

export async function logAudit(params: {
  actor: 'MEMBER' | 'ADMIN'
  actorId: string
  actorName?: string
  action: string
  module: string
  targetId?: string
  targetType?: string
  detail?: string
  ipAddress?: string
}) {
  try {
    await DataStore.createAuditLog(params)
  } catch (_) {
    // Fail silently — audit log should never break main flow
  }
}

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
