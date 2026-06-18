import { trackAffiliateClick } from '@/app/actions/affiliate-extra'
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
  const res = await trackAffiliateClick(slug, source)
  
  if (res && res.link) {
    const { productId, userId } = res.link

    // Referral Cookie Lock (Revisi Pert Keempat)
    // Set persistent cookie to lock this visitor to this affiliate
    const cookieStore = await cookies()
    const existingRef = cookieStore.get('affiliate_ref')?.value
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
  
  // If slug not found, redirect to market page
  redirect('/market')
}
