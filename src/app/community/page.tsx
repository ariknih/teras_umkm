'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getIndukCommunities, createIndukCommunity, getUserCommunitiesWithRolesAction } from '@/app/actions/community'
import { getGlobalKycSettingAction } from '@/app/actions/admin'
import { getCurrentUser } from '@/app/actions/auth'
import { goeyToast } from 'goey-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { CommunityCardSkeleton, GridSkeleton } from '@/components/ui/GhostSkeleton'
import { 
  Shield, 
  Users, 
  MapPin, 
  DollarSign, 
  PlusCircle, 
  Search, 
  Info,
  CheckCircle2, 
  AlertTriangle,
  FileText,
  Upload,
  X,
  Loader2,
  Building,
  TrendingUp,
  Briefcase,
  QrCode,
  CreditCard,
  Wallet,
  Landmark,
  Check,
  Coins,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Lock,
  Gift,
  Clock
} from 'lucide-react'

// Helper to render real community profile photo/avatar matching the directory
function renderCommunityLogo(commName: string = '', avatarUrl?: string | null) {
  // If community has an avatarUrl (from database/seed/upload), use it directly
  if (avatarUrl && typeof avatarUrl === 'string' && avatarUrl.trim() !== '') {
    return (
      <img
        src={avatarUrl}
        alt={commName}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover rounded-full"
      />
    )
  }

  // Initials fallback if no photo is available
  const initials = commName
    ? commName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(w => w[0])
        .join('')
        .toUpperCase()
    : 'KM'

  return (
    <div className="w-full h-full rounded-full bg-emerald-100 text-[#0F5132] font-sora font-black text-xs sm:text-sm flex items-center justify-center">
      {initials}
    </div>
  )
}

