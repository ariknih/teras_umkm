import Link from "next/link";
import { getProducts } from "../actions/products";
import ProductListGrid from "./ProductListGrid";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Teras UMKM - Marketplace Produk & Jasa Premium",
  description: "Beli produk premium dari mitra UMKM pilihan, temukan penyedia jasa terdekat, atau dapatkan lowongan proyek kerja mandiri di Teras UMKM.",
  openGraph: {
    title: "Teras UMKM - Marketplace Produk & Jasa Premium",
    description: "Beli produk premium dari mitra UMKM pilihan, temukan penyedia jasa terdekat, atau dapatkan lowongan proyek kerja mandiri di Teras UMKM.",
    type: 'website',
  }
};


interface PageProps {
  searchParams: Promise<{ category?: string; query?: string }>;
}

// All supported categories (4 original + 26 expanded)
const ALL_CATEGORIES = [
  { name: "Semua", value: "" },
  { name: "Toko & Ritel", value: "TOKO" },
  { name: "Kafe & Kuliner", value: "KAFE" },
  { name: "Jasa & Layanan", value: "JASA" },
  { name: "Lowongan Kerja", value: "KERJAAN" },
  { name: "Elektronik", value: "ELEKTRONIK" },
  { name: "Makanan & Minuman", value: "MAKANAN_MINUMAN" },
  { name: "Komputer & Aksesoris", value: "KOMPUTER_AKSESORIS" },
  { name: "Perawatan & Kecantikan", value: "PERAWATAN_KECANTIKAN" },
  { name: "Handphone & Aksesoris", value: "HANDPHONE_AKSESORIS" },
  { name: "Perlengkapan Rumah", value: "PERLENGKAPAN_RUMAH" },
  { name: "Pakaian Pria", value: "PAKAIAN_PRIA" },
  { name: "Pakaian Wanita", value: "PAKAIAN_WANITA" },
  { name: "Sepatu Pria", value: "SEPATU_PRIA" },
  { name: "Fashion Muslim", value: "FASHION_MUSLIM" },
  { name: "Tas Pria", value: "TAS_PRIA" },
  { name: "Fashion Bayi & Anak", value: "FASHION_BAYI_ANAK" },
  { name: "Aksesoris Fashion", value: "AKSESORIS_FASHION" },
  { name: "Ibu & Bayi", value: "IBU_BAYI" },
  { name: "Jam Tangan", value: "JAM_TANGAN" },
  { name: "Sepatu Wanita", value: "SEPATU_WANITA" },
  { name: "Kesehatan", value: "KESEHATAN" },
  { name: "Tas Wanita", value: "TAS_WANITA" },
  { name: "Hobi & Koleksi", value: "HOBI_KOLEKSI" },
  { name: "Otomotif", value: "OTOMOTIF" },
  { name: "Olahraga & Outdoor", value: "OLAHRAGA_OUTDOOR" },
  { name: "Buku & Alat Tulis", value: "BUKU_ALAT_TULIS" },
  { name: "Souvenir & Pesta", value: "SOUVENIR_PERLENGKAPAN_PESTA" },
  { name: "Fotografi", value: "FOTOGRAFI" },
  { name: "Voucher", value: "VOUCHER" },
  { name: "Deals Sekitar", value: "DEALS_SEKITAR" },
];

