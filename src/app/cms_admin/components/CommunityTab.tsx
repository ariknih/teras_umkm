'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sparkles,
  Activity,
  MessageSquare,
  Calendar,
  ShoppingBag,
  Image as ImageIcon,
  Users as UsersIcon,
  Sliders,
  Settings
} from 'lucide-react'
import {
  createCommunityAdminAction,
  updateCommunityAdminAction,
  deleteCommunityAdminAction,
  updateUserIndukCommunityAction,
  getGlobalKycSettingAction,
  updateGlobalKycSettingAction,
  kickMemberFromCommunityAdminAction,
  verifyInvoiceMembershipAction,
  getAllCoinHoldersAction
} from '@/app/actions/admin'
import { formatCategoryName } from '@/lib/utils'
import { useToast, Toast } from './Toast'

const EMPTY_COMM_FORM = {
  name: '',
  type: '',
  category: '',
  ketuaId: '',
  aktaNotaris: '',
  nomorAhu: '',
  nomorNpwp: '',
  domisili: '',
  kontakPj: '',
  description: '',
  joinFee: '0',
  monthlyFee: '0',
  simpananPokok: '100000',
  simpananWajib: '25000',
  minCoinForLoan: '1000',
  minCoinRequired: '100',
  isVerified: false,
  isSuspended: false,
  isKycRequired: false
}

type Props = {
  tab: string
  users: any[]
  posts: any[]
  initialCommunities: any[]
  initialInvoices: any[]
}

