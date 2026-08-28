import Link from 'next/link'
import { getCurrentUser } from '@/app/actions/auth'
import { getProducts } from '@/app/actions/products'
import { getCourses } from '@/app/actions/lms'
import { getActiveBanners } from '@/app/actions/landing'
import { getServicesAction } from '@/app/actions/services'
import { getIndukCommunities } from '@/app/actions/community'
import InteractiveFeatures from '@/app/components/InteractiveFeatures'
import ScrollReveal from '@/app/components/ScrollReveal'
import BannerCarousel from '@/app/components/BannerCarousel'
import HomeExplorer from '@/app/components/HomeExplorer'

export default async function HomePage() {
  const user = await getCurrentUser()
  const [allProducts, services, activeBanners, courses, communities] = await Promise.all([
    getProducts(),
    getServicesAction(),
    getActiveBanners(),
    getCourses(),
    getIndukCommunities()
  ])

  return (
    <div className="min-h-screen bg-background flex flex-col font-poppins overflow-hidden">
      
      {/* ── TOP BANNER CAROUSEL ─────────────────────────────────────────── */}
      <div className="w-full pt-16 sm:pt-20 pb-2">
        <BannerCarousel banners={activeBanners} />
      </div>

      {/* ── INTERACTIVE EXPLORER: MARKETPLACE & JASA TOGGLE ─────────────── */}
      <HomeExplorer products={allProducts} services={services} communities={communities} />

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

    </div>
  )
}