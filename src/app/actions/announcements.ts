'use server'

import { DataStore } from '@/lib/data-store'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'

export async function getAnnouncementsAction(communityId: string) {
  if (!communityId) return []
  return await DataStore.getAnnouncements(communityId)
}

export async function createAnnouncementAction(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const communityId = formData.get('communityId') as string
  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const publishedAtStr = formData.get('publishedAt') as string
  const status = formData.get('status') as string || 'PUBLISHED'
  const isPinned = formData.get('isPinned') === 'true'

  if (!communityId) return { error: 'CommunityId wajib diisi.' }
  if (!title || !content) return { error: 'Judul dan isi pengumuman wajib diisi.' }

  const publishedAt = publishedAtStr ? new Date(publishedAtStr) : new Date()

  try {
    const ann = await DataStore.createAnnouncement({
      communityId,
      title,
      content,
      publishedAt,
      isPinned,
      status
    })
    revalidatePath(`/community/${communityId}`)
    return { success: true, announcement: ann }
  } catch (e: any) {
    return { error: e.message || 'Gagal membuat pengumuman.' }
  }
}

export async function updateAnnouncementAction(id: string, formData: FormData) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const communityId = formData.get('communityId') as string
  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const publishedAtStr = formData.get('publishedAt') as string
  const status = formData.get('status') as string
  const isPinned = formData.get('isPinned') === 'true'

  if (!title || !content) return { error: 'Judul dan isi pengumuman wajib diisi.' }

  const publishedAt = publishedAtStr ? new Date(publishedAtStr) : undefined

  try {
    const ann = await DataStore.updateAnnouncement(id, {
      title,
      content,
      publishedAt,
      isPinned,
      status
    })
    if (communityId) {
      revalidatePath(`/community/${communityId}`)
    }
    return { success: true, announcement: ann }
  } catch (e: any) {
    return { error: e.message || 'Gagal memperbarui pengumuman.' }
  }
}

export async function deleteAnnouncementAction(id: string, communityId?: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  try {
    const res = await DataStore.deleteAnnouncement(id)
    if (communityId) {
      revalidatePath(`/community/${communityId}`)
    }
    return res
  } catch (e: any) {
    return { error: e.message || 'Gagal menghapus pengumuman.' }
  }
}

export async function togglePublishAnnouncementAction(id: string, currentStatus: string, communityId?: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const newStatus = currentStatus === 'DRAFT' ? 'PUBLISHED' : 'DRAFT'
  try {
    const ann = await DataStore.updateAnnouncement(id, { status: newStatus })
    if (communityId) {
      revalidatePath(`/community/${communityId}`)
    }
    return { success: true, announcement: ann }
  } catch (e: any) {
    return { error: e.message || 'Gagal mengubah status publikasi.' }
  }
}

export async function togglePinAnnouncementAction(id: string, currentPinned: boolean, communityId?: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  try {
    const ann = await DataStore.updateAnnouncement(id, { isPinned: !currentPinned })
    if (communityId) {
      revalidatePath(`/community/${communityId}`)
    }
    return { success: true, announcement: ann }
  } catch (e: any) {
    return { error: e.message || 'Gagal mengubah status pin.' }
  }
}
