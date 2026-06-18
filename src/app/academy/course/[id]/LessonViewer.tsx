'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toggleLessonProgress, purchaseCourseAction } from '@/app/actions/lms'

interface Lesson {
  id: string
  title: string
  content: string
  videoUrl: string
  duration: number
  orderIndex: number
}

interface LessonViewerProps {
  courseId: string
  courseTitle: string
  lessons: Lesson[]
  initialActiveLessonId: string
  completedLessonIds: string[]
  isLoggedIn: boolean
  userAccess: string
  courseAccessRequired: string
  purchasedCourseIds?: string[]
}

export default function LessonViewer({
  courseId,
  courseTitle,
  lessons,
  initialActiveLessonId,
  completedLessonIds,
  isLoggedIn,
  userAccess,
  courseAccessRequired,
  purchasedCourseIds = [],
}: LessonViewerProps) {
  const router = useRouter()
  const [activeId, setActiveId] = useState(initialActiveLessonId)
  const [isPending, startTransition] = useTransition()
  
  const activeLesson = lessons.find((l) => l.id === activeId) || lessons[0]
  const completedSet = new Set(completedLessonIds)

  const levels: Record<string, number> = { Gold: 1, Platinum: 2, Diamond: 3 }
  const userRank = levels[userAccess] || 1
  const reqRank = levels[courseAccessRequired] || 1
  const hasPurchased = purchasedCourseIds.includes(courseId)
  const isLocked = userRank < reqRank && !hasPurchased

  let price = 50000
  if (courseId === 'course-brand-1') price = 150000
  else if (courseId === 'course-sourdough-1') price = 100000

  const handlePurchase = () => {
    if (!isLoggedIn) {
      router.push('/auth')
      return
    }
    if (confirm(`Apakah Anda yakin ingin membeli akses kelas "${courseTitle}" seharga Rp ${price.toLocaleString('id-ID')}? Saldo dompet Anda akan didebit.`)) {
      startTransition(async () => {
        const res = await purchaseCourseAction(courseId, price, courseTitle)
        if (res.success) {
          alert('Kelas berhasil dibeli! Akses materi sekarang terbuka.')
          router.refresh()
        } else {
          alert(res.error || 'Gagal membeli kelas.')
        }
      })
    }
  }

  const handleToggleProgress = (lessonId: string, isCompleted: boolean) => {
    if (!isLoggedIn) {
      router.push('/auth')
      return
    }

    startTransition(async () => {
      const res = await toggleLessonProgress(lessonId, isCompleted)
      if (res.success) {
        router.refresh()
      } else {
        alert(res.error || 'Gagal merubah progres')
      }
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      {/* Sidebar navigation list */}
      <div className="border border-border-subtle bg-surface-dark rounded-lg p-5 space-y-4">
        <h3 className="font-sora text-sm font-bold text-text-primary mb-2">
          Daftar Pelajaran
        </h3>
        <div className="space-y-2">
          {lessons.map((lesson) => {
            const isActive = lesson.id === activeId
            const isCompleted = completedSet.has(lesson.id)

            return (
              <button
                id={`lesson-item-${lesson.id}`}
                key={lesson.id}
                onClick={() => setActiveId(lesson.id)}
                className={`w-full text-left p-3.5 rounded text-xs transition-all duration-300 flex justify-between items-center border ${
                  isActive
                    ? 'bg-primary border-primary text-surface-dark font-semibold'
                    : 'bg-surface-container border-border-subtle hover:border-primary/45 text-text-secondary hover:text-text-primary'
                }`}
              >
                <div className="flex flex-col">
                  <span>{lesson.title}</span>
                  <span className={`text-[10px] mt-1 ${isActive ? 'text-surface-dark/70' : 'text-text-secondary/60'}`}>
                    Durasi: {Math.round(lesson.duration / 60)} menit
                  </span>
                </div>

                {isCompleted && (
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center border text-[9px] ${
                    isActive ? 'bg-surface-dark border-surface-dark text-primary' : 'bg-primary/20 border-primary text-primary'
                  }`}>
                    ✓
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Lesson Content & Reader */}
      <div className="lg:col-span-2 space-y-6">
        {isLocked ? (
          <div className="border border-border-subtle bg-surface-dark/40 backdrop-blur-md rounded-lg p-8 md:p-12 text-center flex flex-col items-center justify-center space-y-6 border-primary/20 relative overflow-hidden">
            {/* Ambient gold glow */}
            <div className="btn-primary absolute -top-12 left-1/2 -translate-x-1/2 w-48 bg-primary/10 blur-3xl pointer-events-none" />
            
            {/* Lock Icon */}
            <div className="btn-primary w-16 bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mb-2 shadow-[0_0_20px_rgba(198,169,107,0.1)]">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0V10.5m-2.25 13.5h13.5c.621 0 1.125-.504 1.125-1.125V11.25c0-.621-.504-1.125-1.125-1.125H4.25c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125Z" />
              </svg>
            </div>

            <div className="space-y-3 max-w-md">
              <h3 className="font-sora text-xl font-bold text-text-primary">Materi Eksklusif Terkunci</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Modul ini hanya dapat diakses oleh anggota dengan tingkat <span className="text-primary font-bold">{courseAccessRequired}</span> atau lebih tinggi.
              </p>
            </div>

            {/* Info Box */}
            <div className="w-full max-w-md bg-surface-container/60 border border-border-subtle p-4 rounded-lg flex flex-col gap-2 text-left">
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-secondary">Tingkat Akses Anda:</span>
                <span className="text-text-primary font-bold uppercase">{userAccess}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-secondary">Tingkat Akses Diperlukan:</span>
                <span className="text-primary font-bold uppercase">{courseAccessRequired}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-xs justify-center pt-2">
              <button
                id="btn-purchase-course"
                onClick={handlePurchase}
                disabled={isPending}
                className="w-full py-3.5 bg-primary hover:bg-primary/90 text-black font-geist font-bold text-xs uppercase tracking-wider rounded-xl text-center transition-all duration-300 shadow-md shadow-primary/10 cursor-pointer"
              >
                {isPending ? 'Memproses...' : `Beli Kelas (Rp ${price.toLocaleString('id-ID')})`}
              </button>
              <Link
                href="/affiliate"
                className="w-full py-3 bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary font-geist font-bold text-xs uppercase tracking-wider rounded-xl text-center transition-all duration-300 shadow-sm"
              >
                Upgrade Keanggotaan
              </Link>
              <Link
                href="/academy"
                className="w-full py-3 bg-surface-container hover:bg-surface-container-high border border-border-subtle hover:border-primary/30 text-text-secondary hover:text-text-primary font-geist font-bold text-xs uppercase tracking-wider rounded-xl text-center transition-all duration-300"
              >
                Cari Kelas Lain
              </Link>
            </div>
          </div>
        ) : activeLesson ? (
          <div className="border border-border-subtle bg-surface-dark rounded-lg p-6 md:p-8 space-y-6">
            {/* Video Player */}
            <div className="aspect-video w-full rounded bg-surface-container-lowest border border-border-subtle overflow-hidden relative">
              {activeLesson.videoUrl ? (
                <video
                  id="lesson-video-player"
                  key={activeLesson.id}
                  src={activeLesson.videoUrl}
                  controls
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-geist font-bold text-text-secondary uppercase">
                    Video Not Available
                  </span>
                </div>
              )}
            </div>

            {/* Meta headers */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-5">
              <div>
                <span className="btn-primary text-[9px] text-primary bg-primary/10 border border-primary/25 mb-2 inline-block">
                  Pelajaran {activeLesson.orderIndex}
                </span>
                <h2 className="font-sora text-xl font-bold text-text-primary">
                  {activeLesson.title}
                </h2>
              </div>

              {/* Progress Checkbox */}
              {isLoggedIn ? (
                <label className="flex items-center gap-2 px-4 py-2 bg-surface-container border border-border-subtle rounded hover:border-primary/45 cursor-pointer transition-colors">
                  <input
                    id="lesson-progress-checkbox"
                    type="checkbox"
                    checked={completedSet.has(activeLesson.id)}
                    disabled={isPending}
                    onChange={(e) => handleToggleProgress(activeLesson.id, e.target.checked)}
                    className="accent-primary w-4 h-4 rounded cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-text-primary">
                    Tandai Selesai
                  </span>
                </label>
              ) : (
                <button
                  id="btn-login-to-track"
                  onClick={() => router.push('/auth')}
                  className="btn-primary text-xs"
                >
                  Masuk untuk Simpan Progres
                </button>
              )}
            </div>

            {/* Lesson Content Text */}
            <div className="space-y-4">
              <span className="block text-[10px] font-geist font-bold text-text-secondary uppercase tracking-wider">
                Materi Pembahasan
              </span>
              <p className="text-xs md:text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                {activeLesson.content}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 border border-border-subtle bg-surface-dark rounded-lg">
            <span className="text-xs text-text-secondary">Pilih materi untuk memulai pembelajaran.</span>
          </div>
        )}
      </div>
    </div>
  )
}
