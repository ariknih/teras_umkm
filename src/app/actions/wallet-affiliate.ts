'use server'

import { DataStore } from '@/lib/data-store'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'

export async function getWalletDetails() {
  const user = await getCurrentUser()
  if (!user) return null
  return await DataStore.getWalletByUserId(user.id)
}

export async function withdrawFunds(amount: number, method: string, accountNumber: string, accountName: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }
  if (amount <= 0 || isNaN(amount)) return { error: 'Jumlah penarikan tidak valid.' }
  if (!method || !accountNumber || !accountName) {
    return { error: 'Metode, nomor rekening/dompet, dan nama pemilik harus diisi.' }
  }
  
  try {
    const description = `Tarik ke ${method} (${accountNumber} a/n ${accountName})`
    const wallet = await DataStore.withdrawFunds(user.id, amount, description)
    revalidatePath('/wallet')
    return { success: true, wallet }
  } catch (e: any) {
    return { error: e.message || 'Gagal melakukan penarikan.' }
  }
}

export async function getAffiliateStats() {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'AFFILIATE' && user.role !== 'CUSTOMER')) return null
  return await DataStore.getAffiliateStats(user.id)
}

export async function checkoutCart(
  items: Array<{ productId: string; quantity: number }>,
  affiliateId?: string,
  paymentMethod: 'MIDTRANS' | 'WALLET' = 'MIDTRANS',
  shippingDetails?: {
    shippingFee?: number
    courier?: string
    shippingAddress?: string
    couponCode?: string
    discountAmount?: number
    bumpSales?: string
  }
) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu untuk berbelanja.' }
  if (!items || items.length === 0) return { error: 'Keranjang belanja kosong.' }
  
  try {
    const order = await DataStore.createOrder(user.id, items, affiliateId, paymentMethod, shippingDetails)
    revalidatePath('/market')
    revalidatePath('/wallet')
    revalidatePath('/merchant/dashboard')
    return { success: true, order }
  } catch (e: any) {
    return { error: e.message || 'Gagal memproses transaksi.' }
  }
}

export async function updateUserSettingsAction(data: {
  name?: string;
  whatsapp?: string;
  bio?: string;
  waGatewayKeys?: string;
  fbPixelId?: string | null;
  tiktokPixelId?: string | null;
  zapierWebhookUrl?: string | null;
  googleSheetUrl?: string | null;
  zoomMeetingUrl?: string | null;
  image?: string | null;
}) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }
  try {
    const updatedUser = await DataStore.updateUserSettings(user.id, data)
    revalidatePath('/merchant/dashboard')
    revalidatePath('/settings')
    return { success: true, user: updatedUser }
  } catch (e: any) {
    return { error: e.message || 'Gagal menyimpan pengaturan.' }
  }
}

export async function getWaLogsAction() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'MERCHANT') return []
  return await DataStore.getWaLogs(user.id)
}
