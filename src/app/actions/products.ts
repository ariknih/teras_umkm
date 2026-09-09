'use server'

import { DataStore } from '@/lib/data-store'
import { getCurrentUser } from './auth'
import { logAudit } from '@/lib/audit-log'
import { revalidatePath } from 'next/cache'
import { cacheWrap, invalidateCachePattern, deleteCache } from '@/lib/cache'

export async function getProducts(category?: string) {
  const cacheKey = `products:${category || 'all'}`
  return await cacheWrap(cacheKey, () => DataStore.getProducts(category), 120)
}

export async function getSnackboxProducts(opts: { category?: string; kelurahanName?: string; search?: string } = {}) {
  const cacheKey = `snackbox-products:${opts.category || 'all'}:${opts.kelurahanName || 'all'}:${opts.search || ''}`
  return await cacheWrap(cacheKey, () => DataStore.getSnackboxProducts(opts), 60)
}

export async function getProductsByMerchantIdsAction(merchantIds: string[]) {
  if (!merchantIds || merchantIds.length === 0) return []
  return await DataStore.getProductsByMerchantIds(merchantIds)
}

export async function getProductById(id: string) {
  return await cacheWrap(`product:${id}`, () => DataStore.getProductById(id), 180)
}

export async function createProduct(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Anda harus masuk terlebih dahulu.' }
  }
  
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const price = parseFloat(formData.get('price') as string)
  const category = formData.get('category') as string
  const stock = parseInt(formData.get('stock') as string)
  const imageUrl = formData.get('imageUrl') as string || undefined
  
  const latitudeStr = formData.get('latitude') as string
  const longitudeStr = formData.get('longitude') as string
  let latitude = latitudeStr ? parseFloat(latitudeStr) : undefined
  let longitude = longitudeStr ? parseFloat(longitudeStr) : undefined

  if (latitude === undefined || longitude === undefined || isNaN(latitude) || isNaN(longitude)) {
    // Fallback to user's saved location coordinates
    const fullUser = await DataStore.findUserById(user.id)
    if (fullUser) {
      latitude = fullUser.latitude || -6.2088
      longitude = fullUser.longitude || 106.8456
    }
  }
  
  if (!title || !description || isNaN(price) || !category || isNaN(stock)) {
    return { error: 'Semua kolom wajib diisi dengan benar.' }
  }
  
  try {
    const isAffiliateEnabled = formData.get('isAffiliateEnabled') === 'on' || formData.get('isAffiliateEnabled') === 'true'
    const affiliateCommissionType = formData.get('affiliateCommissionType') as string || 'PERCENT'
    const affiliateCommissionValue = parseFloat(formData.get('affiliateCommissionValue') as string || '0')

    const isSnackboxEnabled = formData.get('isSnackboxEnabled') === 'on' || formData.get('isSnackboxEnabled') === 'true'
    const snackboxRevenueShare = Math.min(20, Math.max(15, parseFloat(formData.get('snackboxRevenueShare') as string || '15') || 15))
    const snackboxPortionWeight = (formData.get('snackboxPortionWeight') as string) || ''

    const product = await DataStore.createProduct({
      title,
      description,
      price,
      category,
      stock,
      imageUrl,
      merchantId: user.id,
      latitude,
      longitude,
      isAffiliateEnabled,
      affiliateCommissionType,
      affiliateCommissionValue,
      isSnackboxEnabled,
      snackboxRevenueShare,
      snackboxPortionWeight
    })
    
    // Reward 50 XP for posting a product or job request
    await DataStore.addXp(user.id, 50)
    await logAudit({
      actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'CREATE_PRODUCT',
      module: 'PRODUCTS',
      targetId: product.id,
      targetType: 'PRODUCT',
      detail: `Produk "${title}" — Rp ${price.toLocaleString('id-ID')}.`
    })

    await invalidateCachePattern('products:')
    await invalidateCachePattern('snackbox-products:')
    revalidatePath('/market')
    revalidatePath('/snackbox')
    revalidatePath('/merchant/dashboard')
    return { success: true, product }
  } catch (e: any) {
    return { error: e.message || 'Gagal menambahkan produk.' }
  }
}