export default function CommunityTab({ tab, users, posts, initialCommunities, initialInvoices }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { toast, showToast } = useToast()

  const [communities, setCommunities] = useState(initialCommunities)
  const [invoices, setInvoices] = useState(initialInvoices)
  const [users_, setUsers] = useState(users)
  const [coinHolders, setCoinHolders] = useState<any[]>([])

  const [communitySearch, setCommunitySearch] = useState('')
  const [communityTypeFilter, setCommunityTypeFilter] = useState('ALL')
  const [communityCategoryFilter, setCommunityCategoryFilter] = useState('ALL')

  const [communityModal, setCommunityModal] = useState<{ open: boolean; mode: 'add' | 'edit'; data?: any }>({ open: false, mode: 'add' })
  const [selectedTemplate, setSelectedTemplate] = useState('Community')
  const [moduleSettingsOpen, setModuleSettingsOpen] = useState(false)
  const [modulesConfig, setModulesConfig] = useState<Record<string, boolean>>({
    heroBanner: true,
    aktivitas: true,
    diskusi: true,
    event: true,
    produkAnggota: true,
    galeri: true,
    anggota: true
  })
  const [commForm, setCommForm] = useState(EMPTY_COMM_FORM)

  const [memberModal, setMemberModal] = useState<{ open: boolean; community?: any }>({ open: false })
  const [kickConfirmModal, setKickConfirmModal] = useState<{ open: boolean; userId: string; userName: string; communityId: string } | null>(null)
  const [selectedMemberUserId, setSelectedMemberUserId] = useState('')
  const [globalKycRequired, setGlobalKycRequired] = useState(true)

  useEffect(() => {
    getGlobalKycSettingAction().then((res) => {
      if (res && res.required !== undefined) setGlobalKycRequired(res.required)
    })
  }, [])

  const handleToggleGlobalKycSetting = () => {
    const nextState = !globalKycRequired
    startTransition(async () => {
      const res = await updateGlobalKycSettingAction(nextState)
      if (res.success) {
        setGlobalKycRequired(nextState)
        showToast(`Syarat KYC untuk membuat Komunitas Induk diubah menjadi ${nextState ? 'WAJIB (Aktif)' : 'OPSIONAL / MATI (Bebas untuk Semua Merchant)'}.`)
      } else {
        showToast(res.error || 'Gagal mengubah pengaturan.', 'error')
      }
    })
  }

  const openAddCommunity = () => {
    setCommForm({ ...EMPTY_COMM_FORM, ketuaId: users_[0]?.id || '', isVerified: true })
    setCommunityModal({ open: true, mode: 'add' })
  }

  const openEditCommunity = (comm: any) => {
    setCommForm({
      name: comm.name || '',
      type: comm.type || 'PERKUMPULAN',
      category: comm.category || 'FREE',
      ketuaId: comm.ketuaId || '',
      aktaNotaris: comm.aktaNotaris || '',
      nomorAhu: comm.nomorAhu || '',
      nomorNpwp: comm.nomorNpwp || '',
      domisili: comm.domisili || '',
      kontakPj: comm.kontakPj || '',
      description: comm.description || '',
      joinFee: String(comm.joinFee || 0),
      monthlyFee: String(comm.monthlyFee || 0),
      simpananPokok: String(comm.simpananPokok || 100000),
      simpananWajib: String(comm.simpananWajib || 25000),
      minCoinForLoan: String(comm.minCoinForLoan || 1000),
      minCoinRequired: String(comm.minCoinRequired || 100),
      isVerified: Boolean(comm.isVerified),
      isSuspended: Boolean(comm.isSuspended),
      isKycRequired: Boolean(comm.isKycRequired)
    })
    setCommunityModal({ open: true, mode: 'edit', data: comm })
  }

  const handleToggleKycCommunity = (comm: any) => {
    const newKyc = !comm.isKycRequired
    startTransition(async () => {
      const res = await updateCommunityAdminAction(comm.id, { ...comm, isKycRequired: newKyc })
      if (res.success) {
        setCommunities((prev) => prev.map((c) => (c.id === comm.id ? { ...c, isKycRequired: newKyc } : c)))
        showToast(`Syarat KYC Komunitas "${comm.name}" diubah menjadi ${newKyc ? 'WAJIB' : 'OPSIONAL'}.`)
        router.refresh()
      } else {
        showToast(res.error || 'Gagal mengubah status KYC.', 'error')
      }
    })
  }

  const handleSaveCommunitySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!commForm.name || !commForm.ketuaId || !commForm.type || !commForm.category) {
      alert('Nama komunitas, Ketua, Tipe Komunitas, dan Kategori Wajib diisi.')
      return
    }
    startTransition(async () => {
      if (communityModal.mode === 'add') {
        const res = await createCommunityAdminAction(commForm)
        if (res.success && res.community) {
          setCommunities((prev) => [...prev, res.community])
          showToast(`Komunitas Induk "${commForm.name}" berhasil dibuat.`)
          setCommunityModal({ open: false, mode: 'add' })
          router.refresh()
        } else {
          showToast(res.error || 'Gagal membuat komunitas baru.', 'error')
        }
      } else {
        const id = communityModal.data.id
        const res = await updateCommunityAdminAction(id, commForm)
        if (res.success && res.community) {
          setCommunities((prev) => prev.map((c) => (c.id === id ? { ...c, ...res.community } : c)))
          showToast(`Komunitas Induk "${commForm.name}" berhasil diperbarui.`)
          setCommunityModal({ open: false, mode: 'add' })
          router.refresh()
        } else {
          showToast(res.error || 'Gagal memperbarui komunitas.', 'error')
        }
      }
    })
  }

  const handleDeleteCommunity = (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus Komunitas Induk "${name}"?`)) return
    startTransition(async () => {
      const res = await deleteCommunityAdminAction(id)
      if (res.success) {
        setCommunities((prev) => prev.filter((c) => c.id !== id))
        showToast(`Komunitas Induk "${name}" berhasil dihapus.`)
        router.refresh()
      } else {
        showToast(res.error || 'Gagal menghapus komunitas.', 'error')
      }
    })
  }

  const handleApproveCommunity = (comm: any) => {
    if (!confirm(`Setujui & Verifikasi Komunitas "${comm.name}"? Komunitas akan aktif dan otomatis dipublikasikan di halaman Direktori Komunitas.`)) return
    startTransition(async () => {
      const res = await updateCommunityAdminAction(comm.id, { isVerified: true, isSuspended: false })
      if (res.success) {
        setCommunities((prev) => prev.map((c) => (c.id === comm.id ? { ...c, isVerified: true, isSuspended: false } : c)))
        showToast(`Komunitas "${comm.name}" berhasil diverifikasi dan AKTIF!`)
        router.refresh()
      } else {
        showToast(res.error || 'Gagal memverifikasi komunitas.', 'error')
      }
    })
  }

  const handleRejectCommunity = (comm: any) => {
    if (!confirm(`Tolak / Tangguhkan Komunitas "${comm.name}"? Komunitas tidak akan ditampilkan publik.`)) return
    startTransition(async () => {
      const res = await updateCommunityAdminAction(comm.id, { isVerified: false, isSuspended: true })
      if (res.success) {
        setCommunities((prev) => prev.map((c) => (c.id === comm.id ? { ...c, isVerified: false, isSuspended: true } : c)))
        showToast(`Komunitas "${comm.name}" telah DITOLAK / DITANGGUHKAN.`)
        router.refresh()
      } else {
        showToast(res.error || 'Gagal menolak komunitas.', 'error')
      }
    })
  }

  const handleAddMemberToCommunity = (communityId: string, userId: string) => {
    if (!userId) return
    startTransition(async () => {
      const res = await updateUserIndukCommunityAction(userId, communityId || null)
      if (res.success) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, indukCommunityId: communityId || null } : u)))
        if (communityId) {
          setInvoices((prev) => prev.filter((inv) => inv.userId !== userId))
          const targetUser = users_.find((u) => u.id === userId)
          const targetComm = communities.find((c) => c.id === communityId)
          if (targetUser && targetComm) {
            setInvoices((prev) => [
              {
                id: `membership-${Date.now()}`,
                communityId,
                userId,
                isInduk: false,
                isPaid: true,
                invoiceStatus: 'VERIFIED',
                joinedAt: new Date(),
                user: { id: targetUser.id, name: targetUser.name, email: targetUser.email, role: targetUser.role },
                community: { id: targetComm.id, name: targetComm.name, type: targetComm.type }
              },
              ...prev
            ])
          }
          showToast('Anggota berhasil didaftarkan ke Komunitas Induk ini.')
        } else {
          showToast('Anggota berhasil dikeluarkan dari komunitas.')
        }
        setSelectedMemberUserId('')
        router.refresh()
      } else {
        showToast(res.error || 'Gagal memproses keanggotaan.', 'error')
      }
    })
  }

  const handleVerifyInvoice = (membershipId: string) => {
    if (!confirm('Apakah Anda yakin ingin memverifikasi pembayaran invoice keanggotaan ini?')) return
    startTransition(async () => {
      const res = await verifyInvoiceMembershipAction(membershipId)
      if (res.success) {
        showToast('Invoice keanggotaan berhasil diverifikasi.')
        setInvoices((prev) => prev.map((inv) => (inv.id === membershipId ? { ...inv, invoiceStatus: 'VERIFIED', isPaid: true } : inv)))
        const holders = await getAllCoinHoldersAction()
        setCoinHolders(holders)
        router.refresh()
      } else {
        showToast((res as any).error || 'Gagal memverifikasi invoice.', 'error')
      }
    })
  }

  const handleKickMember = () => {
    if (!kickConfirmModal) return
    startTransition(async () => {
      const res = await kickMemberFromCommunityAdminAction(kickConfirmModal.userId, kickConfirmModal.communityId)
      if (res.success) {
        setInvoices((prev) => prev.filter((inv) => !(inv.userId === kickConfirmModal.userId && inv.communityId === kickConfirmModal.communityId)))
        setUsers((prev) => prev.map((u) => (u.id === kickConfirmModal.userId ? { ...u, indukCommunityId: null } : u)))
        showToast('Anggota berhasil dikeluarkan dari komunitas.')
      } else {
        showToast(res.error || 'Gagal mengeluarkan anggota.', 'error')
      }
      setKickConfirmModal(null)
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-250">
      <Toast toast={toast} />

      {tab === 'kyc' && (
        <div className="bg-emerald-50/80 border border-emerald-200 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-sora text-xs font-bold text-[#0F5132] uppercase tracking-wider flex items-center gap-2">
              <span className="text-sm">🛡️</span>
              <span>Pengaturan Superadmin: Syarat KYC Membuat Komunitas Induk</span>
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {globalKycRequired
                ? 'Status: WAJIB AKTIF. Hanya merchant yang sudah terverifikasi KYC (KTP/Selfie) yang dapat membuat Komunitas Induk baru.'
                : 'Status: OPSIONAL / MATI. Semua merchant dapat membuat Komunitas Induk baru secara bebas tanpa syarat verifikasi KYC.'}
            </p>
          </div>
          <button
            onClick={handleToggleGlobalKycSetting}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider cursor-pointer border transition-all shrink-0 shadow-sm ${
              globalKycRequired ? 'bg-[#0F5132] text-white border-[#0F5132] hover:bg-[#0a3822]' : 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600'
            }`}
          >
            Syarat KYC Buat Komunitas: {globalKycRequired ? 'WAJIB (ON)' : 'OPSIONAL (OFF)'}
          </button>
        </div>
      )}

      {tab === 'daftar' && (
        <div className="bg-white border border-[#e2e8f0] p-6 rounded-[var(--radius-brand)] shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#e2e8f0] pb-4">
            <div>
              <h3 className="font-sora text-sm font-bold text-slate-800 uppercase tracking-wider text-[#0F5132]">Kelola Komunitas Induk</h3>
              <p className="text-xs text-[#64748b] mt-0.5">Super Admin & Admin dapat membuat, mengedit detail legalitas/fee, serta menetapkan anggota komunitas induk secara bebas.</p>
            </div>
            <button
              onClick={openAddCommunity}
              className="px-4 py-2 bg-[#0F5132] hover:bg-[#0a3822] text-white text-xs font-bold uppercase tracking-wider rounded-[var(--radius-brand)] shadow-sm transition-colors cursor-pointer flex items-center gap-2 shrink-0"
            >
              <span>+ Tambah Komunitas Induk</span>
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-3 pt-1">
            <input
              type="text"
              placeholder="Cari komunitas berdasarkan nama / ketua / domisili..."
              value={communitySearch}
              onChange={(e) => setCommunitySearch(e.target.value)}
              className="flex-grow bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0F5132]"
            />
            <select value={communityTypeFilter} onChange={(e) => setCommunityTypeFilter(e.target.value)} className="bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0F5132]">
              <option value="ALL">Semua Tipe</option>
              <option value="PERKUMPULAN">PERKUMPULAN</option>
              <option value="KOPERASI">KOPERASI</option>
            </select>
            <select value={communityCategoryFilter} onChange={(e) => setCommunityCategoryFilter(e.target.value)} className="bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0F5132]">
              <option value="ALL">Semua Kategori</option>
              <option value="FREE">FREE</option>
              <option value="PAID">PAID</option>
              <option value="KOPERASI">KOPERASI</option>
            </select>
          </div>

          <div className="overflow-x-auto border border-[#e2e8f0] rounded-[var(--radius-brand)]">
            <table className="w-full min-w-[900px] text-xs text-left">
              <thead className="bg-[#f8f9fa] border-b border-[#e2e8f0] text-[#64748b] uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="px-4 py-3">Nama Komunitas</th>
                  <th className="px-4 py-3">Tipe & Kategori</th>
                  <th className="px-4 py-3">Ketua Komunitas</th>
                  <th className="px-4 py-3 text-center">Status KYC</th>
                  <th className="px-4 py-3 text-right">Saldo Coin</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {communities.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-slate-400 italic">Belum ada komunitas induk terdaftar.</td>
                  </tr>
                ) : (
                  communities
                    .filter((c) => {
                      const matchSearch = c.name?.toLowerCase().includes(communitySearch.toLowerCase()) || c.domisili?.toLowerCase().includes(communitySearch.toLowerCase())
                      const matchType = communityTypeFilter === 'ALL' || c.type === communityTypeFilter
                      const matchCat = communityCategoryFilter === 'ALL' || c.category === communityCategoryFilter
                      return matchSearch && matchType && matchCat
                    })
                    .map((comm) => {
                      const ketuaUser = users_.find((u) => u.id === comm.ketuaId)
                      const memberCount = invoices.filter((inv) => inv.communityId === comm.id).length
                      return (
                        <tr key={comm.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3.5">
                            <p className="font-bold text-slate-800">{comm.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">ID: {comm.id}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex gap-1.5 items-center">
                              <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-emerald-50 text-[#0F5132] border border-[#0F5132]/20 uppercase">{comm.type}</span>
                              <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">{formatCategoryName(comm.category)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="font-bold text-slate-800">{ketuaUser?.name || comm.ketuaId}</p>
                            <p className="text-[10px] text-slate-400">{ketuaUser?.email || ''}</p>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <button
                              onClick={() => handleToggleKycCommunity(comm)}
                              className={`px-2.5 py-1 rounded text-[9px] font-extrabold uppercase border cursor-pointer transition-all shadow-2xs ${
                                comm.isKycRequired ? 'bg-emerald-100 text-[#0F5132] border-primary/40 hover:bg-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200'
                              }`}
                              title="Klik untuk mengubah status syarat KYC"
                            >
                              🪪 KYC: {comm.isKycRequired ? 'WAJIB' : 'OPSIONAL'}
                            </button>
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono font-bold text-[#0F5132]">{(comm.coinBalance || 0).toLocaleString('id-ID')} Coin</td>
                          <td className="px-4 py-3.5 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${
                                comm.isSuspended ? 'bg-red-50 text-red-700 border-red-200' : comm.isVerified ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {comm.isSuspended ? 'Suspended' : comm.isVerified ? 'Verified' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right space-x-1.5">
                            {!comm.isVerified && (
                              <button onClick={() => handleApproveCommunity(comm)} className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-black uppercase tracking-wider cursor-pointer shadow-xs">✓ Setujui</button>
                            )}
                            {comm.isVerified && !comm.isSuspended && (
                              <button onClick={() => handleRejectCommunity(comm)} className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer">Tangguhkan</button>
                            )}
                            <button onClick={() => setMemberModal({ open: true, community: comm })} className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer">
                              Members ({memberCount})
                            </button>
                            <button onClick={() => openEditCommunity(comm)} className="px-2.5 py-1 bg-[#0F5132]/10 hover:bg-[#0F5132]/20 text-[#0F5132] border border-[#0F5132]/20 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer">Edit</button>
                            <button onClick={() => handleDeleteCommunity(comm.id, comm.name)} className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer">Hapus</button>
                          </td>
                        </tr>
                      )
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'invoice' && (
        <div className="bg-white border border-[#e2e8f0] p-6 rounded-[var(--radius-brand)] shadow-sm">
          <h3 className="font-sora text-sm font-bold text-slate-800 uppercase tracking-wider mb-2 border-b border-[#e2e8f0] pb-3 text-[#0F5132]">Verifikasi Pembayaran Invoice Keanggotaan Komunitas</h3>
          <p className="text-xs text-[#64748b] mb-4">Daftar tagihan pendaftaran keanggotaan Komunitas Koperasi (Simpanan Pokok & Wajib) dan Perkumpulan Premium yang dikelola Saloka.</p>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-xs text-left">
              <thead className="bg-[#f8f9fa] border-b border-[#e2e8f0] text-[#64748b] uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="px-4 py-3">Nama Anggota</th>
                  <th className="px-4 py-3">Komunitas</th>
                  <th className="px-4 py-3 text-right">Rincian Biaya</th>
                  <th className="px-4 py-3 text-center">Status Invoice</th>
                  <th className="px-4 py-3 text-center">Tanggal Daftar</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-400 italic">Belum ada pendaftaran dengan invoice keanggotaan.</td>
                  </tr>
                ) : (
                  invoices.map((inv: any) => {
                    const isKoperasi = inv.community?.type === 'KOPERASI'
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-800">{inv.user?.name || 'UMKM Mitra'}</p>
                          <p className="text-[10px] text-slate-505 font-mono">{inv.user?.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-800">{inv.community?.name || 'Komunitas'}</p>
                          <span className={`inline-block text-[8px] font-bold px-1.5 py-0.2 rounded border ${isKoperasi ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-cyan-50 text-cyan-700 border-cyan-200'}`}>
                            {inv.community?.type || 'KOMUNITAS'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isKoperasi ? (
                            <div className="text-right">
                              <p className="font-bold text-slate-850">Simpanan Pokok: Rp 100.000</p>
                              <p className="text-[10px] text-slate-500">Simpanan Wajib: Rp 25.000</p>
                            </div>
                          ) : (
                            <div className="text-right">
                              <p className="font-bold text-[#0F5132]">Biaya Gabung: Free / Standard</p>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border tracking-wider ${
                              inv.invoiceStatus === 'VERIFIED' ? 'bg-green-50 text-green-700 border-green-200' : inv.invoiceStatus === 'PAID' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-yellow-50 text-yellow-750 border-yellow-200'
                            }`}
                          >
                            {inv.invoiceStatus === 'VERIFIED' ? 'Terverifikasi' : inv.invoiceStatus === 'PAID' ? 'Sudah Bayar (Pending)' : 'Belum Bayar'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-slate-500">{new Date(inv.joinedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td className="px-4 py-3 text-right">
                          {inv.invoiceStatus === 'VERIFIED' ? (
                            <span className="text-[10px] text-slate-400 italic">Terverifikasi</span>
                          ) : (
                            <button onClick={() => handleVerifyInvoice(inv.id)} disabled={isPending} className="px-3 py-1 bg-[#0F5132] hover:bg-[#0a3a24] text-white rounded text-[10px] font-bold uppercase tracking-wider transition-colors border-none cursor-pointer disabled:opacity-50">
                              {isPending ? 'Proses...' : 'Verifikasi Lunas'}
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
      )}

      {tab === 'forum' && (
        <div className="bg-white border border-[#e2e8f0] rounded-[var(--radius-brand)] overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-[#e2e8f0] bg-[#f8f9fa]">
            <h3 className="font-sora text-xs font-bold text-[#0F5132] uppercase tracking-wider">Aktivitas Forum Komunitas</h3>
            <p className="text-[11px] text-[#64748b]">Daftar postingan diskusi bisnis UMKM dan komentar terhubung.</p>
          </div>
          <div className="divide-y divide-[#e2e8f0]">
            {posts.map((post) => {
              const author = users_.find((u) => u.id === post.authorId)
              return (
                <div key={post.id} className="p-6 hover:bg-slate-50/50 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0F5132]/20 to-primary/20 flex items-center justify-center font-bold text-[#0F5132] border border-[#0F5132]/30 text-xs">
                      {author?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{author?.name || 'UMKM Mitra'}</p>
                      <p className="text-[10px] text-[#64748b]">Role: {author?.role} • Level {author?.level || 1}</p>
                    </div>
                    <span className="ml-auto text-[10px] text-[#64748b] font-mono">{new Date(post.createdAt).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</span>
                  </div>
                  <h4 className="font-sora text-sm font-bold text-slate-850 mt-3">{post.title}</h4>
                  <p className="text-xs text-[#475569] leading-relaxed mt-2 bg-[#f8f9fa] p-3 rounded-[var(--radius-brand)] border border-[#e2e8f0]">{post.content}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {communityModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 font-sans">
          <div className="bg-white border border-gray-200 rounded-[12px] max-w-2xl w-full p-4 sm:p-5 shadow-2xl animate-in zoom-in-95 duration-200 text-gray-900 flex flex-col max-h-[88vh]">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 shrink-0">
              <h3 className="font-sora text-sm font-extrabold text-primary uppercase tracking-wider">{communityModal.mode === 'add' ? 'Tambah Komunitas Induk Baru' : 'Edit Komunitas Induk'}</h3>
              <button type="button" onClick={() => setCommunityModal({ open: false, mode: 'add' })} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center text-xs transition-colors cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveCommunitySubmit} className="flex flex-col flex-1 overflow-hidden pt-3">
              <div className="overflow-y-auto pr-1.5 space-y-4 flex-1 text-xs">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-gray-100 pb-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    <h4 className="text-[10px] font-extrabold text-primary uppercase tracking-wider">INFORMASI DASAR</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Nama Komunitas <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={commForm.name}
                        onChange={(e) => setCommForm({ ...commForm, name: e.target.value })}
                        placeholder="e.g. Komunitas UMKM Batik Solo"
                        className="w-full bg-white border border-gray-300 rounded-[8px] px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-primary transition-all shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Ketua Komunitas <span className="text-red-500">*</span></label>
                      <select
                        required
                        value={commForm.ketuaId}
                        onChange={(e) => setCommForm({ ...commForm, ketuaId: e.target.value })}
                        className="w-full bg-white border border-gray-300 rounded-[8px] px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-primary transition-all shadow-2xs cursor-pointer"
                      >
                        <option value="">-- Pilih Ketua Komunitas --</option>
                        {users_.map((u) => (
                          <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Tipe Komunitas</label>
                      <select
                        value={commForm.type}
                        onChange={(e) => setCommForm({ ...commForm, type: e.target.value, category: e.target.value ? commForm.category : '' })}
                        className="w-full bg-white border border-gray-300 rounded-[8px] px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-primary transition-all shadow-2xs cursor-pointer"
                      >
                        <option value="">-- Pilih Tipe Komunitas --</option>
                        <option value="PERKUMPULAN">PERKUMPULAN</option>
                        <option value="KOPERASI">KOPERASI</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Kategori</label>
                      <select
                        disabled={!commForm.type}
                        value={commForm.category}
                        onChange={(e) => setCommForm({ ...commForm, category: e.target.value })}
                        className="w-full bg-white border border-gray-300 rounded-[8px] px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-primary transition-all shadow-2xs cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
                      >
                        <option value="">-- Pilih Kategori --</option>
                        <option value="FREE">FREE</option>
                        <option value="PAID">PAID</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Deskripsi Singkat</label>
                    <textarea
                      rows={2}
                      value={commForm.description}
                      onChange={(e) => setCommForm({ ...commForm, description: e.target.value })}
                      placeholder="Tuliskan deskripsi visi dan tujuan komunitas..."
                      className="w-full bg-white border border-gray-300 rounded-[8px] px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-primary transition-all shadow-2xs"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2 border-b border-gray-100 pb-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    <h4 className="text-[10px] font-extrabold text-primary uppercase tracking-wider">TEMPLATE HALAMAN</h4>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Pilih Template Halaman</label>
                    <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)} className="w-full bg-white border border-gray-300 rounded-[8px] px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-primary transition-all shadow-2xs font-semibold cursor-pointer">
                      <option value="Community">▼ Community</option>
                      <option value="Business">▼ Business</option>
                      <option value="Education">▼ Education</option>
                      <option value="Culinary">▼ Culinary</option>
                      <option value="Koperasi">▼ Koperasi</option>
                    </select>
                  </div>

                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-[10px] shadow-2xs space-y-2">
                    <div className="flex justify-between items-center border-b border-gray-200/60 pb-1.5">
                      <span className="text-[9px] font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                        <Sliders className="w-3 h-3 text-primary" /> Preview Layout ({selectedTemplate})
                      </span>
                      <span className="px-2 py-0.5 bg-[#E8F5E9] border border-primary/30 text-primary font-extrabold text-[8px] rounded uppercase">Card Layout Kecil</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
                      {[
                        { title: 'Hero Banner', bg: 'bg-primary text-white', icon: Sparkles },
                        { title: 'Aktivitas Terbaru', bg: 'bg-white border border-gray-200 text-gray-800', icon: Activity },
                        { title: 'Diskusi', bg: 'bg-white border border-gray-200 text-gray-800', icon: MessageSquare },
                        { title: 'Event', bg: 'bg-white border border-gray-200 text-gray-800', icon: Calendar },
                        { title: 'Produk Anggota', bg: 'bg-white border border-gray-200 text-gray-800', icon: ShoppingBag },
                        { title: 'Galeri', bg: 'bg-white border border-gray-200 text-gray-800', icon: ImageIcon },
                        { title: 'Anggota', bg: 'bg-white border border-gray-200 text-gray-800', icon: UsersIcon }
                      ].map((m, idx) => {
                        const IconComp = m.icon
                        return (
                          <div key={idx} className={`p-1.5 rounded-[6px] flex items-center gap-1.5 text-[10px] font-bold ${m.bg}`}>
                            <IconComp className="w-3 h-3 shrink-0" />
                            <span className="truncate">{m.title}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50/50 border border-primary/20 rounded-[10px] flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <span className="block text-[10px] font-extrabold text-gray-900 uppercase tracking-wider">Modul Bawaan</span>
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] text-gray-700 font-semibold">
                        <span className="flex items-center gap-0.5 text-primary">✓ Hero Banner</span>
                        <span className="flex items-center gap-0.5 text-primary">✓ Aktivitas</span>
                        <span className="flex items-center gap-0.5 text-primary">✓ Diskusi</span>
                        <span className="flex items-center gap-0.5 text-primary">✓ Event</span>
                        <span className="flex items-center gap-0.5 text-primary">✓ Produk Anggota</span>
                        <span className="flex items-center gap-0.5 text-primary">✓ Galeri</span>
                        <span className="flex items-center gap-0.5 text-primary">✓ Anggota</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModuleSettingsOpen(true)}
                      className="px-3 py-1.5 bg-white border border-primary text-primary hover:bg-primary hover:text-white font-extrabold text-[11px] rounded-[8px] transition-all shadow-2xs flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Settings className="w-3 h-3" /> Sesuaikan Modul
                    </button>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2 border-b border-gray-100 pb-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    <h4 className="text-[10px] font-extrabold text-primary uppercase tracking-wider">LEGALITAS KOMUNITAS</h4>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-[9px] font-bold text-gray-600 uppercase mb-1">Akta Notaris</label>
                      <input type="text" value={commForm.aktaNotaris} onChange={(e) => setCommForm({ ...commForm, aktaNotaris: e.target.value })} placeholder="No. Akta Notaris" className="w-full bg-white border border-gray-300 rounded-[8px] px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-primary transition-all shadow-2xs" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-600 uppercase mb-1">Nomor AHU</label>
                      <input type="text" value={commForm.nomorAhu} onChange={(e) => setCommForm({ ...commForm, nomorAhu: e.target.value })} placeholder="AHU-xxxxx" className="w-full bg-white border border-gray-300 rounded-[8px] px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-primary transition-all shadow-2xs" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-600 uppercase mb-1">NPWP</label>
                      <input type="text" value={commForm.nomorNpwp} onChange={(e) => setCommForm({ ...commForm, nomorNpwp: e.target.value })} placeholder="xx.xxx.xxx.x-xxx.xxx" className="w-full bg-white border border-gray-300 rounded-[8px] px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-primary transition-all shadow-2xs" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-600 uppercase mb-1">Domisili</label>
                      <input type="text" value={commForm.domisili} onChange={(e) => setCommForm({ ...commForm, domisili: e.target.value })} placeholder="Kota / Kabupaten" className="w-full bg-white border border-gray-300 rounded-[8px] px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-primary transition-all shadow-2xs" />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-[#0F5132]">
                      <input type="checkbox" checked={commForm.isKycRequired} onChange={(e) => setCommForm({ ...commForm, isKycRequired: e.target.checked })} className="w-4 h-4 rounded accent-[#0F5132] cursor-pointer" />
                      <span>Wajibkan Verifikasi KYC (KTP/Selfie)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-gray-800">
                      <input type="checkbox" checked={commForm.isVerified} onChange={(e) => setCommForm({ ...commForm, isVerified: e.target.checked })} className="w-4 h-4 rounded accent-primary cursor-pointer" />
                      <span>Verified Komunitas</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-red-700">
                      <input type="checkbox" checked={commForm.isSuspended} onChange={(e) => setCommForm({ ...commForm, isSuspended: e.target.checked })} className="w-4 h-4 rounded accent-red-600 cursor-pointer" />
                      <span>Suspend Komunitas</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3 shrink-0">
                <button type="button" onClick={() => setCommunityModal({ open: false, mode: 'add' })} className="px-5 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 font-extrabold text-xs rounded-[8px] transition-all cursor-pointer shadow-2xs">Batal</button>
                <button type="submit" disabled={isPending} className="px-5 py-2 bg-primary hover:bg-[#15803D] text-white font-extrabold text-xs rounded-[8px] transition-all cursor-pointer shadow-sm disabled:opacity-50">
                  {isPending ? 'Menyimpan...' : 'Simpan Komunitas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {moduleSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 font-sans">
          <div className="bg-white border border-gray-200 rounded-[12px] max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 text-gray-900">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-sora text-sm font-extrabold text-primary uppercase tracking-wider flex items-center gap-2">
                <Settings className="w-4 h-4" /> Pengaturan Modul Halaman
              </h3>
              <button onClick={() => setModuleSettingsOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <p className="text-xs text-gray-600 font-medium leading-relaxed">
              Pilih modul bawaan yang diizinkan aktif pada template <strong className="text-primary font-bold">{selectedTemplate}</strong>.
            </p>

            <div className="space-y-2.5 pt-1">
              {[
                { key: 'heroBanner', label: 'Hero Banner Dashboard' },
                { key: 'aktivitas', label: 'Feed Aktivitas Terbaru' },
                { key: 'diskusi', label: 'Forum Diskusi Anggota' },
                { key: 'event', label: 'Kalender & Event Komunitas' },
                { key: 'produkAnggota', label: 'Katalog Produk Anggota' },
                { key: 'galeri', label: 'Galeri Foto & Dokumen' },
                { key: 'anggota', label: 'Direktori Anggota Aktif' }
              ].map((item) => (
                <label key={item.key} className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200/80 rounded-[8px] cursor-pointer hover:bg-gray-100 transition-colors">
                  <span className="text-xs font-bold text-gray-800">{item.label}</span>
                  <input type="checkbox" checked={!!modulesConfig[item.key]} onChange={(e) => setModulesConfig({ ...modulesConfig, [item.key]: e.target.checked })} className="w-4 h-4 rounded accent-primary cursor-pointer" />
                </label>
              ))}
            </div>

            <div className="pt-3 flex gap-3 border-t border-gray-100">
              <button type="button" onClick={() => setModuleSettingsOpen(false)} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-[12px] transition-all cursor-pointer">Batal</button>
              <button
                type="button"
                onClick={() => { setModuleSettingsOpen(false); alert('Konfigurasi modul berhasil disimpan!') }}
                className="flex-1 py-2 bg-primary hover:bg-[#15803D] text-white font-bold text-xs rounded-[12px] transition-all cursor-pointer shadow-2xs"
              >
                Simpan Modul
              </button>
            </div>
          </div>
        </div>
      )}

      {memberModal.open && memberModal.community && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in zoom-in-95 duration-200">
          <div className="bg-white border border-[#0F5132]/25 rounded-[var(--radius-brand)] max-w-xl w-full p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-sora text-sm font-bold text-[#0F5132] uppercase tracking-wider">Anggota Komunitas: {memberModal.community.name}</h3>
                <p className="text-[10px] text-slate-400">Total {invoices.filter((inv) => inv.communityId === memberModal.community.id).length} Anggota terdaftar</p>
              </div>
              <button onClick={() => setMemberModal({ open: false })} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="bg-emerald-50/50 p-4 border border-[#0F5132]/20 rounded space-y-2">
              <label className="block text-[10px] font-bold text-[#0F5132] uppercase tracking-wider">Daftarkan Anggota / Reassign ke Komunitas ini</label>
              <div className="flex gap-2">
                <select value={selectedMemberUserId} onChange={(e) => setSelectedMemberUserId(e.target.value)} className="flex-grow bg-white border border-[#cbd5e1] rounded px-3 py-2 text-xs text-slate-800">
                  <option value="">-- Pilih User / Merchant --</option>
                  {(() => {
                    const existingMemberIds = new Set(invoices.filter((inv) => inv.communityId === memberModal.community.id).map((inv) => inv.userId))
                    return users_
                      .filter((u) => !existingMemberIds.has(u.id) && u.role !== 'ADMIN')
                      .map((u) => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role} - {u.email})</option>
                      ))
                  })()}
                </select>
                <button
                  onClick={() => handleAddMemberToCommunity(memberModal.community.id, selectedMemberUserId)}
                  disabled={!selectedMemberUserId || isPending}
                  className="px-4 py-2 bg-[#0F5132] text-white font-bold text-xs rounded uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                >
                  Tambahkan
                </button>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded">
              {(() => {
                const communityInvoices = invoices.filter((inv) => inv.communityId === memberModal.community.id)
                if (communityInvoices.length === 0) {
                  return <p className="p-4 text-center text-xs text-slate-400 italic">Belum ada anggota terdaftar di komunitas ini.</p>
                }
                return communityInvoices.map((inv) => {
                  const mem = inv.user
                  if (!mem) return null
                  return (
                    <div key={inv.id} className="p-3 flex justify-between items-center hover:bg-slate-50">
                      <div>
                        <p className="text-xs font-bold text-slate-800">{mem.name}</p>
                        <p className="text-[10px] text-slate-400">{mem.email} • Role: {mem.role}</p>
                      </div>
                      <button
                        onClick={() => setKickConfirmModal({ open: true, userId: mem.id, userName: mem.name ?? mem.email, communityId: memberModal.community?.id ?? '' })}
                        className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded text-[9px] font-bold uppercase tracking-wider cursor-pointer"
                      >
                        Keluarkan
                      </button>
                    </div>
                  )
                })
              })()}
            </div>
          </div>
        </div>
      )}

      {kickConfirmModal?.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>

              <div>
                <h3 className="font-sora text-base font-bold text-slate-800">Keluarkan anggota?</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Anda akan mengeluarkan anggota <span className="font-semibold text-slate-700">{kickConfirmModal.userName}</span> dari komunitas ini.
                </p>
                <p className="text-xs text-slate-400 mt-2">Tindakan ini tidak dapat dibatalkan. Anggota dapat bergabung kembali jika diperlukan.</p>
              </div>

              <div className="flex gap-3 w-full mt-2">
                <button onClick={() => setKickConfirmModal(null)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl uppercase tracking-wider transition-colors cursor-pointer">Batal</button>
                <button onClick={handleKickMember} disabled={isPending} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50">
                  {isPending ? 'Memproses...' : 'Keluarkan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
