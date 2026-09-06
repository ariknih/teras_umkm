'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Eye, Pencil, Trash2, ArrowUp, ArrowDown, ArrowUpDown, Loader2 } from 'lucide-react'
import { addCourseAction, deleteCourseAction } from '@/app/actions/admin'
import { cropAndEncodeImage } from '@/lib/image-processing'
import { PROTECTED_CERTIFICATE_TEMPLATE_NAME } from '@/lib/lms-rules'
import CertificateSheet from '@/components/CertificateSheet'
import { useToast, Toast } from './Toast'

type ParticipationCounts = { berjalan: number; selesai: number }
type SortKey = 'title' | 'access' | 'modul' | 'peserta'

const ACCESS_RANK: Record<string, number> = { Gold: 1, Platinum: 2, Diamond: 3, Bootcamp: 4 }
const PAGE_SIZE = 10

// Cover images are always cropped to 16:9 and encoded as WebP (JPEG fallback
// for browsers that can't canvas-encode WebP) — same technique as
// certificate template backgrounds, just a different ratio/output size.
const COVER_IMAGE_RATIO = 16 / 9
const COVER_IMAGE_OUTPUT_WIDTH = 1280
const COVER_IMAGE_MAX_BYTES = 2 * 1024 * 1024

// Every column but Nama Kursus has a cap, not a fixed size — short content
// (a two-digit "No", a short badge) stays narrower than the cap. Nama Kursus
// is the only column that grows to fill whatever space is left.
const COL = {
  no: { maxWidth: 90 },
  nama: { minWidth: 260 },
  status: { maxWidth: 140 },
  akses: { maxWidth: 160 },
  modul: { maxWidth: 160 },
  peserta: { maxWidth: 160 },
  aksi: { maxWidth: 160 },
} as const

/** Bounded page-number list with ellipsis, matching the mockup's "1 2 3 … 8 9 10". */
function pageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
}

