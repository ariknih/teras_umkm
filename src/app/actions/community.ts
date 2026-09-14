'use server'

import { DataStore } from '@/lib/data-store'
import { db } from '@/lib/db'
import { getCurrentUser } from './auth'
import { logAudit } from '@/lib/audit-log'
import { revalidatePath } from 'next/cache'
import { cacheWrap, invalidateCachePattern, deleteCache } from '@/lib/cache'
import { requireCommunityManager } from '@/lib/auth-guards'
import { validateReferralAllocation, readCommunityReferralCookie } from '@/lib/referral-payout'
import { getDisabledModulesForTemplate } from '@/lib/community-templates'
import { cookies } from 'next/headers'

export async function getPosts(groupId?: string) {
  const key = `community:posts:${groupId || 'all'}`
  return await cacheWrap(key, () => DataStore.getPosts(groupId), 60)
}

export async function getPostById(id: string) {
  return await cacheWrap(`community:post:${id}`, () => DataStore.getPostById(id), 120)
}

export async function createPost(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }
  
  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const category = formData.get('category') as string || undefined
  const imageUrl = formData.get('imageUrl') as string || undefined
  const videoUrl = formData.get('videoUrl') as string || undefined
  const groupId = formData.get('groupId') as string || undefined
  
  if (!title || !content) {
    return { error: 'Judul dan konten diskusi wajib diisi.' }
  }
  
  try {
    const post = await DataStore.createPost(user.id, title, content, category, imageUrl, videoUrl, groupId)
    revalidatePath('/community')
    if (groupId) {
      revalidatePath(`/community?groupId=${groupId}`)
    }
    return { success: true, post }
  } catch (e: any) {
    return { error: e.message || 'Gagal membuat diskusi.' }
  }
}

export async function createComment(postId: string, content: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }
  if (!content) return { error: 'Konten komentar tidak boleh kosong.' }
  
  try {
    const comment = await DataStore.createComment(user.id, postId, content)
    revalidatePath('/community')
    revalidatePath(`/community/post/${postId}`)
    return { success: true, comment }
  } catch (e: any) {
    return { error: e.message || 'Gagal menambahkan komentar.' }
  }
}

export async function toggleLikePost(postId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }
  
  try {
    const res = await DataStore.toggleLikePost(user.id, postId)
    revalidatePath('/community')
    return { success: true, ...res }
  } catch (e: any) {
    return { error: e.message || 'Gagal mengubah status suka.' }
  }
}

export async function getCommunityMembers(groupId?: string) {
  return await DataStore.getCommunityMembers(groupId)
}

// GROUP-SPECIFIC ACTIONS
export async function getGroups() {
  return await cacheWrap('community:groups:all', () => DataStore.getGroups(), 180)
}

export async function getGroupById(id: string) {
  return await cacheWrap(`community:group:${id}`, () => DataStore.getGroupById(id), 180)
}

export async function createGroup(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const avatarUrl = formData.get('avatarUrl') as string || undefined
  const coverUrl = formData.get('coverUrl') as string || undefined

  if (!name || !description) {
    return { error: 'Nama dan deskripsi komunitas wajib diisi.' }
  }

  try {
    const group = await DataStore.createGroup(user.id, name, description, avatarUrl, coverUrl)
    await logAudit({
      actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'CREATE_GROUP',
      module: 'COOPERATIVE',
      targetId: group.id,
      targetType: 'COMMUNITY',
      detail: `Komunitas "${name}".`
    })
    await invalidateCachePattern('community:groups:')
    revalidatePath('/community')
    return { success: true, group }
  } catch (e: any) {
    return { error: e.message || 'Gagal membuat komunitas.' }
  }
}

export async function toggleJoinGroup(groupId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  try {
    const res: any = await DataStore.toggleJoinGroup(user.id, groupId)
    await logAudit({
      actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'TOGGLE_JOIN_GROUP',
      module: 'COOPERATIVE',
      targetId: groupId,
      targetType: 'COMMUNITY',
      detail: res?.joined ? 'Bergabung.' : 'Keluar.'
    })
    revalidatePath('/community')
    revalidatePath(`/community?groupId=${groupId}`)
    return { success: true, ...res }
  } catch (e: any) {
    return { error: e.message || 'Gagal merubah status keanggotaan.' }
  }
}

export async function isGroupMember(groupId: string) {
  const user = await getCurrentUser()
  if (!user) return false
  return await DataStore.isGroupMember(user.id, groupId)
}

export async function toggleSuspendGroup(groupId: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    return { error: 'Hanya Super Admin yang dapat menangguhkan komunitas.' }
  }

  try {
    const res: any = await DataStore.toggleSuspendGroup(groupId)
    await logAudit({
      actor: 'ADMIN',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'TOGGLE_SUSPEND_GROUP',
      module: 'COOPERATIVE',
      targetId: groupId,
      targetType: 'COMMUNITY',
      detail: `Status suspend komunitas menjadi ${res?.isSuspended ? 'DISUSPEND' : 'AKTIF'}.`
    })
    revalidatePath('/community')
    revalidatePath(`/community?groupId=${groupId}`)
    return { success: true, group: res }
  } catch (e: any) {
    return { error: e.message || 'Gagal merubah status komunitas.' }
  }
}

export async function deletePostAction(postId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const post = await DataStore.getPostById(postId)
  if (!post) return { error: 'Postingan tidak ditemukan.' }

  let allowed = user.role === 'ADMIN' || post.authorId === user.id
  if (!allowed && post.groupId) {
    const group = await DataStore.getGroupById(post.groupId)
    if (group && group.adminId === user.id) {
      allowed = true
    }
  }

  if (!allowed) {
    return { error: 'Anda tidak memiliki wewenang untuk menghapus postingan ini.' }
  }

  try {
    await DataStore.deletePost(postId)
    if (post.authorId !== user.id) {
      // Only a moderation deletion (not the author cleaning up their own post) is audit-worthy.
      await logAudit({
        actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
        actorId: user.id,
        actorName: user.name || user.email,
        action: 'DELETE_POST_MODERATION',
        module: 'COOPERATIVE',
        targetId: postId,
        targetType: 'POST',
        detail: `Hapus postingan milik #${post.authorId}.`
      })
    }
    revalidatePath('/community')
    if (post.groupId) {
      revalidatePath(`/community?groupId=${post.groupId}`)
    }
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal menghapus postingan.' }
  }
}

