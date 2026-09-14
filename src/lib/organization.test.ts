/**
 * Self-check for Organization settings rules (socials, contact, legal docs).
 * Run with:  npx tsx src/lib/organization.test.ts
 */
import assert from 'node:assert/strict'
import {
  SOCIAL_PLATFORMS,
  validateSocials,
  parseSocials,
  diffSocials,
  defaultSocials,
  withScheme,
  validateContact,
  parseContact,
  toWhatsAppHref,
  DEFAULT_SUPPORT_EMAIL,
  validateLegalDoc,
  parseLegal,
  isDocEmpty,
  sameDoc,
  linkHrefError,
  formatLegalTimestamp,
  EMPTY_LEGAL
} from './organization'
import { LEGACY_LEGAL } from './legal-legacy'

// ─── Socials ────────────────────────────────────────────────────────────────
const socials = (over: Record<string, unknown> = {}) => ({ ...defaultSocials(), ...over })
const ok = (input: unknown) => validateSocials(input).ok

assert.equal(ok(socials()), true)
assert.equal(ok(socials({ instagram: { url: '', active: false } })), true, 'empty URL is fine while hidden')
assert.equal(ok(socials({ instagram: { url: '', active: true } })), false, 'active needs a URL')
assert.equal(ok(socials({ instagram: { url: 'https://www.instagram.com/saloka.id', active: true } })), true)
assert.equal(ok(socials({ instagram: { url: 'https://tiktok.com/@saloka.id', active: true } })), false, 'wrong platform')
assert.equal(ok(socials({ instagram: { url: 'https://instagram.com.evil.io/x', active: true } })), false, 'look-alike host')
assert.equal(ok(socials({ instagram: { url: 'http://instagram.com/x', active: true } })), false, 'https only')
assert.equal(ok(socials({ instagram: { url: 'javascript:alert(1)', active: false } })), false, 'bad URL even while hidden')
assert.equal(ok(socials({ youtube: { url: 'https://youtu.be/abc', active: true } })), true)
assert.equal(ok(socials({ twitter: { url: '', active: false } })), false, 'unknown platform')
assert.equal(ok({ ...JSON.parse('{"__proto__":{"url":"","active":false}}'), ...defaultSocials() }), false)
assert.equal(ok({ instagram: { url: '', active: false } }), false, 'every platform must be sent')
assert.equal(ok(socials({ instagram: { url: 'https://instagram.com/x', active: 'yes' } })), false)
assert.equal(withScheme(' instagram.com/saloka.id '), 'https://instagram.com/saloka.id')
assert.equal(withScheme('javascript:alert(1)'), 'javascript:alert(1)')
assert.equal(withScheme('/terms'), '/terms')

assert.deepEqual(parseSocials(null), defaultSocials())
assert.deepEqual(parseSocials('{broken'), defaultSocials())
const partlyBroken = parseSocials(JSON.stringify(socials({ tiktok: { url: 'https://evil.example', active: true } })))
assert.deepEqual(partlyBroken.tiktok, { url: '', active: false }, 'a broken entry is hidden')
assert.equal(partlyBroken.instagram.active, true, 'other platforms unaffected')

const hidden = socials({ facebook: { url: 'https://fb.com/saloka', active: false } })
assert.deepEqual(
  diffSocials(defaultSocials(), hidden as any).map((c) => `${c.key}:${c.change}`),
  ['facebook:DISABLED', 'facebook:URL_UPDATED']
)
assert.equal(SOCIAL_PLATFORMS.length, 4)

// ─── Contact ────────────────────────────────────────────────────────────────
const phone = (p: string) => {
  const r = validateContact({ email: 'support@saloka.id', phone: p })
  return r.ok ? r.contact.phone : null
}
assert.equal(phone('081234567890'), '081234567890')
assert.equal(phone('0812-3456-7890'), '081234567890')
assert.equal(phone('+62 812 3456 7890'), '+6281234567890')
assert.equal(phone('6281234567890'), '+6281234567890', '62… is normalized to +62…')
assert.equal(phone('+6591234567'), '+6591234567', 'other country codes')
// Landlines (021…, +6221…) have no WhatsApp, so they're rejected along with malformed input.
for (const bad of ['(021) 555 1234', '+62215551234', '+62081234567890', '62081234567890', '0062812345678', '0812', 'abc', '+62 812 ab 34', '']) {
  assert.equal(phone(bad), null, `phone "${bad}" must be rejected`)
}

const email = (e: string) => {
  const r = validateContact({ email: e, phone: '081234567890' })
  return r.ok ? r.contact.email : null
}
assert.equal(email(' Support@Saloka.ID '), 'support@saloka.id')
for (const bad of ['a@b', 'a@@b.com', 'a b@c.com', 'a@b..com', 'no-at.com', '']) {
  assert.equal(email(bad), null, `email "${bad}" must be rejected`)
}
assert.equal(validateContact({ email: 'a@b.com' }).ok, false)

assert.equal(toWhatsAppHref('0812-3456-7890'), 'https://wa.me/6281234567890')
assert.equal(toWhatsAppHref('+6281234567890'), 'https://wa.me/6281234567890')
assert.equal(toWhatsAppHref('+6591234567'), 'https://wa.me/6591234567')
assert.deepEqual(parseContact(null), { email: DEFAULT_SUPPORT_EMAIL, phone: '' })
assert.deepEqual(parseContact('{"email":"nope","phone":"081234567890"}'), { email: '', phone: '081234567890' })

