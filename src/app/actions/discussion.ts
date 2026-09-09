'use server'

import { DataStore } from '@/lib/data-store'
import { getCurrentUser } from './auth'
import { logAudit } from '@/lib/audit-log'
import { revalidatePath } from 'next/cache'
import { isCommunityManager } from '@/lib/auth-guards'

export async function getDiscussionsAction(communityId: string) {
  if (!communityId) return []
  return await DataStore.getDiscussions(communityId)
}

async function findDiscussion(communityId: string, id: string) {
  const list = await DataStore.getDiscussions(communityId)
  return (Array.isArray(list) ? list : []).find((d: any) => d.id === id) || null
}

async function findReplyAuthor(communityId: string, replyId: string) {
  const list = await DataStore.getDiscussions(communityId)
  for (const discussion of Array.isArray(list) ? list : []) {
    const reply = (discussion?.replies || []).find((r: any) => r.id === replyId)
    if (reply) return reply.authorId || reply.author?.id || null
  }
  return null
}

export async function createDiscussionAction(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const communityId = formData.get('communityId') as string
  const title = formData.get('title') as string
  const category = formData.get('category') as string
  const content = formData.get('content') as string
  const tags = formData.get('tags') as string || ''

  if (!communityId) return { error: 'ID Komunitas tidak ditemukan.' }
  if (!title || !category || !content) {
    return { error: 'Judul, kategori, dan isi diskusi wajib diisi.' }
  }

  try {
    const discussion = await DataStore.createDiscussion(user.id, {
      communityId,
      title,
      category,
      content,
      tags
    })
    await logAudit({
      actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'CREATE_DISCUSSION',
      module: 'COOPERATIVE',
      targetId: discussion.id,
      targetType: 'DISCUSSION',
      detail: `"${title}".`
    })
    revalidatePath(`/community/${communityId}`)
    return { success: true, discussion }
  } catch (e: any) {
    return { error: e.message || 'Gagal membuat topik diskusi.' }
  }
}

export async function updateDiscussionAction(id: string, communityId: string, formData: FormData) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const title = formData.get('title') as string
  const category = formData.get('category') as string
  const content = formData.get('content') as string
  const tags = formData.get('tags') as string || ''

  if (!title || !category || !content) {
    return { error: 'Judul, kategori, dan isi diskusi wajib diisi.' }
  }

  const target = await findDiscussion(communityId, id)
  if (!target) return { error: 'Topik diskusi tidak ditemukan.' }
  if (target.authorId !== user.id && user.role !== 'ADMIN') {
    return { error: 'Anda hanya dapat mengubah topik diskusi milik Anda sendiri.' }
  }

  try {
    const discussion = await DataStore.updateDiscussion(id, user.id, {
      title,
      category,
      content,
      tags
    }, communityId)
    await logAudit({
      actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'UPDATE_DISCUSSION',
      module: 'COOPERATIVE',
      targetId: id,
      targetType: 'DISCUSSION'
    })
    revalidatePath(`/community/${communityId}`)
    return { success: true, discussion }
  } catch (e: any) {
    return { error: e.message || 'Gagal mengubah topik diskusi.' }
  }
}

export async function deleteDiscussionAction(id: string, communityId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const target = await findDiscussion(communityId, id)
  if (!target) return { error: 'Topik diskusi tidak ditemukan.' }
  const isManager = await isCommunityManager(user, communityId)
  if (target.authorId !== user.id && !isManager) {
    return { error: 'Anda tidak memiliki wewenang untuk menghapus topik ini.' }
  }

  try {
    const res = await DataStore.deleteDiscussion(id, communityId)
    await logAudit({
      actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'DELETE_DISCUSSION',
      module: 'COOPERATIVE',
      targetId: id,
      targetType: 'DISCUSSION'
    })
    revalidatePath(`/community/${communityId}`)
    return res
  } catch (e: any) {
    return { error: e.message || 'Gagal menghapus topik diskusi.' }
  }
}

