'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { logout } from '@/app/actions/auth'
import { Search, ChevronDown, AppWindow, LogOut } from 'lucide-react'
import { CATEGORIES, CATEGORY_ICONS, MENUS, menuByKey, menuHref, type Menu } from '../nav.config'

type Props = {
  /**
   * Menu keys this admin may see. Only the keys cross the server/client
   * boundary — the menu objects carry Lucide icon components, which are not
   * serializable, so this component reads them from MENUS itself.
   */
  allowedKeys: string[]
  currentUser: { name?: string; email?: string; isSuperAdmin?: boolean }
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
  const [search, setSearch] = useState('')
  const [openCategories, setOpenCategories] = useState<Set<string>>(() => new Set(CATEGORIES))
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const shouldFocusSearch = useRef(false)

  useEffect(() => {
    if (!isSidebarCollapsed && shouldFocusSearch.current) {
      shouldFocusSearch.current = false
      searchInputRef.current?.focus()
    }
  }, [isSidebarCollapsed])

  const expandSidebarAndFocusSearch = () => {
    shouldFocusSearch.current = true
    setIsSidebarCollapsed(false)
  }

  const toggleCategory = (category: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev)
      next.has(category) ? next.delete(category) : next.add(category)
      return next
    })
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  // Active menu is the second path segment: /cms_admin/{menu}/{tab}
  const activeMenu = pathname.split('/')[2] ?? ''
  const title = menuByKey[activeMenu]?.title ?? 'Dashboard Overview'
  const fullBleed = menuByKey[activeMenu]?.fullBleed ?? false

  const q = search.trim().toLowerCase()
  const matchesSearch = (m: Menu) => !q || m.label.toLowerCase().includes(q)

  const ungrouped = menus.filter((m) => m.category === null && matchesSearch(m))
  const groups = CATEGORIES
    .map((category) => ({ category, items: menus.filter((m) => m.category === category && matchesSearch(m)) }))
    .filter((g) => g.items.length > 0)
  const noResults = q && ungrouped.length === 0 && groups.length === 0

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
            ? 'bg-market-green-50 text-market-green-600 font-semibold'
            : 'text-on-surface-variant hover:text-text-primary hover:bg-surface-container-low'
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
                className="text-[8px] font-bold uppercase tracking-wider bg-tertiary-container text-on-tertiary-container border border-tertiary/30 px-1 py-px rounded"
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
    <div className="flex h-screen overflow-hidden bg-background text-text-primary font-sans antialiased relative">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden transition-all duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-border-subtle flex flex-col justify-between transition-all duration-300 lg:translate-x-0 lg:static lg:flex-shrink-0 ${
          isSidebarCollapsed ? 'w-[76px]' : 'w-[260px]'
        } ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand */}
        <div
          className={`h-[64px] border-b border-border-subtle flex items-center justify-between transition-all duration-300 flex-shrink-0 ${
            isSidebarCollapsed ? 'px-3 justify-center' : 'px-5 gap-3'
          }`}
        >
          {!isSidebarCollapsed ? (
            <div className="flex items-center gap-3 overflow-hidden">
              <img src="/images/Variant=Icon.webp" alt="" className="w-9 h-9 rounded-lg object-cover shadow-sm shrink-0" />
              <div className="flex flex-col justify-center min-w-max">
                <h1 className="font-bold text-sm text-market-green-600 leading-tight tracking-tight">Saloka</h1>
                <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">
                  Admin CMS
                </p>
              </div>
            </div>
          ) : (
            <img src="/images/Variant=Icon.webp" alt="" className="w-9 h-9 rounded-lg object-cover shadow-sm" />
          )}

          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden lg:flex items-center justify-center p-1.5 rounded-lg hover:bg-surface-container-low text-on-surface-variant hover:text-text-primary cursor-pointer transition-colors border-none bg-transparent"
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

        <div className="flex-1 overflow-y-auto thin-scrollbar">
          {!isSidebarCollapsed ? (
            <div className="px-3 pt-4">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search your menu"
                  className="w-full bg-white border border-border-subtle rounded-lg pl-9 pr-3 py-2 text-xs text-text-primary placeholder-on-surface-variant outline-none focus:border-market-green-500"
                />
              </div>
            </div>
          ) : (
            <div className="px-2 pt-4">
              <button
                type="button"
                onClick={expandSidebarAndFocusSearch}
                title="Search your menu"
                className="w-full flex items-center justify-center p-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low cursor-pointer transition-colors"
              >
                <Search size={18} />
              </button>
              <hr className="border-border-subtle my-2" />
            </div>
          )}

          <nav className={`py-4 space-y-4 ${isSidebarCollapsed ? 'px-2 pt-0' : 'px-3'}`}>
            {ungrouped.length > 0 && <div className="space-y-1">{ungrouped.map(renderItem)}</div>}
            {groups.map((group) => {
              const CategoryIcon = CATEGORY_ICONS[group.category]
              const isOpen = q ? true : openCategories.has(group.category)
              return (
                <div key={group.category} className="space-y-1">
                  {isSidebarCollapsed ? (
                    <>
                      <hr className="border-border-subtle my-2" />
                      <button
                        type="button"
                        onClick={() => toggleCategory(group.category)}
                        aria-expanded={isOpen}
                        title={group.category}
                        className={`w-full flex items-center justify-center p-2.5 rounded-lg cursor-pointer transition-colors ${
                          isOpen
                            ? 'border border-market-green-500/40 bg-market-green-50 text-market-green-600'
                            : 'border border-transparent text-on-surface-variant hover:bg-surface-container-low'
                        }`}
                      >
                        <CategoryIcon size={18} className="flex-shrink-0" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => toggleCategory(group.category)}
                      aria-expanded={isOpen}
                      className={`w-full flex items-center gap-2 px-3 py-2 mb-1 rounded-xl cursor-pointer transition-colors ${
                        isOpen
                          ? 'border border-market-green-500/40 bg-market-green-50'
                          : 'border border-transparent hover:bg-surface-container-low'
                      }`}
                    >
                      <CategoryIcon size={14} className={`flex-shrink-0 ${isOpen ? 'text-market-green-600' : 'text-on-surface-variant'}`} />
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wider truncate flex-1 text-left ${
                          isOpen ? 'text-market-green-600' : 'text-on-surface-variant'
                        }`}
                      >
                        {group.category}
                      </span>
                      <ChevronDown
                        size={14}
                        className={`flex-shrink-0 transition-transform duration-200 ${isOpen ? 'text-market-green-600' : 'text-on-surface-variant -rotate-90'}`}
                      />
                    </button>
                  )}
                  {isOpen && group.items.map(renderItem)}
                </div>
              )
            })}
            {noResults && !isSidebarCollapsed && (
              <p className="px-3 py-2 text-[11px] text-on-surface-variant italic">Tidak ada menu yang cocok.</p>
            )}
          </nav>
        </div>

        {/* Footer */}
        <div className="relative border-t border-border-subtle bg-white">
          {isProfileMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsProfileMenuOpen(false)} />
              <div
                className={`absolute bottom-full mb-2 z-50 bg-white rounded-xl shadow-lg border border-border-subtle overflow-hidden ${
                  isSidebarCollapsed ? 'left-full ml-2 w-56' : 'left-3 right-3'
                }`}
              >
                <div className="flex items-center gap-3 p-4 border-b border-border-subtle">
                  <img src="/images/Variant=Icon.webp" alt="" className="w-9 h-9 rounded-full object-cover shadow-xs shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate text-text-primary">{currentUser.name}</p>
                    <p className="text-[10px] text-on-surface-variant truncate">{currentUser.email}</p>
                  </div>
                </div>
                <Link
                  href="/"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-xs font-medium text-text-primary hover:bg-surface-container-low transition-colors"
                >
                  <AppWindow size={16} className="text-on-surface-variant" />
                  Frontpage
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-xs font-medium text-text-primary hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  <LogOut size={16} className="text-on-surface-variant" />
                  Logout
                </button>
              </div>
            </>
          )}

          <button
            type="button"
            onClick={() => setIsProfileMenuOpen((v) => !v)}
            className={`w-full p-4 flex items-center gap-3 hover:bg-surface-container-low transition-colors cursor-pointer ${
              isSidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <img src="/images/Variant=Icon.webp" alt="" className="w-8 h-8 rounded-full object-cover shadow-xs shrink-0" />
            {!isSidebarCollapsed && (
              <div className="min-w-0 text-left">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold truncate text-text-primary">{currentUser.name}</p>
                  <span className="text-[8px] font-bold uppercase tracking-wider bg-market-green-50 text-market-green-600 border border-market-green-500/20 px-1.5 py-px rounded-full shrink-0">
                    {currentUser.isSuperAdmin ? 'Super Admin' : 'Admin'}
                  </span>
                </div>
                <p className="text-[10px] text-on-surface-variant truncate">{currentUser.email}</p>
              </div>
            )}
          </button>
        </div>
      </aside>

      <main className="flex-grow flex flex-col overflow-hidden">
        <header className="h-[64px] border-b border-border-subtle bg-white px-6 flex items-center justify-between flex-shrink-0 z-10 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-surface-container-low lg:hidden text-on-surface-variant focus:outline-none cursor-pointer"
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
            <h2 className="font-sora text-sm md:text-base font-bold text-text-primary tracking-tight">{title}</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-market-green-50 px-3 py-1.5 rounded-full border border-market-green-500/20">
              <span className="w-2 h-2 rounded-full bg-market-green-500 animate-pulse" />
              <span className="text-[11px] font-semibold text-market-green-600 tracking-wider uppercase">
                System Status: Active
              </span>
            </div>
            <Link
              href="/"
              className="px-3.5 py-1.5 bg-white hover:bg-surface-container-low text-xs font-semibold text-on-surface-variant hover:text-text-primary rounded-lg transition-colors border border-border-subtle shadow-xs"
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
