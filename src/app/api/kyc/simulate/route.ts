import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/app/actions/auth'
import { DataStore } from '@/lib/data-store'

export async function POST(req: NextRequest) {
  try {
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
    return NextResponse.json({
      success: true,
      status: (updatedUser as any).kycStatus
    })
  } catch (err: any) {
    console.error('[KYC Simulate API] Error:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
