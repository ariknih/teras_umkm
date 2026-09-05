'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { SlidersHorizontal, X, ChevronDown, ArrowUpDown, DollarSign, Package, Share2, Check, Search, MapPin, Star, Store } from 'lucide-react'
import { formatCategoryName, calculateDistance as getDistance } from '@/lib/utils'
import { ProductCardSkeleton } from '@/components/ui/GhostSkeleton'

interface Product {
  id: string
  title: string
  description: string
  price: number
  category: string
  stock: number
  imageUrl?: string | null
  latitude?: number | null
  longitude?: number | null
  merchantId?: string
  merchant?: {
    name: string
  } | null
}

interface ProductListGridProps {
  initialProducts: Product[]
  currentUser?: any
  initialQuery?: string
}


export default function ProductListGrid({ initialProducts, currentUser: initialUser, initialQuery }: ProductListGridProps) {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const [locStatus, setLocStatus] = useState<'idle' | 'prompting' | 'loading' | 'success' | 'error'>('idle')
  const [currentUser, setCurrentUser] = useState<any>(initialUser)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Advanced Filter States
  const [searchQuery, setSearchQuery]   = useState(initialQuery || '')
  const [minPrice, setMinPrice]         = useState<number | ''>('')
  const [maxPrice, setMaxPrice]         = useState<number | ''>('')
  const [sortBy, setSortBy]             = useState<'default' | 'price-asc' | 'price-desc' | 'distance-asc'>('default')
  const [inStockOnly, setInStockOnly]   = useState(false)
  const [filterOpen, setFilterOpen]     = useState(false)
  const [visibleCount, setVisibleCount] = useState(15)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Close dropdown when clicking outside
  const filterRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false)
      }
    }
    if (filterOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [filterOpen])

  useEffect(() => {
    if (initialUser) {
      setCurrentUser(initialUser)
    }

    // Check if location was already allowed/cached in sessionStorage
    const saved = sessionStorage.getItem('user_coords')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setCoords(parsed)
        setLocStatus('success')
      } catch (_) {}
    }
  }, [initialUser])

  useEffect(() => {
    if (initialQuery !== undefined) {
      setSearchQuery(initialQuery)
    }
  }, [initialQuery])

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocStatus('error')
      return
    }

    setLocStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }
        setCoords(newCoords)
        setLocStatus('success')
        sessionStorage.setItem('user_coords', JSON.stringify(newCoords))
      },
      (error) => {
        // Silently handle — often caused by browser extensions or user denial
        setLocStatus('error')
      },
      { enableHighAccuracy: false, timeout: 8000 }
    )
  }



  // Calculate distance for all products if coords is available
  const productsWithDistance = React.useMemo(() => {
    return initialProducts.map(p => {
      if (coords) {
        const lat = p.latitude ?? -6.2088 // default fallback
        const lon = p.longitude ?? 106.8456
        const distance = getDistance(coords.latitude, coords.longitude, lat, lon)
        return { ...p, distance }
      }
      return p
    })
  }, [initialProducts, coords])

  // Filter and Sort products based on user criteria
  const filteredProducts = React.useMemo(() => {
    let result = [...productsWithDistance]

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(p => {
        const productId = p.id || ''
        const idNum = Math.abs(parseInt(productId.slice(-3), 36) || 0)
        const storeNames = ['Moell Store', 'Gallery Gadget', 'Wuben Light ID', 'Stanley ID', 'OMG Store', 'Infiniti Gadget']
        const storeName = storeNames[idNum % storeNames.length].toLowerCase()
        
        const locations = ['Jakarta Pusat', 'Jakarta Barat', 'Tangerang', 'Bandung', 'Surabaya', 'Bekasi']
        const location = locations[idNum % locations.length].toLowerCase()

        const title = (p.title || '').toLowerCase()
        const description = (p.description || '').toLowerCase()
        const categoryRaw = (p.category || '').toLowerCase()
        const categoryFormatted = formatCategoryName(p.category || '').toLowerCase()
        const merchantName = p.merchant?.name ? String(p.merchant.name).toLowerCase() : ''

        return (
          title.includes(q) ||
          description.includes(q) ||
          categoryRaw.includes(q) ||
          categoryFormatted.includes(q) ||
          merchantName.includes(q) ||
          storeName.includes(q) ||
          location.includes(q)
        )
      })
    }

    // Price range filters
    if (minPrice !== '') result = result.filter(p => p.price >= Number(minPrice))
    if (maxPrice !== '') result = result.filter(p => p.price <= Number(maxPrice))

    // Stock filter
    if (inStockOnly) result = result.filter(p => p.stock > 0)

    // Sorting
    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price)
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price)
    } else if (sortBy === 'distance-asc') {
      result.sort((a, b) => {
        const distA = (a as any).distance ?? Infinity
        const distB = (b as any).distance ?? Infinity
        return distA - distB
      })
    }

    return result
  }, [productsWithDistance, searchQuery, minPrice, maxPrice, sortBy, inStockOnly])

  // Active filter count (for badge)
  const activeFilterCount = [
    minPrice !== '',
    maxPrice !== '',
    sortBy !== 'default',
    inStockOnly,
  ].filter(Boolean).length

  const isFilterActive = !!(searchQuery || activeFilterCount > 0)

  const handleResetFilters = () => {
    setSearchQuery('')
    setMinPrice('')
    setMaxPrice('')
    setSortBy('default')
    setInStockOnly(false)
  }

  return (
    <div id="product-list-section" className="w-full space-y-3.5 sm:space-y-4 max-w-[1240px]">
      {/* Geolocation Banner & Controls */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-start sm:items-center bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            locStatus === 'success' ? 'bg-[#E8F8EE] text-[#2DB24A]' : 'bg-slate-100 text-slate-600'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 font-sora">
              Rekomendasi Berbasis Jarak
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {locStatus === 'success' 
                ? '✓ Lokasi aktif. Produk diurutkan berdasarkan jarak terdekat.' 
                : locStatus === 'loading'
                ? 'Mencari sinyal GPS...'
                : 'Aktifkan lokasi untuk menemukan produk & merchant terdekat.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end shrink-0 pt-1 sm:pt-0">
          {locStatus !== 'success' && (
            <button
              onClick={requestLocation}
              disabled={locStatus === 'loading'}
              className="w-full sm:w-auto px-4 py-2 bg-[#2DB24A] hover:bg-[#24943E] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              {locStatus === 'loading' ? 'Mengakses...' : 'Akses Lokasi'}
            </button>
          )}

          {locStatus === 'success' && (
            <label className="flex items-center gap-2 cursor-pointer bg-slate-100 hover:bg-slate-200/70 px-3 py-2 rounded-xl text-xs select-none transition-colors">
              <input
                type="checkbox"
                checked={sortBy === 'distance-asc'}
                onChange={(e) => setSortBy(e.target.checked ? 'distance-asc' : 'default')}
                className="w-3.5 h-3.5 accent-[#2DB24A] cursor-pointer"
              />
              <span className="font-bold text-slate-800">Urutkan Terdekat</span>
            </label>
          )}
        </div>
      </div>

      {/* ── Search bar + Filter/Sort ── */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex gap-2.5 items-center">

          {/* Search */}
          <div className="relative flex-1 flex items-center min-w-0">
            <span className="absolute left-3 text-slate-400 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Cari produk, jasa, atau merchant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#2DB24A] rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#2DB24A]/20 transition-all font-medium"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* ── Filter Dropdown button ── */}
          <div className="relative shrink-0" ref={filterRef}>
            <button
              id="filter-dropdown-btn"
              onClick={() => setFilterOpen(v => !v)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                filterOpen || activeFilterCount > 0
                  ? 'bg-[#E8F8EE] border-[#2DB24A] text-[#2DB24A]'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#2DB24A] text-white text-[9px] font-black flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${filterOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* ── Floating dropdown panel ── */}
            {filterOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[340px] bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
                {/* Dropdown header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Filter &amp; Sortir</span>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={handleResetFilters}
                      className="text-[10px] font-bold text-rose-600 hover:underline transition-colors cursor-pointer"
                    >
                      Reset semua ({activeFilterCount})
                    </button>
                  )}
                </div>

                <div className="p-4 space-y-4">

                  {/* ── Sort By ── */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                      <label className="text-[11px] font-bold text-slate-600 tracking-wider uppercase">Urutkan</label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        { val: 'default',      label: 'Relevansi' },
                        { val: 'price-asc',    label: 'Harga Terendah' },
                        { val: 'price-desc',   label: 'Harga Tertinggi' },
                        ...(coords ? [{ val: 'distance-asc', label: 'Terdekat' }] : []),
                      ] as { val: string; label: string }[]).map(opt => (
                        <button
                          key={opt.val}
                          onClick={() => setSortBy(opt.val as any)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left cursor-pointer ${
                            sortBy === opt.val
                              ? 'bg-[#E8F5E9] border-[#006E24] text-[#006E24]'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-[#006E24]/30'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ── Price Range ── */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                        <label className="text-[11px] font-bold text-slate-600 tracking-wider uppercase">Rentang Harga</label>
                      </div>
                      {(minPrice !== '' || maxPrice !== '') && (
                        <button
                          onClick={() => { setMinPrice(''); setMaxPrice('') }}
                          className="text-[10px] text-rose-600 hover:underline font-bold transition-colors cursor-pointer"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 font-medium">Min (Rp)</span>
                        <input
                          type="number"
                          placeholder="0"
                          value={minPrice}
                          onChange={(e) => setMinPrice(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#006E24] transition-all font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 font-medium">Max (Rp)</span>
                        <input
                          type="number"
                          placeholder="Tak terbatas"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#006E24] transition-all font-semibold"
                        />
                      </div>
                    </div>
                    {/* Quick preset ranges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[
                        { label: '< 50rb',   min: '',       max: 50000 },
                        { label: '50–200rb', min: 50000,    max: 200000 },
                        { label: '200–500rb',min: 200000,   max: 500000 },
                        { label: '> 500rb',  min: 500000,   max: '' },
                      ].map(p => {
                        const active = minPrice === p.min && maxPrice === p.max
                        return (
                          <button
                            key={p.label}
                            onClick={() => { setMinPrice(p.min as any); setMaxPrice(p.max as any) }}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                              active
                                ? 'bg-[#E8F5E9] border-[#006E24] text-[#006E24]'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-[#006E24]/30'
                            }`}
                          >
                            {p.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* ── Ketersediaan ── */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-slate-500" />
                      <label className="text-[11px] font-bold text-slate-600 tracking-wider uppercase">Ketersediaan</label>
                    </div>
                    <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={inStockOnly}
                        onChange={(e) => setInStockOnly(e.target.checked)}
                        className="w-4 h-4 accent-[#006E24] cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-slate-800">Hanya tampilkan produk ready stok</span>
                    </label>
                  </div>

                </div>

                {/* Dropdown footer */}
                <div className="px-4 pb-4">
                  <button
                    onClick={() => setFilterOpen(false)}
                    className="w-full py-2.5 bg-[#006E24] hover:bg-[#005a1d] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
                  >
                    Terapkan Filter
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Active filters chip bar */}
        {isFilterActive && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100">
            <span className="text-[10px] text-slate-500 font-medium">Aktif:</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 border border-slate-200 rounded-full text-[11px] font-bold text-slate-800">
                &quot;{searchQuery}&quot;
                <button onClick={() => setSearchQuery('')}><X className="w-3 h-3 text-slate-400 hover:text-rose-500" /></button>
              </span>
            )}
            {sortBy !== 'default' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 border border-slate-200 rounded-full text-[11px] font-bold text-slate-800">
                {sortBy === 'price-asc' ? 'Harga ↑' : sortBy === 'price-desc' ? 'Harga ↓' : 'Terdekat'}
                <button onClick={() => setSortBy('default')}><X className="w-3 h-3 text-slate-400 hover:text-rose-500" /></button>
              </span>
            )}
            {(minPrice !== '' || maxPrice !== '') && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 border border-slate-200 rounded-full text-[11px] font-bold text-slate-800">
                Rp {minPrice || '0'} – {maxPrice || '∞'}
                <button onClick={() => { setMinPrice(''); setMaxPrice('') }}><X className="w-3 h-3 text-slate-400 hover:text-rose-500" /></button>
              </span>
            )}
            {inStockOnly && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 border border-slate-200 rounded-full text-[11px] font-bold text-slate-800">
                Tersedia
                <button onClick={() => setInStockOnly(false)}><X className="w-3 h-3 text-slate-400 hover:text-rose-500" /></button>
              </span>
            )}
            <button
              onClick={handleResetFilters}
              className="ml-auto text-[11px] text-rose-500 hover:text-rose-600 font-bold transition-colors cursor-pointer"
            >
              Hapus semua
            </button>
          </div>
        )}
      </div>

      {/* Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 rounded-2xl bg-white border border-slate-200/80">
          <Search className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="font-semibold text-sm text-gray-700 mb-1">Produk Tidak Ditemukan</h3>
          <p className="text-xs text-gray-400 max-w-xs mx-auto">Coba kata kunci lain atau ganti kategori filter.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div id="card-container" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3.5 w-full">
            {filteredProducts.slice(0, visibleCount).map((product) => {
              const dist = (product as any).distance
              const productId = product.id || ''
              const idNum = Math.abs(parseInt(productId.slice(-3), 36) || 0)
              const discount = (idNum % 3 === 0) ? (10 + (idNum % 5) * 5) : 0
              const originalPrice = discount ? Math.round(product.price * (100 / (100 - discount))) : product.price
              const rating = (4.5 + (idNum % 5) * 0.1).toFixed(1)
              const sold = (idNum % 10) * 25 + 10
              const locations = ['Jakarta Pusat', 'Jakarta Barat', 'Tangerang', 'Bandung', 'Surabaya', 'Bekasi']
              const location = locations[idNum % locations.length]
              const storeNames = ['Moell Store', 'Gallery Gadget', 'Wuben Light ID', 'Stanley ID', 'OMG Store', 'Infiniti Gadget']
              const storeName = storeNames[idNum % storeNames.length]
              const isOfficial = idNum % 2 === 0
              const isAffiliate = currentUser?.role === 'AFFILIATE'
              return (
                <div key={productId} className="group flex flex-col bg-white border border-slate-200/90 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-[0_4px_16px_0_rgba(45,178,74,0.12)] hover:border-[#2DB24A]/50 h-full relative">
                  {/* Share button overlay for AFFILIATE only */}
                  {isAffiliate && (
                    <button
                      id={`share-product-${productId}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        const origin = typeof window !== 'undefined' ? window.location.origin : ''
                        const link = `${origin}/market/product/${productId}?aff=${currentUser.id}`
                        navigator.clipboard.writeText(link).then(() => {
                          setCopiedId(productId)
                          setTimeout(() => setCopiedId(null), 2000)
                        })
                      }}
                      title="Salin Link Affiliate"
                      className={`absolute top-1.5 right-1.5 z-20 w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-all duration-200 ${
                        copiedId === productId
                          ? 'bg-[#2DB24A] text-white scale-105'
                          : 'bg-white/90 hover:bg-[#2DB24A] text-gray-600 hover:text-white backdrop-blur-sm'
                      }`}
                    >
                      {copiedId === productId
                        ? <Check className="w-3.5 h-3.5" />
                        : <Share2 className="w-3.5 h-3.5" />}
                    </button>
                  )}
                  <Link
                    href={`/market/product/${productId}`}
                    className="flex flex-col h-full"
                  >
                  {/* Square image */}
                  <div className="aspect-square w-full bg-slate-100 relative overflow-hidden shrink-0">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        loading="lazy"
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                        <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">{formatCategoryName(product.category)}</span>
                      </div>
                    )}
                    {discount > 0 && (
                      <div className="absolute top-2 left-2 bg-[#E8F8EE] text-[#2DB24A] font-extrabold text-[10px] px-1.5 py-0.5 rounded-md border border-[#C8E6C9] shadow-2xs">
                        {discount}%
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 bg-slate-900/75 backdrop-blur-xs text-white text-[9px] font-semibold px-1.5 py-0.5 rounded">
                      {formatCategoryName(product.category)}
                    </div>
                    {currentUser && product.merchantId === currentUser.id && (
                      <div className="absolute top-2 right-2 bg-slate-900/80 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                        Produk Anda
                      </div>
                    )}
                    {product.stock <= 0 && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                        <span className="text-[10px] font-extrabold text-rose-600 uppercase tracking-wider bg-white px-2 py-0.5 rounded border border-rose-200">
                          Habis
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between space-y-1.5 sm:space-y-2">
                    <div>
                      <h3 className="text-xs font-medium text-slate-800 line-clamp-2 min-h-[32px] leading-snug group-hover:text-[#2DB24A] transition-colors">
                        {product.title}
                      </h3>
                      
                      <div className="pt-1">
                        <p className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight">
                          {product.price === 0 ? 'Gratis' : `Rp ${product.price.toLocaleString('id-ID')}`}
                        </p>

                        {discount > 0 && (
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <span className="text-[10px] sm:text-[11px] text-slate-400 line-through">
                              Rp {originalPrice.toLocaleString('id-ID')}
                            </span>
                            <span className="bg-[#E8F8EE] text-[#2DB24A] font-extrabold text-[9px] px-1 py-0.2 rounded border border-[#C8E6C9]">
                              {discount}%
                            </span>
                          </div>
                        )}

                        {dist !== undefined && (
                          <span className="inline-flex items-center gap-1 mt-1 text-[9px] sm:text-[10px] font-semibold text-[#006E24] bg-emerald-50 rounded-md px-1.5 py-0.5 border border-emerald-100">
                            <MapPin className="w-2.5 h-2.5" />
                            <span>{dist.toFixed(1)} km</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-1.5 border-t border-slate-100 space-y-1">
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                        <span className="font-semibold text-slate-700">{rating}</span>
                        <span>•</span>
                        <span>{sold}+ terjual</span>
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 truncate flex-1 min-w-0">
                          <Store className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate font-medium text-slate-600">{product.merchant?.name || storeName}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-lg bg-[#006E24] hover:bg-[#00551c] text-white text-[9px] sm:text-[10px] font-bold flex items-center gap-0.5 shadow-xs shrink-0 cursor-pointer">
                          + Keranjang
                        </span>
                      </div>
                    </div>
                  </div>
                  </Link>
                </div>
              )
            })}

            {isLoadingMore && (
              <>
                <ProductCardSkeleton />
                <ProductCardSkeleton />
                <ProductCardSkeleton />
                <ProductCardSkeleton />
                <ProductCardSkeleton />
                <ProductCardSkeleton />
              </>
            )}
          </div>

          {filteredProducts.length > visibleCount && (
            <div id="more-button" className="flex justify-center mt-6 mb-6">
              <button
                type="button"
                disabled={isLoadingMore}
                onClick={() => {
                  setIsLoadingMore(true)
                  setTimeout(() => {
                    setVisibleCount(prev => prev + 15)
                    setIsLoadingMore(false)
                  }, 300)
                }}
                className="px-6 py-2.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs uppercase tracking-wider rounded-xl border border-slate-200 shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>{isLoadingMore ? 'Memuat Produk...' : 'Muat Lebih Banyak Produk'}</span>
                <span className="text-[10px] text-slate-400 font-mono">({Math.min(visibleCount, filteredProducts.length)} / {filteredProducts.length})</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
