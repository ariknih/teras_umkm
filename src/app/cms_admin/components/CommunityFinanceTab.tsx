'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import ExportCsvButton from './ExportCsvButton'
import { useToast, Toast } from './Toast'
import { processCommunityWithdrawalAction } from '@/app/actions/community-finance'
import { getCommunityTierBadge } from '@/lib/community-badge'

const rp = (n: number) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`
const date = (d: any) => (d ? new Date(d).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-')

const STATUS_STYLE: Record<string, string> = {
  PENDING: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  PAID: 'bg-green-50 text-green-700 border-green-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200'
}
const STATUS_LABEL: Record<string, string> = { PENDING: 'Menunggu', PAID: 'Ditransfer', REJECTED: 'Ditolak' }

function Card({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#e2e8f0] p-6 rounded-[var(--radius-brand)] shadow-sm">
      <h3 className="font-sora text-sm font-bold uppercase tracking-wider mb-2 border-b border-[#e2e8f0] pb-3 text-[#0F5132]">{title}</h3>
      <p className="text-xs text-[#64748b] mb-6">{desc}</p>
      {children}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 bg-[#f8f9fa] border border-[#e2e8f0] rounded-xl">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">{label}</p>
      <p className="text-lg font-black text-[#0F5132] font-sora mt-1">{value}</p>
    </div>
  )
}

export default function CommunityFinanceTab({ tab, data, canAct }: { tab: string; data: any; canAct: boolean }) {
  if (tab === 'pendapatan-platform') return <PlatformRevenue revenue={data.revenue} />
  if (tab === 'kas-komunitas') return <Balances balances={data.balances || []} />
  return <Withdrawals withdrawals={data.withdrawals || []} canAct={canAct} />
}

type RevenueSource = 'JOIN_FEE_TIER' | 'COIN_TOPUP' | 'MARKETPLACE'
const SOURCE_LABEL: Record<RevenueSource, string> = {
  MARKETPLACE: 'Komisi Marketplace',
  JOIN_FEE_TIER: 'Tier Referral tanpa penerima (Perkumpulan Premium)',
  COIN_TOPUP: 'Top Up Koin (Koperasi)'
}
const SOURCE_FILTER_LABEL: Record<'ALL' | RevenueSource, string> = { ALL: 'Semua', MARKETPLACE: 'Marketplace', JOIN_FEE_TIER: 'Tier Referral', COIN_TOPUP: 'Top Up Koin' }

function PlatformRevenue({ revenue }: { revenue: { rows: any[]; totals: { all: number; joinFeeTier: number; coinTopup: number; marketplace: number } } }) {
  const [source, setSource] = useState<'ALL' | RevenueSource>('ALL')
  const rows = revenue.rows.filter((r) => source === 'ALL' || r.source === source)
  const sourceLabel = (s: string) => SOURCE_LABEL[s as RevenueSource] || s

  return (
    <div className="space-y-6">
      <ExportCsvButton
        filenamePrefix="pendapatan_platform"
        rows={[['Tanggal', 'Sumber', 'Komunitas', 'Tipe', 'Nominal (Rp)', 'Keterangan'], ...rows.map((r) => [String(r.createdAt), sourceLabel(r.source), r.community?.name || '-', r.community?.type || '-', String(r.amount), r.description || ''])]}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Total Pendapatan" value={rp(revenue.totals.all)} />
        <Stat label="Komisi Marketplace" value={rp(revenue.totals.marketplace)} />
        <Stat label="Tier Referral (Perkumpulan Premium)" value={rp(revenue.totals.joinFeeTier)} />
        <Stat label="Top Up Koin (Koperasi)" value={rp(revenue.totals.coinTopup)} />
      </div>
      <Card
        title="Pendapatan Platform Saloka"
        desc="Ledger saja (tidak dikreditkan ke wallet mana pun) — dana sudah berada di saldo payment gateway Saloka."
      >
        <div className="flex gap-2 mb-4" role="group" aria-label="Filter sumber">
          {(['ALL', 'MARKETPLACE', 'JOIN_FEE_TIER', 'COIN_TOPUP'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSource(s)}
              aria-pressed={source === s}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border cursor-pointer ${source === s ? 'bg-[#0F5132] text-white border-[#0F5132]' : 'bg-white text-slate-600 border-[#e2e8f0]'}`}
            >
              {SOURCE_FILTER_LABEL[s]}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-xs text-left">
            <thead className="bg-[#f8f9fa] border-b border-[#e2e8f0] text-[#64748b] uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Sumber</th>
                <th className="px-4 py-3">Komunitas</th>
                <th className="px-4 py-3 text-right">Nominal</th>
                <th className="px-4 py-3">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Belum ada pendapatan platform.</td></tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 text-slate-500 font-mono text-[10px]">{date(r.createdAt)}</td>
                    <td className="px-4 py-3">{sourceLabel(r.source)}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{r.community?.name || '-'}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-[#0F5132]">{rp(r.amount)}</td>
                    <td className="px-4 py-3 text-slate-500">{r.description}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function Balances({ balances }: { balances: any[] }) {
  const total = balances.reduce((s, b) => s + (b.balance || 0), 0)
  const pending = balances.reduce((s, b) => s + (b.pendingWithdrawal || 0), 0)
  return (
    <div className="space-y-6">
      <ExportCsvButton
        filenamePrefix="saldo_kas_komunitas"
        rows={[['Komunitas', 'Tipe/Tier', 'Ketua', 'Saldo Kas (Rp)', 'Penarikan Menunggu (Rp)'], ...balances.map((b) => [b.name, getCommunityTierBadge(b).label, b.ketua?.name || '-', String(b.balance), String(b.pendingWithdrawal)])]}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Stat label="Total Saldo Kas Semua Komunitas" value={rp(total)} />
        <Stat label="Total Penarikan Menunggu" value={rp(pending)} />
      </div>
      <Card title="Saldo Kas Komunitas & Koperasi" desc="Dana milik komunitas yang dipegang Saloka: bagi hasil pendaftaran, simpanan online (Koperasi), dan komisi komunitas induk marketplace.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-xs text-left">
            <thead className="bg-[#f8f9fa] border-b border-[#e2e8f0] text-[#64748b] uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Komunitas</th>
                <th className="px-4 py-3">Tipe / Tier</th>
                <th className="px-4 py-3">Ketua</th>
                <th className="px-4 py-3 text-right">Saldo Kas</th>
                <th className="px-4 py-3 text-right">Penarikan Menunggu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {balances.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Belum ada komunitas.</td></tr>
              ) : (
                balances.map((b) => (
                  <tr key={b.id}>
                    <td className="px-4 py-3 font-bold text-slate-800">{b.name}</td>
                    <td className="px-4 py-3 text-[10px] font-bold uppercase text-slate-600">{getCommunityTierBadge(b).label}</td>
                    <td className="px-4 py-3 text-slate-600">{b.ketua?.name || '-'}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-[#0F5132]">{rp(b.balance)}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">{rp(b.pendingWithdrawal)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function Withdrawals({ withdrawals, canAct }: { withdrawals: any[]; canAct: boolean }) {
  const router = useRouter()
  const { toast, showToast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [inputs, setInputs] = useState<Record<string, { ref: string; note: string }>>({})
  const setInput = (id: string, key: 'ref' | 'note', value: string) =>
    setInputs((prev) => ({ ...prev, [id]: { ...(prev[id] || { ref: '', note: '' }), [key]: value } }))

  const decide = (id: string, decision: 'PAID' | 'REJECTED') => {
    const { ref = '', note = '' } = inputs[id] || {}
    const msg = decision === 'PAID' ? 'Tandai penarikan ini sudah DITRANSFER?' : 'TOLAK penarikan ini? Dana akan dikembalikan ke Kas.'
    if (!confirm(msg)) return
    startTransition(async () => {
      const res = await processCommunityWithdrawalAction(id, decision, note, ref)
      if (res.error) return showToast(res.error, 'error')
      showToast(decision === 'PAID' ? 'Penarikan ditandai sudah ditransfer.' : 'Penarikan ditolak, dana dikembalikan ke Kas.')
      router.refresh()
    })
  }

  const disabledTitle = canAct ? undefined : 'Hanya Admin Financial yang dapat memproses penarikan (Superadmin hanya dapat melihat).'

  return (
    <div className="space-y-6">
      <Toast toast={toast} />
      <ExportCsvButton
        filenamePrefix="penarikan_kas_komunitas"
        rows={[['ID', 'Tanggal', 'Komunitas', 'Nominal (Rp)', 'Bank', 'No Rekening', 'Atas Nama', 'Status', 'Ref Transfer', 'Catatan'], ...withdrawals.map((w) => [w.id, String(w.createdAt), w.community?.name || '-', String(w.amount), w.bankName, w.accountNumber, w.accountName, w.status, w.transferRef || '', w.note || ''])]}
      />
      {!canAct && (
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 font-medium" role="note">
          Mode lihat saja — hanya Admin Financial yang dapat memproses penarikan Kas.
        </div>
      )}
      <Card title="Permintaan Penarikan Kas Komunitas" desc="Diajukan oleh Ketua Komunitas. Dana sudah ditahan dari Kas saat pengajuan; transfer manual ke rekening tujuan lalu tandai Ditransfer, atau Tolak untuk mengembalikan dana ke Kas.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-xs text-left">
            <thead className="bg-[#f8f9fa] border-b border-[#e2e8f0] text-[#64748b] uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Komunitas</th>
                <th className="px-4 py-3 text-right">Nominal</th>
                <th className="px-4 py-3">Rekening Tujuan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {withdrawals.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Tidak ada permintaan penarikan Kas.</td></tr>
              ) : (
                withdrawals.map((w) => (
                  <tr key={w.id} className="align-top">
                    <td className="px-4 py-3 text-slate-500 font-mono text-[10px]">{date(w.createdAt)}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{w.community?.name || w.communityId}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-[#0F5132]">{rp(w.amount)}</td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-800">{w.bankName} · <span className="font-mono">{w.accountNumber}</span></p>
                      <p className="text-[10px] text-slate-500">a/n {w.accountName}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border tracking-wider ${STATUS_STYLE[w.status] || ''}`}>{STATUS_LABEL[w.status] || w.status}</span>
                      {w.transferRef && <p className="text-[10px] text-slate-500 mt-1">Ref: {w.transferRef}</p>}
                      {w.note && <p className="text-[10px] text-slate-500 mt-1">{w.note}</p>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {w.status === 'PENDING' ? (
                        <div className="flex flex-col items-end gap-1.5">
                          <label className="sr-only" htmlFor={`ref-${w.id}`}>Nomor referensi transfer</label>
                          <input id={`ref-${w.id}`} disabled={!canAct || isPending} placeholder="No. referensi transfer" value={inputs[w.id]?.ref || ''} onChange={(e) => setInput(w.id, 'ref', e.target.value)} className="w-48 border border-[#e2e8f0] rounded px-2 py-1 text-[11px] disabled:bg-slate-50" />
                          <label className="sr-only" htmlFor={`note-${w.id}`}>Catatan atau alasan penolakan</label>
                          <input id={`note-${w.id}`} disabled={!canAct || isPending} placeholder="Catatan / alasan tolak" value={inputs[w.id]?.note || ''} onChange={(e) => setInput(w.id, 'note', e.target.value)} className="w-48 border border-[#e2e8f0] rounded px-2 py-1 text-[11px] disabled:bg-slate-50" />
                          <div className="flex gap-1.5">
                            <button onClick={() => decide(w.id, 'REJECTED')} disabled={!canAct || isPending} title={disabledTitle} className="px-3 py-1 bg-white border border-red-200 text-red-700 rounded text-[10px] font-bold uppercase cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">Tolak</button>
                            <button onClick={() => decide(w.id, 'PAID')} disabled={!canAct || isPending} title={disabledTitle} className="px-3 py-1 bg-[#0F5132] text-white rounded text-[10px] font-bold uppercase cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">Ditransfer</button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Diproses {date(w.processedAt)}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
