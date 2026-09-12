'use server'

import { DataStore } from '@/lib/data-store'
import { getCurrentUser } from './auth'
import { logAudit } from '@/lib/audit-log'
import { revalidatePath } from 'next/cache'
import { cacheWrap, deleteCache } from '@/lib/cache'
import { isCommunityManager } from '@/lib/auth-guards'

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
    await logAudit({
      actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'CREATE_ANNOUNCEMENT',
      module: 'COOPERATIVE',
      targetId: ann.id,
      targetType: 'ANNOUNCEMENT',
      detail: `"${title}".`
    })
    deleteCache(`community:announcements:${communityId}`)
    revalidatePath(`/community/${communityId}`)
    return { success: true, announcement: ann }
  } catch (e: any) {
    return { error: e.message || 'Gagal membuat pengumuman.' }
  }
}

export async function updateAnnouncementAction(id: string, formData: FormData) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const publishedAtStr = formData.get('publishedAt') as string
  const status = formData.get('status') as string
  const isPinned = formData.get('isPinned') === 'true'

  if (!title || !content) return { error: 'Judul dan isi pengumuman wajib diisi.' }

  // communityId is derived from the announcement's own record, never from
  // client-supplied form data — otherwise a manager of community A could
  // pass communityId=A while targeting an announcement that actually
  // belongs to community B.
  const existing: any = await DataStore.getAnnouncementById(id)
  if (!existing) return { error: 'Pengumuman tidak ditemukan.' }
  const communityId = existing.communityId
  if (!(await isCommunityManager(user, communityId))) {
    return { error: 'Anda tidak memiliki akses untuk mengelola pengumuman komunitas ini.' }
  }

  const publishedAt = publishedAtStr ? new Date(publishedAtStr) : undefined

  try {
    const ann = await DataStore.updateAnnouncement(id, communityId, {
      title,
      content,
      publishedAt,
      isPinned,
      status
    })
    await logAudit({
      actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'UPDATE_ANNOUNCEMENT',
      module: 'COOPERATIVE',
      targetId: id,
      targetType: 'ANNOUNCEMENT'
    })
    if (communityId) {
      deleteCache(`community:announcements:${communityId}`)
      revalidatePath(`/community/${communityId}`)
    }
    return { success: true, announcement: ann }
  } catch (e: any) {
    return { error: e.message || 'Gagal memperbarui pengumuman.' }
  }
}

export async function deleteAnnouncementAction(id: string, _communityId?: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const existing: any = await DataStore.getAnnouncementById(id)
  if (!existing) return { error: 'Pengumuman tidak ditemukan.' }
  const communityId = existing.communityId
  if (!(await isCommunityManager(user, communityId))) {
    return { error: 'Anda tidak memiliki akses untuk mengelola pengumuman komunitas ini.' }
  }

  try {
    const res = await DataStore.deleteAnnouncement(id, communityId)
    await logAudit({
      actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'DELETE_ANNOUNCEMENT',
      module: 'COOPERATIVE',
      targetId: id,
      targetType: 'ANNOUNCEMENT'
    })
    if (communityId) {
      deleteCache(`community:announcements:${communityId}`)
      revalidatePath(`/community/${communityId}`)
    }
    return res
  } catch (e: any) {
    return { error: e.message || 'Gagal menghapus pengumuman.' }
  }
}

export async function togglePublishAnnouncementAction(id: string, currentStatus: string, _communityId?: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const existing: any = await DataStore.getAnnouncementById(id)
  if (!existing) return { error: 'Pengumuman tidak ditemukan.' }
  const communityId = existing.communityId
  if (!(await isCommunityManager(user, communityId))) {
    return { error: 'Anda tidak memiliki akses untuk mengelola pengumuman komunitas ini.' }
  }

  const newStatus = currentStatus === 'DRAFT' ? 'PUBLISHED' : 'DRAFT'
  try {
    const ann = await DataStore.updateAnnouncement(id, communityId, { status: newStatus })
    await logAudit({
      actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'TOGGLE_PUBLISH_ANNOUNCEMENT',
      module: 'COOPERATIVE',
      targetId: id,
      targetType: 'ANNOUNCEMENT',
      detail: `Status → ${newStatus}.`
    })
    if (communityId) {
      deleteCache(`community:announcements:${communityId}`)
      revalidatePath(`/community/${communityId}`)
    }
    return { success: true, announcement: ann }
  } catch (e: any) {
    return { error: e.message || 'Gagal mengubah status publikasi.' }
  }
}

export async function togglePinAnnouncementAction(id: string, currentPinned: boolean, _communityId?: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const existing: any = await DataStore.getAnnouncementById(id)
  if (!existing) return { error: 'Pengumuman tidak ditemukan.' }
  const communityId = existing.communityId
  if (!(await isCommunityManager(user, communityId))) {
    return { error: 'Anda tidak memiliki akses untuk mengelola pengumuman komunitas ini.' }
  }

  try {
    const ann = await DataStore.updateAnnouncement(id, communityId, { isPinned: !currentPinned })
    await logAudit({
      actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'TOGGLE_PIN_ANNOUNCEMENT',
      module: 'COOPERATIVE',
      targetId: id,
      targetType: 'ANNOUNCEMENT',
      detail: !currentPinned ? 'Disematkan.' : 'Lepas sematan.'
    })
    if (communityId) {
      deleteCache(`community:announcements:${communityId}`)
      revalidatePath(`/community/${communityId}`)
    }
    return { success: true, announcement: ann }
  } catch (e: any) {
    return { error: e.message || 'Gagal mengubah status pin.' }
  }
}
