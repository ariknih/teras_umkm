'use server'

import { cookies, headers } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import crypto from 'crypto'
import { DataStore } from '@/lib/data-store'
import { db } from '@/lib/db'
import { getCookieDomain } from '@/lib/cookie-domain'
import { logAudit } from '@/lib/audit-log'
import { hashPassword, verifyPassword, isLegacyHash } from '@/lib/password'
import { checkRateLimit, getClientIp, resetRateLimit } from '@/lib/rate-limit'

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}
const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET)

export async function login(formData: FormData) {
  const emailOrUsername = (formData.get('email') as string || '').trim()
  const password = formData.get('password') as string
  
  if (!emailOrUsername || !password) {
    return { error: 'Email/username dan password wajib diisi' }
  }

  const loginIp = await getClientIp()
  const loginAccountKey = `login:acct:${emailOrUsername.toLowerCase()}`
  if (loginIp && !(await checkRateLimit(`login:ip:${loginIp}`, 20, 5 * 60 * 1000))) {
    return { error: 'Terlalu banyak percobaan login. Silakan coba lagi dalam beberapa menit.' }
  }
  if (!(await checkRateLimit(loginAccountKey, 5, 10 * 60 * 1000))) {
    return { error: 'Terlalu banyak percobaan login. Silakan coba lagi dalam beberapa menit.' }
  }

  // Auth-critical: query the DB directly, bypassing DataStore's mock-seed
  // fallback. A DB error must fail this login, never fall through to
  // hardcoded seeded credentials.
  let user
  try {
    user = await db.user.findUnique({ where: { email: emailOrUsername } })
    if (!user) {
      user = await db.user.findFirst({ where: { username: emailOrUsername.toLowerCase() } as any })
    }
  } catch (e) {
    console.error('[auth] login lookup failed:', e)
    return { error: 'Terjadi kesalahan, silakan coba lagi.' }
  }

  if (!user) {
    await logAudit({
      actor: 'MEMBER',
      actorId: emailOrUsername,
      action: 'LOGIN_FAILED',
      module: 'AUTH',
      detail: 'Akun tidak ditemukan.'
    })
    return { error: 'Email/username atau password salah' }
  }

  if (!(await verifyPassword(password, user.passwordHash))) {
    await logAudit({
      actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'LOGIN_FAILED',
      module: 'AUTH',
      detail: 'Password salah.'
    })
    return { error: 'Email/username atau password salah' }
  }

  // Successful login clears this account's/IP's failed-attempt history so it
  // doesn't carry into the next window if the user logs out and back in.
  await resetRateLimit(loginAccountKey)
  if (loginIp) await resetRateLimit(`login:ip:${loginIp}`)

  // Lazy migration: a successful login against a legacy SHA-256 hash
  // upgrades it to bcrypt in place. Non-blocking — a write failure here
  // must not fail the login that just succeeded.
  if (isLegacyHash(user.passwordHash)) {
    try {
      await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(password) } })
    } catch (e) {
      console.error('[auth] legacy password rehash failed:', e)
    }
  }

  const isSuper = user.isSuperAdmin === true

  // Create Session JWT
  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    isSuperAdmin: isSuper,
    adminPermissions: user.adminPermissions ?? null
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY)
    
  // Set Cookie
  const cookieStore = await cookies()
  const headerList = await headers()
  const host = headerList.get('host') || ''
  const cookieDomain = getCookieDomain(host)
  
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    domain: cookieDomain
  })

  await logAudit({
    actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
    actorId: user.id,
    actorName: user.name || user.email,
    action: 'LOGIN_SUCCESS',
    module: 'AUTH'
  })

  return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } }
}

