import { NextRequest, NextResponse } from 'next/server'
import { DataStore } from '@/lib/data-store'
import { getCurrentUser } from '@/app/actions/auth'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(user as any).isSuperAdmin && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { isActive } = body

    const updatedMethod = await DataStore.updatePaymentMethod(id, { isActive })
    return NextResponse.json(updatedMethod)
  } catch (error) {
    console.error('Error updating payment method:', error)
    return NextResponse.json({ error: 'Failed to update payment method' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(user as any).isSuperAdmin && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    await DataStore.deletePaymentMethod(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting payment method:', error)
    return NextResponse.json({ error: 'Failed to delete payment method' }, { status: 500 })
  }
}
