import { unstable_cache } from 'next/cache'
import { DataStore } from '@/lib/data-store'

/**
 * Every menu and tab under /cms_admin currently reads from this same set of
 * 17 collections (a holdover from the single-file dashboard, since the
 * legacy component hasn't been split per menu yet — see Phase 3 in the
 * sidebar restructure plan). Without caching, clicking any menu or tab
 * re-runs all 17 queries — several unbounded joins (getAllOrders pulls
 * buyer + items for every order; getAllUsers has no limit) — on every click,
 * which is what caused the visible lag.
 *
 * This is admin-wide data, not per-user, so a single shared cache entry is
 * correct. `revalidatePath('/cms_admin', 'layout')` (called by every admin
 * mutation) busts it immediately; the 30s revalidate is only a safety net
 * for any write path that forgets to.
 */
export const getCmsAdminData = unstable_cache(
  async () => {
    const [
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
    ] = await Promise.all([
      DataStore.getAllUsers(),
      DataStore.getProducts(),
      DataStore.getPosts(),
      DataStore.getAllOrders(),
      DataStore.getCourses(),
      DataStore.getAllWithdrawals(),
      DataStore.getAllCoinVouchers(),
      DataStore.getCoinAdminStats(),
      DataStore.getAdmins(),
      DataStore.getInvoiceMemberships(),
      DataStore.getAllCoinHolders(),
      DataStore.getLevelRequests(),
      DataStore.getCommunities(),
      DataStore.getCoinSupplyConfig(),
      DataStore.getCoinSupplyLogs(),
      DataStore.getAuditLogs(),
      DataStore.getAllBanners(),
      DataStore.getServices(),
      DataStore.getServiceBookings()
    ])

    // Announcement/CooperativeReport are per-community models with no
    // platform-wide flag, so the cross-community admin view is an
    // aggregation across every community rather than a single query.
    const [announcementsByCommunity, reportsByCommunity] = await Promise.all([
      Promise.all(allCommunities.map((c: any) => DataStore.getAnnouncements(c.id))),
      Promise.all(allCommunities.map((c: any) => DataStore.getCooperativeReports(c.id)))
    ])
    const allAnnouncements = allCommunities.flatMap((c: any, i: number) =>
      (announcementsByCommunity[i] || []).map((a: any) => ({ ...a, communityName: c.name }))
    )
    const allCooperativeReports = allCommunities.flatMap((c: any, i: number) =>
      (reportsByCommunity[i] || []).map((r: any) => ({ ...r, communityName: c.name }))
    )

    return {
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
    }
  },
  ['cms-admin-data'],
  { tags: ['cms-admin-data'], revalidate: 30 }
)
