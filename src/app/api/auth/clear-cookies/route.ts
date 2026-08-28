import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()
  for (const cookie of allCookies) {
    cookieStore.delete(cookie.name)
  }
  return NextResponse.json({ success: true, message: 'Cookies cleared' })
}

export async function GET() {
  return POST()
}
