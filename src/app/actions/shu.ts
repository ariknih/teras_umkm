'use server'

import { getCurrentUser } from '@/app/actions/auth'
import { DataStore } from '@/lib/data-store'
import { calculateAndSaveShuDistribution } from '@/lib/shu-calculator'
import { revalidatePath } from 'next/cache'

export async function calculateAndSaveShuAction(formData: FormData) {
  const currentUser = await getCurrentUser()
  if (!currentUser || (currentUser.role !== 'ADMIN' && !(currentUser as any).isSuperAdmin)) {
    return { error: 'Anda tidak memiliki hak akses untuk mengelola SHU Koperasi.' }
  }

  const communityId = formData.get('communityId') as string
  const year = Number(formData.get('year') || new Date().getFullYear())
  const totalNetProfit = Number(formData.get('totalNetProfit') || 0)

  const pctCadangan = Number(formData.get('pctCadangan') || 25)
  const pctJasaModal = Number(formData.get('pctJasaModal') || 20)
  const pctJasaUsaha = Number(formData.get('pctJasaUsaha') || 30)
  const pctPengurus = Number(formData.get('pctPengurus') || 10)
  const pctPengawas = Number(formData.get('pctPengawas') || 5)
  const pctKaryawan = Number(formData.get('pctKaryawan') || 5)
  const pctPendidikan = Number(formData.get('pctPendidikan') || 2.5)
  const pctSosial = Number(formData.get('pctSosial') || 2.5)
  const pctPembangunanDaerah = Number(formData.get('pctPembangunanDaerah') || 0)

  if (!communityId) {
    return { error: 'Komunitas Koperasi wajib dipilih.' }
  }

  const res = await calculateAndSaveShuDistribution({
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

  if (res.success) {
    revalidatePath('/admin')
    revalidatePath(`/community/${communityId}`)
    return { success: true, data: res.result }
  } else {
    return { error: res.error || 'Gagal menghitung pembagian SHU.' }
  }
}

export async function getCommunityShuDataAction(communityId: string, year?: number) {
  const targetYear = year || new Date().getFullYear()
  const config = await DataStore.getShuConfigByCommunityAndYear(communityId, targetYear)
  const history = await DataStore.getCommunityShuHistory(communityId)
  
  return {
    success: true,
    config,
    history
  }
}

export async function getUserShuSummaryAction(communityId: string, year?: number) {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'User tidak terautentikasi' }

  const distributions = await DataStore.getMemberShuDistribution(user.id, communityId, year)
  return {
    success: true,
    distributions
  }
}
