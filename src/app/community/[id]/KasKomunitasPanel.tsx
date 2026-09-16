'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { Landmark, Loader2 } from 'lucide-react'
import { goeyToast } from 'goey-toast'
import { getCommunityWalletAction, requestCommunityWithdrawalAction } from '@/app/actions/community-finance'

const rp = (n: number) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`
const fmtDate = (d: any) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const STATUS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'Menunggu Verifikasi', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  PAID: { label: 'Ditransfer', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REJECTED: { label: 'Ditolak', cls: 'bg-red-50 text-red-700 border-red-200' }
}

// Ketua-only view of the community's own wallet. Applies to every type/tier:
// Perkumpulan Reguler/Premium (marketplace 10%, Premium join-fee kas share)
// and Koperasi Reguler/Premium/Max (Simpanan Pokok on join, online simpanan,
// marketplace 10%).
export default function KasKomunitasPanel({ communityId, isKoperasi }: { communityId: string; isKoperasi: boolean }) {
  const kasLabel = isKoperasi ? 'Kas Koperasi' : 'Kas Komunitas'
  const [loading, setLoading] = useState(true)
  const [wallet, setWallet] = useState<any>(null)
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [form, setForm] = useState({ amount: '', bankName: '', accountNumber: '', accountName: '' })
  const [isPending, startTransition] = useTransition()

  const load = useCallback(async () => {
    const res: any = await getCommunityWalletAction(communityId)
    if (res.error) goeyToast.error(res.error)
    else {
      setWallet(res.wallet)
      setWithdrawals(res.withdrawals || [])
    }
    setLoading(false)
  }, [communityId])

  useEffect(() => {
    load()
  }, [load])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const amount = Number(form.amount)
    if (!confirm(`Ajukan penarikan ${rp(amount)} dari ${kasLabel} ke ${form.bankName} ${form.accountNumber} a/n ${form.accountName}?`)) return
    startTransition(async () => {
      const res: any = await requestCommunityWithdrawalAction(communityId, { ...form, amount })
      if (res.error) return void goeyToast.error(res.error)
      goeyToast.success('Pengajuan penarikan terkirim. Dana ditahan sampai diverifikasi Admin Financial Saloka.')
      setForm({ amount: '', bankName: '', accountNumber: '', accountName: '' })
      load()
    })
  }

  const balance = wallet?.balance || 0
  const input = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#2DB24A]'

  return (
    <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-5">
      <div className="border-b border-gray-100 pb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-gray-900 font-sora flex items-center gap-2">
            <Landmark className="w-6 h-6 text-[#2DB24A]" /> {kasLabel}
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Dana milik komunitas yang dipegang Saloka — terpisah dari dompet pribadi Ketua.
            {isKoperasi ? ' Berasal dari Simpanan Pokok saat bergabung, setoran simpanan online, dan komisi komunitas induk marketplace.' : ' Berasal dari bagi hasil pendaftaran anggota dan komisi komunitas induk marketplace.'}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Saldo {kasLabel}</span>
          <span className="text-2xl font-black text-[#0F5132] font-sora">{loading ? '…' : rp(balance)}</span>
        </div>
      </div>

      {isKoperasi && (
        <p className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3 font-medium leading-relaxed">
          Simpanan anggota adalah modal milik anggota (UU No. 25/1992). Gunakan Kas Koperasi sesuai keputusan Rapat Anggota, dan catat setiap pengembalian simpanan anggota yang keluar.
        </p>
      )}

      <form onSubmit={submit} className="space-y-3">
        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Ajukan Penarikan</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-[11px] font-bold text-gray-700 space-y-1">
            <span>Nominal (Rp, min. 10.000)</span>
            <input type="number" inputMode="numeric" min={10000} step={1} max={balance} required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={`${input} font-mono`} />
          </label>
          <label className="text-[11px] font-bold text-gray-700 space-y-1">
            <span>Nama Bank</span>
            <input required maxLength={60} value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} placeholder="BCA / Mandiri / BRI / BNI" className={input} />
          </label>
          <label className="text-[11px] font-bold text-gray-700 space-y-1">
            <span>Nomor Rekening</span>
            <input required inputMode="numeric" pattern="[0-9]{5,20}" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} className={`${input} font-mono`} />
          </label>
          <label className="text-[11px] font-bold text-gray-700 space-y-1">
            <span>Atas Nama Rekening</span>
            <input required maxLength={100} value={form.accountName} onChange={(e) => setForm({ ...form, accountName: e.target.value })} className={input} />
          </label>
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={isPending || loading || balance < 10000} className="px-5 py-2.5 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
            {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Mengirim...</> : 'Ajukan Penarikan'}
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Riwayat Penarikan</h3>
          <div className="border border-gray-200 rounded-2xl divide-y divide-gray-100 max-h-80 overflow-y-auto">
            {withdrawals.length === 0 ? (
              <p className="p-4 text-center text-xs text-gray-400">Belum ada pengajuan penarikan.</p>
            ) : (
              withdrawals.map((w) => (
                <div key={w.id} className="p-3 text-xs flex justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900">{rp(w.amount)}</p>
                    <p className="text-[10px] text-gray-500 truncate">{w.bankName} · {w.accountNumber} · {fmtDate(w.createdAt)}</p>
                    {w.transferRef && <p className="text-[10px] text-gray-500">Ref: {w.transferRef}</p>}
                    {w.note && <p className="text-[10px] text-gray-500">{w.note}</p>}
                  </div>
                  <span className={`self-start shrink-0 px-2 py-0.5 rounded-full border text-[9px] font-bold ${STATUS[w.status]?.cls || ''}`}>{STATUS[w.status]?.label || w.status}</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Mutasi {kasLabel}</h3>
          <div className="border border-gray-200 rounded-2xl divide-y divide-gray-100 max-h-80 overflow-y-auto">
            {!wallet?.transactions?.length ? (
              <p className="p-4 text-center text-xs text-gray-400">Belum ada mutasi.</p>
            ) : (
              wallet.transactions.map((t: any) => {
                const isOut = t.type === 'WITHDRAWAL'
                return (
                  <div key={t.id} className="p-3 text-xs flex justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-gray-800 font-medium">{t.description}</p>
                      <p className="text-[10px] text-gray-400">{fmtDate(t.createdAt)}</p>
                    </div>
                    <span className={`shrink-0 font-mono font-bold ${isOut ? 'text-red-600' : 'text-[#0F5132]'}`}>{isOut ? '−' : '+'}{rp(t.amount)}</span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
