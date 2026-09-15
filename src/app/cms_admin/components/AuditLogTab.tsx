'use client'

import { useMemo, useState } from 'react'
import { FilterPopover, TableCard, TablePagination, usePagination, type FilterField, type FilterValues } from './TableControls'

type Props = {
  auditLogs: any[]
  /** 'semua' | 'member' | 'admin' — resolved from the URL tab by the page. */
  activeTab: string
}

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

/**
 * Read-only audit trail. The actor filter is resolved from the URL tab by
 * the page; category/feature filters and pagination are local UI state only.
 */
export default function AuditLogTab({ auditLogs, activeTab }: Props) {
  const [filters, setFilters] = useState<FilterValues>({})
  const actorFilter = ACTOR_BY_TAB[activeTab]

  const fields: FilterField[] = useMemo(
    () => [
      {
        key: 'category',
        label: 'Kategori',
        allLabel: 'Semua',
        options: [
          { value: 'cms', label: 'Frontpage & CMS' },
          { value: 'feature', label: 'Feature' }
        ]
      },
      {
        key: 'module',
        label: 'Fitur',
        allLabel: 'Semua fitur',
        options: [...new Set(auditLogs.map((l) => l.module))].sort().map((m) => ({ value: m, label: MODULE_LABELS[m] || m }))
      }
    ],
    [auditLogs]
  )

  const filtered = useMemo(() => {
    let result = actorFilter ? auditLogs.filter((l) => l.actor === actorFilter) : auditLogs
    if (filters.category) {
      const wantCms = filters.category === 'cms'
      result = result.filter((l) => FRONTPAGE_CMS_ACTIONS.has(l.action) === wantCms)
    }
    if (filters.module) result = result.filter((l) => l.module === filters.module)
    return result
  }, [auditLogs, actorFilter, filters])

  const { paged, resetPage, footer } = usePagination(filtered)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <TableCard
        title="System Audit Log (Aktivitas Platform)"
        description={<>Pelacakan jejak audit lengkap aktivitas pengguna dengan 2 filter aktor: <strong>Member</strong> dan <strong>Admin</strong>.</>}
        actions={
          <FilterPopover
            fields={fields}
            value={filters}
            onApply={(next) => {
              setFilters(next)
              resetPage()
            }}
          />
        }
      >
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

        <TablePagination {...footer} />
      </TableCard>
    </div>
  )
}
