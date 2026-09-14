/**
 * Organization settings managed from the ORGANIZATION category in /cms_admin:
 * footer socials, the support contact, and the Kebijakan Privasi / Syarat &
 * Ketentuan documents. Import-free like lib/features.ts, so the CMS client,
 * server actions, public pages and organization.test.ts share one rule set.
 *
 * validate*() is the strict guard for admin input (the CMS UI is only UX);
 * parse*() is the lenient read of a stored SystemSetting row and never throws.
 */

export const SOCIALS_KEY = 'org_socials'
export const CONTACT_KEY = 'org_contact'
/** lib/cache keys for the public reads. Every write action busts the one it touches. */
export const ORG_PUBLIC_CACHE_KEY = 'org:public'
export const legalCacheKey = (slug: LegalSlug) => `org:legal:${slug}`
export const URL_MAX = 500

const fail = (error: string) => ({ ok: false as const, error })

// ─── Socials ────────────────────────────────────────────────────────────────

export type SocialPlatform = { key: string; label: string; hosts: string[]; fallback: string }
export type SocialEntry = { url: string; active: boolean }
export type Socials = Record<string, SocialEntry>

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  { key: 'instagram', label: 'Instagram', hosts: ['instagram.com'], fallback: 'https://instagram.com/saloka.id' },
  { key: 'tiktok', label: 'TikTok', hosts: ['tiktok.com'], fallback: 'https://tiktok.com/@saloka.id' },
  { key: 'youtube', label: 'YouTube', hosts: ['youtube.com', 'youtu.be'], fallback: 'https://youtube.com/@saloka.id' },
  { key: 'facebook', label: 'Facebook', hosts: ['facebook.com', 'fb.com'], fallback: 'https://facebook.com/saloka.id' }
]

// `find` rather than a keyed object: a key like "__proto__" from a request
// body must resolve to nothing, not to Object.prototype.
export function findPlatform(key: string): SocialPlatform | undefined {
  return SOCIAL_PLATFORMS.find((p) => p.key === key)
}

/** Adds https:// to a bare host ("instagram.com/saloka.id"). Leaves schemes, "/path" and "#anchor" alone. */
export function withScheme(url: string): string {
  const u = url.trim()
  return u && !/^([a-z][a-z0-9+.-]*:|\/|#)/i.test(u) ? `https://${u}` : u
}

/** Null when `url` is an https link on one of the platform's own hosts. */
export function socialUrlError(platform: SocialPlatform, url: string): string | null {
  if (url.length > URL_MAX) return `URL ${platform.label} maksimal ${URL_MAX} karakter.`
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return `URL ${platform.label} tidak valid.`
  }
  const host = parsed.hostname
  const onPlatform = platform.hosts.some((h) => host === h || host === `www.${h}` || host === `m.${h}`)
  if (parsed.protocol !== 'https:' || !onPlatform || parsed.username || parsed.password) {
    return `URL ${platform.label} harus diawali https:// dan mengarah ke ${platform.hosts.join(' atau ')}.`
  }
  return null
}

/** Pre-CMS footer: every platform shown with its original link. */
export function defaultSocials(): Socials {
  return Object.fromEntries(SOCIAL_PLATFORMS.map((p) => [p.key, { url: p.fallback, active: true }]))
}

export function validateSocials(input: unknown): { ok: true; socials: Socials } | { ok: false; error: string } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return fail('Format data sosial media tidak valid.')
  const socials: Socials = {}
  for (const [key, raw] of Object.entries(input)) {
    const platform = findPlatform(key)
    if (!platform) return fail(`Platform "${key.slice(0, 30)}" tidak dikenal.`)
    const { url, active } = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
    if (typeof url !== 'string' || typeof active !== 'boolean') return fail(`Data ${platform.label} tidak valid.`)
    const trimmed = url.trim()
    if (trimmed) {
      const error = socialUrlError(platform, trimmed)
      if (error) return fail(error)
    } else if (active) {
      return fail(`URL ${platform.label} wajib diisi dan valid sebelum diaktifkan.`)
    }
    socials[key] = { url: trimmed, active }
  }
  const missing = SOCIAL_PLATFORMS.find((p) => !socials[p.key])
  if (missing) return fail(`Data ${missing.label} wajib dikirim.`)
  return { ok: true, socials }
}