export async function deleteCommentAction(commentId: string, postId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const post = await DataStore.getPostById(postId)
  if (!post) return { error: 'Postingan tidak ditemukan.' }

  const comment = post.comments.find((c: any) => c.id === commentId)
  if (!comment) return { error: 'Komentar tidak ditemukan.' }

  let allowed = user.role === 'ADMIN' || comment.authorId === user.id
  if (!allowed && post.groupId) {
    const group = await DataStore.getGroupById(post.groupId)
    if (group && group.adminId === user.id) {
      allowed = true
    }
  }

  if (!allowed) {
    return { error: 'Anda tidak memiliki wewenang untuk menghapus komentar ini.' }
  }

  try {
    await DataStore.deleteComment(commentId)
    if (comment.authorId !== user.id) {
      // Only a moderation deletion (not the author cleaning up their own comment) is audit-worthy.
      await logAudit({
        actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
        actorId: user.id,
        actorName: user.name || user.email,
        action: 'DELETE_COMMENT_MODERATION',
        module: 'COOPERATIVE',
        targetId: commentId,
        targetType: 'COMMENT',
        detail: `Hapus komentar milik #${comment.authorId}.`
      })
    }
    revalidatePath('/community')
    revalidatePath(`/community/post/${postId}`)
    if (post.groupId) {
      revalidatePath(`/community?groupId=${post.groupId}`)
    }
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal menghapus komentar.' }
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// INDUK COMMUNITY ACTIONS (Revisi Pert Keempat)
// ═══════════════════════════════════════════════════════════════════════════

export async function getIndukCommunities() {
  return await cacheWrap('community:induk:all', () => DataStore.getCommunities(), 60)
}

// ponytail: no cacheWrap on per-community detail / roster / user-role reads.
// lib/cache.ts is a per-instance Map (no Upstash), so on Vercel a write's
// deleteCache only clears one instance and the rest keep serving pre-join
// rosters and pre-save joinFee for the TTL. These are single indexed queries;
// re-add caching behind Upstash if DB load ever demands it.
export async function getIndukCommunityDetail(id: string) {
  return await DataStore.getCommunityById(id)
}

export async function getUserCommunitiesWithRolesAction(userId?: string, preloadedCommunities?: any[]) {
  const targetUserId = userId || (await getCurrentUser())?.id
  if (!targetUserId) return []
  return await DataStore.getUserCommunitiesWithRoles(targetUserId, preloadedCommunities)
}

export async function switchActiveIndukCommunityAction(communityId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  try {
    await DataStore.setIndukCommunity(user.id, communityId)
    revalidatePath('/community')
    revalidatePath('/profile')
    revalidatePath('/merchant/dashboard')
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal mengubah Induk Komunitas terasosiasi.' }
  }
}

export async function createIndukCommunity(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const name = formData.get('name') as string
  const type = (formData.get('type') as string) || 'PERKUMPULAN'
  const description = formData.get('description') as string
  const aktaNotaris = formData.get('aktaNotaris') as string || undefined
  const nomorAhu = formData.get('nomorAhu') as string || undefined
  const nomorNpwp = formData.get('nomorNpwp') as string || undefined
  const domisili = formData.get('domisili') as string || undefined
  const kontakPj = formData.get('kontakPj') as string || undefined
  const avatarUrl = formData.get('avatarUrl') as string || undefined
  const coverUrl = formData.get('coverUrl') as string || undefined
  const waGroupLink = formData.get('waGroupLink') as string || undefined
  const joinFee = parseFloat(formData.get('joinFee') as string) || 0
  const monthlyFee = parseFloat(formData.get('monthlyFee') as string) || 0
  const isKycRequired = formData.get('isKycRequired') === 'true' || formData.get('isKycRequired') === 'on'
  const coopTier = (formData.get('coopTier') as string) || 'BASIC'
  const templateType = (formData.get('templateType') as string) || 'Society'

  if (!name || !description) {
    return { error: 'Nama dan deskripsi komunitas wajib diisi.' }
  }

  if (!aktaNotaris || !nomorAhu || !nomorNpwp || !domisili) {
    return { error: 'Legalitas organisasi (Akta Notaris, AHU, NPWP, Domisili) wajib diisi.' }
  }

  if (type !== 'PERKUMPULAN' && type !== 'KOPERASI') {
    return { error: 'Tipe komunitas tidak valid.' }
  }

  // Check global Superadmin setting: Is KYC required to create a community?
  const globalKycRequired = await DataStore.getGlobalKycRequirementToCreateCommunity()
  if (globalKycRequired) {
    // kycStatus isn't in the session JWT — read it from the DB row.
    const kycStatus = (await DataStore.findUserById(user.id))?.kycStatus
    const isUserKycVerified = kycStatus === 'VERIFIED' || kycStatus === 'APPROVED'
    if (!isUserKycVerified) {
      return { 
        error: 'Syarat verifikasi KYC (KTP/Selfie) aktif. Anda harus memverifikasi akun Anda sebelum membuat Komunitas Induk.',
        needsKyc: true 
      }
    }
  }

  const perkumpulanTier = (formData.get('perkumpulanTier') as string) || 'FREE'

  let landingPageConfig = undefined
  let initialCoins = 0
  if (type === 'KOPERASI') {
    if (coopTier === 'BASIC') initialCoins = 500
    else if (coopTier === 'PLUS') initialCoins = 1500
    else if (coopTier === 'PRO') initialCoins = 3000

    const disabledModules = []
    if (coopTier === 'BASIC' || coopTier === 'PLUS') {
      disabledModules.push('pendanaan')
    }
    landingPageConfig = JSON.stringify({
      coopTier,
      disabledModules,
      bonusCoins: initialCoins
    })
  } else if (type === 'PERKUMPULAN') {
    initialCoins = 0
    landingPageConfig = JSON.stringify({
      perkumpulanTier,
      activationFeePaid: perkumpulanTier === 'PREMIUM' ? 200000 : 0,
      bonusCoins: 0,
      // Only the chosen template's own modules start enabled - otherwise a
      // fresh community would show every Perkumpulan template's modules at
      // once regardless of which template was actually picked at creation.
      disabledModules: getDisabledModulesForTemplate(templateType),
      memberFee: 0,
      memberFeePeriod: 'FREE',
      benefits: ['Diskusi Komunitas', 'Katalog Produk Anggota', 'Event & Galeri']
    })
  }

  try {
    const community = await DataStore.createCommunity({
      ketuaId: user.id,
      name,
      type: type as 'PERKUMPULAN' | 'KOPERASI',
      description,
      aktaNotaris,
      nomorAhu,
      nomorNpwp,
      domisili,
      kontakPj,
      avatarUrl,
      coverUrl,
      waGroupLink,
      joinFee,
      monthlyFee,
      isKycRequired,
      landingPageConfig,
      coinBalance: initialCoins,
      templateType
    })
    await logAudit({
      actor: 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'CREATE_INDUK_COMMUNITY',
      module: 'COOPERATIVE',
      targetId: community.id,
      targetType: 'COMMUNITY',
      detail: `Komunitas "${name}" (${type}).`
    })
    deleteCache('community:induk:all')
    invalidateCachePattern('community:induk:*')
    invalidateCachePattern('user:communities:roles:*')
    revalidatePath('/community')
    revalidatePath('/cms_admin', 'layout')
    return { success: true, community }
  } catch (e: any) {
    return { error: e.message || 'Gagal membuat komunitas.' }
  }
}

export async function joinIndukCommunity(communityId: string, asInduk: boolean = false) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  let effectiveAsInduk = asInduk
  if (effectiveAsInduk) {
    const existingInduk = await DataStore.getUserIndukCommunity(user.id)
    if (existingInduk) {
      // Jika sudah memiliki Komunitas Induk, secara otomatis daftar sebagai anggota biasa
      effectiveAsInduk = false
    }
  }

  // Community-scoped referral (separate from the platform-wide signup
  // referrer): who this member joined THIS community through, captured via
  // the community's own share link (?ref=) as a first-touch cookie.
  let referrerId: string | null = null
  const communityRefCookie = readCommunityReferralCookie(await cookies(), communityId, user.id)
  if (communityRefCookie) {
    // findUserByReferralCode already matches referralCode, username, id, or
    // email — covers however handleShareReferralLink encoded the link.
    const referrer = await DataStore.findUserByReferralCode(communityRefCookie)
    if (referrer) referrerId = referrer.id
  }

  try {
    const result = await DataStore.joinCommunity(user.id, communityId, effectiveAsInduk, referrerId)
    await logAudit({
      actor: 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'JOIN_INDUK_COMMUNITY',
      module: 'COOPERATIVE',
      targetId: communityId,
      targetType: 'COMMUNITY',
      detail: effectiveAsInduk ? 'Bergabung sebagai induk.' : 'Bergabung sebagai anggota biasa.'
    })
    deleteCache('community:induk:all')
    deleteCache(`community:members:${communityId}`)
    deleteCache(`community:stats:${communityId}`)
    invalidateCachePattern('community:induk:*')
    invalidateCachePattern('user:communities:roles:*')
    revalidatePath(`/community/${communityId}`)
    revalidatePath('/community')
    revalidatePath('/merchant/dashboard')
    revalidatePath('/cms_admin', 'layout')
    return { success: true, ...result }
  } catch (e: any) {
    return { error: e.message || 'Gagal bergabung ke komunitas.' }
  }
}

/**
 * Manual (offline) join-fee settlement — bank transfer only. Gateway-backed
 * payments do NOT go through here: they run through /api/payment/checkout so
 * the amount is resolved server-side and confirmed against the gateway before
 * anything is credited.
 */
export async function payCommunityJoinFeeAction(communityId: string, paymentMethod: string = 'BANK') {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  // Community-scoped referral (same first-touch cookie the online-payment
  // checkout route reads) — without this, a bank-transfer join always
  // recorded referrerId as null even when the buyer came through a ?ref= link.
  let referrerId: string | null = null
  const communityRefCookie = readCommunityReferralCookie(await cookies(), communityId, user.id)
  if (communityRefCookie) {
    const referrer = await DataStore.findUserByReferralCode(communityRefCookie)
    if (referrer) referrerId = referrer.id
  }

  if (paymentMethod !== 'BANK') {
    return { error: 'Metode pembayaran tidak valid.' }
  }

  try {
    // A bank transfer is only a CLAIM until an admin sees the money: record
    // the (UNPAID, referrer cycle-checked) membership and flag it
    // invoiceStatus PAID = "Sudah Bayar (Pending)" in the CMS invoice queue.
    // isPaid and the referral payout only flip in verifyInvoiceMembership.
    // Previously this settled instantly, granting paid membership and paying
    // real commissions with no money received.
    const joined: any = await DataStore.joinCommunity(user.id, communityId, false, referrerId)
    if (joined?.error) return joined
    if (joined?.alreadyMember && joined.invoiceStatus !== 'UNPAID') {
      return { error: 'Pembayaran Anda sudah tercatat. Mohon tunggu verifikasi admin.' }
    }
    if (!joined?.needsPayment) return { error: 'Komunitas ini tidak memerlukan pembayaran.' }
    await db.communityMembership.updateMany({
      where: { communityId, userId: user.id, isPaid: false, removedAt: null },
      data: { invoiceStatus: 'PAID' }
    })
    const result = { success: true, pendingVerification: true, invoiceStatus: 'PAID' }
    await logAudit({
      actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'PAY_COMMUNITY_JOIN_FEE',
      module: 'COOPERATIVE',
      targetId: communityId,
      targetType: 'COMMUNITY',
      detail: `Konfirmasi transfer bank biaya keanggotaan, menunggu verifikasi admin.`
    })
    // A rejoin reactivates a soft-deleted row (or a fresh join creates a new
    // one) — either way the member LIST cache (separate from community:induk:*
    // above) must also drop, or a viewer who warmed it in the last 60s makes
    // the client's post-payment loadData() see the pre-payment roster and
    // immediately reset isMember back to false right after payment succeeded.
    // Mirrors what kickCommunityMemberAction and joinIndukCommunity already do.
    deleteCache(`community:members:${communityId}`)
    invalidateCachePattern(`community:members:${communityId}*`)
    deleteCache(`community:stats:${communityId}`)
    deleteCache('community:induk:all')
    invalidateCachePattern('community:induk:*')
    invalidateCachePattern('user:communities:roles:*')
    revalidatePath(`/community/${communityId}`)
    revalidatePath('/community')
    revalidatePath('/merchant/dashboard')
    revalidatePath('/cms_admin', 'layout')
    return result
  } catch (e: any) {
    return { error: e.message || 'Gagal memproses pembayaran keanggotaan.' }
  }
}

export async function getUserIndukCommunityAction() {
  const user = await getCurrentUser()
  if (!user) return null
  return await DataStore.getUserIndukCommunity(user.id)
}

export async function getIndukCommunityMembersAction(
  communityId: string,
  viewerCtx?: { userId: string | null; role: string | null; isKetua: boolean; isMember: boolean }
) {
  let authorized = false
  if (viewerCtx) {
    authorized = viewerCtx.role === 'ADMIN' || viewerCtx.isKetua || viewerCtx.isMember
  } else {
    const user = await getCurrentUser()
    if (user) {
      authorized = user.role === 'ADMIN' || await DataStore.isCommunityMember(user.id, communityId)
      if (!authorized) {
        const community = await DataStore.getCommunityById(communityId)
        authorized = community?.ketuaId === user.id
      }
    }
  }
  if (!authorized) return []
  // Uncached on purpose — see the ponytail note above getIndukCommunityDetail.
  return await DataStore.getIndukCommunityMembers(communityId)
}

export async function kickCommunityMemberAction(communityId: string, targetUserId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  try {
    const actualCommunityId = communityId
    const actualTargetUserId = targetUserId

    const community = await DataStore.getCommunityById(actualCommunityId)
    if (!community) return { error: 'Komunitas tidak ditemukan.' }

    const isSuperAdmin = user.role === 'ADMIN'
    const isKetua = community.ketuaId === user.id

    if (!isSuperAdmin && !isKetua) {
      return { error: 'Anda tidak memiliki akses untuk mengeluarkan anggota dari komunitas ini.' }
    }

    if (actualTargetUserId === community.ketuaId) {
      return { error: 'Ketua komunitas tidak dapat dikeluarkan.' }
    }

    await DataStore.removeCommunityMembership(actualTargetUserId, actualCommunityId)
    await logAudit({
      actor: isSuperAdmin ? 'ADMIN' : 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'KICK_COMMUNITY_MEMBER',
      module: 'COOPERATIVE',
      targetId: actualTargetUserId,
      targetType: 'USER',
      detail: `Keluarkan anggota #${actualTargetUserId} dari komunitas #${actualCommunityId}.`
    })
    try {
      await DataStore.createNotification(
        actualTargetUserId,
        'KICKED_FROM_COMMUNITY',
        'Dikeluarkan dari Komunitas',
        `Anda telah dikeluarkan dari komunitas "${community.name}" oleh pengurus.`,
        '/community'
      )
    } catch (err) {
      console.error('Error creating kick notification:', err)
    }

    // Clear server-side caches so all members and the kicked user see the change immediately
    deleteCache(`community:members:${actualCommunityId}`)
    invalidateCachePattern(`community:members:${actualCommunityId}*`)
    deleteCache(`community:stats:${actualCommunityId}`)
    deleteCache(`user:communities:roles:${actualTargetUserId}`)
    invalidateCachePattern('user:communities:roles:*')
    deleteCache('community:induk:all')
    invalidateCachePattern('community:induk:*')

    revalidatePath(`/community/${actualCommunityId}`)
    revalidatePath(`/community/${actualCommunityId}?view=dashboard&tab=anggota`)
    revalidatePath('/community')
    revalidatePath('/cms_admin', 'layout')
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal mengeluarkan anggota.' }
  }
}

// FLAGGED — SECURITY (not yet fixed, pending a decision on the intended KYC
// business process): this sets kycStatus:'APPROVED' from client-supplied
// ktpUrl/selfieUrl with no real verification (only a magic-string check for
// "fail"/"tolak"/"invalid" in the URL) and no environment gate, unlike the
// sibling /api/kyc/simulate route which had the identical hole and is now
// locked to non-production. kycStatus APPROVED/VERIFIED gates cooperative
// loan applications (submitCooperativeLoanAction), community creation, and
// joining KYC-required communities — so this is a live identity-verification
// bypass on financially-sensitive actions, reachable directly as a server
// action regardless of the UI (it's imported but never actually called in
// settings/page.tsx or ProfileViewerClient.tsx, both of which use the real
// Didit-based flow instead). Do not delete/fix without confirming whether
// this stub predates the Didit integration and is safe to remove.
export async function submitKycAction(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const ktpUrl = formData.get('ktpUrl') as string
  const selfieUrl = formData.get('selfieUrl') as string

  if (!ktpUrl || !selfieUrl) {
    return { error: 'Foto KTP dan Selfie wajib diunggah.' }
  }

  try {
    const updatedUser = await DataStore.submitKyc(user.id, ktpUrl, selfieUrl)
    await logAudit({
      actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'SUBMIT_KYC',
      module: 'KYC',
      targetId: user.id,
      targetType: 'USER'
    })
    revalidatePath('/profile')
    return { success: true, user: updatedUser }
  } catch (e: any) {
    return { error: e.message || 'Gagal mengirim pengajuan KYC.' }
  }
}

export async function updateKycStatusAction(userId: string, status: 'APPROVED' | 'REJECTED') {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    return { error: 'Anda tidak memiliki akses.' }
  }

  try {
    const updatedUser = await DataStore.updateKycStatus(userId, status)
    await logAudit({
      actor: 'ADMIN',
      actorId: user.id,
      actorName: user.name || user.email,
      action: status === 'APPROVED' ? 'APPROVE_KYC' : 'REJECT_KYC',
      module: 'KYC',
      targetId: userId,
      targetType: 'USER'
    })
    try {
      await DataStore.createNotification(
        userId,
        status === 'APPROVED' ? 'KYC_APPROVED' : 'KYC_REJECTED',
        status === 'APPROVED' ? 'Verifikasi KYC Disetujui' : 'Verifikasi KYC Ditolak',
        status === 'APPROVED'
          ? 'Selamat! Verifikasi KTP/Selfie Anda telah disetujui oleh Admin Saloka.id.'
          : 'Verifikasi KTP/Selfie Anda ditolak oleh Admin. Silakan ajukan ulang dengan dokumen yang jelas.',
        '/profile'
      )
    } catch (err) {
      console.error('Error creating KYC status notification:', err)
    }
    return { success: true, user: updatedUser }
  } catch (e: any) {
    return { error: e.message || 'Gagal memperbarui status KYC.' }
  }
}

