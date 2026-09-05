import Link from 'next/link'
import { menuHref, type Menu } from '../nav.config'

/**
 * The one tab bar for the whole CMS.
 *
 * Replaces three inconsistent in-page treatments: pill buttons on Merchant
 * Approval, a separate sub-tab tray on Withdrawal, and plain `<select>`
 * dropdowns on Product Catalog and Transaction Tracking — all of which were
 * doing the same job with different markup, state and active colours.
 *
 * Renders <Link>s, so tabs are deep-linkable and the back button works.
 */
export default function AdminTabs({ menu, activeTab }: { menu: Menu; activeTab?: string }) {
  if (!menu.tabs?.length) return null

  return (
    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-fit mb-6 overflow-x-auto max-w-full">
      {menu.tabs.map((t) => {
        const isActive = t.key === activeTab
        return (
          <Link
            key={t.key}
            href={menuHref(menu.key, t.key)}
            aria-current={isActive ? 'page' : undefined}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
              isActive
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
          </Link>
        )
      })}
    </div>
  )
}
