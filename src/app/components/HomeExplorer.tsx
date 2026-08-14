'use client'

import React, { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Tag,
  Truck,
  Coins,
  Zap,
  Building2,
  GraduationCap,
  Wrench,
  ArrowUpDown,
  Search,
  History,
  TrendingUp,
  X,
  ChevronRight
} from 'lucide-react'
import ShippingRateCalculatorWidget from './ShippingRateCalculatorWidget'

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
  { key: 'ALL', label: 'Untuk Anda' },
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
  { label: 'Promo UMKM', icon: Tag, color: 'text-[#006E24] bg-emerald-50', href: '/market' },
  { label: 'Bebas Ongkir', icon: Truck, color: 'text-[#006E24] bg-emerald-50', href: '/market' },
  { label: 'Tukar Koin', icon: Coins, color: 'text-amber-600 bg-amber-50', href: '/wallet/coin' },
  { label: 'Flash Sale', icon: Zap, color: 'text-orange-500 bg-orange-50', href: '/market' },
  { label: 'Koperasi & Komunitas', icon: Building2, color: 'text-blue-600 bg-blue-50', href: '/community' },
  { label: 'Akademi UMKM', icon: GraduationCap, color: 'text-purple-600 bg-purple-50', href: '/academy' }
]

const TRENDING_KEYWORDS = [
  'Batik Tulis Solo',
  'Keripik Tempe Renyah',
  'Madu Hutan Asli',
  'Kopi Robusta Lampung',
  'Tas Rajut Etnik',
  'Desain Logo UMKM'
]

