/**
 * Self-check for the community multi-tier referral payout arithmetic
 * (Phase 0 hotfix: NOMINAL-mode payout bug + hardcoded-fallback money leak)
 * and the Phase 3 joinFee = referralBudget + communityProfitShare invariant.
 * Run with:  npx tsx src/lib/referral-payout.test.ts
 */
import assert from 'node:assert/strict'
import { computeTierAmount, resolveTierFallbackRecipient, validateReferralAllocation, resolveReferralChain, resolveReferralChainAsync, validateReferrerId, buildDownlineTree, KOPERASI_FIXED_TIER_COINS, type UplineMembership } from './referral-payout'

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
const tier1Fallback = resolveTierFallbackRecipient(1, 'Komunitas UMKM Jaya')
assert.equal(tier1Fallback.recipientType, 'KOMUNITAS', 'tier 1 with no referrer goes to the community wallet')
assert.ok(!('recipientId' in tier1Fallback), 'never names a person (the old ketua-wallet payout)')

// ── Short referral chain: tier > 1 is Saloka's ledger-only platform share ──
// Must never resolve to a user id (the old hardcoded 'user-admin-1' seed id
// silently dropped money); the caller logs a PLATFORM row and credits nothing.
const tier2Fallback = resolveTierFallbackRecipient(2, 'Komunitas UMKM Jaya')
assert.equal(tier2Fallback.recipientType, 'PLATFORM')
assert.equal(resolveTierFallbackRecipient(5, 'Komunitas UMKM Jaya').recipientType, 'PLATFORM', 'same for any tier beyond 1')

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

// ── Dynamic compression: a removed (isActive: false) member never occupies a
// tier slot — the walk passes through them to their own upline, which rolls
// up into the vacated tier instead of the chain treating that position as
// exhausted. Buyer D -> C (removed) -> B -> A (root).
const compressedMemberships = [
  { userId: 'A', referrerId: null },
  { userId: 'B', referrerId: 'A' },
  { userId: 'C', referrerId: 'B', isActive: false },
  { userId: 'D', referrerId: 'C' }
]
assert.deepEqual(
  resolveReferralChain(compressedMemberships, 'D', 3),
  ['B', 'A', null],
  "removed C is skipped entirely - tier 1 rolls up to B (C's upline), tier 2 to A, tier 3 is exhausted"
)

// Two consecutive removed members in a row must both be skipped in one tier.
const doubleRemoved = [
  { userId: 'A', referrerId: null },
  { userId: 'B', referrerId: 'A', isActive: false },
  { userId: 'C', referrerId: 'B', isActive: false },
  { userId: 'D', referrerId: 'C' }
]
assert.deepEqual(
  resolveReferralChain(doubleRemoved, 'D', 2),
  ['A', null],
  'two removed members in a row both get skipped - tier 1 rolls all the way up to A'
)

// A referrer cycle entirely among removed members must never loop forever -
// the hop cap (maxTiers * 5) has to cut it off deterministically.
const cyclicRemoved = [
  { userId: 'X', referrerId: 'Y', isActive: false },
  { userId: 'Y', referrerId: 'X', isActive: false },
  { userId: 'D', referrerId: 'X' }
]
assert.deepEqual(
  resolveReferralChain(cyclicRemoved, 'D', 2),
  [null, null],
  'a cycle of removed members resolves to no recipient instead of hanging'
)

console.log('referral-payout.test.ts: resolveReferralChain assertions passed')

