import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/auth', request.url))
  
  // Delete the session cookie
  response.cookies.delete('session')
  
  return response
}
