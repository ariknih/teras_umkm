'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Tag,
  Truck,
  Coins,
  Zap,
  Building2,
  GraduationCap,
  Wrench,
  SlidersHorizontal,
  ArrowUpDown
} from 'lucide-react'

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
  { key: 'ALL', label: 'For You' },
  { key: 'MAKANAN_MINUMAN', label: 'Kuliner & F&B' },
  { key: 'FASHION', label: 'Fashion' },
  { key: 'KERAJINAN', label: 'Kerajinan Tangan' },
  { key: 'PERTANIAN', label: 'Pertanian & Pangan' },
  { key: 'ELEKTRONIK', label: 'Elektronik & Gadget' },
  { key: 'KESEHATAN', label: 'Kesehatan & Herbal' },
  { key: 'LAINNYA', label: 'Kebutuhan Harian' }
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

const QUICK_ACTIONS = [
  { label: 'Promo UMKM', icon: Tag, color: 'text-rose-600 bg-rose-50 border-rose-200', href: '/market' },
  { label: 'Bebas Ongkir', icon: Truck, color: 'text-emerald-700 bg-emerald-50 border-emerald-200', href: '/market' },
  { label: 'Tukar Koin', icon: Coins, color: 'text-amber-600 bg-amber-50 border-amber-200', href: '/wallet/coin' },
  { label: 'Flash Sale', icon: Zap, color: 'text-orange-600 bg-orange-50 border-orange-200', href: '/market' },
  { label: 'Koperasi & Komunitas', icon: Building2, color: 'text-blue-700 bg-blue-50 border-blue-200', href: '/community' },
  { label: 'Akademi UMKM', icon: GraduationCap, color: 'text-purple-700 bg-purple-50 border-purple-200', href: '/academy' }
]

