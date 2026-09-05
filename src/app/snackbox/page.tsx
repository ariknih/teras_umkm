'use client'

import React, { useState, useMemo } from 'react'
import {
  Package,
  MapPin,
  TrendingUp,
  Compass,
  Search,
  X,
  ChefHat
} from 'lucide-react'
import { useSnackbox } from '@/context/SnackboxContext'
import { mockSnackboxProducts } from '@/lib/mock-snackbox'
import { SnackboxCategory } from '@/types/snackbox'
import SnackboxHeader from '@/components/snackbox/SnackboxHeader'
import SnackboxProductCard from '@/components/snackbox/SnackboxProductCard'
import SnackboxCategoryTabs from '@/components/snackbox/SnackboxCategoryTabs'
import SnackboxMerchantCTA from '@/components/snackbox/SnackboxMerchantCTA'
import KelurahanSwitcherModal from '@/components/snackbox/KelurahanSwitcherModal'
import SnackboxCartDrawer from '@/components/snackbox/SnackboxCartDrawer'
import SnackboxStickyCartBar from '@/components/snackbox/SnackboxStickyCartBar'
import { ProductCardSkeleton } from '@/components/ui/GhostSkeleton'

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
  const [searchQuery, setSearchQuery] = useState('')
  const [visibleExploreCount, setVisibleExploreCount] = useState(10)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // 1. Products in user's active Kelurahan or deliverable partner kitchens
  const localProducts = useMemo(() => {
    const direct = mockSnackboxProducts.filter(
      p => p.kelurahanId === kelurahan.id || p.kelurahanName.toLowerCase() === kelurahan.name.toLowerCase()
    )
    if (direct.length > 0) return direct

    // Curated partner items deliverable to this kelurahan
    return mockSnackboxProducts.slice(0, 10).map(p => ({
      ...p,
      kelurahanId: kelurahan.id,
      kelurahanName: kelurahan.name
    }))
  }, [kelurahan.id, kelurahan.name])

  // 2. Trending Products across other Kelurahans
  const trendingOtherProducts = useMemo(() => {
    return mockSnackboxProducts
      .filter(p => p.kelurahanId !== kelurahan.id && (p.isTrending || p.isBestSeller))
      .slice(0, 5)
  }, [kelurahan.id])

  // 3. Explore all items with category and search filter
  const exploreFilteredProducts = useMemo(() => {
    let list = mockSnackboxProducts
    if (activeCategory !== 'Semua') {
      list = list.filter(p => p.category === activeCategory)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        p =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.kelurahanName.toLowerCase().includes(q)
      )
    }
    return list
  }, [activeCategory, searchQuery])

  // Item counts for category pills
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { Semua: mockSnackboxProducts.length }
    mockSnackboxProducts.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1
    })
    return counts
  }, [])

  return (
    <div className="relative min-h-screen bg-[#F5F7FA] font-inter pb-32">
      {/* ── 1. HEADER BAR: LOKASI KELURAHAN & KERANJANG BOX ── */}
      <SnackboxHeader />

      <div className="max-w-[1200px] mx-auto px-3.5 sm:px-6 space-y-6">

        {/* ── COMPACT PAGE TITLE (Marketplace style) ── */}
        <div id="page-title" className="pb-1 border-b border-slate-200/60">
          <h1 className="text-base sm:text-lg font-bold text-gray-800 mb-0.5 flex items-center gap-2">
            <span>Snackbox Kelurahan</span>
            <span className="text-[10px] font-extrabold px-2 py-0.2 rounded-full bg-[#E8F5E9] text-[#006E24] border border-[#C8E6C9]">
              Kel. {kelurahan.name}
            </span>
          </h1>
          <p className="text-xs text-gray-500">
            Pesan aneka kue & jajanan pasar terkurasi dari pembuat kue lokal. Dikemas rapi & diantar langsung oleh Saloka.
          </p>
        </div>

        {/* ── 2. SECTION: SNACK DI SEKITAR KELURAHAN AKTIF ── */}
        <section id="nearby-snacks" className="flex flex-col items-start gap-5 self-stretch p-5 rounded-2xl border border-[#EAEAEA] bg-white">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#006E24]" />
              <h2 className="text-sm font-bold text-slate-900">
                Snack di Sekitar Kelurahan {kelurahan.name}
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-slate-500">
              {localProducts.length} Pilihan Menu
            </span>
          </div>

          {localProducts.length === 0 ? (
            <div className="w-full text-center py-12 rounded-xl bg-white border border-slate-200/80">
              <ChefHat className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h3 className="font-bold text-xs text-slate-700 mb-0.5">
                Dapur di Kelurahan {kelurahan.name} Sedang Dikurasi
              </h3>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto mb-3">
                Anda tetap bisa memesan pilihan kue lezat dari kelurahan sekitar.
              </p>
              <button
                type="button"
                onClick={() => setIsKelurahanModalOpen(true)}
                className="px-4 py-1.5 rounded-lg bg-[#006E24] hover:bg-[#005a1d] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Pilih Kelurahan Lain
              </button>
            </div>
          ) : (
            <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
              {localProducts.map(product => (
                <SnackboxProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

        {/* ── 3. SECTION: TRENDING DI KELURAHAN LAIN ── */}
        {trendingOtherProducts.length > 0 && (
          <section id="trending-other-kelurahan" className="flex flex-col items-start gap-5 self-stretch p-5 rounded-2xl border border-[#EAEAEA] bg-white">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Snack yang Laku Banget di Kelurahan Lain
              </h2>
            </div>

            <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
              {trendingOtherProducts.map(product => (
                <SnackboxProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* ── 4. SECTION: JELAJAH DI KELURAHAN LAIN (KATEGORI & KATALOG) ── */}
        <section id="explore-catalog" className="flex flex-col items-start gap-5 self-stretch p-5 rounded-2xl border border-[#EAEAEA] bg-white">
          <div className="flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-[#006E24]" />
            <h2 className="text-sm font-bold text-slate-900">
              Jelajah Seluruh Katalog Snackbox
            </h2>
          </div>

          {/* Quick Search Bar */}
          <div className="relative w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Cari kue, snack, atau rasa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#006E24] focus:ring-1 focus:ring-[#006E24]/20 transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Pills Bar */}
          <SnackboxCategoryTabs
            categories={CATEGORIES}
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
            itemCounts={categoryCounts}
          />

          {/* Grid Products */}
          {exploreFilteredProducts.length === 0 ? (
            <div className="w-full text-center py-16 rounded-xl bg-white border border-slate-200">
              <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <h3 className="font-bold text-xs text-slate-700 mb-0.5">Produk Tidak Ditemukan</h3>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto mb-3">
                Coba kata kunci lain atau pilih kategori lain.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('Semua')
                  setSearchQuery('')
                }}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <div className="w-full space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
                {exploreFilteredProducts.slice(0, visibleExploreCount).map(product => (
                  <SnackboxProductCard key={product.id} product={product} />
                ))}

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

              {exploreFilteredProducts.length > visibleExploreCount && (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    disabled={isLoadingMore}
                    onClick={() => {
                      setIsLoadingMore(true)
                      setTimeout(() => {
                        setVisibleExploreCount(prev => prev + 10)
                        setIsLoadingMore(false)
                      }, 300)
                    }}
                    className="px-6 py-2.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs uppercase tracking-wider rounded-xl border border-slate-200 shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>{isLoadingMore ? 'Memuat Menu...' : 'Muat Lebih Banyak Menu'}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({Math.min(visibleExploreCount, exploreFilteredProducts.length)} / {exploreFilteredProducts.length})</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── 5. SECTION: BANNER ONBOARDING MERCHANT KUE ── */}
        <section id="merchant-cta" className="pt-2">
          <SnackboxMerchantCTA />
        </section>
      </div>

      {/* Switcher Modal & Cart Drawer */}
      <KelurahanSwitcherModal />
      <SnackboxCartDrawer />
      <SnackboxStickyCartBar />
    </div>
  )
}
