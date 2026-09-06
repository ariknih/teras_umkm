'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Trash2, Check, AlertCircle, Loader2, Megaphone } from 'lucide-react'
import { updateCourseAction, setCoursePublishedAction, addLessonAction, updateLessonAction, deleteLessonAction } from '@/app/actions/admin'
import { cropAndEncodeImage } from '@/lib/image-processing'
import { PROTECTED_CERTIFICATE_TEMPLATE_NAME } from '@/lib/lms-rules'
import CertificateSheet from '@/components/CertificateSheet'
import { useToast, Toast } from '../Toast'
import KursusModulesManager from './KursusModulesManager'

const COVER_IMAGE_RATIO = 16 / 9
const COVER_IMAGE_OUTPUT_WIDTH = 1280
const COVER_IMAGE_MAX_BYTES = 2 * 1024 * 1024

type ConfirmVariant = 'danger' | 'success' | 'warning' | 'info'

interface ConfirmState {
  isOpen: boolean
  title: string
  message: string
  confirmText: string
  cancelText: string
  variant: ConfirmVariant
  onConfirm: () => Promise<void> | void
}

const CLOSED_CONFIRM: ConfirmState = {
  isOpen: false,
  title: '',
  message: '',
  confirmText: 'Ya',
  cancelText: 'Batal',
  variant: 'danger',
  onConfirm: () => {},
}

const VARIANT_STYLES: Record<ConfirmVariant, { icon: string; iconBg: string; confirmBg: string }> = {
  danger: { icon: 'danger', iconBg: 'bg-red-100 text-red-600', confirmBg: 'bg-red-600 hover:bg-red-700' },
  success: { icon: 'success', iconBg: 'bg-emerald-100 text-emerald-600', confirmBg: 'bg-[#0F5132] hover:bg-emerald-900' },
  warning: { icon: 'warning', iconBg: 'bg-amber-100 text-amber-600', confirmBg: 'bg-amber-600 hover:bg-amber-700' },
  info: { icon: 'info', iconBg: 'bg-bank-blue-100 text-bank-blue-600', confirmBg: 'bg-bank-blue-600 hover:bg-bank-blue-700' },
}

/** Comparable signature for a lesson list — used to detect staged changes. */
function lessonsSignature(list: any[]) {
  return JSON.stringify(
    [...list]
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((l) => ({
        id: l.id,
        title: l.title,
        content: l.content,
        videoUrl: l.videoUrl,
        type: l.type || 'VIDEO',
        duration: l.duration,
        orderIndex: l.orderIndex,
      }))
  )
}

/**
 * The Sunting (edit) view for one Kursus — the course's own fields, plus full
 * module management. Every module change (add/edit/delete/reorder) is staged
 * locally in `lessons` — nothing touches the server until Simpan Perubahan is
 * pressed, at which point the staged list is diffed against the last-saved
 * one and applied as a batch of create/update/delete calls alongside the
 * course-field update.
 */
