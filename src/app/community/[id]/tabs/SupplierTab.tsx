'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Search,
  Bookmark,
  PlusCircle,
  X,
  Phone,
  MapPin,
  Truck,
  Package,
  CheckCircle2,
  Edit2,
  Trash2,
  Building2,
  ExternalLink
} from 'lucide-react'
import {
  SupplierItem,
  INITIAL_SUPPLIER,
  loadFeatureData,
  saveFeatureData
} from './communityFeaturesStore'

interface SupplierTabProps {
  communityId: string
  communityName?: string
  isCanManage?: boolean
}

export default function SupplierTab({
  communityId,
  communityName = 'Komunitas',
  isCanManage = false
}: SupplierTabProps) {
  const [items, setItems] = useState<SupplierItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [selectedLocation, setSelectedLocation] = useState('ALL')

  // Modals
  const [detailItem, setDetailItem] = useState<SupplierItem | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<SupplierItem | null>(null)

  // Form inputs
  const [formTitle, setFormTitle] = useState('')
  const [formCategory, setFormCategory] = useState('Bahan Baku Makanan')
  const [formLocation, setFormLocation] = useState('Sleman, DIY')
  const [formDescription, setFormDescription] = useState('')
  const [formTags, setFormTags] = useState('Beras, Tepung, Gula')
  const [formMoq, setFormMoq] = useState('Min. 50 Kg')
  const [formContactPhone, setFormContactPhone] = useState('')
  const [formImageUrl1, setFormImageUrl1] = useState('')
  const [formImageUrl2, setFormImageUrl2] = useState('')

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Load data
  useEffect(() => {
    const data = loadFeatureData(communityId, 'supplier', INITIAL_SUPPLIER)
    setItems(data)
    setIsLoaded(true)
  }, [communityId])

  const syncItems = (updated: SupplierItem[]) => {
    setItems(updated)
    saveFeatureData(communityId, 'supplier', updated)
  }

  // Toggle Bookmark
  const handleToggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = items.map((it) => {
      if (it.id === id) {
        const nextState = !it.isBookmarked
        showToast(nextState ? 'Supplier disimpan ke bookmark' : 'Bookmark dihapus')
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
    setFormCategory('Bahan Baku Makanan')
    setFormLocation('Sleman, DIY')
    setFormDescription('')
    setFormTags('Beras, Tepung, Gula')
    setFormMoq('Min. 50 Kg')
    setFormContactPhone('6281234567890')
    setFormImageUrl1('')
    setFormImageUrl2('')
    setIsFormOpen(true)
  }

  // Open Edit Form
  const handleOpenEdit = (item: SupplierItem, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setEditingItem(item)
    setFormTitle(item.title)
    setFormCategory(item.category)
    setFormLocation(item.location)
    setFormDescription(item.description)
    setFormTags(item.tags.join(', '))
    setFormMoq(item.moq || '')
    setFormContactPhone(item.contactPhone || '')
    setFormImageUrl1(item.images[0] || '')
    setFormImageUrl2(item.images[1] || '')
    setIsFormOpen(true)
    if (detailItem) setDetailItem(null)
  }

  // Delete Supplier
  const handleDeleteItem = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!window.confirm('Yakin ingin menghapus supplier ini?')) return
    const updated = items.filter((it) => it.id !== id)
    syncItems(updated)
    if (detailItem?.id === id) setDetailItem(null)
    showToast('Supplier berhasil dihapus')
  }

  // Submit Form
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim() || !formDescription.trim()) {
      alert('Nama supplier dan deskripsi wajib diisi!')
      return
    }

    const defaultImages = [
      formImageUrl1.trim() ||
        'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=300&q=80',
      formImageUrl2.trim() ||
        'https://images.unsplash.com/photo-1627483262268-9c2b5b2834b5?auto=format&fit=crop&w=300&q=80'
    ]

    const parsedTags = formTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    if (editingItem) {
      const updated = items.map((it) =>
        it.id === editingItem.id
          ? {
              ...it,
              title: formTitle,
              category: formCategory,
              location: formLocation || 'Indonesia',
              description: formDescription,
              tags: parsedTags.length > 0 ? parsedTags : ['Grosir'],
              moq: formMoq,
              contactPhone: formContactPhone,
              images: defaultImages
            }
          : it
      )
      syncItems(updated)
      showToast('Data supplier berhasil diperbarui')
    } else {
      const newItem: SupplierItem = {
        id: `spl-${Date.now()}`,
        title: formTitle,
        category: formCategory,
        location: formLocation || 'Indonesia',
        description: formDescription,
        tags: parsedTags.length > 0 ? parsedTags : ['Grosir'],
        moq: formMoq,
        contactPhone: formContactPhone,
        images: defaultImages,
        isBookmarked: false,
        createdAt: new Date().toISOString().split('T')[0],
        isCustom: true
      }
      syncItems([newItem, ...items])
      showToast('Supplier baru berhasil didaftarkan!')
    }

    setIsFormOpen(false)
  }

  // Categories & Locations
  const categoriesList = useMemo(() => {
    const set = new Set(items.map((i) => i.category))
    return Array.from(set)
  }, [items])

  const locationsList = useMemo(() => {
    const set = new Set(items.map((i) => i.location))
    return Array.from(set)
  }, [items])

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        searchQuery === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchCategory = selectedCategory === 'ALL' || item.category === selectedCategory
      const matchLocation = selectedLocation === 'ALL' || item.location === selectedLocation

      return matchSearch && matchCategory && matchLocation
    })
  }, [items, searchQuery, selectedCategory, selectedLocation])

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
              <span>Supplier</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold font-sans">
                {items.length} Pemasok Resmi
              </span>
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Dapatkan pasokan bahan baku segar, kemasan food-grade, dan bumbu rempah harga grosir khusus anggota di {communityName}.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="self-start sm:self-auto px-4 py-2.5 bg-[#2DB24A] hover:bg-[#24943E] text-white text-xs font-extrabold rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Daftarkan Supplier</span>
          </button>
        </div>

        {/* Search & Select Row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari produk atau supplier..."
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
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50/80 hover:bg-white focus:bg-white border border-gray-200 focus:border-[#2DB24A] rounded-xl text-xs text-gray-700 outline-none transition-all font-medium cursor-pointer"
            >
              <option value="ALL">Semua Lokasi</option>
              {locationsList.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Cards List */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 px-4 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50 space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Truck className="w-6 h-6" />
            </div>
            <h4 className="font-sora text-sm font-bold text-gray-800">Tidak ada supplier ditemukan</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Coba sesuaikan kata kunci pencarian produk atau ubah filter lokasi gudang.
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
                {/* Left: Dual Thumbnail Image & Details */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="flex gap-1.5 shrink-0">
                    {item.images.slice(0, 2).map((img, idx) => (
                      <div
                        key={idx}
                        className="w-14 h-20 sm:w-16 sm:h-24 rounded-xl overflow-hidden border border-gray-150 bg-gray-100"
                      >
                        <img
                          src={img}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ))}
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

                    <div className="pt-1 flex flex-wrap items-center gap-1.5">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[10px] font-bold"
                        >
                          {tag}
                        </span>
                      ))}
                      {item.moq && (
                        <span className="text-[10px] text-gray-400 font-medium ml-2">
                          MOQ: <strong className="text-gray-600">{item.moq}</strong>
                        </span>
                      )}
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
                    Lihat Profil
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
              <div className="flex gap-1.5 shrink-0">
                {detailItem.images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={detailItem.title}
                    className="w-16 h-20 rounded-xl object-cover border border-gray-200"
                  />
                ))}
              </div>
              <div className="space-y-1 pr-6">
                <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-extrabold uppercase">
                  {detailItem.category}
                </span>
                <h3 className="font-sora text-lg font-black text-gray-900">{detailItem.title}</h3>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  {detailItem.location}
                </p>
              </div>
            </div>

            <div className="space-y-2 border-t border-gray-100 pt-3">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Katalog Pasokan & Layanan</h4>
              <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{detailItem.description}</p>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Komoditas yang Disediakan</h4>
              <div className="flex flex-wrap gap-1.5">
                {detailItem.tags.map((t) => (
                  <span key={t} className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-800 text-xs font-bold">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {detailItem.moq && (
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 text-xs flex justify-between items-center">
                <span className="text-gray-500 font-medium">Minimal Pemesanan Grosir (MOQ):</span>
                <span className="font-black text-gray-900">{detailItem.moq}</span>
              </div>
            )}

            <div className="space-y-2 border-t border-gray-100 pt-3">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Minta Penawaran / Sampel</h4>
              {detailItem.contactPhone && (
                <a
                  href={`https://wa.me/${detailItem.contactPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Halo ${detailItem.title}, saya anggota ${communityName} di Saloka ingin menanyakan katalog harga grosir dan sampel produk.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 bg-[#2DB24A] hover:bg-[#24943E] text-white text-xs font-extrabold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <Phone className="w-4 h-4" />
                  <span>Hubungi Supplier via WhatsApp</span>
                </a>
              )}
            </div>

            {/* Edit / Delete actions */}
            {(detailItem.isCustom || isCanManage) && (
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                <button
                  onClick={(e) => handleOpenEdit(detailItem, e)}
                  className="text-gray-600 hover:text-rose-700 font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Supplier</span>
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
                {editingItem ? 'Edit Supplier' : 'Daftarkan Supplier Baru'}
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
                <label className="block text-xs font-bold text-gray-700 mb-1">Nama Usaha / PT / Toko Grosir *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Contoh: PT Sumber Bahan Pangan"
                  className="w-full px-3 py-2 border border-gray-250 rounded-xl text-xs text-gray-800 focus:border-[#2DB24A] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Kategori Pasokan</label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="Contoh: Bahan Baku Makanan / Kemasan"
                    className="w-full px-3 py-2 border border-gray-250 rounded-xl text-xs text-gray-800 focus:border-[#2DB24A] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Lokasi Gudang / Kota</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="Contoh: Sleman, DIY"
                    className="w-full px-3 py-2 border border-gray-250 rounded-xl text-xs text-gray-800 focus:border-[#2DB24A] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Ketentuan MOQ</label>
                  <input
                    type="text"
                    value={formMoq}
                    onChange={(e) => setFormMoq(e.target.value)}
                    placeholder="Contoh: Min. 50 Kg / 100 Pcs"
                    className="w-full px-3 py-2 border border-gray-250 rounded-xl text-xs text-gray-800 focus:border-[#2DB24A] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Deskripsi Pasokan & Keunggulan Grosir *</label>
                <textarea
                  required
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Jelaskan kualitas pasokan, kapasitas stok, sertifikasi (Halal/Food-grade)..."
                  className="w-full px-3 py-2 border border-gray-250 rounded-xl text-xs text-gray-800 focus:border-[#2DB24A] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tag Komoditas (Pisahkan Koma)</label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="Contoh: Beras, Tepung, Gula"
                  className="w-full px-3 py-2 border border-gray-250 rounded-xl text-xs text-gray-800 focus:border-[#2DB24A] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">URL Foto Produk 1 (Opsional)</label>
                  <input
                    type="url"
                    value={formImageUrl1}
                    onChange={(e) => setFormImageUrl1(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-gray-250 rounded-xl text-xs text-gray-800 focus:border-[#2DB24A] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">URL Foto Produk 2 (Opsional)</label>
                  <input
                    type="url"
                    value={formImageUrl2}
                    onChange={(e) => setFormImageUrl2(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-gray-250 rounded-xl text-xs text-gray-800 focus:border-[#2DB24A] outline-none"
                  />
                </div>
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
                  {editingItem ? 'Simpan Perubahan' : 'Daftarkan Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
