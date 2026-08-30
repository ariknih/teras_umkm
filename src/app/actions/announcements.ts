'use server'

import { DataStore } from '@/lib/data-store'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'
import { cacheWrap } from '@/lib/cache'

async function isCommunityManager(user: { id: string; role: string } | null, communityId: string) {
  if (!user) return false
  if (user.role === 'ADMIN') return true
  const community = await DataStore.getCommunityById(communityId)
  return community?.ketuaId === user.id
}

export async function getAnnouncementsAction(
  communityId: string,
  viewerCtx?: { userId: string | null; role: string | null; isKetua: boolean; isMember: boolean }
) {
  if (!communityId) return []

  const isManager = viewerCtx
    ? viewerCtx.role === 'ADMIN' || viewerCtx.isKetua
    : await isCommunityManager(await getCurrentUser(), communityId)

  const all = await cacheWrap(`community:announcements:${communityId}`, () => DataStore.getAnnouncements(communityId), 60)
  return isManager ? (all || []) : (all || []).filter((a: any) => a.status === 'PUBLISHED')
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
  if (!(await isCommunityManager(user, communityId))) {
    return { error: 'Anda tidak memiliki akses untuk mengelola pengumuman komunitas ini.' }
  }

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
  if (!communityId || !(await isCommunityManager(user, communityId))) {
    return { error: 'Anda tidak memiliki akses untuk mengelola pengumuman komunitas ini.' }
  }

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
  if (!communityId || !(await isCommunityManager(user, communityId))) {
    return { error: 'Anda tidak memiliki akses untuk mengelola pengumuman komunitas ini.' }
  }

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
  if (!communityId || !(await isCommunityManager(user, communityId))) {
    return { error: 'Anda tidak memiliki akses untuk mengelola pengumuman komunitas ini.' }
  }

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
  if (!communityId || !(await isCommunityManager(user, communityId))) {
    return { error: 'Anda tidak memiliki akses untuk mengelola pengumuman komunitas ini.' }
  }

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