export async function submitCooperativeLoanAction(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  let dbUser = null
  try {
    dbUser = await DataStore.findUserById(user.id)
  } catch (_) {}

  if (!dbUser || dbUser.kycStatus !== 'APPROVED') {
    return { error: 'Anda harus menyelesaikan dan lulus verifikasi KYC terlebih dahulu.' }
  }

  const communityId = formData.get('communityId') as string
  const amountStr = formData.get('amount') as string
  const purpose = formData.get('purpose') as string

  if (!communityId || !amountStr || !purpose) {
    return { error: 'Semua kolom wajib diisi.' }
  }

  const amount = parseFloat(amountStr)
  if (isNaN(amount) || amount <= 0) {
    return { error: 'Jumlah pinjaman tidak valid.' }
  }

  // Pendanaan Merchant is a Koperasi Max-only feature.
  const community: any = await DataStore.getCommunityById(communityId)
  if (!community) return { error: 'Komunitas tidak ditemukan.' }
  let coopTier = 'BASIC'
  if (community.landingPageConfig) {
    try {
      coopTier = JSON.parse(community.landingPageConfig).coopTier || 'BASIC'
    } catch (_) {}
  }
  if (coopTier !== 'PRO') {
    return { error: 'Fitur Pendanaan Merchant hanya tersedia untuk Koperasi Max. Upgrade paket langganan terlebih dahulu.' }
  }

  // Enforce cooperative savings requirement: member must have active savings balance > 0
  const savingsTxs = await DataStore.getSavingsTransactions(communityId, user.id)
  const userTotalSavings = savingsTxs.reduce((sum: number, t: any) => {
    const val = Number(t.amount || 0)
    return t.transactionType === 'SETOR' ? sum + val : sum - val
  }, 0)

  if (userTotalSavings <= 0) {
    return {
      error: 'Anda harus memiliki saldo simpanan aktif di koperasi untuk mengajukan pinjaman permodalan.'
    }
  }

  // Cek apakah komunitas memiliki cukup coin untuk membuka akses pinjaman
  const coinData = await DataStore.getCommunityCoinBalance(communityId)
  const coinBalance = coinData?.coinBalance || 0
  const minCoin = coinData?.minCoinForLoan || 1000
  if (coinBalance < minCoin) {
    return {
      error: `Komunitas belum memiliki cukup coin untuk membuka akses pinjaman. Saat ini: ${coinBalance} coin, dibutuhkan minimal: ${minCoin} coin. Hubungi Ketua Komunitas untuk top up coin.`
    }
  }

  try {
    const loan = await DataStore.submitCooperativeLoan({
      communityId,
      merchantId: user.id,
      amount,
      purpose
    })
    await logAudit({
      actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'SUBMIT_COOPERATIVE_LOAN',
      module: 'COOPERATIVE',
      targetId: loan.id,
      targetType: 'COOPERATIVE_LOAN',
      detail: `Ajukan pinjaman Rp ${amount.toLocaleString('id-ID')} — ${purpose}`
    })
    deleteCache(`community:loans:${communityId}`)
    revalidatePath('/merchant/dashboard')
    revalidatePath(`/community/${communityId}`)
    return { success: true, loan }
  } catch (e: any) {
    return { error: e.message || 'Gagal mengajukan pinjaman modal.' }
  }
}

