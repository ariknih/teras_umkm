import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{ merchantId: string }>
}

export default async function StoreMainPage({ params }: PageProps) {
  const { merchantId } = await params
  redirect(`/profile/${merchantId}`)
}
