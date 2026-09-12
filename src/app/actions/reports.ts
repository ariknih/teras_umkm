'use server'

import { DataStore } from '@/lib/data-store'
import { getCurrentUser } from './auth'
import { logAudit } from '@/lib/audit-log'
import { revalidatePath } from 'next/cache'
import { cacheWrap, deleteCache } from '@/lib/cache'
import { isCommunityManager } from '@/lib/auth-guards'

export async function getCooperativeReportsAction(
  communityId: string,
  viewerCtx?: { userId: string | null; role: string | null; isKetua: boolean; isMember: boolean }
) {
  if (!communityId) return []

  let isManager = false
  let isMember = false
  if (viewerCtx) {
    isManager = viewerCtx.role === 'ADMIN' || viewerCtx.isKetua
    isMember = viewerCtx.isMember
  } else {
    const user = await getCurrentUser()
    isManager = await isCommunityManager(user, communityId)
    isMember = user ? await DataStore.isCommunityMember(user.id, communityId) : false
  }
  if (!isManager && !isMember) return []

  const all = await cacheWrap(`community:reports:${communityId}`, () => DataStore.getCooperativeReports(communityId), 60)
  return isManager ? (all || []) : (all || []).filter((r: any) => r.status === 'PUBLISHED')
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
  if (!(await isCommunityManager(user, communityId))) {
    return { error: 'Anda tidak memiliki akses untuk mengelola laporan komunitas ini.' }
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
    await logAudit({
      actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'CREATE_COOPERATIVE_REPORT',
      module: 'COOPERATIVE',
      targetId: rep.id,
      targetType: 'COOPERATIVE_REPORT',
      detail: `"${title}" (${type}, ${year}).`
    })
    deleteCache(`community:reports:${communityId}`)
    revalidatePath(`/community/${communityId}`)
    return { success: true, report: rep }
  } catch (e: any) {
    return { error: e.message || 'Gagal membuat laporan.' }
  }
}

export async function updateCooperativeReportAction(id: string, formData: FormData) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const title = formData.get('title') as string
  const type = formData.get('type') as string
  const yearStr = formData.get('year') as string
  const fileUrl = formData.get('fileUrl') as string
  const publishedAtStr = formData.get('publishedAt') as string
  const status = formData.get('status') as string

  if (!title || !type || !yearStr || !fileUrl) {
    return { error: 'Judul, jenis laporan, tahun buku, dan file laporan wajib diisi.' }
  }

  const existing: any = await DataStore.getCooperativeReportById(id)
  if (!existing) return { error: 'Laporan tidak ditemukan.' }
  const communityId = existing.communityId
  if (!(await isCommunityManager(user, communityId))) {
    return { error: 'Anda tidak memiliki akses untuk mengelola laporan komunitas ini.' }
  }

  const year = Number(yearStr)
  if (isNaN(year)) return { error: 'Tahun buku harus berupa angka.' }

  const publishedAt = publishedAtStr ? new Date(publishedAtStr) : undefined

  try {
    const rep = await DataStore.updateCooperativeReport(id, communityId, {
      title,
      type,
      year,
      fileUrl,
      publishedAt,
      status
    })
    await logAudit({
      actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'UPDATE_COOPERATIVE_REPORT',
      module: 'COOPERATIVE',
      targetId: id,
      targetType: 'COOPERATIVE_REPORT'
    })
    if (communityId) {
      deleteCache(`community:reports:${communityId}`)
      revalidatePath(`/community/${communityId}`)
    }
    return { success: true, report: rep }
  } catch (e: any) {
    return { error: e.message || 'Gagal memperbarui laporan.' }
  }
}

export async function deleteCooperativeReportAction(id: string, _communityId?: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const existing: any = await DataStore.getCooperativeReportById(id)
  if (!existing) return { error: 'Laporan tidak ditemukan.' }
  const communityId = existing.communityId
  if (!(await isCommunityManager(user, communityId))) {
    return { error: 'Anda tidak memiliki akses untuk mengelola laporan komunitas ini.' }
  }

  try {
    const res = await DataStore.deleteCooperativeReport(id, communityId)
    await logAudit({
      actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'DELETE_COOPERATIVE_REPORT',
      module: 'COOPERATIVE',
      targetId: id,
      targetType: 'COOPERATIVE_REPORT'
    })
    if (communityId) {
      deleteCache(`community:reports:${communityId}`)
      revalidatePath(`/community/${communityId}`)
    }
    return res
  } catch (e: any) {
    return { error: e.message || 'Gagal menghapus laporan.' }
  }
}

export async function togglePublishReportAction(id: string, currentStatus: string, _communityId?: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const existing: any = await DataStore.getCooperativeReportById(id)
  if (!existing) return { error: 'Laporan tidak ditemukan.' }
  const communityId = existing.communityId
  if (!(await isCommunityManager(user, communityId))) {
    return { error: 'Anda tidak memiliki akses untuk mengelola laporan komunitas ini.' }
  }

  const newStatus = currentStatus === 'DRAFT' ? 'PUBLISHED' : 'DRAFT'
  try {
    const rep = await DataStore.updateCooperativeReport(id, communityId, { status: newStatus })
    await logAudit({
      actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'TOGGLE_PUBLISH_REPORT',
      module: 'COOPERATIVE',
      targetId: id,
      targetType: 'COOPERATIVE_REPORT',
      detail: `Status → ${newStatus}.`
    })
    if (communityId) {
      deleteCache(`community:reports:${communityId}`)
      revalidatePath(`/community/${communityId}`)
    }
    return { success: true, report: rep }
  } catch (e: any) {
    return { error: e.message || 'Gagal mengubah status publikasi.' }
  }
}
