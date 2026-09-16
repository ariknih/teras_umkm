'use server'

import { DataStore } from '@/lib/data-store'
import { db } from '@/lib/db'
import { ensureSuperAdmin } from './admin'
import { logAudit } from '@/lib/audit-log'
import { getCurrentUser } from './auth'
import { validateReferralAllocation, KOPERASI_FIXED_TIER_COINS } from '@/lib/referral-payout'
import { deleteCache } from '@/lib/cache'
import { revalidatePath } from 'next/cache'
import { requireCommunityManager } from '@/lib/auth-guards'

export async function getCommunityReferralConfig(communityId: string) {
  try {
    const community = await DataStore.getCommunityById(communityId)
    if (!community) return { error: 'Komunitas tidak ditemukan.' }

    // Koperasi's affiliate reward is fixed and non-adjustable — no admin form,
    // just the read-only 3/1/1 coin schedule.
    if ((community as any).type === 'KOPERASI') {
      return {
        success: true,
        config: {
          isFixed: true,
          maxTiers: KOPERASI_FIXED_TIER_COINS.length,
          tierCoins: [...KOPERASI_FIXED_TIER_COINS],
          commissionMethod: 'COIN_FIXED'
        }
      }
    }

    let tierPercentages: number[] = [50, 30, 20]
    if (community.tierPercentages) {
      try {
        tierPercentages = JSON.parse(community.tierPercentages)
      } catch (_) {
        tierPercentages = [50, 30, 20]
      }
    }

    return {
      success: true,
      config: {
        joinFee: community.joinFee || 100000,
        referralBudget: community.referralBudget ?? 40000,
        communityProfitShare: community.communityProfitShare ?? 60000,
        maxTiers: community.maxTiers ?? 3,
        tierPercentages,
        isKycRequired: Boolean(community.isKycRequired),
        commissionMethod: community.commissionMethod || 'PERCENTAGE'
      }
    }
  } catch (e: any) {
    return { error: e.message || 'Gagal mengambil konfigurasi referral.' }
  }
}

export async function updateCommunityReferralConfig(data: {
  communityId: string
  joinFee: number
  referralBudget: number
  communityProfitShare: number
  maxTiers: number
  tierPercentages: number[]
  isKycRequired?: boolean
  commissionMethod?: 'PERCENTAGE' | 'NOMINAL'
}) {
  // ponytail: was previously reachable with no auth check at all — anyone
  // could rewrite any community's referral commission split. Gated to the
  // same ketua-or-admin rule used by updateIndukCommunity.
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  try {
    const community = await DataStore.getCommunityById(data.communityId)
    if (!community) return { error: 'Komunitas tidak ditemukan.' }
    if (community.ketuaId !== user.id && user.role !== 'ADMIN') {
      return { error: 'Anda tidak memiliki wewenang untuk mengubah komunitas ini.' }
    }
    // Koperasi's affiliate reward is fixed (3/1/1 coins) and cannot be
    // reconfigured — only Perkumpulan Premium's referral tiers are editable.
    if ((community as any).type === 'KOPERASI') {
      return { error: 'Skema afiliasi Koperasi bersifat tetap (3/1/1 koin per tier) dan tidak dapat diubah.' }
    }
    // Only Perkumpulan Premium (has a join fee) can run affiliate tiers —
    // Reguler is free-to-join, so there is no fee to split across tiers.
    if (!community.joinFee || community.joinFee <= 0) {
      return { error: 'Program afiliasi hanya tersedia untuk Perkumpulan Premium. Aktifkan biaya masuk (join fee) terlebih dahulu.' }
    }
    if (data.maxTiers < 3 || data.maxTiers > 5) {
      return { error: 'Jumlah tier harus antara 3 sampai 5.' }
    }

    // PERCENTAGE tiers must sum to 100%; NOMINAL tiers must sum to the budget
    // itself (computeTierAmount treats a NOMINAL tier value as a raw Rupiah
    // amount, not a percentage — previously unvalidated server-side).
    if (!data.commissionMethod || data.commissionMethod === 'PERCENTAGE') {
      const totalPct = data.tierPercentages.reduce((sum, p) => sum + p, 0)
      if (Math.abs(totalPct - 100) > 0.1) {
        return { error: 'Total persentase persentase tier harus 100%.' }
      }
    } else {
      const totalNominal = data.tierPercentages.reduce((sum, p) => sum + p, 0)
      if (totalNominal !== data.referralBudget) {
        return { error: 'Total nominal tier harus sama dengan Total Alokasi Dana Referral.' }
      }
    }

    const allocationError = validateReferralAllocation(data.joinFee, data.referralBudget, data.communityProfitShare, true)
    if (allocationError) return { error: allocationError }

    const updated = await DataStore.updateCommunityReferralConfig({
      communityId: data.communityId,
      joinFee: data.joinFee,
      referralBudget: data.referralBudget,
      communityProfitShare: data.communityProfitShare,
      maxTiers: data.maxTiers,
      tierPercentages: JSON.stringify(data.tierPercentages)
    })

    if (data.isKycRequired !== undefined || data.commissionMethod !== undefined) {
      await DataStore.updateCommunity(data.communityId, {
        name: updated.name,
        ...(data.isKycRequired !== undefined ? { isKycRequired: data.isKycRequired } : {}),
        ...((data.commissionMethod !== undefined) ? { commissionMethod: data.commissionMethod } : {})
      })
    }
    await logAudit({
      actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'UPDATE_COMMUNITY_REFERRAL_CONFIG',
      module: 'COOPERATIVE',
      targetId: data.communityId,
      targetType: 'COMMUNITY',
      detail: `Join fee Rp ${data.joinFee.toLocaleString('id-ID')}, ${data.maxTiers} tier.`
    })

    // This just changed community.joinFee (the field that decides Perkumpulan
    // Premium status) in the DB — the cached getIndukCommunityDetail() read
    // must not keep serving the pre-save value, or the client's next
    // loadData() resets its local joinFee and a subsequent "Simpan
    // Pengaturan" resends the stale value, wiping Premium status back out.
    // Also busts the induk LIST cache and the CMS admin's separate
    // unstable_cache (allCommunities) — without the latter, a referral
    // config edited from the front page keeps showing its old values in the
    // CMS for up to that cache's TTL, exactly the "not 1:1" gap this closes.
    deleteCache(`community:induk:${data.communityId}`)
    deleteCache('community:induk:all')
    revalidatePath(`/community/${data.communityId}`)
    revalidatePath('/cms_admin', 'layout')

    return { success: true, updated }
  } catch (e: any) {
    return { error: e.message || 'Gagal menyimpan konfigurasi referral.' }
  }
}

