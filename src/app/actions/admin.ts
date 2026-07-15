'use server'

import { DataStore } from '@/lib/data-store'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'

// Helper to check admin access
async function ensureAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized: Hanya untuk Administrator.')
  }
  return user
}

// Helper to check Superadmin access
async function ensureSuperAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized: Akses khusus Superadmin.')
  }
  const dbUser = await DataStore.findUserById(user.id)
  if (!dbUser || !(dbUser as any).isSuperAdmin) {
    throw new Error('Unauthorized: Akses khusus Superadmin.')
  }
  return dbUser
}

// ─── USER MANAGEMENT ACTIONS ────────────────────────────────────────────────
export async function updateUserRoleAndLevelAction(
  userId: string,
  role: string,
  level: number,
  xp: number,
  membershipLevel: string,
  membershipAccess: string,
  bootcampStatus?: string
) {
  await ensureAdmin()
  try {
    await DataStore.updateUserRoleAndLevel(userId, role, level, xp, membershipLevel, membershipAccess, bootcampStatus)
    revalidatePath('/admin')
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal memperbarui user.' }
  }
}

// ─── COURSE ACTIONS ────────────────────────────────────────────────────────
export async function addCourseAction(title: string, description: string, coverImage: string, accessRequired: string) {
  await ensureAdmin()
  try {
    const course = await DataStore.addCourse(title, description, coverImage, accessRequired)
    revalidatePath('/admin')
    revalidatePath('/academy')
    return { success: true, course }
  } catch (e: any) {
    return { error: e.message || 'Gagal menambahkan kelas.' }
  }
}

export async function updateCourseAction(id: string, title: string, description: string, coverImage: string, accessRequired: string) {
  await ensureAdmin()
  try {
    await DataStore.updateCourse(id, title, description, coverImage, accessRequired)
    revalidatePath('/admin')
    revalidatePath('/academy')
    revalidatePath(`/academy/course/${id}`)
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal memperbarui kelas.' }
  }
}

export async function deleteCourseAction(id: string) {
  await ensureAdmin()
  try {
    await DataStore.deleteCourse(id)
    revalidatePath('/admin')
    revalidatePath('/academy')
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal menghapus kelas.' }
  }
}

// ─── LESSON ACTIONS ────────────────────────────────────────────────────────
export async function addLessonAction(
  courseId: string,
  title: string,
  content: string,
  videoUrl: string,
  duration: number,
  orderIndex: number
) {
  await ensureAdmin()
  try {
    const lesson = await DataStore.addLesson(courseId, title, content, videoUrl, duration, orderIndex)
    revalidatePath('/admin')
    revalidatePath(`/academy/course/${courseId}`)
    return { success: true, lesson }
  } catch (e: any) {
    return { error: e.message || 'Gagal menambahkan materi pelajaran.' }
  }
}

export async function updateLessonAction(
  id: string,
  courseId: string,
  title: string,
  content: string,
  videoUrl: string,
  duration: number,
  orderIndex: number
) {
  await ensureAdmin()
  try {
    await DataStore.updateLesson(id, title, content, videoUrl, duration, orderIndex)
    revalidatePath('/admin')
    revalidatePath(`/academy/course/${courseId}`)
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal memperbarui materi pelajaran.' }
  }
}

export async function deleteLessonAction(id: string, courseId: string) {
  await ensureAdmin()
  try {
    await DataStore.deleteLesson(id)
    revalidatePath('/admin')
    revalidatePath(`/academy/course/${courseId}`)
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal menghapus materi pelajaran.' }
  }
}

// ─── TRANSACTION TRACKING ───────────────────────────────────────────────────
export async function trackTransactionAction(orderId: string) {
  await ensureAdmin()
  try {
    const order = await DataStore.findOrderById(orderId)
    if (!order) {
      return { error: `Transaksi dengan ID "${orderId}" tidak ditemukan.` }
    }
    return { success: true, order }
  } catch (e: any) {
    return { error: e.message || 'Gagal melacak transaksi.' }
  }
}

export async function generateDummyAffiliatesAction(count: number = 10) {
  await ensureAdmin()
  try {
    await DataStore.generateDummyAffiliates(count)
    revalidatePath('/admin')
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal membuat dummy affiliate.' }
  }
}

export async function getAdminsAction() {
  await ensureSuperAdmin()
  try {
    return await DataStore.getAdmins()
  } catch (e: any) {
    throw new Error(e.message || 'Gagal mengambil data admin.')
  }
}

