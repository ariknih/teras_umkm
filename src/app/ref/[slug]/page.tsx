import { trackAffiliateClick } from '@/app/actions/affiliate-extra'
import { DataStore } from '@/lib/data-store'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ src?: string }>
}

export default async function RefRedirectPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { src } = await searchParams
  
  const source = src || 'direct'

  // Slug adalah USERNAME user (referral code baru)
  // Coba lookup by username dulu (format baru)
  const userByUsername = await DataStore.findUserByUsername(slug)

  // Referral Cookie — first-touch, TIDAK bisa di-override
  const cookieStore = await cookies()
  const existingRef = cookieStore.get('affiliate_ref')?.value

  if (userByUsername) {
    // Set cookie referral dengan username (bukan ID) untuk konsistensi
    if (!existingRef) {
      cookieStore.set('affiliate_ref', userByUsername.username || slug, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      })
    }
    // Redirect ke halaman profil/toko user yang membagi link ini
    redirect(`/profile/${userByUsername.id}?ref=${slug}`)
  }

  // Fallback: coba sebagai affiliate product link (format lama)
  const res = await trackAffiliateClick(slug, source)
  
  if (res && res.link) {
    const { productId, userId } = res.link

    if (!existingRef) {
      cookieStore.set('affiliate_ref', userId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      })
    }

    redirect(`/market/product/${productId}?aff=${userId}`)
  }
  
  // Slug tidak ditemukan → redirect ke market
  redirect('/market')
}