export default function SuntingKursusView({ course, templates }: { course: any; templates: any[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { toast, showToast } = useToast()

  // The last-saved values. Comparing the live fields against this is what
  // decides whether there's anything to save or to warn about losing.
  const [saved, setSaved] = useState({
    title: course.title,
    description: course.description,
    coverImage: course.coverImage || '',
    accessRequired: course.accessRequired || 'Gold',
    price: String(course.price ?? 0),
    certificateTemplateId: course.certificateTemplateId || '',
  })

  const [title, setTitle] = useState(saved.title)
  const [description, setDescription] = useState(saved.description)
  const [coverImage, setCoverImage] = useState(saved.coverImage)
  const [accessRequired, setAccessRequired] = useState(saved.accessRequired)
  const [price, setPrice] = useState(saved.price)
  const [certificateTemplateId, setCertificateTemplateId] = useState(saved.certificateTemplateId)
  const [imageError, setImageError] = useState<string | null>(null)
  const [isProcessingCover, setIsProcessingCover] = useState(false)

  // Standalone from the staged fields above — see handleTogglePublish.
  const [published, setPublished] = useState<boolean>(course.isPublished ?? true)

  // Staged module list — see file doc comment above.
  const [lessons, setLessons] = useState<any[]>(course.lessons || [])
  const [savedLessons, setSavedLessons] = useState<any[]>(course.lessons || [])
  const lessonsDirty = lessonsSignature(lessons) !== lessonsSignature(savedLessons)

  const effectiveTemplate = certificateTemplateId
    ? templates.find((t: any) => t.id === certificateTemplateId) || null
    : templates.find((t: any) => t.name === PROTECTED_CERTIFICATE_TEMPLATE_NAME) || null

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setImageError(null)
    if (!file) return
    if (file.size > COVER_IMAGE_MAX_BYTES) {
      setImageError(`⚠️ Ukuran file terlalu besar (${(file.size / 1024 / 1024).toFixed(1)} MB)! Maksimal ukuran file cover adalah 15 MB.`)
      return
    }
    setIsProcessingCover(true)
    try {
      const result = await cropAndEncodeImage(file, COVER_IMAGE_RATIO, COVER_IMAGE_OUTPUT_WIDTH)
      setCoverImage(result)
    } catch (err: any) {
      setImageError(err.message || 'Gagal memproses gambar.')
    } finally {
      setIsProcessingCover(false)
    }
  }

  const isDirty =
    title !== saved.title ||
    description !== saved.description ||
    coverImage !== saved.coverImage ||
    accessRequired !== saved.accessRequired ||
    price !== saved.price ||
    certificateTemplateId !== saved.certificateTemplateId ||
    lessonsDirty

  const [confirmModal, setConfirmModal] = useState<ConfirmState>(CLOSED_CONFIRM)
  const closeConfirm = () => setConfirmModal((prev) => ({ ...prev, isOpen: false }))

  // Tab close / refresh / typing a new URL: the browser's own native prompt.
  // It cannot be restyled — that's a deliberate browser security restriction
  // so a page can never fake a trustworthy-looking "are you sure" dialog.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirty) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  // Diffs the staged `lessons` list against the last-saved one and applies it
  // as create/update/delete calls. Returns the committed list (temp ids
  // replaced with the real ones the server assigned) so local state can be
  // updated without waiting on a full page refresh.
  const commitLessons = async (): Promise<{ success: boolean; lessons: any[] }> => {
    const originalById = new Map(savedLessons.map((l: any) => [l.id, l]))
    const currentIds = new Set(lessons.map((l: any) => l.id))

    for (const l of savedLessons) {
      if (!currentIds.has(l.id)) {
        const res = await deleteLessonAction(l.id, course.id)
        if (!res.success) return { success: false, lessons: [] }
      }
    }

    const finalLessons: any[] = []
    for (const l of lessons) {
      const input = {
        title: l.title,
        content: l.content,
        videoUrl: l.videoUrl,
        type: l.type || 'VIDEO',
        duration: l.duration,
        orderIndex: l.orderIndex,
      }
      if (String(l.id).startsWith('temp-')) {
        const res = await addLessonAction(course.id, input)
        if (!res.success || !res.lesson) return { success: false, lessons: [] }
        finalLessons.push(res.lesson)
      } else {
        const orig = originalById.get(l.id)
        const changed =
          !orig ||
          orig.title !== l.title ||
          orig.content !== l.content ||
          orig.videoUrl !== l.videoUrl ||
          (orig.type || 'VIDEO') !== (l.type || 'VIDEO') ||
          orig.duration !== l.duration ||
          orig.orderIndex !== l.orderIndex
        if (changed) {
          const res = await updateLessonAction(l.id, course.id, input)
          if (!res.success) return { success: false, lessons: [] }
        }
        finalLessons.push({ ...l })
      }
    }

    return { success: true, lessons: finalLessons.sort((a, b) => a.orderIndex - b.orderIndex) }
  }

  const openSaveConfirm = () => {
    if (!isDirty || isPending || isProcessingCover || imageError) return
    setConfirmModal({
      isOpen: true,
      title: 'Simpan Perubahan?',
      message: 'Perubahan pada kursus ini — termasuk modul yang ditambah, disunting, dihapus, atau diurutkan ulang — akan langsung berlaku untuk peserta setelah disimpan.',
      confirmText: 'Ya, Simpan Perubahan',
      cancelText: 'Batal',
      variant: 'success',
      onConfirm: async () => {
        const res = await updateCourseAction(course.id, title, description, coverImage, accessRequired, Number(price) || 0, certificateTemplateId || null)
        if (!res.success) {
          showToast(res.error || 'Gagal memperbarui kursus. Periksa kembali data yang diisi.', 'error')
          return
        }
        const lessonRes = await commitLessons()
        if (!lessonRes.success) {
          showToast('Kursus tersimpan, tetapi sebagian perubahan modul gagal disimpan. Silakan periksa kembali daftar modul.', 'error')
          return
        }
        setSaved({ title, description, coverImage, accessRequired, price, certificateTemplateId })
        setLessons(lessonRes.lessons)
        setSavedLessons(lessonRes.lessons)
        showToast('Kursus berhasil diperbarui.')
        router.refresh()
      },
    })
  }

  // Immediate, standalone toggle — deliberately not staged with isDirty/Simpan
  // Perubahan, since pulling a course from the market reads as a kill switch,
  // not a form edit an admin might cancel out of.
  const handleTogglePublish = () => {
    const next = !published
    setConfirmModal({
      isOpen: true,
      title: next ? 'Pasarkan Kursus Ini?' : 'Tarik Kursus dari Pasar?',
      message: next
        ? 'Kursus ini akan langsung muncul dan dapat diakses di Saloka Academy oleh setiap pengguna yang memenuhi syarat aksesnya.'
        : 'Kursus ini akan langsung disembunyikan dari Saloka Academy. Pengguna yang membuka tautan langsung akan melihat pesan tidak tersedia dan diarahkan kembali ke Akademi. Superadmin tetap dapat melihatnya.',
      confirmText: next ? 'Ya, Pasarkan' : 'Ya, Tarik dari Pasar',
      cancelText: 'Batal',
      variant: 'info',
      onConfirm: async () => {
        const res = await setCoursePublishedAction(course.id, next)
        if (!res.success) {
          showToast(res.error || 'Gagal mengubah status pemasaran kursus.', 'error')
          return
        }
        setPublished(next)
        showToast(next ? 'Kursus berhasil dipasarkan.' : 'Kursus berhasil ditarik dari pasar.')
        router.refresh()
      },
    })
  }

  // ponytail: only guards this page's own links (back link, Kelola Template)
  // and the browser's tab-close/refresh dialog. Leaving via the CMS sidebar
  // bypasses this entirely — the sidebar lives in the shared admin layout,
  // outside this component, and catching it too means adding a dirty-state
  // guard to that shared shell (affects navigation on all ~25 admin menus,
  // not just this one). Deferred until the pattern is ready to leave
  // Academy's testbed. Upgrade path: lift `isDirty` into a context provided
  // by the CMS layout, and have the sidebar's link/nav component check it
  // before navigating.
  const guardedNavigate = (e: React.MouseEvent, href: string) => {
    if (!isDirty) return
    e.preventDefault()
    setConfirmModal({
      isOpen: true,
      title: 'Perubahan Belum Disimpan',
      message: 'Anda memiliki perubahan yang belum disimpan pada kursus ini. Jika keluar sekarang, perubahan tersebut akan hilang.',
      confirmText: 'Ya, Tinggalkan Halaman',
      cancelText: 'Tetap di Halaman',
      variant: 'warning',
      onConfirm: () => {
        router.push(href)
      },
    })
  }

  return (
    <div className="space-y-6 pb-24">
      <Toast toast={toast} />

      <Link
        href="/cms_admin/academy"
        onClick={(e) => guardedNavigate(e, '/cms_admin/academy')}
        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#64748b] hover:text-[#0F5132] uppercase tracking-wider transition-colors"
      >
        ← Kembali ke Daftar Kursus
      </Link>

      <div className="bg-white border border-bank-blue-200 rounded-[var(--radius-brand)] p-4 shadow-sm flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-bank-blue-600 shrink-0" />
            <span className="text-xs font-bold text-slate-800">Pasarkan Kursus</span>
            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${published ? 'bg-bank-blue-50 text-bank-blue-700 border border-bank-blue-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
              {published ? 'Dipasarkan' : 'Ditarik dari Pasar'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Jika ditarik, kursus langsung hilang dari Saloka Academy — tautan langsung akan menampilkan pesan tidak tersedia. Berlaku seketika, di luar Simpan Perubahan.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={published}
          onClick={handleTogglePublish}
          disabled={isPending}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${published ? 'bg-bank-blue-600' : 'bg-slate-300'}`}
        >
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${published ? 'translate-x-5' : 'translate-x-1'}`} />
        </button>
      </div>

      <div className="bg-white border border-[#e2e8f0] rounded-[var(--radius-brand)] p-6 shadow-sm">
        <h3 className="font-sora text-xs font-bold text-[#0F5132] uppercase tracking-wider mb-4">Sunting Kursus</h3>

        <form onSubmit={(e) => { e.preventDefault(); openSaveConfirm() }} className="space-y-4 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Nama Kursus</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2.5 text-slate-800 outline-none focus:border-[#0F5132] focus:ring-1 focus:ring-[#0F5132]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Deskripsi Kursus</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2.5 text-slate-800 outline-none focus:border-[#0F5132] focus:ring-1 focus:ring-[#0F5132]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Harga Kursus (Rp)</label>
              <span className="text-[10px] font-semibold text-slate-400">0 = tidak dijual satuan</span>
            </div>
            <input
              type="number"
              min={0}
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2.5 text-slate-800 outline-none focus:border-[#0F5132] focus:ring-1 focus:ring-[#0F5132]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Akses Keanggotaan</label>
            <select
              value={accessRequired}
              onChange={(e) => setAccessRequired(e.target.value)}
              className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2 text-slate-800 outline-none focus:border-[#0F5132] focus:ring-1 focus:ring-[#0F5132]"
            >
              <option value="Gold">Gold</option>
              <option value="Platinum">Platinum</option>
              <option value="Diamond">Diamond</option>
              <option value="Bootcamp">Bootcamp</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Cover Image</label>
              <span className="text-[10px] font-semibold text-emerald-600">Maks. 2 MB</span>
            </div>
            <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">
              Gambar akan otomatis dipotong & disesuaikan ke rasio 16:9, lalu disimpan sebagai WebP agar hemat ruang.
            </p>
            <input
              type="file"
              accept="image/*"
              disabled={isProcessingCover}
              onChange={handleCoverChange}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-[11px] file:font-semibold file:bg-[#0F5132]/10 file:text-[#0F5132] hover:file:bg-[#0F5132]/20 cursor-pointer disabled:opacity-50"
            />
            {isProcessingCover && <div className="text-[10px] text-slate-400 mt-2">Memproses gambar…</div>}
            {imageError && <div className="mt-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-[11px] font-medium leading-relaxed">{imageError}</div>}
            {coverImage && !imageError && (
              <div className="mt-2 w-full aspect-[16/9] max-w-[260px] mx-auto relative rounded-lg overflow-hidden border border-slate-200">
                <img src={coverImage} alt="Preview" className="object-cover w-full h-full" />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Template Sertifikat</label>
              <Link
                href={effectiveTemplate ? `/cms_admin/academy/template/${effectiveTemplate.id}` : '/cms_admin/academy/sertifikat'}
                onClick={(e) => guardedNavigate(e, effectiveTemplate ? `/cms_admin/academy/template/${effectiveTemplate.id}` : '/cms_admin/academy/sertifikat')}
                className="text-[10px] font-semibold text-[#0F5132] hover:underline"
              >
                Kelola Template
              </Link>
            </div>
            <select
              value={certificateTemplateId}
              onChange={(e) => setCertificateTemplateId(e.target.value)}
              className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2 text-slate-800 outline-none focus:border-[#0F5132] focus:ring-1 focus:ring-[#0F5132]"
            >
              <option value="">Gunakan template bawaan Saloka</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            {effectiveTemplate && (
              <div className="mt-3">
                <div className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">
                  Pratinjau Sertifikat
                </div>
                <CertificateSheet
                  backgroundImage={effectiveTemplate.backgroundImage}
                  type={effectiveTemplate.type}
                  recipientName="Nama Peserta"
                  courseTitle={title || 'Judul Kursus Contoh'}
                  issuedDate="1 Januari 2026"
                  serial="SLK-CONTOH-0001"
                />
              </div>
            )}
          </div>
          {/* No inline submit button — Simpan Perubahan is the single fixed
              button below, shared by the whole page. */}
        </form>
      </div>

      <div className="bg-white border border-[#e2e8f0] rounded-[var(--radius-brand)] p-6 shadow-sm">
        <KursusModulesManager lessons={lessons} onChange={setLessons} showToast={showToast} />
      </div>

      {/* The one Simpan Perubahan button for the page, pinned so it's always
          reachable regardless of scroll position. Disabled until the course
          fields or the staged module list actually differ from what's saved. */}
      <button
        type="button"
        onClick={openSaveConfirm}
        disabled={!isDirty || isPending || isProcessingCover || !!imageError}
        className="fixed bottom-6 right-6 z-40 px-6 py-3 bg-primary hover:bg-[#259a3f] text-white font-bold rounded-[var(--radius-brand)] uppercase tracking-wider text-xs shadow-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        {isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
      </button>

      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-gray-100"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${VARIANT_STYLES[confirmModal.variant].iconBg}`}>
              {confirmModal.variant === 'danger' && <Trash2 className="w-6 h-6" />}
              {confirmModal.variant === 'success' && <Check className="w-6 h-6" />}
              {confirmModal.variant === 'warning' && <AlertCircle className="w-6 h-6" />}
              {confirmModal.variant === 'info' && <Megaphone className="w-6 h-6" />}
            </div>
            <div className="space-y-1">
              <h3 className="font-sora text-base font-bold text-gray-900">{confirmModal.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{confirmModal.message}</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={closeConfirm}
                className="flex-1 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                {confirmModal.cancelText}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    await confirmModal.onConfirm()
                    closeConfirm()
                  })
                }}
                className={`flex-1 py-2.5 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer ${VARIANT_STYLES[confirmModal.variant].confirmBg}`}
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : confirmModal.confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