export default async function MarketPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const categoryParam = resolvedParams.category as string | undefined;
  const queryParam = resolvedParams.query ? resolvedParams.query.toLowerCase() : "";

  // Fetch all or filtered products
  const allProducts = await getProducts(categoryParam || undefined);

  // Search filter
  const products = allProducts.filter(
    (p) =>
      p.title.toLowerCase().includes(queryParam) ||
      p.description.toLowerCase().includes(queryParam)
  );

  return (
    <div className="relative min-h-screen bg-bg-dark pt-12 pb-24 px-6 md:px-10">
      {/* Structured JSON-LD Schema for Marketplace */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Teras UMKM",
            "url": "https://terasumkm.id",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://terasumkm.id/market?query={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          })
        }}
      />

      {/* Mesh Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1400px] h-[400px] bg-[radial-gradient(circle_at_center,rgba(198,169,107,0.04)_0%,transparent_70%)] pointer-events-none z-0" />

      <div className="relative z-10 max-w-[1440px] mx-auto">
        {/* Header */}
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <span className="text-[10px] font-geist font-bold text-primary tracking-[0.2em] mb-4 uppercase bg-primary/10 border border-primary/20 px-3 py-1 rounded inline-block">
            Teras Premium Marketplace
          </span>
          <h1 className="font-sora text-3xl md:text-5xl font-bold text-text-primary mb-4">
            Curated Merchant <span className="text-primary">Catalog.</span>
          </h1>
          <p className="text-xs md:text-sm text-text-secondary">
            Beli produk premium, temukan penyedia jasa terdekat, atau dapatkan lowongan proyek kerja mandiri.
          </p>
        </div>

        {/* ─── Horizontal Scrollable Category Pill Bar ─────────────────── */}
        <div className="mb-6 relative">
          <div
            id="category-scroll"
            className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {ALL_CATEGORIES.map((cat) => {
              const isActive = (categoryParam || "") === cat.value;
              return (
                <Link
                  id={`cat-tab-${cat.value || "all"}`}
                  key={cat.value}
                  href={cat.value ? `/market?category=${cat.value}${queryParam ? `&query=${encodeURIComponent(queryParam)}` : ''}` : "/market"}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-[11px] font-semibold tracking-wider transition-all duration-200 whitespace-nowrap border ${
                    isActive
                      ? "bg-primary text-surface-dark border-primary shadow-md shadow-primary/20"
                      : "bg-surface-container hover:bg-surface-container-high text-text-secondary hover:text-text-primary border-border-subtle"
                  }`}
                >
                  {cat.name}
                </Link>
              );
            })}
          </div>
          {/* Fade gradient on right */}
          <div className="absolute right-0 top-0 bottom-2 w-16 bg-gradient-to-l from-bg-dark to-transparent pointer-events-none" />
        </div>

        {/* Search Bar */}
        <div className="mb-10 border border-border-subtle bg-surface-dark rounded-lg p-4">
          <form method="GET" action="/market" className="flex gap-2">
            {categoryParam && <input type="hidden" name="category" value={categoryParam} />}
            <input
              id="search-input"
              type="text"
              name="query"
              defaultValue={resolvedParams.query || ""}
              placeholder="Cari produk, jasa, lowongan kerja..."
              className="flex-grow px-4 py-2 bg-surface-container border border-border-subtle rounded text-xs text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-primary/50"
            />
            <button
              id="search-submit"
              type="submit"
              className="px-5 py-2 bg-primary hover:bg-primary/90 text-surface-dark font-geist font-bold text-xs uppercase tracking-wider rounded transition-colors"
            >
              Cari
            </button>
          </form>
          {(categoryParam || queryParam) && (
            <div className="mt-2 flex items-center gap-2 text-[10px] text-text-secondary">
              <span>Filter aktif:</span>
              {categoryParam && (
                <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 rounded text-primary font-semibold">
                  {ALL_CATEGORIES.find(c => c.value === categoryParam)?.name || categoryParam}
                </span>
              )}
              {queryParam && (
                <span className="px-2 py-0.5 bg-surface-container border border-border-subtle rounded">
                  &ldquo;{queryParam}&rdquo;
                </span>
              )}
              <Link href="/market" className="text-red-400 hover:text-red-300 underline ml-1">
                Reset
              </Link>
            </div>
          )}
        </div>

        {/* Product List Grid */}
        <ProductListGrid initialProducts={products as any} />
      </div>

      <style>{`
        #category-scroll::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
