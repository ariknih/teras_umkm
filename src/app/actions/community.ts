'use server'

import { DataStore } from '@/lib/data-store'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'
import { cacheWrap, invalidateCachePattern, deleteCache } from '@/lib/cache'

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
    const res = await DataStore.toggleJoinGroup(user.id, groupId)
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
    const res = await DataStore.toggleSuspendGroup(groupId)
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

export async function getIndukCommunityDetail(id: string) {
  return await cacheWrap(`community:induk:${id}`, () => DataStore.getCommunityById(id), 60)
}

export async function getUserCommunitiesWithRolesAction(userId?: string, preloadedCommunities?: any[]) {
  const targetUserId = userId || (await getCurrentUser())?.id
  if (!targetUserId) return []
  return await cacheWrap(`user:communities:roles:${targetUserId}`, () => DataStore.getUserCommunitiesWithRoles(targetUserId, preloadedCommunities), 60)
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
  const templateType = (formData.get('templateType') as string) || 'Community'

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
    const isUserKycVerified = (user as any).kycStatus === 'VERIFIED' || (user as any).kycStatus === 'APPROVED'
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
      disabledModules: [],
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
    deleteCache('community:induk:all')
    invalidateCachePattern('community:induk:*')
    invalidateCachePattern('user:communities:roles:*')
    revalidatePath('/community')
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

  try {
    const result = await DataStore.joinCommunity(user.id, communityId, effectiveAsInduk)
    deleteCache('community:induk:all')
    invalidateCachePattern('community:induk:*')
    invalidateCachePattern('user:communities:roles:*')
    revalidatePath('/community')
    revalidatePath('/merchant/dashboard')
    return { success: true, ...result }
  } catch (e: any) {
    return { error: e.message || 'Gagal bergabung ke komunitas.' }
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
  return await cacheWrap(`community:members:${communityId}`, () => DataStore.getIndukCommunityMembers(communityId), 60)
}

export async function kickCommunityMemberAction(communityId: string, targetUserId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  try {
    const community = await DataStore.getCommunityById(communityId)
    if (!community) return { error: 'Komunitas tidak ditemukan.' }

    const isSuperAdmin = user.role === 'ADMIN'
    const isKetua = community.ketuaId === user.id

    if (!isSuperAdmin && !isKetua) {
      return { error: 'Anda tidak memiliki akses untuk mengeluarkan anggota dari komunitas ini.' }
    }

    if (targetUserId === community.ketuaId) {
      return { error: 'Ketua komunitas tidak dapat dikeluarkan.' }
    }

    await DataStore.removeCommunityMembership(targetUserId, communityId)
    revalidatePath(`/community/${communityId}`)
    revalidatePath('/cms_admin', 'layout')
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal mengeluarkan anggota.' }
  }
}

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
  return (allLoans || []).filter((l: any) => l.userId === user.id)
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
  const joinFee = parseFloat(formData.get('joinFee') as string) || 0
  const monthlyFee = parseFloat(formData.get('monthlyFee') as string) || 0

  if (!name || !description) {
    return { error: 'Nama dan deskripsi komunitas wajib diisi.' }
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
      monthlyFee
    })
    revalidatePath(`/community/${id}`)
    revalidatePath('/community')
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

  const updated = await DataStore.updateCooperativeProduct(id, {
    name,
    type,
    amount,
    periodText,
    isMandatory,
    isPremium,
    description
  })

  revalidatePath(`/community/${communityId}`)
  return { success: true, product: updated }
}

export async function deleteCooperativeProductAction(id: string, communityId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  await DataStore.deleteCooperativeProduct(id)
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

  revalidatePath(`/community/${communityId}`)
  return { success: true, project: proj }
}

export async function deleteMerchantFundingProjectAction(id: string, communityId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  await DataStore.deleteMerchantFundingProject(id)
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

  currentCfg.coopTier = targetTier

  await DataStore.updateCommunity(communityId, {
    name: community.name,
    landingPageConfig: JSON.stringify(currentCfg)
  })

  revalidatePath(`/community/${communityId}`)
  revalidatePath('/community')
  return { success: true }
}



