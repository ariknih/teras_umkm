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
  { icon: <IconStore />, title: 'Marketplace', desc: 'Ribuan produk UMKM pilihan dari merchant terpercaya seluruh Indonesia.', href: '/market', cta: 'Belanja Sekarang' },
  { icon: <IconBriefcase />, title: 'Katalog Jasa', desc: 'Temukan penyedia jasa profesional: desain, IT, foto, catering, dan lebih banyak.', href: '/market?category=JASA', cta: 'Cari Jasa' },
  { icon: <IconGradCap />, title: 'LMS Academy', desc: 'Kursus bisnis eksklusif dari pakar industri untuk tingkatkan level usaha Anda.', href: '/academy', cta: 'Mulai Belajar' },
  { icon: <IconShare />, title: 'Affiliate Hub', desc: 'Hasilkan komisi multi-tier otomatis dari setiap rekomendasi produk Anda.', href: '/affiliate', cta: 'Bergabung' },
]

// ─── Product Card (server component) ─────────────────────────────────────────
function ProductCard({ product }: { product: any }) {
  return (
    <Link
      href={`/market/product/${product.id}`}
      className="group flex flex-col bg-surface-dark border border-outline-variant/20 hover:border-primary-container/60 rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="aspect-[4/3] w-full bg-surface-container relative overflow-hidden">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-container/10 to-transparent flex items-center justify-center">
            <span className="text-[10px] font-geist font-bold text-primary/30 uppercase tracking-widest">{product.category}</span>
          </div>
        )}
        <div className="absolute top-2.5 left-2.5">
          <span className="px-2 py-0.5 bg-surface-dark/90 backdrop-blur border border-outline-variant/30 rounded-full text-[9px] font-geist font-bold text-on-surface-variant uppercase tracking-wider">
            {product.category?.replace(/_/g, ' ')}
          </span>
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-sora text-sm font-bold text-on-surface line-clamp-1 group-hover:text-primary transition-colors mb-1">{product.title}</h3>
          <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">{product.description}</p>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-outline-variant/20">
          <span className="text-xs text-on-surface-variant">Harga</span>
          <span className="text-sm font-bold text-primary">
            {product.price === 0 ? 'Gratis' : `Rp ${product.price.toLocaleString('id-ID')}`}
          </span>
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
      className="group flex gap-4 p-4 bg-surface-dark border border-outline-variant/20 hover:border-primary-container/50 rounded-xl transition-all duration-200 hover:shadow-md"
    >
      <div className="w-20 h-20 rounded-lg bg-surface-container flex-shrink-0 overflow-hidden">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-primary-container/10 flex items-center justify-center">
            <span className="text-primary/30 text-xl">🛠️</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-sora text-sm font-bold text-on-surface line-clamp-1 group-hover:text-primary transition-colors">{product.title}</h3>
        <p className="text-xs text-on-surface-variant line-clamp-2 mt-1 leading-relaxed">{product.description}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs font-bold text-primary">Rp {product.price.toLocaleString('id-ID')}</span>
          <span className="text-[9px] px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full font-geist font-semibold">
            Stok: {product.stock}
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
  const featuredProducts = allProducts.filter(p => p.category !== 'KERJAAN' && p.category !== 'JASA').slice(0, 8)
  const jasaProducts = allProducts.filter(p => p.category === 'JASA').slice(0, 6)
  const lokerProducts = allProducts.filter(p => p.category === 'KERJAAN').slice(0, 4)
  const featuredCourses = courses.slice(0, 3)

  return (
    <div className="min-h-screen bg-bg-dark">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-white via-surface-container-low to-surface-container overflow-hidden">
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, #735c00 1px, transparent 0)', backgroundSize: '32px 32px'}} />
        <div className="absolute top-0 right-0 w-[500px] h-[400px] bg-gradient-to-bl from-primary-container/20 to-transparent pointer-events-none" />

        <div className="relative max-w-[1280px] mx-auto px-4 md:px-10 py-16 md:py-24">
          <div className="max-w-2xl">
            {user ? (
              <>
                <h1 className="font-sora text-4xl md:text-5xl font-extrabold text-on-surface leading-tight mb-4">
                  Halo, <span className="text-primary">{user.name?.split(' ')[0]}</span>! 👋
                  <br />Apa yang mau kita cari hari ini?
                </h1>
                <p className="text-base text-on-surface-variant mb-8 leading-relaxed">
                  Marketplace, Jasa, Academy, & Community — semua ada di sini untuk tumbuhkan bisnis Anda.
                </p>
              </>
            ) : (
              <>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-container/20 border border-primary-container/30 rounded-full text-xs font-geist font-bold text-primary uppercase tracking-widest mb-5 gsap-fade-up">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" />
                  Platform UMKM Premium Indonesia
                </div>
                <h1 className="font-sora text-4xl md:text-6xl font-extrabold text-on-surface leading-tight mb-4 gsap-split-chars">
                  Ekosistem Digital
                  <br /><span className="text-primary">UMKM Terbaik</span>
                  <br />di Indonesia.
                </h1>
                <p className="text-base text-on-surface-variant mb-8 leading-relaxed max-w-lg gsap-fade-up">
                  Marketplace, Katalog Jasa, LMS Academy, dan Community Forum — semua dalam satu platform premium.
                </p>
              </>
            )}

            <div className="flex flex-wrap gap-3">
              <Link href="/market" className="inline-flex items-center gap-2 px-6 py-3 bg-primary-container text-on-surface font-geist font-bold text-sm uppercase tracking-wider rounded-xl transition-all hover:bg-primary-container/90 hover:shadow-lg hover:-translate-y-0.5 shadow-md">
                <IconStore />
                Jelajahi Marketplace
              </Link>
              <Link href="/market?category=JASA" className="inline-flex items-center gap-2 px-6 py-3 bg-surface-dark border border-outline-variant/40 text-on-surface font-geist font-bold text-sm uppercase tracking-wider rounded-xl transition-all hover:bg-surface-container hover:shadow-md hover:-translate-y-0.5">
                <IconBriefcase />
                Cari Jasa
              </Link>
              {!user && (
                <Link href="/auth?tab=register" className="inline-flex items-center gap-2 px-6 py-3 bg-on-surface text-white font-geist font-bold text-sm uppercase tracking-wider rounded-xl transition-all hover:opacity-90 hover:-translate-y-0.5">
                  Daftar Gratis →
                </Link>
              )}
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-3 mt-8">
              {['Midtrans Payment', 'SSL Secured', 'Komerce Logistik', '12.400+ Merchant'].map(b => (
                <span key={b} className="flex items-center gap-1.5 text-[10px] font-geist font-semibold text-on-surface-variant bg-surface-dark border border-outline-variant/20 px-2.5 py-1 rounded-full">
                  <span className="w-1 h-1 rounded-full bg-green-400 inline-block" />{b}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PLATFORM FEATURES GRID ───────────────────────────────────────── */}
      <section className="max-w-[1280px] mx-auto px-4 md:px-10 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 gsap-stagger-container">
          {PLATFORM_FEATURES.map(f => (
            <Link key={f.title} href={f.href}
              className="group flex flex-col gap-3 p-5 bg-surface-dark border border-outline-variant/20 rounded-xl hover:border-primary-container/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 gsap-stagger-item"
            >
              <div className="w-10 h-10 rounded-lg bg-primary-container/15 border border-primary-container/20 flex items-center justify-center text-primary group-hover:bg-primary-container/25 transition-colors">
                {f.icon}
              </div>
              <div>
                <h3 className="font-sora text-sm font-bold text-on-surface mb-1">{f.title}</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">{f.desc}</p>
              </div>
              <span className="text-[10px] font-geist font-bold text-primary uppercase tracking-wider mt-auto group-hover:gap-2 transition-all">
                {f.cta} →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── KATALOG JASA ─────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-surface-container-low to-surface-dark border-y border-outline-variant/15 py-14">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-2 text-[10px] font-geist font-bold text-primary uppercase tracking-widest bg-primary-container/15 border border-primary-container/25 px-3 py-1.5 rounded-full mb-3 gsap-fade-up">
                <IconBriefcase />
                Katalog Jasa
              </div>
              <h2 className="font-sora text-2xl md:text-3xl font-extrabold text-on-surface gsap-split-chars">
                Temukan Penyedia Jasa <span className="text-primary">Profesional.</span>
              </h2>
              <p className="text-sm text-on-surface-variant mt-1 gsap-fade-up">Desain, IT, foto, catering, social media & lebih banyak lagi.</p>
            </div>
            <Link href="/market?category=JASA" className="hidden md:inline-flex items-center gap-2 text-xs font-geist font-bold text-primary hover:underline">
              Lihat Semua Jasa →
            </Link>
          </div>

          {/* Jasa category chips */}
          <div className="flex flex-wrap gap-2 mb-8">
            {JASA_HIGHLIGHTS.map(j => (
              <Link key={j.label}
                href={`/market?category=JASA&query=${j.query}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-geist font-semibold border border-border-subtle bg-surface-dark text-text-secondary hover:text-primary hover:border-primary/45 transition-all"
              >
                <span className="scale-90 text-primary">{j.icon}</span>
                {j.label}
              </Link>
            ))}
          </div>

          {/* Jasa product list */}
          {jasaProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jasaProducts.map(p => <JasaCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-outline-variant/30 rounded-xl">
              <p className="text-sm text-on-surface-variant">Belum ada jasa tersedia. <Link href="/merchant/dashboard" className="text-primary underline">Tambahkan jasa Anda.</Link></p>
            </div>
          )}

          <div className="mt-6 text-center md:hidden">
            <Link href="/market?category=JASA" className="inline-flex items-center gap-2 text-sm font-geist font-bold text-primary hover:underline">
              Lihat Semua Jasa →
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ────────────────────────────────────────────── */}
      <section className="max-w-[1280px] mx-auto px-4 md:px-10 py-14">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-2 text-[10px] font-geist font-bold text-primary uppercase tracking-widest bg-primary-container/15 border border-primary-container/25 px-3 py-1.5 rounded-full mb-3 gsap-fade-up">
              <IconStore />
              Featured Products
            </div>
            <h2 className="font-sora text-2xl md:text-3xl font-extrabold text-on-surface gsap-split-chars">
              Produk Unggulan <span className="text-primary">Merchant Terpilih.</span>
            </h2>
            <p className="text-sm text-on-surface-variant mt-1 gsap-fade-up">Dari berbagai merchant terpercaya di seluruh Indonesia.</p>
          </div>
          <Link href="/market" className="hidden md:inline-flex text-xs font-geist font-bold text-primary hover:underline">
            Lihat Semua →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {featuredProducts.map(p => <ProductCard key={p.id} product={p} />)}
        </div>

        <div className="mt-6 text-center md:hidden">
          <Link href="/market" className="inline-flex items-center gap-2 text-sm font-geist font-bold text-primary hover:underline">Lihat Semua Produk →</Link>
        </div>
      </section>

      {/* ── LMS ACADEMY PREVIEW ──────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-on-surface to-slate-800 py-14">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-2 text-[10px] font-geist font-bold text-primary-container uppercase tracking-widest bg-primary-container/20 border border-primary-container/30 px-3 py-1.5 rounded-full mb-3">
                <IconGradCap />
                LMS Academy
              </div>
              <h2 className="font-sora text-2xl md:text-3xl font-extrabold text-white">
                Tingkatkan Skill Bisnis <span className="text-primary-container">Anda.</span>
              </h2>
              <p className="text-sm text-white/60 mt-1">Kursus premium dari pakar bisnis dan UMKM terpercaya.</p>
            </div>
            <Link href="/academy" className="hidden md:inline-flex text-xs font-geist font-bold text-primary-container hover:underline">
              Lihat Semua Kursus →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 gsap-stagger-container">
            {featuredCourses.map(course => (
              <Link key={course.id} href="/academy"
                className="group bg-white/10 backdrop-blur border border-white/10 hover:border-primary-container/40 rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl gsap-stagger-item"
              >
                {course.coverImage && (
                  <div className="aspect-video w-full overflow-hidden">
                    <img src={course.coverImage} alt={course.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500 opacity-80" />
                  </div>
                )}
                <div className="p-5">
                  <span className="text-[9px] font-geist font-bold text-primary-container uppercase tracking-widest bg-primary-container/20 px-2 py-0.5 rounded border border-primary-container/20">
                    {course.accessRequired} Access
                  </span>
                  <h3 className="font-sora text-sm font-bold text-white mt-3 mb-2 line-clamp-2 group-hover:text-primary-container transition-colors">{course.title}</h3>
                  <p className="text-xs text-white/50 line-clamp-2 leading-relaxed">{course.description}</p>
                  <div className="mt-4 flex items-center gap-2 text-[10px] font-geist font-bold text-primary-container">
                    <IconGradCap />
                    {(course.lessons || []).length} Pelajaran · Mulai Belajar →
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link href="/academy" className="inline-flex items-center gap-2 px-8 py-3 bg-primary-container text-on-surface font-geist font-bold text-sm uppercase tracking-wider rounded-xl hover:bg-primary-container/90 hover:shadow-lg transition-all hover:-translate-y-0.5 shadow-md">
              <IconGradCap />
              Lihat Semua Kursus Academy
            </Link>
          </div>
        </div>
      </section>

      {/* ── LOWONGAN KERJA ───────────────────────────────────────────────── */}
      {lokerProducts.length > 0 && (
        <section className="max-w-[1280px] mx-auto px-4 md:px-10 py-14">
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="inline-flex items-center gap-2 text-[10px] font-geist font-bold text-primary uppercase tracking-widest bg-primary-container/15 border border-primary-container/25 px-3 py-1.5 rounded-full mb-3">
                <IconTrendUp />
                Lowongan Kerja
              </div>
              <h2 className="font-sora text-2xl font-extrabold text-on-surface">
                Peluang Kerja <span className="text-primary">Freelance & Proyek.</span>
              </h2>
            </div>
            <Link href="/market?category=KERJAAN" className="hidden md:inline-flex text-xs font-geist font-bold text-primary hover:underline">Lihat Semua →</Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lokerProducts.map(p => (
              <Link key={p.id} href={`/market/product/${p.id}`}
                className="group flex gap-4 p-5 bg-surface-dark border border-outline-variant/20 hover:border-primary-container/50 rounded-xl transition-all hover:shadow-md hover:-translate-y-0.5"
              >
                {p.imageUrl && (
                  <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-sora text-sm font-bold text-on-surface line-clamp-1 group-hover:text-primary transition-colors">{p.title}</h3>
                  <p className="text-xs text-on-surface-variant line-clamp-2 mt-1">{p.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[9px] font-geist font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">Buka Lowongan</span>
                    <span className="text-[10px] text-on-surface-variant">{p.stock} posisi tersisa</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── CTA FOR NON LOGGED IN ─────────────────────────────────────────── */}
      {!user && (
        <section className="bg-gradient-to-r from-primary-container/10 via-surface-container to-primary-container/5 border-y border-outline-variant/15 py-16">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <h2 className="font-sora text-3xl font-extrabold text-on-surface mb-3">
              Siap gabung bersama <span className="text-primary">12.400+ merchant?</span>
            </h2>
            <p className="text-sm text-on-surface-variant mb-8">Daftar gratis, buka toko, dan mulai hasilkan dari hari ini.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/auth?tab=register" className="px-8 py-3.5 bg-primary-container text-on-surface font-geist font-bold text-sm uppercase tracking-wider rounded-xl hover:bg-primary-container/90 hover:shadow-lg transition-all hover:-translate-y-0.5 shadow-md">
                Daftar Gratis Sekarang
              </Link>
              <Link href="/market" className="px-8 py-3.5 bg-surface-dark border border-outline-variant/40 text-on-surface font-geist font-bold text-sm uppercase tracking-wider rounded-xl hover:bg-surface-container transition-all hover:-translate-y-0.5">
                Jelajahi Marketplace
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}