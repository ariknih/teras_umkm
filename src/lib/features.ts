/**
 * Feature Control — public Saloka features an admin can take offline from
 * /cms_admin/features. Imported by the proxy, so this file must stay free of
 * imports (no Prisma, no Node APIs).
 *
 * Only public, front-side routes belong in FEATURES. CMS (/cms_admin), APIs
 * (/api), merchant back-office and account pages are deliberately absent —
 * features.test.ts fails if one of them ever becomes matchable.
 *
 * Every feature is toggleable, but at least one must stay ON so a placeholder
 * button always has a live destination. validateConfig enforces that for
 * admin saves; parseFeatureControl fails open if a stored row breaks it.
 */

export type Feature = {
  key: string
  label: string
  /** Where a placeholder CTA pointing at this feature sends people. */
  href: string
  /** The feature's own route plus every nested route under it. */
  prefixes: string[]
}

export type FeatureEntry = { cta: string; target: string }

/** Disabled features only: a key present here is OFF, an absent key is ON. */
export type FeatureControl = Record<string, FeatureEntry>

export const FEATURE_CONTROL_KEY = 'feature_control'
export const CTA_MAX = 40
export const MIN_ACTIVE_ERROR = 'Minimal satu fitur harus tetap aktif.'

export const FEATURES: Feature[] = [
  // '/' matches only the landing page itself (never '//…'). Merchant
  // subdomain roots also have pathname '/'; the proxy carves those out.
  { key: 'home', label: 'Beranda', href: '/', prefixes: ['/'] },
  { key: 'market', label: 'Market', href: '/market', prefixes: ['/market', '/cart', '/store'] },
  { key: 'jasa', label: 'Jasa', href: '/jasa', prefixes: ['/jasa'] },
  { key: 'snackbox', label: 'Snackbox', href: '/snackbox', prefixes: ['/snackbox'] },
  { key: 'academy', label: 'Akademi', href: '/academy', prefixes: ['/academy', '/certificate'] },
  { key: 'community', label: 'Komunitas', href: '/community', prefixes: ['/community'] },
  { key: 'affiliate', label: 'Affiliate', href: '/affiliate', prefixes: ['/affiliate', '/ref'] },
  { key: 'voucher', label: 'Voucher', href: '/voucher', prefixes: ['/voucher'] },
  { key: 'orders', label: 'Pesanan', href: '/orders', prefixes: ['/orders'] }
]

// `find` rather than a keyed object: a key like "__proto__" from a request
// body must resolve to nothing, not to Object.prototype.
export function findFeature(key: string): Feature | undefined {
  return FEATURES.find((f) => f.key === key)
}

export function matchFeature(pathname: string): Feature | null {
  return FEATURES.find((f) => f.prefixes.some((p) => pathname === p || pathname.startsWith(p + '/'))) ?? null
}

/** Features currently ON, in catalog order (Beranda first when it's on). */
export function activeFeatures(config: FeatureControl, exclude: string[] = []): Feature[] {
  return FEATURES.filter((f) => !config[f.key] && !exclude.includes(f.key))
}

/**
 * Placeholder button for a feature about to be switched off: points at the
 * first other feature still ON. Null when `key` is the last one ON.
 */
export function defaultEntryFor(config: FeatureControl, key: string): FeatureEntry | null {
  const target = activeFeatures(config, [key])[0]
  if (!target) return null
  return { cta: target.key === 'home' ? 'Kembali ke Beranda' : `Jelajahi ${target.label}`, target: target.key }
}

/** Disabled features whose placeholder button currently points at `key`. */
export function dependentsOf(config: FeatureControl, key: string): string[] {
  return Object.keys(config).filter((k) => config[k].target === key)
}

/**
 * Strict check for a config submitted by an admin. The CMS UI is only UX —
 * this is the guard, so it re-derives every invariant itself.
 */
export function validateConfig(
  input: unknown
): { ok: true; config: FeatureControl } | { ok: false; error: string } {
  const fail = (error: string) => ({ ok: false as const, error })
  if (!input || typeof input !== 'object' || Array.isArray(input)) return fail('Format konfigurasi tidak valid.')

  // Order matters for the message the admin sees: shape first, then the
  // "one feature stays ON" rule (it explains an all-off save better than
  // whichever target check would trip first), then the targets.
  const config: FeatureControl = {}
  for (const [key, raw] of Object.entries(input)) {
    const feature = findFeature(key)
    if (!feature) return fail(`Fitur "${key}" tidak dikenal.`)
    if (!raw || typeof raw !== 'object') return fail(`Konfigurasi ${feature.label} tidak valid.`)
    const { cta, target } = raw as Record<string, unknown>
    if (typeof cta !== 'string' || !cta.trim() || cta.trim().length > CTA_MAX) {
      return fail(`Teks tombol ${feature.label} wajib 1–${CTA_MAX} karakter.`)
    }
    if (typeof target !== 'string') return fail(`Tujuan tombol ${feature.label} tidak valid.`)
    config[key] = { cta: cta.trim(), target }
  }

  if (activeFeatures(config).length === 0) return fail(MIN_ACTIVE_ERROR)

  for (const [key, entry] of Object.entries(config)) {
    const label = findFeature(key)!.label
    const target = findFeature(entry.target)
    if (!target) return fail(`Tujuan tombol ${label} tidak valid.`)
    if (entry.target === key) return fail(`Tombol ${label} tidak boleh mengarah ke fiturnya sendiri.`)
    if (entry.target in config) return fail(`Tujuan tombol ${label} (${target.label}) sedang nonaktif.`)
  }
  return { ok: true, config }
}

/**
 * Lenient read of the stored row. Fail-open: anything unparseable — or a row
 * that would switch every feature off — means "everything ON". A stale key
 * or dead target (feature removed from code, row edited by hand) degrades
 * per entry instead of wiping the whole config.
 */
export function parseFeatureControl(raw: string | null | undefined): FeatureControl {
  let parsed: unknown
  try {
    parsed = raw ? JSON.parse(raw) : null
  } catch {
    return {}
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}

  const out: FeatureControl = {}
  for (const [key, entry] of Object.entries(parsed as Record<string, any>)) {
    if (!findFeature(key) || !entry || typeof entry.cta !== 'string' || typeof entry.target !== 'string') continue
    out[key] = { cta: entry.cta, target: entry.target }
  }

  const fallback = activeFeatures(out)[0]
  if (!fallback) return {}
  for (const [key, entry] of Object.entries(out)) {
    if (!findFeature(entry.target) || entry.target in out) out[key] = { ...entry, target: fallback.key }
  }
  return out
}

export type FeatureChange = {
  key: string
  change: 'DISABLED' | 'ENABLED' | 'REDIRECT_UPDATED'
  before: FeatureEntry | null
  after: FeatureEntry | null
}

/** Per-feature changes between two configs, in catalog order. Feeds the audit log. */
export function diffConfig(before: FeatureControl, after: FeatureControl): FeatureChange[] {
  return FEATURES.flatMap(({ key }): FeatureChange[] => {
    const b = before[key] ?? null
    const a = after[key] ?? null
    if (!b && a) return [{ key, change: 'DISABLED', before: b, after: a }]
    if (b && !a) return [{ key, change: 'ENABLED', before: b, after: a }]
    if (b && a && (b.cta !== a.cta || b.target !== a.target)) return [{ key, change: 'REDIRECT_UPDATED', before: b, after: a }]
    return []
  })
}
