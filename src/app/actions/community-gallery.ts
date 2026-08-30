'use server'

import { DataStore } from '@/lib/data-store'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'
import { cacheWrap, deleteCache } from '@/lib/cache'

export async function getCommunityGalleryAction(communityId: string) {
  if (!communityId) return []
  return await cacheWrap(`community:gallery:${communityId}`, () => DataStore.getCommunityGallery(communityId), 60)
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

  try {
    const res = await DataStore.deleteCommunityGalleryItem(id)
    if (communityId) {
      revalidatePath(`/community/${communityId}`)
    }
    return res
  } catch (e: any) {
    return { error: e.message || 'Gagal menghapus foto galeri.' }
  }
}
