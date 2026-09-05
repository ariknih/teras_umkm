'use client'

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import Image from 'next/image'
import { getIndukCommunities, getUserCommunitiesWithRolesAction, switchActiveIndukCommunityAction } from '@/app/actions/community'
import { getGlobalKycSettingAction } from '@/app/actions/admin'
import { getCurrentUser } from '@/app/actions/auth'
import { motion, AnimatePresence } from 'framer-motion'
import { GridSkeleton } from '@/components/ui/GhostSkeleton'
import { Shield, Users, PlusCircle, Search, ChevronRight, X, Loader2, MoreVertical, Star, Check } from 'lucide-react'
import { goeyToast } from 'goey-toast'

const CreateCommunityModal = dynamic(() => import('./CreateCommunityModal'), {
  loading: () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <Loader2 className="w-8 h-8 text-white animate-spin" />
    </div>
  )
})

// Helper to render real community profile photo/avatar matching the directory
function renderCommunityLogo(commName: string = '', avatarUrl?: string | null) {
  // If community has an avatarUrl (from database/seed/upload), use it directly
  if (avatarUrl && typeof avatarUrl === 'string' && avatarUrl.trim() !== '') {
    return (
      <Image
        src={avatarUrl}
        alt={commName}
        width={112}
        height={112}
        loading="lazy"
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

interface CommunityDirectoryClientProps {
  initialUser: any
  initialCommunities: any[]
  initialMyCommunities: any[]
  initialGlobalKycRequired: boolean
}

export default function CommunityDirectoryClient({
  initialUser,
  initialCommunities,
  initialMyCommunities,
  initialGlobalKycRequired
}: CommunityDirectoryClientProps) {
  const [user, setUser] = useState<any>(initialUser)
  const [communities, setCommunities] = useState<any[]>(initialCommunities)
  const [searchQuery, setSearchQuery] = useState('')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [modalMounted, setModalMounted] = useState(false)
  const [visibleCount, setVisibleCount] = useState(6)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const [globalKycRequired, setGlobalKycRequired] = useState(initialGlobalKycRequired)
  const [kycWarningModalOpen, setKycWarningModalOpen] = useState(false)

  const handleOpenCreateModal = () => {
    const isKycVerified = user && (user.kycStatus === 'VERIFIED' || user.kycStatus === 'APPROVED')
    if (globalKycRequired && !isKycVerified) {
      setKycWarningModalOpen(true)
      return
    }
    setModalMounted(true)
    setCreateModalOpen(true)
  }

  const [myCommunities, setMyCommunities] = useState<any[]>(initialMyCommunities)
  const [allRolesModalOpen, setAllRolesModalOpen] = useState(false)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const [isSwitchingPrimary, setIsSwitchingPrimary] = useState(false)

  const handleSetPrimaryCommunity = async (communityId: string, communityName: string) => {
    setIsSwitchingPrimary(true)
    setOpenDropdownId(null)
    try {
      const res = await switchActiveIndukCommunityAction(communityId) as any
      if (res?.error) {
        goeyToast.error(res.error)
      } else {
        goeyToast.success(`"${communityName}" sekarang menjadi Komunitas Utama Anda! ⭐`)
        setUser((prev: any) => ({ ...prev, indukCommunityId: communityId }))
        setMyCommunities(prev => {
          const updated = prev.map((c: any) => ({
            ...c,
            isPrimary: c.communityId === communityId
          }))
          return [...updated].sort((a: any, b: any) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0))
        })
        loadData(true)
      }
    } catch (err: any) {
      goeyToast.error(err.message || 'Gagal mengubah komunitas utama.')
    } finally {
      setIsSwitchingPrimary(false)
    }
  }

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
    }
  }

  useEffect(() => {
    // Server already rendered fresh data for this request. Write it through to
    // sessionStorage so a later soft-navigation back to this page can still
    // paint instantly, then quietly revalidate in the background.
    try {
      sessionStorage.setItem('cache_communities_directory', JSON.stringify(initialCommunities))
      sessionStorage.setItem('cache_my_communities', JSON.stringify(initialMyCommunities))
      if (initialUser) sessionStorage.setItem('cache_community_user', JSON.stringify(initialUser))
    } catch (_) {}

    loadData(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
                const isPrimary = Boolean(mc.isPrimary || (user?.indukCommunityId && user.indukCommunityId === mc.communityId))

                return (
                  <Link
                    key={mc.communityId}
                    href={`/community/${mc.communityId}`}
                    className={`w-[130px] sm:w-[155px] md:w-[180px] shrink-0 snap-start rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-2xs hover:shadow-md transition-all flex flex-col items-center justify-between text-center group cursor-pointer select-none relative ${
                      isPrimary
                        ? 'bg-gradient-to-b from-emerald-50/90 via-white to-white border-2 border-[#2DB24A] ring-1 ring-[#2DB24A]/30'
                        : 'bg-white border border-gray-200/90 hover:border-[#2DB24A]/60'
                    }`}
                  >
                    {isPrimary && (
                      <span className="absolute top-2.5 right-2.5 px-1.5 py-0.5 rounded-full text-[7px] sm:text-[8px] font-black bg-[#2DB24A] text-white flex items-center gap-0.5 shadow-2xs">
                        <Star className="w-2 h-2 fill-white text-white" />
                        Utama
                      </span>
                    )}

                    {/* Top: Circular Community Logo Avatar */}
                    <div className={`w-14 h-14 sm:w-18 sm:h-18 rounded-full bg-white p-1 flex items-center justify-center overflow-hidden shadow-xs shrink-0 group-hover:scale-105 transition-transform duration-300 ${
                      isPrimary ? 'border-2 border-[#2DB24A] ring-2 ring-[#2DB24A]/20' : 'border border-gray-150'
                    }`}>
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
                        
                        // Strict rule: Exactly 1 primary community
                        const activePrimaryId = user?.indukCommunityId || myCommunities.find((c: any) => c.isPrimary)?.communityId || myCommunities[0]?.communityId
                        const isPrimary = mc.communityId === activePrimaryId

                        return (
                          <div
                            key={mc.communityId}
                            className={`p-4 rounded-2xl flex items-center justify-between gap-3 transition-all relative ${
                              isPrimary
                                ? 'bg-[#E8F8EE] border border-[#2DB24A]'
                                : 'bg-white border border-gray-200/90 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-12 h-12 rounded-full bg-white p-1 flex items-center justify-center shrink-0 shadow-xs overflow-hidden ${
                                isPrimary ? 'border border-[#2DB24A]' : 'border border-gray-150'
                              }`}>
                                {renderCommunityLogo(mc.communityName, effectiveAvatar)}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="font-sora text-xs sm:text-sm font-black text-gray-900 truncate">
                                    {mc.communityName}
                                  </h4>
                                  {isPrimary && (
                                    <span className="shrink-0 px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wide bg-[#2DB24A] text-white flex items-center gap-1 shadow-2xs">
                                      Komunitas Utama
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
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

                            <div className="flex items-center gap-2 shrink-0">
                              <Link
                                href={`/community/${mc.communityId}`}
                                onClick={() => setAllRolesModalOpen(false)}
                                className="px-3.5 py-1.5 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-[11px] rounded-xl shadow-xs transition-colors shrink-0"
                              >
                                Buka
                              </Link>

                              {/* Tombol menu (⋮) di sebelah kanan tombol Buka */}
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setOpenDropdownId(openDropdownId === mc.communityId ? null : mc.communityId)
                                  }}
                                  className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                                    openDropdownId === mc.communityId
                                      ? 'bg-emerald-50 border-[#2DB24A] text-[#0F5132]'
                                      : 'bg-white border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-300'
                                  }`}
                                  title="Menu opsi komunitas"
                                >
                                  <span className="text-base font-bold leading-none select-none">⋮</span>
                                </button>

                                {openDropdownId === mc.communityId && (
                                  <>
                                    {/* Backdrop for click outside */}
                                    <div
                                      className="fixed inset-0 z-40"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setOpenDropdownId(null)
                                      }}
                                    />
                                    <div
                                      className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl shadow-xl border border-gray-150 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {isPrimary ? (
                                        <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50/80 rounded-lg cursor-default select-none">
                                          <Check className="w-3.5 h-3.5 text-[#2DB24A] shrink-0" />
                                          <span>Komunitas Utama</span>
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          disabled={isSwitchingPrimary}
                                          onClick={() => handleSetPrimaryCommunity(mc.communityId, mc.communityName)}
                                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-700 hover:text-[#0F5132] hover:bg-[#E8F8EE] rounded-lg transition-colors cursor-pointer text-left disabled:opacity-50"
                                        >
                                          <span className="text-amber-500 text-sm leading-none">★</span>
                                          <span>Jadikan Komunitas Utama</span>
                                        </button>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
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
        {filteredCommunities.length === 0 ? (
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
                      <Image
                        src={
                          c.coverUrl ||
                          (c.name.toLowerCase().includes('perahu')
                            ? "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fm=webp&fit=crop&w=1200&q=80"
                            : c.name.toLowerCase().includes('koperasi')
                              ? "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fm=webp&fit=crop&w=1200&q=80"
                              : "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fm=webp&fit=crop&w=1200&q=80")
                        }
                        alt={c.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 400px"
                        loading="lazy"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                    </div>

                    {/* Details */}
                    <div className="p-5 flex-grow space-y-3.5">
                      <div className="flex gap-4">
                        {/* Icon */}
                        <div className="w-12 h-12 rounded-xl bg-white border border-primary/20 flex items-center justify-center font-bold text-lg text-primary shadow -mt-10 z-10 shrink-0 overflow-hidden relative">
                          <Image
                            src={
                              c.avatarUrl ||
                              (c.name.toLowerCase().includes('perahu')
                                ? "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fm=webp&w=200&h=200&fit=crop&q=80"
                                : c.name.toLowerCase().includes('koperasi')
                                  ? "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fm=webp&w=200&h=200&fit=crop&q=80"
                                  : "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fm=webp&w=200&h=200&fit=crop&q=80")
                            }
                            alt={c.name}
                            fill
                            sizes="48px"
                            loading="lazy"
                            className="object-cover"
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

      {/* ── CREATE COMMUNITY MODAL (lazy-loaded, mounted after first open) ── */}
      {modalMounted && (
        <CreateCommunityModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          user={user}
          requiresKycToCreate={requiresKycToCreate}
          onCreated={() => loadData()}
        />
      )}

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
