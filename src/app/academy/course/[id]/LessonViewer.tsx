'use client'

import React, { useState, useTransition, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { saveWatchProgress, purchaseCourseAction } from '@/app/actions/lms'
import { FilePlayer, YouTubePlayer } from './VideoPlayer'
import { extractYouTubeId, isCourseAccessLocked } from '@/lib/lms-rules'

interface Lesson {
  id: string
  title: string
  content: string
  videoUrl: string
  type?: string
  duration: number
  orderIndex: number
}

interface LessonViewerProps {
  courseId: string
  courseTitle: string
  lessons: Lesson[]
  initialActiveLessonId: string
  completedLessonIds: string[]
  watchedByLesson: Record<string, number>
  coursePrice: number
  certificateSerial: string | null
  isLoggedIn: boolean
  userAccess: string
  courseAccessRequired: string
  purchasedCourseIds?: string[]
  isBootcampJoined?: boolean
  isAdmin?: boolean
}

export default function LessonViewer({
  courseId,
  courseTitle,
  lessons,
  initialActiveLessonId,
  completedLessonIds,
  watchedByLesson,
  coursePrice,
  certificateSerial,
  isLoggedIn,
  userAccess,
  courseAccessRequired,
  purchasedCourseIds = [],
  isBootcampJoined = false,
  isAdmin = false,
}: LessonViewerProps) {
  const router = useRouter()
  const [activeId, setActiveId] = useState(initialActiveLessonId)
  const [isPending, startTransition] = useTransition()

  // Last position written to the server, so repeated reports are cheap no-ops.
  const lastSavedRef = useRef(0)

  const activeLesson = lessons.find((l) => l.id === activeId) || lessons[0]
  const completedSet = new Set(completedLessonIds)
  const isActiveCompleted = activeLesson ? completedSet.has(activeLesson.id) : false
  // Which player this module needs. Most existing content is on YouTube;
  // anything uploaded through the CMS is a direct file.
  const activeYouTubeId = activeLesson?.videoUrl ? extractYouTubeId(activeLesson.videoUrl) : null

  // What the "next module" overlay advances to once the video ends.
  const activeIndex = lessons.findIndex((l) => l.id === activeId)
  const nextLesson = activeIndex >= 0 ? lessons[activeIndex + 1] : undefined
  const goToNextLesson = useCallback(() => {
    if (nextLesson) setActiveId(nextLesson.id)
  }, [nextLesson])

  // Sequential rule: a module opens only once the one before it is finished.
  const isUnlockedAt = (index: number) =>
    index === 0 || (index > 0 && completedSet.has(lessons[index - 1].id))

  const isLocked = isCourseAccessLocked({
    courseAccessRequired,
    userAccess,
    isAdmin,
    isBootcampJoined,
    hasPurchased: purchasedCourseIds.includes(courseId),
  })

  const allCompleted = lessons.length > 0 && lessons.every((l) => completedSet.has(l.id))

  // Reset the save watermark whenever the module changes; the players own the
  // watched ceiling and flush their own position on unmount.
  useEffect(() => {
    lastSavedRef.current = watchedByLesson[activeId] || 0
  }, [activeId, watchedByLesson])

  const persist = useCallback(
    async (seconds: number, observedDuration?: number) => {
      if (!isLoggedIn || !activeId) return
      const rounded = Math.floor(seconds)
      if (rounded <= lastSavedRef.current) return
      lastSavedRef.current = rounded
      try {
        const res: any = await saveWatchProgress(activeId, rounded, observedDuration)
        // Refresh once, when the module flips to finished, so the next one unlocks.
        if (res?.completed && !completedSet.has(activeId)) {
          router.refresh()
        }
      } catch {
        // A dropped progress ping is not worth interrupting playback over;
        // the next tick will carry a higher number anyway.
      }
    },
    [activeId, isLoggedIn, router, completedLessonIds]
  )

  const handlePurchase = () => {
    if (!isLoggedIn) {
      router.push('/auth')
      return
    }
    if (
      confirm(
        `Apakah Anda yakin ingin membeli akses kelas "${courseTitle}" seharga Rp ${coursePrice.toLocaleString('id-ID')}? Saldo dompet Anda akan didebit.`
      )
    ) {
      startTransition(async () => {
        const res = await purchaseCourseAction(courseId)
        if (res.success) {
          alert('Kelas berhasil dibeli! Akses materi sekarang terbuka.')
          router.refresh()
        } else {
          alert(res.error || 'Gagal membeli kelas.')
        }
      })
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start">
      {/* Main Lesson Content & Reader */}
      <div className="flex-1 min-w-0 space-y-5">
        {isLocked ? (
          <div className="border border-market-green-500/20 bg-white rounded-2xl p-6 sm:p-8 text-center flex flex-col items-center justify-center space-y-6 relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-market-green-500/10 blur-3xl pointer-events-none" />

            {/* Lock Icon */}
            <div className="w-16 h-16 rounded-2xl bg-market-green-50 border border-market-green-200 flex items-center justify-center text-market-green-600 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0V10.5m-2.25 13.5h13.5c.621 0 1.125-.504 1.125-1.125V11.25c0-.621-.504-1.125-1.125-1.125H4.25c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125Z" />
              </svg>
            </div>
            <div className="space-y-3 max-w-md">
              <h3 className="font-sora text-xl font-bold text-text-primary">Materi Eksklusif Terkunci</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                {courseAccessRequired === 'Bootcamp'
                  ? 'Modul ini khusus bagi merchant terdaftar Program Saloka Bootcamp. Silakan gabung via dashboard merchant Anda.'
                  : `Modul ini hanya dapat diakses oleh anggota dengan tingkat ${courseAccessRequired} atau lebih tinggi.`}
              </p>
            </div>

            {/* Info Box */}
            <div className="w-full max-w-md bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col gap-2 text-left">
              {courseAccessRequired === 'Bootcamp' ? (
                <div className="text-xs text-center text-text-secondary font-medium">
                  Persyaratan: Akses keanggotaan <strong>Bootcamp Saloka</strong> Aktif.
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-text-secondary">Tingkat Akses Anda:</span>
                    <span className="text-text-primary font-bold uppercase">{userAccess}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-text-secondary">Tingkat Akses Diperlukan:</span>
                    <span className="text-market-green-600 font-bold uppercase">{courseAccessRequired}</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col gap-3 w-full max-w-xs justify-center pt-2">
              {courseAccessRequired === 'Bootcamp' ? (
                <>
                  <Link
                    href="/merchant/dashboard"
                    className="w-full py-3.5 bg-market-green-500 hover:bg-market-green-600 text-white font-geist font-bold text-xs uppercase tracking-wider rounded-xl text-center transition-all duration-300 shadow-xs"
                  >
                    Buka Dashboard Merchant
                  </Link>
                  <Link
                    href="/academy"
                    className="w-full py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-text-secondary hover:text-text-primary font-geist font-bold text-xs uppercase tracking-wider rounded-xl text-center transition-all duration-300"
                  >
                    Cari Kelas Lain
                  </Link>
                </>
              ) : (
                <>
                  {coursePrice > 0 && (
                    <button
                      id="btn-purchase-course"
                      onClick={handlePurchase}
                      disabled={isPending}
                      className="w-full py-3.5 bg-market-green-500 hover:bg-market-green-600 text-white font-geist font-bold text-xs uppercase tracking-wider rounded-xl text-center transition-all duration-300 shadow-xs cursor-pointer"
                    >
                      {isPending ? 'Memproses...' : `Beli Kelas (Rp ${coursePrice.toLocaleString('id-ID')})`}
                    </button>
                  )}
                  <Link
                    href="/affiliate"
                    className="w-full py-3 bg-market-green-50 border border-market-green-100 hover:bg-market-green-100 text-market-green-600 font-geist font-bold text-xs uppercase tracking-wider rounded-xl text-center transition-all duration-300"
                  >
                    Upgrade Keanggotaan
                  </Link>
                  <Link
                    href="/academy"
                    className="w-full py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-text-secondary hover:text-text-primary font-geist font-bold text-xs uppercase tracking-wider rounded-xl text-center transition-all duration-300"
                  >
                    Cari Kelas Lain
                  </Link>
                </>
              )}
            </div>
          </div>
        ) : activeLesson ? (
          <div className="border border-border-subtle bg-surface-dark rounded-2xl p-4">
            {/* Two sources, one set of rules. YouTube modules run through the
                IFrame API with our own controls; self-hosted files use the
                native player. Both enforce 90% completion and the seek clamp. */}
            {activeYouTubeId ? (
              <YouTubePlayer
                key={activeLesson.id}
                videoId={activeYouTubeId}
                resumeSeconds={watchedByLesson[activeLesson.id] || 0}
                locked={!isActiveCompleted}
                onProgress={(seconds, observed) => void persist(seconds, observed)}
                nextLessonTitle={nextLesson?.title}
                onNext={nextLesson ? goToNextLesson : undefined}
              />
            ) : activeLesson.videoUrl ? (
              <FilePlayer
                key={activeLesson.id}
                src={activeLesson.videoUrl}
                resumeSeconds={watchedByLesson[activeLesson.id] || 0}
                locked={!isActiveCompleted}
                onProgress={(seconds, observed) => void persist(seconds, observed)}
                nextLessonTitle={nextLesson?.title}
                onNext={nextLesson ? goToNextLesson : undefined}
              />
            ) : (
              <div className="aspect-video w-full rounded-xl bg-surface-container-lowest border border-border-subtle overflow-hidden relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-geist font-bold text-text-secondary uppercase">
                    Video Not Available
                  </span>
                </div>
              </div>
            )}

            {/* Module name & description */}
            <div className="mt-4 pt-4 border-t border-neutral-shade-50">
              <h2 className="font-sora text-lg sm:text-xl font-bold text-text-primary mb-3">
                {activeLesson.title}
              </h2>
              <p className="text-xs md:text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                {activeLesson.content}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 border border-border-subtle bg-surface-dark rounded-2xl">
            <span className="text-xs text-text-secondary">Pilih materi untuk memulai pembelajaran.</span>
          </div>
        )}
      </div>

      {/* Sidebar navigation list — right side, sticky, fixed width */}
      <div className="w-full lg:w-sidebar-width lg:shrink-0 lg:sticky lg:top-6 border border-border-subtle bg-surface-dark rounded-2xl p-4 space-y-4">
        <h3 className="font-sora text-sm font-bold text-text-primary mb-2">
          Daftar Modul
        </h3>
        <div className="space-y-2">
          {lessons.map((lesson, index) => {
            const isActive = lesson.id === activeId
            const isCompleted = completedSet.has(lesson.id)
            const unlocked = isUnlockedAt(index)

            return (
              <button
                id={`lesson-item-${lesson.id}`}
                key={lesson.id}
                onClick={() => unlocked && setActiveId(lesson.id)}
                disabled={!unlocked}
                title={unlocked ? undefined : 'Selesaikan modul sebelumnya terlebih dahulu.'}
                className={`w-full text-left p-3.5 rounded-xl text-xs transition-all duration-300 flex justify-between items-center border ${
                  isActive
                    ? 'bg-market-green-500 border-market-green-500 text-white font-semibold'
                    : unlocked
                    ? 'bg-neutral-shade-0 border-border-subtle hover:bg-market-green-25 hover:border-market-green-500 text-text-secondary hover:text-text-primary'
                    : 'bg-surface-container/40 border-border-subtle text-text-secondary/40 cursor-not-allowed'
                }`}
              >
                <div className="flex flex-col">
                  <span>
                    {index + 1}. {lesson.title}
                  </span>
                  <span className={`text-[10px] mt-1 ${isActive ? 'text-white/70' : 'text-text-secondary/60'}`}>
                    {Math.round(lesson.duration / 60)} menit
                  </span>
                </div>

                {isCompleted ? (
                  <span
                    className={`w-4 h-4 aspect-square shrink-0 rounded-full flex items-center justify-center border text-[9px] ${
                      isActive ? 'bg-surface-dark border-surface-dark text-primary' : 'bg-primary/20 border-primary text-primary'
                    }`}
                  >
                    ✓
                  </span>
                ) : !unlocked ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 aspect-square shrink-0 opacity-50">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-2.25 0h13.5v10.5H5.25z" />
                  </svg>
                ) : null}
              </button>
            )
          })}
        </div>

        {allCompleted && certificateSerial && (
          <Link
            id="btn-view-certificate"
            href={`/certificate/${certificateSerial}`}
            className="block w-full py-3 bg-primary hover:bg-primary/90 text-black font-geist font-bold text-xs uppercase tracking-wider rounded-xl text-center transition-all"
          >
            🎓 Lihat Sertifikat
          </Link>
        )}
      </div>
    </div>
  )
}
