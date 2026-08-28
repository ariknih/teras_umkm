import { getCurrentUser } from '@/app/actions/auth'
import { getProducts } from '@/app/actions/products'
import { getCourses } from '@/app/actions/lms'
import { getActiveBanners } from '@/app/actions/landing'
import { getServicesAction } from '@/app/actions/services'
import { getIndukCommunities } from '@/app/actions/community'
import InteractiveFeatures from '@/app/components/InteractiveFeatures'
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
      
      {/* ── SLIDE BANNER ─────────────────────────────────────────────────── */}
      <div id="slide-banner" className="w-full pt-5 pb-0">
        <BannerCarousel banners={activeBanners} />
      </div>

      {/* ── INTERACTIVE EXPLORER: MARKETPLACE & JASA TOGGLE ─────────────── */}
      <HomeExplorer products={allProducts} services={services} communities={communities} />

    </div>
  )
}