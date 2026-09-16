'use server'

import { DataStore } from '@/lib/data-store'
import { getCurrentUser } from './auth'
import { logAudit } from '@/lib/audit-log'
import { revalidatePath } from 'next/cache'
import { canActCommunityFinance, canViewCommunityFinance } from '@/app/cms_admin/admin-types'

// Community wallet (Kas Komunitas / Kas Koperasi) + platform revenue ledger.
// Applies to every community type and tier (Perkumpulan Reguler/Premium,
// Koperasi Reguler/Premium/Max) — any of them can receive the marketplace 10%.

const MIN_WITHDRAWAL = 10000

async function loadAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') return null
  return (await DataStore.findUserById(user.id)) as any
}

async function denied(action: string, user: any, detail: string) {
  await logAudit({ actor: 'MEMBER', actorId: user?.id || 'anonymous', actorName: user?.name || user?.email || undefined, action, module: 'AUTH', detail })
}

// Read access: superadmin (oversight) or a FINANCIAL admin. Re-read from the DB.
async function ensureFinanceViewer() {
  const admin = await loadAdmin()
  if (!canViewCommunityFinance(admin)) {
    await denied('COMMUNITY_FINANCE_VIEW_DENIED', admin, 'Bukan Superadmin / Admin Financial.')
    throw new Error('Unauthorized: Hanya Admin Financial.')
  }
  return admin
}

// Write access: FINANCIAL admin only — the superadmin is deliberately excluded.
async function ensureFinanceAdmin() {
  const admin = await loadAdmin()
  if (!canActCommunityFinance(admin)) {
    await denied('COMMUNITY_FINANCE_ACTION_DENIED', admin, 'Hanya Admin Financial yang dapat memproses keuangan komunitas.')
    throw new Error('Unauthorized: Hanya Admin Financial yang dapat memproses keuangan komunitas.')
  }
  return admin
}

// Strictly the community's ketua (not any ADMIN): Kas belongs to the community
// and only its ketua may request money out of it.
async function ensureKetua(communityId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Anda harus masuk terlebih dahulu.')
  const community = await DataStore.getCommunityById(communityId)
  if (!community) throw new Error('Komunitas tidak ditemukan.')
  if (community.ketuaId !== user.id) throw new Error('Hanya Ketua Komunitas yang dapat mengakses Kas Komunitas.')
  return { user, community }
}

// ─── Ketua (front page) ────────────────────────────────────────────────────

export async function getCommunityWalletAction(communityId: string) {
  try {
    await ensureKetua(communityId)
    const [wallet, withdrawals] = await Promise.all([
      DataStore.getCommunityWallet(communityId),
      DataStore.getCommunityWithdrawals({ communityId })
    ])
    return { success: true, wallet, withdrawals }
  } catch (e: any) {
    return { error: e.message || 'Gagal memuat Kas Komunitas.' }
  }
}

export async function requestCommunityWithdrawalAction(communityId: string, input: { amount: number; bankName: string; accountNumber: string; accountName: string }) {
  try {
    const { user, community } = await ensureKetua(communityId)
    const amount = Number(input?.amount)
    const bankName = String(input?.bankName || '').trim()
    const accountNumber = String(input?.accountNumber || '').trim()
    const accountName = String(input?.accountName || '').trim()

    if (!Number.isInteger(amount) || amount < MIN_WITHDRAWAL) {
      return { error: `Nominal penarikan minimal Rp ${MIN_WITHDRAWAL.toLocaleString('id-ID')} dan harus bilangan bulat.` }
    }
    if (!bankName || !accountNumber || !accountName) {
      return { error: 'Nama bank, nomor rekening, dan nama pemilik rekening wajib diisi.' }
    }
    if (!/^[0-9]{5,20}$/.test(accountNumber)) {
      return { error: 'Nomor rekening hanya boleh berisi 5-20 digit angka.' }
    }
    if (bankName.length > 60 || accountName.length > 100) {
      return { error: 'Nama bank atau nama pemilik rekening terlalu panjang.' }
    }

    const withdrawal = await DataStore.requestCommunityWithdrawal({ communityId, requestedById: user.id, amount, bankName, accountNumber, accountName })
    await logAudit({
      actor: 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'REQUEST_COMMUNITY_WITHDRAWAL',
      module: 'COMMUNITY_FINANCE',
      targetId: withdrawal.id,
      targetType: 'COMMUNITY_WITHDRAWAL',
      detail: `Permintaan tarik Kas ${community.name} Rp ${amount.toLocaleString('id-ID')} ke ${bankName} ${accountNumber}.`
    })
    revalidatePath(`/community/${communityId}`)
    revalidatePath('/cms_admin', 'layout')
    return { success: true, withdrawal }
  } catch (e: any) {
    return { error: e.message || 'Gagal mengajukan penarikan Kas.' }
  }
}

