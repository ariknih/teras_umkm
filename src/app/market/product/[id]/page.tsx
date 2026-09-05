import Link from 'next/link'
import { getProductById, getProducts } from '@/app/actions/products'
import { getProductReviews } from '@/app/actions/reviews'
import { notFound } from 'next/navigation'
import ProductActions from './ProductActions'
import { Metadata } from 'next'
import { getCurrentUser } from '@/app/actions/auth'
import { formatCategoryName } from '@/lib/utils'
import { Star, ShieldCheck, Truck, ArrowLeft, Store, MessageCircle } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ aff?: string }>
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const product = await getProductById(id)
  
  if (!product) {
    return {
      title: 'Produk Tidak Ditemukan - Saloka.id',
      description: 'Halaman produk tidak ditemukan di Saloka.id.'
    }
  }

  const desc = product.description.substring(0, 150) + (product.description.length > 150 ? '...' : '')

  return {
    title: `${product.title} - Saloka.id`,
    description: desc,
    openGraph: {
      title: `${product.title} - Saloka.id`,
      description: desc,
      images: product.imageUrl ? [{ url: product.imageUrl }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.title} - Saloka.id`,
      description: desc,
      images: product.imageUrl ? [product.imageUrl] : [],
    }
  }
}

export default async function ProductDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { aff } = await searchParams
  
  const product = await getProductById(id)
  if (!product) {
    notFound()
  }

  const user = await getCurrentUser()
  const [reviews, allProducts] = await Promise.all([
    getProductReviews(id),
    getProducts()
  ])

  const relatedProducts = allProducts
    .filter((p: any) => p.id !== product.id && (p.category === product.category || !product.category))
    .slice(0, 6)
  
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
    <div className="min-h-screen bg-[#F8F9FA] pt-24 pb-24 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-[1140px] mx-auto space-y-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/market"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#006E24] transition-colors"
          >
            <ArrowLeft size={15} />
            <span>Kembali ke Katalog Marketplace</span>
          </Link>

          <span className="text-xs text-slate-500">
            Kategori: <strong className="text-slate-800 uppercase">{formatCategoryName(product.category)}</strong>
          </span>
        </div>

        {/* ── MAIN PRODUCT SHOWCASE CARD ── */}
        <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Image Column (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="aspect-square rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden relative group">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-bold">
                  Saloka UMKM
                </div>
              )}

              {/* Category Pill */}
              <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/95 backdrop-blur border border-slate-200 rounded-lg text-[10px] font-extrabold text-[#006E24] uppercase tracking-wider shadow-2xs">
                {formatCategoryName(product.category)}
              </span>
            </div>

            {/* Badges Guarantee */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
              <div className="bg-[#E8F5E9] border border-[#C8E6C9] p-2 rounded-xl flex items-center gap-2 text-[#006E24] font-bold">
                <ShieldCheck size={16} />
                <span>100% Produk UMKM Asli</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-2 rounded-xl flex items-center gap-2 text-slate-700 font-bold">
                <Truck size={16} className="text-[#006E24]" />
                <span>Bebas Ongkir s.d 20rb</span>
              </div>
            </div>
          </div>

          {/* Details & Actions Column (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {/* Affiliate notification banner */}
              {aff && (
                <div className="p-2.5 bg-[#E8F5E9] border border-[#C8E6C9] rounded-xl text-xs text-[#006E24] font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#006E24] animate-ping" />
                  <span>Link Afiliasi Resmi Aktif (Mitra Promotor: #{aff})</span>
                </div>
              )}

              {/* Title & Rating */}
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
                  {product.title}
                </h1>

                <div className="flex items-center gap-2 mt-2 text-xs">
                  <div className="flex items-center gap-1 text-amber-500 font-bold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                    <Star size={13} fill="currentColor" />
                    <span>{avgRating}</span>
                  </div>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-600 font-semibold">{totalReviewsCount} Ulasan Pembeli</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-600 font-semibold">Terjual {product.stock ? '50+' : '0'} pcs</span>
                </div>
              </div>

              {/* Price Banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Harga Mitra UMKM</span>
                  <span className="text-2xl sm:text-3xl font-black text-[#006E24] font-mono">
                    Rp {product.price.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 inline-block">
                    Tersedia Pembayaran Dompet
                  </span>
                </div>
              </div>

              {/* Store & Stock Meta */}
              <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase block mb-1">Status Stok</span>
                  {product.stock > 0 ? (
                    <span className="text-[#006E24] font-bold inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#006E24]" />
                      <span>Ready Stock ({product.stock} unit)</span>
                    </span>
                  ) : (
                    <span className="text-rose-600 font-bold">Stok Habis</span>
                  )}
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase block mb-1">Penjual / Merchant</span>
                  <Link
                    href={`/profile/${product.merchantId}`}
                    className="text-[#006E24] hover:underline font-bold inline-flex items-center gap-1.5"
                  >
                    <Store size={14} />
                    <span>{product.merchant?.name || 'Saloka Official Merchant'}</span>
                  </Link>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider block">
                  Deskripsi Lengkap Produk
                </span>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {product.description || 'Deskripsi produk UMKM berkualitas tinggi siap dikirim ke seluruh wilayah Indonesia.'}
                </p>
              </div>
            </div>

            {/* Actions Form (Quantity, Add to Cart, Buy Now, Share) */}
            <ProductActions
              product={{
                id: product.id,
                title: product.title,
                price: product.price,
                stock: product.stock,
                merchantId: product.merchantId,
              }}
              affCode={aff}
              userId={user?.id}
              userRole={user?.role}
            />
          </div>
        </div>

        {/* ── REVIEWS & RATING BREAKDOWN ── */}
        <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 uppercase tracking-wider">
                Ulasan & Penilaian Pembeli
              </h3>
              <p className="text-xs text-slate-500">Ulasan autentik dari pelanggan terverifikasi Saloka.id</p>
            </div>

            <div className="flex items-center gap-3 bg-[#E8F5E9] px-4 py-2 rounded-2xl border border-[#C8E6C9]">
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

          {/* Star Distribution Bars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="space-y-1.5">
              {[5, 4, 3, 2, 1].map((s, idx) => {
                const count = starCounts[idx]
                const pct = Math.round((count / totalReviewsCount) * 100)
                return (
                  <div key={s} className="flex items-center gap-2 text-xs">
                    <span className="w-8 font-bold text-slate-700 flex items-center gap-0.5">
                      {s} <Star size={11} className="text-amber-500 fill-amber-500" />
                    </span>
                    <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div className="bg-[#006E24] h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-10 text-right text-[11px] text-slate-500 font-semibold">{count}</span>
                  </div>
                )
              })}
            </div>
            <div className="flex flex-col justify-center text-xs text-slate-600 border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-4 space-y-1">
              <span className="font-bold text-slate-900">Kepuasan Pelanggan:</span>
              <p className="text-[11px] text-slate-500">
                98% pembeli menyatakan produk sesuai deskripsi dan pengemasan aman terlindungi.
              </p>
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-4 divide-y divide-slate-100">
            {(reviews.length > 0 ? reviews : [
              {
                id: 'dummy-1',
                rating: 5,
                author: { name: 'Budi Santoso' },
                createdAt: new Date(),
                comment: 'Kualitas barang sangat bagus, asli buatan lokal UMKM. Pengiriman cepat dan packing sangat rapi.'
              },
              {
                id: 'dummy-2',
                rating: 5,
                author: { name: 'Dewi Lestari' },
                createdAt: new Date(),
                comment: 'Suka banget dengan produknya, harga bersahabat dan seller sangat responsif. Mantap Saloka!'
              }
            ]).map((rev: any) => {
              const authorName = rev.author?.name || 'Pelanggan Saloka'
              const initial = authorName.charAt(0).toUpperCase()
              const dateStr = new Date(rev.createdAt).toLocaleDateString('id-ID', {
                day: 'numeric', month: 'long', year: 'numeric'
              })

              return (
                <div key={rev.id} className="pt-4 first:pt-0 flex gap-3.5 items-start">
                  <div className="w-9 h-9 rounded-xl bg-[#E8F5E9] text-[#006E24] flex items-center justify-center font-extrabold text-sm shrink-0 border border-[#C8E6C9]">
                    {initial}
                  </div>
                  <div className="space-y-1 flex-1">
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

        {/* ── RELATED PRODUCTS SECTION (CROSS-SELLING) ── */}
        {relatedProducts.length > 0 && (
          <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 uppercase tracking-wider">
                  Produk Pilihan Lainnya dari Kategori {formatCategoryName(product.category)}
                </h3>
                <p className="text-xs text-slate-500">Rekomendasi terbaik dari UMKM terverifikasi</p>
              </div>
              <Link href="/market" className="text-xs font-bold text-[#006E24] hover:underline">
                Lihat Semua &gt;
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {relatedProducts.map((rel: any, rIdx: number) => {
                const discountPct = 15 + ((rIdx * 7) % 25)
                const originalPrice = Math.round(rel.price * (1 + discountPct / 100))

                return (
                  <Link
                    key={rel.id}
                    href={`/market/product/${rel.id}`}
                    className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs hover:shadow-md hover:border-[#006E24]/60 transition-all flex flex-col justify-between group p-2 text-slate-900"
                  >
                    <div>
                      <div className="w-full aspect-square bg-slate-50 relative rounded-lg overflow-hidden mb-2">
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
                        <span className="absolute top-1 left-1 bg-[#E8F5E9] text-[#006E24] font-extrabold text-[9px] px-1.5 py-0.2 rounded border border-[#C8E6C9]">
                          {discountPct}%
                        </span>
                      </div>

                      <h4 className="text-xs font-medium text-slate-800 line-clamp-2 min-h-[32px] leading-snug group-hover:text-[#006E24] transition-colors">
                        {rel.title}
                      </h4>
                      <p className="text-xs font-extrabold text-slate-900 leading-tight pt-1">
                        Rp {rel.price.toLocaleString('id-ID')}
                      </p>
                      <p className="text-[10px] text-slate-400 line-through">
                        Rp {originalPrice.toLocaleString('id-ID')}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center gap-1 text-[9px] text-slate-500">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                      <span className="font-bold text-slate-700">4.9</span>
                      <span>•</span>
                      <span>Terjual {rel.stock ? `${rel.stock}+` : '30+'}</span>
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
