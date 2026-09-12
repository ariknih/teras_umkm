/**
 * Self-check for the community multi-tier referral payout arithmetic
 * (Phase 0 hotfix: NOMINAL-mode payout bug + hardcoded-fallback money leak)
 * and the Phase 3 joinFee = referralBudget + communityProfitShare invariant.
 * Run with:  npx tsx src/lib/referral-payout.test.ts
 */
import assert from 'node:assert/strict'
import { computeTierAmount, resolveTierFallbackRecipient, validateReferralAllocation, resolveReferralChain, buildDownlineTree, KOPERASI_FIXED_TIER_COINS } from './referral-payout'

// ── PERCENTAGE mode: tierValue is a % of referralBudget ─────────────────────
assert.equal(computeTierAmount('PERCENTAGE', 40000, 50), 20000, '50% of a 40k budget is 20k')
assert.equal(computeTierAmount('PERCENTAGE', 40000, 30), 12000, '30% of a 40k budget is 12k')
assert.equal(computeTierAmount('PERCENTAGE', 40000, 20), 8000, '20% of a 40k budget is 8k')

// ── NOMINAL mode: tierValue IS the Rupiah amount, not scaled by budget ──────
// This is the exact bug the hotfix closes: the payout engine used to always
// divide by 100 and multiply by referralBudget, even for NOMINAL tiers.
assert.equal(computeTierAmount('NOMINAL', 40000, 20000), 20000, 'NOMINAL tier pays its raw rupiah value')
assert.equal(computeTierAmount('NOMINAL', 40000, 12000), 12000, 'NOMINAL tier is not rescaled by budget')
assert.notEqual(
  computeTierAmount('NOMINAL', 40000, 20000),
  (40000 * 20000) / 100,
  'NOMINAL must never fall through to the PERCENTAGE formula'
)

// ── Short referral chain: tier 1 falls back to the community kas ───────────
const tier1Fallback = resolveTierFallbackRecipient(1, 'ketua-1', 'Komunitas UMKM Jaya')
assert.equal(tier1Fallback.recipientId, 'ketua-1', 'tier 1 with no referrer pays the ketua')
assert.equal(tier1Fallback.recipientType, 'KOMUNITAS')

// ── Short referral chain: tier > 1 has no fallback recipient at all ────────
// This is the other bug the hotfix closes: a hardcoded 'user-admin-1' seed id
// (nonexistent in production) used to be assigned here, so the wallet lookup
// silently failed and the money vanished with no log. It must now come back
// with recipientId: null so the caller logs an unpaid PLATFORM residual
// instead of trying (and failing) to credit a made-up account.
const tier2Fallback = resolveTierFallbackRecipient(2, 'ketua-1', 'Komunitas UMKM Jaya')
assert.equal(tier2Fallback.recipientId, null, 'tier 2+ with an exhausted chain has no recipient to credit')
assert.equal(tier2Fallback.recipientType, 'PLATFORM')
assert.notEqual(tier2Fallback.recipientId, 'user-admin-1', 'must never fall back to the old hardcoded seed id')

const tier5Fallback = resolveTierFallbackRecipient(5, 'ketua-1', 'Komunitas UMKM Jaya')
assert.equal(tier5Fallback.recipientId, null, 'same for any tier beyond 1')

console.log('referral-payout.test.ts: tier arithmetic + fallback assertions passed')

// ── validateReferralAllocation: x = y + z invariant (Phase 3) ──────────────
// Non-exact mode (updateIndukCommunity): only rejects over-allocation.
assert.equal(validateReferralAllocation(100000, 40000, 60000), null, 'exact sum is always fine, non-exact mode')
assert.equal(validateReferralAllocation(100000, 40000, 50000), null, 'under-allocation is allowed, non-exact mode (fresh community with no referral config yet)')
assert.equal(validateReferralAllocation(100000, 0, 0), null, 'a fresh community with no referral config configured never blocks a joinFee edit')
assert.notEqual(validateReferralAllocation(100000, 60000, 60000), null, 'over-allocation (y+z > x) is always rejected, non-exact mode')

