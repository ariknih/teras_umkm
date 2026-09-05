'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  createAnnouncementAction,
  updateAnnouncementAction,
  deleteAnnouncementAction,
  togglePublishAnnouncementAction,
  togglePinAnnouncementAction
} from '@/app/actions/announcements'
import { useToast, Toast } from './Toast'

type Props = {
  announcements: any[]
  communities: any[]
}

const emptyForm = { communityId: '', title: '', content: '', isPinned: false }

export default function AnnouncementsTab({ announcements: initial, communities }: Props) {
  const router = useRouter()
  const [announcements, setAnnouncements] = useState(initial)
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

  const openEdit = (a: any) => {
    setEditingId(a.id)
    setForm({ communityId: a.communityId, title: a.title, content: a.content, isPinned: !!a.isPinned })
    setIsModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.communityId || !form.title || !form.content) {
      alert('Komunitas, judul, dan isi pengumuman wajib diisi.')
      return
    }
    const fd = new FormData()
    fd.set('communityId', form.communityId)
    fd.set('title', form.title)
    fd.set('content', form.content)
    fd.set('isPinned', String(form.isPinned))
    fd.set('status', 'PUBLISHED')

    setIsModalOpen(false)
    startTransition(async () => {
      const res = editingId ? await updateAnnouncementAction(editingId, fd) : await createAnnouncementAction(fd)
      if ('error' in res) {
        showToast(res.error || 'Gagal menyimpan pengumuman.', 'error')
        return
      }
      showToast(editingId ? 'Pengumuman berhasil diperbarui.' : 'Pengumuman baru berhasil dibuat.')
      router.refresh()
    })
  }

  const handleDelete = (a: any) => {
    if (!confirm(`Hapus pengumuman "${a.title}"?`)) return
    startTransition(async () => {
      const res = await deleteAnnouncementAction(a.id, a.communityId)
      if (res && 'error' in res) {
        showToast(res.error || 'Gagal menghapus pengumuman.', 'error')
        return
      }
      setAnnouncements((prev) => prev.filter((x) => x.id !== a.id))
      showToast('Pengumuman berhasil dihapus.')
    })
  }

  const handleTogglePublish = (a: any) => {
    startTransition(async () => {
      const res = await togglePublishAnnouncementAction(a.id, a.status, a.communityId)
      if ('error' in res) {
        showToast(res.error || 'Gagal mengubah status publikasi.', 'error')
        return
      }
      setAnnouncements((prev) => prev.map((x) => (x.id === a.id ? { ...x, status: x.status === 'DRAFT' ? 'PUBLISHED' : 'DRAFT' } : x)))
    })
  }

  const handleTogglePin = (a: any) => {
    startTransition(async () => {
      const res = await togglePinAnnouncementAction(a.id, a.isPinned, a.communityId)
      if ('error' in res) {
        showToast(res.error || 'Gagal mengubah status sematan.', 'error')
        return
      }
      setAnnouncements((prev) => prev.map((x) => (x.id === a.id ? { ...x, isPinned: !x.isPinned } : x)))
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-250">
      <Toast toast={toast} />

      <div className="bg-white border border-[#e2e8f0] p-6 rounded-[var(--radius-brand)] shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#e2e8f0] pb-4 mb-4">
          <div>
            <h3 className="font-sora text-sm font-bold text-slate-800 uppercase tracking-wider text-[#0F5132]">Pengumuman Lintas Komunitas</h3>
            <p className="text-xs text-[#64748b] mt-0.5">Kelola pengumuman semua komunitas induk dari satu tempat.</p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            disabled={communities.length === 0}
            className="px-4 py-2 bg-[#006E24] hover:bg-[#005a1d] text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-xs border-none disabled:opacity-50"
          >
            + Tambah Pengumuman
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-xs text-left">
            <thead className="bg-[#f8f9fa] border-b border-[#e2e8f0] text-[#64748b] uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="px-4 py-3">Komunitas</th>
                <th className="px-4 py-3">Judul & Isi</th>
                <th className="px-4 py-3 text-center">Pin</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {announcements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 italic">
                    Belum ada pengumuman di komunitas manapun.
                  </td>
                </tr>
              ) : (
                announcements.map((a: any) => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-700">{a.communityName || a.communityId}</td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-800">{a.title}</p>
                      <p className="text-[10px] text-slate-500 max-w-xs truncate">{a.content}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleTogglePin(a)}
                        disabled={isPending}
                        className={`text-sm ${a.isPinned ? 'text-amber-500' : 'text-slate-300 hover:text-slate-400'}`}
                        title={a.isPinned ? 'Lepas sematan' : 'Sematkan'}
                      >
                        📌
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleTogglePublish(a)}
                        disabled={isPending}
                        className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border tracking-wider cursor-pointer ${
                          a.status === 'PUBLISHED' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {a.status}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(a)}
                          className="px-2.5 py-1 bg-[#006E24]/10 hover:bg-[#006E24]/20 text-[#006E24] text-[10px] font-bold uppercase rounded transition-colors cursor-pointer border border-[#006E24]/20"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(a)}
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
                {editingId ? 'Edit Pengumuman' : 'Tambah Pengumuman Baru'}
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
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Isi Pengumuman *</label>
                <textarea
                  required
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#006E24] h-28"
                />
              </div>
              <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-600">
                <input type="checkbox" checked={form.isPinned} onChange={(e) => setForm({ ...form, isPinned: e.target.checked })} />
                Sematkan pengumuman ini
              </label>

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
                  {editingId ? 'Simpan Perubahan' : 'Tambah Pengumuman'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