export default function HomeExplorer({ products, services }: HomeExplorerProps) {
  const [activeTab, setActiveTab] = useState<'MARKETPLACE' | 'JASA'>('MARKETPLACE')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProductCategory, setSelectedProductCategory] = useState('ALL')
  const [selectedServiceCategory, setSelectedServiceCategory] = useState('ALL')
  const [sortBy, setSortBy] = useState<'RELEVANCE' | 'PRICE_LOW' | 'PRICE_HIGH' | 'RATING'>('RELEVANCE')
  
  // 5 baris produk awal (5 baris x 6 kolom desktop = 30 produk)
  const [visibleProductCount, setVisibleProductCount] = useState(30)
  const [visibleServiceCount, setVisibleServiceCount] = useState(8)

  // Filtered and sorted physical products
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      const isPhysical = p.category !== 'KERJAAN' && p.category !== 'JASA'
      const matchCat = selectedProductCategory === 'ALL' || p.category === selectedProductCategory
      const q = searchQuery.toLowerCase().trim()
      const matchSearch =
        !q ||
        p.title?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      return isPhysical && matchCat && matchSearch
    })

    if (sortBy === 'PRICE_LOW') {
      result.sort((a, b) => a.price - b.price)
    } else if (sortBy === 'PRICE_HIGH') {
      result.sort((a, b) => b.price - a.price)
    }

    return result
  }, [products, selectedProductCategory, searchQuery, sortBy])

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

  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleProductCount)
  }, [filteredProducts, visibleProductCount])

  const displayedServices = useMemo(() => {
    return filteredServices.slice(0, visibleServiceCount)
  }, [filteredServices, visibleServiceCount])

  return (
    <section className="w-full max-w-[1240px] mx-auto px-3 sm:px-6 py-3 space-y-4">
      {/* ── TOKOPEDIA-STYLE QUICK ACTIONS BAR ── */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
        {QUICK_ACTIONS.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.label}
              href={item.href}
              className="bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl p-2.5 sm:p-3 flex flex-col items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs transition-all duration-200 group text-center"
            >
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border ${item.color} group-hover:scale-105 transition-transform duration-200`}>
                <Icon size={18} strokeWidth={2.2} />
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-800 group-hover:text-[#006E24] transition-colors leading-tight">
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>

      {/* ── HEADER SWITCHER BAR ── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#E8F5E9] border border-[#C8E6C9] rounded-full text-[#006E24] text-[11px] font-bold tracking-wide">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            <span>Katalog Resmi Saloka UMKM</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Pilih Layanan Ekosistem
          </h2>
          <p className="text-xs text-slate-600 max-w-md">
            Temukan ribuan produk lokal berkualitas atau booking layanan jasa & keahlian terpercaya.
          </p>
        </div>

        {/* Segmented Switcher Controls */}
        <div className="bg-[#F1F5F9] p-1 rounded-xl sm:rounded-2xl flex items-center gap-1.5 shadow-inner shrink-0 w-full sm:w-auto">
          <button
            onClick={() => { setActiveTab('MARKETPLACE'); setSearchQuery(''); setVisibleProductCount(30); }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
              activeTab === 'MARKETPLACE'
                ? 'bg-[#006E24] text-white shadow-sm font-extrabold'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            <span>Marketplace Produk</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              activeTab === 'MARKETPLACE' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {products.filter(p => p.category !== 'KERJAAN' && p.category !== 'JASA').length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('JASA'); setSearchQuery(''); setVisibleServiceCount(8); }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
              activeTab === 'JASA'
                ? 'bg-[#006E24] text-white shadow-sm font-extrabold'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Wrench size={16} strokeWidth={2.2} />
            <span>Booking Jasa</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              activeTab === 'JASA' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {services.length}
            </span>
          </button>
        </div>
      </div>

      {/* ── SEARCH & TOKOPEDIA-STYLE CATEGORY NAV TABS ── */}
      <div className="space-y-3 bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-xs">
        {/* Search input with live clear button */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setVisibleProductCount(30)
              setVisibleServiceCount(8)
            }}
            placeholder={
              activeTab === 'MARKETPLACE'
                ? 'Cari produk fisik UMKM (misal: Keripik Tempe, Batik Tulis, Madu Hutan)...'
                : 'Cari jasa & keahlian (misal: Desain Logo, Teknisi AC, Konsultan UMKM)...'
            }
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#006E24] focus:ring-2 focus:ring-[#006E24]/20 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('')
                setVisibleProductCount(30)
                setVisibleServiceCount(8)
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>
              </svg>
            </button>
          )}
        </div>

        {/* Tokopedia-Style Category Horizontal Navigation Bar & Quick Sort */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto border-t border-slate-100 pt-2 hide-scrollbar">
          <div className="flex items-center gap-1 sm:gap-2">
            {activeTab === 'MARKETPLACE' ? (
              PRODUCT_CATEGORIES.map((cat) => {
                const isSelected = selectedProductCategory === cat.key
                return (
                  <button
                    key={cat.key}
                    onClick={() => {
                      setSelectedProductCategory(cat.key)
                      setVisibleProductCount(30)
                    }}
                    className={`relative px-3.5 py-2 font-bold text-xs sm:text-sm whitespace-nowrap transition-all duration-150 cursor-pointer border-b-2 ${
                      isSelected
                        ? 'text-[#006E24] border-[#006E24] font-extrabold'
                        : 'text-slate-600 hover:text-slate-900 border-transparent hover:border-slate-300 font-medium'
                    }`}
                  >
                    <span>{cat.label}</span>
                  </button>
                )
              })
            ) : (
              SERVICE_CATEGORIES.map((cat) => {
                const isSelected = selectedServiceCategory === cat.key
                return (
                  <button
                    key={cat.key}
                    onClick={() => {
                      setSelectedServiceCategory(cat.key)
                      setVisibleServiceCount(8)
                    }}
                    className={`relative px-3.5 py-2 font-bold text-xs sm:text-sm whitespace-nowrap transition-all duration-150 cursor-pointer border-b-2 ${
                      isSelected
                        ? 'text-[#006E24] border-[#006E24] font-extrabold'
                        : 'text-slate-600 hover:text-slate-900 border-transparent hover:border-slate-300 font-medium'
                    }`}
                  >
                    <span>{cat.label}</span>
                  </button>
                )
              })
            )}
          </div>

          {/* Quick Sort Dropdown */}
          {activeTab === 'MARKETPLACE' && (
            <div className="flex items-center gap-1.5 shrink-0 pl-2">
              <ArrowUpDown size={14} className="text-slate-400 hidden sm:block" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Urutkan Produk"
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 outline-none focus:border-[#006E24] cursor-pointer"
              >
                <option value="RELEVANCE">Paling Sesuai</option>
                <option value="PRICE_LOW">Harga Terendah</option>
                <option value="PRICE_HIGH">Harga Tertinggi</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ── PRODUCTS & SERVICES GRID ── */}
      {activeTab === 'MARKETPLACE' ? (
        /* MARKETPLACE PRODUCTS */
        <div className="space-y-4 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span>Etalase Produk UMKM</span>
              <span className="text-xs font-medium text-slate-500">
                (Menampilkan {displayedProducts.length} dari {filteredProducts.length} produk)
              </span>
            </h3>
            <Link
              href="/market"
              className="text-xs font-bold text-[#006E24] hover:text-[#084e1b] hover:underline inline-flex items-center gap-1"
            >
              <span>Buka Marketplace Lengkap</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
              </svg>
            </Link>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto text-[#006E24]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                </svg>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Produk tidak ditemukan</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Tidak ada produk yang sesuai dengan pencarian &quot;{searchQuery}&quot;.
              </p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedProductCategory('ALL'); setVisibleProductCount(30); }}
                className="px-4 py-2 bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#006E24] text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Reset Filter Pencarian
              </button>
            </div>
          ) : (
            <>
              {/* Product Cards Grid: 5 Rows (30 items on 6-col desktop, 2-col on mobile) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
                {displayedProducts.map((product, pIdx) => {
                  const discountPct = 15 + ((pIdx * 7) % 25)
                  const originalPrice = Math.round(product.price * (1 + discountPct / 100))

                  return (
                    <Link
                      key={product.id}
                      href={`/market/product/${product.id}`}
                      className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md hover:border-[#006E24]/60 transition-all duration-200 flex flex-col justify-between group"
                    >
                      <div>
                        {/* Thumbnail Image Container */}
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

                          {/* ── GREEN DISCOUNT BADGE (Warna Hijau) ── */}
                          <span className="absolute top-1.5 left-1.5 bg-[#006E24] text-white text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-xs z-10 tracking-tight">
                            {discountPct}%
                          </span>

                          {/* Category Tag */}
                          <span className="absolute top-1.5 right-1.5 bg-white/95 text-slate-800 text-[8px] font-bold px-1.5 py-0.5 rounded shadow-xs uppercase tracking-wider">
                            {product.category}
                          </span>
                        </div>

                        {/* Tokopedia Standard Content Layout */}
                        <div className="p-2.5 sm:p-3 space-y-1">
                          {/* Title */}
                          <h4 className="text-xs font-medium text-slate-800 line-clamp-2 leading-snug group-hover:text-[#006E24] transition-colors min-h-[32px]">
                            {product.title}
                          </h4>

                          {/* Price */}
                          <p className="text-sm sm:text-[15px] font-extrabold text-slate-900 leading-tight pt-0.5 font-mono">
                            Rp {product.price.toLocaleString('id-ID')}
                          </p>

                          {/* Strikethrough & Green Discount Tag */}
                          <div className="flex items-center gap-1 text-[10px]">
                            <span className="line-through text-slate-400">
                              Rp {originalPrice.toLocaleString('id-ID')}
                            </span>
                            <span className="font-bold text-[#006E24] bg-emerald-50 px-1 py-0.2 rounded text-[9px] border border-emerald-200">
                              {discountPct}%
                            </span>
                          </div>

                          {/* Promo Pill Badge */}
                          <div className="pt-0.5">
                            <span className="text-[9px] sm:text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded inline-block">
                              Hemat s.d 8% Pakai Koin
                            </span>
                          </div>

                          {/* Rating & Stock / Terjual */}
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 pt-0.5">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                            <span className="font-bold text-slate-700">4.9</span>
                            <span>•</span>
                            <span>Terjual {product.stock ? `${product.stock}+` : '50+'}</span>
                          </div>

                          {/* Location & Store Badge */}
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 pt-0.5 truncate">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="#006E24" className="shrink-0">
                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="truncate">Saloka UMKM Official</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>

              {/* Load More Button for Products */}
              {filteredProducts.length > visibleProductCount && (
                <div className="flex flex-col items-center justify-center pt-6 pb-2 gap-2">
                  <button
                    onClick={() => setVisibleProductCount((prev) => prev + 18)}
                    className="px-7 py-3 bg-white hover:bg-emerald-50 text-[#006E24] border-2 border-[#006E24] rounded-xl font-extrabold text-xs sm:text-sm transition-all shadow-xs hover:shadow-md flex items-center gap-2 cursor-pointer group"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-y-0.5 transition-transform">
                      <path d="M12 5v14M5 12l7 7 7-7"/>
                    </svg>
                    <span>Muat Lebih Banyak Produk (+18)</span>
                  </button>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Menampilkan {displayedProducts.length} dari {filteredProducts.length} produk UMKM
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        /* JASA & BOOKING */
        <div className="space-y-4 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span>Layanan Jasa & Keahlian Profesional</span>
              <span className="text-xs font-medium text-slate-500">
                (Menampilkan {displayedServices.length} dari {filteredServices.length} penyedia aktif)
              </span>
            </h3>
            <Link
              href="/jasa"
              className="text-xs font-bold text-[#006E24] hover:text-[#084e1b] hover:underline inline-flex items-center gap-1"
            >
              <span>Buka Katalog Jasa Lengkap</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
              </svg>
            </Link>
          </div>

          {filteredServices.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto text-[#006E24]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                </svg>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Layanan belum tersedia</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Tidak ada layanan jasa yang sesuai dengan pencarian &quot;{searchQuery}&quot;.
              </p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedServiceCategory('ALL'); setVisibleServiceCount(8); }}
                className="px-4 py-2 bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#006E24] text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Reset Filter Pencarian
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {displayedServices.map((svc) => {
                  const firstImage =
                    svc.images && svc.images.length > 0
                      ? svc.images[0]
                      : 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=600&q=80'

                  return (
                    <div
                      key={svc.id}
                      className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md hover:border-[#006E24]/60 transition-all duration-200 flex flex-col justify-between group"
                    >
                      <div>
                        {/* Image Container */}
                        <div className="h-40 bg-slate-50 relative overflow-hidden">
                          <img
                            src={firstImage}
                            alt={svc.title}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <span className="absolute top-2 left-2 bg-[#006E24] text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-xs uppercase tracking-wider">
                            {svc.category}
                          </span>
                          {svc.location && (
                            <span className="absolute bottom-2 left-2 bg-white/95 text-slate-800 text-[9px] font-semibold px-2 py-0.5 rounded shadow-xs flex items-center gap-1">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
                              </svg>
                              <span>{svc.location}</span>
                            </span>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-3.5 space-y-2.5">
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1 group-hover:text-[#006E24] transition-colors">
                            {svc.title}
                          </h4>
                          <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                            {svc.description || 'Penyedia jasa profesional terverifikasi di platform Saloka.id.'}
                          </p>

                          {/* Pricing Badges */}
                          <div className="space-y-1 pt-1 border-t border-slate-100">
                            {svc.pricePerSession ? (
                              <div className="flex items-center justify-between text-[11px] bg-[#E8F5E9] px-2 py-1 rounded-lg border border-[#C8E6C9]">
                                <span className="text-[9px] font-bold text-[#006E24] uppercase">
                                  Per Sesi ({svc.sessionDurationMinutes || 60} mnt)
                                </span>
                                <span className="font-mono font-extrabold text-[#006E24]">
                                  Rp {svc.pricePerSession.toLocaleString('id-ID')}
                                </span>
                              </div>
                            ) : null}

                            {svc.pricePerDay ? (
                              <div className="flex items-center justify-between text-[11px] bg-blue-50 px-2 py-1 rounded-lg border border-blue-200">
                                <span className="text-[9px] font-bold text-blue-800 uppercase">
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

                      <div className="p-3.5 pt-0">
                        <Link
                          href={`/jasa/${svc.id}`}
                          className="w-full py-2 bg-[#006E24] hover:bg-[#084e1b] text-white text-[11px] font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
                          </svg>
                          <span>Cek Jadwal & Booking</span>
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Load More Button for Services */}
              {filteredServices.length > visibleServiceCount && (
                <div className="flex flex-col items-center justify-center pt-6 pb-2 gap-2">
                  <button
                    onClick={() => setVisibleServiceCount((prev) => prev + 8)}
                    className="px-7 py-3 bg-white hover:bg-emerald-50 text-[#006E24] border-2 border-[#006E24] rounded-xl font-extrabold text-xs sm:text-sm transition-all shadow-xs hover:shadow-md flex items-center gap-2 cursor-pointer group"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-y-0.5 transition-transform">
                      <path d="M12 5v14M5 12l7 7 7-7"/>
                    </svg>
                    <span>Muat Lebih Banyak Layanan (+8)</span>
                  </button>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Menampilkan {displayedServices.length} dari {filteredServices.length} penyedia jasa
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  )
}
