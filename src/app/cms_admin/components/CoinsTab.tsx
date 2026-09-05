'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { getAllCoinHoldersAction, injectCoinAction } from '@/app/actions/admin'
import {
  createCoinVoucherAdmin,
  toggleCoinVoucherActive,
  getCoinAdminStats,
  getCoinSupplyConfigAction,
  updateCoinSupplyAction,
  distributeCoinFromSupplyAction,
  getCoinSupplyLogsAction
} from '@/app/actions/coin'
import { useToast, Toast } from './Toast'

type Props = {
  tab: string
  users: any[]
  communities: any[]
  invoices: any[]
  currentUser: any
  initialCoinHolders: any[]
  initialVouchers: any[]
  initialCoinStats: any
  initialCoinSupplyConfig: any
  initialCoinSupplyLogs: any[]
}

export default function CoinsTab({
  tab,
  users,
  communities,
  invoices,
  currentUser,
  initialCoinHolders,
  initialVouchers,
  initialCoinStats,
  initialCoinSupplyConfig,
  initialCoinSupplyLogs
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { toast, showToast } = useToast()
  const isAdmin = currentUser.isSuperAdmin || currentUser.role === 'ADMIN'

  const [coinHolders, setCoinHolders] = useState(initialCoinHolders)
  const [vouchers, setVouchers] = useState(initialVouchers)
  const [coinStats, setCoinStats] = useState(initialCoinStats || { totalTx: 0, totalRedemptions: 0, recentTx: [] })
  const [coinSupplyConfig, setCoinSupplyConfig] = useState(initialCoinSupplyConfig || { totalSupply: 100000, circulatingSupply: 0 })
  const [coinSupplyLogs, setCoinSupplyLogs] = useState(initialCoinSupplyLogs)

  const [supplyAmountInput, setSupplyAmountInput] = useState('100000')
  const [distributeTargetId, setDistributeTargetId] = useState('')
  const [distributeTargetType, setDistributeTargetType] = useState<'KOPERASI' | 'KOMUNITAS' | 'USER'>('KOPERASI')
  const [distributeAmount, setDistributeAmount] = useState('')
  const [distributeReason, setDistributeReason] = useState('')

  const [isInjectModalOpen, setIsInjectModalOpen] = useState(false)
  const [injectTargetId, setInjectTargetId] = useState('')
  const [injectTargetType, setInjectTargetType] = useState<'USER' | 'COMMUNITY'>('USER')
  const [injectAmount, setInjectAmount] = useState('')
  const [injectReason, setInjectReason] = useState('')

  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false)
  const [voucherName, setVoucherName] = useState('')
  const [voucherDesc, setVoucherDesc] = useState('')
  const [voucherType, setVoucherType] = useState<'INTERNAL' | 'EXTERNAL'>('INTERNAL')
  const [voucherCoinCost, setVoucherCoinCost] = useState('')
  const [voucherValue, setVoucherValue] = useState('')
  const [voucherCode, setVoucherCode] = useState('')
  const [voucherMaxRedemption, setVoucherMaxRedemption] = useState('0')
  const [voucherValidUntil, setVoucherValidUntil] = useState('')

  const handleUpdateSupplySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(supplyAmountInput)
    if (isNaN(amount) || amount <= 0) {
      alert('Nominal supply tidak valid.')
      return
    }
    startTransition(async () => {
      const res = await updateCoinSupplyAction(amount)
      if (res.success) {
        showToast(`Total Coin Supply platform berhasil diubah menjadi ${amount.toLocaleString('id-ID')} Coin.`)
        const cfg = await getCoinSupplyConfigAction()
        if (cfg) setCoinSupplyConfig(cfg)
        router.refresh()
      } else {
        showToast(res.error || 'Gagal mengubah supply coin.', 'error')
      }
    })
  }

  const handleDistributeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!distributeTargetId || !distributeAmount || !distributeReason) {
      alert('Target ID, jumlah, dan alasan wajib diisi.')
      return
    }
    const formData = new FormData()
    formData.append('targetId', distributeTargetId)
    formData.append('targetType', distributeTargetType)
    formData.append('amount', distributeAmount)
    formData.append('reason', distributeReason)

    startTransition(async () => {
      const res = await distributeCoinFromSupplyAction(formData)
      if (res.success) {
        showToast(`Berhasil mendistribusikan ${distributeAmount} coin dari supply platform.`)
        setDistributeTargetId('')
        setDistributeAmount('')
        setDistributeReason('')
        const cfg = await getCoinSupplyConfigAction()
        if (cfg) setCoinSupplyConfig(cfg)
        const logs = await getCoinSupplyLogsAction()
        if (logs) setCoinSupplyLogs(logs)
        router.refresh()
      } else {
        showToast(res.error || 'Gagal mendistribusikan coin.', 'error')
      }
    })
  }

  const handleInjectSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!injectTargetId || !injectAmount || !injectReason) {
      alert('Semua kolom wajib diisi.')
      return
    }
    const formData = new FormData()
    formData.append('targetId', injectTargetId)
    formData.append('targetType', injectTargetType)
    formData.append('amount', injectAmount)
    formData.append('reason', injectReason)

    startTransition(async () => {
      const res = await injectCoinAction(formData)
      if (res.success) {
        showToast(`Inject ${injectAmount} koin berhasil dilakukan.`)
        setIsInjectModalOpen(false)
        setInjectTargetId('')
        setInjectAmount('')
        setInjectReason('')
        const holders = await getAllCoinHoldersAction()
        setCoinHolders(holders)
        const stats = await getCoinAdminStats()
        if (stats) setCoinStats(stats)
        router.refresh()
      } else {
        showToast(res.error || 'Gagal melakukan inject koin.', 'error')
      }
    })
  }

  const handleVoucherSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append('name', voucherName)
    formData.append('description', voucherDesc)
    formData.append('type', voucherType)
    formData.append('coinCost', voucherCoinCost)
    formData.append('value', voucherValue)
    formData.append('code', voucherCode)
    formData.append('maxRedemption', voucherMaxRedemption)
    formData.append('validUntil', voucherValidUntil)

    startTransition(async () => {
      const res = await createCoinVoucherAdmin(formData)
      if (res.success && res.voucher) {
        setVouchers((prev: any[]) => [res.voucher, ...prev])
        showToast(`Voucher "${voucherName}" berhasil dibuat!`)
        setIsVoucherModalOpen(false)
        setVoucherName('')
        setVoucherDesc('')
        setVoucherType('INTERNAL')
        setVoucherCoinCost('')
        setVoucherValue('')
        setVoucherCode('')
        setVoucherMaxRedemption('0')
        setVoucherValidUntil('')
        const stats = await getCoinAdminStats()
        if (stats) setCoinStats(stats)
      } else {
        showToast(res.error || 'Gagal membuat voucher.', 'error')
      }
    })
  }

  const handleToggleVoucher = (v: any) => {
    if (!confirm(`Apakah Anda yakin ingin ${v.isActive ? 'menonaktifkan' : 'mengaktifkan'} voucher ini?`)) return
    startTransition(async () => {
      const res = await toggleCoinVoucherActive(v.id)
      if (res.success) {
        setVouchers((prev: any[]) => prev.map((x) => (x.id === v.id ? { ...x, isActive: !x.isActive } : x)))
      } else {
        showToast(res.error || 'Gagal mengubah status voucher.', 'error')
      }
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Toast toast={toast} />

      {tab === 'supply' && (
        <>
          {(() => {
            const actualHoldersSum = coinHolders.reduce((acc: number, h: any) => acc + (Number(h.coinBalance) || 0), 0)
            const currentCirculating = Math.max(coinSupplyConfig.circulatingSupply || 0, actualHoldersSum)
            const currentTotal = coinSupplyConfig.totalSupply || 100000
            const currentAvailable = Math.max(0, currentTotal - currentCirculating)

            return (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="p-6 bg-white border border-[#e2e8f0] rounded-[var(--radius-brand)] shadow-sm">
                  <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-1">Total Coin Supply Platform</p>
                  <p className="text-2xl font-sora font-extrabold text-[#0F5132] tracking-tight">{currentTotal.toLocaleString('id-ID')} Coin</p>
                  <p className="text-[10px] text-[#64748b] mt-1.5">Max Supply Platform Saloka</p>
                </div>
                <div className="p-6 bg-white border border-[#e2e8f0] rounded-[var(--radius-brand)] shadow-sm">
                  <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-1">Supply Beredar (Circulating)</p>
                  <p className="text-2xl font-sora font-extrabold text-blue-600 tracking-tight">{currentCirculating.toLocaleString('id-ID')} Coin</p>
                  <p className="text-[10px] text-[#64748b] mt-1.5">Coin terdistribusi ke pasar</p>
                </div>
                <div className="p-6 bg-white border border-[#e2e8f0] rounded-[var(--radius-brand)] shadow-sm">
                  <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-1">Supply Tersedia (Available)</p>
                  <p className="text-2xl font-sora font-extrabold text-amber-600 tracking-tight">{currentAvailable.toLocaleString('id-ID')} Coin</p>
                  <p className="text-[10px] text-[#64748b] mt-1.5">Siap didistribusikan Admin</p>
                </div>
                <div className="p-6 bg-white border border-[#e2e8f0] rounded-[var(--radius-brand)] shadow-sm flex flex-col justify-between">
                  <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-1">Koin Kas & Rate</p>
                  <p className="text-sm font-bold text-slate-800">1 Koin = Rp 1.500</p>
                  <p className="text-[10px] text-[#64748b] mt-1.5">Top up khusus Koperasi</p>
                </div>
              </div>
            )
          })()}

          <div className="bg-white border border-[#e2e8f0] p-6 rounded-[var(--radius-brand)] shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-[#e2e8f0] pb-4">
              <div>
                <h3 className="font-sora text-sm font-bold text-[#0F5132] uppercase tracking-widest">Distribusi Supply Coin (Super Admin)</h3>
                <p className="text-xs text-slate-500 mt-1">Super Admin dapat mendistribusikan coin langsung dari supply platform ke Koperasi, Komunitas, atau User.</p>
              </div>
              {isAdmin && (
                <form onSubmit={handleUpdateSupplySubmit} className="flex items-center gap-2">
                  <input
                    type="number"
                    value={supplyAmountInput}
                    onChange={(e) => setSupplyAmountInput(e.target.value)}
                    placeholder="Set Total Supply"
                    className="w-32 px-3 py-1.5 border border-slate-300 rounded text-xs font-bold text-slate-800"
                  />
                  <button type="submit" className="px-3 py-1.5 bg-[#0F5132] text-white font-bold text-xs rounded hover:bg-[#0a3822]">Set Supply</button>
                </form>
              )}
            </div>

            {isAdmin && (
              <form onSubmit={handleDistributeSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-[#f8f9fa] p-4 rounded border border-slate-200">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Tipe Target</label>
                  <select
                    value={distributeTargetType}
                    onChange={(e) => setDistributeTargetType(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800"
                  >
                    <option value="KOPERASI">Koperasi</option>
                    <option value="KOMUNITAS">Komunitas / Perkumpulan</option>
                    <option value="USER">User / Anggota</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Pilih Target ID / Nama</label>
                  {distributeTargetType === 'USER' ? (
                    <select value={distributeTargetId} onChange={(e) => setDistributeTargetId(e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800">
                      <option value="">-- Pilih User --</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                      ))}
                    </select>
                  ) : (
                    <select value={distributeTargetId} onChange={(e) => setDistributeTargetId(e.target.value)} className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800">
                      <option value="">-- Pilih Komunitas / Koperasi --</option>
                      {communities.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Jumlah Coin</label>
                  <input
                    type="number"
                    required
                    value={distributeAmount}
                    onChange={(e) => setDistributeAmount(e.target.value)}
                    placeholder="Contoh: 500"
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Alasan Distribusi</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={distributeReason}
                      onChange={(e) => setDistributeReason(e.target.value)}
                      placeholder="Alasan / Catatan..."
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800"
                    />
                    <button type="submit" className="px-3 py-1.5 bg-[#0F5132] text-white font-bold text-xs rounded hover:bg-[#0a3a24] shrink-0">Kirim</button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </>
      )}

      {tab === 'holders' && (
        <div className="bg-white border border-[#e2e8f0] p-6 rounded-[var(--radius-brand)] shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-sora text-sm font-bold text-slate-800 uppercase tracking-widest">Daftar Pemegang Koin (Coin Holders)</h3>
              <p className="text-xs text-slate-500 mt-1">Daftar saldo koin aktif pada wallet merchant, user, dan kas komunitas.</p>
            </div>
            {isAdmin && (
              <button
                onClick={() => {
                  setInjectTargetId('')
                  setInjectTargetType('USER')
                  setInjectAmount('')
                  setInjectReason('')
                  setIsInjectModalOpen(true)
                }}
                className="px-4 py-2 bg-[#0F5132] hover:bg-[#0a3a24] text-white text-xs font-bold uppercase tracking-widest rounded transition-colors shadow flex items-center gap-1.5 cursor-pointer border-none outline-none"
              >
                <span>⚡ Inject Koin Baru</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 border-b border-[#e2e8f0] text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="px-4 py-3">ID Pemegang</th>
                  <th className="px-4 py-3">Nama Pemilik</th>
                  <th className="px-4 py-3">Tipe</th>
                  <th className="px-4 py-3 text-right">Saldo Koin</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coinHolders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-slate-400 italic">Belum ada data pemegang koin aktif.</td>
                  </tr>
                ) : (
                  coinHolders.map((h: any) => (
                    <tr key={h.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-650">{h.id}</td>
                      <td className="px-4 py-3 font-bold text-slate-800">{h.name}</td>
                      <td className="px-4 py-3 font-semibold text-slate-500">{h.type}</td>
                      <td className="px-4 py-3 text-right font-bold text-[#0F5132]">{h.coinBalance} Coin</td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[8px] font-bold border border-green-200 bg-green-50 text-green-700 uppercase tracking-wider">ACTIVE</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'voucher' && (
        <div className="bg-white border border-[#e2e8f0] p-6 rounded-[var(--radius-brand)] shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-sora text-sm font-bold text-slate-800 uppercase tracking-widest">Kelola Master Voucher Koin</h3>
              <p className="text-xs text-slate-500 mt-1">Daftar voucher diskon belanja yang dapat ditukar dengan koin oleh user.</p>
            </div>
            <button
              onClick={() => setIsVoucherModalOpen(true)}
              className="px-4 py-2 bg-[#0F5132] hover:bg-[#0a3a24] text-white text-xs font-bold uppercase tracking-widest rounded transition-colors shadow flex items-center gap-1.5 cursor-pointer border-none outline-none"
            >
              <span>+ Tambah Voucher Baru</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 border-b border-[#e2e8f0] text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="px-4 py-3">Nama Voucher</th>
                  <th className="px-4 py-3">Tipe</th>
                  <th className="px-4 py-3 text-right">Biaya Koin</th>
                  <th className="px-4 py-3 text-right">Nilai Rupiah</th>
                  <th className="px-4 py-3">Kode (External)</th>
                  <th className="px-4 py-3 text-center">Stok / Terpakai</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vouchers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400 italic">Belum ada master voucher koin terdaftar.</td>
                  </tr>
                ) : (
                  vouchers.map((v: any) => (
                    <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-800">{v.name}</p>
                        <p className="text-[10px] text-slate-500">{v.description}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border tracking-wider ${v.type === 'INTERNAL' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                          {v.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800">{v.coinCost} Koin</td>
                      <td className="px-4 py-3 text-right font-bold text-primary">Rp {v.value.toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">{v.code || '-'}</td>
                      <td className="px-4 py-3 text-center">{v.maxRedemption > 0 ? `${v.totalRedeemed} / ${v.maxRedemption}` : `${v.totalRedeemed} / Unlimited`}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border tracking-wider ${v.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                          {v.isActive ? 'Aktif' : 'Non-Aktif'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleToggleVoucher(v)}
                          disabled={isPending}
                          className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer border disabled:opacity-50 ${v.isActive ? 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200' : 'bg-green-50 hover:bg-green-100 text-green-600 border-green-200'}`}
                        >
                          {v.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'ledger' && (
        <div className="bg-white border border-[#e2e8f0] p-6 rounded-[var(--radius-brand)] shadow-sm">
          <h3 className="font-sora text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-[#e2e8f0] pb-3 text-[#0F5132]">10 Transaksi Koin Terkini (Ledger Mutasi)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 border-b border-[#e2e8f0] text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="px-4 py-3">Penerima / Komunitas</th>
                  <th className="px-4 py-3">Jenis Transaksi</th>
                  <th className="px-4 py-3 text-right">Jumlah Koin</th>
                  <th className="px-4 py-3">Keterangan</th>
                  <th className="px-4 py-3">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coinStats.recentTx.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-slate-400 italic">Belum ada riwayat transaksi koin.</td>
                  </tr>
                ) : (
                  coinStats.recentTx.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-600">{tx.userId || tx.communityId}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border tracking-wider ${
                            tx.type === 'TOPUP'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : tx.type === 'REDEEM_VOUCHER'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : tx.type === 'INJECTION'
                              ? 'bg-blue-50 text-blue-700 border-blue-200 font-extrabold'
                              : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>{tx.amount > 0 ? `+${tx.amount}` : tx.amount} Coin</td>
                      <td className="px-4 py-3 text-slate-700">{tx.description}</td>
                      <td className="px-4 py-3 text-slate-500">{new Date(tx.createdAt).toLocaleString('id-ID')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isVoucherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#0F5132]/25 rounded-[var(--radius-brand)] max-w-md w-full p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-sora text-sm font-bold text-[#0F5132] uppercase tracking-wider">Buat Voucher Koin Baru</h3>
              <button onClick={() => setIsVoucherModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleVoucherSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Nama Voucher</label>
                <input type="text" required value={voucherName} onChange={(e) => setVoucherName(e.target.value)} placeholder="e.g. Diskon 25rb Shopee" className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2.5 text-slate-800 placeholder-[#94a3b8] outline-none focus:border-[#0F5132]" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Deskripsi</label>
                <textarea required value={voucherDesc} onChange={(e) => setVoucherDesc(e.target.value)} placeholder="e.g. Tukarkan koin Anda untuk mendapatkan voucher potongan 25.000 rupiah di Shopee." className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2.5 text-slate-800 placeholder-[#94a3b8] outline-none focus:border-[#0F5132] h-20" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Tipe Voucher</label>
                  <select value={voucherType} onChange={(e) => setVoucherType(e.target.value as any)} className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2 text-slate-800 outline-none focus:border-[#0F5132]">
                    <option value="INTERNAL">Internal (Belanja Saloka)</option>
                    <option value="EXTERNAL">External (Mitra Shopee/Tokped)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Biaya Tukar Koin</label>
                  <input type="number" required value={voucherCoinCost} onChange={(e) => setVoucherCoinCost(e.target.value)} placeholder="e.g. 10" className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2.5 text-slate-800 outline-none focus:border-[#0F5132]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Nilai Rupiah Potongan</label>
                  <input type="number" required value={voucherValue} onChange={(e) => setVoucherValue(e.target.value)} placeholder="e.g. 25000" className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2.5 text-slate-800 outline-none focus:border-[#0F5132]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Kode Klaim (External)</label>
                  <input type="text" value={voucherCode} onChange={(e) => setVoucherCode(e.target.value)} placeholder="Kosongkan jika tipe INTERNAL" className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2.5 text-slate-800 outline-none focus:border-[#0F5132]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Stok Awal</label>
                  <input type="number" required value={voucherMaxRedemption} onChange={(e) => setVoucherMaxRedemption(e.target.value)} placeholder="0 = Unlimited" className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2.5 text-slate-800 outline-none focus:border-[#0F5132]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Masa Berlaku (Selesai)</label>
                  <input type="date" value={voucherValidUntil} onChange={(e) => setVoucherValidUntil(e.target.value)} className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2 text-slate-800 outline-none focus:border-[#0F5132]" />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsVoucherModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-[var(--radius-brand)] uppercase tracking-wider transition-colors cursor-pointer">Batal</button>
                <button type="submit" disabled={isPending} className="flex-1 py-2.5 bg-[#0F5132] hover:bg-[#0a3a24] text-white font-bold rounded-[var(--radius-brand)] uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50">
                  {isPending ? 'Membuat...' : 'Buat Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isInjectModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#0F5132]/25 rounded-[var(--radius-brand)] max-w-md w-full p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-sora text-sm font-bold text-[#0F5132] uppercase tracking-wider">⚡ Inject Koin Ke Sistem</h3>
              <button onClick={() => setIsInjectModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleInjectSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Tipe Penerima</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="targetType" checked={injectTargetType === 'USER'} onChange={() => { setInjectTargetType('USER'); setInjectTargetId('') }} className="text-[#0F5132] focus:ring-[#0F5132]" />
                    <span className="text-slate-700 font-semibold">Merchant / User</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="targetType" checked={injectTargetType === 'COMMUNITY'} onChange={() => { setInjectTargetType('COMMUNITY'); setInjectTargetId('') }} className="text-[#0F5132] focus:ring-[#0F5132]" />
                    <span className="text-slate-700 font-semibold">Kas Komunitas</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Pilih Target Penerima</label>
                <select required value={injectTargetId} onChange={(e) => setInjectTargetId(e.target.value)} className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2.5 text-slate-800 outline-none focus:border-[#0F5132]">
                  <option value="">-- Pilih Penerima --</option>
                  {injectTargetType === 'USER'
                    ? users.map((u) => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role} - {u.email})</option>
                      ))
                    : Array.from(
                        new Map(
                          [
                            ...invoices.map((inv) => inv.community).filter(Boolean),
                            ...coinHolders.filter((h: any) => h.type.startsWith('KOMUNITAS')).map((h: any) => ({ id: h.id, name: h.name, type: 'KOMUNITAS' }))
                          ].map((c: any) => [c.id, c])
                        ).values()
                      ).map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name} ({c.type || 'KOMUNITAS'})</option>
                      ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Jumlah Koin Inject</label>
                <input type="number" required value={injectAmount} onChange={(e) => setInjectAmount(e.target.value)} placeholder="e.g. 1000" className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2.5 text-slate-800 placeholder-[#94a3b8] outline-none focus:border-[#0F5132]" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Alasan Inject (Penting untuk Audit Log)</label>
                <textarea required value={injectReason} onChange={(e) => setInjectReason(e.target.value)} placeholder="e.g. Topup awal kas komunitas / Reward event tahunan merchant" className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2.5 text-slate-800 placeholder-[#94a3b8] outline-none focus:border-[#0F5132] h-20" />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsInjectModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-[var(--radius-brand)] uppercase tracking-wider transition-colors cursor-pointer">Batal</button>
                <button type="submit" disabled={isPending} className="flex-1 py-2.5 bg-[#0F5132] hover:bg-[#0a3a24] text-white font-bold rounded-[var(--radius-brand)] uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 border-none">
                  {isPending ? 'Injecting...' : 'Inject Koin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
