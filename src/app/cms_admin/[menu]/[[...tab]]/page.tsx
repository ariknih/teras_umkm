import { notFound, redirect } from 'next/navigation'
import { menuByKey, resolveTab } from '../../nav.config'
import { getAdminSession, canAccess } from '../../rbac'
import { getCmsAdminData } from '../../data'
import { DataStore } from '@/lib/data-store'
import AdminTabs from '../../components/AdminTabs'
import CsDashboardClient from '../../../cs/CsDashboardClient'
import NotBuiltYet from '../../components/NotBuiltYet'
import OverviewTab from '../../components/OverviewTab'
import AuditLogTab from '../../components/AuditLogTab'
import ProductsTab from '../../components/ProductsTab'
import AffiliatesTab from '../../components/AffiliatesTab'
import AdminsTab from '../../components/AdminsTab'
import ContentBannerTab from '../../components/ContentBannerTab'
import WithdrawalsTab from '../../components/WithdrawalsTab'
import SnackboxPayoutTab from '../../components/SnackboxPayoutTab'
import MerchantVerificationTab from '../../components/MerchantVerificationTab'
import MerchantLevelTab from '../../components/MerchantLevelTab'
import UsersTab from '../../components/UsersTab'
import CertificationTab from '../../components/CertificationTab'
import CoinsTab from '../../components/CoinsTab'
import AcademyTab from '../../components/AcademyTab'
import TransactionsTab from '../../components/TransactionsTab'
import CommunityTab from '../../components/CommunityTab'
import ServicesTab from '../../components/ServicesTab'
import AnnouncementsTab from '../../components/AnnouncementsTab'
import CooperativeReportsTab from '../../components/CooperativeReportsTab'
import KelurahanTab from '../../components/KelurahanTab'
import PaymentMethodsTab from '../../components/PaymentMethodsTab'

/**
 * Menus (or individual tabs) that exist in the IA but have no admin UI yet.
 * Keyed by `menu` or `menu/tab`.
 */
const NOT_BUILT: Record<string, { title: string; detail: string; href?: { label: string; url: string } }> = {
  'services/jadwal': {
    title: 'Jadwal Ketersediaan belum tersedia di CMS',
    detail:
      'getServiceAvailabilityAction dan setServiceAvailabilityAction sudah ada per-jasa, tetapi belum ada kalender lintas-jasa untuk admin. Katalog dan Booking sudah bisa dipakai dari tab lain di menu ini.'
  },
}

export const dynamic = 'force-dynamic'

type Params = { menu: string; tab?: string[] }

