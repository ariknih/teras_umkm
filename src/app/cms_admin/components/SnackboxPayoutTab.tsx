'use client'

import { useTransition } from 'react'
import { processSnackboxBatchPayoutAction } from '@/app/actions/admin'
import { useToast, Toast } from './Toast'

// ponytail: fully mock — every figure below is hardcoded, and the "Eksekusi
// Batch Payout" action only writes an audit log entry, it moves no real
// money. Relocated as-is per the decision to not invest in polishing mock
// Snackbox menus until the real payout backend exists.
const MOCK_BATCHES = [
  { name: 'Toko Kue Ibu Siti', kelurahan: 'Menteng', totalBox: 28, gross: 1400000, fee: 210000, net: 1190000, status: 'SIAP_TRANSFER' },
  { name: 'Dapur Tradisional Ani', kelurahan: 'Menteng', totalBox: 22, gross: 1100000, fee: 165000, net: 935000, status: 'SIAP_TRANSFER' },
  { name: 'Kue Basah Mba Sri', kelurahan: 'Gambir', totalBox: 18, gross: 900000, fee: 135000, net: 765000, status: 'SELESAI_TRANSFER' },
  { name: 'Snack Barokah Cikini', kelurahan: 'Cikini', totalBox: 17, gross: 850000, fee: 127500, net: 722500, status: 'SELESAI_TRANSFER' }
]

export default function SnackboxPayoutTab() {
  const [isPending, startTransition] = useTransition()
  const { toast, showToast } = useToast()

  const handleExecuteBatch = () => {
    if (!confirm('Eksekusi batch payout sebesar Rp 3.612.500 ke 12 mitra kue terpilih sekarang?')) return
    startTransition(async () => {
      const res = await processSnackboxBatchPayoutAction('BATCH-SNACKBOX-2026-08', 3612500, 12)
      if (res.success) {
        showToast('Batch Payout Snackbox berhasil diproses dan dicatat ke Audit Log System.')
      } else {
        showToast(res.error || 'Gagal memproses payout batch.', 'error')
      }
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <Toast toast={toast} />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Dana Escrow Tertampung</span>
          <p className="text-xl font-bold text-slate-900 font-sora mt-1">Rp 4.250.000</p>
          <span className="text-[10px] text-emerald-600 font-medium">8 Pesanan Selesai Terverifikasi</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-800 uppercase">Siap Payout ke Mitra (85%)</span>
          <p className="text-xl font-bold text-[#006E24] font-sora mt-1">Rp 3.612.500</p>
          <span className="text-[10px] text-slate-500 font-medium">12 Mitra Kue Terdaftar</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-purple-700 uppercase">Bagi Hasil Saloka (15%)</span>
          <p className="text-xl font-bold text-purple-900 font-sora mt-1">Rp 637.500</p>
          <span className="text-[10px] text-slate-500 font-medium">Fee Operasional Platform</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase">Jadwal Pencairan</span>
            <p className="text-sm font-bold text-slate-800 mt-1">Harian (Tiap 18:00 WIB)</p>
          </div>
          <button
            type="button"
            onClick={handleExecuteBatch}
            disabled={isPending}
            className="w-full py-2 bg-[#006E24] hover:bg-[#005a1d] text-white rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-xs disabled:opacity-50 border-none mt-2"
          >
            {isPending ? 'Memproses...' : '⚡ Eksekusi Batch Payout'}
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#e2e8f0] p-6 rounded-[var(--radius-brand)] shadow-sm">
        <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-3">
          <div>
            <h3 className="font-sora text-sm font-bold text-slate-800 uppercase tracking-wider text-[#0F5132]">
              Payout History Mitra Snackbox
            </h3>
            <p className="text-xs text-[#64748b]">
              Rekam jejak pencairan dana dari Saloka ke mitra snackbox.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-xs text-left">
            <thead className="bg-[#f8f9fa] border-b border-[#e2e8f0] text-[#64748b] uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Mitra Kue / Kelurahan</th>
                <th className="px-5 py-3.5 text-center">Total Box Terkirim</th>
                <th className="px-5 py-3.5 text-right">Nilai Bruto (Customer)</th>
                <th className="px-5 py-3.5 text-right">Fee Saloka (15%)</th>
                <th className="px-5 py-3.5 text-right">Payout Bersih Mitra (85%)</th>
                <th className="px-5 py-3.5 text-center">Status Payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MOCK_BATCHES.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-bold text-slate-900">{item.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">📍 Kel. {item.kelurahan} (BCA: 5210-XXXX-XX)</p>
                  </td>
                  <td className="px-5 py-4 text-center font-bold text-slate-800">{item.totalBox} Box</td>
                  <td className="px-5 py-4 text-right font-bold text-slate-700">Rp {item.gross.toLocaleString('id-ID')}</td>
                  <td className="px-5 py-4 text-right text-purple-700 font-medium">- Rp {item.fee.toLocaleString('id-ID')}</td>
                  <td className="px-5 py-4 text-right font-black text-[#006E24] font-mono">Rp {item.net.toLocaleString('id-ID')}</td>
                  <td className="px-5 py-4 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                        item.status === 'SIAP_TRANSFER' ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      }`}
                    >
                      {item.status === 'SIAP_TRANSFER' ? 'Siap Ditransfer Hari Ini' : '✓ Telah Ditransfer'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
