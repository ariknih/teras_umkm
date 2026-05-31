'use server'

import { DataStore } from '@/lib/data-store'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

export async function getMyOrders() {
  const user = await getCurrentUser()
  if (!user) {
    return []
  }
  try {
    const allOrders = await DataStore.getAllOrders()
    // Filter orders belonging to current user
    const myOrders = allOrders.filter((o: any) => o.buyerId === user.id)
    
    // For each order, fetch items and tracking steps
    const detailedOrders = await Promise.all(
      myOrders.map(async (o: any) => {
        const detail = await DataStore.findOrderById(o.id)
        const tracking = await DataStore.getOrderTracking(o.id)
        return {
          ...detail,
          tracking: tracking || []
        }
      })
    )
    return detailedOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch (e) {
    console.error('Gagal mengambil daftar pesanan:', e)
    return []
  }
}

export async function getOrderDetail(id: string) {
  const user = await getCurrentUser()
  if (!user) {
    return null
  }
  try {
    const order = await DataStore.findOrderById(id)
    if (!order) return null
    
    // Guard: only buyer, merchant of the products, or admin can view
    // Since order.items contains products, we can check if merchant owns any
    const tracking = await DataStore.getOrderTracking(id)
    return {
      ...order,
      tracking: tracking || []
    }
  } catch (e) {
    console.error('Gagal mengambil rincian pesanan:', e)
    return null
  }
}

export async function updateOrderTracking(orderId: string, status: string, note?: string) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Anda harus masuk terlebih dahulu.' }
  }

  // Set default note if not provided
  let defaultNote = note
  if (!defaultNote) {
    if (status === 'PROCESSING') defaultNote = 'Pesanan sedang diproses dan dikemas oleh merchant.'
    if (status === 'SHIPPED') defaultNote = 'Pesanan telah diserahkan ke kurir pengiriman.'
    if (status === 'DELIVERED') defaultNote = 'Pesanan telah sampai di tujuan dan diterima dengan baik.'
    if (status === 'CANCELLED') defaultNote = 'Pesanan dibatalkan.'
  }

  try {
    const updatedOrder = await DataStore.updateOrderTracking(orderId, status, defaultNote)
    
    // Send notification to buyer
    const title = `Status Pesanan Update: ${status}`
    const body = `Pesanan #${orderId} Anda kini berstatus: ${status}. ${defaultNote}`
    await DataStore.createNotification(
      updatedOrder.buyerId,
      'ORDER_TRACKING_UPDATE',
      title,
      body,
      `/orders/${orderId}`
    )

    // Send WhatsApp notification
    try {
      const merchantId = updatedOrder.items?.[0]?.product?.merchantId
      const merchant = merchantId ? await DataStore.findUserById(merchantId) : null
      const buyer = updatedOrder.buyer
      
      if (merchant && buyer) {
        await sendWhatsAppMessage({
          merchantId: merchant.id,
          merchantName: merchant.name || 'Merchant Teras',
          recipientName: buyer.name || 'Pelanggan',
          recipientPhone: '628123456789',
          message: `Halo ${buyer.name || 'Pelanggan'}, status pesanan Anda #${orderId} telah diperbarui menjadi: ${status}. Catatan: ${defaultNote}`,
          gatewayKey: merchant.waGatewayKeys || undefined
        })
      }
    } catch (waErr) {
      console.error('Failed to trigger WA message in server action:', waErr)
    }

    revalidatePath(`/orders/${orderId}`)
    revalidatePath('/orders')
    revalidatePath('/merchant/dashboard')
    revalidatePath('/admin')
    
    return { success: true, order: updatedOrder }
  } catch (e: any) {
    return { error: e.message || 'Gagal memperbarui status pelacakan.' }
  }
}

export async function getMerchantOrders() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'MERCHANT') {
    return []
  }
  try {
    const allOrders = await DataStore.getAllOrders()
    const detailedOrders = await Promise.all(
      allOrders.map(async (o: any) => {
        return await DataStore.findOrderById(o.id)
      })
    )
    
    const merchantOrders = detailedOrders.filter((o: any) => {
      if (!o || !o.items) return false
      return o.items.some((item: any) => item.product?.merchantId === user.id)
    })
    
    const ordersWithTracking = await Promise.all(
      merchantOrders.map(async (o: any) => {
        const tracking = await DataStore.getOrderTracking(o.id)
        return {
          ...o,
          tracking: tracking || []
        }
      })
    )

    return ordersWithTracking.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch (e) {
    console.error('Gagal mengambil pesanan merchant:', e)
    return []
  }
}

export async function getOrderInvoiceData(id: string) {
  const user = await getCurrentUser()
  if (!user) {
    return null
  }
  try {
    const order = await DataStore.findOrderById(id)
    if (!order) return null

    // Fetch merchant details from the first item's product
    const merchantId = order.items?.[0]?.product?.merchantId
    const merchant = merchantId ? await DataStore.findUserById(merchantId) : null

    return {
      order,
      merchant: merchant ? {
        id: merchant.id,
        name: merchant.name,
        email: merchant.email,
        role: merchant.role,
      } : null
    }
  } catch (e) {
    console.error('Gagal mengambil data invoice:', e)
    return null
  }
}


