import { trackAffiliateClick } from '@/app/actions/affiliate-extra'
import { DataStore } from '@/lib/data-store'
import { NextRequest, NextResponse } from 'next/server'

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 30, // 30 days
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const source = req.nextUrl.searchParams.get('src') || 'direct'

  // Referral Cookie — first-touch, TIDAK bisa di-override
  const existingRef = req.cookies.get('affiliate_ref')?.value

  // Slug adalah USERNAME user (referral code baru)
  // Coba lookup by username dulu (format baru)
  const userByUsername = await DataStore.findUserByUsername(slug)

  if (userByUsername) {
    const res = NextResponse.redirect(new URL(`/profile/${userByUsername.id}?ref=${slug}`, req.url))
    if (!existingRef) {
      res.cookies.set('affiliate_ref', userByUsername.username || slug, COOKIE_OPTS)
    }
    return res
  }

  // Fallback: coba sebagai affiliate product link (format lama)
  const trackRes = await trackAffiliateClick(slug, source)

  if (trackRes && trackRes.link) {
    const { productId, userId } = trackRes.link
    const res = NextResponse.redirect(new URL(`/market/product/${productId}?aff=${userId}`, req.url))
    if (!existingRef) {
      res.cookies.set('affiliate_ref', userId, COOKIE_OPTS)
    }
    return res
  }

  // Slug tidak ditemukan → redirect ke market
  return NextResponse.redirect(new URL('/market', req.url))
}