// ─── Finance Admin (CMS) ───────────────────────────────────────────────────

export async function getPlatformRevenueAction() {
  await ensureFinanceViewer()
  return DataStore.getPlatformRevenue()
}

export async function getCommunityWalletBalancesAction() {
  await ensureFinanceViewer()
  return DataStore.getAllCommunityWalletBalances()
}

export async function getCommunityWithdrawalsAction(status?: string) {
  await ensureFinanceViewer()
  return DataStore.getCommunityWithdrawals({ status })
}

export async function processCommunityWithdrawalAction(id: string, decision: 'PAID' | 'REJECTED', note?: string, transferRef?: string) {
  try {
    const admin = await ensureFinanceAdmin()
    if (decision !== 'PAID' && decision !== 'REJECTED') return { error: 'Keputusan tidak valid.' }
    const cleanNote = String(note || '').trim().slice(0, 300)
    const cleanRef = String(transferRef || '').trim().slice(0, 100)
    if (decision === 'REJECTED' && !cleanNote) return { error: 'Alasan penolakan wajib diisi.' }
    if (decision === 'PAID' && !cleanRef) return { error: 'Nomor referensi transfer wajib diisi.' }

    const row: any = await DataStore.processCommunityWithdrawal(id, admin.id, decision, cleanNote, cleanRef)
    await logAudit({
      actor: 'ADMIN',
      actorId: admin.id,
      actorName: admin.name || admin.email,
      action: decision === 'PAID' ? 'APPROVE_COMMUNITY_WITHDRAWAL' : 'REJECT_COMMUNITY_WITHDRAWAL',
      module: 'COMMUNITY_FINANCE',
      targetId: id,
      targetType: 'COMMUNITY_WITHDRAWAL',
      detail: `${decision} Rp ${Number(row?.amount || 0).toLocaleString('id-ID')} — ${row?.community?.name || row?.communityId}${cleanRef ? ` (ref ${cleanRef})` : ''}${cleanNote ? `: ${cleanNote}` : ''}`
    })
    if (row?.community?.ketuaId) {
      try {
        await DataStore.createNotification(
          row.community.ketuaId,
          decision === 'PAID' ? 'COMMUNITY_WITHDRAWAL_PAID' : 'COMMUNITY_WITHDRAWAL_REJECTED',
          decision === 'PAID' ? 'Penarikan Kas Berhasil' : 'Penarikan Kas Ditolak',
          decision === 'PAID'
            ? `Penarikan Kas "${row.community.name}" sebesar Rp ${Number(row.amount).toLocaleString('id-ID')} telah ditransfer (ref: ${cleanRef}).`
            : `Penarikan Kas "${row.community.name}" sebesar Rp ${Number(row.amount).toLocaleString('id-ID')} ditolak: ${cleanNote}. Dana dikembalikan ke Kas.`,
          `/community/${row.community.id}`
        )
      } catch (err) {
        console.error('Error creating community-withdrawal notification:', err)
      }
      revalidatePath(`/community/${row.community.id}`)
    }
    revalidatePath('/cms_admin', 'layout')
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal memproses penarikan Kas.' }
  }
}
