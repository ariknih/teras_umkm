'use server'

import { DataStore } from '@/lib/data-store'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'

export async function getCourses() {
  return await DataStore.getCourses()
}

export async function getCourseById(id: string) {
  return await DataStore.getCourseById(id)
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
