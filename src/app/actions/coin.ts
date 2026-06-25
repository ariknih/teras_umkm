'use server'

import { DataStore } from '@/lib/data-store'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'

// ═══════════════════════════════════════════════════════════════════════════
// Coin Queries
// ═══════════════════════════════════════════════════════════════════════════

export async function getUserCoinBalance() {
  const user = await getCurrentUser()
  if (!user) return 0
  return await DataStore.getUserCoinBalance(user.id)
}

export async function getCoinTransactionHistory() {
  const user = await getCurrentUser()
  if (!user) return []
  return await DataStore.getCoinTransactions(user.id)
}

export async function getCommunityCoinBalance(communityId: string) {
  const user = await getCurrentUser()
  if (!user) return null
  return await DataStore.getCommunityCoinBalance(communityId)
}

export async function getCoinVouchers() {
  return await DataStore.getActiveCoinVouchers()
}

export async function getUserRedemptions() {
  const user = await getCurrentUser()
  if (!user) return []
  return await DataStore.getUserCoinRedemptions(user.id)
}

// ═══════════════════════════════════════════════════════════════════════════
// Topup Coin Komunitas (Hanya Ketua)
// Rate: 1 coin = Rp 1.500
// ═══════════════════════════════════════════════════════════════════════════

export async function topupCommunityCoin(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const communityId = formData.get('communityId') as string
  const jumlahCoinStr = formData.get('jumlahCoin') as string

  if (!communityId || !jumlahCoinStr) {
    return { error: 'Data tidak lengkap.' }
  }

  const jumlahCoin = parseFloat(jumlahCoinStr)
  if (isNaN(jumlahCoin) || jumlahCoin <= 0) {
    return { error: 'Jumlah coin tidak valid.' }
  }

  // Cek apakah user adalah Ketua komunitas ini
  const community = await DataStore.getCommunityById(communityId)
  if (!community) return { error: 'Komunitas tidak ditemukan.' }
  if (community.ketuaId !== user.id && user.role !== 'ADMIN') {
    return { error: 'Hanya Ketua Komunitas yang bisa top up coin.' }
  }

  const totalBiaya = jumlahCoin * 1500 // 1 coin = Rp 1.500

  try {
    const result = await DataStore.topupCommunityCoin({
      communityId,
      ketuaId: user.id,
      jumlahCoin,
      totalBiaya,
      description: `Top up ${jumlahCoin} coin oleh Ketua — Biaya Rp ${totalBiaya.toLocaleString('id-ID')}`
    })

    revalidatePath(`/community/${communityId}`)
    revalidatePath('/community')
    revalidatePath('/admin')
    return { success: true, ...result }
  } catch (e: any) {
    return { error: e.message || 'Gagal melakukan top up coin.' }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Reward Undangan User Baru (+1 coin otomatis untuk pengundang)
// Dipanggil internal setelah registrasi berhasil
// ═══════════════════════════════════════════════════════════════════════════

export async function rewardUserInvite(referrerId: string, referredId: string) {
  try {
    const result = await DataStore.rewardUserInviteCoin({
      referrerId,
      referredId,
      coinAmount: 1.0,
    })
    return { success: true, ...result }
  } catch (e: any) {
    return { error: e.message || 'Gagal memberikan reward coin.' }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Reward Merchant Invite — Merchant undang merchant ke komunitas sama
// PERKUMPULAN → dapat COIN
// KOPERASI    → dapat SALDO WALLET (dari kas koperasi)
// ═══════════════════════════════════════════════════════════════════════════

export async function rewardMerchantInvite(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const inviteeId = formData.get('inviteeId') as string
  const communityId = formData.get('communityId') as string

  if (!inviteeId || !communityId) {
    return { error: 'Data tidak lengkap.' }
  }

  try {
    const result = await DataStore.rewardMerchantInvite({
      inviterId: user.id,
      inviteeId,
      communityId,
    })

    revalidatePath('/wallet/coin')
    revalidatePath('/wallet')
    return { success: true, ...result }
  } catch (e: any) {
    return { error: e.message || 'Gagal memberikan reward merchant invite.' }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Tukar Coin dengan Voucher
// ═══════════════════════════════════════════════════════════════════════════

export async function redeemCoinVoucher(voucherId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const voucher = await DataStore.getCoinVoucherById(voucherId)
  if (!voucher) return { error: 'Voucher tidak ditemukan.' }
  if (!voucher.isActive) return { error: 'Voucher sudah tidak aktif.' }

  if (voucher.validUntil && new Date(voucher.validUntil) < new Date()) {
    return { error: 'Voucher sudah kedaluwarsa.' }
  }

  if (voucher.maxRedemption > 0 && voucher.totalRedeemed >= voucher.maxRedemption) {
    return { error: 'Voucher sudah habis (stok redemption penuh).' }
  }

  const userBalance = await DataStore.getUserCoinBalance(user.id)
  if (userBalance < voucher.coinCost) {
    return { error: `Coin tidak cukup. Anda punya ${userBalance} coin, dibutuhkan ${voucher.coinCost} coin.` }
  }

  try {
    const result = await DataStore.redeemCoinVoucher({
      userId: user.id,
      voucherId,
      coinSpent: voucher.coinCost,
      voucherType: voucher.type,
      externalCode: voucher.code || undefined,
    })

    revalidatePath('/wallet/coin')
    revalidatePath('/voucher')
    return { success: true, ...result }
  } catch (e: any) {
    return { error: e.message || 'Gagal menukar coin dengan voucher.' }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN: Kelola Voucher
// ═══════════════════════════════════════════════════════════════════════════

export async function createCoinVoucherAdmin(formData: FormData) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    return { error: 'Hanya Admin yang bisa membuat voucher.' }
  }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const type = (formData.get('type') as string) || 'INTERNAL'
  const coinCostStr = formData.get('coinCost') as string
  const valueStr = formData.get('value') as string
  const code = formData.get('code') as string || undefined
  const maxRedemptionStr = formData.get('maxRedemption') as string
  const validUntilStr = formData.get('validUntil') as string

  if (!name || !description || !coinCostStr || !valueStr) {
    return { error: 'Nama, deskripsi, biaya coin, dan nilai voucher wajib diisi.' }
  }

  const coinCost = parseFloat(coinCostStr)
  const value = parseFloat(valueStr)
  const maxRedemption = parseInt(maxRedemptionStr || '0')

  if (isNaN(coinCost) || coinCost <= 0) return { error: 'Biaya coin tidak valid.' }
  if (isNaN(value) || value <= 0) return { error: 'Nilai voucher tidak valid.' }

  try {
    const voucher = await DataStore.createCoinVoucher({
      name,
      description,
      type: type as 'INTERNAL' | 'EXTERNAL',
      coinCost,
      value,
      code,
      maxRedemption,
      validUntil: validUntilStr ? new Date(validUntilStr) : undefined,
    })
    revalidatePath('/voucher')
    revalidatePath('/admin')
    return { success: true, voucher }
  } catch (e: any) {
    return { error: e.message || 'Gagal membuat voucher.' }
  }
}

export async function toggleCoinVoucherActive(voucherId: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    return { error: 'Hanya Admin yang bisa mengubah status voucher.' }
  }

  try {
    const result = await DataStore.toggleCoinVoucherActive(voucherId)
    revalidatePath('/voucher')
    revalidatePath('/admin')
    return { success: true, ...result }
  } catch (e: any) {
    return { error: e.message || 'Gagal mengubah status voucher.' }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Cek apakah komunitas bisa mengajukan pinjaman (coinBalance >= minCoinForLoan)
// ═══════════════════════════════════════════════════════════════════════════

export async function checkCommunityLoanEligibility(communityId: string) {
  const community = await DataStore.getCommunityById(communityId)
  if (!community) return { eligible: false, message: 'Komunitas tidak ditemukan.' }

  const coinBalance = (community as any).coinBalance || 0
  const minCoin = (community as any).minCoinForLoan || 1000

  if (coinBalance >= minCoin) {
    return {
      eligible: true,
      coinBalance,
      minCoin,
      message: `Komunitas memiliki ${coinBalance} coin. Akses pinjaman tersedia.`
    }
  }

  return {
    eligible: false,
    coinBalance,
    minCoin,
    message: `Komunitas perlu minimal ${minCoin} coin untuk membuka akses pinjaman. Saat ini: ${coinBalance} coin.`
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Admin Stats
// ═══════════════════════════════════════════════════════════════════════════

export async function getCoinAdminStats() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') return null
  return await DataStore.getCoinAdminStats()
}
