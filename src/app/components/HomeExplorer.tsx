'use client'

import React, { useState } from 'react'
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
  'Semua',
  'MAKANAN_MINUMAN',
  'FASHION',
  'KERAJINAN',
  'PERTANIAN',
  'ELEKTRONIK',
  'KESEHATAN',
  'LAINNYA'
]

const SERVICE_CATEGORIES = [
  'Semua',
  'Desain & Multimedia',
  'Teknologi & IT',
  'Konsultasi Bisnis',
  'Kerajinan & Seni',
  'Reparasi & Perawatan',
  'Fotografi & Video',
  'Pendidikan & Kursus Privat',
  'Lainnya'
]

function formatProductCategory(cat: string) {
  switch (cat) {
    case 'MAKANAN_MINUMAN': return 'Makanan & Minuman'
    case 'FASHION': return 'Fashion & Pakaian'
    case 'KERAJINAN': return 'Kerajinan Tangan'
    case 'PERTANIAN': return 'Pertanian & Pangan'
    case 'ELEKTRONIK': return 'Elektronik & Gadget'
    case 'KESEHATAN': return 'Kesehatan & Kecantikan'
    case 'LAINNYA': return 'Lainnya'
    default: return cat
  }
}

export default function HomeExplorer({ products, services }: HomeExplorerProps) {
  const [activeTab, setActiveTab] = useState<'MARKETPLACE' | 'JASA'>('MARKETPLACE')
  const [search, setSearch] = useState('')
  const [selectedProductCategory, setSelectedProductCategory] = useState('Semua')
  const [selectedServiceCategory, setSelectedServiceCategory] = useState('Semua')

  // Filtered physical products (exclude pure service/job items)
  const filteredProducts = products.filter((p) => {
    const isPhysical = p.category !== 'KERJAAN' && p.category !== 'JASA'
    const matchCat = selectedProductCategory === 'Semua' || p.category === selectedProductCategory
    const matchSearch =
      !search ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
    return isPhysical && matchCat && matchSearch
  })

  // Filtered services
  const filteredServices = services.filter((s) => {
    const matchCat = selectedServiceCategory === 'Semua' || s.category === selectedServiceCategory
    const matchSearch =
      !search ||
      s.title?.toLowerCase().includes(search.toLowerCase()) ||
      s.description?.toLowerCase().includes(search.toLowerCase()) ||
      s.category?.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <section className="w-full max-w-[1280px] mx-auto px-6 md:px-20 py-10 space-y-8">
      {/* ── INTERACTIVE EXPLORER HEADER & TABS ── */}
      <div className="flex flex-col items-center text-center space-y-4">
        <h2 className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight">
          Jelajahi Ekosistem Saloka.id
        </h2>
        <p className="text-text-secondary text-sm md:text-base max-w-xl">
          Pilih kategori yang Anda butuhkan: belanja produk UMKM lokal berkualitas atau booking layanan jasa & keahlian profesional.
        </p>

        {/* Main Switcher Tabs */}
        <div className="inline-flex p-1.5 bg-slate-200/70 dark:bg-slate-800/70 rounded-2xl shadow-inner mt-2">
          <button
            onClick={() => { setActiveTab('MARKETPLACE'); setSearch(''); }}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 cursor-pointer ${
              activeTab === 'MARKETPLACE'
                ? 'bg-white text-[#0F5132] shadow-md scale-102 font-extrabold'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
            }`}
          >
            <span className="text-lg">🛒</span>
            <span>Marketplace Produk</span>
          </button>

          <button
            onClick={() => { setActiveTab('JASA'); setSearch(''); }}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 cursor-pointer ${
              activeTab === 'JASA'
                ? 'bg-[#0F5132] text-white shadow-md scale-102 font-extrabold'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
            }`}
          >
            <span className="text-lg">🛠️</span>
            <span>Jasa & Layanan Booking</span>
          </button>
        </div>
      </div>

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <div className="bg-surface rounded-2xl border border-border p-4 md:p-6 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search input */}
        <div className="w-full md:w-1/2 relative">
          <input
            type="text"
            placeholder={
              activeTab === 'MARKETPLACE'
                ? 'Cari produk UMKM, makanan, kerajinan...'
                : 'Cari jasa, konsultasi, reparasi, desain...'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary text-text-primary"
          />
          <span className="absolute right-3.5 top-2.5 text-text-secondary text-sm">🔍</span>
        </div>

        {/* Categories Pill/Select Filter */}
        <div className="w-full md:w-auto flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
          {activeTab === 'MARKETPLACE' ? (
            <select
              value={selectedProductCategory}
              onChange={(e) => setSelectedProductCategory(e.target.value)}
              className="bg-background border border-border text-text-primary text-xs font-semibold rounded-xl px-3.5 py-2.5 focus:outline-none cursor-pointer"
            >
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'Semua' ? 'Semua Kategori Produk' : formatProductCategory(cat)}
                </option>
              ))}
            </select>
          ) : (
            <select
              value={selectedServiceCategory}
              onChange={(e) => setSelectedServiceCategory(e.target.value)}
              className="bg-background border border-border text-text-primary text-xs font-semibold rounded-xl px-3.5 py-2.5 focus:outline-none cursor-pointer"
            >
              {SERVICE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'Semua' ? 'Semua Kategori Jasa' : cat}
                </option>
              ))}
            </select>
          )}

          {activeTab === 'MARKETPLACE' ? (
            <Link
              href="/market"
              className="px-4 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-xl whitespace-nowrap transition-colors"
            >
              Buka Marketplace Lengkap →
            </Link>
          ) : (
            <Link
              href="/jasa"
              className="px-4 py-2.5 bg-[#0F5132]/10 hover:bg-[#0F5132]/20 text-[#0F5132] text-xs font-bold rounded-xl whitespace-nowrap transition-colors"
            >
              Buka Katalog Jasa Lengkap →
            </Link>
          )}
        </div>
      </div>

      {/* ── CONTENT DISPLAY GRID ── */}
      {activeTab === 'MARKETPLACE' ? (
        /* MARKETPLACE PRODUCTS GRID */
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <span>🛒</span> Produk Marketplace UMKM ({filteredProducts.length})
            </h3>
            <Link href="/market" className="text-xs font-bold text-primary hover:underline">
              Lihat Semua di Halaman Market →
            </Link>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-surface rounded-2xl border border-dashed border-border p-8 space-y-3">
              <div className="text-4xl">🛍️</div>
              <h4 className="font-bold text-text-primary">Tidak ada produk yang cocok</h4>
              <p className="text-xs text-text-secondary">Coba ubah kata kunci pencarian atau kategori filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/market/product/${product.id}`}
                  className="bg-surface rounded-2xl border border-border overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-full h-36 bg-surface-container relative overflow-hidden">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-text-secondary text-xs">
                          📦 Saloka UMKM
                        </div>
                      )}
                      <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-md uppercase">
                        {formatProductCategory(product.category)}
                      </span>
                    </div>

                    <div className="p-3 space-y-1">
                      <h4 className="text-xs font-bold text-text-primary line-clamp-2 group-hover:text-primary transition-colors">
                        {product.title}
                      </h4>
                      <p className="text-sm font-extrabold text-primary font-mono pt-1">
                        Rp {product.price.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 pt-0">
                    <span className="block w-full text-center py-1.5 bg-primary/10 group-hover:bg-primary group-hover:text-white text-primary text-[11px] font-bold rounded-lg transition-colors">
                      Lihat Produk
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* JASA & LAYANAN BOOKING GRID */
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <span>🛠️</span> Layanan Jasa & Booking Keahlian ({filteredServices.length})
            </h3>
            <Link href="/jasa" className="text-xs font-bold text-[#0F5132] hover:underline">
              Lihat Semua di Halaman Jasa →
            </Link>
          </div>

          {filteredServices.length === 0 ? (
            <div className="text-center py-16 bg-surface rounded-2xl border border-dashed border-border p-8 space-y-3">
              <div className="text-4xl">🛠️</div>
              <h4 className="font-bold text-text-primary">Belum ada layanan jasa pada kategori ini</h4>
              <p className="text-xs text-text-secondary">Coba ubah kata kunci pencarian atau kategori filter.</p>
              <Link
                href="/jasa"
                className="inline-block px-4 py-2 bg-[#0F5132] text-white text-xs font-bold rounded-xl shadow mt-2"
              >
                Jelajahi Halaman Jasa
              </Link>
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
                    className="bg-surface rounded-2xl border border-border overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="h-40 bg-surface-container relative overflow-hidden">
                        <img
                          src={firstImage}
                          alt={svc.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                          {svc.category}
                        </span>
                        {svc.location && (
                          <span className="absolute bottom-2.5 left-2.5 bg-white/90 text-slate-800 text-[10px] font-medium px-2 py-0.5 rounded-md shadow-xs">
                            📍 {svc.location}
                          </span>
                        )}
                      </div>

                      <div className="p-4 space-y-2">
                        <h4 className="font-bold text-text-primary text-sm line-clamp-1 group-hover:text-[#0F5132] transition-colors">
                          {svc.title}
                        </h4>
                        <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                          {svc.description || 'Penyedia jasa profesional terverifikasi di Saloka.id.'}
                        </p>

                        {/* Pricing Tags */}
                        <div className="pt-2 flex flex-wrap gap-1.5 border-t border-border">
                          {svc.pricePerSession ? (
                            <div className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                              Sesi: Rp {svc.pricePerSession.toLocaleString('id-ID')}
                            </div>
                          ) : null}
                          {svc.pricePerDay ? (
                            <div className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded text-[10px] font-bold">
                              Harian (Max 8 Jam): Rp {svc.pricePerDay.toLocaleString('id-ID')}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 pt-0">
                      <Link
                        href={`/jasa/${svc.id}`}
                        className="w-full py-2 bg-[#0F5132] hover:bg-[#0a3a24] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <span>📅 Cek Jadwal & Booking</span>
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
