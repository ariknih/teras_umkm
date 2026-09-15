'use client'

import { useMemo, useState, useTransition } from 'react'
import { updateSnackboxRelayStatusAction } from '@/app/actions/admin'
import { useToast, Toast } from './Toast'
import ExportCsvButton from './ExportCsvButton'
import { FilterPopover, SearchInput, TableCard, TablePagination, usePagination, type FilterField, type FilterValues } from './TableControls'

const RELAY_TAB_STATUS: Record<string, string> = {
  pending: 'PENDING',
  dihubungi: 'CONTACTED',
  konfirmasi: 'CONFIRMED',
  ditolak: 'REJECTED'
}

function isSnackboxOrder(o: any) {
  return (
    o.isSnackbox ||
    (o.items && o.items.some((i: any) => (i.productTitle || '').toLowerCase().match(/snack|kue|risol|lemper/))) ||
    o.id.includes('sb')
  )
}

type Props = {
  orders: any[]
  users: any[]
  /** Snackbox Order & Relay menu: narrows to Snackbox orders and filters by
   * relay status tab. ponytail: snackboxRelayMap below is seeded fixture
   * data, same as the legacy code — relocated as-is per the decision not to
   * polish mock Snackbox menus until a real relay backend exists. */
  snackboxOnly?: boolean
  relayTab?: string
}

