'use client'

import React, { useState, useMemo } from 'react'
import {
  Package,
  MapPin,
  Sparkles,
  TrendingUp,
  Compass,
  ArrowRight,
  ShieldCheck,
  Search,
  SlidersHorizontal,
  ChefHat
} from 'lucide-react'
import { useSnackbox } from '@/context/SnackboxContext'
import { mockSnackboxProducts } from '@/lib/mock-snackbox'
import { SnackboxCategory, SnackboxProduct } from '@/types/snackbox'
import SnackboxHeader from '@/components/snackbox/SnackboxHeader'
import SnackboxProductCard from '@/components/snackbox/SnackboxProductCard'
import SnackboxCategoryTabs from '@/components/snackbox/SnackboxCategoryTabs'
import SnackboxMerchantCTA from '@/components/snackbox/SnackboxMerchantCTA'
import KelurahanSwitcherModal from '@/components/snackbox/KelurahanSwitcherModal'
import SnackboxCartDrawer from '@/components/snackbox/SnackboxCartDrawer'

const CATEGORIES: SnackboxCategory[] = [
  'Semua',
  'Snack Manis',
  'Snack Gurih',
  'Kue Tradisional',
  'Kue Basah',
  'Kue Kering',
  'Makanan Ringan',
  'Jajanan',
  'Cemilan',
  'Snack Kekinian'
]

export default function SnackboxPage() {
  const { kelurahan, setIsKelurahanModalOpen } = useSnackbox()
  const [activeCategory, setActiveCategory] = useState<SnackboxCategory>('Semua')
  const [browseSearchQuery, setBrowseSearchQuery] = useState('')

  // 1. Products in user's active Kelurahan
  const localProducts = useMemo(() => {
    return mockSnackboxProducts.filter(p => p.kelurahanId === kelurahan.id)
  }, [kelurahan.id])

  // 2. Trending Products across other Kelurahans
  const trendingOtherProducts = useMemo(() => {
    return mockSnackboxProducts
      .filter(p => p.kelurahanId !== kelurahan.id && (p.isTrending || p.isBestSeller))
      .slice(0, 6)
  }, [kelurahan.id])

  // 3. Explore all items with category and search filter
  const exploreFilteredProducts = useMemo(() => {
    let list = mockSnackboxProducts
    if (activeCategory !== 'Semua') {
      list = list.filter(p => p.category === activeCategory)
    }
    if (browseSearchQuery.trim()) {
      const q = browseSearchQuery.toLowerCase().trim()
      list = list.filter(
        p =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.kelurahanName.toLowerCase().includes(q)
      )
    }
    return list
  }, [activeCategory, browseSearchQuery])

  // Item counts for category pills
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { Semua: mockSnackboxProducts.length }
    mockSnackboxProducts.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1
    })
    return counts
  }, [])

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20">
      {/* ── 1. HEADER BAR: KELURAHAN & CART BUTTON ── */}
      <SnackboxHeader />

      {/* ── HERO BANNER ── */}
      <section className="relative bg-gradient-to-b from-white to-slate-50 border-b border-slate-200/80 pt-6 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs font-bold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#2DB24A]" />
              <span>Snackbox Kurasi Resmi Saloka</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight">
              Snackbox Lezat & Higienis di <span className="text-[#2DB24A]">Kelurahan {kelurahan.name}</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Pilih aneka kue basah, snack gurih, dan jajanan pasar buatan pelaku usaha lokal terbaik di kelurahanmu. Dikemas dalam box rapi standar Saloka dan diantar tepat waktu untuk rapat, seminar, dan acara keluarga.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* ── 2. SECTION: SNACK DI SEKITAR KELURAHAN SEKARANG ── */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-emerald-100 text-[#2DB24A]">
                  <MapPin className="w-4 h-4" />
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                  Snack di sekitar Kelurahan {kelurahan.name}
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Kue dan snack segar yang siap diantar cepat dari dapur sekitar kelurahan Anda
              </p>
            </div>

            <span className="text-xs font-bold text-slate-500">
              {localProducts.length} Pilihan Menu
            </span>
          </div>

          {localProducts.length === 0 ? (
            /* Empty state for current kelurahan */
            <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 text-center shadow-xs">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4">
                <ChefHat className="w-8 h-8" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">
                Menu di Kelurahan {kelurahan.name} Sedang Dikurasi
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1.5 leading-relaxed">
                Belum ada menu kue aktif langsung di kelurahan ini, namun Anda tetap bisa memesan snackbox lezat dari kelurahan sekitar yang menjangkau lokasi Anda.
              </p>
              <div className="mt-5 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsKelurahanModalOpen(true)}
                  className="px-5 py-2.5 rounded-2xl bg-[#2DB24A] hover:bg-[#24943E] text-white text-xs font-bold transition-all shadow-sm active:scale-95"
                >
                  Ganti Kelurahan Lain
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {localProducts.map(product => (
                <SnackboxProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

        {/* ── 3. SECTION: SNACK YANG LAKU BANGET DI KELURAHAN LAIN ── */}
        {trendingOtherProducts.length > 0 && (
          <section className="space-y-4 pt-4 border-t border-slate-200/80">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-amber-100 text-amber-700">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                  Snack yang Laku Banget di Kelurahan Lain
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Menu favorit dan terlaris pelanggan Saloka yang bisa dikirim ke lokasimu
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-5">
              {trendingOtherProducts.map(product => (
                <SnackboxProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* ── 4. SECTION: JELAJAH DI KELURAHAN LAIN (CATEGORY FILTER & SEARCH) ── */}
        <section className="space-y-5 pt-4 border-t border-slate-200/80">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-blue-100 text-blue-700">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                  Jelajah Seluruh Katalog Snackbox
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Filter berdasarkan jenis kudapan, rasa, atau kebutuhan acara
                </p>
              </div>
            </div>

            {/* Quick Search */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={browseSearchQuery}
                onChange={e => setBrowseSearchQuery(e.target.value)}
                placeholder="Cari kue, bolu, risoles..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#2DB24A] focus:ring-1 focus:ring-[#2DB24A]/20 transition-all"
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <SnackboxCategoryTabs
            categories={CATEGORIES}
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
            itemCounts={categoryCounts}
          />

          {/* Filtered Grid */}
          {exploreFilteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center">
              <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="font-bold text-sm text-slate-800">Tidak ada produk yang cocok</h4>
              <p className="text-xs text-slate-500 mt-1">
                Coba ganti kategori atau hapus kata kunci pencarian Anda.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('Semua')
                  setBrowseSearchQuery('')
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {exploreFilteredProducts.map(product => (
                <SnackboxProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

        {/* ── 5. BANNER CTA MERCHANT ONBOARDING ── */}
        <section className="pt-4">
          <SnackboxMerchantCTA />
        </section>
      </div>

      {/* ── MODAL SWITCHER & CART DRAWER ── */}
      <KelurahanSwitcherModal />
      <SnackboxCartDrawer />
    </div>
  )
}
