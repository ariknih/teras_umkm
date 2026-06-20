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
    <div className="relative min-h-screen bg-[#F5F7FA] pb-24">
      {/* Structured JSON-LD Schema for Marketplace */}
      <Script
        id="json-ld-market"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Saloka.id",
            "url": "https://Saloka.id.id",
          })
        }}
      />

      <div className="max-w-[1440px] mx-auto px-4 md:px-6 pt-6">
        {/* ─── Compact header ──────────────────────────────────── */}
        <div className="mb-4">
          <h1 className="text-base font-bold text-gray-800 mb-0.5">Marketplace</h1>
          <p className="text-xs text-gray-400">
            Beli produk UMKM, temukan jasa terdekat, atau lowongan kerja mandiri.
          </p>
        </div>

        {/* ─── Horizontal Scrollable Category Pill Bar ─────────── */}
        <div className="mb-4 relative">
          <div
            id="category-scroll"
            className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {ALL_CATEGORIES.map((cat) => {
              const isActive = (categoryParam || "") === cat.value;
              return (
                <Link
                  id={`cat-tab-${cat.value || "all"}`}
                  key={cat.value}
                  href={cat.value ? `/market?category=${cat.value}${queryParam ? `&query=${encodeURIComponent(queryParam)}` : ''}` : "/market"}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-semibold transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? "bg-[#2DB24A] text-white shadow-sm"
                      : "bg-white hover:bg-slate-50 text-gray-500 hover:text-gray-800 border border-gray-200"
                  }`}
                >
                  {cat.name}
                </Link>
              );
            })}
          </div>
          <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-[#F5F7FA] to-transparent pointer-events-none" />
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
