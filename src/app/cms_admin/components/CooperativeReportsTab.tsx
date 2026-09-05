'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  createCooperativeReportAction,
  updateCooperativeReportAction,
  deleteCooperativeReportAction,
  togglePublishReportAction
} from '@/app/actions/reports'
import { useToast, Toast } from './Toast'

type Props = {
  reports: any[]
  communities: any[]
}

const REPORT_TYPES = ['Keuangan', 'Neraca', 'RAT', 'Lainnya']

const emptyForm = { communityId: '', title: '', type: REPORT_TYPES[0], year: new Date().getFullYear(), fileUrl: '' }

export default function CooperativeReportsTab({ reports: initial, communities }: Props) {
  const router = useRouter()
  const [reports, setReports] = useState(initial)
  const [isPending, startTransition] = useTransition()
  const { toast, showToast } = useToast()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...emptyForm, communityId: communities[0]?.id || '' })
    setIsModalOpen(true)
  }

  const openEdit = (r: any) => {
    setEditingId(r.id)
    setForm({ communityId: r.communityId, title: r.title, type: r.type, year: r.year, fileUrl: r.fileUrl })
    setIsModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.communityId || !form.title || !form.type || !form.year || !form.fileUrl) {
      alert('Komunitas, judul, jenis, tahun buku, dan link file laporan wajib diisi.')
      return
    }
    const fd = new FormData()
    fd.set('communityId', form.communityId)
    fd.set('title', form.title)
    fd.set('type', form.type)
    fd.set('year', String(form.year))
    fd.set('fileUrl', form.fileUrl)
    fd.set('status', 'PUBLISHED')

    setIsModalOpen(false)
    startTransition(async () => {
      const res = editingId ? await updateCooperativeReportAction(editingId, fd) : await createCooperativeReportAction(fd)
      if ('error' in res) {
        showToast(res.error || 'Gagal menyimpan laporan.', 'error')
        return
      }
      showToast(editingId ? 'Laporan berhasil diperbarui.' : 'Laporan baru berhasil dibuat.')
      router.refresh()
    })
  }

  const handleDelete = (r: any) => {
    if (!confirm(`Hapus laporan "${r.title}"?`)) return
    startTransition(async () => {
      const res = await deleteCooperativeReportAction(r.id, r.communityId)
      if (res && 'error' in res) {
        showToast(res.error || 'Gagal menghapus laporan.', 'error')
        return
      }
      setReports((prev) => prev.filter((x) => x.id !== r.id))
      showToast('Laporan berhasil dihapus.')
    })
  }

  const handleTogglePublish = (r: any) => {
    startTransition(async () => {
      const res = await togglePublishReportAction(r.id, r.status, r.communityId)
      if ('error' in res) {
        showToast(res.error || 'Gagal mengubah status publikasi.', 'error')
        return
      }
      setReports((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: x.status === 'DRAFT' ? 'PUBLISHED' : 'DRAFT' } : x)))
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-250">
      <Toast toast={toast} />

      <div className="bg-white border border-[#e2e8f0] p-6 rounded-[var(--radius-brand)] shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#e2e8f0] pb-4 mb-4">
          <div>
            <h3 className="font-sora text-sm font-bold text-slate-800 uppercase tracking-wider text-[#0F5132]">Laporan Koperasi Lintas Komunitas</h3>
            <p className="text-xs text-[#64748b] mt-0.5">Kelola laporan keuangan, neraca, dan RAT semua komunitas induk dari satu tempat.</p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            disabled={communities.length === 0}
            className="px-4 py-2 bg-[#006E24] hover:bg-[#005a1d] text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-xs border-none disabled:opacity-50"
          >
            + Tambah Laporan
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-xs text-left">
            <thead className="bg-[#f8f9fa] border-b border-[#e2e8f0] text-[#64748b] uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="px-4 py-3">Komunitas</th>
                <th className="px-4 py-3">Judul</th>
                <th className="px-4 py-3 text-center">Jenis</th>
                <th className="px-4 py-3 text-center">Tahun Buku</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 italic">
                    Belum ada laporan koperasi di komunitas manapun.
                  </td>
                </tr>
              ) : (
                reports.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-700">{r.communityName || r.communityId}</td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-800">{r.title}</p>
                      <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#0F5132] underline">Lihat file</a>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600">{r.type}</td>
                    <td className="px-4 py-3 text-center font-mono text-slate-700">{r.year}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleTogglePublish(r)}
                        disabled={isPending}
                        className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border tracking-wider cursor-pointer ${
                          r.status === 'PUBLISHED' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {r.status}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(r)}
                          className="px-2.5 py-1 bg-[#006E24]/10 hover:bg-[#006E24]/20 text-[#006E24] text-[10px] font-bold uppercase rounded transition-colors cursor-pointer border border-[#006E24]/20"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(r)}
                          disabled={isPending}
                          className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold uppercase rounded transition-colors cursor-pointer border border-red-200 disabled:opacity-50"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#006E24]/30 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-sora text-sm font-bold text-[#006E24] uppercase tracking-wider">
                {editingId ? 'Edit Laporan' : 'Tambah Laporan Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Komunitas *</label>
                <select
                  value={form.communityId}
                  onChange={(e) => setForm({ ...form, communityId: e.target.value })}
                  disabled={!!editingId}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#006E24] disabled:bg-slate-50"
                >
                  {communities.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Judul *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#006E24]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Jenis Laporan *</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#006E24]"
                  >
                    {REPORT_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Tahun Buku *</label>
                  <input
                    type="number"
                    required
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 outline-none focus:border-[#006E24]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Link File Laporan (PDF) *</label>
                <input
                  type="url"
                  required
                  value={form.fileUrl}
                  onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#006E24]"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2 bg-[#006E24] hover:bg-[#005a1d] text-white font-bold rounded-lg uppercase tracking-wider transition-colors cursor-pointer border-none shadow-xs disabled:opacity-50"
                >
                  {editingId ? 'Simpan Perubahan' : 'Tambah Laporan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
