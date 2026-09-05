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
      allServiceBookings
    }
  },
  ['cms-admin-data'],
  { tags: ['cms-admin-data'], revalidate: 30 }
)

/**
 * Announcement/CooperativeReport are per-community models with no
 * platform-wide flag, so the cross-community admin view means fanning out
 * one query per community. That's too expensive to run on every navigation
 * as part of the shared cache above — it only belongs to two tabs, so it's
 * fetched lazily by the page itself instead (see [menu]/[[...tab]]/page.tsx).
 */
export async function getAllAnnouncements(communities: { id: string; name: string }[]) {
  const byCommunity = await Promise.all(communities.map((c) => DataStore.getAnnouncements(c.id)))
  return communities.flatMap((c, i) => (byCommunity[i] || []).map((a: any) => ({ ...a, communityName: c.name })))
}

export async function getAllCooperativeReports(communities: { id: string; name: string }[]) {
  const byCommunity = await Promise.all(communities.map((c) => DataStore.getCooperativeReports(c.id)))
  return communities.flatMap((c, i) => (byCommunity[i] || []).map((r: any) => ({ ...r, communityName: c.name })))
}
