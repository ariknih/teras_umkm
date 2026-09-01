'use server'

import { DataStore } from '@/lib/data-store'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'
import { cacheWrap } from '@/lib/cache'

export async function getCourses() {
  return await cacheWrap('lms:courses:all', () => DataStore.getCourses(), 300)
}

export async function getCourseById(id: string) {
  return await cacheWrap(`lms:course:${id}`, () => DataStore.getCourseById(id), 300)
}

export async function getUserProgress() {
  const user = await getCurrentUser()
  if (!user) return []
  return await DataStore.getUserProgress(user.id)
}

export async function toggleLessonProgress(lessonId: string, completed: boolean) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Anda harus masuk terlebih dahulu untuk melacak progres belajar.' }
  }
  
  try {
    await DataStore.toggleLessonProgress(user.id, lessonId, completed)
    revalidatePath('/academy')
    revalidatePath(`/academy/course`)
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal mengubah progres belajar.' }
  }
}

export async function purchaseCourseAction(courseId: string, amount: number, courseTitle: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }
  try {
    await DataStore.purchaseCourse(user.id, courseId, amount, courseTitle)
    revalidatePath('/academy')
    revalidatePath(`/academy/course/${courseId}`)
    revalidatePath('/affiliate')
    revalidatePath('/merchant/dashboard')
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal membeli kelas.' }
  }
}
