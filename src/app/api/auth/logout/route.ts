import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const cleanHost = host.split(':')[0].toLowerCase()

  const response = NextResponse.redirect(new URL('/', request.url))

  // List of domains to explicitly clear cookies for
  const domainsToClear = [
    undefined, // Host-only
    cleanHost, // e.g. prev.saloka.id
    `.${cleanHost}`, // e.g. .prev.saloka.id
    '.saloka.id',
    'saloka.id',
    '.varro.my.id',
    '.localhost'
  ]

  for (const domain of domainsToClear) {
    try {
      response.cookies.set('session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
        expires: new Date(0),
        ...(domain ? { domain } : {})
      })
    } catch (_) {}
  }

  return response
}

export async function POST(request: NextRequest) {
  return GET(request)
}
