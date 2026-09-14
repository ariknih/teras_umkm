'use client'

import { useMemo, useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'

type Props = {
  auditLogs: any[]
  /** 'semua' | 'member' | 'admin' — resolved from the URL tab by the page. */
  activeTab: string
}

type CategoryKey = 'semua' | 'cms' | 'feature'

const ACTOR_BY_TAB: Record<string, string> = { member: 'MEMBER', admin: 'ADMIN' }

/**
 * Actions logged by admin content-management screens (banner, pengumuman,
 * academy CMS, feature control). FEATURE_CONTROL_REJECTED is deliberately
 * absent: a rejected/tampered save is a security event, not a content change.
 */
const FRONTPAGE_CMS_ACTIONS = new Set([
  'FEATURE_DISABLED', 'FEATURE_ENABLED', 'FEATURE_REDIRECT_UPDATED', 'FEATURE_REDIRECT_BULK_REASSIGNED',
  'CREATE_BANNER', 'UPDATE_BANNER', 'DELETE_BANNER', 'TOGGLE_BANNER_ACTIVE',
  'CREATE_ANNOUNCEMENT', 'UPDATE_ANNOUNCEMENT', 'DELETE_ANNOUNCEMENT',
  'TOGGLE_PUBLISH_ANNOUNCEMENT', 'TOGGLE_PIN_ANNOUNCEMENT',
  'CREATE_COURSE', 'UPDATE_COURSE', 'DELETE_COURSE', 'SET_COURSE_PUBLISHED',
  'CREATE_LESSON', 'UPDATE_LESSON', 'DELETE_LESSON',
  'CREATE_CERTIFICATE_TEMPLATE', 'UPDATE_CERTIFICATE_TEMPLATE', 'DELETE_CERTIFICATE_TEMPLATE'
])

const CATEGORY_FILTERS: { key: CategoryKey; label: string }[] = [
  { key: 'semua', label: 'Semua' },
  { key: 'cms', label: 'Frontpage & CMS' },
  { key: 'feature', label: 'Feature' }
]

const MODULE_LABELS: Record<string, string> = {
  ACADEMY: 'Akademi / LMS',
  ADMINS: 'Admin & Hak Akses',
  AUTH: 'Autentikasi',
  COINS: 'Koin & Voucher',
  COMMUNITY: 'Komunitas',
  COOPERATIVE: 'Koperasi',
  DEBUG: 'Debug',
  FEATURE_CONTROL: 'Feature Control',
  JASA: 'Jasa & Layanan',
  KYC: 'KYC',
  MERCHANTS: 'Merchant',
  ORDERS: 'Pesanan',
  PRODUCTS: 'Produk',
  SERVICES: 'Layanan',
  SETTINGS: 'Pengaturan',
  USERS: 'User',
  WALLET: 'Wallet',
  WITHDRAWALS: 'Withdrawal'
}

const PAGE_SIZE_OPTIONS = [10, 50, 100] as const

/** Windowed page list: first, last, current±1, and '...' for gaps. */
function getPageList(current: number, total: number): (number | '...')[] {
  const pages = new Set([1, total, current - 1, current, current + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const result: (number | '...')[] = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push('...')
    result.push(p)
  })
  return result
}

/**
 * Read-only audit trail. The actor filter is resolved from the URL tab by
 * the page; category/feature filters and pagination are local UI state only.
 */
export default function AuditLogTab({ auditLogs, activeTab }: Props) {
  const [filterOpen, setFilterOpen] = useState(false)
  const [category, setCategory] = useState<CategoryKey>('semua')
  const [feature, setFeature] = useState('')
  const [draftCategory, setDraftCategory] = useState<CategoryKey>('semua')
  const [draftFeature, setDraftFeature] = useState('')
  const [pageSize, setPageSize] = useState<number>(10)
  const [page, setPage] = useState(1)

  const actorFilter = ACTOR_BY_TAB[activeTab]
  const availableModules = useMemo(
    () => [...new Set(auditLogs.map((l) => l.module))].sort(),
    [auditLogs]
  )

  const filtered = useMemo(() => {
    let result = actorFilter ? auditLogs.filter((l) => l.actor === actorFilter) : auditLogs
    if (category !== 'semua') {
      const wantCms = category === 'cms'
      result = result.filter((l) => FRONTPAGE_CMS_ACTIONS.has(l.action) === wantCms)
    }
    if (feature) result = result.filter((l) => l.module === feature)
    return result
  }, [auditLogs, actorFilter, category, feature])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const filterActive = category !== 'semua' || feature !== ''
  const draftFilled = draftCategory !== 'semua' || draftFeature !== ''

  function openFilter() {
    setDraftCategory(category)
    setDraftFeature(feature)
    setFilterOpen(true)
  }

  function applyFilter() {
    setCategory(draftCategory)
    setFeature(draftFeature)
    setPage(1)
    setFilterOpen(false)
  }

  function resetFilter() {
    setDraftCategory('semua')
    setDraftFeature('')
  }

  function changePageSize(size: number) {
    setPageSize(size)
    setPage(1)
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-white border border-neutral-shade-50 p-6 rounded-[var(--radius-brand)] shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-neutral-shade-50 pb-4">
          <div>
            <h3 className="font-sora text-sm font-bold text-market-green-600 uppercase tracking-wider">
              System Audit Log (Aktivitas Platform)
            </h3>
            <p className="text-xs text-neutral-shade-500 mt-1">
              Pelacakan jejak audit lengkap aktivitas pengguna dengan 2 filter aktor: <strong>Member</strong> dan <strong>Admin</strong>.
            </p>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => (filterOpen ? setFilterOpen(false) : openFilter())}
              className={`flex items-center gap-2 px-4 py-2 rounded-[var(--radius-brand)] text-xs font-bold border transition-colors ${
                filterActive
                  ? 'border-market-green-500 text-market-green-600 bg-market-green-50'
                  : 'border-neutral-shade-50 text-neutral-shade-700 bg-white hover:bg-neutral-shade-25'
              }`}
            >
              <SlidersHorizontal size={14} />
              Filter
            </button>

            {filterOpen && (
              <div className="absolute right-0 top-full mt-2 z-20 w-[400px] max-w-[calc(100vw-3rem)] border border-neutral-shade-50 rounded-[var(--radius-brand)] p-5 space-y-5 bg-white shadow-lg">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-neutral-shade-800">Kategori</label>
                  <select
                    value={draftCategory}
                    onChange={(e) => setDraftCategory(e.target.value as CategoryKey)}
                    className="w-full border border-neutral-shade-50 rounded-[var(--radius-brand)] px-3 py-2 text-xs text-neutral-shade-700 focus:outline-none focus:ring-1 focus:ring-market-green-500"
                  >
                    {CATEGORY_FILTERS.map((f) => (
                      <option key={f.key} value={f.key}>{f.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-neutral-shade-800">Fitur</label>
                  <select
                    value={draftFeature}
                    onChange={(e) => setDraftFeature(e.target.value)}
                    className="w-full border border-neutral-shade-50 rounded-[var(--radius-brand)] px-3 py-2 text-xs text-neutral-shade-700 focus:outline-none focus:ring-1 focus:ring-market-green-500"
                  >
                    <option value="">Semua fitur</option>
                    {availableModules.map((m) => (
                      <option key={m} value={m}>{MODULE_LABELS[m] || m}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-neutral-shade-50">
                  <button
                    type="button"
                    onClick={resetFilter}
                    disabled={!draftFilled}
                    className="text-xs font-bold text-neutral-shade-600 hover:text-neutral-shade-800 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-neutral-shade-600"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={applyFilter}
                    disabled={!draftFilled}
                    className="px-4 py-2 rounded-[var(--radius-brand)] text-xs font-bold bg-market-green-600 text-white hover:bg-market-green-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-market-green-600"
                  >
                    Terapkan
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-neutral-shade-25 border-b border-neutral-shade-50 text-neutral-shade-500 uppercase tracking-wider text-[10px] font-bold">
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">Aktor</th>
                <th className="px-4 py-3">Aksi</th>
                <th className="px-4 py-3">Modul</th>
                <th className="px-4 py-3">Detail</th>
                <th className="px-4 py-3">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-shade-50">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-neutral-shade-300 italic">
                    Belum ada catatan audit log yang tercatat.
                  </td>
                </tr>
              ) : (
                paged.map((log: any) => (
                  <tr key={log.id} className="hover:bg-neutral-shade-25 transition-colors">
                    <td className="px-4 py-3 text-neutral-shade-500 font-mono">
                      {new Date(log.createdAt).toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                          log.actor === 'ADMIN' ? 'bg-royal-purple-50 text-royal-purple-700 border-royal-purple-200' : 'bg-bank-blue-50 text-bank-blue-700 border-bank-blue-200'
                        }`}
                      >
                        {log.actor}
                      </span>
                      <span className="ml-2 font-semibold text-neutral-shade-800">{log.actorName || log.actorId}</span>
                    </td>
                    <td className="px-4 py-3 font-bold text-neutral-shade-800">{log.action}</td>
                    <td className="px-4 py-3 font-mono text-neutral-shade-600">{log.module}</td>
                    <td className="px-4 py-3 text-neutral-shade-600 max-w-xs truncate">{log.detail || log.targetId || '-'}</td>
                    <td className="px-4 py-3 font-mono text-neutral-shade-500">
                      {log.ipAddress && log.ipAddress !== '127.0.0.1' && !log.ipAddress.startsWith('::')
                        ? log.ipAddress
                        : <span className="text-neutral-shade-100 italic">tidak tercatat</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-neutral-shade-50 text-xs">
          <label className="flex items-center gap-2 text-neutral-shade-500">
            Tampilkan
            <select
              value={pageSize}
              onChange={(e) => changePageSize(Number(e.target.value))}
              className="border border-neutral-shade-50 rounded-[var(--radius-brand)] px-2 py-1 text-neutral-shade-700 font-semibold focus:outline-none focus:ring-1 focus:ring-market-green-500"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            entri
          </label>

          <div className="flex items-center gap-3">
            <span className="text-neutral-shade-500">
              Halaman {currentPage} dari {totalPages} ({filtered.length} entri)
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-2.5 py-1 rounded border border-neutral-shade-50 text-neutral-shade-600 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-shade-25"
              >
                ‹
              </button>
              {getPageList(currentPage, totalPages).map((p, i) =>
                p === '...' ? (
                  <span key={`ellipsis-${i}`} className="px-2 py-1 text-neutral-shade-300">…</span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`px-2.5 py-1 rounded border font-bold ${
                      p === currentPage
                        ? 'bg-market-green-600 text-white border-market-green-600'
                        : 'border-neutral-shade-50 text-neutral-shade-600 hover:bg-neutral-shade-25'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-2.5 py-1 rounded border border-neutral-shade-50 text-neutral-shade-600 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-shade-25"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
