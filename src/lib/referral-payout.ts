export type CommissionMethod = 'PERCENTAGE' | 'NOMINAL'

// The community-scoped referral cookie is written by proxy.ts as
// `cref_${communityId}_${userId-or-'anon'}` — scoped per logged-in user (not
// just per community) so two different accounts sharing one browser (a QA
// tester switching test users, or a shared/public device) never clobber each
// other's first-touch attribution. Read it the same way everywhere a join
// resolves a referrer: the buyer's own scope first, falling back to the
// anonymous slot for someone who clicked the link before logging in.
export function readCommunityReferralCookie(
  cookieJar: { get(name: string): { value: string } | undefined },
  communityId: string,
  userId: string
): string | null {
  return cookieJar.get(`cref_${communityId}_${userId}`)?.value
    ?? cookieJar.get(`cref_${communityId}_anon`)?.value
    ?? null
}

export interface CommunityMembershipLink {
  userId: string
  referrerId: string | null
  // Mirrors CommunityMembership.removedAt == null. Omitted/undefined means
  // active — every existing caller that never populates this (buildDownlineTree,
  // any pre-soft-delete test data) keeps working unchanged.
  isActive?: boolean
}

// Async counterpart of CommunityMembershipLink for resolveReferralChainAsync's
// caller-supplied lookup — one user's own upline pointer plus whether THAT
// user is still an active member.
export interface UplineMembership {
  referrerId: string | null
  isActive: boolean
}

export interface DownlineNode {
  id: string
  name: string
  children: DownlineNode[]
}

/**
 * Koperasi's affiliate reward is fixed and non-adjustable (unlike Perkumpulan
 * Premium's 3-5 configurable percentage tiers): tier 1 always pays 3 coins,
 * tiers 2-3 pay 1 coin each, funded from the koperasi's own coin balance.
 */
export const KOPERASI_FIXED_TIER_COINS = [3, 1, 1] as const

/**
 * Per-tier commission amount. PERCENTAGE mode splits referralBudget by
 * tierValue% ; NOMINAL mode treats tierValue as a raw Rupiah amount already.
 * Community.commissionMethod controls which one a stored tierValues[] array
 * actually holds.
 */
export function computeTierAmount(
  commissionMethod: CommissionMethod,
  referralBudget: number,
  tierValue: number
): number {
  return commissionMethod === 'NOMINAL' ? tierValue : (referralBudget * tierValue) / 100
}

/**
 * Who a tier's commission goes to once the upline referrer chain has been
 * walked and found empty for this tier (no referrer, or the chain never had
 * one to begin with). Tier 1 falls back to the community's own wallet (Kas
 * Komunitas — never the ketua's personal wallet); any later tier is Saloka's
 * platform share, which is ledger-only (the money already sits in Saloka's
 * payment-gateway balance, so no wallet is credited).
 */
export function resolveTierFallbackRecipient(
  tier: number,
  communityName: string
): { recipientType: 'KOMUNITAS' | 'PLATFORM'; recipientName: string } {
  if (tier === 1) {
    return { recipientType: 'KOMUNITAS', recipientName: `Kas Komunitas ${communityName}` }
  }
  return { recipientType: 'PLATFORM', recipientName: 'Saloka.id Platform' }
}

/**
 * Shared by updateCommunityReferralConfig and updateIndukCommunity so both
 * server actions that can write joinFee agree on the same x = y + z
 * invariant (the referral budget + kas share must never exceed what the
 * join fee collects). `exact` is stricter (used by the referral-config form
 * itself, whose client side already auto-rescales y/z to sum exactly to x);
 * the profile-edit path only has joinFee to work with, so it can only
 * enforce the non-negative-gap direction against whatever referral config
 * already exists.
 */
/**
 * Walks the community-scoped upline (CommunityMembership.referrerId, not the
 * platform-wide signup referrer) starting from the buyer, one tier at a time:
 * position 0 is the buyer's direct referrer, position 1 is that referrer's
 * own referrer, and so on. Once the chain runs out (a referrer with no
 * referrer of their own, or the buyer had none to start with) every
 * remaining tier is `null` - the caller resolves that via
 * resolveTierFallbackRecipient rather than this function inventing a
 * recipient.
 *
 * Dynamic compression: a removed member (isActive: false, from a soft-deleted
 * CommunityMembership) never occupies a tier slot themselves — the walk
 * passes straight through them to their own upline, so that ancestor "rolls
 * up" into the vacated tier instead of the chain treating the removed
 * member's position as exhausted. A referrerId cycle (corrupted data) is
 * capped by hopCap so a run of removed members can never loop forever.
 */
export function resolveReferralChain(
  memberships: CommunityMembershipLink[],
  buyerId: string,
  maxTiers: number
): (string | null)[] {
  const membershipByUserId = new Map<string, CommunityMembershipLink>(memberships.map((m) => [m.userId, m]))
  const chain: (string | null)[] = []
  const visited = new Set<string>([buyerId])
  const hopCap = maxTiers * 5
  let hops = 0
  let cursorId: string | null = buyerId

  for (let tier = 0; tier < maxTiers; tier++) {
    let recipient: string | null = null
    while (cursorId) {
      const candidateId: string | null = membershipByUserId.get(cursorId)?.referrerId ?? null
      if (!candidateId || visited.has(candidateId) || hops++ >= hopCap) {
        cursorId = null
        break
      }
      visited.add(candidateId)
      cursorId = candidateId
      if (membershipByUserId.get(candidateId)?.isActive !== false) {
        recipient = candidateId
        break
      }
      // Removed member: keep climbing from here without consuming this tier.
    }
    chain.push(recipient)
    if (!cursorId) {
      for (let t = tier + 1; t < maxTiers; t++) chain.push(null)
      return chain
    }
  }
  return chain
}

