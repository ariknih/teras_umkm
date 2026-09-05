'use client'

import { useState } from 'react'
import ExportCsvButton from './ExportCsvButton'

/**
 * "Tandai Selesai" only ever marked a withdrawal as processed in local
 * component state in the original code — no server action backs it, so a
 * refresh always resets every withdrawal back to pending. Preserved as-is;
 * fixing that is a real backend change, not part of this extraction.
 */
export default function WithdrawalsTab({ withdrawals }: { withdrawals: any[] }) {
  const [processedIds, setProcessedIds] = useState<string[]>([])
  const [notice, setNotice] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      {notice && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
          ✓ {notice}
        </div>
      )}
      <ExportCsvButton
        filenamePrefix="withdrawals"
        rows={[
          ['ID', 'User ID', 'Jumlah (Rp)', 'Bank', 'No Rekening', 'Status', 'Tanggal'],
          ...withdrawals.map((w: any) => [w.id, w.userId || '-', String(w.amount || 0), w.bankName || '-', w.accountNumber || '-', w.status, String(w.createdAt)])
        ]}
      />

      <div className="bg-white border border-[#e2e8f0] p-6 rounded-[var(--radius-brand)] shadow-sm">
        <h3 className="font-sora text-sm font-bold text-slate-800 uppercase tracking-wider mb-2 border-b border-[#e2e8f0] pb-3 text-[#0F5132]">
          Permintaan Pencairan Dana (Withdrawal Reguler)
        </h3>
        <p className="text-xs text-[#64748b] mb-6">
          Daftar permintaan penarikan saldo wallet mandiri dari Merchant marketplace dan Affiliate ke rekening bank mereka.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-xs text-left">
            <thead className="bg-[#f8f9fa] border-b border-[#e2e8f0] text-[#64748b] uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3.5">ID / Tanggal</th>
                <th className="px-6 py-3.5">Pengguna</th>
                <th className="px-6 py-3.5 text-right">Nominal</th>
                <th className="px-6 py-3.5">Detail Rekening</th>
                <th className="px-6 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500 font-medium">
                    Tidak ada data penarikan saat ini.
                  </td>
                </tr>
              ) : (
                withdrawals.map((w: any) => {
                  const isProcessed = processedIds.includes(w.id)
                  return (
                    <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800 font-mono text-[10px]">{w.id}</p>
                        <p className="text-[10px] text-[#64748b]">
                          {new Date(w.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{w.user?.name || 'Customer'}</p>
                        <p className="text-[10px] text-[#64748b] font-mono">{w.user?.email || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-[#0F5132]">Rp {Math.abs(w.amount).toLocaleString('id-ID')}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[10px] text-slate-800 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded border border-[#e2e8f0] inline-block font-mono">
                          {w.description.replace('Penarikan dana dompet digital', 'Rekening')}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isProcessed ? (
                          <span className="px-3 py-1.5 rounded text-[10px] font-bold border border-green-200 bg-green-50 text-green-700 uppercase tracking-wider inline-flex items-center gap-1.5">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                            Sukses Ditransfer
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              if (confirm('Konfirmasi bahwa dana telah ditransfer ke rekening pengguna?')) {
                                setProcessedIds((prev) => [...prev, w.id])
                                setNotice(`Transfer untuk withdrawal ${w.id} telah dikonfirmasi selesai.`)
                              }
                            }}
                            className="px-4 py-1.5 bg-[#0F5132] hover:bg-[#0a3822] text-white rounded text-[11px] font-bold uppercase tracking-wider shadow-sm transition-colors cursor-pointer"
                          >
                            Tandai Selesai
                          </button>
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