export default function HomeExplorer({ products, services }: HomeExplorerProps) {
  const [activeTab, setActiveTab] = useState<'MARKETPLACE' | 'JASA'>('MARKETPLACE')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProductCategory, setSelectedProductCategory] = useState('ALL')
  const [selectedServiceCategory, setSelectedServiceCategory] = useState('ALL')
  const [sortBy, setSortBy] = useState<'RELEVANCE' | 'PRICE_LOW' | 'PRICE_HIGH' | 'RATING'>('RELEVANCE')
  
  // Search dropdown state
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const searchBoxRef = useRef<HTMLDivElement>(null)

  // Flash Sale Countdown Timer (Ticking every second)
  const [countdown, setCountdown] = useState({ hours: 4, minutes: 26, seconds: 21 })

  useEffect(() => {
    try {
      const stored = localStorage.getItem('saloka_recent_searches')
      if (stored) {
        setRecentSearches(JSON.parse(stored))
      }
    } catch (_) {}

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 }
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 }
        } else {
          return { hours: 4, minutes: 59, seconds: 59 }
        }
      })
    }, 1000)

    const handleClickOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      clearInterval(timer)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const saveSearchKeyword = (keyword: string) => {
    if (!keyword.trim()) return
    const updated = [keyword, ...recentSearches.filter((k) => k !== keyword)].slice(0, 5)
    setRecentSearches(updated)
    try {
      localStorage.setItem('saloka_recent_searches', JSON.stringify(updated))
    } catch (_) {}
  }

  // 5 baris produk awal (5 baris x 6 kolom desktop = 30 produk)
  const [visibleProductCount, setVisibleProductCount] = useState(30)
  const [visibleServiceCount, setVisibleServiceCount] = useState(8)

  // Instant matching products for autocomplete dropdown
  const autocompleteMatches = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase().trim()
    return products
      .filter((p) => p.category !== 'KERJAAN' && p.category !== 'JASA')
      .filter((p) => p.title?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q))
      .slice(0, 5)
  }, [products, searchQuery])

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

  // Flash Sale products
  const flashSaleProducts = useMemo(() => {
    return products.filter((p) => p.category !== 'KERJAAN' && p.category !== 'JASA').slice(0, 6)
  }, [products])

  return (
    <section className="w-full max-w-[1240px] mx-auto px-3 sm:px-6 py-3 space-y-4">
      
      {/* ── TOKOPEDIA-STYLE QUICK ACTIONS BAR (CLEAN & LIGHT) ── */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
        {QUICK_ACTIONS.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.label}
              href={item.href}
              className="bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex flex-col items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs transition-all duration-200 group text-center"
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${item.color} group-hover:scale-105 transition-transform duration-200`}>
                <Icon size={17} strokeWidth={2.2} />
              </div>
              <span className="text-[11px] font-semibold text-slate-700 group-hover:text-[#006E24] transition-colors leading-tight">
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>

      {/* ── ⚡ FLASH SALE UMKM (CLEAN WHITE SALOKA GREEN STYLE) ── */}
      {flashSaleProducts.length > 0 && activeTab === 'MARKETPLACE' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-1 bg-[#006E24] text-white text-[11px] font-extrabold rounded-md uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                <Zap size={13} className="fill-white" />
                <span>Flash Sale</span>
              </span>
              
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="text-[11px] font-medium text-slate-500">Berakhir dalam:</span>
                <div className="flex items-center gap-1 font-bold text-xs text-white">
                  <span className="bg-slate-900 px-1.5 py-0.5 rounded">
                    {String(countdown.hours).padStart(2, '0')}
                  </span>
                  <span className="text-slate-700">:</span>
                  <span className="bg-slate-900 px-1.5 py-0.5 rounded">
                    {String(countdown.minutes).padStart(2, '0')}
                  </span>
                  <span className="text-slate-700">:</span>
                  <span className="bg-[#006E24] px-1.5 py-0.5 rounded">
                    {String(countdown.seconds).padStart(2, '0')}
                  </span>
                </div>
              </div>
            </div>

            <Link
              href="/market"
              className="text-xs font-bold text-[#006E24] hover:underline flex items-center gap-0.5 shrink-0"
            >
              <span>Lihat Semua</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          {/* Flash Sale Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 sm:gap-3">
            {flashSaleProducts.map((p, idx) => {
              const discountPct = 20 + ((idx * 7) % 30)
              const originalPrice = Math.round(p.price * (1 + discountPct / 100))
              const percentSold = 60 + ((idx * 8) % 35)

              return (
                <Link
                  key={p.id}
                  href={`/market/product/${p.id}`}
                  className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs hover:shadow-md hover:border-[#006E24]/60 transition-all duration-200 flex flex-col justify-between group p-2.5 text-slate-900"
                >
                  <div className="space-y-2">
                    {/* Thumbnail Image Container */}
                    <div className="w-full aspect-square bg-slate-50 relative rounded-lg overflow-hidden">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold bg-slate-100">
                          Saloka
                        </div>
                      )}

                      {/* Clean Saloka Green Discount Tag */}
                      <span className="absolute top-1 left-1 bg-[#E8F5E9] text-[#006E24] border border-[#C8E6C9] text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-2xs">
                        {discountPct}%
                      </span>
                    </div>

                    {/* Content */}
                    <div className="space-y-1">
                      <h4 className="text-xs font-normal text-slate-800 line-clamp-1 group-hover:text-[#006E24] transition-colors leading-tight">
                        {p.title}
                      </h4>
                      <p className="text-sm font-bold text-slate-900 leading-tight">
                        Rp {p.price.toLocaleString('id-ID')}
                      </p>
                      <p className="text-[10px] text-slate-400 line-through leading-none">
                        Rp {originalPrice.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>

                  {/* Stock Bar */}
                  <div className="pt-2 space-y-1">
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-[#006E24] h-full rounded-full transition-all"
                        style={{ width: `${percentSold}%` }}
                      />
                    </div>
                    <p className="text-[9px] font-bold text-[#006E24] text-left">
                      Terjual {percentSold}%
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* ── HEADER SWITCHER BAR (MARKETPLACE / JASA) ── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#E8F5E9] border border-[#C8E6C9] rounded-full text-[#006E24] text-[11px] font-bold">
            <span>Katalog Resmi Saloka UMKM</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Pilih Layanan Ekosistem
          </h2>
          <p className="text-xs text-slate-600 max-w-md">
            Ribuan produk lokal berkualitas dan booking keahlian mitra terpercaya.
          </p>
        </div>

        {/* Segmented Controls */}
        <div className="bg-[#F1F5F9] p-1 rounded-xl flex items-center gap-1.5 shadow-inner shrink-0 w-full sm:w-auto">
          <button
            onClick={() => { setActiveTab('MARKETPLACE'); setSearchQuery(''); setVisibleProductCount(30); }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all duration-150 cursor-pointer ${
              activeTab === 'MARKETPLACE'
                ? 'bg-[#006E24] text-white shadow-xs font-extrabold'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <span>Marketplace Produk</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              activeTab === 'MARKETPLACE' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {products.filter(p => p.category !== 'KERJAAN' && p.category !== 'JASA').length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('JASA'); setSearchQuery(''); setVisibleServiceCount(8); }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all duration-150 cursor-pointer ${
              activeTab === 'JASA'
                ? 'bg-[#006E24] text-white shadow-xs font-extrabold'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Wrench size={14} />
            <span>Booking Jasa</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              activeTab === 'JASA' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {services.length}
            </span>
          </button>
        </div>
      </div>

      {/* ── SEARCH & FILTER CATEGORIES ── */}
      <div className="space-y-3 bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-xs">
        {/* Search input with live clear button and dropdown */}
        <div ref={searchBoxRef} className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search size={16} strokeWidth={2.2} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setVisibleProductCount(30)
              setVisibleServiceCount(8)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                saveSearchKeyword(searchQuery.trim())
                setIsSearchFocused(false)
              }
            }}
            placeholder={
              activeTab === 'MARKETPLACE'
                ? 'Cari produk fisik UMKM (misal: Keripik Tempe, Batik Tulis, Madu Hutan)...'
                : 'Cari jasa & keahlian (misal: Desain Logo, Teknisi AC, Konsultan UMKM)...'
            }
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-9 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#006E24] focus:ring-1 focus:ring-[#006E24] transition-all"
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
              <X size={15} />
            </button>
          )}

          {/* Autocomplete Dropdown */}
          {isSearchFocused && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-3 space-y-3 animate-in fade-in-50 duration-150">
              {searchQuery.trim() ? (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Hasil Produk yang Cocok:
                  </p>
                  {autocompleteMatches.length === 0 ? (
                    <p className="text-xs text-slate-400 py-2">Tidak ada produk instan yang cocok dengan &quot;{searchQuery}&quot;.</p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {autocompleteMatches.map((m) => (
                        <Link
                          key={m.id}
                          href={`/market/product/${m.id}`}
                          onClick={() => {
                            saveSearchKeyword(m.title)
                            setIsSearchFocused(false)
                          }}
                          className="py-2 flex items-center justify-between gap-3 hover:bg-slate-50 px-2 rounded-lg transition-colors group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                              {m.imageUrl ? (
                                <img src={m.imageUrl} alt={m.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-400">UMKM</div>
                              )}
                            </div>
                            <span className="text-xs font-semibold text-slate-800 truncate group-hover:text-[#006E24]">
                              {m.title}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-[#006E24] shrink-0">
                            Rp {m.price.toLocaleString('id-ID')}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {recentSearches.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <span className="flex items-center gap-1"><History size={12} /> Riwayat Terakhir</span>
                        <button
                          onClick={() => {
                            setRecentSearches([])
                            localStorage.removeItem('saloka_recent_searches')
                          }}
                          className="text-[10px] text-rose-600 hover:underline capitalize"
                        >
                          Hapus
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {recentSearches.map((kw) => (
                          <button
                            key={kw}
                            onClick={() => {
                              setSearchQuery(kw)
                              setIsSearchFocused(false)
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-md transition-colors cursor-pointer"
                          >
                            {kw}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <TrendingUp size={12} className="text-[#006E24]" /> Tren Pencarian UMKM
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {TRENDING_KEYWORDS.map((kw) => (
                        <button
                          key={kw}
                          onClick={() => {
                            setSearchQuery(kw)
                            saveSearchKeyword(kw)
                            setIsSearchFocused(false)
                          }}
                          className="px-2.5 py-1 bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#006E24] text-xs font-semibold rounded-md transition-colors cursor-pointer"
                        >
                          {kw}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
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
                    className={`relative px-3 py-1.5 font-semibold text-xs sm:text-sm whitespace-nowrap transition-all duration-150 cursor-pointer border-b-2 ${
                      isSelected
                        ? 'text-[#006E24] border-[#006E24] font-bold'
                        : 'text-slate-600 hover:text-slate-900 border-transparent hover:border-slate-300'
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
                    className={`relative px-3 py-1.5 font-semibold text-xs sm:text-sm whitespace-nowrap transition-all duration-150 cursor-pointer border-b-2 ${
                      isSelected
                        ? 'text-[#006E24] border-[#006E24] font-bold'
                        : 'text-slate-600 hover:text-slate-900 border-transparent hover:border-slate-300'
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
              <ArrowUpDown size={13} className="text-slate-400 hidden sm:block" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Urutkan Produk"
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 outline-none focus:border-[#006E24] cursor-pointer"
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
              <span className="text-xs font-normal text-slate-500">
                ({displayedProducts.length} dari {filteredProducts.length} produk)
              </span>
            </h3>
            <Link
              href="/market"
              className="text-xs font-bold text-[#006E24] hover:underline inline-flex items-center gap-1"
            >
              <span>Lihat Semua Produk</span>
              <ChevronRight size={13} />
            </Link>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8 space-y-3">
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
                      className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-md hover:border-[#006E24]/60 transition-all duration-200 flex flex-col justify-between group"
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
                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-semibold">
                              Saloka UMKM
                            </div>
                          )}

                          {/* Category Tag */}
                          <span className="absolute top-1.5 right-1.5 bg-white/95 text-slate-800 text-[8px] font-bold px-1.5 py-0.5 rounded shadow-2xs uppercase tracking-wider">
                            {product.category}
                          </span>
                        </div>

                        {/* Content Layout */}
                        <div className="p-2.5 sm:p-3 space-y-1">
                          {/* Title */}
                          <h4 className="text-xs font-normal text-slate-800 line-clamp-2 leading-snug group-hover:text-[#006E24] transition-colors min-h-[32px]">
                            {product.title}
                          </h4>

                          {/* Price */}
                          <p className="text-sm font-extrabold text-slate-900 leading-tight pt-0.5">
                            Rp {product.price.toLocaleString('id-ID')}
                          </p>

                          {/* Strikethrough & Saloka Green Discount Tag */}
                          <div className="flex items-center gap-1 text-[10px]">
                            <span className="line-through text-slate-400">
                              Rp {originalPrice.toLocaleString('id-ID')}
                            </span>
                            <span className="font-bold text-[#006E24] bg-[#E8F5E9] border border-[#C8E6C9] px-1 py-0.2 rounded text-[9px]">
                              {discountPct}%
                            </span>
                          </div>

                          {/* Rating & Terjual */}
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 pt-1">
                            <span className="text-amber-500 font-bold">★ 4.9</span>
                            <span>•</span>
                            <span>Terjual {product.stock ? `${product.stock}+` : '50+'}</span>
                          </div>

                          {/* Location & Store Badge */}
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 pt-0.5 truncate">
                            <span className="text-[#006E24] font-bold">✔</span>
                            <span className="truncate">Saloka Official</span>
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
                    className="px-7 py-2.5 bg-white hover:bg-emerald-50 text-[#006E24] border-2 border-[#006E24] rounded-xl font-bold text-xs sm:text-sm transition-all shadow-2xs hover:shadow-xs flex items-center gap-2 cursor-pointer"
                  >
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
              <span className="text-xs font-normal text-slate-500">
                ({displayedServices.length} dari {filteredServices.length} penyedia)
              </span>
            </h3>
            <Link
              href="/jasa"
              className="text-xs font-bold text-[#006E24] hover:underline inline-flex items-center gap-1"
            >
              <span>Katalog Jasa Lengkap</span>
              <ChevronRight size={13} />
            </Link>
          </div>

          {filteredServices.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8 space-y-3">
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
                      className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-md hover:border-[#006E24]/60 transition-all duration-200 flex flex-col justify-between group"
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
                          <span className="absolute top-2 left-2 bg-[#006E24] text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-2xs uppercase tracking-wider">
                            {svc.category}
                          </span>
                          {svc.location && (
                            <span className="absolute bottom-2 left-2 bg-white/95 text-slate-800 text-[9px] font-semibold px-2 py-0.5 rounded shadow-2xs">
                              📍 {svc.location}
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
                                <span className="font-bold text-[#006E24]">
                                  Rp {svc.pricePerSession.toLocaleString('id-ID')}
                                </span>
                              </div>
                            ) : null}

                            {svc.pricePerDay ? (
                              <div className="flex items-center justify-between text-[11px] bg-blue-50 px-2 py-1 rounded-lg border border-blue-200">
                                <span className="text-[9px] font-bold text-blue-800 uppercase">
                                  Harian (Max {svc.maxWorkHoursPerDay || 8} Jam)
                                </span>
                                <span className="font-bold text-blue-700">
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
                          className="w-full py-2 bg-[#006E24] hover:bg-[#084e1b] text-white text-[11px] font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                        >
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
                    className="px-7 py-2.5 bg-white hover:bg-emerald-50 text-[#006E24] border-2 border-[#006E24] rounded-xl font-bold text-xs sm:text-sm transition-all shadow-2xs hover:shadow-xs flex items-center gap-2 cursor-pointer"
                  >
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

      {/* ── REAL-TIME SHIPPING RATE CALCULATOR WIDGET ── */}
      <ShippingRateCalculatorWidget />
    </section>
  )
}
