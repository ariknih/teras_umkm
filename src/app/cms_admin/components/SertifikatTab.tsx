'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Eye, Pencil, Trash2, ArrowUp, ArrowDown, ArrowUpDown, Loader2 } from 'lucide-react'
import { addCertificateTemplateAction, updateCertificateTemplateAction, deleteCertificateTemplateAction } from '@/app/actions/admin'
import { CERTIFICATE_TEMPLATE_TYPES, PROTECTED_CERTIFICATE_TEMPLATE_NAME } from '@/lib/lms-rules'
import { cropAndEncodeImage } from '@/lib/image-processing'
import CertificateSheet from '@/components/CertificateSheet'
import { useToast, Toast } from './Toast'

type SortKey = 'name' | 'type' | 'dipakai'
type FormState = { name: string; type: string; backgroundImage: string }

const PAGE_SIZE = 10
const EMPTY_FORM: FormState = { name: '', type: '', backgroundImage: '' }

// US Letter Landscape — every uploaded image is forced into this ratio so it
// always matches the certificate sheet and the eventual print/PDF page size.
const TEMPLATE_IMAGE_RATIO = 11 / 8.5
const TEMPLATE_IMAGE_MAX_BYTES = 1 * 1024 * 1024
const TEMPLATE_IMAGE_OUTPUT_WIDTH = 1600

const COL = {
  no: { maxWidth: 90 },
  nama: { minWidth: 240 },
  tipe: { maxWidth: 160 },
  dipakai: { maxWidth: 140 },
  aksi: { maxWidth: 160 },
} as const

/** Bounded page-number list with ellipsis, matching AcademyTab's pagination. */
function pageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
}

