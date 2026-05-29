'use server'

import { DataStore } from '@/lib/data-store'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'

// Helper to check admin access
async function ensureAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized: Hanya untuk Administrator.')
  }
  return user
}

// ─── USER MANAGEMENT ACTIONS ────────────────────────────────────────────────
export async function updateUserRoleAndLevelAction(
  userId: string,
  role: string,
  level: number,
  xp: number,
  membershipLevel: string,
  membershipAccess: string
) {
  await ensureAdmin()
  try {
    await DataStore.updateUserRoleAndLevel(userId, role, level, xp, membershipLevel, membershipAccess)
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
