'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Search,
  Bookmark,
  PlusCircle,
  X,
  Phone,
  MapPin,
  Heart,
  MessageCircle,
  Edit2,
  Trash2,
  CheckCircle2,
  Users,
  Calendar,
  Share2
} from 'lucide-react'
import {
  KolaborasiItem,
  INITIAL_KOLABORASI,
  loadFeatureData,
  saveFeatureData
} from './communityFeaturesStore'

interface KolaborasiTabProps {
  communityId: string
  communityName?: string
  isCanManage?: boolean
}

export default function KolaborasiTab({
  communityId,
  communityName = 'Komunitas',
  isCanManage = false
}: KolaborasiTabProps) {
  const [items, setItems] = useState<KolaborasiItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [selectedStatus, setSelectedStatus] = useState('ALL')
  const [activeTypeFilter, setActiveTypeFilter] = useState<'ALL' | 'Pengembangan Produk' | 'Pemasaran' | 'Distribusi'>('ALL')

  // Modals
  const [detailItem, setDetailItem] = useState<KolaborasiItem | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<KolaborasiItem | null>(null)

  // Form inputs
  const [formTitle, setFormTitle] = useState('')
  const [formCategory, setFormCategory] = useState('Desain Produk')
  const [formLocation, setFormLocation] = useState('Yogyakarta, DIY')
  const [formType, setFormType] = useState<KolaborasiItem['type']>('Pengembangan Produk')
  const [formStatus, setFormStatus] = useState<KolaborasiItem['status']>('Buka')
  const [formDescription, setFormDescription] = useState('')
  const [formImageUrl, setFormImageUrl] = useState('')
  const [formInitiatorName, setFormInitiatorName] = useState('')
  const [formContactPhone, setFormContactPhone] = useState('')

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Load data
  useEffect(() => {
    const data = loadFeatureData(communityId, 'kolaborasi', INITIAL_KOLABORASI)
    setItems(data)
    setIsLoaded(true)
  }, [communityId])

  const syncItems = (updated: KolaborasiItem[]) => {
    setItems(updated)
    saveFeatureData(communityId, 'kolaborasi', updated)
  }

  // Toggle Bookmark
  const handleToggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = items.map((it) => {
      if (it.id === id) {
        const nextState = !it.isBookmarked
        showToast(nextState ? 'Proyek disimpan ke bookmark' : 'Bookmark dihapus')
        return { ...it, isBookmarked: nextState }
      }
      return it
    })
    syncItems(updated)
  }

  // Toggle Like
  const handleToggleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = items.map((it) => {
      if (it.id === id) {
        return { ...it, likesCount: it.likesCount + 1 }
      }
      return it
    })
    syncItems(updated)
    showToast('Terima kasih atas dukungannya!')
  }

  // Open Create Form
  const handleOpenCreate = () => {
    setEditingItem(null)
    setFormTitle('')
    setFormCategory('Pengembangan Produk')
    setFormLocation('Yogyakarta, DIY')
    setFormType('Pengembangan Produk')
    setFormStatus('Buka')
    setFormDescription('')
    setFormImageUrl('')
    setFormInitiatorName('Anggota Komunitas')
    setFormContactPhone('6281234567890')
    setIsFormOpen(true)
  }

  // Open Edit Form
  const handleOpenEdit = (item: KolaborasiItem, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setEditingItem(item)
    setFormTitle(item.title)
    setFormCategory(item.category)
    setFormLocation(item.location)
    setFormType(item.type)
    setFormStatus(item.status)
    setFormDescription(item.description)
    setFormImageUrl(item.imageUrl)
    setFormInitiatorName(item.initiatorName || '')
    setFormContactPhone(item.contactPhone || '')
    setIsFormOpen(true)
    if (detailItem) setDetailItem(null)
  }

  // Delete Item
  const handleDeleteItem = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!window.confirm('Yakin ingin menghapus peluang kolaborasi ini?')) return
    const updated = items.filter((it) => it.id !== id)
    syncItems(updated)
    if (detailItem?.id === id) setDetailItem(null)
    showToast('Proyek kolaborasi berhasil dihapus')
  }

  // Submit Form (Create / Update)
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim() || !formDescription.trim()) {
      alert('Judul proyek dan deskripsi wajib diisi!')
      return
    }

    const defaultImg =
      formImageUrl.trim() ||
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=400&q=80'

    if (editingItem) {
      const updated = items.map((it) =>
        it.id === editingItem.id
          ? {
              ...it,
              title: formTitle,
              category: formCategory,
              location: formLocation || 'Indonesia',
              type: formType,
              status: formStatus,
              description: formDescription,
              imageUrl: defaultImg,
              initiatorName: formInitiatorName,
              contactPhone: formContactPhone
            }
          : it
      )
      syncItems(updated)
      showToast('Peluang kolaborasi berhasil diperbarui')
    } else {
      const newItem: KolaborasiItem = {
        id: `kol-${Date.now()}`,
        title: formTitle,
        category: formCategory,
        location: formLocation || 'Indonesia',
        type: formType,
        status: formStatus,
        description: formDescription,
        imageUrl: defaultImg,
        likesCount: 1,
        commentsCount: 0,
        isBookmarked: false,
        initiatorName: formInitiatorName || 'Anggota Komunitas',
        contactPhone: formContactPhone,
        createdAt: new Date().toISOString().split('T')[0],
        isCustom: true
      }
      syncItems([newItem, ...items])
      showToast('Peluang kolaborasi baru berhasil diterbitkan!')
    }

    setIsFormOpen(false)
  }

  // Filter lists
  const categoriesList = useMemo(() => {
    const set = new Set(items.map((i) => i.category))
    return Array.from(set)
  }, [items])

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        searchQuery === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())

      const matchCategory = selectedCategory === 'ALL' || item.category === selectedCategory
      const matchStatus = selectedStatus === 'ALL' || item.status === selectedStatus
      const matchType = activeTypeFilter === 'ALL' || item.type === activeTypeFilter

      return matchSearch && matchCategory && matchStatus && matchType
    })
  }, [items, searchQuery, selectedCategory, selectedStatus, activeTypeFilter])

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
        {/* Header & "+ Buat Peluang Kolaborasi" button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 font-sora tracking-tight flex items-center gap-2">
              <span>Kolaborasi</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold font-sans">
                {items.length} Proyek
              </span>
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Bergabung dalam proyek patungan, kargo logistik bersama, dan efisiensi rantai pasok sesama anggota di {communityName}.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="self-start sm:self-auto px-4 py-2.5 bg-[#2DB24A] hover:bg-[#24943E] text-white text-xs font-extrabold rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Buat Peluang Kolaborasi</span>
          </button>
        </div>

        {/* Search & Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari proyek atau kata kunci..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50/80 hover:bg-white focus:bg-white border border-gray-200 focus:border-[#2DB24A] rounded-xl text-xs text-gray-800 placeholder:text-gray-400 outline-none transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50/80 hover:bg-white focus:bg-white border border-gray-200 focus:border-[#2DB24A] rounded-xl text-xs text-gray-700 outline-none transition-all font-medium cursor-pointer"
            >
              <option value="ALL">Semua Kategori</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50/80 hover:bg-white focus:bg-white border border-gray-200 focus:border-[#2DB24A] rounded-xl text-xs text-gray-700 outline-none transition-all font-medium cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="Buka">Buka</option>
              <option value="Sedang Berjalan">Sedang Berjalan</option>
              <option value="Selesai">Selesai</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-none">
          {(['ALL', 'Pengembangan Produk', 'Pemasaran', 'Distribusi'] as const).map((filter) => {
            const isActive = activeTypeFilter === filter
            const label = filter === 'ALL' ? 'Semua' : filter
            return (
              <button
                key={filter}
                onClick={() => setActiveTypeFilter(filter)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
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
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="font-sora text-sm font-bold text-gray-800">Tidak ada peluang kolaborasi ditemukan</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Jadilah yang pertama membuat peluang kolaborasi patungan atau sinergi usaha antar-anggota.
            </p>
            <button onClick={handleOpenCreate} className="text-xs text-[#2DB24A] font-bold hover:underline">
              + Buat Peluang Kolaborasi Baru
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setDetailItem(item)}
                className="group p-4 sm:p-5 rounded-2xl border border-gray-200/90 hover:border-[#2DB24A]/50 bg-white hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer"
              >
                {/* Left: Thumbnail & Content */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 border border-gray-150 relative bg-gray-100">
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

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 font-medium">
                      <span className="font-semibold text-gray-700">{item.category}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        {item.location}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="pt-1 flex items-center gap-4 text-xs text-gray-400">
                      <button
                        onClick={(e) => handleToggleLike(item.id, e)}
                        className="flex items-center gap-1 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        <Heart className="w-3.5 h-3.5" />
                        <span>{item.likesCount}</span>
                      </button>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{item.commentsCount}</span>
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold">
                        {item.status}
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
                <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-extrabold uppercase">
                  {detailItem.type}
                </span>
                <h3 className="font-sora text-lg font-black text-gray-900">{detailItem.title}</h3>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  {detailItem.location} • {detailItem.category}
                </p>
              </div>
            </div>

            <div className="space-y-2 border-t border-gray-100 pt-3">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Rincian Proyek Kolaborasi</h4>
              <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{detailItem.description}</p>
            </div>

            {detailItem.initiatorName && (
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 text-xs flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Inisiator Proyek:</span>
                  <span className="font-bold text-gray-900">{detailItem.initiatorName}</span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-[#0F5132] font-black text-[10px]">
                  Status: {detailItem.status}
                </span>
              </div>
            )}

            <div className="space-y-2 border-t border-gray-100 pt-3">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Gabung / Respon Kolaborasi</h4>
              {detailItem.contactPhone && (
                <a
                  href={`https://wa.me/${detailItem.contactPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Halo ${detailItem.initiatorName || 'Inisiator'}, saya tertarik ikut serta dalam proyek kolaborasi: ${detailItem.title} di Saloka.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 bg-[#2DB24A] hover:bg-[#24943E] text-white text-xs font-extrabold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <Phone className="w-4 h-4" />
                  <span>Hubungi Inisiator via WhatsApp</span>
                </a>
              )}
            </div>

            {/* Edit / Delete actions */}
            {(detailItem.isCustom || isCanManage) && (
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                <button
                  onClick={(e) => handleOpenEdit(detailItem, e)}
                  className="text-gray-600 hover:text-blue-700 font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Proyek</span>
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
                {editingItem ? 'Edit Peluang Kolaborasi' : 'Buat Peluang Kolaborasi Baru'}
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
                <label className="block text-xs font-bold text-gray-700 mb-1">Judul Peluang Kolaborasi *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Contoh: Pengembangan Kemasan Produk UMKM"
                  className="w-full px-3 py-2 border border-gray-250 rounded-xl text-xs text-gray-800 focus:border-[#2DB24A] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tipe Kolaborasi</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-250 rounded-xl text-xs text-gray-800 focus:border-[#2DB24A] outline-none"
                  >
                    <option value="Pengembangan Produk">Pengembangan Produk</option>
                    <option value="Pemasaran">Pemasaran</option>
                    <option value="Distribusi">Distribusi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Kategori</label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="Contoh: Desain Produk"
                    className="w-full px-3 py-2 border border-gray-250 rounded-xl text-xs text-gray-800 focus:border-[#2DB24A] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Lokasi</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="Contoh: Yogyakarta, DIY"
                    className="w-full px-3 py-2 border border-gray-250 rounded-xl text-xs text-gray-800 focus:border-[#2DB24A] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-250 rounded-xl text-xs text-gray-800 focus:border-[#2DB24A] outline-none"
                  >
                    <option value="Buka">Buka</option>
                    <option value="Sedang Berjalan">Sedang Berjalan</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nama Inisiator *</label>
                  <input
                    type="text"
                    required
                    value={formInitiatorName}
                    onChange={(e) => setFormInitiatorName(e.target.value)}
                    placeholder="Contoh: Rudi Hartono"
                    className="w-full px-3 py-2 border border-gray-250 rounded-xl text-xs text-gray-800 focus:border-[#2DB24A] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nomor WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={formContactPhone}
                    onChange={(e) => setFormContactPhone(e.target.value)}
                    placeholder="Contoh: 628123456789"
                    className="w-full px-3 py-2 border border-gray-250 rounded-xl text-xs text-gray-800 focus:border-[#2DB24A] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Deskripsi Rincian Kolaborasi *</label>
                <textarea
                  required
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Jelaskan kebutuhan partner, target patungan, kuota kapasitas, atau pembagian peran..."
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
                  {editingItem ? 'Simpan Perubahan' : 'Terbitkan Peluang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
