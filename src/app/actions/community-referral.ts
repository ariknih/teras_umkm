'use server'

import { DataStore } from '@/lib/data-store'
import { db } from '@/lib/db'
import { ensureSuperAdmin } from './admin'
import { logAudit } from '@/lib/audit-log'
import { getCurrentUser } from './auth'

export async function getCommunityReferralConfig(communityId: string) {
  try {
    const community = await DataStore.getCommunityById(communityId)
    if (!community) return { error: 'Komunitas tidak ditemukan.' }

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
        commissionMethod: (community as any).commissionMethod || 'PERCENTAGE'
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
    // Enforce max 2 tier untuk KOPERASI
    const community = await DataStore.getCommunityById(data.communityId)
    if (!community) return { error: 'Komunitas tidak ditemukan.' }
    if (community.ketuaId !== user.id && user.role !== 'ADMIN') {
      return { error: 'Anda tidak memiliki wewenang untuk mengubah komunitas ini.' }
    }
    if ((community as any).category === 'KOPERASI') {
      if (data.maxTiers > 2) {
        return { error: 'Koperasi hanya bisa memiliki maksimal 2 tier referral.' }
      }
      if (data.maxTiers < 1) {
        return { error: 'Minimal 1 tier diperlukan.' }
      }
    } else {
      if (data.maxTiers < 3 || data.maxTiers > 5) {
        return { error: 'Jumlah tier harus antara 3 sampai 5.' }
      }
    }

    // Only enforce 100% for PERCENTAGE mode
    if (!data.commissionMethod || data.commissionMethod === 'PERCENTAGE') {
      const totalPct = data.tierPercentages.reduce((sum, p) => sum + p, 0)
      if (Math.abs(totalPct - 100) > 0.1) {
        return { error: 'Total persentase persentase tier harus 100%.' }
      }
    }

    if (data.referralBudget + data.communityProfitShare > data.joinFee) {
      return { error: 'Alokasi dana referral dan kas komunitas melebihi harga masuk.' }
    }

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
        ...((data.commissionMethod !== undefined) ? { commissionMethod: data.commissionMethod } as any : {})
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

    return { success: true, updated }
  } catch (e: any) {
    return { error: e.message || 'Gagal menyimpan konfigurasi referral.' }
  }
}

export async function getCommunityReferralHistory(communityId: string) {
  try {
    const logs = await DataStore.getCommunityReferralLogs(communityId)
    return { success: true, logs }
  } catch (e: any) {
    return { error: e.message || 'Gagal mengambil histori referral downline.' }
  }
}

// ponytail: was previously exported with no auth check at all — every referral
// payout in normal flow already happens inside payCommunityJoinFee/createOrder,
// this manual trigger is for a super admin to reprocess one, not for client use.
export async function processMultiTierReferralPayout(communityId: string, buyerId: string, totalFee: number) {
  const admin = await ensureSuperAdmin()
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
