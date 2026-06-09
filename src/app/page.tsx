import Link from 'next/link'
import { getCurrentUser } from './actions/auth'
import { getProducts } from './actions/products'
import { getCourses } from './actions/lms'

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
        {/* Background Gradients & Images */}
        <div className="absolute inset-0 z-0">
           {/* Gradient as per figma design bg-linear-234 */}
           <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/60 to-white z-10 pointer-events-none" />
           {/* The user's uploaded photo from the market */}
           <img 
             src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80" 
             alt="Saloka Market" 
             className="w-full h-full object-cover opacity-80 md:opacity-100" 
           />
        </div>
        
        <div className="relative z-10 max-w-[630px] flex flex-col gap-8 bg-white/40 md:bg-transparent p-6 rounded-2xl md:p-0 backdrop-blur-sm md:backdrop-blur-none">
          <h1 className="text-text-primary text-4xl md:text-6xl font-bold leading-tight">
            Berniaga mudah <br className="hidden md:block" />
            hanya di <span className="text-tertiary">Saloka.id</span>
          </h1>
          <p className="text-text-primary text-lg md:text-xl font-normal leading-relaxed">
            Memperluas jangkauan toko, jasa, atau komunitas sekarang menjadi semakin mudah!
          </p>
          <Link href={user ? "/merchant/dashboard" : "/auth?tab=register"} className="w-fit btn-primary shadow-lg">
            {user ? "Buka Dashboard Anda" : "Mulai Berdagang Sekarang!"}
          </Link>
        </div>
      </section>

      {/* ── TRUSTED BY SECTION ──────────────────────────────────────── */}
      <section className="w-full px-6 md:px-20 py-16 flex flex-col items-center bg-surface">
        <div className="w-full max-w-[1280px] py-8 px-6 bg-surface rounded-3xl border border-border shadow-sm flex flex-col items-center gap-8 overflow-hidden">
          <h3 className="text-center text-text-primary text-base font-semibold">Trusted by 100+ Companies!</h3>
          {/* Logo marquee placeholder */}
          <div className="w-full relative flex items-center justify-center overflow-hidden">
            <div className="flex items-center gap-8 md:gap-16 opacity-70">
              <img className="h-10 object-contain" src="https://placehold.co/107x42/f3f4f6/9ca3af?text=Logo" alt="Brand" />
              <img className="h-10 object-contain" src="https://placehold.co/98x42/f3f4f6/9ca3af?text=Brand" alt="Brand" />
              <img className="h-10 object-contain hidden md:block" src="https://placehold.co/198x42/f3f4f6/9ca3af?text=Company" alt="Company" />
              <img className="h-12 object-contain" src="https://placehold.co/84x52/f3f4f6/9ca3af?text=Inc" alt="Inc" />
              <img className="h-10 object-contain hidden sm:block" src="https://placehold.co/144x42/f3f4f6/9ca3af?text=Studio" alt="Studio" />
            </div>
            {/* Fade edges */}
            <div className="w-16 md:w-56 h-full left-0 top-0 absolute bg-gradient-to-r from-surface to-transparent pointer-events-none" />
            <div className="w-16 md:w-56 h-full right-0 top-0 absolute bg-gradient-to-l from-surface to-transparent pointer-events-none" />
          </div>
        </div>
      </section>

      {/* ── FEATURES & TESTIMONIAL ──────────────────────────────────── */}
      <section className="w-full px-6 md:px-20 py-16 bg-background flex justify-center">
        <div className="w-full max-w-[1280px] flex flex-col lg:flex-row gap-12 lg:gap-16 items-stretch">
          {/* Left: Features */}
          <div className="flex-1 flex flex-col gap-6">
             <div className="w-full h-64 md:h-96 relative bg-purple-100 rounded-2xl overflow-hidden flex items-center justify-center border border-purple-200">
               {/* Background blur from Figma */}
               <div className="absolute opacity-20 bg-neutral-400 blur-3xl w-full h-full scale-150" />
               <img src="https://placehold.co/394x793/D8B4E2/ffffff?text=App" alt="App preview" className="absolute top-10 md:top-20 right-[-20px] md:right-[-50px] w-48 md:w-80 shadow-2xl rounded-xl transform rotate-12" />
               <div className="absolute top-6 left-6 md:top-8 md:left-8 bg-purple-200 text-purple-900 px-4 py-2 rounded-xl text-xs md:text-sm font-medium shadow-sm max-w-[200px] border border-purple-300">
                 Marketplace menawarkan produk & jasa!
               </div>
             </div>
             {/* Feature Tabs */}
             <div className="flex gap-2 w-full overflow-x-auto pb-2 scrollbar-hide">
               <div className="flex-1 min-w-[120px] px-4 py-2.5 bg-surface rounded-xl shadow-sm border border-border text-center text-text-primary font-semibold cursor-pointer">Marketplace</div>
               <div className="flex-1 min-w-[120px] px-4 py-2.5 bg-background rounded-xl border border-border text-center text-text-secondary font-semibold cursor-pointer hover:bg-gray-100">Affiliate Hub</div>
               <div className="flex-1 min-w-[120px] px-4 py-2.5 bg-background rounded-xl border border-border text-center text-text-secondary font-semibold cursor-pointer hover:bg-gray-100">Academy</div>
             </div>
          </div>

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
      </section>

      {/* ── NEW PRODUCT LINE (MASAYA) ───────────────────────────────── */}
      <section className="w-full px-6 md:px-20 py-16 flex justify-center bg-surface">
        <div className="w-full max-w-[1280px] bg-background rounded-3xl border border-border p-8 md:p-12 flex flex-col lg:flex-row gap-12 relative overflow-hidden shadow-sm">
          {/* Decorative blurs */}
          <div className="btn-primary absolute top-0 left-[-50px] w-64 bg-primary/20 blur-3xl" />
          <div className="btn-primary absolute bottom-0 right-[100px] w-80 bg-primary/20 blur-3xl" />
          
          <div className="flex-1 flex flex-col justify-center gap-6 relative z-10 max-w-sm">
            <h2 className="text-2xl md:text-3xl font-semibold text-text-primary leading-snug">Lini produk baru dari Masaya Furnitures!</h2>
            <p className="text-text-secondary text-sm md:text-base leading-relaxed">
              Masaya furnitures memperkenalkan lini produk baru yang digadang-gadang sebagai upaya mereka mencapai emisi karbon 0%.
            </p>
            <div className="flex gap-2 mt-2">
              <div className="btn-primary w-8" />
              <div className="w-2 h-2 bg-border rounded-full" />
              <div className="w-2 h-2 bg-border rounded-full" />
            </div>
          </div>

          <div className="flex-[1.5] relative z-10 flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
            <img src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=400" alt="Furniture" className="w-64 h-48 md:w-80 md:h-64 rounded-2xl object-cover shrink-0 shadow-md snap-center" />
            <div className="w-64 h-48 md:w-80 md:h-64 rounded-2xl bg-black/50 shrink-0 shadow-md snap-center flex items-center justify-center text-surface/50 text-sm">Product Image</div>
            <img src="https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=400" alt="Furniture" className="w-64 h-48 md:w-80 md:h-64 rounded-2xl object-cover shrink-0 shadow-md snap-center" />
          </div>
        </div>
      </section>

      {/* ── FAQ SECTION ─────────────────────────────────────────────── */}
      <section className="w-full px-6 md:px-20 py-16 flex justify-center bg-surface">
        <div className="w-full max-w-[1280px] flex flex-col md:flex-row gap-12 lg:gap-24">
          <div className="w-full md:w-1/3 flex flex-col gap-4">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary leading-tight">Frequently Asked Questions</h2>
            <p className="text-text-secondary text-base leading-relaxed">
              Improve your learning experience with our user-centered platform! Now with the assistance of Learning AI!
            </p>
          </div>
          
          <div className="flex-1 flex flex-col gap-4">
            {[
              { q: 'What is Saloka', a: 'Improve your learning experience with our user-centered learning platform! Now with the assistance of Learning AI! Improve your learning experience with our user-centered learning platform! Now with the assistance of Learning AI!' },
              { q: 'How do I login', a: 'You can login by clicking the Login button on the top right corner and entering your credentials.' },
              { q: 'What are the services provided by Saloka?', a: 'We offer a marketplace for physical and digital goods, professional services, an LMS for business training, and an affiliate hub.' },
              { q: 'Does Saloka have Customer Support?', a: 'Yes, our customer support is available 24/7 via the help center and live chat.' }
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
            
            <button className="mt-4 flex items-center gap-2 text-primary font-medium hover:text-secondary w-fit transition-colors">
              See More FAQs
              <div className="btn-primary w-5 bg-primary/10 flex items-center justify-center">
                <div className="btn-primary w-1.5" />
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ──────────────────────────────────────────────── */}
      <section className="w-full px-6 py-20 flex justify-center relative overflow-hidden bg-surface">
        <div className="absolute inset-0 pointer-events-none overflow-hidden max-w-[1440px] mx-auto">
           {/* Floating elements styling from Figma (shadows & rotation) */}
           <div className="absolute top-[20%] left-[5%] md:left-[10%] p-3 bg-surface rounded-2xl shadow-glow-card rotate-[-10deg]">
             <img src="https://placehold.co/72x72/f3f4f6/9ca3af" className="w-12 h-12 md:w-16 md:h-16 rounded-xl" alt="icon" />
           </div>
           <div className="absolute bottom-[20%] left-[15%] md:left-[20%] p-3 bg-surface rounded-2xl shadow-glow-card rotate-[18deg]">
             <img src="https://placehold.co/78x78/f3f4f6/9ca3af" className="w-16 h-16 md:w-20 md:h-20 rounded-xl" alt="icon" />
           </div>
           <div className="absolute top-[10%] right-[10%] md:right-[15%] p-3 bg-surface rounded-2xl shadow-glow-card rotate-[6deg]">
             <img src="https://placehold.co/68x68/f3f4f6/9ca3af" className="w-12 h-12 md:w-16 md:h-16 rounded-xl" alt="icon" />
           </div>
           <div className="absolute bottom-[25%] right-[5%] md:right-[10%] p-3 bg-surface rounded-2xl shadow-glow-card rotate-[-12deg]">
             <img src="https://placehold.co/73x73/f3f4f6/9ca3af" className="w-16 h-16 md:w-20 md:h-20 rounded-xl" alt="icon" />
           </div>
        </div>
        
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
      </section>

    </div>
  )
}