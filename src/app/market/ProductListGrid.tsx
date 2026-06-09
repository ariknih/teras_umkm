'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { getCurrentUser } from '@/app/actions/auth'
import { SlidersHorizontal, X, ChevronDown, ArrowUpDown, DollarSign, Package } from 'lucide-react'

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
}

interface ProductListGridProps {
  initialProducts: Product[]
}

// Haversine formula to calculate distance in km
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const d = R * c // Distance in km
  return d
}

export default function ProductListGrid({ initialProducts }: ProductListGridProps) {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const [locStatus, setLocStatus] = useState<'idle' | 'prompting' | 'loading' | 'success' | 'error'>('idle')
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Advanced Filter States
  const [searchQuery, setSearchQuery]   = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Semua')
  const [minPrice, setMinPrice]         = useState<number | ''>('')
  const [maxPrice, setMaxPrice]         = useState<number | ''>('')
  const [sortBy, setSortBy]             = useState<'default' | 'price-asc' | 'price-desc' | 'distance-asc'>('default')
  const [inStockOnly, setInStockOnly]   = useState(false)
  const [filterOpen, setFilterOpen]     = useState(false)

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
    async function getUser() {
      try {
        const u = await getCurrentUser()
        setCurrentUser(u)
      } catch (_) {}
    }
    getUser()

    // Check if location was already allowed/cached in sessionStorage
    const saved = sessionStorage.getItem('user_coords')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setCoords(parsed)
        setLocStatus('success')
      } catch (_) {}
    }
  }, [])

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

  // Get unique categories dynamically
  const categories = React.useMemo(() => {
    const list = new Set(initialProducts.map(p => p.category))
    return ['Semua', ...Array.from(list)]
  }, [initialProducts])

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
      result = result.filter(
        p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      )
    }

    // Category filter
    if (selectedCategory && selectedCategory !== 'Semua') {
      result = result.filter(
        p => p.category.toLowerCase() === selectedCategory.toLowerCase()
      )
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
  }, [productsWithDistance, searchQuery, selectedCategory, minPrice, maxPrice, sortBy, inStockOnly])

  // Active filter count (for badge)
  const activeFilterCount = [
    minPrice !== '',
    maxPrice !== '',
    sortBy !== 'default',
    inStockOnly,
  ].filter(Boolean).length

  const isFilterActive = !!(searchQuery || selectedCategory !== 'Semua' || activeFilterCount > 0)

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedCategory('Semua')
    setMinPrice('')
    setMaxPrice('')
    setSortBy('default')
    setInStockOnly(false)
  }

  return (
    <div className="space-y-6">
      {/* Geolocation Banner & Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            locStatus === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-primary/10 text-primary'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
          </div>
          <div>
            <h4 className="text-xs font-bold text-text-primary font-sora">
              Rekomendasi Berbasis Jarak
            </h4>
            <p className="text-[10px] text-text-secondary">
              {locStatus === 'success' 
                ? '✓ Lokasi terdeteksi. Jarak produk diperbarui secara real-time.' 
                : locStatus === 'loading'
                ? 'Mencari sinyal GPS...'
                : 'Izinkan akses lokasi untuk mengurutkan merchant terdekat.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {locStatus !== 'success' && (
            <button
              onClick={requestLocation}
              disabled={locStatus === 'loading'}
              className="btn-primary disabled:opacity-50 text-xs"
            >
              {locStatus === 'loading' ? 'Mengakses...' : 'Akses Lokasi'}
            </button>
          )}

          {locStatus === 'success' && (
            <label className="flex items-center gap-2 cursor-pointer bg-slate-100 hover:bg-slate-200/60 px-3 py-2 rounded text-xs select-none transition-colors">
              <input
                type="checkbox"
                checked={sortBy === 'distance-asc'}
                onChange={(e) => setSortBy(e.target.checked ? 'distance-asc' : 'default')}
                className="w-3.5 h-3.5 accent-primary cursor-pointer"
              />
              <span className="font-geist font-bold text-text-primary">Urutkan Jarak Terdekat</span>
            </label>
          )}
        </div>
      </div>

      {/* ── Search bar + Filter/Sort ── */}
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <div className="flex gap-3 items-center">

          {/* Search */}
          <div className="relative flex-1 flex items-center">
            <span className="absolute left-3 text-text-secondary pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Cari produk, jasa, atau merchant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 bg-surface-dark/80 border border-border-subtle rounded-lg text-sm text-text-primary placeholder-text-secondary/60 focus:outline-none focus:border-primary/50 focus:shadow-[0_0_12px_rgba(250,204,21,0.12)] transition-all font-geist"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 text-text-secondary hover:text-primary transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* ── Filter Dropdown button ── */}
          <div className="relative shrink-0" ref={filterRef}>
            <button
              id="filter-dropdown-btn"
              onClick={() => setFilterOpen(v => !v)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-xs font-bold font-geist transition-all ${
                filterOpen || activeFilterCount > 0
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-white border-slate-200 text-text-secondary hover:border-primary/40 hover:text-text-primary'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span className="btn-primary flex items-center justify-center w-4 text-[9px] font-black">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${filterOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* ── Floating dropdown panel ── */}
            {filterOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[340px] bg-surface-dark border border-border-subtle rounded-xl shadow-2xl overflow-hidden">
                {/* Dropdown header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle/60 bg-surface-container/40">
                  <span className="text-xs font-bold text-text-primary font-sora uppercase tracking-wider">Filter &amp; Sortir</span>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={handleResetFilters}
                      className="text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors"
                    >
                      Reset semua ({activeFilterCount})
                    </button>
                  )}
                </div>

                <div className="p-4 space-y-5">

                  {/* ── Sort By ── */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <ArrowUpDown className="w-3 h-3 text-text-secondary" />
                      <label className="text-[10px] font-bold text-text-secondary font-sora tracking-wider uppercase">Urutkan</label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        { val: 'default',      label: 'Relevansi' },
                        { val: 'price-asc',    label: 'Harga ↑' },
                        { val: 'price-desc',   label: 'Harga ↓' },
                        ...(coords ? [{ val: 'distance-asc', label: 'Terdekat' }] : []),
                      ] as { val: string; label: string }[]).map(opt => (
                        <button
                          key={opt.val}
                          onClick={() => setSortBy(opt.val as any)}
                          className={`px-3 py-2 rounded-lg text-xs font-bold font-geist border transition-all text-left ${
                            sortBy === opt.val
                              ? 'bg-primary/10 border-primary text-primary'
                              : 'bg-surface-container/40 border-border-subtle text-text-secondary hover:border-primary/30 hover:text-text-primary'
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
                        <DollarSign className="w-3 h-3 text-text-secondary" />
                        <label className="text-[10px] font-bold text-text-secondary font-sora tracking-wider uppercase">Rentang Harga</label>
                      </div>
                      {(minPrice !== '' || maxPrice !== '') && (
                        <button
                          onClick={() => { setMinPrice(''); setMaxPrice('') }}
                          className="text-[10px] text-red-400 hover:text-red-300 font-bold transition-colors"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <span className="text-[9px] text-text-secondary font-geist">Min (Rp)</span>
                        <input
                          type="number"
                          placeholder="0"
                          value={minPrice}
                          onChange={(e) => setMinPrice(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full px-3 py-2 bg-surface-container/60 border border-border-subtle rounded-lg text-xs text-text-primary placeholder-text-secondary/40 focus:outline-none focus:border-primary/50 transition-all font-geist"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] text-text-secondary font-geist">Max (Rp)</span>
                        <input
                          type="number"
                          placeholder="Tak terbatas"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full px-3 py-2 bg-surface-container/60 border border-border-subtle rounded-lg text-xs text-text-primary placeholder-text-secondary/40 focus:outline-none focus:border-primary/50 transition-all font-geist"
                        />
                      </div>
                    </div>
                    {/* Quick preset ranges */}
                    <div className="flex flex-wrap gap-1.5">
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
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-geist border transition-all ${
                              active
                                ? 'bg-primary/10 border-primary text-primary'
                                : 'bg-surface-container/40 border-border-subtle text-text-secondary hover:border-primary/30'
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
                      <Package className="w-3 h-3 text-text-secondary" />
                      <label className="text-[10px] font-bold text-text-secondary font-sora tracking-wider uppercase">Ketersediaan</label>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div
                        onClick={() => setInStockOnly(v => !v)}
                        className={`relative w-9 h-5 rounded-full transition-colors border ${
                          inStockOnly
                            ? 'bg-primary/20 border-primary'
                            : 'bg-surface-container border-border-subtle'
                        }`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
                          inStockOnly
                            ? 'left-4 bg-primary'
                            : 'left-0.5 bg-text-secondary/40'
                        }`} />
                      </div>
                      <span className={`text-xs font-bold font-geist transition-colors ${
                        inStockOnly ? 'text-primary' : 'text-text-secondary group-hover:text-text-primary'
                      }`}>
                        Hanya tampilkan produk tersedia
                      </span>
                    </label>
                  </div>

                </div>

                {/* Dropdown footer */}
                <div className="px-4 pb-4">
                  <button
                    onClick={() => setFilterOpen(false)}
                    className="btn-primary w-full text-xs"
                  >
                    Terapkan Filter
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Category pills ── */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 mt-3 scrollbar-none -mx-4 px-4">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold font-geist whitespace-nowrap transition-all shrink-0 ${
                  isSelected
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-text-secondary hover:text-text-primary'
                }`}
              >
                {cat === 'Semua' ? '🛍️ Semua' : cat}
              </button>
            )
          })}
        </div>

        {/* Active filters chip bar */}
        {isFilterActive && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border-subtle/50">
            <span className="text-[10px] text-text-secondary font-geist">Aktif:</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface-container border border-border-subtle rounded-full text-[10px] font-bold text-text-primary">
                &quot;{searchQuery}&quot;
                <button onClick={() => setSearchQuery('')}><X className="w-2.5 h-2.5 text-text-secondary hover:text-red-400" /></button>
              </span>
            )}
            {selectedCategory !== 'Semua' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface-container border border-border-subtle rounded-full text-[10px] font-bold text-text-primary">
                {selectedCategory}
                <button onClick={() => setSelectedCategory('Semua')}><X className="w-2.5 h-2.5 text-text-secondary hover:text-red-400" /></button>
              </span>
            )}
            {sortBy !== 'default' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface-container border border-border-subtle rounded-full text-[10px] font-bold text-text-primary">
                {sortBy === 'price-asc' ? 'Harga ↑' : sortBy === 'price-desc' ? 'Harga ↓' : 'Terdekat'}
                <button onClick={() => setSortBy('default')}><X className="w-2.5 h-2.5 text-text-secondary hover:text-red-400" /></button>
              </span>
            )}
            {(minPrice !== '' || maxPrice !== '') && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface-container border border-border-subtle rounded-full text-[10px] font-bold text-text-primary">
                Rp {minPrice || '0'} – {maxPrice || '∞'}
                <button onClick={() => { setMinPrice(''); setMaxPrice('') }}><X className="w-2.5 h-2.5 text-text-secondary hover:text-red-400" /></button>
              </span>
            )}
            {inStockOnly && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface-container border border-border-subtle rounded-full text-[10px] font-bold text-text-primary">
                Tersedia
                <button onClick={() => setInStockOnly(false)}><X className="w-2.5 h-2.5 text-text-secondary hover:text-red-400" /></button>
              </span>
            )}
            <button
              onClick={handleResetFilters}
              className="ml-auto text-[10px] text-red-400 hover:text-red-300 font-bold font-geist transition-colors"
            >
              Hapus semua
            </button>
          </div>
        )}
      </div>

      {/* Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 rounded-lg bg-white">
          <div className="text-4xl mb-3">🔍</div>
          <h3 className="font-semibold text-sm text-gray-700 mb-1">Produk Tidak Ditemukan</h3>
          <p className="text-xs text-gray-400 max-w-xs mx-auto">Coba kata kunci lain atau ganti kategori.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filteredProducts.map((product) => {
            const dist = (product as any).distance
            const idNum = parseInt(product.id.slice(-3), 36) || 0
            const discount = (idNum % 3 === 0) ? (10 + (idNum % 5) * 5) : 0
            const originalPrice = discount ? Math.round(product.price * (100 / (100 - discount))) : product.price
            const rating = (4.5 + (idNum % 5) * 0.1).toFixed(1)
            const sold = (idNum % 10) * 25 + 10
            const locations = ['Jakarta Pusat', 'Jakarta Barat', 'Tangerang', 'Bandung', 'Surabaya', 'Bekasi']
            const location = locations[idNum % locations.length]
            const storeNames = ['Moell Store', 'Gallery Gadget', 'Wuben Light ID', 'Stanley ID', 'OMG Store', 'Infiniti Gadget']
            const storeName = storeNames[idNum % storeNames.length]
            const isOfficial = idNum % 2 === 0
            return (
              <Link
                key={product.id}
                href={`/market/product/${product.id}`}
                className="group flex flex-col bg-white border-0 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-[0_1px_6px_0_rgba(49,53,59,0.12)] h-full"
              >
                {/* Square image */}
                <div className="aspect-square w-full bg-slate-100 relative overflow-hidden">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                      <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">{product.category}</span>
                    </div>
                  )}
                  {discount > 0 && (
                    <div className="absolute top-1.5 left-1.5 bg-red-500 text-white font-extrabold text-[8px] px-1 py-0.5 rounded">{discount}%</div>
                  )}
                  {currentUser && product.merchantId === currentUser.id && (
                    <div className="absolute top-1.5 left-1.5 bg-red-500/80 text-white text-[8px] font-bold px-1 py-0.5 rounded">Produk Anda</div>
                  )}
                  {product.stock <= 0 && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                      <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider bg-white px-2 py-0.5 rounded">Habis</span>
                    </div>
                  )}
                </div>

                {/* Content — compact like homepage */}
                <div className="p-2.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-[11px] font-medium text-gray-800 line-clamp-2 h-[32px] leading-snug group-hover:text-[#2DB24A] transition-colors mb-0.5">
                      {product.title}
                    </h3>
                    <div className="mt-1">
                      <span className="text-xs font-extrabold text-gray-900">
                        {product.price === 0 ? 'Gratis' : `Rp${product.price.toLocaleString('id-ID')}`}
                      </span>
                      {discount > 0 && (
                        <span className="text-[9px] text-gray-400 line-through ml-1">Rp{originalPrice.toLocaleString('id-ID')}</span>
                      )}
                    </div>
                    <p className="text-[9px] font-bold text-[#FF5722] mt-1">
                      {idNum % 2 === 0 ? `Hemat s.d ${5 + (idNum % 3) * 5}% Pakai Bonus` : 'Bisa COD'}
                    </p>
                    {dist !== undefined && (
                      <span className="inline-flex items-center gap-0.5 mt-1 text-[9px] font-semibold text-[#2DB24A] bg-[#2DB24A]/10 rounded px-1 py-0.5">
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"/></svg>
                        {dist.toFixed(1)} km
                      </span>
                    )}
                  </div>
                  <div className="mt-2 pt-2">
                    <div className="flex items-center gap-1 text-[9px] text-gray-400">
                      <span className="text-[#FFC107]">★</span>
                      <span className="font-bold text-gray-700">{rating}</span>
                      <span>•</span>
                      <span>{sold}+ terjual</span>
                    </div>
                    <div className="mt-1 text-[9px] text-gray-400 flex flex-col gap-0.5">
                      <div className="flex items-center gap-1 truncate">
                        {isOfficial && (
                          <span className="w-3 h-3 rounded bg-purple-600 text-white flex items-center justify-center text-[6px] font-black shrink-0">✔</span>
                        )}
                        <span className="truncate">{storeName}</span>
                      </div>
                      <p className="truncate">{location}</p>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
