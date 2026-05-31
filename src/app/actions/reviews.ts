'use server'

import { DataStore } from '@/lib/data-store'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'

export async function createReview(productId: string, rating: number, comment: string, orderId?: string) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Anda harus masuk terlebih dahulu.' }
  }
  
  if (rating < 1 || rating > 5) {
    return { error: 'Rating harus antara 1 sampai 5.' }
  }

  if (!comment || comment.trim().length < 3) {
    return { error: 'Ulasan harus memiliki minimal 3 karakter.' }
  }

  try {
    const review = await DataStore.createReview(productId, user.id, rating, comment, orderId)
    
    // Send notification to the product's merchant
    const product = await DataStore.getProductById(productId)
    if (product) {
      await DataStore.createNotification(
        product.merchantId,
        'REVIEW_RECEIVED',
        'Ulasan Baru Diterima',
        `Produk "${product.title}" menerima ulasan ${rating} bintang dari ${user.name || 'Pembeli'}.`,
        `/market/product/${productId}`
      )
    }

    revalidatePath(`/market/product/${productId}`)
    return { success: true, review }
  } catch (e: any) {
    return { error: e.message || 'Gagal menambahkan ulasan.' }
  }
}

export async function getProductReviews(productId: string) {
  try {
    return await DataStore.getProductReviews(productId)
  } catch (e) {
    return []
  }
}
