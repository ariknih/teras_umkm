'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
import { logout } from '@/app/actions/auth'
import { Logo } from '@/components/Logo'
import {
  updateUserRoleAndLevelAction,
  addCourseAction,
  updateCourseAction,
  deleteCourseAction,
  addLessonAction,
  updateLessonAction,
  deleteLessonAction,
  trackTransactionAction,
  generateDummyAffiliatesAction,
  getAdminsAction,
  createAdminAction,
  deleteAdminAction,
  getInvoiceMembershipsAction,
  verifyInvoiceMembershipAction,
  getAllCoinHoldersAction,
  injectCoinAction,
  getLevelRequestsAction,
  approveLevelRequestAction,
  rejectLevelRequestAction,
  createCommunityAdminAction,
  updateCommunityAdminAction,
  deleteCommunityAdminAction,
  updateUserIndukCommunityAction,
  updateAdminPermissionsAction,
  getGlobalKycSettingAction,
  updateGlobalKycSettingAction
} from '@/app/actions/admin'
import { calculateAndSaveShuAction } from '@/app/actions/shu'
import {
  createCoinVoucherAdmin,
  toggleCoinVoucherActive,
  getCoinAdminStats
} from '@/app/actions/coin'
import PaymentMethodsTab from './components/PaymentMethodsTab'

const ALL_ADMIN_PERMISSIONS = [
  { key: 'overview', label: 'Dashboard Overview' },
  { key: 'users', label: 'Kelola User & Role' },
  { key: 'community', label: 'Komunitas Induk & Member' },
  { key: 'approvals', label: 'Persetujuan Merchant' },
  { key: 'withdrawals', label: 'Pencairan Dana (Withdraw)' },
  { key: 'products', label: 'Katalog Produk & Jasa' },
  { key: 'academy', label: 'LMS Kelola Materi' },
  { key: 'transactions', label: 'Lacak Transaksi' },
  { key: 'certificates', label: 'Sertifikat Level Up' },
  { key: 'affiliates', label: 'Monitor Affiliate' },
  { key: 'coins', label: 'Kelola Koin & Voucher' },
  { key: 'shu', label: 'Pengaturan SHU RAT Koperasi' },
  { key: 'payment_methods', label: 'Kelola Metode Pembayaran' }
]

interface AdminDashboardClientProps {
  currentUser: any
  initialUsers: any[]
  initialProducts: any[]
  initialPosts: any[]
  initialOrders: any[]
  initialCourses: any[]
  initialWithdrawals: any[]
  initialVouchers: any[]
  initialCoinStats: any
  initialAdmins: any[]
  initialInvoices: any[]
  initialCoinHolders: any[]
  initialLevelRequests: any[]
  initialCommunities?: any[]
}

type TabType = 'overview' | 'users' | 'admins' | 'approvals' | 'withdrawals' | 'products' | 'academy' | 'community' | 'transactions' | 'certificates' | 'affiliates' | 'coins' | 'shu' | 'payment_methods'

