'use server'

import { DataStore } from '@/lib/data-store'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'

export async function startChatWithSeller(sellerId: string, productId?: string) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Anda harus masuk terlebih dahulu.' }
  }
  if (user.id === sellerId) {
    return { error: 'Anda tidak bisa memulai chat dengan diri sendiri.' }
  }
  try {
    const room = await DataStore.getOrCreateChatRoom(user.id, sellerId, productId)
    return { success: true, room }
  } catch (e: any) {
    return { error: e.message || 'Gagal memulai chat.' }
  }
}

export async function getChatHistory(roomId: string) {
  const user = await getCurrentUser()
  if (!user) {
    return []
  }
  try {
    await DataStore.markMessagesAsRead(roomId, user.id)
    return await DataStore.getChatMessages(roomId)
  } catch (e) {
    return []
  }
}

export async function sendChat(roomId: string, content: string, imageUrl?: string) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Anda harus masuk terlebih dahulu.' }
  }
  if (!content.trim() && !imageUrl) {
    return { error: 'Pesan tidak boleh kosong.' }
  }
  try {
    const msg = await DataStore.sendChatMessage(roomId, user.id, content, imageUrl)
    return { success: true, message: msg }
  } catch (e: any) {
    return { error: e.message || 'Gagal mengirim pesan.' }
  }
}

export async function getMyConversations() {
  const user = await getCurrentUser()
  if (!user) {
    return []
  }
  try {
    return await DataStore.getUserConversations(user.id)
  } catch (e) {
    return []
  }
}

export async function markChatAsReadAction(roomId: string) {
  const user = await getCurrentUser()
  if (!user) return { success: false }
  try {
    await DataStore.markMessagesAsRead(roomId, user.id)
    return { success: true }
  } catch (e) {
    return { success: false }
  }
}
