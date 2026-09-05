'use client'

import { useState, useEffect, useTransition } from 'react'
import { mockKelurahans } from '@/lib/mock-snackbox'
import { Search, Plus, Check, Loader2, Globe, MapPin, Building, Trash2, Edit3, Power } from 'lucide-react'
import { Kelurahan } from '@/types/snackbox'

const STORAGE_KEY = 'admin_coverage_kelurahans'

const QUICK_SEARCH_EXAMPLES = [
  'Kebongedang',
  'Kujangsari',
  'Menteng',
  'Gubeng',
  'Coblong',
  'Kuta'
]

export default function KelurahanTab() {
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Master Kelurahan State (hydrated from localStorage or fallback to default mock)
  const [kelurahans, setKelurahans] = useState<any[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  const [kelurahanSearch, setKelurahanSearch] = useState('')
  const [isKelurahanModalOpen, setIsKelurahanModalOpen] = useState(false)
  const [activeModalTab, setActiveModalTab] = useState<'search' | 'manual'>('search')
  const [editingKelurahan, setEditingKelurahan] = useState<any | null>(null)

  // Live Nationwide Search State
  const [nationwideQuery, setNationwideQuery] = useState('')
  const [nationwideResults, setNationwideResults] = useState<Kelurahan[]>([])
  const [isSearchingNationwide, setIsSearchingNationwide] = useState(false)

  // Manual Form State
  const [kelurahanForm, setKelurahanForm] = useState({
    name: '',
    kecamatan: '',
    kota: '',
    province: '',
    postalCode: ''
  })

  // Hydrate on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setKelurahans(parsed)
          setIsHydrated(true)
          return
        }
      }
    } catch (e) {
      console.warn('Failed to load admin kelurahan storage:', e)
    }
    setKelurahans(mockKelurahans || [])
    setIsHydrated(true)
  }, [])

  // Persist to storage
  const persistKelurahans = (updated: any[]) => {
    setKelurahans(updated)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch (e) {
      console.warn('Failed to persist admin kelurahan storage:', e)
    }
  }

  // Debounced search for nationwide kelurahan API
  useEffect(() => {
    if (activeModalTab !== 'search' || !isKelurahanModalOpen) return
    const trimmed = nationwideQuery.trim()
    if (trimmed.length < 2) {
      setNationwideResults([])
      setIsSearchingNationwide(false)
      return
    }

    setIsSearchingNationwide(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/kelurahan/search?q=${encodeURIComponent(trimmed)}`)
        if (res.ok) {
          const json = await res.json()
          if (json.success && Array.isArray(json.data)) {
            setNationwideResults(json.data)
          } else {
            setNationwideResults([])
          }
        }
      } catch (err) {
        console.error('Failed to search nationwide kelurahans:', err)
      } finally {
        setIsSearchingNationwide(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [nationwideQuery, activeModalTab, isKelurahanModalOpen])

  // Quick 1-click activate from nationwide search
  const handleActivateFromSearch = (item: Kelurahan) => {
    const exists = kelurahans.some(
      k => k.id === item.id || (k.name.toLowerCase() === item.name.toLowerCase() && k.kota.toLowerCase() === item.kota.toLowerCase())
    )

    if (exists) {
      // Toggle to active if currently inactive
      const updated = kelurahans.map(k => {
        if (k.id === item.id || (k.name.toLowerCase() === item.name.toLowerCase() && k.kota.toLowerCase() === item.kota.toLowerCase())) {
          return { ...k, isActive: true }
        }
        return k
      })
      persistKelurahans(updated)
      setActionSuccess(`Coverage Kel. ${item.name} (${item.kota}) diaktifkan.`)
    } else {
      const newEntry = {
        id: item.id || `kel-${Date.now()}`,
        name: item.name,
        kecamatan: item.kecamatan,
        kota: item.kota,
        province: item.province || '',
        postalCode: item.postalCode,
        totalSnacksCount: 0,
        isActive: true
      }
      persistKelurahans([newEntry, ...kelurahans])
      setActionSuccess(`Kel. ${item.name} (${item.kota}) berhasil ditambahkan ke daftar coverage area aktif!`)
    }

    setTimeout(() => setActionSuccess(null), 4000)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-250 font-inter">
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2 shadow-2xs">
          <span>✅</span>
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Header & Controls */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#006E24]" />
              <h3 className="font-sora text-sm font-bold uppercase tracking-wider text-[#0F5132]">
                Master Kelurahan & Coverage Area Snackbox
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Kelola wilayah operasional, pemetaan mitra kue lokal, dan jangkauan pengiriman Snackbox Saloka per kelurahan.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setEditingKelurahan(null)
                setActiveModalTab('search')
                setNationwideQuery('')
                setIsKelurahanModalOpen(true)
              }}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#006E24] hover:bg-[#005a1d] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-xs border-none flex items-center justify-center gap-2"
            >
              <Globe className="w-4 h-4" />
              <span>Cari & Tambah Kelurahan se-Indonesia</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative max-w-md w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter kelurahan, kecamatan, kota di daftar aktif..."
              value={kelurahanSearch}
              onChange={e => setKelurahanSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0F5132] transition-all"
            />
          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            Total Coverage Aktif: <strong className="text-slate-900 font-bold">{kelurahans.filter(k => k.isActive !== false).length}</strong> dari {kelurahans.length} wilayah terdaftar
          </div>
        </div>
      </div>

      {/* Kelurahan Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto shadow-xs">
        <table className="w-full min-w-[850px] text-xs text-left">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
            <tr>
              <th className="px-5 py-3.5">Nama Kelurahan</th>
              <th className="px-5 py-3.5">Kecamatan & Kota</th>
              <th className="px-5 py-3.5 text-center">Kode Pos</th>
              <th className="px-5 py-3.5 text-center">Mitra Kue Terdaftar</th>
              <th className="px-5 py-3.5 text-center">Status Operasional</th>
              <th className="px-5 py-3.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(() => {
              const filtered = kelurahans.filter(k =>
                (k.name || '').toLowerCase().includes(kelurahanSearch.toLowerCase()) ||
                (k.kecamatan || '').toLowerCase().includes(kelurahanSearch.toLowerCase()) ||
                (k.kota || '').toLowerCase().includes(kelurahanSearch.toLowerCase()) ||
                (k.postalCode || '').includes(kelurahanSearch)
              )

              if (filtered.length === 0) {
                return (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Building className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-600 font-semibold text-xs">
                        Tidak ada kelurahan yang cocok dengan pencarian "{kelurahanSearch}".
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1 mb-3">
                        Kelurahan ini belum terdaftar di tabel coverage operasional.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingKelurahan(null)
                          setActiveModalTab('search')
                          setNationwideQuery(kelurahanSearch)
                          setIsKelurahanModalOpen(true)
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 text-[#006E24] border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>Cari "{kelurahanSearch}" di Database se-Indonesia</span>
                      </button>
                    </td>
                  </tr>
                )
              }

              return filtered.map(k => (
                <tr key={k.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#006E24] shrink-0" />
                      <span>Kel. {k.name}</span>
                    </p>
                    <span className="text-[10px] font-mono text-slate-400">ID: {k.id}</span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-800">Kec. {k.kecamatan}</p>
                    <p className="text-[11px] text-slate-500">{k.kota}{k.province ? `, ${k.province}` : ''}</p>
                  </td>
                  <td className="px-5 py-4 text-center font-mono font-bold text-slate-700">
                    {k.postalCode || '-'}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#E8F5E9] text-[#006E24] border border-[#C8E6C9] inline-block">
                      {k.totalSnacksCount || 8} Menu Kue
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                      k.isActive !== false
                        ? 'bg-emerald-50 text-[#006E24] border-[#006E24]/30'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {k.isActive !== false ? 'Aktif (Coverage)' : 'Non-Aktif'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = kelurahans.map(item =>
                            item.id === k.id ? { ...item, isActive: item.isActive === false ? true : false } : item
                          )
                          persistKelurahans(updated)
                          setActionSuccess(`Status operasional Kel. ${k.name} berhasil diperbarui.`)
                          setTimeout(() => setActionSuccess(null), 3000)
                        }}
                        className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg transition-colors cursor-pointer border flex items-center gap-1 ${
                          k.isActive !== false
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-[#006E24] border-emerald-200'
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        <span>{k.isActive !== false ? 'Nonaktifkan' : 'Aktifkan'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingKelurahan(k)
                          setActiveModalTab('manual')
                          setKelurahanForm({
                            name: k.name,
                            kecamatan: k.kecamatan,
                            kota: k.kota,
                            province: k.province || '',
                            postalCode: k.postalCode
                          })
                          setIsKelurahanModalOpen(true)
                        }}
                        className="px-2.5 py-1 bg-[#006E24]/10 hover:bg-[#006E24]/20 text-[#006E24] text-[10px] font-bold uppercase rounded-lg transition-colors cursor-pointer border border-[#006E24]/20 flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Hapus kelurahan "${k.name}" dari master data coverage?`)) {
                            const updated = kelurahans.filter(item => item.id !== k.id)
                            persistKelurahans(updated)
                            setActionSuccess(`Kelurahan "${k.name}" berhasil dihapus.`)
                            setTimeout(() => setActionSuccess(null), 3000)
                          }
                        }}
                        className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold uppercase rounded-lg transition-colors cursor-pointer border border-red-200 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            })()}
          </tbody>
        </table>
      </div>

      {/* ─── MODAL CARI SE-INDONESIA & INPUT KELURAHAN ───────────────────────────── */}
      {isKelurahanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#006E24]" />
                <h3 className="font-sora text-sm font-bold text-slate-900 uppercase tracking-wider">
                  {editingKelurahan ? 'Edit Data Kelurahan' : 'Tambah & Cari Kelurahan se-Indonesia'}
                </h3>
              </div>
              <button
                onClick={() => setIsKelurahanModalOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs (Search Nationwide vs Manual Entry) */}
            {!editingKelurahan && (
              <div className="flex border-b border-slate-200 bg-slate-50/80 px-6 pt-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveModalTab('search')}
                  className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    activeModalTab === 'search'
                      ? 'border-[#006E24] text-[#006E24]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  🔍 Cari di Seluruh Indonesia (80.000+ Wilayah)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModalTab('manual')}
                  className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    activeModalTab === 'manual'
                      ? 'border-[#006E24] text-[#006E24]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  ✍️ Input Manual
                </button>
              </div>
            )}

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {activeModalTab === 'search' && !editingKelurahan ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                      Ketik Nama Kelurahan, Kecamatan, Kota, atau Kode Pos:
                    </label>
                    <div className="relative">
                      {isSearchingNationwide ? (
                        <Loader2 className="w-4 h-4 text-[#006E24] animate-spin absolute left-3.5 top-1/2 -translate-y-1/2" />
                      ) : (
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      )}
                      <input
                        type="text"
                        autoFocus
                        value={nationwideQuery}
                        onChange={e => setNationwideQuery(e.target.value)}
                        placeholder="e.g. Kebongedang, Kujangsari, Menteng, Gubeng..."
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#006E24] focus:ring-1 focus:ring-[#006E24]/20 transition-all shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Quick Suggestions */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-500 font-semibold">Contoh:</span>
                    {QUICK_SEARCH_EXAMPLES.map(ex => (
                      <button
                        key={ex}
                        type="button"
                        onClick={() => setNationwideQuery(ex)}
                        className="text-[11px] px-2.5 py-0.5 rounded-full border bg-slate-50 border-slate-200 text-slate-600 hover:border-[#006E24] hover:text-[#006E24] transition-all cursor-pointer"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>

                  {/* Search Results List */}
                  <div className="space-y-2 pt-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Hasil Pencarian Nasional {nationwideResults.length > 0 ? `(${nationwideResults.length} Ditemukan)` : ''}:
                    </p>

                    {isSearchingNationwide ? (
                      <div className="py-8 text-center text-slate-500 text-xs">
                        <Loader2 className="w-6 h-6 text-[#006E24] animate-spin mx-auto mb-2" />
                        <p>Mencari kelurahan di 38 provinsi...</p>
                      </div>
                    ) : nationwideQuery.trim().length < 2 ? (
                      <div className="py-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                        Ketik minimal 2 huruf nama kelurahan atau kota untuk mencari.
                      </div>
                    ) : nationwideResults.length === 0 ? (
                      <div className="py-8 text-center text-slate-500 text-xs border border-dashed border-slate-200 rounded-xl">
                        Tidak ditemukan hasil untuk "{nationwideQuery}". Coba kata kunci lain atau gunakan tab "Input Manual".
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                        {nationwideResults.map(item => {
                          const isAlreadyAdded = kelurahans.some(
                            k => k.id === item.id || (k.name.toLowerCase() === item.name.toLowerCase() && k.kota.toLowerCase() === item.kota.toLowerCase())
                          )

                          return (
                            <div
                              key={item.id}
                              className="p-3 bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-200 rounded-xl flex items-center justify-between gap-3 transition-all"
                            >
                              <div className="min-w-0">
                                <p className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-[#006E24] shrink-0" />
                                  <span>Kel. {item.name}</span>
                                  {item.postalCode && (
                                    <span className="text-[10px] font-mono font-normal text-slate-500">
                                      ({item.postalCode})
                                    </span>
                                  )}
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                                  Kec. {item.kecamatan}, {item.kota}{item.province ? `, ${item.province}` : ''}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleActivateFromSearch(item)}
                                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs ${
                                  isAlreadyAdded
                                    ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                    : 'bg-[#006E24] hover:bg-[#005a1d] text-white'
                                }`}
                              >
                                {isAlreadyAdded ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Sudah Ada</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>+ Aktifkan</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Manual Form */
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (!kelurahanForm.name || !kelurahanForm.kecamatan || !kelurahanForm.postalCode) {
                      alert('Nama, kecamatan, dan kode pos wajib diisi.')
                      return
                    }

                    if (editingKelurahan) {
                      const updated = kelurahans.map(k => k.id === editingKelurahan.id ? { ...k, ...kelurahanForm } : k)
                      persistKelurahans(updated)
                      setActionSuccess(`Kelurahan "${kelurahanForm.name}" berhasil diperbarui.`)
                    } else {
                      const newId = `kel-${Date.now()}`
                      const updated = [{ id: newId, ...kelurahanForm, totalSnacksCount: 0, isActive: true }, ...kelurahans]
                      persistKelurahans(updated)
                      setActionSuccess(`Kelurahan baru "${kelurahanForm.name}" berhasil ditambahkan ke master coverage area.`)
                    }
                    setTimeout(() => setActionSuccess(null), 3500)
                    setIsKelurahanModalOpen(false)
                  }}
                  className="space-y-3.5 text-xs"
                >
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Nama Kelurahan *</label>
                    <input
                      type="text"
                      required
                      value={kelurahanForm.name}
                      onChange={e => setKelurahanForm({ ...kelurahanForm, name: e.target.value })}
                      placeholder="e.g. Menteng, Kebongedang, Kujangsari"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#006E24]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Kecamatan *</label>
                    <input
                      type="text"
                      required
                      value={kelurahanForm.kecamatan}
                      onChange={e => setKelurahanForm({ ...kelurahanForm, kecamatan: e.target.value })}
                      placeholder="e.g. Batununggal, Bandung Kidul"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#006E24]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Kota / Kabupaten *</label>
                      <input
                        type="text"
                        required
                        value={kelurahanForm.kota}
                        onChange={e => setKelurahanForm({ ...kelurahanForm, kota: e.target.value })}
                        placeholder="Kota Bandung"
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#006E24]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Kode Pos *</label>
                      <input
                        type="text"
                        required
                        value={kelurahanForm.postalCode}
                        onChange={e => setKelurahanForm({ ...kelurahanForm, postalCode: e.target.value })}
                        placeholder="40274"
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 outline-none focus:border-[#006E24]"
                      />
                    </div>
                  </div>

                  <div className="pt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsKelurahanModalOpen(false)}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-[#006E24] hover:bg-[#005a1d] text-white font-bold rounded-lg uppercase tracking-wider transition-colors cursor-pointer border-none shadow-xs"
                    >
                      {editingKelurahan ? 'Simpan Perubahan' : 'Tambah Kelurahan'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
