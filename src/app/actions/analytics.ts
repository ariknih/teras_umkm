'use server'

import { DataStore } from '@/lib/data-store'
import { getCurrentUser } from './auth'

export async function getMerchantAnalytics() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'MERCHANT') {
    return null
  }

  try {
    const allOrders = await DataStore.getAllOrders()
    const detailedOrders = await Promise.all(
      allOrders.map(async (o: any) => {
        return await DataStore.findOrderById(o.id)
      })
    )

    // Filter orders containing products owned by this merchant
    const merchantOrders = detailedOrders.filter((o: any) => {
      if (!o || !o.items) return false
      return o.items.some((item: any) => item.product?.merchantId === user.id)
    })

    // 1. Calculate Revenue Metrics
    let revenueToday = 0
    let revenue7Days = 0
    let revenue30Days = 0
    let totalRevenue = 0

    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 3600 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000)

    const orderStatusCounts: Record<string, number> = {
      PENDING: 0,
      COMPLETED: 0,
      CANCELLED: 0
    }

    const productSalesMap: Record<string, { title: string; quantity: number; revenue: number }> = {}

    merchantOrders.forEach((order: any) => {
      if (!order) return
      
      const orderDate = new Date(order.createdAt)
      const isCompleted = order.status === 'COMPLETED'
      
      // Calculate order status
      if (order.status in orderStatusCounts) {
        orderStatusCounts[order.status]++
      }

      // Calculate merchant share from items
      let merchantOrderTotal = 0
      order.items?.forEach((item: any) => {
        if (item.product?.merchantId === user.id) {
          const itemRev = item.price * item.quantity
          merchantOrderTotal += itemRev

          if (isCompleted) {
            if (!productSalesMap[item.productId]) {
              productSalesMap[item.productId] = {
                title: item.product?.title || item.productTitle || 'Produk Saloka',
                quantity: 0,
                revenue: 0
              }
            }
            productSalesMap[item.productId].quantity += item.quantity
            productSalesMap[item.productId].revenue += itemRev
          }
        }
      })

      if (isCompleted) {
        totalRevenue += merchantOrderTotal
        if (orderDate >= oneDayAgo) revenueToday += merchantOrderTotal
        if (orderDate >= sevenDaysAgo) revenue7Days += merchantOrderTotal
        if (orderDate >= thirtyDaysAgo) revenue30Days += merchantOrderTotal
      }
    })

    // 2. Sort top 5 products
    const topProducts = Object.entries(productSalesMap)
      .map(([id, stats]) => ({ id, ...stats }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)

    // 3. Active Products vs Sold Out
    const allProducts = await DataStore.getProducts()
    const myProducts = allProducts.filter((p: any) => p.merchantId === user.id)
    const activeProducts = myProducts.filter((p: any) => p.stock > 0).length
    const soldOutProducts = myProducts.filter((p: any) => p.stock <= 0).length

    // 4. Daily Revenue Chart Data (last 7 days)
    const dailyRevenue = Array.from({ length: 7 }).map((_, idx) => {
      const date = new Date(now.getTime() - (6 - idx) * 24 * 3600 * 1000)
      const dateLabel = date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' })
      
      let amount = 0
      merchantOrders.forEach((order: any) => {
        if (order.status !== 'COMPLETED') return
        const orderDate = new Date(order.createdAt)
        
        // Same day check
        if (
          orderDate.getDate() === date.getDate() &&
          orderDate.getMonth() === date.getMonth() &&
          orderDate.getFullYear() === date.getFullYear()
        ) {
          order.items?.forEach((item: any) => {
            if (item.product?.merchantId === user.id) {
              amount += item.price * item.quantity
            }
          })
        }
      })

      return { label: dateLabel, amount }
    })

    return {
      revenueToday,
      revenue7Days,
      revenue30Days,
      totalRevenue,
      statusCounts: orderStatusCounts,
      topProducts,
      productStats: {
        total: myProducts.length,
        active: activeProducts,
        soldOut: soldOutProducts
      },
      dailyRevenue
    }
  } catch (e) {
    console.error('Gagal memuat analitik merchant:', e)
    return null
  }
}
