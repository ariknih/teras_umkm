'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'

interface Product {
  id: string
  title: string
  description?: string
  price: number
  category: string
  stock?: number
  imageUrl?: string
  merchantId?: string
}

interface Service {
  id: string
  merchantId: string
  title: string
  description?: string
  category: string
  pricePerSession?: number
  pricePerDay?: number
  sessionDurationMinutes?: number
  maxWorkHoursPerDay?: number
  images?: string[]
  location?: string
}

interface HomeExplorerProps {
  products: Product[]
  services: Service[]
}

const PRODUCT_CATEGORIES = [
  { key: 'ALL', label: 'Semua Produk' },
  { key: 'MAKANAN_MINUMAN', label: 'Kuliner & F&B' },
  { key: 'FASHION', label: 'Fashion & Tekstil' },
  { key: 'KERAJINAN', label: 'Kerajinan Tangan' },
  { key: 'PERTANIAN', label: 'Pertanian & Pangan' },
  { key: 'ELEKTRONIK', label: 'Elektronik & Gadget' },
  { key: 'KESEHATAN', label: 'Kesehatan & Herbal' },
  { key: 'LAINNYA', label: 'Kategori Lain' }
]

const SERVICE_CATEGORIES = [
  { key: 'ALL', label: 'Semua Layanan' },
  { key: 'Desain & Multimedia', label: 'Desain & Multimedia' },
  { key: 'Teknologi & IT', label: 'Teknologi & Web' },
  { key: 'Konsultasi Bisnis', label: 'Konsultasi & Finansial' },
  { key: 'Kerajinan & Seni', label: 'Kriya & Kerajinan' },
  { key: 'Reparasi & Perawatan', label: 'Reparasi & Servis' },
  { key: 'Fotografi & Video', label: 'Foto & Videografi' },
  { key: 'Pendidikan & Kursus Privat', label: 'Kursus & Edukasi' },
  { key: 'Lainnya', label: 'Jasa Lainnya' }
]

