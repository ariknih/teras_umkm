'use server'

import { cookies, headers } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import crypto from 'crypto'
import { DataStore } from '@/lib/data-store'
import { getCookieDomain } from '@/lib/cookie-domain'

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key-12345')

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

export async function login(formData: FormData) {
  const emailOrUsername = (formData.get('email') as string || '').trim()
  const password = formData.get('password') as string
  
  if (!emailOrUsername || !password) {
    return { error: 'Email/username dan password wajib diisi' }
  }
  
  let user = await DataStore.findUserByEmail(emailOrUsername)
  if (!user) {
    user = await DataStore.findUserByUsername(emailOrUsername)
  }
  
  if (!user) {
    return { error: 'Email/username atau password salah' }
  }
  
  const hash = hashPassword(password)
  if (user.passwordHash !== hash) {
    return { error: 'Email/username atau password salah' }
  }
  
  const emailLower = (user.email || '').toLowerCase()
  const nameLower = (user.name || '').toLowerCase()
  const isSuper = user.isSuperAdmin === true || 
                  user.role === 'ADMIN' || 
                  emailLower === 'admin@saloka.com' || 
                  emailLower === 'admin@teras.com' || 
                  emailLower.includes('admin') ||
                  nameLower.includes('super')

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
  let referrerId: string | undefined = undefined
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
      referrerId = referrer.id
    }
  }

  // Community selection (Revisi Pert Keempat)
  const communityId = formData.get('communityId') as string || undefined

  const passwordHash = hashPassword(password)
  const user = await DataStore.createUser({
    email,
    name,
    passwordHash,
    role,
    parentAffiliateId,
    username: finalUsername,
  })

  // If merchant selected an induk community during registration, join it
  if (communityId && (role === 'MERCHANT' || role === 'AFFILIATE')) {
    try {
      await DataStore.joinCommunity(user.id, communityId, true) // asInduk = true
    } catch (_) {
      // Non-blocking
    }
  }

  // Reward +1 coin ke pengundang (semua role)
  if (referrerId) {
    try {
      await DataStore.rewardUserInviteCoin({
        referrerId,
        referredId: user.id,
        coinAmount: 1.0,
      })
    } catch (_) {
      // Non-blocking: reward gagal tidak halangi registrasi
    }
  }
  
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
  const cookieStore = await cookies()
  const headerList = await headers()
  const host = headerList.get('host') || ''
  const cleanHost = host.split(':')[0].toLowerCase()
  const cookieDomain = getCookieDomain(host)

  // Delete session cookie natively
  cookieStore.delete('session')

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
      const emailLower = ((payload.email as string) || '').toLowerCase()
      if (emailLower === 'admin@saloka.com' || emailLower === 'admin@teras.com' || emailLower.includes('admin') || emailLower.includes('super')) {
        isSuperAdmin = true
      }
      try {
        const dbUser = await DataStore.findUserById(payload.id as string)
        if (dbUser) {
          if (emailLower === 'admin@saloka.com' || emailLower === 'admin@teras.com' || emailLower.includes('admin')) {
            isSuperAdmin = true
          } else {
            isSuperAdmin = dbUser.isSuperAdmin ?? true
          }
          adminPermissions = dbUser.adminPermissions ?? null
        } else {
          isSuperAdmin = true
        }
      } catch (_) {
        isSuperAdmin = true
      }
    }

    return {
      id: payload.id as string,
      email: payload.email as string,
      role: payload.role as string,
      name: payload.name as string,
      isSuperAdmin: isSuperAdmin ?? (payload.role === 'ADMIN'),
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

  const user = await DataStore.findUserByPhoneOrWhatsApp(cleanPhone)
  if (!user || !(user as any).resetOtpCode || !(user as any).resetOtpExpiresAt) {
    return { error: 'Kode OTP tidak valid. Silakan minta kode baru.' }
  }
  if ((user as any).resetOtpCode !== otp) {
    return { error: 'Kode OTP salah.' }
  }
  if (new Date((user as any).resetOtpExpiresAt).getTime() < Date.now()) {
    return { error: 'Kode OTP sudah kadaluarsa. Silakan minta kode baru.' }
  }

  const passwordHash = hashPassword(newPassword)
  await DataStore.resetPasswordWithOtp(user.id, passwordHash)

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

  return { success: true }
}

export async function verifyPhoneOtp(phone: string, otp: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

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
  return { success: true }
}

export async function sendEmailVerificationOtp() {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

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

  return { success: true }
}

export async function verifyEmailOtp(otp: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

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
