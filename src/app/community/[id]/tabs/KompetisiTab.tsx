'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Trophy,
  Bookmark,
  PlusCircle,
  X,
  Calendar,
  CheckCircle2,
  Award,
  Edit2,
  Trash2,
  Sparkles,
  FileText,
  DollarSign,
  ChevronRight
} from 'lucide-react'
import {
  KompetisiItem,
  INITIAL_KOMPETISI,
  loadFeatureData,
  saveFeatureData
} from './communityFeaturesStore'

interface KompetisiTabProps {
  communityId: string
  communityName?: string
  isCanManage?: boolean
}

export default function KompetisiTab({
  communityId,
  communityName = 'Komunitas',
  isCanManage = false
}: KompetisiTabProps) {
  const [items, setItems] = useState<KompetisiItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Status Filter
  const [activeStatusFilter, setActiveStatusFilter] = useState<'ALL' | 'Pendaftaran Dibuka' | 'Akan Datang' | 'Selesai'>('ALL')

  // Modals
  const [detailItem, setDetailItem] = useState<KompetisiItem | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<KompetisiItem | null>(null)

  // Form inputs
  const [formTitle, setFormTitle] = useState('')
  const [formScale, setFormScale] = useState('Nasional')
  const [formDeadline, setFormDeadline] = useState('15 Nov 2026')
  const [formPrizeAmount, setFormPrizeAmount] = useState('Rp 100.000.000')
  const [formStatus, setFormStatus] = useState<KompetisiItem['status']>('Pendaftaran Dibuka')
  const [formDescription, setFormDescription] = useState('')
  const [formOrganizer, setFormOrganizer] = useState('')
  const [formRequirements, setFormRequirements] = useState('')
  const [formImageUrl, setFormImageUrl] = useState('')

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Load data
  useEffect(() => {
    const data = loadFeatureData(communityId, 'kompetisi', INITIAL_KOMPETISI)
    setItems(data)
    setIsLoaded(true)
  }, [communityId])

  const syncItems = (updated: KompetisiItem[]) => {
    setItems(updated)
    saveFeatureData(communityId, 'kompetisi', updated)
  }

  // Bookmark toggle
  const handleToggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = items.map((it) => {
      if (it.id === id) {
        const nextState = !it.isBookmarked
        showToast(nextState ? 'Kompetisi disimpan ke bookmark' : 'Bookmark dihapus')
        return { ...it, isBookmarked: nextState }
      }
      return it
    })
    syncItems(updated)
  }

  // Open Create Form
  const handleOpenCreate = () => {
    setEditingItem(null)
    setFormTitle('')
    setFormScale('Nasional')
    setFormDeadline('15 Nov 2026')
    setFormPrizeAmount('Rp 100.000.000')
    setFormStatus('Pendaftaran Dibuka')
    setFormDescription('')
    setFormOrganizer(`${communityName} x Saloka`)
    setFormRequirements('Pelaku UMKM terdaftar di Saloka, Memiliki izin usaha NIB, Produk orisinal lokal')
    setFormImageUrl('')
    setIsFormOpen(true)
  }

  // Open Edit Form
  const handleOpenEdit = (item: KompetisiItem, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setEditingItem(item)
    setFormTitle(item.title)
    setFormScale(item.scale)
    setFormDeadline(item.deadline)
    setFormPrizeAmount(item.prizeAmount)
    setFormStatus(item.status)
    setFormDescription(item.description)
    setFormOrganizer(item.organizer || '')
    setFormRequirements(item.requirements ? item.requirements.join(', ') : '')
    setFormImageUrl(item.imageUrl)
    setIsFormOpen(true)
    if (detailItem) setDetailItem(null)
  }

  // Delete Item
  const handleDeleteItem = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!window.confirm('Yakin ingin menghapus kompetisi ini?')) return
    const updated = items.filter((it) => it.id !== id)
    syncItems(updated)
    if (detailItem?.id === id) setDetailItem(null)
    showToast('Kompetisi berhasil dihapus')
  }

  // Submit Form
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim() || !formDescription.trim()) {
      alert('Judul kompetisi dan deskripsi wajib diisi!')
      return
    }

    const defaultImg =
      formImageUrl.trim() ||
      'https://images.unsplash.com/photo-1578269174936-2709b6aeb913?auto=format&fit=crop&w=400&q=80'

    const parsedReqs = formRequirements
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean)

    if (editingItem) {
      const updated = items.map((it) =>
        it.id === editingItem.id
          ? {
              ...it,
              title: formTitle,
              scale: formScale,
              deadline: formDeadline,
              prizeAmount: formPrizeAmount,
              status: formStatus,
              description: formDescription,
              organizer: formOrganizer,
              requirements: parsedReqs,
              imageUrl: defaultImg
            }
          : it
      )
      syncItems(updated)
      showToast('Kompetisi berhasil diperbarui')
    } else {
      const newItem: KompetisiItem = {
        id: `kmp-${Date.now()}`,
        title: formTitle,
        scale: formScale,
        deadline: formDeadline,
        prizeAmount: formPrizeAmount,
        status: formStatus,
        description: formDescription,
        organizer: formOrganizer || communityName,
        requirements: parsedReqs.length > 0 ? parsedReqs : ['Terdaftar di Saloka'],
        imageUrl: defaultImg,
        isBookmarked: false,
        createdAt: new Date().toISOString().split('T')[0],
        isCustom: true
      }
      syncItems([newItem, ...items])
      showToast('Kompetisi baru berhasil diterbitkan!')
    }

    setIsFormOpen(false)
  }

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (activeStatusFilter === 'ALL') return true
      return item.status === activeStatusFilter
    })
  }, [items, activeStatusFilter])

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-[#0F5132] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-white border border-gray-200/90 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 font-sora tracking-tight flex items-center gap-2">
              <span>Kompetisi</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold font-sans">
                {items.length} Challenge
              </span>
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Uji ide bisnismu, menangkan dana hibah pembinaan, dan raih fasilitasi inkubasi UMKM di {communityName}.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="self-start sm:self-auto px-4 py-2.5 bg-[#2DB24A] hover:bg-[#24943E] text-white text-xs font-extrabold rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Buat Kompetisi</span>
          </button>
        </div>

        {/* Filter Pills at Top */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-none">
          {(['ALL', 'Pendaftaran Dibuka', 'Akan Datang', 'Selesai'] as const).map((filter) => {
            const isActive = activeStatusFilter === filter
            const label = filter === 'ALL' ? 'Semua' : filter
            return (
              <button
                key={filter}
                onClick={() => setActiveStatusFilter(filter)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-[#2DB24A] text-white shadow-xs'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* Cards List */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 px-4 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50 space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <Trophy className="w-6 h-6" />
            </div>
            <h4 className="font-sora text-sm font-bold text-gray-800">Tidak ada kompetisi di kategori ini</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Coba ganti filter status atau tambahkan agenda kompetisi baru untuk anggota.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setDetailItem(item)}
                className="group p-4 sm:p-5 rounded-2xl border border-gray-200/90 hover:border-[#2DB24A]/50 bg-white hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer"
              >
                {/* Left: Thumbnail & Details */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 border border-gray-150 relative bg-amber-50">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-sora text-base font-black text-gray-900 group-hover:text-[#2DB24A] transition-colors truncate">
                        {item.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[10px] font-extrabold uppercase">
                        {item.scale}
                      </span>
                      <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        Batas Pendaftaran: <strong className="text-gray-700">{item.deadline}</strong>
                      </span>
                    </div>

                    <div className="pt-0.5">
                      <span className="text-sm sm:text-base font-black text-[#0F5132] font-sora">
                        Total Hadiah: {item.prizeAmount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                  <button
                    onClick={(e) => handleToggleBookmark(item.id, e)}
                    title={item.isBookmarked ? 'Hapus dari bookmark' : 'Simpan bookmark'}
                    className={`p-2 rounded-xl transition-all cursor-pointer ${
                      item.isBookmarked
                        ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                        : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${item.isBookmarked ? 'fill-emerald-600' : ''}`} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setDetailItem(item)
                    }}
                    className="px-5 py-2 bg-[#2DB24A] hover:bg-[#24943E] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
                  >
                    Lihat Detail
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── MODAL DETAIL VIEW ──────────────────────────────────────────────── */}
      {detailItem && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 space-y-5 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setDetailItem(null)}
              className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4">
              <img
                src={detailItem.imageUrl}
                alt={detailItem.title}
                className="w-20 h-20 rounded-2xl object-cover border border-gray-200 shrink-0"
              />
              <div className="space-y-1 pr-6">
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase">
                  {detailItem.scale}
                </span>
                <h3 className="font-sora text-lg font-black text-gray-900">{detailItem.title}</h3>
                <p className="text-xs text-gray-500 font-medium">
                  Diselenggarakan oleh: <strong>{detailItem.organizer || communityName}</strong>
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">Total Hadiah & Bantuan</span>
                <h4 className="text-xl font-black text-[#0F5132] font-sora">{detailItem.prizeAmount}</h4>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-white text-emerald-800 border border-emerald-200 text-xs font-bold">
                {detailItem.status}
              </span>
            </div>

            <div className="space-y-2 border-t border-gray-100 pt-3">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Deskripsi Kompetisi</h4>
              <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{detailItem.description}</p>
            </div>

            {detailItem.requirements && detailItem.requirements.length > 0 && (
              <div className="space-y-2 border-t border-gray-100 pt-3">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Syarat & Ketentuan Peserta</h4>
                <ul className="space-y-1.5 text-xs text-gray-600">
                  {detailItem.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2DB24A] shrink-0 mt-0.5" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-2 border-t border-gray-100 pt-3">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Aksi Pendaftaran</h4>
              <button
                onClick={() => {
                  alert(`Pendaftaran ${detailItem.title} berhasil dicatat! Tim kurator Saloka akan menghubungi Anda via WhatsApp.`)
                  setDetailItem(null)
                  showToast('Pendaftaran kompetisi berhasil!')
                }}
                className="w-full py-3 bg-[#2DB24A] hover:bg-[#24943E] text-white text-xs font-extrabold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Trophy className="w-4 h-4" />
                <span>Daftar Kompetisi Sekarang</span>
              </button>
            </div>

            {/* Edit / Delete actions */}
            {(detailItem.isCustom || isCanManage) && (
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                <button
                  onClick={(e) => handleOpenEdit(detailItem, e)}
                  className="text-gray-600 hover:text-amber-700 font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Kompetisi</span>
                </button>
                <button
                  onClick={(e) => handleDeleteItem(detailItem.id, e)}
                  className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL FORM (CREATE / EDIT) ────────────────────────────────────── */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 space-y-4 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-sora text-base font-black text-gray-900">
                {editingItem ? 'Edit Kompetisi' : 'Buat Kompetisi / Challenge Baru'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Judul Kompetisi *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Contoh: Lomba Inovasi Produk UMKM 2026"
                  className="w-full px-3 py-2 border border-gray-250 rounded-xl text-xs text-gray-800 focus:border-[#2DB24A] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tingkat / Skala</label>
                  <input
                    type="text"
                    value={formScale}
                    onChange={(e) => setFormScale(e.target.value)}
                    placeholder="Contoh: Nasional / Daerah"
                    className="w-full px-3 py-2 border border-gray-250 rounded-xl text-xs text-gray-800 focus:border-[#2DB24A] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Status Pendaftaran</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-250 rounded-xl text-xs text-gray-800 focus:border-[#2DB24A] outline-none"
                  >
                    <option value="Pendaftaran Dibuka">Pendaftaran Dibuka</option>
                    <option value="Akan Datang">Akan Datang</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Total Hadiah (Rp) *</label>
                  <input
                    type="text"
                    required
                    value={formPrizeAmount}
                    onChange={(e) => setFormPrizeAmount(e.target.value)}
                    placeholder="Contoh: Rp 100.000.000"
                    className="w-full px-3 py-2 border border-gray-250 rounded-xl text-xs text-gray-800 focus:border-[#2DB24A] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Batas Pendaftaran *</label>
                  <input
                    type="text"
                    required
                    value={formDeadline}
                    onChange={(e) => setFormDeadline(e.target.value)}
                    placeholder="Contoh: 15 Nov 2026"
                    className="w-full px-3 py-2 border border-gray-250 rounded-xl text-xs text-gray-800 focus:border-[#2DB24A] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Penyelenggara / Sponsor</label>
                <input
                  type="text"
                  value={formOrganizer}
                  onChange={(e) => setFormOrganizer(e.target.value)}
                  placeholder="Contoh: Kementerian Koperasi & Saloka"
                  className="w-full px-3 py-2 border border-gray-250 rounded-xl text-xs text-gray-800 focus:border-[#2DB24A] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Deskripsi Kompetisi *</label>
                <textarea
                  required
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Jelaskan tujuan kompetisi, tahapan seleksi, dan benefit pemenang..."
                  className="w-full px-3 py-2 border border-gray-250 rounded-xl text-xs text-gray-800 focus:border-[#2DB24A] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Syarat & Ketentuan (Pisahkan Koma)</label>
                <input
                  type="text"
                  value={formRequirements}
                  onChange={(e) => setFormRequirements(e.target.value)}
                  placeholder="Contoh: Terdaftar di Saloka, Memiliki NIB, Video Pitching"
                  className="w-full px-3 py-2 border border-gray-250 rounded-xl text-xs text-gray-800 focus:border-[#2DB24A] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">URL Foto Sampul (Opsional)</label>
                <input
                  type="url"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-250 rounded-xl text-xs text-gray-800 focus:border-[#2DB24A] outline-none"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2DB24A] hover:bg-[#24943E] text-white text-xs font-extrabold rounded-xl shadow-xs"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Terbitkan Kompetisi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