export async function createAdminAction(formData: FormData) {
  await ensureSuperAdmin()
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const isSuper = formData.get('isSuperAdmin') === 'true'

  if (!name || !email || !password) {
    return { error: 'Nama, email, dan password wajib diisi.' }
  }

  const passwordHash = crypto.createHash('sha256').update(password).digest('hex')

  try {
    const admin = await DataStore.createAdmin({
      name,
      email,
      passwordHash,
      isSuperAdmin: isSuper
    })
    revalidatePath('/admin')
    return { success: true, admin }
  } catch (e: any) {
    return { error: e.message || 'Gagal menambahkan admin.' }
  }
}

export async function deleteAdminAction(id: string) {
  const currentUser = await ensureSuperAdmin()
  if (currentUser.id === id) {
    return { error: 'Anda tidak dapat menghapus akun Anda sendiri.' }
  }
  try {
    await DataStore.deleteAdmin(id)
    revalidatePath('/admin')
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal menghapus admin.' }
  }
}

export async function getInvoiceMembershipsAction(status?: string) {
  await ensureAdmin()
  try {
    return await DataStore.getInvoiceMemberships(status)
  } catch (e: any) {
    throw new Error(e.message || 'Gagal mengambil data invoice.')
  }
}

export async function verifyInvoiceMembershipAction(membershipId: string) {
  const admin = await ensureAdmin()
  try {
    const res = await DataStore.verifyInvoiceMembership(membershipId, admin.id)
    revalidatePath('/admin')
    revalidatePath('/community')
    return res
  } catch (e: any) {
    return { success: false, error: e.message || 'Gagal memverifikasi invoice.' }
  }
}

export async function getAllCoinHoldersAction() {
  await ensureAdmin()
  try {
    return await DataStore.getAllCoinHolders()
  } catch (e: any) {
    throw new Error(e.message || 'Gagal mengambil data holder koin.')
  }
}

export async function injectCoinAction(formData: FormData) {
  const admin = await ensureSuperAdmin()
  const targetId = formData.get('targetId') as string
  const targetType = formData.get('targetType') as 'USER' | 'COMMUNITY'
  const amountStr = formData.get('amount') as string
  const reason = formData.get('reason') as string

  if (!targetId || !targetType || !amountStr || !reason) {
    return { error: 'Semua kolom wajib diisi.' }
  }

  const amount = parseFloat(amountStr)
  if (isNaN(amount) || amount <= 0) {
    return { error: 'Jumlah koin tidak valid.' }
  }

  try {
    await DataStore.injectCoin(targetId, targetType, amount, reason, admin.id)
    revalidatePath('/admin')
    revalidatePath('/community')
    revalidatePath('/wallet')
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal melakukan inject koin.' }
  }
}

export async function getLevelRequestsAction(status?: string) {
  await ensureAdmin()
  try {
    return await DataStore.getLevelRequests(status)
  } catch (e: any) {
    throw new Error(e.message || 'Gagal mengambil pengajuan level.')
  }
}

export async function approveLevelRequestAction(requestId: string) {
  const admin = await ensureSuperAdmin()
  try {
    await DataStore.approveLevelRequest(requestId, admin.id)
    revalidatePath('/admin')
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal menyetujui pengajuan level.' }
  }
}

export async function rejectLevelRequestAction(requestId: string, note: string) {
  const admin = await ensureSuperAdmin()
  try {
    await DataStore.rejectLevelRequest(requestId, note, admin.id)
    revalidatePath('/admin')
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal menolak pengajuan level.' }
  }
}

export async function createLevelRequestAction(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const targetLevel = parseInt(formData.get('targetLevel') as string)
  const radiusKm = parseFloat(formData.get('radiusKm') as string)
  const omsetBulan = parseFloat(formData.get('omsetBulan') as string)
  const hasLegalitas = formData.get('hasLegalitas') === 'true'
  const hasSertifikat = formData.get('hasSertifikat') === 'true'
  const hasDesain = formData.get('hasDesain') === 'true'
  const catatan = formData.get('catatan') as string || undefined

  if (isNaN(targetLevel) || isNaN(radiusKm) || isNaN(omsetBulan)) {
    return { error: 'Data pengajuan tidak valid.' }
  }

  try {
    await DataStore.createLevelRequest({
      userId: user.id,
      targetLevel,
      radiusKm,
      omsetBulan,
      hasLegalitas,
      hasSertifikat,
      hasDesain,
      catatan
    })
    revalidatePath('/merchant/dashboard')
    revalidatePath('/admin')
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal membuat pengajuan level.' }
  }
}