/**
 * Async counterpart to resolveReferralChain for a live checkout against
 * Postgres, with the same dynamic-compression behavior. `getMembership` is
 * caller-supplied (a Prisma transaction's findUnique in production, a test
 * double otherwise) and is called at most once per node actually visited —
 * the walk stops issuing lookups the instant it reaches a user with no
 * referrer, and a hopCap (maxTiers * 5) bounds a corrupted/cyclic chain
 * instead of ever looping unboundedly. It never loads a community's full
 * membership list into memory just to walk 3-5 hops.
 */
export async function resolveReferralChainAsync(
  buyerId: string,
  maxTiers: number,
  getMembership: (userId: string) => Promise<UplineMembership | null>
): Promise<(string | null)[]> {
  const chain: (string | null)[] = []
  const visited = new Set<string>([buyerId])
  const hopCap = maxTiers * 5
  let hops = 0
  let cursorId: string | null = buyerId
  let cursorMembership: UplineMembership | null = await getMembership(buyerId)

  for (let tier = 0; tier < maxTiers; tier++) {
    let recipient: string | null = null
    while (cursorId) {
      const candidateId = cursorMembership?.referrerId ?? null
      if (!candidateId || visited.has(candidateId) || hops++ >= hopCap) {
        cursorId = null
        cursorMembership = null
        break
      }
      visited.add(candidateId)
      const candidateMembership = await getMembership(candidateId)
      cursorId = candidateId
      cursorMembership = candidateMembership
      if (candidateMembership?.isActive !== false) {
        recipient = candidateId
        break
      }
      // Removed member: keep climbing from here without consuming this tier.
    }
    chain.push(recipient)
    if (!cursorId) {
      for (let t = tier + 1; t < maxTiers; t++) chain.push(null)
      return chain
    }
  }
  return chain
}

/**
 * Guards against a referral cycle before a referrerId is ever written to
 * CommunityMembership. A rejoin (or any join carrying a referrerId) can
 * propose a referrer who is actually one of the JOINING user's own
 * descendants — e.g. A quits, then rejoins under D's link where
 * D -> C -> B -> A already exists: naively honoring that would set A's
 * referrerId to D and close the loop A -> D -> C -> B -> A, with no root.
 * resolveReferralChain/Async's visited set stops the PAYOUT walker from
 * hanging on a cycle like that, but it doesn't stop the cycle from being
 * WRITTEN, and a closed loop still lets someone earn commission as their
 * own downline's "upline". Walks the proposed referrer's own chain (via the
 * caller-supplied lookup — a Prisma tx findUnique in production) and
 * refuses any referrerId that loops back to the joining user, returning
 * null so the caller falls back to whatever referrerId already existed (or
 * none) instead of the invalid one.
 */
export async function validateReferrerId(
  userId: string,
  proposedReferrerId: string | null | undefined,
  getReferrerId: (userId: string) => Promise<string | null>
): Promise<string | null> {
  if (!proposedReferrerId || proposedReferrerId === userId) return null

  let currentRefId: string | null = proposedReferrerId
  const visited = new Set<string>()

  while (currentRefId) {
    if (currentRefId === userId) return null
    // Guards this validation walk itself against hanging on a cycle that
    // already exists in the data from before this guard was added.
    if (visited.has(currentRefId)) break
    visited.add(currentRefId)
    currentRefId = await getReferrerId(currentRefId)
  }

  return proposedReferrerId
}

/**
 * Builds the downline tree shown in "Afiliasi Saya": everyone who joined
 * THIS community through `rootUserId` (CommunityMembership.referrerId),
 * recursively. Capped at depth 5 - the highest tier count any community can
 * configure - so a referral loop or a deep chain can never recurse forever.
 * Mirrors DataStore.getCommunityAffiliateDownline's mock-branch buildTree.
 */
export function buildDownlineTree(
  memberships: Array<CommunityMembershipLink & { name: string }>,
  rootUserId: string,
  maxDepth = 5
): DownlineNode[] {
  function build(parentId: string, depth: number): DownlineNode[] {
    if (depth > maxDepth) return []
    return memberships
      .filter((m) => m.referrerId === parentId)
      .map((m) => ({ id: m.userId, name: m.name, children: build(m.userId, depth + 1) }))
  }
  return build(rootUserId, 1)
}

export function validateReferralAllocation(
  joinFee: number,
  referralBudget: number,
  communityProfitShare: number,
  exact = false
): string | null {
  const sum = referralBudget + communityProfitShare
  if (exact ? sum !== joinFee : sum > joinFee) {
    return 'Alokasi dana referral dan kas komunitas tidak sesuai dengan harga masuk komunitas.'
  }
  return null
}
