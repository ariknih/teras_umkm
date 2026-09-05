'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateServiceBookingStatusAction } from '@/app/actions/services'
import { useToast, Toast } from './Toast'

type Props = {
  tab: string
  services: any[]
  bookings: any[]
}

const STATUS_FLOW: Record<string, { next: string; label: string; danger?: boolean }[]> = {
  PENDING: [
    { next: 'CONFIRMED', label: 'Konfirmasi' },
    { next: 'CANCELLED', label: 'Batalkan', danger: true }
  ],
  CONFIRMED: [
    { next: 'IN_PROGRESS', label: 'Mulai Proses' },
    { next: 'CANCELLED', label: 'Batalkan', danger: true }
  ],
  IN_PROGRESS: [{ next: 'COMPLETED', label: 'Selesaikan' }]
}

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-yellow-50 text-yellow-750 border-yellow-200',
  CONFIRMED: 'bg-blue-50 text-blue-700 border-blue-200',
  IN_PROGRESS: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  COMPLETED: 'bg-green-50 text-green-700 border-green-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200'
}

export default function ServicesTab({ tab, services, bookings: initialBookings }: Props) {
  const router = useRouter()
  const [bookings, setBookings] = useState(initialBookings)
  const [isPending, startTransition] = useTransition()
  const { toast, showToast } = useToast()
  const [search, setSearch] = useState('')

  const serviceById = useMemo(() => new Map(services.map((s) => [s.id, s])), [services])

  const handleStatusChange = (bookingId: string, next: string) => {
    if (next === 'COMPLETED' && !confirm('Menyelesaikan booking akan mencairkan dana escrow ke saldo dompet merchant. Lanjutkan?')) return
    if (next === 'CANCELLED' && !confirm('Batalkan booking ini?')) return
    startTransition(async () => {
      const res = await updateServiceBookingStatusAction(bookingId, next)
      if (res.success) {
        showToast(`Status booking diperbarui menjadi ${next}.`)
        setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: next } : b)))
        router.refresh()
      } else {
        showToast(res.error || 'Gagal memperbarui status booking.', 'error')
      }
    })
  }

  if (tab === 'booking') {
    return (
      <div className="space-y-6 animate-in fade-in duration-250">
        <Toast toast={toast} />

        <div className="bg-white border border-[#e2e8f0] p-6 rounded-[var(--radius-brand)] shadow-sm">
          <h3 className="font-sora text-sm font-bold text-slate-800 uppercase tracking-wider mb-2 border-b border-[#e2e8f0] pb-3 text-[#0F5132]">
            Booking Jasa & Layanan
          </h3>
          <p className="text-xs text-[#64748b] mb-6">
            Lintas-merchant. Menyelesaikan booking mencairkan dana escrow langsung ke saldo dompet merchant terkait.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-xs text-left">
              <thead className="bg-[#f8f9fa] border-b border-[#e2e8f0] text-[#64748b] uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="px-4 py-3">Layanan</th>
                  <th className="px-4 py-3">Pelanggan</th>
                  <th className="px-4 py-3">Merchant</th>
                  <th className="px-4 py-3">Jadwal</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400 italic">
                      Belum ada booking jasa.
                    </td>
                  </tr>
                ) : (
                  bookings.map((b: any) => {
                    const service = b.service || serviceById.get(b.serviceId)
                    const total = b.totalAmount ?? b.totalPrice ?? b.basePrice ?? 0
                    const actions = STATUS_FLOW[b.status] || []
                    return (
                      <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-800">{service?.title || 'Layanan Dihapus'}</p>
                          <p className="text-[10px] text-slate-450 font-mono">{b.sessionType || b.pricingType || '-'}</p>
                        </td>
                        <td className="px-4 py-3 font-mono text-[10px] text-slate-600">{b.customerId}</td>
                        <td className="px-4 py-3 font-mono text-[10px] text-slate-600">{b.merchantId}</td>
                        <td className="px-4 py-3 text-slate-700">
                          {b.bookingDate ? new Date(b.bookingDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-[#0F5132]">Rp {Number(total).toLocaleString('id-ID')}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border tracking-wider ${STATUS_BADGE[b.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {actions.length === 0 ? (
                            <span className="text-[10px] text-slate-400 italic">Selesai</span>
                          ) : (
                            <div className="flex justify-end gap-1.5">
                              {actions.map((a) => (
                                <button
                                  key={a.next}
                                  disabled={isPending}
                                  onClick={() => handleStatusChange(b.id, a.next)}
                                  className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer border-none disabled:opacity-50 ${
                                    a.danger ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-[#0F5132] hover:bg-[#0a3a24] text-white'
                                  }`}
                                >
                                  {a.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // ─── KATALOG (default) ──────────────────────────────────────────────────
  const filtered = services.filter(
    (s) => s.title?.toLowerCase().includes(search.toLowerCase()) || s.category?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-250">
      <div className="bg-white border border-[#e2e8f0] p-6 rounded-[var(--radius-brand)] shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#e2e8f0] pb-4 mb-4">
          <div>
            <h3 className="font-sora text-sm font-bold text-slate-800 uppercase tracking-wider text-[#0F5132]">Katalog Jasa</h3>
            <p className="text-xs text-[#64748b] mt-0.5">Semua jasa & layanan yang didaftarkan merchant, lintas-merchant.</p>
          </div>
          <input
            type="text"
            placeholder="Cari judul atau kategori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-4 py-2.5 text-xs text-slate-800 placeholder-[#94a3b8] focus:outline-none focus:border-[#0F5132]"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-xs text-left">
            <thead className="bg-[#f8f9fa] border-b border-[#e2e8f0] text-[#64748b] uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="px-4 py-3">Jasa</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Merchant</th>
                <th className="px-4 py-3 text-right">Harga / Sesi</th>
                <th className="px-4 py-3 text-right">Harga / Hari</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 italic">
                    {search ? 'Tidak ada jasa yang cocok dengan pencarian.' : 'Belum ada jasa terdaftar.'}
                  </td>
                </tr>
              ) : (
                filtered.map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-800">{s.title}</td>
                    <td className="px-4 py-3 text-slate-600">{s.category}</td>
                    <td className="px-4 py-3 font-mono text-[10px] text-slate-500">{s.merchantId}</td>
                    <td className="px-4 py-3 text-right text-slate-700">Rp {Number(s.pricePerSession || 0).toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{s.pricePerDay ? `Rp ${Number(s.pricePerDay).toLocaleString('id-ID')}` : '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border tracking-wider ${s.isActive !== false ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        {s.isActive !== false ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