export default function AcademyTab({
  initialCourses,
  participation,
  templates,
}: {
  initialCourses: any[]
  participation: Record<string, ParticipationCounts>
  templates: any[]
}) {
  const [courses, setCourses] = useState(initialCourses)
  const [isPending, startTransition] = useTransition()
  const { toast, showToast } = useToast()

  const [sort, setSort] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null)
  const [page, setPage] = useState(1)

  const [courseModal, setCourseModal] = useState(false)
  const [courseTitle, setCourseTitle] = useState('')
  const [courseDesc, setCourseDesc] = useState('')
  const [courseCover, setCourseCover] = useState('')
  const [courseAccess, setCourseAccess] = useState('Gold')
  const [coursePrice, setCoursePrice] = useState('0')
  const [courseTemplateId, setCourseTemplateId] = useState('')
  const [coursePublished, setCoursePublished] = useState(true)
  const [courseImageError, setCourseImageError] = useState<string | null>(null)
  const [isProcessingCover, setIsProcessingCover] = useState(false)

  // Standardized destructive-action confirmation — same shape used for
  // module deletes and elsewhere in the CMS (community discussions/reports),
  // so every "Hapus" in the app looks and behaves identically.
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    confirmText: string
    onConfirm: () => Promise<void> | void
  }>({ isOpen: false, title: '', message: '', confirmText: 'Ya, Hapus', onConfirm: () => {} })

  const resetCourseForm = () => {
    setCourseTitle('')
    setCourseDesc('')
    setCourseCover('')
    setCourseAccess('Gold')
    setCoursePrice('0')
    setCourseTemplateId('')
    setCoursePublished(true)
    setCourseImageError(null)
  }

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setCourseImageError(null)
    if (!file) return
    if (file.size > COVER_IMAGE_MAX_BYTES) {
      setCourseImageError(`⚠️ Ukuran file terlalu besar (${(file.size / 1024 / 1024).toFixed(1)} MB)! Maksimal ukuran file cover adalah 15 MB.`)
      return
    }
    setIsProcessingCover(true)
    try {
      const result = await cropAndEncodeImage(file, COVER_IMAGE_RATIO, COVER_IMAGE_OUTPUT_WIDTH)
      setCourseCover(result)
    } catch (err: any) {
      setCourseImageError(err.message || 'Gagal memproses gambar.')
    } finally {
      setIsProcessingCover(false)
    }
  }

  const isCourseFormComplete =
    !!courseTitle.trim() && !!courseDesc.trim() && !!courseCover && !!courseTemplateId

  const effectiveTemplate = !courseTemplateId
    ? null
    : courseTemplateId === 'default'
      ? templates.find((t: any) => t.name === PROTECTED_CERTIFICATE_TEMPLATE_NAME) || null
      : templates.find((t: any) => t.id === courseTemplateId) || null

  const handleCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isCourseFormComplete) return
    const price = Number(coursePrice) || 0
    const certificateTemplateId = courseTemplateId === 'default' ? null : courseTemplateId
    startTransition(async () => {
      const res = await addCourseAction(courseTitle, courseDesc, courseCover, courseAccess, price, certificateTemplateId, coursePublished)
      if (res.success && res.course) {
        setCourses((prev) => [...prev, res.course])
        showToast('Kursus baru berhasil ditambahkan.')
        setCourseModal(false)
        resetCourseForm()
      } else {
        showToast(res.error || 'Gagal menambahkan kursus.', 'error')
      }
    })
  }

  const handleDeleteCourse = (course: any) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Kursus',
      message: `Apakah Anda yakin ingin menghapus kursus "${course.title}" beserta semua modulnya? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: 'Ya, Hapus Kursus',
      onConfirm: async () => {
        const res = await deleteCourseAction(course.id)
        if (res.success) {
          setCourses((prev) => prev.filter((c) => c.id !== course.id))
          showToast('Kursus berhasil dihapus.')
        } else {
          showToast(res.error || 'Gagal menghapus kursus.', 'error')
        }
      },
    })
  }

  const toggleSort = (key: SortKey) => {
    setPage(1)
    setSort((prev) => {
      if (prev?.key !== key) return { key, direction: 'asc' }
      if (prev.direction === 'asc') return { key, direction: 'desc' }
      return null
    })
  }

  const sortedCourses = useMemo(() => {
    if (!sort) return courses
    const dir = sort.direction === 'asc' ? 1 : -1
    const value = (c: any): number | string => {
      switch (sort.key) {
        case 'title':
          return (c.title || '').toLowerCase()
        case 'access':
          return ACCESS_RANK[c.accessRequired] || 0
        case 'modul':
          return c.lessons?.length || 0
        case 'peserta':
          return participation[c.id]?.berjalan || 0
      }
    }
    return [...courses].sort((a, b) => {
      const va = value(a)
      const vb = value(b)
      if (va < vb) return -1 * dir
      if (va > vb) return 1 * dir
      return 0
    })
  }, [courses, sort, participation])

  const totalPages = Math.max(1, Math.ceil(sortedCourses.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageCourses = sortedCourses.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const SortHeader = ({ label, sortKey, style }: { label: string; sortKey: SortKey; style?: React.CSSProperties }) => (
    <th style={style} className="px-4 py-3 text-left">
      <button
        type="button"
        onClick={() => toggleSort(sortKey)}
        className="flex items-center gap-1 text-[11px] font-bold text-[#64748b] uppercase tracking-wider hover:text-[#0F5132] transition-colors cursor-pointer"
      >
        {label}
        {sort?.key === sortKey ? (
          sort.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-40" />
        )}
      </button>
    </th>
  )

  return (
    <div className="space-y-6">
      <Toast toast={toast} />

      <div className="flex justify-between items-center bg-white border border-[#e2e8f0] p-5 rounded-[var(--radius-brand)] shadow-sm">
        <div>
          <h3 className="font-sora text-xs font-bold text-[#0F5132] uppercase tracking-wider">Kurikulum Akademi Premium</h3>
          <p className="text-[11px] text-[#64748b]">Manajemen kursus Saloka Academy dan modul pembelajaran digital.</p>
        </div>
        <button
          onClick={() => { resetCourseForm(); setCourseModal(true) }}
          className="px-4 py-2.5 bg-primary hover:bg-[#259a3f] text-white font-bold uppercase text-xs tracking-wider rounded-[var(--radius-brand)] transition-colors cursor-pointer shadow-md shrink-0"
        >
          + Tambah Kursus
        </button>
      </div>

      <div className="bg-white border border-[#e2e8f0] rounded-[var(--radius-brand)] shadow-sm overflow-hidden">
        {/* The table itself scrolls horizontally; only the Aksi column stays
            pinned to the right edge of the viewport regardless of scroll. */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse">
            <thead className="bg-[#fafbfc] border-b border-[#e2e8f0]">
              <tr>
                <th style={COL.no} className="px-4 py-3 text-left text-[11px] font-bold text-[#64748b] uppercase tracking-wider">No</th>
                <SortHeader label="Nama Kursus" sortKey="title" style={COL.nama} />
                <th style={COL.status} className="px-4 py-3 text-left text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Status</th>
                <SortHeader label="Level Akses" sortKey="access" style={COL.akses} />
                <SortHeader label="Modul" sortKey="modul" style={COL.modul} />
                <SortHeader label="Peserta" sortKey="peserta" style={COL.peserta} />
                <th style={COL.aksi} className="sticky right-0 bg-[#fafbfc] px-4 py-3 text-left text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pageCourses.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-xs text-[#64748b] italic">
                    Belum ada kursus. Klik &quot;+ Tambah Kursus&quot; untuk membuat yang pertama.
                  </td>
                </tr>
              )}
              {pageCourses.map((course, idx) => (
                <tr key={course.id} className="group border-b border-[#f1f5f9] last:border-b-0">
                  <td style={COL.no} className="bg-white group-hover:bg-slate-50 px-4 py-3.5 text-xs text-slate-600 transition-colors">
                    {(currentPage - 1) * PAGE_SIZE + idx + 1}
                  </td>
                  <td style={COL.nama} className="bg-white group-hover:bg-slate-50 px-4 py-3.5 transition-colors">
                    <div className="text-xs font-bold text-slate-800 line-clamp-1">{course.title}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{course.id}</div>
                  </td>
                  <td style={COL.status} className="bg-white group-hover:bg-slate-50 px-4 py-3.5 transition-colors">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${(course.isPublished ?? true) ? 'bg-bank-blue-50 border-bank-blue-200 text-bank-blue-700' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                      {(course.isPublished ?? true) ? 'Dipasarkan' : 'Ditarik'}
                    </span>
                  </td>
                  <td style={COL.akses} className="bg-white group-hover:bg-slate-50 px-4 py-3.5 transition-colors">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#E8F5E9] border border-[#0F5132]/20 text-[#0F5132] uppercase tracking-wider">
                      {course.accessRequired || 'Gold'}
                    </span>
                  </td>
                  <td style={COL.modul} className="bg-white group-hover:bg-slate-50 px-4 py-3.5 text-xs text-slate-600 transition-colors">
                    {course.lessons?.length || 0}
                  </td>
                  <td style={COL.peserta} className="bg-white group-hover:bg-slate-50 px-4 py-3.5 text-xs text-slate-600 transition-colors">
                    {participation[course.id]?.berjalan || 0}
                  </td>
                  <td style={COL.aksi} className="sticky right-0 bg-white group-hover:bg-slate-50 px-4 py-3.5 shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.08)] transition-colors">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/cms_admin/academy/rincian/${course.id}`}
                        title="Rincian"
                        className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/cms_admin/academy/sunting/${course.id}`}
                        title="Sunting"
                        className="p-1.5 rounded hover:bg-amber-50 text-amber-600 transition-colors cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDeleteCourse(course)}
                        title="Hapus"
                        className="p-1.5 rounded hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedCourses.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#e2e8f0] text-[11px] text-[#64748b]">
            <span>
              {(currentPage - 1) * PAGE_SIZE + 1} - {Math.min(currentPage * PAGE_SIZE, sortedCourses.length)} dari {sortedCourses.length}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer font-semibold"
                >
                  ‹ Previous
                </button>
                {pageNumbers(currentPage, totalPages).map((n, i) =>
                  n === '...' ? (
                    <span key={`ellipsis-${i}`} className="px-2">…</span>
                  ) : (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPage(n)}
                      className={`w-7 h-7 rounded font-bold cursor-pointer transition-colors ${
                        n === currentPage ? 'bg-[#0F5132] text-white' : 'hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      {n}
                    </button>
                  )
                )}
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer font-semibold"
                >
                  Next ›
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {courseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#0F5132]/25 rounded-[var(--radius-brand)] max-w-md w-full p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-sora text-sm font-bold text-[#0F5132] uppercase tracking-wider">Tambah Kursus Baru</h3>
              <button onClick={() => setCourseModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCourseSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Nama Kursus</label>
                <input type="text" required value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} placeholder="e.g. Mastering Luxury Commerce" className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2.5 text-slate-800 outline-none focus:border-[#0F5132] focus:ring-1 focus:ring-[#0F5132]" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Deskripsi Kursus</label>
                <textarea required rows={3} value={courseDesc} onChange={(e) => setCourseDesc(e.target.value)} placeholder="Tulis ringkasan kurikulum..." className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2.5 text-slate-800 outline-none focus:border-[#0F5132] focus:ring-1 focus:ring-[#0F5132]" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Harga Kursus (Rp)</label>
                  <span className="text-[10px] font-semibold text-slate-400">0 = tidak dijual satuan</span>
                </div>
                <input type="number" min={0} required value={coursePrice} onChange={(e) => setCoursePrice(e.target.value)} placeholder="0" className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2.5 text-slate-800 outline-none focus:border-[#0F5132] focus:ring-1 focus:ring-[#0F5132]" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Akses Keanggotaan</label>
                <select value={courseAccess} onChange={(e) => setCourseAccess(e.target.value)} className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2 text-slate-800 outline-none focus:border-[#0F5132] focus:ring-1 focus:ring-[#0F5132]">
                  <option value="Gold">Gold</option>
                  <option value="Platinum">Platinum</option>
                  <option value="Diamond">Diamond</option>
                  <option value="Bootcamp">Bootcamp</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3.5 border border-[#cbd5e1] rounded-[var(--radius-brand)]">
                <div>
                  <div className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Pasarkan Kursus</div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Jika nonaktif, kursus tidak akan muncul di Saloka Academy.</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={coursePublished}
                  onClick={() => setCoursePublished((prev) => !prev)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${coursePublished ? 'bg-primary' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${coursePublished ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
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
                {courseImageError && <div className="mt-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-[11px] font-medium leading-relaxed">{courseImageError}</div>}
                {courseCover && !courseImageError && (
                  <div className="mt-2 w-full aspect-[16/9] max-w-[260px] mx-auto relative rounded-lg overflow-hidden border border-slate-200">
                    <img src={courseCover} alt="Preview" className="object-cover w-full h-full" />
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Template Sertifikat</label>
                  <Link
                    href={effectiveTemplate ? `/cms_admin/academy/template/${effectiveTemplate.id}` : '/cms_admin/academy/sertifikat'}
                    className="text-[10px] font-semibold text-[#0F5132] hover:underline"
                  >
                    Kelola Template
                  </Link>
                </div>
                <select required value={courseTemplateId} onChange={(e) => setCourseTemplateId(e.target.value)} className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2 text-slate-800 outline-none focus:border-[#0F5132] focus:ring-1 focus:ring-[#0F5132]">
                  <option value="" disabled>Pilih opsi</option>
                  <option value="default">Gunakan Template Bawaan Saloka</option>
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
                      courseTitle={courseTitle || 'Judul Kursus Contoh'}
                      issuedDate="1 Januari 2026"
                      serial="SLK-CONTOH-0001"
                    />
                  </div>
                )}
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setCourseModal(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-850 font-bold rounded-[var(--radius-brand)] uppercase tracking-wider transition-colors cursor-pointer">Batal</button>
                <button type="submit" disabled={isPending || isProcessingCover || !!courseImageError || !isCourseFormComplete} className="flex-1 py-2.5 bg-primary hover:bg-[#259a3f] text-white font-bold rounded-[var(--radius-brand)] uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                  {isPending ? 'Menyimpan...' : 'Simpan'}
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
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    await confirmModal.onConfirm()
                    setConfirmModal((prev) => ({ ...prev, isOpen: false }))
                  })
                }}
                className="flex-1 py-2.5 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer bg-red-600 hover:bg-red-700"
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
