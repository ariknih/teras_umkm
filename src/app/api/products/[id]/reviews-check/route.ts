import { NextRequest, NextResponse } from 'next/server'
import { DataStore } from '@/lib/data-store'
import { getCurrentUser } from '@/app/actions/auth'

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ alreadyReviewed: false })
    }

    const reviews = await DataStore.getProductReviews(params.id)
    const alreadyReviewed = reviews.some((r: any) => r.authorId === user.id)
    
    return NextResponse.json({ alreadyReviewed })
  } catch (error) {
    return NextResponse.json({ alreadyReviewed: false })
  }
}
