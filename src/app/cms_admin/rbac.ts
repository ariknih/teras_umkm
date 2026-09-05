import { cache } from 'react'
import { getCurrentUser } from '@/app/actions/auth'
import { DataStore } from '@/lib/data-store'
import { MENUS, menuByKey, type Menu } from './nav.config'

/**
 * Access control for the admin CMS.
 *
 * Deny-by-default. The previous client-side gate granted full access to any
 * account whose email merely contained the substring "admin", and treated a
 * missing/empty `adminPermissions` as "allow everything" — so restricting a
 * staff admin was effectively impossible.
 */

/**
 * Permission keys stored in the DB predate the sidebar restructure. Map the
 * old keys onto the new menu keys so existing grants keep working without a
 * data migration.
 */
const LEGACY_KEY_MAP: Record<string, string[]> = {
  approvals: ['merchants', 'snackbox-kurasi'],
  kelurahan: ['snackbox-coverage'],
  withdrawals: ['withdrawals', 'snackbox-payout'],
  transactions: ['transactions', 'snackbox-order'],
  community: ['communities'],
  audit_logs: ['audit'],
  landing_banners: ['content'],
  payment_methods: ['payment-methods'],
  // `certificates` is now a tab inside `users` rather than a menu of its own.
  certificates: ['users']
}

function expandKeys(raw: string[]): Set<string> {
  const out = new Set<string>()
  for (const key of raw) {
    if (menuByKey[key]) out.add(key)
    for (const mapped of LEGACY_KEY_MAP[key] ?? []) out.add(mapped)
  }
  return out
}

function parsePermissions(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string')
  if (typeof value !== 'string' || !value.trim()) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
  } catch {
    return []
  }
}

export type AdminSession = {
  user: any
  isSuperAdmin: boolean
  allowedKeys: Set<string>
}

/**
 * Resolve the caller's admin session, or null if they are not an admin.
 * Permissions are read from the database rather than the JWT so that a
 * revoked grant takes effect immediately.
 *
 * The root layout and every menu page each call this once per request (the
 * layout to build the sidebar, the page to enforce per-menu access on deep
 * links) — `cache()` collapses that back down to a single JWT verify + DB
 * lookup per request instead of two.
 */
export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') return null

  const dbUser: any = (await DataStore.findUserById(user.id)) ?? user
  const rawPermissions = parsePermissions(dbUser.adminPermissions)

  // `isSuperAdmin` is nullable on existing rows (it predates the column's
  // default), and a null there must not be read as "demoted" — doing so locks
  // a genuine superadmin out of everything but Overview. Only an explicit
  // `false`, or a row that carries its own permission grants, is a restriction.
  //
  // Note this deliberately does NOT fall back to the session's isSuperAdmin:
  // getCurrentUser() sets that to true for any email merely containing
  // "admin", which is the privilege escalation this module exists to close.
  const isSuperAdmin =
    dbUser.isSuperAdmin === true ||
    (dbUser.isSuperAdmin == null && rawPermissions.length === 0)

  if (isSuperAdmin) {
    return { user: dbUser, isSuperAdmin: true, allowedKeys: new Set(MENUS.map((m) => m.key)) }
  }

  const allowedKeys = expandKeys(rawPermissions)
  // Overview carries no sensitive data and keeps a granted admin from landing
  // on an empty shell.
  allowedKeys.add('overview')

  return { user: dbUser, isSuperAdmin: false, allowedKeys }
})

export function visibleMenus(session: AdminSession): Menu[] {
  if (session.isSuperAdmin) return MENUS
  return MENUS.filter((m) => session.allowedKeys.has(m.key))
}

export function canAccess(session: AdminSession, menuKey: string): boolean {
  return session.isSuperAdmin || session.allowedKeys.has(menuKey)
}