export async function togglePinDiscussionAction(id: string, communityId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }
  if (!(await isCommunityManager(user, communityId))) {
    return { error: 'Hanya pengurus komunitas yang dapat menyematkan topik.' }
  }

  try {
    const discussion: any = await DataStore.togglePinDiscussion(id, communityId)
    await logAudit({
      actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'TOGGLE_PIN_DISCUSSION',
      module: 'COOPERATIVE',
      targetId: id,
      targetType: 'DISCUSSION',
      detail: discussion?.isPinned ? 'Disematkan.' : 'Lepas sematan.'
    })
    revalidatePath(`/community/${communityId}`)
    return { success: true, discussion }
  } catch (e: any) {
    return { error: e.message || 'Gagal mengubah status pin.' }
  }
}

export async function toggleCloseDiscussionAction(id: string, communityId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const target = await findDiscussion(communityId, id)
  if (!target) return { error: 'Topik diskusi tidak ditemukan.' }
  if (target.authorId !== user.id && !(await isCommunityManager(user, communityId))) {
    return { error: 'Anda tidak memiliki wewenang untuk menutup topik ini.' }
  }

  try {
    const discussion: any = await DataStore.toggleCloseDiscussion(id, communityId)
    await logAudit({
      actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'TOGGLE_CLOSE_DISCUSSION',
      module: 'COOPERATIVE',
      targetId: id,
      targetType: 'DISCUSSION',
      detail: discussion?.isClosed ? 'Ditutup.' : 'Dibuka kembali.'
    })
    revalidatePath(`/community/${communityId}`)
    return { success: true, discussion }
  } catch (e: any) {
    return { error: e.message || 'Gagal mengubah status diskusi.' }
  }
}

export async function createDiscussionReplyAction(discussionId: string, communityId: string, content: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }
  if (!content) return { error: 'Isi balasan wajib diisi.' }

  try {
    const reply = await DataStore.createDiscussionReply(user.id, discussionId, content, communityId)
    revalidatePath(`/community/${communityId}`)
    return { success: true, reply }
  } catch (e: any) {
    return { error: e.message || 'Gagal mengirim balasan.' }
  }
}

export async function deleteDiscussionReplyAction(id: string, communityId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const replyAuthorId = await findReplyAuthor(communityId, id)
  if (!replyAuthorId) return { error: 'Balasan tidak ditemukan.' }
  if (replyAuthorId !== user.id && !(await isCommunityManager(user, communityId))) {
    return { error: 'Anda tidak memiliki wewenang untuk menghapus balasan ini.' }
  }

  try {
    const res = await DataStore.deleteDiscussionReply(id, communityId)
    await logAudit({
      actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'DELETE_DISCUSSION_REPLY',
      module: 'COOPERATIVE',
      targetId: id,
      targetType: 'DISCUSSION_REPLY'
    })
    revalidatePath(`/community/${communityId}`)
    return res
  } catch (e: any) {
    return { error: e.message || 'Gagal menghapus balasan.' }
  }
}

export async function toggleHelpfulReplyAction(id: string, communityId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  try {
    const reply = await DataStore.toggleHelpfulReply(user.id, id, communityId)
    revalidatePath(`/community/${communityId}`)
    return { success: true, reply }
  } catch (e: any) {
    return { error: e.message || 'Gagal memberikan tanda membantu.' }
  }
}

export async function selectBestReplyAction(discussionId: string, replyId: string, communityId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const target = await findDiscussion(communityId, discussionId)
  if (!target) return { error: 'Topik diskusi tidak ditemukan.' }
  if (target.authorId !== user.id && !(await isCommunityManager(user, communityId))) {
    return { error: 'Hanya penanya atau pengurus komunitas yang dapat memilih jawaban terbaik.' }
  }

  try {
    const discussion = await DataStore.selectBestReply(discussionId, replyId, communityId)
    await logAudit({
      actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'SELECT_BEST_REPLY',
      module: 'COOPERATIVE',
      targetId: discussionId,
      targetType: 'DISCUSSION',
      detail: `Balasan #${replyId} dipilih sebagai jawaban terbaik.`
    })
    revalidatePath(`/community/${communityId}`)
    return { success: true, discussion }
  } catch (e: any) {
    return { error: e.message || 'Gagal memilih jawaban terbaik.' }
  }
}

export async function toggleLikeDiscussionAction(discussionId: string, communityId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  try {
    const discussion = await DataStore.toggleLikeDiscussion(user.id, discussionId, communityId)
    revalidatePath(`/community/${communityId}`)
    return { success: true, discussion }
  } catch (e: any) {
    return { error: e.message || 'Gagal menyukai diskusi.' }
  }
}

