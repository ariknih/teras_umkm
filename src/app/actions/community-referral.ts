'use server'

import { DataStore } from '@/lib/data-store'
import { db } from '@/lib/db'

export async function getCommunityReferralConfig(communityId: string) {
  try {
    const community = await DataStore.findCommunityById(communityId)
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
}) {
  try {
    if (data.maxTiers < 3 || data.maxTiers > 5) {
      return { error: 'Jumlah tier harus antara 3 sampai 5.' }
    }

    const totalPct = data.tierPercentages.reduce((sum, p) => sum + p, 0)
    if (Math.abs(totalPct - 100) > 0.1) {
      return { error: 'Total persentase persentase tier harus 100%.' }
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

export async function processMultiTierReferralPayout(communityId: string, buyerId: string, totalFee: number) {
  try {
    const res = await DataStore.processMultiTierCommunityReferral({ communityId, buyerId, totalFee })
    return { success: true, res }
  } catch (e: any) {
    return { error: e.message || 'Gagal memproses pembagian komisi referral.' }
  }
}
