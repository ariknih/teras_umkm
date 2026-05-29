import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import crypto from 'crypto'
import { DataStore } from '@/lib/data-store'

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key-12345')

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state') || ''
  
  if (!code) {
    return NextResponse.redirect(new URL('/auth?error=Code+tidak+ditemukan', request.url))
  }
  
  // Extract role from state parameter
  let role: 'CUSTOMER' | 'MERCHANT' | 'AFFILIATE' = 'CUSTOMER'
  const stateParams = new URLSearchParams(state)
  const stateRole = stateParams.get('role')
  if (stateRole === 'MERCHANT' || stateRole === 'AFFILIATE') {
    role = stateRole
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const redirectUri = `${appUrl}/api/auth/google/callback`

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId || '',
        client_secret: clientSecret || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const errData = await tokenResponse.json()
      console.error('Google token exchange error:', errData)
      return NextResponse.redirect(new URL('/auth?error=Gagal+menukarkan+code+Google', request.url))
    }

    const { access_token } = await tokenResponse.json()

    // Get user profile info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })

    if (!userResponse.ok) {
      return NextResponse.redirect(new URL('/auth?error=Gagal+mengambil+profil+Google', request.url))
    }

    const googleUser = await userResponse.json()
    const email = googleUser.email
    const name = googleUser.name

    if (!email) {
      return NextResponse.redirect(new URL('/auth?error=Email+tidak+ditemukan+di+akun+Google', request.url))
    }

    // Check if user already exists
    let user = await DataStore.findUserByEmail(email)
    if (!user) {
      // Create a new user with google details
      const randomPassword = crypto.randomBytes(16).toString('hex')
      const passwordHash = crypto.createHash('sha256').update(randomPassword).digest('hex')
      user = await DataStore.createUser({
        email,
        name: name || email.split('@')[0],
        passwordHash,
        role
      })
    } else {
      // If user exists, but has a different role and the selected role is valid, update it!
      // This allows existing sandbox Google accounts to switch roles during Google Login.
      if (user.role !== role && user.role !== 'ADMIN' && user.role !== 'CUSTOMER_SERVICE') {
        const updated = await DataStore.updateUserRole(user.id, role)
        if (updated) {
          user = updated
        }
      }
    }

    // Create our app session JWT
    const token = await new SignJWT({ id: user.id, email: user.email, role: user.role, name: user.name })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(SECRET_KEY)

    // Redirect to home/dashboard with cookie set
    const destinationUrl = user.role === 'ADMIN' ? '/admin' : user.role === 'CUSTOMER_SERVICE' ? '/cs' : '/'
    const response = NextResponse.redirect(new URL(destinationUrl, request.url))
    
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return response
  } catch (e: any) {
    console.error('Google OAuth callback error:', e)
    return NextResponse.redirect(new URL(`/auth?error=${encodeURIComponent(e.message || 'Error autentikasi')}`, request.url))
  }
}