export async function register(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const roleStr = formData.get('role') as string // 'CUSTOMER' | 'MERCHANT' | 'AFFILIATE'
  const usernameRaw = formData.get('username') as string
  
  if (!name || !email || !password || !roleStr) {
    return { error: 'Semua kolom wajib diisi' }
  }
  
  const role = roleStr as 'CUSTOMER' | 'MERCHANT' | 'AFFILIATE'
  if (!['CUSTOMER', 'MERCHANT', 'AFFILIATE'].includes(role)) {
    return { error: 'Role tidak valid' }
  }

  // Validasi username jika diberikan
  let finalUsername: string | undefined = undefined
  if (usernameRaw) {
    const cleaned = usernameRaw.toLowerCase().trim().replace(/[^a-z0-9_.-]/g, '')
    if (cleaned.length < 3) {
      return { error: 'Username minimal 3 karakter.' }
    }
    const taken = await DataStore.isUsernameTaken(cleaned)
    if (taken) {
      return { error: 'Username sudah digunakan. Silakan pilih yang lain.' }
    }
    finalUsername = cleaned
  }
  
  const existing = await DataStore.findUserByEmail(email)
  if (existing) {
    return { error: 'Email sudah terdaftar' }
  }

  // Referral: Cookie first-touch (TIDAK bisa di-override)
  // Lookup by USERNAME (bukan ID/email)
  const cookieStore = await cookies()
  const affiliateRefCookie = cookieStore.get('affiliate_ref')?.value
  const referralCode = formData.get('referralCode') as string || undefined
  // Cookie adalah first-touch lock; form input hanya dipakai kalau tidak ada cookie
  const effectiveReferral = affiliateRefCookie || referralCode

  let parentAffiliateId: string | undefined = undefined
  if (effectiveReferral) {
    // Coba lookup by username dulu
    let referrer = await DataStore.findUserByUsername(effectiveReferral)
    if (!referrer) {
      // Fallback: coba by ID (backward compat)
      referrer = await DataStore.findUserById(effectiveReferral)
    }
    if (!referrer) {
      // Fallback: coba by email (backward compat)
      referrer = await DataStore.findUserByEmail(effectiveReferral)
    }
    if (referrer) {
      parentAffiliateId = referrer.id
    }
  }

  // Community selection (Revisi Pert Keempat)
  const communityId = formData.get('communityId') as string || undefined

  const passwordHash = await hashPassword(password)
  const user = await DataStore.createUser({
    email,
    name,
    passwordHash,
    role,
    parentAffiliateId,
    username: finalUsername,
  })

  // The first-touch affiliate_ref cookie is consumed by this signup — clear it
  // so it doesn't silently leak into a second signup on the same browser (a
  // QA tester registering multiple test accounts back-to-back, or two
  // different people signing up from a shared/public device would otherwise
  // have every registration after the first attributed to whoever's link was
  // clicked first, the same class of bug fixed for the community-scoped
  // referral cookie).
  if (affiliateRefCookie) {
    cookieStore.delete('affiliate_ref')
  }

  // If merchant selected an induk community during registration, join it
  if (communityId && (role === 'MERCHANT' || role === 'AFFILIATE')) {
    try {
      await DataStore.joinCommunity(user.id, communityId, true) // asInduk = true
    } catch (_) {
      // Non-blocking
    }
  }

  // System C (coin-per-signup referral reward) disabled — no longer part of business process.
  // parentAffiliateId above still feeds Systems A/B (product-sale & community-join commission trees).

  await logAudit({
    actor: 'MEMBER',
    actorId: user.id,
    actorName: user.name || user.email,
    action: 'REGISTER',
    module: 'AUTH',
    targetId: user.id,
    targetType: 'USER',
    detail: `Daftar sebagai ${role}${finalUsername ? ` (@${finalUsername})` : ''}.`
  })

  // Create Session JWT
  const token = await new SignJWT({ id: user.id, email: user.email, role: user.role, name: user.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY)
    
  // Set Cookie
  const headerList = await headers()
  const host = headerList.get('host') || ''
  const cookieDomain = getCookieDomain(host)
  
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    domain: cookieDomain
  })
  
  return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } }
}

