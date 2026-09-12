'use server'

import { DataStore } from '@/lib/data-store'
import { getCurrentUser } from './auth'
import { logAudit } from '@/lib/audit-log'
import { revalidatePath } from 'next/cache'
import { cacheWrap, deleteCache } from '@/lib/cache'
import { requireCommunityManager } from '@/lib/auth-guards'

export async function getCommunityOfficialProductsAction(communityId: string) {
  if (!communityId) return []
  return await cacheWrap(`community:products:official:${communityId}`, () => DataStore.getCommunityOfficialProducts(communityId), 60)
}

export async function createCommunityOfficialProductAction(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const communityId = formData.get('communityId') as string
  const name = formData.get('name') as string
  const description = (formData.get('description') as string) || ''
  const price = Number(formData.get('price') || 0)
  const stock = Number(formData.get('stock') || 0)
  const category = (formData.get('category') as string) || 'Merchandise & Seragam'
  const imageUrl = (formData.get('imageUrl') as string) || ''
  const status = (formData.get('status') as string) || 'TERSEDIA'
  const sku = (formData.get('sku') as string) || `COMM-${Date.now()}`

  if (!communityId) return { error: 'ID Komunitas tidak ditemukan.' }
  if (!name) return { error: 'Nama Produk Komunitas wajib diisi.' }
  if (price <= 0) return { error: 'Harga produk harus lebih besar dari 0.' }

  try {
    await requireCommunityManager(user, communityId)
  } catch (e: any) {
    return { error: e.message || 'Anda tidak memiliki wewenang untuk komunitas ini.' }
  }

  try {
    const product = await DataStore.createCommunityOfficialProduct({
      communityId,
      name,
      description,
      price,
      stock,
      category,
      imageUrl,
      status,
      sku
    })
    await logAudit({
      actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'CREATE_COMMUNITY_OFFICIAL_PRODUCT',
      module: 'PRODUCTS',
      targetId: product.id,
      targetType: 'PRODUCT',
      detail: `"${name}" — Rp ${price.toLocaleString('id-ID')}.`
    })
    deleteCache(`community:products:official:${communityId}`)
    revalidatePath(`/community/${communityId}`)
    return { success: true, product }
  } catch (e: any) {
    return { error: e.message || 'Gagal menambahkan produk resmi komunitas.' }
  }
}

export async function updateCommunityOfficialProductAction(id: string, formData: FormData) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const communityId = formData.get('communityId') as string
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const price = formData.get('price') ? Number(formData.get('price')) : undefined
  const stock = formData.get('stock') ? Number(formData.get('stock')) : undefined
  const category = formData.get('category') as string
  const imageUrl = formData.get('imageUrl') as string
  const status = formData.get('status') as string
  const sku = formData.get('sku') as string

  if (!id) return { error: 'ID Produk wajib diisi.' }
  if (!communityId) return { error: 'ID Komunitas tidak ditemukan.' }
  try {
    await requireCommunityManager(user, communityId)
  } catch (e: any) {
    return { error: e.message || 'Anda tidak memiliki wewenang untuk komunitas ini.' }
  }

  try {
    const product = await DataStore.updateCommunityOfficialProduct(id, {
      name,
      description,
      price,
      stock,
      category,
      imageUrl,
      status,
      sku
    }, communityId)
    await logAudit({
      actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'UPDATE_COMMUNITY_OFFICIAL_PRODUCT',
      module: 'PRODUCTS',
      targetId: id,
      targetType: 'PRODUCT'
    })
    if (communityId) {
      deleteCache(`community:products:official:${communityId}`)
      revalidatePath(`/community/${communityId}`)
    }
    return { success: true, product }
  } catch (e: any) {
    return { error: e.message || 'Gagal mengubah produk resmi komunitas.' }
  }
}

export async function deleteCommunityOfficialProductAction(id: string, communityId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  if (!id) return { error: 'ID Produk wajib diisi.' }
  if (!communityId) return { error: 'ID Komunitas tidak ditemukan.' }
  try {
    await requireCommunityManager(user, communityId)
  } catch (e: any) {
    return { error: e.message || 'Anda tidak memiliki wewenang untuk komunitas ini.' }
  }

  try {
    const res = await DataStore.deleteCommunityOfficialProduct(id, communityId)
    await logAudit({
      actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'DELETE_COMMUNITY_OFFICIAL_PRODUCT',
      module: 'PRODUCTS',
      targetId: id,
      targetType: 'PRODUCT'
    })
    if (communityId) {
      deleteCache(`community:products:official:${communityId}`)
      revalidatePath(`/community/${communityId}`)
    }
    return res
  } catch (e: any) {
    return { error: e.message || 'Gagal menghapus produk resmi komunitas.' }
  }
}
