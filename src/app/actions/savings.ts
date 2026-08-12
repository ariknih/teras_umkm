'use server'

import { getCurrentUser } from '@/app/actions/auth'
import { DataStore } from '@/lib/data-store'
import { revalidatePath } from 'next/cache'

export async function recordSavingsTransactionAction(formData: FormData) {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { error: 'Anda harus masuk terlebih dahulu.' }
  }

  const userId = formData.get('userId') as string
  const isAdmin = currentUser.role === 'ADMIN' || !!(currentUser as any).isSuperAdmin
  if (!isAdmin && userId !== currentUser.id) {
    return { error: 'Anda tidak memiliki hak akses untuk mencatat transaksi simpanan anggota lain.' }
  }

  const communityId = formData.get('communityId') as string
  const type = (formData.get('type') as string) || 'WAJIB' // POKOK, WAJIB, SUKARELA
  const transactionType = (formData.get('transactionType') as string) || 'SETOR' // SETOR, TARIK
  const amount = Number(formData.get('amount') || 0)
  const dateStr = formData.get('date') as string
  const notes = (formData.get('notes') as string) || ''

  if (!communityId || !userId) {
    return { error: 'Komunitas dan anggota wajib dipilih.' }
  }

  if (amount <= 0) {
    return { error: 'Nominal transaksi simpanan harus lebih dari 0.' }
  }

  const date = dateStr ? new Date(dateStr) : new Date()

  try {
    const tx = await DataStore.createSavingsTransaction({
      communityId,
      userId,
      type,
      transactionType,
      amount,
      date,
      notes,
      createdById: currentUser.id
    })

    revalidatePath(`/community/${communityId}`)
    return { success: true, transaction: tx }
  } catch (error: any) {
    return { error: error.message || 'Gagal mencatat transaksi simpanan.' }
  }
}

export async function getCommunitySavingsSummaryAction(communityId: string) {
  if (!communityId) return { success: false, error: 'Community ID required' }

  try {
    const transactions = await DataStore.getSavingsTransactions(communityId)
    const allUsers: any[] = typeof (DataStore as any).getUsers === 'function' ? await (DataStore as any).getUsers() : []
    const communityMembers = allUsers.filter((u: any) => u.indukCommunityId === communityId)

    let totalPokok = 0
    let totalWajib = 0
    let totalSukarela = 0

    const memberBalances: Record<string, { pokok: number; wajib: number; sukarela: number; total: number }> = {}

    for (const member of communityMembers) {
      memberBalances[member.id] = { pokok: 0, wajib: 0, sukarela: 0, total: 0 }
    }

    for (const tx of transactions) {
      const { userId, type, transactionType, amount } = tx
      if (!memberBalances[userId]) {
        memberBalances[userId] = { pokok: 0, wajib: 0, sukarela: 0, total: 0 }
      }

      const isSetor = transactionType === 'SETOR'
      const val = isSetor ? amount : -amount

      if (type === 'POKOK') {
        memberBalances[userId].pokok += val
        totalPokok += val
      } else if (type === 'WAJIB') {
        memberBalances[userId].wajib += val
        totalWajib += val
      } else {
        memberBalances[userId].sukarela += val
        totalSukarela += val
      }

      memberBalances[userId].total += val
    }

    const totalSavingsCommunity = totalPokok + totalWajib + totalSukarela

    // Fetch and aggregate completed order transaction volumes for Jasa Usaha
    const orders: any[] = typeof (DataStore as any).getOrders === 'function' ? await (DataStore as any).getOrders() : []
    const currentYear = new Date().getFullYear()
    const yearStartDate = new Date(currentYear, 0, 1)
    const yearEndDate = new Date(currentYear, 11, 31, 23, 59, 59)

    const completedOrdersInYear = orders.filter((o: any) => {
      const d = new Date(o.createdAt || o.date)
      return d >= yearStartDate && d <= yearEndDate && o.status === 'COMPLETED'
    })

    let totalTransaksiCommunity = 0
    const memberTransaksi: Record<string, number> = {}

    for (const member of communityMembers) {
      const userOrders = completedOrdersInYear.filter((o: any) => o.buyerId === member.id)
      const userTotalTx = userOrders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0)
      memberTransaksi[member.id] = userTotalTx
      totalTransaksiCommunity += userTotalTx
    }

    return {
      success: true,
      summary: {
        totalSavingsCommunity,
        totalPokok,
        totalWajib,
        totalSukarela,
        memberBalances,
        transactions,
        totalTransaksiCommunity,
        memberTransaksi
      }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
