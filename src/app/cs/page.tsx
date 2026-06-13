import { getCurrentUser } from '@/app/actions/auth'
import { redirect } from 'next/navigation'
import { DataStore } from '@/lib/data-store'
import CsDashboardClient from './CsDashboardClient'

export const dynamic = 'force-dynamic'

export default async function CsDashboard() {
  const user = await getCurrentUser()

  // Guard: only CUSTOMER_SERVICE can access
  if (!user || user.role !== 'CUSTOMER_SERVICE') {
    redirect('/')
  }

  // Fetch support tickets
  const tickets = await DataStore.getSupportTickets()

  return (
    <CsDashboardClient
      currentUser={user}
      initialTickets={tickets}
    />
  )
}
