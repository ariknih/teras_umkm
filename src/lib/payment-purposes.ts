import { DataStore } from './data-store'

/**
 * Business logic for what a gateway-backed checkout actually pays for.
 * src/app/api/payment/checkout and /verify are thin dispatchers over this —
 * all purpose-specific amount/settlement logic lives here, vendor-agnostic,
 * so it never has to change when the active gateway does.
 */
export type PurposeKey = 'JOIN_FEE' | 'SAVINGS' | 'COIN_TOPUP'

const PREFIX: Record<PurposeKey, string> = {
  JOIN_FEE: 'cjoin',
  SAVINGS: 'csav',
  COIN_TOPUP: 'ccoin'
}

export function prefixForPurpose(purpose: PurposeKey): string {
  return PREFIX[purpose]
}

export function purposeFromOrderId(orderId: string): PurposeKey | null {
  const entry = (Object.entries(PREFIX) as [PurposeKey, string][]).find(([, prefix]) => orderId.startsWith(`${prefix}-`))
  return entry ? entry[0] : null
}

export interface PendingPurposeContext {
  purpose: PurposeKey
  gatewayId: string
  communityId: string
  savingsType?: string
  jumlahCoin?: number
  // JOIN_FEE only: who this join was referred by (community-scoped, captured
  // from the community's own share link at checkout time) — carried through
  // to payCommunityJoinFee so the referral tier payout has an upline to walk.
  referrerId?: string | null
}

// In-memory only — same accepted cold-start caveat as the existing
// MidtransRegistry.pendingCheckouts this mirrors (data-store.ts). Worst case
// on a cold start between checkout and verify: verify fails and the user
// retries: fails safe, never silently double-credits or credits the wrong thing.
const pendingContexts: Record<string, PendingPurposeContext> = {}
const pendingCreatedAt: Record<string, number> = {}
const PENDING_CONTEXT_TTL_MS = 24 * 60 * 60 * 1000

export function savePendingContext(orderId: string, ctx: PendingPurposeContext) {
  pendingContexts[orderId] = ctx
  pendingCreatedAt[orderId] = Date.now()
  sweepStalePendingContexts()
}

// A completed checkout is deleted explicitly by /api/payment/verify; this
// covers the far more common case — an abandoned/cancelled/expired checkout
// that never gets verified at all, which would otherwise sit in this
// process-lifetime map forever. Runs opportunistically on every new checkout
// rather than on a timer, so it costs nothing when checkout traffic is idle.
function sweepStalePendingContexts() {
  const cutoff = Date.now() - PENDING_CONTEXT_TTL_MS
  for (const orderId in pendingCreatedAt) {
    if (pendingCreatedAt[orderId] < cutoff) {
      delete pendingContexts[orderId]
      delete pendingCreatedAt[orderId]
    }
  }
}

export function getPendingContext(orderId: string): PendingPurposeContext | null {
  return pendingContexts[orderId] || null
}

// Called once an order is settled (or confirmed already-settled) so this
// process-lifetime map doesn't grow unbounded for the life of a long-running
// server — a no-op on a serverless/cold-start deploy where the entry never
// existed here in the first place.
export function deletePendingContext(orderId: string) {
  delete pendingContexts[orderId]
  delete pendingCreatedAt[orderId]
}

/**
 * Server-side amount for the checkout step. JOIN_FEE and COIN_TOPUP are
 * fixed/derived prices — never trust a client-supplied amount for these, or
 * a checkout could be opened for an arbitrary lower amount. SAVINGS is a
 * genuine user-chosen deposit, same trust model the existing wallet top-up
 * already uses for its own client-supplied amount.
 */
