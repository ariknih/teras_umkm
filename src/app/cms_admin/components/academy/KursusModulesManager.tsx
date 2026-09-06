'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { GripVertical, Trash2, Loader2 } from 'lucide-react'
import { fetchYouTubeDurationAction } from '@/app/actions/admin'
import { extractYouTubeId } from '@/lib/lms-rules'
import { getYouTubeDuration } from '@/lib/youtube-client'

/** Reassigns 1..N orderIndex by array position — keeps the staged list gap-free. */
function normalizeOrder(list: any[]) {
  return list.map((l, i) => ({ ...l, orderIndex: i + 1 }))
}

/**
 * Module (lesson) editor for a single Kursus, entirely staged: add, edit,
 * delete, and reorder (▲▼ or drag) all just mutate the `lessons` array passed
 * in via `onChange` — nothing is persisted here. The parent (SuntingKursusView)
 * diffs the staged list against the last-saved one and applies it when
 * Simpan Perubahan is pressed, alongside the course-field update.
 *
 * Takes `showToast` from the parent rather than owning its own Toast, so a
 * course-field save and a module edit never render two overlapping toasts.
 */
export default function KursusModulesManager({
  lessons,
  onChange,
  showToast,
}: {
  lessons: any[]
  onChange: (lessons: any[]) => void
  showToast: (text: string, type?: 'success' | 'error') => void
}) {
  const [lessonModal, setLessonModal] = useState<{ open: boolean; mode: 'add' | 'edit'; data?: any }>({ open: false, mode: 'add' })
  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonContent, setLessonContent] = useState('')
  const [lessonVideo, setLessonVideo] = useState('')
  const [lessonType, setLessonType] = useState('')
  const [lessonDuration, setLessonDuration] = useState('0')
  const [lessonOrderIndex, setLessonOrderIndex] = useState('1')
  const [lessonVideoError, setLessonVideoError] = useState<string | null>(null)
  const [isUploadingVideo, setIsUploadingVideo] = useState(false)
  const [durationAutoDetected, setDurationAutoDetected] = useState(false)
  const [isDetectingDuration, setIsDetectingDuration] = useState(false)
  const [lessonDurationError, setLessonDurationError] = useState<string | null>(null)
  // Which content-source control is showing. Only relevant while no video is
  // attached yet — once one is, the tab switch is replaced by the preview.
  const [videoSourceTab, setVideoSourceTab] = useState<'upload' | 'youtube'>('upload')
  // Kept separate from lessonVideo so a not-yet-valid YouTube URL can be shown
  // (with an error) without being treated as attached content.
  const [youtubeUrlDraft, setYoutubeUrlDraft] = useState('')

  const [dragIndex, setDragIndex] = useState<number | null>(null)

  // Standardized destructive-action confirmation — same shape as
  // DiscussionForum.tsx / CommunityDetailClient.tsx, so delete confirmations
  // look and behave identically across the CMS.
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    confirmText: string
    variant?: 'danger' | 'success' | 'warning'
    onConfirm: () => void
  }>({ isOpen: false, title: '', message: '', confirmText: 'Ya, Hapus', variant: 'danger', onConfirm: () => {} })

  const resetLessonForm = () => {
    setLessonTitle('')
    setLessonContent('')
    setLessonVideo('')
    setLessonType('')
    setLessonDuration('0')
    setLessonOrderIndex('1')
    setDurationAutoDetected(false)
    setLessonDurationError(null)
    setLessonVideoError(null)
    setVideoSourceTab('upload')
    setYoutubeUrlDraft('')
  }

  const openAddLesson = () => {
    resetLessonForm()
    // Always appended at the end — order only ever changes via the ▲▼ arrows
    // or drag in the list, never by typing a number here.
    setLessonOrderIndex(String(lessons.length + 1))
    setLessonModal({ open: true, mode: 'add' })
  }

  const openEditLesson = (lesson: any) => {
    setLessonTitle(lesson.title)
    setLessonContent(lesson.content || '')
    setLessonVideo(lesson.videoUrl || '')
    setLessonType(lesson.type || 'VIDEO')
    setLessonDuration(String(lesson.duration || 0))
    setLessonOrderIndex(String(lesson.orderIndex || 1))
    setDurationAutoDetected(false)
    setLessonDurationError(null)
    setLessonVideoError(null)
    setVideoSourceTab('upload')
    setYoutubeUrlDraft('')
    setLessonModal({ open: true, mode: 'edit', data: lesson })
  }

  // A YouTube link is only accepted as attached content once it resolves to a
  // real video id — an in-progress or invalid paste stays a draft, not content.
  const handleYoutubeUrlChange = (value: string) => {
    setYoutubeUrlDraft(value)
    setLessonVideoError(null)
  }

  const handleYoutubeUrlCommit = async () => {
    const trimmed = youtubeUrlDraft.trim()
    if (!trimmed) return
    if (!extractYouTubeId(trimmed)) {
      setLessonVideoError('Tautan tidak dikenali sebagai video YouTube.')
      return
    }
    setLessonVideo(trimmed)
    await detectYouTubeDuration(trimmed)
  }

  const handleRemoveVideo = () => {
    setLessonVideo('')
    setLessonVideoError(null)
    setLessonDuration('0')
    setDurationAutoDetected(false)
    setLessonDurationError(null)
    setVideoSourceTab('upload')
    setYoutubeUrlDraft('')
  }

  const canSubmitLesson =
    lessonTitle.trim().length > 0 &&
    lessonContent.trim().length > 0 &&
    !!lessonType &&
    !!lessonVideo &&
    !isUploadingVideo &&
    !isDetectingDuration

  const handleLessonSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const input = {
      title: lessonTitle,
      content: lessonContent,
      videoUrl: lessonVideo,
      type: lessonType,
      duration: Number(lessonDuration),
      orderIndex: Number(lessonOrderIndex),
    }

    if (lessonModal.mode === 'add') {
      const newLesson = { id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, ...input }
      onChange(normalizeOrder([...lessons, newLesson]))
      showToast('Modul ditambahkan ke draft. Klik "Simpan Perubahan" untuk menerapkan.')
    } else {
      const id = lessonModal.data.id
      onChange(lessons.map((l) => (l.id === id ? { ...l, ...input } : l)))
      showToast('Perubahan modul disimpan ke draft. Klik "Simpan Perubahan" untuk menerapkan.')
    }
    setLessonModal({ open: false, mode: 'add' })
    resetLessonForm()
  }

  const handleDeleteLesson = (lesson: any) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Modul',
      message: `Modul "${lesson.title}" akan dihapus dari draft. Progres belajar peserta pada modul ini akan ikut terhapus permanen begitu Anda menekan "Simpan Perubahan".`,
      confirmText: 'Ya, Hapus Modul',
      variant: 'danger',
      onConfirm: () => {
        onChange(normalizeOrder(lessons.filter((l) => l.id !== lesson.id)))
        showToast('Modul dihapus dari draft. Klik "Simpan Perubahan" untuk menerapkan.')
      },
    })
  }

  const handleShiftLessonOrder = (lesson: any, direction: 'up' | 'down') => {
    const sorted = [...lessons].sort((a: any, b: any) => a.orderIndex - b.orderIndex)
    const idx = sorted.findIndex((l: any) => l.id === lesson.id)
    if (idx === -1) return
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= sorted.length) return

    const reordered = [...sorted]
    ;[reordered[idx], reordered[targetIdx]] = [reordered[targetIdx], reordered[idx]]
    onChange(normalizeOrder(reordered))
  }

  // Native HTML5 drag-and-drop — no library needed for a simple single-list
  // reorder. Desktop-only in practice (touch browsers don't fire these
  // events without extra plumbing); the ▲▼ buttons remain the accessible,
  // touch-friendly way to reorder.
  const handleDragStart = (idx: number) => setDragIndex(idx)
  const handleDragOver = (e: React.DragEvent) => e.preventDefault()
  const handleDrop = (idx: number) => {
    if (dragIndex === null || dragIndex === idx) { setDragIndex(null); return }
    const sorted = [...lessons].sort((a: any, b: any) => a.orderIndex - b.orderIndex)
    const [moved] = sorted.splice(dragIndex, 1)
    sorted.splice(idx, 0, moved)
    onChange(normalizeOrder(sorted))
    setDragIndex(null)
  }

  // Duration is never hand-typed for a VIDEO module — it is always read from
  // the media itself, because the 90% completion rule divides by this number
  // and a typed guess drifts from the real file.
  //
  // Two layers for YouTube: the official IFrame API first — the same source
  // the player itself uses, so if this can answer, playback will too — with a
  // page-scrape fallback for the rare case embedding is blocked or the API
  // script itself is blocked (an ad blocker, a restrictive network).
  const detectYouTubeDuration = async (url: string) => {
    const id = extractYouTubeId(url)
    if (!id) return
    setIsDetectingDuration(true)
    setLessonDurationError(null)
    try {
      const viaApi = await getYouTubeDuration(id)
      if (viaApi > 0) {
        setLessonDuration(String(viaApi))
        setDurationAutoDetected(true)
        return
      }
      const viaScrape = await fetchYouTubeDurationAction(url)
      if (viaScrape.success && viaScrape.duration) {
        setLessonDuration(String(viaScrape.duration))
        setDurationAutoDetected(true)
      } else {
        setLessonDurationError(viaScrape.error || 'Gagal mendeteksi durasi. Coba lagi atau ganti tautan.')
      }
    } finally {
      setIsDetectingDuration(false)
    }
  }

  // Read the real length off a video file, whether it is a File about to be
  // uploaded or a URL already stored (used by the redetect button).
  const readVideoDuration = (source: File | string): Promise<number> =>
    new Promise((resolve) => {
      const isFile = source instanceof File
      const src = isFile ? URL.createObjectURL(source) : source
      const probe = document.createElement('video')
      probe.preload = 'metadata'
      const settle = (value: number) => {
        if (isFile) URL.revokeObjectURL(src)
        resolve(value)
      }
      probe.onloadedmetadata = () => settle(Number.isFinite(probe.duration) ? Math.round(probe.duration) : 0)
      probe.onerror = () => settle(0)
      probe.src = src
    })

  // Lets an admin fix a wrong or missing duration without hand-typing it —
  // re-runs whichever detection method matches the stored video.
  const redetectDuration = async () => {
    if (!lessonVideo) return
    if (extractYouTubeId(lessonVideo)) {
      await detectYouTubeDuration(lessonVideo)
      return
    }
    setIsDetectingDuration(true)
    setLessonDurationError(null)
    try {
      const detected = await readVideoDuration(lessonVideo)
      if (detected > 0) {
        setLessonDuration(String(detected))
        setDurationAutoDetected(true)
      } else {
        setLessonDurationError('Gagal membaca durasi dari file video.')
      }
    } finally {
      setIsDetectingDuration(false)
    }
  }

  const handleVideoUpload = async (file: File) => {
    setLessonVideoError(null)
    if (file.size > 500 * 1024 * 1024) {
      setLessonVideoError(`⚠️ Ukuran file video (${(file.size / 1024 / 1024).toFixed(1)} MB) terlalu besar (maksimal 500 MB).`)
      return
    }

    try {
      setIsUploadingVideo(true)

      const detected = await readVideoDuration(file)
      if (detected > 0) {
        setLessonDuration(String(detected))
        setDurationAutoDetected(true)
      }

      try {
        const presignedRes = await fetch('/api/upload/presigned', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, fileType: file.type || 'video/mp4', folder: 'courses' })
        })

        if (presignedRes.ok) {
          const presignedData = await presignedRes.json()
          if (presignedData.uploadUrl && presignedData.publicUrl) {
            const s3Success = await new Promise<boolean>((resolve) => {
              const xhr = new XMLHttpRequest()
              xhr.open('PUT', presignedData.uploadUrl, true)
              xhr.setRequestHeader('Content-Type', file.type || 'video/mp4')
              xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300)
              xhr.onerror = () => resolve(false)
              xhr.ontimeout = () => resolve(false)
              xhr.send(file)
            })

            if (s3Success) {
              setLessonVideo(presignedData.publicUrl)
              return
            }
          }
        }
      } catch (s3Err) {
        console.warn('Presigned upload failed, attempting fallback server upload:', s3Err)
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'courses')
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()

      if (res.ok && data.url) {
        setLessonVideo(data.url)
      } else if (file.size <= 3.5 * 1024 * 1024) {
        const reader = new FileReader()
        reader.onload = () => setLessonVideo(reader.result as string)
        reader.readAsDataURL(file)
      } else {
        setLessonVideoError(data.error || '⚠️ Gagal mengunggah file. Silakan periksa koneksi atau gunakan Tautan URL Video.')
      }
    } catch {
      setLessonVideoError('⚠️ Gagal mengunggah file. Silakan periksa koneksi atau gunakan Tautan URL Video.')
    } finally {
      setIsUploadingVideo(false)
    }
  }

  const sortedLessons = [...lessons].sort((a: any, b: any) => a.orderIndex - b.orderIndex)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h5 className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">
          Silabus / Daftar Modul ({sortedLessons.length} Modul)
        </h5>
        <button
          onClick={openAddLesson}
          className="px-4 py-1.5 bg-[#0F5132]/10 hover:bg-[#0F5132]/20 text-[#0F5132] border border-[#0F5132]/20 font-bold text-[10px] uppercase tracking-widest rounded transition-all cursor-pointer"
        >
          + Tambah Modul
        </button>
      </div>

      {sortedLessons.length > 0 ? (
        <div className="space-y-2">
          {sortedLessons.map((lesson: any, idx: number) => (
            <div
              key={lesson.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(idx)}
              className={`flex justify-between items-center p-3.5 bg-white border rounded-[var(--radius-brand)] transition-colors shadow-sm ${
                dragIndex === idx ? 'border-[#0F5132] opacity-50' : 'border-[#e2e8f0] hover:border-[#cbd5e1]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500" title="Seret untuk mengurutkan ulang">
                  <GripVertical className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] font-bold text-[#0F5132] bg-[#E8F5E9] px-1.5 py-0.2 border border-[#0F5132]/10 rounded">Urutan {lesson.orderIndex}</span>
                    <span className="text-xs font-bold text-slate-800">{lesson.title}</span>
                  </div>
                  <p className="text-[10px] text-[#64748b] mt-1.5 line-clamp-1">{lesson.content}</p>
                  <div className="flex items-center gap-3.5 mt-1.5 text-[10px] text-[#64748b] font-mono">
                    <span>Durasi: {Math.round(lesson.duration / 60)} menit</span>
                    <span>•</span>
                    <span className="truncate max-w-[250px]" title={lesson.videoUrl}>Video: {lesson.videoUrl || 'Tidak ada video'}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1.5 flex-shrink-0 items-center">
                <button type="button" disabled={idx === 0} onClick={() => handleShiftLessonOrder(lesson, 'up')} title="Geser Urutan Ke Atas" className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-bold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors">▲</button>
                <button type="button" disabled={idx === sortedLessons.length - 1} onClick={() => handleShiftLessonOrder(lesson, 'down')} title="Geser Urutan Ke Bawah" className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-bold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors">▼</button>
                <button onClick={() => openEditLesson(lesson)} className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded text-[10px] uppercase font-bold tracking-wider cursor-pointer border border-[#e2e8f0]">Edit</button>
                <button onClick={() => handleDeleteLesson(lesson)} className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded text-[10px] uppercase font-bold tracking-wider cursor-pointer border border-red-100">Hapus</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[#64748b] italic p-4 text-center">Kursus ini belum memiliki modul. Silakan klik "+ Tambah Modul" di atas.</p>
      )}

      {lessonModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#0F5132]/25 rounded-[var(--radius-brand)] max-w-md w-full p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-sora text-sm font-bold text-[#0F5132] uppercase tracking-wider">{lessonModal.mode === 'add' ? 'Tambah Modul Baru' : 'Edit Modul'}</h3>
              <button onClick={() => setLessonModal({ open: false, mode: 'add' })} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleLessonSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Nama Modul</label>
                <input type="text" required value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} placeholder="e.g. 1. Dasar Pembuatan Brand" className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2.5 text-slate-800 outline-none focus:border-[#0F5132] focus:ring-1 focus:ring-[#0F5132]" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Deskripsi Modul</label>
                <textarea required rows={4} value={lessonContent} onChange={(e) => setLessonContent(e.target.value)} placeholder="Tulis narasi pembelajaran materi secara rinci..." className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2.5 text-slate-800 outline-none focus:border-[#0F5132] focus:ring-1 focus:ring-[#0F5132]" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">No. Urut</label>
                  <input
                    type="number"
                    readOnly
                    disabled
                    value={lessonOrderIndex}
                    title="Otomatis — ubah urutan lewat tombol ▲▼ atau seret pada daftar modul."
                    className="w-full bg-slate-50 border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2 text-slate-500 outline-none cursor-not-allowed"
                  />
                  <div className="text-[9px] text-slate-400 mt-1">Otomatis — ubah lewat ▲▼ atau seret di daftar</div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Tipe Modul</label>
                  <select required value={lessonType} onChange={(e) => setLessonType(e.target.value)} className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3 py-2 text-slate-800 outline-none focus:border-[#0F5132] focus:ring-1 focus:ring-[#0F5132]">
                    <option value="" disabled>Pilih tipe modul</option>
                    <option value="VIDEO">Video</option>
                  </select>
                </div>
              </div>

              {lessonType === 'VIDEO' && (
                <div className="space-y-3 p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-xl">
                  <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Konten Video</label>

                  {lessonVideo ? (
                    // Content already attached: only the preview and Hapus are
                    // shown, on purpose — the source controls only reappear
                    // after Hapus, so a second video can never be attached
                    // alongside the first by mistake.
                    <div className="space-y-2.5">
                      {extractYouTubeId(lessonVideo) ? (
                        <div className="rounded-lg overflow-hidden border border-emerald-200 bg-black relative aspect-video">
                          <img
                            src={`https://img.youtube.com/vi/${extractYouTubeId(lessonVideo)}/hqdefault.jpg`}
                            alt="Pratinjau YouTube"
                            className="w-full h-full object-cover opacity-90"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-11 h-11 rounded-full bg-red-600 flex items-center justify-center text-white text-lg shadow-lg">▶</div>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-lg overflow-hidden border border-emerald-200 bg-black">
                          <video src={lessonVideo} controls preload="metadata" className="w-full max-h-[180px] object-contain" />
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-emerald-700 font-bold">
                          ✓ {extractYouTubeId(lessonVideo) ? 'Tautan YouTube Terpasang' : 'Video Berhasil Diunggah'}
                        </span>
                        <button type="button" onClick={handleRemoveVideo} className="text-[9px] font-semibold text-red-500 hover:text-red-700 transition-colors cursor-pointer">✕ Hapus</button>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60">
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Durasi (Detik)</label>
                          {durationAutoDetected && <span className="text-[9px] font-bold text-emerald-600">AUTO</span>}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            readOnly
                            disabled
                            value={lessonDuration}
                            title="Durasi diambil otomatis dari video — tidak bisa diketik manual."
                            className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2 text-slate-500 outline-none cursor-not-allowed"
                          />
                          <button
                            type="button"
                            onClick={redetectDuration}
                            disabled={isDetectingDuration}
                            title="Deteksi ulang durasi dari video"
                            className="shrink-0 px-2.5 py-2 bg-[#0F5132]/10 hover:bg-[#0F5132]/20 text-[#0F5132] rounded-[var(--radius-brand)] text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                          >
                            {isDetectingDuration ? '…' : '↻'}
                          </button>
                        </div>
                        <div className="text-[9px] text-slate-400 mt-1">
                          ≈ {Math.round((Number(lessonDuration) || 0) / 60)} menit · otomatis dari video
                        </div>
                        {lessonDurationError && <div className="text-[9px] text-red-500 mt-1">{lessonDurationError}</div>}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setVideoSourceTab('upload')}
                          className={`flex-1 px-3.5 py-2 rounded-lg font-extrabold text-[11px] transition-all cursor-pointer border-none ${
                            videoSourceTab === 'upload' ? 'bg-[#006E24] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 bg-transparent'
                          }`}
                        >
                          Upload
                        </button>
                        <button
                          type="button"
                          onClick={() => setVideoSourceTab('youtube')}
                          className={`flex-1 px-3.5 py-2 rounded-lg font-extrabold text-[11px] transition-all cursor-pointer border-none ${
                            videoSourceTab === 'youtube' ? 'bg-[#006E24] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 bg-transparent'
                          }`}
                        >
                          URL YouTube
                        </button>
                      </div>

                      {videoSourceTab === 'upload' ? (
                        <div>
                          <input
                            type="file"
                            accept="video/*"
                            disabled={isUploadingVideo}
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleVideoUpload(file)
                            }}
                            className="w-full text-xs text-slate-500 file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-[#0F5132]/10 file:text-[#0F5132] hover:file:bg-[#0F5132]/20 cursor-pointer disabled:opacity-50"
                          />
                          {isUploadingVideo && <div className="text-[10px] text-slate-400 mt-2">Mengunggah &amp; mendeteksi durasi…</div>}
                        </div>
                      ) : (
                        <div>
                          <input
                            type="url"
                            value={youtubeUrlDraft}
                            onChange={(e) => handleYoutubeUrlChange(e.target.value)}
                            onBlur={handleYoutubeUrlCommit}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3 py-2 text-slate-800 text-xs outline-none focus:border-[#0F5132]"
                          />
                          {isDetectingDuration && <div className="text-[10px] text-slate-400 mt-2">Mendeteksi durasi…</div>}
                        </div>
                      )}
                      {lessonVideoError && <div className="p-2.5 mt-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-[11px] font-medium leading-relaxed">{lessonVideoError}</div>}
                    </>
                  )}
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setLessonModal({ open: false, mode: 'add' })} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-850 font-bold rounded-[var(--radius-brand)] uppercase tracking-wider transition-colors cursor-pointer">Batal</button>
                <button type="submit" disabled={!canSubmitLesson} className="flex-1 py-2.5 bg-primary hover:bg-[#259a3f] text-white font-bold rounded-[var(--radius-brand)] uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                  Simpan ke Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-gray-100"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto bg-red-100 text-red-600">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-sora text-base font-bold text-gray-900">{confirmModal.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{confirmModal.message}</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="flex-1 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmModal.onConfirm()
                  setConfirmModal((prev) => ({ ...prev, isOpen: false }))
                }}
                className="flex-1 py-2.5 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer bg-red-600 hover:bg-red-700"
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