// ─── Legal documents ────────────────────────────────────────────────────────
const text = (t: string, marks?: unknown[]) => ({ type: 'text', text: t, ...(marks ? { marks } : {}) })
const para = (...content: unknown[]) => ({ type: 'paragraph', content })
const doc = (...content: unknown[]) => ({ type: 'doc', content })
const valid = (input: unknown) => validateLegalDoc(input).ok

const rich = doc(
  { type: 'heading', attrs: { level: 1, id: 'x' }, content: [text('Judul')] },
  para(text('Tebal', [{ type: 'bold' }]), { type: 'hardBreak' }, text('link', [{ type: 'link', attrs: { href: 'https://saloka.id', target: '_blank', class: null } }])),
  { type: 'orderedList', attrs: { start: 1, type: null }, content: [{ type: 'listItem', content: [para(text('satu'))] }] },
  { type: 'paragraph' }
)
const cleaned = validateLegalDoc(rich)
assert.ok(cleaned.ok)
assert.deepEqual((cleaned.doc.content![0] as any).attrs, { level: 1 }, 'unknown attrs dropped')
assert.deepEqual(cleaned.doc.content![1].content![2].marks, [{ type: 'link', attrs: { href: 'https://saloka.id' } }])
assert.deepEqual(cleaned.doc.content![2].attrs, { start: 1 })
assert.ok(sameDoc(cleaned.doc, validateLegalDoc(cleaned.doc).ok ? (validateLegalDoc(cleaned.doc) as any).doc : null), 'cleaning is idempotent')

for (const href of ['javascript:alert(1)', '//evil.com', '/\\evil.com', 'java\tscript:alert(1)', 'data:text/html,x', '']) {
  assert.equal(valid(doc(para(text('x', [{ type: 'link', attrs: { href } }])))), false, `href "${href}" must be rejected`)
}
for (const href of ['https://saloka.id', 'mailto:support@saloka.id', 'tel:+6281234567890', '/terms', '#bagian-2']) {
  assert.equal(linkHrefError(href), null, `href "${href}" must be accepted`)
}
assert.equal(valid(doc({ type: 'heading', attrs: { level: 4 }, content: [text('x')] })), false, 'H4 not allowed')
assert.equal(valid(doc({ type: 'image', attrs: { src: 'x' } })), false, 'unsupported node')
assert.equal(valid(doc(para(text('x', [{ type: 'underline' }])))), false, 'unsupported mark')
assert.equal(valid(doc(para(text('')))), false, 'empty text node')
assert.equal(valid(doc(text('loose'))), false, 'text directly in doc')
assert.equal(valid(doc({ type: 'bulletList', content: [] })), false, 'empty list')
assert.equal(valid({ type: 'doc', content: [] }), false, 'empty doc node')
assert.equal(valid(doc({ type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'bulletList', content: [] }] }] })), false)
assert.equal(valid(doc(para(text('x'.repeat(300_001))))), false, 'oversize')
let deep: unknown = para(text('x'))
for (let i = 0; i < 25; i++) deep = { type: 'bulletList', content: [{ type: 'listItem', content: [para(text('x')), deep] }] }
assert.equal(valid(doc(deep)), false, 'too deep')

assert.equal(isDocEmpty(validateLegalDoc(doc({ type: 'paragraph' }, para(text('   ')))).ok ? (validateLegalDoc(doc({ type: 'paragraph' }, para(text('   ')))) as any).doc : null), true)
assert.equal(isDocEmpty(cleaned.doc), false)

for (const slug of ['privacy', 'terms'] as const) {
  const legacy = validateLegalDoc(LEGACY_LEGAL[slug])
  assert.ok(legacy.ok, `legacy ${slug} is a valid doc`)
  assert.ok(sameDoc(legacy.doc, LEGACY_LEGAL[slug]), `legacy ${slug} is already in cleaned shape (editor dirty-check relies on it)`)
}

assert.deepEqual(parseLegal(null), EMPTY_LEGAL)
assert.deepEqual(parseLegal('{broken'), EMPTY_LEGAL)
const stored = parseLegal(JSON.stringify({ published: doc(para(text('x'))), publishedAt: '2026-08-12T07:30:00.000Z', publishedBy: 'Admin', draft: { type: 'image' } }))
assert.ok(stored.published)
assert.equal(stored.draft, null, 'an invalid draft degrades to none')
assert.equal(stored.publishedBy, 'Admin')

// ─── Timestamp ──────────────────────────────────────────────────────────────
assert.equal(formatLegalTimestamp('2026-08-12T07:30:00Z'), '14:30 WIB - 12 Agustus 2026')
assert.equal(formatLegalTimestamp('2026-08-11T17:30:00Z'), '00:30 WIB - 12 Agustus 2026', 'date follows WIB across UTC midnight')
assert.equal(formatLegalTimestamp(new Date('2026-01-05T02:05:00Z')), '09:05 WIB - 05 Januari 2026')

console.log('organization.test.ts: all checks passed')
