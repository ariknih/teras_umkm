/**
 * Self-check for the DOKU order-id trust rules that /api/doku/verify and
 * /api/doku/notification rely on to decide WHO gets credited and HOW MUCH.
 * Run with:  npx tsx src/lib/doku-order.test.ts
 */
import assert from 'node:assert/strict'
import { parseDokuOrderId } from './doku'

const USER = '3f8a1c22-9b0d-4e77-8a10-5c2d9e4b7a61'

// ── Deposit ids name their payer and the amount the server recorded ─────────
const dep = parseDokuOrderId(`dep-doku_${USER}_250000_m1x2y3`)
assert.equal(dep.kind, 'deposit')
assert.equal(dep.userId, USER, 'deposit id identifies the user the checkout was opened for')
assert.equal(dep.amount, 250000, 'deposit id carries the server-recorded amount')

// ── The ownership check must not be satisfiable by a forged id ──────────────
// An attacker settling someone else's deposit gets that victim's id back, not
// their own, so /api/doku/verify's `orderUserId !== user.id` check rejects it.
const forged = parseDokuOrderId('dep-doku_victim-user-id_9999999_zzz')
assert.equal(forged.userId, 'victim-user-id')
assert.notEqual(forged.userId, USER, 'a forged id never resolves to the caller')

// ── Cart checkout ids carry only a truncated id, so they must yield none ────
// Settlement for these has to come from the server-side pending registry.
const chk = parseDokuOrderId(`chk-doku-${USER.slice(0, 8)}-m1x2y3`)
assert.equal(chk.kind, 'checkout')
assert.equal(chk.userId, '', 'truncated checkout ids must not be treated as an identity')
assert.equal(chk.amount, 0)

// ── Community ids are no longer settled here at all ─────────────────────────
// They route through /api/payment/verify, which resolves amounts server-side.
for (const dead of [
  `join-doku_community-1_${USER}_abc`,
  `coin-doku_community-1_${USER}_500_abc`
]) {
  const r = parseDokuOrderId(dead)
  assert.equal(r.kind, 'unknown', `${dead.split('_')[0]} is not settleable via the DOKU routes`)
  assert.equal(r.userId, '', 'no identity is derived from a community order id')
}

// ── Garbage must never produce a creditable identity or amount ──────────────
for (const junk of ['', 'dep-doku_', 'nonsense', 'dep-doku', '../../etc/passwd']) {
  const r = parseDokuOrderId(junk)
  assert.equal(r.userId, '', `"${junk}" must not resolve to a user`)
  assert.equal(r.amount, 0, `"${junk}" must not resolve to an amount`)
}
// A non-string id (a JSON body can carry anything) must not throw.
assert.equal(parseDokuOrderId(null as any).userId, '')
assert.equal(parseDokuOrderId(42 as any).userId, '')

// ── A negative or non-numeric amount never survives parsing ─────────────────
assert.equal(parseDokuOrderId(`dep-doku_${USER}_-5000_abc`).amount, 0, 'negative amounts are rejected')
assert.equal(parseDokuOrderId(`dep-doku_${USER}_abc_abc`).amount, 0, 'non-numeric amounts are rejected')

console.log('doku-order.test.ts: DOKU order-id trust rule assertions passed')
