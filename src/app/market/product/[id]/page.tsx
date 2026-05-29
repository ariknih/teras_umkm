import Link from "next/link";
import { getProductById } from "@/app/actions/products";
import { notFound } from "next/navigation";
import ProductActions from "./ProductActions";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aff?: string }>;
}

export default async function ProductDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { aff } = await searchParams;
  
  const product = await getProductById(id);
  if (!product) {
    notFound();
  }

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

              <h1 className="font-sora text-2xl md:text-3xl font-bold text-text-primary mb-3">
                {product.title}
              </h1>

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
      </div>
    </div>
  );
}
