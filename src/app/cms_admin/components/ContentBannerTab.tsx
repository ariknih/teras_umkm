'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createBannerAction, updateBannerAction, deleteBannerAction, toggleBannerActiveAction } from '@/app/actions/landing'
import { useToast, Toast } from './Toast'

export default function ContentBannerTab({ initialLandingBanners }: { initialLandingBanners: any[] }) {
  const router = useRouter()
  const [banners, setBanners] = useState(initialLandingBanners)
  const [isPending, startTransition] = useTransition()
  const { toast, showToast } = useToast()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<any>(null)
  const [title, setTitle] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [sortOrder, setSortOrder] = useState('0')
  const [isUploading, setIsUploading] = useState(false)

  const openCreateModal = () => {
    setEditingBanner(null)
    setTitle('')
    setImageUrl('')
    setLinkUrl('')
    setSortOrder('0')
    setIsModalOpen(true)
  }

  const openEditModal = (banner: any) => {
    setEditingBanner(banner)
    setTitle(banner.title || '')
    setImageUrl(banner.imageUrl || '')
    setLinkUrl(banner.linkUrl || '')
    setSortOrder(String(banner.sortOrder || 0))
    setIsModalOpen(true)
  }

  const handleUploadImage = async (file: File) => {
    setIsUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) {
        setImageUrl(data.url)
      } else {
        showToast('Gagal mengunggah gambar.', 'error')
      }
    } catch {
      showToast('Error saat mengunggah gambar.', 'error')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!imageUrl) {
      alert('URL Gambar Banner wajib diisi.')
      return
    }
    const formData = new FormData()
    formData.append('title', title)
    formData.append('imageUrl', imageUrl)
    formData.append('linkUrl', linkUrl)
    formData.append('sortOrder', sortOrder)

    startTransition(async () => {
      if (editingBanner) {
        formData.append('isActive', String(editingBanner.isActive))
        const res = await updateBannerAction(editingBanner.id, formData)
        if (res.success && res.banner) {
          showToast('Banner berhasil diperbarui.')
          setBanners((prev) => prev.map((b) => (b.id === editingBanner.id ? res.banner : b)))
          setIsModalOpen(false)
          setEditingBanner(null)
          router.refresh()
        } else {
          showToast(res.error || 'Gagal mengedit banner.', 'error')
        }
      } else {
        const res = await createBannerAction(formData)
        if (res.success && res.banner) {
          showToast('Banner baru berhasil ditambahkan.')
          setBanners((prev) => [...prev, res.banner])
          setIsModalOpen(false)
          router.refresh()
        } else {
          showToast(res.error || 'Gagal membuat banner.', 'error')
        }
      }
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus banner ini?')) return
    startTransition(async () => {
      const res = await deleteBannerAction(id)
      if (res.success) {
        showToast('Banner berhasil dihapus.')
        setBanners((prev) => prev.filter((b) => b.id !== id))
        router.refresh()
      } else {
        showToast(res.error || 'Gagal menghapus banner.', 'error')
      }
    })
  }

  const handleToggle = (id: string, currentActive: boolean) => {
    startTransition(async () => {
      const res = await toggleBannerActiveAction(id, !currentActive)
      if (res.success) {
        showToast(`Status banner berhasil diubah ke ${!currentActive ? 'Aktif' : 'Non-aktif'}.`)
        setBanners((prev) => prev.map((b) => (b.id === id ? { ...b, isActive: !currentActive } : b)))
        router.refresh()
      } else {
        showToast(res.error || 'Gagal mengubah status banner.', 'error')
      }
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Toast toast={toast} />

      <div className="bg-white border border-[#e2e8f0] p-6 rounded-[var(--radius-brand)] shadow-sm space-y-6">
        <div className="flex justify-between items-center border-b border-[#e2e8f0] pb-4">
          <div>
            <h3 className="font-sora text-sm font-bold text-[#0F5132] uppercase tracking-wider">
              Kelola Banner Carousel Landing Page
            </h3>
            <p className="text-xs text-[#64748b] mt-1">
              Tambah, edit, hapus, dan atur urutan banner interaktif di halaman depan (halaman utama website) seperti Shopee & Tokopedia.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-[#0F5132] hover:bg-[#0a3a24] text-white text-xs font-bold uppercase tracking-widest rounded transition-colors shadow flex items-center gap-1.5 cursor-pointer"
          >
            <span>+ Tambah Banner Baru</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {banners.length === 0 ? (
            <div className="col-span-3 text-center py-12 text-slate-400 italic bg-slate-50 rounded border border-dashed border-slate-200">
              Belum ada banner landing page terdaftar. Klik &quot;+ Tambah Banner Baru&quot; untuk membuat banner carousel pertama.
            </div>
          ) : (
            banners.map((banner: any) => (
              <div key={banner.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                  <div className="h-40 bg-slate-100 relative overflow-hidden">
                    <img src={banner.imageUrl} alt={banner.title || 'Banner'} className="w-full h-full object-cover" />
                    <span className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[9px] font-bold uppercase ${banner.isActive ? 'bg-green-500 text-white' : 'bg-slate-500 text-white'}`}>
                      {banner.isActive ? 'Aktif' : 'Draft'}
                    </span>
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-[9px] font-mono">
                      Urutan #{banner.sortOrder || 0}
                    </span>
                  </div>
                  <div className="p-4 space-y-2">
                    <h4 className="font-bold text-slate-800 text-sm truncate">{banner.title || 'Tanpa Judul'}</h4>
                    {banner.linkUrl ? (
                      <a href={banner.linkUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline block truncate">
                        🔗 {banner.linkUrl}
                      </a>
                    ) : (
                      <p className="text-xs text-slate-400 italic">Tidak ada link klik</p>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleToggle(banner.id, banner.isActive)}
                    disabled={isPending}
                    className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-colors disabled:opacity-50 ${banner.isActive ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}
                  >
                    {banner.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>

                  <div className="flex gap-1">
                    <button onClick={() => openEditModal(banner)} className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold rounded">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(banner.id)} disabled={isPending} className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-[10px] font-bold rounded disabled:opacity-50">
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#0F5132]/25 rounded-[var(--radius-brand)] max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-sora text-sm font-bold text-[#0F5132] uppercase tracking-wider">
                {editingBanner ? 'Edit Banner Carousel' : 'Tambah Banner Carousel Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Judul Banner (Opsional)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Promo Merdeka UMKM"
                  className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Gambar Banner *</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className={`px-3 py-2 rounded text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 ${isUploading ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-[#0F5132] text-white hover:bg-[#0a3a24]'}`}>
                      <span>{isUploading ? 'Mengunggah...' : '📁 Pilih & Unggah Gambar'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploading}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleUploadImage(file)
                        }}
                      />
                    </label>
                    <span className="text-[10px] text-slate-400">atau masukkan URL langsung</span>
                  </div>
                  <input
                    type="url"
                    required
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://... (atau klik tombol unggah di atas)"
                    className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-800"
                  />
                  {imageUrl && (
                    <div className="h-24 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 relative">
                      <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">URL Link Klik (Opsional)</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://saloka.id/market atau https://..."
                  className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Urutan Tampil (Sort Order)</label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  placeholder="0, 1, 2..."
                  className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-xs font-bold text-slate-800"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-slate-300 text-slate-600 font-bold rounded">
                  Batal
                </button>
                <button type="submit" disabled={isPending} className="px-4 py-2 bg-[#0F5132] text-white font-bold rounded hover:bg-[#0a3822] disabled:opacity-50">
                  {isPending ? 'Simpan...' : 'Simpan Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
