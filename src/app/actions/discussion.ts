'use server'

import { DataStore } from '@/lib/data-store'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'

export async function getDiscussionsAction(communityId: string) {
  if (!communityId) return []
  return await DataStore.getDiscussions(communityId)
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

  try {
    const discussion = await DataStore.updateDiscussion(id, user.id, {
      title,
      category,
      content,
      tags
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

  try {
    const res = await DataStore.deleteDiscussion(id)
    revalidatePath(`/community/${communityId}`)
    return res
  } catch (e: any) {
    return { error: e.message || 'Gagal menghapus topik diskusi.' }
  }
}

export async function togglePinDiscussionAction(id: string, communityId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  try {
    const discussion = await DataStore.togglePinDiscussion(id)
    revalidatePath(`/community/${communityId}`)
    return { success: true, discussion }
  } catch (e: any) {
    return { error: e.message || 'Gagal mengubah status pin.' }
  }
}

export async function toggleCloseDiscussionAction(id: string, communityId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  try {
    const discussion = await DataStore.toggleCloseDiscussion(id)
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
    const reply = await DataStore.createDiscussionReply(user.id, discussionId, content)
    revalidatePath(`/community/${communityId}`)
    return { success: true, reply }
  } catch (e: any) {
    return { error: e.message || 'Gagal mengirim balasan.' }
  }
}

export async function deleteDiscussionReplyAction(id: string, communityId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  try {
    const res = await DataStore.deleteDiscussionReply(id)
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
    const reply = await DataStore.toggleHelpfulReply(user.id, id)
    revalidatePath(`/community/${communityId}`)
    return { success: true, reply }
  } catch (e: any) {
    return { error: e.message || 'Gagal memberikan tanda membantu.' }
  }
}

export async function selectBestReplyAction(discussionId: string, replyId: string, communityId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  try {
    const discussion = await DataStore.selectBestReply(discussionId, replyId)
    revalidatePath(`/community/${communityId}`)
    return { success: true, discussion }
  } catch (e: any) {
    return { error: e.message || 'Gagal memilih jawaban terbaik.' }
  }
}