export default function CommunityDirectoryPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [communities, setCommunities] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [visibleCount, setVisibleCount] = useState(6)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Step state for creation modal: 'FORM' | 'PAYMENT' | 'SUCCESS'
  const [modalStep, setModalStep] = useState<'FORM' | 'PAYMENT' | 'SUCCESS'>('FORM')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'qris' | 'va' | 'ewallet' | 'credit_card'>('qris')
  const [createdCommunityData, setCreatedCommunityData] = useState<any>(null)

  // Form states for creating a community
  const [name, setName] = useState('')
  const [type, setType] = useState<'PERKUMPULAN' | 'KOPERASI'>('PERKUMPULAN')
  const [description, setDescription] = useState('')
  const [aktaNotaris, setAktaNotaris] = useState('')
  const [nomorAhu, setNomorAhu] = useState('')
  const [nomorNpwp, setNomorNpwp] = useState('')
  const [domisili, setDomisili] = useState('')
  const [kontakPj, setKontakPj] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [waGroupLink, setWaGroupLink] = useState('')
  const [joinFee, setJoinFee] = useState('')
  const [monthlyFee, setMonthlyFee] = useState('')
  const [isKycRequired, setIsKycRequired] = useState(false)
  const [coopTier, setCoopTier] = useState<'BASIC' | 'PLUS' | 'PRO'>('BASIC')
  const [perkumpulanTier, setPerkumpulanTier] = useState<'REGULER' | 'PREMIUM'>('REGULER')
  const [templateType, setTemplateType] = useState<'Community' | 'Business' | 'Education' | 'Culinary' | 'Koperasi'>('Community')

  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)

  const handleFileUpload = async (file: File, type: 'avatar' | 'cover') => {
    const setUploading = type === 'avatar' ? setUploadingAvatar : setUploadingCover
    const setUrl = type === 'avatar' ? setAvatarUrl : setCoverUrl

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

  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [globalKycRequired, setGlobalKycRequired] = useState(true)
  const [kycWarningModalOpen, setKycWarningModalOpen] = useState(false)

  const handleOpenCreateModal = () => {
    const isKycVerified = user && (user.kycStatus === 'VERIFIED' || user.kycStatus === 'APPROVED')
    if (globalKycRequired && !isKycVerified) {
      setKycWarningModalOpen(true)
      return
    }
    setCreateModalOpen(true)
  }

  const [myCommunities, setMyCommunities] = useState<any[]>([])
  const [allRolesModalOpen, setAllRolesModalOpen] = useState(false)

  async function loadData(isBackgroundSync: boolean = false) {
    try {
      // Parallelize ALL independent queries in a single roundtrip
      const [currentUser, comms, kycRes, myComms] = await Promise.all([
        getCurrentUser().catch(() => null),
        getIndukCommunities().catch(() => []),
        getGlobalKycSettingAction().catch(() => null),
        getUserCommunitiesWithRolesAction().catch(() => [])
      ])

      if (currentUser) {
        setUser(currentUser)
        try {
          sessionStorage.setItem('cache_community_user', JSON.stringify(currentUser))
        } catch (_) {}
      }

      // Exclude pending and suspended communities from public directory
      const verifiedComms = (comms || []).filter((c: any) => c.isVerified && !c.isSuspended)
      setCommunities(verifiedComms)
      try {
        sessionStorage.setItem('cache_communities_directory', JSON.stringify(verifiedComms))
      } catch (_) {}

      if (kycRes && kycRes.required !== undefined) {
        setGlobalKycRequired(kycRes.required)
      }

      if (Array.isArray(myComms)) {
        setMyCommunities(myComms)
        try {
          sessionStorage.setItem('cache_my_communities', JSON.stringify(myComms))
        } catch (_) {}
      }
    } catch (e) {
      console.error('Error loading community directory data:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // SWR Pattern: Load from sessionStorage cache instantly for 0ms initial render
    try {
      const cachedCommsStr = sessionStorage.getItem('cache_communities_directory')
      const cachedMyCommsStr = sessionStorage.getItem('cache_my_communities')
      const cachedUserStr = sessionStorage.getItem('cache_community_user')

      let hasCachedData = false

      if (cachedCommsStr) {
        const parsedComms = JSON.parse(cachedCommsStr)
        if (Array.isArray(parsedComms) && parsedComms.length > 0) {
          setCommunities(parsedComms)
          setLoading(false)
          hasCachedData = true
        }
      }
      if (cachedMyCommsStr) {
        const parsedMy = JSON.parse(cachedMyCommsStr)
        if (Array.isArray(parsedMy)) setMyCommunities(parsedMy)
      }
      if (cachedUserStr) {
        const parsedUser = JSON.parse(cachedUserStr)
        if (parsedUser) setUser(parsedUser)
      }

      // Fetch fresh data in parallel (background sync if cache was hit)
      loadData(hasCachedData)
    } catch (_) {
      loadData(false)
    }
  }, [])

  const getTierPrice = (tier: string) => {
    if (type === 'PERKUMPULAN') {
      return perkumpulanTier === 'PREMIUM' ? 200000 : 0
    }
    if (tier === 'BASIC') return 99000
    if (tier === 'PLUS') return 199000
    return 399000
  }

  const getTierCoins = (tier: string) => {
    if (type === 'PERKUMPULAN') return '0'
    if (tier === 'BASIC') return '500'
    if (tier === 'PLUS') return '1.500'
    return '3.000'
  }

  const getTierSubtitle = (tier: string) => {
    if (type === 'PERKUMPULAN') {
      return perkumpulanTier === 'PREMIUM' ? 'Biaya Aktivasi One-Time' : 'Gratis Selamanya'
    }
    if (tier === 'BASIC') return 'Paket Dasar'
    if (tier === 'PLUS') return 'Paket Pengembangan'
    return 'Paket Profesional'
  }

  const getExpirationDateString = () => {
    const d = new Date()
    d.setFullYear(d.getFullYear() + 1)
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
  }

  const handleCreateCommunity = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setFormError(null)

    if (!name || !description) {
      setFormError('Nama dan Deskripsi wajib diisi.')
      setModalStep('FORM')
      return
    }

    if (!aktaNotaris || !nomorAhu || !nomorNpwp || !domisili) {
      setFormError('Legalitas organisasi (Akta Notaris, AHU, NPWP, Domisili) wajib diisi.')
      setModalStep('FORM')
      return
    }

    if (type === 'KOPERASI' && (!joinFee || !monthlyFee)) {
      setFormError('Biaya simpanan pokok dan iuran wajib koperasi wajib diisi.')
      setModalStep('FORM')
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.append('name', name)
      formData.append('type', type)
      formData.append('description', description)
      formData.append('aktaNotaris', aktaNotaris)
      formData.append('nomorAhu', nomorAhu)
      formData.append('nomorNpwp', nomorNpwp)
      formData.append('domisili', domisili)
      formData.append('kontakPj', kontakPj)
      formData.append('avatarUrl', avatarUrl)
      formData.append('coverUrl', coverUrl)
      formData.append('waGroupLink', waGroupLink)
      formData.append('joinFee', joinFee)
      formData.append('monthlyFee', monthlyFee)
      formData.append('isKycRequired', String(isKycRequired))
      formData.append('coopTier', coopTier)
      formData.append('perkumpulanTier', perkumpulanTier)
      formData.append('templateType', templateType)

      const res = await createIndukCommunity(formData)
      if (res.error) {
        setFormError(res.error)
        setModalStep('FORM')
      } else {
        goeyToast.success(`Komunitas ${res.community?.name || ''} berhasil dibuat!`)
        setCreateModalOpen(false)
        setModalStep('FORM')
        if (res.community?.id) {
          router.push(`/community/${res.community.id}`)
        }
        
        // Reset form
        setName('')
        setType('PERKUMPULAN')
        setPerkumpulanTier('REGULER')
        setDescription('')
        setAktaNotaris('')
        setNomorAhu('')
        setNomorNpwp('')
        setDomisili('')
        setKontakPj('')
        setAvatarUrl('')
        setCoverUrl('')
        setWaGroupLink('')
        setJoinFee('')
        setMonthlyFee('')
        setIsKycRequired(false)
        setCoopTier('BASIC')
        setTemplateType('Community')

        loadData()
      }
    })
  }

  const filteredCommunities = communities.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const isKycApproved = user && (user.kycStatus === 'VERIFIED' || user.kycStatus === 'APPROVED')
  const requiresKycToCreate = globalKycRequired && !isKycApproved

  return (
    <div id="body-container" className="min-h-screen bg-[#F5F7F9] text-[#111111] py-4 sm:py-6 px-3 sm:px-6 relative overflow-x-hidden flex flex-col items-center">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1400px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(45,178,74,0.03)_0%,transparent_80%)] pointer-events-none z-0" />

      <div className="relative z-10 w-full max-w-[1200px] mx-auto space-y-6">
        {/* Banner Card */}
        <div id="banner-card" className="border border-black/5 bg-white/60 backdrop-blur-xl p-5 sm:p-8 md:p-12 rounded-3xl text-center space-y-3 sm:space-y-4 shadow-xl relative overflow-hidden w-full mb-4 sm:mb-6">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(45,178,74,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(45,178,74,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
          
          <span className="px-3 py-1 border border-primary/20 bg-primary/5 text-primary text-[9px] sm:text-[10px] font-bold tracking-widest uppercase rounded-full inline-block">
            SALOKA BUSINESS NETWORK
          </span>
          <h1 className="font-sora text-2xl sm:text-3xl md:text-5xl font-extrabold text-[#111111] tracking-tight">
            Direktori Komunitas Induk
          </h1>
          <p className="text-xs md:text-sm text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Pilih Komunitas Induk utama Anda sebagai syarat membuka Dashboard Merchant. Jalin kemitraan, diskusikan legalitas usaha, dan akses permodalan koperasi untuk pertumbuhan bisnis UMKM Anda.
          </p>

          <div className="pt-2 flex justify-center">
            {user ? (
              <button
                onClick={handleOpenCreateModal}
                className="px-6 py-3 bg-primary hover:bg-primary/95 text-black font-geist font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-primary/10 flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                Buat Komunitas Baru
              </button>
            ) : (
              <Link
                href="/auth?tab=register"
                className="px-6 py-3 bg-primary hover:bg-primary/95 text-black font-geist font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg"
              >
                Daftar & Masuk Untuk Buat Komunitas
              </Link>
            )}
          </div>
        </div>

        {/* Komunitas & Role Saya (Multi-Community Memberships) Widget - Touch Swipeable Carousel & View All */}
        {user && myCommunities && myCommunities.length > 0 && (
          <div className="bg-white border border-gray-200/80 rounded-3xl p-3.5 sm:p-6 shadow-xs space-y-3.5 w-full">
            {/* Header: Title Left + "Lihat semua >" Always Visible Right on Mobile */}
            <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-100 text-[#0F5132] flex items-center justify-center font-bold shrink-0 shadow-2xs">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="font-sora text-xs sm:text-sm font-black text-slate-900 truncate">
                  Komunitas & Role Saya <span className="text-[#0F5132]">({myCommunities.length})</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAllRolesModalOpen(true)}
                className="text-[11px] sm:text-xs font-extrabold text-[#2DB24A] hover:text-[#0F5132] transition-colors flex items-center gap-0.5 shrink-0 whitespace-nowrap cursor-pointer p-1"
              >
                <span>Lihat semua</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Horizontal Scroll Carousel with Touch-Pan Support */}
            <div className="flex overflow-x-auto no-scrollbar gap-2.5 sm:gap-3.5 pb-2 -mx-1 px-1 snap-x snap-mandatory items-stretch touch-pan-x">
              {myCommunities.map((mc: any) => {
                const matchedComm = communities.find((c: any) => c.id === mc.communityId || c.name === mc.communityName)
                const effectiveAvatar = mc.avatarUrl || matchedComm?.avatarUrl || null

                return (
                  <Link
                    key={mc.communityId}
                    href={`/community/${mc.communityId}`}
                    className="w-[130px] sm:w-[155px] md:w-[180px] shrink-0 snap-start bg-white border border-gray-200/90 hover:border-[#2DB24A]/60 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-2xs hover:shadow-md transition-all flex flex-col items-center justify-between text-center group cursor-pointer select-none"
                  >
                    {/* Top: Circular Community Logo Avatar */}
                    <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-full bg-white border border-gray-150 p-1 flex items-center justify-center overflow-hidden shadow-xs shrink-0 group-hover:scale-105 transition-transform duration-300">
                      {renderCommunityLogo(mc.communityName, effectiveAvatar)}
                    </div>

                  {/* Middle: Community Name (max 2 lines) */}
                  <h4 className="font-sora text-[11px] sm:text-xs md:text-sm font-black text-slate-900 group-hover:text-[#2DB24A] transition-colors line-clamp-2 h-8 sm:h-10 flex items-center justify-center mt-2 leading-tight px-0.5">
                    {mc.communityName}
                  </h4>

                  {/* Bottom: Role Badge & Active Status */}
                  <div className="w-full mt-2.5 space-y-1">
                    <span className={`w-full py-1 sm:py-1.5 px-1.5 sm:px-2 rounded-lg sm:rounded-xl text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-wider block shadow-2xs ${
                      mc.role === 'KETUA' 
                        ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                        : mc.role === 'PEMBUAT_PENDING'
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : 'bg-emerald-100 text-[#0F5132] border border-emerald-200/80'
                    }`}>
                      {mc.role === 'KETUA' ? 'KETUA' : mc.role === 'PEMBUAT_PENDING' ? 'CALON KETUA' : 'ANGGOTA'}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 block">
                      {mc.isVerified ? '✓ Aktif' : '⏳ Pending'}
                    </span>
                  </div>
                </Link>
              )})}

              {/* End Card: View All */}
              {myCommunities.length > 2 && (
                <button
                  type="button"
                  onClick={() => setAllRolesModalOpen(true)}
                  className="w-[110px] sm:w-[135px] shrink-0 snap-start bg-gray-50/90 hover:bg-emerald-50/60 border border-dashed border-gray-250 hover:border-[#2DB24A] rounded-2xl sm:rounded-3xl p-3 sm:p-4 flex flex-col items-center justify-center text-center transition-all cursor-pointer group select-none"
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[#2DB24A] group-hover:scale-110 transition-transform shadow-xs mb-1.5">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                  <span className="font-sora text-[11px] sm:text-xs font-black text-slate-900 group-hover:text-[#0F5132]">
                    Lihat Semua
                  </span>
                  <span className="text-[9px] text-gray-500 font-semibold mt-0.5">
                    ({myCommunities.length} Komunitas)
                  </span>
                </button>
              )}
            </div>

            {/* ── MODAL SEMUA KOMUNITAS & ROLE SAYA ───────────────────────── */}
            <AnimatePresence>
              {allRolesModalOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[85vh]"
                  >
                    <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-emerald-50/50 to-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#0F5132] flex items-center justify-center font-bold shadow-2xs">
                          <Users className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-sora text-sm font-black text-gray-900">
                            Komunitas & Role Saya ({myCommunities.length})
                          </h3>
                          <p className="text-[10px] text-gray-500 font-medium">
                            Daftar seluruh komunitas yang Anda ikuti beserta hak akses Anda
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setAllRolesModalOpen(false)}
                        className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="p-5 space-y-3 overflow-y-auto flex-1">
                      {myCommunities.map((mc: any) => {
                        const matchedComm = communities.find((c: any) => c.id === mc.communityId || c.name === mc.communityName)
                        const effectiveAvatar = mc.avatarUrl || matchedComm?.avatarUrl || null

                        return (
                          <div
                            key={mc.communityId}
                            className="p-4 bg-gray-50/80 hover:bg-[#E8F8EE]/40 border border-gray-200/80 hover:border-[#2DB24A]/40 rounded-2xl flex items-center justify-between gap-3 transition-all"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-12 h-12 rounded-full bg-white border border-gray-150 p-1 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                                {renderCommunityLogo(mc.communityName, effectiveAvatar)}
                              </div>
                            <div className="min-w-0">
                              <h4 className="font-sora text-xs sm:text-sm font-black text-gray-900 truncate">
                                {mc.communityName}
                              </h4>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                  mc.role === 'KETUA' 
                                    ? 'bg-purple-100 text-purple-800' 
                                    : mc.role === 'PEMBUAT_PENDING'
                                      ? 'bg-amber-100 text-amber-900'
                                      : 'bg-emerald-100 text-[#0F5132]'
                                }`}>
                                  {mc.role === 'KETUA' ? '👑 KETUA' : mc.role === 'PEMBUAT_PENDING' ? '⏳ CALON KETUA' : '👤 ANGGOTA'}
                                </span>
                                <span className="text-[10px] font-semibold text-gray-400">
                                  {mc.isVerified ? '✓ Aktif' : '⏳ Pending'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <Link
                            href={`/community/${mc.communityId}`}
                            onClick={() => setAllRolesModalOpen(false)}
                            className="px-3.5 py-1.5 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-[11px] rounded-xl shadow-xs transition-colors shrink-0"
                          >
                            Buka
                          </Link>
                        </div>
                      )})}
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Search Bar */}
        <div id="search-bar" className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-black/5 pb-4 w-full mb-6">
          <h2 className="font-sora text-lg font-bold text-[#111111]">
            Semua Komunitas Terdaftar ({filteredCommunities.length})
          </h2>
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama atau deskripsi komunitas..."
              className="w-full h-10 pl-10 pr-4 bg-white border border-black/10 rounded-xl text-xs text-[#111111] focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>

        {/* Directory Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <GridSkeleton count={6} type="community" />
          </div>
        ) : filteredCommunities.length === 0 ? (
          <div className="text-center py-20 border border-black/5 bg-white/60 rounded-3xl">
            <h3 className="font-sora text-sm font-bold text-[#111111] mb-2">Komunitas Tidak Ditemukan</h3>
            <p className="text-xs text-text-secondary max-w-xs mx-auto">
              Coba cari dengan kata kunci lain atau daftarkan komunitas bisnis Anda.
            </p>
          </div>
        ) : (
          <div id="directory-grid-section" className="space-y-8 mb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCommunities.slice(0, visibleCount).map((c) => {
                // Parse coopTier
                let coopTier = 'BASIC'
                if (c.type === 'KOPERASI') {
                  if (c.landingPageConfig) {
                    try {
                      const cfg = JSON.parse(c.landingPageConfig)
                      if (cfg.coopTier) coopTier = cfg.coopTier
                    } catch (_) {}
                  } else if (c.joinFee > 0 || c.monthlyFee > 0 || c.category === 'PAID') {
                    coopTier = 'PLUS'
                  }
                }

                return (
                  <div
                    key={c.id}
                    className="border border-black/5 bg-white rounded-2xl overflow-hidden flex flex-col justify-between shadow-xl hover:border-primary/20 transition-all duration-300 group"
                  >
                    {/* Banner */}
                    <div className="h-28 w-full bg-gradient-to-r from-neutral-200 via-neutral-100 to-green-500/10 relative overflow-hidden">
                      <img src={
                          c.coverUrl || 
                          (c.name.toLowerCase().includes('perahu') 
                            ? "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fm=webp&fit=crop&w=1200&q=80" 
                            : c.name.toLowerCase().includes('koperasi') 
                              ? "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fm=webp&fit=crop&w=1200&q=80" 
                              : "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fm=webp&fit=crop&w=1200&q=80")
                        } 
                        alt={c.name} 
                        loading="lazy" decoding="async"
                        className="object-cover w-full h-full" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                    </div>

                    {/* Details */}
                    <div className="p-5 flex-grow space-y-3.5">
                      <div className="flex gap-4">
                        {/* Icon */}
                        <div className="w-12 h-12 rounded-xl bg-white border border-primary/20 flex items-center justify-center font-bold text-lg text-primary shadow -mt-10 z-10 shrink-0 overflow-hidden">
                          <img src={
                              c.avatarUrl || 
                              (c.name.toLowerCase().includes('perahu') 
                                ? "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fm=webp&w=200&h=200&fit=crop&q=80" 
                                : c.name.toLowerCase().includes('koperasi') 
                                  ? "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fm=webp&w=200&h=200&fit=crop&q=80" 
                                  : "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fm=webp&w=200&h=200&fit=crop&q=80")
                            } 
                            alt={c.name} 
                            loading="lazy" decoding="async"
                            className="object-cover w-full h-full" 
                          />
                        </div>
                        
                        <div>
                          <h3 className="font-sora text-sm font-bold text-[#111111] line-clamp-1 group-hover:text-primary transition-colors">{c.name}</h3>
                          {(() => {
                            const parsedConfig = c.landingPageConfig ? (typeof c.landingPageConfig === 'string' ? JSON.parse(c.landingPageConfig) : c.landingPageConfig) : {}
                            const isPerkumpulanPrem = c.type === 'PERKUMPULAN' && (parsedConfig?.perkumpulanTier === 'PREMIUM' || (parsedConfig?.activationFeePaid ?? 0) > 0 || c.category === 'PAID')
                            const itemCoopTier = parsedConfig?.coopTier || 'BASIC'

                            return (
                              <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-geist font-extrabold border uppercase tracking-wider mt-1 ${
                                c.type === 'KOPERASI'
                                  ? itemCoopTier === 'PRO'
                                    ? 'bg-purple-500/10 border-purple-500/35 text-purple-600'
                                    : itemCoopTier === 'PLUS'
                                      ? 'bg-blue-500/10 border-blue-500/35 text-blue-600'
                                      : 'bg-emerald-500/10 border-emerald-500/35 text-emerald-600'
                                  : isPerkumpulanPrem
                                    ? 'bg-purple-500/10 border-purple-500/35 text-purple-600'
                                    : 'bg-emerald-500/10 border-emerald-500/35 text-emerald-600'
                              }`}>
                                {c.type === 'KOPERASI'
                                  ? `KOPERASI ${itemCoopTier}`
                                  : isPerkumpulanPrem
                                    ? 'PERKUMPULAN PREMIUM'
                                    : 'PERKUMPULAN REGULER'}
                              </span>
                            )
                          })()}
                        </div>
                      </div>

                      <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">{c.description}</p>
                    </div>

                    {/* Footer Action */}
                    <div className="px-5 py-4 border-t border-black/5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-text-secondary font-medium">
                        <Users className="w-3.5 h-3.5 text-primary" />
                        <span>{c._count?.members || 0} Anggota</span>
                      </div>
                      <Link
                        href={`/community/${c.id}`}
                        className="px-4 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/25 text-primary font-bold text-xs uppercase tracking-wider rounded-lg transition-colors"
                      >
                        Buka Komunitas
                      </Link>
                    </div>
                  </div>
                )
              })}
              {isLoadingMore && <GridSkeleton count={3} type="community" />}
            </div>

            {filteredCommunities.length > visibleCount && (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  disabled={isLoadingMore}
                  onClick={() => {
                    setIsLoadingMore(true)
                    setTimeout(() => {
                      setVisibleCount(prev => prev + 6)
                      setIsLoadingMore(false)
                    }, 350)
                  }}
                  className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs uppercase tracking-wider rounded-xl border border-slate-200 shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>{isLoadingMore ? 'Memuat Komunitas...' : 'Muat Lebih Banyak Komunitas'}</span>
                  <span className="text-[10px] text-slate-400 font-mono">({Math.min(visibleCount, filteredCommunities.length)} / {filteredCommunities.length})</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── CREATE COMMUNITY MODAL ────────────────────────────────────────── */}
      <AnimatePresence>
        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 max-h-[90vh] overflow-y-auto ${
                modalStep === 'PAYMENT' ? 'max-w-3xl p-6 md:p-8 space-y-6' : modalStep === 'SUCCESS' ? 'max-w-lg p-6 md:p-8 space-y-6 bg-gradient-to-b from-[#E8F8EE]/70 via-white to-gray-50' : 'max-w-2xl p-6 md:p-8 space-y-6'
              }`}
            >
              {requiresKycToCreate ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-black/5 pb-3">
                    <h3 className="font-sora text-sm font-bold text-[#111111] uppercase tracking-wider">
                      Daftarkan Komunitas Induk Baru
                    </h3>
                    <button onClick={() => { setCreateModalOpen(false); setModalStep('FORM') }} className="text-text-secondary hover:text-[#111111] text-sm font-bold">✕</button>
                  </div>
                  <div className="p-6 border border-amber-500/20 bg-amber-500/5 rounded-2xl space-y-4 text-center">
                    <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
                    <h4 className="font-sora font-bold text-[#111111] text-sm">Verifikasi KYC Diperlukan</h4>
                    <p className="text-xs text-text-secondary max-w-md mx-auto leading-relaxed">
                      Sesuai dengan regulasi platform, hanya pengguna yang telah lulus verifikasi KYC (Know Your Customer) yang dapat bertindak sebagai Ketua Komunitas dan mendaftarkan Komunitas Induk baru.
                    </p>
                    <div className="pt-2">
                      <Link
                        href={user ? `/profile/${user.id}` : '/auth?tab=register'}
                        className="inline-block px-5 py-2.5 bg-primary text-white font-geist font-bold text-xs uppercase tracking-wider rounded-xl shadow"
                      >
                        Lengkapi KYC di Profil
                      </Link>
                    </div>
                  </div>
                </div>
              ) : modalStep === 'FORM' ? (
                // ── STEP 1: FORM ISIAN ──
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-black/5 pb-3">
                    <h3 className="font-sora text-sm font-bold text-[#111111] uppercase tracking-wider">
                      Daftarkan Komunitas Induk Baru
                    </h3>
                    <button onClick={() => { setCreateModalOpen(false); setModalStep('FORM') }} className="text-text-secondary hover:text-[#111111] text-sm font-bold">✕</button>
                  </div>

                  <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
                    {formError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-500 font-semibold">{formError}</div>
                    )}

                    {/* BAGIAN 1: INFO DASAR */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 border-b border-black/5 pb-1.5">
                        <span className="w-2 h-2 rounded-full bg-primary"></span>
                        <h4 className="text-[10px] font-extrabold text-primary uppercase tracking-wider">Informasi Dasar Komunitas</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Nama Komunitas <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Asosiasi Kuliner Kreatif Jogja"
                            className="w-full h-9 px-3 bg-[#F5F7F9] border border-black/10 rounded-lg text-xs text-[#111111] focus:outline-none focus:border-primary/50 transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Jenis Komunitas <span className="text-red-500">*</span></label>
                          <select
                            value={type}
                            onChange={(e) => setType(e.target.value as any)}
                            className="w-full h-9 px-3 bg-[#F5F7F9] border border-black/10 rounded-lg text-xs font-bold text-[#111111] focus:outline-none focus:border-primary/50 transition-all"
                          >
                            <option value="PERKUMPULAN">Perkumpulan (Reguler & Premium)</option>
                            <option value="KOPERASI">Koperasi (Paket Berlangganan)</option>
                          </select>
                          {type === 'PERKUMPULAN' ? (
                            <p className="text-[9px] text-[#007A3D] font-bold mt-1 flex items-center gap-1">
                              ✓ Perkumpulan tersedia opsi Gratis (Reguler) atau Premium (Biaya Aktivasi Rp200.000 1x).
                            </p>
                          ) : (
                            <p className="text-[9px] text-amber-700 font-bold mt-1 flex items-center gap-1">
                              ⚡ Komunitas Koperasi memerlukan pilihan paket fitur berlangganan.
                            </p>
                          )}
                        </div>
                      </div>

                      {type === 'PERKUMPULAN' && (
                        <div className="space-y-2 pt-2 border-t border-black/5">
                          <label className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Pilih Tier Perkumpulan <span className="text-red-500">*</span></label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Card REGULER */}
                            <div 
                              onClick={() => setPerkumpulanTier('REGULER')}
                              className={`p-3.5 rounded-2xl border-2 flex flex-col justify-between cursor-pointer transition-all ${
                                perkumpulanTier === 'REGULER' 
                                  ? 'bg-emerald-50/30 border-primary shadow-sm ring-2 ring-primary/20' 
                                  : 'bg-white border-black/5 hover:border-black/15'
                              }`}
                            >
                              <div className="space-y-2">
                                <div className="flex items-start justify-between gap-1">
                                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                                    perkumpulanTier === 'REGULER' ? 'border-primary' : 'border-gray-300'
                                  }`}>
                                    {perkumpulanTier === 'REGULER' && <div className="w-2 h-2 rounded-full bg-primary" />}
                                  </div>
                                  <div className="text-right">
                                    <h5 className="font-black text-xs text-[#0F5132] font-sora">PERKUMPULAN REGULER</h5>
                                    <span className="text-[10px] text-primary font-extrabold block mt-0.5">Rp 0 (Selamanya Gratis)</span>
                                  </div>
                                </div>
                                <div className="space-y-1 text-left pt-2 border-t border-gray-100 text-[9px] font-semibold text-gray-600">
                                  <div>✓ Direktori & Forum Diskusi Komunitas</div>
                                  <div>✓ Katalog Produk & Event Komunitas</div>
                                </div>
                              </div>
                            </div>

                            {/* Card PREMIUM */}
                            <div 
                              onClick={() => setPerkumpulanTier('PREMIUM')}
                              className={`p-3.5 rounded-2xl border-2 flex flex-col justify-between cursor-pointer transition-all ${
                                perkumpulanTier === 'PREMIUM' 
                                  ? 'bg-purple-50/30 border-purple-500 shadow-sm ring-2 ring-purple-500/20' 
                                  : 'bg-white border-black/5 hover:border-black/15'
                              }`}
                            >
                              <div className="space-y-2">
                                <div className="flex items-start justify-between gap-1">
                                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                                    perkumpulanTier === 'PREMIUM' ? 'border-purple-500' : 'border-gray-300'
                                  }`}>
                                    {perkumpulanTier === 'PREMIUM' && <div className="w-2 h-2 rounded-full bg-purple-500" />}
                                  </div>
                                  <div className="text-right">
                                    <h5 className="font-black text-xs text-purple-800 font-sora flex items-center justify-end gap-1">
                                      <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0 inline-block" /> PERKUMPULAN PREMIUM
                                    </h5>
                                    <span className="text-[10px] text-purple-600 font-extrabold block mt-0.5">Rp 200.000 <span className="text-[8px] font-normal text-gray-500">(Aktivasi 1x)</span></span>
                                  </div>
                                </div>
                                <div className="space-y-1 text-left pt-2 border-t border-gray-100 text-[9px] font-bold text-purple-900">
                                  <div>✓ Modul Membership Anggota Berbayar (Set Sendiri)</div>
                                  <div>✓ Pengaturan Merchandise & Voucher Eksklusif</div>
                                  <div>✓ Fitur Referral Multi-Tier (3-5 Tier)</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Deskripsi Komunitas <span className="text-red-500">*</span></label>
                        <textarea
                          required
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Jelaskan visi misi, cakupan anggota merchant, dan target pasar komunitas bisnis Anda..."
                          rows={3}
                          className="w-full px-3 py-2 bg-[#F5F7F9] border border-black/10 rounded-lg text-xs text-[#111111] focus:outline-none focus:border-primary/50 resize-none transition-all"
                        />
                      </div>

                      {/* BAGIAN 1B: TEMPLATE HALAMAN */}
                      <div className="space-y-3 pt-1 border-t border-black/5">
                        <div className="flex items-center gap-2 border-b border-black/5 pb-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#006E24]"></span>
                          <h4 className="text-[10px] font-extrabold text-[#006E24] uppercase tracking-wider font-sora">Template Halaman</h4>
                        </div>
                        
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Pilih Template Halaman</label>
                          <select
                            value={templateType}
                            onChange={(e) => setTemplateType(e.target.value as any)}
                            className="w-full h-9 px-3 bg-[#F5F7F9] border border-black/10 rounded-lg text-xs font-bold text-[#111111] focus:outline-none focus:border-primary/50 transition-all cursor-pointer"
                          >
                            <option value="Community">▼ Community</option>
                            <option value="Business">▼ Business</option>
                            <option value="Education">▼ Education</option>
                            <option value="Culinary">▼ Culinary</option>
                            <option value="Koperasi">▼ Koperasi</option>
                          </select>
                        </div>

                        <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center justify-between gap-3 mt-2">
                          <div>
                            <label className="text-[10px] font-black text-emerald-950 uppercase tracking-wider block">
                              Modul Bawaan
                            </label>
                            <div className="flex flex-wrap gap-x-2.5 gap-y-1 text-[9px] text-[#006E24] font-bold mt-1">
                              <span>✓ Hero Banner</span>
                              <span>✓ Aktivitas</span>
                              <span>✓ Diskusi</span>
                              <span>✓ Event</span>
                              <span>✓ Produk Anggota</span>
                              <span>✓ Galeri</span>
                              <span>✓ Anggota</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="px-2.5 py-1.5 border border-primary text-primary hover:bg-primary/5 text-[9px] font-extrabold rounded-lg flex items-center gap-1 transition-all cursor-pointer bg-white"
                          >
                            <span>⚙️</span> Sesuaikan Modul
                          </button>
                        </div>
                      </div>

                    </div>

                    {/* BAGIAN 2: LEGALITAS */}
                    <div className="space-y-3 pt-1 border-t border-black/5">
                      <div className="flex items-center gap-2 border-b border-black/5 pb-1.5">
                        <span className="w-2 h-2 rounded-full bg-primary"></span>
                        <h4 className="text-[10px] font-extrabold text-primary uppercase tracking-wider">Legalitas Organisasi</h4>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Akta Notaris <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            required
                            value={aktaNotaris}
                            onChange={(e) => setAktaNotaris(e.target.value)}
                            placeholder="No. Akta Notaris"
                            className="w-full h-9 px-2.5 bg-[#F5F7F9] border border-black/10 rounded-lg text-xs text-[#111111] focus:outline-none focus:border-primary/50 transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Nomor AHU <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            required
                            value={nomorAhu}
                            onChange={(e) => setNomorAhu(e.target.value)}
                            placeholder="AHU-xxxxx"
                            className="w-full h-9 px-2.5 bg-[#F5F7F9] border border-black/10 rounded-lg text-xs text-[#111111] focus:outline-none focus:border-primary/50 transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">NPWP Organisasi <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            required
                            value={nomorNpwp}
                            onChange={(e) => setNomorNpwp(e.target.value)}
                            placeholder="xx.xxx.xxx.x-xxx.xxx"
                            className="w-full h-9 px-2.5 bg-[#F5F7F9] border border-black/10 rounded-lg text-xs text-[#111111] focus:outline-none focus:border-primary/50 transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Domisili <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            required
                            value={domisili}
                            onChange={(e) => setDomisili(e.target.value)}
                            placeholder="Kota / Kabupaten"
                            className="w-full h-9 px-2.5 bg-[#F5F7F9] border border-black/10 rounded-lg text-xs text-[#111111] focus:outline-none focus:border-primary/50 transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* BAGIAN 3: FINANSIAL KOPERASI & PAKET */}
                    {type === 'KOPERASI' && (
                      <div className="space-y-3 pt-1 border-t border-black/5">
                        <div className="flex items-center gap-2 border-b border-black/5 pb-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          <h4 className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider">Pengaturan Finansial Koperasi</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Simpanan Pokok / Biaya Masuk (Rp) <span className="text-red-500">*</span></label>
                            <input
                              type="number"
                              required
                              value={joinFee}
                              onChange={(e) => setJoinFee(e.target.value)}
                              placeholder="e.g. 150000"
                              className="w-full h-9 px-3 bg-[#F5F7F9] border border-black/10 rounded-lg text-xs text-[#111111] focus:outline-none focus:border-primary/50 transition-all"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Iuran Wajib Bulanan (Rp) <span className="text-red-500">*</span></label>
                            <input
                              type="number"
                              required
                              value={monthlyFee}
                              onChange={(e) => setMonthlyFee(e.target.value)}
                              placeholder="e.g. 50000"
                              className="w-full h-9 px-3 bg-[#F5F7F9] border border-black/10 rounded-lg text-xs text-[#111111] focus:outline-none focus:border-primary/50 transition-all"
                            />
                          </div>
                        </div>

                        {/* KONFIGURASI FITUR KOPERASI */}
                        <div className="space-y-3 pt-3 border-t border-black/5">
                          <div className="flex items-center gap-2 border-b border-black/5 pb-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#007A3D]"></span>
                            <h4 className="text-[10px] font-extrabold text-[#007A3D] uppercase tracking-wider">Pilih Paket Langganan Koperasi</h4>
                          </div>
                          <p className="text-[9px] text-gray-500 font-semibold">Pilih salah satu paket langganan yang sesuai dengan kebutuhan komunitas Anda.</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-stretch">
                            {/* Card 1: 🟢 BASIC */}
                            <div 
                              onClick={() => setCoopTier('BASIC')}
                              className={`p-4 rounded-2xl border-2 flex flex-col justify-between cursor-pointer transition-all ${
                                coopTier === 'BASIC' 
                                  ? 'bg-emerald-50/30 border-primary shadow-sm ring-2 ring-primary/20' 
                                  : 'bg-white border-black/5 hover:border-black/15 hover:shadow-xs'
                              }`}
                            >
                              <div className="space-y-3 flex-1 flex flex-col justify-between">
                                <div className="space-y-2">
                                  <div className="flex items-start justify-between gap-1">
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                                      coopTier === 'BASIC' ? 'border-primary' : 'border-gray-300'
                                    }`}>
                                      {coopTier === 'BASIC' && <div className="w-2 h-2 rounded-full bg-primary" />}
                                    </div>
                                    <div className="text-right">
                                      <h5 className="font-black text-xs text-[#0F5132] font-sora flex items-center justify-end gap-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 inline-block" /> BASIC
                                      </h5>
                                      <span className="text-[8px] text-emerald-700/80 font-bold block">Paket Dasar</span>
                                      <span className="text-[10px] text-primary font-extrabold block mt-0.5">Rp 99.000<span className="text-[8px] font-normal text-gray-500">/bln</span></span>
                                      <span className="text-[7px] text-gray-400 font-semibold block">atau Rp 999.000/thn</span>
                                    </div>
                                  </div>

                                  <div className="space-y-1 text-left pt-2 border-t border-gray-100">
                                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-[#0F5132]">
                                      <span className="w-3.5 h-3.5 rounded-full bg-[#E8F8EE] text-primary flex items-center justify-center text-[8px] font-black shrink-0">✓</span>
                                      <span>Simpanan Pokok</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-[#0F5132]">
                                      <span className="w-3.5 h-3.5 rounded-full bg-[#E8F8EE] text-primary flex items-center justify-center text-[8px] font-black shrink-0">✓</span>
                                      <span>Simpanan Wajib</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="pt-3 border-t border-emerald-100/60 mt-3">
                                <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-1">
                                  <span className="flex items-center gap-1 text-[9px] font-bold text-amber-900 shrink-0 whitespace-nowrap">
                                    <Gift className="w-3 h-3 text-amber-500 shrink-0" /> Bonus Aktivasi
                                  </span>
                                  <span className="text-[9px] font-black text-amber-700 shrink-0 whitespace-nowrap">
                                    🪙 500 Koin
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Card 2: 🔵 PLUS */}
                            <div 
                              onClick={() => setCoopTier('PLUS')}
                              className={`p-4 rounded-2xl border-2 flex flex-col justify-between cursor-pointer transition-all ${
                                coopTier === 'PLUS' 
                                  ? 'bg-blue-50/30 border-blue-500 shadow-sm ring-2 ring-blue-500/20' 
                                  : 'bg-white border-black/5 hover:border-black/15 hover:shadow-xs'
                              }`}
                            >
                              <div className="space-y-3 flex-1 flex flex-col justify-between">
                                <div className="space-y-2">
                                  <div className="flex items-start justify-between gap-1">
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                                      coopTier === 'PLUS' ? 'border-blue-500' : 'border-gray-300'
                                    }`}>
                                      {coopTier === 'PLUS' && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                                    </div>
                                    <div className="text-right">
                                      <h5 className="font-black text-xs text-blue-800 font-sora flex items-center justify-end gap-1">
                                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 inline-block" /> PLUS
                                      </h5>
                                      <span className="text-[8px] text-blue-600/80 font-bold block">Paket Pengembangan</span>
                                      <span className="text-[10px] text-blue-600 font-extrabold block mt-0.5">Rp 199.000<span className="text-[8px] font-normal text-gray-500">/bln</span></span>
                                      <span className="text-[7px] text-gray-400 font-semibold block">atau Rp 1.999.000/thn</span>
                                    </div>
                                  </div>

                                  <div className="space-y-1 text-left pt-2 border-t border-gray-100">
                                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-blue-800">
                                      <span className="w-3.5 h-3.5 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-[8px] font-black shrink-0">✓</span>
                                      <span>Simpanan Pokok</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-blue-800">
                                      <span className="w-3.5 h-3.5 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-[8px] font-black shrink-0">✓</span>
                                      <span>Simpanan Wajib</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-blue-800">
                                      <span className="w-3.5 h-3.5 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-[8px] font-black shrink-0">✓</span>
                                      <span>Simpanan Sukarela</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="pt-3 border-t border-blue-100/60 mt-3">
                                <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-1">
                                  <span className="flex items-center gap-1 text-[9px] font-bold text-amber-900 shrink-0 whitespace-nowrap">
                                    <Gift className="w-3 h-3 text-amber-500 shrink-0" /> Bonus Aktivasi
                                  </span>
                                  <span className="text-[9px] font-black text-amber-700 shrink-0 whitespace-nowrap">
                                    🪙 1.500 Koin
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Card 3: 🟣 PRO */}
                            <div 
                              onClick={() => setCoopTier('PRO')}
                              className={`p-4 rounded-2xl border-2 flex flex-col justify-between cursor-pointer transition-all ${
                                coopTier === 'PRO' 
                                  ? 'bg-purple-50/30 border-purple-500 shadow-sm ring-2 ring-purple-500/20' 
                                  : 'bg-white border-black/5 hover:border-black/15 hover:shadow-xs'
                              }`}
                            >
                              <div className="space-y-3 flex-1 flex flex-col justify-between">
                                <div className="space-y-2">
                                  <div className="flex items-start justify-between gap-1">
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                                      coopTier === 'PRO' ? 'border-purple-500' : 'border-gray-300'
                                    }`}>
                                      {coopTier === 'PRO' && <div className="w-2 h-2 rounded-full bg-purple-500" />}
                                    </div>
                                    <div className="text-right">
                                      <h5 className="font-black text-xs text-purple-800 font-sora flex items-center justify-end gap-1">
                                        <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0 inline-block" /> PRO
                                      </h5>
                                      <span className="text-[8px] text-purple-600/80 font-bold block">Paket Profesional</span>
                                      <span className="text-[10px] text-purple-600 font-extrabold block mt-0.5">Rp 399.000<span className="text-[8px] font-normal text-gray-500">/bln</span></span>
                                      <span className="text-[7px] text-gray-400 font-semibold block">atau Rp 3.999.000/thn</span>
                                    </div>
                                  </div>

                                  <div className="space-y-1 text-left pt-2 border-t border-gray-100">
                                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-purple-800">
                                      <span className="w-3.5 h-3.5 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center text-[8px] font-black shrink-0">✓</span>
                                      <span>Simpanan Pokok</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-purple-800">
                                      <span className="w-3.5 h-3.5 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center text-[8px] font-black shrink-0">✓</span>
                                      <span>Simpanan Wajib</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-purple-800">
                                      <span className="w-3.5 h-3.5 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center text-[8px] font-black shrink-0">✓</span>
                                      <span>Simpanan Sukarela</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-purple-800">
                                      <span className="w-3.5 h-3.5 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center text-[8px] font-black shrink-0">✓</span>
                                      <span>Pendanaan Merchant</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="pt-3 border-t border-purple-100/60 mt-3">
                                <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-1">
                                  <span className="flex items-center gap-1 text-[9px] font-bold text-amber-900 shrink-0 whitespace-nowrap">
                                    <Gift className="w-3 h-3 text-amber-500 shrink-0" /> Bonus Aktivasi
                                  </span>
                                  <span className="text-[9px] font-black text-amber-700 shrink-0 whitespace-nowrap">
                                    🪙 3.000 Koin
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <p className="text-[9px] text-gray-500 font-medium italic text-center pt-2 leading-relaxed">
                            Bonus koin diberikan satu kali saat aktivasi paket dan dapat ditukarkan menjadi voucher pendanaan sesuai syarat dan ketentuan yang berlaku.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* BAGIAN 4: KONTAK & MEDIA */}
                    <div className="space-y-3 pt-1 border-t border-black/5">
                      <div className="flex items-center gap-2 border-b border-black/5 pb-1.5">
                        <span className="w-2 h-2 rounded-full bg-primary"></span>
                        <h4 className="text-[10px] font-extrabold text-primary uppercase tracking-wider">Media, Kontak & Tautan Diskusi</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">No. Kontak Penanggung Jawab <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            required
                            value={kontakPj}
                            onChange={(e) => setKontakPj(e.target.value)}
                            placeholder="e.g. 081234567890"
                            className="w-full h-9 px-3 bg-[#F5F7F9] border border-black/10 rounded-lg text-xs text-[#111111] focus:outline-none focus:border-primary/50 transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Tautan Grup WhatsApp Diskusi</label>
                          <input
                            type="text"
                            value={waGroupLink}
                            onChange={(e) => setWaGroupLink(e.target.value)}
                            placeholder="e.g. https://chat.whatsapp.com/..."
                            className="w-full h-9 px-3 bg-[#F5F7F9] border border-black/10 rounded-lg text-xs text-[#111111] focus:outline-none focus:border-primary/50 transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {/* Avatar Upload */}
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Logo Komunitas / Avatar</label>
                          {avatarUrl ? (
                            <div className="relative border border-black/10 rounded-lg bg-[#F5F7F9] p-1.5 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <img src={avatarUrl} alt="Logo Preview" className="w-9 h-9 object-cover rounded-lg" />
                                <span className="text-[10px] font-medium text-[#111111] truncate max-w-[100px]">Logo Terpilih</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setAvatarUrl('')}
                                className="p-1 bg-black/5 hover:bg-black/10 text-neutral-600 rounded-full transition-colors cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <label className="border border-dashed border-black/15 hover:border-primary/45 rounded-lg h-12 flex items-center justify-center cursor-pointer bg-[#F5F7F9]/50 hover:bg-[#F5F7F9] transition-all p-3 group">
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

                        {/* Cover Upload */}
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-text-secondary uppercase tracking-wider block">Banner Sampul / Cover</label>
                          {coverUrl ? (
                            <div className="relative border border-black/10 rounded-lg bg-[#F5F7F9] p-1.5 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <img src={coverUrl} alt="Cover Preview" className="w-9 h-9 object-cover rounded-lg" />
                                <span className="text-[10px] font-medium text-[#111111] truncate max-w-[100px]">Banner Terpilih</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setCoverUrl('')}
                                className="p-1 bg-black/5 hover:bg-black/10 text-neutral-600 rounded-full transition-colors cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <label className="border border-dashed border-black/15 hover:border-primary/45 rounded-lg h-12 flex items-center justify-center cursor-pointer bg-[#F5F7F9]/50 hover:bg-[#F5F7F9] transition-all p-3 group">
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
                    </div>

                    {/* BAGIAN 5: PENGATURAN KYC ANGGOTA */}
                    <div className="p-3.5 bg-[#E8F8EE] border border-primary/25 rounded-xl flex items-center justify-between gap-3">
                      <div>
                        <label className="text-xs font-extrabold text-[#0F5132] block font-sora">
                          Wajibkan Verifikasi KYC Anggota
                        </label>
                        <p className="text-[10px] text-emerald-800/80 font-medium mt-0.5 leading-relaxed">
                          Jika diaktifkan, calon anggota harus lulus verifikasi KYC (KTP/Selfie) sebelum dapat bergabung.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsKycRequired(!isKycRequired)}
                        className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 shrink-0 ${
                          isKycRequired ? 'bg-primary justify-end' : 'bg-gray-300 justify-start'
                        }`}
                      >
                        <span className="bg-white w-4 h-4 rounded-full shadow-xs transition-all" />
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => {
                        setFormError(null)
                        if (!name || !description) {
                          setFormError('Nama dan Deskripsi komunitas wajib diisi.')
                          return
                        }
                        if (!aktaNotaris || !nomorAhu || !nomorNpwp || !domisili) {
                          setFormError('Legalitas organisasi (Akta Notaris, AHU, NPWP, Domisili) wajib diisi.')
                          return
                        }
                        if (!kontakPj) {
                          setFormError('No. Kontak Penanggung Jawab wajib diisi.')
                          return
                        }

                        if (type === 'KOPERASI' || (type === 'PERKUMPULAN' && perkumpulanTier === 'PREMIUM')) {
                          if (type === 'KOPERASI' && (!joinFee || !monthlyFee)) {
                            setFormError('Biaya simpanan pokok dan iuran wajib koperasi wajib diisi.')
                            return
                          }
                          setModalStep('PAYMENT')
                        } else {
                          handleCreateCommunity()
                        }
                      }}
                      className="w-full py-3 bg-[#007A3D] hover:bg-[#006030] text-white font-geist font-bold text-xs uppercase tracking-wider rounded-xl hover:opacity-95 transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {type === 'KOPERASI' || (type === 'PERKUMPULAN' && perkumpulanTier === 'PREMIUM') ? (
                        <>Lanjut ke Pembayaran Paket →</>
                      ) : (
                        <>{isPending ? 'Mendaftarkan Komunitas...' : 'Daftarkan Komunitas (Gratis)'}</>
                      )}
                    </button>
                  </form>
                </div>
              ) : modalStep === 'PAYMENT' ? (
                // ── STEP 2: PEMBAYARAN PAKET (FOTO 1 UI) ──
                <div className="space-y-6">
                  {/* Top Navigation */}
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <button
                      type="button"
                      onClick={() => setModalStep('FORM')}
                      className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" /> Kembali
                    </button>
                    <button onClick={() => { setCreateModalOpen(false); setModalStep('FORM') }} className="text-gray-400 hover:text-gray-700 text-sm font-bold">✕</button>
                  </div>

                  <div>
                    <h2 className="text-xl font-black text-slate-900 font-sora">Pembayaran Aktivasi Komunitas</h2>
                    <p className="text-xs text-slate-500 font-medium mt-1">Selesaikan pembayaran untuk mengaktifkan komunitas Anda di platform Saloka.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    {/* Ringkasan Pesanan Card */}
                    <div className="border border-slate-200/80 rounded-2xl bg-white p-5 shadow-xs space-y-4">
                      <h3 className="font-sora text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Ringkasan Pesanan</h3>
                      
                      <div className="space-y-2.5 text-xs">
                        <div className="flex justify-between items-start">
                          <span className="text-slate-500 font-medium">Nama Komunitas</span>
                          <span className="font-bold text-slate-900 text-right max-w-[160px] truncate">{name || 'Komunitas Bisnis Saloka'}</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium">Paket Komunitas</span>
                          <span className="font-bold text-slate-900">
                            {type === 'PERKUMPULAN' ? 'Perkumpulan Premium' : `Koperasi ${coopTier}`}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium">Jenis Pembayaran</span>
                          <span className="font-bold text-slate-900">
                            {type === 'PERKUMPULAN' ? 'Biaya Aktivasi (Satu Kali)' : 'Berlangganan (1 Bulan)'}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium">Biaya Aktivasi Saloka</span>
                          <span className="font-bold text-slate-900">Rp{getTierPrice(coopTier).toLocaleString('id-ID')}</span>
                        </div>

                        {type === 'KOPERASI' && (
                          <div className="flex justify-between items-center pt-1">
                            <span className="text-[#007A3D] font-extrabold flex items-center gap-1">Bonus Aktivasi</span>
                            <span className="font-black text-[#007A3D] flex items-center gap-1.5">
                              🪙 {getTierCoins(coopTier)} Koin
                            </span>
                          </div>
                        )}

                        <div className="border-t border-slate-100 pt-2 flex justify-between items-center">
                          <span className="text-slate-500 font-medium">Subtotal</span>
                          <span className="font-bold text-slate-900">Rp{getTierPrice(coopTier).toLocaleString('id-ID')}</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium">Biaya Layanan</span>
                          <span className="font-bold text-slate-900">Rp2.500</span>
                        </div>

                        <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                          <span className="font-extrabold text-slate-900 text-sm">Total Bayar</span>
                          <span className="text-lg font-black text-[#007A3D]">Rp{(getTierPrice(coopTier) + 2500).toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Pilih Metode Pembayaran Card */}
                    <div className="border border-slate-200/80 rounded-2xl bg-white p-5 shadow-xs space-y-4">
                      <h3 className="font-sora text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Pilih Metode Pembayaran</h3>

                      <div className="space-y-3">
                        {/* QRIS */}
                        <div
                          onClick={() => setSelectedPaymentMethod('qris')}
                          className={`p-3.5 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                            selectedPaymentMethod === 'qris'
                              ? 'bg-emerald-50/20 border-[#007A3D]'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              selectedPaymentMethod === 'qris' ? 'border-[#007A3D]' : 'border-slate-300'
                            }`}>
                              {selectedPaymentMethod === 'qris' && <div className="w-2.5 h-2.5 rounded-full bg-[#007A3D]" />}
                            </div>
                            <div>
                              <h4 className="font-bold text-xs text-slate-900">QRIS</h4>
                              <p className="text-[10px] text-slate-500 font-medium">Bayar dengan QRIS semua bank</p>
                            </div>
                          </div>
                          <QrCode className="w-6 h-6 text-slate-700" />
                        </div>

                        {/* Virtual Account */}
                        <div
                          onClick={() => setSelectedPaymentMethod('va')}
                          className={`p-3.5 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                            selectedPaymentMethod === 'va'
                              ? 'bg-emerald-50/20 border-[#007A3D]'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              selectedPaymentMethod === 'va' ? 'border-[#007A3D]' : 'border-slate-300'
                            }`}>
                              {selectedPaymentMethod === 'va' && <div className="w-2.5 h-2.5 rounded-full bg-[#007A3D]" />}
                            </div>
                            <div>
                              <h4 className="font-bold text-xs text-slate-900">Virtual Account</h4>
                              <p className="text-[10px] text-slate-500 font-medium">Transfer ke virtual account</p>
                            </div>
                          </div>
                          <Landmark className="w-5 h-5 text-slate-500" />
                        </div>

                        {/* E-Wallet */}
                        <div
                          onClick={() => setSelectedPaymentMethod('ewallet')}
                          className={`p-3.5 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                            selectedPaymentMethod === 'ewallet'
                              ? 'bg-emerald-50/20 border-[#007A3D]'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              selectedPaymentMethod === 'ewallet' ? 'border-[#007A3D]' : 'border-slate-300'
                            }`}>
                              {selectedPaymentMethod === 'ewallet' && <div className="w-2.5 h-2.5 rounded-full bg-[#007A3D]" />}
                            </div>
                            <div>
                              <h4 className="font-bold text-xs text-slate-900">E-Wallet</h4>
                              <p className="text-[10px] text-slate-500 font-medium">OVO, GoPay, DANA, LinkAja</p>
                            </div>
                          </div>
                          <Wallet className="w-5 h-5 text-slate-500" />
                        </div>

                        {/* Kartu Kredit / Debit */}
                        <div
                          onClick={() => setSelectedPaymentMethod('credit_card')}
                          className={`p-3.5 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                            selectedPaymentMethod === 'credit_card'
                              ? 'bg-emerald-50/20 border-[#007A3D]'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              selectedPaymentMethod === 'credit_card' ? 'border-[#007A3D]' : 'border-slate-300'
                            }`}>
                              {selectedPaymentMethod === 'credit_card' && <div className="w-2.5 h-2.5 rounded-full bg-[#007A3D]" />}
                            </div>
                            <div>
                              <h4 className="font-bold text-xs text-slate-900">Kartu Kredit / Debit</h4>
                              <p className="text-[10px] text-slate-500 font-medium">Visa, Mastercard, JCB</p>
                            </div>
                          </div>
                          <CreditCard className="w-5 h-5 text-slate-500" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Security & Action Bar */}
                  <div className="p-4 bg-gray-50 border border-gray-200/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#007A3D] flex items-center justify-center shrink-0">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">Transaksi aman dan terenkripsi</h4>
                        <p className="text-[10px] text-slate-500 font-medium">Saloka.id bekerja sama dengan Midtrans untuk keamanan transaksi Anda.</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleCreateCommunity()}
                      className="w-full sm:w-auto px-8 py-3 bg-[#007A3D] hover:bg-[#006030] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Memproses...
                        </>
                      ) : (
                        <>
                          Bayar Sekarang <Lock className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                // ── STEP 3: PEMBAYARAN & PENDAFTARAN BERHASIL (PENDING VERIFIKASI) ──
                <div className="space-y-6 text-center">
                  <div className="relative pt-2">
                    <div className="w-16 h-16 rounded-full bg-amber-500 text-white flex items-center justify-center mx-auto shadow-md ring-8 ring-amber-100">
                      <Clock className="w-9 h-9 stroke-[2.5]" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="inline-block px-3 py-1 bg-amber-100 text-amber-900 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                      Status: PENDING VERIFIKASI
                    </span>
                    <h2 className="text-2xl font-black text-slate-900 font-sora">Pendaftaran Berhasil!</h2>
                    <p className="text-xs text-slate-600 font-medium max-w-sm mx-auto leading-relaxed">
                      Terima kasih! Komunitas Anda telah terdaftar dan saat ini sedang menanti verifikasi legalitas oleh Super Admin Saloka.
                    </p>
                  </div>

                  {/* Detail Pendaftaran Card */}
                  <div className="border border-slate-200/80 rounded-2xl bg-white p-5 shadow-xs text-left space-y-3 text-xs">
                    <h3 className="font-sora text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">Detail Komunitas</h3>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Nama Komunitas</span>
                        <span className="font-bold text-slate-900">{createdCommunityData?.name || name}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Tipe Komunitas</span>
                        <span className="font-bold text-slate-900">
                          {type === 'PERKUMPULAN'
                            ? perkumpulanTier === 'PREMIUM' ? 'Perkumpulan Premium' : 'Perkumpulan Reguler'
                            : `Koperasi ${coopTier}`}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Status Verifikasi</span>
                        <span className="font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[10px]">
                          ⏳ Pending Verifikasi Super Admin
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Info Box Superadmin Verification */}
                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 text-left space-y-1 shadow-xs">
                    <div className="flex items-center gap-2 font-bold text-xs text-[#0F5132]">
                      <Info className="w-4 h-4 text-primary shrink-0" />
                      <span>Tahap Selanjutnya: Verifikasi Super Admin</span>
                    </div>
                    <p className="text-[11px] text-emerald-900/80 font-medium leading-relaxed pl-6">
                      Komunitas akan otomatis aktif dan tampil di halaman <strong>Direktori Publik</strong> serta dapat diakses anggota umum setelah disetujui oleh Super Admin.
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (createdCommunityData?.id) {
                          router.push(`/community/${createdCommunityData.id}`)
                        } else {
                          setCreateModalOpen(false)
                          setModalStep('FORM')
                          loadData()
                        }
                      }}
                      className="w-full py-3.5 bg-[#007A3D] hover:bg-[#006030] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      Buka Preview Dashboard Komunitas →
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCreateModalOpen(false)
                        setModalStep('FORM')
                        loadData()
                      }}
                      className="text-xs font-bold text-[#007A3D] hover:underline cursor-pointer block mx-auto transition-colors"
                    >
                      Tutup & Kembali ke Direktori
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* KYC WARNING MODAL FOR COMMUNITY CREATION */}
      {kycWarningModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-[999] p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-black/10 shadow-2xl text-center space-y-4 relative">
            <button
              onClick={() => setKycWarningModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
              <Shield className="w-8 h-8" />
            </div>
            <h3 className="font-sora text-lg font-bold text-slate-900">
              Verifikasi KYC Diperlukan
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Superadmin menetapkan verifikasi KYC (KTP & Selfie) wajib untuk pendiri Komunitas Induk. Silakan lengkapi verifikasi KYC Anda terlebih dahulu.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setKycWarningModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors"
              >
                Nanti Saja
              </button>
              <Link
                href="/settings?tab=kyc"
                className="flex-1 py-2.5 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary/95 transition-all text-center flex items-center justify-center gap-1"
              >
                Verifikasi KYC Sekarang
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
