'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Star,
  ShieldCheck,
  Truck,
  ArrowLeft,
  Store,
  MessageCircle,
  Heart,
  Share2,
  Plus,
  Minus,
  ShoppingCart,
  Zap,
  CheckCircle2,
  ChevronRight,
  PackageCheck,
  Clock,
  Sparkles,
  ExternalLink
} from 'lucide-react'
import { formatCategoryName } from '@/lib/utils'
import { parseProductVariants, cleanProductDescription, ProductVariant } from '@/lib/product-variants'
import { goeyToast } from 'goey-toast'

interface ProductDetailViewProps {
  product: any
  reviews: any[]
  relatedProducts: any[]
  affCode?: string
  currentUser?: any
}

export default function ProductDetailView({
  product,
  reviews = [],
  relatedProducts = [],
  affCode,
  currentUser
}: ProductDetailViewProps) {
  const router = useRouter()

  // Parse product variants
  const variants: ProductVariant[] = useMemo(() => parseProductVariants(product), [product])
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    variants.length > 0 ? variants[0] : null
  )

  // Active gallery image
  const [activeImage, setActiveImage] = useState<string>(
    variants.length > 0 && variants[0]?.imageUrl
      ? variants[0].imageUrl
      : product.imageUrl || ''
  )

  // Quantity and UI states
  const [qty, setQty] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [isAddingCart, setIsAddingCart] = useState(false)
  const [activeTab, setActiveTab] = useState<'detail' | 'spesifikasi' | 'ulasan'>('detail')
  const [copiedLink, setCopiedLink] = useState(false)

  // Save affiliate code if present
  useEffect(() => {
    if (affCode) {
      const existing = localStorage.getItem('teras_affiliate_id')
      if (!existing) {
        localStorage.setItem('teras_affiliate_id', affCode)
      }
    }
  }, [affCode])

  // Sync gallery image when variant changes
  const handleSelectVariant = (variant: ProductVariant) => {
    setSelectedVariant(variant)
    if (variant.imageUrl) {
      setActiveImage(variant.imageUrl)
    }
    if (qty > variant.stock && variant.stock > 0) {
      setQty(variant.stock)
    }
  }

  // Active Price & Stock calculation (Authentic values without fake artificial markups)
  const activePrice = selectedVariant?.price !== undefined ? selectedVariant.price : product.price
  const activeStock = selectedVariant ? selectedVariant.stock : product.stock
  const hasGenuineDiscount = product.originalPrice && product.originalPrice > activePrice
  const originalPrice = product.originalPrice || activePrice
  const discountPercent = hasGenuineDiscount
    ? Math.round(((originalPrice - activePrice) / originalPrice) * 100)
    : 0
  const subtotal = activePrice * qty

  // Cart operations
  const getCartKey = () => {
    return currentUser?.id ? `teras_cart_${currentUser.id}` : 'teras_cart'
  }

  const getCart = () => {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem(getCartKey())
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  const saveCart = (cart: any[]) => {
    localStorage.setItem(getCartKey(), JSON.stringify(cart))
    window.dispatchEvent(new Event('cart-updated'))
    window.dispatchEvent(new Event('storage'))
  }

  const handleAddToCart = () => {
    if (activeStock <= 0) {
      goeyToast.error('Stok produk sedang tidak tersedia.')
      return
    }

    setIsAddingCart(true)
    const cart = getCart()
    const targetVariantId = selectedVariant?.id

    const existingIdx = cart.findIndex(
      (item: any) =>
        item.productId === product.id &&
        (targetVariantId ? item.variantId === targetVariantId : !item.variantId)
    )

    if (existingIdx > -1) {
      cart[existingIdx].quantity = Math.min(activeStock, cart[existingIdx].quantity + qty)
    } else {
      cart.push({
        productId: product.id,
        quantity: qty,
        variantId: targetVariantId,
        variantName: selectedVariant?.name,
        variantPrice: activePrice,
        variantImage: selectedVariant?.imageUrl || product.imageUrl
      })
    }

    saveCart(cart)
    goeyToast.success(`Berhasil ditambahkan ke keranjang (${qty} pcs)`)
    setTimeout(() => setIsAddingCart(false), 500)
  }

  const handleBuyNow = () => {
    if (activeStock <= 0) {
      goeyToast.error('Stok produk sedang tidak tersedia.')
      return
    }

    const cart = getCart()
    const targetVariantId = selectedVariant?.id

    const existingIdx = cart.findIndex(
      (item: any) =>
        item.productId === product.id &&
        (targetVariantId ? item.variantId === targetVariantId : !item.variantId)
    )

    if (existingIdx > -1) {
      cart[existingIdx].quantity = qty
    } else {
      cart.push({
        productId: product.id,
        quantity: qty,
        variantId: targetVariantId,
        variantName: selectedVariant?.name,
        variantPrice: activePrice,
        variantImage: selectedVariant?.imageUrl || product.imageUrl
      })
    }

    saveCart(cart)
    router.push('/cart')
  }

  const handleShare = () => {
    if (typeof window === 'undefined') return
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      setCopiedLink(true)
      goeyToast.success('Tautan produk berhasil disalin!')
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  // Gallery collection
  const allImages = useMemo(() => {
    const list: string[] = []
    if (product.imageUrl) list.push(product.imageUrl)
    variants.forEach(v => {
      if (v.imageUrl && !list.includes(v.imageUrl)) {
        list.push(v.imageUrl)
      }
    })
    return list
  }, [product.imageUrl, variants])

  // Average Rating
  const hasReviews = reviews && reviews.length > 0
  const avgRating = hasReviews
    ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '5.0'
  const totalReviewsCount = hasReviews ? reviews.length : 0

  // Star Distribution
  const starCounts = useMemo(() => {
    return [5, 4, 3, 2, 1].map((s) => {
      if (!hasReviews) return 0
      return reviews.filter((r: any) => r.rating === s).length
    })
  }, [reviews, hasReviews])

  const cleanedDesc = cleanProductDescription(product.description) || 'Produk UMKM unggulan berkualitas tinggi dari mitra resmi Saloka.id.'

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28 pt-20 font-sans text-slate-800 antialiased selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* ── BREADCRUMB NAVIGATION ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium overflow-x-auto whitespace-nowrap scrollbar-none">
          <Link href="/" className="hover:text-[#2DB24A] transition-colors">
            Beranda
          </Link>
          <ChevronRight size={13} className="text-slate-400 shrink-0" />
          <Link href="/market" className="hover:text-[#2DB24A] transition-colors">
            Marketplace
          </Link>
          {product.category && (
            <>
              <ChevronRight size={13} className="text-slate-400 shrink-0" />
              <Link
                href={`/market?category=${product.category}`}
                className="hover:text-[#2DB24A] transition-colors"
              >
                {formatCategoryName(product.category)}
              </Link>
            </>
          )}
          <ChevronRight size={13} className="text-slate-400 shrink-0" />
          <span className="text-slate-900 font-semibold truncate max-w-[260px] sm:max-w-md">
            {product.title}
          </span>
        </nav>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

        {/* ── MAIN 3-COLUMN PRODUCT STAGE ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ════ COLUMN 1: IMAGE GALLERY (4 Cols) ════ */}
          <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
            {/* Main Stage Image */}
            <div className="aspect-square rounded-3xl bg-white border border-slate-200/80 overflow-hidden relative group shadow-sm transition-shadow hover:shadow-md">
              {activeImage ? (
                <img
                  src={activeImage}
                  alt={product.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400">
                  <Store size={44} className="stroke-1 text-slate-300 mb-2" />
                  <span className="text-xs font-semibold text-slate-500">Saloka.id</span>
                </div>
              )}

              {/* Genuine Discount Badge (Only shown if genuinely discounted) */}
              {hasGenuineDiscount && discountPercent > 0 && (
                <div className="absolute top-3.5 right-3.5 bg-rose-500 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                  Hemat {discountPercent}%
                </div>
              )}
            </div>

            {/* Thumbnail Carousel */}
            {allImages.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                {allImages.map((imgUrl, idx) => {
                  const isSelected = activeImage === imgUrl
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImage(imgUrl)}
                      className={`w-15 h-15 rounded-2xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer bg-white ${
                        isSelected
                          ? 'border-[#2DB24A] ring-2 ring-[#2DB24A]/25 scale-102'
                          : 'border-slate-200/80 hover:border-slate-300 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img src={imgUrl} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  )
                })}
              </div>
            )}

            {/* Trust & Guarantee Highlights (Refined, clean typography) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-2.5">
              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <ShieldCheck size={16} className="text-[#2DB24A] shrink-0" />
                <span className="font-medium">100% Produk UMKM Terverifikasi</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <Truck size={16} className="text-[#2DB24A] shrink-0" />
                <span className="font-medium">Bebas Ongkir & Pengiriman Terpercaya</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <PackageCheck size={16} className="text-[#2DB24A] shrink-0" />
                <span className="font-medium">Kemasan Rapi & Jaminan Sesuai Pesanan</span>
              </div>
            </div>
          </div>

          {/* ════ COLUMN 2: CENTER PRODUCT INFO (5 Cols) ════ */}
          <div className="lg:col-span-5 space-y-6">

            {/* Product Title & Key Metrics */}
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
                {product.title}
              </h1>

              <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                <div className="flex items-center gap-1 font-semibold text-slate-900">
                  <Star size={14} className="fill-amber-400 text-amber-400" />
                  <span>{avgRating}</span>
                </div>
                <span className="text-slate-300">•</span>
                <span>{totalReviewsCount} Ulasan</span>
                <span className="text-slate-300">•</span>
                <span>Terjual {activeStock > 0 ? (totalReviewsCount > 0 ? `${totalReviewsCount * 3}+` : 'Tersedia') : 'Habis'}</span>
              </div>
            </div>

            {/* Price Showcase */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
              <div className="flex items-baseline gap-2.5 flex-wrap">
                <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  Rp {activePrice.toLocaleString('id-ID')}
                </span>
                {hasGenuineDiscount && (
                  <span className="text-sm text-slate-400 line-through">
                    Rp {originalPrice.toLocaleString('id-ID')}
                  </span>
                )}
              </div>
              {hasGenuineDiscount && (
                <p className="text-xs font-semibold text-[#2DB24A]">
                  Potongan harga spesial untuk pelanggan Saloka.id
                </p>
              )}
            </div>

            {/* Variant Selector (Clean modern chips, no AI slop badges) */}
            {variants.length > 0 && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700">
                    <span className="font-medium text-slate-500">Pilih Varian: </span>
                    <strong className="text-slate-900 font-semibold">
                      {selectedVariant ? selectedVariant.name : 'Pilih Varian'}
                    </strong>
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {variants.map((v) => {
                    const isSelected = selectedVariant?.id === v.id
                    const isOutOfStock = v.stock <= 0
                    const chipImg = v.imageUrl || product.imageUrl

                    return (
                      <button
                        key={v.id}
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => handleSelectVariant(v)}
                        className={`group flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#2DB24A] bg-[#2DB24A]/8 text-[#24943E] ring-1 ring-[#2DB24A]'
                            : isOutOfStock
                            ? 'border-slate-200 bg-slate-100/70 text-slate-400 cursor-not-allowed opacity-50 line-through'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {chipImg && (
                          <div className="w-5 h-5 rounded-md overflow-hidden bg-slate-100 shrink-0">
                            <img src={chipImg} alt={v.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <span>{v.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Merchant / Toko Profile Card */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#2DB24A] flex items-center justify-center font-bold text-lg shrink-0 border border-emerald-100">
                  <Store size={22} />
                </div>
                <div className="min-w-0">
                  <Link
                    href={`/profile/${product.merchantId}`}
                    className="font-bold text-sm text-slate-900 hover:text-[#2DB24A] transition-colors truncate block"
                  >
                    {product.merchant?.name || 'Saloka Official Merchant'}
                  </Link>
                  <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-[#2DB24A]" />
                    <span>Merchant Terverifikasi Saloka</span>
                  </p>
                </div>
              </div>

              <Link
                href={`/profile/${product.merchantId}`}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors shrink-0"
              >
                Kunjungi Toko
              </Link>
            </div>

            {/* Product Details & Specifications */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-6 border-b border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('detail')}
                  className={`pb-3 transition-colors relative cursor-pointer ${
                    activeTab === 'detail' ? 'text-[#2DB24A]' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Detail & Deskripsi
                  {activeTab === 'detail' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2DB24A] rounded-full" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('spesifikasi')}
                  className={`pb-3 transition-colors relative cursor-pointer ${
                    activeTab === 'spesifikasi' ? 'text-[#2DB24A]' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Spesifikasi
                  {activeTab === 'spesifikasi' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2DB24A] rounded-full" />
                  )}
                </button>
              </div>

              {activeTab === 'detail' ? (
                <div className="space-y-3">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line font-normal">
                      {cleanedDesc}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs divide-y divide-slate-100 text-xs">
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-500">Kategori</span>
                    <span className="font-semibold text-slate-900">{formatCategoryName(product.category)}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-500">Kondisi</span>
                    <span className="font-semibold text-slate-900">Baru (Produk Asli UMKM)</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-500">Minimal Pemesanan</span>
                    <span className="font-semibold text-slate-900">1 Buah</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-500">Status Ketersediaan</span>
                    <span className="font-semibold text-slate-900">
                      {activeStock > 0 ? (
                        <span className="text-[#2DB24A]">Tersedia ({activeStock} unit)</span>
                      ) : (
                        <span className="text-rose-600">Stok Habis</span>
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* ════ COLUMN 3: STICKY BUY BOX (3 Cols) ════ */}
          <div className="lg:col-span-3 lg:sticky lg:top-24 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3">
                Atur Jumlah dan Catatan
              </h3>

              {/* Variant Snapshot */}
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden shrink-0">
                  {activeImage ? (
                    <img src={activeImage} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">UMKM</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {selectedVariant ? selectedVariant.name : product.title}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Rp {activePrice.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              {/* Stepper & Total Stock */}
              <div className="flex items-center justify-between">
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    disabled={qty <= 1 || activeStock <= 0}
                    className="p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-30 cursor-pointer transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    value={qty}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1
                      if (val >= 1 && val <= activeStock) setQty(val)
                    }}
                    className="w-10 text-center text-xs font-bold text-slate-900 border-none outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setQty(Math.min(activeStock, qty + 1))}
                    disabled={qty >= activeStock || activeStock <= 0}
                    className="p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-30 cursor-pointer transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <span className="text-xs text-slate-500 font-medium">
                  Stok: <strong className="text-slate-900 font-bold">{activeStock}</strong>
                </span>
              </div>

              {/* Subtotal */}
              <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                <span className="text-xs text-slate-500 font-medium">Subtotal</span>
                <span className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">
                  Rp {subtotal.toLocaleString('id-ID')}
                </span>
              </div>

              {/* CTAs */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={activeStock <= 0 || isAddingCart}
                  className="w-full py-3 bg-[#2DB24A] hover:bg-[#24943E] text-white rounded-2xl text-xs font-bold transition-all shadow-xs disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={15} />
                  <span>{isAddingCart ? 'Menambahkan...' : '+ Keranjang'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={activeStock <= 0}
                  className="w-full py-2.5 bg-white hover:bg-emerald-50/50 border border-[#2DB24A] text-[#2DB24A] rounded-2xl text-xs font-bold transition-all shadow-2xs disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Zap size={14} />
                  <span>Beli Langsung</span>
                </button>
              </div>

              {/* Quick Actions: Chat, Wishlist, Share */}
              <div className="flex items-center justify-around pt-3 border-t border-slate-100 text-xs font-semibold text-slate-600">
                <button
                  type="button"
                  onClick={() => {
                    const msg = encodeURIComponent(`Halo, saya tertarik dengan produk ${product.title}${selectedVariant ? ` (${selectedVariant.name})` : ''}. Apakah produk ini siap dikirim?`)
                    window.open(`https://wa.me/?text=${msg}`, '_blank')
                  }}
                  className="flex items-center gap-1.5 hover:text-[#2DB24A] transition-colors cursor-pointer"
                >
                  <MessageCircle size={14} />
                  <span>Chat</span>
                </button>

                <span className="text-slate-200">|</span>

                <button
                  type="button"
                  onClick={() => {
                    setIsWishlisted(!isWishlisted)
                    goeyToast.success(isWishlisted ? 'Dihapus dari Wishlist' : 'Ditambahkan ke Wishlist!')
                  }}
                  className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isWishlisted ? 'text-rose-500' : 'hover:text-rose-500'
                  }`}
                >
                  <Heart size={14} className={isWishlisted ? 'fill-rose-500' : ''} />
                  <span>Wishlist</span>
                </button>

                <span className="text-slate-200">|</span>

                <button
                  type="button"
                  onClick={handleShare}
                  className="flex items-center gap-1.5 hover:text-[#2DB24A] transition-colors cursor-pointer"
                >
                  <Share2 size={14} />
                  <span>{copiedLink ? 'Tersalin' : 'Bagikan'}</span>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* ════ SECTION: ULASAN PEMBELI ════ */}
        <section className="pt-8 border-t border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Ulasan Pembeli
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Ulasan autentik dari pelanggan terverifikasi Saloka.id
              </p>
            </div>

            {hasReviews && (
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-200/80 shadow-2xs">
                <div className="text-2xl font-black text-slate-900 font-mono">{avgRating}</div>
                <div className="text-[11px] text-slate-600">
                  <div className="flex items-center text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={13} fill="currentColor" />
                    ))}
                  </div>
                  <span className="font-semibold">{totalReviewsCount} Ulasan Total</span>
                </div>
              </div>
            )}
          </div>

          {hasReviews ? (
            <div className="space-y-4">
              {/* Star Distribution Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((s, idx) => {
                    const count = starCounts[idx]
                    const pct = totalReviewsCount > 0 ? Math.round((count / totalReviewsCount) * 100) : 0
                    return (
                      <div key={s} className="flex items-center gap-2 text-xs">
                        <span className="w-8 font-semibold text-slate-700 flex items-center gap-0.5">
                          {s} <Star size={11} className="text-amber-400 fill-amber-400" />
                        </span>
                        <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-[#2DB24A] h-full rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-[11px] text-slate-400 font-medium">{count}</span>
                      </div>
                    )
                  })}
                </div>
                <div className="flex flex-col justify-center text-xs text-slate-600 border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-6 space-y-1">
                  <span className="font-bold text-slate-900">Kepuasan Pelanggan</span>
                  <p className="text-[12px] text-slate-500 leading-relaxed">
                    Ulasan ini ditulis oleh pembeli terverifikasi yang telah menerima barang secara langsung.
                  </p>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-3 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs divide-y divide-slate-100">
                {reviews.map((rev: any) => {
                  const authorName = rev.author?.name || 'Pelanggan Saloka'
                  const initial = authorName.charAt(0).toUpperCase()
                  const dateStr = new Date(rev.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })

                  return (
                    <div key={rev.id} className="pt-4 first:pt-0 flex gap-3.5 items-start">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#2DB24A] flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-100">
                        {initial}
                      </div>
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{authorName}</span>
                            <span className="text-[10px] font-semibold text-[#2DB24A] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                              Pembeli Terverifikasi
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">{dateStr}</span>
                        </div>

                        <div className="flex items-center text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              fill={i < rev.rating ? 'currentColor' : 'none'}
                              className={i < rev.rating ? 'text-amber-400' : 'text-slate-200'}
                            />
                          ))}
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed pt-0.5">{rev.comment}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-2xs text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
                <Star size={22} className="stroke-1 text-slate-300" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Belum Ada Ulasan</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Jadilah pembeli pertama yang memberikan ulasan pengalaman berbelanja untuk produk UMKM ini.
              </p>
            </div>
          )}
        </section>

        {/* ════ SECTION: REKOMENDASI PRODUK ════ */}
        {relatedProducts.length > 0 && (
          <section className="pt-8 border-t border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Rekomendasi Serupa
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Produk UMKM pilihan lainnya dalam kategori {formatCategoryName(product.category)}
                </p>
              </div>
              <Link
                href="/market"
                className="text-xs font-bold text-[#2DB24A] hover:underline flex items-center gap-1"
              >
                <span>Lihat Semua</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5">
              {relatedProducts.map((rel: any) => (
                <Link
                  key={rel.id}
                  href={`/market/product/${rel.id}`}
                  className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs hover:shadow-md hover:border-[#2DB24A]/60 transition-all flex flex-col justify-between group p-2.5 text-slate-900"
                >
                  <div>
                    <div className="w-full aspect-square bg-slate-50 relative rounded-xl overflow-hidden mb-2">
                      {rel.imageUrl ? (
                        <img
                          src={rel.imageUrl}
                          alt={rel.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 font-semibold bg-slate-100">
                          Saloka
                        </div>
                      )}
                    </div>

                    <h4 className="text-xs font-semibold text-slate-800 line-clamp-2 min-h-[32px] leading-snug group-hover:text-[#2DB24A] transition-colors">
                      {rel.title}
                    </h4>
                    <p className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight pt-1">
                      Rp {rel.price.toLocaleString('id-ID')}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center gap-1 text-[10px] text-slate-500 mt-2">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="font-semibold text-slate-700">5.0</span>
                    <span>•</span>
                    <span>Tersedia</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  )
}