export async function updateProduct(id: string, formData: FormData) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Anda harus masuk terlebih dahulu.' }
  }
  
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const price = parseFloat(formData.get('price') as string)
  const category = formData.get('category') as string
  const stock = parseInt(formData.get('stock') as string)
  const imageUrl = formData.get('imageUrl') as string
  const latitudeStr = formData.get('latitude') as string
  const longitudeStr = formData.get('longitude') as string
  
  const isAffiliateEnabledStr = formData.get('isAffiliateEnabled') as string
  const affiliateCommissionType = formData.get('affiliateCommissionType') as string
  const affiliateCommissionValueStr = formData.get('affiliateCommissionValue') as string

  const isSnackboxEnabledStr = formData.get('isSnackboxEnabled') as string
  const snackboxRevenueShareStr = formData.get('snackboxRevenueShare') as string
  const snackboxPortionWeight = formData.get('snackboxPortionWeight') as string

  const data: any = {}
  if (title) data.title = title
  if (description) data.description = description
  if (!isNaN(price)) data.price = price
  if (category) data.category = category
  if (!isNaN(stock)) data.stock = stock
  if (imageUrl !== undefined) data.imageUrl = imageUrl
  if (latitudeStr) data.latitude = parseFloat(latitudeStr)
  if (longitudeStr) data.longitude = parseFloat(longitudeStr)
  
  if (isAffiliateEnabledStr !== null) {
    data.isAffiliateEnabled = isAffiliateEnabledStr === 'on' || isAffiliateEnabledStr === 'true'
  }
  if (affiliateCommissionType) {
    data.affiliateCommissionType = affiliateCommissionType
  }
  if (affiliateCommissionValueStr !== null) {
    data.affiliateCommissionValue = parseFloat(affiliateCommissionValueStr || '0')
  }

  if (isSnackboxEnabledStr !== null) {
    data.isSnackboxEnabled = isSnackboxEnabledStr === 'on' || isSnackboxEnabledStr === 'true'
  }
  if (snackboxRevenueShareStr) {
    data.snackboxRevenueShare = Math.min(20, Math.max(15, parseFloat(snackboxRevenueShareStr || '15') || 15))
  }
  if (snackboxPortionWeight !== null && snackboxPortionWeight !== undefined) {
    data.snackboxPortionWeight = snackboxPortionWeight
  }
  
  try {
    const product = await DataStore.updateProduct(id, user.id, data)
    await logAudit({
      actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'UPDATE_PRODUCT',
      module: 'PRODUCTS',
      targetId: id,
      targetType: 'PRODUCT'
    })
    await invalidateCachePattern('products:')
    await invalidateCachePattern('snackbox-products:')
    await deleteCache(`product:${id}`)
    revalidatePath('/market')
    revalidatePath('/snackbox')
    revalidatePath(`/market/product/${id}`)
    revalidatePath('/merchant/dashboard')
    return { success: true, product }
  } catch (e: any) {
    return { error: e.message || 'Gagal memperbarui produk.' }
  }
}

export async function updateAllProductsAffiliateSettingsAction(
  isAffiliateEnabled: boolean,
  commissionType: string,
  commissionValue: number
) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'MERCHANT') {
    return { error: 'Anda harus masuk sebagai merchant untuk mengelola pengaturan affiliate.' }
  }
  
  try {
    await DataStore.updateAllProductsAffiliateSettings(user.id, isAffiliateEnabled, commissionType, commissionValue)
    await logAudit({
      actor: 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'UPDATE_ALL_PRODUCTS_AFFILIATE_SETTINGS',
      module: 'PRODUCTS',
      detail: `Affiliate ${isAffiliateEnabled ? 'AKTIF' : 'NONAKTIF'} — ${commissionType} ${commissionValue}.`
    })
    await invalidateCachePattern('products:')
    await invalidateCachePattern('snackbox-products:')
    revalidatePath('/merchant/dashboard')
    revalidatePath('/market')
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal mengubah pengaturan affiliate global.' }
  }
}

export async function deleteProduct(id: string) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Anda harus masuk terlebih dahulu.' }
  }

  try {
    await DataStore.deleteProduct(id, user.id)
    await logAudit({
      actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'DELETE_PRODUCT',
      module: 'PRODUCTS',
      targetId: id,
      targetType: 'PRODUCT'
    })
    await invalidateCachePattern('products:')
    await invalidateCachePattern('snackbox-products:')
    await deleteCache(`product:${id}`)
    revalidatePath('/market')
    revalidatePath('/merchant/dashboard')
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal menghapus produk.' }
  }
}


