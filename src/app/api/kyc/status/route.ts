import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/app/actions/auth'
import { DataStore } from '@/lib/data-store'

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const kyc = await DataStore.getKycStatus(user.id)
    return NextResponse.json(kyc)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
