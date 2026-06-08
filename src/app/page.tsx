import Link from 'next/link'
import { getCurrentUser } from './actions/auth'
import { getProducts } from './actions/products'
import { getCourses } from './actions/lms'

// ─── SVG Icon primitives (premium inline icons) ───────────────────────────────
const IconStore = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
)
const IconBriefcase = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
)
const IconGradCap = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
)
const IconTrendUp = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
  </svg>
)
const IconShare = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
)
const IconCamera = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
  </svg>
)
const IconCode = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
  </svg>
)
const IconPen = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
  </svg>
)

// ─── Service catalog data ─────────────────────────────────────────────────────
const JASA_HIGHLIGHTS = [
  { icon: <IconPen />, label: 'Desain & Branding', query: 'desain' },
  { icon: <IconCamera />, label: 'Foto & Video', query: 'foto' },
  { icon: <IconCode />, label: 'IT & Website', query: 'website' },
  { icon: <IconShare />, label: 'Social Media', query: 'sosmed' },
  { icon: <IconBriefcase />, label: 'Catering & Event', query: 'catering' },
  { icon: <IconTrendUp />, label: 'Iklan & Ads', query: 'ads' },
]

const PLATFORM_FEATURES = [
  { icon: <IconStore />, title: 'Marketplace', desc: 'Ribuan produk UMKM pilihan dari merchant terpercaya seluruh Indonesia.', href: '/market', cta: 'Belanja' },
  { icon: <IconBriefcase />, title: 'Katalog Jasa', desc: 'Temukan penyedia jasa profesional: desain, IT, catering, dll.', href: '/market?category=JASA', cta: 'Cari Jasa' },
  { icon: <IconGradCap />, title: 'LMS Academy', desc: 'Kursus bisnis eksklusif dari pakar industri tingkatkan level usaha.', href: '/academy', cta: 'Mulai Belajar' },
  { icon: <IconShare />, title: 'Affiliate Hub', desc: 'Hasilkan komisi multi-tier otomatis dari rekomendasi produk.', href: '/affiliate', cta: 'Bergabung' },
]

// ─── Product Card (server component) ─────────────────────────────────────────
function ProductCard({ product }: { product: any }) {
  // Generate some realistic mock data based on ID to make the Tokopedia aesthetic alive
  const idNum = parseInt(product.id.slice(-3), 36) || 0
  const discount = (idNum % 3 === 0) ? (10 + (idNum % 5) * 5) : 0
  const originalPrice = discount ? Math.round(product.price * (100 / (100 - discount))) : product.price
  const rating = (4.5 + (idNum % 5) * 0.1).toFixed(1)
  const sold = (idNum % 10) * 25 + 10
  const locations = ['Jakarta Pusat', 'Jakarta Barat', 'Tangerang', 'Bandung', 'Surabaya', 'Bekasi']
  const location = locations[idNum % locations.length]

  const storeNames = ['Moell Store', 'Gallery Gadget Shop', 'Wuben Light Indonesia', 'Stanley Indonesia Official', 'OMG Store_NEW', 'Infiniti Gadget']
  const storeName = storeNames[idNum % storeNames.length]
  const isOfficial = idNum % 2 === 0

  return (
    <Link
      href={`/market/product/${product.id}`}
      className="group flex flex-col bg-white border-0 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-[0_1px_6px_0_rgba(49,53,59,0.12)] h-full"
    >
      <div className="aspect-square w-full bg-slate-50 relative overflow-hidden">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.title} className="object-cover w-full h-full group-hover:scale-102 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full bg-slate-100 flex items-center justify-center">
            <span className="text-[9px] font-bold text-text-secondary/30 uppercase tracking-widest">{product.category}</span>
          </div>
        )}
        
        {/* Discount badge */}
        {discount > 0 && (
          <div className="absolute top-1.5 left-1.5 bg-red-500 text-white font-extrabold text-[8px] px-1 py-0.5 rounded">
            {discount}%
          </div>
        )}
      </div>
      <div className="p-2.5 flex-1 flex flex-col justify-between">
        <div>
          {/* Product Title */}
          <h3 className="text-[11px] font-medium text-text-primary line-clamp-2 h-[32px] leading-snug group-hover:text-[#2DB24A] transition-colors mb-0.5">
            {product.title}
          </h3>
          
          {/* Price */}
          <div className="mt-1">
            <span className="text-xs font-extrabold text-text-primary">
              {product.price === 0 ? 'Gratis' : `Rp${product.price.toLocaleString('id-ID')}`}
            </span>
            {discount > 0 && (
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[9px] text-text-secondary line-through">
                  Rp{originalPrice.toLocaleString('id-ID')}
                </span>
              </div>
            )}
          </div>

          {/* Promo label - clean, no outline */}
          <p className="text-[9px] font-bold text-[#FF5722] mt-1">
            {idNum % 2 === 0 ? `Hemat s.d ${5 + (idNum % 3) * 5}% Pakai Bonus` : 'Bisa COD'}
          </p>
        </div>

        <div className="mt-2 pt-2">
          {/* Rating and Sold */}
          <div className="flex items-center gap-1 text-[9px] text-[#6b7280]">
            <span className="text-[#FFC107]">★</span>
            <span className="font-bold text-text-primary">{rating}</span>
            <span>•</span>
            <span>{sold}+ terjual</span>
          </div>
          
          {/* Store & Location details */}
          <div className="mt-1.5 text-[9px] text-[#6b7280] flex flex-col gap-0.5">
            <div className="flex items-center gap-1 truncate">
              {isOfficial && (
                <span className="w-3.5 h-3.5 rounded bg-purple-600 text-white flex items-center justify-center text-[7px] font-black scale-90 shrink-0">
                  ✔
                </span>
              )}
              <span className="truncate">{storeName}</span>
            </div>
            <p className="truncate text-[#6b7280]">
              {location}
            </p>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ─── Service Card ─────────────────────────────────────────────────────────────