export async function createMemberProductAction(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const communityId = formData.get('communityId') as string
  const title = formData.get('title') as string
  const description = (formData.get('description') as string) || ''
  const price = parseFloat(formData.get('price') as string)
  const category = (formData.get('category') as string) || 'Kuliner & Minuman'
  const stock = parseInt(formData.get('stock') as string) || 10
  const imageUrl = (formData.get('imageUrl') as string) || 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&h=200&fit=crop&q=80'
  // Ownership is never client-supplied: a caller could otherwise attribute
  // the listing to an arbitrary other merchant account.
  const merchantId = user.id

  if (!title) return { error: 'Nama produk wajib diisi.' }
  if (isNaN(price) || price < 0) return { error: 'Harga produk tidak valid.' }

  try {
    const product = await DataStore.createProduct({
      title,
      description,
      price,
      category,
      stock,
      imageUrl,
      merchantId,
      latitude: -6.2088,
      longitude: 106.8456
    })
    await logAudit({
      actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'CREATE_MEMBER_PRODUCT',
      module: 'PRODUCTS',
      targetId: product.id,
      targetType: 'PRODUCT',
      detail: `Produk anggota "${title}" — Rp ${price.toLocaleString('id-ID')}.`
    })

    await invalidateCachePattern('products:')
    await invalidateCachePattern('snackbox-products:')
    if (communityId) {
      revalidatePath(`/community/${communityId}`)
    }
    revalidatePath('/market')
    revalidatePath('/merchant/dashboard')
    return { success: true, product }
  } catch (e: any) {
    return { error: e.message || 'Gagal menambahkan produk anggota.' }
  }
}

export async function updateMemberProductAction(id: string, formData: FormData) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const communityId = formData.get('communityId') as string
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const price = parseFloat(formData.get('price') as string)
  const category = formData.get('category') as string
  const stock = parseInt(formData.get('stock') as string)
  const imageUrl = formData.get('imageUrl') as string

  if (!id) return { error: 'ID Produk wajib diisi.' }

  try {
    const existing = await DataStore.getProductById(id)
    if (!existing) return { error: 'Produk tidak ditemukan.' }
    if (existing.merchantId !== user.id && user.role !== 'ADMIN') {
      return { error: 'Anda tidak memiliki wewenang untuk produk ini.' }
    }

    const data: any = {}
    if (title) data.title = title
    if (description !== undefined) data.description = description
    if (!isNaN(price)) data.price = price
    if (category) data.category = category
    if (!isNaN(stock)) data.stock = stock
    if (imageUrl) data.imageUrl = imageUrl

    const product = await DataStore.updateProduct(id, existing.merchantId, data)
    await logAudit({
      actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'UPDATE_MEMBER_PRODUCT',
      module: 'PRODUCTS',
      targetId: id,
      targetType: 'PRODUCT'
    })
    await invalidateCachePattern('products:')
    await invalidateCachePattern('snackbox-products:')
    await deleteCache(`product:${id}`)
    if (communityId) {
      revalidatePath(`/community/${communityId}`)
    }
    revalidatePath('/market')
    revalidatePath(`/market/product/${id}`)
    revalidatePath('/merchant/dashboard')
    return { success: true, product }
  } catch (e: any) {
    return { error: e.message || 'Gagal memperbarui produk anggota.' }
  }
}

export async function deleteMemberProductAction(id: string, communityId?: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  if (!id) return { error: 'ID Produk wajib diisi.' }

  try {
    const existing = await DataStore.getProductById(id)
    if (!existing) return { error: 'Produk tidak ditemukan.' }
    if (existing.merchantId !== user.id && user.role !== 'ADMIN') {
      return { error: 'Anda tidak memiliki wewenang untuk produk ini.' }
    }
    await DataStore.deleteProduct(id, existing.merchantId)
    await logAudit({
      actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'DELETE_MEMBER_PRODUCT',
      module: 'PRODUCTS',
      targetId: id,
      targetType: 'PRODUCT'
    })

    await invalidateCachePattern('products:')
    await invalidateCachePattern('snackbox-products:')
    await deleteCache(`product:${id}`)
    if (communityId) {
      revalidatePath(`/community/${communityId}`)
    }
    revalidatePath('/market')
    revalidatePath('/merchant/dashboard')
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal menghapus produk anggota.' }
  }
}
