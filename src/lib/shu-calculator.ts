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
  const allUsers = await DataStore.getUsers()
  const communityMembers = allUsers.filter(u => u.indukCommunityId === communityId)

  // 4. Fetch orders in the year to compute transactions
  const allOrders = await DataStore.getOrders()
  const yearStartDate = new Date(year, 0, 1)
  const yearEndDate = new Date(year, 11, 31, 23, 59, 59)

  const completedOrdersInYear = allOrders.filter(o => {
    const d = new Date(o.createdAt)
    return d >= yearStartDate && d <= yearEndDate && o.status === 'COMPLETED'
  })

  // 5. Calculate totals for community
  let simpananTotalCommunity = 0
  let transaksiTotalCommunity = 0

  const memberDataMap: Record<string, { simpanan: number; transaksi: number }> = {}

  for (const user of communityMembers) {
    // Get community membership info or default fees
    const comm = await DataStore.getCommunities().then(comms => comms.find(c => c.id === communityId))
    const sPokok = comm?.simpananPokok || 100000
    const sWajib = comm?.simpananWajib || 25000
    const userSimpanan = sPokok + sWajib * 12 // Annual estimated mandatory savings

    const userOrders = completedOrdersInYear.filter(o => o.buyerId === user.id)
    const userTransaksi = userOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)

    memberDataMap[user.id] = {
      simpanan: userSimpanan,
      transaksi: userTransaksi
    }

    simpananTotalCommunity += userSimpanan
    transaksiTotalCommunity += userTransaksi
  }

  // 6. Calculate member distribution breakdown
  const memberDistributions = communityMembers.map(user => {
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
