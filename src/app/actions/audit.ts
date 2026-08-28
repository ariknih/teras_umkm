'use server'

import { DataStore } from '@/lib/data-store'
import { getCurrentUser } from './auth'

import { headers } from 'next/headers'

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
    let clientIp = params.ipAddress
    if (!clientIp) {
      try {
        const headerList = await headers()
        const forwardedFor = headerList.get('x-forwarded-for')
        clientIp = headerList.get('cf-connecting-ip') || 
                   (forwardedFor ? forwardedFor.split(',')[0].trim() : null) || 
                   headerList.get('x-real-ip') || 
                   '180.252.164.22'
      } catch {
        clientIp = '180.252.164.22'
      }
    }
    await DataStore.createAuditLog({
      ...params,
      ipAddress: clientIp
    })
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
