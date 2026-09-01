import Link from "next/link";
import { getProducts } from "@/app/actions/products";
import { getCurrentUser } from "@/app/actions/auth";
import ProductListGrid from "./ProductListGrid";
import { Metadata } from "next";
import Script from "next/script";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Saloka.id - Marketplace Produk & Jasa Premium",
  description: "Beli produk premium dari mitra UMKM pilihan, temukan penyedia jasa terdekat, atau dapatkan lowongan proyek kerja mandiri di Saloka.id.",
  openGraph: {
    title: "Saloka.id - Marketplace Produk & Jasa Premium",
    description: "Beli produk premium dari mitra UMKM pilihan, temukan penyedia jasa terdekat, atau dapatkan lowongan proyek kerja mandiri di Saloka.id.",
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

  // Fetch all products and current user in parallel
  const [allProducts, currentUser] = await Promise.all([
    getProducts(categoryParam || undefined),
    getCurrentUser()
  ]);

  return (
    <div id="body-container" className="relative min-h-screen bg-[#F5F7FA] pb-12 flex flex-col items-center">
      {/* Structured JSON-LD Schema for Marketplace */}
      <Script
        id="json-ld-market"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Saloka.id",
            "url": "https://saloka.id",
          })
        }}
      />

      <div id="content-container" className="w-full max-w-[1240px] mx-auto px-3.5 sm:px-6 py-2 sm:py-4">
        {/* ─── Compact header ──────────────────────────────────── */}
        <div id="header-section" className="mb-3 sm:mb-4">
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">Marketplace UMKM</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Beli produk UMKM pilihan, temukan jasa terdekat, dan dukung usaha lokal Indonesia.
          </p>
        </div>

        {/* ─── Horizontal Scrollable Category Pill Bar ─────────── */}
        <div id="category-bar" className="mb-4 relative">
          <div
            id="category-scroll"
            className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 scrollbar-hide -mx-1 px-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {ALL_CATEGORIES.map((cat) => {
              const isActive = (categoryParam || "") === cat.value;
              return (
                <Link
                  id={`cat-tab-${cat.value || "all"}`}
                  key={cat.value}
                  href={cat.value ? `/market?category=${cat.value}${queryParam ? `&query=${encodeURIComponent(queryParam)}` : ''}` : "/market"}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-[#2DB24A] text-white shadow-sm font-bold"
                      : "bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200"
                  }`}
                >
                  {cat.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Product List Grid */}
        <ProductListGrid initialProducts={allProducts as any} currentUser={currentUser} initialQuery={queryParam} />
      </div>

      <style>{`
        #category-scroll::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
