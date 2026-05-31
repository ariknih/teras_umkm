import { NextRequest, NextResponse } from 'next/server'
import { DataStore } from '@/lib/data-store'
import { getCurrentUser } from '@/app/actions/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const notifications = await DataStore.getUserNotifications(user.id)
    return NextResponse.json(notifications)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal memuat notifikasi' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    await DataStore.markNotificationsAsRead(user.id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal memperbarui notifikasi' }, { status: 500 })
  }
}
