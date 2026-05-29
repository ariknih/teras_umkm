import { trackAffiliateClick } from '@/app/actions/affiliate-extra'
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
    redirect(`/market/product/${productId}?aff=${userId}`)
  }
  
  // If slug not found, redirect to market page
  redirect('/market')
}