export async function getCooperativeLoansAction(communityId?: string, preloadedCommunity?: { ketuaId: string } | null) {
  const user = await getCurrentUser()
  if (!user) return []

  const community = communityId
    ? (preloadedCommunity !== undefined ? preloadedCommunity : await DataStore.getCommunityById(communityId))
    : null
  const isKetua = communityId ? community?.ketuaId === user.id : false

  const allLoans = await cacheWrap(`community:loans:${communityId || 'all'}`, () => DataStore.getCooperativeLoans(communityId), 60)

  if (user.role === 'ADMIN' || isKetua) return allLoans
  // ponytail: was filtering on l.userId, a field CooperativeLoan doesn't have
  // (the borrower field is merchantId) — members could never see their own
  // submitted loan's status.
  return (allLoans || []).filter((l: any) => l.merchantId === user.id)
}

export async function approveCooperativeLoanAction(loanId: string, role: 'KETUA' | 'ADMIN') {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const loan = await DataStore.getCooperativeLoanById(loanId)
  if (!loan) return { error: 'Data pinjaman tidak ditemukan.' }

  if (role === 'KETUA') {
    if (loan.community.ketuaId !== user.id) {
      return { error: 'Anda bukan ketua dari komunitas ini.' }
    }
    
    try {
      const updated = await DataStore.updateCooperativeLoanStatus(
        loanId,
        'APPROVED_KETUA',
        true,
        loan.approvedByAdmin
      )
      await logAudit({
        actor: 'MEMBER',
        actorId: user.id,
        actorName: user.name || user.email,
        action: 'APPROVE_COOPERATIVE_LOAN_KETUA',
        module: 'COOPERATIVE',
        targetId: loanId,
        targetType: 'COOPERATIVE_LOAN',
        detail: `Ketua menyetujui pinjaman Rp ${Number(loan.amount).toLocaleString('id-ID')}.`
      })
      deleteCache(`community:loans:${loan.communityId}`)
      revalidatePath('/merchant/dashboard')
      return { success: true, loan: updated }
    } catch (e: any) {
      return { error: e.message || 'Gagal menyetujui pinjaman.' }
    }
  }

  if (role === 'ADMIN') {
    if (user.role !== 'ADMIN') {
      return { error: 'Anda tidak memiliki hak akses admin.' }
    }

    try {
      const updated = await DataStore.updateCooperativeLoanStatus(
        loanId,
        'APPROVED_ADMIN',
        loan.approvedByKetua,
        true
      )
      await logAudit({
        actor: 'ADMIN',
        actorId: user.id,
        actorName: user.name || user.email,
        action: 'APPROVE_COOPERATIVE_LOAN_ADMIN',
        module: 'COOPERATIVE',
        targetId: loanId,
        targetType: 'COOPERATIVE_LOAN',
        detail: `Admin menyetujui pinjaman Rp ${Number(loan.amount).toLocaleString('id-ID')}.`
      })
      deleteCache(`community:loans:${loan.communityId}`)
      revalidatePath('/merchant/dashboard')
      return { success: true, loan: updated }
    } catch (e: any) {
      return { error: e.message || 'Gagal menyetujui pinjaman.' }
    }
  }

  return { error: 'Role tidak valid.' }
}

