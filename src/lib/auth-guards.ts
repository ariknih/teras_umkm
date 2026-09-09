import { getCurrentUser } from '@/app/actions/auth'
import { DataStore } from '@/lib/data-store'

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