export async function logout() {
  const currentUser = await getCurrentUser()

  const cookieStore = await cookies()
  const headerList = await headers()
  const host = headerList.get('host') || ''
  const cleanHost = host.split(':')[0].toLowerCase()
  const cookieDomain = getCookieDomain(host)

  // Delete session cookie natively
  cookieStore.delete('session')

  if (currentUser) {
    await logAudit({
      actor: currentUser.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      actorId: currentUser.id,
      actorName: currentUser.name || currentUser.email,
      action: 'LOGOUT',
      module: 'AUTH'
    })
  }

  const domainsToClear = [
    undefined,
    cleanHost,
    `.${cleanHost}`,
    '.saloka.id',
    'saloka.id',
    cookieDomain
  ]

  for (const domain of domainsToClear) {
    try {
      cookieStore.set('session', '', {
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

  return { success: true }
}

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session')?.value
  
  if (!sessionToken) return null
  
  try {
    const { payload } = await jwtVerify(sessionToken, SECRET_KEY)
    let isSuperAdmin = (payload as any).isSuperAdmin
    let adminPermissions = (payload as any).adminPermissions

    if (payload.role === 'ADMIN') {
      // Fail closed: only an explicit `true` on the DB row counts. A missing
      // row, a DB error, or a null/undefined value must never grant
      // superadmin — the superadmin count is fixed and this is the shared
      // accessor every admin-only check reads from.
      isSuperAdmin = false
      try {
        const dbUser = await DataStore.findUserById(payload.id as string)
        if (dbUser) {
          isSuperAdmin = dbUser.isSuperAdmin === true
          adminPermissions = dbUser.adminPermissions ?? null
        }
      } catch (_) {
        isSuperAdmin = false
      }
    }

    return {
      id: payload.id as string,
      email: payload.email as string,
      role: payload.role as string,
      name: payload.name as string,
      isSuperAdmin: isSuperAdmin === true,
      adminPermissions: adminPermissions ?? null
    }
  } catch (e) {
    return null
  }
}

import { revalidatePath } from 'next/cache'

export async function updateUserLandingPage(template: string, configStr: string, latitude?: number, longitude?: number) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }
  
  try {
    const updated = await DataStore.updateLandingPage(user.id, template, configStr, latitude, longitude)
    if (!updated) {
      return { error: 'Gagal memperbarui landing page: Pengguna tidak ditemukan.' }
    }
    // Reward 50 XP for landing page setup
    await DataStore.addXp(user.id, 50)
    await logAudit({
      actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'UPDATE_LANDING_PAGE',
      module: 'SETTINGS',
      targetId: user.id,
      targetType: 'USER',
      detail: `Template: ${template}.`
    })

    // Clear layout cache to update userSetupCompleted flag
    revalidatePath('/')
    
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal memperbarui landing page.' }
  }
}

export async function getCurrentUserProfile() {
  const user = await getCurrentUser()
  if (!user) return null
  
  let profile = await DataStore.findUserById(user.id)
  if (!profile) {
    profile = await DataStore.recreateMissingUser({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    })
  }
  return profile
}

export async function getUserProfileById(userId: string) {
  return await DataStore.findUserById(userId)
}

import { sendWhatsAppMessage } from '@/lib/whatsapp'

export async function sendOtpWhatsApp(phone: string, otp: string) {
  try {
    await sendWhatsAppMessage({
      merchantId: 'SYSTEM',
      merchantName: 'Saloka.id Registration',
      recipientName: 'Registrant',
      recipientPhone: phone,
      message: `Kode OTP verifikasi WhatsApp Saloka.id Anda adalah: ${otp}. Harap tidak membagikan kode ini kepada siapapun.`
    })
    return { success: true, otpCode: otp }
  } catch (err: any) {
    return { error: err.message || 'Gagal mengirim OTP' }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Password Reset (via WhatsApp OTP)
// ═══════════════════════════════════════════════════════════════════════════

const RESET_OTP_TTL_MS = 5 * 60 * 1000 // 5 menit

export async function requestPasswordReset(phone: string) {
  const cleanPhone = (phone || '').trim()
  if (!cleanPhone) {
    return { error: 'Nomor WhatsApp wajib diisi.' }
  }

  const resetIp = await getClientIp()
  if (resetIp && !(await checkRateLimit(`pwreset-req:${resetIp}`, 3, 10 * 60 * 1000))) {
    return { error: 'Terlalu banyak permintaan OTP. Silakan coba lagi dalam beberapa menit.' }
  }

  const user = await DataStore.findUserByPhoneOrWhatsApp(cleanPhone)
  if (!user) {
    return { error: 'Nomor WhatsApp tidak terdaftar.' }
  }

  const code = crypto.randomInt(100000, 1000000).toString()
  const expiresAt = new Date(Date.now() + RESET_OTP_TTL_MS)
  await DataStore.setPasswordResetOtp(user.id, code, expiresAt)

  try {
    await sendWhatsAppMessage({
      merchantId: 'SYSTEM',
      merchantName: 'Saloka.id Reset Password',
      recipientName: user.name,
      recipientPhone: cleanPhone,
      message: `Kode OTP reset password Saloka.id Anda adalah: ${code}. Berlaku 5 menit. Harap tidak membagikan kode ini kepada siapapun.`
    })
  } catch (err: any) {
    return { error: err.message || 'Gagal mengirim OTP.' }
  }

  await logAudit({
    actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
    actorId: user.id,
    actorName: user.name || user.email,
    action: 'PASSWORD_RESET_REQUESTED',
    module: 'AUTH'
  })

  return { success: true }
}

export async function resetPasswordWithOtp(phone: string, otp: string, newPassword: string) {
  const cleanPhone = (phone || '').trim()
  if (!cleanPhone || !otp || !newPassword) {
    return { error: 'Semua kolom wajib diisi.' }
  }
  if (newPassword.length < 6) {
    return { error: 'Password baru minimal 6 karakter.' }
  }

  const resetVerifyIp = await getClientIp()
  if (resetVerifyIp && !(await checkRateLimit(`pwreset-verify:${resetVerifyIp}`, 10, 10 * 60 * 1000))) {
    return { error: 'Terlalu banyak percobaan. Silakan coba lagi dalam beberapa menit.' }
  }

  const user = await DataStore.findUserByPhoneOrWhatsApp(cleanPhone)
  if (!user || !(user as any).resetOtpCode || !(user as any).resetOtpExpiresAt) {
    return { error: 'Kode OTP tidak valid. Silakan minta kode baru.' }
  }
  if ((user as any).resetOtpCode !== otp) {
    await logAudit({
      actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'PASSWORD_RESET_FAILED',
      module: 'AUTH',
      detail: 'Kode OTP salah.'
    })
    return { error: 'Kode OTP salah.' }
  }
  if (new Date((user as any).resetOtpExpiresAt).getTime() < Date.now()) {
    return { error: 'Kode OTP sudah kadaluarsa. Silakan minta kode baru.' }
  }

  const passwordHash = await hashPassword(newPassword)
  await DataStore.resetPasswordWithOtp(user.id, passwordHash)

  await logAudit({
    actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
    actorId: user.id,
    actorName: user.name || user.email,
    action: 'PASSWORD_RESET_SUCCESS',
    module: 'AUTH'
  })

  return { success: true }
}

// ═══════════════════════════════════════════════════════════════════════════
// Contact Verification (WhatsApp OTP dan/atau Email OTP)
// ═══════════════════════════════════════════════════════════════════════════

const VERIFY_OTP_TTL_MS = 5 * 60 * 1000 // 5 menit

function generateOtpCode(): string {
  return crypto.randomInt(100000, 1000000).toString()
}

export async function sendPhoneVerificationOtp(phone: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const cleanPhone = (phone || '').trim()
  if (!cleanPhone) return { error: 'Nomor WhatsApp wajib diisi.' }

  if (!(await checkRateLimit(`otp-send:${user.id}`, 3, 10 * 60 * 1000))) {
    return { error: 'Terlalu banyak permintaan OTP. Silakan coba lagi dalam beberapa menit.' }
  }

  const existing = await DataStore.findUserByWhatsApp(cleanPhone)
  if (existing && existing.id !== user.id) {
    return { error: 'Nomor WhatsApp sudah digunakan oleh akun lain.' }
  }

  const code = generateOtpCode()
  const expiresAt = new Date(Date.now() + VERIFY_OTP_TTL_MS)
  await DataStore.setPhoneVerificationOtp(user.id, code, expiresAt)

  try {
    await sendWhatsAppMessage({
      merchantId: 'SYSTEM',
      merchantName: 'Saloka.id Verifikasi',
      recipientName: user.name,
      recipientPhone: cleanPhone,
      message: `Kode OTP verifikasi WhatsApp Saloka.id Anda adalah: ${code}. Berlaku 5 menit. Harap tidak membagikan kode ini kepada siapapun.`
    })
  } catch (err: any) {
    return { error: err.message || 'Gagal mengirim OTP.' }
  }

  await logAudit({
    actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
    actorId: user.id,
    actorName: user.name || user.email,
    action: 'SEND_PHONE_VERIFICATION_OTP',
    module: 'AUTH'
  })

  return { success: true }
}

export async function verifyPhoneOtp(phone: string, otp: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  if (!(await checkRateLimit(`otp-verify:${user.id}`, 10, 10 * 60 * 1000))) {
    return { error: 'Terlalu banyak percobaan. Silakan coba lagi dalam beberapa menit.' }
  }

  const profile = await DataStore.findUserById(user.id)
  if (!profile || !(profile as any).phoneOtpCode || !(profile as any).phoneOtpExpiresAt) {
    return { error: 'Kode OTP tidak valid. Silakan minta kode baru.' }
  }
  if ((profile as any).phoneOtpCode !== otp) {
    return { error: 'Kode OTP salah.' }
  }
  if (new Date((profile as any).phoneOtpExpiresAt).getTime() < Date.now()) {
    return { error: 'Kode OTP sudah kadaluarsa. Silakan minta kode baru.' }
  }

  await DataStore.confirmPhoneVerified(user.id, (phone || '').trim())
  await logAudit({
    actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
    actorId: user.id,
    actorName: user.name || user.email,
    action: 'VERIFY_PHONE',
    module: 'AUTH'
  })
  return { success: true }
}

export async function sendEmailVerificationOtp() {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  if (!(await checkRateLimit(`otp-send:${user.id}`, 3, 10 * 60 * 1000))) {
    return { error: 'Terlalu banyak permintaan OTP. Silakan coba lagi dalam beberapa menit.' }
  }

  const code = generateOtpCode()
  const expiresAt = new Date(Date.now() + VERIFY_OTP_TTL_MS)
  await DataStore.setEmailVerificationOtp(user.id, code, expiresAt)

  const { sendEmail } = await import('@/lib/maileroo')
  const result = await sendEmail({
    to: user.email,
    toName: user.name,
    subject: 'Kode Verifikasi Email Saloka.id',
    html: `<p>Kode OTP verifikasi email Saloka.id Anda adalah: <strong>${code}</strong></p><p>Berlaku 5 menit. Harap tidak membagikan kode ini kepada siapapun.</p>`
  })
  if (!result.success) {
    return { error: result.error || 'Gagal mengirim OTP ke email.' }
  }

  await logAudit({
    actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
    actorId: user.id,
    actorName: user.name || user.email,
    action: 'SEND_EMAIL_VERIFICATION_OTP',
    module: 'AUTH'
  })

  return { success: true }
}

export async function verifyEmailOtp(otp: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  if (!(await checkRateLimit(`otp-verify:${user.id}`, 10, 10 * 60 * 1000))) {
    return { error: 'Terlalu banyak percobaan. Silakan coba lagi dalam beberapa menit.' }
  }

  const profile = await DataStore.findUserById(user.id)
  if (!profile || !(profile as any).emailOtpCode || !(profile as any).emailOtpExpiresAt) {
    return { error: 'Kode OTP tidak valid. Silakan minta kode baru.' }
  }
  if ((profile as any).emailOtpCode !== otp) {
    return { error: 'Kode OTP salah.' }
  }
  if (new Date((profile as any).emailOtpExpiresAt).getTime() < Date.now()) {
    return { error: 'Kode OTP sudah kadaluarsa. Silakan minta kode baru.' }
  }

  await DataStore.confirmEmailVerified(user.id)
  await logAudit({
    actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
    actorId: user.id,
    actorName: user.name || user.email,
    action: 'VERIFY_EMAIL',
    module: 'AUTH'
  })
  return { success: true }
}

export async function checkSubdomainAvailability(subdomain: string) {
  const user = await getCurrentUser()
  const taken = await DataStore.isSubdomainTaken(subdomain, user?.id)
  return { available: !taken }
}

export async function saveOnboardingData(data: {
  whatsapp: string
  storeName: string
  picName: string
  phone: string
  locationName: string
  detailAddress: string
  subdomain: string
  latitude?: number
  longitude?: number
}) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const taken = await DataStore.isSubdomainTaken(data.subdomain, user.id)
  if (taken) {
    return { error: 'Subdomain sudah digunakan oleh pengguna lain.' }
  }

  try {
    let existingPages: any[] = []
    const existingUser = await DataStore.findUserById(user.id)
    if (existingUser && existingUser.landingPageConfig) {
      try {
        const parsed = JSON.parse(existingUser.landingPageConfig)
        if (parsed.pages && Array.isArray(parsed.pages)) {
          existingPages = parsed.pages
        }
      } catch (e) {}
    }

    if (existingPages.length === 0) {
      const defaultStyle = { textAlign: 'center', fontSize: 'default', fontWeight: 'default', color: '', bgColor: '', paddingTop: 16, paddingBottom: 16, paddingLeft: 16, paddingRight: 16, opacity: 100, textDecoration: 'none', textTransform: 'none', borderRadius: 0 }
      const defaultAdvance = { marginTop: 0, marginBottom: 0, animation: 'none', showDesktop: true, showTablet: true, showMobile: true, customClass: '', customId: '' }
      const makeComp = (type: string, content: any, style = {}, advance = {}) => ({
        id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        type,
        content,
        style: { ...defaultStyle, ...style },
        advance: { ...defaultAdvance, ...advance }
      })
      existingPages = [
        {
          id: "page-main",
          name: "Main Storefront",
          slug: "",
          template: "template1",
          status: "PUBLISHED",
          customDomain: "",
          headDesktop: "",
          headMobile: "",
          footerAny: "",
          footerDesktop: "",
          footerMobile: "",
          allowSearch: "Yes",
          followLinks: "Yes",
          lastModified: new Date().toISOString(),
          builderComponents: [
            makeComp('headline', { text: `Selamat Datang di ${data.storeName}`, tag: 'h1' }, { textAlign: 'center', paddingTop: 32, paddingBottom: 8 }),
            makeComp('subheadline', { text: `Kami menyediakan produk dan layanan terbaik secara lokal.`, tag: 'h2' }, { textAlign: 'center', paddingTop: 8, paddingBottom: 24, color: '#6B7280' }),
            makeComp('product_showcase', { productIds: [], layout: 'grid', columns: 2, title: 'Produk Pilihan Kami', showPrice: true, showStock: true, showBuyBtn: true, buyBtnLabel: 'Beli Sekarang' }),
            makeComp('whatsapp_button', { label: 'Hubungi Kami', phone: data.whatsapp || data.phone, message: 'Halo, saya tertarik dengan produk Anda.' }, { textAlign: 'center' })
          ]
        }
      ]
    } else {
      const mainPage = existingPages.find(p => p.id === 'page-main')
      if (mainPage) {
        mainPage.name = data.storeName
        if (mainPage.builderComponents && Array.isArray(mainPage.builderComponents)) {
          const headlineComp = mainPage.builderComponents.find((c: any) => c.type === 'headline')
          if (headlineComp && headlineComp.content && (!headlineComp.content.text || headlineComp.content.text.startsWith('Selamat Datang di '))) {
            headlineComp.content.text = `Selamat Datang di ${data.storeName}`
          }
        }
      }
    }

    const config = JSON.stringify({
      title: data.storeName,
      bio: `Selamat datang di toko ${data.storeName}! Kami menyediakan produk dan jasa terbaik secara lokal.`,
      phone: data.phone,
      whatsapp: data.whatsapp,
      picName: data.picName,
      subdomain: data.subdomain.toLowerCase().trim(),
      locationName: data.locationName,
      detailAddress: data.detailAddress,
      sections: ['hero', 'profile', 'products', 'map', 'footer'],
      pages: existingPages
    })

    const updated = await DataStore.updateLandingPage(
      user.id,
      'template1',
      config,
      data.latitude || -6.2088,
      data.longitude || 106.8456
    )

    if (!updated) {
      return { error: 'Gagal memperbarui data profil onboarding.' }
    }

    await DataStore.addXp(user.id, 100)
    await logAudit({
      actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'SAVE_ONBOARDING_DATA',
      module: 'AUTH',
      targetId: user.id,
      targetType: 'USER',
      detail: `Toko "${data.storeName}", subdomain ${data.subdomain}.`
    })

    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Gagal menyimpan data onboarding.' }
  }
}

export async function checkWhatsAppUnique(whatsapp: string) {
  try {
    const user = await getCurrentUser()
    const existing = await DataStore.findUserByWhatsApp(whatsapp)
    if (existing && existing.id !== user?.id) {
      return { unique: false }
    }
    return { unique: true }
  } catch (err: any) {
    return { error: err.message || 'Gagal memvalidasi nomor WhatsApp.' }
  }
}

export async function getUserProfileBySubdomain(subdomain: string) {
  return await DataStore.findUserBySubdomain(subdomain)
}

// ═══════════════════════════════════════════════════════════════════════════
// Username Actions (Revisi Pert Kelima)
// ═══════════════════════════════════════════════════════════════════════════

export async function checkUsernameAvailability(username: string) {
  const user = await getCurrentUser()
  const cleaned = username.toLowerCase().trim()
  if (!/^[a-z0-9_.-]{3,30}$/.test(cleaned)) {
    return { available: false, message: 'Format username tidak valid (3-30 karakter, huruf kecil/angka/_/./-)' }
  }
  const taken = await DataStore.isUsernameTaken(cleaned, user?.id)
  return { available: !taken, message: taken ? 'Username sudah digunakan' : 'Username tersedia' }
}

export async function updateUsernameAction(username: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const cleaned = username.toLowerCase().trim()
  if (!/^[a-z0-9_.-]{3,30}$/.test(cleaned)) {
    return { error: 'Username hanya boleh huruf kecil, angka, titik, underscore, atau dash (3-30 karakter).' }
  }

  const taken = await DataStore.isUsernameTaken(cleaned, user.id)
  if (taken) {
    return { error: 'Username sudah digunakan. Silakan pilih yang lain.' }
  }

  try {
    await DataStore.setUsername(user.id, cleaned)
    await logAudit({
      actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'UPDATE_USERNAME',
      module: 'AUTH',
      targetId: user.id,
      targetType: 'USER',
      detail: `Username diubah menjadi @${cleaned}.`
    })
    revalidatePath('/settings')
    revalidatePath('/profile')
    return { success: true, username: cleaned, referralLink: `/ref/${cleaned}` }
  } catch (e: any) {
    return { error: e.message || 'Gagal menyimpan username.' }
  }
}

export async function getReferralInfo() {
  const user = await getCurrentUser()
  if (!user) return null
  const profile = await DataStore.findUserById(user.id)
  if (!profile) return null
  const username = (profile as any).username
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://saloka.id'
  return {
    username: username || null,
    referralLink: username ? `${appUrl}/ref/${username}` : null,
    coinBalance: (profile as any).coinBalance || 0,
  }
}

export async function getReferralCookie() {
  const cookieStore = await cookies()
  return cookieStore.get('affiliate_ref')?.value || null
}

export async function selectUserRole(role: 'CUSTOMER' | 'MERCHANT' | 'AFFILIATE') {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Sesi tidak valid. Silakan login kembali.' }
  }

  const updated = await DataStore.updateUserRole(user.id, role)
  if (!updated) {
    return { error: 'Gagal memperbarui peran pengguna.' }
  }
  await logAudit({
    actor: 'MEMBER',
    actorId: user.id,
    actorName: user.name || user.email,
    action: 'SELECT_USER_ROLE',
    module: 'AUTH',
    targetId: user.id,
    targetType: 'USER',
    detail: `Pilih peran: ${role}.`
  })

  // Generate a new session token with the updated role
  const cookieStore = await cookies()
  const headerList = await headers()
  const host = headerList.get('host') || ''
  const cookieDomain = getCookieDomain(host)

  const token = await new SignJWT({ id: user.id, email: user.email, role: role, name: user.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY)

  // Omit domain if undefined (e.g. on vercel.app)
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    ...(cookieDomain ? { domain: cookieDomain } : {})
  })

  return { success: true, role }
}
