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
 * one to begin with). Tier 1 always falls back to the community's own kas
 * (ketua's wallet); any later tier has no natural fallback recipient, so it
 * must be logged as an unpaid platform residual — never a hardcoded user id
 * that may not exist in production.
 */
export function resolveTierFallbackRecipient(
  tier: number,
  ketuaId: string,
  communityName: string
): { recipientId: string | null; recipientType: 'KOMUNITAS' | 'PLATFORM'; recipientName: string } {
  if (tier === 1) {
    return { recipientId: ketuaId, recipientType: 'KOMUNITAS', recipientName: `Kas Komunitas ${communityName}` }
  }
  return { recipientId: null, recipientType: 'PLATFORM', recipientName: 'Saloka.id Platform (belum ada penerima)' }
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
 * recipient. Mirrors the one-user-at-a-time lookup loop in
 * DataStore.processMultiTierCommunityReferral (mock branch) and
 * DataStore.getCommunityAffiliateDownline's ancestor walk.
 */
export function resolveReferralChain(
  memberships: CommunityMembershipLink[],
  buyerId: string,
  maxTiers: number
): (string | null)[] {
  const membershipByUserId = new Map(memberships.map((m) => [m.userId, m]))
  const chain: (string | null)[] = []
  let currentReferrerId: string | null = membershipByUserId.get(buyerId)?.referrerId ?? null

  for (let tier = 0; tier < maxTiers; tier++) {
    chain.push(currentReferrerId)
    currentReferrerId = currentReferrerId ? (membershipByUserId.get(currentReferrerId)?.referrerId ?? null) : null
  }
  return chain
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