export async function getCommunityReferralHistory(communityId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }
  try {
    // The community-wide payout ledger (incl. Kas Komunitas amounts) is
    // ketua/admin-only; members read their own slice via
    // getMyCommunityAffiliateSummary. Previously this had no check at all.
    await requireCommunityManager(user as any, communityId)
    const logs = await DataStore.getCommunityReferralLogs(communityId)
    return { success: true, logs }
  } catch (e: any) {
    return { error: e.message || 'Gagal mengambil histori referral downline.' }
  }
}

// A member's own affiliate view for one community: their referral link's
// downline tree and every tier payout they personally received — the
// per-member counterpart to the ketua-only getCommunityReferralHistory above.
export async function getMyCommunityAffiliateSummary(communityId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  try {
    const community = await DataStore.getCommunityById(communityId)
    if (!community) return { error: 'Komunitas tidak ditemukan.' }

    const [logs, downline] = await Promise.all([
      DataStore.getMyCommunityReferralLogs(communityId, user.id),
      DataStore.getCommunityAffiliateDownline(communityId, user.id)
    ])

    const isKoperasi = (community as any).type === 'KOPERASI'
    const totalEarned = (logs || [])
      .filter((l: any) => l.recipientType === 'REFERRER')
      .reduce((sum: number, l: any) => sum + Number(l.amount || 0), 0)

    return {
      success: true,
      unit: isKoperasi ? 'KOIN' : 'RUPIAH',
      totalEarned,
      logs: logs || [],
      downline: downline || []
    }
  } catch (e: any) {
    return { error: e.message || 'Gagal mengambil data afiliasi Anda.' }
  }
}

// ponytail: was previously exported with no auth check at all — every referral
// payout in normal flow already happens inside payCommunityJoinFee/createOrder,
// this manual trigger is for a super admin to reprocess one, not for client use.
// It bypasses the isPaid compare-and-swap those two paths use, so every call
// pays out again regardless of prior payouts — `force` must be explicit so a
// replay is never triggered by accident.
export async function processMultiTierReferralPayout(communityId: string, buyerId: string, totalFee: number, force: boolean) {
  const admin = await ensureSuperAdmin()
  if (!force) return { error: 'Konfirmasi force=true diperlukan untuk memproses ulang komisi referral secara manual.' }
  try {
    const res = await DataStore.processMultiTierCommunityReferral({ communityId, buyerId, totalFee })
    await logAudit({
      actor: 'ADMIN',
      actorId: admin.id,
      actorName: admin.name || admin.email,
      action: 'PROCESS_MULTI_TIER_REFERRAL_PAYOUT',
      module: 'WALLET',
      targetId: communityId,
      targetType: 'COMMUNITY',
      detail: `Reprocess komisi referral untuk pembeli #${buyerId}, total fee Rp ${totalFee.toLocaleString('id-ID')}.`
    })
    return { success: true, res }
  } catch (e: any) {
    return { error: e.message || 'Gagal memproses pembagian komisi referral.' }
  }
}
