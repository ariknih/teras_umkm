'use server'

import { DataStore } from '@/lib/data-store'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'

export async function getPosts(groupId?: string) {
  return await DataStore.getPosts(groupId)
}

export async function getPostById(id: string) {
  return await DataStore.getPostById(id)
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
  return await DataStore.getGroups()
}

export async function getGroupById(id: string) {
  return await DataStore.getGroupById(id)
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
  return await DataStore.getCommunities()
}

export async function getIndukCommunityDetail(id: string) {
  return await DataStore.getCommunityById(id)
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

  if (!name || !description) {
    return { error: 'Nama dan deskripsi komunitas wajib diisi.' }
  }

  if (type !== 'PERKUMPULAN' && type !== 'KOPERASI') {
    return { error: 'Tipe komunitas tidak valid.' }
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
      monthlyFee
    })
    revalidatePath('/community')
    return { success: true, community }
  } catch (e: any) {
    return { error: e.message || 'Gagal membuat komunitas.' }
  }
}

export async function joinIndukCommunity(communityId: string, asInduk: boolean = false) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  // Prevent changing induk community if already set
  if (asInduk) {
    const existingInduk = await DataStore.getUserIndukCommunity(user.id)
    if (existingInduk) {
      return { error: 'Anda sudah memiliki Komunitas Induk. Komunitas Induk tidak bisa diganti.' }
    }
  }

  try {
    const result = await DataStore.joinCommunity(user.id, communityId, asInduk)
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

export async function getIndukCommunityMembersAction(communityId: string) {
  return await DataStore.getIndukCommunityMembers(communityId)
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

export async function getCooperativeLoansAction(communityId?: string) {
  const user = await getCurrentUser()
  if (!user) return []

  const isKetua = communityId ? (await DataStore.getCommunityById(communityId))?.ketuaId === user.id : false

  if (user.role === 'ADMIN' || isKetua) {
    return await DataStore.getCooperativeLoans(communityId)
  } else {
    return await DataStore.getCooperativeLoans(communityId, user.id)
  }
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

