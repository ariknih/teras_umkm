'use server'

import { DataStore } from '@/lib/data-store'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'
import { cacheWrap, deleteCache } from '@/lib/cache'

export async function getCommunityEventsAction(communityId: string) {
  if (!communityId) return []
  return await cacheWrap(`community:events:${communityId}`, () => DataStore.getCommunityEvents(communityId), 60)
}

export async function createCommunityEventAction(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const communityId = formData.get('communityId') as string
  const title = formData.get('title') as string
  const description = (formData.get('description') as string) || ''
  const eventDate = formData.get('eventDate') as string
  const location = (formData.get('location') as string) || 'Lokasi Komunitas'
  const isOnline = formData.get('isOnline') === 'true'
  const linkUrl = (formData.get('linkUrl') as string) || ''
  const bannerUrl = (formData.get('bannerUrl') as string) || ''
  const maxParticipants = Number(formData.get('maxParticipants') || 100)
  const price = Number(formData.get('price') || 0)
  const organizer = (formData.get('organizer') as string) || 'Pengurus Komunitas'

  if (!communityId) return { error: 'ID Komunitas tidak ditemukan.' }
  if (!title) return { error: 'Judul event wajib diisi.' }
  if (!eventDate) return { error: 'Tanggal event wajib diisi.' }

  try {
    const event = await DataStore.createCommunityEvent({
      communityId,
      title,
      description,
      eventDate,
      location,
      isOnline,
      linkUrl,
      bannerUrl,
      maxParticipants,
      price,
      organizer
    })
    revalidatePath(`/community/${communityId}`)
    return { success: true, event }
  } catch (e: any) {
    return { error: e.message || 'Gagal menambahkan event komunitas.' }
  }
}

export async function updateCommunityEventAction(id: string, formData: FormData) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const communityId = formData.get('communityId') as string
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const eventDate = formData.get('eventDate') as string
  const location = formData.get('location') as string
  const isOnline = formData.get('isOnline') ? formData.get('isOnline') === 'true' : undefined
  const linkUrl = formData.get('linkUrl') as string
  const bannerUrl = formData.get('bannerUrl') as string
  const maxParticipants = formData.get('maxParticipants') ? Number(formData.get('maxParticipants')) : undefined
  const price = formData.get('price') ? Number(formData.get('price')) : undefined
  const status = formData.get('status') as string
  const organizer = formData.get('organizer') as string

  if (!id) return { error: 'ID Event wajib diisi.' }

  try {
    const event = await DataStore.updateCommunityEvent(id, {
      title,
      description,
      eventDate,
      location,
      isOnline,
      linkUrl,
      bannerUrl,
      maxParticipants,
      price,
      status,
      organizer
    })
    if (communityId) {
      revalidatePath(`/community/${communityId}`)
    }
    return { success: true, event }
  } catch (e: any) {
    return { error: e.message || 'Gagal mengubah event komunitas.' }
  }
}

export async function deleteCommunityEventAction(id: string, communityId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  if (!id) return { error: 'ID Event wajib diisi.' }

  try {
    const res = await DataStore.deleteCommunityEvent(id)
    if (communityId) {
      revalidatePath(`/community/${communityId}`)
    }
    return res
  } catch (e: any) {
    return { error: e.message || 'Gagal menghapus event komunitas.' }
  }
}

export async function registerCommunityEventAction(eventId: string, communityId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu untuk mendaftar event.' }

  try {
    const res = await DataStore.registerCommunityEvent(eventId, user.id, user.name || 'Anggota Saloka')
    if (communityId) {
      revalidatePath(`/community/${communityId}`)
    }
    return res
  } catch (e: any) {
    return { error: e.message || 'Gagal mendaftar event.' }
  }
}
