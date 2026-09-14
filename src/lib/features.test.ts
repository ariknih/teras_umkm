/**
 * Self-check for Feature Control routing and config rules.
 * Run with:  npx tsx src/lib/features.test.ts
 */
import assert from 'node:assert/strict'
import {
  FEATURES,
  MIN_ACTIVE_ERROR,
  matchFeature,
  validateConfig,
  dependentsOf,
  diffConfig,
  parseFeatureControl,
  defaultEntryFor,
  activeFeatures
} from './features'
import { merchantSubdomain } from './cookie-domain'

const HOME = { cta: 'Kembali ke Beranda', target: 'home' }
const allOff = (target: string) => Object.fromEntries(FEATURES.map((f) => [f.key, { cta: 'x', target }]))

// ── Route matching ──────────────────────────────────────────────────────────
assert.equal(matchFeature('/')?.key, 'home', 'Beranda is blockable')
assert.equal(matchFeature('/market')?.key, 'market')
assert.equal(matchFeature('/market/produk/123')?.key, 'market', 'nested routes are covered')
assert.equal(matchFeature('/cart')?.key, 'market')
assert.equal(matchFeature('/marketplace'), null, 'a prefix only matches whole path segments')

// ── Front-side only: CMS, APIs, back-office and account pages never match ───
for (const p of [
  '/cms_admin', '/cms_admin/features', '/cms_admin/products/x',
  '/api/payment/verify', '/api/market',
  '/merchant/dashboard', '/merchant/builder/x', '/cs',
  '/fitur-nonaktif', '/auth', '/profile', '/wallet', '/settings'
]) {
  assert.equal(matchFeature(p), null, `${p} must never be intercepted`)
}

// ── validateConfig (server-side guard) ──────────────────────────────────────
assert.deepEqual(validateConfig({}), { ok: true, config: {} })
assert.deepEqual(
  validateConfig({ market: { cta: '  Kembali  ', target: 'home' } }),
  { ok: true, config: { market: { cta: 'Kembali', target: 'home' } } },
  'CTA is trimmed'
)
assert.equal(validateConfig({ home: { cta: 'Jelajahi Market', target: 'market' } }).ok, true, 'Beranda can be disabled')
assert.deepEqual(validateConfig(allOff('home')), { ok: false, error: MIN_ACTIVE_ERROR }, 'at least one feature stays ON')
const lastOneOn = Object.fromEntries(FEATURES.filter((f) => f.key !== 'orders').map((f) => [f.key, { cta: 'x', target: 'orders' }]))
assert.equal(validateConfig(lastOneOn).ok, true, 'exactly one feature ON is allowed')
assert.equal(validateConfig({ nope: HOME }).ok, false, 'unknown feature')
assert.equal(validateConfig(JSON.parse('{"__proto__":{"cta":"x","target":"home"}}')).ok, false, 'prototype key')
assert.equal(validateConfig({ market: { cta: 'x', target: 'market' } }).ok, false, 'self redirect')
assert.equal(validateConfig({ market: { cta: 'x', target: 'jasa' }, jasa: HOME }).ok, false, 'target disabled')
assert.equal(validateConfig({ market: { cta: 'x', target: 'home' }, home: { cta: 'x', target: 'jasa' } }).ok, false, 'target Beranda while Beranda is off')
assert.equal(validateConfig({ market: { cta: '   ', target: 'home' } }).ok, false, 'empty CTA')
assert.equal(validateConfig({ market: { cta: 'x'.repeat(41), target: 'home' } }).ok, false, 'CTA too long')
assert.equal(validateConfig({ market: { cta: 'x', target: 'nowhere' } }).ok, false, 'unknown target')
assert.equal(validateConfig({ market: 'x' }).ok, false, 'entry not an object')
assert.equal(validateConfig([]).ok, false)
assert.equal(validateConfig(null).ok, false)

// ── Default placeholder button when switching a feature off ────────────────
assert.deepEqual(defaultEntryFor({}, 'market'), HOME, 'prefers Beranda while it is on')
assert.deepEqual(defaultEntryFor({ home: { cta: 'x', target: 'market' } }, 'jasa'), { cta: 'Jelajahi Market', target: 'market' })
assert.deepEqual(defaultEntryFor({}, 'home'), { cta: 'Jelajahi Market', target: 'market' }, 'never points at itself')
assert.equal(defaultEntryFor(lastOneOn, 'orders'), null, 'the last active feature has no default: it cannot be switched off')
assert.deepEqual(activeFeatures(lastOneOn).map((f) => f.key), ['orders'])

// ── Dependency lookup ───────────────────────────────────────────────────────
const before = {
  jasa: { cta: 'Ke Market', target: 'market' },
  voucher: { cta: 'Ke Market', target: 'market' },
  snackbox: HOME
}
assert.deepEqual(dependentsOf(before, 'market').sort(), ['jasa', 'voucher'])
assert.deepEqual(dependentsOf(before, 'home'), ['snackbox'])
assert.deepEqual(dependentsOf(before, 'academy'), [])

// ── Diff (audit trail) ──────────────────────────────────────────────────────
const after = {
  market: HOME,
  jasa: { cta: 'Ke Market', target: 'academy' },
  voucher: { cta: 'Ke Market', target: 'academy' }
}
assert.deepEqual(
  diffConfig(before, after).map((c) => [c.key, c.change]),
  [['market', 'DISABLED'], ['jasa', 'REDIRECT_UPDATED'], ['snackbox', 'ENABLED'], ['voucher', 'REDIRECT_UPDATED']]
)
assert.deepEqual(diffConfig(before, before), [], 'no-op save produces no audit rows')

// ── Stored-row parsing is fail-open ─────────────────────────────────────────
assert.deepEqual(parseFeatureControl('not json'), {})
assert.deepEqual(parseFeatureControl(null), {})
assert.deepEqual(parseFeatureControl('"market"'), {})
assert.deepEqual(parseFeatureControl(JSON.stringify(allOff('home'))), {}, 'a row switching everything off is ignored')
assert.deepEqual(
  parseFeatureControl('{"market":{"cta":"x","target":"gone"},"removed":{"cta":"x","target":"home"},"home":{"cta":"y","target":"market"}}'),
  { market: { cta: 'x', target: 'jasa' }, home: { cta: 'y', target: 'jasa' } },
  'unknown keys dropped; dead or disabled targets fall back to the first active feature'
)

// ── Host → merchant subdomain (decides whether '/' is Beranda or a storefront)
for (const [host, expected] of [
  ['saloka.id', ''],
  ['www.saloka.id', ''],
  ['WWW.saloka.id', ''],
  ['tokorijal.saloka.id', 'tokorijal'],
  ['localhost:3000', ''],
  ['www.localhost:3000', ''],
  ['tokorijal.localhost:3000', 'tokorijal'],
  ['127.0.0.1:3000', ''],
  ['192.168.1.20:3000', ''],
  ['terasumkm.vercel.app', ''],
  ['tokorijal.terasumkm.vercel.app', 'tokorijal'],
  ['saloka.varro.my.id', ''],
  ['tokorijal.saloka.varro.my.id', 'tokorijal']
]) {
  assert.equal(merchantSubdomain(host), expected, `${host} → "${expected}"`)
}

console.log('features.test.ts: all assertions passed')