export async function rejectCooperativeLoanAction(loanId: string, role: 'KETUA' | 'ADMIN') {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const loan = await DataStore.getCooperativeLoanById(loanId)
  if (!loan) return { error: 'Data pinjaman tidak ditemukan.' }

  if (role === 'KETUA' && loan.community.ketuaId !== user.id) {
    return { error: 'Anda bukan ketua dari komunitas ini.' }
  }

  if (role === 'ADMIN' && user.role !== 'ADMIN') {
    return { error: 'Anda tidak memiliki hak akses admin.' }
  }

  try {
    const updated = await DataStore.updateCooperativeLoanStatus(
      loanId,
      'REJECTED',
      role === 'KETUA' ? false : loan.approvedByKetua,
      role === 'ADMIN' ? false : loan.approvedByAdmin
    )
    await logAudit({
      actor: role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: role === 'ADMIN' ? 'REJECT_COOPERATIVE_LOAN_ADMIN' : 'REJECT_COOPERATIVE_LOAN_KETUA',
      module: 'COOPERATIVE',
      targetId: loanId,
      targetType: 'COOPERATIVE_LOAN',
      detail: `Pinjaman Rp ${Number(loan.amount).toLocaleString('id-ID')} ditolak oleh ${role === 'ADMIN' ? 'Admin' : 'Ketua'}.`
    })
    deleteCache(`community:loans:${loan.communityId}`)
    revalidatePath('/merchant/dashboard')
    return { success: true, loan: updated }
  } catch (e: any) {
    return { error: e.message || 'Gagal menolak pinjaman.' }
  }
}

