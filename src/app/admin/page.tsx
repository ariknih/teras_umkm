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
  const [allUsers, allProducts, allPosts, allOrders, allCourses, allWithdrawals] = await Promise.all([
    DataStore.getAllUsers(),
    DataStore.getProducts(),
    DataStore.getPosts(),
    DataStore.getAllOrders(),
    DataStore.getCourses(),
    DataStore.getAllWithdrawals()
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
    />
  )
}
