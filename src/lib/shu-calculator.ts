import { DataStore } from '@/lib/data-store'

export interface ShuCalculationParams {
  communityId: string
  year: number
  totalNetProfit: number
  pctCadangan: number
  pctJasaModal: number
  pctJasaUsaha: number
  pctPengurus: number
  pctPengawas: number
  pctKaryawan: number
  pctPendidikan: number
  pctSosial: number
  pctPembangunanDaerah: number
}

export interface ShuCalculationResult {
  config: any
  allocations: {
    cadangan: number
    jasaModal: number
    jasaUsaha: number
    pengurus: number
    pengawas: number
    karyawan: number
    pendidikan: number
    sosial: number
    pembangunanDaerah: number
  }
  memberDistributions: Array<{
    userId: string
    userName: string
    userEmail: string
    simpananMember: number
    simpananTotalCommunity: number
    shuJasaModalAmount: number
    transaksiMember: number
    transaksiTotalCommunity: number
    shuJasaUsahaAmount: number
    totalShuAmount: number
  }>
}

export async function calculateAndSaveShuDistribution(
  params: ShuCalculationParams
): Promise<{ success: boolean; result?: ShuCalculationResult; error?: string }> {
  const {
    communityId,
    year,
    totalNetProfit,
    pctCadangan,
    pctJasaModal,
    pctJasaUsaha,
    pctPengurus,
    pctPengawas,
    pctKaryawan,
    pctPendidikan,
    pctSosial,
    pctPembangunanDaerah
  } = params

  // 1. Validate total percentage equals 100
  const totalPct =
    pctCadangan +
    pctJasaModal +
    pctJasaUsaha +
    pctPengurus +
    pctPengawas +
    pctKaryawan +
    pctPendidikan +
    pctSosial +
    pctPembangunanDaerah

  if (Math.abs(totalPct - 100) > 0.01) {
    return {
      success: false,
      error: `Total persentase komposisi SHU harus bernilai tepat 100%. Saat ini: ${totalPct.toFixed(2)}%`
    }
  }

  if (totalNetProfit <= 0) {
    return {
      success: false,
      error: 'Nominal Laba Bersih Koperasi (SHU Kotor) harus lebih dari 0.'
    }
  }

  // 2. Compute nominal amounts for each component
  const allocations = {
    cadangan: (totalNetProfit * pctCadangan) / 100,
    jasaModal: (totalNetProfit * pctJasaModal) / 100,
    jasaUsaha: (totalNetProfit * pctJasaUsaha) / 100,
    pengurus: (totalNetProfit * pctPengurus) / 100,
    pengawas: (totalNetProfit * pctPengawas) / 100,
    karyawan: (totalNetProfit * pctKaryawan) / 100,
    pendidikan: (totalNetProfit * pctPendidikan) / 100,
    sosial: (totalNetProfit * pctSosial) / 100,
    pembangunanDaerah: (totalNetProfit * pctPembangunanDaerah) / 100
  }

  // 3. Fetch all users registered under this community (as primary or member)
  const memberships = await DataStore.getIndukCommunityMembers(communityId)
  const communityMembers = (memberships || []).map((m: any) => m.user).filter(Boolean)

  // 4. Fetch orders in the year to compute transactions
  const allOrders: any[] = typeof (DataStore as any).getAllOrders === 'function' ? await (DataStore as any).getAllOrders() : []
  const yearStartDate = new Date(year, 0, 1)
  const yearEndDate = new Date(year, 11, 31, 23, 59, 59)

  const completedOrdersInYear = allOrders.filter((o: any) => {
    const d = new Date(o.createdAt)
    return d >= yearStartDate && d <= yearEndDate && o.status === 'COMPLETED'
  })

  // 5. Fetch savings transactions to calculate actual member savings balances
  const savingsTxs: any[] = typeof (DataStore as any).getSavingsTransactions === 'function' 
    ? await (DataStore as any).getSavingsTransactions(communityId) 
    : []

  let simpananTotalCommunity = 0
  let transaksiTotalCommunity = 0

  const memberDataMap: Record<string, { simpanan: number; transaksi: number }> = {}

  for (const user of communityMembers) {
    const userSavingsTxs = savingsTxs.filter((t: any) => t.userId === user.id && new Date(t.date || t.createdAt) <= yearEndDate)
    
    let userSimpanan = 0
    if (userSavingsTxs.length > 0) {
      userSimpanan = userSavingsTxs.reduce((sum: number, t: any) => {
        const val = Number(t.amount || 0)
        return t.transactionType === 'SETOR' ? sum + val : sum - val
      }, 0)
      if (userSimpanan < 0) userSimpanan = 0
    } else {
      // Default baseline estimate if no explicit transactions recorded yet
      const comms: any[] = typeof (DataStore as any).getCommunities === 'function' ? await (DataStore as any).getCommunities() : []
      const comm = comms.find((c: any) => c.id === communityId)
      const sPokok = comm?.simpananPokok || 100000
      const sWajib = comm?.simpananWajib || 25000
      userSimpanan = sPokok + sWajib * 12
    }

    const userOrders = completedOrdersInYear.filter((o: any) => o.buyerId === user.id)
    const userTransaksi = userOrders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0)

    memberDataMap[user.id] = {
      simpanan: userSimpanan,
      transaksi: userTransaksi
    }

    simpananTotalCommunity += userSimpanan
    transaksiTotalCommunity += userTransaksi
  }

  // 6. Calculate member distribution breakdown
  const memberDistributions = communityMembers.map((user: any) => {
    const data = memberDataMap[user.id] || { simpanan: 0, transaksi: 0 }
    
    const shuJasaModalAmount = simpananTotalCommunity > 0
      ? (data.simpanan / simpananTotalCommunity) * allocations.jasaModal
      : 0

    const shuJasaUsahaAmount = transaksiTotalCommunity > 0
      ? (data.transaksi / transaksiTotalCommunity) * allocations.jasaUsaha
      : 0

    const totalShuAmount = shuJasaModalAmount + shuJasaUsahaAmount

    return {
      communityId,
      userId: user.id,
      userName: user.name || 'Anggota Koperasi',
      userEmail: user.email || '',
      year,
      simpananMember: data.simpanan,
      simpananTotalCommunity,
      shuJasaModalAmount,
      transaksiMember: data.transaksi,
      transaksiTotalCommunity,
      shuJasaUsahaAmount,
      totalShuAmount
    }
  })

  // 7. Save config to database
  const config = await DataStore.upsertShuConfig({
    communityId,
    year,
    totalNetProfit,
    pctCadangan,
    pctJasaModal,
    pctJasaUsaha,
    pctPengurus,
    pctPengawas,
    pctKaryawan,
    pctPendidikan,
    pctSosial,
    pctPembangunanDaerah
  })

  // 8. Save member distributions to database
  if (config && config.id) {
    await DataStore.saveShuMemberDistributions(config.id, memberDistributions)
  }

  return {
    success: true,
    result: {
      config,
      allocations,
      memberDistributions
    }
  }
}
