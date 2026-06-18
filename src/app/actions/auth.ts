'use server'

import { cookies, headers } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import crypto from 'crypto'
import { DataStore } from '@/lib/data-store'

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key-12345')

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

function getCookieDomain(host: string): string | undefined {
  const cleanHost = host.split(':')[0].toLowerCase()
  if (cleanHost.endsWith('localhost')) {
    return '.localhost'
  }
  if (cleanHost.endsWith('varro.my.id')) {
    return '.varro.my.id'
  }
  if (cleanHost.endsWith('vercel.app')) {
    return undefined
  }
  return '.saloka.id'
}

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  if (!email || !password) {
    return { error: 'Email dan password wajib diisi' }
  }
  
  const user = await DataStore.findUserByEmail(email)
  if (!user) {
    return { error: 'Email atau password salah' }
  }
  
  const hash = hashPassword(password)
  if (user.passwordHash !== hash) {
    return { error: 'Email atau password salah' }
  }
  
  // Create Session JWT
  const token = await new SignJWT({ id: user.id, email: user.email, role: user.role, name: user.name })
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
  
  if (!name || !email || !password || !roleStr) {
    return { error: 'Semua kolom wajib diisi' }
  }
  
  const role = roleStr as 'CUSTOMER' | 'MERCHANT' | 'AFFILIATE'
  if (!['CUSTOMER', 'MERCHANT', 'AFFILIATE'].includes(role)) {
    return { error: 'Role tidak valid' }
  }
  
  const existing = await DataStore.findUserByEmail(email)
  if (existing) {
    return { error: 'Email sudah terdaftar' }
  }

  // Referral Cookie Lock (Revisi Pert Keempat)
  // Priority: 1) affiliate_ref cookie, 2) referralCode from form
  const cookieStore = await cookies()
  const affiliateRefCookie = cookieStore.get('affiliate_ref')?.value
  const referralCode = formData.get('referralCode') as string || undefined
  const effectiveReferral = affiliateRefCookie || referralCode

  let parentAffiliateId: string | undefined = undefined
  if (effectiveReferral) {
    let referrer = await DataStore.findUserById(effectiveReferral)
    if (!referrer) {
      referrer = await DataStore.findUserByEmail(effectiveReferral)
    }
    if (referrer) {
      parentAffiliateId = referrer.id
    }
  }

  // Community selection (Revisi Pert Keempat)
  const communityId = formData.get('communityId') as string || undefined

  const passwordHash = hashPassword(password)
  const user = await DataStore.createUser({ email, name, passwordHash, role, parentAffiliateId })

  // If merchant selected an induk community during registration, join it
  if (communityId && (role === 'MERCHANT' || role === 'AFFILIATE')) {
    try {
      await DataStore.joinCommunity(user.id, communityId, true) // asInduk = true
    } catch (_) {
      // Non-blocking: community join failure shouldn't block registration
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
  const cookieDomain = getCookieDomain(host)
  
  cookieStore.set('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    domain: cookieDomain
  })
  return { success: true }
}

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session')?.value
  
  if (!sessionToken) return null
  
  try {
    const { payload } = await jwtVerify(sessionToken, SECRET_KEY)
    return {
      id: payload.id as string,
      email: payload.email as string,
      role: payload.role as string,
      name: payload.name as string
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
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Gagal mengirim OTP' }
  }
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
    const existing = await DataStore.findUserByWhatsApp(whatsapp)
    if (existing) {
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