export default function SertifikatTab({
  initialTemplates,
  courses,
  isSuperAdmin,
}: {
  initialTemplates: any[]
  courses: any[]
  isSuperAdmin: boolean
}) {
  const [templates, setTemplates] = useState(initialTemplates)
  const [isPending, startTransition] = useTransition()
  const { toast, showToast } = useToast()

  const [sort, setSort] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null)
  const [page, setPage] = useState(1)

  const usageCount = (templateId: string) => courses.filter((c) => c.certificateTemplateId === templateId).length
  const isProtected = (t: any) => t.name === PROTECTED_CERTIFICATE_TEMPLATE_NAME
  const canEdit = (t: any) => isSuperAdmin || !isProtected(t)

  // Shared by Tambah and Sunting — `editingId` null means "create".
  const [formModal, setFormModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [imageError, setImageError] = useState<string | null>(null)
  const [isProcessingImage, setIsProcessingImage] = useState(false)

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    confirmText: string
    onConfirm: () => Promise<void> | void
  }>({ isOpen: false, title: '', message: '', confirmText: 'Ya, Hapus', onConfirm: () => {} })

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setImageError(null)
    setFormModal(true)
  }

  const openEdit = (t: any) => {
    if (!canEdit(t)) return
    setEditingId(t.id)
    setForm({ name: t.name, type: t.type, backgroundImage: t.backgroundImage })
    setImageError(null)
    setFormModal(true)
  }

  // Deep-link from RincianTemplateView's "Sunting Template" button
  // (/cms_admin/academy/sertifikat?edit=<id>) — opens straight into the edit
  // modal instead of leaving the admin to find the row in the table.
  const searchParams = useSearchParams()
  useEffect(() => {
    const editId = searchParams.get('edit')
    if (!editId) return
    const target = templates.find((t) => t.id === editId)
    if (target) openEdit(target)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setImageError(null)
    if (!file) return
    if (file.size > TEMPLATE_IMAGE_MAX_BYTES) {
      setImageError(`⚠️ Ukuran file terlalu besar (${(file.size / 1024 / 1024).toFixed(1)} MB)! Maksimal ukuran file 1 MB.`)
      return
    }
    setIsProcessingImage(true)
    try {
      const result = await cropAndEncodeImage(file, TEMPLATE_IMAGE_RATIO, TEMPLATE_IMAGE_OUTPUT_WIDTH)
      setForm((f) => ({ ...f, backgroundImage: result }))
    } catch (err: any) {
      setImageError(err.message || 'Gagal memproses gambar.')
    } finally {
      setIsProcessingImage(false)
    }
  }

  const isFormComplete = !!form.name.trim() && !!form.type && !!form.backgroundImage

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormComplete) return
    startTransition(async () => {
      if (editingId) {
        const res = await updateCertificateTemplateAction(editingId, form.name, form.type, form.backgroundImage)
        if (res.success) {
          setTemplates((prev) => prev.map((t) => (t.id === editingId ? { ...t, ...form } : t)))
          showToast('Template sertifikat berhasil diperbarui.')
          setFormModal(false)
        } else {
          showToast(res.error || 'Gagal memperbarui template sertifikat.', 'error')
        }
      } else {
        const res = await addCertificateTemplateAction(form.name, form.type, form.backgroundImage)
        if (res.success && res.template) {
          setTemplates((prev) => [...prev, { ...res.template, courses: [] }])
          showToast('Template sertifikat baru berhasil ditambahkan.')
          setFormModal(false)
        } else {
          showToast(res.error || 'Gagal menambahkan template sertifikat.', 'error')
        }
      }
    })
  }

  const handleDelete = (t: any) => {
    if (isProtected(t)) return
    const used = usageCount(t.id)
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Template Sertifikat',
      message: used > 0
        ? `Template "${t.name}" masih dipakai ${used} kursus. Kursus tersebut akan kembali ke desain sertifikat bawaan. Lanjutkan?`
        : `Apakah Anda yakin ingin menghapus template "${t.name}"? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: 'Ya, Hapus Template',
      onConfirm: async () => {
        const res = await deleteCertificateTemplateAction(t.id)
        if (res.success) {
          setTemplates((prev) => prev.filter((x) => x.id !== t.id))
          showToast('Template sertifikat berhasil dihapus.')
        } else {
          showToast(res.error || 'Gagal menghapus template sertifikat.', 'error')
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

  const sortedTemplates = useMemo(() => {
    if (!sort) return templates
    const dir = sort.direction === 'asc' ? 1 : -1
    const value = (t: any): number | string => {
      switch (sort.key) {
        case 'name':
          return (t.name || '').toLowerCase()
        case 'type':
          return (t.type || '').toLowerCase()
        case 'dipakai':
          return usageCount(t.id)
      }
    }
    return [...templates].sort((a, b) => {
      const va = value(a)
      const vb = value(b)
      if (va < vb) return -1 * dir
      if (va > vb) return 1 * dir
      return 0
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templates, sort, courses])

  const totalPages = Math.max(1, Math.ceil(sortedTemplates.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageTemplates = sortedTemplates.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

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
          <h3 className="font-sora text-xs font-bold text-[#0F5132] uppercase tracking-wider">Template Sertifikat Akademi</h3>
          <p className="text-[11px] text-[#64748b]">Kelola desain sertifikat kelulusan yang dapat dipilih per kursus.</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2.5 bg-primary hover:bg-[#259a3f] text-white font-bold uppercase text-xs tracking-wider rounded-[var(--radius-brand)] transition-colors cursor-pointer shadow-md shrink-0"
        >
          + Tambah Template
        </button>
      </div>

      <div className="bg-white border border-[#e2e8f0] rounded-[var(--radius-brand)] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] border-collapse">
            <thead className="bg-[#fafbfc] border-b border-[#e2e8f0]">
              <tr>
                <th style={COL.no} className="px-4 py-3 text-left text-[11px] font-bold text-[#64748b] uppercase tracking-wider">No</th>
                <SortHeader label="Nama Sertifikat" sortKey="name" style={COL.nama} />
                <SortHeader label="Tipe" sortKey="type" style={COL.tipe} />
                <SortHeader label="Dipakai" sortKey="dipakai" style={COL.dipakai} />
                <th style={COL.aksi} className="sticky right-0 bg-[#fafbfc] px-4 py-3 text-left text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pageTemplates.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-xs text-[#64748b] italic">
                    Belum ada template sertifikat. Klik &quot;+ Tambah Template&quot; untuk membuat yang pertama.
                  </td>
                </tr>
              )}
              {pageTemplates.map((t, idx) => (
                <tr key={t.id} className="group border-b border-[#f1f5f9] last:border-b-0">
                  <td style={COL.no} className="bg-white group-hover:bg-slate-50 px-4 py-3.5 text-xs text-slate-600 transition-colors">
                    {(currentPage - 1) * PAGE_SIZE + idx + 1}
                  </td>
                  <td style={COL.nama} className="bg-white group-hover:bg-slate-50 px-4 py-3.5 transition-colors">
                    <div className="flex items-center gap-1.5">
                      <div className="text-xs font-bold text-slate-800 line-clamp-1">{t.name}</div>
                      {isProtected(t) && (
                        <span className="shrink-0 px-1.5 py-0.5 rounded text-[8px] font-bold bg-slate-100 border border-slate-200 text-slate-500 uppercase tracking-wider">Bawaan</span>
                      )}
                    </div>
                  </td>
                  <td style={COL.tipe} className="bg-white group-hover:bg-slate-50 px-4 py-3.5 transition-colors">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#E8F5E9] border border-[#0F5132]/20 text-[#0F5132] uppercase tracking-wider">
                      {t.type}
                    </span>
                  </td>
                  <td style={COL.dipakai} className="bg-white group-hover:bg-slate-50 px-4 py-3.5 text-xs text-slate-600 transition-colors">
                    {usageCount(t.id)} kursus
                  </td>
                  <td style={COL.aksi} className="sticky right-0 bg-white group-hover:bg-slate-50 px-4 py-3.5 shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.08)] transition-colors">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/cms_admin/academy/template/${t.id}`}
                        title="Lihat"
                        className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => openEdit(t)}
                        disabled={!canEdit(t)}
                        title={canEdit(t) ? 'Sunting' : 'Hanya superadmin yang dapat mengubah template ini'}
                        className="p-1.5 rounded hover:bg-amber-50 text-amber-600 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(t)}
                        disabled={isProtected(t)}
                        title={isProtected(t) ? 'Template bawaan tidak dapat dihapus' : 'Hapus'}
                        className="p-1.5 rounded hover:bg-red-50 text-red-600 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
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

        {sortedTemplates.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#e2e8f0] text-[11px] text-[#64748b]">
            <span>
              {(currentPage - 1) * PAGE_SIZE + 1} - {Math.min(currentPage * PAGE_SIZE, sortedTemplates.length)} dari {sortedTemplates.length}
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

      {formModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#0F5132]/25 rounded-[var(--radius-brand)] max-w-md w-full p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-sora text-sm font-bold text-[#0F5132] uppercase tracking-wider">
                {editingId ? 'Sunting Template Sertifikat' : 'Tambah Template Sertifikat'}
              </h3>
              <button onClick={() => setFormModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Nama Sertifikat</label>
                <input type="text" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Sertifikat Bootcamp Digital" className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2.5 text-slate-800 outline-none focus:border-[#0F5132] focus:ring-1 focus:ring-[#0F5132]" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Tipe Sertifikat</label>
                <select required value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2.5 text-slate-800 outline-none focus:border-[#0F5132] focus:ring-1 focus:ring-[#0F5132]">
                  <option value="" disabled>Pilih opsi</option>
                  {CERTIFICATE_TEMPLATE_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Gambar Sertifikat</label>
                  <span className="text-[10px] font-semibold text-emerald-600">Maks. 1 MB</span>
                </div>
                <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">
                  Gambar ini menjadi latar setiap sertifikat yang memakai template ini — tanda tangan, nama pejabat, jabatan, dan logo cukup digambar langsung di dalam gambar ini. Berapa pun rasio aslinya, gambar akan otomatis dipotong & disesuaikan ke rasio US Letter Landscape (11:8.5), lalu disimpan sebagai WebP agar hemat ruang.
                </p>
                <input
                  type="file"
                  accept="image/*"
                  disabled={isProcessingImage}
                  onChange={handleImageChange}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-[11px] file:font-semibold file:bg-[#0F5132]/10 file:text-[#0F5132] hover:file:bg-[#0F5132]/20 cursor-pointer disabled:opacity-50"
                />
                {isProcessingImage && <div className="text-[10px] text-slate-400 mt-2">Memproses gambar…</div>}
                {imageError && <div className="mt-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-[11px] font-medium leading-relaxed">{imageError}</div>}
                {form.backgroundImage && !imageError && (
                  <div className="mt-3">
                    <div className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">
                      Pratinjau Tata Letak (data contoh)
                    </div>
                    <CertificateSheet
                      backgroundImage={form.backgroundImage}
                      type={form.type || '(Pilih Tipe Sertifikat)'}
                      recipientName="Nama Peserta"
                      courseTitle="Judul Kursus Contoh"
                      issuedDate="1 Januari 2026"
                      serial="SLK-CONTOH-0001"
                    />
                  </div>
                )}
                {form.backgroundImage && !imageError && (
                  // DEBUG ONLY — remove this block (including the print
                  // <style>) once template quality checks are no longer
                  // needed. Prints the same #certificate-sheet element
                  // rendered by the preview above, via the same isolation
                  // technique the real certificate page uses — so it
                  // validates the exact export path a real recipient goes
                  // through, never the raw WebP/JPEG.
                  <div className="mt-1.5 text-right">
                    <style>{`
                      @media print {
                        body * { visibility: hidden; }
                        #certificate-sheet, #certificate-sheet * {
                          visibility: visible;
                          -webkit-print-color-adjust: exact;
                          print-color-adjust: exact;
                        }
                        #certificate-sheet {
                          position: absolute;
                          left: 0;
                          top: 0;
                          width: 100%;
                          box-shadow: none;
                        }
                        @page { size: letter landscape; margin: 0; }
                      }
                    `}</style>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="text-[10px] font-semibold text-[#0F5132] hover:underline cursor-pointer"
                    >
                      [Debug] Unduh PDF
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setFormModal(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-850 font-bold rounded-[var(--radius-brand)] uppercase tracking-wider transition-colors cursor-pointer">Batal</button>
                <button type="submit" disabled={isPending || isProcessingImage || !isFormComplete} className="flex-1 py-2.5 bg-primary hover:bg-[#259a3f] text-white font-bold rounded-[var(--radius-brand)] uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                  {isPending ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah'}
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
