'use server'

import { DataStore } from '@/lib/data-store'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'

export async function getServicesAction(filters?: { category?: string; search?: string; merchantId?: string }) {
  try {
    const services = await DataStore.getServices({
      category: filters?.category,
      merchantId: filters?.merchantId,
      isActive: true
    })
    if (filters?.search) {
      const q = filters.search.toLowerCase()
      return services.filter((s: any) =>
        s.title?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.category?.toLowerCase().includes(q)
      )
    }
    return services
  } catch (error: any) {
    return []
  }
}

export async function getServiceByIdAction(id: string) {
  try {
    const services = await DataStore.getServices()
    const svc = services.find((s: any) => s.id === id)
    return svc || null
  } catch (error: any) {
    return null
  }
}

export async function createServiceAction(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  try {
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const pricePerSession = Number(formData.get('pricePerSession') || 0)
    const pricePerDay = Number(formData.get('pricePerDay') || 0)
    const sessionDurationMinutes = Number(formData.get('sessionDurationMinutes') || 60)
    const maxWorkHoursPerDay = Number(formData.get('maxWorkHoursPerDay') || 8)
    const imagesRaw = formData.get('images') as string
    const images = imagesRaw ? JSON.parse(imagesRaw) : []
    const location = (formData.get('location') as string) || null

    if (!title || !category || (pricePerSession <= 0 && pricePerDay <= 0)) {
      return { success: false, error: 'Judul, kategori, dan salah satu tarif (per sesi / per hari) wajib diisi.' }
    }

    const service = await DataStore.createService({
      merchantId: user.id,
      title,
      description: description || '',
      category,
      pricePerSession,
      pricePerDay,
      sessionDurationMinutes,
      maxWorkHoursPerDay,
      images,
      location,
      isActive: true
    })

    revalidatePath('/jasa')
    revalidatePath('/merchant/dashboard')
    return { success: true, service }
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal membuat layanan jasa.' }
  }
}

export async function updateServiceAction(id: string, formData: FormData) {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  try {
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const pricePerSession = Number(formData.get('pricePerSession') || 0)
    const pricePerDay = Number(formData.get('pricePerDay') || 0)
    const sessionDurationMinutes = Number(formData.get('sessionDurationMinutes') || 60)
    const maxWorkHoursPerDay = Number(formData.get('maxWorkHoursPerDay') || 8)
    const imagesRaw = formData.get('images') as string
    const images = imagesRaw ? JSON.parse(imagesRaw) : undefined
    const location = formData.get('location') as string

    const updated = await DataStore.updateService(id, {
      title,
      description,
      category,
      pricePerSession,
      pricePerDay,
      sessionDurationMinutes,
      maxWorkHoursPerDay,
      images,
      location
    })

    revalidatePath('/jasa')
    revalidatePath('/merchant/dashboard')
    return { success: true, service: updated }
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal update jasa.' }
  }
}

export async function deleteServiceAction(id: string) {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  try {
    await DataStore.deleteService(id)
    revalidatePath('/jasa')
    revalidatePath('/merchant/dashboard')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal menghapus jasa.' }
  }
}

export async function getServiceAvailabilityAction(serviceId: string) {
  try {
    const avails = await DataStore.getServiceAvailability(serviceId)
    return { success: true, avails }
  } catch (error: any) {
    return { success: false, avails: [] }
  }
}

export async function setServiceAvailabilityAction(serviceId: string, dateStr: string, isAvailable: boolean) {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  try {
    const date = new Date(dateStr)
    await DataStore.setServiceAvailability(serviceId, date, isAvailable)
    revalidatePath(`/jasa/${serviceId}`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mengatur ketersediaan.' }
  }
}

export async function createServiceBookingAction(data: {
  serviceId: string
  bookingDate: string
  pricingType: 'SESSION' | 'DAILY'
  customerNote?: string
}) {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Silakan login terlebih dahulu untuk melakukan booking jasa.' }

  try {
    const service = await getServiceByIdAction(data.serviceId)
    if (!service) return { success: false, error: 'Layanan jasa tidak ditemukan.' }

    const bookingDate = new Date(data.bookingDate)
    const basePrice = data.pricingType === 'DAILY' ? (service.pricePerDay || 0) : (service.pricePerSession || 0)
    if (basePrice <= 0) return { success: false, error: 'Tarif untuk opsi ini belum ditentukan oleh penyedia jasa.' }

    const adminFee = 2500
    const totalPrice = basePrice + adminFee

    const booking = await DataStore.createServiceBooking({
      serviceId: data.serviceId,
      customerId: user.id,
      merchantId: service.merchantId,
      bookingDate,
      pricingType: data.pricingType,
      basePrice,
      adminFee,
      totalPrice,
      status: 'PENDING',
      notes: data.customerNote || null
    })

    // Log to Audit Log
    await DataStore.createAuditLog({
      actor: 'MEMBER',
      actorId: user.id,
      actorName: user.name,
      action: 'BOOK_SERVICE',
      module: 'JASA',
      targetId: booking.id,
      targetType: 'BOOKING',
      detail: `Booking jasa "${service.title}" (${data.pricingType}) tgl ${bookingDate.toLocaleDateString('id-ID')}`
    })

    revalidatePath('/jasa')
    revalidatePath('/orders')
    return { success: true, booking }
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal memproses booking jasa.' }
  }
}

export async function getUserServiceBookingsAction() {
  const user = await getCurrentUser()
  if (!user) return []
  try {
    return await DataStore.getServiceBookings({ customerId: user.id })
  } catch (error) {
    return []
  }
}

export async function getMerchantServiceBookingsAction() {
  const user = await getCurrentUser()
  if (!user) return []
  try {
    return await DataStore.getServiceBookings({ merchantId: user.id })
  } catch (error) {
    return []
  }
}

export async function updateServiceBookingStatusAction(bookingId: string, status: string) {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  try {
    const updated = await DataStore.updateServiceBookingStatus(bookingId, status)
    revalidatePath('/orders')
    revalidatePath('/merchant/dashboard')
    return { success: true, booking: updated }
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mengubah status booking.' }
  }
}
