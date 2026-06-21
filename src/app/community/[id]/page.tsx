'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  getIndukCommunityDetail, 
  joinIndukCommunity, 
  getIndukCommunityMembersAction,
  submitCooperativeLoanAction,
  getCooperativeLoansAction,
  approveCooperativeLoanAction,
  rejectCooperativeLoanAction,
  updateIndukCommunity
} from '@/app/actions/community'
import { getCurrentUser } from '@/app/actions/auth'
import { getProducts } from '@/app/actions/products'
import { goeyToast } from 'goey-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, 
  Users, 
  MessageSquare, 
  MapPin, 
  DollarSign, 
  TrendingUp, 
  Info, 
  CheckCircle2, 
  ExternalLink,
  PlusCircle,
  Clock,
  Check,
  X,
  FileText,
  Upload,
  Loader2
} from 'lucide-react'

export default function CommunityDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [user, setUser] = useState<any>(null)
  const [community, setCommunity] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [isMember, setIsMember] = useState(false)
  const [isIndukMember, setIsIndukMember] = useState(false)
  const [membershipDetails, setMembershipDetails] = useState<any>(null)
  
  // Keuangan Koperasi / Loan States
  const [loans, setLoans] = useState<any[]>([])
  const [loanModalOpen, setLoanModalOpen] = useState(false)
  const [loanAmount, setLoanAmount] = useState('')
  const [loanPurpose, setLoanPurpose] = useState('')
  const [loanError, setLoanError] = useState<string | null>(null)

  // Payment states for Koperasi
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'QRIS' | 'BANK'>('QRIS')
  const [isVerifying, setIsVerifying] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  const [loading, setLoading] = useState(true)
  const [actionPending, startTransition] = useTransition()

  // Edit Community Landing Page / Builder States
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editAkta, setEditAkta] = useState('')
  const [editAhu, setEditAhu] = useState('')
  const [editNpwp, setEditNpwp] = useState('')
  const [editDomisili, setEditDomisili] = useState('')
  const [editKontakPj, setEditKontakPj] = useState('')
  const [editWaGroupLink, setEditWaGroupLink] = useState('')
  const [editAvatarUrl, setEditAvatarUrl] = useState('')
  const [editCoverUrl, setEditCoverUrl] = useState('')
  const [editJoinFee, setEditJoinFee] = useState('')
  const [editMonthlyFee, setEditMonthlyFee] = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const [editSuccess, setEditSuccess] = useState<string | null>(null)

  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)

  const handleFileUpload = async (file: File, type: 'avatar' | 'cover') => {
    const setUploading = type === 'avatar' ? setUploadingAvatar : setUploadingCover
    const setUrl = type === 'avatar' ? setEditAvatarUrl : setEditCoverUrl

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'community')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Gagal mengunggah file.')
      }

      const data = await res.json()
      setUrl(data.url)
      goeyToast.success(`Foto ${type === 'avatar' ? 'Logo' : 'Sampul'} berhasil diunggah!`)
    } catch (e: any) {
      console.error(e)
      goeyToast.error(e.message || 'Terjadi kesalahan saat mengunggah file.')
    } finally {
      setUploading(false)
    }
  }

  async function loadData() {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)

      const commDetail = await getIndukCommunityDetail(id)
      if (!commDetail) {
        setCommunity(null)
        setLoading(false)
        return
      }
      setCommunity(commDetail)
      setEditName(commDetail.name || '')
      setEditDescription(commDetail.description || '')
      setEditAkta(commDetail.aktaNotaris || '')
      setEditAhu(commDetail.nomorAhu || '')
      setEditNpwp(commDetail.nomorNpwp || '')
      setEditDomisili(commDetail.domisili || '')
      setEditKontakPj(commDetail.kontakPj || '')
      setEditWaGroupLink(commDetail.waGroupLink || '')
      setEditAvatarUrl(commDetail.avatarUrl || '')
      setEditCoverUrl(commDetail.coverUrl || '')
      setEditJoinFee(commDetail.joinFee ? String(commDetail.joinFee) : '')
      setEditMonthlyFee(commDetail.monthlyFee ? String(commDetail.monthlyFee) : '')

      // Get members
      const memberList = await getIndukCommunityMembersAction(id)
      setMembers(memberList || [])

      // Check if logged in user is a member
      if (currentUser) {
        const mem = memberList.find((m: any) => m.userId === currentUser.id)
        if (mem) {
          setIsMember(true)
          setIsIndukMember(mem.isInduk)
          setMembershipDetails(mem)
        }
      }

      // Fetch products from members of this community
      const memberIds = memberList.map((m: any) => m.userId)
      const allProducts = await getProducts()
      const communityProducts = allProducts.filter(p => memberIds.includes(p.merchantId))
      setProducts(communityProducts)

      // Fetch cooperative loans
      if (currentUser && commDetail.type === 'KOPERASI') {
        const loanList = await getCooperativeLoansAction(id)
        setLoans(loanList || [])
      }

    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  const handleJoin = async () => {
    if (!user) {
      router.push('/auth?tab=register')
      return
    }

    if (community.type === 'KOPERASI' && !isMember) {
      // Open payment modal
      setPaymentModalOpen(true)
      return
    }

    // Free Perkumpulan join
    startTransition(async () => {
      const res = await joinIndukCommunity(id, true) // join as induk
      if (res.error) {
        goeyToast.error(res.error)
      } else {
        goeyToast.success('Berhasil bergabung ke Komunitas Induk Perkumpulan!')
        loadData()
      }
    })
  }

  const handleConfirmPayment = () => {
    setIsVerifying(true)
    setTimeout(async () => {
      try {
        const res = await joinIndukCommunity(id, true) // Join as induk
        if (res.error) {
          goeyToast.error(res.error)
          setIsVerifying(false)
        } else {
          setPaymentSuccess(true)
          setIsVerifying(false)
          setTimeout(() => {
            setPaymentModalOpen(false)
            setPaymentSuccess(false)
            loadData()
          }, 2000)
        }
      } catch (e) {
        console.error(e)
        setIsVerifying(false)
      }
    }, 2000)
  }

  const handleLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoanError(null)

    if (!loanAmount || !loanPurpose) {
      setLoanError('Semua kolom wajib diisi.')
      return
    }

    const formData = new FormData()
    formData.append('communityId', id)
    formData.append('amount', loanAmount)
    formData.append('purpose', loanPurpose)

    const res = await submitCooperativeLoanAction(formData)
    if (res.error) {
      setLoanError(res.error)
    } else {
      goeyToast.success('Pengajuan pinjaman modal berhasil dikirim!')
      setLoanAmount('')
      setLoanPurpose('')
      setLoanModalOpen(false)
      loadData()
    }
  }

  const handleApproveLoan = async (loanId: string, role: 'KETUA' | 'ADMIN') => {
    if (confirm('Apakah Anda yakin ingin menyetujui pengajuan pinjaman modal ini?')) {
      const res = await approveCooperativeLoanAction(loanId, role)
      if (res.error) {
        goeyToast.error(res.error)
      } else {
        goeyToast.success('Pinjaman modal berhasil disetujui!')
        loadData()
      }
    }
  }

  const handleRejectLoan = async (loanId: string, role: 'KETUA' | 'ADMIN') => {
    if (confirm('Apakah Anda yakin ingin menolak pengajuan pinjaman modal ini?')) {
      const res = await rejectCooperativeLoanAction(loanId, role)
      if (res.error) {
        goeyToast.error(res.error)
      } else {
        goeyToast.success('Pinjaman modal berhasil ditolak.')
        loadData()
      }
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditError(null)
    setEditSuccess(null)

    if (!editName || !editDescription) {
      setEditError('Nama dan deskripsi komunitas wajib diisi.')
      return
    }

    const formData = new FormData()
    formData.append('name', editName)
    formData.append('description', editDescription)
    formData.append('aktaNotaris', editAkta)
    formData.append('nomorAhu', editAhu)
    formData.append('nomorNpwp', editNpwp)
    formData.append('domisili', editDomisili)
    formData.append('kontakPj', editKontakPj)
    formData.append('waGroupLink', editWaGroupLink)
    formData.append('avatarUrl', editAvatarUrl)
    formData.append('coverUrl', editCoverUrl)
    formData.append('joinFee', editJoinFee)
    formData.append('monthlyFee', editMonthlyFee)

    startTransition(async () => {
      const res = await updateIndukCommunity(id, formData)
      if (res.error) {
        setEditError(res.error)
      } else {
        setEditSuccess('Landing page komunitas berhasil diperbarui!')
        setTimeout(() => {
          setEditModalOpen(false)
          setEditSuccess(null)
          loadData()
        }, 1500)
      }
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7F9] text-[#111111] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-[#F5F7F9] text-[#111111] flex flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-bold font-sora">Komunitas Tidak Ditemukan</h2>
        <Link href="/community" className="text-xs text-primary hover:underline">Kembali ke direktori</Link>
      </div>
    )
  }

  const isKetua = user && community.ketuaId === user.id
  const isAdmin = user && user.role === 'ADMIN'

  return (
    <div className="min-h-screen bg-[#F5F7F9] text-[#111111] pb-24 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1400px] h-[550px] bg-[radial-gradient(circle_at_center,rgba(45,178,74,0.03)_0%,transparent_80%)] pointer-events-none z-0" />

      {/* Cover Banner */}
      <div className="relative h-60 md:h-80 w-full bg-gradient-to-r from-neutral-200 via-neutral-100 to-green-500/10 overflow-hidden border-b border-black/5">
        {community.coverUrl ? (
          <img src={community.coverUrl} alt={community.name} className="object-cover w-full h-full" />
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(rgba(45,178,74,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(45,178,74,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#F5F7F9] via-transparent to-transparent" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 -mt-24 space-y-8">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white/80 backdrop-blur-xl border border-black/5 p-6 rounded-3xl shadow-2xl">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 w-full">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-2xl bg-white border border-primary/20 flex items-center justify-center text-3xl font-extrabold text-primary shadow-lg overflow-hidden shrink-0">
              {community.avatarUrl ? (
                <img src={community.avatarUrl} alt="" className="object-cover w-full h-full" />
              ) : (
                community.name.substring(0, 2).toUpperCase()
              )}
            </div>
            
            <div className="space-y-2 text-center md:text-left flex-grow">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <h1 className="font-sora text-2xl md:text-3xl font-extrabold tracking-tight text-[#111111]">{community.name}</h1>
                <span className={`px-2 py-0.5 rounded text-[8px] font-geist font-black border uppercase tracking-wider ${
                  community.type === 'KOPERASI' ? 'bg-amber-500/10 border-amber-500/35 text-amber-600' : 'bg-cyan-500/10 border-cyan-500/35 text-cyan-600'
                }`}>
                  {community.type}
                </span>
              </div>

              <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-xs text-text-secondary font-medium">
                <span className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-primary" />
                  Ketua: {community.ketua?.name || 'Ketua Komunitas'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {members.length} Anggota
                </span>
                <span>•</span>
                <span>Dibentuk {new Date(community.createdAt).toLocaleDateString('id-ID')}</span>
              </div>
            </div>
          </div>

          <div className="w-full md:w-auto flex flex-col gap-2">
            {isKetua && (
              <button
                onClick={() => setEditModalOpen(true)}
                className="w-full md:w-auto px-6 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-black font-geist font-bold text-xs uppercase tracking-wider rounded-xl text-center flex items-center justify-center gap-1.5 shadow-lg shadow-yellow-500/15"
              >
                <PlusCircle className="w-4 h-4" />
                Edit Landing Page
              </button>
            )}
            {isMember ? (
              <>
                <button
                  disabled
                  className="w-full md:w-auto px-6 py-2.5 bg-primary/10 border border-primary/20 text-primary font-geist font-bold text-xs uppercase tracking-wider rounded-xl text-center"
                >
                  ✓ Anggota Induk
                </button>
                {community.waGroupLink && (
                  <a
                    href={community.waGroupLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full md:w-auto px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-geist font-bold text-xs uppercase tracking-wider rounded-xl text-center flex items-center justify-center gap-2 shadow-lg shadow-green-600/15"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Diskusi Grup WA
                  </a>
                )}
              </>
            ) : (
              <button
                onClick={handleJoin}
                disabled={actionPending}
                className="w-full md:w-auto px-8 py-3 bg-primary hover:bg-primary/95 text-white font-geist font-bold text-xs uppercase tracking-wider rounded-xl text-center shadow-lg shadow-primary/15"
              >
                {actionPending ? 'Memproses...' : community.type === 'KOPERASI' ? `Gabung Koperasi (Rp ${community.joinFee.toLocaleString('id-ID')})` : 'Gabung Komunitas (Gratis)'}
              </button>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Block: Legal & Details */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-black/5 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 border-b border-black/5 pb-3">
                <Info className="w-4 h-4 text-primary" />
                <h3 className="font-sora text-xs font-bold uppercase tracking-wider text-[#111111]">Legalitas & Detail</h3>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="block text-text-secondary text-[10px] uppercase font-semibold">Tipe Komunitas</span>
                  <span className="text-[#111111] font-bold">{community.type === 'KOPERASI' ? 'Koperasi Produksi (Berbayar)' : 'Perkumpulan Bisnis (Gratis)'}</span>
                </div>
                {community.type === 'KOPERASI' && (
                  <>
                    <div>
                      <span className="block text-text-secondary text-[10px] uppercase font-semibold">Simpanan Pokok / Masuk</span>
                      <span className="text-primary font-black">Rp {community.joinFee.toLocaleString('id-ID')}</span>
                    </div>
                    <div>
                      <span className="block text-text-secondary text-[10px] uppercase font-semibold">Iuran Wajib Bulanan</span>
                      <span className="text-primary font-black">Rp {community.monthlyFee.toLocaleString('id-ID')} / bulan</span>
                    </div>
                  </>
                )}
                {community.aktaNotaris && (
                  <div>
                    <span className="block text-text-secondary text-[10px] uppercase font-semibold">Akta Notaris</span>
                    <span className="text-[#111111] font-mono font-medium">{community.aktaNotaris}</span>
                  </div>
                )}
                {community.nomorAhu && (
                  <div>
                    <span className="block text-text-secondary text-[10px] uppercase font-semibold">Nomor AHU</span>
                    <span className="text-[#111111] font-mono font-medium">{community.nomorAhu}</span>
                  </div>
                )}
                {community.nomorNpwp && (
                  <div>
                    <span className="block text-text-secondary text-[10px] uppercase font-semibold">NPWP Organisasi</span>
                    <span className="text-[#111111] font-mono font-medium">{community.nomorNpwp}</span>
                  </div>
                )}
                {community.domisili && (
                  <div>
                    <span className="block text-text-secondary text-[10px] uppercase font-semibold">Domisili Kantor</span>
                    <span className="text-[#111111] font-medium">{community.domisili}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white border border-black/5 rounded-3xl p-6 shadow-xl space-y-3">
              <h3 className="font-sora text-xs font-bold uppercase tracking-wider text-amber-600">Tentang Kami</h3>
              <p className="text-xs text-text-secondary leading-relaxed">{community.description}</p>
            </div>
          </div>

          {/* Right Block: Content area */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Koperasi Financial System / Loan requests section */}
            {community.type === 'KOPERASI' && isMember && (
              <div className="bg-white border border-black/5 rounded-3xl p-6 shadow-xl space-y-6">
                <div className="flex justify-between items-center border-b border-black/5 pb-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-primary" />
                    <h3 className="font-sora text-sm font-bold text-[#111111] uppercase tracking-wider">Permodalan Koperasi</h3>
                  </div>
                  {!isKetua && (
                    <button
                      onClick={() => setLoanModalOpen(true)}
                      className="px-4 py-2 bg-primary text-white font-geist font-bold text-[10px] uppercase tracking-wider rounded-lg flex items-center gap-1.5 shadow"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      Ajukan Modal
                    </button>
                  )}
                </div>

                {/* Loan Request list */}
                {loans.length === 0 ? (
                  <div className="text-center py-8 text-xs text-text-secondary bg-[#F5F7F9] rounded-2xl border border-black/5">
                    Belum ada pengajuan pinjaman modal produksi terdaftar.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {loans.map((loan) => {
                      const isBorrower = user && loan.merchantId === user.id
                      return (
                        <div key={loan.id} className="p-4 bg-[#F5F7F9] border border-black/5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[#111111]">Pinjaman Modal Rp {loan.amount.toLocaleString('id-ID')}</span>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-geist font-bold border uppercase ${
                                loan.status === 'PENDING' ? 'bg-amber-500/10 border-amber-500/35 text-amber-600' :
                                loan.status === 'APPROVED_KETUA' ? 'bg-blue-500/10 border-blue-500/35 text-blue-600' :
                                loan.status === 'APPROVED_ADMIN' ? 'bg-green-500/10 border-green-500/35 text-green-600' :
                                'bg-red-500/10 border-red-500/35 text-red-600'
                              }`}>
                                {loan.status.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-[11px] text-text-secondary">Tujuan: {loan.purpose}</p>
                            <p className="text-[9px] text-text-secondary/75">
                              Diajukan oleh Merchant ID: {loan.merchantId} • {new Date(loan.createdAt).toLocaleDateString('id-ID')}
                            </p>
                          </div>

                          {/* Approval Actions */}
                          <div className="flex gap-2">
                            {/* Ketua approval action */}
                            {isKetua && loan.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleApproveLoan(loan.id, 'KETUA')}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[9px] uppercase tracking-wider rounded transition-colors"
                                >
                                  Setujui (Ketua)
                                </button>
                                <button
                                  onClick={() => handleRejectLoan(loan.id, 'KETUA')}
                                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-[9px] uppercase tracking-wider rounded transition-colors"
                                >
                                  Tolak
                                </button>
                              </>
                            )}

                            {/* Admin approval action */}
                            {isAdmin && loan.status === 'APPROVED_KETUA' && (
                              <>
                                <button
                                  onClick={() => handleApproveLoan(loan.id, 'ADMIN')}
                                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-bold text-[9px] uppercase tracking-wider rounded transition-colors"
                                >
                                  Final Approve (Admin)
                                </button>
                                <button
                                  onClick={() => handleRejectLoan(loan.id, 'ADMIN')}
                                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-[9px] uppercase tracking-wider rounded transition-colors"
                                >
                                  Tolak
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Merchant Member Directory */}
            <div className="bg-white border border-black/5 rounded-3xl p-6 shadow-xl space-y-6">
              <div className="flex items-center gap-3 border-b border-black/5 pb-4">
                <Users className="w-5 h-5 text-primary" />
                <h3 className="font-sora text-sm font-bold text-[#111111] uppercase tracking-wider">Direktori Merchant Anggota</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {members.map((mem) => {
                  if (!mem.user) return null
                  return (
                    <Link
                      href={`/profile/${mem.user.id}`}
                      key={mem.id}
                      className="p-4 bg-[#F5F7F9] border border-black/5 rounded-2xl hover:border-primary/20 transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-primary/10 flex items-center justify-center font-bold text-xs text-primary">
                          {mem.user.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="block text-xs font-bold text-[#111111] group-hover:text-primary transition-colors">{mem.user.name}</span>
                          <span className="block text-[9px] font-mono text-text-secondary uppercase">{mem.user.role} • LV {mem.user.level}</span>
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-text-secondary/50 group-hover:text-primary transition-colors" />
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Community Products Grid */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h3 className="font-sora text-sm font-bold text-[#111111] uppercase tracking-wider">Produk Unggulan Anggota</h3>
              </div>

              {products.length === 0 ? (
                <div className="text-center py-12 border border-black/5 bg-white rounded-3xl text-xs text-text-secondary">
                  Belum ada katalog produk terdaftar dari merchant anggota komunitas ini.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {products.map((p) => (
                    <Link
                      key={p.id}
                      href={`/market/product/${p.id}`}
                      className="border border-black/5 bg-white rounded-2xl overflow-hidden hover:border-primary/25 transition-all flex flex-col justify-between group"
                    >
                      <div className="relative aspect-square bg-neutral-100 w-full overflow-hidden">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt="" className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-text-secondary uppercase tracking-widest font-bold">No Image</div>
                        )}
                      </div>
                      <div className="p-4 space-y-1">
                        <span className="block text-[11px] font-bold text-[#111111] line-clamp-1 group-hover:text-primary transition-colors">{p.title}</span>
                        <span className="block text-xs font-black text-primary font-geist">Rp {p.price.toLocaleString('id-ID')}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* ── LOAN MODAL ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {loanModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md border border-black/5 bg-white p-6 rounded-3xl shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center border-b border-black/5 pb-3">
                <h3 className="font-sora text-sm font-bold text-[#111111] uppercase tracking-wider">
                  Pengajuan Modal Koperasi
                </h3>
                <button onClick={() => setLoanModalOpen(false)} className="text-text-secondary hover:text-[#111111] text-sm font-bold">✕</button>
              </div>

              {loanError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-500 font-semibold">{loanError}</div>
              )}

              <form onSubmit={handleLoanSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Jumlah Modal / Pinjaman (Rp)</label>
                  <input
                    type="number"
                    required
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    placeholder="e.g. 5000000"
                    className="w-full h-10 px-3 bg-[#F5F7F9] border border-black/10 rounded-xl text-xs text-[#111111] focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Tujuan Penggunaan Modal</label>
                  <textarea
                    required
                    value={loanPurpose}
                    onChange={(e) => setLoanPurpose(e.target.value)}
                    placeholder="e.g. Pembelian bahan baku terigu premium dan mesin oven baru untuk kapasitas produksi Sourdough."
                    rows={4}
                    className="w-full px-3 py-2 bg-[#F5F7F9] border border-black/10 rounded-xl text-xs text-[#111111] focus:outline-none focus:border-primary/50 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-primary text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg"
                >
                  Kirim Pengajuan Modal
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── PAYMENT MODAL (Simulated Midtrans/Saloka Account) ───────────────── */}
      <AnimatePresence>
        {paymentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md border border-black/5 bg-white p-6 rounded-3xl shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center border-b border-black/5 pb-3">
                <h3 className="font-sora text-sm font-bold text-[#111111] uppercase tracking-wider">Pembayaran Simpanan Pokok Koperasi</h3>
                <button onClick={() => setPaymentModalOpen(false)} className="text-text-secondary hover:text-[#111111] text-sm font-bold">✕</button>
              </div>

              {paymentSuccess ? (
                <div className="p-6 text-center space-y-2">
                  <div className="w-12 h-12 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center text-green-600 mx-auto text-xl">✓</div>
                  <h4 className="font-bold text-[#111111] text-sm">Pembayaran Sukses!</h4>
                  <p className="text-xs text-text-secondary">Anda resmi bergabung ke koperasi.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-[#F5F7F9] rounded-2xl border border-black/5">
                    <span className="text-xs font-bold text-[#111111]">Biaya Pendaftaran / Simpanan Pokok</span>
                    <span className="text-sm font-extrabold text-primary">Rp {community.joinFee.toLocaleString('id-ID')}</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setPaymentMethod('QRIS')}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                        paymentMethod === 'QRIS'
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-[#F5F7F9] border-black/10 text-text-secondary hover:text-[#111111]'
                      }`}
                    >
                      QRIS
                    </button>
                    <button
                      onClick={() => setPaymentMethod('BANK')}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                        paymentMethod === 'BANK'
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-[#F5F7F9] border-black/10 text-text-secondary hover:text-[#111111]'
                      }`}
                    >
                      Transfer Saloka
                    </button>
                  </div>

                  {paymentMethod === 'QRIS' ? (
                    <div className="flex flex-col items-center py-6 bg-white rounded-2xl border border-black/5">
                      <svg width="120" height="120" viewBox="0 0 24 24" fill="none" className="text-black">
                        <rect width="24" height="24" fill="white" />
                        <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm1 1h2v2H5V5zm9-3h8v8h-8V2zm2 2v4h4V4h-4zm1 1h2v2h-2V5zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm1 1h2v2H5v-2zm12-3h2v2h-2v-2zm2 2h2v2h-2v-2zm-2 2h2v2h-2v-2zm-2-2h2v2h-2v-2zm0 4h2v2h-2v-2zm4 0h2v2h-2v-2zm-8-4h2v2H9v-2zm2 2h2v2h-2v-2zm2-2h2v2h-2v-2z" fill="currentColor" />
                        <rect x="9.5" y="9.5" width="5" height="5" fill="#2DB24A" />
                      </svg>
                      <span className="text-[8px] text-neutral-500 font-bold uppercase tracking-wider mt-2">Saloka Auto-Verify QRIS</span>
                    </div>
                  ) : (
                    <div className="p-4 bg-[#F5F7F9] border border-black/5 rounded-2xl space-y-1 text-center">
                      <span className="text-[10px] text-text-secondary block font-bold">Kirim ke Rekening Bersama Saloka:</span>
                      <span className="text-sm font-black text-[#111111] block font-mono">BCA: 712-094-1182</span>
                      <span className="text-[9px] text-text-secondary block">a/n PT Saloka Digital Indonesia</span>
                    </div>
                  )}

                  <button
                    onClick={handleConfirmPayment}
                    disabled={isVerifying}
                    className="w-full py-3 bg-primary hover:bg-primary/95 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    {isVerifying ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                        Memverifikasi Pembayaran...
                      </>
                    ) : (
                      'Konfirmasi Pembayaran Selesai'
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── EDIT LANDING PAGE MODAL ────────────────────────────────────────── */}
      <AnimatePresence>
        {editModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl border border-black/5 bg-white p-6 rounded-3xl shadow-2xl space-y-4 my-8"
            >
              <div className="flex justify-between items-center border-b border-black/5 pb-3">
                <h3 className="font-sora text-sm font-bold text-[#111111] uppercase tracking-wider">
                  Edit Landing Page & Profil Komunitas
                </h3>
                <button onClick={() => setEditModalOpen(false)} className="text-text-secondary hover:text-[#111111] text-sm font-bold">✕</button>
              </div>

              {editError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-500 font-semibold">{editError}</div>
              )}
              {editSuccess && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-xs text-green-500 font-semibold">{editSuccess}</div>
              )}

              <form onSubmit={handleEditSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Nama Komunitas</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full h-10 px-3 bg-[#F5F7F9] border border-black/10 rounded-xl text-xs text-[#111111] focus:outline-none focus:border-primary/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Link Grup WhatsApp</label>
                    <input
                      type="url"
                      value={editWaGroupLink}
                      onChange={(e) => setEditWaGroupLink(e.target.value)}
                      placeholder="https://chat.whatsapp.com/..."
                      className="w-full h-10 px-3 bg-[#F5F7F9] border border-black/10 rounded-xl text-xs text-[#111111] focus:outline-none focus:border-primary/50"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Deskripsi / Tentang Kami</label>
                  <textarea
                    required
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-[#F5F7F9] border border-black/10 rounded-xl text-xs text-[#111111] focus:outline-none focus:border-primary/50 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Logo Komunitas / Avatar</label>
                    {editAvatarUrl ? (
                      <div className="relative border border-black/10 rounded-xl overflow-hidden bg-[#F5F7F9] p-1.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img src={editAvatarUrl} alt="Logo Preview" className="w-10 h-10 object-cover rounded-lg" />
                          <span className="text-[10px] font-medium text-[#111111] truncate max-w-[120px]">Logo Terpilih</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditAvatarUrl('')}
                          className="p-1 bg-black/5 hover:bg-black/10 text-neutral-600 rounded-full transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="border border-dashed border-black/15 hover:border-primary/45 rounded-xl h-14 flex items-center justify-center cursor-pointer bg-[#F5F7F9]/50 hover:bg-[#F5F7F9] transition-all p-3 group">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingAvatar}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileUpload(file, 'avatar')
                          }}
                        />
                        {uploadingAvatar ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            <span className="text-[10px] text-text-secondary font-medium">Mengunggah...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Upload className="w-4 h-4 text-text-secondary group-hover:text-primary transition-colors" />
                            <span className="text-[10px] font-bold text-text-primary">Pilih Logo Komunitas</span>
                          </div>
                        )}
                      </label>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Banner Sampul / Cover</label>
                    {editCoverUrl ? (
                      <div className="relative border border-black/10 rounded-xl overflow-hidden bg-[#F5F7F9] p-1.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img src={editCoverUrl} alt="Cover Preview" className="w-10 h-10 object-cover rounded-lg" />
                          <span className="text-[10px] font-medium text-[#111111] truncate max-w-[120px]">Banner Terpilih</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditCoverUrl('')}
                          className="p-1 bg-black/5 hover:bg-black/10 text-neutral-600 rounded-full transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="border border-dashed border-black/15 hover:border-primary/45 rounded-xl h-14 flex items-center justify-center cursor-pointer bg-[#F5F7F9]/50 hover:bg-[#F5F7F9] transition-all p-3 group">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingCover}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileUpload(file, 'cover')
                          }}
                        />
                        {uploadingCover ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            <span className="text-[10px] text-text-secondary font-medium">Mengunggah...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Upload className="w-4 h-4 text-text-secondary group-hover:text-primary transition-colors" />
                            <span className="text-[10px] font-bold text-text-primary">Pilih Banner Sampul</span>
                          </div>
                        )}
                      </label>
                    )}
                  </div>
                </div>

                <div className="border-t border-black/5 pt-4">
                  <h4 className="text-xs font-bold text-[#111111] uppercase tracking-wider mb-3">Informasi Legalitas</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Akta Notaris</label>
                      <input
                        type="text"
                        value={editAkta}
                        onChange={(e) => setEditAkta(e.target.value)}
                        placeholder="Nomor Akta Notaris"
                        className="w-full h-10 px-3 bg-[#F5F7F9] border border-black/10 rounded-xl text-xs text-[#111111] focus:outline-none focus:border-primary/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Nomor AHU / Keputusan Menteri</label>
                      <input
                        type="text"
                        value={editAhu}
                        onChange={(e) => setEditAhu(e.target.value)}
                        placeholder="Nomor AHU"
                        className="w-full h-10 px-3 bg-[#F5F7F9] border border-black/10 rounded-xl text-xs text-[#111111] focus:outline-none focus:border-primary/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">NPWP Organisasi</label>
                      <input
                        type="text"
                        value={editNpwp}
                        onChange={(e) => setEditNpwp(e.target.value)}
                        placeholder="Nomor NPWP"
                        className="w-full h-10 px-3 bg-[#F5F7F9] border border-black/10 rounded-xl text-xs text-[#111111] focus:outline-none focus:border-primary/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Domisili Kantor</label>
                      <input
                        type="text"
                        value={editDomisili}
                        onChange={(e) => setEditDomisili(e.target.value)}
                        placeholder="Alamat Kantor Pusat"
                        className="w-full h-10 px-3 bg-[#F5F7F9] border border-black/10 rounded-xl text-xs text-[#111111] focus:outline-none focus:border-primary/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Kontak Penanggung Jawab</label>
                  <input
                    type="text"
                    value={editKontakPj}
                    onChange={(e) => setEditKontakPj(e.target.value)}
                    placeholder="Nama / No HP PJ"
                    className="w-full h-10 px-3 bg-[#F5F7F9] border border-black/10 rounded-xl text-xs text-[#111111] focus:outline-none focus:border-primary/50"
                  />
                </div>

                {community.type === 'KOPERASI' && (
                  <div className="border-t border-black/5 pt-4">
                    <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-3">Keuangan Koperasi</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Simpanan Pokok (Rp)</label>
                        <input
                          type="number"
                          value={editJoinFee}
                          onChange={(e) => setEditJoinFee(e.target.value)}
                          className="w-full h-10 px-3 bg-[#F5F7F9] border border-black/10 rounded-xl text-xs text-[#111111] focus:outline-none focus:border-primary/50"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Iuran Wajib Bulanan (Rp)</label>
                        <input
                          type="number"
                          value={editMonthlyFee}
                          onChange={(e) => setEditMonthlyFee(e.target.value)}
                          className="w-full h-10 px-3 bg-[#F5F7F9] border border-black/10 rounded-xl text-xs text-[#111111] focus:outline-none focus:border-primary/50"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="flex-1 py-2.5 border border-black/10 hover:bg-[#F5F7F9] text-[#111111] font-bold text-xs uppercase tracking-wider rounded-xl font-geist"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={actionPending}
                    className="flex-1 py-2.5 bg-primary text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg font-geist"
                  >
                    {actionPending ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
