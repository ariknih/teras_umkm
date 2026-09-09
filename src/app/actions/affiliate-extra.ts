'use server'

import { DataStore } from '@/lib/data-store'
import { getCurrentUser } from './auth'
import { logAudit } from '@/lib/audit-log'
import { revalidatePath } from 'next/cache'

export async function createCustomAffiliateLink(productId: string, customSlug: string, source: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }
  if (!productId || !customSlug) return { error: 'Semua kolom harus diisi.' }
  
  try {
    const link = await DataStore.createCustomAffiliateLink(user.id, productId, customSlug, source)
    revalidatePath('/affiliate')
    return { success: true, link }
  } catch (e: any) {
    return { error: e.message || 'Gagal membuat link affiliate kustom.' }
  }
}

export async function getCustomAffiliateLinks() {
  const user = await getCurrentUser()
  if (!user) return []
  return await DataStore.getCustomAffiliateLinks(user.id)
}

export async function trackAffiliateClick(slug: string, source: string = 'direct') {
  try {
    const link = await DataStore.trackAffiliateClick(slug, source)
    return { success: true, link }
  } catch (e: any) {
    return { error: e.message || 'Gagal mencatat klik.' }
  }
}

export async function upgradeMembershipAccess(targetAccess: 'Platinum' | 'Diamond') {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }
  if (targetAccess !== 'Platinum' && targetAccess !== 'Diamond') {
    return { error: 'Tingkat akses tidak valid.' }
  }
  
  try {
    const updatedUser = await DataStore.upgradeMembershipAccess(user.id, targetAccess)
    await logAudit({
      actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'UPGRADE_MEMBERSHIP_ACCESS',
      module: 'WALLET',
      targetId: user.id,
      targetType: 'USER',
      detail: `Upgrade akses keanggotaan menjadi ${targetAccess}.`
    })
    revalidatePath('/affiliate')
    revalidatePath('/academy')
    return { success: true, user: updatedUser }
  } catch (e: any) {
    return { error: e.message || 'Gagal upgrade keanggotaan.' }
  }
}

export async function getAffiliateLeaderboard() {
  return await DataStore.getAffiliateLeaderboard()
}

export async function getAffiliateDownline() {
  const user = await getCurrentUser()
  if (!user) return []
  return await DataStore.getAffiliateDownline(user.id)
}

export async function getReminders() {
  const user = await getCurrentUser()
  if (!user) return []
  return await DataStore.getReminders(user.id)
}
