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
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CalendarRange
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

const DAY_NAMES = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

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
  
  // Booking mode: SINGLE (1 hari/sesi) or RANGE (rentang hari)
  const [bookingMode, setBookingMode] = useState<'SINGLE' | 'RANGE'>('SINGLE')

  // Calendar view state (Year & Month: 0-indexed)
  const today = new Date()
  const [viewYear, setViewYear] = useState<number>(today.getFullYear())
  const [viewMonth, setViewMonth] = useState<number>(today.getMonth())

  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedEndDate, setSelectedEndDate] = useState<string>('')
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

  // Month navigation restrictions (cannot navigate to past months)
  const canGoPrev = viewYear > today.getFullYear() || (viewYear === today.getFullYear() && viewMonth > today.getMonth())

  const handlePrevMonth = () => {
    if (canGoPrev) {
      if (viewMonth === 0) {
        setViewYear((prev) => prev - 1)
        setViewMonth(11)
      } else {
        setViewMonth((prev) => prev - 1)
      }
    }
  }

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((prev) => prev + 1)
      setViewMonth(0)
    } else {
      setViewMonth((prev) => prev + 1)
    }
  }

  const handleResetToCurrentMonth = () => {
    setViewYear(today.getFullYear())
    setViewMonth(today.getMonth())
  }

  // Calendar days calculation
  const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  // Monday = 0, Sunday = 6
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay()
  const firstDayOffset = (firstDayOfMonth + 6) % 7

  const isPastDate = (year: number, month: number, day: number) => {
    const target = new Date(year, month, day)
    target.setHours(23, 59, 59, 999)
    const now = new Date()
    return target < now
  }

  const formatDateKey = (year: number, month: number, day: number) => {
    const m = String(month + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    return `${year}-${m}-${d}`
  }

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

  // Handle calendar day clicks with intuitive Range support
  const handleDateClick = (dateStr: string, isAvail: boolean) => {
    if (isOwner) {
      handleToggleMyAvailability(dateStr, isAvail)
      return
    }

    if (!isAvail) {
      setErrorMessage('Tanggal ini tidak tersedia untuk booking.')
      return
    }

    // If no start date selected, or both start & end dates already selected:
    if (!selectedDate || (selectedDate && selectedEndDate)) {
      setSelectedDate(dateStr)
      setSelectedEndDate('')
      setErrorMessage(null)
      return
    }

    // When a start date is already selected and user clicks another date:
    if (dateStr > selectedDate) {
      // Check if all dates in range are available
      let hasUnavailable = false
      const cur = new Date(selectedDate)
      const end = new Date(dateStr)
      while (cur <= end) {
        const curStr = cur.toISOString().split('T')[0]
        if (!isDateAvailable(curStr)) {
          hasUnavailable = true
          break
        }
        cur.setDate(cur.getDate() + 1)
      }

      if (hasUnavailable) {
        setErrorMessage('Terdapat tanggal yang tidak tersedia/tutup di dalam rentang yang Anda pilih.')
        return
      }

      setSelectedEndDate(dateStr)
      setBookingMode('RANGE')
      setErrorMessage(null)
    } else if (dateStr === selectedDate) {
      // Clicked same date again, keep as 1 day/sesi
      setSelectedEndDate('')
      setBookingMode('SINGLE')
      setErrorMessage(null)
    } else {
      // Clicked an earlier date, make it the new start date
      setSelectedDate(dateStr)
      setSelectedEndDate('')
      setErrorMessage(null)
    }
  }

  // Total Days Calculation (works for both DAILY and SESSION packages)
  const totalDays =
    selectedDate && selectedEndDate
      ? Math.max(
          1,
          Math.round(
            (new Date(selectedEndDate).getTime() - new Date(selectedDate).getTime()) /
              (1000 * 60 * 60 * 24)
          ) + 1
        )
      : 1

  const baseRate =
    selectedPricingType === 'DAILY'
      ? service.pricePerDay || 0
      : service.pricePerSession || 0

  const basePrice = baseRate * totalDays
  const adminFee = 2500
  const totalPrice = basePrice + adminFee

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
        endDate: selectedEndDate ? selectedEndDate : undefined,
        totalDays,
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

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric'
  })

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

          {/* Pricing Options Overview */}
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
                    Pengerjaan penuh per hari, bisa booking beberapa hari (multi-day).
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          {/* Interactive Monthly Calendar & Range Picker */}
          <div className="border-t border-slate-100 pt-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Jadwal & Ketersediaan Tanggal</h3>
                <p className="text-xs text-slate-500">Pilih tanggal atau rentang hari di kalender. Bisa navigasi ke bulan-bulan berikutnya.</p>
              </div>
              {isOwner && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 text-[11px] font-semibold rounded-lg border border-amber-200">
                  <Settings className="w-3.5 h-3.5 text-amber-700" />
                  <span>Mode Pemilik: Klik tanggal untuk buka/tutup ketersediaan</span>
                </span>
              )}
            </div>

            {/* Range Booking Mode Switcher - Always Visible */}
            {!isOwner && (
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <CalendarRange className="w-4 h-4 text-[#006E24]" />
                  <span>Pilihan Durasi Jadwal:</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setBookingMode('SINGLE')
                      setSelectedEndDate('')
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      bookingMode === 'SINGLE' && !selectedEndDate
                        ? 'bg-[#006E24] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    1 Hari / Sesi
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBookingMode('RANGE')
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      bookingMode === 'RANGE' || !!selectedEndDate
                        ? 'bg-[#006E24] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Rentang Tanggal (Multi-Day)
                  </button>
                </div>
              </div>
            )}

            {/* Date Selection Status & Helper Banner */}
            {!isOwner && (
              <div className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs transition-all ${
                selectedDate && selectedEndDate
                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
                  : selectedDate
                  ? 'bg-emerald-50/40 border-emerald-200 text-slate-800'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <div className="flex items-center gap-2">
                  <CalendarCheck className={`w-4 h-4 shrink-0 ${
                    selectedDate ? 'text-[#006E24]' : 'text-slate-400'
                  }`} />
                  <div>
                    {!selectedDate ? (
                      <span className="text-slate-600">
                        Klik tanggal di kalender (klik tanggal kedua untuk memilih rentang, contoh: <strong>13 s/d 15</strong>).
                      </span>
                    ) : !selectedEndDate ? (
                      <span>
                        Mulai: <strong className="text-[#006E24]">{new Date(selectedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                        <span className="text-slate-500 font-normal"> &bull; Sekarang klik tanggal selesai (contoh: <strong>15</strong>) untuk rentang tanggal, atau langsung checkout untuk 1 hari.</span>
                      </span>
                    ) : (
                      <span className="font-bold text-emerald-900">
                        Rentang Terpilih: {new Date(selectedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} s/d {new Date(selectedEndDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} ({totalDays} {selectedPricingType === 'DAILY' ? 'Hari' : 'Sesi'})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  {selectedDate && selectedEndDate && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedEndDate('')
                        setBookingMode('SINGLE')
                      }}
                      className="px-2.5 py-1 bg-white border border-emerald-200 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Hanya 1 Hari
                    </button>
                  )}
                  {selectedDate && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDate('')
                        setSelectedEndDate('')
                        setBookingMode('SINGLE')
                        setErrorMessage(null)
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-white transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Calendar Card Container */}
            <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
              {/* Calendar Month & Year Navigation Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-base sm:text-lg font-bold text-slate-900 capitalize">
                    {monthLabel}
                  </h4>
                  {(!canGoPrev || viewMonth !== today.getMonth() || viewYear !== today.getFullYear()) && (
                    <button
                      type="button"
                      onClick={handleResetToCurrentMonth}
                      className="text-[11px] font-semibold text-[#006E24] hover:underline px-2 py-0.5 bg-emerald-50 rounded-md"
                    >
                      Bulan Ini
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    disabled={!canGoPrev}
                    aria-label="Bulan Sebelumnya"
                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    aria-label="Bulan Berikutnya"
                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Weekdays Row */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
                {DAY_NAMES.map((dName) => (
                  <div key={dName} className="text-[11px] font-bold text-slate-400 uppercase py-1">
                    {dName}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {/* Empty cells for offset */}
                {Array.from({ length: firstDayOffset }).map((_, i) => (
                  <div key={`offset-${i}`} className="h-12 sm:h-14 rounded-xl bg-slate-50/40" />
                ))}

                {/* Month Days */}
                {Array.from({ length: daysInCurrentMonth }).map((_, i) => {
                  const dayNum = i + 1
                  const dStr = formatDateKey(viewYear, viewMonth, dayNum)
                  const isPast = isPastDate(viewYear, viewMonth, dayNum)
                  const isAvail = isDateAvailable(dStr)

                  const isStart = selectedDate === dStr
                  const isEnd = selectedEndDate === dStr
                  const isInRange = selectedDate && selectedEndDate && dStr > selectedDate && dStr < selectedEndDate

                  const isClickable = isOwner || (!isPast && isAvail)

                  return (
                    <button
                      key={dStr}
                      type="button"
                      disabled={!isClickable}
                      onClick={() => handleDateClick(dStr, isAvail)}
                      className={`h-12 sm:h-14 p-1 flex flex-col items-center justify-between border transition-all text-center relative ${
                        isStart && isEnd
                          ? 'border-[#006E24] bg-[#006E24] text-white rounded-xl shadow-xs font-bold z-10'
                          : isStart && selectedEndDate
                          ? 'border-[#006E24] bg-[#006E24] text-white rounded-l-xl rounded-r-none shadow-xs font-bold z-10'
                          : isEnd
                          ? 'border-[#006E24] bg-[#006E24] text-white rounded-r-xl rounded-l-none shadow-xs font-bold z-10'
                          : isStart
                          ? 'border-[#006E24] bg-[#006E24] text-white rounded-xl shadow-xs font-bold z-10'
                          : isInRange
                          ? 'border-y border-emerald-300 bg-emerald-100 text-emerald-950 font-bold rounded-none z-0'
                          : isPast
                          ? 'border-slate-100 bg-slate-50 text-slate-300 opacity-40 cursor-not-allowed rounded-xl'
                          : isAvail
                          ? 'border-slate-200 bg-white text-slate-800 hover:border-emerald-400 hover:bg-emerald-50/40 cursor-pointer rounded-xl'
                          : isOwner
                          ? 'border-amber-200 bg-amber-50/50 text-amber-900 cursor-pointer rounded-xl'
                          : 'border-slate-200/60 bg-slate-100 text-slate-400 opacity-60 cursor-not-allowed rounded-xl'
                      }`}
                    >
                      <span className="text-xs sm:text-sm font-extrabold leading-tight mt-1">
                        {dayNum}
                      </span>
                      <span className="mb-1">
                        {isStart || isEnd ? (
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-white" />
                        ) : isInRange ? (
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        ) : isPast ? null : (
                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                            isAvail ? 'bg-[#006E24]' : 'bg-rose-400'
                          }`} />
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#006E24]" />
                    <span>Tersedia</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <span>Penuh / Libur</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#006E24]" />
                    <span>Terpilih</span>
                  </span>
                </div>
                <span className="text-slate-400 text-[10px]">
                  *Klik &apos;Bulan Berikutnya&apos; untuk reservasi bulan depan
                </span>
              </div>
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
                <p className="text-xs text-slate-600 mt-1">
                  Jadwal: <strong>
                    {new Date(bookingSuccess.bookingDate).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                    {bookingSuccess.endDate && (
                      <> s/d {new Date(bookingSuccess.endDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })} ({bookingSuccess.totalDays || totalDays} Hari)</>
                    )}
                  </strong>
                  {bookingSuccess.timeSlot ? ` (${bookingSuccess.timeSlot})` : ''}
                </p>
                <p className="text-xs text-emerald-700 font-semibold mt-1">
                  Total Pembayaran: Rp {(bookingSuccess.totalPrice || totalPrice).toLocaleString('id-ID')}
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Halo, saya telah membuat pesanan booking jasa "${service.title}" untuk jadwal ${
                      new Date(bookingSuccess.bookingDate).toLocaleDateString('id-ID')
                    }${
                      bookingSuccess.endDate
                        ? ` s/d ${new Date(bookingSuccess.endDate).toLocaleDateString('id-ID')} (${bookingSuccess.totalDays || totalDays} Hari)`
                        : ''
                    } ${bookingSuccess.timeSlot || ''}. Mohon konfirmasi jadwalnya ya!`
                  )}`}
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
                      onClick={() => {
                        setSelectedPricingType('SESSION')
                        setBookingMode('SINGLE')
                        setSelectedEndDate('')
                      }}
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

              {/* Selected Date / Range Indicator */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {bookingMode === 'RANGE' && selectedPricingType === 'DAILY' ? 'Rentang Tanggal Booking' : 'Tanggal Booking Terpilih'}
                </label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                  {selectedPricingType === 'DAILY' && bookingMode === 'RANGE' ? (
                    selectedDate && selectedEndDate ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Mulai:</span>
                          <span className="font-bold text-slate-800">
                            {new Date(selectedDate).toLocaleDateString('id-ID', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Selesai:</span>
                          <span className="font-bold text-slate-800">
                            {new Date(selectedEndDate).toLocaleDateString('id-ID', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[#006E24] font-bold">
                          <span>Durasi Pemesanan:</span>
                          <span className="px-2 py-0.5 bg-emerald-100 rounded-md text-xs">
                            {totalDays} {selectedPricingType === 'DAILY' ? 'Hari' : 'Sesi'}
                          </span>
                        </div>
                      </div>
                    ) : selectedDate ? (
                      <div className="flex items-center justify-between text-amber-700 font-medium">
                        <span>Mulai: {new Date(selectedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                        <span className="text-[11px] bg-amber-100 px-2 py-0.5 rounded-md font-bold">Pilih Tgl Selesai</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">Belum memilih rentang (klik tanggal mulai di kalender)</span>
                    )
                  ) : (
                    <div className="flex items-center justify-between">
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
                  <span>
                    Biaya Layanan Jasa{' '}
                    {totalDays > 1
                      ? `(${totalDays} ${selectedPricingType === 'DAILY' ? 'Hari' : 'Sesi'} @ Rp ${baseRate.toLocaleString('id-ID')})`
                      : selectedPricingType === 'DAILY'
                      ? 'Per Hari'
                      : 'Per Sesi'}
                  </span>
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
                disabled={
                  isPending ||
                  !selectedDate ||
                  (bookingMode === 'RANGE' && !selectedEndDate)
                }
                className="w-full py-3 bg-[#006E24] hover:bg-[#00551c] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <span>Memproses Booking...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>
                      {totalDays > 1
                        ? `Konfirmasi Booking (${totalDays} ${selectedPricingType === 'DAILY' ? 'Hari' : 'Sesi'})`
                        : 'Konfirmasi & Booking Sekarang'}
                    </span>
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