export default function AdminDashboardClient({
  currentUser,
  initialUsers,
  initialProducts,
  initialPosts,
  initialOrders,
  initialCourses,
  initialWithdrawals,
  initialVouchers,
  initialCoinStats,
  initialAdmins,
  initialInvoices,
  initialCoinHolders,
  initialLevelRequests,
  initialCommunities = []
}: AdminDashboardClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [isPending, startTransition] = useTransition()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  // State lists
  const [users, setUsers] = useState(initialUsers)
  const [products, setProducts] = useState(initialProducts)
  const [posts, setPosts] = useState(initialPosts)
  const [orders, setOrders] = useState(initialOrders)
  const [courses, setCourses] = useState(initialCourses)
  const [withdrawals, setWithdrawals] = useState(initialWithdrawals)
  const [processedWithdrawals, setProcessedWithdrawals] = useState<string[]>([])

  const [vouchers, setVouchers] = useState(initialVouchers || [])
  const [coinStats, setCoinStats] = useState(initialCoinStats || { totalTx: 0, totalRedemptions: 0, recentTx: [] })

  const [admins, setAdmins] = useState(initialAdmins || [])
  const [invoices, setInvoices] = useState(initialInvoices || [])
  const [coinHolders, setCoinHolders] = useState(initialCoinHolders || [])
  const [levelRequests, setLevelRequests] = useState(initialLevelRequests || [])

  // Community Management State
  const [communities, setCommunities] = useState<any[]>(initialCommunities || [])
  const [communitySearch, setCommunitySearch] = useState('')
  const [communityTypeFilter, setCommunityTypeFilter] = useState('ALL')
  const [communityCategoryFilter, setCommunityCategoryFilter] = useState('ALL')

  const [communityModal, setCommunityModal] = useState<{ open: boolean; mode: 'add' | 'edit'; data?: any }>({
    open: false,
    mode: 'add'
  })
  const [selectedTemplate, setSelectedTemplate] = useState('Community')
  const [moduleSettingsOpen, setModuleSettingsOpen] = useState(false)
  const [modulesConfig, setModulesConfig] = useState<Record<string, boolean>>({
    heroBanner: true,
    aktivitas: true,
    diskusi: true,
    event: true,
    produkAnggota: true,
    galeri: true,
    anggota: true,
  })
  const [commForm, setCommForm] = useState({
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
  })

  const [memberModal, setMemberModal] = useState<{ open: boolean; community?: any }>({ open: false })
  const [selectedMemberUserId, setSelectedMemberUserId] = useState('')
  const [globalKycRequired, setGlobalKycRequired] = useState(true)

  React.useEffect(() => {
    getGlobalKycSettingAction().then(res => {
      if (res && res.required !== undefined) {
        setGlobalKycRequired(res.required)
      }
    })
  }, [])

  const handleToggleGlobalKycSetting = async () => {
    const nextState = !globalKycRequired
    startTransition(async () => {
      const res = await updateGlobalKycSettingAction(nextState)
      if (res.success) {
        setGlobalKycRequired(nextState)
        setActionSuccess(`Syarat KYC untuk membuat Komunitas Induk diubah menjadi ${nextState ? 'WAJIB (Aktif)' : 'OPSIONAL / MATI (Bebas untuk Semua Merchant)'}.`)
      } else {
        setActionError(res.error || 'Gagal mengubah pengaturan.')
      }
    })
  }

  // Admin CRUD & RBAC Permission Form State
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminIsSuper, setAdminIsSuper] = useState(false)
  const [selectedAdminPermissions, setSelectedAdminPermissions] = useState<string[]>(
    ALL_ADMIN_PERMISSIONS.map(p => p.key)
  )
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false)
  const [editAdminPermModal, setEditAdminPermModal] = useState<{ open: boolean; admin?: any }>({ open: false })

  // Inject Coin Form State
  const [injectTargetId, setInjectTargetId] = useState('')
  const [injectTargetType, setInjectTargetType] = useState<'USER' | 'COMMUNITY'>('USER')
  const [injectAmount, setInjectAmount] = useState('')
  const [injectReason, setInjectReason] = useState('')
  const [isInjectModalOpen, setIsInjectModalOpen] = useState(false)

  // Level Request Review Form State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [rejectRequestId, setRejectRequestId] = useState('')
  const [rejectNote, setInjectRejectNote] = useState('')

  // Voucher Form State
  const [voucherName, setVoucherName] = useState('')
  const [voucherDesc, setVoucherDesc] = useState('')
  const [voucherType, setVoucherType] = useState<'INTERNAL' | 'EXTERNAL'>('INTERNAL')
  const [voucherCoinCost, setVoucherCoinCost] = useState('')
  const [voucherValue, setVoucherValue] = useState('')
  const [voucherCode, setVoucherCode] = useState('')
  const [voucherMaxRedemption, setVoucherMaxRedemption] = useState('0')
  const [voucherValidUntil, setVoucherValidUntil] = useState('')
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false)

  // Filters / Search
  const [userSearch, setUserSearch] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('ALL')
  
  const [productSearch, setProductSearch] = useState('')
  const [productCatFilter, setProductCatFilter] = useState('ALL')

  const [txSearch, setTxSearch] = useState('')
  const [selectedTx, setSelectedTx] = useState<any>(null)

  const [certUserSearch, setCertUserSearch] = useState('')
  const [selectedCertUser, setSelectedCertUser] = useState<any>(null)

  const [expandedAffiliateId, setExpandedAffiliateId] = useState<string | null>(null)

  // Modals / Forms State
  const [editUser, setEditUser] = useState<any>(null)
  
  const [courseModal, setCourseModal] = useState<{ open: boolean; mode: 'add' | 'edit'; data?: any }>({
    open: false,
    mode: 'add'
  })
  const [courseTitle, setCourseTitle] = useState('')
  const [courseDesc, setCourseDesc] = useState('')
  const [courseCover, setCourseCover] = useState('')
  const [courseAccess, setCourseAccess] = useState('Gold')
  const [courseImageError, setCourseImageError] = useState<string | null>(null)

  const [lessonModal, setLessonModal] = useState<{ open: boolean; mode: 'add' | 'edit'; courseId: string; data?: any }>({
    open: false,
    mode: 'add',
    courseId: ''
  })
  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonContent, setLessonContent] = useState('')
  const [lessonVideo, setLessonVideo] = useState('')
  const [lessonDuration, setLessonDuration] = useState('300')
  const [lessonOrderIndex, setLessonOrderIndex] = useState('1')
  const [lessonVideoError, setLessonVideoError] = useState<string | null>(null)
  const [isUploadingVideo, setIsUploadingVideo] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [uploadSpeed, setUploadSpeed] = useState<string>('')

  // SHU Configurator State
  const [shuCommunityId, setShuCommunityId] = useState(initialCommunities[0]?.id || '')
  const [shuYear, setShuYear] = useState(new Date().getFullYear())
  const [shuNetProfit, setShuNetProfit] = useState('500000000')

  const [pctJasaModal, setPctJasaModal] = useState('20')
  const [pctJasaUsaha, setPctJasaUsaha] = useState('30')

  const [shuCalcResult, setShuCalcResult] = useState<any>(null)

  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  const totalShuPct = (Number(pctJasaModal) || 0) + (Number(pctJasaUsaha) || 0)

  const handleCalculateShuSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!shuCommunityId) {
      alert('Pilih Komunitas Koperasi terlebih dahulu.')
      return
    }

    if (Math.abs(totalShuPct - 100) > 0.01) {
      alert(`Total persentase Jasa Modal & Jasa Usaha harus tepat 100%. Total saat ini: ${totalShuPct.toFixed(2)}%`)
      return
    }

    setActionError(null)
    setActionSuccess(null)

    startTransition(async () => {
      const formData = new FormData()
      formData.append('communityId', shuCommunityId)
      formData.append('year', String(shuYear))
      formData.append('totalNetProfit', shuNetProfit)
      formData.append('pctCadangan', '0')
      formData.append('pctJasaModal', pctJasaModal)
      formData.append('pctJasaUsaha', pctJasaUsaha)
      formData.append('pctPengurus', '0')
      formData.append('pctPengawas', '0')
      formData.append('pctKaryawan', '0')
      formData.append('pctPendidikan', '0')
      formData.append('pctSosial', '0')
      formData.append('pctPembangunanDaerah', '0')

      const res = await calculateAndSaveShuAction(formData)
      if (res.success && res.data) {
        setShuCalcResult(res.data)
        setActionSuccess(`Perhitungan & Distribusi SHU Koperasi RAT ${shuYear} berhasil disimpan!`)
        router.refresh()
      } else {
        setActionError(res.error || 'Gagal menghitung SHU.')
      }
    })
  }

  // Helper stats
  const totalVolume = orders.reduce((sum, o) => sum + o.totalAmount, 0)
  const totalUsers = users.length
  const totalProducts = products.length
  const totalPosts = posts.length

  const handleLogout = async () => {
    await logout()
    window.location.href = '/'
  }

  // ─── USER SUBMIT HANDLERS ──────────────────────────────────────────────────
  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editUser) return
    setActionError(null)
    setActionSuccess(null)

    startTransition(async () => {
      const resRole = await updateUserRoleAndLevelAction(
        editUser.id,
        editUser.role,
        Number(editUser.level),
        Number(editUser.xp),
        editUser.membershipLevel,
        editUser.membershipAccess,
        editUser.bootcampStatus || 'NONE'
      )

      const resInduk = await updateUserIndukCommunityAction(
        editUser.id,
        editUser.indukCommunityId || null
      )

      if (resRole.success && resInduk.success) {
        setUsers(prev => prev.map(u => u.id === editUser.id ? editUser : u))
        setActionSuccess(`User "${editUser.name}" berhasil diperbarui.`)
        setEditUser(null)
        router.refresh()
      } else {
        setActionError(resRole.error || resInduk.error || 'Terjadi kesalahan.')
      }
    })
  }

  // ─── COMMUNITY CRUD HANDLERS ────────────────────────────────────────────────
  const handleOpenAddCommunity = () => {
    setCommForm({
      name: '',
      type: '',
      category: '',
      ketuaId: users[0]?.id || '',
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
      isVerified: true,
      isSuspended: false,
      isKycRequired: false
    })
    setCommunityModal({ open: true, mode: 'add' })
  }

  const handleOpenEditCommunity = (comm: any) => {
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
      const res = await updateCommunityAdminAction(comm.id, {
        ...comm,
        isKycRequired: newKyc
      })
      if (res.success) {
        setCommunities(prev => prev.map(c => c.id === comm.id ? { ...c, isKycRequired: newKyc } : c))
        setActionSuccess(`Syarat KYC Komunitas "${comm.name}" diubah menjadi ${newKyc ? 'WAJIB' : 'OPSIONAL'}.`)
        router.refresh()
      } else {
        setActionError(res.error || 'Gagal mengubah status KYC.')
      }
    })
  }

  const handleSaveCommunitySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!commForm.name || !commForm.ketuaId || !commForm.type || !commForm.category) {
      alert('Nama komunitas, Ketua, Tipe Komunitas, dan Kategori Wajib diisi.')
      return
    }
    setActionError(null)
    setActionSuccess(null)

    startTransition(async () => {
      if (communityModal.mode === 'add') {
        const res = await createCommunityAdminAction(commForm)
        if (res.success && res.community) {
          setCommunities(prev => [...prev, res.community])
          setActionSuccess(`Komunitas Induk "${commForm.name}" berhasil dibuat.`)
          setCommunityModal({ open: false, mode: 'add' })
          router.refresh()
        } else {
          setActionError(res.error || 'Gagal membuat komunitas baru.')
        }
      } else {
        const id = communityModal.data.id
        const res = await updateCommunityAdminAction(id, commForm)
        if (res.success && res.community) {
          setCommunities(prev => prev.map(c => c.id === id ? { ...c, ...res.community } : c))
          setActionSuccess(`Komunitas Induk "${commForm.name}" berhasil diperbarui.`)
          setCommunityModal({ open: false, mode: 'add' })
          router.refresh()
        } else {
          setActionError(res.error || 'Gagal memperbarui komunitas.')
        }
      }
    })
  }

  const handleDeleteCommunity = (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus Komunitas Induk "${name}"?`)) return
    setActionError(null)
    setActionSuccess(null)

    startTransition(async () => {
      const res = await deleteCommunityAdminAction(id)
      if (res.success) {
        setCommunities(prev => prev.filter(c => c.id !== id))
        setActionSuccess(`Komunitas Induk "${name}" berhasil dihapus.`)
        router.refresh()
      } else {
        setActionError(res.error || 'Gagal menghapus komunitas.')
      }
    })
  }

  const handleApproveCommunity = (comm: any) => {
    if (!confirm(`Setujui & Verifikasi Komunitas "${comm.name}"? Komunitas akan aktif dan otomatis dipublikasikan di halaman Direktori Komunitas.`)) return
    setActionError(null)
    setActionSuccess(null)

    startTransition(async () => {
      const res = await updateCommunityAdminAction(comm.id, { isVerified: true, isSuspended: false })
      if (res.success) {
        setCommunities(prev => prev.map(c => c.id === comm.id ? { ...c, isVerified: true, isSuspended: false } : c))
        setActionSuccess(`Komunitas "${comm.name}" berhasil diverifikasi dan AKTIF!`)
        router.refresh()
      } else {
        setActionError(res.error || 'Gagal memverifikasi komunitas.')
      }
    })
  }

  const handleRejectCommunity = (comm: any) => {
    if (!confirm(`Tolak / Tangguhkan Komunitas "${comm.name}"? Komunitas tidak akan ditampilkan publik.`)) return
    setActionError(null)
    setActionSuccess(null)

    startTransition(async () => {
      const res = await updateCommunityAdminAction(comm.id, { isVerified: false, isSuspended: true })
      if (res.success) {
        setCommunities(prev => prev.map(c => c.id === comm.id ? { ...c, isVerified: false, isSuspended: true } : c))
        setActionSuccess(`Komunitas "${comm.name}" telah DITOLAK / DITANGGUHKAN.`)
        router.refresh()
      } else {
        setActionError(res.error || 'Gagal menolak komunitas.')
      }
    })
  }

  const handleAddMemberToCommunity = async (communityId: string, userId: string) => {
    if (!userId) return
    setActionError(null)
    setActionSuccess(null)

    startTransition(async () => {
      const res = await updateUserIndukCommunityAction(userId, communityId)
      if (res.success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, indukCommunityId: communityId } : u))
        setActionSuccess('Anggota berhasil didaftarkan ke Komunitas Induk ini.')
        setSelectedMemberUserId('')
        router.refresh()
      } else {
        setActionError(res.error || 'Gagal menambahkan anggota.')
      }
    })
  }

  const handleApproveMerchant = (userId: string) => {
    if (!confirm('Setujui merchant ini agar dapat berjualan secara publik?')) return
    setActionError(null)
    setActionSuccess(null)

    startTransition(async () => {
      // Find the user to get existing props, only changing level to 2 (approved)
      const u = users.find(x => x.id === userId)
      if (!u) return
      
      const res = await updateUserRoleAndLevelAction(
        u.id,
        u.role,
        2, // Change level to 2
        u.xp,
        u.membershipLevel,
        u.membershipAccess,
        u.bootcampStatus || 'NONE'
      )

      if (res.success) {
        setUsers(prev => prev.map(user => user.id === userId ? { ...user, level: 2 } : user))
        setActionSuccess(`Merchant "${u.name}" telah disetujui.`)
      } else {
        setActionError(res.error || 'Terjadi kesalahan saat menyetujui merchant.')
      }
    })
  }

  // ─── ADMIN & COIN & LEVELING HANDLERS ──────────────────────────────────────
  const handleCreateAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminName || !adminEmail || !adminPassword) {
      alert('Semua kolom wajib diisi.')
      return
    }
    setActionError(null)
    setActionSuccess(null)
    const formData = new FormData()
    formData.append('name', adminName)
    formData.append('email', adminEmail)
    formData.append('password', adminPassword)
    formData.append('isSuperAdmin', String(adminIsSuper))

    startTransition(async () => {
      const res = await createAdminAction(formData)
      if (res.success) {
        setActionSuccess('Admin baru berhasil ditambahkan.')
        setAdmins(prev => [...prev, res.admin])
        setIsAdminModalOpen(false)
        setAdminName('')
        setAdminEmail('')
        setAdminPassword('')
        setAdminIsSuper(false)
        router.refresh()
      } else {
        setActionError(res.error || 'Gagal menambahkan admin.')
      }
    })
  }

  const handleDeleteAdmin = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus admin ini?')) return
    setActionError(null)
    setActionSuccess(null)
    startTransition(async () => {
      const res = await deleteAdminAction(id)
      if (res.success) {
        setActionSuccess('Admin berhasil dihapus.')
        setAdmins(prev => prev.filter(x => x.id !== id))
        router.refresh()
      } else {
        setActionError(res.error || 'Gagal menghapus admin.')
      }
    })
  }

  const handleVerifyInvoice = async (membershipId: string) => {
    if (!confirm('Apakah Anda yakin ingin memverifikasi pembayaran invoice keanggotaan ini?')) return
    setActionError(null)
    setActionSuccess(null)
    startTransition(async () => {
      const res = await verifyInvoiceMembershipAction(membershipId)
      if (res.success) {
        setActionSuccess('Invoice keanggotaan berhasil diverifikasi.')
        setInvoices(prev => prev.map(inv => inv.id === membershipId ? { ...inv, invoiceStatus: 'VERIFIED', isPaid: true } : inv))
        const holders = await getAllCoinHoldersAction()
        setCoinHolders(holders)
        router.refresh()
      } else {
        setActionError((res as any).error || 'Gagal memverifikasi invoice.')
      }
    })
  }

  const handleInjectCoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!injectTargetId || !injectAmount || !injectReason) {
      alert('Semua kolom wajib diisi.')
      return
    }
    setActionError(null)
    setActionSuccess(null)
    const formData = new FormData()
    formData.append('targetId', injectTargetId)
    formData.append('targetType', injectTargetType)
    formData.append('amount', injectAmount)
    formData.append('reason', injectReason)

    startTransition(async () => {
      const res = await injectCoinAction(formData)
      if (res.success) {
        setActionSuccess(`Inject ${injectAmount} koin berhasil dilakukan.`)
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
        setActionError(res.error || 'Gagal melakukan inject koin.')
      }
    })
  }

  const handleApproveLevel = async (requestId: string) => {
    if (!confirm('Apakah Anda yakin ingin menyetujui pengajuan level ini?')) return
    setActionError(null)
    setActionSuccess(null)
    startTransition(async () => {
      const res = await approveLevelRequestAction(requestId)
      if (res.success) {
        setActionSuccess('Pengajuan level berhasil disetujui.')
        setLevelRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'APPROVED' } : r))
        const req = levelRequests.find(r => r.id === requestId)
        if (req) {
          setUsers(prev => prev.map(u => u.id === req.userId ? { ...u, merchantLevel: req.targetLevel } : u))
        }
        router.refresh()
      } else {
        setActionError(res.error || 'Gagal menyetujui pengajuan level.')
      }
    })
  }

  const handleOpenRejectModal = (requestId: string) => {
    setRejectRequestId(requestId)
    setInjectRejectNote('')
    setIsRejectModalOpen(true)
  }

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectNote) {
      alert('Alasan penolakan harus diisi.')
      return
    }
    setActionError(null)
    setActionSuccess(null)
    setIsRejectModalOpen(false)
    startTransition(async () => {
      const res = await rejectLevelRequestAction(rejectRequestId, rejectNote)
      if (res.success) {
        setActionSuccess('Pengajuan level berhasil ditolak.')
        setLevelRequests(prev => prev.map(r => r.id === rejectRequestId ? { ...r, status: 'REJECTED', reviewNote: rejectNote } : r))
        router.refresh()
      } else {
        setActionError(res.error || 'Gagal menolak pengajuan level.')
      }
    })
  }

  // ─── COURSE SUBMIT HANDLERS ────────────────────────────────────────────────
  const handleCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setActionError(null)
    setActionSuccess(null)

    startTransition(async () => {
      if (courseModal.mode === 'add') {
        const res = await addCourseAction(courseTitle, courseDesc, courseCover, courseAccess)
        if (res.success && res.course) {
          setCourses(prev => [...prev, res.course])
          setActionSuccess('Kelas baru berhasil ditambahkan.')
          setCourseModal({ open: false, mode: 'add' })
          resetCourseForm()
        } else {
          setActionError(res.error || 'Gagal menambahkan kelas.')
        }
      } else {
        const id = courseModal.data.id
        const res = await updateCourseAction(id, courseTitle, courseDesc, courseCover, courseAccess)
        if (res.success) {
          setCourses(prev => prev.map(c => c.id === id ? { ...c, title: courseTitle, description: courseDesc, coverImage: courseCover, accessRequired: courseAccess } : c))
          setActionSuccess('Kelas berhasil diperbarui.')
          setCourseModal({ open: false, mode: 'add' })
          resetCourseForm()
        } else {
          setActionError(res.error || 'Gagal memperbarui kelas.')
        }
      }
    })
  }

  const handleDeleteCourse = (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kelas ini beserta semua pelajarannya?')) return
    setActionError(null)
    setActionSuccess(null)

    startTransition(async () => {
      const res = await deleteCourseAction(id)
      if (res.success) {
        setCourses(prev => prev.filter(c => c.id !== id))
        setActionSuccess('Kelas berhasil dihapus.')
      } else {
        setActionError(res.error || 'Gagal menghapus kelas.')
      }
    })
  }

  const resetCourseForm = () => {
    setCourseTitle('')
    setCourseDesc('')
    setCourseCover('')
    setCourseAccess('Gold')
    setCourseImageError(null)
  }

  const openEditCourse = (course: any) => {
    setCourseTitle(course.title)
    setCourseDesc(course.description)
    setCourseCover(course.coverImage || '')
    setCourseAccess(course.accessRequired || 'Gold')
    setCourseImageError(null)
    setCourseModal({ open: true, mode: 'edit', data: course })
  }

  // ─── LESSON SUBMIT HANDLERS ────────────────────────────────────────────────
  const handleLessonSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setActionError(null)
    setActionSuccess(null)

    const cId = lessonModal.courseId
    const dur = Number(lessonDuration)
    const idx = Number(lessonOrderIndex)

    startTransition(async () => {
      if (lessonModal.mode === 'add') {
        const res = await addLessonAction(cId, lessonTitle, lessonContent, lessonVideo, dur, idx)
        if (res.success && res.lesson) {
          setCourses(prev => prev.map(c => {
            if (c.id === cId) {
              const lessons = [...(c.lessons || []), res.lesson].sort((a,b) => a.orderIndex - b.orderIndex)
              return { ...c, lessons }
            }
            return c
          }))
          setActionSuccess('Materi pelajaran berhasil ditambahkan.')
          setLessonModal({ open: false, mode: 'add', courseId: '' })
          resetLessonForm()
        } else {
          setActionError(res.error || 'Gagal menambahkan materi pelajaran.')
        }
      } else {
        const id = lessonModal.data.id
        const res = await updateLessonAction(id, cId, lessonTitle, lessonContent, lessonVideo, dur, idx)
        if (res.success) {
          setCourses(prev => prev.map(c => {
            if (c.id === cId) {
              const lessons = (c.lessons || []).map((l: any) => l.id === id ? { ...l, title: lessonTitle, content: lessonContent, videoUrl: lessonVideo, duration: dur, orderIndex: idx } : l).sort((a: any, b: any) => a.orderIndex - b.orderIndex)
              return { ...c, lessons }
            }
            return c
          }))
          setActionSuccess('Materi pelajaran berhasil diperbarui.')
          setLessonModal({ open: false, mode: 'add', courseId: '' })
          resetLessonForm()
        } else {
          setActionError(res.error || 'Gagal memperbarui materi pelajaran.')
        }
      }
    })
  }

  const handleDeleteLesson = (id: string, courseId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus materi pelajaran ini?')) return
    setActionError(null)
    setActionSuccess(null)

    startTransition(async () => {
      const res = await deleteLessonAction(id, courseId)
      if (res.success) {
        setCourses(prev => prev.map(c => {
          if (c.id === courseId) {
            return { ...c, lessons: (c.lessons || []).filter((l: any) => l.id !== id) }
          }
          return c
        }))
        setActionSuccess('Materi pelajaran berhasil dihapus.')
      } else {
        setActionError(res.error || 'Gagal menghapus materi.')
      }
    })
  }

  const handleShiftLessonOrder = (lesson: any, direction: 'up' | 'down', course: any) => {
    setActionError(null)
    setActionSuccess(null)
    const lessons = [...(course.lessons || [])].sort((a: any, b: any) => a.orderIndex - b.orderIndex)
    const idx = lessons.findIndex((l: any) => l.id === lesson.id)
    if (idx === -1) return
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= lessons.length) return

    const otherLesson = lessons[targetIdx]
    const tempIndex = lesson.orderIndex
    lesson.orderIndex = otherLesson.orderIndex
    otherLesson.orderIndex = tempIndex

    startTransition(async () => {
      const res1 = await updateLessonAction(lesson.id, course.id, lesson.title, lesson.content, lesson.videoUrl, lesson.duration, lesson.orderIndex)
      const res2 = await updateLessonAction(otherLesson.id, course.id, otherLesson.title, otherLesson.content, otherLesson.videoUrl, otherLesson.duration, otherLesson.orderIndex)
      if (res1.success && res2.success) {
        setCourses(prev => prev.map(c => {
          if (c.id === course.id) {
            const updated = (c.lessons || []).map((l: any) => {
              if (l.id === lesson.id) return { ...l, orderIndex: lesson.orderIndex }
              if (l.id === otherLesson.id) return { ...l, orderIndex: otherLesson.orderIndex }
              return l
            }).sort((a: any, b: any) => a.orderIndex - b.orderIndex)
            return { ...c, lessons: updated }
          }
          return c
        }))
        setActionSuccess('Urutan materi pelajaran berhasil digeser.')
      } else {
        setActionError('Gagal menggeser urutan materi pelajaran.')
      }
    })
  }

  const resetLessonForm = () => {
    setLessonTitle('')
    setLessonContent('')
    setLessonVideo('')
    setLessonDuration('300')
    setLessonOrderIndex('1')
  }

  const openAddLesson = (courseId: string) => {
    resetLessonForm()
    setLessonModal({ open: true, mode: 'add', courseId })
  }

  const openEditLesson = (lesson: any, courseId: string) => {
    setLessonTitle(lesson.title)
    setLessonContent(lesson.content || '')
    setLessonVideo(lesson.videoUrl || '')
    setLessonDuration(String(lesson.duration || 300))
    setLessonOrderIndex(String(lesson.orderIndex || 1))
    setLessonModal({ open: true, mode: 'edit', courseId, data: lesson })
  }

  // ─── SEARCH / FILTER CALCULATIONS ──────────────────────────────────────────
  const filteredUsers = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase())
    const matchRole = userRoleFilter === 'ALL' || u.role === userRoleFilter
    return matchSearch && matchRole
  })

  const filteredProducts = products.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(productSearch.toLowerCase()) || p.id.toLowerCase().includes(productSearch.toLowerCase())
    const matchCat = productCatFilter === 'ALL' || p.category === productCatFilter
    return matchSearch && matchCat
  })

  const searchedOrders = orders.filter(o => {
    if (!txSearch) return true
    return o.id.toLowerCase().includes(txSearch.toLowerCase()) || o.buyerId.toLowerCase().includes(txSearch.toLowerCase())
  })

  const certUsers = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(certUserSearch.toLowerCase()) || u.email.toLowerCase().includes(certUserSearch.toLowerCase())
    return matchSearch && u.level >= 3
  })

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fb] text-[#191c1e] font-sans antialiased relative">
      {/* Sidebar mobile overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden transition-all duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ─── SIDEBAR (Stitch Corporate Enterprise Redesign) ─────────────────────────── */}
      <aside className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-[#E5E7EB] flex flex-col justify-between transition-all duration-300 lg:translate-x-0 lg:static lg:flex-shrink-0 ${
        isSidebarCollapsed ? 'w-[76px]' : 'w-[260px]'
      } ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex-1 overflow-y-auto scrollbar-none">
          {/* Sidebar Brand Header */}
          <div className={`h-[64px] border-b border-[#E5E7EB] flex items-center justify-between transition-all duration-300 ${isSidebarCollapsed ? 'px-3 justify-center' : 'px-5 gap-3'}`}>
            {!isSidebarCollapsed ? (
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-9 h-9 bg-[#2db24a] text-white rounded-lg flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                  S
                </div>
                <div className="flex flex-col justify-center min-w-max">
                  <h1 className="font-bold text-sm text-[#006e24] leading-tight tracking-tight">Saloka Admin</h1>
                  <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">Enterprise Control</p>
                </div>
              </div>
            ) : (
              <div className="w-9 h-9 rounded-lg bg-[#2db24a] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                S
              </div>
            )}
            
            {/* Collapse Toggle Button */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden lg:flex items-center justify-center p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors border-none bg-transparent"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transform transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`}>
                <path d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {/* Grouped Navigation Links */}
          <nav className={`py-4 space-y-4 ${isSidebarCollapsed ? 'px-2' : 'px-3'}`}>
            {[
              {
                title: null,
                items: [
                  { id: 'overview', label: 'Dashboard Overview', icon: 'M4 6h16M4 12h16M4 18h16' }
                ]
              },
              {
                title: 'Management',
                items: [
                  { id: 'users', label: 'User Management', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm14-2a4 4 0 0 1-3.87 3M16 3.13a4 4 0 0 1 0 7.75' },
                  ...(currentUser.isSuperAdmin ? [{ id: 'admins', label: 'Admin RBAC', icon: 'M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm-7 16a7 7 0 0 1 14 0H5z' }] : []),
                  { id: 'approvals', label: 'Merchant Approval', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' }
                ]
              },
              {
                title: 'Operations',
                items: [
                  { id: 'withdrawals', label: 'Withdrawal Dana', icon: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
                  { id: 'products', label: 'Product Catalog', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
                  { id: 'academy', label: 'LMS Management', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4 1.253' },
                  { id: 'payment_methods', label: 'Metode Pembayaran', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.64-2.25 1.64-1.74 0-2.26-.95-2.32-1.81h-1.7c.07 1.78 1.12 3.06 2.96 3.53V20h2.16v-1.63c1.63-.35 2.86-1.46 2.86-3.04 0-1.71-1.12-2.71-3.51-3.26z' },
                  { id: 'shu', label: 'SHU Koperasi', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }
                ]
              },
              {
                title: 'Insights',
                items: [
                  { id: 'community', label: 'Community & Members', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
                  { id: 'transactions', label: 'Transaction Tracking', icon: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9l2 2 4-4' },
                  { id: 'certificates', label: 'Certification', icon: 'M12 14l-4-4 1.41-1.41L12 11.17l2.59-2.58L16 10l-4 4zm-6 4h12V6H6v12zm12-14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12z' },
                  { id: 'affiliates', label: 'Monitor Affiliate', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
                  { id: 'coins', label: 'Koin & Voucher', icon: 'M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM9 7.5A.75.75 0 0 0 9 9h1.5v2.25H9a.75.75 0 0 0 0 1.5h1.5V15a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-3V9H15a.75.75 0 0 0 0-1.5H9Z' }
                ]
              }
            ].map((group, groupIdx) => {
              const allowedItems = group.items.filter(item => {
                if (currentUser.isSuperAdmin) return true
                if (item.id === 'admins') return false
                let perms: string[] = []
                try {
                  perms = currentUser.adminPermissions ? JSON.parse(currentUser.adminPermissions) : ALL_ADMIN_PERMISSIONS.map(p => p.key)
                } catch (_) {
                  perms = ALL_ADMIN_PERMISSIONS.map(p => p.key)
                }
                return perms.includes(item.id)
              })

              if (allowedItems.length === 0) return null

              return (
                <div key={groupIdx} className="space-y-1">
                  {group.title && !isSidebarCollapsed && (
                    <p className="px-3 pt-2 pb-1 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
                      {group.title}
                    </p>
                  )}
                  {allowedItems.map(item => {
                    const isActive = activeTab === item.id
                    return (
                      <button
                        key={item.id}
                        onClick={() => { setActiveTab(item.id as TabType); setSelectedTx(null); setIsSidebarOpen(false); }}
                        className={`w-full flex items-center transition-all duration-200 cursor-pointer ${
                          isSidebarCollapsed ? 'justify-center p-2.5 rounded-lg' : 'gap-3 px-3.5 py-2.5 rounded-lg'
                        } ${
                          isActive 
                            ? 'bg-[#b0f1c7]/40 text-[#0f5132] font-semibold border-l-4 border-[#006e24] shadow-xs' 
                            : 'text-[#6B7280] hover:text-[#111111] hover:bg-[#f2f4f6]'
                        }`}
                        title={isSidebarCollapsed ? item.label : undefined}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                          <path d={item.icon} />
                        </svg>
                        {!isSidebarCollapsed && <span className="text-xs font-medium">{item.label}</span>}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </nav>
        </div>

        {/* Sidebar Footer User Info */}
        <div className={`p-4 border-t border-[#E5E7EB] bg-[#f8f9fb] flex ${isSidebarCollapsed ? 'flex-col gap-3 items-center justify-center' : 'items-center justify-between'}`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#006e24] flex items-center justify-center font-bold text-white shadow-xs text-xs shrink-0">
              {currentUser.name?.charAt(0).toUpperCase()}
            </div>
            {!isSidebarCollapsed && (
              <div className="min-w-0">
                <p className="text-xs font-bold truncate text-[#111111]">{currentUser.name}</p>
                <p className="text-[10px] text-[#6B7280] truncate">{currentUser.email}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            title="Log Out"
            className={`p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer transition-colors border border-red-100 ${isSidebarCollapsed ? 'w-8 h-8 flex items-center justify-center' : ''}`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ───────────────────────────────────── */}
      <main className="flex-grow flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-[64px] border-b border-[#E5E7EB] bg-white px-6 flex items-center justify-between flex-shrink-0 z-10 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-slate-100 lg:hidden text-slate-600 focus:outline-none cursor-pointer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h2 className="font-sora text-sm md:text-base font-bold text-[#111111] tracking-tight">
              { activeTab === 'overview' && 'Dashboard Overview' }
              { activeTab === 'users' && 'User Management' }
              { activeTab === 'admins' && 'Admin Management & RBAC' }
              { activeTab === 'approvals' && 'Merchant Approval' }
              { activeTab === 'withdrawals' && 'Financials & Withdrawals' }
              { activeTab === 'products' && 'Product Catalog' }
              { activeTab === 'academy' && 'LMS Management' }
              { activeTab === 'community' && 'Community & Members' }
              { activeTab === 'transactions' && 'Transaction Tracking' }
              { activeTab === 'certificates' && 'Certification Management' }
              { activeTab === 'affiliates' && 'Affiliate Monitoring' }
              { activeTab === 'coins' && 'Kelola Koin & Voucher' }
              { activeTab === 'shu' && 'Pengaturan SHU Koperasi' }
              { activeTab === 'payment_methods' && 'Kelola Metode Pembayaran' }
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-[#eef8e9] px-3 py-1.5 rounded-full border border-[#2db24a]/20">
              <span className="w-2 h-2 rounded-full bg-[#006e24] animate-pulse" />
              <span className="text-[11px] font-semibold text-[#006e24] tracking-wider uppercase">System Status: Active</span>
            </div>
            <Link href="/" className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-xs font-semibold text-[#6B7280] hover:text-[#111111] rounded-lg transition-colors border border-[#E5E7EB] shadow-xs">
              Return to Landing
            </Link>
          </div>
        </header>

        {/* Inner Content Area */}
        <div className="flex-grow overflow-y-auto p-8 relative">
          
          {/* Notifications */}
          {actionError && (
            <div className="mb-6 p-4 rounded-[var(--radius-brand)] bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              ⚠️ {actionError}
            </div>
          )}
          {actionSuccess && (
            <div className="mb-6 p-4 rounded-[var(--radius-brand)] bg-green-50 border border-green-200 text-xs text-green-700 font-medium">
              ✅ {actionSuccess}
            </div>
          )}

                    {/* ─── TAB 1: OVERVIEW (Stitch Bento Grid Redesign) ───────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              {/* Stat Cards Bento Grid */}
              <div className="grid grid-cols-12 gap-6">
                
                {/* Financial Performance Card (Span 8) */}
                <div className="col-span-12 lg:col-span-8 bg-white rounded-xl border border-[#E5E7EB] shadow-xs p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#eef8e9] rounded-full opacity-50 blur-3xl group-hover:bg-[#b0f1c7]/40 transition-colors duration-500 pointer-events-none" />
                  <div className="relative z-10 flex flex-col justify-between h-full">
                    <div>
                      <span className="inline-block px-2.5 py-1 bg-[#eef8e9] text-[#006e24] font-semibold text-[11px] uppercase tracking-wider rounded-md mb-4">
                        KINERJA FINANSIAL
                      </span>
                      <h3 className="font-semibold text-xs text-[#6B7280] mb-2 uppercase tracking-wider">TOTAL VOLUME JUAL BELI</h3>
                      <div className="flex items-baseline gap-3">
                        <span className="font-sora text-3xl font-extrabold text-[#2db24a] tracking-tight">
                          Rp {totalVolume.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                    <div className="mt-8 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#2db24a] animate-pulse" />
                      <span className="text-xs font-semibold text-[#6B7280]">{orders.length} order sukses terverifikasi</span>
                    </div>
                  </div>
                </div>

                {/* Total Users Card (Span 2) */}
                <div className="col-span-12 sm:col-span-6 lg:col-span-2 bg-white rounded-xl border border-[#E5E7EB] shadow-xs p-5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                  <div>
                    <span className="inline-block px-2.5 py-1 bg-[#e0f2fe] text-[#0369a1] font-semibold text-[11px] uppercase tracking-wider rounded-md mb-3">
                      KOMUNITAS
                    </span>
                    <h4 className="font-semibold text-[11px] text-[#6B7280] uppercase tracking-wider mb-1">TOTAL PENGGUNA</h4>
                    <div className="font-sora text-2xl font-bold text-[#1e3a8a] mb-2">{totalUsers}</div>
                  </div>
                  <p className="text-xs text-[#6B7280] leading-tight">Customer, Merchant & Affiliate</p>
                </div>

                {/* Total Products Card (Span 2) */}
                <div className="col-span-12 sm:col-span-6 lg:col-span-2 bg-white rounded-xl border border-[#E5E7EB] shadow-xs p-5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                  <div>
                    <span className="inline-block px-2.5 py-1 bg-[#ede9fe] text-[#6d28d9] font-semibold text-[11px] uppercase tracking-wider rounded-md mb-3">
                      ETALASE
                    </span>
                    <h4 className="font-semibold text-[11px] text-[#6B7280] uppercase tracking-wider mb-1">TOTAL PRODUK</h4>
                    <div className="font-sora text-2xl font-bold text-[#4c1d95] mb-2">{totalProducts}</div>
                  </div>
                  <p className="text-xs text-[#6B7280] leading-tight">Aktif di katalog UMKM</p>
                </div>

              </div>

              {/* Row 2: Role Distribution (Span 8) & Top Categories (Span 4) */}
              <div className="grid grid-cols-12 gap-6">
                
                {/* User Role Distribution Card */}
                <div className="col-span-12 lg:col-span-8 bg-white rounded-xl border border-[#E5E7EB] shadow-xs p-6">
                  <div className="flex justify-between items-center mb-6 border-b border-[#E5E7EB] pb-4">
                    <h3 className="font-sora text-sm font-bold text-[#111111]">DISTRIBUSI PERAN PENGGUNA</h3>
                    <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">DEMOGRAFI AKTIF</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { role: 'MERCHANT', count: users.filter(u => u.role === 'MERCHANT').length, desc: 'Penjual & Mitra Toko', barColor: 'bg-[#f59e0b]', badgeText: 'text-[#b45309]', badgeBg: 'bg-[#fffbeb]' },
                      { role: 'AFFILIATE', count: users.filter(u => u.role === 'AFFILIATE').length, desc: 'Pemasar Jaringan', barColor: 'bg-[#a855f7]', badgeText: 'text-[#7e22ce]', badgeBg: 'bg-[#faf5ff]' },
                      { role: 'CUSTOMER', count: users.filter(u => u.role === 'CUSTOMER').length, desc: 'Pembeli & LMS Learner', barColor: 'bg-[#3b82f6]', badgeText: 'text-[#1d4ed8]', badgeBg: 'bg-[#eff6ff]' }
                    ].map((item, idx) => {
                      const pct = Math.round((item.count / (totalUsers || 1)) * 100) || 0
                      return (
                        <div key={idx} className="p-4 bg-[#f8f9fb] rounded-lg border border-[#E5E7EB]">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider ${item.badgeBg} ${item.badgeText}`}>
                            {item.role}
                          </span>
                          <div className="flex items-end gap-2 mt-3 mb-1">
                            <span className="font-sora text-2xl font-bold text-[#111111]">{item.count}</span>
                            <span className="text-xs text-[#6B7280] pb-1 font-medium">({pct}%)</span>
                          </div>
                          <p className="text-[11px] text-[#6B7280] mb-3">{item.desc}</p>
                          <div className="w-full bg-[#E5E7EB] h-1.5 rounded-full overflow-hidden">
                            <div className={`${item.barColor} h-full rounded-full transition-all duration-300`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Top Categories Card */}
                <div className="col-span-12 lg:col-span-4 bg-white rounded-xl border border-[#E5E7EB] shadow-xs p-6 flex flex-col">
                  <div className="flex justify-between items-center mb-6 border-b border-[#E5E7EB] pb-4">
                    <h3 className="font-sora text-sm font-bold text-[#111111]">TOP KATEGORI PRODUK</h3>
                    <span className="text-[11px] font-semibold text-[#006e24] uppercase tracking-wider">PROPORSIONAL</span>
                  </div>
                  <div className="flex-1 flex flex-col justify-between gap-3.5">
                    {Array.from(new Set(products.map(p => p.category || 'LAINNYA'))).slice(0, 5).map(cat => {
                      const count = products.filter(p => p.category === cat).length
                      const pct = Math.round((count / (totalProducts || 1)) * 100) || 0
                      return (
                        <div key={cat}>
                          <div className="flex justify-between items-center text-xs mb-1">
                            <span className="font-semibold text-[#111111] uppercase text-[11px]">{cat.replace('_', ' ')}</span>
                            <span className="text-[#6B7280] font-medium text-[11px]">{count} item ({pct}%)</span>
                          </div>
                          <div className="w-full bg-[#f2f4f6] h-2 rounded-full overflow-hidden">
                            <div className="bg-[#2db24a] h-full rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

              </div>

              {/* Grid 3: Latest Transactions */}
              <div className="bg-white border border-[#e2e8f0] rounded-[var(--radius-brand)] p-6 hover:shadow-md transition-shadow duration-300">
                <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-sora text-sm font-extrabold text-slate-800 uppercase tracking-wider">5 Transaksi Terkini</h3>
                    <p className="text-[10px] text-slate-400 mt-1">Status dan mutasi penjualan di Teras UMKM</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('transactions')} 
                    className="px-3.5 py-1.5 border border-slate-100 hover:border-[#0F5132] text-[#0F5132] hover:bg-emerald-50/30 text-[9px] font-bold uppercase tracking-widest rounded-xl transition-all duration-200 cursor-pointer bg-transparent"
                  >
                    Semua Transaksi →
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[9px] font-mono">
                        <th className="pb-3 pl-2">ID Order</th>
                        <th className="pb-3">Pembeli</th>
                        <th className="pb-3">Tanggal Transaksi</th>
                        <th className="pb-3 text-right">Total Nominal</th>
                        <th className="pb-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {orders.slice(0, 5).map(o => {
                        const buyer = users.find(u => u.id === o.buyerId)
                        return (
                          <tr key={o.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                            <td className="py-3.5 pl-2 font-mono font-bold text-[#0F5132]">{o.id}</td>
                            <td className="py-3.5">
                              <p className="font-bold text-slate-800">{buyer?.name || 'Masyarakat/Customer'}</p>
                              <p className="text-[9px] font-mono text-slate-400">{buyer?.email || o.buyerId}</p>
                            </td>
                            <td className="py-3.5 text-slate-500 font-mono">
                              {new Date(o.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="py-3.5 text-right font-mono font-bold text-slate-800">
                              Rp {o.totalAmount.toLocaleString('id-ID')}
                            </td>
                            <td className="py-3.5 text-center">
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold uppercase text-[8px] tracking-widest font-mono">
                                {o.status}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )
          }
{/* ─── TAB 2: KELOLA USER ────────────────────────────────────────── */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Filter controls */}
              <div className="flex flex-col md:flex-row gap-4 bg-white border border-[#e2e8f0] p-4 rounded-[var(--radius-brand)] shadow-sm">
                <input
                  type="text"
                  placeholder="Cari user berdasarkan nama atau email..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="flex-grow bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-4 py-2.5 text-xs text-slate-800 placeholder-[#94a3b8] focus:outline-none focus:border-[#0F5132] focus:ring-1 focus:ring-[#0F5132]"
                />
                <select
                  value={userRoleFilter}
                  onChange={e => setUserRoleFilter(e.target.value)}
                  className="bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#0F5132]"
                >
                  <option value="ALL">Semua Role</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="MERCHANT">MERCHANT</option>
                  <option value="AFFILIATE">AFFILIATE</option>
                  <option value="CUSTOMER">CUSTOMER</option>
                  <option value="CUSTOMER_SERVICE">CUSTOMER_SERVICE</option>
                </select>
              </div>

              {/* Users table */}
              <div className="bg-white border border-[#e2e8f0] rounded-[var(--radius-brand)] overflow-x-auto shadow-sm">
                <table className="w-full min-w-[800px] text-xs text-left">
                  <thead className="bg-[#f8f9fa] border-b border-[#e2e8f0] text-[#64748b] uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-6 py-3.5">Nama & Email</th>
                      <th className="px-6 py-3.5">Role</th>
                      <th className="px-6 py-3.5 text-center">Level / XP</th>
                      <th className="px-6 py-3.5">Membership</th>
                      <th className="px-6 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800">{u.name}</p>
                          <p className="text-[10px] text-[#64748b] font-mono">{u.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${
                            u.role === 'ADMIN' ? 'bg-red-50 text-red-700 border-red-200' :
                            u.role === 'CUSTOMER_SERVICE' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                            u.role === 'MERCHANT' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            u.role === 'AFFILIATE' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <p className="font-bold text-slate-700">Level {u.level}</p>
                          <p className="text-[10px] text-[#64748b]">{u.xp} XP</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold border border-[#0F5132]/20 bg-[#E8F5E9] text-[#0F5132] uppercase tracking-wider">
                            {u.membershipLevel || 'Reseller'} / {u.membershipAccess || 'Gold'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setEditUser({ ...u })}
                            className="px-3.5 py-1 bg-[#0F5132]/10 hover:bg-[#0F5132]/20 text-[#0F5132] border border-[#0F5132]/20 rounded text-[11px] font-bold uppercase tracking-wider cursor-pointer"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Edit User Modal */}
              {editUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                  <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-fade-in">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <h3 className="font-sora text-sm font-bold text-[#006e24] uppercase tracking-wider">Edit Pengguna</h3>
                      <button onClick={() => setEditUser(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer text-lg">✕</button>
                    </div>

                    <form onSubmit={handleUpdateUser} className="space-y-4 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">Nama Lengkap</label>
                        <input
                          type="text"
                          disabled
                          value={editUser.name}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-600 outline-none"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">Email</label>
                        <input
                          type="text"
                          disabled
                          value={editUser.email}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-600 outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">Role Sistem</label>
                          <select
                            value={editUser.role}
                            onChange={e => setEditUser({ ...editUser, role: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 outline-none focus:border-[#2db24a] focus:ring-1 focus:ring-[#2db24a]"
                          >
                            <option value="ADMIN">ADMIN</option>
                            <option value="MERCHANT">MERCHANT</option>
                            <option value="AFFILIATE">AFFILIATE</option>
                            <option value="CUSTOMER">CUSTOMER</option>
                            <option value="CUSTOMER_SERVICE">CUSTOMER_SERVICE</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">Level</label>
                          <input
                            type="number"
                            value={editUser.level}
                            onChange={e => setEditUser({ ...editUser, level: Number(e.target.value), xp: Number(e.target.value) * 100 })}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 outline-none focus:border-[#2db24a] focus:ring-1 focus:ring-[#2db24a]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">Tingkatan Level</label>
                          <select
                            value={editUser.membershipLevel}
                            onChange={e => setEditUser({ ...editUser, membershipLevel: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 outline-none focus:border-[#2db24a] focus:ring-1 focus:ring-[#2db24a]"
                          >
                            <option value="Reseller">Reseller</option>
                            <option value="Agen">Agen</option>
                            <option value="Distributor">Distributor</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">Akses Keanggotaan</label>
                          <select
                            value={editUser.membershipAccess}
                            onChange={e => setEditUser({ ...editUser, membershipAccess: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 outline-none focus:border-[#2db24a] focus:ring-1 focus:ring-[#2db24a]"
                          >
                            <option value="Gold">Gold</option>
                            <option value="Platinum">Platinum</option>
                            <option value="Diamond">Diamond</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-[#006e24] uppercase tracking-wider mb-1.5 font-sora">Induk Komunitas Terasosiasi</label>
                        <select
                          value={editUser.indukCommunityId || ''}
                          onChange={e => setEditUser({ ...editUser, indukCommunityId: e.target.value || null })}
                          className="w-full bg-emerald-50/50 border border-emerald-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium outline-none focus:border-[#2db24a] focus:ring-1 focus:ring-[#2db24a]"
                        >
                          <option value="">-- Tanpa Induk Komunitas --</option>
                          {communities.map((c: any) => (
                            <option key={c.id} value={c.id}>{c.name} ({c.type} - {c.category})</option>
                          ))}
                        </select>
                      </div>

                      {editUser.role === 'MERCHANT' && (
                        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2">
                          <label className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
                            Kualifikasi Bootcamp Saloka
                          </label>
                          {editUser.level < 2 ? (
                            <div className="text-[11px] text-red-700 font-medium bg-red-50 border border-red-200 p-2.5 rounded-lg">
                              ⚠️ Merchant belum memenuhi syarat (Minimal Level 2). Saat ini: Level {editUser.level}
                            </div>
                          ) : (
                            <select
                              value={editUser.bootcampStatus || 'NONE'}
                              onChange={e => setEditUser({ ...editUser, bootcampStatus: e.target.value })}
                              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 outline-none focus:border-[#2db24a] focus:ring-1 focus:ring-[#2db24a]"
                            >
                              <option value="NONE">Tidak Terkualifikasi / Belum Aktif</option>
                              <option value="QUALIFIED">Lolos Kualifikasi (Tombol Aktif)</option>
                              <option value="JOINED">Sudah Bergabung (Joined)</option>
                            </select>
                          )}
                        </div>
                      )}

                      <div className="pt-4 flex gap-3">
                        <button
                          type="button"
                          onClick={() => setEditUser(null)}
                          className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={isPending}
                          className="flex-1 py-2.5 bg-[#2db24a] hover:bg-[#259a3f] text-white font-bold rounded-xl uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {isPending ? 'Menyimpan...' : 'Simpan'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── TAB 2.5: PERSETUJUAN MERCHANT ─────────────────────────────── */}
          {activeTab === 'approvals' && (
            <div className="space-y-6 animate-in fade-in duration-255">
              {/* Section 1: Verifikasi Merchant Baru */}
              <div className="bg-white border border-[#e2e8f0] p-6 rounded-[var(--radius-brand)] shadow-sm">
                <h3 className="font-sora text-sm font-bold text-slate-800 uppercase tracking-wider mb-2 border-b border-[#e2e8f0] pb-3 text-[#0F5132]">
                  Daftar Antrian Verifikasi Merchant (Baru)
                </h3>
                <p className="text-xs text-[#64748b] mb-4">
                  Merchant baru mendaftar (Level 1). Setujui agar terdaftar sebagai Merchant Aktif (Level 2).
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] text-xs text-left">
                    <thead className="bg-[#f8f9fa] border-b border-[#e2e8f0] text-[#64748b] uppercase tracking-wider text-[10px] font-bold">
                      <tr>
                        <th className="px-6 py-3">Nama Usaha / Email</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-center">Bergabung</th>
                        <th className="px-6 py-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-105">
                      {users.filter(u => u.role === 'MERCHANT' && u.level === 1).length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-6 text-center text-slate-400 italic">
                            🎉 Tidak ada antrian merchant baru.
                          </td>
                        </tr>
                      ) : (
                        users.filter(u => u.role === 'MERCHANT' && u.level === 1).map(u => (
                          <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-bold text-slate-800">{u.name}</p>
                              <p className="text-[10px] text-[#64748b] font-mono">{u.email}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-0.5 rounded text-[8px] font-bold border border-yellow-250 bg-yellow-50 text-yellow-750 uppercase tracking-wider">
                                Menunggu Verifikasi
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center text-[#64748b]">
                              {new Date(u.createdAt || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleApproveMerchant(u.id)}
                                disabled={isPending}
                                className="px-3.5 py-1.5 bg-[#2DB24A] hover:bg-[#259a3f] text-white rounded text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors cursor-pointer disabled:opacity-50 border-none"
                              >
                                {isPending ? 'Proses...' : 'Setujui'}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 2: Persetujuan Naik Level (L1 - L4) */}
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
                          const isOmsetQualified = req.omsetBulan >= 10000000;
                          return (
                            <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3">
                                <p className="font-bold text-slate-800">{req.user?.name || 'Merchant'}</p>
                                <p className="text-[10px] text-slate-500 font-mono">{req.user?.email}</p>
                                <p className="text-[9px] text-slate-450 mt-0.5">Level Saat Ini: L{req.user?.merchantLevel || 1}</p>
                              </td>
                              <td className="px-4 py-3 text-center font-bold text-slate-800">
                                L{req.targetLevel}
                              </td>
                              <td className="px-4 py-3 text-center font-semibold text-slate-700">
                                {req.radiusKm} KM
                              </td>
                              <td className="px-4 py-3 text-right">
                                <p className="font-bold text-slate-850">Rp {req.omsetBulan.toLocaleString('id-ID')}</p>
                                <span className={`inline-block text-[8px] font-bold px-1.5 py-0.2 rounded mt-0.5 border ${
                                  isOmsetQualified 
                                    ? 'bg-green-50 text-green-700 border-green-200' 
                                    : 'bg-red-50 text-red-700 border-red-200'
                                }`}>
                                  {isOmsetQualified ? 'Lolos (>= Rp 10jt)' : 'Belum Lolos (< Rp 10jt)'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-col gap-1 text-[9px] font-medium text-slate-600">
                                  <div className="flex items-center gap-1">
                                    <span className={req.hasLegalitas ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>
                                      {req.hasLegalitas ? '✓' : '✗'}
                                    </span>
                                    <span>Legalitas (Akta/AHU/NPWP)</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className={req.hasDesain ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>
                                      {req.hasDesain ? '✓' : '✗'}
                                    </span>
                                    <span>Desain Premium</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className={req.hasSertifikat ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>
                                      {req.hasSertifikat ? '✓' : '✗'}
                                    </span>
                                    <span>Sertifikasi Produk</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border tracking-wider ${
                                  req.status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-200' :
                                  req.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                                  'bg-yellow-50 text-yellow-750 border-yellow-200'
                                }`}>
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
                                        onClick={() => handleApproveLevel(req.id)}
                                        disabled={isPending}
                                        className="px-2.5 py-1 bg-[#0F5132] hover:bg-[#0a3a24] text-white rounded text-[10px] font-bold uppercase transition-colors cursor-pointer border-none"
                                      >
                                        Setujui
                                      </button>
                                      <button
                                        onClick={() => handleOpenRejectModal(req.id)}
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
            </div>
          )}

          {/* ─── TAB 2.6: WITHDRAWALS (PENCAIRAN DANA) ─────────────────────── */}
          {activeTab === 'withdrawals' && (
            <div className="space-y-6">
              <div className="bg-white border border-[#e2e8f0] p-6 rounded-[var(--radius-brand)] shadow-sm">
                <h3 className="font-sora text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-[#e2e8f0] pb-3 text-[#0F5132]">
                  Permintaan Pencairan Dana (Withdrawal)
                </h3>
                <p className="text-xs text-[#64748b] mb-6">
                  Daftar permintaan penarikan saldo wallet dari Merchant dan Affiliate ke rekening bank asli mereka.
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
                          const isProcessed = processedWithdrawals.includes(w.id);
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
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                                    Sukses Ditransfer
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => {
                                      if (confirm('Konfirmasi bahwa dana telah ditransfer ke rekening pengguna?')) {
                                        setProcessedWithdrawals(prev => [...prev, w.id]);
                                        setActionSuccess(`Transfer untuk withdrawal ${w.id} telah dikonfirmasi selesai.`);
                                      }
                                    }}
                                    className="px-4 py-1.5 bg-[#0F5132] hover:bg-[#0a3822] text-white rounded text-[11px] font-bold uppercase tracking-wider shadow-sm transition-colors cursor-pointer"
                                  >
                                    Tandai Selesai
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB 3: KELOLA PRODUK ──────────────────────────────────────── */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              {/* Product catalog filters */}
              <div className="flex flex-col md:flex-row gap-4 bg-white border border-[#e2e8f0] p-4 rounded-[var(--radius-brand)] shadow-sm">
                <input
                  type="text"
                  placeholder="Cari produk berdasarkan nama / SKU..."
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  className="flex-grow bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-4 py-2.5 text-xs text-slate-800 placeholder-[#94a3b8] focus:outline-none focus:border-[#0F5132] focus:ring-1 focus:ring-[#0F5132]"
                />
                <select
                  value={productCatFilter}
                  onChange={e => setProductCatFilter(e.target.value)}
                  className="bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#0F5132]"
                >
                  <option value="ALL">Semua Tipe</option>
                  <option value="PRODUCT">PRODUCT (Fisik / Digital)</option>
                  <option value="JASA">JASA (Jasa / Service)</option>
                </select>
              </div>

              {/* Products table */}
              <div className="bg-white border border-[#e2e8f0] rounded-[var(--radius-brand)] overflow-x-auto shadow-sm">
                <table className="w-full min-w-[800px] text-xs text-left">
                  <thead className="bg-[#f8f9fa] border-b border-[#e2e8f0] text-[#64748b] uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-6 py-3.5">ID & Gambar</th>
                      <th className="px-6 py-3.5">Nama Produk</th>
                      <th className="px-6 py-3.5">Tipe Kategori</th>
                      <th className="px-6 py-3.5 text-right">Harga Satuan</th>
                      <th className="px-6 py-3.5 text-center">Stok</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3 flex items-center gap-3">
                          <div className="w-9 h-9 rounded bg-slate-50 overflow-hidden border border-[#e2e8f0]">
                            {p.image ? (
                              <img src={p.image} alt={p.title} className="object-cover w-full h-full" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">UMKM</div>
                            )}
                          </div>
                          <span className="font-mono text-[10px] text-[#64748b]">{p.id}</span>
                        </td>
                        <td className="px-6 py-3 font-bold text-slate-800">{p.title}</td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${
                            p.category === 'JASA' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {p.category}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right font-bold text-slate-800">Rp {p.price.toLocaleString('id-ID')}</td>
                        <td className="px-6 py-3 text-center text-[#64748b] font-bold">{p.stock} pcs</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── TAB 4: LMS ACADEMY (KELOLA MATERI) ─────────────────────────── */}
          {activeTab === 'academy' && (
            <div className="space-y-8">
              {/* Header Action */}
              <div className="flex justify-between items-center bg-white border border-[#e2e8f0] p-5 rounded-[var(--radius-brand)] shadow-sm">
                <div>
                  <h3 className="font-sora text-xs font-bold text-[#0F5132] uppercase tracking-wider">Kurikulum Akademi Premium</h3>
                  <p className="text-[11px] text-[#64748b]">Manajemen kelas, edit silabus, tambahkan bab/pelajaran materi pembelajaran digital.</p>
                </div>
                <button
                  onClick={() => { resetCourseForm(); setCourseModal({ open: true, mode: 'add' }); }}
                  className="px-4 py-2.5 bg-[#2DB24A] hover:bg-[#259a3f] text-white font-bold uppercase text-xs tracking-wider rounded-[var(--radius-brand)] transition-colors cursor-pointer shadow-md"
                >
                  + Tambah Kelas Baru
                </button>
              </div>

              {/* Courses Grid */}
              <div className="grid grid-cols-1 gap-6">
                {courses.map(course => (
                  <div key={course.id} className="bg-white border border-[#e2e8f0] rounded-[var(--radius-brand)] overflow-hidden hover:border-[#0F5132]/20 transition-all duration-300 shadow-sm">
                    <div className="p-6 md:flex gap-6 border-b border-[#e2e8f0]">
                      <div className="w-full md:w-[220px] aspect-[16/9] md:aspect-auto rounded-[var(--radius-brand)] bg-slate-50 overflow-hidden border border-[#cbd5e1] flex-shrink-0 flex items-center justify-center">
                        {course.coverImage ? (
                          <img src={course.coverImage} alt={course.title} className="object-cover w-full h-full" />
                        ) : (
                          <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest">Premium Module</span>
                        )}
                      </div>
                      <div className="flex-grow mt-4 md:mt-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#E8F5E9] border border-[#0F5132]/20 text-[#0F5132] uppercase tracking-wider">
                              Level Akses: {course.accessRequired || 'Gold'}
                            </span>
                            <span className="text-[10px] font-mono text-[#64748b]">{course.id}</span>
                          </div>
                          <h4 className="font-sora text-sm font-bold text-slate-800 mt-2">{course.title}</h4>
                          <p className="text-xs text-[#64748b] leading-relaxed mt-2.5">{course.description}</p>
                        </div>
                        <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100">
                          <button
                            onClick={() => openEditCourse(course)}
                            className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-[#cbd5e1] font-bold text-[10px] uppercase tracking-widest rounded transition-colors cursor-pointer"
                          >
                            Edit Kelas
                          </button>
                          <button
                            onClick={() => handleDeleteCourse(course.id)}
                            className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-[10px] uppercase tracking-widest rounded transition-colors cursor-pointer"
                          >
                            Hapus Kelas
                          </button>
                          <button
                            onClick={() => openAddLesson(course.id)}
                            className="ml-auto px-4 py-1.5 bg-[#0F5132]/10 hover:bg-[#0F5132]/20 text-[#0F5132] border border-[#0F5132]/20 font-bold text-[10px] uppercase tracking-widest rounded transition-all cursor-pointer"
                          >
                            + Tambah Pelajaran
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Lessons list inside course */}
                    <div className="p-6 bg-[#fafbfc] space-y-3">
                      <h5 className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Syllabus / Bab Pelajaran ({course.lessons?.length || 0} Bab)</h5>
                      {course.lessons && course.lessons.length > 0 ? (
                        <div className="space-y-2">
                          {course.lessons.map((lesson: any, idx: number) => (
                            <div key={lesson.id} className="flex justify-between items-center p-3.5 bg-white border border-[#e2e8f0] rounded-[var(--radius-brand)] hover:border-[#cbd5e1] transition-colors shadow-sm">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[9px] font-bold text-[#0F5132] bg-[#E8F5E9] px-1.5 py-0.2 border border-[#0F5132]/10 rounded">
                                    Urutan {lesson.orderIndex}
                                  </span>
                                  <span className="text-xs font-bold text-slate-800">{lesson.title}</span>
                                </div>
                                <p className="text-[10px] text-[#64748b] mt-1.5 line-clamp-1">{lesson.content}</p>
                                <div className="flex items-center gap-3.5 mt-1.5 text-[10px] text-[#64748b] font-mono">
                                  <span>Durasi: {Math.round(lesson.duration / 60)} menit</span>
                                  <span>•</span>
                                  <span className="truncate max-w-[250px]" title={lesson.videoUrl}>Video: {lesson.videoUrl || 'Tidak ada video'}</span>
                                </div>
                              </div>
                              <div className="flex gap-1.5 flex-shrink-0 items-center">
                                <button
                                  type="button"
                                  disabled={isPending || idx === 0}
                                  onClick={() => handleShiftLessonOrder(lesson, 'up', course)}
                                  title="Geser Urutan Ke Atas"
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-bold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                                >
                                  ▲
                                </button>
                                <button
                                  type="button"
                                  disabled={isPending || idx === course.lessons.length - 1}
                                  onClick={() => handleShiftLessonOrder(lesson, 'down', course)}
                                  title="Geser Urutan Ke Bawah"
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-bold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                                >
                                  ▼
                                </button>
                                <button
                                  onClick={() => openEditLesson(lesson, course.id)}
                                  className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded text-[10px] uppercase font-bold tracking-wider cursor-pointer border border-[#e2e8f0]"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteLesson(lesson.id, course.id)}
                                  className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded text-[10px] uppercase font-bold tracking-wider cursor-pointer border border-red-100"
                                >
                                  Hapus
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-[#64748b] italic p-4 text-center">Kelas ini belum memiliki bab pelajaran. Silakan klik "+ Tambah Pelajaran" di atas.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Course Create/Edit Modal */}
              {courseModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
                  <div className="bg-white border border-[#0F5132]/25 rounded-[var(--radius-brand)] max-w-md w-full p-6 space-y-6 shadow-2xl">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <h3 className="font-sora text-sm font-bold text-[#0F5132] uppercase tracking-wider">
                        {courseModal.mode === 'add' ? 'Tambah Kelas Baru' : 'Edit Kelas'}
                      </h3>
                      <button onClick={() => setCourseModal({ open: false, mode: 'add' })} className="text-slate-400 hover:text-slate-600">✕</button>
                    </div>

                    <form onSubmit={handleCourseSubmit} className="space-y-4 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Judul Kelas</label>
                        <input
                          type="text"
                          required
                          value={courseTitle}
                          onChange={e => setCourseTitle(e.target.value)}
                          placeholder="e.g. Mastering Luxury Commerce"
                          className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2.5 text-slate-800 outline-none focus:border-[#0F5132] focus:ring-1 focus:ring-[#0F5132]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Deskripsi Singkat</label>
                        <textarea
                          required
                          rows={3}
                          value={courseDesc}
                          onChange={e => setCourseDesc(e.target.value)}
                          placeholder="Tulis ringkasan kurikulum..."
                          className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2.5 text-slate-800 outline-none focus:border-[#0F5132] focus:ring-1 focus:ring-[#0F5132]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Akses Keanggotaan</label>
                          <select
                            value={courseAccess}
                            onChange={e => setCourseAccess(e.target.value)}
                            className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2 text-slate-800 outline-none focus:border-[#0F5132] focus:ring-1 focus:ring-[#0F5132]"
                          >
                            <option value="Gold">Gold</option>
                            <option value="Platinum">Platinum</option>
                            <option value="Diamond">Diamond</option>
                            <option value="Bootcamp">Bootcamp</option>
                          </select>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Cover Image (Upload File)</label>
                            <span className="text-[10px] font-semibold text-emerald-600">Maks. 10 MB (Auto-Kompresi)</span>
                          </div>
                          <div className="space-y-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={e => {
                                const file = e.target.files?.[0]
                                setCourseImageError(null)
                                if (file) {
                                  if (file.size > 15 * 1024 * 1024) {
                                    setCourseImageError(`⚠️ Ukuran file terlalu besar (${(file.size / 1024 / 1024).toFixed(1)} MB)! Maksimal ukuran file cover adalah 10 MB.`)
                                    return
                                  }

                                  const reader = new FileReader()
                                  reader.onload = (evt) => {
                                    const img = new Image()
                                    img.onload = () => {
                                      const canvas = document.createElement('canvas')
                                      let w = img.width
                                      let h = img.height
                                      const maxDim = 1200
                                      if (w > maxDim || h > maxDim) {
                                        if (w > h) { h = Math.round((h * maxDim) / w); w = maxDim; }
                                        else { w = Math.round((w * maxDim) / h); h = maxDim; }
                                      }
                                      canvas.width = w
                                      canvas.height = h
                                      const ctx = canvas.getContext('2d')
                                      if (ctx) {
                                        ctx.drawImage(img, 0, 0, w, h)
                                        const compressed = canvas.toDataURL('image/jpeg', 0.82)
                                        if (compressed.length > 3.5 * 1024 * 1024) {
                                          setCourseImageError('⚠️ Ukuran gambar setelah kompresi melebihi 3 MB. Silakan pilih gambar yang lebih kecil.')
                                        } else {
                                          setCourseCover(compressed)
                                        }
                                      } else {
                                        setCourseCover(evt.target?.result as string)
                                      }
                                    }
                                    img.onerror = () => setCourseCover(evt.target?.result as string)
                                    img.src = evt.target?.result as string
                                  }
                                  reader.readAsDataURL(file)
                                }
                              }}
                              className="w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-[11px] file:font-semibold file:bg-[#0F5132]/10 file:text-[#0F5132] hover:file:bg-[#0F5132]/20 cursor-pointer"
                            />
                            {courseImageError && (
                              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-[11px] font-medium leading-relaxed">
                                {courseImageError}
                              </div>
                            )}
                            {courseCover && !courseImageError && (
                              <div className="w-16 h-10 relative rounded overflow-hidden border border-slate-200">
                                <img src={courseCover} alt="Preview" className="object-cover w-full h-full" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 flex gap-3">
                        <button
                          type="button"
                          onClick={() => setCourseModal({ open: false, mode: 'add' })}
                          className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-850 font-bold rounded-[var(--radius-brand)] uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={isPending || !!courseImageError}
                          className="flex-1 py-2.5 bg-[#2DB24A] hover:bg-[#259a3f] text-white font-bold rounded-[var(--radius-brand)] uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {isPending ? 'Menyimpan...' : 'Simpan'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Lesson Create/Edit Modal */}
              {lessonModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
                  <div className="bg-white border border-[#0F5132]/25 rounded-[var(--radius-brand)] max-w-md w-full p-6 space-y-6 shadow-2xl">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <h3 className="font-sora text-sm font-bold text-[#0F5132] uppercase tracking-wider">
                        {lessonModal.mode === 'add' ? 'Tambah Pelajaran Baru' : 'Edit Pelajaran'}
                      </h3>
                      <button onClick={() => setLessonModal({ open: false, mode: 'add', courseId: '' })} className="text-slate-400 hover:text-slate-600">✕</button>
                    </div>

                    <form onSubmit={handleLessonSubmit} className="space-y-4 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Judul Pelajaran</label>
                        <input
                          type="text"
                          required
                          value={lessonTitle}
                          onChange={e => setLessonTitle(e.target.value)}
                          placeholder="e.g. 1. Dasar Pembuatan Brand"
                          className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2.5 text-slate-800 outline-none focus:border-[#0F5132] focus:ring-1 focus:ring-[#0F5132]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Isi Materi</label>
                        <textarea
                          required
                          rows={4}
                          value={lessonContent}
                          onChange={e => setLessonContent(e.target.value)}
                          placeholder="Tulis narasi pembelajaran materi secara rinci..."
                          className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2.5 text-slate-800 outline-none focus:border-[#0F5132] focus:ring-1 focus:ring-[#0F5132]"
                        />
                      </div>

                      {/* Video Link / File Upload */}
                      <div className="space-y-3 p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-xl">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Tautan URL Video</label>
                            <span className="text-[9px] font-semibold text-emerald-600">YouTube, Vimeo, MP4 URL</span>
                          </div>
                          <input
                            type="url"
                            value={lessonVideo.startsWith('data:') || lessonVideo.includes('.s3.') || lessonVideo.startsWith('/uploads/') ? '' : lessonVideo}
                            onChange={e => {
                              setLessonVideoError(null)
                              setLessonVideo(e.target.value)
                            }}
                            placeholder="https://www.youtube.com/watch?v=... atau https://..."
                            className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3 py-2 text-slate-800 text-xs outline-none focus:border-[#0F5132]"
                          />
                        </div>

                        <div className="border-t border-slate-200/60 pt-2.5">
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Atau Unggah File Video</label>
                          </div>
                          <input
                            type="file"
                            accept="video/*"
                            disabled={isUploadingVideo}
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              setLessonVideoError(null)
                              if (!file) return

                              if (file.size > 500 * 1024 * 1024) {
                                setLessonVideoError(`⚠️ Ukuran file video (${(file.size / 1024 / 1024).toFixed(1)} MB) terlalu besar (maksimal 500 MB).`)
                                return
                              }

                              try {
                                setIsUploadingVideo(true)
                                setUploadProgress(0)
                                setUploadSpeed('')

                                // 1. Try S3 Direct Presigned Upload (Browser -> AWS S3 with XHR Progress)
                                try {
                                  const presignedRes = await fetch('/api/upload/presigned', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      filename: file.name,
                                      fileType: file.type || 'video/mp4',
                                      folder: 'courses'
                                    })
                                  })

                                  if (presignedRes.ok) {
                                    const presignedData = await presignedRes.json()
                                    if (presignedData.uploadUrl && presignedData.publicUrl) {
                                      const startTime = Date.now()
                                      const s3Success = await new Promise<boolean>((resolve) => {
                                        const xhr = new XMLHttpRequest()
                                        xhr.open('PUT', presignedData.uploadUrl, true)
                                        xhr.setRequestHeader('Content-Type', file.type || 'video/mp4')

                                        xhr.upload.onprogress = (evt) => {
                                          if (evt.lengthComputable) {
                                            const percent = Math.round((evt.loaded / evt.total) * 100)
                                            setUploadProgress(percent)

                                            const duration = (Date.now() - startTime) / 1000
                                            if (duration > 0) {
                                              const mbps = ((evt.loaded / (1024 * 1024)) / duration).toFixed(1)
                                              setUploadSpeed(`${mbps} MB/s`)
                                            }
                                          }
                                        }

                                        xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300)
                                        xhr.onerror = () => resolve(false)
                                        xhr.ontimeout = () => resolve(false)
                                        xhr.send(file)
                                      })

                                      if (s3Success) {
                                        setLessonVideo(presignedData.publicUrl)
                                        return
                                      }
                                    }
                                  }
                                } catch (s3Err) {
                                  console.warn('Presigned upload failed, attempting fallback server upload:', s3Err)
                                }

                                // 2. Fallback to /api/upload (Server API + Local Disk Fallback)
                                const formData = new FormData()
                                formData.append('file', file)
                                formData.append('folder', 'courses')

                                const res = await fetch('/api/upload', {
                                  method: 'POST',
                                  body: formData
                                })
                                const data = await res.json()

                                if (res.ok && data.url) {
                                  setLessonVideo(data.url)
                                } else {
                                  // 3. Fallback to inline Base64 if small file <= 3.5MB
                                  if (file.size <= 3.5 * 1024 * 1024) {
                                    const reader = new FileReader()
                                    reader.onload = () => setLessonVideo(reader.result as string)
                                    reader.readAsDataURL(file)
                                  } else {
                                    setLessonVideoError(data.error || `⚠️ Gagal mengunggah file. Silakan periksa koneksi atau gunakan Tautan URL Video.`)
                                  }
                                }
                              } catch (err: any) {
                                setLessonVideoError('⚠️ Gagal mengunggah file. Silakan periksa koneksi atau gunakan Tautan URL Video.')
                              } finally {
                                setIsUploadingVideo(false)
                              }
                            }}
                            className="w-full text-xs text-slate-500 file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-[#0F5132]/10 file:text-[#0F5132] hover:file:bg-[#0F5132]/20 cursor-pointer disabled:opacity-50"
                          />
                          {lessonVideoError && (
                            <div className="p-2.5 mt-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-[11px] font-medium leading-relaxed">
                              {lessonVideoError}
                            </div>
                          )}
                          {lessonVideo && !lessonVideoError && (
                            <div className="mt-2.5 space-y-2">
                              {/* Video Preview */}
                              {!lessonVideo.startsWith('data:') ? (
                                <div className="rounded-lg overflow-hidden border border-emerald-200 bg-black">
                                  <video
                                    src={lessonVideo}
                                    controls
                                    preload="metadata"
                                    className="w-full max-h-[180px] object-contain"
                                  />
                                </div>
                              ) : (
                                <div className="rounded-lg overflow-hidden border border-emerald-200 bg-black">
                                  <video
                                    src={lessonVideo}
                                    controls
                                    preload="metadata"
                                    className="w-full max-h-[180px] object-contain"
                                  />
                                </div>
                              )}
                              {/* Success Label + Remove Button */}
                              <div className="flex items-center justify-between">
                                <div className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                                  <span>✓ Video Berhasil Diunggah</span>
                                  <span className="truncate max-w-[180px] font-normal text-emerald-600/70">{lessonVideo.includes('/') ? decodeURIComponent(lessonVideo.split('/').pop() || '') : 'Base64 Video'}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => { setLessonVideo(''); setLessonVideoError(null) }}
                                  className="text-[9px] font-semibold text-red-500 hover:text-red-700 transition-colors"
                                >
                                  ✕ Hapus
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Durasi (Detik)</label>
                          <input
                            type="number"
                            required
                            value={lessonDuration}
                            onChange={e => setLessonDuration(e.target.value)}
                            className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2 text-slate-850 outline-none focus:border-[#0F5132] focus:ring-1 focus:ring-[#0F5132]"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">No. Urut (Indeks)</label>
                          <input
                            type="number"
                            required
                            value={lessonOrderIndex}
                            onChange={e => setLessonOrderIndex(e.target.value)}
                            className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2 text-slate-850 outline-none focus:border-[#0F5132] focus:ring-1 focus:ring-[#0F5132]"
                          />
                        </div>
                      </div>

                      <div className="pt-4 flex gap-3">
                        <button
                          type="button"
                          onClick={() => setLessonModal({ open: false, mode: 'add', courseId: '' })}
                          className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-850 font-bold rounded-[var(--radius-brand)] uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={isPending || !!lessonVideoError}
                          className="flex-1 py-2.5 bg-[#2DB24A] hover:bg-[#259a3f] text-white font-bold rounded-[var(--radius-brand)] uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {isPending ? 'Menyimpan...' : 'Simpan'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── TAB 5: DAFTAR KOMUNITAS INDUK & MEMBER ───────────────────── */}
          {activeTab === 'community' && (
            <div className="space-y-6 animate-in fade-in duration-250">
              {/* Global KYC Setting for Community Creation */}
              <div className="bg-emerald-50/80 border border-emerald-200 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-sora text-xs font-bold text-[#0F5132] uppercase tracking-wider flex items-center gap-2">
                    <span className="text-sm">🛡️</span>
                    <span>Pengaturan Superadmin: Syarat KYC Membuat Komunitas Induk</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {globalKycRequired
                      ? 'Status: WAJIB AKTIF. Hanya merchant yang sudah terverifikasi KYC (KTP/Selfie) yang dapat membuat Komunitas Induk baru.'
                      : 'Status: OPSIONAL / MATI. Semua merchant dapat membuat Komunitas Induk baru secara bebas tanpa syarat verifikasi KYC.'
                    }
                  </p>
                </div>
                <button
                  onClick={handleToggleGlobalKycSetting}
                  className={`px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider cursor-pointer border transition-all shrink-0 shadow-sm ${
                    globalKycRequired
                      ? 'bg-[#0F5132] text-white border-[#0F5132] hover:bg-[#0a3822]'
                      : 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600'
                  }`}
                >
                  Syarat KYC Buat Komunitas: {globalKycRequired ? 'WAJIB (ON)' : 'OPSIONAL (OFF)'}
                </button>
              </div>

              {/* Induk Komunitas CRUD Management Card */}
              <div className="bg-white border border-[#e2e8f0] p-6 rounded-[var(--radius-brand)] shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#e2e8f0] pb-4">
                  <div>
                    <h3 className="font-sora text-sm font-bold text-slate-800 uppercase tracking-wider text-[#0F5132]">
                      Kelola Komunitas Induk
                    </h3>
                    <p className="text-xs text-[#64748b] mt-0.5">
                      Super Admin & Admin dapat membuat, mengedit detail legalitas/fee, serta menetapkan anggota komunitas induk secara bebas.
                    </p>
                  </div>
                  <button
                    onClick={handleOpenAddCommunity}
                    className="px-4 py-2 bg-[#0F5132] hover:bg-[#0a3822] text-white text-xs font-bold uppercase tracking-wider rounded-[var(--radius-brand)] shadow-sm transition-colors cursor-pointer flex items-center gap-2 shrink-0"
                  >
                    <span>+ Tambah Komunitas Induk</span>
                  </button>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-3 pt-1">
                  <input
                    type="text"
                    placeholder="Cari komunitas berdasarkan nama / ketua / domisili..."
                    value={communitySearch}
                    onChange={e => setCommunitySearch(e.target.value)}
                    className="flex-grow bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0F5132]"
                  />
                  <select
                    value={communityTypeFilter}
                    onChange={e => setCommunityTypeFilter(e.target.value)}
                    className="bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0F5132]"
                  >
                    <option value="ALL">Semua Tipe</option>
                    <option value="PERKUMPULAN">PERKUMPULAN</option>
                    <option value="KOPERASI">KOPERASI</option>
                  </select>
                  <select
                    value={communityCategoryFilter}
                    onChange={e => setCommunityCategoryFilter(e.target.value)}
                    className="bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0F5132]"
                  >
                    <option value="ALL">Semua Kategori</option>
                    <option value="FREE">FREE</option>
                    <option value="PAID">PAID</option>
                    <option value="KOPERASI">KOPERASI</option>
                  </select>
                </div>

                {/* Table */}
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
                          <td colSpan={7} className="px-4 py-6 text-center text-slate-400 italic">
                            Belum ada komunitas induk terdaftar.
                          </td>
                        </tr>
                      ) : (
                        communities
                          .filter(c => {
                            const matchSearch = c.name?.toLowerCase().includes(communitySearch.toLowerCase()) ||
                              c.domisili?.toLowerCase().includes(communitySearch.toLowerCase())
                            const matchType = communityTypeFilter === 'ALL' || c.type === communityTypeFilter
                            const matchCat = communityCategoryFilter === 'ALL' || c.category === communityCategoryFilter
                            return matchSearch && matchType && matchCat
                          })
                          .map(comm => {
                            const ketuaUser = users.find(u => u.id === comm.ketuaId)
                            const memberCount = users.filter(u => u.indukCommunityId === comm.id).length
                            return (
                              <tr key={comm.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3.5">
                                  <p className="font-bold text-slate-800">{comm.name}</p>
                                  <p className="text-[10px] text-slate-400 font-mono">ID: {comm.id}</p>
                                </td>
                                <td className="px-4 py-3.5">
                                  <div className="flex gap-1.5 items-center">
                                    <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-emerald-50 text-[#0F5132] border border-[#0F5132]/20 uppercase">
                                      {comm.type}
                                    </span>
                                    <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                                      {comm.category}
                                    </span>
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
                                      comm.isKycRequired
                                        ? 'bg-emerald-100 text-[#0F5132] border-[#2DB24A]/40 hover:bg-emerald-200'
                                        : 'bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200'
                                    }`}
                                    title="Klik untuk mengubah status syarat KYC"
                                  >
                                    🪪 KYC: {comm.isKycRequired ? 'WAJIB' : 'OPSIONAL'}
                                  </button>
                                </td>
                                <td className="px-4 py-3.5 text-right font-mono font-bold text-[#0F5132]">
                                  {(comm.coinBalance || 0).toLocaleString('id-ID')} Coin
                                </td>
                                <td className="px-4 py-3.5 text-center">
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${
                                    comm.isSuspended ? 'bg-red-50 text-red-700 border-red-200' :
                                    comm.isVerified ? 'bg-green-50 text-green-700 border-green-200' :
                                    'bg-amber-50 text-amber-700 border-amber-200'
                                  }`}>
                                    {comm.isSuspended ? 'Suspended' : comm.isVerified ? 'Verified' : 'Pending'}
                                  </span>
                                </td>
                                <td className="px-4 py-3.5 text-right space-x-1.5">
                                  {!comm.isVerified && (
                                    <button
                                      onClick={() => handleApproveCommunity(comm)}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-black uppercase tracking-wider cursor-pointer shadow-xs"
                                    >
                                      ✓ Setujui
                                    </button>
                                  )}
                                  {comm.isVerified && !comm.isSuspended && (
                                    <button
                                      onClick={() => handleRejectCommunity(comm)}
                                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                                    >
                                      Tangguhkan
                                    </button>
                                  )}
                                  <button
                                    onClick={() => setMemberModal({ open: true, community: comm })}
                                    className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                                  >
                                    Members ({memberCount})
                                  </button>
                                  <button
                                    onClick={() => handleOpenEditCommunity(comm)}
                                    className="px-2.5 py-1 bg-[#0F5132]/10 hover:bg-[#0F5132]/20 text-[#0F5132] border border-[#0F5132]/20 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCommunity(comm.id, comm.name)}
                                    className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                                  >
                                    Hapus
                                  </button>
                                </td>
                              </tr>
                            )
                          })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="bg-white border border-[#e2e8f0] p-6 rounded-[var(--radius-brand)] shadow-sm">
                <h3 className="font-sora text-sm font-bold text-slate-800 uppercase tracking-wider mb-2 border-b border-[#e2e8f0] pb-3 text-[#0F5132]">
                  Verifikasi Pembayaran Invoice Keanggotaan Komunitas
                </h3>
                <p className="text-xs text-[#64748b] mb-4">
                  Daftar tagihan pendaftaran keanggotaan Komunitas Koperasi (Simpanan Pokok & Wajib) dan Perkumpulan Premium yang dikelola Saloka.
                </p>

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
                          <td colSpan={6} className="px-4 py-6 text-center text-slate-400 italic">
                            Belum ada pendaftaran dengan invoice keanggotaan.
                          </td>
                        </tr>
                      ) : (
                        invoices.map((inv: any) => {
                          const isKoperasi = inv.community?.type === 'KOPERASI';
                          return (
                            <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3">
                                <p className="font-bold text-slate-800">{inv.user?.name || 'UMKM Mitra'}</p>
                                <p className="text-[10px] text-slate-505 font-mono">{inv.user?.email}</p>
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-bold text-slate-800">{inv.community?.name || 'Komunitas'}</p>
                                <span className={`inline-block text-[8px] font-bold px-1.5 py-0.2 rounded border ${
                                  isKoperasi ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-cyan-50 text-cyan-700 border-cyan-200'
                                }`}>
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
                                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border tracking-wider ${
                                  inv.invoiceStatus === 'VERIFIED' ? 'bg-green-50 text-green-700 border-green-200' :
                                  inv.invoiceStatus === 'PAID' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                  'bg-yellow-50 text-yellow-750 border-yellow-200'
                                }`}>
                                  {inv.invoiceStatus === 'VERIFIED' ? 'Terverifikasi' : 
                                   inv.invoiceStatus === 'PAID' ? 'Sudah Bayar (Pending)' : 'Belum Bayar'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center text-slate-500">
                                {new Date(inv.joinedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {inv.invoiceStatus === 'VERIFIED' ? (
                                  <span className="text-[10px] text-slate-400 italic">Terverifikasi</span>
                                ) : (
                                  <button
                                    onClick={() => handleVerifyInvoice(inv.id)}
                                    disabled={isPending}
                                    className="px-3 py-1 bg-[#0F5132] hover:bg-[#0a3a24] text-white rounded text-[10px] font-bold uppercase tracking-wider transition-colors border-none cursor-pointer disabled:opacity-50"
                                  >
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

              {/* Forum Activities Section */}
              <div className="bg-white border border-[#e2e8f0] rounded-[var(--radius-brand)] overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-[#e2e8f0] bg-[#f8f9fa]">
                  <h3 className="font-sora text-xs font-bold text-[#0F5132] uppercase tracking-wider">Aktivitas Forum Komunitas</h3>
                  <p className="text-[11px] text-[#64748b]">Daftar postingan diskusi bisnis UMKM dan komentar terhubung.</p>
                </div>
                <div className="divide-y divide-[#e2e8f0]">
                  {posts.map(post => {
                    const author = users.find(u => u.id === post.authorId)
                    return (
                      <div key={post.id} className="p-6 hover:bg-slate-50/50 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0F5132]/20 to-[#2DB24A]/20 flex items-center justify-center font-bold text-[#0F5132] border border-[#0F5132]/30 text-xs">
                            {author?.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">{author?.name || 'UMKM Mitra'}</p>
                            <p className="text-[10px] text-[#64748b]">Role: {author?.role} • Level {author?.level || 1}</p>
                          </div>
                          <span className="ml-auto text-[10px] text-[#64748b] font-mono">
                            {new Date(post.createdAt).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        <h4 className="font-sora text-sm font-bold text-slate-850 mt-3">{post.title}</h4>
                        <p className="text-xs text-[#475569] leading-relaxed mt-2 bg-[#f8f9fa] p-3 rounded-[var(--radius-brand)] border border-[#e2e8f0]">{post.content}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB 6: LACAK TRANSAKSI ────────────────────────────────────── */}
          {activeTab === 'transactions' && (
            <div className="space-y-6">
              {/* Search Order Input */}
              <div className="bg-white border border-[#e2e8f0] p-5 rounded-[var(--radius-brand)] shadow-sm flex flex-col md:flex-row gap-4">
                <div className="flex-grow">
                  <h3 className="font-sora text-xs font-bold text-[#0F5132] uppercase tracking-wider mb-1">Pelacakan Transaksi Jual Beli</h3>
                  <p className="text-[11px] text-[#64748b] mb-3">Masukkan ID Transaksi (Order ID) untuk melakukan trace pembagian laba, komisi afliasi multi-level, cashback, dan points.</p>
                  <input
                    type="text"
                    placeholder="Masukkan ID Transaksi, e.g. order-1779515200000"
                    value={txSearch}
                    onChange={e => setTxSearch(e.target.value)}
                    className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-4 py-2.5 text-xs text-slate-850 placeholder-[#94a3b8] focus:outline-none focus:border-[#0F5132] focus:ring-1 focus:ring-[#0F5132] font-mono"
                  />
                </div>
              </div>

              {/* Transactions grid & Detail */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* List of Orders */}
                <div className="lg:col-span-2 bg-white border border-[#e2e8f0] rounded-[var(--radius-brand)] overflow-hidden shadow-sm h-[500px] overflow-y-auto">
                  <div className="px-5 py-3.5 border-b border-[#e2e8f0] bg-[#f8f9fa] sticky top-0 z-10 flex justify-between items-center">
                    <h4 className="font-sora text-xs font-bold text-[#0F5132] uppercase tracking-wider">Daftar Transaksi Sandbox</h4>
                    <span className="text-[10px] font-mono text-[#64748b]">{searchedOrders.length} transaksi</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {searchedOrders.map(o => {
                      const buyer = users.find(u => u.id === o.buyerId)
                      return (
                        <div
                          key={o.id}
                          onClick={() => setSelectedTx(o)}
                          className={`p-4 transition-all duration-150 cursor-pointer ${
                            selectedTx?.id === o.id ? 'bg-[#E8F5E9] border-l-4 border-[#0F5132]' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-mono font-bold text-[#0F5132]">{o.id}</span>
                            <span className="text-[10px] text-[#64748b] font-mono">{new Date(o.createdAt).toLocaleDateString('id-ID')}</span>
                          </div>
                          <div className="flex justify-between items-end mt-2">
                            <div>
                              <p className="text-[11px] text-slate-700">Pembeli: <b>{buyer?.name || 'Masyarakat'}</b></p>
                              <p className="text-[10px] text-[#64748b] mt-0.5">Item: {o.items?.map((item: any) => `${item.productTitle || 'Produk'} (x${item.quantity})`).join(', ') || '1x Item'}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-black text-slate-800">Rp {o.totalAmount.toLocaleString('id-ID')}</p>
                              <span className="text-[8px] bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.2 rounded font-bold uppercase mt-1 inline-block">COMPLETED</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Audit details panel */}
                <div className="bg-white border border-[#e2e8f0] rounded-[var(--radius-brand)] p-6 shadow-sm">
                  {selectedTx ? (
                    <div className="space-y-6 text-xs">
                      <div className="border-b border-[#e2e8f0] pb-3 text-center">
                        <h4 className="font-sora text-xs font-bold text-[#0F5132] uppercase tracking-wider">Detail Audit Transaksi</h4>
                        <p className="font-mono text-[10px] text-[#64748b] mt-1">{selectedTx.id}</p>
                      </div>

                      {/* Summary item */}
                      <div>
                        <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Item Pembelian:</span>
                        <div className="mt-2 space-y-1.5 bg-[#f8f9fa] p-2.5 rounded-[var(--radius-brand)] border border-[#e2e8f0]">
                          {selectedTx.items?.map((item: any, i: number) => (
                            <div key={i} className="flex justify-between leading-tight text-[11px]">
                              <span className="text-slate-800 truncate max-w-[140px] font-medium">{item.productTitle}</span>
                              <span className="text-[#64748b] font-mono">x{item.quantity} - Rp {item.price?.toLocaleString('id-ID')}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Flow Ledger Audit */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Ledger Aliran Laba & Komisi:</span>
                        <div className="space-y-1.5 font-mono text-[11px]">
                          <div className="flex justify-between text-slate-800 font-bold">
                            <span>Nilai Transaksi:</span>
                            <span>Rp {selectedTx.totalAmount.toLocaleString('id-ID')}</span>
                          </div>

                          {/* Splits values */}
                          <div className="border-t border-[#e2e8f0] my-1.5" />
                          
                          <div className="flex justify-between text-green-700 font-medium">
                            <span>Bagi Laba Penjual (HPP):</span>
                            <span>Rp {Math.round(selectedTx.totalAmount * 0.83).toLocaleString('id-ID')}</span>
                          </div>

                          <div className="flex justify-between text-purple-700 font-medium">
                            <span>Affiliate Tier 1 (10%):</span>
                            <span>Rp {Math.round(selectedTx.totalAmount * 0.10).toLocaleString('id-ID')}</span>
                          </div>

                          <div className="flex justify-between text-purple-700 font-medium">
                            <span>Affiliate Tier 2 (5%):</span>
                            <span>Rp {Math.round(selectedTx.totalAmount * 0.05).toLocaleString('id-ID')}</span>
                          </div>

                          <div className="flex justify-between text-purple-700 font-medium">
                            <span>Affiliate Tier 3 (2%):</span>
                            <span>Rp {Math.round(selectedTx.totalAmount * 0.02).toLocaleString('id-ID')}</span>
                          </div>

                          <div className="flex justify-between text-blue-700 font-medium">
                            <span>Points Cashback (5%):</span>
                            <span>Rp {Math.round(selectedTx.totalAmount * 0.05).toLocaleString('id-ID')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Audit verification stamp */}
                      <div className="p-3 bg-gradient-to-br from-[#E8F5E9] to-white border border-[#0F5132]/20 rounded-[var(--radius-brand)] text-center">
                        <span className="text-[9px] font-bold text-[#0F5132] uppercase tracking-widest block">Midtrans / Wallet Secured</span>
                        <span className="text-[9px] text-[#64748b] block mt-0.5 font-mono">Audit Stamp Hash: Verified Ledger 2026</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#64748b] italic">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mb-2">
                        <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
                      </svg>
                      <span>Pilih salah satu transaksi di daftar sebelah kiri untuk melihat rincian laba / komisi afiliasi.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB 7: SERTIFIKAT LEVEL UP ─────────────────────────────────── */}
          {activeTab === 'certificates' && (
            <div className="space-y-6">
              {/* User Selector */}
              <div className="bg-white border border-[#e2e8f0] p-5 rounded-[var(--radius-brand)] shadow-sm flex flex-col md:flex-row gap-4">
                <div className="flex-grow">
                  <h3 className="font-sora text-xs font-bold text-[#0F5132] uppercase tracking-wider mb-1">Generate Sertifikat Level Up</h3>
                  <p className="text-[11px] text-[#64748b] mb-3">Pilih user bisnis yang telah mencapai minimal Level 3 untuk mengunduh / generate sertifikat resmi mereka secara otomatis.</p>
                  <input
                    type="text"
                    placeholder="Cari user (e.g. Kala Sourdough, Herba, dll)..."
                    value={certUserSearch}
                    onChange={e => setCertUserSearch(e.target.value)}
                    className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-4 py-2.5 text-xs text-slate-850 placeholder-[#94a3b8] focus:outline-none focus:border-[#0F5132]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Users List for Cert */}
                <div className="lg:col-span-1 bg-white border border-[#e2e8f0] rounded-[var(--radius-brand)] overflow-hidden shadow-sm h-[420px] overflow-y-auto">
                  <div className="px-4 py-3 bg-[#f8f9fa] border-b border-[#e2e8f0] text-[10px] font-bold text-[#64748b] uppercase tracking-wider sticky top-0 z-10">
                    Pengguna Level 3+ Terkualifikasi
                  </div>
                  <div className="divide-y divide-slate-100">
                    {certUsers.map(u => (
                      <div
                        key={u.id}
                        onClick={() => setSelectedCertUser(u)}
                        className={`p-3.5 transition-all duration-150 cursor-pointer flex justify-between items-center ${
                          selectedCertUser?.id === u.id ? 'bg-[#E8F5E9] border-l-4 border-[#0F5132]' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-800">{u.name}</p>
                          <p className="text-[9px] text-[#64748b]">{u.email}</p>
                        </div>
                        <div className="text-right">
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-[#0F5132]/10 border border-[#0F5132]/20 text-[#0F5132] uppercase">
                            Lv.{u.level}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live Certificate Design Rendering */}
                <div className="lg:col-span-2 bg-white border border-[#e2e8f0] rounded-[var(--radius-brand)] p-6 shadow-sm flex flex-col items-center">
                  {selectedCertUser ? (
                    <div className="w-full flex flex-col items-center">
                      <div className="w-full border-4 border-double border-[#0F5132]/60 bg-black text-[#e2e8f0] rounded-[var(--radius-brand)] p-8 shadow-2xl max-w-lg aspect-[1.414/1] relative overflow-hidden flex flex-col justify-between items-center text-center">
                        {/* Gold Filigree Ornaments */}
                        <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-[#0F5132]/40 pointer-events-none" />
                        <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-[#0F5132]/40 pointer-events-none" />
                        <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-[#0F5132]/40 pointer-events-none" />
                        <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-[#0F5132]/40 pointer-events-none" />

                        {/* Title Header */}
                        <div>
                          <h4 className="font-sora text-xs font-bold text-[#0F5132] tracking-[0.25em] uppercase leading-none mt-2">Sertifikat Penghargaan</h4>
                          <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-[#0F5132] to-transparent mx-auto mt-2" />
                        </div>

                        {/* Recipient */}
                        <div className="my-auto space-y-3">
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest leading-none">Diberikan secara terhormat kepada:</p>
                          <h3 className="font-sora text-lg md:text-xl font-bold text-white tracking-tight uppercase border-b border-[#2b2c34] pb-2 px-6">{selectedCertUser.name}</h3>
                          <p className="text-[10px] text-slate-400 leading-relaxed max-w-sm mx-auto">
                            Atas dedikasi luar biasa dalam mengembangkan ekosistem UMKM Digital Indonesia dan berhasil mencapai tingkat keanggotaan bisnis elit
                          </p>
                          <p className="font-sora text-[#0F5132] font-bold text-xs uppercase tracking-widest">
                            Level {selectedCertUser.level} - {selectedCertUser.membershipLevel} Elite
                          </p>
                        </div>

                        {/* Signatures & Serial */}
                        <div className="w-full flex justify-between items-end border-t border-slate-800 pt-4 text-[9px] text-slate-400">
                          <div className="text-left font-mono">
                            <span className="block font-sans">No. Serial Sertifikat:</span>
                            <span className="text-[#0F5132] uppercase">TR-{selectedCertUser.id.toUpperCase()}-{selectedCertUser.level}</span>
                          </div>
                          <div className="text-right">
                            <span className="block italic text-white font-mono font-bold">TERAS_OFFICIAL_STAMP</span>
                            <span className="block mt-0.5">Tanggal: {new Date().toLocaleDateString('id-ID')}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => alert(`Unduhan Sertifikat untuk "${selectedCertUser.name}" berhasil diproses!`)}
                        className="mt-6 px-6 py-2.5 bg-[#2DB24A] hover:bg-[#259a3f] text-white text-xs font-bold uppercase tracking-widest rounded-[var(--radius-brand)] shadow-lg cursor-pointer transition-colors"
                      >
                        Cetak / Download PDF Sertifikat
                      </button>
                    </div>
                  ) : (
                    <div className="h-[300px] flex flex-col items-center justify-center text-center p-6 text-[#64748b] italic">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mb-2">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                      </svg>
                      <span>Pilih pengguna di daftar sebelah kiri untuk melihat preview sertifikat level up otomatis.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'affiliates' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-white border border-[#e2e8f0] p-6 rounded-[var(--radius-brand)] shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-sora text-sm font-bold text-slate-800 uppercase tracking-widest">Monitor Sistem Affiliate</h3>
                    <p className="text-xs text-slate-500 mt-1">Pantau performa partner Affiliate (JV), total referral, dan kelola simulasi data dummy.</p>
                  </div>
                  <button
                    disabled={isPending}
                    onClick={() => {
                      if (confirm('Bikin 10 akun dummy dan referral secara instan untuk keperluan demo?')) {
                        startTransition(async () => {
                          setActionError(null)
                          setActionSuccess(null)
                          const res = await generateDummyAffiliatesAction(10)
                          if (res.success) {
                            alert('10 Akun Dummy & Referral berhasil digenerate! Silakan refresh.')
                            window.location.reload()
                          } else {
                            setActionError(res.error || 'Gagal generate.')
                          }
                        })
                      }
                    }}
                    className="px-4 py-2 bg-[#0F5132] hover:bg-[#0a3a24] text-white text-xs font-bold uppercase tracking-widest rounded transition-colors disabled:opacity-50"
                  >
                    {isPending ? 'Generating...' : '🔥 Generate Dummy Affiliate'}
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-50 border-b border-[#e2e8f0] text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                        <th className="px-4 py-3">User Affiliate</th>
                        <th className="px-4 py-3">Total Downline / Referral</th>
                        <th className="px-4 py-3">Level / XP</th>
                        <th className="px-4 py-3">Tgl Bergabung</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.filter(u => u.role === 'AFFILIATE').length === 0 ? (
                        <tr><td colSpan={4} className="text-center py-4 text-slate-400 italic">Belum ada user Affiliate.</td></tr>
                      ) : (
                        users.filter(u => u.role === 'AFFILIATE').map(aff => {
                          const downlines = users.filter(u => u.parentAffiliateId === aff.id)
                          const totalReferrals = downlines.length
                          
                          // Find orders made by downlines
                          const downlineIds = downlines.map(d => d.id)
                          const affiliateOrders = orders.filter(o => downlineIds.includes(o.buyerId))
                          
                          return (
                            <React.Fragment key={aff.id}>
                              <tr 
                                className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                                onClick={() => setExpandedAffiliateId(expandedAffiliateId === aff.id ? null : aff.id)}
                              >
                                <td className="px-4 py-3 font-medium text-slate-800">
                                  <div className="flex items-center gap-2">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform duration-200 ${expandedAffiliateId === aff.id ? 'rotate-90 text-[#0F5132]' : 'text-slate-400'}`}>
                                      <path d="M9 18l6-6-6-6" />
                                    </svg>
                                    <div>{aff.name}<br/><span className="text-[10px] text-slate-500 font-normal">{aff.email}</span></div>
                                  </div>
                                </td>
                                <td className="px-4 py-3"><span className="px-2 py-1 bg-[#E8F5E9] text-[#0F5132] font-bold rounded text-[10px] border border-[#0F5132]/10">{totalReferrals} Orang</span></td>
                                <td className="px-4 py-3">Lv.{aff.level} ({aff.xp} XP)</td>
                                <td className="px-4 py-3 text-slate-500">{new Date(aff.createdAt).toLocaleDateString('id-ID')}</td>
                              </tr>
                              
                              {/* EXPANDED VIEW */}
                              {expandedAffiliateId === aff.id && (
                                <tr className="bg-slate-50/80 border-b border-[#e2e8f0]">
                                  <td colSpan={4} className="px-8 py-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                      {/* Downline Tree */}
                                      <div>
                                        <h4 className="font-sora text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#0F5132]"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                                          Pohon Jaringan (Downline)
                                        </h4>
                                        {downlines.length === 0 ? (
                                          <p className="text-[10px] text-slate-500 italic">Belum ada anggota di jaringan ini.</p>
                                        ) : (
                                          <div className="space-y-2 border-l-2 border-[#E8F5E9] pl-4 ml-2">
                                            {downlines.map(d => (
                                              <div key={d.id} className="text-[10px] bg-white border border-slate-200 p-2 rounded shadow-sm">
                                                <span className="font-bold text-slate-700">{d.name}</span> <span className="text-slate-400">({d.email})</span>
                                                <div className="text-emerald-600 mt-0.5 font-medium">Bergabung: {new Date(d.createdAt).toLocaleDateString('id-ID')}</div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* Affiliate Products & Sales */}
                                      <div>
                                        <h4 className="font-sora text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-600"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                                          Produk Terjual & Komisi Affiliate
                                        </h4>
                                        {affiliateOrders.length === 0 ? (
                                          <p className="text-[10px] text-slate-500 italic">Belum ada penjualan dari jaringan ini.</p>
                                        ) : (
                                          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                            {affiliateOrders.map(o => (
                                              <div key={o.id} className="text-[10px] bg-white border border-slate-200 p-3 rounded shadow-sm">
                                                <div className="flex justify-between items-start mb-1">
                                                  <span className="font-bold text-slate-800">Order #{o.id.split('-').pop()}</span>
                                                  <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded text-[8px]">
                                                    Komisi: +Rp {Math.round(o.totalAmount * 0.1).toLocaleString('id-ID')}
                                                  </span>
                                                </div>
                                                <div className="text-slate-500 mb-1">Pembeli: {users.find(u => u.id === o.buyerId)?.name || o.buyerId}</div>
                                                <div className="space-y-1 mt-2 pt-2 border-t border-slate-100">
                                                  {o.items?.map((item: any, idx: number) => {
                                                    const p = products.find(prod => prod.id === item.productId)
                                                    return (
                                                      <div key={idx} className="flex justify-between text-[9px]">
                                                        <span>{p?.title || 'Produk'} (x{item.quantity})</span>
                                                        <span className="text-slate-600 font-medium">Rp {((p?.price || 0) * item.quantity).toLocaleString('id-ID')}</span>
                                                      </div>
                                                    )
                                                  })}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB 8: KELOLA ADMIN (SUPERADMIN ONLY) ─────────────────────── */}
          {activeTab === 'admins' && currentUser.isSuperAdmin && (
            <div className="space-y-6 animate-in fade-in duration-250">
              <div className="bg-white border border-[#e2e8f0] p-6 rounded-[var(--radius-brand)] shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-sora text-sm font-bold text-slate-800 uppercase tracking-wider">Kelola Akun Administrator biasa</h3>
                    <p className="text-xs text-slate-500 mt-1">Daftar staf administrator pengelola sistem website Saloka.</p>
                  </div>
                  <button
                    onClick={() => {
                      setAdminName('')
                      setAdminEmail('')
                      setAdminPassword('')
                      setAdminIsSuper(false)
                      setIsAdminModalOpen(true)
                    }}
                    className="px-4 py-2 bg-[#0F5132] hover:bg-[#0a3a24] text-white text-xs font-bold uppercase tracking-widest rounded transition-colors shadow flex items-center gap-1.5 cursor-pointer border-none outline-none"
                  >
                    <span>+ Tambah Admin Baru</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-50 border-b border-[#e2e8f0] text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                        <th className="px-4 py-3">Nama</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Tipe Otoritas</th>
                        <th className="px-4 py-3">Tanggal Dibuat</th>
                        <th className="px-4 py-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {admins.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-6 text-slate-400 italic">
                            Belum ada administrator biasa terdaftar.
                          </td>
                        </tr>
                      ) : (
                        admins.map((adm: any) => (
                          <tr key={adm.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-bold text-slate-800">{adm.name}</td>
                            <td className="px-4 py-3 font-mono text-slate-650">{adm.email}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border tracking-wider ${
                                adm.isSuperAdmin ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-50 text-slate-700 border-slate-200'
                              }`}>
                                {adm.isSuperAdmin ? 'Superadmin' : 'Admin Staff'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-500">
                              {new Date(adm.createdAt || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {adm.id === currentUser.id ? (
                                <span className="text-[10px] text-slate-400 italic">Akun Anda</span>
                              ) : (
                                <button
                                  onClick={() => handleDeleteAdmin(adm.id)}
                                  className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                                >
                                  Hapus
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'coins' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Stat Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="p-6 bg-white border border-[#e2e8f0] rounded-[var(--radius-brand)] shadow-sm">
                  <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-1">Total Peredaran Koin</p>
                  <p className="text-2xl font-sora font-extrabold text-[#0F5132] tracking-tight">
                    {coinHolders.reduce((sum: number, h: any) => sum + (h.coinBalance || 0), 0)} Coin
                  </p>
                  <p className="text-[10px] text-[#64748b] mt-1.5">Total suplai aktif ekosistem</p>
                </div>
                <div className="p-6 bg-white border border-[#e2e8f0] rounded-[var(--radius-brand)] shadow-sm">
                  <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-1">Total Transaksi Koin</p>
                  <p className="text-2xl font-sora font-extrabold text-slate-800 tracking-tight">{coinStats.totalTx}</p>
                  <p className="text-[10px] text-[#64748b] mt-1.5">Topup, reward, dan redeem koin</p>
                </div>
                <div className="p-6 bg-white border border-[#e2e8f0] rounded-[var(--radius-brand)] shadow-sm">
                  <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-1">Total Penukaran Voucher</p>
                  <p className="text-2xl font-sora font-extrabold text-blue-600 tracking-tight">{coinStats.totalRedemptions}</p>
                  <p className="text-[10px] text-[#64748b] mt-1.5">Voucher internal & eksternal</p>
                </div>
                <div className="p-6 bg-white border border-[#e2e8f0] rounded-[var(--radius-brand)] shadow-sm flex flex-col justify-between">
                  <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-1">Koin Kas & Rate</p>
                  <p className="text-sm font-bold text-slate-800">1 Koin = Rp 1.500</p>
                  <p className="text-[10px] text-[#64748b] mt-1.5">Rate konversi standar Saloka.id</p>
                </div>
              </div>

              {/* Coin Holder List Panel */}
              <div className="bg-white border border-[#e2e8f0] p-6 rounded-[var(--radius-brand)] shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-sora text-sm font-bold text-slate-800 uppercase tracking-widest">Daftar Pemegang Koin (Coin Holders)</h3>
                    <p className="text-xs text-slate-500 mt-1">Daftar saldo koin aktif pada wallet merchant, user, dan kas komunitas.</p>
                  </div>
                  {currentUser.isSuperAdmin && (
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
                          <td colSpan={5} className="text-center py-6 text-slate-400 italic">
                            Belum ada data pemegang koin aktif.
                          </td>
                        </tr>
                      ) : (
                        coinHolders.map((h: any) => (
                          <tr key={h.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3 font-mono text-slate-650">{h.id}</td>
                            <td className="px-4 py-3 font-bold text-slate-800">{h.name}</td>
                            <td className="px-4 py-3 font-semibold text-slate-500">{h.type}</td>
                            <td className="px-4 py-3 text-right font-bold text-[#0F5132]">{h.coinBalance} Coin</td>
                            <td className="px-4 py-3 text-center">
                              <span className="px-2 py-0.5 rounded text-[8px] font-bold border border-green-200 bg-green-50 text-green-700 uppercase tracking-wider">
                                ACTIVE
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Vouchers Panel */}
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
                          <td colSpan={8} className="text-center py-8 text-slate-400 italic">
                            Belum ada master voucher koin terdaftar.
                          </td>
                        </tr>
                      ) : (
                        vouchers.map((v: any) => (
                          <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-bold text-slate-800">{v.name}</p>
                              <p className="text-[10px] text-slate-500">{v.description}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border tracking-wider ${
                                v.type === 'INTERNAL' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : 'bg-purple-50 text-purple-700 border-purple-200'
                              }`}>
                                {v.type}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-slate-800">{v.coinCost} Koin</td>
                            <td className="px-4 py-3 text-right font-bold text-primary">Rp {v.value.toLocaleString('id-ID')}</td>
                            <td className="px-4 py-3 font-mono text-slate-600">{v.code || '-'}</td>
                            <td className="px-4 py-3 text-center">
                              {v.maxRedemption > 0 ? `${v.totalRedeemed} / ${v.maxRedemption}` : `${v.totalRedeemed} / Unlimited`}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border tracking-wider ${
                                v.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                              }`}>
                                {v.isActive ? 'Aktif' : 'Non-Aktif'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => {
                                  if (confirm(`Apakah Anda yakin ingin ${v.isActive ? 'menonaktifkan' : 'mengaktifkan'} voucher ini?`)) {
                                    startTransition(async () => {
                                      const res = await toggleCoinVoucherActive(v.id)
                                      if (res.success) {
                                        setVouchers((prev: any[]) => prev.map(x => x.id === v.id ? { ...x, isActive: !x.isActive } : x))
                                      } else {
                                        alert(res.error || 'Gagal mengubah status voucher.')
                                      }
                                    })
                                  }
                                }}
                                className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer border ${
                                  v.isActive
                                    ? 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200'
                                    : 'bg-green-50 hover:bg-green-100 text-green-600 border-green-200'
                                }`}
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

              {/* Recent Transactions List */}
              <div className="bg-white border border-[#e2e8f0] p-6 rounded-[var(--radius-brand)] shadow-sm">
                <h3 className="font-sora text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-[#e2e8f0] pb-3 text-[#0F5132]">
                  10 Transaksi Koin Terkini (Ledger Mutasi)
                </h3>
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
                          <td colSpan={5} className="text-center py-4 text-slate-400 italic">
                            Belum ada riwayat transaksi koin.
                          </td>
                        </tr>
                      ) : (
                        coinStats.recentTx.map((tx: any) => (
                          <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3 font-mono text-slate-600">{tx.userId || tx.communityId}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border tracking-wider ${
                                tx.type === 'TOPUP' ? 'bg-green-50 text-green-700 border-green-200' :
                                tx.type === 'REDEEM_VOUCHER' ? 'bg-red-50 text-red-700 border-red-200' :
                                tx.type === 'INJECTION' ? 'bg-blue-50 text-blue-700 border-blue-200 font-extrabold' :
                                'bg-yellow-50 text-yellow-700 border-yellow-200'
                              }`}>
                                {tx.type}
                              </span>
                            </td>
                            <td className={`px-4 py-3 text-right font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                              {tx.amount > 0 ? `+${tx.amount}` : tx.amount} Coin
                            </td>
                            <td className="px-4 py-3 text-slate-705">{tx.description}</td>
                            <td className="px-4 py-3 text-slate-500">{new Date(tx.createdAt).toLocaleString('id-ID')}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB 12: PENGATURAN & KALKULATOR SHU RAT KOPERASI ───────────────────── */}
          {activeTab === 'shu' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-white border border-[#e2e8f0] p-6 rounded-[var(--radius-brand)] shadow-sm space-y-6">
                <div className="border-b border-[#e2e8f0] pb-4">
                  <h3 className="font-sora text-sm font-bold text-[#0F5132] uppercase tracking-wider">
                    Pengaturan & Kalkulator Pembagian SHU Koperasi (Hasil RAT)
                  </h3>
                  <p className="text-xs text-[#64748b] mt-1">
                    Atur alokasi persentase SHU sesuai hasil Keputusan Rapat Anggota Tahunan (RAT) Koperasi. Seluruh perhitungan ke tingkat anggota dilakukan secara otomatis dan proporsional berdasarkan regulasi Perkoperasian Indonesia (UU Koperasi).
                  </p>
                </div>

                <form onSubmit={handleCalculateShuSubmit} className="space-y-6">
                  {/* Community & Profit Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#f8f9fa] p-4 rounded-[var(--radius-brand)] border border-[#e2e8f0]">
                    <div>
                      <label className="block text-[10px] font-bold text-[#0F5132] uppercase tracking-wider mb-1.5 font-sora">Pilih Koperasi / Komunitas Induk *</label>
                      <select
                        value={shuCommunityId}
                        onChange={e => setShuCommunityId(e.target.value)}
                        className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-2 text-xs text-slate-800 font-medium focus:border-[#0F5132] outline-none"
                      >
                        <option value="">-- Pilih Koperasi --</option>
                        {communities.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.type} - {c.category})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5 font-sora">Tahun Buku RAT *</label>
                      <input
                        type="number"
                        required
                        value={shuYear}
                        onChange={e => setShuYear(Number(e.target.value))}
                        className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-2 text-xs text-slate-800 font-bold focus:border-[#0F5132] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5 font-sora">Laba Bersih Koperasi / SHU Kotor (Rp) *</label>
                      <input
                        type="number"
                        required
                        value={shuNetProfit}
                        onChange={e => setShuNetProfit(e.target.value)}
                        placeholder="e.g. 500000000"
                        className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-2 text-xs text-[#0F5132] font-mono font-bold focus:border-[#0F5132] outline-none"
                      />
                    </div>
                  </div>

                  {/* 9 Component Percentages Grid */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-sora text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Komposisi Alokasi SHU (Keputusan RAT)
                      </h4>
                      <div className={`px-3 py-1 rounded text-xs font-bold font-mono ${
                        Math.abs(totalShuPct - 100) < 0.01
                          ? 'bg-green-100 text-green-800 border border-green-300'
                          : 'bg-red-100 text-red-800 border border-red-300'
                      }`}>
                        {Math.abs(totalShuPct - 100) < 0.01
                          ? `✓ Total Jasa: 100% (Valid)`
                          : `⚠️ Total Jasa: ${totalShuPct.toFixed(1)}% (Harus 100%)`
                        }
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-[#e2e8f0] p-4 rounded-[var(--radius-brand)]">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">1. SHU Jasa Modal / Simpanan (%)</label>
                        <input type="number" step="0.1" value={pctJasaModal} onChange={e => setPctJasaModal(e.target.value)} className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-1.5 text-xs font-bold text-slate-800" />
                        <span className="text-[10px] text-emerald-700 font-mono font-bold">Nominal: Rp {((Number(shuNetProfit) || 0) * (Number(pctJasaModal) || 0) / 100).toLocaleString('id-ID')}</span>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">2. SHU Jasa Usaha / Transaksi (%)</label>
                        <input type="number" step="0.1" value={pctJasaUsaha} onChange={e => setPctJasaUsaha(e.target.value)} className="w-full bg-white border border-[#cbd5e1] rounded px-3 py-1.5 text-xs font-bold text-slate-800" />
                        <span className="text-[10px] text-emerald-700 font-mono font-bold">Nominal: Rp {((Number(shuNetProfit) || 0) * (Number(pctJasaUsaha) || 0) / 100).toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isPending || Math.abs(totalShuPct - 100) >= 0.01}
                      className="w-full py-3.5 bg-[#0F5132] hover:bg-[#0a3822] text-white font-sora font-extrabold text-xs uppercase tracking-wider rounded-[var(--radius-brand)] shadow-md transition-colors cursor-pointer disabled:opacity-50 border-none"
                    >
                      {isPending ? 'Memproses Kalkulasi & Menyimpan...' : '⚡ Hitung & Simpan Pembagian SHU RAT Koperasi'}
                    </button>
                  </div>
                </form>

                {/* Calculation Results Table */}
                {shuCalcResult && (
                  <div className="space-y-4 pt-4 border-t border-[#e2e8f0]">
                    <div className="flex justify-between items-center">
                      <h4 className="font-sora text-sm font-bold text-[#0F5132] uppercase tracking-wider">
                        Hasil Kalkulasi Distribusi SHU Anggota (RAT {shuCalcResult.config?.year})
                      </h4>
                      <span className="text-xs font-bold text-slate-500">
                        Total Anggota Terhitung: {shuCalcResult.memberDistributions?.length || 0}
                      </span>
                    </div>

                    <div className="overflow-x-auto border border-[#e2e8f0] rounded-[var(--radius-brand)]">
                      <table className="w-full min-w-[900px] text-xs text-left">
                        <thead className="bg-[#f8f9fa] border-b border-[#e2e8f0] text-[#64748b] uppercase tracking-wider text-[10px] font-bold">
                          <tr>
                            <th className="px-4 py-3">Nama Anggota</th>
                            <th className="px-4 py-3 text-right">Total Simpanan</th>
                            <th className="px-4 py-3 text-right">SHU Jasa Modal</th>
                            <th className="px-4 py-3 text-right">Total Transaksi</th>
                            <th className="px-4 py-3 text-right">SHU Jasa Usaha</th>
                            <th className="px-4 py-3 text-right font-extrabold text-[#0F5132]">Total SHU Diterima</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {shuCalcResult.memberDistributions?.map((m: any) => (
                            <tr key={m.userId} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3">
                                <p className="font-bold text-slate-800">{m.userName}</p>
                                <p className="text-[10px] text-slate-400">{m.userEmail}</p>
                              </td>
                              <td className="px-4 py-3 text-right font-mono text-slate-600">
                                Rp {m.simpananMember.toLocaleString('id-ID')}
                              </td>
                              <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                                Rp {Math.round(m.shuJasaModalAmount).toLocaleString('id-ID')}
                              </td>
                              <td className="px-4 py-3 text-right font-mono text-slate-600">
                                Rp {m.transaksiMember.toLocaleString('id-ID')}
                              </td>
                              <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                                Rp {Math.round(m.shuJasaUsahaAmount).toLocaleString('id-ID')}
                              </td>
                              <td className="px-4 py-3 text-right font-mono font-extrabold text-[#0F5132] bg-emerald-50/50">
                                Rp {Math.round(m.totalShuAmount).toLocaleString('id-ID')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Create Voucher Modal */}
          {isVoucherModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                  <div className="bg-white border border-[#0F5132]/25 rounded-[var(--radius-brand)] max-w-md w-full p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <h3 className="font-sora text-sm font-bold text-[#0F5132] uppercase tracking-wider">Buat Voucher Koin Baru</h3>
                      <button onClick={() => setIsVoucherModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        setActionError(null)
                        setActionSuccess(null)
                        startTransition(async () => {
                          const formData = new FormData()
                          formData.append('name', voucherName)
                          formData.append('description', voucherDesc)
                          formData.append('type', voucherType)
                          formData.append('coinCost', voucherCoinCost)
                          formData.append('value', voucherValue)
                          formData.append('code', voucherCode)
                          formData.append('maxRedemption', voucherMaxRedemption)
                          formData.append('validUntil', voucherValidUntil)

                          const res = await createCoinVoucherAdmin(formData)
                          if (res.success && res.voucher) {
                            setVouchers((prev: any[]) => [res.voucher, ...prev])
                            setActionSuccess(`Voucher "${voucherName}" berhasil dibuat!`)
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
                            setActionError(res.error || 'Gagal membuat voucher.')
                          }
                        })
                      }}
                      className="space-y-4 text-xs"
                    >
                      <div>
                        <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Nama Voucher</label>
                        <input
                          type="text"
                          required
                          value={voucherName}
                          onChange={e => setVoucherName(e.target.value)}
                          placeholder="e.g. Diskon 25rb Shopee"
                          className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2.5 text-slate-800 placeholder-[#94a3b8] outline-none focus:border-[#0F5132]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Deskripsi</label>
                        <textarea
                          required
                          value={voucherDesc}
                          onChange={e => setVoucherDesc(e.target.value)}
                          placeholder="e.g. Tukarkan koin Anda untuk mendapatkan voucher potongan 25.000 rupiah di Shopee."
                          className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2.5 text-slate-800 placeholder-[#94a3b8] outline-none focus:border-[#0F5132] h-20"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Tipe Voucher</label>
                          <select
                            value={voucherType}
                            onChange={e => setVoucherType(e.target.value as any)}
                            className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2 text-slate-800 outline-none focus:border-[#0F5132]"
                          >
                            <option value="INTERNAL">Internal (Belanja Saloka)</option>
                            <option value="EXTERNAL">External (Mitra Shopee/Tokped)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Biaya Tukar Koin</label>
                          <input
                            type="number"
                            required
                            value={voucherCoinCost}
                            onChange={e => setVoucherCoinCost(e.target.value)}
                            placeholder="e.g. 10"
                            className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2.5 text-slate-800 outline-none focus:border-[#0F5132]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Nilai Rupiah Potongan</label>
                          <input
                            type="number"
                            required
                            value={voucherValue}
                            onChange={e => setVoucherValue(e.target.value)}
                            placeholder="e.g. 25000"
                            className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2.5 text-slate-800 outline-none focus:border-[#0F5132]"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Kode Klaim (External)</label>
                          <input
                            type="text"
                            value={voucherCode}
                            onChange={e => setVoucherCode(e.target.value)}
                            placeholder="Kosongkan jika tipe INTERNAL"
                            className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2.5 text-slate-800 outline-none focus:border-[#0F5132]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Stok Awal</label>
                          <input
                            type="number"
                            required
                            value={voucherMaxRedemption}
                            onChange={e => setVoucherMaxRedemption(e.target.value)}
                            placeholder="0 = Unlimited"
                            className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2.5 text-slate-800 outline-none focus:border-[#0F5132]"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Masa Berlaku (Selesai)</label>
                          <input
                            type="date"
                            value={voucherValidUntil}
                            onChange={e => setVoucherValidUntil(e.target.value)}
                            className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2 text-slate-800 outline-none focus:border-[#0F5132]"
                          />
                        </div>
                      </div>

                      <div className="pt-4 flex gap-3">
                        <button
                          type="button"
                          onClick={() => setIsVoucherModalOpen(false)}
                          className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-[var(--radius-brand)] uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={isPending}
                          className="flex-1 py-2.5 bg-[#0F5132] hover:bg-[#0a3a24] text-white font-bold rounded-[var(--radius-brand)] uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {isPending ? 'Membuat...' : 'Buat Voucher'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

          {/* ─── ADD ADMIN MODAL ────────────────────────────────────── */}
          {isAdminModalOpen && currentUser.isSuperAdmin && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white border border-[#0F5132]/25 rounded-[var(--radius-brand)] max-w-md w-full p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="font-sora text-sm font-bold text-[#0F5132] uppercase tracking-wider">Tambah Administrator Baru</h3>
                  <button onClick={() => setIsAdminModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>

                <form onSubmit={handleCreateAdminSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Nama Lengkap</label>
                    <input
                      type="text"
                      required
                      value={adminName}
                      onChange={e => setAdminName(e.target.value)}
                      placeholder="e.g. Budi Santoso"
                      className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2.5 text-slate-800 placeholder-[#94a3b8] outline-none focus:border-[#0F5132]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Alamat Email</label>
                    <input
                      type="email"
                      required
                      value={adminEmail}
                      onChange={e => setAdminEmail(e.target.value)}
                      placeholder="e.g. budi.admin@saloka.id"
                      className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2.5 text-slate-800 placeholder-[#94a3b8] outline-none focus:border-[#0F5132]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Kata Sandi (Password)</label>
                    <input
                      type="password"
                      required
                      value={adminPassword}
                      onChange={e => setAdminPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2.5 text-slate-800 placeholder-[#94a3b8] outline-none focus:border-[#0F5132]"
                    />
                  </div>

                  <div className="flex items-center gap-2 py-2">
                    <input
                      type="checkbox"
                      id="isSuper"
                      checked={adminIsSuper}
                      onChange={e => setAdminIsSuper(e.target.checked)}
                      className="rounded text-[#0F5132] focus:ring-[#0F5132] cursor-pointer"
                    />
                    <label htmlFor="isSuper" className="text-xs text-slate-700 font-semibold cursor-pointer">
                      Jadikan Superadmin (Otoritas Penuh & Inject Koin)
                    </label>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsAdminModalOpen(false)}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-[var(--radius-brand)] uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="flex-1 py-2.5 bg-[#0F5132] hover:bg-[#0a3a24] text-white font-bold rounded-[var(--radius-brand)] uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isPending ? 'Menyimpan...' : 'Tambah Staf'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ─── INJECT COIN MODAL (SUPERADMIN ONLY) ───────────────────────── */}
          {isInjectModalOpen && currentUser.isSuperAdmin && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white border border-[#0F5132]/25 rounded-[var(--radius-brand)] max-w-md w-full p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="font-sora text-sm font-bold text-[#0F5132] uppercase tracking-wider">⚡ Inject Koin Ke Sistem</h3>
                  <button onClick={() => setIsInjectModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>

                <form onSubmit={handleInjectCoinSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Tipe Penerima</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="targetType"
                          checked={injectTargetType === 'USER'}
                          onChange={() => { setInjectTargetType('USER'); setInjectTargetId(''); }}
                          className="text-[#0F5132] focus:ring-[#0F5132]"
                        />
                        <span className="text-slate-700 font-semibold">Merchant / User</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="targetType"
                          checked={injectTargetType === 'COMMUNITY'}
                          onChange={() => { setInjectTargetType('COMMUNITY'); setInjectTargetId(''); }}
                          className="text-[#0F5132] focus:ring-[#0F5132]"
                        />
                        <span className="text-slate-700 font-semibold">Kas Komunitas</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Pilih Target Penerima</label>
                    <select
                      required
                      value={injectTargetId}
                      onChange={e => setInjectTargetId(e.target.value)}
                      className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2.5 text-slate-800 outline-none focus:border-[#0F5132]"
                    >
                      <option value="">-- Pilih Penerima --</option>
                      {injectTargetType === 'USER' ? (
                        users.map(u => (
                          <option key={u.id} value={u.id}>{u.name} ({u.role} - {u.email})</option>
                        ))
                      ) : (
                        Array.from(new Map([
                          ...invoices.map(inv => inv.community).filter(Boolean),
                          ...coinHolders.filter(h => h.type.startsWith('KOMUNITAS')).map(h => ({ id: h.id, name: h.name, type: 'KOMUNITAS' }))
                        ].map((c: any) => [c.id, c])).values()).map((c: any) => (
                          <option key={c.id} value={c.id}>{c.name} ({c.type || 'KOMUNITAS'})</option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Jumlah Koin Inject</label>
                    <input
                      type="number"
                      required
                      value={injectAmount}
                      onChange={e => setInjectAmount(e.target.value)}
                      placeholder="e.g. 1000"
                      className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2.5 text-slate-800 placeholder-[#94a3b8] outline-none focus:border-[#0F5132]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Alasan Inject (Penting untuk Audit Log)</label>
                    <textarea
                      required
                      value={injectReason}
                      onChange={e => setInjectReason(e.target.value)}
                      placeholder="e.g. Topup awal kas komunitas / Reward event tahunan merchant"
                      className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2.5 text-slate-800 placeholder-[#94a3b8] outline-none focus:border-[#0F5132] h-20"
                    />
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsInjectModalOpen(false)}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-[var(--radius-brand)] uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="flex-1 py-2.5 bg-[#0F5132] hover:bg-[#0a3a24] text-white font-bold rounded-[var(--radius-brand)] uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 border-none"
                    >
                      {isPending ? 'Injecting...' : 'Inject Koin'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ─── CREATE / EDIT COMMUNITY MODAL (HIGH FIDELITY UI/UX SALOKA) ─── */}
          {communityModal.open && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 font-sans">
              <div className="bg-white border border-gray-200 rounded-[12px] max-w-2xl w-full p-4 sm:p-5 shadow-2xl animate-in zoom-in-95 duration-200 text-gray-900 flex flex-col max-h-[88vh]">

                {/* JUDUL MODAL - STICKY TOP */}
                <div className="flex justify-between items-center border-b border-gray-100 pb-3 shrink-0">
                  <h3 className="font-sora text-sm font-extrabold text-[#16A34A] uppercase tracking-wider">
                    {communityModal.mode === 'add' ? 'Tambah Komunitas Induk Baru' : 'Edit Komunitas Induk'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setCommunityModal({ open: false, mode: 'add' })}
                    className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center text-xs transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveCommunitySubmit} className="flex flex-col flex-1 overflow-hidden pt-3">
                  {/* SCROLLABLE BODY */}
                  <div className="overflow-y-auto pr-1.5 space-y-4 flex-1 text-xs">

                    {/* BAGIAN 1: INFORMASI DASAR */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 border-b border-gray-100 pb-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#16A34A]"></span>
                        <h4 className="text-[10px] font-extrabold text-[#16A34A] uppercase tracking-wider">
                          INFORMASI DASAR
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                            Nama Komunitas <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={commForm.name}
                            onChange={e => setCommForm({ ...commForm, name: e.target.value })}
                            placeholder="e.g. Komunitas UMKM Batik Solo"
                            className="w-full bg-white border border-gray-300 rounded-[8px] px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-[#16A34A] transition-all shadow-2xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                            Ketua Komunitas <span className="text-red-500">*</span>
                          </label>
                          <select
                            required
                            value={commForm.ketuaId}
                            onChange={e => setCommForm({ ...commForm, ketuaId: e.target.value })}
                            className="w-full bg-white border border-gray-300 rounded-[8px] px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-[#16A34A] transition-all shadow-2xs cursor-pointer"
                          >
                            <option value="">-- Pilih Ketua Komunitas --</option>
                            {users.map(u => (
                              <option key={u.id} value={u.id}>
                                {u.name} ({u.email})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                            Tipe Komunitas
                          </label>
                          <select
                            value={commForm.type}
                            onChange={e => setCommForm({ ...commForm, type: e.target.value, category: e.target.value ? commForm.category : '' })}
                            className="w-full bg-white border border-gray-300 rounded-[8px] px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-[#16A34A] transition-all shadow-2xs cursor-pointer"
                          >
                            <option value="">-- Pilih Tipe Komunitas --</option>
                            <option value="PERKUMPULAN">PERKUMPULAN</option>
                            <option value="KOPERASI">KOPERASI</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                            Kategori
                          </label>
                          <select
                            disabled={!commForm.type}
                            value={commForm.category}
                            onChange={e => setCommForm({ ...commForm, category: e.target.value })}
                            className="w-full bg-white border border-gray-300 rounded-[8px] px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-[#16A34A] transition-all shadow-2xs cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
                          >
                            <option value="">-- Pilih Kategori --</option>
                            <option value="FREE">FREE</option>
                            <option value="PAID">PAID</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                          Deskripsi Singkat
                        </label>
                        <textarea
                          rows={2}
                          value={commForm.description}
                          onChange={e => setCommForm({ ...commForm, description: e.target.value })}
                          placeholder="Tuliskan deskripsi visi dan tujuan komunitas..."
                          className="w-full bg-white border border-gray-300 rounded-[8px] px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-[#16A34A] transition-all shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* BAGIAN 2: TEMPLATE HALAMAN */}
                    <div className="space-y-3 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2 border-b border-gray-100 pb-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#16A34A]"></span>
                        <h4 className="text-[10px] font-extrabold text-[#16A34A] uppercase tracking-wider">
                          TEMPLATE HALAMAN
                        </h4>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                          Pilih Template Halaman
                        </label>
                        <select
                          value={selectedTemplate}
                          onChange={e => setSelectedTemplate(e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded-[8px] px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-[#16A34A] transition-all shadow-2xs font-semibold cursor-pointer"
                        >
                          <option value="Community">▼ Community</option>
                          <option value="Business">▼ Business</option>
                          <option value="Education">▼ Education</option>
                          <option value="Culinary">▼ Culinary</option>
                          <option value="Koperasi">▼ Koperasi</option>
                        </select>
                      </div>

                      {/* PREVIEW LAYOUT (CARD KECIL) */}
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-[10px] shadow-2xs space-y-2">
                        <div className="flex justify-between items-center border-b border-gray-200/60 pb-1.5">
                          <span className="text-[9px] font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                            <Sliders className="w-3 h-3 text-[#16A34A]" /> Preview Layout ({selectedTemplate})
                          </span>
                          <span className="px-2 py-0.5 bg-[#E8F5E9] border border-[#16A34A]/30 text-[#16A34A] font-extrabold text-[8px] rounded uppercase">
                            Card Layout Kecil
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
                          {[
                            { title: 'Hero Banner', bg: 'bg-[#16A34A] text-white', icon: Sparkles },
                            { title: 'Aktivitas Terbaru', bg: 'bg-white border border-gray-200 text-gray-800', icon: Activity },
                            { title: 'Diskusi', bg: 'bg-white border border-gray-200 text-gray-800', icon: MessageSquare },
                            { title: 'Event', bg: 'bg-white border border-gray-200 text-gray-800', icon: Calendar },
                            { title: 'Produk Anggota', bg: 'bg-white border border-gray-200 text-gray-800', icon: ShoppingBag },
                            { title: 'Galeri', bg: 'bg-white border border-gray-200 text-gray-800', icon: ImageIcon },
                            { title: 'Anggota', bg: 'bg-white border border-gray-200 text-gray-800', icon: UsersIcon },
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

                      {/* MODUL BAWAAN & BUTTON SESUAIKAN MODUL */}
                      <div className="p-3 bg-emerald-50/50 border border-[#16A34A]/20 rounded-[10px] flex items-center justify-between gap-3">
                        <div className="space-y-1">
                          <span className="block text-[10px] font-extrabold text-gray-900 uppercase tracking-wider">
                            Modul Bawaan
                          </span>
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] text-gray-700 font-semibold">
                            <span className="flex items-center gap-0.5 text-[#16A34A]">✓ Hero Banner</span>
                            <span className="flex items-center gap-0.5 text-[#16A34A]">✓ Aktivitas</span>
                            <span className="flex items-center gap-0.5 text-[#16A34A]">✓ Diskusi</span>
                            <span className="flex items-center gap-0.5 text-[#16A34A]">✓ Event</span>
                            <span className="flex items-center gap-0.5 text-[#16A34A]">✓ Produk Anggota</span>
                            <span className="flex items-center gap-0.5 text-[#16A34A]">✓ Galeri</span>
                            <span className="flex items-center gap-0.5 text-[#16A34A]">✓ Anggota</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setModuleSettingsOpen(true)}
                          className="px-3 py-1.5 bg-white border border-[#16A34A] text-[#16A34A] hover:bg-[#16A34A] hover:text-white font-extrabold text-[11px] rounded-[8px] transition-all shadow-2xs flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <Settings className="w-3 h-3" /> Sesuaikan Modul
                        </button>
                      </div>
                    </div>

                    {/* BAGIAN 3: LEGALITAS KOMUNITAS */}
                    <div className="space-y-3 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2 border-b border-gray-100 pb-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#16A34A]"></span>
                        <h4 className="text-[10px] font-extrabold text-[#16A34A] uppercase tracking-wider">
                          LEGALITAS KOMUNITAS
                        </h4>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                        <div>
                          <label className="block text-[9px] font-bold text-gray-600 uppercase mb-1">
                            Akta Notaris
                          </label>
                          <input
                            type="text"
                            value={commForm.aktaNotaris}
                            onChange={e => setCommForm({ ...commForm, aktaNotaris: e.target.value })}
                            placeholder="No. Akta Notaris"
                            className="w-full bg-white border border-gray-300 rounded-[8px] px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-[#16A34A] transition-all shadow-2xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-gray-600 uppercase mb-1">
                            Nomor AHU
                          </label>
                          <input
                            type="text"
                            value={commForm.nomorAhu}
                            onChange={e => setCommForm({ ...commForm, nomorAhu: e.target.value })}
                            placeholder="AHU-xxxxx"
                            className="w-full bg-white border border-gray-300 rounded-[8px] px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-[#16A34A] transition-all shadow-2xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-gray-600 uppercase mb-1">
                            NPWP
                          </label>
                          <input
                            type="text"
                            value={commForm.nomorNpwp}
                            onChange={e => setCommForm({ ...commForm, nomorNpwp: e.target.value })}
                            placeholder="xx.xxx.xxx.x-xxx.xxx"
                            className="w-full bg-white border border-gray-300 rounded-[8px] px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-[#16A34A] transition-all shadow-2xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-gray-600 uppercase mb-1">
                            Domisili
                          </label>
                          <input
                            type="text"
                            value={commForm.domisili}
                            onChange={e => setCommForm({ ...commForm, domisili: e.target.value })}
                            placeholder="Kota / Kabupaten"
                            className="w-full bg-white border border-gray-300 rounded-[8px] px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-[#16A34A] transition-all shadow-2xs"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 pt-1">
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-[#0F5132]">
                          <input
                            type="checkbox"
                            checked={commForm.isKycRequired}
                            onChange={e => setCommForm({ ...commForm, isKycRequired: e.target.checked })}
                            className="w-4 h-4 rounded accent-[#0F5132] cursor-pointer"
                          />
                          <span>Wajibkan Verifikasi KYC (KTP/Selfie)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-gray-800">
                          <input
                            type="checkbox"
                            checked={commForm.isVerified}
                            onChange={e => setCommForm({ ...commForm, isVerified: e.target.checked })}
                            className="w-4 h-4 rounded accent-[#16A34A] cursor-pointer"
                          />
                          <span>Verified Komunitas</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-red-700">
                          <input
                            type="checkbox"
                            checked={commForm.isSuspended}
                            onChange={e => setCommForm({ ...commForm, isSuspended: e.target.checked })}
                            className="w-4 h-4 rounded accent-red-600 cursor-pointer"
                          />
                          <span>Suspend Komunitas</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* FOOTER ACTIONS - STICKY BOTTOM */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => setCommunityModal({ open: false, mode: 'add' })}
                      className="px-5 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 font-extrabold text-xs rounded-[8px] transition-all cursor-pointer shadow-2xs"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="px-5 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-extrabold text-xs rounded-[8px] transition-all cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      {isPending ? 'Menyimpan...' : 'Simpan Komunitas'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'payment_methods' && (
            <PaymentMethodsTab />
          )}

          {/* ─── MODAL SESUAIKAN MODUL (SETTINGS SUB-MODAL) ──────────────── */}
          {moduleSettingsOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 font-sans">
              <div className="bg-white border border-gray-200 rounded-[12px] max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 text-gray-900">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <h3 className="font-sora text-sm font-extrabold text-[#16A34A] uppercase tracking-wider flex items-center gap-2">
                    <Settings className="w-4 h-4" /> Pengaturan Modul Halaman
                  </h3>
                  <button onClick={() => setModuleSettingsOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <p className="text-xs text-gray-600 font-medium leading-relaxed">
                  Pilih modul bawaan yang diizinkan aktif pada template <strong className="text-[#16A34A] font-bold">{selectedTemplate}</strong>.
                </p>

                <div className="space-y-2.5 pt-1">
                  {[
                    { key: 'heroBanner', label: 'Hero Banner Dashboard' },
                    { key: 'aktivitas', label: 'Feed Aktivitas Terbaru' },
                    { key: 'diskusi', label: 'Forum Diskusi Anggota' },
                    { key: 'event', label: 'Kalender & Event Komunitas' },
                    { key: 'produkAnggota', label: 'Katalog Produk Anggota' },
                    { key: 'galeri', label: 'Galeri Foto & Dokumen' },
                    { key: 'anggota', label: 'Direktori Anggota Aktif' },
                  ].map((item) => (
                    <label key={item.key} className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200/80 rounded-[8px] cursor-pointer hover:bg-gray-100 transition-colors">
                      <span className="text-xs font-bold text-gray-800">{item.label}</span>
                      <input
                        type="checkbox"
                        checked={!!modulesConfig[item.key]}
                        onChange={e => setModulesConfig({ ...modulesConfig, [item.key]: e.target.checked })}
                        className="w-4 h-4 rounded accent-[#16A34A] cursor-pointer"
                      />
                    </label>
                  ))}
                </div>

                <div className="pt-3 flex gap-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setModuleSettingsOpen(false)}
                    className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-[12px] transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModuleSettingsOpen(false)
                      alert('Konfigurasi modul berhasil disimpan!')
                    }}
                    className="flex-1 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs rounded-[12px] transition-all cursor-pointer shadow-2xs"
                  >
                    Simpan Modul
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── MANAGE COMMUNITY MEMBERS MODAL ─────────────────────────────── */}
          {memberModal.open && memberModal.community && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in zoom-in-95 duration-200">
              <div className="bg-white border border-[#0F5132]/25 rounded-[var(--radius-brand)] max-w-xl w-full p-6 space-y-6 shadow-2xl">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-sora text-sm font-bold text-[#0F5132] uppercase tracking-wider">
                      Anggota Komunitas: {memberModal.community.name}
                    </h3>
                    <p className="text-[10px] text-slate-400">Total {users.filter(u => u.indukCommunityId === memberModal.community.id).length} Anggota terdaftar</p>
                  </div>
                  <button onClick={() => setMemberModal({ open: false })} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>

                {/* Quick Add Member */}
                <div className="bg-emerald-50/50 p-4 border border-[#0F5132]/20 rounded space-y-2">
                  <label className="block text-[10px] font-bold text-[#0F5132] uppercase tracking-wider">Daftarkan Anggota / Reassign ke Komunitas ini</label>
                  <div className="flex gap-2">
                    <select
                      value={selectedMemberUserId}
                      onChange={e => setSelectedMemberUserId(e.target.value)}
                      className="flex-grow bg-white border border-[#cbd5e1] rounded px-3 py-2 text-xs text-slate-800"
                    >
                      <option value="">-- Pilih User / Merchant --</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role} - {u.email})</option>
                      ))}
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

                {/* Current Members List */}
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded">
                  {users.filter(u => u.indukCommunityId === memberModal.community.id).length === 0 ? (
                    <p className="p-4 text-center text-xs text-slate-400 italic">Belum ada anggota terdaftar di komunitas ini.</p>
                  ) : (
                    users.filter(u => u.indukCommunityId === memberModal.community.id).map(mem => (
                      <div key={mem.id} className="p-3 flex justify-between items-center hover:bg-slate-50">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{mem.name}</p>
                          <p className="text-[10px] text-slate-400">{mem.email} • Role: {mem.role}</p>
                        </div>
                        <button
                          onClick={() => handleAddMemberToCommunity('', mem.id)}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded text-[9px] font-bold uppercase tracking-wider cursor-pointer"
                        >
                          Keluarkan
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* ─── REJECT LEVEL UP REASON MODAL ─────────────────────────────── */}
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
                      onChange={e => setInjectRejectNote(e.target.value)}
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
      </main>
    </div>
  )
}