export async function updateIndukCommunity(id: string, formData: FormData) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const community = await DataStore.getCommunityById(id)
  if (!community) return { error: 'Komunitas tidak ditemukan.' }
  if (community.ketuaId !== user.id && user.role !== 'ADMIN') {
    return { error: 'Anda tidak memiliki wewenang untuk mengubah komunitas ini.' }
  }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const aktaNotaris = formData.get('aktaNotaris') as string || undefined
  const nomorAhu = formData.get('nomorAhu') as string || undefined
  const nomorNpwp = formData.get('nomorNpwp') as string || undefined
  const domisili = formData.get('domisili') as string || undefined
  const kontakPj = formData.get('kontakPj') as string || undefined
  const avatarUrl = formData.get('avatarUrl') as string || undefined
  const coverUrl = formData.get('coverUrl') as string || undefined
  const waGroupLink = formData.get('waGroupLink') as string || undefined
  const landingPageConfig = formData.get('landingPageConfig') as string || undefined
  // Unlike every other field above, a missing joinFee/monthlyFee here must
  // mean "caller isn't touching this" (undefined), not "set it to 0" - the
  // generic branding/menu-toggle save (handleSaveSettings) doesn't send
  // these at all, and forcing them to a definite number on every call
  // silently rewrote joinFee from whatever stale value the client's React
  // state held, tripping the referral-allocation check below (or worse,
  // wiping a Perkumpulan Premium's fee back to 0) on saves that were never
  // about money settings in the first place.
  const joinFeeRaw = formData.get('joinFee')
  const monthlyFeeRaw = formData.get('monthlyFee')
  const joinFee = joinFeeRaw !== null && joinFeeRaw !== '' ? (parseFloat(joinFeeRaw as string) || 0) : undefined
  const monthlyFee = monthlyFeeRaw !== null && monthlyFeeRaw !== '' ? (parseFloat(monthlyFeeRaw as string) || 0) : undefined
  const templateType = formData.get('templateType') as string || undefined

  if (!name || !description) {
    return { error: 'Nama dan deskripsi komunitas wajib diisi.' }
  }

  // A ketua could otherwise drop joinFee below the referral budget + kas
  // share already committed via the separate referral-config tab, leaving
  // that config over-allocated relative to what the join fee now collects.
  // Only relevant when this save is actually changing joinFee.
  if (joinFee !== undefined) {
    const allocationError = validateReferralAllocation(joinFee, community.referralBudget ?? 0, community.communityProfitShare ?? 0)
    if (allocationError) return { error: allocationError }
  }

  try {
    const updated = await DataStore.updateCommunity(id, {
      name,
      description,
      aktaNotaris,
      nomorAhu,
      nomorNpwp,
      domisili,
      kontakPj,
      avatarUrl,
      coverUrl,
      waGroupLink,
      landingPageConfig,
      joinFee,
      monthlyFee,
      templateType
    })
    await logAudit({
      actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      actorId: user.id,
      actorName: user.name || user.email,
      action: 'UPDATE_INDUK_COMMUNITY',
      module: 'COOPERATIVE',
      targetId: id,
      targetType: 'COMMUNITY'
    })
    // getIndukCommunityDetail() serves this community from a separate
    // cacheWrap('community:induk:${id}') layer that revalidatePath doesn't
    // touch (it only clears Next's route cache, not this app-level cache) -
    // without this, every field changed here (menu toggles, join fee,
    // branding) keeps serving pre-save values to the next reader for up to
    // the cache's TTL. community:induk:all is the LIST version of the same
    // cache (the /community hub page), and /cms_admin has its own separate
    // unstable_cache (allCommunities) that only revalidatePath('/cms_admin')
    // reaches — without all three, a ketua's own edit here shows correctly
    // on their own page but keeps showing the old values everywhere else.
    deleteCache(`community:induk:${id}`)
    deleteCache('community:induk:all')
    revalidatePath(`/community/${id}`)
    revalidatePath('/community')
    revalidatePath('/cms_admin', 'layout')
    return { success: true, community: updated }
  } catch (e: any) {
    return { error: e.message || 'Gagal memperbarui komunitas.' }
  }
}