export default function HomeExplorer({ products, services }: HomeExplorerProps) {
  const [activeTab, setActiveTab] = useState<'MARKETPLACE' | 'JASA'>('MARKETPLACE')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProductCategory, setSelectedProductCategory] = useState('ALL')
  const [selectedServiceCategory, setSelectedServiceCategory] = useState('ALL')

  // Filtered physical products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const isPhysical = p.category !== 'KERJAAN' && p.category !== 'JASA'
      const matchCat = selectedProductCategory === 'ALL' || p.category === selectedProductCategory
      const q = searchQuery.toLowerCase().trim()
      const matchSearch =
        !q ||
        p.title?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      return isPhysical && matchCat && matchSearch
    })
  }, [products, selectedProductCategory, searchQuery])

  // Filtered services
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchCat = selectedServiceCategory === 'ALL' || s.category === selectedServiceCategory
      const q = searchQuery.toLowerCase().trim()
      const matchSearch =
        !q ||
        s.title?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.category?.toLowerCase().includes(q)
      return matchCat && matchSearch
    })
  }, [services, selectedServiceCategory, searchQuery])

  return (
    <section className="w-full max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ── HEADER SWITCHER BAR ── */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#E8F5E9] border border-[#C8E6C9] rounded-full text-[#006E24] text-xs font-bold tracking-wide">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            <span>Katalog Resmi Saloka UMKM</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Pilih Layanan Ekosistem
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md">
            Temukan ribuan produk lokal berkualitas atau booking layanan jasa & keahlian terpercaya.
          </p>
        </div>

        {/* Segmented Switcher Controls */}
        <div className="bg-[#F1F5F9] p-1.5 rounded-2xl flex items-center gap-2 shadow-inner shrink-0 w-full sm:w-auto">
          <button
            onClick={() => { setActiveTab('MARKETPLACE'); setSearchQuery(''); }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
              activeTab === 'MARKETPLACE'
                ? 'bg-[#006E24] text-white shadow-md font-extrabold'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            <span>Marketplace Produk</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'MARKETPLACE' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {products.filter(p => p.category !== 'KERJAAN' && p.category !== 'JASA').length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('JASA'); setSearchQuery(''); }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
              activeTab === 'JASA'
                ? 'bg-[#006E24] text-white shadow-md font-extrabold'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
            <span>Booking Jasa</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'JASA' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {services.length}
            </span>
          </button>
        </div>
      </div>

      {/* ── SEARCH & CATEGORY FILTER BAR ── */}
      <div className="space-y-3">
        {/* Search input with live clear button */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'MARKETPLACE'
                ? 'Cari produk fisik UMKM (misal: Keripik Tempe, Batik Tulis, Madu Hutan)...'
                : 'Cari jasa & keahlian (misal: Desain Logo, Teknisi AC, Konsultan UMKM)...'
            }
            className="w-full bg-white border border-slate-300 rounded-2xl pl-11 pr-10 py-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#006E24] focus:ring-2 focus:ring-[#006E24]/20 shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>
              </svg>
            </button>
          )}
        </div>

        {/* Category Horizontal Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 hide-scrollbar">
          {activeTab === 'MARKETPLACE' ? (
            PRODUCT_CATEGORIES.map((cat) => {
              const isSelected = selectedProductCategory === cat.key
              return (
                <button
                  key={cat.key}
                  onClick={() => setSelectedProductCategory(cat.key)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer border ${
                    isSelected
                      ? 'bg-[#006E24] text-white border-[#006E24] shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {cat.label}
                </button>
              )
            })
          ) : (
            SERVICE_CATEGORIES.map((cat) => {
              const isSelected = selectedServiceCategory === cat.key
              return (
                <button
                  key={cat.key}
                  onClick={() => setSelectedServiceCategory(cat.key)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer border ${
                    isSelected
                      ? 'bg-[#006E24] text-white border-[#006E24] shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {cat.label}
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* ── PRODUCTS & SERVICES GRID ── */}
      {activeTab === 'MARKETPLACE' ? (
        /* MARKETPLACE PRODUCTS */
        <div className="space-y-4 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span>Etalase Produk UMKM</span>
              <span className="text-xs font-semibold text-slate-500">({filteredProducts.length} produk ditemukan)</span>
            </h3>
            <Link
              href="/market"
              className="text-xs font-bold text-[#006E24] hover:text-[#084e1b] hover:underline inline-flex items-center gap-1"
            >
              <span>Buka Marketplace</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
              </svg>
            </Link>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 p-8 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto text-[#006E24]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                </svg>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Produk tidak ditemukan</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Tidak ada produk yang sesuai dengan pencarian &quot;{searchQuery}&quot;.
              </p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedProductCategory('ALL'); }}
                className="px-4 py-2 bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#006E24] text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Reset Filter Pencarian
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
              {filteredProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/market/product/${product.id}`}
                  className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-lg hover:border-[#006E24]/50 transition-all duration-200 flex flex-col justify-between group"
                >
                  <div>
                    {/* Thumbnail Image */}
                    <div className="w-full aspect-square bg-slate-50 relative overflow-hidden">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-medium">
                          Saloka UMKM
                        </div>
                      )}
                      <span className="absolute top-2 left-2 bg-[#0F5132]/90 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                        {product.category}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-3 space-y-1.5">
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-[#006E24] transition-colors">
                        {product.title}
                      </h4>
                      <p className="text-sm font-extrabold text-[#006E24] font-mono">
                        Rp {product.price.toLocaleString('id-ID')}
                      </p>

                      <div className="flex items-center gap-1 text-[10px] text-slate-500 pt-0.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                        <span className="font-bold text-slate-700">4.9</span>
                        <span>•</span>
                        <span>Stok: {product.stock ?? 10}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 pt-0">
                    <span className="block w-full text-center py-2 bg-[#E8F5E9] hover:bg-[#006E24] text-[#006E24] hover:text-white text-[11px] font-bold rounded-xl transition-colors">
                      Lihat Produk
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* JASA & BOOKING */
        <div className="space-y-4 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span>Layanan Jasa & Keahlian Profesional</span>
              <span className="text-xs font-semibold text-slate-500">({filteredServices.length} penyedia aktif)</span>
            </h3>
            <Link
              href="/jasa"
              className="text-xs font-bold text-[#006E24] hover:text-[#084e1b] hover:underline inline-flex items-center gap-1"
            >
              <span>Buka Katalog Jasa</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
              </svg>
            </Link>
          </div>

          {filteredServices.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 p-8 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto text-[#006E24]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                </svg>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Layanan belum tersedia</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Tidak ada layanan jasa yang sesuai dengan pencarian &quot;{searchQuery}&quot;.
              </p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedServiceCategory('ALL'); }}
                className="px-4 py-2 bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#006E24] text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Reset Filter Pencarian
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filteredServices.map((svc) => {
                const firstImage =
                  svc.images && svc.images.length > 0
                    ? svc.images[0]
                    : 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=600&q=80'

                return (
                  <div
                    key={svc.id}
                    className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-lg hover:border-[#006E24]/50 transition-all duration-200 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Image Container */}
                      <div className="h-44 bg-slate-50 relative overflow-hidden">
                        <img
                          src={firstImage}
                          alt={svc.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-2.5 left-2.5 bg-[#0F5132]/90 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                          {svc.category}
                        </span>
                        {svc.location && (
                          <span className="absolute bottom-2.5 left-2.5 bg-white/95 text-slate-800 text-[10px] font-semibold px-2.5 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
                            </svg>
                            <span>{svc.location}</span>
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-3">
                        <h4 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-[#006E24] transition-colors">
                          {svc.title}
                        </h4>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {svc.description || 'Penyedia jasa profesional terverifikasi di platform Saloka.id.'}
                        </p>

                        {/* Pricing Badges */}
                        <div className="space-y-1.5 pt-1 border-t border-slate-100">
                          {svc.pricePerSession ? (
                            <div className="flex items-center justify-between text-xs bg-[#E8F5E9] px-2.5 py-1 rounded-lg border border-[#C8E6C9]">
                              <span className="text-[10px] font-bold text-[#006E24] uppercase">
                                Per Sesi ({svc.sessionDurationMinutes || 60} mnt)
                              </span>
                              <span className="font-mono font-extrabold text-[#006E24]">
                                Rp {svc.pricePerSession.toLocaleString('id-ID')}
                              </span>
                            </div>
                          ) : null}

                          {svc.pricePerDay ? (
                            <div className="flex items-center justify-between text-xs bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                              <span className="text-[10px] font-bold text-blue-800 uppercase">
                                Harian (Max {svc.maxWorkHoursPerDay || 8} Jam)
                              </span>
                              <span className="font-mono font-extrabold text-blue-700">
                                Rp {svc.pricePerDay.toLocaleString('id-ID')}
                              </span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 pt-0">
                      <Link
                        href={`/jasa/${svc.id}`}
                        className="w-full py-2.5 bg-[#006E24] hover:bg-[#084e1b] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
                        </svg>
                        <span>Cek Jadwal & Booking</span>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
