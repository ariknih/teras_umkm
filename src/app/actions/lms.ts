'use server'

import { DataStore } from '@/lib/data-store'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'
import { cacheWrap, invalidateCachePattern, deleteCache } from '@/lib/cache'
import { isModuleUnlocked, computeWatchState } from '@/lib/lms-rules'
import crypto from 'crypto'

export async function getCourses() {
  return await cacheWrap('lms:courses:all', () => DataStore.getCourses(), 300)
}

export async function getCourseById(id: string) {
  return await cacheWrap(`lms:course:${id}`, () => DataStore.getCourseById(id), 300)
}

/** Pass a known userId (e.g. from a Promise.all-fetched user) to skip a redundant getCurrentUser() call. */
export async function getUserProgress(userId?: string) {
  const uid = userId ?? (await getCurrentUser())?.id
  if (!uid) return []
  return await cacheWrap(`lms:progress:${uid}`, () => DataStore.getUserProgress(uid), 30)
}

export async function getUserCertificates() {
  const user = await getCurrentUser()
  if (!user) return []
  return await DataStore.getUserCertificates(user.id)
}

// The serial is a public, unauthenticated lookup key (/certificate/[serial]) —
// Math.random's ~1M-combination suffix was brute-forceable against a known
// issue time. crypto.randomBytes gives it 2^48 combinations instead.
function makeSerial() {
  return `SLK-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(6).toString('hex').toUpperCase()}`
}

/**
 * Records how far the user has actually watched, and derives completion from it.
 *
 * The browser only ever reports elapsed seconds — it cannot declare a module
 * finished, and it cannot skip ahead: a module whose predecessors are unfinished
 * is rejected outright. The disabled buttons in the UI are a convenience; this
 * is the rule that actually holds.
 */
export async function saveWatchProgress(
  lessonId: string,
  seconds: number,
  observedDuration?: number
) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Anda harus masuk terlebih dahulu untuk menyimpan progres belajar.' }
  }

  const lesson: any = await DataStore.findLessonById(lessonId)
  if (!lesson) return { error: 'Modul tidak ditemukan.' }

  const course: any = await DataStore.getCourseById(lesson.courseId)
  const lessons: any[] = course?.lessons || []
  const progressList: any[] = await DataStore.getUserProgress(user.id)
  const completedIds = new Set(progressList.filter((p) => p.completed).map((p) => p.lessonId))

  // Sequential gate — every earlier module must already be finished.
  if (!isModuleUnlocked(lessons, lessonId, completedIds)) {
    return { error: 'Selesaikan modul sebelumnya terlebih dahulu.' }
  }

  const existing = progressList.find((p) => p.lessonId === lessonId)
  const { watchedSeconds, completed } = computeWatchState({
    duration: Number(lesson.duration) || 0,
    reportedSeconds: Number(seconds) || 0,
    existingWatched: Number(existing?.watchedSeconds) || 0,
    alreadyComplete: existing?.completed === true,
    observedDuration: Number(observedDuration) || 0,
  })

  await DataStore.upsertLessonProgress(user.id, lessonId, {
    watchedSeconds,
    completed,
    completedAt: completed ? (existing?.completedAt ?? new Date()) : null,
  })
  await deleteCache(`lms:progress:${user.id}`)

  // Finishing the last remaining module issues the certificate — the reward.
  let certificateSerial: string | null = null
  if (completed && lessons.length > 0) {
    const finished = new Set(completedIds)
    finished.add(lessonId)
    if (lessons.every((l) => finished.has(l.id))) {
      try {
        const cert: any = await DataStore.issueCertificate(user.id, lesson.courseId, makeSerial())
        certificateSerial = cert?.serial ?? null
      } catch (e) {
        // A certificate failure must never lose the watch progress just saved.
        console.error('[LMS] Gagal menerbitkan sertifikat:', e)
      }
    }
  }

  revalidatePath('/academy')
  revalidatePath(`/academy/course/${lesson.courseId}`)

  return { success: true, watchedSeconds, completed, certificateSerial }
}

/**
 * Price and title are read from the database. They used to be passed in from the
 * browser, which meant the client could name its own price.
 */
export async function purchaseCourseAction(courseId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const course: any = await DataStore.getCourseById(courseId)
  if (!course) return { error: 'Kelas tidak ditemukan.' }

  const price = Number(course.price) || 0
  if (price <= 0) return { error: 'Kelas ini belum tersedia untuk dibeli.' }

  // The client only hides the "Beli Kelas" button once a course is owned — a
  // repeated or replayed call must not re-debit the wallet for access already granted.
  const dbUser: any = await DataStore.findUserById(user.id)
  let purchasedCourseIds: string[] = []
  try {
    const config = JSON.parse(dbUser?.landingPageConfig || '{}')
    if (Array.isArray(config.purchasedCourseIds)) purchasedCourseIds = config.purchasedCourseIds
  } catch (_) {}
  if (purchasedCourseIds.includes(courseId)) {
    return { error: 'Anda sudah memiliki akses ke kelas ini.' }
  }

  try {
    await DataStore.purchaseCourse(user.id, courseId, price, course.title)
    revalidatePath('/academy')
    revalidatePath(`/academy/course/${courseId}`)
    revalidatePath('/affiliate')
    revalidatePath('/merchant/dashboard')
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal membeli kelas.' }
  }
}

/** Clears the 300s course cache so CMS edits show up immediately. */
export async function invalidateLmsCache() {
  await invalidateCachePattern('lms:')
}
