'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  createServiceBookingAction,
  setServiceAvailabilityAction
} from '@/app/actions/services'
import {
  MapPin,
  Calendar,
  Clock,
  Settings,
  Star,
  Check,
  CheckCircle2,
  MessageCircle,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  Store,
  CalendarCheck
} from 'lucide-react'

interface ServiceBookingClientProps {
  service: any
  initialAvailability: any[]
  currentUser?: any
}

const TIME_SLOTS = [
  '09:00 - 10:00',
  '10:30 - 11:30',
  '13:00 - 14:00',
  '14:30 - 15:30',
  '16:00 - 17:00',
  '19:00 - 20:00'
]

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
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('09:00 - 10:00')
  const [notes, setNotes] = useState('')
  const [availability, setAvailability] = useState<any[]>(initialAvailability)
  const [bookingSuccess, setBookingSuccess] = useState<any>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Review states
  const [reviews, setReviews] = useState<any[]>([])
  const [userRating, setUserRating] = useState(5)
  const [userComment, setUserComment] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewSuccess, setReviewSuccess] = useState(false)

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
        timeSlot: selectedPricingType === 'SESSION' ? selectedTimeSlot : undefined,
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
      {/* Left Column: Service Details, Availability, & Reviews */}
      <div className="lg:col-span-2 space-y-6">
        {/* Main Service Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs p-6 md:p-8 space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-[#006E24]/10 text-[#006E24] text-xs font-bold px-3 py-1 rounded-full">
                {service.category}
              </span>
              {service.location && (
                <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-xs font-medium px-3 py-1 rounded-full">
                  <MapPin className="w-3.5 h-3.5 text-[#006E24]" />
                  <span>{service.location}</span>
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

          {/* Pricing Options Overview - Clean & Consistent Typography */}
          <div className="border-t border-slate-100 pt-6 space-y-3">
            <h3 className="font-bold text-slate-800 text-base">Opsi & Skema Tarif</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {service.pricePerSession ? (
                <div className={`p-4 rounded-2xl border transition-all ${
                  selectedPricingType === 'SESSION'
                    ? 'border-[#006E24] bg-emerald-50/40 shadow-xs'
                    : 'border-slate-200/80 bg-slate-50/50'
                }`}>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Paket Sesi ({service.sessionDurationMinutes || 60} Menit)</span>
                  </div>
                  <h4 className="text-xl font-extrabold text-slate-900 mt-1">
                    Rp {service.pricePerSession.toLocaleString('id-ID')}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Konsultasi atau pengerjaan fokus per pertemuan.
                  </p>
                </div>
              ) : null}

              {service.pricePerDay ? (
                <div className={`p-4 rounded-2xl border transition-all ${
                  selectedPricingType === 'DAILY'
                    ? 'border-[#006E24] bg-emerald-50/40 shadow-xs'
                    : 'border-slate-200/80 bg-slate-50/50'
                }`}>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Paket Harian (Maks. {service.maxWorkHoursPerDay || 8} Jam)</span>
                  </div>
                  <h4 className="text-xl font-extrabold text-slate-900 mt-1">
                    Rp {service.pricePerDay.toLocaleString('id-ID')}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Pengerjaan penuh satu hari kerja di lokasi atau remote.
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          {/* Availability Calendar */}
          <div className="border-t border-slate-100 pt-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Jadwal & Ketersediaan Tanggal</h3>
                <p className="text-xs text-slate-500">Pilih tanggal pengerjaan yang tersedia di bawah.</p>
              </div>
              {isOwner && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 text-[11px] font-semibold rounded-lg border border-amber-200">
                  <Settings className="w-3.5 h-3.5 text-amber-700" />
                  <span>Mode Pemilik: Klik tanggal untuk buka/tutup ketersediaan</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
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
                        ? 'border-[#006E24] bg-[#006E24] text-white shadow-sm'
                        : isAvail
                        ? 'border-slate-200 bg-white text-slate-800 hover:border-emerald-300 hover:bg-emerald-50/30'
                        : 'border-slate-200/60 bg-slate-100 text-slate-400 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <p className="text-[10px] font-semibold uppercase">{dayName}</p>
                    <p className="text-base font-extrabold my-0.5">{dayNum}</p>
                    <p className="text-[10px] font-medium">{monthName}</p>
                    <span className={`inline-block w-1.5 h-1.5 rounded-full mt-1.5 ${
                      isSelected ? 'bg-white' : isAvail ? 'bg-[#006E24]' : 'bg-slate-300'
                    }`} />
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Reviews and Ratings Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-xs space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
              <div>
                <h3 className="font-bold text-slate-900 text-base">Ulasan & Testimoni Klien</h3>
                <p className="text-xs text-slate-500">Ulasan kepuasan dari klien yang telah menggunakan jasa ini.</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-900 rounded-xl font-bold text-xs border border-amber-200/60">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span>5.0</span>
              <span className="text-slate-400 font-normal">({reviews.length} ulasan)</span>
            </div>
          </div>

          {/* Reviews list */}
          <div className="space-y-3">
            {reviews.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Belum ada ulasan untuk layanan ini. Jadilah klien pertama yang memberikan testimoni!
              </div>
            ) : (
              reviews.map((r: any) => (
                <div key={r.id} className="p-4 bg-slate-50/70 rounded-2xl space-y-2 border border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800 text-xs">{r.userName || 'Klien'}</span>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: r.rating || 5 }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{r.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Checkout & Booking Order Card */}
      <div className="space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-xs space-y-6 sticky top-8">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900">Formulir Booking Jasa</h3>
            <p className="text-xs text-slate-500 mt-0.5">Sistem pembayaran escrow aman & bergaransi.</p>
          </div>

          {bookingSuccess ? (
            <div className="bg-emerald-50/60 border border-emerald-200 p-5 rounded-2xl space-y-4 text-center animate-in zoom-in-95">
              <div className="w-12 h-12 rounded-full bg-[#006E24] text-white flex items-center justify-center mx-auto">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">Booking Berhasil Dibuat!</h4>
                <p className="text-xs text-slate-600 mt-1">
                  ID Booking: <span className="font-bold text-slate-800">#{bookingSuccess.id.slice(-8).toUpperCase()}</span>
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Tanggal: <strong>{new Date(bookingSuccess.bookingDate).toLocaleDateString('id-ID')}</strong>
                  {bookingSuccess.timeSlot ? ` (${bookingSuccess.timeSlot})` : ''}
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Halo, saya telah membuat pesanan booking jasa "${service.title}" untuk tanggal ${new Date(bookingSuccess.bookingDate).toLocaleDateString('id-ID')} ${bookingSuccess.timeSlot || ''}. Mohon konfirmasi jadwalnya ya!`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 bg-[#006E24] hover:bg-[#00551c] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Hubungi via WhatsApp</span>
                </a>
                <Link
                  href="/orders"
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-slate-200"
                >
                  <span>Lihat Pesanan Saya</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleBookingSubmit} className="space-y-5">
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Pricing Type Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Pilih Skema Tarif
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {service.pricePerSession ? (
                    <button
                      type="button"
                      onClick={() => setSelectedPricingType('SESSION')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedPricingType === 'SESSION'
                          ? 'border-[#006E24] bg-emerald-50/40 text-slate-900 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                        <Clock className="w-3 h-3" />
                        <span>Per Sesi</span>
                      </div>
                      <p className="text-sm font-extrabold text-slate-900 mt-1">
                        Rp {service.pricePerSession.toLocaleString('id-ID')}
                      </p>
                    </button>
                  ) : null}

                  {service.pricePerDay ? (
                    <button
                      type="button"
                      onClick={() => setSelectedPricingType('DAILY')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedPricingType === 'DAILY'
                          ? 'border-[#006E24] bg-emerald-50/40 text-slate-900 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                        <Calendar className="w-3 h-3" />
                        <span>Per Hari</span>
                      </div>
                      <p className="text-sm font-extrabold text-slate-900 mt-1">
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
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">
                    {selectedDate
                      ? new Date(selectedDate).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'Belum memilih tanggal (klik di kalender)'}
                  </span>
                  {selectedDate && (
                    <span className="inline-flex items-center gap-1 text-[#006E24] font-bold text-xs">
                      <Check className="w-3.5 h-3.5" />
                      <span>Tersedia</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Time-Slot Picker for SESSION */}
              {selectedPricingType === 'SESSION' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Pilih Slot Jam Sesi (60 Menit)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {TIME_SLOTS.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedTimeSlot(slot)}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          selectedTimeSlot === slot
                            ? 'bg-[#006E24] text-white border-[#006E24] shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <Clock className={`w-3 h-3 ${selectedTimeSlot === slot ? 'text-white' : 'text-slate-400'}`} />
                        <span>{slot}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Customer Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Catatan / Kebutuhan Khusus (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Jelaskan kebutuhan pekerjaan atau instruksi tambahan..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#006E24] focus:bg-white transition-all"
                />
              </div>

              {/* Cost Calculation */}
              <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Biaya Layanan Jasa ({selectedPricingType === 'DAILY' ? 'Per Hari' : 'Per Sesi'})</span>
                  <span className="font-bold text-slate-900">Rp {basePrice.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Biaya Layanan Platform Saloka</span>
                  <span className="font-bold text-[#006E24]">Rp {adminFee.toLocaleString('id-ID')}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm font-extrabold text-slate-900">
                  <span>Total Pembayaran</span>
                  <span className="text-[#006E24] text-base font-extrabold">Rp {totalPrice.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isPending || !selectedDate}
                className="w-full py-3 bg-[#006E24] hover:bg-[#00551c] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <span>Memproses Booking...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Konfirmasi & Booking Sekarang</span>
                  </>
                )}
              </button>

              <p className="text-[10px] text-center text-slate-400 leading-tight">
                Dana ditampung aman oleh Saloka dan baru diteruskan ke penyedia jasa setelah sesi pekerjaan selesai dikonfirmasi.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