// ── resolveReferralChainAsync: same walk (and same dynamic-compression
// behavior) as resolveReferralChain, but via a caller-supplied async lookup
// (a Prisma tx in production) instead of a preloaded array — this is what
// the live-checkout DB path uses so it never has to load a community's full
// membership list into memory. It also has no amount parameter at all, so
// it can never be coupled to a tier's commission value the way the old
// inline DB-branch walk was (the actual bug: a 0-value NOMINAL tier used to
// freeze the pointer and shift every later tier's recipient by one).
;(async () => {
  const chain: Record<string, UplineMembership> = {
    D: { referrerId: 'C', isActive: true },
    C: { referrerId: 'B', isActive: true },
    B: { referrerId: 'A', isActive: true },
    A: { referrerId: null, isActive: true }
  }
  let calls = 0
  const lookup = async (userId: string): Promise<UplineMembership | null> => {
    calls++
    return chain[userId] ?? { referrerId: null, isActive: true }
  }

  assert.deepEqual(
    await resolveReferralChainAsync('D', 3, lookup),
    ['C', 'B', 'A'],
    'async walk matches the sync resolveReferralChain result for the same chain'
  )
  assert.equal(calls, 4, 'one lookup for the buyer plus one per hop - never a full-table scan')

  calls = 0
  assert.deepEqual(
    await resolveReferralChainAsync('D', 5, lookup),
    ['C', 'B', 'A', null, null],
    'once the chain reaches the root, every further tier is null without extra lookups'
  )
  assert.equal(calls, 4, 'the walk stops issuing lookups the instant it reaches a user with no referrer, never all 5 tiers worth')

  calls = 0
  assert.deepEqual(
    await resolveReferralChainAsync('ghost', 3, lookup),
    [null, null, null],
    'an unknown buyer (no membership) is treated as having no referrer, not a crash'
  )
  assert.equal(calls, 1, 'a buyer with no upline at all needs exactly one lookup, not three')

  // Dynamic compression, async version: C is removed (isActive: false) - its
  // tier slot is skipped and the commission rolls up to B instead.
  const compressedChain: Record<string, UplineMembership> = {
    D: { referrerId: 'C', isActive: true },
    C: { referrerId: 'B', isActive: false },
    B: { referrerId: 'A', isActive: true },
    A: { referrerId: null, isActive: true }
  }
  const compressedLookup = async (userId: string): Promise<UplineMembership | null> => compressedChain[userId] ?? null
  assert.deepEqual(
    await resolveReferralChainAsync('D', 3, compressedLookup),
    ['B', 'A', null],
    'removed C is skipped - tier 1 rolls up to B, tier 2 to A, tier 3 is exhausted'
  )

  // A referrer cycle entirely among removed members must terminate via the
  // hop cap / visited-set instead of awaiting forever.
  const cyclicChain: Record<string, UplineMembership> = {
    D: { referrerId: 'X', isActive: true },
    X: { referrerId: 'Y', isActive: false },
    Y: { referrerId: 'X', isActive: false }
  }
  const cyclicLookup = async (userId: string): Promise<UplineMembership | null> => cyclicChain[userId] ?? null
  assert.deepEqual(
    await resolveReferralChainAsync('D', 2, cyclicLookup),
    [null, null],
    'a cycle of removed members resolves to no recipient instead of hanging'
  )

  console.log('referral-payout.test.ts: resolveReferralChainAsync assertions passed')
})().catch((e) => {
  console.error(e)
  process.exit(1)
})

// ── validateReferrerId: block a rejoin from closing a referral loop ────────
// Chain: A -> B -> C -> D (D.referrerId=C, C.referrerId=B, B.referrerId=A).
// A quits and tries to rejoin under D's link - accepting D as A's referrer
// would close A -> D -> C -> B -> A with no root.
;(async () => {
  const chain: Record<string, string | null> = { A: null, B: 'A', C: 'B', D: 'C' }
  const lookup = async (userId: string): Promise<string | null> => chain[userId] ?? null

  assert.equal(
    await validateReferrerId('A', 'D', lookup),
    null,
    "A rejoining under D's link is rejected - D's own chain climbs back to A"
  )
  assert.equal(
    await validateReferrerId('A', 'C', lookup),
    null,
    "same for C - C's chain (C -> B -> A) also reaches back to A"
  )
  assert.equal(
    await validateReferrerId('A', 'B', lookup),
    null,
    "same for B directly (B -> A)"
  )
  assert.equal(
    await validateReferrerId('D', 'B', lookup),
    'B',
    "D referring under B is fine - B's own chain (B -> A) never reaches D"
  )
  assert.equal(
    await validateReferrerId('A', 'A', lookup),
    null,
    'direct self-referral is rejected without even needing to walk'
  )
  assert.equal(
    await validateReferrerId('A', null, lookup),
    null,
    'no proposed referrer at all is a no-op, not an error'
  )

  // The validation walk itself must not hang on a cycle that already exists
  // in the data (e.g. from before this guard was added).
  const alreadyCyclic: Record<string, string | null> = { X: 'Y', Y: 'X' }
  const cyclicLookup = async (userId: string): Promise<string | null> => alreadyCyclic[userId] ?? null
  assert.equal(
    await validateReferrerId('Z', 'X', cyclicLookup),
    'X',
    "an unrelated user (Z) proposing X as referrer is unaffected by X/Y's pre-existing cycle, and the walk still terminates"
  )

  console.log('referral-payout.test.ts: validateReferrerId assertions passed')
})().catch((e) => {
  console.error(e)
  process.exit(1)
})

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
