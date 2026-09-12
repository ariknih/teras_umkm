// Single source of truth for the community type/tier badge shown in the
// Community Hub directory, the public landing page, and the Beranda banner.
// They used to each derive this independently (and one even read a free-text
// "hero.badge" override) which let the label drift out of sync across pages.

export interface CommunityBadgeInput {
  type?: string | null
  joinFee?: number | null
  monthlyFee?: number | null
  category?: string | null
  landingPageConfig?: string | Record<string, any> | null
}

// Internal tier storage keeps the original BASIC/PLUS/PRO values (no data
// migration needed) - only the user-facing label changed:
// BASIC → Reguler, PLUS → Premium, PRO → Max.
const COOP_TIER_LABELS: Record<'BASIC' | 'PLUS' | 'PRO', string> = {
  BASIC: 'KOPERASI REGULER',
  PLUS: 'KOPERASI PREMIUM',
  PRO: 'KOPERASI MAX'
}

export type CommunityBadgeVariant = 'neutral' | 'blue' | 'yellow'

export interface CommunityTierBadge {
  label: string
  isKoperasi: boolean
  coopTier: 'BASIC' | 'PLUS' | 'PRO'
  isPerkumpulanPremium: boolean
  joinFee: number
  isFree: boolean
  // 'neutral' = Reguler (Koperasi or Perkumpulan), 'blue' = Premium (Koperasi
  // or Perkumpulan), 'yellow' = Koperasi Max only.
  variant: CommunityBadgeVariant
  showStar: boolean
}

function parseLandingConfig(raw: CommunityBadgeInput['landingPageConfig']): any {
  if (!raw) return {}
  if (typeof raw !== 'string') return raw
  try {
    return JSON.parse(raw)
  } catch (_) {
    return {}
  }
}

export function getCommunityTierBadge(community: CommunityBadgeInput | null | undefined): CommunityTierBadge {
  const config = parseLandingConfig(community?.landingPageConfig)
  const isKoperasi = community?.type === 'KOPERASI'
  const joinFee = Number(community?.joinFee || 0)
  const isPaidLegacy = joinFee > 0 || Number(community?.monthlyFee || 0) > 0 || community?.category === 'PAID'

  const coopTier: CommunityTierBadge['coopTier'] = config?.coopTier || (isKoperasi && isPaidLegacy ? 'PLUS' : 'BASIC')

  const isPerkumpulanPremium =
    !isKoperasi && (config?.perkumpulanTier === 'PREMIUM' || Number(config?.activationFeePaid || 0) > 0 || isPaidLegacy)

  const label = isKoperasi ? COOP_TIER_LABELS[coopTier] : isPerkumpulanPremium ? 'PERKUMPULAN PREMIUM' : 'PERKUMPULAN REGULER'

  const variant: CommunityBadgeVariant = isKoperasi
    ? coopTier === 'PRO'
      ? 'yellow'
      : coopTier === 'PLUS'
        ? 'blue'
        : 'neutral'
    : isPerkumpulanPremium
      ? 'blue'
      : 'neutral'

  return {
    label,
    isKoperasi,
    coopTier,
    isPerkumpulanPremium,
    joinFee,
    isFree: joinFee === 0,
    variant,
    showStar: variant === 'yellow'
  }
}
