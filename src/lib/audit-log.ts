import { DataStore } from '@/lib/data-store'
import { getCurrentUser } from '@/app/actions/auth'
import { headers } from 'next/headers'

// Deliberately NOT a 'use server' export: this is called from within other
// server actions and route handlers, never directly from client code, so it
// must not itself become an independently client-callable Server Action —
// that was exactly how its identity fields used to be forgeable.
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
  // Identity fields are never trusted from the caller when a real session
  // exists — otherwise anyone could forge audit rows attributed to another
  // user. The pre-auth LOGIN_FAILED path (no session yet) is the one
  // legitimate case where the caller-supplied actorId (the attempted
  // email/username) is kept as-is.
  const sessionUser = await getCurrentUser()
  const verifiedParams = sessionUser
    ? {
        ...params,
        actor: (sessionUser.role === 'ADMIN' ? 'ADMIN' : 'MEMBER') as 'MEMBER' | 'ADMIN',
        actorId: sessionUser.id,
        actorName: sessionUser.name || sessionUser.email
      }
    : params

  let clientIp = params.ipAddress
  if (!clientIp) {
    try {
      const headerList = await headers()
      const forwardedFor = headerList.get('x-forwarded-for')
      clientIp = headerList.get('cf-connecting-ip') ||
                 (forwardedFor ? forwardedFor.split(',')[0].trim() : null) ||
                 headerList.get('x-real-ip') ||
                 undefined
    } catch {
      clientIp = undefined
    }
  }
  try {
    await DataStore.createAuditLog({
      ...verifiedParams,
      ipAddress: clientIp
    })
  } catch (err) {
    // Audit writes must never break the main flow, but a failure here must
    // not vanish silently either — it's evidence of a broken audit trail.
    console.error('AUDIT LOG WRITE FAILED:', params.action, params.module, err)
  }
}
