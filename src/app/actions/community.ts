'use server'

import { DataStore } from '@/lib/data-store'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'

export async function getPosts(groupId?: string) {
  return await DataStore.getPosts(groupId)
}

export async function getPostById(id: string) {
  return await DataStore.getPostById(id)
}

export async function createPost(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }
  
  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const category = formData.get('category') as string || undefined
  const imageUrl = formData.get('imageUrl') as string || undefined
  const videoUrl = formData.get('videoUrl') as string || undefined
  const groupId = formData.get('groupId') as string || undefined
  
  if (!title || !content) {
    return { error: 'Judul dan konten diskusi wajib diisi.' }
  }
  
  try {
    const post = await DataStore.createPost(user.id, title, content, category, imageUrl, videoUrl, groupId)
    revalidatePath('/community')
    if (groupId) {
      revalidatePath(`/community?groupId=${groupId}`)
    }
    return { success: true, post }
  } catch (e: any) {
    return { error: e.message || 'Gagal membuat diskusi.' }
  }
}

export async function createComment(postId: string, content: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }
  if (!content) return { error: 'Konten komentar tidak boleh kosong.' }
  
  try {
    const comment = await DataStore.createComment(user.id, postId, content)
    revalidatePath('/community')
    revalidatePath(`/community/post/${postId}`)
    return { success: true, comment }
  } catch (e: any) {
    return { error: e.message || 'Gagal menambahkan komentar.' }
  }
}

export async function toggleLikePost(postId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }
  
  try {
    const res = await DataStore.toggleLikePost(user.id, postId)
    revalidatePath('/community')
    return { success: true, ...res }
  } catch (e: any) {
    return { error: e.message || 'Gagal mengubah status suka.' }
  }
}

export async function getCommunityMembers(groupId?: string) {
  return await DataStore.getCommunityMembers(groupId)
}

// GROUP-SPECIFIC ACTIONS
export async function getGroups() {
  return await DataStore.getGroups()
}

export async function getGroupById(id: string) {
  return await DataStore.getGroupById(id)
}

export async function createGroup(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const avatarUrl = formData.get('avatarUrl') as string || undefined
  const coverUrl = formData.get('coverUrl') as string || undefined

  if (!name || !description) {
    return { error: 'Nama dan deskripsi komunitas wajib diisi.' }
  }

  try {
    const group = await DataStore.createGroup(user.id, name, description, avatarUrl, coverUrl)
    revalidatePath('/community')
    return { success: true, group }
  } catch (e: any) {
    return { error: e.message || 'Gagal membuat komunitas.' }
  }
}

export async function toggleJoinGroup(groupId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  try {
    const res = await DataStore.toggleJoinGroup(user.id, groupId)
    revalidatePath('/community')
    revalidatePath(`/community?groupId=${groupId}`)
    return { success: true, ...res }
  } catch (e: any) {
    return { error: e.message || 'Gagal merubah status keanggotaan.' }
  }
}

export async function isGroupMember(groupId: string) {
  const user = await getCurrentUser()
  if (!user) return false
  return await DataStore.isGroupMember(user.id, groupId)
}

export async function toggleSuspendGroup(groupId: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    return { error: 'Hanya Super Admin yang dapat menangguhkan komunitas.' }
  }

  try {
    const res = await DataStore.toggleSuspendGroup(groupId)
    revalidatePath('/community')
    revalidatePath(`/community?groupId=${groupId}`)
    return { success: true, group: res }
  } catch (e: any) {
    return { error: e.message || 'Gagal merubah status komunitas.' }
  }
}

export async function deletePostAction(postId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const post = await DataStore.getPostById(postId)
  if (!post) return { error: 'Postingan tidak ditemukan.' }

  let allowed = user.role === 'ADMIN' || post.authorId === user.id
  if (!allowed && post.groupId) {
    const group = await DataStore.getGroupById(post.groupId)
    if (group && group.adminId === user.id) {
      allowed = true
    }
  }

  if (!allowed) {
    return { error: 'Anda tidak memiliki wewenang untuk menghapus postingan ini.' }
  }

  try {
    await DataStore.deletePost(postId)
    revalidatePath('/community')
    if (post.groupId) {
      revalidatePath(`/community?groupId=${post.groupId}`)
    }
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal menghapus postingan.' }
  }
}

export async function deleteCommentAction(commentId: string, postId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const post = await DataStore.getPostById(postId)
  if (!post) return { error: 'Postingan tidak ditemukan.' }

  const comment = post.comments.find((c: any) => c.id === commentId)
  if (!comment) return { error: 'Komentar tidak ditemukan.' }

  let allowed = user.role === 'ADMIN' || comment.authorId === user.id
  if (!allowed && post.groupId) {
    const group = await DataStore.getGroupById(post.groupId)
    if (group && group.adminId === user.id) {
      allowed = true
    }
  }

  if (!allowed) {
    return { error: 'Anda tidak memiliki wewenang untuk menghapus komentar ini.' }
  }

  try {
    await DataStore.deleteComment(commentId)
    revalidatePath('/community')
    revalidatePath(`/community/post/${postId}`)
    if (post.groupId) {
      revalidatePath(`/community?groupId=${post.groupId}`)
    }
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal menghapus komentar.' }
  }
}


