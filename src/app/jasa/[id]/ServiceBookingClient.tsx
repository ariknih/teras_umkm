'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  createServiceBookingAction,
  setServiceAvailabilityAction
} from '@/app/actions/services'

interface ServiceBookingClientProps {
  service: any
  initialAvailability: any[]
  currentUser?: any
}

export default function ServiceBookingClient({
  service,
  initialAvailability,
  currentUser
}: ServiceBookingClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [selectedPricingType, setSelectedPricingType] = useState<'SESSION' | 'DAILY'>(
    service.pricePerSession ? 'SESSION' : 'DAILY'
  )
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [availability, setAvailability] = useState<any[]>(initialAvailability)
  const [bookingSuccess, setBookingSuccess] = useState<any>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const isOwner = currentUser && currentUser.id === service.merchantId

  // Generate next 14 days calendar
  const nextDays = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i + 1)
    return d.toISOString().split('T')[0]
  })

  const isDateAvailable = (dateStr: string) => {
    const found = availability.find((a) => {
      const aDate = new Date(a.date).toISOString().split('T')[0]
      return aDate === dateStr
    })
    return found ? found.isAvailable : true
  }

  const handleToggleMyAvailability = async (dateStr: string, currentAvail: boolean) => {
    startTransition(async () => {
      const res = await setServiceAvailabilityAction(service.id, dateStr, !currentAvail)
      if (res.success) {
        setAvailability((prev) => {
          const idx = prev.findIndex((a) => new Date(a.date).toISOString().split('T')[0] === dateStr)
          if (idx >= 0) {
            const copy = [...prev]
            copy[idx] = { ...copy[idx], isAvailable: !currentAvail }
            return copy
          }
          return [...prev, { serviceId: service.id, date: new Date(dateStr), isAvailable: !currentAvail }]
        })
      }
    })
  }

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) {
      router.push(`/auth?redirect=/jasa/${service.id}`)
      return
    }

    if (!selectedDate) {
      setErrorMessage('Silakan pilih tanggal booking terlebih dahulu.')
      return
    }

    setErrorMessage(null)
    startTransition(async () => {
      const res = await createServiceBookingAction({
        serviceId: service.id,
        bookingDate: selectedDate,
        pricingType: selectedPricingType,
        customerNote: notes
      })

      if (res.success) {
        setBookingSuccess(res.booking)
      } else {
        setErrorMessage(res.error || 'Gagal memproses booking jasa.')
      }
    })
  }

  const basePrice =
    selectedPricingType === 'DAILY'
      ? service.pricePerDay || 0
      : service.pricePerSession || 0
  const adminFee = 2500
  const totalPrice = basePrice + adminFee

  const images = service.images && service.images.length > 0
    ? service.images
    : ['https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=800&q=80']

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      {/* Left Column: Service Details & Availability */}
      <div className="lg:col-span-2 space-y-6">
        {/* Main Service Card */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs p-6 md:p-8 space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-emerald-100 text-[#0F5132] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                {service.category}
              </span>
              {service.location && (
                <span className="bg-slate-100 text-slate-700 text-xs font-medium px-3 py-1 rounded-full">
                  📍 {service.location}
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight">
              {service.title}
            </h1>
          </div>

          {/* Image Gallery */}
          <div className="h-64 sm:h-80 rounded-2xl overflow-hidden bg-slate-100 relative">
            <img src={images[0]} alt={service.title} className="w-full h-full object-cover" />
          </div>

          {/* Description */}
          <div className="space-y-2 border-t border-slate-100 pt-6">
            <h3 className="font-bold text-slate-800 text-base">Deskripsi & Ruang Lingkup Layanan</h3>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {service.description || 'Penyedia jasa belum menambahkan rincian deskripsi lengkap.'}
            </p>
          </div>

          {/* Pricing Options Overview */}
          <div className="border-t border-slate-100 pt-6 space-y-3">
            <h3 className="font-bold text-slate-800 text-base">Opsi & Skema Tarif</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {service.pricePerSession ? (
                <div className={`p-4 rounded-2xl border transition-all ${
                  selectedPricingType === 'SESSION' ? 'border-[#0F5132] bg-emerald-50/50' : 'border-slate-200'
                }`}>
                  <p className="text-xs font-bold text-slate-500 uppercase">Tarif Per Sesi</p>
                  <p className="text-xl font-extrabold text-[#0F5132] font-mono mt-1">
                    Rp {service.pricePerSession.toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    ⏱️ Durasi: {service.sessionDurationMinutes || 60} Menit / sesi
                  </p>
                </div>
              ) : null}

              {service.pricePerDay ? (
                <div className={`p-4 rounded-2xl border transition-all ${
                  selectedPricingType === 'DAILY' ? 'border-[#0F5132] bg-blue-50/50' : 'border-slate-200'
                }`}>
                  <p className="text-xs font-bold text-slate-500 uppercase">Tarif Harian (Full Day)</p>
                  <p className="text-xl font-extrabold text-blue-700 font-mono mt-1">
                    Rp {service.pricePerDay.toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    💼 Jam Kerja: Maksimal {service.maxWorkHoursPerDay || 8} Jam per hari
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          {/* Availability Calendar Matrix */}
          <div className="border-t border-slate-100 pt-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Kalender Ketersediaan Jadwal (14 Hari Kedepan)</h3>
                <p className="text-xs text-slate-500">Pilih tanggal yang berstatus tersedia (hijau) untuk memesan jadwal.</p>
              </div>
              {isOwner && (
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  Mode Pemilik: Klik tanggal untuk toggle ketersediaan Anda
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
              {nextDays.map((dStr) => {
                const dateObj = new Date(dStr)
                const isAvail = isDateAvailable(dStr)
                const isSelected = selectedDate === dStr
                const dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'short' })
                const dayNum = dateObj.getDate()
                const monthName = dateObj.toLocaleDateString('id-ID', { month: 'short' })

                return (
                  <button
                    key={dStr}
                    type="button"
                    disabled={!isOwner && !isAvail}
                    onClick={() => {
                      if (isOwner) {
                        handleToggleMyAvailability(dStr, isAvail)
                      } else if (isAvail) {
                        setSelectedDate(dStr)
                        setErrorMessage(null)
                      }
                    }}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#0F5132] bg-[#0F5132] text-white shadow-md'
                        : isAvail
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                        : 'border-slate-200 bg-slate-100 text-slate-400 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <p className="text-[10px] font-bold uppercase">{dayName}</p>
                    <p className="text-base font-extrabold my-0.5">{dayNum}</p>
                    <p className="text-[10px] font-medium">{monthName}</p>
                    <span className={`inline-block w-2 h-2 rounded-full mt-1.5 ${
                      isSelected ? 'bg-white' : isAvail ? 'bg-green-500' : 'bg-slate-400'
                    }`} />
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Checkout & Booking Order Card */}
      <div className="space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-md space-y-6 sticky top-8">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900">Formulir Booking Jasa</h3>
            <p className="text-xs text-slate-500 mt-0.5">Sistem pembayaran escrow aman & bergaransi.</p>
          </div>

          {bookingSuccess ? (
            <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl space-y-4 text-center animate-in zoom-in-95">
              <div className="w-12 h-12 rounded-full bg-[#0F5132] text-white flex items-center justify-center mx-auto text-xl">
                ✓
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">Booking Berhasil Dibuat!</h4>
                <p className="text-xs text-slate-600 mt-1">
                  ID Booking: <span className="font-mono font-bold">{bookingSuccess.id}</span>
                </p>
                <p className="text-xs text-slate-600">
                  Tanggal: <strong>{new Date(bookingSuccess.bookingDate).toLocaleDateString('id-ID')}</strong>
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/orders"
                  className="block w-full py-2.5 bg-[#0F5132] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow hover:bg-[#0a3a24] transition-colors"
                >
                  Lihat Daftar Pesanan & Bayar →
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleBookingSubmit} className="space-y-5">
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-medium">
                  ⚠️ {errorMessage}
                </div>
              )}

              {/* Pricing Type Radio Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Pilih Skema Tarif
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {service.pricePerSession ? (
                    <button
                      type="button"
                      onClick={() => setSelectedPricingType('SESSION')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedPricingType === 'SESSION'
                          ? 'border-[#0F5132] bg-emerald-50 text-[#0F5132] font-bold shadow-xs'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      <p className="text-xs">Per Sesi</p>
                      <p className="text-sm font-extrabold font-mono mt-0.5">
                        Rp {service.pricePerSession.toLocaleString('id-ID')}
                      </p>
                    </button>
                  ) : null}

                  {service.pricePerDay ? (
                    <button
                      type="button"
                      onClick={() => setSelectedPricingType('DAILY')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedPricingType === 'DAILY'
                          ? 'border-[#0F5132] bg-blue-50 text-blue-800 font-bold shadow-xs'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      <p className="text-xs">Per Hari</p>
                      <p className="text-sm font-extrabold font-mono mt-0.5">
                        Rp {service.pricePerDay.toLocaleString('id-ID')}
                      </p>
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Selected Date Indicator */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tanggal Booking Terpilih
                </label>
                <div className="p-3 bg-slate-50 border border-slate-300 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">
                    {selectedDate
                      ? new Date(selectedDate).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'Belum memilih tanggal (klik di kalender)'}
                  </span>
                  {selectedDate && <span className="text-green-600 font-bold">✓ Tersedia</span>}
                </div>
              </div>

              {/* Customer Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Catatan / Kebutuhan Khusus (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Jelaskan kebutuhan pekerjaan Anda..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs focus:outline-none focus:border-[#0F5132]"
                />
              </div>

              {/* Cost Calculation */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Biaya Layanan Jasa ({selectedPricingType === 'DAILY' ? 'Per Hari max 8 jam' : 'Per Sesi'})</span>
                  <span className="font-mono font-bold">Rp {basePrice.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Biaya Admin Platform Saloka</span>
                  <span className="font-mono font-bold text-emerald-700">Rp {adminFee.toLocaleString('id-ID')}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-extrabold text-slate-900">
                  <span>Total Pembayaran</span>
                  <span className="font-mono text-[#0F5132] text-base">Rp {totalPrice.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isPending || !selectedDate}
                className="w-full py-3.5 bg-[#0F5132] hover:bg-[#0a3a24] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? 'Memproses Booking...' : '🔒 Konfirmasi & Booking Sekarang'}
              </button>

              <p className="text-[10px] text-center text-slate-400 leading-tight">
                Dana ditampung aman oleh Saloka.id dan baru diteruskan ke penyedia jasa setelah sesi pekerjaan selesai dikonfirmasi.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
