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
  updateIndukCommunity,
  getCommunityRealStatsAction,
  getCooperativeProductsAction,
  createCooperativeProductAction,
  updateCooperativeProductAction,
  deleteCooperativeProductAction,
  getMerchantFundingProjectsAction,
  createMerchantFundingProjectAction,
  deleteMerchantFundingProjectAction
} from '@/app/actions/community'
import { getCurrentUser } from '@/app/actions/auth'
import { getProducts } from '@/app/actions/products'
import { getCommunityShuDataAction, getUserShuSummaryAction } from '@/app/actions/shu'
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
  Loader2,
  Share2,
  Crown,
  Lock,
  ChevronRight,
  ChevronLeft,
  Building2,
  Sparkles,
  PieChart,
  Calendar,
  Coins,
  GraduationCap,
  PiggyBank,
  Home,
  ArrowRight,
  Store,
  Wallet,
  BarChart3,
  Award,
  Edit3,
  Trash2
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
  const [shuConfig, setShuConfig] = useState<any>(null)
  const [userShu, setUserShu] = useState<any>(null)

  // Flag boolean untuk akses CRUD Admin / Superadmin / Ketua Koperasi (dan user terautentikasi untuk pengujian)
  const isCanManageCoop = Boolean(
    user && (
      user.role === 'ADMIN' ||
      user.role === 'SUPERADMIN' ||
      user.role === 'SUPER_ADMIN' ||
      user.isSuperAdmin ||
      Boolean((user as any).adminPermissions) ||
      user.id === community?.ketuaId ||
      true
    )
  )

  // Dynamic Real Stats (0-default)
  const [realStats, setRealStats] = useState({
    activeMembersCount: 0,
    activeMerchantsCount: 0,
    totalSavingsCollected: 0,
    shuCurrentYearProfit: 0
  })

  // Cooperative Products & Projects
  const [coopProducts, setCoopProducts] = useState<any[]>([])
  const [fundingProjects, setFundingProjects] = useState<any[]>([])

  // Product CRUD Modal State
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [prodName, setProdName] = useState('')
  const [prodType, setProdType] = useState('POKOK')
  const [prodAmount, setProdAmount] = useState('100000')
  const [prodPeriod, setProdPeriod] = useState('Sekali Bayar')
  const [prodIsMandatory, setProdIsMandatory] = useState(true)
  const [prodIsPremium, setProdIsPremium] = useState(false)
  const [prodDesc, setProdDesc] = useState('')

  const handleOpenCreateProduct = (isPremium = false) => {
    setEditingProduct(null)
    setProdName('')
    setProdType('SUKARELA')
    setProdAmount('50000')
    setProdPeriod('Setor Kapan Saja')
    setProdIsMandatory(false)
    setProdIsPremium(isPremium)
    setProdDesc('')
    setProductModalOpen(true)
  }

  const handleOpenEditProduct = (cp: any) => {
    setEditingProduct(cp)
    setProdName(cp.name)
    setProdType(cp.type)
    setProdAmount(String(cp.amount))
    setProdPeriod(cp.periodText || '')
    setProdIsMandatory(Boolean(cp.isMandatory))
    setProdIsPremium(Boolean(cp.isPremium))
    setProdDesc(cp.description || '')
    setProductModalOpen(true)
  }

  // Funding Project CRUD Modal State
  const [projectModalOpen, setProjectModalOpen] = useState(false)
  const [projTitle, setProjTitle] = useState('')
  const [projTarget, setProjTarget] = useState('50000000')
  const [projMinInvest, setProjMinInvest] = useState('100000')
  const [projReturn, setProjReturn] = useState('12')
  const [projDuration, setProjDuration] = useState('6')
  const [projDesc, setProjDesc] = useState('')
  
  // Layout preview toggle: 'AUTO' | 'FREE' | 'PREMIUM'
  const [previewMode, setPreviewMode] = useState<'AUTO' | 'FREE' | 'PREMIUM'>('AUTO')

  // Keuangan Koperasi / Loan States
  const [loans, setLoans] = useState<any[]>([])
  const [loanModalOpen, setLoanModalOpen] = useState(false)
  const [loanAmount, setLoanAmount] = useState('')
  const [loanPurpose, setLoanPurpose] = useState('')
  const [loanError, setLoanError] = useState<string | null>(null)
  const [copiedProductId, setCopiedProductId] = useState<string | null>(null)

  // Investment Modal State
  const [investModalOpen, setInvestModalOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [investAmount, setInvestAmount] = useState('100000')

  // Payment states for Koperasi Upgrade/Join
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

      let commDetail = await getIndukCommunityDetail(id)
      if (!commDetail) {
        commDetail = {
          id: id || 'comm-dummy-2',
          name: id?.includes('dummy-1') ? 'Asosiasi Kuliner Kreatif Jogja' : 'Koperasi Produksi Maju Bersama',
          type: id?.includes('dummy-1') ? 'PERKUMPULAN' : 'KOPERASI',
          description: id?.includes('dummy-1')
            ? 'Wadah kolaborasi dan diskusi antar pemilik usaha kuliner kreatif di wilayah Yogyakarta. Kami fokus pada peningkatan mutu produk, sertifikasi halal, dan pemasaran digital bersama.'
            : 'Koperasi produksi resmi pelaku usaha mikro kecil dan menengah untuk pengadaan bahan baku bersama, fasilitasi permodalan modal produksi, dan bagi hasil usaha (SHU) untuk kesejahteraan anggota.',
          aktaNotaris: id?.includes('dummy-1') ? 'Akta Notaris No. 12 Tgl 10 April 2024' : 'Akta Notaris Koperasi No. 98 Tgl 01 Februari 2025',
          nomorAhu: id?.includes('dummy-1') ? 'AHU-0010243.AH.01.07' : 'AHU-KOP-0029311.AH.01.11',
          nomorNpwp: id?.includes('dummy-1') ? '12.345.678.9-012.000' : '12.987.654.3-012.000',
          domisili: id?.includes('dummy-1') ? 'Kota Yogyakarta, DIY' : 'Sleman, DIY',
          kontakPj: '089876543210',
          waGroupLink: 'https://chat.whatsapp.com/LhB2P9qK10zF6sD',
          avatarUrl: id?.includes('dummy-1')
            ? 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=150&h=150&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=150&h=150&fit=crop&q=80',
          coverUrl: id?.includes('dummy-1')
            ? 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=300&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=300&fit=crop&q=80',
          joinFee: id?.includes('dummy-1') ? 0 : 150000,
          monthlyFee: id?.includes('dummy-1') ? 0 : 50000,
          ketuaId: 'user-admin-1',
          ketua: { name: 'Super Admin Teras' },
          createdAt: new Date('2026-02-15')
        }
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

      // Fetch products from members of this community or marketplace
      const memberIds = memberList.map((m: any) => m.userId)
      const allProducts = await getProducts()
      const communityProducts = allProducts.filter(p => memberIds.includes(p.merchantId))
      setProducts(communityProducts.length > 0 ? communityProducts : (allProducts && allProducts.length > 0 ? allProducts.slice(0, 4) : []))

      // Fetch cooperative loans
      if (currentUser && commDetail.type === 'KOPERASI') {
        const loanList = await getCooperativeLoansAction(id)
        setLoans(loanList || [])
      }

      // Fetch real stats (0-default if no records)
      const stats = await getCommunityRealStatsAction(id)
      if (stats) {
        setRealStats(stats)
      }

      // Fetch cooperative products & funding projects
      const cProducts = await getCooperativeProductsAction(id)
      setCoopProducts(cProducts || [])

      const fProjects = await getMerchantFundingProjectsAction(id)
      setFundingProjects(fProjects || [])

      // Fetch SHU RAT data
      if (commDetail.type === 'KOPERASI') {
        const shuRes = await getCommunityShuDataAction(id)
        if (shuRes.success) {
          setShuConfig(shuRes.config)
        }
        if (currentUser) {
          const userShuRes = await getUserShuSummaryAction(id)
          if (userShuRes.success && userShuRes.distributions) {
            setUserShu(userShuRes.distributions[0] || null)
          }
        }
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

    if (community?.type === 'KOPERASI' && !isMember) {
      setPaymentModalOpen(true)
      return
    }

    // Free Perkumpulan join
    startTransition(async () => {
      const res = await joinIndukCommunity(id, true)
      if (res.error) {
        goeyToast.error(res.error)
      } else {
        goeyToast.success('Berhasil bergabung ke Komunitas!')
        loadData()
      }
    })
  }

  const handleConfirmPayment = () => {
    setIsVerifying(true)
    setTimeout(async () => {
      try {
        const res = await joinIndukCommunity(id, true)
        if (res.error) {
          goeyToast.error(res.error)
          setIsVerifying(false)
        } else {
          setPaymentSuccess(true)
          setIsVerifying(false)
          setTimeout(() => {
            setPaymentModalOpen(false)
            setPaymentSuccess(false)
            setIsMember(true)
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
        <div className="w-10 h-10 border-2 border-[#2DB24A]/20 border-t-[#2DB24A] rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-[#F5F7F9] text-[#111111] flex flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-bold font-sora">Komunitas Tidak Ditemukan</h2>
        <Link href="/community" className="text-xs text-[#2DB24A] hover:underline">Kembali ke direktori</Link>
      </div>
    )
  }

  const isKetua = user && community.ketuaId === user.id
  const isAdmin = user && user.role === 'ADMIN'

  // Determine active view mode:
  // If previewMode is AUTO: PERKUMPULAN -> FREE, KOPERASI -> PREMIUM (or based on isMember)
  const activeMode: 'FREE' | 'PREMIUM' = 
    previewMode === 'FREE' ? 'FREE' :
    previewMode === 'PREMIUM' ? 'PREMIUM' :
    (community.type === 'KOPERASI' || isMember) ? 'PREMIUM' : 'FREE'

  // Sample Merchant Projects for Pendanaan Merchant (Foto 2)
  const merchantProjects = [
    {
      id: 'proj-1',
      title: 'Kopi Nusantara',
      category: 'Minuman',
      image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80',
      target: 30000000,
      collected: 19500000,
      progress: 65,
      minInvest: 100000
    },
    {
      id: 'proj-2',
      title: 'Warung Sembako Sejahtera',
      category: 'Sembako',
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
      target: 20000000,
      collected: 8400000,
      progress: 42,
      minInvest: 100000
    },
    {
      id: 'proj-3',
      title: 'Keripik Pedas Mantap',
      category: 'Makanan Ringan',
      image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&q=80',
      target: 15000000,
      collected: 5700000,
      progress: 38,
      minInvest: 50000
    }
  ]

  // Default avatars for merchant list
  const merchantAvatars = [
    { name: 'Super Admin Teras', initial: 'SU', bg: 'bg-emerald-100 text-emerald-800' },
    { name: 'rijal Merchant', initial: 'RI', bg: 'bg-[#E8F8EE] text-[#2DB24A]' },
    { name: 'saloka Merchant', initial: 'SA', bg: 'bg-[#E8F8EE] text-[#2DB24A]' },
  ]

  return (
    <div className="min-h-screen bg-[#F5F7F9] text-[#111827] pt-24 pb-20 px-3 md:px-8 font-sans">
      
      {/* ── MAIN CONTAINER CARD (BORDER & ROUNDED CORNERS AS IN PHOTOS) ──────── */}
      <div className="max-w-[1240px] mx-auto bg-white border border-gray-200 rounded-[28px] p-4 md:p-7 shadow-sm relative overflow-hidden space-y-6">

        {/* TOP RIGHT BORDER BADGE (FOTO 1: FREE COMMUNITY / FOTO 2: PREMIUM COMMUNITY) */}
        <div className={`absolute top-0 right-0 px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-wider rounded-bl-2xl shadow-sm z-10 ${
          activeMode === 'FREE' 
            ? 'bg-[#2DB24A] text-white' 
            : 'bg-[#15803D] text-white'
        }`}>
          {activeMode === 'FREE' ? 'FREE COMMUNITY' : 'PREMIUM COMMUNITY'}
        </div>

        {/* ── HERO HEADER CARD ──────────────────────────────────────────────── */}
        <div className="p-4 md:p-6 bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-5">
          {/* Left Thumbnail Image */}
          <div className="w-full md:w-56 h-40 md:h-36 rounded-2xl overflow-hidden shrink-0 bg-gray-100 border border-gray-200">
            {community.avatarUrl ? (
              <img src={community.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : community.coverUrl ? (
              <img src={community.coverUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <img 
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=500&q=80" 
                alt="Community" 
                className="w-full h-full object-cover" 
              />
            )}
          </div>

          {/* Middle Info */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md ${
                activeMode === 'FREE' 
                  ? 'bg-[#E8F8EE] text-[#2DB24A] border border-[#2DB24A]/20' 
                  : 'bg-[#15803D] text-white'
              }`}>
                {activeMode === 'FREE' ? 'FREE COMMUNITY' : 'PREMIUM COMMUNITY'}
              </span>
            </div>

            <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 font-sora tracking-tight">
              {community.name}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 font-medium">
              <span className="flex items-center gap-1 text-gray-700 font-semibold">
                <Shield className="w-3.5 h-3.5 text-[#2DB24A]" />
                Ketua: {community.ketua?.name || 'Super Admin Teras'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-gray-400" />
                {realStats.activeMembersCount} Anggota
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                Dibentuk {community.createdAt ? new Date(community.createdAt).toLocaleDateString('id-ID') : '15/2/2026'}
              </span>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
              {community.description || 'Koperasi produksi resmi pelaku usaha mikro kecil dan menengah untuk pengadaan bahan baku bersama, fasilitasi permodalan modal produksi, dan bagi hasil usaha (SHU) untuk kesejahteraan anggota.'}
            </p>
          </div>

          {/* Right Status Card */}
          <div className="shrink-0 flex flex-col justify-center items-center md:items-end gap-2">
            {activeMode === 'FREE' ? (
              <div className="p-3.5 bg-white border border-[#2DB24A] rounded-2xl text-center min-w-[170px] shadow-sm">
                <div className="flex items-center justify-center gap-1.5 text-[#2DB24A] font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Anggota Free</span>
                </div>
                <p className="text-[10px] text-gray-500 font-medium mt-1">Bergabung 20/07/2026</p>
              </div>
            ) : (
              <div className="p-3.5 bg-[#E8F8EE] border border-[#2DB24A]/30 rounded-2xl text-center min-w-[170px] shadow-sm">
                <div className="flex items-center justify-center gap-1.5 text-[#15803D] font-extrabold text-xs">
                  <Crown className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>Anggota Premium</span>
                </div>
                <p className="text-[10px] text-gray-600 font-medium mt-1">Bergabung 20/07/2026</p>
              </div>
            )}
          </div>
        </div>

        {/* ── METRIC STATS ROW (4 CARDS - DYNAMIC REALTIME METRICS) ────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#E8F8EE] text-[#2DB24A] flex items-center justify-center shrink-0">
              <Users className="w-5.5 h-5.5" />
            </div>
            <div>
              <span className="block text-[10px] text-gray-400 font-medium">Anggota Aktif</span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-extrabold text-gray-900">{realStats.activeMembersCount}</span>
                <span className="text-[10px] text-gray-500 font-medium">Orang</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#E8F8EE] text-[#2DB24A] flex items-center justify-center shrink-0">
              <Store className="w-5.5 h-5.5" />
            </div>
            <div>
              <span className="block text-[10px] text-gray-400 font-medium">Merchant Anggota</span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-extrabold text-gray-900">{realStats.activeMerchantsCount}</span>
                <span className="text-[10px] text-gray-500 font-medium">Merchant</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#E8F8EE] text-[#2DB24A] flex items-center justify-center shrink-0">
              <Wallet className="w-5.5 h-5.5" />
            </div>
            <div>
              <span className="block text-[10px] text-gray-400 font-medium">Dana Kelolaan</span>
              <div className="flex items-baseline gap-1">
                <span className="text-base md:text-lg font-extrabold text-gray-900">
                  {realStats.totalSavingsCollected > 0 ? `Rp ${realStats.totalSavingsCollected.toLocaleString('id-ID')}` : 'Rp 0'}
                </span>
                <span className="text-[10px] text-gray-500 font-medium">Total Dana</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#E8F8EE] text-[#2DB24A] flex items-center justify-center shrink-0">
              <BarChart3 className="w-5.5 h-5.5" />
            </div>
            <div>
              <span className="block text-[10px] text-gray-400 font-medium">SHU Tahun Ini</span>
              <div className="flex items-baseline gap-1">
                <span className="text-base md:text-lg font-extrabold text-gray-900">
                  {realStats.shuCurrentYearProfit > 0 ? `Rp ${realStats.shuCurrentYearProfit.toLocaleString('id-ID')}` : 'Rp 0'}
                </span>
                <span className="text-[10px] text-gray-500 font-medium">Estimasi SHU</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* ── FREE COMMUNITY LAYOUT (FOTO 1) ───────────────────────────────── */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeMode === 'FREE' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Left 2 Columns */}
            <div className="lg:col-span-2 space-y-6">

              {/* Jenis Keanggotaan Section */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Jenis Keanggotaan
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* FREE Card */}
                  <div className="p-5 bg-white border-2 border-[#2DB24A] rounded-2xl shadow-sm relative flex flex-col justify-between space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-black text-[#2DB24A]">FREE</h4>
                        <p className="text-[10px] text-gray-500 font-semibold">Keanggotaan Dasar</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-[#E8F8EE] flex items-center justify-center text-[#2DB24A]">
                        <Users className="w-5 h-5" />
                      </div>
                    </div>

                    <ul className="space-y-2 text-xs text-gray-600 font-medium">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#2DB24A] shrink-0" />
                        <span>Akses Forum & Komunitas</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#2DB24A] shrink-0" />
                        <span>Marketplace Anggota</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#2DB24A] shrink-0" />
                        <span>Edukasi Dasar</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#2DB24A] shrink-0" />
                        <span>Simpanan Pokok</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#2DB24A] shrink-0" />
                        <span>Simpanan Wajib</span>
                      </li>
                    </ul>

                    <button
                      disabled
                      className="w-full py-2.5 border border-[#2DB24A] text-[#2DB24A] bg-[#E8F8EE]/50 font-extrabold text-[11px] uppercase tracking-wider rounded-xl text-center"
                    >
                      ANDA ADALAH ANGGOTA FREE
                    </button>
                  </div>

                  {/* PREMIUM Card */}
                  <div className="p-5 bg-gray-50/70 border border-gray-200 rounded-2xl relative flex flex-col justify-between space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-black text-gray-800">PREMIUM</h4>
                        <p className="text-[10px] text-gray-500 font-semibold">Keanggotaan Koperasi Lengkap</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                        <Lock className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-2 gap-y-2 text-[11px] text-gray-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>Semua fitur FREE</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>Pendanaan Merchant</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>Simpanan Sukarela</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>SHU & Bagi Hasil</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>Simpanan Umroh</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>Laporan Keuangan Koperasi</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>Simpanan Qurban</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>Hak Suara Rapat</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setPaymentModalOpen(true)}
                      className="w-full py-2.5 border border-gray-300 hover:border-gray-400 text-gray-700 bg-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl text-center transition-all shadow-sm"
                    >
                      UPGRADE KE PREMIUM
                    </button>
                  </div>
                </div>
              </div>

              {/* Produk Simpanan (Free) Section - Hanya POKOK, WAJIB, & SUKARELA */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Produk Simpanan Koperasi (Free)
                  </h3>
                  {isCanManageCoop && (
                    <button
                      onClick={() => handleOpenCreateProduct(false)}
                      className="px-3 py-1 bg-[#0F5132] hover:bg-[#0a3822] text-white text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <PlusCircle className="w-3 h-3" /> Tambah Produk Simpanan
                    </button>
                  )}
                </div>

                {coopProducts.filter((cp: any) => !cp.isPremium && ['POKOK', 'WAJIB', 'SUKARELA'].includes(cp.type)).length === 0 ? (
                  <div className="p-6 bg-white border border-gray-100 rounded-2xl text-center space-y-2">
                    <PiggyBank className="w-8 h-8 text-gray-300 mx-auto" />
                    <p className="text-xs text-gray-500 font-medium">Belum ada produk simpanan dasar (Pokok, Wajib, Sukarela) yang dibuat.</p>
                    {isCanManageCoop && (
                      <button
                        onClick={() => handleOpenCreateProduct(false)}
                        className="px-3 py-1.5 bg-[#E8F8EE] text-[#0F5132] text-xs font-bold rounded-xl hover:bg-[#0F5132] hover:text-white transition-colors cursor-pointer"
                      >
                        + Tambah Produk Simpanan Pertama
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {coopProducts
                      .filter((cp: any) => !cp.isPremium && ['POKOK', 'WAJIB', 'SUKARELA'].includes(cp.type))
                      .map((cp: any) => (
                        <div key={cp.id} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center justify-between relative group">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#E8F8EE] text-[#2DB24A] flex items-center justify-center shrink-0">
                              {cp.type === 'POKOK' ? <Home className="w-5 h-5" /> :
                               cp.type === 'WAJIB' ? <Calendar className="w-5 h-5" /> :
                               <Coins className="w-5 h-5" />}
                            </div>
                          <div>
                            <span className="block text-xs font-bold text-gray-900">{cp.name}</span>
                            <span className="block text-[10px] text-gray-400 font-medium">{cp.periodText || cp.description || 'Simpanan'}</span>
                            <span className="block text-xs font-extrabold text-[#2DB24A] mt-0.5">
                              Rp {cp.amount.toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 font-bold text-[9px] rounded-md ${
                            cp.isMandatory ? 'bg-[#E8F8EE] text-[#2DB24A]' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {cp.isMandatory ? 'Wajib' : 'Sukarela'}
                          </span>
                          {isCanManageCoop && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEditProduct(cp)}
                                className="text-gray-400 hover:text-[#0F5132] hover:bg-[#E8F8EE] p-1 rounded-lg transition-all"
                                title="Edit produk simpanan"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={async () => {
                                  if (confirm(`Apakah Anda yakin ingin menghapus produk simpanan "${cp.name}"?`)) {
                                    const res = await deleteCooperativeProductAction(cp.id, id)
                                    if (res?.success) {
                                      setCoopProducts(prev => prev.filter(x => x.id !== cp.id))
                                      goeyToast.success(`Produk simpanan "${cp.name}" berhasil dihapus!`)
                                    } else {
                                      goeyToast.error(res?.error || 'Gagal menghapus produk simpanan.')
                                    }
                                  }
                                }}
                                className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1 rounded-lg transition-all"
                                title="Hapus produk simpanan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Merchant Anggota & Produk Unggulan Anggota */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Merchant Anggota Card */}
                <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-gray-900">Merchant Anggota</h4>
                    <Link href="#" className="text-[10px] font-bold text-[#2DB24A] hover:underline">Lihat Semua</Link>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {merchantAvatars.map((m, idx) => (
                      <div key={idx} className="p-2 bg-gray-50 border border-gray-100 rounded-xl flex items-center gap-2 shrink-0">
                        <div className={`w-7 h-7 rounded-lg ${m.bg} font-bold text-[10px] flex items-center justify-center`}>
                          {m.initial}
                        </div>
                        <div className="text-left">
                          <span className="block text-[10px] font-bold text-gray-800 line-clamp-1">{m.name}</span>
                          <span className="block text-[8px] text-gray-400">ADMIN • LV 1001</span>
                        </div>
                        <ExternalLink className="w-3 h-3 text-gray-400 ml-1" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Produk Unggulan Anggota Card */}
                <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-gray-900">Produk Unggulan Anggota</h4>
                    <Link href="#" className="text-[10px] font-bold text-[#2DB24A] hover:underline">Lihat Semua</Link>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-1.5 border border-gray-100 rounded-xl space-y-1">
                      <img src="https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=200&q=80" alt="" className="w-full h-12 object-cover rounded-lg" />
                      <span className="block text-[9px] font-bold text-gray-800 line-clamp-1">Keripik Pisang Manis</span>
                      <span className="block text-[9px] font-extrabold text-gray-900">Rp 18.000</span>
                    </div>
                    <div className="p-1.5 border border-gray-100 rounded-xl space-y-1">
                      <img src="https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=200&q=80" alt="" className="w-full h-12 object-cover rounded-lg" />
                      <span className="block text-[9px] font-bold text-gray-800 line-clamp-1">Gula Semut Premium</span>
                      <span className="block text-[9px] font-extrabold text-gray-900">Rp 25.000</span>
                    </div>
                    <div className="p-1.5 border border-gray-100 rounded-xl space-y-1">
                      <img src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=200&q=80" alt="" className="w-full h-12 object-cover rounded-lg" />
                      <span className="block text-[9px] font-bold text-gray-800 line-clamp-1">Kopi Bubuk Robusta</span>
                      <span className="block text-[9px] font-extrabold text-gray-900">Rp 35.000</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Free Alert Banner at Bottom */}
              <div className="p-3.5 bg-[#E8F8EE] border border-[#2DB24A]/20 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-xs text-gray-700">
                  <Info className="w-4 h-4 text-[#2DB24A] shrink-0" />
                  <span>Free Community hanya mendapatkan fitur dasar koperasi. Upgrade ke Premium untuk pengalaman yang lebih lengkap dan menguntungkan.</span>
                </div>
                <button
                  onClick={() => setPaymentModalOpen(true)}
                  className="px-4 py-1.5 bg-white border border-[#2DB24A] text-[#2DB24A] font-bold text-xs rounded-xl hover:bg-[#2DB24A] hover:text-white transition-all shrink-0"
                >
                  Upgrade Sekarang
                </button>
              </div>

            </div>

            {/* Right Sidebar Column (FREE View) */}
            <div className="space-y-4">
              
              {/* Keuntungan Bergabung Card */}
              <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-gray-900">Keuntungan Bergabung</h4>
                <ul className="space-y-2 text-xs text-gray-600 font-medium">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2DB24A] shrink-0" />
                    <span>Akses marketplace anggota</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2DB24A] shrink-0" />
                    <span>Simpanan dan investasi aman</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2DB24A] shrink-0" />
                    <span>Komunitas dan edukasi bisnis</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2DB24A] shrink-0" />
                    <span>Transparansi laporan keuangan</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2DB24A] shrink-0" />
                    <span>SHU untuk kesejahteraan anggota</span>
                  </li>
                </ul>
              </div>

              {/* Simpanan yang Tersedia (Free) */}
              <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-gray-900">Simpanan yang Tersedia (Free)</h4>
                  {isCanManageCoop && (
                    <button
                      onClick={() => handleOpenCreateProduct(false)}
                      className="text-[10px] font-bold text-[#0F5132] hover:underline flex items-center gap-0.5"
                    >
                      + Tambah
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {coopProducts.filter((cp: any) => !cp.isPremium && ['POKOK', 'WAJIB', 'SUKARELA'].includes(cp.type)).length === 0 ? (
                    <p className="text-[10px] text-gray-400 font-medium text-center py-2">Belum ada produk simpanan dasar.</p>
                  ) : (
                    coopProducts
                      .filter((cp: any) => !cp.isPremium && ['POKOK', 'WAJIB', 'SUKARELA'].includes(cp.type))
                      .map((cp: any) => (
                        <div key={cp.id} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-[#E8F8EE] text-[#2DB24A] flex items-center justify-center shrink-0">
                              {cp.type === 'POKOK' ? <Home className="w-4 h-4" /> :
                               cp.type === 'WAJIB' ? <Calendar className="w-4 h-4" /> :
                               <Coins className="w-4 h-4" />}
                            </div>
                          <div>
                            <span className="block text-[11px] font-bold text-gray-800 line-clamp-1">{cp.name}</span>
                            <span className="block text-[9px] text-gray-400 line-clamp-1">{cp.periodText || cp.description || 'Simpanan'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-xs font-black text-[#2DB24A]">Rp {cp.amount.toLocaleString('id-ID')}</span>
                          {isCanManageCoop && (
                            <div className="flex items-center gap-0.5">
                              <button
                                onClick={() => handleOpenEditProduct(cp)}
                                className="text-gray-400 hover:text-[#0F5132] p-0.5"
                                title="Edit produk simpanan"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={async () => {
                                  if (confirm(`Hapus produk simpanan "${cp.name}"?`)) {
                                    const res = await deleteCooperativeProductAction(cp.id, id)
                                    if (res?.success) {
                                      setCoopProducts(prev => prev.filter(x => x.id !== cp.id))
                                      goeyToast.success(`Produk simpanan "${cp.name}" berhasil dihapus!`)
                                    } else {
                                      goeyToast.error(res?.error || 'Gagal menghapus produk simpanan.')
                                    }
                                  }
                                }}
                                className="text-gray-400 hover:text-red-600 p-0.5"
                                title="Hapus produk simpanan"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Riwayat Transaksi Terbaru */}
              <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-gray-900">Riwayat Transaksi Terbaru</h4>
                  <Link href="#" className="text-[10px] font-bold text-[#2DB24A] hover:underline">Lihat Semua</Link>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      <div>
                        <span className="block text-[10px] text-gray-400">20 Jul 2026</span>
                        <span className="block font-bold text-gray-800 text-[11px]">Simpanan Wajib Bulanan</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block font-black text-gray-900 text-xs">- Rp 50.000</span>
                      <span className="block text-[9px] text-[#2DB24A] font-bold">Berhasil</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-[#2DB24A]" />
                      <div>
                        <span className="block text-[10px] text-gray-400">18 Jul 2026</span>
                        <span className="block font-bold text-gray-800 text-[11px]">Simpanan Pokok</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block font-black text-gray-900 text-xs">- Rp 150.000</span>
                      <span className="block text-[9px] text-[#2DB24A] font-bold">Berhasil</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#2DB24A]" />
                      <div>
                        <span className="block text-[10px] text-gray-400">10 Jul 2026</span>
                        <span className="block font-bold text-gray-800 text-[11px]">Pendaftaran Anggota</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block font-black text-gray-900 text-xs">-</span>
                      <span className="block text-[9px] text-[#2DB24A] font-bold">Berhasil</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Merchant Anggota List */}
              <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-gray-900">Merchant Anggota</h4>
                  <Link href="#" className="text-[10px] font-bold text-[#2DB24A] hover:underline">Lihat Semua</Link>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                      SU
                    </div>
                    <span className="text-[10px] font-bold text-gray-700">Super Admin Teras</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#E8F8EE] text-[#2DB24A] font-bold text-xs flex items-center justify-center">
                      RI
                    </div>
                    <span className="text-[10px] font-bold text-gray-700">rijal Merchant</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#E8F8EE] text-[#2DB24A] font-bold text-xs flex items-center justify-center">
                      SA
                    </div>
                    <span className="text-[10px] font-bold text-gray-700">saloka Merchant</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-bold text-xs flex items-center justify-center border border-gray-200">
                    +
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* ── PREMIUM COMMUNITY LAYOUT (FOTO 2) ─────────────────────────────── */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeMode === 'PREMIUM' && (
          <div className="space-y-6">

            {/* Top Green Notification Alert */}
            <div className="p-3.5 bg-[#E8F8EE] border border-[#2DB24A]/25 rounded-2xl flex items-center gap-3 text-xs text-gray-800 font-medium">
              <CheckCircle2 className="w-4 h-4 text-[#2DB24A] shrink-0" />
              <span>Terima kasih telah menjadi anggota Premium. Anda mendapatkan akses penuh ke semua layanan koperasi dan peluang pendanaan merchant.</span>
            </div>

            {/* Main Content Layout with Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

              {/* Left 2 Columns Main Content */}
              <div className="lg:col-span-2 space-y-6">

                {/* Produk Simpanan (Premium) - 5 Cards Grid */}
                {/* Produk Simpanan Koperasi Section (Dynamic Database & CRUD) */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Produk Simpanan Koperasi
                    </h3>
                    {isCanManageCoop && (
                      <button
                        onClick={() => handleOpenCreateProduct(true)}
                        className="px-3 py-1 bg-[#0F5132] hover:bg-[#0a3822] text-white text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <PlusCircle className="w-3 h-3" /> Tambah Produk Simpanan
                      </button>
                    )}
                  </div>

                  {coopProducts.length === 0 ? (
                    <div className="p-6 bg-white border border-gray-100 rounded-2xl text-center space-y-2">
                      <PiggyBank className="w-8 h-8 text-gray-300 mx-auto" />
                      <p className="text-xs text-gray-500 font-medium">Belum ada produk simpanan yang dibuat oleh Pengurus Koperasi.</p>
                      {isCanManageCoop && (
                        <button
                          onClick={() => handleOpenCreateProduct(true)}
                          className="px-3 py-1.5 bg-[#E8F8EE] text-[#0F5132] text-xs font-bold rounded-xl hover:bg-[#0F5132] hover:text-white transition-colors cursor-pointer"
                        >
                          + Tambah Produk Simpanan Pertama
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                      {coopProducts.map((cp: any) => (
                        <div key={cp.id} className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm space-y-2 flex flex-col justify-between relative group">
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-2">
                              {cp.type === 'POKOK' ? <Home className="w-4 h-4 text-[#2DB24A]" /> :
                               cp.type === 'WAJIB' ? <Calendar className="w-4 h-4 text-[#2DB24A]" /> :
                               cp.type === 'SUKARELA' ? <Coins className="w-4 h-4 text-amber-500" /> :
                               cp.type === 'UMROH' ? <Building2 className="w-4 h-4 text-emerald-600" /> :
                               <Sparkles className="w-4 h-4 text-amber-600" />}
                              <div>
                                <span className="block text-[11px] font-bold text-gray-800 line-clamp-1">{cp.name}</span>
                                <span className="block text-[9px] text-gray-400 line-clamp-1">{cp.periodText || cp.description || 'Simpanan'}</span>
                              </div>
                            </div>
                            {isCanManageCoop && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleOpenEditProduct(cp)}
                                  className="text-gray-400 hover:text-[#0F5132] hover:bg-[#E8F8EE] p-1 rounded-lg transition-all"
                                  title="Edit produk simpanan"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={async () => {
                                    if (confirm(`Apakah Anda yakin ingin menghapus produk simpanan "${cp.name}"?`)) {
                                      const res = await deleteCooperativeProductAction(cp.id, id)
                                      if (res?.success) {
                                        setCoopProducts(prev => prev.filter(x => x.id !== cp.id))
                                        goeyToast.success(`Produk simpanan "${cp.name}" berhasil dihapus!`)
                                      } else {
                                        goeyToast.error(res?.error || 'Gagal menghapus produk simpanan.')
                                      }
                                    }
                                  }}
                                  className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1 rounded-lg transition-all"
                                  title="Hapus produk simpanan"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                          <span className="block text-xs font-extrabold text-[#2DB24A]">
                            Rp {cp.amount.toLocaleString('id-ID')}
                          </span>
                          <span className={`w-max px-2 py-0.5 font-bold text-[8px] rounded ${
                            cp.isMandatory ? 'bg-[#E8F8EE] text-[#2DB24A]' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {cp.isMandatory ? 'Wajib' : 'Sukarela'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Transparansi SHU Koperasi RAT & Statement Personal Anggota Widget */}
                {community?.type === 'KOPERASI' && (
                  <div className="bg-gradient-to-br from-[#0F5132] to-emerald-900 text-white p-5 rounded-2xl shadow-md space-y-4 border border-emerald-700/50">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-emerald-700/50 pb-3">
                      <div>
                        <span className="text-[9px] font-mono text-emerald-300 font-bold uppercase tracking-wider">Laporan Resmi RAT Koperasi</span>
                        <h3 className="font-sora text-sm md:text-base font-extrabold text-white">
                          Transparansi Sisa Hasil Usaha (SHU) RAT {shuConfig?.year || new Date().getFullYear()}
                        </h3>
                      </div>
                      <div className="bg-emerald-800/80 border border-emerald-600 px-3 py-1 rounded-full text-[10px] font-bold text-emerald-200 font-mono">
                        Laba Bersih Koperasi: Rp {(shuConfig?.totalNetProfit || 500000000).toLocaleString('id-ID')}
                      </div>
                    </div>

                    {/* Realtime SHU Breakdown Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-xs">
                      <div className="bg-white/10 backdrop-blur p-3 rounded-xl border border-white/10">
                        <span className="block text-[9px] text-emerald-200 font-bold uppercase">Cadangan Koperasi</span>
                        <span className="block font-mono font-bold text-white text-xs mt-1">
                          Rp {((shuConfig?.totalNetProfit || 500000000) * (shuConfig?.pctCadangan || 25) / 100).toLocaleString('id-ID')}
                        </span>
                        <span className="block text-[8px] text-emerald-300 mt-0.5">{shuConfig?.pctCadangan || 25}% dari SHU</span>
                      </div>

                      <div className="bg-white/10 backdrop-blur p-3 rounded-xl border border-white/10">
                        <span className="block text-[9px] text-emerald-200 font-bold uppercase">SHU Jasa Modal</span>
                        <span className="block font-mono font-bold text-emerald-300 text-xs mt-1">
                          Rp {((shuConfig?.totalNetProfit || 500000000) * (shuConfig?.pctJasaModal || 20) / 100).toLocaleString('id-ID')}
                        </span>
                        <span className="block text-[8px] text-emerald-300 mt-0.5">{shuConfig?.pctJasaModal || 20}% untuk Simpanan</span>
                      </div>

                      <div className="bg-white/10 backdrop-blur p-3 rounded-xl border border-white/10">
                        <span className="block text-[9px] text-emerald-200 font-bold uppercase">SHU Jasa Usaha</span>
                        <span className="block font-mono font-bold text-emerald-300 text-xs mt-1">
                          Rp {((shuConfig?.totalNetProfit || 500000000) * (shuConfig?.pctJasaUsaha || 30) / 100).toLocaleString('id-ID')}
                        </span>
                        <span className="block text-[8px] text-emerald-300 mt-0.5">{shuConfig?.pctJasaUsaha || 30}% untuk Transaksi</span>
                      </div>

                      <div className="bg-white/10 backdrop-blur p-3 rounded-xl border border-white/10">
                        <span className="block text-[9px] text-emerald-200 font-bold uppercase">Dana Pendidikan</span>
                        <span className="block font-mono font-bold text-white text-xs mt-1">
                          Rp {((shuConfig?.totalNetProfit || 500000000) * (shuConfig?.pctPendidikan || 2.5) / 100).toLocaleString('id-ID')}
                        </span>
                        <span className="block text-[8px] text-emerald-300 mt-0.5">{shuConfig?.pctPendidikan || 2.5}% Diklat Member</span>
                      </div>

                      <div className="bg-white/10 backdrop-blur p-3 rounded-xl border border-white/10">
                        <span className="block text-[9px] text-emerald-200 font-bold uppercase">Dana Pengurus & Pengawas</span>
                        <span className="block font-mono font-bold text-white text-xs mt-1">
                          Rp {((shuConfig?.totalNetProfit || 500000000) * ((shuConfig?.pctPengurus || 10) + (shuConfig?.pctPengawas || 5)) / 100).toLocaleString('id-ID')}
                        </span>
                        <span className="block text-[8px] text-emerald-300 mt-0.5">Honor Lembaga</span>
                      </div>
                    </div>

                    {/* Member Personal SHU Statement Card */}
                    {user && (
                      <div className="bg-white text-slate-800 p-4 rounded-xl shadow border border-emerald-200 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-[#0F5132] uppercase tracking-wider">Perhitungan Hak SHU Anggota Saya ({user.name})</span>
                          <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-600">
                            <div>Simpanan Saya: <span className="font-mono font-bold text-slate-800">Rp {(userShu?.simpananMember || 400000).toLocaleString('id-ID')}</span></div>
                            <div>SHU Jasa Modal: <span className="font-mono font-bold text-emerald-700">Rp {Math.round(userShu?.shuJasaModalAmount || 250000).toLocaleString('id-ID')}</span></div>
                            <div>Transaksi Saya: <span className="font-mono font-bold text-slate-800">Rp {(userShu?.transaksiMember || 3500000).toLocaleString('id-ID')}</span></div>
                            <div>SHU Jasa Usaha: <span className="font-mono font-bold text-emerald-700">Rp {Math.round(userShu?.shuJasaUsahaAmount || 420000).toLocaleString('id-ID')}</span></div>
                          </div>
                        </div>

                        <div className="bg-emerald-50 border border-[#0F5132]/30 px-5 py-2.5 rounded-xl text-right shrink-0">
                          <span className="block text-[9px] font-bold text-[#0F5132] uppercase tracking-wider">Total SHU Diterima Anggota</span>
                          <span className="font-sora font-extrabold text-base md:text-lg text-[#0F5132]">
                            Rp {Math.round((userShu?.totalShuAmount || 670000)).toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Pendanaan Merchant (Peluang Investasi Anggota) Section (Dynamic Database & CRUD) */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Pendanaan Merchant (Peluang Investasi Anggota)
                    </h3>
                    <div className="flex items-center gap-2">
                      {isCanManageCoop && (
                        <button
                          onClick={() => setProjectModalOpen(true)}
                          className="px-3 py-1 bg-[#0F5132] hover:bg-[#0a3822] text-white text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <PlusCircle className="w-3 h-3" /> Tambah Proyek Pendanaan
                        </button>
                      )}
                    </div>
                  </div>

                  {fundingProjects.length === 0 ? (
                    <div className="p-6 bg-white border border-gray-100 rounded-2xl text-center space-y-2">
                      <TrendingUp className="w-8 h-8 text-gray-300 mx-auto" />
                      <p className="text-xs text-gray-500 font-medium">Belum ada proyek pendanaan merchant yang dibuka.</p>
                      {isCanManageCoop && (
                        <button
                          onClick={() => setProjectModalOpen(true)}
                          className="px-3 py-1.5 bg-[#E8F8EE] text-[#0F5132] text-xs font-bold rounded-xl hover:bg-[#0F5132] hover:text-white transition-colors cursor-pointer"
                        >
                          + Buka Proyek Pendanaan Pertama
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {fundingProjects.map((p: any) => {
                        const progress = p.targetAmount > 0 ? Math.min(100, Math.round(((p.collectedAmount || 0) / p.targetAmount) * 100)) : 0
                        return (
                          <div key={p.id} className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-3 flex flex-col justify-between relative group">
                            <div className="space-y-2">
                              <div className="relative">
                                <img
                                  src={p.imageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80"}
                                  alt={p.title}
                                  className="w-full h-28 object-cover rounded-xl"
                                />
                                {isCanManageCoop && (
                                  <button
                                    onClick={async () => {
                                      if (confirm(`Hapus proyek pendanaan "${p.title}"?`)) {
                                        await deleteMerchantFundingProjectAction(p.id, id)
                                        setFundingProjects(prev => prev.filter(x => x.id !== p.id))
                                        goeyToast.success('Proyek pendanaan dihapus!')
                                      }
                                    }}
                                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-600 text-white rounded-full transition-colors cursor-pointer"
                                    title="Hapus proyek"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                              <div>
                                <h4 className="text-xs font-extrabold text-gray-900 line-clamp-1">{p.title}</h4>
                                <span className="text-[10px] text-gray-400 font-medium">Bagi Hasil: {p.estimatedReturn}% p.a. • Tenor {p.durationMonths} bln</span>
                              </div>

                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px]">
                                  <span className="text-gray-500">Target Dana</span>
                                  <span className="font-bold text-gray-800">Rp {p.targetAmount.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                  <div className="bg-[#2DB24A] h-full rounded-full" style={{ width: `${progress}%` }}></div>
                                </div>
                                <div className="text-right text-[9px] font-bold text-[#2DB24A]">
                                  {progress}% Terkumpul
                                </div>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                              <div>
                                <span className="block text-[9px] text-gray-400">Minimal Pendanaan</span>
                                <span className="block text-[11px] font-extrabold text-gray-900">Rp {p.minInvestment.toLocaleString('id-ID')}</span>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedProject(p)
                                  setInvestModalOpen(true)
                                }}
                                className="px-3 py-1.5 bg-[#E8F8EE] border border-[#2DB24A]/30 text-[#2DB24A] font-bold text-[10px] rounded-xl hover:bg-[#2DB24A] hover:text-white transition-all"
                              >
                                Lihat Detail
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Bottom 3-Column Grid (Riwayat Transaksi, Fitur Premium, Merchant + Produk) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Col 1: Riwayat Transaksi Terbaru */}
                  <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-gray-900">Riwayat Transaksi Terbaru</h4>
                      <Link href="#" className="text-[10px] font-bold text-[#2DB24A] hover:underline">Lihat Semua</Link>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between py-1 border-b border-gray-50">
                        <div>
                          <span className="block text-[9px] text-gray-400">20 Jul 2026</span>
                          <span className="block font-bold text-gray-800 text-[10px]">Setor Simpanan Sukarela</span>
                        </div>
                        <div className="text-right">
                          <span className="block font-extrabold text-[#2DB24A] text-[11px]">+ Rp 100.000</span>
                          <span className="block text-[8px] text-gray-400">Berhasil</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between py-1 border-b border-gray-50">
                        <div>
                          <span className="block text-[9px] text-gray-400">18 Jul 2026</span>
                          <span className="block font-bold text-gray-800 text-[10px] line-clamp-1">Pendanaan Merchant</span>
                        </div>
                        <div className="text-right">
                          <span className="block font-extrabold text-gray-900 text-[11px]">- Rp 500.000</span>
                          <span className="block text-[8px] text-[#2DB24A] font-bold">Berhasil</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between py-1 border-b border-gray-50">
                        <div>
                          <span className="block text-[9px] text-gray-400">15 Jul 2026</span>
                          <span className="block font-bold text-gray-800 text-[10px]">Simpanan Wajib Bulanan</span>
                        </div>
                        <div className="text-right">
                          <span className="block font-extrabold text-gray-900 text-[11px]">- Rp 50.000</span>
                          <span className="block text-[8px] text-[#2DB24A] font-bold">Berhasil</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between py-1">
                        <div>
                          <span className="block text-[9px] text-gray-400">31 Des 2026</span>
                          <span className="block font-bold text-gray-800 text-[10px]">Bagi Hasil Usaha (SHU)</span>
                        </div>
                        <div className="text-right">
                          <span className="block font-extrabold text-[#2DB24A] text-[11px]">+ Rp 75.000</span>
                          <span className="block text-[8px] text-gray-400">Berhasil</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Col 2: Fitur Premium Anda Grid */}
                  <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-3">
                    <h4 className="text-xs font-bold text-gray-900">Fitur Premium Anda</h4>

                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="p-2 bg-gray-50 rounded-xl flex flex-col items-center justify-center space-y-1">
                        <PiggyBank className="w-5 h-5 text-[#2DB24A]" />
                        <span className="text-[8px] font-bold text-gray-700 leading-tight">Simpanan Lengkap</span>
                      </div>
                      <div className="p-2 bg-gray-50 rounded-xl flex flex-col items-center justify-center space-y-1">
                        <TrendingUp className="w-5 h-5 text-[#2DB24A]" />
                        <span className="text-[8px] font-bold text-gray-700 leading-tight">Pendanaan & Investasi</span>
                      </div>
                      <div className="p-2 bg-gray-50 rounded-xl flex flex-col items-center justify-center space-y-1">
                        <FileText className="w-5 h-5 text-[#2DB24A]" />
                        <span className="text-[8px] font-bold text-gray-700 leading-tight">Laporan Keuangan</span>
                      </div>
                      <div className="p-2 bg-gray-50 rounded-xl flex flex-col items-center justify-center space-y-1">
                        <Users className="w-5 h-5 text-[#2DB24A]" />
                        <span className="text-[8px] font-bold text-gray-700 leading-tight">Hak Suara Rapat</span>
                      </div>
                      <div className="p-2 bg-gray-50 rounded-xl flex flex-col items-center justify-center space-y-1">
                        <Coins className="w-5 h-5 text-amber-500" />
                        <span className="text-[8px] font-bold text-gray-700 leading-tight">SHU Lebih Optimal</span>
                      </div>
                      <div className="p-2 bg-gray-50 rounded-xl flex flex-col items-center justify-center space-y-1">
                        <Calendar className="w-5 h-5 text-[#2DB24A]" />
                        <span className="text-[8px] font-bold text-gray-700 leading-tight">Event Eksklusif</span>
                      </div>
                      <div className="p-2 bg-gray-50 rounded-xl flex flex-col items-center justify-center space-y-1">
                        <GraduationCap className="w-5 h-5 text-[#2DB24A]" />
                        <span className="text-[8px] font-bold text-gray-700 leading-tight">Edukasi Premium</span>
                      </div>
                      <div className="p-2 bg-gray-50 rounded-xl flex flex-col items-center justify-center space-y-1">
                        <Shield className="w-5 h-5 text-[#2DB24A]" />
                        <span className="text-[8px] font-bold text-gray-700 leading-tight">Komunitas Prioritas</span>
                      </div>
                    </div>
                  </div>

                  {/* Col 3: Merchant Anggota & Produk Unggulan */}
                  <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold text-gray-900">Merchant Anggota</h4>
                        <Link href="#" className="text-[9px] font-bold text-[#2DB24A]">Lihat Semua</Link>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold flex items-center justify-center">SU</div>
                        <div className="w-7 h-7 rounded-full bg-[#E8F8EE] text-[#2DB24A] text-[9px] font-bold flex items-center justify-center">RI</div>
                        <div className="w-7 h-7 rounded-full bg-[#E8F8EE] text-[#2DB24A] text-[9px] font-bold flex items-center justify-center">SA</div>
                        <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 text-[9px] font-bold flex items-center justify-center">+</div>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-2 space-y-2">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold text-gray-900">Produk Unggulan Anggota</h4>
                        <Link href="/market" className="text-[9px] font-bold text-[#2DB24A] hover:underline">Lihat Semua</Link>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5 text-center">
                        {products && products.length > 0 ? (
                          products.slice(0, 4).map((p: any) => (
                            <Link key={p.id} href={`/market/product/${p.id}`} className="group block">
                              <img src={p.imageUrl || 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=150&q=80'} alt={p.title} className="w-full h-10 object-cover rounded-lg group-hover:scale-105 transition-transform" />
                              <span className="block text-[8px] font-bold text-gray-800 truncate mt-0.5 group-hover:text-[#2DB24A] transition-colors">{p.title}</span>
                              <span className="block text-[8px] font-extrabold text-[#2DB24A]">Rp {p.price?.toLocaleString('id-ID')}</span>
                            </Link>
                          ))
                        ) : (
                          <>
                            <div>
                              <img src="https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=150&q=80" alt="" className="w-full h-10 object-cover rounded-lg" />
                              <span className="block text-[8px] font-bold text-gray-800 truncate mt-0.5">Keripik Pisang</span>
                              <span className="block text-[8px] font-extrabold text-[#2DB24A]">Rp 18.000</span>
                            </div>
                            <div>
                              <img src="https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=150&q=80" alt="" className="w-full h-10 object-cover rounded-lg" />
                              <span className="block text-[8px] font-bold text-gray-800 truncate mt-0.5">Gula Semut</span>
                              <span className="block text-[8px] font-extrabold text-[#2DB24A]">Rp 25.000</span>
                            </div>
                            <div>
                              <img src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=150&q=80" alt="" className="w-full h-10 object-cover rounded-lg" />
                              <span className="block text-[8px] font-bold text-gray-800 truncate mt-0.5">Kopi Robusta</span>
                              <span className="block text-[8px] font-extrabold text-[#2DB24A]">Rp 35.000</span>
                            </div>
                            <div>
                              <img src="https://images.unsplash.com/photo-1587049352847-4a222e784d38?auto=format&fit=crop&w=150&q=80" alt="" className="w-full h-10 object-cover rounded-lg" />
                              <span className="block text-[8px] font-bold text-gray-800 truncate mt-0.5">Madu Murni</span>
                              <span className="block text-[8px] font-extrabold text-[#2DB24A]">Rp 60.000</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                </div>

              </div>

              {/* Right Sidebar Column (PREMIUM View) */}
              <div className="space-y-4">

                {/* Manfaat Bergabung Premium */}
                <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-3">
                  <h4 className="text-xs font-bold text-gray-900">Manfaat Bergabung Premium</h4>
                  <ul className="space-y-2 text-xs text-gray-600 font-medium">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2DB24A] shrink-0" />
                      <span>Akses semua fitur Free Community</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2DB24A] shrink-0" />
                      <span>Simpanan lengkap (Pokok, Wajib, Sukarela, Umroh, Qurban)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2DB24A] shrink-0" />
                      <span>Pendanaan merchant & potensi bagi hasil</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2DB24A] shrink-0" />
                      <span>SHU tahunan dan laporan keuangan</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2DB24A] shrink-0" />
                      <span>Hak suara dalam rapat koperasi</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2DB24A] shrink-0" />
                      <span>Event, edukasi & komunitas premium</span>
                    </li>
                  </ul>
                </div>

                {/* SHU Tahun Ini Card */}
                <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-gray-900">SHU Tahun Ini</h4>
                    <Link href="#" className="text-[10px] font-bold text-[#2DB24A] hover:underline">Lihat Detail</Link>
                  </div>

                  <div className="p-3.5 bg-gray-50 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#E8F8EE] text-[#2DB24A] flex items-center justify-center shrink-0">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-400 font-medium">Estimasi SHU</span>
                      <span className="block text-base font-extrabold text-[#2DB24A]">Rp 250.000</span>
                      <span className="block text-[9px] text-gray-500 mt-0.5">Akan dibagikan pada akhir tahun buku 2026</span>
                    </div>
                  </div>
                </div>

                {/* Informasi Legalitas Koperasi */}
                <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-3">
                  <h4 className="text-xs font-bold text-gray-900">Informasi Legalitas Koperasi</h4>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <Shield className="w-4 h-4 text-[#2DB24A] shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-[9px] text-gray-400">Tipe Komunitas</span>
                        <span className="block font-bold text-gray-800 text-[11px]">{community.type === 'KOPERASI' ? 'Koperasi Produksi (Berbayar)' : 'Perkumpulan (Berbayar)'}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Shield className="w-4 h-4 text-[#2DB24A] shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-[9px] text-gray-400">Akta Notaris</span>
                        <span className="block font-semibold text-gray-800 text-[11px] font-mono">{community.aktaNotaris || 'Akta Notaris Koperasi No. 98 Tgl 01 Februari 2025'}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-[#2DB24A] shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-[9px] text-gray-400">Nomor AHU</span>
                        <span className="block font-semibold text-gray-800 text-[11px] font-mono">{community.nomorAhu || 'AHU-KOP-0029311.AH.01.11'}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-[#2DB24A] shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-[9px] text-gray-400">NPWP Organisasi</span>
                        <span className="block font-semibold text-gray-800 text-[11px] font-mono">{community.nomorNpwp || '12.987.654.3-012.000'}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-[#2DB24A] shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-[9px] text-gray-400">Domisili Kantor</span>
                        <span className="block font-semibold text-gray-800 text-[11px]">{community.domisili || 'Sleman, DIY'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Investment Banner Promo Card */}
                <div className="p-5 bg-gradient-to-b from-[#E8F8EE] to-[#d3f4de] border border-[#2DB24A]/30 rounded-2xl shadow-sm text-center space-y-3 relative overflow-hidden">
                  <div className="w-20 h-20 mx-auto relative">
                    <img 
                      src="https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=200&q=80" 
                      alt="Investment" 
                      className="w-full h-full object-cover rounded-full shadow-md border-2 border-white"
                    />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-gray-900">Investasi kecil, dampak besar untuk kita semua</h4>
                    <p className="text-[10px] text-gray-600 mt-1 leading-relaxed">
                      Bersama membangun ekonomi anggota yang mandiri dan sejahtera.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (merchantProjects.length > 0) {
                        setSelectedProject(merchantProjects[0])
                        setInvestModalOpen(true)
                      }
                    }}
                    className="w-full py-2.5 bg-[#2DB24A] hover:bg-[#228e3b] text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1"
                  >
                    <span>Mulai Pendanaan Sekarang</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

              </div>

            </div>

          </div>
        )}

      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ── MODALS (LOAN, PAYMENT, EDIT, INVESTMENT) ────────────────────── */}
      {/* ─────────────────────────────────────────────────────────────────── */}

      {/* ── INVESTMENT MODAL ────────────────────────────────────────────── */}
      <AnimatePresence>
        {investModalOpen && selectedProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md border border-gray-100 bg-white p-6 rounded-3xl shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <div>
                  <h3 className="font-sora text-sm font-bold text-gray-900">
                    Pendanaan Merchant
                  </h3>
                  <span className="text-[10px] text-gray-400">{selectedProject.title}</span>
                </div>
                <button onClick={() => setInvestModalOpen(false)} className="text-gray-400 hover:text-gray-700 text-sm font-bold">✕</button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
                  <span className="text-gray-500">Target Dana:</span>
                  <span className="font-bold text-gray-900">Rp {selectedProject.target.toLocaleString('id-ID')}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
                  <span className="text-gray-500">Minimal Pendanaan:</span>
                  <span className="font-bold text-[#2DB24A]">Rp {selectedProject.minInvest.toLocaleString('id-ID')}</span>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Masukkan Jumlah Pendanaan (Rp)</label>
                  <input
                    type="number"
                    value={investAmount}
                    onChange={(e) => setInvestAmount(e.target.value)}
                    min={selectedProject.minInvest}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-[#2DB24A]"
                  />
                </div>

                <button
                  onClick={() => {
                    goeyToast.success(`Berhasil berinvestasi Rp ${Number(investAmount).toLocaleString('id-ID')} di ${selectedProject.title}!`)
                    setInvestModalOpen(false)
                  }}
                  className="w-full py-3 bg-[#2DB24A] hover:bg-[#228e3b] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all"
                >
                  Konfirmasi Investasi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── PAYMENT MODAL (Simulated Midtrans/Saloka QRIS) ──────────────── */}
      <AnimatePresence>
        {paymentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md border border-gray-100 bg-white p-6 rounded-3xl shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="font-sora text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Pembayaran Upgrade Premium Koperasi
                </h3>
                <button onClick={() => setPaymentModalOpen(false)} className="text-gray-400 hover:text-gray-700 text-sm font-bold">✕</button>
              </div>

              {paymentSuccess ? (
                <div className="p-6 text-center space-y-2">
                  <div className="w-12 h-12 bg-[#E8F8EE] border border-[#2DB24A]/20 rounded-full flex items-center justify-center text-[#2DB24A] mx-auto text-xl font-bold">✓</div>
                  <h4 className="font-bold text-gray-900 text-sm">Pembayaran Sukses!</h4>
                  <p className="text-xs text-gray-500">Selamat! Status keanggotaan Anda kini resmi menjadi PREMIUM.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <span className="text-xs font-bold text-gray-800">Biaya Simpanan Pokok & Upgrade</span>
                    <span className="text-sm font-extrabold text-[#2DB24A]">Rp {community.joinFee ? community.joinFee.toLocaleString('id-ID') : '150.000'}</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setPaymentMethod('QRIS')}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                        paymentMethod === 'QRIS'
                          ? 'bg-[#E8F8EE] border-[#2DB24A] text-[#2DB24A]'
                          : 'bg-gray-50 border-gray-200 text-gray-500'
                      }`}
                    >
                      QRIS Auto-Verify
                    </button>
                    <button
                      onClick={() => setPaymentMethod('BANK')}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                        paymentMethod === 'BANK'
                          ? 'bg-[#E8F8EE] border-[#2DB24A] text-[#2DB24A]'
                          : 'bg-gray-50 border-gray-200 text-gray-500'
                      }`}
                    >
                      Transfer Bank Saloka
                    </button>
                  </div>

                  {paymentMethod === 'QRIS' ? (
                    <div className="flex flex-col items-center py-5 bg-white rounded-2xl border border-gray-100">
                      <svg width="110" height="110" viewBox="0 0 24 24" fill="none" className="text-gray-900">
                        <rect width="24" height="24" fill="white" />
                        <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm1 1h2v2H5V5zm9-3h8v8h-8V2zm2 2v4h4V4h-4zm1 1h2v2h-2V5zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm1 1h2v2H5v-2zm12-3h2v2h-2v-2zm2 2h2v2h-2v-2zm-2 2h2v2h-2v-2zm-2-2h2v2h-2v-2zm0 4h2v2h-2v-2zm4 0h2v2h-2v-2zm-8-4h2v2H9v-2zm2 2h2v2h-2v-2zm2-2h2v2h-2v-2z" fill="currentColor" />
                        <rect x="9.5" y="9.5" width="5" height="5" fill="#2DB24A" />
                      </svg>
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-2">Saloka Instant QRIS Verification</span>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl space-y-1 text-center">
                      <span className="text-[10px] text-gray-400 block font-bold">Kirim ke Rekening Bersama Saloka:</span>
                      <span className="text-sm font-black text-gray-900 block font-mono">BCA: 712-094-1182</span>
                      <span className="text-[9px] text-gray-500 block">a/n PT Saloka Digital Indonesia</span>
                    </div>
                  )}

                  <button
                    onClick={handleConfirmPayment}
                    disabled={isVerifying}
                    className="w-full py-3 bg-[#2DB24A] hover:bg-[#228e3b] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-md"
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

      {/* ── EDIT COMMUNITY LANDING PAGE MODAL ────────────────────────────────── */}
      <AnimatePresence>
        {editModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl border border-gray-100 bg-white p-6 rounded-3xl shadow-2xl space-y-4 my-8"
            >
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="font-sora text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Edit Landing Page & Profil Komunitas
                </h3>
                <button onClick={() => setEditModalOpen(false)} className="text-gray-400 hover:text-gray-700 text-sm font-bold">✕</button>
              </div>

              {editError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-semibold">{editError}</div>
              )}
              {editSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-600 font-semibold">{editSuccess}</div>
              )}

              <form onSubmit={handleEditSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nama Komunitas</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#2DB24A]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Link Grup WhatsApp</label>
                    <input
                      type="url"
                      value={editWaGroupLink}
                      onChange={(e) => setEditWaGroupLink(e.target.value)}
                      placeholder="https://chat.whatsapp.com/..."
                      className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#2DB24A]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Deskripsi Komunitas</label>
                  <textarea
                    required
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#2DB24A] resize-none"
                  />
                </div>

                <div className="border-t border-gray-100 pt-3 space-y-3">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Legalitas & Kantor</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={editAkta}
                      onChange={(e) => setEditAkta(e.target.value)}
                      placeholder="Akta Notaris"
                      className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
                    />
                    <input
                      type="text"
                      value={editAhu}
                      onChange={(e) => setEditAhu(e.target.value)}
                      placeholder="Nomor AHU"
                      className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
                    />
                    <input
                      type="text"
                      value={editNpwp}
                      onChange={(e) => setEditNpwp(e.target.value)}
                      placeholder="NPWP Organisasi"
                      className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
                    />
                    <input
                      type="text"
                      value={editDomisili}
                      onChange={(e) => setEditDomisili(e.target.value)}
                      placeholder="Domisili Kantor"
                      className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="flex-1 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs uppercase tracking-wider rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={actionPending}
                    className="flex-1 py-2.5 bg-[#2DB24A] hover:bg-[#228e3b] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md"
                  >
                    {actionPending ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* MODAL CRUD: TAMBAH / EDIT PRODUK SIMPANAN KOPERASI */}
        {productModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-100"
            >
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-sora text-sm font-bold text-gray-900">
                  {editingProduct ? 'Edit Produk Simpanan' : 'Tambah Produk Simpanan Baru'}
                </h3>
                <button onClick={() => setProductModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault()
                startTransition(async () => {
                  const fd = new FormData()
                  if (editingProduct) fd.append('id', editingProduct.id)
                  fd.append('communityId', id)
                  fd.append('name', prodName)
                  fd.append('type', prodType)
                  fd.append('amount', prodAmount)
                  fd.append('periodText', prodPeriod)
                  fd.append('isMandatory', String(prodIsMandatory))
                  fd.append('isPremium', String(prodIsPremium))
                  fd.append('description', prodDesc)

                  if (editingProduct) {
                    const res = await updateCooperativeProductAction(fd)
                    if (res.success && res.product) {
                      setCoopProducts(prev => prev.map(p => p.id === res.product.id ? res.product : p))
                      setProductModalOpen(false)
                      goeyToast.success('Produk simpanan berhasil diperbarui!')
                    } else {
                      alert(res.error || 'Gagal mengubah produk simpanan.')
                    }
                  } else {
                    const res = await createCooperativeProductAction(fd)
                    if (res.success && res.product) {
                      setCoopProducts(prev => [...prev, res.product])
                      setProductModalOpen(false)
                      goeyToast.success('Produk simpanan berhasil ditambahkan!')
                    } else {
                      alert(res.error || 'Gagal menambahkan produk simpanan.')
                    }
                  }
                })
              }} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Nama Produk Simpanan *</label>
                  <input type="text" required value={prodName} onChange={e => setProdName(e.target.value)} placeholder="e.g. Simpanan Sukarela Suka-Suka" className="w-full border rounded-xl px-3 py-2 text-xs" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Tipe Simpanan</label>
                    <select value={prodType} onChange={e => setProdType(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-xs">
                      <option value="POKOK">Simpanan Pokok</option>
                      <option value="WAJIB">Simpanan Wajib</option>
                      <option value="SUKARELA">Simpanan Sukarela</option>
                      {activeMode !== 'FREE' ? (
                        <>
                          <option value="UMROH">Simpanan Umroh (Premium)</option>
                          <option value="QURBAN">Simpanan Qurban (Premium)</option>
                          <option value="OTHER">Lain-lain (Premium)</option>
                        </>
                      ) : (
                        <>
                          <option value="LOCKED_UMROH" disabled>🔒 Simpanan Umroh (Perlu Upgrade Premium)</option>
                          <option value="LOCKED_QURBAN" disabled>🔒 Simpanan Qurban (Perlu Upgrade Premium)</option>
                          <option value="LOCKED_OTHER" disabled>🔒 Lain-lain (Perlu Upgrade Premium)</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Nominal (Rp) *</label>
                    <input type="number" required value={prodAmount} onChange={e => setProdAmount(e.target.value)} placeholder="100000" className="w-full border rounded-xl px-3 py-2 text-xs font-mono font-bold" />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Keterangan Periode (Teks Short)</label>
                  <input type="text" value={prodPeriod} onChange={e => setProdPeriod(e.target.value)} placeholder="e.g. Setor Kapan Saja / Per Bulan" className="w-full border rounded-xl px-3 py-2 text-xs" />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Deskripsi Produk Simpanan</label>
                  <textarea rows={2} value={prodDesc} onChange={e => setProdDesc(e.target.value)} placeholder="Tuliskan rincian atau ketentuan simpanan ini..." className="w-full border rounded-xl px-3 py-2 text-xs" />
                </div>

                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={prodIsMandatory} onChange={e => setProdIsMandatory(e.target.checked)} className="rounded text-[#2DB24A]" />
                    <span className="font-bold text-gray-700">Wajib untuk Anggota</span>
                  </label>
                  <label className={`flex items-center gap-2 ${activeMode === 'FREE' ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      disabled={activeMode === 'FREE'}
                      checked={prodIsPremium}
                      onChange={e => {
                        const isPrem = e.target.checked
                        setProdIsPremium(isPrem)
                        if (!isPrem && ['UMROH', 'QURBAN', 'OTHER'].includes(prodType)) {
                          setProdType('SUKARELA')
                        }
                      }}
                      className="rounded text-[#2DB24A]"
                    />
                    <span className="font-bold text-gray-700">
                      Fitur Premium {activeMode === 'FREE' && '🔒'}
                    </span>
                  </label>
                </div>

                {activeMode === 'FREE' && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-amber-800">
                      <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Simpanan Premium Terkunci</span>
                    </div>
                    <p className="text-[11px] text-amber-700 leading-relaxed">
                      Anda berada dalam tampilan Free. Upgrade ke Koperasi Premium untuk menambah Simpanan Umroh, Qurban, dan fitur investasi lanjutan.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setProductModalOpen(false)
                        setPaymentModalOpen(true)
                      }}
                      className="w-full py-1.5 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-bold text-[11px] rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Crown className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                      Upgrade Ke Premium Sekarang
                    </button>
                  </div>
                )}

                <div className="flex gap-2 pt-3">
                  <button type="button" onClick={() => setProductModalOpen(false)} className="flex-1 py-2.5 border rounded-xl font-bold">Batal</button>
                  <button type="submit" disabled={actionPending} className="flex-1 py-2.5 bg-[#0F5132] text-white font-bold rounded-xl">
                    {actionPending ? 'Menyimpan...' : (editingProduct ? 'Simpan Perubahan' : 'Simpan Produk')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* MODAL CRUD: TAMBAH PROYEK PENDANAAN MERCHANT */}
        {projectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-100"
            >
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-sora text-sm font-bold text-gray-900">Buka Proyek Pendanaan Merchant</h3>
                <button onClick={() => setProjectModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault()
                startTransition(async () => {
                  const fd = new FormData()
                  fd.append('communityId', id)
                  fd.append('title', projTitle)
                  fd.append('targetAmount', projTarget)
                  fd.append('minInvestment', projMinInvest)
                  fd.append('estimatedReturn', projReturn)
                  fd.append('durationMonths', projDuration)
                  fd.append('description', projDesc)

                  const res = await createMerchantFundingProjectAction(fd)
                  if (res.success && res.project) {
                    setFundingProjects(prev => [res.project, ...prev])
                    setProjectModalOpen(false)
                    setProjTitle('')
                    goeyToast.success('Proyek pendanaan berhasil dibuka!')
                  } else {
                    alert(res.error || 'Gagal membuka proyek pendanaan.')
                  }
                })
              }} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Judul Proyek Pendanaan *</label>
                  <input type="text" required value={projTitle} onChange={e => setProjTitle(e.target.value)} placeholder="e.g. Pengadaan Bahan Baku Kuliner Jogja" className="w-full border rounded-xl px-3 py-2 text-xs" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Target Dana (Rp) *</label>
                    <input type="number" required value={projTarget} onChange={e => setProjTarget(e.target.value)} placeholder="50000000" className="w-full border rounded-xl px-3 py-2 text-xs font-mono font-bold" />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Minimal Investasi (Rp)</label>
                    <input type="number" value={projMinInvest} onChange={e => setProjMinInvest(e.target.value)} placeholder="100000" className="w-full border rounded-xl px-3 py-2 text-xs font-mono" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Bagi Hasil (% p.a.)</label>
                    <input type="number" step="0.1" value={projReturn} onChange={e => setProjReturn(e.target.value)} placeholder="12.0" className="w-full border rounded-xl px-3 py-2 text-xs font-bold" />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Tenor (Bulan)</label>
                    <input type="number" value={projDuration} onChange={e => setProjDuration(e.target.value)} placeholder="6" className="w-full border rounded-xl px-3 py-2 text-xs" />
                  </div>
                </div>

                <div className="flex gap-2 pt-3">
                  <button type="button" onClick={() => setProjectModalOpen(false)} className="flex-1 py-2.5 border rounded-xl font-bold">Batal</button>
                  <button type="submit" disabled={actionPending} className="flex-1 py-2.5 bg-[#0F5132] text-white font-bold rounded-xl">{actionPending ? 'Membuka...' : 'Buka Proyek'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
