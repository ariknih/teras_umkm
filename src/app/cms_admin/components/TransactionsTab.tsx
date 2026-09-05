'use client'

import { useState, useTransition } from 'react'
import { updateSnackboxRelayStatusAction } from '@/app/actions/admin'
import { useToast, Toast } from './Toast'
import ExportCsvButton from './ExportCsvButton'

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
  const [selectedTx, setSelectedTx] = useState<any>(null)
  const [snackboxRelayMap, setSnackboxRelayMap] = useState<Record<string, { status: string; contactedAt?: string }>>({
    'ord-sb-01': { status: 'PENDING' },
    'ord-sb-02': { status: 'CONFIRMED' }
  })

  const searchedOrders = orders.filter((o) => {
    if (!txSearch) return true
    return o.id.toLowerCase().includes(txSearch.toLowerCase()) || o.buyerId.toLowerCase().includes(txSearch.toLowerCase())
  })

  const displayedOrders = searchedOrders.filter((o) => {
    const isSb = isSnackboxOrder(o)
    if (!snackboxOnly) return true
    if (!isSb) return false
    const relayStatus = snackboxRelayMap[o.id]?.status || 'PENDING'
    const wanted = RELAY_TAB_STATUS[relayTab || '']
    return !wanted || relayStatus === wanted
  })

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

      <div className="bg-white border border-[#e2e8f0] p-5 rounded-[var(--radius-brand)] shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-grow">
          <h3 className="font-sora text-xs font-bold text-[#0F5132] uppercase tracking-wider mb-1">Pelacakan Transaksi & Relay Snackbox</h3>
          <p className="text-[11px] text-[#64748b] mb-3">Lacak alokasi pembagian laba, komisi afliasi, serta relay pesanan Snackbox ke mitra UMKM kue lokal.</p>
          <input
            type="text"
            placeholder="Masukkan ID Transaksi, e.g. order-1779515200000"
            value={txSearch}
            onChange={(e) => setTxSearch(e.target.value)}
            className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-4 py-2.5 text-xs text-slate-850 placeholder-[#94a3b8] focus:outline-none focus:border-[#0F5132] focus:ring-1 focus:ring-[#0F5132] font-mono"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-[#e2e8f0] rounded-[var(--radius-brand)] overflow-hidden shadow-sm h-[520px] overflow-y-auto">
          <div className="px-5 py-3.5 border-b border-[#e2e8f0] bg-[#f8f9fa] sticky top-0 z-10 flex justify-between items-center">
            <h4 className="font-sora text-xs font-bold text-[#0F5132] uppercase tracking-wider">Daftar Transaksi</h4>
            <span className="text-[10px] font-mono text-[#64748b]">{displayedOrders.length} transaksi</span>
          </div>
          <div className="divide-y divide-slate-100">
            {displayedOrders.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs italic">Tidak ada transaksi ditemukan pada filter ini.</div>
            ) : (
              displayedOrders.map((o) => {
                const buyer = users.find((u) => u.id === o.buyerId)
                const isSb = isSnackboxOrder(o)
                const relayInfo = snackboxRelayMap[o.id] || { status: isSb ? 'PENDING' : 'CONFIRMED' }
                const isSlaBreached = isSb && relayInfo.status === 'PENDING'

                return (
                  <div
                    key={o.id}
                    onClick={() => setSelectedTx({ ...o, isSnackbox: isSb, relayInfo })}
                    className={`p-4 transition-all duration-150 cursor-pointer ${selectedTx?.id === o.id ? 'bg-[#E8F5E9] border-l-4 border-[#0F5132]' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#0F5132]">{o.id}</span>
                        {isSb && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#E8F5E9] text-[#006E24] border border-[#C8E6C9] uppercase">
                            🧁 Snackbox ({o.boxType || 'Reguler'})
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#64748b] font-mono">{new Date(o.createdAt).toLocaleDateString('id-ID')}</span>
                    </div>

                    <div className="flex justify-between items-end mt-2">
                      <div>
                        <p className="text-[11px] text-slate-700">Pembeli: <b>{buyer?.name || 'Customer'}</b></p>
                        <p className="text-[10px] text-[#64748b] mt-0.5 max-w-[320px] truncate">
                          Item: {o.items?.map((item: any) => `${item.productTitle || 'Produk'} (x${item.quantity})`).join(', ') || '1x Snackbox Menu'}
                        </p>
                        {isSb && (
                          <div className="mt-1.5 flex items-center gap-2">
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
                              Relay: {
                                relayInfo.status === 'CONFIRMED' ? '✓ Dikonfirmasi Toko' :
                                relayInfo.status === 'CONTACTED' ? 'Sudah Dihubungi' :
                                relayInfo.status === 'REJECTED' ? 'Stok Habis / Ditolak' :
                                'Belum Dihubungi'
                              }
                            </span>
                            {isSlaBreached && (
                              <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">⚠️ SLA Alert: Escrow Aktif</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-slate-800">Rp {o.totalAmount.toLocaleString('id-ID')}</p>
                        <span className="text-[8px] bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.2 rounded font-bold uppercase mt-1 inline-block">{o.status || 'COMPLETED'}</span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-[var(--radius-brand)] p-6 shadow-sm overflow-y-auto max-h-[520px]">
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
              <span>Pilih salah satu transaksi di sebelah kiri untuk melihat rincian relay WhatsApp & aliran dana.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