/**
 * Fail-open: no row or unparseable JSON means the pre-CMS footer. A single
 * broken entry hides only that platform, so a bad row never renders a bad link.
 */
export function parseSocials(raw: string | null | undefined): Socials {
  let parsed: any
  try {
    parsed = raw ? JSON.parse(raw) : null
  } catch {
    return defaultSocials()
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return defaultSocials()
  return Object.fromEntries(
    SOCIAL_PLATFORMS.map((p) => {
      const entry = parsed[p.key]
      const url = typeof entry?.url === 'string' ? entry.url.trim() : ''
      const valid = !!url && !socialUrlError(p, url)
      return [p.key, { url: valid ? url : '', active: valid && entry.active === true }]
    })
  )
}

export type SocialChange = {
  key: string
  change: 'ENABLED' | 'DISABLED' | 'URL_UPDATED'
  before: SocialEntry
  after: SocialEntry
}

/** Per-platform changes between two complete configs, in catalog order. Feeds the audit log. */
export function diffSocials(before: Socials, after: Socials): SocialChange[] {
  return SOCIAL_PLATFORMS.flatMap(({ key }) => {
    const b = before[key]
    const a = after[key]
    const changes: SocialChange[] = []
    if (b.active !== a.active) changes.push({ key, change: a.active ? 'ENABLED' : 'DISABLED', before: b, after: a })
    if (b.url !== a.url) changes.push({ key, change: 'URL_UPDATED', before: b, after: a })
    return changes
  })
}

// ─── Contact Support ────────────────────────────────────────────────────────

export type Contact = { email: string; phone: string }
export const DEFAULT_SUPPORT_EMAIL = 'support@saloka.id'
const EMAIL_MAX = 254
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/

export function emailError(email: string): string | null {
  if (!email) return 'Email wajib diisi.'
  if (email.length > EMAIL_MAX || !EMAIL_RE.test(email)) return 'Format email tidak valid (contoh: support@saloka.id).'
  return null
}

/** Strips the separators people type: spaces, dashes, dots, parentheses. */
export function cleanPhone(phone: string): string {
  return phone.replace(/[\s\-.()]/g, '')
}

/**
 * Expects a cleanPhone() result. Accepts 08…, 62… and E.164 (+62…, +65…).
 * The number is linked to WhatsApp, so Indonesian numbers must be mobile
 * (08… / +628…): a landline has no WhatsApp account and the chat link would
 * open nowhere.
 */
export function phoneError(phone: string): string | null {
  if (!phone) return 'Nomor WhatsApp wajib diisi.'
  if (/^\+?620/.test(phone)) return 'Hapus angka 0 setelah 62 (contoh: +62812…).'
  if (phone.startsWith('00')) return 'Gunakan awalan +, bukan 00 (contoh: +62812…).'
  if (!/^0\d{8,13}$/.test(phone) && !/^62\d{8,13}$/.test(phone) && !/^\+[1-9]\d{7,14}$/.test(phone)) {
    return 'Nomor tidak valid. Gunakan format 08xx atau +62xx.'
  }
  if (/^(0|\+?62)[^8]/.test(phone)) return 'Gunakan nomor seluler yang terdaftar di WhatsApp (08xx / +628xx).'
  return null
}

/** wa.me chat link. wa.me expects the international number as digits only (08… → 628…). */
export function toWhatsAppHref(phone: string): string {
  const p = cleanPhone(phone).replace(/^\+/, '')
  return `https://wa.me/${p.startsWith('0') ? `62${p.slice(1)}` : p}`
}

export function validateContact(input: unknown): { ok: true; contact: Contact } | { ok: false; error: string } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return fail('Format data kontak tidak valid.')
  const { email, phone } = input as Record<string, unknown>
  if (typeof email !== 'string' || typeof phone !== 'string') return fail('Format data kontak tidak valid.')
  const contact = { email: email.trim().toLowerCase(), phone: cleanPhone(phone) }
  const error = emailError(contact.email) ?? phoneError(contact.phone)
  if (error) return fail(error)
  if (contact.phone.startsWith('62')) contact.phone = `+${contact.phone}`
  return { ok: true, contact }
}

