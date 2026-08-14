import Link from 'next/link'
import { getCurrentUser } from '@/app/actions/auth'
import { getProducts } from '@/app/actions/products'
import { getCourses } from '@/app/actions/lms'
import { getActiveBanners } from '@/app/actions/landing'
import { getServicesAction } from '@/app/actions/services'
import InteractiveFeatures from '@/app/components/InteractiveFeatures'
import ScrollReveal from '@/app/components/ScrollReveal'
import BannerCarousel from '@/app/components/BannerCarousel'
import HomeExplorer from '@/app/components/HomeExplorer'

export default async function HomePage() {
  const user = await getCurrentUser()
  const [allProducts, services, activeBanners, courses] = await Promise.all([
    getProducts(),
    getServicesAction(),
    getActiveBanners(),
    getCourses()
  ])

  return (
    <div className="min-h-screen bg-background flex flex-col font-poppins overflow-hidden">
      
      {/* ── TOP BANNER CAROUSEL ─────────────────────────────────────────── */}
      <div className="w-full pt-24 sm:pt-28 pb-2">
        <BannerCarousel banners={activeBanners} />
      </div>

      {/* ── INTERACTIVE EXPLORER: MARKETPLACE & JASA TOGGLE ─────────────── */}
      <HomeExplorer products={allProducts} services={services} />

      {/* ── KEUNGGULAN PLATFORM ──────────────────────────────────────── */}
      <section className="w-full px-6 md:px-20 py-16 flex flex-col items-center bg-surface">
        <ScrollReveal>
          <div className="w-full max-w-[1280px] py-8 px-6 bg-surface rounded-3xl border border-border shadow-sm flex flex-col items-center gap-8 overflow-hidden">
          <h2 className="text-center text-text-primary text-base font-semibold">Ekosistem Lengkap untuk UMKM Indonesia</h2>
          <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 md:gap-5">
            <Link href="/market" className="flex flex-col items-center gap-2 text-center p-4 rounded-2xl bg-white hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 shadow-xs hover:shadow-md transition-all duration-200 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-[#006e24] group-hover:scale-110 transition-transform">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
              </div>
              <span className="text-sm font-extrabold text-slate-900 group-hover:text-[#006e24] transition-colors">Marketplace</span>
              <span className="text-[11px] text-slate-500">Produk Fisik UMKM</span>
            </Link>

            <Link href="/jasa" className="flex flex-col items-center gap-2 text-center p-4 rounded-2xl bg-white hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 shadow-xs hover:shadow-md transition-all duration-200 group">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-700 group-hover:scale-110 transition-transform">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                </svg>
              </div>
              <span className="text-sm font-extrabold text-slate-900 group-hover:text-[#006e24] transition-colors">Booking Jasa</span>
              <span className="text-[11px] text-slate-500">Layanan & Keahlian</span>
            </Link>

            <Link href="/academy" className="flex flex-col items-center gap-2 text-center p-4 rounded-2xl bg-white hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 shadow-xs hover:shadow-md transition-all duration-200 group">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-700 group-hover:scale-110 transition-transform">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
                </svg>
              </div>
              <span className="text-sm font-extrabold text-slate-900 group-hover:text-[#006e24] transition-colors">Academy LMS</span>
              <span className="text-[11px] text-slate-500">Kursus & Pelatihan</span>
            </Link>

            <Link href="/affiliate" className="flex flex-col items-center gap-2 text-center p-4 rounded-2xl bg-white hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 shadow-xs hover:shadow-md transition-all duration-200 group">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-700 group-hover:scale-110 transition-transform">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <span className="text-sm font-extrabold text-slate-900 group-hover:text-[#006e24] transition-colors">Affiliate Hub</span>
              <span className="text-[11px] text-slate-500">Komisi Multi-Tier</span>
            </Link>

            <Link href="/community" className="flex flex-col items-center gap-2 text-center p-4 rounded-2xl bg-white hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 shadow-xs hover:shadow-md transition-all duration-200 group">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-700 group-hover:scale-110 transition-transform">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <span className="text-sm font-extrabold text-slate-900 group-hover:text-[#006e24] transition-colors">Komunitas</span>
              <span className="text-[11px] text-slate-500">Koperasi & Forum</span>
            </Link>
          </div>
        </div>
        </ScrollReveal>
      </section>

      {/* ── FEATURES & TESTIMONIAL ──────────────────────────────────── */}
      <section className="w-full px-6 md:px-20 py-16 bg-background flex justify-center">
        <ScrollReveal>
          <div className="w-full max-w-[1280px] flex flex-col lg:flex-row gap-12 lg:gap-16 items-stretch">
          {/* Left: Features */}
          <InteractiveFeatures />

          {/* Right: Testimonial */}
          <div className="w-full lg:w-[400px] relative bg-secondary rounded-2xl p-8 flex flex-col justify-center text-surface overflow-hidden shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-b from-secondary/40 to-secondary pointer-events-none" />
            <div className="relative z-10 flex flex-col gap-6">
              <p className="text-sm md:text-base leading-relaxed text-surface/90">
                &quot;Sebagai penyedia jasa keramik di Bandung, saya sangat terbantu dengan kehadiran Saloka.id. Platform ini telah memberikan akses yang mudah dan cepat untuk menjangkau pelanggan baru. Dengan fitur-fitur inovatif yang ditawarkan, saya merasa lebih percaya diri dalam memasarkan produk saya. Saya berharap Saloka terus berinovasi dan menjadi mitra yang lebih baik bagi para pelaku usaha seperti kami.&quot;
              </p>
              <div className="mt-4">
                <h4 className="font-semibold text-lg text-surface">Gilang Prangestu</h4>
                <p className="text-xs text-surface/70">Jasa Keramik Bandung</p>
              </div>
            </div>
          </div>
        </div>
        </ScrollReveal>
      </section>

      {/* ── FAQ SECTION ─────────────────────────────────────────────── */}
      <section className="w-full px-6 md:px-20 py-16 flex justify-center bg-surface">
        <ScrollReveal>
          <div className="w-full max-w-[1280px] flex flex-col md:flex-row gap-12 lg:gap-24">
          <div className="w-full md:w-1/3 flex flex-col gap-4">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary leading-tight">Pertanyaan yang Sering Diajukan</h2>
            <p className="text-text-secondary text-base leading-relaxed">
              Temukan jawaban atas pertanyaan umum seputar Saloka.id dan layanan kami.
            </p>
          </div>
          
          <div className="flex-1 flex flex-col gap-4">
            {[
              { q: 'Apa itu Saloka.id?', a: 'Saloka.id adalah platform ekosistem digital terlengkap untuk pelaku UMKM Indonesia. Kami menyediakan marketplace untuk jual beli produk dan jasa, LMS Academy untuk pelatihan bisnis, program afiliasi untuk menambah penghasilan, serta forum komunitas untuk berjejaring sesama pelaku usaha.' },
              { q: 'Bagaimana cara mendaftar sebagai merchant?', a: 'Klik tombol "Mulai Berdagang Sekarang!" di halaman utama, lalu pilih "Daftar" dan isi data Anda. Setelah mendaftar, Anda bisa langsung membuka toko, menambahkan produk, dan mulai berjualan.' },
              { q: 'Layanan apa saja yang tersedia di Saloka.id?', a: 'Kami menyediakan Marketplace untuk produk fisik dan digital, Katalog Jasa untuk layanan profesional, LMS Academy untuk kursus dan pelatihan bisnis, Affiliate Hub untuk program komisi, serta Community Forum untuk diskusi dan networking.' },
              { q: 'Apakah Saloka.id memiliki layanan pelanggan?', a: 'Ya! Tim customer support kami siap membantu Anda melalui fitur live chat yang tersedia di platform. Anda juga bisa menghubungi kami melalui WhatsApp untuk respon yang lebih cepat.' },
              { q: 'Bagaimana cara pembayaran di Saloka.id?', a: 'Saloka.id mendukung berbagai metode pembayaran melalui Midtrans, termasuk transfer bank, e-wallet (GoPay, OVO, DANA), kartu kredit/debit, dan QRIS. Anda juga bisa menggunakan saldo dompet Saloka untuk transaksi.' },
            ].map((faq, idx) => (
              <details key={idx} className="group border-b border-border pb-4" open={idx === 0}>
                <summary className="flex items-center gap-4 cursor-pointer list-none py-2">
                  <div className="relative w-4 h-4 text-primary shrink-0 transition-transform group-open:rotate-90">
                    <div className="absolute inset-0 bg-current w-0.5 h-4 left-[7px] top-0" />
                    <div className="absolute inset-0 bg-current h-0.5 w-4 left-0 top-[7px]" />
                  </div>
                  <span className="text-lg md:text-xl font-bold text-text-primary">{faq.q}</span>
                </summary>
                <div className="mt-2 pl-8 pr-4 text-text-secondary leading-relaxed text-sm md:text-base">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
        </ScrollReveal>
      </section>

      {/* ── BOTTOM CTA ──────────────────────────────────────────────── */}
      <section className="w-full px-6 py-20 flex justify-center relative overflow-hidden bg-surface">
        <div className="hidden md:block absolute inset-0 pointer-events-none overflow-hidden max-w-[1440px] mx-auto">
            {/* Floating elements styling from Figma (shadows & rotation) */}
            <div className="absolute top-[20%] left-[5%] md:left-[10%] p-3 bg-surface rounded-2xl shadow-glow-card rotate-[-10deg]">
              <img src="/images/shopping_bag.webp" alt="Shopping bag icon" width={64} height={64} loading="lazy" className="w-12 h-12 md:w-16 md:h-16 rounded-xl" />
            </div>
            <div className="absolute bottom-[20%] left-[15%] md:left-[20%] p-3 bg-surface rounded-2xl shadow-glow-card rotate-[18deg]">
              <img src="/images/coffee_cup.webp" alt="Coffee cup icon" width={80} height={80} loading="lazy" className="w-16 h-16 md:w-20 md:h-20 rounded-xl" />
            </div>
            <div className="absolute top-[10%] right-[10%] md:right-[15%] p-3 bg-surface rounded-2xl shadow-glow-card rotate-[6deg]">
              <img src="/images/tools_service.webp" alt="Tools service icon" width={64} height={64} loading="lazy" className="w-12 h-12 md:w-16 md:h-16 rounded-xl" />
            </div>
            <div className="absolute bottom-[25%] right-[5%] md:right-[10%] p-3 bg-surface rounded-2xl shadow-glow-card rotate-[-12deg]">
              <img src="/images/premium_package.webp" alt="Premium package icon" width={80} height={80} loading="lazy" className="w-16 h-16 md:w-20 md:h-20 rounded-xl" />
            </div>
         </div>
        
        <ScrollReveal>
          <div className="relative z-10 w-full max-w-[800px] flex flex-col items-center gap-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary leading-tight">
              Siap memperluas jangkauan bisnis?
          </h2>
          <p className="text-text-secondary text-sm md:text-base leading-relaxed max-w-[690px]">
            Bergabunglah dengan Saloka.id dan tingkatkan visibilitas bisnis Anda! Manfaatkan platform kami yang inovatif untuk memperluas jangkauan produk dan layanan Anda ke audiens yang lebih luas. Transformasi cara Anda berbisnis dengan solusi manajemen pengetahuan yang dirancang untuk masa depan.
          </p>
          <Link href={user ? "/merchant/dashboard" : "/auth?tab=register"} className="mt-4 btn-primary shadow-lg">
            {user ? "Buka Dashboard Anda" : "Mulai Berdagang Sekarang!"}
          </Link>
        </div>
        </ScrollReveal>
      </section>

    </div>
  )
}