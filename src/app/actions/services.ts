'use server'

import { DataStore } from '@/lib/data-store'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'
import { cacheWrap, invalidateCachePattern } from '@/lib/cache'

export async function getServicesAction(filters?: { category?: string; search?: string; merchantId?: string }) {
  try {
    let services = await DataStore.getServices({
      category: filters?.category,
      merchantId: filters?.merchantId,
      isActive: true
    })
    
    if (!services || services.length === 0) {
      const { mockServices } = await import('@/lib/mock-seed')
      services = [...mockServices]
      if (filters?.category && filters.category !== 'Semua Kategori') {
        services = services.filter((s: any) => s.category === filters.category)
      }
      if (filters?.merchantId) {
        services = services.filter((s: any) => s.merchantId === filters.merchantId)
      }
    }
    
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
    try {
      const { mockServices } = await import('@/lib/mock-seed')
      return mockServices || []
    } catch {
      return []
    }
  }
}

export async function getServiceByIdAction(id: string) {
  try {
    const services = await DataStore.getServices()
    const svc = services.find((s: any) => s.id === id)
    if (svc) return svc

    const { mockServices } = await import('@/lib/mock-seed')
    return mockServices.find((s: any) => s.id === id) || null
  } catch (error: any) {
    try {
      const { mockServices } = await import('@/lib/mock-seed')
      return mockServices.find((s: any) => s.id === id) || null
    } catch {
      return null
    }
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
    await invalidateCachePattern('services:')
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
    await invalidateCachePattern('services:')
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
    await invalidateCachePattern('services:')
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

import { sendEmail } from '@/lib/maileroo'

export async function createServiceBookingAction(data: {
  serviceId: string
  bookingDate: string
  endDate?: string
  totalDays?: number
  timeSlot?: string
  pricingType: 'SESSION' | 'DAILY'
  customerNote?: string
}) {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Silakan login terlebih dahulu untuk melakukan booking jasa.' }

  try {
    const service = await getServiceByIdAction(data.serviceId)
    if (!service) return { success: false, error: 'Layanan jasa tidak ditemukan.' }

    const bookingDate = new Date(data.bookingDate)
    
    // Calculate total days/sessions for booking with range
    let totalDays = 1
    if (data.endDate) {
      const end = new Date(data.endDate)
      const diffTime = end.getTime() - bookingDate.getTime()
      totalDays = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1)
    }

    const rate = data.pricingType === 'DAILY' ? (service.pricePerDay || 0) : (service.pricePerSession || 0)
    if (rate <= 0) return { success: false, error: 'Tarif untuk opsi ini belum ditentukan oleh penyedia jasa.' }

    const basePrice = rate * totalDays
    const adminFee = 2500
    const totalPrice = basePrice + adminFee

    const booking = await DataStore.createServiceBooking({
      serviceId: data.serviceId,
      customerId: user.id,
      merchantId: service.merchantId,
      bookingDate,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      totalDays,
      timeSlot: data.timeSlot || null,
      pricingType: data.pricingType,
      basePrice,
      adminFee,
      totalPrice,
      status: 'PENDING',
      notes: data.customerNote || null
    })

    const unitLabel = data.pricingType === 'DAILY' ? 'Hari' : 'Sesi'
    const dateDisplay = data.endDate && totalDays > 1
      ? `${bookingDate.toLocaleDateString('id-ID')} s/d ${new Date(data.endDate).toLocaleDateString('id-ID')} (${totalDays} ${unitLabel})`
      : `${bookingDate.toLocaleDateString('id-ID')}`

    // Notify Merchant via Maileroo Email (Non-blocking)
    try {
      const merchant = await DataStore.findUserById(service.merchantId)
      if (merchant?.email) {
        await sendEmail({
          to: merchant.email,
          toName: merchant.name || 'Merchant Saloka',
          subject: `🔔 Pesanan Booking Jasa Baru: ${service.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
              <h2 style="color: #0F5132; margin-bottom: 8px;">Pesanan Booking Jasa Baru!</h2>
              <p style="color: #475569; font-size: 14px;">Halo <strong>${merchant.name}</strong>, Anda mendapatkan pesanan booking baru di platform Saloka.id.</p>
              
              <div style="background-color: #f8fafc; padding: 16px; border-radius: 12px; margin: 20px 0; font-size: 14px;">
                <p style="margin: 4px 0;"><strong>Layanan:</strong> ${service.title}</p>
                <p style="margin: 4px 0;"><strong>Klien:</strong> ${user.name} (${user.email})</p>
                <p style="margin: 4px 0;"><strong>Jadwal:</strong> ${dateDisplay} ${data.timeSlot ? `(${data.timeSlot})` : ''}</p>
                <p style="margin: 4px 0;"><strong>Paket:</strong> ${data.pricingType === 'DAILY' ? 'Per Hari' : 'Per Sesi'} (${totalDays} ${unitLabel} @ Rp ${rate.toLocaleString('id-ID')})</p>
                <p style="margin: 4px 0;"><strong>Total Nilai:</strong> Rp ${totalPrice.toLocaleString('id-ID')}</p>
                ${data.customerNote ? `<p style="margin: 4px 0;"><strong>Catatan Klien:</strong> "${data.customerNote}"</p>` : ''}
              </div>

              <a href="https://saloka.id/merchant/dashboard?tab=bookings" style="display: inline-block; background-color: #2DB24A; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">
                Konfirmasi Jadwal di Dashboard
              </a>
              
              <p style="color: #94a3b8; font-size: 11px; margin-top: 24px;">Saloka.id - Ekosistem Bisnis & Layanan UMKM Terpercaya</p>
            </div>
          `
        })
      }
    } catch (e) {
      console.warn('Maileroo notification error:', e)
    }

    // Log to Audit Log
    await DataStore.createAuditLog({
      actor: 'MEMBER',
      actorId: user.id,
      actorName: user.name,
      action: 'BOOK_SERVICE',
      module: 'JASA',
      targetId: booking.id,
      targetType: 'BOOKING',
      detail: `Booking jasa "${service.title}" (${data.pricingType}${data.timeSlot ? ` - ${data.timeSlot}` : ''}) ${dateDisplay}`
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
    
    // ESCROW AUTO-RELEASE: If status is completed, credit the merchant's wallet balance
    if (status === 'COMPLETED' && updated) {
      try {
        const payoutAmount = updated.basePrice || 0
        if (payoutAmount > 0) {
          await (DataStore as any).creditWallet(updated.merchantId, payoutAmount, `Penghasilan Booking Jasa #${bookingId.slice(-6).toUpperCase()}`)
          await DataStore.createAuditLog({
            actor: 'ADMIN',
            actorId: 'system-escrow',
            actorName: 'Saloka Escrow System',
            action: 'RELEASE_ESCROW',
            module: 'WALLET',
            targetId: bookingId,
            targetType: 'PAYOUT',
            detail: `Dana escrow booking senilai Rp ${payoutAmount.toLocaleString('id-ID')} berhasil diteruskan ke saldo dompet merchant.`
          })
        }
      } catch (escrowErr) {
        console.warn('Escrow release note:', escrowErr)
      }
    }

    // Customer Notification via Email
    try {
      if (updated?.customerId) {
        const customer = await DataStore.findUserById(updated.customerId)
        if (customer?.email) {
          const statusText = status === 'CONFIRMED' ? 'Jadwal Telah Dikonfirmasi' : status === 'COMPLETED' ? 'Layanan Selesai Dikerjakan' : 'Status Booking Diperbarui'
          await sendEmail({
            to: customer.email,
            toName: customer.name || 'Pelanggan Saloka',
            subject: `✓ Update Booking Jasa: ${statusText}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
                <h2 style="color: #0F5132; margin-bottom: 8px;">Update Booking Jasa Anda</h2>
                <p style="color: #475569; font-size: 14px;">Halo <strong>${customer.name}</strong>, status pesanan booking jasa Anda saat ini adalah: <strong style="color: #2DB24A;">${status}</strong>.</p>
                <p style="color: #64748b; font-size: 13px;">Silakan login ke akun Saloka Anda untuk melihat detail jadwal atau memberikan testimoni kepuasan.</p>
                <a href="https://saloka.id/orders" style="display: inline-block; background-color: #2DB24A; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px; margin-top: 12px;">
                  Lihat Pesanan Saya
                </a>
              </div>
            `
          })
        }
      }
    } catch (notifErr) {
      console.warn('Customer status email notification note:', notifErr)
    }

    revalidatePath('/orders')
    revalidatePath('/merchant/dashboard')
    revalidatePath('/jasa')
    return { success: true, booking: updated }
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mengubah status booking.' }
  }
}

// ─── SERVICE REVIEWS & RATINGS ──────────────────────────────────────────
export async function getServiceReviewsAction(serviceId: string) {
  try {
    if (!(globalThis as any).__mockServiceReviews) {
      const { mockServiceReviews } = await import('@/lib/mock-seed')
      ;(globalThis as any).__mockServiceReviews = [...mockServiceReviews]
    }
    const reviews = (globalThis as any).__mockServiceReviews || []
    return reviews.filter((r: any) => r.serviceId === serviceId)
  } catch (e) {
    return []
  }
}

export async function submitServiceReviewAction(serviceId: string, rating: number, comment: string) {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Silakan login terlebih dahulu untuk memberikan ulasan.' }

  try {
    if (!rating || rating < 1 || rating > 5) {
      return { success: false, error: 'Rating bintang harus antara 1 sampai 5.' }
    }

    if (!(globalThis as any).__mockServiceReviews) (globalThis as any).__mockServiceReviews = []
    const newReview = {
      id: `rev-${Date.now()}`,
      serviceId,
      userId: user.id,
      userName: user.name,
      rating,
      comment: comment.trim(),
      createdAt: new Date().toISOString()
    }
    ;(globalThis as any).__mockServiceReviews.push(newReview)

    revalidatePath(`/jasa/${serviceId}`)
    return { success: true, review: newReview }
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mengirim ulasan.' }
  }
}