// Exact mode (updateCommunityReferralConfig): the client always rescales y/z
// to sum exactly to x, so the server can safely require equality here.
assert.equal(validateReferralAllocation(100000, 40000, 60000), null, 'exact sum passes exact mode too')
assert.notEqual(validateReferralAllocation(100000, 40000, 50000, true), null, 'under-allocation is rejected in exact mode (was previously a silent money-tracking gap)')
assert.notEqual(validateReferralAllocation(100000, 60000, 60000, true), null, 'over-allocation is rejected in exact mode')

console.log('referral-payout.test.ts: validateReferralAllocation assertions passed')

// ── Koperasi's fixed 3/1/1 coin tier schedule (non-adjustable) ──────────────
assert.deepEqual([...KOPERASI_FIXED_TIER_COINS], [3, 1, 1], 'koperasi tier reward is always 3/1/1 coins')
assert.equal(KOPERASI_FIXED_TIER_COINS.length, 3, 'koperasi always has exactly 3 tiers')

console.log('referral-payout.test.ts: koperasi fixed-tier assertions passed')

// ── resolveReferralChain: A joined via nobody, B via A, C via B, D via C ────
// Buyer is D. Tier 1 = D's own referrer (C), tier 2 = C's referrer (B), etc.
const chainMemberships = [
  { userId: 'A', referrerId: null },
  { userId: 'B', referrerId: 'A' },
  { userId: 'C', referrerId: 'B' },
  { userId: 'D', referrerId: 'C' }
]
assert.deepEqual(
  resolveReferralChain(chainMemberships, 'D', 3),
  ['C', 'B', 'A'],
  '3-tier chain from D walks upline C -> B -> A'
)
assert.deepEqual(
  resolveReferralChain(chainMemberships, 'D', 5),
  ['C', 'B', 'A', null, null],
  'once the chain reaches the root (A has no referrer), every further tier is null - never re-walks or loops'
)
assert.deepEqual(
  resolveReferralChain(chainMemberships, 'A', 3),
  [null, null, null],
  'a buyer with no referrer at all (chain root) has every tier empty'
)
assert.deepEqual(
  resolveReferralChain([], 'ghost', 3),
  [null, null, null],
  'a buyer with no membership record on file (unknown user) is treated as having no referrer, not a crash'
)

console.log('referral-payout.test.ts: resolveReferralChain assertions passed')

// ── buildDownlineTree: mirrors the "Afiliasi Saya" tree - who joined through
// whom, recursively, capped at depth 5 ───────────────────────────────────────
const downlineMemberships = [
  { userId: 'A', referrerId: null, name: 'Ketua' },
  { userId: 'B', referrerId: 'A', name: 'Budi' },
  { userId: 'C', referrerId: 'A', name: 'Citra' },
  { userId: 'D', referrerId: 'B', name: 'Dedi' }
]
const treeFromA = buildDownlineTree(downlineMemberships, 'A')
assert.equal(treeFromA.length, 2, "A's direct downline is Budi and Citra (2 tier-1 nodes)")
const budiNode = treeFromA.find((n) => n.id === 'B')!
assert.ok(budiNode, 'Budi appears as a direct downline of A')
assert.equal(budiNode.children.length, 1, "Budi's own downline (Dedi) appears one level deeper")
assert.equal(budiNode.children[0].id, 'D', 'Dedi is nested under Budi, not a sibling of Budi')
const citraNode = treeFromA.find((n) => n.id === 'C')!
assert.equal(citraNode.children.length, 0, 'Citra has no downline of her own')

assert.deepEqual(buildDownlineTree(downlineMemberships, 'D'), [], "a leaf member (Dedi) has an empty downline tree, not undefined/error")

// A self-referential loop (X claims Y as referrer, Y claims X) must never
// hang - the depth cap must stop it well before any real stack overflow.
const loopMemberships = [
  { userId: 'X', referrerId: 'Y', name: 'X' },
  { userId: 'Y', referrerId: 'X', name: 'Y' }
]
const loopTree = buildDownlineTree(loopMemberships, 'X', 5)
function countNodes(nodes: typeof loopTree): number {
  return nodes.reduce((sum, n) => sum + 1 + countNodes(n.children), 0)
}
assert.equal(countNodes(loopTree), 5, 'a referrer loop is cut off at the depth-5 cap instead of recursing forever')

console.log('referral-payout.test.ts: buildDownlineTree assertions passed')
