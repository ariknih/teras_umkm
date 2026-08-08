import { NextRequest, NextResponse } from 'next/server'
import { DataStore } from '@/lib/data-store'
import { getCurrentUser } from '@/app/actions/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const methods = await DataStore.getPaymentMethods()
    return NextResponse.json(methods)
  } catch (error) {
    console.error('Error fetching payment methods:', error)
    return NextResponse.json({ error: 'Failed to fetch payment methods' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (!(user as any).isSuperAdmin && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { type, providerName, accountName, accountNumber, qrImageUrl, qrRawString, isActive } = body

    if (!type || !providerName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const newMethod = await DataStore.createPaymentMethod({
      type,
      providerName,
      accountName,
      accountNumber,
      qrImageUrl,
      qrRawString,
      isActive: isActive !== undefined ? isActive : true
    })

    return NextResponse.json(newMethod)
  } catch (error) {
    console.error('Error creating payment method:', error)
    return NextResponse.json({ error: 'Failed to create payment method' }, { status: 500 })
  }
}
