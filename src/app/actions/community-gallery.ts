'use server'

import { DataStore } from '@/lib/data-store'
import { getCurrentUser } from './auth'
import { logAudit } from '@/lib/audit-log'
import { revalidatePath } from 'next/cache'
import { cacheWrap, deleteCache } from '@/lib/cache'
import { requireCommunityManager } from '@/lib/auth-guards'

export async function getCommunityGalleryAction(communityId: string) {
  if (!communityId) return []
  return await cacheWrap(`community:gallery:${communityId}`, () => DataStore.getCommunityGallery(communityId), 15)
}

export async function createCommunityGalleryItemAction(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const communityId = formData.get('communityId') as string
  const title = formData.get('title') as string
  const imageUrl = formData.get('imageUrl') as string
  const caption = (formData.get('caption') as string) || ''
  const category = (formData.get('category') as string) || 'Kopdar & Networking'
  const date = (formData.get('date') as string) || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

  if (!communityId) return { error: 'ID Komunitas tidak ditemukan.' }
  if (!title) return { error: 'Judul foto kegiatan wajib diisi.' }
  if (!imageUrl) return { error: 'Foto kegiatan wajib diunggah.' }

  try {
    await requireCommunityManager(user, communityId)
  } catch (e: any) {
    return { error: e.message || 'Anda tidak memiliki wewenang untuk komunitas ini.' }
  }

  try {
    const item = await DataStore.createCommunityGalleryItem({
      communityId,
      title,
      imageUrl,
      caption,
      category,
      date,
      authorId: user.id,
      authorName: user.name || 'Anggota Komunitas'
    })
    await logAudit({
      actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'CREATE_COMMUNITY_GALLERY_ITEM',
      module: 'COOPERATIVE',
      targetId: item.id,
      targetType: 'GALLERY_ITEM',
      detail: `"${title}".`
    })
    await deleteCache(`community:gallery:${communityId}`)
    revalidatePath(`/community/${communityId}`)
    return { success: true, item }
  } catch (e: any) {
    return { error: e.message || 'Gagal menambahkan foto galeri.' }
  }
}

export async function deleteCommunityGalleryItemAction(id: string, communityId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  if (!id) return { error: 'ID Foto Galeri wajib diisi.' }
  if (!communityId) return { error: 'ID Komunitas tidak ditemukan.' }
  try {
    await requireCommunityManager(user, communityId)
  } catch (e: any) {
    return { error: e.message || 'Anda tidak memiliki wewenang untuk komunitas ini.' }
  }

  try {
    const res = await DataStore.deleteCommunityGalleryItem(id, communityId)
    await logAudit({
      actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'DELETE_COMMUNITY_GALLERY_ITEM',
      module: 'COOPERATIVE',
      targetId: id,
      targetType: 'GALLERY_ITEM'
    })
    if (communityId) {
      await deleteCache(`community:gallery:${communityId}`)
      revalidatePath(`/community/${communityId}`)
    }
    return res
  } catch (e: any) {
    return { error: e.message || 'Gagal menghapus foto galeri.' }
  }
}