// ─── REAL STATS & COOPERATIVE PRODUCTS / FUNDING ACTIONS ───────────────────

export async function getCommunityRealStatsAction(communityId: string) {
  return await cacheWrap(`community:stats:${communityId}`, () => DataStore.getCommunityRealStats(communityId), 60)
}

export async function getCooperativeProductsAction(communityId: string) {
  return await cacheWrap(`community:coop_products:${communityId}`, () => DataStore.getCooperativeProducts(communityId), 60)
}

export async function createCooperativeProductAction(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const communityId = formData.get('communityId') as string
  const name = formData.get('name') as string
  const type = (formData.get('type') as string) || 'POKOK'
  const amount = Number(formData.get('amount') || 0)
  const periodText = formData.get('periodText') as string
  const isMandatory = formData.get('isMandatory') === 'true'
  const isPremium = formData.get('isPremium') === 'true'
  const description = formData.get('description') as string

  if (!communityId || !name) {
    return { error: 'Komunitas dan Nama Produk Simpanan wajib diisi.' }
  }

  let community: any
  try {
    community = await requireCommunityManager(user, communityId)
  } catch (e: any) {
    return { error: e.message || 'Anda tidak memiliki wewenang untuk komunitas ini.' }
  }

  if (type === 'SUKARELA') {
    let coopTier = 'BASIC'
    if (community?.landingPageConfig) {
      try {
        coopTier = JSON.parse(community.landingPageConfig).coopTier || 'BASIC'
      } catch (_) {}
    }
    if (coopTier === 'BASIC') {
      return { error: 'Simpanan Sukarela hanya tersedia untuk Koperasi Premium dan Max. Upgrade paket langganan terlebih dahulu.' }
    }
  }

  const p = await DataStore.createCooperativeProduct({
    communityId,
    name,
    type,
    amount,
    periodText,
    isMandatory,
    isPremium,
    description
  })
  await logAudit({
    actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
    actorId: user.id,
    actorName: user.name || user.email,
    action: 'CREATE_COOPERATIVE_PRODUCT',
    module: 'COOPERATIVE',
    targetId: p.id,
    targetType: 'COOPERATIVE_PRODUCT',
    detail: `"${name}" (${type}) — Rp ${amount.toLocaleString('id-ID')}.`
  })

  deleteCache(`community:coop_products:${communityId}`)
  revalidatePath(`/community/${communityId}`)
  return { success: true, product: p }
}

export async function updateCooperativeProductAction(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const id = formData.get('id') as string
  const communityId = formData.get('communityId') as string
  const name = formData.get('name') as string
  const type = formData.get('type') as string
  const amount = Number(formData.get('amount') || 0)
  const periodText = formData.get('periodText') as string
  const isMandatory = formData.get('isMandatory') === 'true'
  const isPremium = formData.get('isPremium') === 'true'
  const description = formData.get('description') as string

  if (!id) return { error: 'ID Produk wajib diisi.' }
  const existingProduct: any = await DataStore.getCooperativeProductById(id)
  if (!existingProduct) return { error: 'Produk tidak ditemukan.' }
  let community: any
  try {
    community = await requireCommunityManager(user, existingProduct.communityId)
  } catch (e: any) {
    return { error: e.message || 'Anda tidak memiliki wewenang untuk komunitas ini.' }
  }

  if (type === 'SUKARELA') {
    let coopTier = 'BASIC'
    if (community?.landingPageConfig) {
      try {
        coopTier = JSON.parse(community.landingPageConfig).coopTier || 'BASIC'
      } catch (_) {}
    }
    if (coopTier === 'BASIC') {
      return { error: 'Simpanan Sukarela hanya tersedia untuk Koperasi Premium dan Max. Upgrade paket langganan terlebih dahulu.' }
    }
  }

  const updated = await DataStore.updateCooperativeProduct(id, {
    name,
    type,
    amount,
    periodText,
    isMandatory,
    isPremium,
    description
  })
  await logAudit({
    actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
    actorId: user.id,
    actorName: user.name || user.email,
    action: 'UPDATE_COOPERATIVE_PRODUCT',
    module: 'COOPERATIVE',
    targetId: id,
    targetType: 'COOPERATIVE_PRODUCT'
  })

  deleteCache(`community:coop_products:${communityId}`)
  revalidatePath(`/community/${communityId}`)
  return { success: true, product: updated }
}

