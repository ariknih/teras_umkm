'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { approveLevelRequestAction, rejectLevelRequestAction } from '@/app/actions/admin'
import { useToast, Toast } from './Toast'

type Props = {
  initialLevelRequests: any[]
  currentUser: any
}

export default function MerchantLevelTab({ initialLevelRequests, currentUser }: Props) {
  const router = useRouter()
  const [levelRequests, setLevelRequests] = useState(initialLevelRequests)
  const [isPending, startTransition] = useTransition()
  const { toast, showToast } = useToast()

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [rejectRequestId, setRejectRequestId] = useState('')
  const [rejectNote, setRejectNote] = useState('')

  const handleApprove = (requestId: string) => {
    if (!confirm('Apakah Anda yakin ingin menyetujui pengajuan level ini?')) return
    startTransition(async () => {
      const res = await approveLevelRequestAction(requestId)
      if (res.success) {
        showToast('Pengajuan level berhasil disetujui.')
        setLevelRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, status: 'APPROVED' } : r)))
        router.refresh()
      } else {
        showToast(res.error || 'Gagal menyetujui pengajuan level.', 'error')
      }
    })
  }

  const openRejectModal = (requestId: string) => {
    setRejectRequestId(requestId)
    setRejectNote('')
    setIsRejectModalOpen(true)
  }

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectNote) {
      alert('Alasan penolakan harus diisi.')
      return
    }
    setIsRejectModalOpen(false)
    startTransition(async () => {
      const res = await rejectLevelRequestAction(rejectRequestId, rejectNote)
      if (res.success) {
        showToast('Pengajuan level berhasil ditolak.')
        setLevelRequests((prev) => prev.map((r) => (r.id === rejectRequestId ? { ...r, status: 'REJECTED', reviewNote: rejectNote } : r)))
        router.refresh()
      } else {
        showToast(res.error || 'Gagal menolak pengajuan level.', 'error')
      }
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-255">
      <Toast toast={toast} />

      <div className="bg-white border border-[#e2e8f0] p-6 rounded-[var(--radius-brand)] shadow-sm">
        <h3 className="font-sora text-sm font-bold text-slate-800 uppercase tracking-wider mb-2 border-b border-[#e2e8f0] pb-3 text-[#0F5132]">
          Persetujuan Kenaikan Level Usaha (L1 - L4)
        </h3>
        <p className="text-xs text-[#64748b] mb-6">
          Validasi jangkauan radius, kelengkapan legalitas/sertifikasi, dan omset minimal Rp 10 Juta untuk kenaikan level area merchant.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-xs text-left">
            <thead className="bg-[#f8f9fa] border-b border-[#e2e8f0] text-[#64748b] uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="px-4 py-3">Merchant</th>
                <th className="px-4 py-3 text-center">Level Target</th>
                <th className="px-4 py-3 text-center">Jangkauan Radius</th>
                <th className="px-4 py-3 text-right">Omset Bulanan</th>
                <th className="px-4 py-3 text-center">Kelengkapan</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {levelRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400 italic">
                    Belum ada pengajuan kenaikan level merchant.
                  </td>
                </tr>
              ) : (
                levelRequests.map((req: any) => {
                  const isOmsetQualified = req.omsetBulan >= 10000000
                  return (
                    <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-800">{req.user?.name || 'Merchant'}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{req.user?.email}</p>
                        <p className="text-[9px] text-slate-450 mt-0.5">Level Saat Ini: L{req.user?.merchantLevel || 1}</p>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-slate-800">L{req.targetLevel}</td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-700">{req.radiusKm} KM</td>
                      <td className="px-4 py-3 text-right">
                        <p className="font-bold text-slate-850">Rp {req.omsetBulan.toLocaleString('id-ID')}</p>
                        <span
                          className={`inline-block text-[8px] font-bold px-1.5 py-0.2 rounded mt-0.5 border ${
                            isOmsetQualified ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {isOmsetQualified ? 'Lolos (>= Rp 10jt)' : 'Belum Lolos (< Rp 10jt)'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1 text-[9px] font-medium text-slate-600">
                          <div className="flex items-center gap-1">
                            <span className={req.hasLegalitas ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>{req.hasLegalitas ? '✓' : '✗'}</span>
                            <span>Legalitas (Akta/AHU/NPWP)</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className={req.hasDesain ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>{req.hasDesain ? '✓' : '✗'}</span>
                            <span>Desain Premium</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className={req.hasSertifikat ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>{req.hasSertifikat ? '✓' : '✗'}</span>
                            <span>Sertifikasi Produk</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border tracking-wider ${
                            req.status === 'APPROVED'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : req.status === 'REJECTED'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-yellow-50 text-yellow-750 border-yellow-200'
                          }`}
                        >
                          {req.status}
                        </span>
                        {req.status === 'REJECTED' && req.reviewNote && (
                          <p className="text-[9px] text-red-500 italic mt-1 max-w-[150px] truncate" title={req.reviewNote}>
                            Catatan: {req.reviewNote}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {req.status === 'PENDING' ? (
                          currentUser.isSuperAdmin ? (
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => handleApprove(req.id)}
                                disabled={isPending}
                                className="px-2.5 py-1 bg-[#0F5132] hover:bg-[#0a3a24] text-white rounded text-[10px] font-bold uppercase transition-colors cursor-pointer border-none"
                              >
                                Setujui
                              </button>
                              <button
                                onClick={() => openRejectModal(req.id)}
                                disabled={isPending}
                                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold uppercase transition-colors cursor-pointer border-none"
                              >
                                Tolak
                              </button>
                            </div>
                          ) : (
                            <span className="text-[9px] text-slate-400 italic">Butuh Superadmin</span>
                          )
                        ) : (
                          <span className="text-[10px] text-slate-450 italic">Selesai</span>
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

      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-red-200 rounded-[var(--radius-brand)] max-w-md w-full p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-sora text-sm font-bold text-red-650 uppercase tracking-wider">Tolak Pengajuan Level Merchant</h3>
              <button onClick={() => setIsRejectModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Alasan Penolakan (Catatan Evaluasi)</label>
                <textarea
                  required
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  placeholder="e.g. Omset bulanan belum mencapai Rp 10 Juta / Legalitas NPWP tidak terdaftar"
                  className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2.5 text-slate-800 placeholder-[#94a3b8] outline-none focus:border-red-500 h-24"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-[var(--radius-brand)] uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-[var(--radius-brand)] uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 border-none"
                >
                  {isPending ? 'Menyimpan...' : 'Tolak Pengajuan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
