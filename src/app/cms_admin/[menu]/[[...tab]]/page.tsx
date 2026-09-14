import { notFound, redirect } from 'next/navigation'
import { menuByKey, resolveTab } from '../../nav.config'
import { getAdminSession, canAccess } from '../../rbac'
import { getCmsAdminData, getAllAnnouncements, getAllCooperativeReports } from '../../data'
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
import CoinsTab from '../../components/CoinsTab'
import AcademyTab from '../../components/AcademyTab'
import SertifikatTab from '../../components/SertifikatTab'
import RincianKursusView from '../../components/academy/RincianKursusView'
import SuntingKursusView from '../../components/academy/SuntingKursusView'
import RincianTemplateView from '../../components/academy/RincianTemplateView'
import { computeCourseParticipation } from '@/lib/lms-rules'
import TransactionsTab from '../../components/TransactionsTab'
import CommunityTab from '../../components/CommunityTab'
import ServicesTab from '../../components/ServicesTab'
import AnnouncementsTab from '../../components/AnnouncementsTab'
import CooperativeReportsTab from '../../components/CooperativeReportsTab'
import KelurahanTab from '../../components/KelurahanTab'
import PaymentMethodsTab from '../../components/PaymentMethodsTab'
import FeatureControlTab from '../../components/FeatureControlTab'
import SocialsTab from '../../components/SocialsTab'
import ContactSupportTab from '../../components/ContactSupportTab'
import LegalEditorTab from '../../components/LegalEditorTab'
import { CONTACT_KEY, LEGAL_DOCS, SOCIALS_KEY, parseContact, parseLegal, parseSocials } from '@/lib/organization'

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

  // Academy is the sole carve-out from the flat one-segment tab contract:
  // its Rincian/Sunting/Template views need a record id after the sub-view
  // key (/cms_admin/academy/rincian/<id>). Every other menu keeps the strict
  // single-segment rule below untouched.
  const ACADEMY_SUBVIEWS = ['rincian', 'sunting', 'template'] as const
  const isAcademySubview =
    menu.key === 'academy' && !!requestedTab && (ACADEMY_SUBVIEWS as readonly string[]).includes(requestedTab)

  if (isAcademySubview) {
    if (tabSegments!.length !== 2 || !tabSegments![1]) notFound()
  } else {
    if (tabSegments && tabSegments.length > 1) notFound()
    if (requestedTab && !menu.tabs?.some((t) => t.key === requestedTab)) notFound()
  }

  const activeTab = isAcademySubview ? requestedTab! : resolveTab(menu, requestedTab)

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
    allServiceBookings
  } = await getCmsAdminData()

  // Scoped fetches outside the shared cache — each only needed for one menu.
  // Support tickets are too volatile to sit behind a 30s cache anyway;
  // announcements/reports fan out one query per community, which is too
  // expensive to run on every navigation just for two tabs.
  const supportTickets = menu.key === 'support' ? await DataStore.getSupportTickets() : []
  // Read fresh (not cached): its `version` drives optimistic concurrency on save.
  const featureControl = menu.key === 'features' ? await DataStore.getFeatureControl() : null
  // Organization menus read their SystemSetting row fresh for the same reason.
  const orgSettingKey = (
    {
      'org-socials': SOCIALS_KEY,
      'org-contact': CONTACT_KEY,
      'org-privacy': LEGAL_DOCS.privacy.key,
      'org-terms': LEGAL_DOCS.terms.key
    } as Record<string, string | undefined>
  )[menu.key]
  const orgSetting = orgSettingKey ? await DataStore.getSetting(orgSettingKey) : null
  const allAnnouncements = menu.key === 'content' && activeTab === 'pengumuman' ? await getAllAnnouncements(allCommunities) : []
  const allCooperativeReports = menu.key === 'communities' && activeTab === 'laporan' ? await getAllCooperativeReports(allCommunities) : []

  // One query across every progress row, independent of how many courses
  // exist — computeCourseParticipation buckets it into Berjalan/Selesai per
  // course. Powers both the Peserta column on the list and the Rincian view.
  const academyParticipation =
    menu.key === 'academy'
      ? computeCourseParticipation(allCourses, await DataStore.getAllProgress())
      : {}

  // Scoped to the academy menu only — Kursus needs it for the template picker,
  // Sertifikat needs it for the list itself.
  const allCertificateTemplates =
    menu.key === 'academy' ? await DataStore.getCertificateTemplates() : []

  if (isAcademySubview) {
    if (requestedTab === 'template') {
      const templateId = tabSegments![1]
      const template = allCertificateTemplates.find((t: any) => t.id === templateId)
      if (!template) notFound()
      return <RincianTemplateView template={template} courses={allCourses} />
    }

    const courseId = tabSegments![1]
    // Fetched fresh (not off the lean allCourses list) since this is the one
    // view that actually needs coverImage + certificateTemplate.backgroundImage.
    const course = await DataStore.getCourseById(courseId)
    if (!course) notFound()

    return (
      <>
        {requestedTab === 'sunting' ? (
          <SuntingKursusView course={course} templates={allCertificateTemplates} />
        ) : (
          <RincianKursusView
            course={course}
            participation={academyParticipation[course.id] || { berjalan: 0, selesai: 0 }}
            templates={allCertificateTemplates}
          />
        )}
      </>
    )
  }

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
    users: <UsersTab initialUsers={allUsers} communities={allCommunities} currentUser={session.user} />,
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
    'academy/kursus': <AcademyTab initialCourses={allCourses} participation={academyParticipation} templates={allCertificateTemplates} />,
    'academy/sertifikat': <SertifikatTab initialTemplates={allCertificateTemplates} courses={allCourses} isSuperAdmin={session.isSuperAdmin} />,
    transactions: <TransactionsTab orders={allOrders} users={allUsers} />,
    'snackbox-order': <TransactionsTab orders={allOrders} users={allUsers} snackboxOnly relayTab={activeTab} />,
    communities: <CommunityTab tab={activeTab!} users={allUsers} posts={allPosts} initialCommunities={allCommunities} initialInvoices={allInvoices} />,
    'communities/laporan': <CooperativeReportsTab reports={allCooperativeReports} communities={allCommunities} />,
    support: <CsDashboardClient currentUser={session.user} initialTickets={supportTickets} embedded />,
    services: <ServicesTab tab={activeTab!} services={allServices} bookings={allServiceBookings} />,
    'snackbox-coverage': <KelurahanTab />,
    'payment-methods': <PaymentMethodsTab />,
    features: featureControl && <FeatureControlTab initial={featureControl} />,
    'org-socials': menu.key === 'org-socials' && orgSetting && (
      <SocialsTab initial={{ socials: parseSocials(orgSetting.value), version: orgSetting.version }} />
    ),
    'org-contact': menu.key === 'org-contact' && orgSetting && (
      <ContactSupportTab initial={{ contact: parseContact(orgSetting.value), version: orgSetting.version }} />
    ),
    'org-privacy': menu.key === 'org-privacy' && orgSetting && (
      <LegalEditorTab slug="privacy" initial={{ state: parseLegal(orgSetting.value), version: orgSetting.version }} />
    ),
    'org-terms': menu.key === 'org-terms' && orgSetting && (
      <LegalEditorTab slug="terms" initial={{ state: parseLegal(orgSetting.value), version: orgSetting.version }} />
    )
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