export async function deleteCooperativeProductAction(id: string, communityId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const existingProduct: any = await DataStore.getCooperativeProductById(id)
  if (!existingProduct) return { error: 'Produk tidak ditemukan.' }
  try {
    await requireCommunityManager(user, existingProduct.communityId)
  } catch (e: any) {
    return { error: e.message || 'Anda tidak memiliki wewenang untuk komunitas ini.' }
  }

  await DataStore.deleteCooperativeProduct(id)
  await logAudit({
    actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
    actorId: user.id,
    actorName: user.name || user.email,
    action: 'DELETE_COOPERATIVE_PRODUCT',
    module: 'COOPERATIVE',
    targetId: id,
    targetType: 'COOPERATIVE_PRODUCT'
  })
  deleteCache(`community:coop_products:${communityId}`)
  revalidatePath(`/community/${communityId}`)
  return { success: true }
}

export async function getMerchantFundingProjectsAction(
  communityId: string,
  viewerCtx?: { userId: string | null; role: string | null; isKetua: boolean; isMember: boolean }
) {
  let authorized = false
  if (viewerCtx) {
    authorized = viewerCtx.role === 'ADMIN' || viewerCtx.isKetua || viewerCtx.isMember
  } else {
    const user = await getCurrentUser()
    if (user) {
      authorized = user.role === 'ADMIN' || await DataStore.isCommunityMember(user.id, communityId)
      if (!authorized) {
        const community = await DataStore.getCommunityById(communityId)
        authorized = community?.ketuaId === user.id
      }
    }
  }
  if (!authorized) return []
  return await cacheWrap(`community:funding_projects:${communityId}`, () => DataStore.getMerchantFundingProjects(communityId), 60)
}

export async function createMerchantFundingProjectAction(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const communityId = formData.get('communityId') as string
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const targetAmount = Number(formData.get('targetAmount') || 0)
  const minInvestment = Number(formData.get('minInvestment') || 50000)
  const estimatedReturn = Number(formData.get('estimatedReturn') || 12.0)
  const durationMonths = Number(formData.get('durationMonths') || 6)
  const imageUrl = formData.get('imageUrl') as string

  if (!communityId || !title || targetAmount <= 0) {
    return { error: 'Judul proyek dan Target Pendanaan wajib diisi.' }
  }

  try {
    await requireCommunityManager(user, communityId)
  } catch (e: any) {
    return { error: e.message || 'Anda tidak memiliki wewenang untuk komunitas ini.' }
  }

  const proj = await DataStore.createMerchantFundingProject({
    communityId,
    title,
    description,
    targetAmount,
    minInvestment,
    estimatedReturn,
    durationMonths,
    imageUrl
  })
  await logAudit({
    actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
    actorId: user.id,
    actorName: user.name || user.email,
    action: 'CREATE_MERCHANT_FUNDING_PROJECT',
    module: 'COOPERATIVE',
    targetId: proj.id,
    targetType: 'FUNDING_PROJECT',
    detail: `"${title}" — target Rp ${targetAmount.toLocaleString('id-ID')}.`
  })

  deleteCache(`community:funding_projects:${communityId}`)
  revalidatePath(`/community/${communityId}`)
  return { success: true, project: proj }
}

export async function deleteMerchantFundingProjectAction(id: string, communityId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const existingProject: any = await DataStore.getMerchantFundingProjectById(id)
  if (!existingProject) return { error: 'Proyek tidak ditemukan.' }
  try {
    await requireCommunityManager(user, existingProject.communityId)
  } catch (e: any) {
    return { error: e.message || 'Anda tidak memiliki wewenang untuk komunitas ini.' }
  }

  await DataStore.deleteMerchantFundingProject(id)
  await logAudit({
    actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
    actorId: user.id,
    actorName: user.name || user.email,
    action: 'DELETE_MERCHANT_FUNDING_PROJECT',
    module: 'COOPERATIVE',
    targetId: id,
    targetType: 'FUNDING_PROJECT'
  })
  deleteCache(`community:funding_projects:${communityId}`)
  revalidatePath(`/community/${communityId}`)
  return { success: true }
}

export async function upgradeCommunityTierAction(communityId: string, targetTier: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const community = await DataStore.getCommunityById(communityId)
  if (!community) return { error: 'Komunitas tidak ditemukan.' }
  if (community.ketuaId !== user.id && user.role !== 'ADMIN') {
    return { error: 'Anda tidak memiliki wewenang untuk mengubah komunitas ini.' }
  }

  let currentCfg: any = {}
  if (community.landingPageConfig) {
    try {
      currentCfg = JSON.parse(community.landingPageConfig)
    } catch (_) {}
  }

  const previousTier = currentCfg.coopTier
  currentCfg.coopTier = targetTier

  await DataStore.updateCommunity(communityId, {
    name: community.name,
    landingPageConfig: JSON.stringify(currentCfg)
  })
  await logAudit({
    actor: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
    actorId: user.id,
    actorName: user.name || user.email,
    action: 'UPGRADE_COMMUNITY_TIER',
    module: 'COOPERATIVE',
    targetId: communityId,
    targetType: 'COMMUNITY',
    detail: `Tier: ${previousTier || '-'} → ${targetTier}.`
  })

  // Only the ketua needs telling when someone else (an admin) actually
  // changed their tier — a self-service upgrade already has its own
  // on-screen confirmation, and reselecting the same tier isn't a change.
  if (user.role === 'ADMIN' && community.ketuaId && community.ketuaId !== user.id && targetTier !== previousTier) {
    try {
      await DataStore.createNotification(
        community.ketuaId,
        'COMMUNITY_TIER_UPGRADED',
        'Tier Komunitas Diperbarui',
        `Tier komunitas "${community.name}" diubah oleh Admin Saloka.id menjadi ${targetTier}.`,
        `/community/${communityId}`
      )
    } catch (err) {
      console.error('Error creating tier-upgrade notification:', err)
    }
  }

  deleteCache(`community:induk:${communityId}`)
  deleteCache('community:induk:all')
  revalidatePath(`/community/${communityId}`)
  revalidatePath('/community')
  revalidatePath('/cms_admin', 'layout')
  return { success: true }
}