/** No row means the default email and no phone. An invalid field reads as empty, so it's hidden rather than linked. */
export function parseContact(raw: string | null | undefined): Contact {
  let parsed: any
  try {
    parsed = raw ? JSON.parse(raw) : null
  } catch {
    parsed = null
  }
  if (!parsed || typeof parsed !== 'object') return { email: DEFAULT_SUPPORT_EMAIL, phone: '' }
  const email = typeof parsed.email === 'string' ? parsed.email : ''
  const phone = typeof parsed.phone === 'string' ? parsed.phone : ''
  return { email: emailError(email) ? '' : email, phone: phoneError(phone) ? '' : phone }
}

// ─── Legal documents ────────────────────────────────────────────────────────

export type LegalSlug = 'privacy' | 'terms'

export const LEGAL_DOCS: Record<LegalSlug, { key: string; menu: string; label: string; path: string }> = {
  privacy: { key: 'legal_privacy', menu: 'org-privacy', label: 'Kebijakan Privasi', path: '/privacy' },
  terms: { key: 'legal_terms', menu: 'org-terms', label: 'Syarat & Ketentuan', path: '/terms' }
}

export function isLegalSlug(value: unknown): value is LegalSlug {
  return value === 'privacy' || value === 'terms'
}

/** The Tiptap/ProseMirror JSON subset the editor can produce. */
export type DocMark = { type: 'bold' } | { type: 'italic' } | { type: 'link'; attrs: { href: string } }
export type DocNode = {
  type: string
  attrs?: { level?: number; start?: number }
  content?: DocNode[]
  text?: string
  marks?: DocMark[]
}

/** Draft and published copies share one row, so one version guards both. */
export type LegalState = {
  draft: DocNode | null
  draftSavedAt: string | null
  draftSavedBy: string | null
  published: DocNode | null
  publishedAt: string | null
  publishedBy: string | null
}

export const EMPTY_LEGAL: LegalState = {
  draft: null,
  draftSavedAt: null,
  draftSavedBy: null,
  published: null,
  publishedAt: null,
  publishedBy: null
}

export const LEGAL_MAX_CHARS = 300_000
const LEGAL_MAX_DEPTH = 20
const BLOCKS = ['paragraph', 'heading', 'bulletList', 'orderedList']
const INLINES = ['text', 'hardBreak']
const CHILDREN: Record<string, string[]> = {
  doc: BLOCKS,
  paragraph: INLINES,
  heading: INLINES,
  bulletList: ['listItem'],
  orderedList: ['listItem'],
  listItem: BLOCKS
}
const NEEDS_CHILD = ['doc', 'bulletList', 'orderedList', 'listItem']

/** Null when `href` is safe to link: https/http/mailto/tel, a site path ("/…") or an anchor ("#…"). */
export function linkHrefError(href: string): string | null {
  if (!href || href.length > URL_MAX) return `Tautan wajib diisi (maks ${URL_MAX} karakter).`
  if (/[ - \\]/.test(href)) return 'Tautan tidak boleh berisi spasi atau karakter khusus.'
  if (href.startsWith('#')) return null
  if (href.startsWith('/')) return href.startsWith('//') ? 'Tautan tidak valid.' : null
  try {
    return ['https:', 'http:', 'mailto:', 'tel:'].includes(new URL(href).protocol)
      ? null
      : 'Tautan harus diawali https://, mailto:, tel: atau /.'
  } catch {
    return 'Tautan tidak valid.'
  }
}

class DocError extends Error {}

function cleanMarks(marks: unknown): DocMark[] {
  if (marks === undefined) return []
  if (!Array.isArray(marks)) throw new DocError('Format dokumen tidak valid.')
  const out: DocMark[] = []
  for (const mark of marks) {
    const type = mark?.type
    if (out.some((m) => m.type === type)) continue
    if (type === 'bold' || type === 'italic') {
      out.push({ type })
    } else if (type === 'link') {
      const href = typeof mark.attrs?.href === 'string' ? mark.attrs.href.trim() : ''
      const error = linkHrefError(href)
      if (error) throw new DocError(`${error} ("${href.slice(0, 60)}")`)
      out.push({ type, attrs: { href } })
    } else {
      throw new DocError(`Format "${String(type).slice(0, 30)}" tidak didukung.`)
    }
  }
  return out
}

