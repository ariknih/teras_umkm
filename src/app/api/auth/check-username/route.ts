import { NextRequest, NextResponse } from 'next/server'
import { DataStore } from '@/lib/data-store'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const username = searchParams.get('username')

  if (!username || username.length < 3) {
    return NextResponse.json({ available: false, message: 'Username minimal 3 karakter' }, { status: 400 })
  }

  // Hanya boleh huruf, angka, underscore, titik, dash
  const cleaned = username.toLowerCase().trim()
  const valid = /^[a-z0-9_.-]{3,30}$/.test(cleaned)
  if (!valid) {
    return NextResponse.json({
      available: false,
      message: 'Username hanya boleh huruf kecil, angka, titik, underscore, atau dash (3-30 karakter)'
    }, { status: 400 })
  }

  const excludeUserId = searchParams.get('excludeUserId') || undefined
  const taken = await DataStore.isUsernameTaken(cleaned, excludeUserId)

  return NextResponse.json({
    available: !taken,
    username: cleaned,
    message: taken ? 'Username sudah digunakan' : 'Username tersedia'
  })
}
