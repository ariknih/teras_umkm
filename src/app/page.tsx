import Link from 'next/link'
import { getCurrentUser } from '@/app/actions/auth'
import { getProducts } from '@/app/actions/products'
import { getCourses } from '@/app/actions/lms'
import InteractiveFeatures from '@/app/components/InteractiveFeatures'
import HeroBackground from '@/app/components/HeroBackground'
import ScrollReveal from '@/app/components/ScrollReveal'

export default async function HomePage() {
  const user = await getCurrentUser()
  const allProducts = await getProducts()
  const courses = await getCourses()

  // Filter & slice (if you still want to use real data for future sections)
  const featuredProducts = allProducts.filter(p => p.category !== 'KERJAAN' && p.category !== 'JASA').slice(0, 12)
  const jasaProducts = allProducts.filter(p => p.category === 'JASA').slice(0, 6)
  const lokerProducts = allProducts.filter(p => p.category === 'KERJAAN').slice(0, 4)
  const featuredCourses = courses.slice(0, 3)

  return (
    <div className="min-h-screen bg-background flex flex-col font-poppins overflow-hidden">
      
      {/* ── HERO SECTION ────────────────────────────────────────────── */}
      <section className="relative w-full max-w-[1440px] mx-auto min-h-[500px] md:h-[768px] flex items-center px-6 md:px-16 overflow-hidden">
        <HeroBackground />
        
        <div className="relative z-10 max-w-[630px] flex flex-col gap-8 bg-white/40 md:bg-transparent p-6 rounded-2xl md:p-0 backdrop-blur-sm md:backdrop-blur-none">
          <h1 className="text-text-primary text-4xl md:text-6xl font-bold leading-tight">
            Berniaga mudah <br className="hidden md:block" />
            hanya di <span className="text-text-primary">Saloka</span><span className="text-tertiary">.id</span>
          </h1>
          <p className="text-text-primary text-lg md:text-xl font-normal leading-relaxed">
            Memperluas jangkauan toko, jasa, atau komunitas sekarang menjadi semakin mudah!
          </p>
          <Link href={user ? "/merchant/dashboard" : "/auth?tab=register"} className="w-fit btn-primary shadow-lg">
            {user ? "Buka Dashboard Anda" : "Mulai Berdagang Sekarang!"}
          </Link>
        </div>
      </section>

      {/* ── KEUNGGULAN PLATFORM ──────────────────────────────────────── */}
      <section className="w-full px-6 md:px-20 py-16 flex flex-col items-center bg-surface">
        <ScrollReveal>
          <div className="w-full max-w-[1280px] py-8 px-6 bg-surface rounded-3xl border border-border shadow-sm flex flex-col items-center gap-8 overflow-hidden">
          <h3 className="text-center text-text-primary text-base font-semibold">Ekosistem Lengkap untuk UMKM Indonesia</h3>
          <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div className="flex flex-col items-center gap-2 text-center">
              <span className="text-3xl md:text-4xl font-bold text-primary">🛒</span>
              <span className="text-2xl font-bold text-text-primary">Marketplace</span>
              <span className="text-xs text-text-secondary">Jual beli produk & jasa</span>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <span className="text-3xl md:text-4xl font-bold text-primary">🎓</span>
              <span className="text-2xl font-bold text-text-primary">Academy</span>
              <span className="text-xs text-text-secondary">Kursus & pelatihan bisnis</span>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <span className="text-3xl md:text-4xl font-bold text-primary">🤝</span>
              <span className="text-2xl font-bold text-text-primary">Affiliate</span>
              <span className="text-xs text-text-secondary">Program afiliasi & komisi</span>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <span className="text-3xl md:text-4xl font-bold text-primary">💬</span>
              <span className="text-2xl font-bold text-text-primary">Komunitas</span>
              <span className="text-xs text-text-secondary">Forum diskusi & networking</span>
            </div>
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

      {/* ── PRODUK UNGGULAN ───────────────────────────────────────────── */}
      {featuredProducts.length > 0 && (
      <section className="w-full px-6 md:px-20 py-16 flex justify-center bg-surface">
        <ScrollReveal>
          <div className="w-full max-w-[1280px] bg-background rounded-3xl border border-border p-8 md:p-12 flex flex-col gap-8 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 left-[-50px] w-64 h-64 bg-primary/10 blur-3xl rounded-full pointer-events-none" />
          <div className="absolute bottom-0 right-[100px] w-80 h-80 bg-primary/10 blur-3xl rounded-full pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-semibold text-text-primary leading-snug">Produk Unggulan di Saloka.id</h2>
              <p className="text-text-secondary text-sm md:text-base leading-relaxed mt-2">
                Temukan berbagai produk UMKM berkualitas dari seluruh Indonesia.
              </p>
            </div>
            <Link href="/market" className="btn-secondary text-sm shrink-0">
              Lihat Semua Produk →
            </Link>
          </div>

          <div className="relative z-10 flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x">
            {featuredProducts.slice(0, 6).map((product) => (
              <Link key={product.id} href={`/market/product/${product.id}`} className="w-56 md:w-64 shrink-0 snap-center group">
                <div className="w-full h-40 md:h-48 rounded-2xl overflow-hidden bg-surface-container shadow-md">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-secondary text-sm">Tidak ada gambar</div>
                  )}
                </div>
                <h3 className="mt-3 text-sm font-semibold text-text-primary line-clamp-1 group-hover:text-primary transition-colors">{product.title}</h3>
                <p className="text-primary font-bold text-sm">Rp {product.price.toLocaleString('id-ID')}</p>
              </Link>
            ))}
          </div>
        </div>
        </ScrollReveal>
      </section>
      )}

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
              <img src="/images/shopping_bag.webp" className="w-12 h-12 md:w-16 md:h-16 rounded-xl" alt="icon" />
            </div>
            <div className="absolute bottom-[20%] left-[15%] md:left-[20%] p-3 bg-surface rounded-2xl shadow-glow-card rotate-[18deg]">
              <img src="/images/coffee_cup.webp" className="w-16 h-16 md:w-20 md:h-20 rounded-xl" alt="icon" />
            </div>
            <div className="absolute top-[10%] right-[10%] md:right-[15%] p-3 bg-surface rounded-2xl shadow-glow-card rotate-[6deg]">
              <img src="/images/tools_service.webp" className="w-12 h-12 md:w-16 md:h-16 rounded-xl" alt="icon" />
            </div>
            <div className="absolute bottom-[25%] right-[5%] md:right-[10%] p-3 bg-surface rounded-2xl shadow-glow-card rotate-[-12deg]">
              <img src="/images/premium_package.webp" className="w-16 h-16 md:w-20 md:h-20 rounded-xl" alt="icon" />
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