export default async function CmsAdminMenuPage({ params }: { params: Promise<Params> }) {
  const { menu: menuKey, tab: tabSegments } = await params

  const menu = menuByKey[menuKey]
  if (!menu) notFound()

  const session = await getAdminSession()
  if (!session) redirect('/')
  if (!canAccess(session, menu.key)) notFound()

  // Reject unknown tab segments rather than silently falling back, so a typo
  // in a shared link is visible instead of landing on the wrong data.
  const requestedTab = tabSegments?.[0]
  if (tabSegments && tabSegments.length > 1) notFound()
  if (requestedTab && !menu.tabs?.some((t) => t.key === requestedTab)) notFound()

  const activeTab = resolveTab(menu, requestedTab)

  const notBuilt = NOT_BUILT[`${menu.key}/${activeTab}`] ?? NOT_BUILT[menu.key]
  if (notBuilt) {
    return (
      <>
        <AdminTabs menu={menu} activeTab={activeTab} />
        <NotBuiltYet {...notBuilt} />
      </>
    )
  }

  const {
    allUsers,
    allProducts,
    allPosts,
    allOrders,
    allCourses,
    allWithdrawals,
    allVouchers,
    coinStats,
    allAdmins,
    allInvoices,
    allCoinHolders,
    allLevelRequests,
    allCommunities,
    coinSupplyConfig,
    coinSupplyLogs,
    auditLogs,
    landingBanners,
    allServices,
    allServiceBookings,
    allAnnouncements,
    allCooperativeReports
  } = await getCmsAdminData()

  // Scoped fetch outside the shared cache — only needed for this one menu,
  // and support tickets are too volatile to sit behind a 30s cache anyway.
  const supportTickets = menu.key === 'support' ? await DataStore.getSupportTickets() : []

  // Extracted per-menu components (Phase 3). Everything else still routes
  // through the legacy bridge below until it gets its own extraction. Keyed
  // by `menu` or `menu/tab` — Kurasi & Eligibility's "Produk Snackbox" tab
  // shares the exact same table as the plain Katalog Produk menu, just
  // narrowed to Snackbox-eligible items.
  const extracted: Record<string, React.ReactNode> = {
    overview: <OverviewTab users={allUsers} products={allProducts} orders={allOrders} />,
    audit: <AuditLogTab auditLogs={auditLogs} activeTab={activeTab!} />,
    products: <ProductsTab initialProducts={allProducts} />,
    'snackbox-kurasi/katalog': <ProductsTab initialProducts={allProducts} snackboxOnly />,
    affiliates: <AffiliatesTab users={allUsers} products={allProducts} orders={allOrders} />,
    admins: <AdminsTab initialAdmins={allAdmins} currentUser={session.user} />,
    'content/banner': <ContentBannerTab initialLandingBanners={landingBanners} />,
    'content/pengumuman': <AnnouncementsTab announcements={allAnnouncements} communities={allCommunities} />,
    withdrawals: <WithdrawalsTab withdrawals={allWithdrawals} />,
    'snackbox-payout': <SnackboxPayoutTab />,
    'merchants/verifikasi': <MerchantVerificationTab initialUsers={allUsers} />,
    'snackbox-kurasi/merchant': <MerchantVerificationTab initialUsers={allUsers} snackboxOnly />,
    'merchants/level': <MerchantLevelTab initialLevelRequests={allLevelRequests} currentUser={session.user} />,
    'users/daftar': <UsersTab initialUsers={allUsers} communities={allCommunities} />,
    'users/sertifikasi': <CertificationTab users={allUsers} />,
    coins: (
      <CoinsTab
        tab={activeTab!}
        users={allUsers}
        communities={allCommunities}
        invoices={allInvoices}
        currentUser={session.user}
        initialCoinHolders={allCoinHolders}
        initialVouchers={allVouchers}
        initialCoinStats={coinStats}
        initialCoinSupplyConfig={coinSupplyConfig}
        initialCoinSupplyLogs={coinSupplyLogs}
      />
    ),
    academy: <AcademyTab initialCourses={allCourses} />,
    transactions: <TransactionsTab orders={allOrders} users={allUsers} />,
    'snackbox-order': <TransactionsTab orders={allOrders} users={allUsers} snackboxOnly relayTab={activeTab} />,
    communities: <CommunityTab tab={activeTab!} users={allUsers} posts={allPosts} initialCommunities={allCommunities} initialInvoices={allInvoices} />,
    'communities/laporan': <CooperativeReportsTab reports={allCooperativeReports} communities={allCommunities} />,
    support: <CsDashboardClient currentUser={session.user} initialTickets={supportTickets} embedded />,
    services: <ServicesTab tab={activeTab!} services={allServices} bookings={allServiceBookings} />,
    'snackbox-coverage': <KelurahanTab />,
    'payment-methods': <PaymentMethodsTab />
  }

  const mockBanner = menu.mock && (
    <div className="mb-6 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium">
      ⚠️ Menu ini masih memakai data contoh (mock) dan belum tersimpan ke database. Perubahan
      akan hilang setelah halaman dimuat ulang.
    </div>
  )

  const extractedNode = extracted[`${menu.key}/${activeTab}`] ?? extracted[menu.key]
  if (!extractedNode) notFound()

  return (
    <>
      <AdminTabs menu={menu} activeTab={activeTab} />
      {mockBanner}
      {extractedNode}
    </>
  )
}
