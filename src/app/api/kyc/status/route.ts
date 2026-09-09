import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/app/actions/auth'
import { DataStore } from '@/lib/data-store'
import { logAudit } from '@/lib/audit-log'

const DIDIT_API_KEY = process.env.DIDIT_API_KEY!
const DIDIT_BASE_URL = process.env.DIDIT_BASE_URL || 'https://verification.didit.me'

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const kyc = await DataStore.getKycStatus(user.id)
    let status = kyc.status
    let verifiedAt = kyc.verifiedAt

    // Fallback polling: if status is PENDING and we have a session ID, check Didit API directly
    if (status === 'PENDING' && kyc.sessionId) {
      try {
        const diditRes = await fetch(`${DIDIT_BASE_URL}/v3/session/${kyc.sessionId}/decision/`, {
          headers: {
            'x-api-key': DIDIT_API_KEY,
          },
        })
        if (diditRes.ok) {
          const decision = await diditRes.json()
          console.log('[KYC Status Poll] Didit response decision:', decision)
          
          if (decision.status === 'Approved') {
            await DataStore.updateKycStatus(user.id, 'VERIFIED', kyc.sessionId)
            status = 'VERIFIED'
            verifiedAt = new Date()
            await logAudit({
              actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
              actorId: user.id,
              actorName: user.name || user.email,
              action: 'KYC_STATUS_SYNCED',
              module: 'KYC',
              targetId: user.id,
              targetType: 'USER',
              detail: 'Didit polling: status menjadi VERIFIED.'
            })
          } else if (decision.status === 'Declined') {
            await DataStore.updateKycStatus(user.id, 'REJECTED', kyc.sessionId)
            status = 'REJECTED'
            await logAudit({
              actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
              actorId: user.id,
              actorName: user.name || user.email,
              action: 'KYC_STATUS_SYNCED',
              module: 'KYC',
              targetId: user.id,
              targetType: 'USER',
              detail: 'Didit polling: status menjadi REJECTED.'
            })
          } else if (decision.status === 'Kyc Expired') {
            await DataStore.updateKycStatus(user.id, 'NOT_SUBMITTED', kyc.sessionId)
            status = 'NOT_SUBMITTED'
            await logAudit({
              actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
              actorId: user.id,
              actorName: user.name || user.email,
              action: 'KYC_STATUS_SYNCED',
              module: 'KYC',
              targetId: user.id,
              targetType: 'USER',
              detail: 'Didit polling: sesi kedaluwarsa, status menjadi NOT_SUBMITTED.'
            })
          }
        }
      } catch (pollErr) {
        console.error('[KYC Status Poll] Direct check failed:', pollErr)
      }
    }

    return NextResponse.json({
      status,
      sessionId: kyc.sessionId,
      verifiedAt
    })
  } catch (err: any) {
    console.error('[KYC Status API] Error:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
