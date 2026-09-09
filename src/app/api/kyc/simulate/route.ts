import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/app/actions/auth'
import { DataStore } from '@/lib/data-store'
import { logAudit } from '@/lib/audit-log'

// ponytail: this is a testing-only shortcut (see the "Reset Status KYC (Untuk
// Testing)" button in Settings) that lets a user set their own KYC status.
// It previously had no environment gate at all — any logged-in user could
// POST {status:'VERIFIED'} and self-approve, bypassing Didit verification
// entirely. Locked to non-production, same pattern as the Midtrans simulate flag.
export async function POST(req: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
    }

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { status } = await req.json()
    const targetStatus = status || 'VERIFIED'

    if (!['NOT_SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED', 'VERIFIED'].includes(targetStatus)) {
      return NextResponse.json({ error: 'Invalid target status' }, { status: 400 })
    }

    const updatedUser = await DataStore.updateKycStatus(user.id, targetStatus, `mock-session-${Date.now()}`)
    await logAudit({
      actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'SIMULATE_KYC_STATUS',
      module: 'KYC',
      targetId: user.id,
      targetType: 'USER',
      detail: `Simulasi status KYC diubah menjadi ${targetStatus} (non-production).`
    })
    return NextResponse.json({
      success: true,
      status: (updatedUser as any).kycStatus
    })
  } catch (err: any) {
    console.error('[KYC Simulate API] Error:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