export default function TransactionsTab({ orders, users, snackboxOnly = false, relayTab }: Props) {
  const [isPending, startTransition] = useTransition()
  const { toast, showToast } = useToast()
  const [txSearch, setTxSearch] = useState('')
  const [filters, setFilters] = useState<FilterValues>({})
  const [selectedTx, setSelectedTx] = useState<any>(null)
  const [snackboxRelayMap, setSnackboxRelayMap] = useState<Record<string, { status: string; contactedAt?: string }>>({
    'ord-sb-01': { status: 'PENDING' },
    'ord-sb-02': { status: 'CONFIRMED' }
  })

  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users])

  const statusOptions = useMemo(
    () => [...new Set(orders.map((o) => o.status || 'COMPLETED'))].sort().map((s) => ({ value: s, label: s })),
    [orders]
  )
  const fields: FilterField[] = [
    { key: 'status', label: 'Status Pesanan', allLabel: 'Semua status', options: statusOptions },
    // Snackbox Order History is already Snackbox-only; its relay status comes from the URL tab.
    ...(snackboxOnly
      ? []
      : [
          {
            key: 'type',
            label: 'Tipe Transaksi',
            allLabel: 'Semua tipe',
            options: [
              { value: 'snackbox', label: 'Snackbox' },
              { value: 'reguler', label: 'Reguler' }
            ]
          }
        ])
  ]

  const q = txSearch.toLowerCase()
  const displayedOrders = orders.filter((o) => {
    if (q && ![o.id, o.buyerId, userById.get(o.buyerId)?.name].some((v) => (v || '').toLowerCase().includes(q))) return false
    if (filters.status && (o.status || 'COMPLETED') !== filters.status) return false
    const isSb = isSnackboxOrder(o)
    if (filters.type && isSb !== (filters.type === 'snackbox')) return false
    if (!snackboxOnly) return true
    if (!isSb) return false
    const relayStatus = snackboxRelayMap[o.id]?.status || 'PENDING'
    const wanted = RELAY_TAB_STATUS[relayTab || '']
    return !wanted || relayStatus === wanted
  })
  const { paged, resetPage, footer } = usePagination(displayedOrders)

  const updateRelay = (orderId: string, status: string, note: string) => {
    startTransition(async () => {
      await updateSnackboxRelayStatusAction(orderId, status, note)
      setSnackboxRelayMap((prev) => ({ ...prev, [orderId]: { status } }))
      showToast(`Status order #${orderId} diperbarui.`)
    })
  }

  return (
    <div className="space-y-6">
      <Toast toast={toast} />
      {!snackboxOnly && (
        <ExportCsvButton
          filenamePrefix="transactions"
          rows={[
            ['Order ID', 'Pembeli ID', 'Total Amount', 'Status', 'Tanggal'],
            ...orders.map((o: any) => [o.id, o.buyerId || '-', String(o.totalAmount || 0), o.status, String(o.createdAt)])
          ]}
        />
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        <div className="xl:col-span-2 min-w-0">
          <TableCard
            title={snackboxOnly ? 'Order Snackbox' : 'Daftar Transaksi'}
            description="Lacak alokasi pembagian laba, komisi afiliasi, serta relay pesanan Snackbox ke mitra UMKM kue lokal. Klik baris untuk melihat rincian."
            actions={
              <>
                <SearchInput
                  placeholder="Cari ID transaksi atau pembeli..."
                  value={txSearch}
                  onChange={(v) => {
                    setTxSearch(v)
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
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead>
                  <tr className="bg-neutral-shade-25 border-b border-neutral-shade-50 text-neutral-shade-500 uppercase tracking-wider text-[10px] font-bold">
                    <th className="px-4 py-3">Order ID</th>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Pembeli</th>
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3">Relay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-shade-50">
                  {paged.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-neutral-shade-300 italic">
                        Tidak ada transaksi ditemukan pada filter ini.
                      </td>
                    </tr>
                  ) : (
                    paged.map((o) => {
                      const buyer = userById.get(o.buyerId)
                      const isSb = isSnackboxOrder(o)
                      const relayInfo = snackboxRelayMap[o.id] || { status: isSb ? 'PENDING' : 'CONFIRMED' }
                      const isSlaBreached = isSb && relayInfo.status === 'PENDING'
                      const select = () => setSelectedTx({ ...o, isSnackbox: isSb, relayInfo })

                      return (
                        <tr
                          key={o.id}
                          onClick={select}
                          className={`cursor-pointer transition-colors ${selectedTx?.id === o.id ? 'bg-market-green-50' : 'hover:bg-neutral-shade-25'}`}
                        >
                          <td className="px-4 py-3">
                            <button type="button" onClick={select} className="font-mono font-bold text-market-green-600 hover:underline">
                              {o.id}
                            </button>
                            {isSb && (
                              <span className="ml-2 px-2 py-0.5 rounded text-[9px] font-bold bg-primary-container text-on-primary-container border border-on-primary-container/20 uppercase">
                                🧁 Snackbox ({o.boxType || 'Reguler'})
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-neutral-shade-500 font-mono">{new Date(o.createdAt).toLocaleDateString('id-ID')}</td>
                          <td className="px-4 py-3 font-semibold text-neutral-shade-800">{buyer?.name || 'Customer'}</td>
                          <td className="px-4 py-3 text-neutral-shade-600 max-w-[220px] truncate">
                            {o.items?.map((item: any) => `${item.productTitle || 'Produk'} (x${item.quantity})`).join(', ') || '1x Snackbox Menu'}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-neutral-shade-800">Rp {o.totalAmount.toLocaleString('id-ID')}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-[9px] bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded font-bold uppercase">{o.status || 'COMPLETED'}</span>
                          </td>
                          <td className="px-4 py-3">
                            {isSb ? (
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${
                                    relayInfo.status === 'CONFIRMED'
                                      ? 'bg-green-50 text-green-700 border-green-200'
                                      : relayInfo.status === 'CONTACTED'
                                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                                      : relayInfo.status === 'REJECTED'
                                      ? 'bg-red-50 text-red-700 border-red-200'
                                      : 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
                                  }`}
                                >
                                  {relayInfo.status === 'CONFIRMED' ? '✓ Dikonfirmasi Toko' :
                                    relayInfo.status === 'CONTACTED' ? 'Sudah Dihubungi' :
                                    relayInfo.status === 'REJECTED' ? 'Stok Habis / Ditolak' :
                                    'Belum Dihubungi'}
                                </span>
                                {isSlaBreached && (
                                  <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">⚠️ SLA</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-neutral-shade-300">-</span>
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

        <div className="bg-white border border-neutral-shade-50 rounded-[var(--radius-brand)] p-6 shadow-sm overflow-y-auto max-h-[calc(100vh-8rem)] xl:sticky xl:top-6">
          {selectedTx ? (
            <div className="space-y-5 text-xs">
              <div className="border-b border-[#e2e8f0] pb-3 text-center">
                <h4 className="font-sora text-xs font-bold text-[#0F5132] uppercase tracking-wider">
                  {selectedTx.isSnackbox ? 'Detail Relay Snackbox & Ledger' : 'Detail Audit Transaksi'}
                </h4>
                <p className="font-mono text-[10px] text-[#64748b] mt-1">{selectedTx.id}</p>
              </div>

              {selectedTx.isSnackbox && (
                <div className="p-3.5 bg-[#F5F7FA] border border-[#2DB24A]/30 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#006E24] uppercase tracking-wider flex items-center gap-1"><span>🧁 Order Relay ke Toko Kue</span></span>
                    <span className="text-[9px] font-semibold text-slate-500">Escrow: Ditahan Saloka</span>
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-700">
                    <p><b>Tipe Box:</b> {selectedTx.boxType || 'Reguler'}</p>
                    <p><b>Kelurahan Antar:</b> {selectedTx.kelurahanName || 'Menteng, Jakarta Pusat'}</p>
                    <p><b>Mitra Toko Target:</b> Toko Kue Ibu Siti & Dapur Ibu Ani</p>
                  </div>

                  {(() => {
                    const itemsText = selectedTx.items?.map((i: any) => `${i.productTitle} (x${i.quantity})`).join(', ') || 'Menu Snackbox'
                    const waText = encodeURIComponent(
                      `Halo Mitra Saloka, ada pesanan Snackbox baru dari platform Saloka:\n` +
                        `- Order ID: #${selectedTx.id}\n` +
                        `- Tipe Box: ${selectedTx.boxType || 'Reguler'}\n` +
                        `- Item Kue: ${itemsText}\n` +
                        `- Kelurahan Tujuan: ${selectedTx.kelurahanName || 'Menteng'}\n` +
                        `Total dana sudah ditampung di Escrow Saloka. Mohon segera konfirmasi kesiapan stok & jadwal pengiriman. Terima kasih!`
                    )
                    const waUrl = `https://wa.me/6281234567890?text=${waText}`
                    return (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          setSnackboxRelayMap((prev) => ({ ...prev, [selectedTx.id]: { status: 'CONTACTED', contactedAt: new Date().toISOString() } }))
                          showToast(`Status order #${selectedTx.id} diubah menjadi 'Sudah Dihubungi via WhatsApp'.`)
                        }}
                        className="w-full py-2 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-colors no-underline cursor-pointer"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-5.805 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                        </svg>
                        <span>📲 Hubungi Mitra via WhatsApp</span>
                      </a>
                    )
                  })()}

                  <div className="pt-2 border-t border-slate-200">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Update Status Relay Toko:</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => updateRelay(selectedTx.id, 'CONFIRMED', 'Mitra siap kirim')}
                        className="py-1.5 px-2 bg-[#006E24] hover:bg-[#005a1d] text-white rounded text-[10px] font-bold uppercase transition-colors cursor-pointer border-none disabled:opacity-50"
                      >
                        ✓ Dikonfirmasi
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => updateRelay(selectedTx.id, 'REJECTED', 'Stok mitra habis')}
                        className="py-1.5 px-2 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold uppercase transition-colors cursor-pointer border-none disabled:opacity-50"
                      >
                        ✕ Stok Habis
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Item Pembelian:</span>
                <div className="mt-2 space-y-1.5 bg-[#f8f9fa] p-2.5 rounded-[var(--radius-brand)] border border-[#e2e8f0]">
                  {selectedTx.items?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between leading-tight text-[11px]">
                      <span className="text-slate-800 truncate max-w-[140px] font-medium">{item.productTitle}</span>
                      <span className="text-[#64748b] font-mono">x{item.quantity} - Rp {item.price?.toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Ledger Aliran Finansial:</span>
                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-slate-800 font-bold">
                    <span>Nilai Transaksi:</span>
                    <span>Rp {selectedTx.totalAmount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="border-t border-[#e2e8f0] my-1.5" />
                  <div className="flex justify-between text-green-700 font-medium">
                    <span>Bagi Hasil Mitra Kue (85%):</span>
                    <span>Rp {Math.round(selectedTx.totalAmount * 0.85).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-purple-700 font-medium">
                    <span>Platform Fee Saloka (15%):</span>
                    <span>Rp {Math.round(selectedTx.totalAmount * 0.15).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-gradient-to-br from-[#E8F5E9] to-white border border-[#0F5132]/20 rounded-[var(--radius-brand)] text-center">
                <span className="text-[9px] font-bold text-[#0F5132] uppercase tracking-widest block">Escrow Protected System</span>
                <span className="text-[9px] text-[#64748b] block mt-0.5 font-mono">Audit Stamp Hash: Verified Ledger 2026</span>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#64748b] italic">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mb-2">
                <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
              </svg>
              <span>Pilih salah satu transaksi pada tabel untuk melihat rincian relay WhatsApp & aliran dana.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
