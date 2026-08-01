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
  Plus,
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
  Trash2,
  QrCode,
  Megaphone,
  Image as ImageIcon,
  Utensils,
  ChefHat,
  Handshake,
  BookOpen,
  Trophy,
  Rocket,
  Truck,
  Tag,
  Landmark,
  Activity,
  ShoppingBag,
  Sliders
} from 'lucide-react'

const SailboatIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 21h20" />
    <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4a11.6 11.6 0 0 0 1.62 6" fill="currentColor" fillOpacity="0.2" />
    <path d="M12 3v11" />
    <path d="M12 3 4.5 14h15L12 3z" fill="currentColor" fillOpacity="0.3" />
  </svg>
)

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

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus produk simpanan ini?')) return
    startTransition(async () => {
      const res = await deleteCooperativeProductAction(productId, id)
      if (res.success) {
        setCoopProducts(prev => prev.filter(p => p.id !== productId))
        goeyToast.success('Produk simpanan berhasil dihapus!')
      } else {
        alert(res.error || 'Gagal menghapus produk simpanan.')
      }
    })
  }

  // Funding Project CRUD Modal State
  const [projectModalOpen, setProjectModalOpen] = useState(false)
  const [projTitle, setProjTitle] = useState('')
  const [projTarget, setProjTarget] = useState('50000000')
  const [projMinInvest, setProjMinInvest] = useState('100000')
  const [projReturn, setProjReturn] = useState('12')
  const [projDuration, setProjDuration] = useState('6')
  const [projDesc, setProjDesc] = useState('')
  const [projImageUrl, setProjImageUrl] = useState('')

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
  const [investPaymentMethod, setInvestPaymentMethod] = useState<'SALDO' | 'QRIS' | 'BANK'>('QRIS')
  const [disabledModules, setDisabledModules] = useState<string[]>([])
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [savedDisabledModules, setSavedDisabledModules] = useState<string[]>([])
  const [showUnsavedModal, setShowUnsavedModal] = useState(false)
  const [pendingTargetNav, setPendingTargetNav] = useState<string | null>(null)

  // Payment states for Koperasi Upgrade/Join
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'QRIS' | 'BANK'>('QRIS')
  const [isVerifying, setIsVerifying] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  // Setor Simpanan Modal & Interactive Transactions State
  const [userBalance, setUserBalance] = useState(0)
  const [paySavingsModalOpen, setPaySavingsModalOpen] = useState(false)
  const [selectedSavingsProduct, setSelectedSavingsProduct] = useState<any>(null)
  const [depositAmount, setDepositAmount] = useState('')
  const [depositPaymentMethod, setDepositPaymentMethod] = useState<'SALDO' | 'QRIS' | 'BANK'>('QRIS')
  const [shuDetailModalOpen, setShuDetailModalOpen] = useState(false)

  // Perahu Kita Perkumpulan navigation & filter states
  const [activeSidebarNav, setActiveSidebarNav] = useState<
    | 'beranda'
    | 'aktivitas'
    | 'diskusi'
    | 'event'
    | 'marketplace'
    | 'anggota'
    | 'galeri'
    | 'pengumuman'
    | 'tentang'
    | 'business_matching'
    | 'pelatihan'
    | 'mentor'
    | 'kolaborasi'
    | 'kelas'
    | 'kompetisi'
    | 'startup'
    | 'merchant'
    | 'supplier'
    | 'promo'
    | 'simpanan'
    | 'pendanaan'
    | 'shu'
    | 'laporan'
    | 'pengaturan'
  >('beranda')
  
  useEffect(() => {
    if (disabledModules.includes(activeSidebarNav)) {
      setActiveSidebarNav('beranda')
    }
  }, [disabledModules, activeSidebarNav])
  const [feedFilter, setFeedFilter] = useState<'semua' | 'diskusi' | 'pengumuman' | 'event' | 'produk'>('semua')

  const [recentTransactions, setRecentTransactions] = useState<any[]>([
    {
      id: 'tx-1',
      date: '23 Jul 2026',
      title: 'Setor Simpanan Wajib',
      amount: 50000,
      status: 'Berhasil',
      type: 'WAJIB',
      isIncome: true
    },
    {
      id: 'tx-2',
      date: '20 Jul 2026',
      title: 'Setor Simpanan Pokok',
      amount: 150000,
      status: 'Berhasil',
      type: 'POKOK',
      isIncome: true
    },
    {
      id: 'tx-3',
      date: '15 Jul 2026',
      title: 'Pendaftaran Anggota Koperasi',
      amount: 0,
      status: 'Berhasil',
      type: 'MEMBERSHIP',
      isIncome: true
    }
  ])

  const handleOpenPaySavings = (cp: any) => {
    setSelectedSavingsProduct(cp)
    const targetAmt = Number(cp.amount || 50000)
    setDepositAmount(String(targetAmt))
    // If user balance is 0 or less than target amount, auto select QRIS for instant payment!
    if (userBalance >= targetAmt) {
      setDepositPaymentMethod('SALDO')
    } else {
      setDepositPaymentMethod('QRIS')
    }
    setPaySavingsModalOpen(true)
  }

  const handleConfirmDeposit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSavingsProduct) return
    const amt = Number(depositAmount) || 0
    if (amt <= 0) {
      goeyToast.error('Nominal setoran tidak valid.')
      return
    }

    if (depositPaymentMethod === 'SALDO' && amt > userBalance) {
      goeyToast.error(`Saldo Wallet Anda tidak cukup! (Sisa Saldo: Rp ${userBalance.toLocaleString('id-ID')})`)
      return
    }

    startTransition(async () => {
      if (depositPaymentMethod === 'SALDO') {
        setUserBalance(prev => prev - amt)
      }

      const now = new Date()
      const timeStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ', ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      const newTx = {
        id: `tx-${Date.now()}`,
        date: timeStr,
        title: `Setor ${selectedSavingsProduct.name}`,
        amount: amt,
        status: 'Berhasil',
        type: selectedSavingsProduct.type,
        isIncome: true
      }

      setRecentTransactions(prev => [newTx, ...prev])
      setRealStats(prev => ({
        ...prev,
        totalSavingsCollected: (prev.totalSavingsCollected || 0) + amt
      }))

      // Recalculate personal SHU Jasa Modal dynamically
      setUserShu((prev: any) => {
        const newSimpanan = (prev?.simpananMember || 0) + amt
        const totalSavings = (realStats.totalSavingsCollected || 0) + amt
        const netProfit = shuConfig?.totalNetProfit || 500000000
        const poolJasaModal = (netProfit * (shuConfig?.pctJasaModal || 20)) / 100
        const newJasaModal = totalSavings > 0 ? (newSimpanan / totalSavings) * poolJasaModal : 0
        const jasaUsaha = prev?.shuJasaUsahaAmount || 420000

        return {
          ...prev,
          simpananMember: newSimpanan,
          shuJasaModalAmount: newJasaModal,
          shuJasaUsahaAmount: jasaUsaha,
          totalShuAmount: newJasaModal + jasaUsaha
        }
      })

      goeyToast.success(`Setor ${selectedSavingsProduct.name} sebesar Rp ${amt.toLocaleString('id-ID')} berhasil disetor!`)
      setPaySavingsModalOpen(false)
    })
  }

  const [loading, setLoading] = useState(true)
  const [actionPending, startTransition] = useTransition()

  // Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    confirmText: string
    variant?: 'danger' | 'success' | 'warning'
    onConfirm: () => void | Promise<void>
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Konfirmasi',
    variant: 'danger',
    onConfirm: () => { }
  })

  const askConfirmation = (opts: {
    title: string
    message: string
    confirmText?: string
    variant?: 'danger' | 'success' | 'warning'
    onConfirm: () => void | Promise<void>
  }) => {
    setConfirmModal({
      isOpen: true,
      title: opts.title,
      message: opts.message,
      confirmText: opts.confirmText || 'Ya, Lanjutkan',
      variant: opts.variant || 'danger',
      onConfirm: opts.onConfirm
    })
  }

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
      const [
        currentUser,
        commDetailRes,
        memberListRes,
        allProductsRes,
        statsRes,
        cProductsRes,
        fProjectsRes,
        loanListRes,
        shuRes,
        userShuRes
      ] = await Promise.all([
        getCurrentUser().catch(() => null),
        getIndukCommunityDetail(id).catch(() => null),
        getIndukCommunityMembersAction(id).catch(() => []),
        getProducts().catch(() => []),
        getCommunityRealStatsAction(id).catch(() => null),
        getCooperativeProductsAction(id).catch(() => []),
        getMerchantFundingProjectsAction(id).catch(() => []),
        getCooperativeLoansAction(id).catch(() => []),
        getCommunityShuDataAction(id).catch(() => null),
        getUserShuSummaryAction(id).catch(() => null)
      ])

      setUser(currentUser)
      const userAny = currentUser as any
      if (userAny?.walletBalance !== undefined) {
        setUserBalance(userAny.walletBalance)
      } else if (userAny?.balance !== undefined) {
        setUserBalance(userAny.balance)
      }

      let commDetail = commDetailRes
      if (!commDetail) {
        commDetail = {
          id: id || 'comm-dummy-2',
          name: id?.includes('dummy-1') || id?.includes('perahu') ? 'Perahu Kita' : 'Koperasi Produksi Maju Bersama',
          type: id?.includes('dummy-1') || id?.includes('perahu') ? 'PERKUMPULAN' : 'KOPERASI',
          category: id?.includes('dummy-1') || id?.includes('perahu') ? 'FREE' : 'KOPERASI',
          description: id?.includes('dummy-1') || id?.includes('perahu')
            ? 'Wadah bagi pelaku usaha, UMKM, dan masyarakat untuk saling berbagi pengalaman, memperluas relasi dan menciptakan peluang bersama.'
            : 'Koperasi produksi resmi pelaku usaha mikro kecil dan menengah untuk pengadaan bahan baku bersama, fasilitasi permodalan modal produksi, dan bagi hasil usaha (SHU) untuk kesejahteraan anggota.',
          slogan: id?.includes('dummy-1') || id?.includes('perahu') ? 'Komunitas Kolaborasi, Belajar dan Berkembang Bersama' : undefined,
          aktaNotaris: id?.includes('dummy-1') || id?.includes('perahu') ? 'Akta Notaris Perkumpulan No. 25 Tgl 25 Juli 2026' : 'Akta Notaris Koperasi No. 98 Tgl 01 Februari 2025',
          nomorAhu: id?.includes('dummy-1') || id?.includes('perahu') ? 'AHU-00250726.AH.01.07' : 'AHU-KOP-0029311.AH.01.11',
          nomorNpwp: id?.includes('dummy-1') || id?.includes('perahu') ? '98.765.432.1-012.000' : '12.987.654.3-012.000',
          domisili: id?.includes('dummy-1') || id?.includes('perahu') ? 'Kota Yogyakarta, DIY' : 'Sleman, DIY',
          kontakPj: '081234567890',
          waGroupLink: 'https://chat.whatsapp.com/JdK8X4bY12eD5xG',
          avatarUrl: id?.includes('dummy-1') || id?.includes('perahu')
            ? 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=150&h=150&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=150&h=150&fit=crop&q=80',
          coverUrl: id?.includes('dummy-1') || id?.includes('perahu')
            ? 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&h=400&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=300&fit=crop&q=80',
          joinFee: 0,
          monthlyFee: 0,
          ketuaId: 'user-admin-1',
          ketua: { name: 'Super Admin Teras' },
          createdAt: new Date('2026-07-25')
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
      const memberList = memberListRes || []
      setMembers(memberList)

      // Check if logged in user is a member
      if (currentUser) {
        const mem = memberList.find((m: any) => m.userId === currentUser.id)
        if (mem || currentUser.id === commDetail?.ketuaId) {
          setIsMember(true)
          if (mem) {
            setIsIndukMember(mem.isInduk)
            setMembershipDetails(mem)
          }
        }
      }

      // Fetch products from members of this community or marketplace
      const memberIds = memberList.map((m: any) => m.userId)
      const allProducts = allProductsRes || []
      const communityProducts = allProducts.filter((p: any) => memberIds.includes(p.merchantId))
      setProducts(communityProducts.length > 0 ? communityProducts : (allProducts.length > 0 ? allProducts.slice(0, 4) : []))

      // Set cooperative loans
      setLoans(loanListRes || [])

      // Set real stats
      if (statsRes) {
        setRealStats(statsRes)
      }

      // Set cooperative products & funding projects
      setCoopProducts(cProductsRes || [])
      setFundingProjects(fProjectsRes || [])

      // Get disabled modules from landingPageConfig
      if (commDetailRes?.landingPageConfig) {
        try {
          const cfg = JSON.parse(commDetailRes.landingPageConfig)
          if (cfg?.disabledModules) {
            setDisabledModules(cfg.disabledModules)
            setSavedDisabledModules(cfg.disabledModules)
          } else {
            setDisabledModules([])
            setSavedDisabledModules([])
          }
        } catch (_) {
          setDisabledModules([])
          setSavedDisabledModules([])
        }
      } else {
        setDisabledModules([])
        setSavedDisabledModules([])
      }

      // Set SHU RAT data
      if (shuRes?.success && shuRes.config) {
        setShuConfig(shuRes.config)
      }
      if (userShuRes?.success && userShuRes.distributions) {
        setUserShu(userShuRes.distributions[0] || null)
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

  const handleToggleModule = (moduleId: string) => {
    setDisabledModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    )
  }

  const arraysEqual = (a: string[], b: string[]) => {
    if (a.length !== b.length) return false
    const sortedA = [...a].sort()
    const sortedB = [...b].sort()
    return sortedA.every((val, index) => val === sortedB[index])
  }

  const handleSidebarClick = (targetId: string) => {
    if (activeSidebarNav === 'pengaturan' && targetId !== 'pengaturan' && !arraysEqual(disabledModules, savedDisabledModules)) {
      setPendingTargetNav(targetId)
      setShowUnsavedModal(true)
    } else {
      setActiveSidebarNav(targetId as any)
    }
  }

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (activeSidebarNav === 'pengaturan' && !arraysEqual(disabledModules, savedDisabledModules)) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [disabledModules, savedDisabledModules, activeSidebarNav])

  const handleSaveSettings = async () => {
    if (!community) return
    setIsSavingSettings(true)
    try {
      const formData = new FormData()
      formData.append('name', community.name)
      formData.append('description', community.description || '')
      if (community.aktaNotaris) formData.append('aktaNotaris', community.aktaNotaris)
      if (community.nomorAhu) formData.append('nomorAhu', community.nomorAhu)
      if (community.nomorNpwp) formData.append('nomorNpwp', community.nomorNpwp)
      if (community.domisili) formData.append('domisili', community.domisili)
      if (community.kontakPj) formData.append('kontakPj', community.kontakPj)
      if (community.avatarUrl) formData.append('avatarUrl', community.avatarUrl)
      if (community.coverUrl) formData.append('coverUrl', community.coverUrl)
      if (community.waGroupLink) formData.append('waGroupLink', community.waGroupLink)
      formData.append('joinFee', String(community.joinFee || 0))
      formData.append('monthlyFee', String(community.monthlyFee || 0))

      // Update landingPageConfig
      let currentCfg: any = {}
      if (community.landingPageConfig) {
        try {
          currentCfg = JSON.parse(community.landingPageConfig)
        } catch (_) {}
      }
      currentCfg.disabledModules = disabledModules
      formData.append('landingPageConfig', JSON.stringify(currentCfg))

      const res = await updateIndukCommunity(community.id, formData)
      if (res.success) {
        goeyToast.success('Pengaturan fitur komunitas berhasil disimpan!')
        setSavedDisabledModules(disabledModules)
        if (res.community) {
          setCommunity(res.community)
        }
      } else {
        goeyToast.error(res.error || 'Gagal menyimpan pengaturan.')
      }
    } catch (e: any) {
      goeyToast.error('Gagal menyimpan pengaturan.')
    } finally {
      setIsSavingSettings(false)
    }
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
    askConfirmation({
      title: 'Setujui Pinjaman Modal',
      message: 'Apakah Anda yakin ingin menyetujui pengajuan pinjaman modal ini?',
      confirmText: 'Setujui',
      variant: 'success',
      onConfirm: async () => {
        const res = await approveCooperativeLoanAction(loanId, role)
        if (res.error) {
          goeyToast.error(res.error)
        } else {
          goeyToast.success('Pinjaman modal berhasil disetujui!')
          loadData()
        }
      }
    })
  }

  const handleRejectLoan = async (loanId: string, role: 'KETUA' | 'ADMIN') => {
    askConfirmation({
      title: 'Tolak Pinjaman Modal',
      message: 'Apakah Anda yakin ingin menolak pengajuan pinjaman modal ini?',
      confirmText: 'Tolak Pinjaman',
      variant: 'danger',
      onConfirm: async () => {
        const res = await rejectCooperativeLoanAction(loanId, role)
        if (res.error) {
          goeyToast.error(res.error)
        } else {
          goeyToast.success('Pinjaman modal berhasil ditolak.')
          loadData()
        }
      }
    })
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

  const nameLower = (community?.name || '').toLowerCase()
  const catLower = (community?.category || '').toLowerCase()
  const typeLower = (community?.type || '').toLowerCase()

  const isKoperasi = typeLower === 'koperasi' || catLower === 'koperasi' || nameLower.includes('koperasi')
  const isKuliner = !isKoperasi && (catLower === 'kuliner' || catLower === 'culinary' || nameLower.includes('kuliner'))
  const isBusiness = !isKoperasi && !isKuliner && (catLower === 'business' || nameLower.includes('kopjaswara') || nameLower.includes('bisnis') || nameLower.includes('umkm'))
  const isEducation = !isKoperasi && !isKuliner && !isBusiness && (catLower === 'education' || nameLower.includes('pelajar') || nameLower.includes('pengusaha') || nameLower.includes('pendidikan'))
  const isPerahu = !isKoperasi && !isKuliner && !isBusiness && !isEducation

  const bannerBadge = isKoperasi ? 'KOPERASI PRODUKSI' : isKuliner ? 'ASOSIASI KULINER' : isBusiness ? 'KOMUNITAS BISNIS & UMKM' : isEducation ? 'PENDIDIKAN & STARTUP' : 'KOMUNITAS UMUM'
  
  const bannerCover = community?.coverUrl || (
    isKuliner ? 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80' :
    isKoperasi ? 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80' :
    isBusiness ? 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80' :
    isEducation ? 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80' :
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80'
  )

  const bannerSlogan = community?.slogan || (
    isKuliner ? 'Bersama Memajukan Industri Kuliner Kreatif' :
    isKoperasi ? 'Membangun Ekonomi Bersama, Sejahtera untuk Anggota' :
    isBusiness ? 'Kolaborasi • Inovasi • Sejahtera Bersama Komunitas Bisnis & UMKM' :
    isEducation ? 'Belajar Bisnis Sejak Dini, Wujudkan Ide Jadi Nyata' :
    'Bersama Belajar, Berbagi dan Bertumbuh'
  )

  const bannerCta = isKoperasi ? 'Menjadi Anggota' : isKuliner ? 'Jelajahi Merchant' : isBusiness ? 'Ajukan Kolaborasi' : isEducation ? 'Daftar Kelas' : 'Gabung Komunitas'

  const statCards = isKoperasi ? [
    { label: 'Anggota', value: '788', icon: Users, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Total Simpanan', value: 'Rp 1,2 M', icon: Wallet, color: 'text-[#2DB24A] bg-[#E8F8EE]' },
    { label: 'SHU Tahun Ini', value: 'Rp 185 Jt', icon: PieChart, color: 'text-amber-600 bg-amber-50' },
    { label: 'Unit Usaha', value: '12', icon: Building2, color: 'text-blue-600 bg-blue-50' },
  ] : isBusiness ? [
    { label: 'Anggota', value: '2.156', icon: Users, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Mitra', value: '128', icon: Handshake, color: 'text-[#2DB24A] bg-[#E8F8EE]' },
    { label: 'Pelatihan', value: '36', icon: GraduationCap, color: 'text-amber-600 bg-amber-50' },
    { label: 'Peluang Usaha', value: '54', icon: Rocket, color: 'text-blue-600 bg-blue-50' },
  ] : isEducation ? [
    { label: 'Anggota', value: '1.532', icon: Users, color: 'text-purple-600 bg-purple-50' },
    { label: 'Kelas', value: '32', icon: BookOpen, color: 'text-[#2DB24A] bg-[#E8F8EE]' },
    { label: 'Kompetisi', value: '18', icon: Trophy, color: 'text-amber-600 bg-amber-50' },
    { label: 'Startup', value: '46', icon: Rocket, color: 'text-indigo-600 bg-indigo-50' },
  ] : isKuliner ? [
    { label: 'Merchant', value: '245', icon: Store, color: 'text-orange-600 bg-orange-50' },
    { label: 'Produk', value: '512', icon: ShoppingBag, color: 'text-[#2DB24A] bg-[#E8F8EE]' },
    { label: 'Supplier', value: '68', icon: Truck, color: 'text-amber-600 bg-amber-50' },
    { label: 'Event', value: '22', icon: Calendar, color: 'text-rose-600 bg-rose-50' },
  ] : [
    { label: 'Anggota', value: '1.248', icon: Users, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Diskusi', value: '156', icon: MessageSquare, color: 'text-[#2DB24A] bg-[#E8F8EE]' },
    { label: 'Event', value: '24', icon: Calendar, color: 'text-amber-600 bg-amber-50' },
    { label: 'Galeri', value: '87', icon: ImageIcon, color: 'text-indigo-600 bg-indigo-50' },
  ]

  const sidebarNavList = isKoperasi ? [
    { id: 'beranda', label: 'Beranda', icon: Home },
    { id: 'simpanan', label: 'Simpanan', icon: Wallet },
    { id: 'pendanaan', label: 'Pendanaan', icon: Landmark },
    { id: 'shu', label: 'SHU', icon: PieChart },
    { id: 'marketplace', label: 'Marketplace', icon: Store },
    { id: 'laporan', label: 'Laporan', icon: FileText },
    { id: 'anggota', label: 'Anggota', icon: Users },
    { id: 'pengumuman', label: 'Pengumuman', icon: Megaphone },
    { id: 'tentang', label: 'Tentang', icon: Info },
  ] : isBusiness ? [
    { id: 'beranda', label: 'Beranda', icon: Home },
    { id: 'business_matching', label: 'Business Matching', icon: Handshake },
    { id: 'pelatihan', label: 'Pelatihan', icon: GraduationCap },
    { id: 'mentor', label: 'Mentor', icon: Award },
    { id: 'kolaborasi', label: 'Kolaborasi', icon: Users },
    { id: 'marketplace', label: 'Produk UMKM', icon: Store },
    { id: 'anggota', label: 'Anggota', icon: Users },
    { id: 'event', label: 'Event', icon: Calendar },
    { id: 'pengumuman', label: 'Pengumuman', icon: Megaphone },
    { id: 'tentang', label: 'Tentang', icon: Info },
  ] : isEducation ? [
    { id: 'beranda', label: 'Beranda', icon: Home },
    { id: 'kelas', label: 'Kelas', icon: BookOpen },
    { id: 'mentor', label: 'Mentor', icon: Award },
    { id: 'kompetisi', label: 'Kompetisi', icon: Trophy },
    { id: 'startup', label: 'Startup', icon: Rocket },
    { id: 'event', label: 'Event', icon: Calendar },
    { id: 'diskusi', label: 'Diskusi', icon: MessageSquare },
    { id: 'pengumuman', label: 'Pengumuman', icon: Megaphone },
    { id: 'tentang', label: 'Tentang', icon: Info },
  ] : isKuliner ? [
    { id: 'beranda', label: 'Beranda', icon: Home },
    { id: 'merchant', label: 'Merchant', icon: Store },
    { id: 'marketplace', label: 'Produk', icon: ShoppingBag },
    { id: 'supplier', label: 'Supplier', icon: Truck },
    { id: 'event', label: 'Event', icon: Calendar },
    { id: 'galeri', label: 'Galeri', icon: ImageIcon },
    { id: 'anggota', label: 'Anggota', icon: Users },
    { id: 'promo', label: 'Promo', icon: Tag },
    { id: 'tentang', label: 'Tentang', icon: Info },
  ] : [
    { id: 'beranda', label: 'Beranda', icon: Home },
    { id: 'aktivitas', label: 'Aktivitas', icon: Activity },
    { id: 'diskusi', label: 'Diskusi', icon: MessageSquare },
    { id: 'event', label: 'Event', icon: Calendar },
    { id: 'galeri', label: 'Galeri', icon: ImageIcon },
    { id: 'anggota', label: 'Anggota', icon: Users },
    { id: 'marketplace', label: 'Produk Anggota', icon: Store },
    { id: 'pengumuman', label: 'Pengumuman', icon: Megaphone },
    { id: 'tentang', label: 'Tentang', icon: Info },
  ]

  const togglableModules = sidebarNavList.filter(
    (item) => item.id !== 'beranda' && item.id !== 'tentang' && item.id !== 'anggota'
  )

  const settingsTab = isCanManageCoop
    ? [{ id: 'pengaturan', label: 'Pengaturan', icon: Sliders }]
    : []

  const activeSidebarNavList = [
    ...sidebarNavList.filter((item) => !disabledModules.includes(item.id)),
    ...settingsTab
  ]

  const promoWidget = isKoperasi ? {
    icon: Building2,
    title: 'Menjadi Anggota',
    desc: 'Bergabung dan dapatkan manfaat koperasi bersama.',
    buttonText: 'Menjadi Anggota',
  } : isBusiness ? {
    icon: Handshake,
    title: 'Ajukan Kolaborasi',
    desc: 'Temukan peluang bisnis bersama anggota Kopjaswara.',
    buttonText: 'Ajukan Kolaborasi',
  } : isEducation ? {
    icon: GraduationCap,
    title: 'Daftar Kelas',
    desc: 'Tingkatkan skill dan wujudkan ide bisnismu sekarang!',
    buttonText: 'Daftar Kelas',
  } : isKuliner ? {
    icon: Utensils,
    title: 'Jelajahi Merchant',
    desc: 'Temukan kuliner terbaik dari anggota kami.',
    buttonText: 'Jelajahi Merchant',
  } : {
    icon: SailboatIcon,
    title: 'Gabung Komunitas',
    desc: 'Bersama lebih kuat, berbagi, belajar, dan bertumbuh.',
    buttonText: 'Gabung Komunitas',
  }

  const PromoIcon = promoWidget.icon

  const merchantAvatars = [
    { name: 'Super Admin Teras', initial: 'SU', bg: 'bg-emerald-100 text-emerald-800' },
    { name: 'rijal Merchant', initial: 'RI', bg: 'bg-[#E8F8EE] text-[#2DB24A]' },
    { name: 'saloka Merchant', initial: 'SA', bg: 'bg-[#E8F8EE] text-[#2DB24A]' },
  ]

  return (
    <div className="min-h-screen bg-[#F5F7F9] text-[#111827] pt-24 pb-20 px-3 md:px-8 font-sans">
      <div className="max-w-[1280px] mx-auto space-y-6">

        {/* ── 2-PANEL FLEX LAYOUT: UNIFIED SALOKA DESIGN SYSTEM FOR ALL 5 COMMUNITIES ── */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* ── LEFT SIDEBAR MENU PANEL ──────────────────────────────────────── */}
          <div className="w-full lg:w-60 shrink-0 space-y-4">
            <Link href="/community" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 font-semibold transition-colors">
              <ChevronLeft className="w-4 h-4" /> Kembali ke Komunitas
            </Link>

            <h2 className="text-xl font-black text-gray-900 font-sora px-1 tracking-tight">
              {community.name}
            </h2>

            {/* Sidebar Navigation Links (Diferensiasi Template Dinamis) */}
            <div className="space-y-1">
              {activeSidebarNavList.map((item) => {
                const Icon = item.icon
                const isActive = activeSidebarNav === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSidebarClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                      isActive
                        ? 'bg-[#E8F8EE] text-[#0F5132] shadow-xs'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#2DB24A]' : 'text-gray-400'}`} />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Bottom Green Promotional Card */}
            {!isMember && (
              <div className="p-4 bg-[#E8F8EE] border border-[#2DB24A]/25 rounded-2xl text-center space-y-3 shadow-xs">
                <div className="w-11 h-11 rounded-2xl bg-[#2DB24A] text-white flex items-center justify-center mx-auto shadow-sm">
                  <PromoIcon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-[#0F5132] text-xs">
                    {promoWidget.title}
                  </h4>
                  <p className="text-[10px] text-emerald-800/80 font-medium mt-1 leading-relaxed">
                    {promoWidget.desc}
                  </p>
                </div>
                <button
                  onClick={() => handleJoin()}
                  className="w-full py-2.5 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> {promoWidget.buttonText}
                </button>
              </div>
            )}
          </div>

          {/* ── RIGHT MAIN DASHBOARD CONTENT (DYNAMIC TABS) ────────────────────── */}
          <div className="flex-1 space-y-6 min-w-0 w-full">

            {/* TAB 1: BERANDA ─────────────────────────────────────────────────── */}
            {activeSidebarNav === 'beranda' && (
              <>
                {/* HERO BANNER CARD */}
                <div className="relative rounded-3xl overflow-hidden text-white shadow-sm border border-gray-200/60">
                  <img
                    src={bannerCover}
                    alt="Cover"
                    className="w-full h-64 md:h-72 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0F5132]/95 via-[#0F5132]/80 to-transparent p-6 md:p-8 flex flex-col justify-between">
                    <div>
                      <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md text-white font-extrabold text-[10px] uppercase tracking-wider rounded-full border border-white/30 mb-3 shadow-xs">
                        {bannerBadge}
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shrink-0">
                          <PromoIcon className="w-6 h-6" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black font-sora tracking-tight drop-shadow-sm">
                          {community.name}
                        </h1>
                      </div>
                      <p className="text-xs md:text-sm font-semibold text-emerald-100 mt-1">
                        {bannerSlogan}
                      </p>
                      <p className="text-xs text-emerald-100/90 max-w-xl mt-2 leading-relaxed line-clamp-2">
                        {community.description || "Wadah bagi pelaku usaha, UMKM, dan masyarakat untuk saling berbagi pengalaman, memperluas relasi dan menciptakan peluang bersama."}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-white/20 text-xs text-emerald-100 font-medium">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 font-semibold text-white">
                          <Shield className="w-4 h-4 text-emerald-300" />
                          Ketua: {community.ketua?.name || 'Super Admin Teras'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-emerald-300" />
                          Dibentuk {community.createdAt ? new Date(community.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '25 Juli 2026'}
                        </span>
                      </div>
                      {!isMember && (
                        <button
                          onClick={() => handleJoin()}
                          className="px-5 py-2.5 bg-white text-[#0F5132] hover:bg-emerald-50 font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <Users className="w-4 h-4" /> {bannerCta}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── 4 STAT METRIC CARDS BAR (MATCHING BLUEPRINT SYSTEM) ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  {statCards.map((stat, idx) => {
                    const StatIcon = stat.icon
                    return (
                      <div key={idx} className="p-4 bg-white border border-gray-200/80 rounded-2xl shadow-xs flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${stat.color}`}>
                          <StatIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-sm font-black text-gray-900 block leading-tight">{stat.value}</span>
                          <span className="text-[11px] text-gray-500 font-semibold block mt-0.5">{stat.label}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* PRODUK UNGGULAN ANGGOTA */}
                <div className="p-5 bg-white border border-gray-200/80 rounded-2xl shadow-xs space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" /> {isKuliner ? 'Menu Kuliner Unggulan Anggota' : isKoperasi ? 'Bahan Baku & Produk Koperasi' : 'Produk Unggulan Anggota'}
                      </h3>
                      <p className="text-[11px] text-gray-500 font-medium mt-0.5">Produk pilihan berkualitas karya terbaik dari UMKM & anggota {community.name}</p>
                    </div>
                    <button onClick={() => setActiveSidebarNav('marketplace')} className="text-xs font-bold text-[#2DB24A] hover:underline flex items-center gap-1 cursor-pointer">
                      Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 pt-1">
                    {products && products.length > 0 ? (
                      products.slice(0, 4).map((p, idx) => (
                        <div 
                          key={p.id || idx} 
                          onClick={() => router.push(`/cart`)}
                          className="p-3 bg-gray-50 border border-gray-100 rounded-xl space-y-2 group hover:border-[#2DB24A]/40 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            <div className="relative rounded-lg overflow-hidden h-28 bg-gray-100">
                              <img 
                                src={p.imageUrl || p.img || 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&h=200&fit=crop&q=80'} 
                                alt={p.name || p.title} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                              />
                              <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#2DB24A] text-white font-extrabold text-[9px] rounded-md uppercase tracking-wider shadow-xs">
                                {p.category || 'Unggulan'}
                              </span>
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-gray-900 group-hover:text-[#2DB24A] transition-colors line-clamp-1">{p.name || p.title}</h4>
                              <p className="text-[10px] text-gray-400 font-semibold">{p.merchant?.name || p.merchantName || p.merchant || 'Merchant Saloka'}</p>
                            </div>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-gray-200/60">
                            <span className="text-xs font-black text-[#0F5132]">Rp {Number(p.price || 0).toLocaleString('id-ID')}</span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation()
                                goeyToast.success(`"${p.name || p.title}" ditambahkan ke keranjang belanja!`)
                              }} 
                              className="px-2.5 py-1 bg-white border border-[#2DB24A] text-[#2DB24A] hover:bg-[#2DB24A] hover:text-white font-extrabold text-[10px] rounded-lg transition-all cursor-pointer"
                            >
                              Beli
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full p-8 text-center bg-gray-50 border border-dashed border-gray-200 rounded-2xl space-y-2">
                        <Store className="w-8 h-8 text-[#2DB24A] mx-auto opacity-70" />
                        <h4 className="text-xs font-bold text-gray-800">Belum Ada Produk Anggota</h4>
                        <p className="text-[11px] text-gray-500 max-w-sm mx-auto">Admin atau merchant anggota komunitas belum menambahkan produk. Klik tombol di bawah untuk menambah produk baru.</p>
                        <button onClick={() => setActiveSidebarNav('marketplace')} className="px-3.5 py-1.5 bg-[#2DB24A] text-white font-extrabold text-xs rounded-xl shadow-xs hover:bg-[#0F5132] transition-all cursor-pointer inline-flex items-center gap-1.5 mt-1">
                          <Plus className="w-3.5 h-3.5" /> Kelola Produk Anggota
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* PRODUK SIMPANAN / IURAN KEANGGOTAAN (HANYA UNTUK KOPERASI) */}
                {isKoperasi && (
                  <div className="p-5 bg-white border border-gray-200/80 rounded-2xl shadow-xs space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Wallet className="w-4 h-4 text-[#2DB24A]" /> Simpanan & Iuran Keanggotaan
                        </h3>
                        <p className="text-[11px] text-gray-500 font-medium mt-0.5">Iuran resmi anggota {community.name} untuk operasional dan pengembangan usaha bersama</p>
                      </div>
                      {isKoperasi && isCanManageCoop && (
                        <button
                          onClick={() => handleOpenCreateProduct(false)}
                          className="px-3 py-1.5 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer shrink-0 animate-pulse"
                        >
                          <Plus className="w-3.5 h-3.5" /> Tambah Baru
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      {coopProducts && coopProducts.length > 0 ? (
                        coopProducts.map((p: any, idx: number) => {
                          const Icon = p.type === 'POKOK' ? Home : p.type === 'WAJIB' ? Calendar : p.type === 'SUKARELA' ? PiggyBank : p.type === 'UMROH' ? Landmark : p.type === 'QURBAN' ? Award : Wallet
                          const priceText = p.type === 'SUKARELA' ? 'Bebas Nominal' : `Rp ${Number(p.amount || 0).toLocaleString('id-ID')}${p.periodText ? ` / ${p.periodText}` : ''}`
                          
                          return (
                            <div key={p.id || idx} className="p-4 bg-gray-50/80 border border-gray-200/80 rounded-xl space-y-3 flex flex-col justify-between hover:border-[#2DB24A]/40 transition-all">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-[#E8F8EE] text-[#2DB24A] flex items-center justify-center font-bold shrink-0">
                                    <Icon className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-gray-900">{p.name}</h4>
                                    <p className="text-[10px] text-gray-500 font-medium line-clamp-1">{p.description || '-'}</p>
                                    <span className="text-xs font-extrabold text-[#0F5132] block mt-0.5">{priceText}</span>
                                  </div>
                                </div>
                                {isKoperasi && isCanManageCoop && (
                                  <div className="flex items-center gap-1 text-[10px] shrink-0">
                                    <button onClick={() => handleOpenEditProduct(p)} className="text-gray-500 hover:text-[#2DB24A] font-bold cursor-pointer">Edit</button>
                                    <span className="text-gray-300">|</span>
                                    <button onClick={() => handleDeleteProduct(p.id)} className="text-gray-500 hover:text-red-500 font-bold cursor-pointer">Hapus</button>
                                  </div>
                                )}
                              </div>
                              <div className="pt-2 border-t border-gray-200/60 flex justify-end">
                                <button
                                  onClick={() => handleOpenPaySavings({ name: p.name, amount: p.amount || 50000, type: p.type })}
                                  className="px-3.5 py-1.5 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
                                >
                                  Setor
                                </button>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <p className="text-xs text-gray-500 col-span-full text-center">Belum ada iuran keanggotaan tersedia.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* 3-COLUMN DASHBOARD GRID */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-5 items-start">
                  <div className="md:col-span-1 lg:col-span-2 space-y-4">
                    <div className="p-5 bg-white border border-gray-200/80 rounded-2xl shadow-xs space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Tentang {community.name}</h3>
                        <button onClick={() => setActiveSidebarNav('tentang')} className="text-[10px] font-bold text-[#2DB24A] hover:underline cursor-pointer">Lihat Selengkapnya →</button>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed font-medium">
                        {community.name} adalah perkumpulan yang menghubungkan orang-orang dengan minat dan tujuan yang sama untuk belajar, berkolaborasi, dan berkembang bersama.
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {['Kolaborasi', 'Edukasi', 'Networking', 'Promosi Produk', 'Pengembangan Usaha'].map((tag) => (
                          <span key={tag} className="px-2.5 py-1 bg-gray-100 text-gray-600 font-semibold text-[10px] rounded-lg">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-5 bg-white border border-gray-200/80 rounded-2xl shadow-xs space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Anggota Aktif</h3>
                        <button onClick={() => setActiveSidebarNav('anggota')} className="text-[10px] font-bold text-[#2DB24A] hover:underline cursor-pointer">Lihat Semua</button>
                      </div>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {[
                          { name: 'Andi', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&q=80' },
                          { name: 'Siti', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&q=80' },
                          { name: 'Budi', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80' },
                          { name: 'Rina', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&q=80' },
                          { name: 'Dewi', img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&h=80&fit=crop&q=80' },
                        ].map((m, idx) => (
                          <div key={idx} className="flex flex-col items-center gap-1 shrink-0">
                            <img src={m.img} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-xs" />
                            <span className="text-[10px] font-medium text-gray-700">{m.name}</span>
                          </div>
                        ))}
                        <div className="flex flex-col items-center justify-center shrink-0">
                          <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 font-extrabold text-xs flex items-center justify-center border-2 border-white shadow-xs">
                            +123
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-[#E8F8EE] border border-[#2DB24A]/25 rounded-2xl space-y-2 text-center shadow-xs">
                      <div className="flex justify-center text-[#2DB24A]"><Users className="w-7 h-7" /></div>
                      <h4 className="font-extrabold text-xs text-[#0F5132]">Ajak Teman Bergabung</h4>
                      <p className="text-[10px] text-emerald-800/80 leading-relaxed font-medium">
                        Semakin banyak anggota, semakin besar peluang yang kita ciptakan bersama.
                      </p>
                      <button className="w-full py-2 bg-white border border-[#2DB24A] text-[#0F5132] font-bold text-xs rounded-xl hover:bg-[#2DB24A] hover:text-white transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer">
                        <Share2 className="w-3.5 h-3.5" /> Bagikan Komunitas
                      </button>
                    </div>
                  </div>

                  <div className="md:col-span-2 lg:col-span-3 space-y-4">
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {['Semua', 'Diskusi', 'Pengumuman', 'Event', 'Produk'].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setFeedFilter(tab.toLowerCase() as any)}
                          className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all shrink-0 cursor-pointer ${
                            feedFilter === tab.toLowerCase()
                              ? 'bg-[#2DB24A] text-white shadow-xs'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Aktivitas Terbaru</h3>

                    <div className="p-5 bg-white border border-gray-200/80 rounded-2xl shadow-xs space-y-3 hover:border-gray-300 transition-all">
                      <div className="flex justify-between items-start">
                        <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 font-extrabold text-[10px] rounded-md uppercase">
                          Pengumuman
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">2 jam lalu</span>
                      </div>
                      <h4 className="font-extrabold text-sm text-gray-900">
                        Workshop Digital Marketing untuk UMKM
                      </h4>
                      <p className="text-xs text-gray-600 leading-relaxed font-medium">
                        Mari tingkatkan penjualan produk lokal melalui strategi digital yang tepat. Terbuka untuk semua anggota {community.name}!
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500 font-semibold">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1 hover:text-gray-900 cursor-pointer">👍 24</span>
                          <span className="flex items-center gap-1 hover:text-gray-900 cursor-pointer">💬 12</span>
                        </div>
                        <button onClick={() => setActiveSidebarNav('pengumuman')} className="text-[11px] font-bold text-[#2DB24A] hover:underline cursor-pointer">Lihat Detail →</button>
                      </div>
                    </div>

                    <div className="p-5 bg-white border border-gray-200/80 rounded-2xl shadow-xs space-y-3 hover:border-gray-300 transition-all">
                      <div className="flex justify-between items-start">
                        <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 font-extrabold text-[10px] rounded-md uppercase">
                          Diskusi
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">5 jam lalu</span>
                      </div>
                      <h4 className="font-extrabold text-sm text-gray-900">
                        Bagaimana cara mendapatkan supplier kemasan ramah lingkungan?
                      </h4>
                      <p className="text-xs text-gray-600 leading-relaxed font-medium">
                        Saya sedang mencari rekomendasi supplier kemasan untuk produk makanan. Ada yang punya pengalaman?
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500 font-semibold">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1 hover:text-gray-900 cursor-pointer">👍 18</span>
                          <span className="flex items-center gap-1 hover:text-gray-900 cursor-pointer">💬 28</span>
                        </div>
                        <button onClick={() => setActiveSidebarNav('diskusi')} className="text-[11px] font-bold text-[#2DB24A] hover:underline cursor-pointer">Lihat Diskusi →</button>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-1 lg:col-span-2 space-y-4">
                    <div className="p-5 bg-white border border-gray-200/80 rounded-2xl shadow-xs space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Event Mendatang</h3>
                        <button onClick={() => setActiveSidebarNav('event')} className="text-[10px] font-bold text-[#2DB24A] hover:underline cursor-pointer">Lihat Semua</button>
                      </div>
                      <div className="space-y-2.5">
                        {[
                          { day: '30', month: 'JUL', title: 'Workshop Digital Marketing', desc: 'Online (Zoom)' },
                          { day: '12', month: 'AGS', title: 'Kopdar Perahu Kita', desc: 'Yogyakarta' },
                          { day: '25', month: 'AGS', title: 'Bazaar Produk Anggota', desc: 'Alun-Alun Kidul' },
                        ].map((ev, idx) => (
                          <div key={idx} className="flex items-center gap-2.5 p-2 bg-gray-50 rounded-xl">
                            <div className="w-11 h-11 rounded-xl bg-white border border-gray-200 text-center flex flex-col justify-center shrink-0">
                              <span className="text-xs font-black text-gray-900 leading-none">{ev.day}</span>
                              <span className="text-[9px] font-bold text-[#2DB24A] leading-none mt-0.5">{ev.month}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-[11px] font-bold text-gray-900 line-clamp-1">{ev.title}</h4>
                              <p className="text-[9px] text-gray-500 font-medium line-clamp-1">{ev.desc}</p>
                            </div>
                            <button onClick={() => setActiveSidebarNav('event')} className="px-2 py-1 bg-white border border-[#2DB24A] text-[#2DB24A] hover:bg-[#2DB24A] hover:text-white font-extrabold text-[10px] rounded-lg transition-colors cursor-pointer shrink-0">
                              Daftar
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-5 bg-white border border-gray-200/80 rounded-2xl shadow-xs space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Galeri Kegiatan</h3>
                        <button onClick={() => setActiveSidebarNav('galeri')} className="text-[10px] font-bold text-[#2DB24A] hover:underline cursor-pointer">Lihat Semua</button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&h=200&fit=crop&q=80',
                          'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=200&h=200&fit=crop&q=80',
                          'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=200&h=200&fit=crop&q=80',
                        ].map((imgUrl, idx) => (
                          <img key={idx} src={imgUrl} alt="" onClick={() => setActiveSidebarNav('galeri')} className="w-full h-16 rounded-xl object-cover border border-gray-100 hover:opacity-90 transition-opacity cursor-pointer" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* TAB 2: DISKUSI ─────────────────────────────────────────────────── */}
            {activeSidebarNav === 'diskusi' && (
              <div className="space-y-6">
                <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
                    <div>
                      <h2 className="text-xl font-black text-gray-900 font-sora flex items-center gap-2">
                        <MessageSquare className="w-6 h-6 text-[#2DB24A]" /> Forum Diskusi {community.name}
                      </h2>
                      <p className="text-xs text-gray-500 font-medium mt-1">Ruang bertukar pikiran, bertanya, berbagi pengalaman usaha, dan kolaborasi antar anggota.</p>
                    </div>
                    <button onClick={() => goeyToast.info('Tuliskan ide atau pertanyaan diskusi Anda.')} className="px-4 py-2.5 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer shrink-0">
                      <Plus className="w-4 h-4" /> Buat Topik Diskusi
                    </button>
                  </div>

                  <div className="space-y-3.5">
                    {[
                      { title: 'Bagaimana cara meningkatkan omzet produk UMKM melalui Instagram & TikTok Ads?', author: 'Siti Rahmawati', role: 'Merchant Kuliner', date: '2 jam lalu', category: 'Pemasaran', likes: 34, comments: 19, views: 142 },
                      { title: 'Rekomendasi Supplier Kemasan Ramah Lingkungan (Biodegradable) Wilayah Jogja', author: 'Budi Santoso', role: 'Craft Merchant', date: '5 jam lalu', category: 'Tanya Jawab', likes: 28, comments: 24, views: 198 },
                      { title: 'Panduan Lengkap Pendaftaran Sertifikat Halal Gratis (SEHATI) 2026', author: 'Super Admin Teras', role: 'Ketua Komunitas', date: '1 hari lalu', category: 'Edukasi & Bisnis', isPinned: true, likes: 89, comments: 45, views: 512 },
                      { title: 'Sharing Pengalaman Mengikuti Bazaar & Pameran Produk UMKM Tingkat Nasional', author: 'Rina Wijaya', role: 'Coffee Merchant', date: '2 hari lalu', category: 'Pengalaman', likes: 42, comments: 15, views: 230 },
                    ].map((thread, idx) => (
                      <div key={idx} className="p-5 bg-gray-50/70 border border-gray-100 hover:border-[#2DB24A]/30 hover:bg-white rounded-2xl shadow-xs transition-all space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            {thread.isPinned && <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 font-extrabold text-[10px] rounded-md">📌 TERPAKU</span>}
                            <span className="px-2.5 py-0.5 bg-[#E8F8EE] text-[#0F5132] font-extrabold text-[10px] rounded-md">{thread.category}</span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-semibold">{thread.date}</span>
                        </div>
                        <h3 className="text-sm font-extrabold text-gray-900 hover:text-[#2DB24A] transition-colors cursor-pointer">{thread.title}</h3>
                        <div className="flex flex-wrap justify-between items-center pt-2 border-t border-gray-200/60 text-xs text-gray-500 font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#2DB24A] text-white font-bold text-[10px] flex items-center justify-center">
                              {thread.author.charAt(0)}
                            </div>
                            <span className="font-bold text-gray-800 text-[11px]">{thread.author}</span>
                            <span className="text-[10px] text-gray-400">({thread.role})</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs font-semibold">
                            <span className="hover:text-gray-900 cursor-pointer">👍 {thread.likes}</span>
                            <span className="hover:text-gray-900 cursor-pointer">💬 {thread.comments} Komentar</span>
                            <span className="text-gray-400 text-[11px]">👁️ {thread.views}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: EVENT ────────────────────────────────────────────────────── */}
            {activeSidebarNav === 'event' && (
              <div className="space-y-6">
                <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-5">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 font-sora flex items-center gap-2">
                      <Calendar className="w-6 h-6 text-[#2DB24A]" /> Event & Agenda Kegiatan {community.name}
                    </h2>
                    <p className="text-xs text-gray-500 font-medium mt-1">Ikuti workshop, web seminar, bazaar UMKM, dan kegiatan kopdar rutin anggota.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { day: '30', month: 'JUL', year: '2026', title: 'Workshop Digital Marketing & Branding UMKM 2026', time: '10:00 - 12:00 WIB', location: 'Online via Zoom', speaker: 'Dr. Irvan Prasetya (Pakar Digital)', slots: '45/100 Terisi', status: 'Mendatang' },
                      { day: '12', month: 'AGS', year: '2026', title: 'Kopdar Rutin & Temu Jejaring Anggota Perahu Kita', time: '14:00 - 17:00 WIB', location: 'Kopi Teras Jogja, Jl. Kaliurang KM 7', speaker: 'Pengurus Perahu Kita', slots: '28/50 Terisi', status: 'Mendatang' },
                      { day: '25', month: 'AGS', year: '2026', title: 'Bazaar Kuliner & Produk Anggota UMKM Perahu Kita', time: '08:00 - 17:00 WIB', location: 'Alun-Alun Kidul, Yogyakarta', speaker: 'Terbuka Untuk Umum', slots: '15 Stand Tersisa', status: 'Mendatang' },
                      { day: '15', month: 'JUL', year: '2026', title: 'Pelatihan Pengemasan & Foto Produk Profesional', time: '09:00 - 15:00 WIB', location: 'Gedung PLUT KUMKM DIY', speaker: 'Tim Fotografi Teras', slots: 'Selesai (85 Peserta)', status: 'Selesai' },
                    ].map((ev, idx) => (
                      <div key={idx} className="p-5 bg-gray-50/70 border border-gray-200/80 rounded-2xl space-y-4 hover:border-[#2DB24A]/40 transition-all flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 text-center flex flex-col justify-center shadow-xs shrink-0">
                              <span className="text-base font-black text-gray-900 leading-none">{ev.day}</span>
                              <span className="text-[10px] font-bold text-[#2DB24A] leading-none mt-1 uppercase">{ev.month} {ev.year}</span>
                            </div>
                            <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md uppercase tracking-wider ${ev.status === 'Mendatang' ? 'bg-[#E8F8EE] text-[#0F5132]' : 'bg-gray-200 text-gray-600'}`}>
                              {ev.status}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-sm font-extrabold text-gray-900 leading-snug">{ev.title}</h3>
                            <p className="text-xs text-gray-500 font-medium mt-1">📍 {ev.location}</p>
                            <p className="text-xs text-gray-500 font-medium">🕒 {ev.time} • 👤 {ev.speaker}</p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-gray-200/60">
                          <span className="text-[11px] font-semibold text-gray-500">{ev.slots}</span>
                          <button onClick={() => goeyToast.success(`Pendaftaran event "${ev.title}" berhasil dicatat!`)} className="px-4 py-1.5 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer">
                            {ev.status === 'Mendatang' ? 'Daftar Event' : 'Lihat Dokumentasi'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: PRODUK ANGGOTA (MARKETPLACE) ─────────────────────────────── */}
            {activeSidebarNav === 'marketplace' && (
              <div className="space-y-6">
                <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-5">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
                    <div>
                      <h2 className="text-xl font-black text-gray-900 font-sora flex items-center gap-2">
                        <Store className="w-6 h-6 text-[#2DB24A]" /> Produk Anggota {community.name}
                      </h2>
                      <p className="text-xs text-gray-500 font-medium mt-1">Dukung produk lokal! Belanja langsung beragam produk berkualitas dari UMKM anggota.</p>
                    </div>
                    <Link href="/cart" className="px-4 py-2.5 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer shrink-0">
                      <Store className="w-4 h-4" /> Buka Marketplace Lengkap
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {products && products.length > 0 ? (
                      products.map((p: any, idx: number) => (
                        <div key={p.id || idx} className="p-4 bg-gray-50/70 border border-gray-200/80 rounded-2xl space-y-3 hover:border-[#2DB24A]/40 transition-all flex flex-col justify-between group">
                          <div className="space-y-2.5">
                            <div className="relative rounded-xl overflow-hidden h-36 bg-gray-100">
                              <img src={p.imageUrl || p.img || 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&h=200&fit=crop&q=80'} alt={p.name || p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              <span className="absolute top-2 left-2 px-2.5 py-0.5 bg-[#2DB24A] text-white font-extrabold text-[9px] rounded-md uppercase tracking-wider shadow-xs">
                                {p.category || 'Produk'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-400 font-semibold">{p.merchant?.name || p.merchantName || p.merchant || 'Merchant Saloka'}</span>
                              <h4 className="text-xs font-extrabold text-gray-900 group-hover:text-[#2DB24A] transition-colors line-clamp-2">{p.name || p.title}</h4>
                              <p className="text-[10px] text-amber-600 font-bold mt-0.5">⭐ 5.0 (Produk Terverifikasi)</p>
                            </div>
                          </div>
                          <div className="flex justify-between items-center pt-2.5 border-t border-gray-200/60">
                            <span className="text-sm font-black text-[#0F5132]">Rp {Number(p.price || 0).toLocaleString('id-ID')}</span>
                            <button onClick={() => goeyToast.success(`"${p.name || p.title}" ditambahkan ke keranjang belanja!`)} className="px-3 py-1.5 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer">
                              + Keranjang
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full p-10 text-center bg-gray-50 border border-dashed border-gray-200 rounded-3xl space-y-3">
                        <Store className="w-10 h-10 text-[#2DB24A] mx-auto opacity-70" />
                        <h4 className="text-sm font-extrabold text-gray-800">Belum Ada Katalog Produk Anggota</h4>
                        <p className="text-xs text-gray-500 max-w-md mx-auto">Admin atau merchant anggota komunitas belum menambahkan katalog produk. Silakan tambahkan produk baru untuk ditampilkan di marketplace ini.</p>
                        <button onClick={() => handleOpenCreateProduct(false)} className="px-4 py-2 bg-[#2DB24A] text-white font-extrabold text-xs rounded-xl shadow-xs hover:bg-[#0F5132] transition-all cursor-pointer inline-flex items-center gap-1.5">
                          <Plus className="w-4 h-4" /> Tambah Produk Baru
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: ANGGOTA ──────────────────────────────────────────────────── */}
            {activeSidebarNav === 'anggota' && (
              <div className="space-y-6">
                <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-5">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
                    <div>
                      <h2 className="text-xl font-black text-gray-900 font-sora flex items-center gap-2">
                        <Users className="w-6 h-6 text-[#2DB24A]" /> Direktori Anggota {community.name}
                      </h2>
                      <p className="text-xs text-gray-500 font-medium mt-1">Jejaring resmi pelaku UMKM, pemilik usaha, dan pengurus komunitas.</p>
                    </div>
                    <button onClick={() => handleJoin()} className="px-4 py-2 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0">
                      <Plus className="w-4 h-4" /> Undang Anggota Baru
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {members && members.length > 0 ? (
                      members.map((m: any, idx: number) => (
                        <div key={m.id || idx} className="p-4 bg-gray-50/70 border border-gray-200/80 rounded-2xl space-y-3 flex flex-col justify-between hover:border-[#2DB24A]/40 transition-all">
                          <div className="flex items-center gap-3">
                            <img src={m.user?.avatarUrl || m.img || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&q=80'} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs shrink-0" />
                            <div>
                              <span className={`px-2 py-0.5 font-extrabold text-[9px] rounded-md uppercase tracking-wider ${m.role === 'ADMIN' || m.role === 'KETUA' ? 'bg-amber-100 text-amber-800' : 'bg-[#E8F8EE] text-[#0F5132]'}`}>
                                {m.role || 'Anggota'}
                              </span>
                              <h4 className="text-xs font-black text-gray-900 mt-0.5">{m.user?.name || m.name || 'Anggota Saloka'}</h4>
                              <p className="text-[10px] text-gray-500 font-semibold">{m.user?.locationName || m.loc || 'DIY Yogyakarta'}</p>
                            </div>
                          </div>
                          <div className="pt-2 border-t border-gray-200/60 text-xs">
                            <p className="text-[11px] font-bold text-[#0F5132]">Usaha: {m.user?.storeName || m.biz || 'Merchant UMKM'}</p>
                            <button onClick={() => window.open(`https://wa.me/${(m.user?.phone || '6285223061670').replace(/[^0-9]/g, '')}`, '_blank')} className="w-full mt-2 py-1.5 bg-white border border-[#2DB24A] text-[#2DB24A] hover:bg-[#2DB24A] hover:text-white font-extrabold text-[10px] rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer">
                              💬 Hubungi WhatsApp
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full p-10 text-center bg-gray-50 border border-dashed border-gray-200 rounded-3xl space-y-3">
                        <Users className="w-10 h-10 text-[#2DB24A] mx-auto opacity-70" />
                        <h4 className="text-sm font-extrabold text-gray-800">Belum Ada Anggota Terdaftar</h4>
                        <p className="text-xs text-gray-500 max-w-md mx-auto">Komunitas ini belum memiliki daftar anggota terdaftar. Pengurus atau ketua dapat mengundang anggota baru.</p>
                        <button onClick={() => handleJoin()} className="px-4 py-2 bg-[#2DB24A] text-white font-extrabold text-xs rounded-xl shadow-xs hover:bg-[#0F5132] transition-all cursor-pointer inline-flex items-center gap-1.5">
                          <Plus className="w-4 h-4" /> Gabung Jadi Anggota Pertama
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: GALERI ──────────────────────────────────────────────────── */}
            {activeSidebarNav === 'galeri' && (
              <div className="space-y-6">
                <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-5">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 font-sora flex items-center gap-2">
                      <ImageIcon className="w-6 h-6 text-[#2DB24A]" /> Galeri Kegiatan {community.name}
                    </h2>
                    <p className="text-xs text-gray-500 font-medium mt-1">Dokumentasi momen kebersamaan, workshop, pelatihan, bazaar, dan kopdar anggota.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { title: 'Workshop Digital Marketing 2026', category: 'Workshop', img: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&h=300&fit=crop&q=80' },
                      { title: 'Kopdar Rutin Kaliurang', category: 'Kopdar', img: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=500&h=300&fit=crop&q=80' },
                      { title: 'Bazaar UMKM Alun-Alun Kidul', category: 'Bazaar', img: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=500&h=300&fit=crop&q=80' },
                      { title: 'Pelatihan Sertifikasi Halal Gratis', category: 'Workshop', img: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=500&h=300&fit=crop&q=80' },
                      { title: 'Penyerahan Sertifikat Komunitas', category: 'Kopdar', img: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=500&h=300&fit=crop&q=80' },
                      { title: 'Kunjungan Sentra Kerajinan Jogja', category: 'Kunjungan', img: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500&h=300&fit=crop&q=80' },
                    ].map((item, idx) => (
                      <div key={idx} className="group relative rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shadow-xs cursor-pointer">
                        <img src={item.img} alt={item.title} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 flex flex-col justify-end text-white">
                          <span className="px-2 py-0.5 bg-[#2DB24A] text-white font-extrabold text-[9px] rounded-md uppercase tracking-wider w-max mb-1">
                            {item.category}
                          </span>
                          <h4 className="text-xs font-bold leading-tight">{item.title}</h4>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: PENGUMUMAN ──────────────────────────────────────────────── */}
            {activeSidebarNav === 'pengumuman' && (
              <div className="space-y-6">
                <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-5">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 font-sora flex items-center gap-2">
                      <Megaphone className="w-6 h-6 text-[#2DB24A]" /> Pengumuman Resmi Komunitas
                    </h2>
                    <p className="text-xs text-gray-500 font-medium mt-1">Informasi penting, edaran resmi pengurus, serta pengumuman program kerja {community.name}.</p>
                  </div>

                  <div className="space-y-4">
                    {[
                      { title: 'Jadwal Rapat Anggota & Evaluasi Program Semester II 2026', date: '24 Juli 2026', sender: 'Pengurus Komunitas', content: 'Diberitahukan kepada seluruh anggota Perahu Kita bahwa Rapat Evaluasi Program Semester II akan dilaksanakan pada hari Sabtu, 15 Agustus 2026. Kehadiran seluruh anggota sangat diharapkan.', isPinned: true },
                      { title: 'Program Pendampingan Sertifikasi Halal Gratis Tahap 3', date: '18 Juli 2026', sender: 'Divisi Edukasi UMKM', content: 'Pendaftaran pendampingan pengajuan sertifikat Halal gratis (SEHATI) tahap 3 telah dibuka. Silakan mengisi formulir pendaftaran melalui sekretariat komunitas.', isPinned: false },
                      { title: 'Pembukaan Pendaftaran Stand Bazaar UMKM Perahu Kita', date: '10 Juli 2026', sender: 'Divisi Acara & Bazaar', content: 'Bazaar produk anggota akan digelar pada tanggal 25 Agustus 2026 di Alun-Alun Kidul. Kuota stand terbatas untuk 30 merchant pertama.', isPinned: false },
                    ].map((p, idx) => (
                      <div key={idx} className="p-5 bg-gray-50/70 border border-gray-200/80 rounded-2xl space-y-2.5">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            {p.isPinned && <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 font-extrabold text-[10px] rounded-md">📌 TERPAKU</span>}
                            <span className="text-[10px] text-gray-400 font-semibold">{p.date} • Oleh {p.sender}</span>
                          </div>
                        </div>
                        <h3 className="text-sm font-extrabold text-gray-900">{p.title}</h3>
                        <p className="text-xs text-gray-600 leading-relaxed font-medium">{p.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 8: TENTANG ─────────────────────────────────────────────────── */}
            {activeSidebarNav === 'tentang' && (
              <div className="space-y-6">
                <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 font-sora flex items-center gap-2">
                      <Info className="w-6 h-6 text-[#2DB24A]" /> Tentang {community.name}
                    </h2>
                    <p className="text-xs text-gray-500 font-medium mt-1">Profil lengkap, visi & misi, struktur pengurus, serta legalitas hukum perkumpulan.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-5 bg-gray-50/70 border border-gray-200/80 rounded-2xl space-y-3">
                      <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Visi & Misi</h3>
                      <p className="text-xs text-gray-600 leading-relaxed font-medium">
                        <strong className="text-gray-900">Visi:</strong> Menjadi perkumpulan UMKM terdepan di Indonesia yang mandiri, berdaya saing tinggi, berlandaskan semangat kolaborasi dan kebersamaan.
                      </p>
                      <div className="text-xs text-gray-600 space-y-1 font-medium pt-1">
                        <strong className="text-gray-900 block">Misi:</strong>
                        <p>1. Mendorong edukasi & literasi digital pemasaran UMKM.</p>
                        <p>2. Memfasilitasi jejaring promosi produk anggota secara luas.</p>
                        <p>3. Memperkuat sinergi usaha dan kolaborasi bisnis antar anggota.</p>
                      </div>
                    </div>

                    <div className="p-5 bg-gray-50/70 border border-gray-200/80 rounded-2xl space-y-3">
                      <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Informasi Legalitas Hukum</h3>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between border-b border-gray-200/60 pb-1.5">
                          <span className="text-gray-500">Bentuk Organisasi:</span>
                          <span className="font-bold text-gray-800">Perkumpulan Resmi (Non-Koperasi)</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200/60 pb-1.5">
                          <span className="text-gray-500">Akta Notaris:</span>
                          <span className="font-bold text-gray-800 font-mono text-[11px]">{community.aktaNotaris || 'Akta Notaris No. 25 Tgl 25 Juli 2026'}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200/60 pb-1.5">
                          <span className="text-gray-500">Nomor AHU Kemenkumham:</span>
                          <span className="font-bold text-gray-800 font-mono text-[11px]">{community.nomorAhu || 'AHU-00250726.AH.01.07'}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200/60 pb-1.5">
                          <span className="text-gray-500">Nomor NPWP Organisasi:</span>
                          <span className="font-bold text-gray-800 font-mono text-[11px]">{community.nomorNpwp || '98.765.432.1-012.000'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Domisili Sekretariat:</span>
                          <span className="font-bold text-gray-800">{community.domisili || 'Kota Yogyakarta, DIY'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 9: AKTIVITAS ───────────────────────────────────────────────── */}
            {activeSidebarNav === 'aktivitas' && (
              <div className="space-y-6">
                <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-5">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 font-sora flex items-center gap-2">
                      <Activity className="w-6 h-6 text-[#2DB24A]" /> Log Aktivitas & Timeline {community.name}
                    </h2>
                    <p className="text-xs text-gray-500 font-medium mt-1">Jejak kegiatan terbaru, pendaftaran anggota, diskusi, dan perkembangan proyek komunitas.</p>
                  </div>

                  <div className="space-y-3.5">
                    {[
                      { title: 'Kopdar Rutin Perahu Kita Juli 2026', time: 'Hari ini, 14:00 WIB', category: 'Kopdar', author: 'Super Admin Teras', desc: 'Pertemuan bulanan anggota membahas program pameran UMKM.' },
                      { title: 'Peluncuran Fitur Marketplace Komunitas', time: 'Kemarin, 09:30 WIB', category: 'Sistem', author: 'Tim Perahu Kita', desc: 'Anggota kini dapat menampilkan katalog produk di tab Marketplace.' },
                      { title: 'Pendaftaran 15 Anggota Baru Minggu Ini', time: '2 hari lalu', category: 'Keanggotaan', author: 'Sekretariat', desc: 'Selamat bergabung bagi para pelaku usaha kuliner & kriya!' },
                    ].map((act, idx) => (
                      <div key={idx} className="p-4 bg-gray-50/70 border border-gray-100 rounded-2xl flex items-start gap-4 hover:border-[#2DB24A]/30 transition-all">
                        <div className="w-10 h-10 rounded-xl bg-[#E8F8EE] text-[#2DB24A] flex items-center justify-center font-bold shrink-0">
                          <Activity className="w-5 h-5" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="px-2 py-0.5 bg-[#E8F8EE] text-[#0F5132] font-extrabold text-[9px] rounded uppercase">{act.category}</span>
                            <span className="text-[10px] text-gray-400 font-semibold">{act.time}</span>
                          </div>
                          <h4 className="text-xs font-extrabold text-gray-900">{act.title}</h4>
                          <p className="text-xs text-gray-600 font-medium leading-relaxed">{act.desc}</p>
                          <span className="text-[10px] text-gray-400 font-semibold block pt-1">Oleh: {act.author}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 10: BUSINESS MATCHING ───────────────────────────────────────── */}
            {activeSidebarNav === 'business_matching' && (
              <div className="space-y-6">
                <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-5">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
                    <div>
                      <h2 className="text-xl font-black text-gray-900 font-sora flex items-center gap-2">
                        <Handshake className="w-6 h-6 text-[#2DB24A]" /> Business Matching & Temu Investor
                      </h2>
                      <p className="text-xs text-gray-500 font-medium mt-1">Temukan mitra distributor, investor F&B, dan kerjasama pemasaran skala nasional.</p>
                    </div>
                    <button onClick={() => goeyToast.info('Formulir pengajuan business matching telah dibuka!')} className="px-4 py-2.5 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer shrink-0">
                      <Plus className="w-4 h-4" /> Ajukan Kolaborasi
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { title: 'Distributor Produk Makanan Olahan Kemasan', partner: 'PT Boga Nusantara Jabar', target: 'Rp 150.000.000', status: 'Terbuka', slots: '3 Kuota Partner' },
                      { title: 'Kerjasama Pemasaran Export Batik & Fashion', partner: 'ExportHub Asia Singapore', target: 'Rp 300.000.000', status: 'Terbuka', slots: '5 Kuota Partner' },
                      { title: 'Kemitraan Franchise Outlet Kuliner Jogja', partner: 'Kopjaswara Commercial', target: 'Rp 75.000.000', status: 'Proses Matching', slots: '2 Kuota Partner' },
                      { title: 'Pendanaan Investor Angel untuk Startup F&B', partner: 'Jogja Ventures Group', target: 'Rp 500.000.000', status: 'Terbuka', slots: '1 Startup Tersisa' },
                    ].map((bm, idx) => (
                      <div key={idx} className="p-5 bg-gray-50/70 border border-gray-200/80 rounded-2xl space-y-3 hover:border-[#2DB24A]/40 transition-all flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="px-2.5 py-0.5 bg-[#E8F8EE] text-[#0F5132] font-extrabold text-[10px] rounded-md">{bm.status}</span>
                            <span className="text-[10px] text-gray-400 font-semibold">{bm.slots}</span>
                          </div>
                          <h4 className="text-xs font-black text-gray-900">{bm.title}</h4>
                          <p className="text-[11px] text-gray-500 font-semibold">Mitra: {bm.partner}</p>
                          <span className="text-xs font-black text-[#0F5132] block">Potensi Nilai: {bm.target}</span>
                        </div>
                        <button onClick={() => goeyToast.success(`Pengajuan proposal matching untuk "${bm.partner}" dikirim!`)} className="w-full py-2 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer text-center">
                          Ajukan Matching Proposal
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 11: PELATIHAN ───────────────────────────────────────────────── */}
            {activeSidebarNav === 'pelatihan' && (
              <div className="space-y-6">
                <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-5">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 font-sora flex items-center gap-2">
                      <GraduationCap className="w-6 h-6 text-[#2DB24A]" /> Pelatihan & Certification Bootcamps
                    </h2>
                    <p className="text-xs text-gray-500 font-medium mt-1">Tingkatkan kapabilitas bisnis, literasi keuangan, dan legalitas usaha bersama narasumber ahli.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { title: 'Strategi Digital Marketing & TikTok Live 2026', trainer: 'Siska Putri (Praktisi E-Commerce)', level: 'Semua Level', date: '30 Juli 2026', price: 'Gratis Anggota' },
                      { title: 'Penyusunan Laporan Keuangan Standar SAK EMKM', trainer: 'Dra. Tri Haryati, Ak.', level: 'Menengah', date: '05 Agustus 2026', price: 'Gratis Anggota' },
                      { title: 'Pendampingan Sertifikasi Halal Gratis (SEHATI)', trainer: 'LPPOM MUI DIY', level: 'Resmi', date: '12 Agustus 2026', price: 'Gratis Anggota' },
                    ].map((tc, idx) => (
                      <div key={idx} className="p-5 bg-gray-50/70 border border-gray-200/80 rounded-2xl space-y-3 hover:border-[#2DB24A]/40 transition-all flex flex-col justify-between">
                        <div className="space-y-2">
                          <span className="px-2 py-0.5 bg-[#E8F8EE] text-[#0F5132] font-extrabold text-[9px] rounded uppercase">{tc.level}</span>
                          <h4 className="text-xs font-black text-gray-900">{tc.title}</h4>
                          <p className="text-[10px] text-gray-500 font-semibold">Pemateri: {tc.trainer}</p>
                          <p className="text-[10px] text-gray-400 font-medium">📅 {tc.date}</p>
                        </div>
                        <div className="pt-2 border-t border-gray-200/60 flex justify-between items-center">
                          <span className="text-xs font-bold text-[#0F5132]">{tc.price}</span>
                          <button onClick={() => goeyToast.success(`Anda terdaftar di kelas "${tc.title}"!`)} className="px-3 py-1.5 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer">
                            Ikuti Kelas
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 12: MENTOR ──────────────────────────────────────────────────── */}
            {activeSidebarNav === 'mentor' && (
              <div className="space-y-6">
                <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-5">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 font-sora flex items-center gap-2">
                      <Award className="w-6 h-6 text-[#2DB24A]" /> Direktori Mentor Bisnis Terverifikasi
                    </h2>
                    <p className="text-xs text-gray-500 font-medium mt-1">Dapatkan bimbingan 1-on-1 langsung dari praktisi usaha, akademisi, dan pakar industri.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { name: 'Dr. Irvan Prasetya, M.M.', specialty: 'Branding & Scale-Up Bisnis', rating: '⭐ 4.9 (120 Sesi)', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&q=80' },
                      { name: 'Hj. Endang Setyowati', specialty: 'Manufaktur & Ekspor Pangan', rating: '⭐ 5.0 (95 Sesi)', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&q=80' },
                      { name: 'Budi Santoso, S.T.', specialty: 'Perencanaan Keuangan & Startup', rating: '⭐ 4.8 (80 Sesi)', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&q=80' },
                    ].map((m, idx) => (
                      <div key={idx} className="p-5 bg-gray-50/70 border border-gray-200/80 rounded-2xl space-y-3 flex flex-col justify-between hover:border-[#2DB24A]/40 transition-all text-center">
                        <div className="space-y-2">
                          <img src={m.img} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-xs mx-auto" />
                          <h4 className="text-xs font-black text-gray-900">{m.name}</h4>
                          <p className="text-[10px] font-bold text-[#0F5132]">{m.specialty}</p>
                          <span className="text-[10px] text-amber-600 font-semibold block">{m.rating}</span>
                        </div>
                        <button onClick={() => goeyToast.success(`Sesi konsultasi dengan ${m.name} berhasil dijadwalkan!`)} className="w-full py-2 bg-white border border-[#2DB24A] text-[#2DB24A] hover:bg-[#2DB24A] hover:text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer">
                          Jadwalkan Konsultasi
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 13: KOLABORASI ──────────────────────────────────────────────── */}
            {activeSidebarNav === 'kolaborasi' && (
              <div className="space-y-6">
                <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-5">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 font-sora flex items-center gap-2">
                      <Users className="w-6 h-6 text-[#2DB24A]" /> Proyek Kolaborasi Bersama
                    </h2>
                    <p className="text-xs text-gray-500 font-medium mt-1">Gabung dalam proyek patungan, kargo bersama, dan pameran kolektif anggota.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { title: 'Pengiriman Kargo Bersama (Hemat 35% Ongkir)', desc: 'Konsolidasi pengiriman bahan baku dari Surabaya ke Jogja.', slots: '12 Merchant Terdaftar' },
                      { title: 'Pameran Stand Joint Booth Saloka Festival 2026', desc: 'Sewa space booth besar untuk display 10 merchant UMKM.', slots: '8 Merchant Terdaftar' },
                    ].map((col, idx) => (
                      <div key={idx} className="p-5 bg-gray-50/70 border border-gray-200/80 rounded-2xl space-y-3 hover:border-[#2DB24A]/40 transition-all flex flex-col justify-between">
                        <div className="space-y-2">
                          <h4 className="text-xs font-black text-gray-900">{col.title}</h4>
                          <p className="text-xs text-gray-600 font-medium leading-relaxed">{col.desc}</p>
                          <span className="text-[10px] text-[#0F5132] font-bold block">Status: {col.slots}</span>
                        </div>
                        <button onClick={() => goeyToast.success(`Anda bergabung dalam proyek "${col.title}"!`)} className="w-full py-2 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer">
                          Bergabung Kolaborasi
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 14: KELAS ───────────────────────────────────────────────────── */}
            {activeSidebarNav === 'kelas' && (
              <div className="space-y-6">
                <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-5">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 font-sora flex items-center gap-2">
                      <BookOpen className="w-6 h-6 text-[#2DB24A]" /> Katalog Kelas Pelajar Pengusaha
                    </h2>
                    <p className="text-xs text-gray-500 font-medium mt-1">Modul pembelajaran interaktif bisnis sejak dini untuk siswa dan mahasiswa.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { title: 'Business Model Canvas (BMC) Pemula', duration: '4 Modul Video', badge: 'Terpopuler' },
                      { title: 'Digital Marketing & Content Creator', duration: '6 Modul Video', badge: 'Favorit' },
                      { title: 'Leadership & Public Speaking Mastery', duration: '3 Modul Live', badge: 'Baru' },
                      { title: 'Financial Literacy untuk Pelajar', duration: '5 Modul Video', badge: 'Dasar' },
                    ].map((k, idx) => (
                      <div key={idx} className="p-4 bg-gray-50/70 border border-gray-200/80 rounded-2xl space-y-3 hover:border-[#2DB24A]/40 transition-all flex flex-col justify-between">
                        <div className="space-y-2">
                          <span className="px-2 py-0.5 bg-[#E8F8EE] text-[#0F5132] font-extrabold text-[9px] rounded uppercase">{k.badge}</span>
                          <h4 className="text-xs font-extrabold text-gray-900 leading-snug">{k.title}</h4>
                          <p className="text-[10px] text-gray-400 font-medium">🕒 {k.duration}</p>
                        </div>
                        <button onClick={() => goeyToast.success(`Kelas "${k.title}" dimulai!`)} className="w-full py-1.5 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer">
                          Mulai Belajar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 15: KOMPETISI ───────────────────────────────────────────────── */}
            {activeSidebarNav === 'kompetisi' && (
              <div className="space-y-6">
                <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-5">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 font-sora flex items-center gap-2">
                      <Trophy className="w-6 h-6 text-[#2DB24A]" /> Kompetisi & Challenge Pengusaha Muda
                    </h2>
                    <p className="text-xs text-gray-500 font-medium mt-1">Uji ide bisnismu dan menangkan total hadiah puluhan juta rupiah serta fasilitas inkubasi.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { title: 'Saloka Youth Business Plan Competition 2026', prize: 'Rp 25.000.000 Total Hadiah', dl: '15 Agustus 2026', status: 'Pendaftaran Buka' },
                      { title: 'National EdTech & Eco-Startup Challenge', prize: 'Rp 15.000.000 Total Hadiah', dl: '30 Agustus 2026', status: 'Pendaftaran Buka' },
                    ].map((comp, idx) => (
                      <div key={idx} className="p-5 bg-gray-50/70 border border-gray-200/80 rounded-2xl space-y-3 hover:border-[#2DB24A]/40 transition-all flex flex-col justify-between">
                        <div className="space-y-2">
                          <span className="px-2.5 py-0.5 bg-emerald-100 text-[#0F5132] font-extrabold text-[10px] rounded-md">{comp.status}</span>
                          <h4 className="text-xs font-black text-gray-900">{comp.title}</h4>
                          <p className="text-xs font-black text-[#0F5132]">🏆 {comp.prize}</p>
                          <p className="text-[10px] text-gray-400 font-medium">⏳ Deadline: {comp.dl}</p>
                        </div>
                        <button onClick={() => goeyToast.success(`Pendaftaran tim untuk "${comp.title}" dibuka!`)} className="w-full py-2 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer">
                          Daftar Tim Kompetisi
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 16: STARTUP ─────────────────────────────────────────────────── */}
            {activeSidebarNav === 'startup' && (
              <div className="space-y-6">
                <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-5">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 font-sora flex items-center gap-2">
                      <Rocket className="w-6 h-6 text-[#2DB24A]" /> Showcase Startup Anggota Pelajar
                    </h2>
                    <p className="text-xs text-gray-500 font-medium mt-1">Inovasi teknologi dan produk kreatif buatan generasi muda pengusaha.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { title: 'EduForm', desc: 'Platform Pembelajaran Interaktif Pelajar SMR/SMA', founder: 'Rian & Tim', stage: 'Pre-Seed' },
                      { title: 'GreenPack', desc: 'Kemasan Ramah Lingkungan dari Ampas Tebu', founder: 'Anisa Student', stage: 'Seed Stage' },
                      { title: 'StudyBox', desc: 'Layanan Subscription Alat Tulis & Buku Edukasi', founder: 'Fajar Youth', stage: 'Early Stage' },
                    ].map((st, idx) => (
                      <div key={idx} className="p-5 bg-gray-50/70 border border-gray-200/80 rounded-2xl space-y-3 hover:border-[#2DB24A]/40 transition-all flex flex-col justify-between">
                        <div className="space-y-2">
                          <span className="px-2 py-0.5 bg-[#E8F8EE] text-[#0F5132] font-extrabold text-[9px] rounded uppercase">{st.stage}</span>
                          <h4 className="text-xs font-black text-gray-900">{st.title}</h4>
                          <p className="text-xs text-gray-600 font-medium leading-relaxed">{st.desc}</p>
                          <p className="text-[10px] text-gray-400 font-semibold">Founder: {st.founder}</p>
                        </div>
                        <button onClick={() => goeyToast.info(`Pitch deck "${st.title}" sedang diunduh.`)} className="w-full py-2 bg-white border border-[#2DB24A] text-[#2DB24A] hover:bg-[#2DB24A] hover:text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer">
                          Lihat Pitch Deck
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 17: MERCHANT ────────────────────────────────────────────────── */}
            {activeSidebarNav === 'merchant' && (
              <div className="space-y-6">
                <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-5">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 font-sora flex items-center gap-2">
                      <Store className="w-6 h-6 text-[#2DB24A]" /> Direktori Merchant Kuliner Resmi
                    </h2>
                    <p className="text-xs text-gray-500 font-medium mt-1">Jelajahi outlet kuliner khas dan restoran unggulan anggota Asosiasi Kuliner Kreatif Jogja.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { name: 'Gudeg Yu Djum Wijilan', menu: 'Gudeg Kendil & Gudeg Kaleng Asli', address: 'Jl. Wijilan No. 167, Kraton, Yogyakarta', status: 'BUKA (06:00 - 21:00)' },
                      { name: 'Bakmi Jawa Mbah Mo', menu: 'Bakmi Godhog & Bakmi Goreng Nyemek', address: 'Code, Trirenggo, Bantul, DIY', status: 'BUKA (17:00 - 23:00)' },
                      { name: 'Sate Klatak Pak Bari', menu: 'Sate Kambing Muda Jeruji Besi', address: 'Pasar Jejeran, Imogiri Timur, Bantul', status: 'BUKA (18:00 - 24:00)' },
                      { name: 'Kopi Joss Lik Man', menu: 'Kopi Arang Arang & Nasi Kucing Joss', address: 'Jl. Pangeran Mangkubumi, Stasiun Tugu', status: 'BUKA (16:00 - 02:00)' },
                    ].map((merch, idx) => (
                      <div key={idx} className="p-5 bg-gray-50/70 border border-gray-200/80 rounded-2xl space-y-3 hover:border-[#2DB24A]/40 transition-all flex flex-col justify-between">
                        <div className="space-y-2">
                          <span className="px-2 py-0.5 bg-emerald-100 text-[#0F5132] font-extrabold text-[9px] rounded uppercase">{merch.status}</span>
                          <h4 className="text-sm font-black text-gray-900">{merch.name}</h4>
                          <p className="text-xs font-bold text-[#0F5132]">🍲 Menu Utama: {merch.menu}</p>
                          <p className="text-xs text-gray-500 font-medium">📍 {merch.address}</p>
                        </div>
                        <button onClick={() => goeyToast.success(`Detail lokasi merchant "${merch.name}" dibuka!`)} className="w-full py-2 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer">
                          Lihat Menu & Lokasi
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 18: SUPPLIER ────────────────────────────────────────────────── */}
            {activeSidebarNav === 'supplier' && (
              <div className="space-y-6">
                <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-5">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 font-sora flex items-center gap-2">
                      <Truck className="w-6 h-6 text-[#2DB24A]" /> Direktori Supplier Bahan Baku Kuliner
                    </h2>
                    <p className="text-xs text-gray-500 font-medium mt-1">Dapatkan pasokan bahan segar, bumbu rempah, dan kemasan food-grade harga grosir.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { item: 'Suplai Daging Ayam & Sapi Segar', supplier: 'UD Ayam Segar Sleman', moq: 'Min. Order 10 kg', price: 'Harga Grosir' },
                      { item: 'Sentra Box Kemasan Food Grade Custom', supplier: 'PT Kemasan Pack Jogja', moq: 'Min. Order 500 pcs', price: 'Rp 1.200 / pcs' },
                      { item: 'Distro Rempah & Bumbu Tradisional', supplier: 'Toko Rempah Merapi', moq: 'Min. Order 5 kg', price: 'Harga Pabrik' },
                    ].map((sup, idx) => (
                      <div key={idx} className="p-5 bg-gray-50/70 border border-gray-200/80 rounded-2xl space-y-3 hover:border-[#2DB24A]/40 transition-all flex flex-col justify-between">
                        <div className="space-y-2">
                          <h4 className="text-xs font-black text-gray-900">{sup.item}</h4>
                          <p className="text-[11px] text-gray-500 font-semibold">Supplier: {sup.supplier}</p>
                          <span className="text-[10px] text-gray-400 font-medium block">📦 {sup.moq}</span>
                        </div>
                        <button onClick={() => goeyToast.success(`Permintaan penawaran grosir untuk "${sup.item}" dikirim!`)} className="w-full py-2 bg-white border border-[#2DB24A] text-[#2DB24A] hover:bg-[#2DB24A] hover:text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer">
                          Minta Penawaran Grosir
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 19: PROMO ───────────────────────────────────────────────────── */}
            {activeSidebarNav === 'promo' && (
              <div className="space-y-6">
                <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-5">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 font-sora flex items-center gap-2">
                      <Tag className="w-6 h-6 text-[#2DB24A]" /> Voucher & Promo Khusus Anggota
                    </h2>
                    <p className="text-xs text-gray-500 font-medium mt-1">Gunakan voucher promo eksklusif untuk menikmati kuliner anggota dengan harga hemat.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { title: 'Diskon 20% Gudeg Kendil Wijilan', code: 'GUDEG20', valid: '31 Agu 2026' },
                      { title: 'Buy 1 Get 1 Kopi Joss Lik Man', code: 'KOPIJOSS', valid: '15 Agu 2026' },
                      { title: 'Cashback Rp 15.000 Sate Klatak', code: 'KLATAK15', valid: '31 Agu 2026' },
                    ].map((pr, idx) => (
                      <div key={idx} className="p-5 bg-gradient-to-br from-[#E8F8EE] to-emerald-50 border border-[#2DB24A]/30 rounded-2xl space-y-3 text-center flex flex-col justify-between">
                        <div className="space-y-2">
                          <h4 className="text-xs font-black text-[#0F5132]">{pr.title}</h4>
                          <div className="px-3 py-1 bg-white border border-dashed border-[#2DB24A] rounded-lg inline-block font-mono text-xs font-bold text-emerald-800">
                            {pr.code}
                          </div>
                          <p className="text-[10px] text-gray-500 font-medium block">Berlaku s/d {pr.valid}</p>
                        </div>
                        <button onClick={() => goeyToast.success(`Voucher "${pr.code}" berhasil diklaim!`)} className="w-full py-2 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer">
                          Klaim Voucher
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 20: SIMPANAN KOPERASI ───────────────────────────────────────── */}
            {activeSidebarNav === 'simpanan' && (
              <div className="space-y-6">
                <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-5">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
                    <div>
                      <h2 className="text-xl font-black text-gray-900 font-sora flex items-center gap-2">
                        <Wallet className="w-6 h-6 text-[#2DB24A]" /> Portal Simpanan Koperasi Produksi
                      </h2>
                      <p className="text-xs text-gray-500 font-medium mt-1">Kelola simpanan pokok, simpanan wajib bulanan, dan simpanan sukarela terproteksi.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {isCanManageCoop && (
                        <button
                          onClick={() => handleOpenCreateProduct(false)}
                          className="px-4 py-2.5 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                        >
                          <Plus className="w-4 h-4" /> Tambah Simpanan Baru
                        </button>
                      )}
                      <button onClick={() => handleOpenPaySavings({ name: 'Simpanan Koperasi', amount: 50000, type: 'WAJIB' })} className="px-4 py-2.5 bg-white border border-[#2DB24A] hover:bg-[#E8F8EE] text-[#2DB24A] font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer shrink-0">
                        <Wallet className="w-4 h-4" /> Setor Simpanan
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {coopProducts && coopProducts.length > 0 ? (
                      coopProducts.map((p: any, idx: number) => {
                        const badge = p.type === 'POKOK' ? 'Pokok' : p.type === 'WAJIB' ? 'Bulanan' : p.type === 'SUKARELA' ? 'Sukarela' : p.type === 'UMROH' ? 'Umroh' : p.type === 'QURBAN' ? 'Qurban' : 'Lain-lain'
                        const priceText = p.type === 'SUKARELA' ? 'Bebas Nominal' : `Rp ${Number(p.amount || 0).toLocaleString('id-ID')}${p.periodText ? ` / ${p.periodText}` : ''}`
                        
                        return (
                          <div key={p.id || idx} className="p-5 bg-gray-50/70 border border-gray-200/80 rounded-2xl space-y-3 flex flex-col justify-between hover:border-[#2DB24A]/40 transition-all">
                            <div className="space-y-2">
                              <div className="flex justify-between items-start">
                                <span className="px-2 py-0.5 bg-[#E8F8EE] text-[#0F5132] font-extrabold text-[9px] rounded uppercase">{badge}</span>
                                {isCanManageCoop && (
                                  <div className="flex items-center gap-1">
                                    <button onClick={() => handleOpenEditProduct(p)} className="text-[10px] text-gray-500 hover:text-[#2DB24A] font-bold cursor-pointer">Edit</button>
                                    <span className="text-gray-300 text-[10px]">|</span>
                                    <button onClick={() => handleDeleteProduct(p.id)} className="text-[10px] text-gray-500 hover:text-red-500 font-bold cursor-pointer">Hapus</button>
                                  </div>
                                )}
                              </div>
                              <h4 className="text-xs font-black text-gray-900">{p.name}</h4>
                              <p className="text-[10px] text-gray-500 font-medium min-h-[32px]">{p.description || '-'}</p>
                              <span className="text-sm font-black text-[#0F5132] block">{priceText}</span>
                            </div>
                            <button onClick={() => handleOpenPaySavings({ name: p.name, amount: p.amount || 50000, type: p.type })} className="w-full py-2 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer">
                              Setor {p.name}
                            </button>
                          </div>
                        )
                      })
                    ) : (
                      <div className="col-span-full p-8 text-center bg-gray-50 border border-dashed border-gray-200 rounded-2xl">
                        <p className="text-xs text-gray-500">Belum ada produk simpanan tersedia.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 21: PENDANAAN KOPERASI ──────────────────────────────────────── */}
            {activeSidebarNav === 'pendanaan' && (
              <div className="space-y-6">
                <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-5">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
                    <div>
                      <h2 className="text-xl font-black text-gray-900 font-sora flex items-center gap-2">
                        <Landmark className="w-6 h-6 text-[#2DB24A]" /> Portal Permodalan Usaha Koperasi
                      </h2>
                      <p className="text-xs text-gray-500 font-medium mt-1">Fasilitas pinjaman permodalan modal kerja & pengadaan alat produksi bunga ringan.</p>
                    </div>
                    <button onClick={() => setLoanModalOpen(true)} className="px-4 py-2.5 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer shrink-0">
                      <Plus className="w-4 h-4" /> Ajukan Pinjaman Permodalan
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { title: 'Pinjaman Modal Kerja Pembelian Bahan Baku', ceiling: 'Plafon s/d Rp 25.000.000', rate: 'Bunga 0,8% / bulan', tenor: 'Tenor 3 - 12 Bulan' },
                      { title: 'Pinjaman Pengadaan Mesin & Alat Produksi', ceiling: 'Plafon s/d Rp 50.000.000', rate: 'Bunga 0,9% / bulan', tenor: 'Tenor 6 - 24 Bulan' },
                    ].map((fund, idx) => (
                      <div key={idx} className="p-5 bg-gray-50/70 border border-gray-200/80 rounded-2xl space-y-3 hover:border-[#2DB24A]/40 transition-all flex flex-col justify-between">
                        <div className="space-y-2">
                          <h4 className="text-xs font-black text-gray-900">{fund.title}</h4>
                          <span className="text-sm font-black text-[#0F5132] block">{fund.ceiling}</span>
                          <p className="text-[10px] text-gray-500 font-semibold">{fund.rate} • {fund.tenor}</p>
                        </div>
                        <button onClick={() => setLoanModalOpen(true)} className="w-full py-2 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer">
                          Ajukan Permodalan
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 22: SHU KOPERASI ────────────────────────────────────────────── */}
            {activeSidebarNav === 'shu' && (
              <div className="space-y-6">
                <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-5">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
                    <div>
                      <h2 className="text-xl font-black text-gray-900 font-sora flex items-center gap-2">
                        <PieChart className="w-6 h-6 text-[#2DB24A]" /> Laporan & Simulasi Bagi Hasil SHU
                      </h2>
                      <p className="text-xs text-gray-500 font-medium mt-1">Transparansi perhitungan Sisa Hasil Usaha (SHU) Koperasi Produksi tahun berjalan.</p>
                    </div>
                    <button onClick={() => setShuDetailModalOpen(true)} className="px-4 py-2.5 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer shrink-0">
                      <PieChart className="w-4 h-4" /> Detail Perhitungan SHU
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-5 bg-emerald-50 border border-[#2DB24A]/30 rounded-2xl space-y-2">
                      <span className="text-[10px] font-bold text-[#0F5132] uppercase">Total SHU Koperasi 2026</span>
                      <span className="text-xl font-black text-gray-900 block">Rp 185.000.000</span>
                      <p className="text-[10px] text-gray-500 font-medium">Hasil usaha terkumpul dari 12 unit bisnis.</p>
                    </div>
                    <div className="p-5 bg-amber-50 border border-amber-300/40 rounded-2xl space-y-2">
                      <span className="text-[10px] font-bold text-amber-800 uppercase">Jasa Simpanan (40%)</span>
                      <span className="text-xl font-black text-gray-900 block">Rp 74.000.000</span>
                      <p className="text-[10px] text-gray-500 font-medium">Dibagikan proporsional saldo simpanan.</p>
                    </div>
                    <div className="p-5 bg-blue-50 border border-blue-300/40 rounded-2xl space-y-2">
                      <span className="text-[10px] font-bold text-blue-800 uppercase">Jasa Transaksi (60%)</span>
                      <span className="text-xl font-black text-gray-900 block">Rp 111.000.000</span>
                      <p className="text-[10px] text-gray-500 font-medium">Dibagikan proporsional keaktifan belanja.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 23: LAPORAN KOPERASI ────────────────────────────────────────── */}
            {activeSidebarNav === 'laporan' && (
              <div className="space-y-6">
                <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-5">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 font-sora flex items-center gap-2">
                      <FileText className="w-6 h-6 text-[#2DB24A]" /> Laporan Keuangan Audited & Dokumentasi RAT
                    </h2>
                    <p className="text-xs text-gray-500 font-medium mt-1">Unduh berkas laporan keuangan, neraca saldo, serta risalah Rapat Anggota Tahunan (RAT).</p>
                  </div>

                  <div className="space-y-3">
                    {[
                      { title: 'Laporan Keuangan Audited Koperasi Tahun 2025 (PDF)', date: 'Diunggah 01 Feb 2026', size: '2.4 MB' },
                      { title: 'Neraca Saldo & Rugi Laba Triwulan I Tahun 2026 (PDF)', date: 'Diunggah 15 Apr 2026', size: '1.8 MB' },
                      { title: 'Risalah Berita Acara RAT Koperasi Tahun Buku 2025 (PDF)', date: 'Diunggah 05 Feb 2026', size: '3.1 MB' },
                    ].map((rep, idx) => (
                      <div key={idx} className="p-4 bg-gray-50/70 border border-gray-200/80 rounded-2xl flex justify-between items-center hover:border-[#2DB24A]/40 transition-all">
                        <div className="flex items-center gap-3">
                          <FileText className="w-6 h-6 text-[#2DB24A]" />
                          <div>
                            <h4 className="text-xs font-bold text-gray-900">{rep.title}</h4>
                            <p className="text-[10px] text-gray-400 font-semibold">{rep.date} • {rep.size}</p>
                          </div>
                        </div>
                        <button onClick={() => goeyToast.success(`Mengunduh "${rep.title}"...`)} className="px-3 py-1.5 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer">
                          Unduh PDF
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 24: PENGATURAN FITUR KOMUNITAS (CRUD TOGGLE MODULES) ────────── */}
            {activeSidebarNav === 'pengaturan' && isCanManageCoop && (
              <div className="space-y-6 animate-fadeIn">
                <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-6">
                  <div className="border-b border-gray-100 pb-4">
                    <h2 className="text-xl font-black text-gray-900 font-sora flex items-center gap-2">
                      <Sliders className="w-6 h-6 text-[#2DB24A]" /> Pengaturan Fitur Komunitas
                    </h2>
                    <p className="text-xs text-gray-500 font-medium mt-1">
                      Kelola fitur dan menu navigasi yang aktif di halaman {community?.name}.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Daftar Fitur Navigasi
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {togglableModules.map((mod) => {
                        const isEnabled = !disabledModules.includes(mod.id)
                        const ModIcon = mod.icon
                        return (
                          <div
                            key={mod.id}
                            className="p-4 bg-gray-50/60 border border-gray-200/80 rounded-2xl flex items-center justify-between hover:border-gray-300 transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                                isEnabled ? 'bg-[#E8F8EE] text-[#2DB24A]' : 'bg-gray-200 text-gray-400'
                              }`}>
                                <ModIcon className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-gray-900">{mod.label}</h4>
                                <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                                  {isEnabled ? 'Navigasi aktif di menu' : 'Navigasi disembunyikan'}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleToggleModule(mod.id)}
                              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 ${
                                isEnabled ? 'bg-[#2DB24A] justify-end' : 'bg-gray-300 justify-start'
                              }`}
                            >
                              <span className="bg-white w-4 h-4 rounded-full shadow-xs transition-all" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex justify-end">
                    <button
                      onClick={handleSaveSettings}
                      disabled={isSavingSettings}
                      className="px-5 py-2.5 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isSavingSettings ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
                        </>
                      ) : (
                        'Simpan Pengaturan'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
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
                  <span className="text-[10px] text-gray-400">{selectedProject.title || selectedProject.name || 'Proyek Pendanaan'}</span>
                </div>
                <button onClick={() => setInvestModalOpen(false)} className="text-gray-400 hover:text-gray-700 text-sm font-bold cursor-pointer">✕</button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
                  <span className="text-gray-500">Target Dana:</span>
                  <span className="font-bold text-gray-900">
                    Rp {Number(selectedProject.targetAmount ?? selectedProject.target ?? 0).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
                  <span className="text-gray-500">Minimal Pendanaan:</span>
                  <span className="font-bold text-[#2DB24A]">
                    Rp {Number(selectedProject.minInvestment ?? selectedProject.minInvest ?? 50000).toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Masukkan Jumlah Pendanaan (Rp)</label>
                  <input
                    type="number"
                    value={investAmount}
                    onChange={(e) => setInvestAmount(e.target.value)}
                    min={Number(selectedProject.minInvestment ?? selectedProject.minInvest ?? 50000)}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-[#2DB24A]"
                  />
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Pilih Metode Pembayaran</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setInvestPaymentMethod('SALDO')}
                      className={`p-2 rounded-xl border text-[10px] font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${investPaymentMethod === 'SALDO' ? 'bg-[#E8F8EE] border-[#2DB24A] text-[#0F5132]' : 'bg-gray-50 border-gray-200 text-gray-600'
                        }`}
                    >
                      <Wallet className="w-3.5 h-3.5" /> Saldo Wallet
                    </button>
                    <button
                      type="button"
                      onClick={() => setInvestPaymentMethod('QRIS')}
                      className={`p-2 rounded-xl border text-[10px] font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${investPaymentMethod === 'QRIS' ? 'bg-[#E8F8EE] border-[#2DB24A] text-[#0F5132]' : 'bg-gray-50 border-gray-200 text-gray-600'
                        }`}
                    >
                      <QrCode className="w-3.5 h-3.5" /> QRIS Instant
                    </button>
                    <button
                      type="button"
                      onClick={() => setInvestPaymentMethod('BANK')}
                      className={`p-2 rounded-xl border text-[10px] font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${investPaymentMethod === 'BANK' ? 'bg-[#E8F8EE] border-[#2DB24A] text-[#0F5132]' : 'bg-gray-50 border-gray-200 text-gray-600'
                        }`}
                    >
                      <Building2 className="w-3.5 h-3.5" /> Bank Transfer
                    </button>
                  </div>
                </div>

                {/* Details per method */}
                {investPaymentMethod === 'SALDO' && (
                  <div className="p-3 bg-white border border-gray-200 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between items-center text-gray-700">
                      <span>Saldo Wallet Anda:</span>
                      <span className="font-mono font-extrabold text-[#0F5132]">Rp {userBalance.toLocaleString('id-ID')}</span>
                    </div>
                    {userBalance < Number(investAmount || 0) ? (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-amber-900">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold">
                          <Info className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Saldo Wallet Rp {userBalance.toLocaleString('id-ID')} (Belum mencukupi)</span>
                        </div>
                        <p className="text-[10px] text-amber-800 font-medium leading-relaxed">
                          Saldo Wallet Anda tidak mencukupi untuk investasi sebesar Rp {Number(investAmount || 0).toLocaleString('id-ID')}. Silakan bayar langsung lewat QRIS Instant atau Transfer Bank
                        </p>
                        <button
                          type="button"
                          onClick={() => setInvestPaymentMethod('QRIS')}
                          className="w-full py-2 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-[10px] rounded-lg shadow-sm transition-colors cursor-pointer text-center"
                        >
                          📱 Bayar via QRIS Instant
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center text-[10px] text-emerald-800 font-medium pt-1 border-t border-[#2DB24A]/20">
                        <span>Sisa Saldo Setelah Investasi:</span>
                        <span className="font-bold font-mono">Rp {(userBalance - Number(investAmount || 0)).toLocaleString('id-ID')}</span>
                      </div>
                    )}
                  </div>
                )}

                {investPaymentMethod === 'QRIS' && (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-center space-y-2">
                    <div className="bg-white p-2.5 rounded-xl inline-block shadow-sm border border-gray-200">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=QRIS_INVEST_${selectedProject.id}_${investAmount || 0}`}
                        alt="QRIS Code"
                        className="w-28 h-28 mx-auto rounded-lg"
                      />
                      <div className="flex items-center justify-center gap-1 mt-1 text-[9px] font-extrabold text-gray-800 uppercase tracking-wider">
                        <QrCode className="w-3 h-3 text-[#2DB24A]" /> QRIS TERAS INVESTASI
                      </div>
                    </div>
                    <p className="text-[9px] text-gray-500 font-medium">Scan dengan GoPay, OVO, Dana, ShopeePay, atau Mobile Banking.</p>
                  </div>
                )}

                {investPaymentMethod === 'BANK' && (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5 text-xs">
                    <span className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider">Nomor Virtual Account</span>
                    <div className="flex justify-between items-center p-2.5 bg-white rounded-xl border border-gray-200">
                      <div>
                        <span className="block text-[9px] text-gray-400 font-bold">BCA Virtual Account</span>
                        <span className="font-mono font-extrabold text-gray-900 text-xs">8801 9920 3841 002</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => goeyToast.success('Nomor Virtual Account BCA berhasil disalin!')}
                        className="px-2.5 py-1 bg-[#E8F8EE] hover:bg-[#2DB24A] text-[#0F5132] hover:text-white font-bold text-[10px] rounded-lg transition-colors cursor-pointer"
                      >
                        Salin
                      </button>
                    </div>
                  </div>
                )}

                <button
                  disabled={investPaymentMethod === 'SALDO' && userBalance < Number(investAmount || 0)}
                  onClick={() => {
                    const amt = Number(investAmount || 0)
                    const minAllowed = Number(selectedProject.minInvestment ?? selectedProject.minInvest ?? 50000)
                    if (amt < minAllowed) {
                      goeyToast.error(`Minimal investasi adalah Rp ${minAllowed.toLocaleString('id-ID')}`)
                      return
                    }

                    if (investPaymentMethod === 'SALDO' && userBalance < amt) {
                      goeyToast.error('Saldo Wallet Anda tidak mencukupi. Silakan gunakan QRIS Instant atau Transfer Bank.')
                      return
                    }

                    if (investPaymentMethod === 'SALDO') {
                      setUserBalance(prev => prev - amt)
                    }

                    const titleStr = selectedProject.title || selectedProject.name || 'Proyek Merchant'
                    const now = new Date()
                    const timeStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ', ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

                    // 1. Update project collected amount progress bar
                    setFundingProjects(prev =>
                      prev.map(p => (p.id === selectedProject.id ? { ...p, collectedAmount: (p.collectedAmount || 0) + amt } : p))
                    )

                    // 2. Record transaction in recentTransactions history
                    setRecentTransactions(prev => [
                      {
                        id: `tx-${Date.now()}`,
                        date: timeStr,
                        title: `Investasi ${titleStr}`,
                        amount: amt,
                        status: 'Berhasil',
                        type: 'INVESTMENT',
                        isIncome: false
                      },
                      ...prev
                    ])

                    // 3. Update personal SHU calculation dynamically
                    setUserShu((prev: any) => {
                      const newTxTotal = (prev?.transaksiMember || 3500000) + amt
                      const netProfit = shuConfig?.totalNetProfit || 500000000
                      const poolJasaUsaha = (netProfit * (shuConfig?.pctJasaUsaha || 30)) / 100
                      const newJasaUsaha = Math.round((newTxTotal / 500000000) * poolJasaUsaha)
                      const jasaModal = prev?.shuJasaModalAmount || 250000

                      return {
                        ...prev,
                        transaksiMember: newTxTotal,
                        shuJasaUsahaAmount: newJasaUsaha,
                        shuJasaModalAmount: jasaModal,
                        totalShuAmount: newJasaUsaha + jasaModal
                      }
                    })

                    goeyToast.success(`Investasi Rp ${amt.toLocaleString('id-ID')} pada "${titleStr}" berhasil dikonfirmasi!`)
                    setInvestModalOpen(false)
                  }}
                  className={`w-full py-3 font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 ${investPaymentMethod === 'SALDO' && userBalance < Number(investAmount || 0)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-[#2DB24A] hover:bg-[#228e3b] text-white cursor-pointer'
                    }`}
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
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${paymentMethod === 'QRIS'
                          ? 'bg-[#E8F8EE] border-[#2DB24A] text-[#2DB24A]'
                          : 'bg-gray-50 border-gray-200 text-gray-500'
                        }`}
                    >
                      QRIS Auto-Verify
                    </button>
                    <button
                      onClick={() => setPaymentMethod('BANK')}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${paymentMethod === 'BANK'
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
                  if (projImageUrl) {
                    fd.append('imageUrl', projImageUrl)
                  }

                  const res = await createMerchantFundingProjectAction(fd)
                  if (res.success && res.project) {
                    setFundingProjects(prev => [res.project, ...prev])
                    setProjectModalOpen(false)
                    setProjTitle('')
                    setProjImageUrl('')
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

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Upload Gambar / Sampul Proyek *</label>
                  <div className="border-2 border-dashed border-gray-200 hover:border-[#0F5132] rounded-xl p-3 text-center transition-all bg-gray-50/50 relative cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            goeyToast.error('Ukuran gambar terlalu besar (maksimal 5MB)')
                            return
                          }
                          const reader = new FileReader()
                          reader.onloadend = () => {
                            setProjImageUrl(reader.result as string)
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    {projImageUrl ? (
                      <div className="relative group rounded-lg overflow-hidden h-28 w-full border border-gray-200">
                        <img src={projImageUrl} alt="Preview Proyek" className="w-full h-full object-cover rounded-lg" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                          Klik untuk Mengganti Foto
                        </div>
                      </div>
                    ) : (
                      <div className="py-2 space-y-1">
                        <div className="w-8 h-8 rounded-full bg-[#E8F8EE] text-[#0F5132] flex items-center justify-center mx-auto">
                          <Upload className="w-4 h-4" />
                        </div>
                        <span className="block text-[11px] font-bold text-gray-800">Unggah Gambar Proyek Mandiri</span>
                        <span className="block text-[9px] text-gray-400">Pilih berkas dari HP / Komputer Anda (Maks 5MB)</span>
                      </div>
                    )}
                  </div>
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

        {/* MODAL KONFIRMASI (CUSTOM ALERT / CONFIRMATION DIALOG) */}
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-gray-100"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${confirmModal.variant === 'danger' ? 'bg-red-100 text-red-600' :
                  confirmModal.variant === 'success' ? 'bg-emerald-100 text-emerald-600' :
                    'bg-amber-100 text-amber-600'
                }`}>
                {confirmModal.variant === 'danger' ? <Trash2 className="w-6 h-6" /> :
                  confirmModal.variant === 'success' ? <CheckCircle2 className="w-6 h-6" /> :
                    <Info className="w-6 h-6" />}
              </div>

              <div className="space-y-1">
                <h3 className="font-sora text-base font-bold text-gray-900">
                  {confirmModal.title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {confirmModal.message}
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    startTransition(async () => {
                      await confirmModal.onConfirm()
                      setConfirmModal(prev => ({ ...prev, isOpen: false }))
                    })
                  }}
                  disabled={actionPending}
                  className={`flex-1 py-2.5 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer ${confirmModal.variant === 'danger' ? 'bg-red-600 hover:bg-red-700' :
                      confirmModal.variant === 'success' ? 'bg-[#0F5132] hover:bg-emerald-900' :
                        'bg-amber-600 hover:bg-amber-700'
                    }`}
                >
                  {actionPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : confirmModal.confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* MODAL SETOR / BAYAR SIMPANAN KOPERASI */}
        {paySavingsModalOpen && selectedSavingsProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-100 relative"
            >
              <button
                type="button"
                onClick={() => setPaySavingsModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#E8F8EE] text-[#2DB24A] flex items-center justify-center shrink-0">
                  {selectedSavingsProduct.type === 'POKOK' ? <Home className="w-6 h-6" /> :
                    selectedSavingsProduct.type === 'WAJIB' ? <Calendar className="w-6 h-6" /> :
                      <Coins className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="font-sora text-base font-extrabold text-gray-900">
                    Setor {selectedSavingsProduct.name}
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    {selectedSavingsProduct.periodText || 'Setor simpanan anggota'}
                  </p>
                </div>
              </div>

              <form onSubmit={handleConfirmDeposit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Nominal Setoran (Rp) *</label>
                  <input
                    type="number"
                    required
                    min="10000"
                    value={depositAmount}
                    onChange={e => setDepositAmount(e.target.value)}
                    className="w-full border rounded-xl px-3 py-2.5 text-sm font-mono font-extrabold text-gray-900 border-gray-300 focus:ring-2 focus:ring-[#2DB24A]"
                    placeholder="50000"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1.5">Metode Pembayaran</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setDepositPaymentMethod('SALDO')}
                      className={`p-2.5 border rounded-xl text-center space-y-1 transition-all cursor-pointer ${depositPaymentMethod === 'SALDO' ? 'border-[#2DB24A] bg-[#E8F8EE] text-[#0F5132]' : 'border-gray-200 text-gray-600'
                        }`}
                    >
                      <Wallet className="w-4 h-4 mx-auto text-[#2DB24A]" />
                      <span className="block text-[10px] font-bold">Saldo Wallet</span>
                      <span className="block text-[8px] font-semibold text-gray-500">
                        Rp {userBalance.toLocaleString('id-ID')}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDepositPaymentMethod('QRIS')}
                      className={`p-2.5 border rounded-xl text-center space-y-1 transition-all cursor-pointer ${depositPaymentMethod === 'QRIS' ? 'border-[#2DB24A] bg-[#E8F8EE] text-[#0F5132]' : 'border-gray-200 text-gray-600'
                        }`}
                    >
                      <QrCode className="w-4 h-4 mx-auto text-[#2DB24A]" />
                      <span className="block text-[10px] font-bold">QRIS Instant</span>
                      <span className="block text-[8px] font-semibold text-gray-500">Scan & Pay</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDepositPaymentMethod('BANK')}
                      className={`p-2.5 border rounded-xl text-center space-y-1 transition-all cursor-pointer ${depositPaymentMethod === 'BANK' ? 'border-[#2DB24A] bg-[#E8F8EE] text-[#0F5132]' : 'border-gray-200 text-gray-600'
                        }`}
                    >
                      <Building2 className="w-4 h-4 mx-auto text-[#2DB24A]" />
                      <span className="block text-[10px] font-bold">Bank Transfer</span>
                      <span className="block text-[8px] font-semibold text-gray-500">VA Automated</span>
                    </button>
                  </div>
                </div>

                {/* DYNAMIC PAYMENT METHOD DETAILS */}
                {depositPaymentMethod === 'SALDO' && (
                  <div className="p-3 bg-white border border-gray-200 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-600 font-medium">Saldo Wallet saat ini:</span>
                      <span className="font-extrabold text-[#0F5132]">Rp {userBalance.toLocaleString('id-ID')}</span>
                    </div>
                    {Number(depositAmount || 0) > userBalance ? (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-amber-900">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold">
                          <Info className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Saldo Wallet Rp {userBalance.toLocaleString('id-ID')} (Belum mencukupi)</span>
                        </div>
                        <p className="text-[10px] text-amber-800 font-medium leading-relaxed">
                          Saldo Wallet Anda tidak mencukupi untuk nominal setoran ini. Silakan bayar langsung lewat QRIS Instant atau Transfer Bank
                        </p>
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => setDepositPaymentMethod('QRIS')}
                            className="w-full py-2 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-[10px] rounded-lg transition-colors cursor-pointer text-center"
                          >
                            📱 Bayar via QRIS Instant
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center text-[10px] text-emerald-800 font-medium pt-1 border-t border-[#2DB24A]/20">
                        <span>Sisa Saldo Setelah Setor:</span>
                        <span className="font-bold">Rp {(userBalance - Number(depositAmount || 0)).toLocaleString('id-ID')}</span>
                      </div>
                    )}
                  </div>
                )}

                {depositPaymentMethod === 'QRIS' && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3 text-center">
                    <div className="bg-white p-3 rounded-2xl inline-block shadow-sm border border-gray-200">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=QRIS_SETOR_${selectedSavingsProduct.id}_${depositAmount || 0}`}
                        alt="QRIS Code"
                        className="w-36 h-36 mx-auto rounded-lg"
                      />
                      <div className="flex items-center justify-center gap-1 mt-2 text-[10px] font-extrabold text-gray-800 uppercase tracking-wider">
                        <QrCode className="w-3.5 h-3.5 text-[#2DB24A]" /> QRIS TERAS KOPERASI
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                      Scan QRIS ini dengan mobile banking atau e-wallet (GoPay, OVO, Dana, ShopeePay, LinkAja).
                    </p>
                  </div>
                )}

                {depositPaymentMethod === 'BANK' && (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2 text-xs">
                    <span className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider">Nomor Virtual Account</span>
                    <div className="flex justify-between items-center p-2.5 bg-white rounded-xl border border-gray-200">
                      <div>
                        <span className="block text-[9px] text-gray-400 font-bold">BCA Virtual Account</span>
                        <span className="font-mono font-extrabold text-gray-900 text-xs">8801 2398 4920 192</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => goeyToast.success('Nomor Virtual Account BCA berhasil disalin!')}
                        className="px-2.5 py-1 bg-[#E8F8EE] hover:bg-[#2DB24A] text-[#0F5132] hover:text-white font-bold text-[10px] rounded-lg transition-colors cursor-pointer"
                      >
                        Salin
                      </button>
                    </div>
                  </div>
                )}

                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-gray-500">Total Pembayaran:</span>
                    <span className="font-extrabold text-[#2DB24A]">
                      Rp {Number(depositAmount || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPaySavingsModalOpen(false)}
                    className="flex-1 py-2.5 border rounded-xl font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={actionPending || (depositPaymentMethod === 'SALDO' && userBalance < Number(depositAmount || 0))}
                    className={`flex-1 py-2.5 font-extrabold rounded-xl shadow-md flex items-center justify-center gap-1.5 ${depositPaymentMethod === 'SALDO' && userBalance < Number(depositAmount || 0)
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-[#0F5132] hover:bg-emerald-900 text-white cursor-pointer'
                      }`}
                  >
                    {actionPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Konfirmasi Setor'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* MODAL DETAIL SHU & PERHITUNGAN RAT ANGGOTA */}
        {shuDetailModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-gray-100 relative text-gray-800"
            >
              <button
                type="button"
                onClick={() => setShuDetailModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                <div className="w-12 h-12 rounded-2xl bg-[#E8F8EE] text-[#2DB24A] flex items-center justify-center shrink-0">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-sora text-base font-extrabold text-gray-900">
                    Detail SHU RAT {shuConfig?.year || new Date().getFullYear()}
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    Sisa Hasil Usaha Koperasi Anggota
                  </p>
                </div>
              </div>

              {/* Total Card */}
              <div className="p-4 bg-gradient-to-br from-[#0F5132] to-emerald-800 text-white rounded-2xl shadow-sm flex items-center justify-between">
                <div>
                  <span className="block text-[10px] text-emerald-200 font-bold uppercase tracking-wider">Estimasi Total SHU Diterima</span>
                  <span className="font-sora font-extrabold text-xl md:text-2xl text-white">
                    Rp {Math.round(userShu?.totalShuAmount || 670000).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold text-emerald-100 font-mono">
                  RAT 2026
                </div>
              </div>

              {/* Breakdown Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Rincian Komponen Pembagian:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-[#E8F8EE] border border-[#2DB24A]/30 rounded-xl space-y-1">
                    <span className="block text-[10px] font-bold text-[#0F5132] uppercase">1. SHU Jasa Modal</span>
                    <span className="block font-mono font-extrabold text-emerald-800 text-sm">
                      Rp {Math.round(userShu?.shuJasaModalAmount || 250000).toLocaleString('id-ID')}
                    </span>
                    <span className="block text-[9px] text-gray-500">
                      Berdasarkan Simpanan Saya: Rp {(userShu?.simpananMember || 400000).toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                    <span className="block text-[10px] font-bold text-amber-800 uppercase">2. SHU Jasa Usaha</span>
                    <span className="block font-mono font-extrabold text-amber-900 text-sm">
                      Rp {Math.round(userShu?.shuJasaUsahaAmount || 420000).toLocaleString('id-ID')}
                    </span>
                    <span className="block text-[9px] text-gray-500">
                      Berdasarkan Transaksi Saya: Rp {(userShu?.transaksiMember || 3500000).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>

              {/* RAT Allocation Config Info */}
              <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-2 text-xs">
                <span className="block font-bold text-gray-700 text-[11px]">Komposisi Pembagian Hasil RAT Koperasi:</span>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-gray-600 font-medium">
                  <div className="flex justify-between"><span>Cadangan Koperasi:</span> <span className="font-bold">{shuConfig?.pctCadangan || 25}%</span></div>
                  <div className="flex justify-between"><span>SHU Jasa Modal:</span> <span className="font-bold">{shuConfig?.pctJasaModal || 20}%</span></div>
                  <div className="flex justify-between"><span>SHU Jasa Usaha:</span> <span className="font-bold">{shuConfig?.pctJasaUsaha || 30}%</span></div>
                  <div className="flex justify-between"><span>Dana Diklat Member:</span> <span className="font-bold">{shuConfig?.pctPendidikan || 2.5}%</span></div>
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShuDetailModalOpen(false)}
                  className="w-full py-2.5 bg-[#0F5132] hover:bg-emerald-900 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer text-center"
                >
                  Tutup Detail SHU
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* UNSAVED SETTINGS WARNING MODAL (EXACTLY MATCHING THE USER'S ATTACHED DESIGN) */}
      {showUnsavedModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-[999] animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full mx-4 shadow-xl space-y-4 animate-scaleUp text-center">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto text-amber-500">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-base font-bold text-gray-800 font-sora">Pengaturan belum tersimpan</h3>
              <p className="text-[11px] text-gray-500 font-medium leading-relaxed px-2">
                Pengaturan belum kamu simpan, apakah kamu ingin pindah ke halaman lain?
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowUnsavedModal(false)
                  setPendingTargetNav(null)
                }}
                className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-600 font-extrabold text-xs rounded-xl hover:bg-gray-50 transition-all cursor-pointer"
              >
                Tidak Pindah
              </button>
              <button
                onClick={() => {
                  setDisabledModules(savedDisabledModules)
                  if (pendingTargetNav) {
                    setActiveSidebarNav(pendingTargetNav as any)
                  }
                  setShowUnsavedModal(false)
                  setPendingTargetNav(null)
                }}
                className="flex-1 py-2.5 bg-[#FF9800] hover:bg-[#F57C00] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Pindah
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
