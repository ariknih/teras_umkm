'use client'

import React, { useState, useMemo, useEffect } from 'react'
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
import { getSnackboxProducts } from '@/app/actions/products'
import { SnackboxCategory, SnackboxProduct } from '@/types/snackbox'
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
  'KUE_TRADISIONAL',
  'SNACK_GURIH',
  'SNACK_MANIS',
  'KUE_KERING',
  'JAJANAN_PASAR',
  'MAKANAN_MINUMAN',
  'KAFE'
]

export default function SnackboxPage() {
  const { kelurahan, setIsKelurahanModalOpen } = useSnackbox()
  const [activeCategory, setActiveCategory] = useState<SnackboxCategory>('Semua')
  const [searchQuery, setSearchQuery] = useState('')
  const [visibleExploreCount, setVisibleExploreCount] = useState(10)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [allProducts, setAllProducts] = useState<SnackboxProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    getSnackboxProducts({}).then(products => {
      if (!cancelled) {
        setAllProducts(products as SnackboxProduct[])
        setIsLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [])

  // 1. Products in user's active Kelurahan (ponytail: plain string match on kelurahanName,
  // fine at current merchant counts — upgrade to a real kelurahanId FK once there's a real
  // kelurahan reference table backing merchant products, not mock Kelurahan fixtures)
  const localProducts = useMemo(() => {
    const direct = allProducts.filter(p => p.kelurahanName.toLowerCase() === kelurahan.name.toLowerCase())
    if (direct.length > 0) return direct
    // Curated fallback: show a few items from elsewhere, deliverable to this kelurahan
    return allProducts.slice(0, 10)
  }, [allProducts, kelurahan.name])

  // 2. Trending Products across other Kelurahans (no real trending signal yet — always empty for real data)
  const trendingOtherProducts = useMemo(() => {
    return allProducts
      .filter(p => p.kelurahanName.toLowerCase() !== kelurahan.name.toLowerCase() && (p.isTrending || p.isBestSeller))
      .slice(0, 5)
  }, [allProducts, kelurahan.name])

  // 3. Explore all items with category and search filter
  const exploreFilteredProducts = useMemo(() => {
    let list = allProducts
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
  }, [allProducts, activeCategory, searchQuery])

  // Item counts for category pills
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { Semua: allProducts.length }
    allProducts.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1
    })
    return counts
  }, [allProducts])

  return (
    <div className="relative min-h-screen bg-slate-50 font-inter pb-32">
      {/* ── 1. HEADER BAR: LOKASI KELURAHAN & KERANJANG BOX ── */}
      <SnackboxHeader />

      <div className="max-w-[1200px] mx-auto px-3.5 sm:px-6 space-y-6">

        {/* ── COMPACT PAGE TITLE (Marketplace style) ── */}
        <div id="page-title" className="pb-1 border-b border-slate-200/60">
          <h1 className="text-base sm:text-lg font-bold text-gray-800 mb-0.5 flex items-center gap-2">
            <span>Snackbox Kelurahan</span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-primary-container text-on-primary-container border border-slate-200">
              Kel. {kelurahan.name}
            </span>
          </h1>
          <p className="text-xs text-gray-500">
            Pesan aneka kue & jajanan pasar terkurasi dari pembuat kue lokal. Dikemas rapi & diantar langsung oleh Saloka.
          </p>
        </div>

        {/* ── 2. SECTION: SNACK DI SEKITAR KELURAHAN AKTIF ── */}
        <section id="nearby-snacks" className="flex flex-col items-start gap-5 self-stretch p-5 rounded-2xl border border-neutral-shade-50 bg-white">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-on-primary-container" />
              <h2 className="text-sm font-bold text-slate-900">
                Snack di Sekitar Kelurahan {kelurahan.name}
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-slate-500">
              {localProducts.length} Pilihan Menu
            </span>
          </div>

          {isLoading ? (
            <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
              {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : localProducts.length === 0 ? (
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
                className="px-4 py-1.5 rounded-lg bg-on-primary-container hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
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
          <section id="trending-other-kelurahan" className="flex flex-col items-start gap-5 self-stretch p-5 rounded-2xl border border-neutral-shade-50 bg-white">
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
        <section id="explore-catalog" className="flex flex-col items-start gap-5 self-stretch p-5 rounded-2xl border border-neutral-shade-50 bg-white">
          <div className="flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-on-primary-container" />
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
              className="w-full pl-9 pr-9 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-on-primary-container focus:ring-1 focus:ring-on-primary-container/20 transition-all font-medium"
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
          {isLoading ? (
            <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
              {Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : exploreFilteredProducts.length === 0 ? (
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
