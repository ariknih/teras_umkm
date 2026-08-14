'use server'

import { DataStore } from '@/lib/data-store'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'

export async function getCooperativeReportsAction(communityId: string) {
  if (!communityId) return []
  return await DataStore.getCooperativeReports(communityId)
}

export async function createCooperativeReportAction(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const communityId = formData.get('communityId') as string
  const title = formData.get('title') as string
  const type = formData.get('type') as string
  const yearStr = formData.get('year') as string
  const fileUrl = formData.get('fileUrl') as string
  const publishedAtStr = formData.get('publishedAt') as string
  const status = formData.get('status') as string || 'PUBLISHED'

  if (!communityId) return { error: 'CommunityId wajib diisi.' }
  if (!title || !type || !yearStr || !fileUrl) {
    return { error: 'Judul, jenis laporan, tahun buku, dan file laporan wajib diisi.' }
  }

  const year = Number(yearStr)
  if (isNaN(year)) return { error: 'Tahun buku harus berupa angka.' }

  const publishedAt = publishedAtStr ? new Date(publishedAtStr) : new Date()

  try {
    const rep = await DataStore.createCooperativeReport({
      communityId,
      title,
      type,
      year,
      fileUrl,
      publishedAt,
      status
    })
    revalidatePath(`/community/${communityId}`)
    return { success: true, report: rep }
  } catch (e: any) {
    return { error: e.message || 'Gagal membuat laporan.' }
  }
}

export async function updateCooperativeReportAction(id: string, formData: FormData) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const communityId = formData.get('communityId') as string
  const title = formData.get('title') as string
  const type = formData.get('type') as string
  const yearStr = formData.get('year') as string
  const fileUrl = formData.get('fileUrl') as string
  const publishedAtStr = formData.get('publishedAt') as string
  const status = formData.get('status') as string

  if (!title || !type || !yearStr || !fileUrl) {
    return { error: 'Judul, jenis laporan, tahun buku, dan file laporan wajib diisi.' }
  }

  const year = Number(yearStr)
  if (isNaN(year)) return { error: 'Tahun buku harus berupa angka.' }

  const publishedAt = publishedAtStr ? new Date(publishedAtStr) : undefined

  try {
    const rep = await DataStore.updateCooperativeReport(id, {
      title,
      type,
      year,
      fileUrl,
      publishedAt,
      status
    })
    if (communityId) {
      revalidatePath(`/community/${communityId}`)
    }
    return { success: true, report: rep }
  } catch (e: any) {
    return { error: e.message || 'Gagal memperbarui laporan.' }
  }
}

export async function deleteCooperativeReportAction(id: string, communityId?: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  try {
    const res = await DataStore.deleteCooperativeReport(id)
    if (communityId) {
      revalidatePath(`/community/${communityId}`)
    }
    return res
  } catch (e: any) {
    return { error: e.message || 'Gagal menghapus laporan.' }
  }
}

export async function togglePublishReportAction(id: string, currentStatus: string, communityId?: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const newStatus = currentStatus === 'DRAFT' ? 'PUBLISHED' : 'DRAFT'
  try {
    const rep = await DataStore.updateCooperativeReport(id, { status: newStatus })
    if (communityId) {
      revalidatePath(`/community/${communityId}`)
    }
    return { success: true, report: rep }
  } catch (e: any) {
    return { error: e.message || 'Gagal mengubah status publikasi.' }
  }
}
