import { redirect } from 'next/navigation'
import { getAdminSession, visibleMenus } from './rbac'
import AdminShell from './components/AdminShell'

export const dynamic = 'force-dynamic'

export default async function CmsAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession()
  if (!session) redirect('/')

  return (
    <AdminShell
      allowedKeys={visibleMenus(session).map((m) => m.key)}
      currentUser={{ name: session.user.name, email: session.user.email }}
    >
      {children}
    </AdminShell>
  )
}
