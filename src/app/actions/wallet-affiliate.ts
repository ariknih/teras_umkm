'use server'

import { DataStore } from '@/lib/data-store'
import { getCurrentUser } from './auth'
import { logAudit } from '@/lib/audit-log'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'

export async function getWalletDetails(preloadedUser?: { id: string } | null) {
  const user = preloadedUser !== undefined ? preloadedUser : await getCurrentUser()
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
    await logAudit({
      actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'WITHDRAW_FUNDS',
      module: 'WITHDRAWALS',
      detail: `Rp ${amount.toLocaleString('id-ID')} ke ${method} (${accountNumber} a/n ${accountName}).`
    })
    revalidatePath('/wallet')
    revalidatePath('/merchant/dashboard')
    return { success: true, wallet }
  } catch (e: any) {
    return { error: e.message || 'Gagal melakukan penarikan.' }
  }
}

export async function getAffiliateCommissionAction() {
  const user = await getCurrentUser()
  if (!user) return 0
  return await DataStore.getAffiliateCommission(user.id)
}

export async function getAffiliateStats() {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'AFFILIATE' && user.role !== 'CUSTOMER')) return null
  return await DataStore.getAffiliateStats(user.id)
}

export async function checkoutCart(
  items: Array<{ productId: string; quantity: number }>,
  affiliateId?: string,
  paymentMethod: string = 'DOKU',
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
    await logAudit({
      actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'CHECKOUT_ORDER',
      module: 'ORDERS',
      targetId: order.id,
      targetType: 'ORDER',
      detail: `Order #${order.id} sebesar Rp ${order.totalAmount.toLocaleString('id-ID')} via ${paymentMethod}.`
    })

    // Create base ORDER_CREATED notification
    await DataStore.createNotification(
      user.id,
      'ORDER_CREATED',
      'Pesanan Baru Dibuat',
      `Pesanan #${order.id} berhasil dibuat. Silakan pantau status pengiriman pesanan Anda.`,
      `/orders/${order.id}`
    )

    // Additional notifications based on payment method
    if (paymentMethod === 'WALLET') {
      await DataStore.createNotification(
        user.id,
        'PAYMENT_SUCCESS',
        'Pembayaran Berhasil',
        `Pembayaran pesanan #${order.id} menggunakan saldo dompet berhasil.`,
        `/orders/${order.id}`
      )
    } else if (shippingDetails?.bumpSales === 'COD') {
      await DataStore.createNotification(
        user.id,
        'CHECKOUT_SUCCESS',
        'Pesanan COD Berhasil',
        `Pesanan COD #${order.id} berhasil dikirim. Pembayaran dilakukan di tempat saat barang tiba.`,
        `/orders/${order.id}`
      )
    } else if (paymentMethod.startsWith('MANUAL')) {
      await DataStore.createNotification(
        user.id,
        'ORDER_CREATED',
        'Menunggu Pembayaran Manual',
        `Pesanan #${order.id} berhasil dibuat. Silakan lakukan transfer manual sesuai nominal.`,
        `/orders/${order.id}`
      )
    }

    revalidatePath('/market')
    revalidatePath('/wallet')
    revalidatePath('/merchant/dashboard')
    return { success: true, order }
  } catch (e: any) {
    return { error: e.message || 'Gagal memproses transaksi.' }
  }
}

export async function getActivePaymentMethods() {
  try {
    return await DataStore.getPaymentMethods(true)
  } catch (error) {
    console.error('Error fetching active payment methods:', error)
    return []
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
    await logAudit({
      actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'UPDATE_USER_SETTINGS',
      module: 'SETTINGS',
      targetId: user.id,
      targetType: 'USER'
    })
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
