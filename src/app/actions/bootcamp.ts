'use server'

import { DataStore } from '@/lib/data-store'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'

export async function joinBootcampAction() {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Anda harus masuk terlebih dahulu.' }
  }

  // Refresh user data from database to verify qualifications
  const fullUser = await DataStore.findUserById(user.id)
  if (!fullUser) {
    return { error: 'Pengguna tidak ditemukan.' }
  }

  if (fullUser.role !== 'MERCHANT' && fullUser.role !== 'AFFILIATE' && fullUser.role !== 'ADMIN') {
    return { error: 'Hanya merchant mitra yang dapat bergabung ke bootcamp.' }
  }

  if (fullUser.level < 2) {
    return { error: 'Kualifikasi belum terpenuhi. Anda harus mencapai minimal Level 2.' }
  }

  if (fullUser.bootcampStatus !== 'QUALIFIED') {
    return { error: 'Bootcamp belum diaktifkan oleh admin untuk akun Anda.' }
  }

  try {
    await DataStore.joinBootcamp(user.id)
    revalidatePath('/merchant/dashboard')
    revalidatePath('/admin')
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal bergabung ke bootcamp.' }
  }
}
