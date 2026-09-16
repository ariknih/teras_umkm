import { getCurrentUser } from '@/app/actions/auth'
import { DataStore } from '@/lib/data-store'
import { summarizeMemberSavings } from '@/lib/money'

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) throw new Error('Anda harus masuk terlebih dahulu.')
  return user
}

// Mirrors the pattern already used correctly in coin.ts/community.ts: fetch
// the community fresh from the DB and check its real ketuaId — never trust
// a client-supplied communityId as proof of management.
export async function requireCommunityManager(user: { id: string; role: string }, communityId: string) {
  const community = await DataStore.getCommunityById(communityId)
  if (!community) throw new Error('Komunitas tidak ditemukan.')
  if (community.ketuaId !== user.id && user.role !== 'ADMIN') {
    throw new Error('Anda tidak memiliki wewenang untuk komunitas ini.')
  }
  return community
}

// Non-throwing form for read-path branching (e.g. deciding which fields to
// return), where a denial should change behavior rather than abort.
export async function isCommunityManager(user: { id: string; role: string } | null, communityId: string) {
  if (!user) return false
  if (user.role === 'ADMIN') return true
  const community = await DataStore.getCommunityById(communityId)
  return community?.ketuaId === user.id
}

// Trust-boundary check for any member savings deposit (DOKU checkout or Saldo
// Wallet) — every one now credits Kas Koperasi. Koperasi only (all tiers), the
// payer must be an active paid member, and Simpanan Pokok is paid once: the
// paid join already records it, so a second Pokok deposit is refused.
// Returns an error message, or null when the deposit is allowed.
export async function checkSavingsDeposit(userId: string, communityId: string, savingsType?: string | null): Promise<string | null> {
  const community: any = await DataStore.getCommunityById(communityId)
  if (!community) return 'Komunitas tidak ditemukan.'
  if (community.type !== 'KOPERASI') return 'Hanya Koperasi yang memiliki fitur simpanan.'
  if (!(await DataStore.isCommunityMember(userId, communityId))) return 'Hanya anggota aktif Koperasi yang dapat menyetor simpanan.'
  if (savingsType === 'POKOK') {
    const rows = await DataStore.getSavingsTransactions(communityId, userId)
    const required = Number(community.simpananPokok) || 0
    if (summarizeMemberSavings(rows || []).pokok >= required && required > 0) return 'Simpanan Pokok Anda sudah lunas.'
  }
  return null
}
