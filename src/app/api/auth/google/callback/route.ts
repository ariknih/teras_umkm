import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import crypto from 'crypto'
import { DataStore } from '@/lib/data-store'
import { getCookieDomain } from '@/lib/cookie-domain'
import { logAudit } from '@/lib/audit-log'
import { hashPassword } from '@/lib/password'

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}
const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET)

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
    const requestUrl = new URL(request.url)
    const redirectUri = `${requestUrl.origin}/api/auth/google/callback`

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
    let isNewUser = false
    let user = await DataStore.findUserByEmail(email)
    if (!user) {
      isNewUser = true
      // Create a new user with google details
      const randomPassword = crypto.randomBytes(16).toString('hex')
      const passwordHash = await hashPassword(randomPassword)
      
      // Generate a unique username for Google OAuth
      let baseUsername = (name || email.split('@')[0]).toLowerCase().replace(/[^a-z0-9]/g, '')
      if (baseUsername.length < 3) baseUsername = "user"
      let username = baseUsername
      let counter = 1
      while (await DataStore.findUserByUsername(username)) {
        username = `${baseUsername}${counter}`
        counter++
      }

      // Saloka referral: same first-touch affiliate_ref cookie register()
      // consumes — Google signups previously dropped the attribution entirely.
      const refCode = request.cookies.get('affiliate_ref')?.value
      const referrer = refCode ? await DataStore.findUserByReferralCode(refCode) : null

      user = await DataStore.createUser({
        email: email.toLowerCase(),
        name: name || email.split('@')[0],
        username,
        passwordHash,
        role,
        parentAffiliateId: referrer?.id
      })
      if (!user) {
        return NextResponse.redirect(new URL('/auth?error=Gagal+membuat+akun', request.url))
      }
      await logAudit({
        actor: 'MEMBER',
        actorId: user.id,
        actorName: user.name || user.email,
        action: 'REGISTER_GOOGLE',
        module: 'AUTH',
        targetId: user.id,
        targetType: 'USER',
        detail: `Daftar via Google OAuth sebagai ${role} (@${username}).`
      })
    } else {
      // Existing users keep their role. The Login tab has no role picker, so
      // `role` there is always the CUSTOMER default — applying it silently
      // downgraded every Merchant who signed in with Google.
      await logAudit({
        actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
        actorId: user.id,
        actorName: user.name || user.email,
        action: 'LOGIN_SUCCESS',
        module: 'AUTH',
        detail: 'Login via Google OAuth.'
      })
    }

    if (!user) {
      return NextResponse.redirect(new URL('/auth?error=Gagal+memuat+akun', request.url))
    }

    // Create our app session JWT
    const token = await new SignJWT({ id: user.id, email: user.email, role: user.role, name: user.name })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(SECRET_KEY)

    // Redirect to home/dashboard with cookie set
    const destinationUrl = isNewUser 
      ? '/auth/select-role' 
      : (user.role === 'ADMIN' ? '/cms_admin/overview' : user.role === 'CUSTOMER_SERVICE' ? '/cs' : '/')
      
    const response = NextResponse.redirect(new URL(destinationUrl, request.url))
    // Consumed by this signup — don't let it leak into another signup on this browser.
    if (isNewUser) response.cookies.delete('affiliate_ref')
    const cookieDomain = getCookieDomain(requestUrl.host)

    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      ...(cookieDomain ? { domain: cookieDomain } : {})
    })

    return response
  } catch (e: any) {
    console.error('Google OAuth callback error:', e)
    return NextResponse.redirect(new URL(`/auth?error=${encodeURIComponent(e.message || 'Error autentikasi')}`, request.url))
  }
}
