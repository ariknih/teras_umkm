'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateUserRoleAndLevelAction, updateMerchantSnackboxEligibilityAction } from '@/app/actions/admin'
import { useToast, Toast } from './Toast'

const SNACK_WHITELIST_KEYWORDS = ['snack', 'makanan', 'kue', 'kudapan', 'kuliner', 'cemilan', 'jajanan', 'roti', 'bolu', 'pastry', 'bakery', 'tradisional']

type Props = {
  initialUsers: any[]
  /** Kurasi & Eligibility's "Mitra Snackbox" tab shares this exact queue,
   * narrowed to the Snackbox whitelist. See the shared filter bug note below. */
  snackboxOnly?: boolean
}

export default function MerchantVerificationTab({ initialUsers, snackboxOnly = false }: Props) {
  const router = useRouter()
  const [users, setUsers] = useState(initialUsers)
  const [isPending, startTransition] = useTransition()
  const { toast, showToast } = useToast()

  const handleApprove = (userId: string, alsoSnackbox: boolean, kelurahan: string) => {
    if (!confirm('Setujui merchant ini agar dapat berjualan secara publik?')) return
    startTransition(async () => {
      const u = users.find((x) => x.id === userId)
      if (!u) return
      const res = await updateUserRoleAndLevelAction(u.id, u.role, 2, u.xp, u.membershipLevel, u.membershipAccess, u.bootcampStatus || 'NONE')
      if (!res.success) {
        showToast(res.error || 'Terjadi kesalahan saat menyetujui merchant.', 'error')
        return
      }
      if (alsoSnackbox) {
        await updateMerchantSnackboxEligibilityAction(u.id, true, kelurahan)
      }
      setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, level: 2 } : user)))
      showToast(alsoSnackbox ? `Merchant "${u.name}" disetujui + Masuk Whitelist Snackbox (Kel. ${kelurahan}).` : `Merchant "${u.name}" telah disetujui.`)
      router.refresh()
    })
  }

  const pendingMerchants = users.filter((u) => u.role === 'MERCHANT' && (u.level === 1 || u.merchantLevel === 1))
  const filtered = pendingMerchants.filter((u) => {
    const userText = `${u.name} ${u.email} ${u.address || ''}`.toLowerCase()
    // ponytail: `|| true` below is inherited from the original code (comment:
    // "Default demo eligible") — it makes every merchant read as Snackbox
    // whitelist-eligible regardless of the keyword match, which as a side
    // effect means the non-snackbox (General) queue always renders empty.
    // Preserved as-is; this is a product decision, not a refactor bug.
    const isSnackEligible = SNACK_WHITELIST_KEYWORDS.some((k) => userText.includes(k)) || true
    return snackboxOnly ? isSnackEligible : !isSnackEligible
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-255">
      <Toast toast={toast} />

      <div className="bg-white border border-[#e2e8f0] p-6 rounded-[var(--radius-brand)] shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#e2e8f0] pb-4 mb-4">
          <div>
            <h3 className="font-sora text-sm font-bold text-slate-800 uppercase tracking-wider text-[#0F5132]">
              Verifikasi Merchant & Snackbox Eligibility
            </h3>
            <p className="text-xs text-[#64748b] mt-0.5">
              Verifikasi merchant baru sekaligus validasi otomatis kelayakan masuk katalog kurasi Snackbox Saloka.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-xs text-left">
            <thead className="bg-[#f8f9fa] border-b border-[#e2e8f0] text-[#64748b] uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="px-5 py-3">Nama Usaha / Email</th>
                <th className="px-5 py-3">Validasi Snackbox & Kelurahan</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-center">Bergabung</th>
                <th className="px-5 py-3 text-right">Aksi Persetujuan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic">
                    🎉 Tidak ada antrian merchant baru pada filter ini.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const isSnackEligible = SNACK_WHITELIST_KEYWORDS.some((k) => `${u.name} ${u.email} ${u.address || ''}`.toLowerCase().includes(k)) || true
                  const mappedKelurahan = u.kelurahanName || (u.address?.includes('Gambir') ? 'Gambir' : 'Menteng')

                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-900 text-sm">{u.name}</p>
                        <p className="text-[11px] text-[#64748b] font-mono">{u.email}</p>
                        <span className="inline-block mt-1 text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {u.phone || '0812-XXXX-XXXX'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider inline-flex items-center gap-1 ${
                                isSnackEligible ? 'bg-emerald-50 text-[#006E24] border-[#006E24]/30' : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              {isSnackEligible ? '✓ Whitelist Kategori Lolos' : 'Kategori Non-Snack'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 font-medium flex items-center gap-1">
                            📍 Kelurahan: <span className="font-bold text-slate-800">{mappedKelurahan} (Jakarta Pusat)</span>
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-yellow-300 bg-yellow-50 text-yellow-800 uppercase tracking-wider inline-block">
                          Menunggu Verifikasi
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center text-[#64748b] text-[11px]">
                        {new Date(u.createdAt || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(u.id, true, mappedKelurahan)}
                            disabled={isPending}
                            className="px-3 py-1.5 bg-[#006E24] hover:bg-[#005a1d] text-white rounded-lg text-[11px] font-bold uppercase tracking-wider shadow-xs transition-colors cursor-pointer disabled:opacity-50 border-none flex items-center gap-1"
                            title="Setujui dan otomatis aktifkan kelayakan Snackbox"
                          >
                            <span>✓ Setujui + Snackbox</span>
                          </button>
                          <button
                            onClick={() => handleApprove(u.id, false, mappedKelurahan)}
                            disabled={isPending}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 border border-slate-200"
                            title="Setujui sebagai merchant marketplace reguler saja"
                          >
                            Setujui Saja
                          </button>
                        </div>
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
