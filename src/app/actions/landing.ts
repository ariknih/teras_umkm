'use server'

import { DataStore } from '@/lib/data-store'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'

// ═══════════════════════════════════════════════════════════════════════════
// Landing Page Banner Actions (CRUD)
// ═══════════════════════════════════════════════════════════════════════════

export async function getActiveBanners() {
  try {
    return await DataStore.getActiveBanners()
  } catch (_) {
    return []
  }
}

export async function getAllBannersAction() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') return []
  try {
    return await DataStore.getAllBanners()
  } catch (_) {
    return []
  }
}

export async function createBannerAction(formData: FormData) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    return { error: 'Hanya Admin yang bisa menambah banner.' }
  }

  const title = formData.get('title') as string || undefined
  const imageUrl = formData.get('imageUrl') as string
  const linkUrl = formData.get('linkUrl') as string || undefined
  const sortOrder = parseInt(formData.get('sortOrder') as string || '0')

  if (!imageUrl) {
    return { error: 'URL gambar banner wajib diisi.' }
  }

  try {
    const banner = await DataStore.createBanner({ title, imageUrl, linkUrl, sortOrder })
    revalidatePath('/')
    revalidatePath('/admin')
    return { success: true, banner }
  } catch (e: any) {
    return { error: e.message || 'Gagal menambah banner.' }
  }
}

export async function updateBannerAction(id: string, formData: FormData) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    return { error: 'Hanya Admin yang bisa mengedit banner.' }
  }

  const title = formData.get('title') as string || undefined
  const imageUrl = formData.get('imageUrl') as string || undefined
  const linkUrl = formData.get('linkUrl') as string || undefined
  const isActive = formData.get('isActive') === 'true'
  const sortOrder = parseInt(formData.get('sortOrder') as string || '0')

  try {
    const banner = await DataStore.updateBanner(id, { title, imageUrl, linkUrl, isActive, sortOrder })
    revalidatePath('/')
    revalidatePath('/admin')
    return { success: true, banner }
  } catch (e: any) {
    return { error: e.message || 'Gagal mengedit banner.' }
  }
}

export async function deleteBannerAction(id: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    return { error: 'Hanya Admin yang bisa menghapus banner.' }
  }

  try {
    await DataStore.deleteBanner(id)
    revalidatePath('/')
    revalidatePath('/admin')
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal menghapus banner.' }
  }
}

export async function toggleBannerActiveAction(id: string, isActive: boolean) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    return { error: 'Hanya Admin yang bisa mengubah status banner.' }
  }

  try {
    await DataStore.updateBanner(id, { isActive })
    revalidatePath('/')
    revalidatePath('/admin')
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal mengubah status banner.' }
  }
}
