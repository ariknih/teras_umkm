/**
 * Staff admin sub-roles (distinct from the superadmin flag). Purely a preset
 * + badge concept layered on top of the existing `adminPermissions` module
 * checklist — picking a type overwrites the checklist with its default
 * modules, but the checklist stays freely editable afterward. Modules not
 * granted here are fully hidden (sidebar + server actions), same as any
 * other unchecked module — there is no partial/view-only tier.
 */

export type AdminTypeKey = 'OPERASIONAL' | 'FINANCIAL' | 'AUDIT_TRANSAKSI'

export const ADMIN_TYPES: { key: AdminTypeKey; label: string }[] = [
  { key: 'OPERASIONAL', label: 'Admin Operasional' },
  { key: 'FINANCIAL', label: 'Admin Financial' },
  { key: 'AUDIT_TRANSAKSI', label: 'Admin Audit Transaksi' }
]

export const ADMIN_TYPE_KEYS = ADMIN_TYPES.map((t) => t.key)

export const DEFAULT_ADMIN_TYPE: AdminTypeKey = 'OPERASIONAL'

export const ADMIN_TYPE_DEFAULT_PERMISSIONS: Record<AdminTypeKey, string[]> = {
  OPERASIONAL: [
    'overview', 'users', 'merchants', 'products', 'services',
    'snackbox-kurasi', 'snackbox-order', 'snackbox-coverage', 'snackbox-payout',
    'communities', 'affiliates', 'academy', 'content', 'support'
  ],
  FINANCIAL: ['overview', 'transactions', 'withdrawals', 'coins', 'payment-methods', 'snackbox-payout'],
  AUDIT_TRANSAKSI: ['overview', 'audit', 'transactions']
}

export const ADMIN_TYPE_BADGE: Record<AdminTypeKey, { label: string; className: string }> = {
  OPERASIONAL: { label: 'Admin Operasional', className: 'bg-safe-green-50 text-safe-green-700 border-safe-green-200' },
  FINANCIAL: { label: 'Admin Financial', className: 'bg-bank-blue-50 text-bank-blue-700 border-bank-blue-200' },
  AUDIT_TRANSAKSI: { label: 'Admin Audit Transaksi', className: 'bg-cherry-red-50 text-cherry-red-700 border-cherry-red-200' }
}

export function isValidAdminType(value: unknown): value is AdminTypeKey {
  return typeof value === 'string' && (ADMIN_TYPE_KEYS as string[]).includes(value)
}

/**
 * Community finance (Kas Komunitas withdrawals, platform revenue ledger) is
 * gated by admin *type*, not by the module checklist: only a FINANCIAL staff
 * admin may act. The superadmin may view (oversight/audit) but never act —
 * separation of duties on money movement. Enforced server-side in
 * actions/community-finance.ts; the CMS only mirrors it.
 */
export const COMMUNITY_FINANCE_MENU_KEY = 'community-finance'

type AdminLike = { role?: string | null; isSuperAdmin?: boolean | null; adminType?: string | null } | null | undefined

export function canActCommunityFinance(user: AdminLike): boolean {
  return !!user && user.role === 'ADMIN' && user.isSuperAdmin !== true && user.adminType === 'FINANCIAL'
}

export function canViewCommunityFinance(user: AdminLike): boolean {
  return !!user && user.role === 'ADMIN' && (user.isSuperAdmin === true || user.adminType === 'FINANCIAL')
}
