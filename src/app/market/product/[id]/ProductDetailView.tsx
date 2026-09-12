'use client'

import React, { useState, useEffect } from 'react'
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
  Check, 
  Copy, 
  ShoppingCart, 
  Zap, 
  ExternalLink,
  Percent
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
  reviews,
  relatedProducts,
  affCode,
  currentUser
}: ProductDetailViewProps) {
  const router = useRouter()
  
  // Parse variants
  const variants: ProductVariant[] = parseProductVariants(product)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    variants.length > 0 ? variants[0] : null
  )

  // Active gallery image
  const [activeImage, setActiveImage] = useState<string>(
    variants.length > 0 && variants[0]?.imageUrl
      ? variants[0].imageUrl
      : product.imageUrl || ''
  )

  // Quantity
  const [qty, setQty] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [activeTab, setActiveTab] = useState<'detail' | 'ulasan' | 'rekomendasi'>('detail')
  const [isAddingCart, setIsAddingCart] = useState(false)

  // Save affiliate code if present
  useEffect(() => {
    if (affCode) {
      const existing = localStorage.getItem('teras_affiliate_id')
      if (!existing) {
        localStorage.setItem('teras_affiliate_id', affCode)
      }
    }
  }, [affCode])

  // When selected variant changes, sync gallery image if variant has one
  const handleSelectVariant = (variant: ProductVariant) => {
    setSelectedVariant(variant)
    if (variant.imageUrl) {
      setActiveImage(variant.imageUrl)
    }
    // Check if current qty exceeds variant stock
    if (qty > variant.stock && variant.stock > 0) {
      setQty(variant.stock)
    }
  }

  // Active Price & Stock
  const activePrice = selectedVariant?.price !== undefined ? selectedVariant.price : product.price
  const activeStock = selectedVariant ? selectedVariant.stock : product.stock
  const originalPrice = Math.round(activePrice * 1.3) // 30% markup for Tokopedia strikethrough effect
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
      goeyToast.error('Stok produk / varian ini sedang habis.')
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
    goeyToast.success(`Berhasil menambahkan ${qty}x ${product.title}${selectedVariant ? ` (${selectedVariant.name})` : ''} ke keranjang!`)
    setTimeout(() => setIsAddingCart(false), 800)
  }

  const handleBuyNow = () => {
    if (activeStock <= 0) {
      goeyToast.error('Stok produk / varian ini sedang habis.')
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
      goeyToast.success('Link produk berhasil disalin!')
    }
  }

  // Smooth scroll to section
  const scrollToSection = (id: string, tab: 'detail' | 'ulasan' | 'rekomendasi') => {
    setActiveTab(tab)
    const elem = document.getElementById(id)
    if (elem) {
      const topOffset = 110 // height of sticky header tabs
      const elemPosition = elem.getBoundingClientRect().top
      const offsetPosition = elemPosition + window.pageYOffset - topOffset
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  // Gallery images collection
  const allImages = React.useMemo(() => {
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
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1) 
    : '4.9'
  
  const totalReviewsCount = reviews.length > 0 ? reviews.length : 12

  // Star Distribution calculation
  const starCounts = [5, 4, 3, 2, 1].map((s) => {
    if (reviews.length === 0) {
      if (s === 5) return 10
      if (s === 4) return 2
      return 0
    }
    return reviews.filter((r: any) => r.rating === s).length
  })

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28 pt-20 font-sans text-slate-800 antialiased">
      
      {/* ── STICKY TOP NAVIGATION TABS (TOKOPEDIA STYLE) ── */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs transition-all">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-13">
          
          {/* Breadcrumb / Title sneak peek */}
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-600 truncate max-w-[320px]">
            <Link href="/market" className="hover:text-[#2DB24A] font-medium flex items-center gap-1">
              <ArrowLeft size={13} />
              <span>Marketplace</span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="truncate font-bold text-slate-900">{product.title}</span>
          </div>

          {/* Nav Tabs */}
          <div className="flex items-center gap-6 sm:gap-8 mx-auto md:mx-0">
            <button
              onClick={() => scrollToSection('section-detail', 'detail')}
              className={`py-3.5 text-xs sm:text-sm font-bold transition-all relative cursor-pointer ${
                activeTab === 'detail'
                  ? 'text-[#2DB24A]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Detail Produk
              {activeTab === 'detail' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2DB24A] rounded-full" />
              )}
            </button>

            <button
              onClick={() => scrollToSection('section-ulasan', 'ulasan')}
              className={`py-3.5 text-xs sm:text-sm font-bold transition-all relative cursor-pointer ${
                activeTab === 'ulasan'
                  ? 'text-[#2DB24A]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ulasan ({totalReviewsCount})
              {activeTab === 'ulasan' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2DB24A] rounded-full" />
              )}
            </button>

            <button
              onClick={() => scrollToSection('section-rekomendasi', 'rekomendasi')}
              className={`py-3.5 text-xs sm:text-sm font-bold transition-all relative cursor-pointer ${
                activeTab === 'rekomendasi'
                  ? 'text-[#2DB24A]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rekomendasi
              {activeTab === 'rekomendasi' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2DB24A] rounded-full" />
              )}
            </button>
          </div>

          {/* Quick back link on mobile */}
          <div className="flex md:hidden items-center">
            <Link href="/market" className="text-xs font-bold text-[#2DB24A] flex items-center gap-1">
              <ArrowLeft size={13} />
              <span>Kembali</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-10">

        {/* ── 3-COLUMN MAIN LAYOUT ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ════ COLUMN 1: IMAGE GALLERY (4 cols) ════ */}
          <div className="lg:col-span-4 space-y-3.5 lg:sticky lg:top-32">
            {/* Big Main Image Container */}
            <div className="aspect-square rounded-2xl bg-white border border-slate-200 overflow-hidden relative group shadow-xs">
              {activeImage ? (
                <img
                  src={activeImage}
                  alt={product.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400">
                  <Store size={40} className="stroke-1 text-slate-300 mb-2" />
                  <span className="text-xs font-bold">Saloka UMKM</span>
                </div>
              )}

              {/* Category Pill Tag */}
              <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg text-[10px] font-extrabold text-[#2DB24A] uppercase tracking-wider shadow-2xs">
                {formatCategoryName(product.category)}
              </span>

              {/* 30% Promo Tag */}
              <div className="absolute top-3 right-3 bg-rose-500 text-white text-[11px] font-black px-2 py-0.5 rounded-md shadow-xs flex items-center gap-0.5">
                <Percent size={11} strokeWidth={3} />
                <span>30%</span>
              </div>
            </div>

            {/* Gallery Thumbnails Carousel */}
            {allImages.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {allImages.map((imgUrl, idx) => {
                  const isSelected = activeImage === imgUrl
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImage(imgUrl)}
                      className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer bg-white ${
                        isSelected
                          ? 'border-[#2DB24A] ring-2 ring-[#2DB24A]/20 scale-105'
                          : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  )
                })}
              </div>
            )}

            {/* Official UMKM & Free Shipping Badges */}
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div className="bg-[#E8F5E9] border border-[#C8E6C9] p-2.5 rounded-xl flex items-center gap-2 text-[#006E24] font-bold">
                <ShieldCheck size={16} className="shrink-0" />
                <span className="leading-tight">100% Produk UMKM Asli</span>
              </div>
              <div className="bg-slate-100 border border-slate-200 p-2.5 rounded-xl flex items-center gap-2 text-slate-700 font-bold">
                <Truck size={16} className="shrink-0 text-[#2DB24A]" />
                <span className="leading-tight">Bebas Ongkir s.d 20rb</span>
              </div>
            </div>
          </div>

          {/* ════ COLUMN 2: CENTER PRODUCT DETAILS & VARIANTS (5 cols) ════ */}
          <div className="lg:col-span-5 space-y-5" id="section-detail">
            
            {/* Title & Ratings */}
            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                {product.title}
              </h1>

              <div className="flex items-center gap-2 text-xs flex-wrap">
                <div className="flex items-center gap-1 text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  <Star size={13} className="fill-amber-500 text-amber-500" />
                  <span>{avgRating}</span>
                </div>
                <span className="text-slate-300">•</span>
                <button
                  onClick={() => scrollToSection('section-ulasan', 'ulasan')}
                  className="text-slate-600 hover:text-[#2DB24A] font-semibold underline underline-offset-2"
                >
                  {totalReviewsCount} Ulasan
                </button>
                <span className="text-slate-300">•</span>
                <span className="text-slate-600 font-semibold">Terjual {activeStock > 0 ? '50+' : '0'}</span>
              </div>
            </div>

            {/* Price Area (Tokopedia Look & Feel) */}
            <div className="pt-2 pb-4 border-b border-slate-200 space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Rp {activePrice.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="bg-rose-100 text-rose-600 font-extrabold px-1.5 py-0.5 rounded text-[10px]">
                  30%
                </span>
                <span className="text-slate-400 line-through">
                  Rp {originalPrice.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* ── VARIANT SELECTOR (TOKOPEDIA STYLE CHIPS) ── */}
            {variants.length > 0 && (
              <div className="space-y-3 py-2 border-b border-slate-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700">
                    <strong className="text-slate-900">Pilih variant:</strong>{' '}
                    <span className="text-slate-600 font-semibold">
                      {selectedVariant ? selectedVariant.name : 'Pilih Varian'}
                    </span>
                  </span>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {variants.map((v) => {
                    const isSelected = selectedVariant?.id === v.id
                    const isOutOfStock = v.stock <= 0
                    const chipThumbnail = v.imageUrl || product.imageUrl

                    return (
                      <button
                        key={v.id}
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => handleSelectVariant(v)}
                        className={`relative flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#2DB24A] bg-[#2DB24A]/5 text-[#24943E] font-bold ring-2 ring-[#2DB24A]/25 shadow-2xs'
                            : isOutOfStock
                            ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-60 line-through'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {/* Mini Image Preview inside chip */}
                        {chipThumbnail && (
                          <div className="w-6 h-6 rounded-md overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                            <img src={chipThumbnail} alt={v.name} className="w-full h-full object-cover" />
                          </div>
                        )}

                        <span>{v.name}</span>

                        {/* Tokopedia Corner Discount Badge Indicator */}
                        <span className="w-2 h-2 rounded-full bg-rose-500 absolute -top-1 -right-1 shadow-2xs" />
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Merchant / Toko Info Card */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-[#006E24] flex items-center justify-center font-black text-base">
                  <Store size={20} />
                </div>
                <div>
                  <Link
                    href={`/profile/${product.merchantId}`}
                    className="font-bold text-sm text-slate-900 hover:text-[#2DB24A] transition-colors line-clamp-1"
                  >
                    {product.merchant?.name || 'Saloka Official Merchant'}
                  </Link>
                  <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Merchant Terverifikasi Saloka</span>
                  </p>
                </div>
              </div>

              <Link
                href={`/profile/${product.merchantId}`}
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors"
              >
                Kunjungi Toko
              </Link>
            </div>

            {/* Specifications & Description */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Detail Produk
              </h3>

              <div className="grid grid-cols-2 gap-y-2.5 text-xs border-b border-slate-200 pb-4">
                <div className="text-slate-500">Kategori</div>
                <div className="font-bold text-[#2DB24A] uppercase">{formatCategoryName(product.category)}</div>
                
                <div className="text-slate-500">Kondisi</div>
                <div className="font-bold text-slate-900">Baru (Asli UMKM)</div>

                <div className="text-slate-500">Min. Pemesanan</div>
                <div className="font-bold text-slate-900">1 Buah</div>

                <div className="text-slate-500">Status Stok</div>
                <div className="font-bold text-slate-900">
                  {activeStock > 0 ? (
                    <span className="text-emerald-700">Tersedia ({activeStock} unit)</span>
                  ) : (
                    <span className="text-rose-600">Habis</span>
                  )}
                </div>
              </div>

              {/* Description Body */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Deskripsi
                </h4>
                <div className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  {cleanProductDescription(product.description) || 'Produk UMKM unggulan berkualitas tinggi siap dikirim ke seluruh Indonesia.'}
                </div>
              </div>
            </div>

          </div>

          {/* ════ COLUMN 3: STICKY BUY BOX CARD (3 cols) ════ */}
          <div className="lg:col-span-3 lg:sticky lg:top-32 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h3 className="font-black text-sm text-slate-900 border-b border-slate-100 pb-3">
                Atur jumlah dan catatan
              </h3>

              {/* Selected Variant Snapshot */}
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden shrink-0">
                  {activeImage ? (
                    <img src={activeImage} alt="Variant preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">UMKM</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {selectedVariant ? selectedVariant.name : product.title}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Rp {activePrice.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              {/* Stepper & Stock */}
              <div className="space-y-1.5">
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
                      className="w-10 text-center text-xs font-black text-slate-900 border-none outline-none"
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

                  <span className="text-xs text-slate-600">
                    Stok: <strong className="text-slate-900 font-bold">{activeStock}</strong>
                  </span>
                </div>
              </div>

              {/* Subtotal Calculation */}
              <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">Subtotal</span>
                  <span className="text-[10px] text-slate-400 line-through">
                    Rp {(originalPrice * qty).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-slate-900 font-mono">
                    Rp {subtotal.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Beli Langsung & + Keranjang */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={activeStock <= 0}
                  className="w-full py-3 bg-[#2DB24A] hover:bg-[#24943E] text-white rounded-xl text-xs font-extrabold transition-colors shadow-sm disabled:opacity-40 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Zap size={15} />
                  <span>Beli Langsung</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={activeStock <= 0 || isAddingCart}
                  className="w-full py-2.5 bg-white hover:bg-emerald-50/50 border border-[#2DB24A] text-[#2DB24A] rounded-xl text-xs font-extrabold transition-colors shadow-2xs disabled:opacity-40 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ShoppingCart size={14} />
                  <span>{isAddingCart ? 'Menambahkan...' : '+ Keranjang'}</span>
                </button>
              </div>

              {/* Auxiliary Quick Links: Chat, Wishlist, Share */}
              <div className="flex items-center justify-around pt-3 border-t border-slate-100 text-xs font-bold text-slate-600">
                <button
                  type="button"
                  onClick={() => {
                    const msg = encodeURIComponent(`Halo, saya tertarik dengan produk ${product.title}${selectedVariant ? ` (${selectedVariant.name})` : ''}. Apakah masih ready?`)
                    window.open(`https://wa.me/?text=${msg}`, '_blank')
                  }}
                  className="flex items-center gap-1 hover:text-[#2DB24A] transition-colors cursor-pointer"
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
                  className={`flex items-center gap-1 transition-colors cursor-pointer ${
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
                  className="flex items-center gap-1 hover:text-[#2DB24A] transition-colors cursor-pointer"
                >
                  <Share2 size={14} />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* ════ SECTION: ULASAN PEMBELI (#section-ulasan) ════ */}
        <div id="section-ulasan" className="pt-6 border-t border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                ULASAN PEMBELI
              </h2>
              <p className="text-xs text-slate-500">Ulasan autentik dari pelanggan terverifikasi Saloka.id</p>
            </div>

            <div className="flex items-center gap-3 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-200">
              <div className="text-2xl font-black text-[#006E24] font-mono">{avgRating}</div>
              <div className="text-[11px] text-[#006E24]">
                <div className="flex items-center text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={13} fill="currentColor" />
                  ))}
                </div>
                <span className="font-bold">{totalReviewsCount} Ulasan Total</span>
              </div>
            </div>
          </div>

          {/* Star Distribution Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((s, idx) => {
                const count = starCounts[idx]
                const pct = Math.round((count / totalReviewsCount) * 100)
                return (
                  <div key={s} className="flex items-center gap-2 text-xs">
                    <span className="w-8 font-bold text-slate-700 flex items-center gap-0.5">
                      {s} <Star size={11} className="text-amber-500 fill-amber-500" />
                    </span>
                    <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-[#2DB24A] h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-10 text-right text-[11px] text-slate-500 font-semibold">{count}</span>
                  </div>
                )
              })}
            </div>
            <div className="flex flex-col justify-center text-xs text-slate-600 border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-6 space-y-1.5">
              <span className="font-bold text-slate-900">Kepuasan Pelanggan:</span>
              <p className="text-[12px] text-slate-500 leading-relaxed">
                98% pembeli menyatakan produk dan aroma sesuai deskripsi serta pengemasan rapi terlindungi bubble wrap.
              </p>
            </div>
          </div>

          {/* Review items list */}
          <div className="space-y-3 divide-y divide-slate-100 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            {(reviews.length > 0 ? reviews : [
              {
                id: 'dummy-1',
                rating: 5,
                author: { name: 'Budi Santoso' },
                createdAt: new Date(),
                comment: 'Kualitas barang sangat bagus, wangi tahan lama persis seperti deskripsi. Pengiriman cepat dan packing sangat rapi.'
              },
              {
                id: 'dummy-2',
                rating: 5,
                author: { name: 'Dewi Lestari' },
                createdAt: new Date(),
                comment: 'Suka banget dengan variasinya, harga bersahabat dan seller sangat responsif. Mantap Saloka!'
              },
              {
                id: 'dummy-3',
                rating: 5,
                author: { name: 'Rian Pratama' },
                createdAt: new Date(),
                comment: 'Produk asli berkualitas tinggi. Varian Cool Wootah aroma mewahnya dapet banget. Pasti repeat order!'
              }
            ]).map((rev: any) => {
              const authorName = rev.author?.name || 'Pelanggan Saloka'
              const initial = authorName.charAt(0).toUpperCase()
              const dateStr = new Date(rev.createdAt).toLocaleDateString('id-ID', {
                day: 'numeric', month: 'long', year: 'numeric'
              })

              return (
                <div key={rev.id} className="pt-4 first:pt-0 flex gap-3.5 items-start">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#006E24] flex items-center justify-center font-extrabold text-sm shrink-0 border border-emerald-200">
                    {initial}
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{authorName}</span>
                        <span className="text-[9px] font-bold text-[#006E24] bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          Pembeli Terverifikasi
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">{dateStr}</span>
                    </div>

                    <div className="flex items-center text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={12}
                          fill={i < rev.rating ? 'currentColor' : 'none'}
                          className={i < rev.rating ? 'text-amber-500' : 'text-slate-300'}
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

        {/* ════ SECTION: REKOMENDASI PRODUK (#section-rekomendasi) ════ */}
        {relatedProducts.length > 0 && (
          <div id="section-rekomendasi" className="pt-6 border-t border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  REKOMENDASI PRODUK
                </h2>
                <p className="text-xs text-slate-500">Pilihan produk serupa lainnya dari kategori {formatCategoryName(product.category)}</p>
              </div>
              <Link href="/market" className="text-xs font-bold text-[#2DB24A] hover:underline flex items-center gap-1">
                <span>Lihat Semua</span>
                <ExternalLink size={12} />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5">
              {relatedProducts.map((rel: any, rIdx: number) => {
                const discountPct = 15 + ((rIdx * 7) % 25)
                const origPrice = Math.round(rel.price * (1 + discountPct / 100))

                return (
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
                          <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 font-bold bg-slate-100">
                            UMKM
                          </div>
                        )}
                        <span className="absolute top-1 left-1 bg-emerald-50 text-[#006E24] font-extrabold text-[9px] px-1.5 py-0.5 rounded border border-emerald-200">
                          {discountPct}%
                        </span>
                      </div>

                      <h4 className="text-xs font-semibold text-slate-800 line-clamp-2 min-h-[32px] leading-snug group-hover:text-[#2DB24A] transition-colors">
                        {rel.title}
                      </h4>
                      <p className="text-xs sm:text-sm font-black text-slate-900 leading-tight pt-1">
                        Rp {rel.price.toLocaleString('id-ID')}
                      </p>
                      <p className="text-[10px] text-slate-400 line-through">
                        Rp {origPrice.toLocaleString('id-ID')}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center gap-1 text-[9px] text-slate-500">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                      <span className="font-bold text-slate-700">4.9</span>
                      <span>•</span>
                      <span>Terjual 40+</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
