import { getCurrentUser } from '@/app/actions/auth'
import { redirect } from 'next/navigation'
import { DataStore } from '@/lib/data-store'
import AdminDashboardClient from './AdminDashboardClient'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const user = await getCurrentUser()

  // Guard: only ADMIN can access
  if (!user || user.role !== 'ADMIN') {
    redirect('/')
  }

  // Fetch all data
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
    landingBanners
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
    DataStore.getAllBanners()
  ])

  return (
    <AdminDashboardClient
      currentUser={user}
      initialUsers={allUsers}
      initialProducts={allProducts}
      initialPosts={allPosts}
      initialOrders={allOrders}
      initialCourses={allCourses}
      initialWithdrawals={allWithdrawals}
      initialVouchers={allVouchers}
      initialCoinStats={coinStats}
      initialAdmins={allAdmins}
      initialInvoices={allInvoices}
      initialCoinHolders={allCoinHolders}
      initialLevelRequests={allLevelRequests}
      initialCommunities={allCommunities}
      initialCoinSupplyConfig={coinSupplyConfig}
      initialCoinSupplyLogs={coinSupplyLogs}
      initialAuditLogs={auditLogs}
      initialLandingBanners={landingBanners}
    />
  )
}

