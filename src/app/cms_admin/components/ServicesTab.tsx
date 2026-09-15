'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateServiceBookingStatusAction } from '@/app/actions/services'
import { useToast, Toast } from './Toast'
import { FilterPopover, SearchInput, TableCard, TablePagination, usePagination, type FilterField, type FilterValues } from './TableControls'

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

const TH_ROW = 'bg-neutral-shade-25 border-b border-neutral-shade-50 text-neutral-shade-500 uppercase tracking-wider text-[10px] font-bold'

/** Split per tab so each table owns its own filter/pagination state. */
export default function ServicesTab({ tab, services, bookings }: Props) {
  return tab === 'booking' ? <BookingTable services={services} initialBookings={bookings} /> : <KatalogTable services={services} />
}

function BookingTable({ services, initialBookings }: { services: any[]; initialBookings: any[] }) {
  const router = useRouter()
  const [bookings, setBookings] = useState(initialBookings)
  const [isPending, startTransition] = useTransition()
  const { toast, showToast } = useToast()
  const [filters, setFilters] = useState<FilterValues>({})

  const serviceById = useMemo(() => new Map(services.map((s) => [s.id, s])), [services])

  const fields: FilterField[] = [
    { key: 'status', label: 'Status', allLabel: 'Semua status', options: Object.keys(STATUS_BADGE).map((s) => ({ value: s, label: s })) }
  ]
  const filtered = filters.status ? bookings.filter((b) => b.status === filters.status) : bookings
  const { paged, resetPage, footer } = usePagination(filtered)

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

  return (
    <div className="space-y-6 animate-in fade-in duration-250">
      <Toast toast={toast} />

      <TableCard
        title="Booking Jasa & Layanan"
        description="Lintas-merchant. Menyelesaikan booking mencairkan dana escrow langsung ke saldo dompet merchant terkait."
        actions={
          <FilterPopover
            fields={fields}
            value={filters}
            onApply={(next) => {
              setFilters(next)
              resetPage()
            }}
          />
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left whitespace-nowrap">
            <thead>
              <tr className={TH_ROW}>
                <th className="px-4 py-3">Layanan</th>
                <th className="px-4 py-3">Pelanggan</th>
                <th className="px-4 py-3">Merchant</th>
                <th className="px-4 py-3">Jadwal</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-shade-50">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-neutral-shade-300 italic">
                    {filters.status ? 'Tidak ada booking dengan status ini.' : 'Belum ada booking jasa.'}
                  </td>
                </tr>
              ) : (
                paged.map((b: any) => {
                  const service = b.service || serviceById.get(b.serviceId)
                  const total = b.totalAmount ?? b.totalPrice ?? b.basePrice ?? 0
                  const actions = STATUS_FLOW[b.status] || []
                  return (
                    <tr key={b.id} className="hover:bg-neutral-shade-25 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-bold text-neutral-shade-800">{service?.title || 'Layanan Dihapus'}</p>
                        <p className="text-[10px] text-neutral-shade-500 font-mono">{b.sessionType || b.pricingType || '-'}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-neutral-shade-600">{b.customerId}</td>
                      <td className="px-4 py-3 font-mono text-[10px] text-neutral-shade-600">{b.merchantId}</td>
                      <td className="px-4 py-3 text-neutral-shade-700">
                        {b.bookingDate ? new Date(b.bookingDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-secondary">Rp {Number(total).toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border tracking-wider ${STATUS_BADGE[b.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {actions.length === 0 ? (
                          <span className="text-[10px] text-neutral-shade-300 italic">Selesai</span>
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

        <TablePagination {...footer} />
      </TableCard>
    </div>
  )
}

function KatalogTable({ services }: { services: any[] }) {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<FilterValues>({})

  const fields: FilterField[] = useMemo(
    () => [
      {
        key: 'category',
        label: 'Kategori',
        allLabel: 'Semua kategori',
        options: [...new Set(services.map((s) => s.category).filter(Boolean))].sort().map((c) => ({ value: c, label: c }))
      },
      {
        key: 'status',
        label: 'Status',
        allLabel: 'Semua status',
        options: [
          { value: 'aktif', label: 'Aktif' },
          { value: 'nonaktif', label: 'Nonaktif' }
        ]
      }
    ],
    [services]
  )

  const q = search.toLowerCase()
  const filtered = services.filter((s) => {
    if (q && !s.title?.toLowerCase().includes(q) && !s.category?.toLowerCase().includes(q)) return false
    if (filters.category && s.category !== filters.category) return false
    if (filters.status && (s.isActive !== false) !== (filters.status === 'aktif')) return false
    return true
  })
  const { paged, resetPage, footer } = usePagination(filtered)
  const narrowed = !!q || Object.values(filters).some(Boolean)

  return (
    <div className="space-y-6 animate-in fade-in duration-250">
      <TableCard
        title="Katalog Jasa"
        description="Semua jasa & layanan yang didaftarkan merchant, lintas-merchant."
        actions={
          <>
            <SearchInput
              placeholder="Cari judul atau kategori..."
              value={search}
              onChange={(v) => {
                setSearch(v)
                resetPage()
              }}
            />
            <FilterPopover
              fields={fields}
              value={filters}
              onApply={(next) => {
                setFilters(next)
                resetPage()
              }}
            />
          </>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left whitespace-nowrap">
            <thead>
              <tr className={TH_ROW}>
                <th className="px-4 py-3">Jasa</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Merchant</th>
                <th className="px-4 py-3 text-right">Harga / Sesi</th>
                <th className="px-4 py-3 text-right">Harga / Hari</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-shade-50">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-neutral-shade-300 italic">
                    {narrowed ? 'Tidak ada jasa yang cocok dengan pencarian atau filter.' : 'Belum ada jasa terdaftar.'}
                  </td>
                </tr>
              ) : (
                paged.map((s: any) => (
                  <tr key={s.id} className="hover:bg-neutral-shade-25 transition-colors">
                    <td className="px-4 py-3 font-bold text-neutral-shade-800">{s.title}</td>
                    <td className="px-4 py-3 text-neutral-shade-600">{s.category}</td>
                    <td className="px-4 py-3 font-mono text-[10px] text-neutral-shade-500">{s.merchantId}</td>
                    <td className="px-4 py-3 text-right text-neutral-shade-700">Rp {Number(s.pricePerSession || 0).toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3 text-right text-neutral-shade-700">{s.pricePerDay ? `Rp ${Number(s.pricePerDay).toLocaleString('id-ID')}` : '-'}</td>
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

        <TablePagination {...footer} />
      </TableCard>
    </div>
  )
}
