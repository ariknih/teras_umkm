'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Search,
  Bookmark,
  PlusCircle,
  X,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  Building2,
  Sparkles
} from 'lucide-react'
import {
  BusinessMatchingItem,
  INITIAL_BUSINESS_MATCHING,
  loadFeatureData,
  saveFeatureData
} from './communityFeaturesStore'

interface BusinessMatchingTabProps {
  communityId: string
  communityName?: string
  isCanManage?: boolean
}

export default function BusinessMatchingTab({
  communityId,
  communityName = 'Komunitas',
  isCanManage = false
}: BusinessMatchingTabProps) {
  const [items, setItems] = useState<BusinessMatchingItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Filters state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [selectedLocation, setSelectedLocation] = useState('ALL')
  const [activeRoleFilter, setActiveRoleFilter] = useState<'ALL' | 'Reseller' | 'Distributor' | 'Investor'>('ALL')

  // Modals state
  const [detailItem, setDetailItem] = useState<BusinessMatchingItem | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<BusinessMatchingItem | null>(null)

  // Form inputs
  const [formTitle, setFormTitle] = useState('')
  const [formCategory, setFormCategory] = useState('Food & Beverage')
  const [formLocation, setFormLocation] = useState('')
  const [formRoleType, setFormRoleType] = useState<BusinessMatchingItem['roleType']>('Produsen')
  const [formDescription, setFormDescription] = useState('')
  const [formImageUrl, setFormImageUrl] = useState('')
  const [formContactPhone, setFormContactPhone] = useState('')
  const [formMinOrder, setFormMinOrder] = useState('')

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Load data on mount
  useEffect(() => {
    const data = loadFeatureData(communityId, 'business_matching', INITIAL_BUSINESS_MATCHING)
    setItems(data)
    setIsLoaded(true)
  }, [communityId])

  // Sync to local storage
  const syncItems = (updated: BusinessMatchingItem[]) => {
    setItems(updated)
    saveFeatureData(communityId, 'business_matching', updated)
  }

  // Toggle Bookmark
  const handleToggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = items.map((it) => {
      if (it.id === id) {
        const nextState = !it.isBookmarked
        showToast(nextState ? 'Berhasil disimpan ke bookmark' : 'Bookmark dihapus')
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
    setFormCategory('Food & Beverage')
    setFormLocation('Bandung, Jawa Barat')
    setFormRoleType('Produsen')
    setFormDescription('')
    setFormImageUrl('')
    setFormContactPhone('6281234567890')
    setFormMinOrder('')
    setIsFormOpen(true)
  }

  // Open Edit Form
  const handleOpenEdit = (item: BusinessMatchingItem, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setEditingItem(item)
    setFormTitle(item.title)
    setFormCategory(item.category)
    setFormLocation(item.location)
    setFormRoleType(item.roleType)
    setFormDescription(item.description)
    setFormImageUrl(item.imageUrl)
    setFormContactPhone(item.contactPhone || '')
    setFormMinOrder(item.minOrder || '')
    setIsFormOpen(true)
    if (detailItem) setDetailItem(null)
  }

  // Delete Item
  const handleDeleteItem = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!window.confirm('Yakin ingin menghapus peluang kemitraan bisnis ini?')) return
    const updated = items.filter((it) => it.id !== id)
    syncItems(updated)
    if (detailItem?.id === id) setDetailItem(null)
    showToast('Peluang kemitraan berhasil dihapus')
  }

  // Save Form (Create or Update)
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim() || !formDescription.trim()) {
      alert('Nama bisnis dan deskripsi wajib diisi!')
      return
    }

    const defaultImg =
      formImageUrl.trim() ||
      'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=400&q=80'

    if (editingItem) {
      const updated = items.map((it) =>
        it.id === editingItem.id
          ? {
              ...it,
              title: formTitle,
              category: formCategory,
              location: formLocation || 'Indonesia',
              roleType: formRoleType,
              description: formDescription,
              imageUrl: defaultImg,
              contactPhone: formContactPhone,
              minOrder: formMinOrder
            }
          : it
      )
      syncItems(updated)
      showToast('Peluang kemitraan berhasil diperbarui')
    } else {
      const newItem: BusinessMatchingItem = {
        id: `bm-${Date.now()}`,
        title: formTitle,
        category: formCategory,
        location: formLocation || 'Indonesia',
        roleType: formRoleType,
        description: formDescription,
        imageUrl: defaultImg,
        contactPhone: formContactPhone,
        minOrder: formMinOrder,
        isBookmarked: false,
        createdAt: new Date().toISOString().split('T')[0],
        isCustom: true
      }
      syncItems([newItem, ...items])
      showToast('Peluang kemitraan baru berhasil ditambahkan!')
    }

    setIsFormOpen(false)
  }

  // Unique categories & locations for dropdowns
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
        item.category.toLowerCase().includes(searchQuery.toLowerCase())

      const matchCategory = selectedCategory === 'ALL' || item.category === selectedCategory
      const matchLocation = selectedLocation === 'ALL' || item.location === selectedLocation
      const matchRole = activeRoleFilter === 'ALL' || item.roleType === activeRoleFilter

      return matchSearch && matchCategory && matchLocation && matchRole
    })
  }, [items, searchQuery, selectedCategory, selectedLocation, activeRoleFilter])

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-[#0F5132] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container Card */}
      <div className="bg-white border border-gray-200/90 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
        {/* Top Header & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 font-sora tracking-tight flex items-center gap-2">
              <span>Business Matching</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold font-sans">
                {items.length} Peluang
              </span>
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Temukan mitra bisnis terpercaya, distributor resmi, supplier, dan investor strategis di {communityName}.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="self-start sm:self-auto px-4 py-2.5 bg-[#2DB24A] hover:bg-[#24943E] text-white text-xs font-extrabold rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Pasang Peluang Bisnis</span>
          </button>
        </div>

        {/* Search & Select Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          {/* Search Box */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama bisnis, produk, atau kata kunci..."
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

          {/* Category Dropdown */}
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

          {/* Location Dropdown */}
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

          {/* Search Button */}
          <div className="sm:col-span-1">
            <button
              onClick={() => {}}
              className="w-full h-full min-h-[38px] bg-[#2DB24A] hover:bg-[#24943E] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-2xs"
            >
              Cari
            </button>
          </div>
        </div>

        {/* Filter Pills (Semua, Reseller, Distributor, Investor) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-none">
          {(['ALL', 'Reseller', 'Distributor', 'Investor'] as const).map((filter) => {
            const isActive = activeRoleFilter === filter
            const label = filter === 'ALL' ? 'Semua' : filter
            return (
              <button
                key={filter}
                onClick={() => setActiveRoleFilter(filter)}
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
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#2DB24A] flex items-center justify-center mx-auto">
              <Building2 className="w-6 h-6" />
            </div>
            <h4 className="font-sora text-sm font-bold text-gray-800">Tidak ada peluang kemitraan ditemukan</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Coba sesuaikan kata kunci pencarian atau ubah filter kategori dan lokasi Anda.
            </p>
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('ALL')
                setSelectedLocation('ALL')
                setActiveRoleFilter('ALL')
              }}
              className="text-xs text-[#2DB24A] font-bold hover:underline"
            >
              Reset Semua Filter
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
                {/* Left: Thumbnail Image + Details */}
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

                    <div className="pt-1 flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-gray-100 border border-gray-200 text-gray-700 text-[10px] font-extrabold uppercase tracking-wide">
                        {item.roleType}
                      </span>
                      {item.minOrder && (
                        <span className="text-[10px] text-gray-400 font-medium">
                          Min. Order: <strong className="text-gray-600">{item.minOrder}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Bookmark + Action Buttons */}
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
              className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
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
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
                  {detailItem.roleType}
                </span>
                <h3 className="font-sora text-lg font-black text-gray-900">{detailItem.title}</h3>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  {detailItem.location} • {detailItem.category}
                </p>
              </div>
            </div>

            <div className="space-y-2 border-t border-gray-100 pt-3">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Tentang Kemitraan</h4>
              <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{detailItem.description}</p>
            </div>

            {detailItem.minOrder && (
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200/80 text-xs flex justify-between items-center">
                <span className="text-gray-500 font-medium">Ketentuan Minimal Pemesanan:</span>
                <span className="font-bold text-gray-900">{detailItem.minOrder}</span>
              </div>
            )}

            <div className="space-y-2 border-t border-gray-100 pt-3">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Kontak Langsung</h4>
              <div className="flex flex-col gap-2">
                {detailItem.contactPhone && (
                  <a
                    href={`https://wa.me/${detailItem.contactPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      `Halo ${detailItem.title}, saya tertarik dengan peluang kemitraan Anda di Saloka.id.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3 bg-[#2DB24A] hover:bg-[#24943E] text-white text-xs font-extrabold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Hubungi via WhatsApp</span>
                  </a>
                )}
                {detailItem.contactEmail && (
                  <a
                    href={`mailto:${detailItem.contactEmail}`}
                    className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span>Kirim Email Kemitraan</span>
                  </a>
                )}
              </div>
            </div>

            {/* Edit / Delete actions for custom item or manager */}
            {(detailItem.isCustom || isCanManage) && (
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                <button
                  onClick={(e) => handleOpenEdit(detailItem, e)}
                  className="text-gray-600 hover:text-emerald-700 font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Peluang</span>
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
                {editingItem ? 'Edit Peluang Bisnis' : 'Pasang Peluang Bisnis Baru'}
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
                <label className="block text-xs font-bold text-gray-700 mb-1">Nama Bisnis / Usaha *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Contoh: Kopi Nusantara"
                  className="w-full px-3 py-2 border border-gray-250 rounded-xl text-xs text-gray-800 focus:border-[#2DB24A] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Kategori</label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="Contoh: Food & Beverage"
                    className="w-full px-3 py-2 border border-gray-250 rounded-xl text-xs text-gray-800 focus:border-[#2DB24A] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Peran Kemitraan</label>
                  <select
                    value={formRoleType}
                    onChange={(e) => setFormRoleType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-250 rounded-xl text-xs text-gray-800 focus:border-[#2DB24A] outline-none"
                  >
                    <option value="Produsen">Produsen</option>
                    <option value="Supplier">Supplier</option>
                    <option value="Distributor">Distributor</option>
                    <option value="Reseller">Reseller</option>
                    <option value="Investor">Investor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Lokasi (Kota, Provinsi)</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="Contoh: Bandung, Jawa Barat"
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
                <label className="block text-xs font-bold text-gray-700 mb-1">Deskripsi Tawaran Kemitraan *</label>
                <textarea
                  required
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Jelaskan produk, peluang kerjasama, margin reseller, atau syarat distributor..."
                  className="w-full px-3 py-2 border border-gray-250 rounded-xl text-xs text-gray-800 focus:border-[#2DB24A] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Ketentuan Min. Order (Opsional)</label>
                  <input
                    type="text"
                    value={formMinOrder}
                    onChange={(e) => setFormMinOrder(e.target.value)}
                    placeholder="Contoh: 10 Pcs / 10 Kg"
                    className="w-full px-3 py-2 border border-gray-250 rounded-xl text-xs text-gray-800 focus:border-[#2DB24A] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">URL Gambar Produk (Opsional)</label>
                  <input
                    type="url"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
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
