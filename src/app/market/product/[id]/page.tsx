import Link from "next/link";
import { getProductById } from "@/app/actions/products";
import { getProductReviews } from "@/app/actions/reviews";
import { notFound } from "next/navigation";
import ProductActions from "./ProductActions";
import { Metadata } from "next";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aff?: string }>;
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);
  
  if (!product) {
    return {
      title: "Produk Tidak Ditemukan - Teras UMKM",
      description: "Halaman produk tidak ditemukan di Teras UMKM."
    };
  }

  const desc = product.description.substring(0, 150) + (product.description.length > 150 ? '...' : '');

  return {
    title: `${product.title} - Teras UMKM`,
    description: desc,
    openGraph: {
      title: `${product.title} - Teras UMKM`,
      description: desc,
      images: product.imageUrl ? [{ url: product.imageUrl }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.title} - Teras UMKM`,
      description: desc,
      images: product.imageUrl ? [product.imageUrl] : [],
    }
  };
}

export default async function ProductDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { aff } = await searchParams;
  
  const product = await getProductById(id);
  if (!product) {
    notFound();
  }

  const reviews = await getProductReviews(id);
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1) 
    : null;

  return (
    <div className="relative min-h-screen bg-bg-dark pt-12 pb-24 px-6 md:px-10">
      {/* Mesh Glow Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1400px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(198,169,107,0.04)_0%,transparent_70%)] pointer-events-none z-0" />

      <div className="relative z-10 max-w-[1200px] mx-auto">
        {/* Back Link */}
        <Link
          href="/market"
          className="inline-flex items-center gap-2 text-xs font-geist font-bold text-text-secondary hover:text-primary tracking-wider uppercase mb-8 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Kembali ke Marketplace
        </Link>

        {/* Details Wrapper */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-surface-dark border border-border-subtle rounded-lg p-6 md:p-10">
          {/* Image Showcase */}
          <div className="aspect-[4/3] rounded bg-surface-container border border-border-subtle overflow-hidden relative flex items-center justify-center">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.title}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-60 flex items-center justify-center">
                <span className="text-[12px] font-geist font-bold text-primary/40 uppercase tracking-widest">
                  {product.category} Image
                </span>
              </div>
            )}
            
            {/* Category Pill */}
            <span className="absolute top-4 left-4 px-2 py-0.5 bg-surface-dark/90 backdrop-blur border border-primary/20 rounded text-[9px] font-geist font-bold text-primary uppercase tracking-wider">
              {product.category}
            </span>
          </div>

          {/* Details Column */}
          <div className="flex flex-col justify-between">
            <div>
              {/* Affiliate notification banner if active */}
              {aff && (
                <div className="mb-6 px-4 py-2.5 bg-primary/10 border border-primary/25 rounded text-[11px] text-primary font-medium flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  Link Afiliasi Aktif (ID Pemasar: {aff})
                </div>
              )}

              <h1 className="font-sora text-2xl md:text-3xl font-bold text-text-primary mb-2">
                {product.title}
              </h1>

              {/* Rating and review summary */}
              {avgRating && (
                <div className="flex items-center gap-1.5 mb-4">
                  <div className="flex items-center text-yellow-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill={i < Math.round(Number(avgRating)) ? "currentColor" : "none"} stroke="currentColor" className="w-3.5 h-3.5">
                        <path d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.6 3.1-.214 4.817c-.038.85.85 1.49 1.585 1.02L10 15.747l4.037 2.508c.734.47 1.623-.17 1.585-1.02l-.214-4.817 3.6-3.1c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-text-primary">{avgRating}</span>
                  <span className="text-neutral-500 text-xs">•</span>
                  <span className="text-xs text-text-secondary">{reviews.length} Ulasan</span>
                </div>
              )}

              {/* Price Tag */}
              <div className="font-sora text-xl md:text-2xl font-extrabold text-primary mb-6">
                Rp {product.price.toLocaleString("id-ID")}
              </div>

              {/* Specs List */}
              <div className="grid grid-cols-2 gap-4 py-4 border-y border-border-subtle mb-6 text-xs">
                <div>
                  <span className="block text-[10px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-1">
                    Status Ketersediaan
                  </span>
                  {product.stock > 0 ? (
                    <span className="text-green-400 font-semibold">Tersedia (Stok: {product.stock})</span>
                  ) : (
                    <span className="text-red-400 font-semibold">Stok Habis</span>
                  )}
                </div>
                <div>
                  <span className="block text-[10px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-1">
                    Nama Merchant
                  </span>
                  <Link
                    href={`/profile/${product.merchantId}`}
                    className="text-primary hover:underline font-semibold transition-colors inline-flex items-center gap-1"
                  >
                    {product.merchant?.name || "Premium Partner"}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-3 mb-8">
                <span className="block text-[10px] font-geist font-bold text-text-secondary uppercase tracking-wider">
                  Deskripsi Produk
                </span>
                <p className="text-xs md:text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            </div>

            {/* Interactive actions for Add/Buy */}
            <ProductActions
              product={{
                id: product.id,
                title: product.title,
                price: product.price,
                stock: product.stock,
                merchantId: product.merchantId,
              }}
              affCode={aff}
            />
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-8 bg-surface-dark border border-border-subtle rounded-lg p-6 md:p-10">
          <h3 className="font-sora text-sm font-bold text-text-primary mb-6 uppercase tracking-wider">Ulasan Pembeli</h3>
          
          {reviews.length === 0 ? (
            <p className="text-xs text-text-secondary">Belum ada ulasan untuk produk ini.</p>
          ) : (
            <div className="space-y-6">
              {reviews.map((rev: any) => {
                const authorName = rev.author?.name || "Pelanggan Teras"
                const initial = authorName.charAt(0).toUpperCase()
                const dateStr = new Date(rev.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })

                return (
                  <div key={rev.id} className="border-b border-border-subtle/40 last:border-none pb-6 last:pb-0 flex gap-4">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center font-bold text-white shadow-sm text-sm shrink-0">
                      {initial}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-bold text-text-primary">{authorName}</span>
                        <span className="text-[10px] text-text-secondary">{dateStr}</span>
                      </div>
                      
                      {/* Rating Stars */}
                      <div className="flex items-center text-yellow-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill={i < rev.rating ? "currentColor" : "none"} stroke="currentColor" className="w-3.5 h-3.5">
                            <path d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.6 3.1-.214 4.817c-.038.85.85 1.49 1.585 1.02L10 15.747l4.037 2.508c.734.47 1.623-.17 1.585-1.02l-.214-4.817 3.6-3.1c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" />
                          </svg>
                        ))}
                      </div>

                      <p className="text-xs text-text-secondary leading-relaxed pt-1">{rev.comment}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
