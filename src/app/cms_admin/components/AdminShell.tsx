'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { logout } from '@/app/actions/auth'
import { CATEGORIES, MENUS, menuByKey, menuHref, type Menu } from '../nav.config'

type Props = {
  /**
   * Menu keys this admin may see. Only the keys cross the server/client
   * boundary — the menu objects carry Lucide icon components, which are not
   * serializable, so this component reads them from MENUS itself.
   */
  allowedKeys: string[]
  currentUser: { name?: string; email?: string }
  children: React.ReactNode
}

/**
 * Sidebar + header chrome for the whole CMS. Rendered once by the layout, so
 * it survives menu navigation instead of remounting per page.
 *
 * The nav is derived from `MENUS` — previously it was an anonymous array
 * inlined into JSX, duplicated against three other lists that had drifted.
 */
export default function AdminShell({ allowedKeys, currentUser, children }: Props) {
  const allowed = new Set(allowedKeys)
  const menus = MENUS.filter((m) => allowed.has(m.key))

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  // Active menu is the second path segment: /cms_admin/{menu}/{tab}
  const activeMenu = pathname.split('/')[2] ?? ''
  const title = menuByKey[activeMenu]?.title ?? 'Dashboard Overview'
  const fullBleed = menuByKey[activeMenu]?.fullBleed ?? false

  const ungrouped = menus.filter((m) => m.category === null)
  const groups = CATEGORIES
    .map((category) => ({ category, items: menus.filter((m) => m.category === category) }))
    .filter((g) => g.items.length > 0)

  const renderItem = (item: Menu) => {
    const isActive = activeMenu === item.key
    const Icon = item.icon
    return (
      <Link
        key={item.key}
        href={menuHref(item.key)}
        onClick={() => setIsSidebarOpen(false)}
        className={`w-full flex items-center transition-all duration-200 ${
          isSidebarCollapsed ? 'justify-center p-2.5 rounded-lg' : 'gap-3 px-3.5 py-2.5 rounded-lg'
        } ${
          isActive
            ? 'bg-[#b0f1c7]/40 text-[#0f5132] font-semibold border-l-4 border-[#006e24] shadow-xs'
            : 'text-[#6B7280] hover:text-[#111111] hover:bg-[#f2f4f6]'
        }`}
        title={isSidebarCollapsed ? item.label : undefined}
        aria-current={isActive ? 'page' : undefined}
      >
        <Icon size={18} className="flex-shrink-0" />
        {!isSidebarCollapsed && (
          <span className="text-xs font-medium flex items-center gap-1.5">
            {item.label}
            {item.mock && (
              <span
                className="text-[8px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200 px-1 py-px rounded"
                title="Menu ini masih memakai data contoh, belum tersimpan ke database"
              >
                Contoh
              </span>
            )}
          </span>
        )}
      </Link>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fb] text-[#191c1e] font-sans antialiased relative">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden transition-all duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-[#E5E7EB] flex flex-col justify-between transition-all duration-300 lg:translate-x-0 lg:static lg:flex-shrink-0 ${
          isSidebarCollapsed ? 'w-[76px]' : 'w-[260px]'
        } ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex-1 overflow-y-auto scrollbar-none">
          {/* Brand */}
          <div
            className={`h-[64px] border-b border-[#E5E7EB] flex items-center justify-between transition-all duration-300 ${
              isSidebarCollapsed ? 'px-3 justify-center' : 'px-5 gap-3'
            }`}
          >
            {!isSidebarCollapsed ? (
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-9 h-9 bg-primary text-white rounded-lg flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                  S
                </div>
                <div className="flex flex-col justify-center min-w-max">
                  <h1 className="font-bold text-sm text-[#006e24] leading-tight tracking-tight">Saloka Admin</h1>
                  <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">
                    Enterprise Control
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-lg shadow-sm">
                S
              </div>
            )}

            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden lg:flex items-center justify-center p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors border-none bg-transparent"
              title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              aria-label={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transform transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`}
              >
                <path d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          <nav className={`py-4 space-y-4 ${isSidebarCollapsed ? 'px-2' : 'px-3'}`}>
            {ungrouped.length > 0 && <div className="space-y-1">{ungrouped.map(renderItem)}</div>}
            {groups.map((group) => (
              <div key={group.category} className="space-y-1">
                {!isSidebarCollapsed && (
                  <p className="px-3 pt-2 pb-1 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
                    {group.category}
                  </p>
                )}
                {group.items.map(renderItem)}
              </div>
            ))}
          </nav>
        </div>

        {/* Footer */}
        <div
          className={`p-4 border-t border-[#E5E7EB] bg-[#f8f9fb] flex ${
            isSidebarCollapsed ? 'flex-col gap-3 items-center justify-center' : 'items-center justify-between'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#006e24] flex items-center justify-center font-bold text-white shadow-xs text-xs shrink-0">
              {currentUser.name?.charAt(0).toUpperCase()}
            </div>
            {!isSidebarCollapsed && (
              <div className="min-w-0">
                <p className="text-xs font-bold truncate text-[#111111]">{currentUser.name}</p>
                <p className="text-[10px] text-[#6B7280] truncate">{currentUser.email}</p>
              </div>
            )}
          </div>
          <button
              onClick={handleLogout}
              title="Log Out"
              aria-label="Log Out"
              className={`p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer transition-colors border border-red-100 ${
                isSidebarCollapsed ? 'w-8 h-8 flex items-center justify-center' : ''
              }`}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
            </button>
        </div>
      </aside>

      <main className="flex-grow flex flex-col overflow-hidden">
        <header className="h-[64px] border-b border-[#E5E7EB] bg-white px-6 flex items-center justify-between flex-shrink-0 z-10 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-slate-100 lg:hidden text-slate-600 focus:outline-none cursor-pointer"
              aria-label="Buka menu"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h2 className="font-sora text-sm md:text-base font-bold text-[#111111] tracking-tight">{title}</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-[#eef8e9] px-3 py-1.5 rounded-full border border-primary/20">
              <span className="w-2 h-2 rounded-full bg-[#006e24] animate-pulse" />
              <span className="text-[11px] font-semibold text-[#006e24] tracking-wider uppercase">
                System Status: Active
              </span>
            </div>
            <Link
              href="/"
              className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-xs font-semibold text-[#6B7280] hover:text-[#111111] rounded-lg transition-colors border border-[#E5E7EB] shadow-xs"
            >
              Return to Landing
            </Link>
          </div>
        </header>

        <div className={`flex-grow overflow-y-auto relative ${fullBleed ? '' : 'p-8'}`}>{children}</div>
      </main>
    </div>
  )
}