/** Rebuilds a node from the allowlist, dropping every attribute the renderer doesn't use. */
function cleanNode(raw: unknown, allowed: string[], depth: number): DocNode {
  if (depth > LEGAL_MAX_DEPTH) throw new DocError('Struktur dokumen terlalu dalam.')
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new DocError('Format dokumen tidak valid.')
  const { type, attrs, content, text, marks } = raw as Record<string, any>
  if (typeof type !== 'string' || !allowed.includes(type)) {
    throw new DocError(`Elemen "${String(type).slice(0, 30)}" tidak didukung di posisi ini.`)
  }

  if (type === 'text') {
    // ProseMirror rejects empty text nodes, so a stored one would crash the editor.
    if (typeof text !== 'string' || !text) throw new DocError('Format teks tidak valid.')
    const node: DocNode = { type, text }
    const cleaned = cleanMarks(marks)
    if (cleaned.length) node.marks = cleaned
    return node
  }
  if (type === 'hardBreak') return { type }

  const node: DocNode = { type }
  if (type === 'heading') {
    if (attrs?.level !== 1 && attrs?.level !== 2 && attrs?.level !== 3) throw new DocError('Level judul harus H1–H3.')
    node.attrs = { level: attrs.level }
  }
  if (type === 'orderedList') {
    const start = attrs?.start ?? 1
    if (!Number.isInteger(start) || start < 1 || start > 10_000) throw new DocError('Nomor awal daftar tidak valid.')
    node.attrs = { start }
  }

  if (content !== undefined && !Array.isArray(content)) throw new DocError('Format dokumen tidak valid.')
  const children = (content ?? []).map((child: unknown) => cleanNode(child, CHILDREN[type], depth + 1))
  if (NEEDS_CHILD.includes(type) && !children.length) throw new DocError('Dokumen, daftar, dan butir daftar tidak boleh kosong.')
  if (type === 'listItem' && children[0].type !== 'paragraph') throw new DocError('Butir daftar harus diawali paragraf.')
  if (children.length) node.content = children
  return node
}

export function validateLegalDoc(input: unknown): { ok: true; doc: DocNode } | { ok: false; error: string } {
  let size: number
  try {
    size = JSON.stringify(input)?.length ?? 0
  } catch {
    return fail('Format dokumen tidak valid.')
  }
  if (size > LEGAL_MAX_CHARS) return fail('Dokumen terlalu besar (maks ±300 KB).')
  try {
    return { ok: true, doc: cleanNode(input, ['doc'], 0) }
  } catch (e) {
    return fail(e instanceof DocError ? e.message : 'Format dokumen tidak valid.')
  }
}

function docText(node: DocNode): string {
  return node.text ?? (node.content ?? []).map(docText).join(' ')
}

export function isDocEmpty(doc: DocNode): boolean {
  return !docText(doc).trim()
}

/** Both sides must be validateLegalDoc output, so key order is identical. */
export function sameDoc(a: DocNode, b: DocNode): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

export function parseLegal(raw: string | null | undefined): LegalState {
  let parsed: any
  try {
    parsed = raw ? JSON.parse(raw) : null
  } catch {
    return { ...EMPTY_LEGAL }
  }
  if (!parsed || typeof parsed !== 'object') return { ...EMPTY_LEGAL }
  const doc = (d: unknown) => {
    if (d == null) return null
    const result = validateLegalDoc(d)
    return result.ok ? result.doc : null
  }
  const iso = (s: unknown) => (typeof s === 'string' && !Number.isNaN(Date.parse(s)) ? s : null)
  const str = (s: unknown) => (typeof s === 'string' ? s : null)
  const draft = doc(parsed.draft)
  const published = doc(parsed.published)
  return {
    draft,
    draftSavedAt: draft ? iso(parsed.draftSavedAt) : null,
    draftSavedBy: draft ? str(parsed.draftSavedBy) : null,
    published,
    publishedAt: published ? iso(parsed.publishedAt) : null,
    publishedBy: published ? str(parsed.publishedBy) : null
  }
}

const WIB = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'Asia/Jakarta',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  day: '2-digit',
  month: 'long',
  year: 'numeric'
})

/** "14:30 WIB - 12 Agustus 2026". Always Asia/Jakarta, whatever the server's or viewer's timezone. */
export function formatLegalTimestamp(date: Date | string): string {
  const parts = Object.fromEntries(WIB.formatToParts(new Date(date)).map((p) => [p.type, p.value]))
  return `${parts.hour}:${parts.minute} WIB - ${parts.day} ${parts.month} ${parts.year}`
}