function JasaCard({ product }: { product: any }) {
  return (
    <Link
      href={`/market/product/${product.id}`}
      className="group flex gap-3 p-3 bg-white border-0 rounded-lg transition-all duration-200 hover:shadow-[0_1px_6px_0_rgba(49,53,59,0.12)]"
    >
      <div className="w-16 h-16 rounded-lg bg-slate-50 flex-shrink-0 overflow-hidden">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full bg-primary-container/10 flex items-center justify-center">
            <span className="text-primary/30 text-lg">🛠️</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <h3 className="font-sora text-xs font-bold text-text-primary line-clamp-1 group-hover:text-primary transition-colors">{product.title}</h3>
          <p className="text-[10px] text-text-secondary line-clamp-2 mt-0.5 leading-snug">{product.description}</p>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs font-extrabold text-primary">Rp{product.price.toLocaleString('id-ID')}</span>
          <span className="text-[8px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-semibold">
            Ready
          </span>
        </div>
      </div>
    </Link>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default async function HomePage() {
  const user = await getCurrentUser()
  const allProducts = await getProducts()
  const courses = await getCourses()

  // Filter & slice
  const featuredProducts = allProducts.filter(p => p.category !== 'KERJAAN' && p.category !== 'JASA').slice(0, 12)
  const jasaProducts = allProducts.filter(p => p.category === 'JASA').slice(0, 6)
  const lokerProducts = allProducts.filter(p => p.category === 'KERJAAN').slice(0, 4)
  const featuredCourses = courses.slice(0, 3)

  return (
    <div className="min-h-screen bg-bg-dark">

      {/* ── HERO PROMO BANNER ────────────────────────────────────────────── */}
      <section className="relative bg-white pt-6 pb-6 print:hidden">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Left: Main Slider Mock */}
            <div className="md:col-span-2 relative h-[240px] md:h-[280px] rounded-xl overflow-hidden bg-gradient-to-r from-[#2DB24A] to-[#0F5132] p-8 text-white flex flex-col justify-between shadow-sm">
              <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '16px 16px'}} />
              <div>
                <span className="bg-white/20 text-white font-bold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">Promo Juni 2026</span>
                <h2 className="font-sora text-2xl md:text-3xl font-extrabold mt-3 leading-tight">
                  Digitalisasi UMKM<br />
                  Lebih Mudah & Cepat
                </h2>
                <p className="text-xs text-white/80 mt-2">Dapatkan website toko online gratis, domain pribadi, & gratis pelatihan!</p>
              </div>
              <Link href="/merchant/dashboard" className="bg-[#FFC107] hover:bg-[#FFC107]/95 text-secondary font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-lg w-fit transition-all shadow-md">
                Setup Toko Sekarang
              </Link>
            </div>
            {/* Right: Side banners */}
            <div className="flex flex-col gap-3">
              <div className="flex-1 rounded-xl bg-[#E8F5E9] p-4 flex flex-col justify-between shadow-sm relative overflow-hidden min-h-[110px]">
                <div className="absolute right-[-10px] bottom-[-10px] w-20 h-20 bg-green-500/10 rounded-full" />
                <div>
                  <h3 className="font-sora text-sm font-extrabold text-[#0F5132]">Gabung Koperasi</h3>
                  <p className="text-[11px] text-green-700/80 mt-1">Dapatkan legalitas NIB & akses permodalan usaha.</p>
                </div>
                <Link href="/community" className="text-xs font-bold text-[#0F5132] hover:underline mt-2">Daftar Komunitas →</Link>
              </div>
              <div className="flex-1 rounded-xl bg-[#FFFDE7] p-4 flex flex-col justify-between shadow-sm relative overflow-hidden min-h-[110px]">
                <div className="absolute right-[-10px] bottom-[-10px] w-20 h-20 bg-yellow-500/10 rounded-full" />
                <div>
                  <h3 className="font-sora text-sm font-extrabold text-[#7F6000]">LMS Academy</h3>
                  <p className="text-[11px] text-[#7F6000]/80 mt-1">Belajar pemasaran digital langsung dari ahlinya.</p>
                </div>
                <Link href="/academy" className="text-xs font-bold text-[#7F6000] hover:underline mt-2">Mulai Belajar →</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PLATFORM FEATURES GRID ───────────────────────────────────────── */}
      <section className="max-w-[1280px] mx-auto px-4 md:px-10 py-6 bg-white">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {PLATFORM_FEATURES.map(f => (
            <Link key={f.title} href={f.href}
              className="group flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-all"
            >
              <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                {f.icon}
              </div>
              <div className="min-w-0">
                <h3 className="font-sora text-xs font-bold text-text-primary leading-tight">{f.title}</h3>
                <p className="text-[9px] text-text-secondary truncate mt-0.5">{f.cta} →</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── FEATURED PRODUCTS (MARKETPLACE - TOKOPEDIA FOR YOU) ──────────── */}
      <section className="max-w-[1280px] mx-auto px-4 md:px-10 py-10">
        {/* Tokopedia style tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 pb-2 border-b border-slate-100/50">
          <div className="flex items-center gap-6 overflow-x-auto select-none no-scrollbar">
            <span className="text-sm font-extrabold text-[#2DB24A] pb-2 border-b-2 border-[#2DB24A] whitespace-nowrap cursor-pointer">For You</span>
            <span className="text-xs font-semibold text-text-secondary hover:text-text-primary pb-2 whitespace-nowrap cursor-pointer">Teras Mall</span>
            <span className="text-xs font-semibold text-text-secondary hover:text-text-primary pb-2 whitespace-nowrap cursor-pointer">Produk Incaranmu</span>
          </div>
          <Link href="/market" className="text-xs font-bold text-[#2DB24A] hover:underline mt-2 md:mt-0 md:pb-2 shrink-0">
            Lihat Semua →
          </Link>
        </div>

        {/* Compact, smaller product grid (Tokopedia style) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {featuredProducts.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* ── KATALOG JASA ─────────────────────────────────────────────────── */}
      <section className="bg-white py-10">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="font-sora text-lg font-extrabold text-text-primary">
                Katalog Jasa <span className="text-primary">Profesional</span>
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">Desain, IT, foto, catering, social media & lebih banyak lagi.</p>
            </div>
            <Link href="/market?category=JASA" className="text-xs font-bold text-[#2DB24A] hover:underline">
              Semua Jasa →
            </Link>
          </div>

          {/* Jasa category chips */}
          <div className="flex flex-wrap gap-2 mb-6">
            {JASA_HIGHLIGHTS.map(j => (
              <Link key={j.label}
                href={`/market?category=JASA&query=${j.query}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-semibold bg-slate-100 text-[#4b5563] hover:bg-green-50 hover:text-primary transition-all"
              >
                <span className="scale-75 text-primary">{j.icon}</span>
                {j.label}
              </Link>
            ))}
          </div>

          {/* Jasa list */}
          {jasaProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {jasaProducts.map(p => <JasaCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="text-center py-8 border border-dashed border-border/60 rounded-lg">
              <p className="text-xs text-text-secondary">Belum ada jasa tersedia.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── LMS ACADEMY PREVIEW ──────────────────────────────────────────── */}
      <section className="max-w-[1280px] mx-auto px-4 md:px-10 py-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-sora text-lg font-extrabold text-text-primary">
              Teras <span className="text-[#2DB24A]">Academy</span>
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">Tingkatkan keahlian bisnis langsung dari mentor berpengalaman.</p>
          </div>
          <Link href="/academy" className="text-xs font-bold text-[#2DB24A] hover:underline">
            Semua Kursus →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featuredCourses.map(course => (
            <Link key={course.id} href="/academy"
              className="group bg-white border-0 rounded-lg overflow-hidden transition-all duration-200 hover:shadow-[0_1px_6px_0_rgba(49,53,59,0.12)]"
            >
              {course.coverImage && (
                <div className="aspect-video w-full overflow-hidden">
                  <img src={course.coverImage} alt={course.title} className="object-cover w-full h-full group-hover:scale-102 transition-transform duration-300" />
                </div>
              )}
              <div className="p-4">
                <span className="text-[8px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                  {course.accessRequired} Access
                </span>
                <h3 className="font-sora text-xs font-bold text-text-primary mt-2 mb-1 line-clamp-1 group-hover:text-primary transition-colors">{course.title}</h3>
                <p className="text-[10px] text-text-secondary line-clamp-2 leading-relaxed">{course.description}</p>
                <div className="mt-3 text-[9px] font-bold text-primary flex items-center gap-1">
                  Mulai Belajar · {(course.lessons || []).length} Materi →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── LOWONGAN KERJA ───────────────────────────────────────────────── */}
      {lokerProducts.length > 0 && (
        <section className="bg-white py-10">
          <div className="max-w-[1280px] mx-auto px-4 md:px-10">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="font-sora text-lg font-extrabold text-text-primary">
                  Peluang Kerja <span className="text-primary">Lokal & Proyek</span>
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">Bantu bisnis UMKM berkembang dengan skill Anda.</p>
              </div>
              <Link href="/market?category=KERJAAN" className="text-xs font-bold text-[#2DB24A] hover:underline">Lihat Semua →</Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {lokerProducts.map(p => (
                <Link key={p.id} href={`/market/product/${p.id}`}
                  className="group flex gap-3 p-3 bg-slate-50 hover:bg-slate-100/50 rounded-lg transition-all"
                >
                  {p.imageUrl && (
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h3 className="font-sora text-xs font-bold text-text-primary line-clamp-1 group-hover:text-primary transition-colors">{p.title}</h3>
                      <p className="text-[10px] text-text-secondary line-clamp-2 mt-0.5">{p.description}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[8px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">Lowongan Proyek</span>
                      <span className="text-[9px] text-text-secondary">{p.stock} slot tersisa</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA FOR NON LOGGED IN ─────────────────────────────────────────── */}
      {!user && (
        <section className="bg-gradient-to-r from-primary/5 via-white to-primary/10 py-12">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <h2 className="font-sora text-2xl font-extrabold text-text-primary mb-2">
              Siap gabung bersama <span className="text-primary">12.400+ Mitra UMKM?</span>
            </h2>
            <p className="text-xs text-text-secondary mb-6">Daftar secara gratis, buka toko online Anda, dan capai sukses digital Anda.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/auth?tab=register" className="px-6 py-2.5 bg-[#2DB24A] hover:bg-[#2DB24A]/90 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow shadow-green-500/10">
                Daftar Toko Gratis
              </Link>
              <Link href="/market" className="px-6 py-2.5 bg-white border border-border hover:bg-surface text-text-primary font-bold text-xs uppercase tracking-wider rounded-lg transition-all">
                Jelajahi Produk
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}