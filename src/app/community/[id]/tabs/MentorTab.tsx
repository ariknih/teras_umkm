'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Search,
  Bookmark,
  PlusCircle,
  X,
  Phone,
  Star,
  Award,
  CheckCircle2,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  GraduationCap
} from 'lucide-react'
import {
  MentorItem,
  INITIAL_MENTOR,
  loadFeatureData,
  saveFeatureData
} from './communityFeaturesStore'

interface MentorTabProps {
  communityId: string
  communityName?: string
  isCanManage?: boolean
}

export default function MentorTab({
  communityId,
  communityName = 'Komunitas',
  isCanManage = false
}: MentorTabProps) {
  const [items, setItems] = useState<MentorItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')

  // Modals
  const [detailItem, setDetailItem] = useState<MentorItem | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MentorItem | null>(null)

  // Form inputs
  const [formName, setFormName] = useState('')
  const [formRoleHeadline, setFormRoleHeadline] = useState('')
  const [formCategory, setFormCategory] = useState('Pemasaran')
  const [formBio, setFormBio] = useState('')
  const [formAvatarUrl, setFormAvatarUrl] = useState('')
  const [formTags, setFormTags] = useState('Digital Marketing, E-commerce')
  const [formHourlyRate, setFormHourlyRate] = useState('Gratis untuk Anggota')
  const [formContactPhone, setFormContactPhone] = useState('')

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Load data
  useEffect(() => {
    const data = loadFeatureData(communityId, 'mentor', INITIAL_MENTOR)
    setItems(data)
    setIsLoaded(true)
  }, [communityId])

  const syncItems = (updated: MentorItem[]) => {
    setItems(updated)
    saveFeatureData(communityId, 'mentor', updated)
  }

  // Bookmark toggle
  const handleToggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = items.map((it) => {
      if (it.id === id) {
        const nextState = !it.isBookmarked
        showToast(nextState ? 'Mentor disimpan ke bookmark' : 'Bookmark dihapus')
        return { ...it, isBookmarked: nextState }
      }
      return it
    })
    syncItems(updated)
  }

  // Open Create Form
  const handleOpenCreate = () => {
    setEditingItem(null)
    setFormName('')
    setFormRoleHeadline('')
    setFormCategory('Pemasaran')
    setFormBio('')
    setFormAvatarUrl('')
    setFormTags('Digital Marketing, E-commerce')
    setFormHourlyRate('Gratis untuk Anggota')
    setFormContactPhone('6281234567890')
    setIsFormOpen(true)
  }

  // Open Edit Form
  const handleOpenEdit = (item: MentorItem, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setEditingItem(item)
    setFormName(item.name)
    setFormRoleHeadline(item.roleHeadline)
    setFormCategory(item.category)
    setFormBio(item.bio)
    setFormAvatarUrl(item.avatarUrl)
    setFormTags(item.tags.join(', '))
    setFormHourlyRate(item.hourlyRate || 'Gratis untuk Anggota')
    setFormContactPhone(item.contactPhone || '')
    setIsFormOpen(true)
    if (detailItem) setDetailItem(null)
  }

  // Delete Mentor
  const handleDeleteItem = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!window.confirm('Yakin ingin menghapus profil mentor ini?')) return
    const updated = items.filter((it) => it.id !== id)
    syncItems(updated)
    if (detailItem?.id === id) setDetailItem(null)
    showToast('Profil mentor berhasil dihapus')
  }

  // Submit Form (Create / Edit)
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || !formRoleHeadline.trim() || !formBio.trim()) {
      alert('Nama, spesialisasi, dan biografi mentor wajib diisi!')
      return
    }

    const defaultAvatar =
      formAvatarUrl.trim() ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'

    const parsedTags = formTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    if (editingItem) {
      const updated = items.map((it) =>
        it.id === editingItem.id
          ? {
              ...it,
              name: formName,
              roleHeadline: formRoleHeadline,
              category: formCategory,
              bio: formBio,
              avatarUrl: defaultAvatar,
              tags: parsedTags.length > 0 ? parsedTags : ['Mentor UMKM'],
              hourlyRate: formHourlyRate,
              contactPhone: formContactPhone
            }
          : it
      )
      syncItems(updated)
      showToast('Profil mentor berhasil diperbarui')
    } else {
      const newItem: MentorItem = {
        id: `mnt-${Date.now()}`,
        name: formName,
        roleHeadline: formRoleHeadline,
        category: formCategory,
        rating: 5.0,
        sessionsCount: 1,
        tags: parsedTags.length > 0 ? parsedTags : ['Mentor UMKM'],
        avatarUrl: defaultAvatar,
        bio: formBio,
        hourlyRate: formHourlyRate || 'Gratis untuk Anggota',
        contactPhone: formContactPhone,
        isBookmarked: false,
        createdAt: new Date().toISOString().split('T')[0],
        isCustom: true
      }
      syncItems([newItem, ...items])
      showToast('Profil mentor baru berhasil ditambahkan!')
    }

    setIsFormOpen(false)
  }

  // Categories list
  const categoriesList = useMemo(() => {
    const set = new Set(items.map((i) => i.category))
    return Array.from(set)
  }, [items])

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        searchQuery === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.roleHeadline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchCategory = selectedCategory === 'ALL' || item.category === selectedCategory

      return matchSearch && matchCategory
    })
  }, [items, searchQuery, selectedCategory])

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-[#0F5132] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container Card */}
      <div className="bg-white border border-gray-200/90 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 font-sora tracking-tight flex items-center gap-2">
              <span>Daftar Mentor</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold font-sans">
                {items.length} Mentor Aktif
              </span>
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Konsultasi bisnis 1-on-1 langsung bersama praktisi usaha, akademisi, dan pakar industri terverifikasi di {communityName}.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="self-start sm:self-auto px-4 py-2.5 bg-[#2DB24A] hover:bg-[#24943E] text-white text-xs font-extrabold rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Daftar Jadi Mentor</span>
          </button>
        </div>

        {/* Search & Select Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama mentor atau keahlian..."
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

          <div className="sm:col-span-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50/80 hover:bg-white focus:bg-white border border-gray-200 focus:border-[#2DB24A] rounded-xl text-xs text-gray-700 outline-none transition-all font-medium cursor-pointer"
            >
              <option value="ALL">Semua Kategori Keahlian</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mentor Cards List */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 px-4 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50 space-y-3">
            <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h4 className="font-sora text-sm font-bold text-gray-800">Tidak ada mentor ditemukan</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Coba sesuaikan kata kunci pencarian keahlian atau reset filter kategori.
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
                {/* Left: Avatar & Details */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 border border-gray-150 relative bg-purple-50 shadow-xs">
                    <img
                      src={item.avatarUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-sora text-base font-black text-gray-900 group-hover:text-[#2DB24A] transition-colors truncate">
                        {item.name}
                      </h3>
                      <Award className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
                    </div>

                    <p className="text-xs font-semibold text-gray-600">{item.roleHeadline}</p>

                    <div className="flex items-center gap-1.5 text-xs">
                      <div className="flex items-center text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-black text-gray-900 ml-1">{item.rating}</span>
                      </div>
                      <span className="text-gray-400 text-[11px]">({item.sessionsCount} sesi bimbingan)</span>
                    </div>

                    <div className="pt-1 flex flex-wrap items-center gap-1.5">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[10px] font-bold"
                        >
                          {tag}
                        </span>
                      ))}
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
              <img
                src={detailItem.avatarUrl}
                alt={detailItem.name}
                className="w-20 h-20 rounded-2xl object-cover border border-gray-200 shrink-0"
              />
              <div className="space-y-1 pr-6">
                <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-extrabold uppercase">
                  {detailItem.category}
                </span>
                <h3 className="font-sora text-lg font-black text-gray-900 flex items-center gap-1.5">
                  <span>{detailItem.name}</span>
                  <Award className="w-4 h-4 text-amber-500 fill-amber-500" />
                </h3>
                <p className="text-xs text-gray-600 font-semibold">{detailItem.roleHeadline}</p>
                <div className="flex items-center gap-2 pt-0.5 text-xs">
                  <span className="flex items-center text-amber-500 font-bold">
                    ★ {detailItem.rating}
                  </span>
                  <span className="text-gray-400">• {detailItem.sessionsCount} Sesi Selesai</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 border-t border-gray-100 pt-3">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Tentang & Pengalaman Mentor</h4>
              <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{detailItem.bio}</p>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Topik Keahlian</h4>
              <div className="flex flex-wrap gap-1.5">
                {detailItem.tags.map((t) => (
                  <span key={t} className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 text-xs flex justify-between items-center">
              <span className="text-gray-500 font-medium">Biaya Bimbingan Sesi:</span>
              <span className="font-bold text-[#0F5132]">{detailItem.hourlyRate || 'Gratis untuk Anggota'}</span>
            </div>

            <div className="space-y-2 border-t border-gray-100 pt-3">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Konsultasi / Jadwalkan Sesi</h4>
              {detailItem.contactPhone && (
                <a
                  href={`https://wa.me/${detailItem.contactPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Halo Mentor ${detailItem.name}, saya anggota ${communityName} di Saloka ingin berkonsultasi mengenai bimbingan usaha.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 bg-[#2DB24A] hover:bg-[#24943E] text-white text-xs font-extrabold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <Phone className="w-4 h-4" />
                  <span>Jadwalkan Konsultasi via WhatsApp</span>
                </a>
              )}
            </div>

            {/* Edit / Delete actions */}
            {(detailItem.isCustom || isCanManage) && (
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                <button
                  onClick={(e) => handleOpenEdit(detailItem, e)}
                  className="text-gray-600 hover:text-purple-700 font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Profil Mentor</span>
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
                {editingItem ? 'Edit Profil Mentor' : 'Daftarkan Profil Mentor Baru'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nama Lengkap & Gelar *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: Andi Pratama, S.E."
                    className="w-full px-3 py-2 border border-gray-250 rounded-xl text-xs text-gray-800 focus:border-[#2DB24A] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Kategori Keahlian</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-250 rounded-xl text-xs text-gray-800 focus:border-[#2DB24A] outline-none"
                  >
                    <option value="Pemasaran">Pemasaran</option>
                    <option value="Keuangan">Keuangan</option>
                    <option value="Legalitas">Legalitas</option>
                    <option value="Operasional">Operasional</option>
                    <option value="Teknologi">Teknologi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Spesialisasi / Headline *</label>
                <input
                  type="text"
                  required
                  value={formRoleHeadline}
                  onChange={(e) => setFormRoleHeadline(e.target.value)}
                  placeholder="Contoh: Digital Marketing & Meta Ads Specialist"
                  className="w-full px-3 py-2 border border-gray-250 rounded-xl text-xs text-gray-800 focus:border-[#2DB24A] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Biografi & Pengalaman Praktis *</label>
                <textarea
                  required
                  rows={3}
                  value={formBio}
                  onChange={(e) => setFormBio(e.target.value)}
                  placeholder="Ceritakan latar belakang usaha, pengalaman industri, dan pencapaian..."
                  className="w-full px-3 py-2 border border-gray-250 rounded-xl text-xs text-gray-800 focus:border-[#2DB24A] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tag Keahlian (Pisahkan Koma)</label>
                  <input
                    type="text"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    placeholder="Contoh: Google Ads, Copywriting"
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tarif Bimbingan</label>
                  <input
                    type="text"
                    value={formHourlyRate}
                    onChange={(e) => setFormHourlyRate(e.target.value)}
                    placeholder="Contoh: Gratis untuk Anggota"
                    className="w-full px-3 py-2 border border-gray-250 rounded-xl text-xs text-gray-800 focus:border-[#2DB24A] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">URL Foto Profil (Opsional)</label>
                  <input
                    type="url"
                    value={formAvatarUrl}
                    onChange={(e) => setFormAvatarUrl(e.target.value)}
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
                  {editingItem ? 'Simpan Perubahan' : 'Terbitkan Profil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