export async function resolveCheckoutAmount(
  purpose: PurposeKey,
  ctx: { communityId: string; jumlahCoin?: number; requestedAmount?: number }
): Promise<{ amount: number; itemName: string }> {
  if (purpose === 'JOIN_FEE') {
    const community = await DataStore.getCommunityByIdStrict(ctx.communityId)
    if (!community) throw new Error('Komunitas tidak ditemukan.')
    const amount = community.joinFee || 0
    if (amount <= 0) throw new Error('Komunitas ini gratis, tidak perlu pembayaran.')
    return { amount, itemName: `Biaya Masuk Komunitas ${community.name}` }
  }

  if (purpose === 'COIN_TOPUP') {
    const jumlahCoin = Math.floor(Number(ctx.jumlahCoin) || 0)
    if (!Number.isFinite(jumlahCoin) || jumlahCoin <= 0) throw new Error('Jumlah coin tidak valid.')
    const community = await DataStore.getCommunityByIdStrict(ctx.communityId)
    if (!community) throw new Error('Komunitas tidak ditemukan.')
    if ((community as any).category !== 'KOPERASI') throw new Error('Hanya Koperasi yang bisa melakukan top up coin.')
    const config: any = await DataStore.getCoinSupplyConfig()
    const rate = config?.coinRateRupiah || 1500
    return { amount: jumlahCoin * rate, itemName: `Top Up ${jumlahCoin} Coin — ${community.name}` }
  }

  // SAVINGS: client-chosen deposit amount, same trust model as wallet top-up —
  // but unlike JOIN_FEE/COIN_TOPUP this purpose had no community/category
  // check at all, letting a checkout be opened against any (or a nonexistent)
  // communityId, including a non-cooperative PERKUMPULAN that shouldn't offer
  // a savings feature in the first place.
  const community = await DataStore.getCommunityByIdStrict(ctx.communityId)
  if (!community) throw new Error('Komunitas tidak ditemukan.')
  // Deliberately checking `type`, not `category`, here: real koperasi
  // communities are seeded as type=KOPERASI/category=PAID, not category=
  // KOPERASI (that combination is effectively unused in production — see the
  // COIN_TOPUP check above, preserved as-is from the original pre-existing
  // action). Using `category` here would lock every real cooperative out of
  // its own savings feature.
  if ((community as any).type !== 'KOPERASI') throw new Error('Hanya Koperasi yang memiliki fitur simpanan.')
  const amount = Math.floor(Number(ctx.requestedAmount) || 0)
  if (!Number.isFinite(amount) || amount < 10000) throw new Error('Minimal setoran adalah Rp 10.000.')
  return { amount, itemName: 'Setoran Simpanan Koperasi' }
}

/**
 * Credits the actual purpose once the gateway confirms payment. `amount` is
 * always the gateway's own confirmed grossAmount, never a client value.
 * Idempotency: JOIN_FEE reuses payCommunityJoinFee's existing isPaid CAS;
 * SAVINGS/COIN_TOPUP pass orderId through to a unique DB column so a
 * replayed verify call hits a constraint violation instead of double-crediting
 * (see the dbOnly bypass on createSavingsTransaction/topupCommunityCoin).
 */
export async function settlePurpose(purpose: PurposeKey, userId: string, amount: number, orderId: string, ctx: PendingPurposeContext) {
  if (purpose === 'JOIN_FEE') {
    return DataStore.payCommunityJoinFee(userId, ctx.communityId, `GATEWAY:${ctx.gatewayId}`, ctx.referrerId)
  }

  if (purpose === 'COIN_TOPUP') {
    const jumlahCoin = ctx.jumlahCoin || 0
    return DataStore.topupCommunityCoin({
      communityId: ctx.communityId,
      ketuaId: userId,
      jumlahCoin,
      totalBiaya: amount,
      description: `Top up ${jumlahCoin} coin via ${ctx.gatewayId} (Rp ${amount.toLocaleString('id-ID')})`,
      orderId
    })
  }

  return DataStore.createSavingsTransaction({
    communityId: ctx.communityId,
    userId,
    type: ctx.savingsType || 'SUKARELA',
    transactionType: 'SETOR',
    amount,
    date: new Date(),
    notes: `Setor mandiri via ${ctx.gatewayId}`,
    createdById: userId,
    orderId
  })
}
