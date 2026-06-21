'use client'

import React, { useState, useEffect } from 'react'
import { goeyToast } from 'goey-toast'
import UserQRCode from '@/components/UserQRCode'
import LandingPageRenderer from '../../components/LandingPageRenderer'
import StorePageViewerClient from '@/app/store/[merchantId]/[pageSlug]/StorePageViewerClient'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  Star, 
  Shield, 
  Zap, 
  MapPin, 
  MessageSquare, 
  Phone, 
  ArrowRight, 
  CheckCircle2, 
  ChevronDown,
  Globe,
  DollarSign,
  Briefcase,
  ExternalLink,
  Copy,
  Check,
  Award,
  TrendingUp,
  Users,
  Store,
  ArrowUpRight,
  Activity,
  Wallet,
  Eye,
  Settings,
  Upload,
  X,
  Loader2,
  Share2
} from 'lucide-react'

const Instagram = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
)

interface User {
  id: string
  name: string
  email?: string
  role: string
  level: number
  xp: number
  membershipLevel: string
  membershipAccess: string
  landingPageTemplate?: string | null
  landingPageConfig?: string | null
  landingPageSetup: boolean
  latitude?: number | null
  longitude?: number | null
  kycStatus?: string | null
  indukCommunityId?: string | null
  indukCommunityName?: string | null
}

interface Product {
  id: string
  title: string
  description: string
  price: number
  category: string
  stock: number
  imageUrl?: string | null
  latitude?: number | null
  longitude?: number | null
}

interface ProfileViewerClientProps {
  user: User
  products: Product[]
  currentUser?: any
  isOwner?: boolean
  wallet?: any
  affiliateStats?: any
  merchantStats?: any
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function getUserBadges(user: { role: string; level: number; xp: number }) {
  const badges: { id: string; label: string; icon: string; color: string; desc: string }[] = []

  // 1. Role Badges
  if (user.role === 'ADMIN') {
    badges.push({
      id: 'super-admin',
      label: '🛡️ Super Admin',
      icon: 'Shield',
      color: 'bg-red-500/10 border-red-500/35 text-red-400',
      desc: 'Administrator utama sistem'
    })
  } else if (user.role === 'MERCHANT') {
    if (user.level >= 5) {
      badges.push({
        id: 'star-merchant',
        label: '⭐ Star Merchant',
        icon: 'Star',
        color: 'bg-amber-500/10 border-amber-500/35 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)]',
        desc: 'Merchant berprestasi tingkat tinggi'
      })
    } else {
      badges.push({
        id: 'premium-seller',
        label: '✨ Premium Seller',
        icon: 'Zap',
        color: 'bg-primary/10 border-primary/35 text-primary',
        desc: 'Merchant resmi terdaftar'
      })
    }
  } else if (user.role === 'AFFILIATE') {
    if (user.level >= 3) {
      badges.push({
        id: 'affiliate-leader',
        label: '🏆 Affiliate Leader',
        icon: 'Award',
        color: 'bg-purple-500/10 border-purple-500/35 text-purple-400',
        desc: 'Promotor teratas program kemitraan'
      })
    } else {
      badges.push({
        id: 'mitra-afiliasi',
        label: '🤝 Mitra Afiliasi',
        icon: 'User',
        color: 'bg-blue-500/10 border-blue-500/35 text-blue-400',
        desc: 'Mitra afiliasi resmi'
      })
    }
  }

  // 2. Learning & Contribution Badges
  if (user.xp >= 1000) {
    badges.push({
      id: 'academy-graduate',
      label: '🎓 Academy Graduate',
      icon: 'BookOpen',
      color: 'bg-emerald-500/10 border-emerald-500/35 text-emerald-400',
      desc: 'Sertifikasi lulusan LMS Academy'
    })
  } else if (user.xp >= 300) {
    badges.push({
      id: 'top-contributor',
      label: '💡 Top Contributor',
      icon: 'Flame',
      color: 'bg-orange-500/10 border-orange-500/35 text-orange-400',
      desc: 'Kontributor berbagi ilmu aktif'
    })
  }

  // 3. Level Badges
  if (user.level > 1) {
    badges.push({
      id: 'level-badge',
      label: `⚡ Level ${user.level}`,
      icon: 'Zap',
      color: 'bg-sky-500/10 border-sky-500/35 text-sky-400',
      desc: 'Tingkat kemajuan platform'
    })
  }

  return badges
}

export default function ProfileViewerClient({
  user,
  products,
  currentUser,
  isOwner = false,
  wallet,
  affiliateStats,
  merchantStats,
}: ProfileViewerClientProps) {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'products' | 'storefront'>('profile')
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedProductId, setCopiedProductId] = useState<string | null>(null)

  // KYC Didit state
  const [kycStarting, setKycStarting] = useState(false)

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const c = { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
          setCoords(c)
          if (user.latitude && user.longitude) {
            setDistance(getDistance(c.latitude, c.longitude, user.latitude, user.longitude))
          }
        },
        () => {},
        { enableHighAccuracy: true }
      )
    }
  }, [user])

  const config = user.landingPageConfig ? JSON.parse(user.landingPageConfig) : {}
  const activeTemplate = user.landingPageTemplate || 'modern-gold'
  const logoUrl = config.logoUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&q=80"

  // Find custom page builder main page if it exists
  const customMainPage = React.useMemo(() => {
    if (config && config.pages && Array.isArray(config.pages)) {
      return config.pages.find((p: any) => p.id === 'page-main' || p.slug === '' || p.slug === 'main')
    }
    return null
  }, [config])

  // Resolve components for product showcase inside page builder
  const resolvedComponents = React.useMemo(() => {
    if (!customMainPage || !customMainPage.builderComponents) return []
    return customMainPage.builderComponents.map((comp: any) => {
      if (comp.type === 'product_showcase') {
        const ids: string[] = comp.content.productIds || []
        const resolved = products.filter((p) => ids.includes(p.id))
        return {
          ...comp,
          content: {
            ...comp.content,
            _resolvedProducts: resolved.map(p => ({
              id: p.id,
              title: p.title,
              description: p.description,
              price: p.price,
              category: p.category,
              stock: p.stock,
              imageUrl: p.imageUrl
            }))
          }
        }
      }
      return comp
    })
  }, [customMainPage, products])

  const badges = React.useMemo(() => getUserBadges(user), [user])

  const handleCopyCode = () => {
    navigator.clipboard.writeText(user.email || user.id)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleCopyLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
    const link = `${origin}/auth?ref=${user.email || user.id}`
    navigator.clipboard.writeText(link)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const renderStorefrontPreview = () => {
    if (customMainPage && resolvedComponents.length > 0) {
      return (
        <StorePageViewerClient
          pageName={customMainPage.name || 'Halaman Utama'}
          components={resolvedComponents}
          user={{
            id: user.id,
            name: user.name,
            role: user.role,
          }}
        />
      )
    }

    if (['template1', 'template2', 'template3', 'template4', 'template5', 'brutalist'].includes(activeTemplate)) {
      return (
        <LandingPageRenderer
          templateId={activeTemplate}
          user={user}
          config={config}
          products={products}
          distance={distance}
          badges={badges}
        />
      )
    }

    if (activeTemplate === 'swiss-minimalist' || activeTemplate === 'de-stijl') {
      return <NeoBrutalistTemplate user={user} products={products} config={config} logoUrl={logoUrl} distance={distance} badges={badges} />
    }

    if (activeTemplate === 'minimal-noir' || activeTemplate === 'cyberpunk-dark' || activeTemplate === 'retro-synthwave' || activeTemplate === 'hpc-tech') {
      return <MinimalNoirTemplate user={user} products={products} config={config} logoUrl={logoUrl} distance={distance} badges={badges} />
    }

    if (activeTemplate === 'clean-professional' || activeTemplate === 'alabaster-glass' || activeTemplate === 'studio') {
      return <CleanProfessionalTemplate user={user} products={products} config={config} logoUrl={logoUrl} distance={distance} badges={badges} />
    }

    return <ModernGoldTemplate user={user} products={products} config={config} logoUrl={logoUrl} distance={distance} badges={badges} />
  }

  if (activeTab === 'storefront') {
    return (
      <div className="relative">
        {/* Floating Toggle Banner to return to Profile */}
        <div className="bg-surface-dark border-b border-border-subtle px-6 py-3 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-text-primary">
              Pratinjau Desain Landing Page
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-geist font-bold bg-primary/25 border border-primary/30 text-primary uppercase">
              {customMainPage ? 'Page Builder' : activeTemplate}
            </span>
          </div>
          <button
            onClick={() => setActiveTab('profile')}
            className="px-4 py-1.5 bg-surface-container border border-border-subtle hover:bg-surface-container-high rounded-full text-xs font-bold text-text-primary transition-all flex items-center gap-1.5 cursor-pointer animate-pulse"
          >
            ← Kembali ke Profil Utama
          </button>
        </div>
        {renderStorefrontPreview()}
      </div>
    )
  }

  // Calculate XP percentage
  const xpPercent = Math.min(Math.max((user.xp / 1000) * 100, 5), 100)

  return (
    <div className="min-h-screen bg-bg-dark text-text-primary font-sans pb-24 overflow-hidden relative selection:bg-primary/30 selection:text-white">
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(198,169,107,0.03)_0%,transparent_70%)] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.02)_0%,transparent_70%)] pointer-events-none z-0" />

      {/* Profile Header Navigation */}
      <header className="border-b border-border-subtle bg-surface-dark/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center">
              <img src="/images/logo+nama_saloka.webp" alt="Saloka.id" className="h-8 md:h-9 object-contain" />
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/market" className="text-xs text-text-secondary hover:text-text-primary transition-colors">Marketplace</Link>
            <Link href="/academy" className="text-xs text-text-secondary hover:text-text-primary transition-colors">Academy</Link>
            <Link href="/affiliate" className="text-xs text-text-secondary hover:text-text-primary transition-colors">Affiliate Hub</Link>
            <Link href="/community" className="text-xs text-text-secondary hover:text-text-primary transition-colors">Community</Link>
          </nav>
          <div className="flex items-center gap-3">
            {isOwner ? (
              <Link
                href={user.role === 'MERCHANT' ? '/merchant/dashboard' : '/affiliate'}
                className="px-4 py-2 bg-primary text-black font-geist font-bold text-xs uppercase tracking-wider rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/15"
              >
                Dashboard Saya
              </Link>
            ) : (
              <Link
                href="/"
                className="px-4 py-2 bg-surface-container border border-border-subtle text-text-primary font-geist font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-surface-container-high transition-all"
              >
                Kembali
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Cover Banner */}
      <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900 to-amber-950/30 h-48 w-full border-b border-border-subtle relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.06)_0%,transparent_50%)]" />
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-surface-dark/80 border border-border-subtle backdrop-blur-xl rounded-3xl p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex flex-col items-center text-center">
                {/* Large Initials Avatar */}
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-primary/30 to-[#c9a227]/10 border border-[#c9a227]/30 flex items-center justify-center text-3xl font-extrabold text-primary shadow-lg shadow-primary/10 mb-6">
                  {user.name.substring(0, 2).toUpperCase()}
                </div>

                {/* Verified Badge */}
                <span className="inline-flex items-center gap-1 px-3 py-0.5 bg-amber-500/10 border border-amber-500/25 rounded-full text-[9px] text-[#f5d76e] font-geist font-extrabold uppercase tracking-wider mb-2">
                  <Shield className="w-3 h-3 text-[#f5d76e] fill-[#f5d76e]/10" />
                  {user.membershipLevel} Verified
                </span>

                <h2 className="font-sora text-xl font-bold text-text-primary mb-1">
                  {user.name}
                </h2>
                <p className="text-[10px] font-mono text-text-secondary mb-6">
                  ID: {user.id}
                </p>

                {/* Level Progress */}
                <div className="w-full bg-surface-container border border-border-subtle rounded-2xl p-4 mb-6">
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="font-bold text-text-secondary uppercase text-[10px] tracking-wider">Progress Level</span>
                    <span className="font-geist font-black text-primary">LV {user.level}</span>
                  </div>
                  <div className="h-2.5 bg-surface-container-high border border-border-subtle rounded-full overflow-hidden mb-1">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-[#f5d76e] rounded-full transition-all duration-500" 
                      style={{ width: `${xpPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-text-secondary">
                    <span>{user.xp} XP</span>
                    <span>1,000 XP untuk Level Berikutnya</span>
                  </div>
                </div>

                {/* Role and Access Badges */}
                <div className="w-full space-y-3 pt-4 border-t border-border-subtle text-left text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Peran Platform</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-geist font-black border uppercase tracking-wider ${
                      user.role === 'ADMIN' ? 'bg-red-500/10 border-red-500/35 text-red-400' :
                      user.role === 'MERCHANT' ? 'bg-primary/10 border-primary/35 text-primary' :
                      user.role === 'AFFILIATE' ? 'bg-blue-500/10 border-blue-500/35 text-blue-400' :
                      'bg-emerald-500/10 border-emerald-500/35 text-emerald-400'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                  {user.role === 'MERCHANT' && (
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary">Komunitas Induk</span>
                      <span className="font-bold text-text-primary text-right">
                        {(user as any).indukCommunityName || (
                          <span className="text-red-400 text-[10px] font-medium">Belum memilih</span>
                        )}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Status KYC</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-geist font-black border uppercase tracking-wider ${
                      (user as any).kycStatus === 'APPROVED' ? 'bg-green-500/10 border-green-500/35 text-green-400' :
                      (user as any).kycStatus === 'PENDING' ? 'bg-amber-500/10 border-amber-500/35 text-amber-400' :
                      (user as any).kycStatus === 'REJECTED' ? 'bg-red-500/10 border-red-500/35 text-red-400' :
                      'bg-neutral-500/10 border-neutral-500/35 text-neutral-400'
                    }`}>
                      {(user as any).kycStatus || 'NOT_SUBMITTED'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Tingkat Membership</span>
                    <span className="font-bold text-text-primary">{user.membershipLevel}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Hak Akses VIP</span>
                    <span className="font-bold text-primary">{user.membershipAccess}</span>
                  </div>
                  {user.email && (
                    <div className="flex justify-between items-center pt-2 border-t border-border-subtle">
                      <span className="text-text-secondary">Email</span>
                      <span className="font-mono text-text-primary text-[10px] truncate max-w-[150px]">{user.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Badges Earned Card */}
            {badges && badges.length > 0 && (
              <div className="bg-surface-dark/60 border border-border-subtle backdrop-blur-xl rounded-3xl p-6 shadow-2xl">
                <h3 className="font-sora text-xs font-bold uppercase tracking-widest text-[#f5d76e] mb-4">
                  Sertifikasi & Badges
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {badges.map((b: any) => (
                    <div key={b.id} className="flex gap-3 p-3 rounded-2xl bg-surface-container-lowest border border-border-subtle hover:border-amber-500/20 transition-all">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 text-xs ${b.color}`}>
                        {b.id.includes('admin') ? '🛡️' : b.id.includes('merchant') ? '⭐' : b.id.includes('graduate') ? '🎓' : '⚡'}
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-text-primary font-sora">{b.label}</span>
                        <span className="block text-[9px] text-text-secondary mt-0.5">{b.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Tab View, Referral, and Analytics */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* View Selection Tabs */}
            <div className="flex bg-surface-dark/60 border border-border-subtle p-1 rounded-2xl backdrop-blur-xl gap-1">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 py-3 text-xs font-geist font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-primary text-black shadow-lg shadow-primary/10'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-container'
                }`}
              >
                Profil & Referral
              </button>
              {user.role === 'MERCHANT' && (
                <button
                  onClick={() => setActiveTab('products')}
                  className={`flex-1 py-3 text-xs font-geist font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                    activeTab === 'products'
                      ? 'bg-primary text-black shadow-lg shadow-primary/10'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-container'
                  }`}
                >
                  Katalog Produk ({products.length})
                </button>
              )}
              {user.role === 'MERCHANT' && user.landingPageSetup && (
                <button
                  onClick={() => setActiveTab('storefront')}
                  className={`flex-1 py-3 text-xs font-geist font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                    (activeTab as string) === 'storefront'
                      ? 'bg-primary text-black shadow-lg shadow-primary/10'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-container'
                  }`}
                >
                  Pratinjau Toko
                </button>
              )}
            </div>

            {/* PROFILE & REFERRAL TAB */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                
                {/* Referral Center Card */}
                <div className="bg-surface-dark/80 border border-border-subtle backdrop-blur-xl rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-b from-primary/5 to-transparent rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1.5 h-6 bg-primary rounded-full" />
                    <h3 className="font-sora text-sm font-bold text-[#f5d76e] uppercase tracking-widest">
                      Program Kemitraan & Rujukan (Referral)
                    </h3>
                  </div>

                  <p className="text-xs text-text-secondary leading-relaxed mb-6">
                    Bagikan tautan referral atau kode referral Anda. Setiap pengguna yang mendaftar menggunakan referral Anda akan terhubung ke downline jaringan Anda, memberikan Anda komisi penjualan platform otomatis hingga 10% di setiap transaksi!
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    
                    {/* Inputs Area */}
                    <div className="md:col-span-2 space-y-4">
                      {/* Referral Code Box */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                          Kode Referral Anda
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            readOnly
                            value={user.email || user.id}
                            className="flex-1 h-10 px-3 bg-surface-container-low border border-border-subtle rounded-xl text-xs font-mono text-text-primary focus:outline-none"
                          />
                          <button
                            onClick={handleCopyCode}
                            className="px-4 h-10 bg-surface-container border border-border-subtle hover:bg-surface-container-high rounded-xl text-xs font-bold text-text-primary transition-all flex items-center justify-center gap-1.5 min-w-[100px] cursor-pointer"
                          >
                            {copiedCode ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-green-400" />
                                Tersalin
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                Salin
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Referral Link Box */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                          Tautan Pendaftaran (Referral Link)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            readOnly
                            value={typeof window !== 'undefined' ? `${window.location.origin}/auth?ref=${user.email || user.id}` : `/auth?ref=${user.id}`}
                            className="flex-1 h-10 px-3 bg-surface-container-low border border-border-subtle rounded-xl text-xs font-mono text-text-primary focus:outline-none"
                          />
                          <button
                            onClick={handleCopyLink}
                            className="px-4 h-10 bg-primary text-black rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 min-w-[100px] cursor-pointer"
                          >
                            {copiedLink ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                Tersalin
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                Salin Link
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Social Media Sharing */}
                      <div className="pt-2">
                        <span className="block text-[9px] uppercase tracking-wider text-text-secondary mb-2 font-bold">Bagikan Cepat</span>
                        <div className="flex gap-2">
                          <a 
                            href={`https://wa.me/?text=${encodeURIComponent(`Ayo daftar di Saloka.id menggunakan rujukan saya: ${typeof window !== 'undefined' ? `${window.location.origin}/auth?ref=${user.email || user.id}` : ''}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-green-500/10 border border-green-500/25 rounded-xl text-xs text-green-600 dark:text-green-400 hover:bg-green-500/20 transition-all font-geist font-bold flex items-center gap-1.5"
                          >
                            Bagikan ke WhatsApp
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* QR Code Area */}
                    <div className="md:col-span-1 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-border-subtle pt-6 md:pt-0 md:pl-6">
                      <div className="p-3 bg-white rounded-2xl mb-2 shadow-xl">
                        <UserQRCode
                          userId={user.id}
                          userName={user.name}
                          accentColor="#090A0F"
                          qrDarkColor="#090A0F"
                          qrLightColor="#ffffff"
                          variant="icon-only"
                        />
                      </div>
                      <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                        Scan QR Code
                      </span>
                    </div>

                  </div>
                </div>

                {/* KYC Submission Card (Only for Owner and when not approved) */}
                {isOwner && (user as any).kycStatus !== 'APPROVED' && (user as any).kycStatus !== 'VERIFIED' && (
                  <div className="bg-surface-dark/80 border border-border-subtle backdrop-blur-xl rounded-3xl p-6 shadow-2xl space-y-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-primary rounded-full" />
                      <h3 className="font-sora text-sm font-bold text-[#f5d76e] uppercase tracking-widest">
                        Verifikasi Identitas (KYC)
                      </h3>
                    </div>
                    
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Lengkapi verifikasi identitas Anda untuk dapat membuat komunitas baru, bergabung dengan Koperasi, atau mengajukan pinjaman modal usaha.
                    </p>

                    {(user as any).kycStatus === 'PENDING' ? (
                      <div className="p-5 bg-amber-500/10 border border-amber-500/25 rounded-2xl text-center text-xs text-amber-400 font-bold flex flex-col items-center gap-2">
                        <Activity className="w-5 h-5 animate-pulse text-amber-400" />
                        <span>Pengajuan KYC Anda sedang ditinjau oleh Admin. Silakan tunggu verifikasi selesai.</span>
                      </div>
                    ) : (
                      <div className="space-y-4 pt-2">
                        <div className="bg-surface-container-low border border-primary/20 rounded-2xl p-5 space-y-4 shadow-sm hover:border-primary/40 transition-all duration-300">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded text-[8px] font-geist font-black bg-primary text-black uppercase tracking-wider">
                                  Instan & Aman
                                </span>
                                <h4 className="text-xs font-bold text-text-primary">
                                  Verifikasi Otomatis Didit
                                </h4>
                              </div>
                              <p className="text-[10px] text-text-secondary mt-1.5 leading-relaxed">
                                Verifikasi wajah (liveness check) dan dokumen Anda secara instan menggunakan kamera smartphone/laptop Anda.
                              </p>
                            </div>
                            <div className="text-xs text-[#f5d76e] shrink-0 font-bold">⚡ 1 Menit</div>
                          </div>
                          
                          <button
                            type="button"
                            disabled={kycStarting}
                            onClick={async () => {
                              setKycStarting(true)
                              try {
                                const res = await fetch('/api/kyc/didit', { method: 'POST' })
                                const data = await res.json()
                                if (data.url) {
                                  window.location.href = data.url
                                } else {
                                  goeyToast.error(data.error || 'Gagal memulai verifikasi. Coba lagi.')
                                }
                              } catch (e) {
                                goeyToast.error('Terjadi kesalahan jaringan. Silakan coba lagi.')
                              } finally {
                                setKycStarting(false)
                              }
                            }}
                            className="w-full py-3 bg-primary text-black font-geist font-bold text-xs uppercase tracking-wider rounded-xl hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/10 disabled:opacity-60 cursor-pointer"
                          >
                            {kycStarting ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Memulai Verifikasi...
                              </>
                            ) : (
                              <>
                                <Shield className="w-3.5 h-3.5" />
                                Mulai Verifikasi Otomatis
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Performance & Analytics Summary Cards */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-4 bg-primary rounded-full" />
                    <h3 className="font-sora text-xs font-bold text-[#f5d76e] uppercase tracking-widest">
                      Ringkasan Analitik & Performa
                    </h3>
                  </div>

                  {user.role === 'MERCHANT' ? (
                    /* Merchant Analytics Grid */
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div className="bg-surface-dark/60 border border-border-subtle rounded-2xl p-4">
                        <span className="block text-[8px] uppercase tracking-widest text-text-secondary font-bold mb-2">Total Produk</span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xl font-bold text-text-primary">{products.length}</span>
                          <span className="text-[9px] text-text-secondary">Item terbit</span>
                        </div>
                      </div>
                      <div className="bg-surface-dark/60 border border-border-subtle rounded-2xl p-4">
                        <span className="block text-[8px] uppercase tracking-widest text-text-secondary font-bold mb-2">Total Pesanan Masuk</span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xl font-bold text-primary">{merchantStats?.totalOrders || 0}</span>
                          <span className="text-[9px] text-text-secondary">Pesanan</span>
                        </div>
                      </div>
                      <div className="bg-surface-dark/60 border border-border-subtle rounded-2xl p-4 col-span-2 sm:col-span-1">
                        <span className="block text-[8px] uppercase tracking-widest text-text-secondary font-bold mb-2">Total Omzet Pendapatan</span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-bold text-primary">Rp {(merchantStats?.totalRevenue || 0).toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Affiliate Analytics Grid */
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="bg-surface-dark/60 border border-border-subtle rounded-2xl p-4">
                        <span className="block text-[8px] uppercase tracking-widest text-text-secondary font-bold mb-2">Akumulasi Komisi</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-base font-bold text-primary">Rp {(affiliateStats?.totalEarnings || 0).toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                      <div className="bg-surface-dark/60 border border-border-subtle rounded-2xl p-4">
                        <span className="block text-[8px] uppercase tracking-widest text-text-secondary font-bold mb-2">Klik Tautan</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-bold text-text-primary">{affiliateStats?.clicksCount || 0}</span>
                          <span className="text-[9px] text-text-secondary">Klik</span>
                        </div>
                      </div>
                      <div className="bg-surface-dark/60 border border-border-subtle rounded-2xl p-4">
                        <span className="block text-[8px] uppercase tracking-widest text-text-secondary font-bold mb-2">Referral Pendaftaran</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-bold text-text-primary">{affiliateStats?.referrals?.length || 0}</span>
                          <span className="text-[9px] text-text-secondary">Mitra</span>
                        </div>
                      </div>
                      {isOwner && wallet && (
                        <div className="bg-surface-dark/60 border border-primary/20 bg-gradient-to-b from-primary/5 to-transparent rounded-2xl p-4">
                          <span className="block text-[8px] uppercase tracking-widest text-text-secondary font-bold mb-2">Saldo Dompet</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-base font-bold text-primary">Rp {(wallet.balance || 0).toLocaleString('id-ID')}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Wallet Shortcut for Owner */}
                  {isOwner && (
                    <div className="flex justify-between items-center bg-surface-container-lowest border border-border-subtle rounded-2xl p-4 text-xs">
                      <div className="flex items-center gap-3 text-text-secondary">
                        <Wallet className="w-4 h-4 text-primary" />
                        <span>Kelola penarikan komisi dan histori penarikan di Pusat Dompet Saloka</span>
                      </div>
                      <Link href="/wallet" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                        Buka Dompet
                        <ArrowUpRight className="w-4 h-4" />
                      </Link>
                    </div>
                  )}
                </div>

                {/* Log Rujukan/Aktivitas Rinci */}
                {isOwner && affiliateStats?.referrals && affiliateStats.referrals.length > 0 && (
                  <div className="border border-border-subtle bg-surface-dark/80 rounded-3xl overflow-hidden shadow-xl">
                    <div className="px-6 py-4 border-b border-border-subtle bg-surface-container-lowest">
                      <h4 className="font-sora text-xs font-bold text-text-primary uppercase tracking-wider">
                        Log Rujukan Terkini
                      </h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-border-subtle text-text-secondary bg-surface-container-lowest">
                            <th className="p-4 font-geist font-bold uppercase tracking-wider">Tanggal</th>
                            <th className="p-4 font-geist font-bold uppercase tracking-wider">Pelanggan</th>
                            <th className="p-4 font-geist font-bold uppercase tracking-wider">Status</th>
                            <th className="p-4 font-geist font-bold uppercase tracking-wider text-right">Komisi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                          {affiliateStats.referrals.slice(0, 5).map((ref: any) => {
                            const date = new Date(ref.createdAt)
                            return (
                              <tr key={ref.id} className="hover:bg-surface-container-lowest transition-colors">
                                <td className="p-4 text-text-secondary font-geist">
                                  {date.toLocaleDateString('id-ID')}{' '}
                                  <span className="opacity-50 text-[10px]">
                                    {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </td>
                                <td className="p-4 text-text-primary">
                                  {ref.buyer?.name || 'Pelanggan'}
                                </td>
                                <td className="p-4">
                                  <span className="px-2 py-0.5 rounded text-[9px] font-geist font-bold border uppercase bg-green-950 border-green-500/30 text-green-400">
                                    {ref.status}
                                  </span>
                                </td>
                                <td className="p-4 text-right font-geist font-bold text-primary">
                                  + Rp {ref.amount.toLocaleString('id-ID')}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PRODUCTS TAB */}
            {activeTab === 'products' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-primary rounded-full" />
                    <h3 className="font-sora text-sm font-bold text-text-primary uppercase tracking-widest">
                      Katalog Etalase Produk
                    </h3>
                  </div>
                  <span className="px-3 py-1 bg-surface-container border border-border-subtle rounded-full text-[10px] text-text-secondary font-mono">
                    {products.length} Items
                  </span>
                </div>

                {products.length === 0 ? (
                  <div className="p-12 text-center border border-border-subtle bg-surface-dark/40 rounded-3xl text-xs text-text-secondary">
                    Belum ada produk yang diterbitkan oleh merchant ini.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {products.map((p: any) => (
                      <div 
                        key={p.id}
                        className="group bg-surface-dark/60 border border-border-subtle rounded-3xl p-5 hover:border-primary/25 transition-all duration-300 flex flex-col justify-between shadow-lg relative"
                      >
                        <div>
                          <div className="relative">
                            {p.imageUrl && (
                              <div className="aspect-[16/10] w-full rounded-2xl overflow-hidden mb-4 border border-border-subtle relative bg-surface-container">
                                <img 
                                  src={p.imageUrl} 
                                  alt={p.title} 
                                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" 
                                />
                              </div>
                            )}
                            {currentUser?.role === 'AFFILIATE' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  e.preventDefault()
                                  const origin = typeof window !== 'undefined' ? window.location.origin : ''
                                  const link = `${origin}/market/product/${p.id}?aff=${currentUser.id}`
                                  navigator.clipboard.writeText(link).then(() => {
                                    setCopiedProductId(p.id)
                                    setTimeout(() => setCopiedProductId(null), 2000)
                                  })
                                }}
                                title="Salin Link Affiliate"
                                className={`absolute top-2 right-2 z-20 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all duration-200 cursor-pointer ${
                                  copiedProductId === p.id
                                    ? 'bg-green-500 text-white scale-105'
                                    : 'bg-surface-container/90 hover:bg-primary text-text-primary hover:text-black backdrop-blur-sm border border-border-subtle'
                                }`}
                              >
                                {copiedProductId === p.id
                                  ? <Check className="w-4 h-4" />
                                  : <Share2 className="w-4 h-4" />}
                              </button>
                            )}
                          </div>
                          <span className="text-[8px] font-bold tracking-widest text-primary uppercase bg-primary/5 px-2.5 py-1 rounded border border-primary/20">
                            {p.category}
                          </span>
                          <h4 className="text-sm font-bold text-text-primary mt-3 group-hover:text-primary transition-colors line-clamp-1">
                            {p.title}
                          </h4>
                          <p className="text-xs text-text-secondary mt-1.5 line-clamp-2 leading-relaxed">
                            {p.description}
                          </p>
                        </div>
                        <div className="flex justify-between items-center mt-6 pt-4 border-t border-border-subtle">
                          <span className="text-sm font-bold text-primary">
                            Rp {p.price.toLocaleString('id-ID')}
                          </span>
                          <Link
                            href={`/market/product/${p.id}`}
                            className="px-4 py-2 bg-surface-container hover:bg-primary text-text-primary hover:text-black text-[10px] font-bold uppercase rounded-lg border border-border-subtle hover:border-transparent transition-all flex items-center gap-1 cursor-pointer"
                          >
                            Beli Produk
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      </main>



    </div>
  )
}

/* ==========================================================================
   1. MODERN GOLD TEMPLATE (Charcoal, Gold Accents, Sleek Glassmorphism)
   ========================================================================== */
function ModernGoldTemplate({ user, products, config, logoUrl, distance, badges }: any) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null)
  
  const activeTemplate = user.landingPageTemplate || 'modern-gold'
  const isCreative = activeTemplate === 'creative-bold'
  const isSunset = activeTemplate === 'sunset-gradient'
  const isEmerald = activeTemplate === 'emerald-garden'
  const isStripe = activeTemplate === 'stripe-glow'

  // Parse custom testimonials and FAQ
  const testimonialsList = (config.testimonials && Array.isArray(config.testimonials) && config.testimonials.length > 0)
    ? config.testimonials
    : [
        { name: 'Ananda N.', quote: 'Kualitasnya benar-benar di luar ekspektasi saya. Rapi, premium, dan proses komunikasinya cepat. Rekomendasi bintang lima!', rating: 5 },
        { name: 'Dedi H.', quote: 'Bekerjasama dengan mereka untuk kemitraan cafe kami sangat memuaskan. Pengiriman selalu on-time dan konsisten.', rating: 5 }
      ]

  const faqList = (config.faq && Array.isArray(config.faq) && config.faq.length > 0)
    ? config.faq.map((f: any) => ({ q: f.question, a: f.answer }))
    : [
        { q: 'Bagaimana cara membeli produk/jasa merchant ini?', a: 'Anda dapat mengklik tombol "Lihat Detail" di atas untuk diarahkan ke etalase checkout marketplace, atau klik tombol chat WhatsApp di bawah untuk konsultasi langsung.' },
        { q: 'Apakah ada minimal pemesanan?', a: 'Tidak ada minimal pemesanan untuk eceran. Namun untuk pemesanan grosir/custom corporate, kami menawarkan harga khusus.' }
      ]

  // Render ordered sections dynamically
  const activeSections = (config.sections && Array.isArray(config.sections) && config.sections.length > 0)
    ? config.sections
    : ['hero', 'profile', 'features', 'products', 'testimonials', 'map', 'faq', 'cta']

  // 1. BG styles & Fonts
  let bgClass = "min-h-screen bg-[#0f0f10] text-[#f5f5f5] font-sora selection:bg-[#c9a227]/30 selection:text-white pb-24 overflow-hidden relative"
  let glow1 = <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(198,169,107,0.06)_0%,transparent_70%)] pointer-events-none z-0" />
  let glow2 = <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-[radial-gradient(circle_at_center,rgba(245,215,110,0.04)_0%,transparent_70%)] pointer-events-none z-0" />
  
  // 2. Header
  let headerClass = "bg-[#171717]/80 backdrop-blur-xl border border-amber-500/20 rounded-full px-6 py-3 flex items-center justify-between shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
  let logoBorder = "w-8 h-8 rounded-lg overflow-hidden border border-amber-500/30"
  let verifiedBadge = "text-[9px] font-bold font-geist text-[#f5d76e] bg-[#c9a227]/10 border border-[#c9a227]/35 rounded px-2.5 py-1 uppercase tracking-wider"
  
  // 3. Hero
  let verifiedHeroBadge = "inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[10px] text-[#f5d76e] font-semibold uppercase tracking-wider mb-2"
  let heroTitleText = "Elevate Your "
  let titleHighlight = "text-transparent bg-clip-text bg-gradient-to-r from-[#f5d76e] via-[#c9a227] to-[#f5d76e]"
  let titleHighlightText = "Local Product."
  let buttonClass = "inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[#c9a227] to-[#f5d76e] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_8px_20px_rgba(198,162,39,0.3)] cursor-pointer"
  
  // 4. About
  let aboutCardClass = "bg-[#171717]/40 border border-amber-500/15 rounded-3xl p-8 md:p-10 backdrop-blur-md relative overflow-hidden shadow-2xl"
  let aboutHeaderGlow = <div className="absolute top-0 right-0 w-48 h-48 bg-[#c9a227]/5 rounded-full blur-3xl pointer-events-none" />
  let aboutAccentBar = "w-1.5 h-6 bg-[#c9a227] rounded-full"
  let aboutTitle = "text-xs font-extrabold uppercase tracking-widest text-[#f5d76e]"
  let phoneCard = "flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-amber-500/30 transition-all hover:bg-white/[0.04]"
  let instaCard = "flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-amber-500/30 transition-all hover:bg-white/[0.04]"
  
  // 5. Bento
  let bentoClass1 = "md:col-span-2 bg-[#171717]/30 border border-white/5 rounded-3xl p-6 hover:border-amber-500/25 transition-all flex flex-col justify-between group"
  let bentoClass2 = "bg-[#171717]/30 border border-white/5 rounded-3xl p-6 hover:border-amber-500/25 transition-all flex flex-col justify-between group"
  let bentoIconClass = "p-3 w-fit rounded-xl bg-amber-500/10 text-[#f5d76e] mb-6"
  
  // 6. Section & Products
  let sectionHeaderClass = "flex justify-between items-end pb-3 border-b border-white/10"
  let sectionHeaderSub = "text-[9px] font-bold text-[#c9a227] uppercase tracking-widest block"
  let sectionHeaderSpan = "text-[10px] text-[#b8b8b8] bg-[#171717] border border-white/5 px-3 py-1 rounded-full font-mono"
  let productCard = "group bg-[#171717]/30 border border-white/5 rounded-3xl p-5 hover:border-amber-500/25 transition-all duration-300 flex flex-col justify-between shadow-lg"
  let productCat = "text-[8px] font-bold tracking-widest text-[#c9a227] uppercase bg-amber-500/5 px-2 py-1 rounded border border-amber-500/20"
  let productTitle = "text-sm font-bold text-white mt-3 group-hover:text-[#f5d76e] transition-colors line-clamp-1"
  let productPrice = "text-sm font-bold text-[#f5d76e]"
  let productButton = "px-4 py-2 bg-white/5 group-hover:bg-[#c9a227] text-[#f5f5f5] group-hover:text-black text-[10px] font-bold uppercase rounded-lg border border-white/10 group-hover:border-transparent transition-all"
  
  // 7. Testimonials
  let testimonialCard = "p-6 bg-[#171717]/20 border border-white/5 rounded-3xl space-y-4"
  let starClass = "w-3.5 h-3.5 fill-[#f5d76e] text-[#f5d76e]"
  let avatarClass = "w-7 h-7 rounded-full bg-[#c9a227]/20 flex items-center justify-center text-[9px] font-bold text-[#f5d76e]"
  
  // 8. Map
  let mapSection = "bg-[#171717]/30 border border-white/5 p-6 rounded-3xl space-y-4"
  let distanceClass = "px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-[#f5d76e] text-[10px] rounded-lg font-bold flex items-center gap-1.5"
  let radarBg = "relative w-8 h-8 rounded-full border border-[#c9a227] overflow-hidden bg-neutral-900 shadow"
  let radarText = "text-[9px] font-bold text-[#f5d76e]"
  let radarSweeper = "absolute w-[2px] h-1/2 bg-gradient-to-b from-[#c9a227] to-transparent origin-bottom animate-[spin_8s_linear_infinite] pointer-events-none"
  
  // 9. FAQ & CTA
  let faqBtn = "w-full p-5 text-left text-xs font-bold text-white flex justify-between items-center hover:bg-white/[0.02]"
  let ctaSection = "p-8 md:p-12 rounded-3xl border border-amber-500/15 text-center space-y-6 bg-gradient-to-b from-[#c9a227]/5 to-transparent relative overflow-hidden shadow-xl"
  let ctaButton = "inline-flex items-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-[#c9a227] to-[#f5d76e] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_8px_20px_rgba(198,162,39,0.25)] cursor-pointer"

  if (isCreative) {
    bgClass = "min-h-screen bg-[#0d071b] text-[#f1f1f6] font-sora selection:bg-purple-500/30 selection:text-white pb-24 overflow-hidden relative"
    glow1 = <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.08)_0%,transparent_70%)] pointer-events-none z-0" />
    glow2 = <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.06)_0%,transparent_70%)] pointer-events-none z-0" />
    headerClass = "bg-[#180f2d]/85 backdrop-blur-xl border border-purple-500/25 rounded-full px-6 py-3 flex items-center justify-between shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
    logoBorder = "w-8 h-8 rounded-lg overflow-hidden border border-purple-500/35"
    verifiedBadge = "text-[9px] font-bold font-geist text-[#e9d5ff] bg-purple-500/10 border border-purple-500/35 rounded px-2.5 py-1 uppercase tracking-wider"
    verifiedHeroBadge = "inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/15 border border-purple-500/25 rounded-full text-[10px] text-[#d8b4fe] font-semibold uppercase tracking-wider mb-2"
    heroTitleText = "Discover Dynamic "
    titleHighlight = "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400"
    titleHighlightText = "Artistic Crafts."
    buttonClass = "inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_8px_20px_rgba(168,85,247,0.35)] cursor-pointer"
    aboutCardClass = "bg-[#180f2d]/40 border border-purple-500/20 rounded-3xl p-8 md:p-10 backdrop-blur-md relative overflow-hidden shadow-2xl"
    aboutHeaderGlow = <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
    aboutAccentBar = "w-1.5 h-6 bg-purple-500 rounded-full"
    aboutTitle = "text-xs font-extrabold uppercase tracking-widest text-[#d8b4fe]"
    phoneCard = "flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-purple-500/30 transition-all hover:bg-white/[0.04]"
    instaCard = "flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-purple-500/30 transition-all hover:bg-white/[0.04]"
    bentoClass1 = "md:col-span-2 bg-[#180f2d]/30 border border-white/5 rounded-3xl p-6 hover:border-purple-500/25 transition-all flex flex-col justify-between group"
    bentoClass2 = "bg-[#180f2d]/30 border border-white/5 rounded-3xl p-6 hover:border-purple-500/25 transition-all flex flex-col justify-between group"
    bentoIconClass = "p-3 w-fit rounded-xl bg-purple-500/10 text-purple-400 mb-6"
    sectionHeaderSub = "text-[9px] font-bold text-purple-400 uppercase tracking-widest block"
    sectionHeaderSpan = "text-[10px] text-[#b8b8b8] bg-[#180f2d] border border-white/5 px-3 py-1 rounded-full font-mono"
    productCard = "group bg-[#180f2d]/25 border border-white/5 rounded-3xl p-5 hover:border-purple-500/30 transition-all duration-300 flex flex-col justify-between shadow-lg"
    productCat = "text-[8px] font-bold tracking-widest text-purple-400 uppercase bg-purple-500/5 px-2 py-1 rounded border border-purple-500/20"
    productTitle = "text-sm font-bold text-white mt-3 group-hover:text-purple-300 transition-colors line-clamp-1"
    productPrice = "text-sm font-bold text-purple-300"
    productButton = "px-4 py-2 bg-white/5 group-hover:bg-purple-600 text-[#f5f5f5] text-[10px] font-bold uppercase rounded-lg border border-white/10 group-hover:border-transparent transition-all"
    testimonialCard = "p-6 bg-[#180f2d]/20 border border-white/5 rounded-3xl space-y-4"
    starClass = "w-3.5 h-3.5 fill-purple-400 text-purple-400"
    avatarClass = "w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center text-[9px] font-bold text-purple-400"
    mapSection = "bg-[#180f2d]/25 border border-white/5 p-6 rounded-3xl space-y-4"
    distanceClass = "px-3 py-1 bg-purple-500/15 border border-purple-500/25 text-purple-300 text-[10px] rounded-lg font-bold flex items-center gap-1.5"
    radarBg = "relative w-8 h-8 rounded-full border border-purple-500/50 overflow-hidden bg-neutral-900 shadow"
    radarText = "text-[9px] font-bold text-purple-300"
    radarSweeper = "absolute w-[2px] h-1/2 bg-gradient-to-b from-purple-500 to-transparent origin-bottom animate-[spin_8s_linear_infinite] pointer-events-none"
    faqBtn = "w-full p-5 text-left text-xs font-bold text-white flex justify-between items-center hover:bg-purple-500/10"
    ctaSection = "p-8 md:p-12 rounded-3xl border border-purple-500/20 text-center space-y-6 bg-gradient-to-b from-purple-500/5 to-transparent relative overflow-hidden shadow-xl"
    ctaButton = "inline-flex items-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_8px_20px_rgba(168,85,247,0.3)] cursor-pointer"
  } else if (isSunset) {
    bgClass = "min-h-screen bg-[#1c0d0a] text-[#fceee9] font-inter selection:bg-rose-500/30 selection:text-white pb-24 overflow-hidden relative"
    glow1 = <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.07)_0%,transparent_70%)] pointer-events-none z-0" />
    glow2 = <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.05)_0%,transparent_70%)] pointer-events-none z-0" />
    headerClass = "bg-[#25120e]/85 backdrop-blur-xl border border-orange-500/25 rounded-full px-6 py-3 flex items-center justify-between shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
    logoBorder = "w-8 h-8 rounded-lg overflow-hidden border border-orange-500/35"
    verifiedBadge = "text-[9px] font-bold font-geist text-[#ffedd5] bg-orange-500/10 border border-orange-500/35 rounded px-2.5 py-1 uppercase tracking-wider"
    verifiedHeroBadge = "inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/15 border border-orange-500/25 rounded-full text-[10px] text-[#fed7aa] font-semibold uppercase tracking-wider mb-2"
    heroTitleText = "Brighten Your "
    titleHighlight = "text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400"
    titleHighlightText = "Sunset Vibes."
    buttonClass = "inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-amber-500 to-rose-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_8px_20px_rgba(249,115,22,0.35)] cursor-pointer"
    aboutCardClass = "bg-[#25120e]/40 border border-orange-500/20 rounded-3xl p-8 md:p-10 backdrop-blur-md relative overflow-hidden shadow-2xl"
    aboutHeaderGlow = <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
    aboutAccentBar = "w-1.5 h-6 bg-orange-500 rounded-full"
    aboutTitle = "text-xs font-extrabold uppercase tracking-widest text-[#fed7aa]"
    phoneCard = "flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-orange-500/30 transition-all hover:bg-white/[0.04]"
    instaCard = "flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-orange-500/30 transition-all hover:bg-white/[0.04]"
    bentoClass1 = "md:col-span-2 bg-[#25120e]/30 border border-white/5 rounded-3xl p-6 hover:border-orange-500/25 transition-all flex flex-col justify-between group"
    bentoClass2 = "bg-[#25120e]/30 border border-white/5 rounded-3xl p-6 hover:border-orange-500/25 transition-all flex flex-col justify-between group"
    bentoIconClass = "p-3 w-fit rounded-xl bg-orange-500/10 text-orange-400 mb-6"
    sectionHeaderSub = "text-[9px] font-bold text-orange-400 uppercase tracking-widest block"
    sectionHeaderSpan = "text-[10px] text-[#b8b8b8] bg-[#25120e] border border-white/5 px-3 py-1 rounded-full font-mono"
    productCard = "group bg-[#25120e]/25 border border-white/5 rounded-3xl p-5 hover:border-orange-500/30 transition-all duration-300 flex flex-col justify-between shadow-lg"
    productCat = "text-[8px] font-bold tracking-widest text-orange-400 uppercase bg-orange-500/5 px-2 py-1 rounded border border-orange-500/20"
    productTitle = "text-sm font-bold text-white mt-3 group-hover:text-orange-300 transition-colors line-clamp-1"
    productPrice = "text-sm font-bold text-orange-300"
    productButton = "px-4 py-2 bg-white/5 group-hover:bg-orange-500 text-white group-hover:text-black text-[10px] font-bold uppercase rounded-lg border border-white/10 group-hover:border-transparent transition-all"
    testimonialCard = "p-6 bg-[#25120e]/20 border border-white/5 rounded-3xl space-y-4"
    starClass = "w-3.5 h-3.5 fill-orange-400 text-orange-400"
    avatarClass = "w-7 h-7 rounded-full bg-orange-500/20 flex items-center justify-center text-[9px] font-bold text-orange-400"
    mapSection = "bg-[#25120e]/25 border border-white/5 p-6 rounded-3xl space-y-4"
    distanceClass = "px-3 py-1 bg-orange-500/15 border border-orange-500/25 text-orange-300 text-[10px] rounded-lg font-bold flex items-center gap-1.5"
    radarBg = "relative w-8 h-8 rounded-full border border-orange-500/50 overflow-hidden bg-neutral-900 shadow"
    radarText = "text-[9px] font-bold text-orange-300"
    radarSweeper = "absolute w-[2px] h-1/2 bg-gradient-to-b from-orange-500 to-transparent origin-bottom animate-[spin_8s_linear_infinite] pointer-events-none"
    faqBtn = "w-full p-5 text-left text-xs font-bold text-white flex justify-between items-center hover:bg-orange-500/10"
    ctaSection = "p-8 md:p-12 rounded-3xl border border-orange-500/20 text-center space-y-6 bg-gradient-to-b from-orange-500/5 to-transparent relative overflow-hidden shadow-xl"
    ctaButton = "inline-flex items-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-amber-500 to-rose-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_8px_20px_rgba(249,115,22,0.3)] cursor-pointer"
  } else if (isEmerald) {
    bgClass = "min-h-screen bg-[#051c14] text-[#e6f4f0] font-sora selection:bg-emerald-500/30 selection:text-white pb-24 overflow-hidden relative"
    glow1 = <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.07)_0%,transparent_70%)] pointer-events-none z-0" />
    glow2 = <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.05)_0%,transparent_70%)] pointer-events-none z-0" />
    headerClass = "bg-[#0a291f]/85 backdrop-blur-xl border border-emerald-500/25 rounded-full px-6 py-3 flex items-center justify-between shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
    logoBorder = "w-8 h-8 rounded-lg overflow-hidden border border-emerald-500/35"
    verifiedBadge = "text-[9px] font-bold font-geist text-[#d1fae5] bg-emerald-500/10 border border-emerald-500/35 rounded px-2.5 py-1 uppercase tracking-wider"
    verifiedHeroBadge = "inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/15 border border-emerald-500/25 rounded-full text-[10px] text-[#a7f3d0] font-semibold uppercase tracking-wider mb-2"
    heroTitleText = "Grow Your "
    titleHighlight = "text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-green-400"
    titleHighlightText = "Natural Garden."
    buttonClass = "inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_8px_20px_rgba(16,185,129,0.35)] cursor-pointer"
    aboutCardClass = "bg-[#0a291f]/40 border border-emerald-500/20 rounded-3xl p-8 md:p-10 backdrop-blur-md relative overflow-hidden shadow-2xl"
    aboutHeaderGlow = <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
    aboutAccentBar = "w-1.5 h-6 bg-emerald-500 rounded-full"
    aboutTitle = "text-xs font-extrabold uppercase tracking-widest text-[#a7f3d0]"
    phoneCard = "flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/30 transition-all hover:bg-white/[0.04]"
    instaCard = "flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/30 transition-all hover:bg-white/[0.04]"
    bentoClass1 = "md:col-span-2 bg-[#0a291f]/30 border border-white/5 rounded-3xl p-6 hover:border-emerald-500/25 transition-all flex flex-col justify-between group"
    bentoClass2 = "bg-[#0a291f]/30 border border-white/5 rounded-3xl p-6 hover:border-emerald-500/25 transition-all flex flex-col justify-between group"
    bentoIconClass = "p-3 w-fit rounded-xl bg-emerald-500/10 text-emerald-400 mb-6"
    sectionHeaderSub = "text-[9px] font-bold text-emerald-400 uppercase tracking-widest block"
    sectionHeaderSpan = "text-[10px] text-[#b8b8b8] bg-[#0a291f] border border-white/5 px-3 py-1 rounded-full font-mono"
    productCard = "group bg-[#0a291f]/25 border border-white/5 rounded-3xl p-5 hover:border-emerald-500/30 transition-all duration-300 flex flex-col justify-between shadow-lg"
    productCat = "text-[8px] font-bold tracking-widest text-emerald-400 uppercase bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/20"
    productTitle = "text-sm font-bold text-white mt-3 group-hover:text-emerald-300 transition-colors line-clamp-1"
    productPrice = "text-sm font-bold text-emerald-300"
    productButton = "px-4 py-2 bg-white/5 group-hover:bg-emerald-600 text-white text-[10px] font-bold uppercase rounded-lg border border-white/10 group-hover:border-transparent transition-all"
    testimonialCard = "p-6 bg-[#0a291f]/20 border border-white/5 rounded-3xl space-y-4"
    starClass = "w-3.5 h-3.5 fill-emerald-400 text-emerald-400"
    avatarClass = "w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-[9px] font-bold text-emerald-400"
    mapSection = "bg-[#0a291f]/25 border border-white/5 p-6 rounded-3xl space-y-4"
    distanceClass = "px-3 py-1 bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-[10px] rounded-lg font-bold flex items-center gap-1.5"
    radarBg = "relative w-8 h-8 rounded-full border border-emerald-500/50 overflow-hidden bg-neutral-900 shadow"
    radarText = "text-[9px] font-bold text-emerald-300"
    radarSweeper = "absolute w-[2px] h-1/2 bg-gradient-to-b from-emerald-500 to-transparent origin-bottom animate-[spin_8s_linear_infinite] pointer-events-none"
    faqBtn = "w-full p-5 text-left text-xs font-bold text-white flex justify-between items-center hover:bg-emerald-500/10"
    ctaSection = "p-8 md:p-12 rounded-3xl border border-emerald-500/20 text-center space-y-6 bg-gradient-to-b from-emerald-500/5 to-transparent relative overflow-hidden shadow-xl"
    ctaButton = "inline-flex items-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_8px_20px_rgba(16,185,129,0.3)] cursor-pointer"
  } else if (isStripe) {
    bgClass = "min-h-screen bg-[#090A0F] text-[#F8FAFC] font-sora selection:bg-indigo-500/30 selection:text-white pb-24 overflow-hidden relative"
    glow1 = <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08)_0%,transparent_70%)] pointer-events-none z-0" />
    glow2 = <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.06)_0%,transparent_70%)] pointer-events-none z-0" />
    headerClass = "bg-[#161722]/85 backdrop-blur-xl border border-white/5 rounded-full px-6 py-3 flex items-center justify-between shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
    logoBorder = "w-8 h-8 rounded-lg overflow-hidden border border-white/10"
    verifiedBadge = "text-[9px] font-bold font-geist text-indigo-400 bg-indigo-500/10 border border-indigo-500/35 rounded px-2.5 py-1 uppercase tracking-wider"
    verifiedHeroBadge = "inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/15 border border-indigo-500/25 rounded-full text-[10px] text-indigo-300 font-semibold uppercase tracking-wider mb-2"
    heroTitleText = "Grow Your "
    titleHighlight = "text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-emerald-400"
    titleHighlightText = "Premium Business."
    buttonClass = "inline-flex items-center gap-2 px-8 py-3.5 bg-indigo-600 text-white hover:bg-indigo-500 font-extrabold text-xs uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_8px_20px_rgba(99,102,241,0.3)] cursor-pointer"
    aboutCardClass = "bg-[#161722]/40 border border-white/5 rounded-3xl p-8 md:p-10 backdrop-blur-md relative overflow-hidden shadow-2xl"
    aboutHeaderGlow = <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
    aboutAccentBar = "w-1.5 h-6 bg-indigo-500 rounded-full"
    aboutTitle = "text-xs font-extrabold uppercase tracking-widest text-indigo-400"
    phoneCard = "flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 transition-all hover:bg-white/[0.04]"
    instaCard = "flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 transition-all hover:bg-white/[0.04]"
    bentoClass1 = "md:col-span-2 bg-[#161722]/30 border border-white/5 rounded-3xl p-6 hover:border-indigo-500/25 transition-all flex flex-col justify-between group"
    bentoClass2 = "bg-[#161722]/30 border border-white/5 rounded-3xl p-6 hover:border-indigo-500/25 transition-all flex flex-col justify-between group"
    bentoIconClass = "p-3 w-fit rounded-xl bg-indigo-500/10 text-indigo-400 mb-6"
    sectionHeaderSub = "text-[9px] font-bold text-indigo-400 uppercase tracking-widest block"
    sectionHeaderSpan = "text-[10px] text-[#b8b8b8] bg-[#161722] border border-white/5 px-3 py-1 rounded-full font-mono"
    productCard = "group bg-[#161722]/25 border border-white/5 rounded-3xl p-5 hover:border-indigo-500/30 transition-all duration-300 flex flex-col justify-between shadow-lg"
    productCat = "text-[8px] font-bold tracking-widest text-indigo-400 uppercase bg-indigo-500/5 px-2 py-1 rounded border border-indigo-500/20"
    productTitle = "text-sm font-bold text-white mt-3 group-hover:text-indigo-300 transition-colors line-clamp-1"
    productPrice = "text-sm font-bold text-indigo-300"
    productButton = "px-4 py-2 bg-white/5 group-hover:bg-indigo-600 text-white text-[10px] font-bold uppercase rounded-lg border border-white/10 group-hover:border-transparent transition-all"
    testimonialCard = "p-6 bg-[#161722]/20 border border-white/5 rounded-3xl space-y-4"
    starClass = "w-3.5 h-3.5 fill-indigo-400 text-indigo-400"
    avatarClass = "w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center text-[9px] font-bold text-indigo-400"
    mapSection = "bg-[#161722]/25 border border-white/5 p-6 rounded-3xl space-y-4"
    distanceClass = "px-3 py-1 bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-[10px] rounded-lg font-bold flex items-center gap-1.5"
    radarBg = "relative w-8 h-8 rounded-full border border-indigo-500/50 overflow-hidden bg-[#090A0F] shadow"
    radarText = "text-[9px] font-bold text-indigo-300"
    radarSweeper = "absolute w-[2px] h-1/2 bg-gradient-to-b from-indigo-500 to-transparent origin-bottom animate-[spin_8s_linear_infinite] pointer-events-none"
    faqBtn = "w-full p-5 text-left text-xs font-bold text-white flex justify-between items-center hover:bg-indigo-500/10"
    ctaSection = "p-8 md:p-12 rounded-3xl border border-white/5 text-center space-y-6 bg-gradient-to-b from-indigo-500/5 to-transparent relative overflow-hidden shadow-xl"
    ctaButton = "inline-flex items-center gap-2.5 px-8 py-3.5 bg-indigo-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_8px_20px_rgba(99,102,241,0.3)] cursor-pointer"
  }

  return (
    <div className={bgClass}>
      {/* Premium background mesh glow */}
      {glow1}
      {glow2}

      {/* Floating Header */}
      <header className="sticky top-4 z-40 max-w-4xl mx-auto px-4 w-full">
        <div className={headerClass}>
          <div className="flex items-center gap-3">
            <div className={logoBorder}>
              <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-xs tracking-wider text-white">
              {config.title || user.name}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <span className={verifiedBadge}>
              {user.membershipLevel} Verified
            </span>
            {badges && badges.map((b: any) => (
              <span key={b.id} title={b.desc} className={`px-2 py-0.5 rounded text-[8px] font-geist font-black border uppercase tracking-wider ${b.color}`}>
                {b.label}
              </span>
            ))}
            <UserQRCode
              userId={user.id}
              userName={user.name}
              accentColor={isCreative ? '#a855f7' : isSunset ? '#f97316' : isEmerald ? '#10b981' : isStripe ? '#6366f1' : '#c9a227'}
              qrDarkColor="#1a1a1a"
              qrLightColor="#ffffff"
              variant="icon-only"
            />
          </div>
        </div>
      </header>

      {/* Main container */}
      <main className="max-w-4xl mx-auto px-6 mt-16 space-y-24 relative z-10">
        
        {activeSections.map((secName: string) => {
          if (secName === 'hero') {
            return (
              <section key="hero" className="text-center space-y-6">
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className={verifiedHeroBadge}
                >
                  <span>Saloka.id Premium Merchant</span>
                </motion.div>

                <motion.h1 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-tight"
                >
                  {heroTitleText}<span className={titleHighlight}>{titleHighlightText}</span>
                </motion.h1>

                <motion.p 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-sm md:text-base text-[#b8b8b8] max-w-xl mx-auto leading-relaxed"
                >
                  Membawa kelezatan khas artisan, keunikan kreativitas lokal, dan kualitas layanan terverifikasi langsung ke depan pintu rumah Anda.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="pt-4"
                >
                  <a
                    href="#products"
                    className={buttonClass}
                  >
                    Jelajahi Produk Kami
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </motion.div>
              </section>
            )
          }

          if (secName === 'profile') {
            return (
              <section key="profile" className={aboutCardClass}>
                {aboutHeaderGlow}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className={aboutAccentBar} />
                    <span className={aboutTitle}>
                      Tentang Usaha Kami
                    </span>
                  </div>
                  <p className="text-sm md:text-base text-[#f5f5f5] leading-relaxed whitespace-pre-line font-light">
                    {config.bio || 'Kami menyajikan kurasi produk berkualitas tinggi yang dikerjakan dengan penuh dedikasi oleh pengrajin lokal profesional.'}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-white/5">
                    {config.phone && (
                      <a 
                        href={`https://wa.me/${config.phone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={phoneCard}
                      >
                        <Phone className="w-5 h-5 text-green-400" />
                        <div>
                          <span className="block text-[8px] uppercase text-[#b8b8b8] font-bold tracking-wider">WhatsApp Hotline</span>
                          <span className="font-bold text-xs text-white">{config.phone}</span>
                        </div>
                      </a>
                    )}
                    {config.instagram && (
                      <a 
                        href={`https://instagram.com/${config.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={instaCard}
                      >
                        <Instagram className="w-5 h-5 text-pink-400" />
                        <div>
                          <span className="block text-[8px] uppercase text-[#b8b8b8] font-bold tracking-wider">Instagram Brand</span>
                          <span className="font-bold text-xs text-white">{config.instagram}</span>
                        </div>
                      </a>
                    )}
                  </div>

                  {badges && badges.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                      <h4 className="text-[10px] font-bold text-[#f5d76e] uppercase tracking-widest font-sora">Sertifikasi & Prestasi</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {badges.map((b: any) => (
                          <div key={b.id} className="flex gap-3 p-3 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-amber-500/20 transition-colors">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 text-xs ${b.color}`}>
                              {b.id.includes('admin') ? '🛡️' : b.id.includes('merchant') ? '⭐' : b.id.includes('graduate') ? '🎓' : '⚡'}
                            </div>
                            <div>
                              <span className="block text-[10px] font-bold text-white font-sora">{b.label}</span>
                              <span className="block text-[9px] text-[#b8b8b8] mt-0.5">{b.desc}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )
          }

          if (secName === 'features') {
            return (
              <section key="features" className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={bentoClass1}>
                  <div className={bentoIconClass}>
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white mb-2">Jaminan Kualitas Premium</h4>
                    <p className="text-xs text-[#b8b8b8] leading-relaxed">
                      Setiap produk yang kami pasarkan telah melalui audit kelayakan mutu berkala dari platform Saloka.id untuk memastikan pengalaman belanja terbaik.
                    </p>
                  </div>
                </div>

                <div className={bentoClass2}>
                  <div className={bentoIconClass}>
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white mb-2">Dukungan Cepat</h4>
                    <p className="text-xs text-[#b8b8b8] leading-relaxed">
                      Hotline terintegrasi langsung untuk merespon pertanyaan pemesanan kustomisasi Anda.
                    </p>
                  </div>
                </div>
              </section>
            )
          }

          if (secName === 'products') {
            return (
              <section key="products" id="products" className="space-y-6">
                <div className={sectionHeaderClass}>
                  <div>
                    <span className={sectionHeaderSub}>Collection</span>
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider mt-1">Etalase Produk Pilihan</h3>
                  </div>
                  <span className={sectionHeaderSpan}>
                    {products.length} Items
                  </span>
                </div>

                {products.length === 0 ? (
                  <div className="p-12 text-center border border-white/5 bg-[#171717]/20 rounded-3xl text-xs text-[#b8b8b8]">
                    Belum ada produk yang diterbitkan.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {products.map((p: any) => (
                      <div 
                        key={p.id}
                        className={productCard}
                      >
                        <div>
                          {p.imageUrl && (
                            <div className="aspect-[16/10] w-full rounded-2xl overflow-hidden mb-4 border border-white/5 relative bg-[#171717]">
                              <img 
                                src={p.imageUrl} 
                                alt={p.title} 
                                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" 
                              />
                            </div>
                          )}
                          <span className={productCat}>
                            {p.category}
                          </span>
                          <h4 className={productTitle}>
                            {p.title}
                          </h4>
                          <p className="text-xs text-[#b8b8b8] mt-1.5 line-clamp-2 leading-relaxed">
                            {p.description}
                          </p>
                        </div>

                        <div className="flex justify-between items-center mt-5 pt-3.5 border-t border-white/5">
                          <span className={productPrice}>
                            Rp {p.price.toLocaleString('id-ID')}
                          </span>
                          <a 
                            href={`/market/product/${p.id}`}
                            className={productButton}
                          >
                            Lihat Detail
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )
          }

          if (secName === 'testimonials') {
            return (
              <section key="testimonials" className="space-y-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider pb-2 border-b border-white/10">
                  Ulasan Klien & Pembeli
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {testimonialsList.map((t: any, i: number) => (
                    <div key={i} className={testimonialCard}>
                      <div className="flex gap-1 text-amber-500">
                        {[...Array(t.rating || 5)].map((_, starIdx) => <Star key={starIdx} className={starClass} />)}
                      </div>
                      <p className="text-xs text-[#f5f5f5] leading-relaxed italic font-light">
                        "{t.quote || 'Ulasan pelanggan...'}"
                      </p>
                      <div className="flex items-center gap-3">
                        <div className={avatarClass}>
                          {t.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <span className="block text-xs font-bold text-white">{t.name || 'User'}</span>
                          <span className="block text-[8px] text-[#b8b8b8]">Pelanggan Terverifikasi</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )
          }

          if (secName === 'map' && user.latitude && user.longitude) {
            return (
              <section key="map" className={mapSection}>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-bold text-[#c9a227] uppercase tracking-widest block">Geografi</span>
                    <h4 className="text-xs font-bold text-white mt-1">
                      {user.role === 'MERCHANT' ? 'Lokasi Merchant Terverifikasi' : 'Lokasi Terverifikasi'}
                    </h4>
                  </div>
                  {distance !== null && (
                    <div className={distanceClass}>
                      <MapPin className="w-3 h-3 text-[#f5d76e]" />
                      Jarak: {distance.toFixed(1)} km dari Anda
                    </div>
                  )}
                </div>

                {/* Radar Simulation */}
                <div className="relative aspect-[21/9] rounded-2xl bg-black border border-white/10 overflow-hidden flex items-center justify-center">
                  <div className="absolute w-52 h-52 rounded-full border border-amber-500/5 animate-pulse" />
                  <div className="absolute w-32 h-32 rounded-full border border-amber-500/10" />
                  <div className="absolute w-full h-[1px] bg-white/5" />
                  <div className="absolute h-full w-[1px] bg-white/5" />
                  <div className={radarSweeper} />

                  <div className="absolute z-10 flex flex-col items-center gap-2">
                    <div className="relative">
                      <span className="animate-ping absolute inline-flex h-10 w-10 rounded-full bg-amber-500/25 opacity-75" />
                      <div className={radarBg}>
                        <img src={logoUrl} alt="merchant" className="w-full h-full object-cover" />
                      </div>
                    </div>
                    <div className="bg-neutral-950/90 border border-white/10 px-3 py-1 rounded text-center">
                      <span className={radarText}>{config.locationName || 'Jakarta'}</span>
                    </div>
                  </div>
                </div>
              </section>
            )
          }

          if (secName === 'faq') {
            return (
              <section key="faq" className="space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider pb-2 border-b border-white/10">
                  Pertanyaan yang Sering Diajukan
                </h3>
                <div className="space-y-3">
                  {faqList.map((faq: any, i: number) => (
                    <div key={i} className="border border-white/5 rounded-2xl overflow-hidden bg-white/[0.01]">
                      <button
                        onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                        className={faqBtn}
                      >
                        <span>{faq.q}</span>
                        <ChevronDown className={`w-4 h-4 text-[#c9a227] transition-transform ${activeFaq === i ? 'rotate-180' : ''}`} />
                      </button>
                      {activeFaq === i && (
                        <p className="px-5 pb-5 text-xs text-[#b8b8b8] leading-relaxed">
                          {faq.a}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )
          }

          if (secName === 'cta') {
            return (
              <section key="cta" className={ctaSection}>
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-white">Ingin Kustomisasi Pesanan?</h3>
                  <p className="text-xs text-[#b8b8b8] max-w-sm mx-auto leading-relaxed">
                    Diskusikan kebutuhan spesifik Anda langsung dengan merchant terverifikasi kami untuk mendapatkan penawaran spesial.
                  </p>
                </div>
                <a
                  href={`https://wa.me/${config.phone || ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={ctaButton}
                >
                  Hubungi via WhatsApp
                </a>
              </section>
            )
          }

          if (secName === 'gallery' && config.galleryItems && config.galleryItems.length > 0) {
            const gItems = config.galleryItems
            return (
              <section key="gallery" className="space-y-6">
                <div className={sectionHeaderClass}>
                  <div>
                    <span className={sectionHeaderSub}>Portfolio</span>
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider mt-1">{config.galleryTitle || 'Galeri Foto Kami'}</h3>
                  </div>
                  <span className={sectionHeaderSpan}>{gItems.length} Foto</span>
                </div>
                {config.galleryDesc && <p className="text-xs text-[#b8b8b8] leading-relaxed">{config.galleryDesc}</p>}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {gItems.map((item: any) => (
                    <div key={item.id} className={productCard + ' !p-0 overflow-hidden'}>
                      <div className="aspect-[4/3] w-full bg-neutral-900 overflow-hidden">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-neutral-600">No Image</div>
                        )}
                      </div>
                      <div className="p-4">
                        <h4 className="text-xs font-bold text-white line-clamp-1">{item.title}</h4>
                        {item.description && <p className="text-[10px] text-[#b8b8b8] mt-1 line-clamp-2">{item.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )
          }

          if (secName === 'footer') {
            const ftName = config.footerText || config.title || user.name
            const ftTagline = config.footerTagline || config.bio || ''
            const ftCopyright = config.footerCopyright || `© ${new Date().getFullYear()} ${ftName}. All Rights Reserved.`
            return (
              <section key="footer" className="pt-10 border-t border-white/10 space-y-8">
                <div className="flex flex-col md:flex-row justify-between gap-8">
                  {/* Brand */}
                  <div className="flex flex-col gap-4 max-w-xs">
                    <div className="flex items-center gap-3">
                      <div className={logoBorder}>
                        <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                      </div>
                      <span className="font-bold text-sm text-white">{ftName}</span>
                    </div>
                    <p className="text-xs text-[#b8b8b8] leading-relaxed">{ftTagline}</p>
                  </div>
                  {/* Social contact links */}
                  <div className="flex flex-col gap-3">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#c9a227]">Hubungi Kami</span>
                    {config.phone && (
                      <a href={`https://wa.me/${config.phone}`} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-xs font-bold text-green-400 hover:text-green-300 transition-colors">
                        📱 {config.phone}
                      </a>
                    )}
                    {config.instagram && (
                      <a href={`https://instagram.com/${config.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-xs font-bold text-pink-400 hover:text-pink-300 transition-colors">
                        📸 @{config.instagram.replace('@', '')}
                      </a>
                    )}
                  </div>
                </div>
                <p className="text-center text-[10px] text-[#b8b8b8]/50 border-t border-white/5 pt-6">{ftCopyright}</p>
              </section>
            )
          }

          return null
        })}

      </main>
    </div>
  )
}

/* ==========================================================================
   2. NEO BRUTALIST TEMPLATE (Pop Colors, Thick Black Borders, Offsets)
   ========================================================================== */
function NeoBrutalistTemplate({ user, products, config, logoUrl, distance, badges }: any) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null)

  const activeTemplate = user.landingPageTemplate || 'brutalist'
  const isSwiss = activeTemplate === 'swiss-minimalist'
  const isDeStijl = activeTemplate === 'de-stijl'

  // 1. BG styles & Fonts
  let bgClass = "min-h-screen bg-[#f7f3eb] text-[#111111] font-geist selection:bg-[#ffcc00] pb-24 overflow-hidden relative"
  let headerClass = "bg-[#f7f3eb] border-[3px] border-black rounded-none px-6 py-4 flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
  let logoBorder = "w-8 h-8 rounded-none overflow-hidden border-2 border-black"
  let verifiedBadge = "bg-[#ffcc00] border-2 border-black text-[9px] font-black px-2.5 py-1 uppercase tracking-wider rounded-none"
  
  // 2. Hero Section
  let heroSectionClass = "space-y-6 text-left border-[3px] border-black p-8 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-none"
  let heroBadgeClass = "inline-block px-3 py-1 bg-[#ff5c5c] text-white border-2 border-black font-black text-[9px] uppercase tracking-wider rounded-none"
  let heroTitleClass = "text-4xl md:text-6xl font-black tracking-tight leading-none uppercase"
  let heroSpanClass = "bg-[#ffcc00] px-2 border-2 border-black inline-block transform -rotate-1"
  let heroTextClass = "text-xs md:text-sm text-zinc-700 max-w-2xl font-bold leading-relaxed border-l-4 border-black pl-4"
  let heroButtonClass = "inline-flex items-center gap-2 px-8 py-4 bg-[#ffcc00] text-black border-[3px] border-black font-black text-xs uppercase tracking-wider hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer rounded-none"

  // 3. About Section
  let aboutSectionClass = "bg-white border-[3px] border-black rounded-none p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-6"
  let aboutTitleBadge = "text-sm font-black uppercase tracking-wider bg-[#ff5c5c] text-white border-2 border-black px-3 py-1.5 w-fit rounded-none"
  let aboutTextClass = "text-xs md:text-sm leading-relaxed font-bold"
  let linkCardClass = "flex items-center gap-3 p-4 bg-[#f7f3eb] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all rounded-none"

  // 4. Products Section
  let productsHeaderClass = "flex justify-between items-end pb-3 border-b-[3px] border-black"
  let countBadgeClass = "bg-white border-2 border-black text-[9px] font-black px-3 py-1 rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
  let productEmptyClass = "p-12 text-center border-2 border-black bg-white rounded-none text-xs font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
  
  // Product Card Loop
  let productCardClass = "bg-white border-[3px] border-black rounded-none p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all duration-200 flex flex-col justify-between"
  let productImageContainer = "aspect-[16/10] w-full rounded-none overflow-hidden mb-4 border-2 border-black bg-[#f7f3eb]"
  let productCatClass = "text-[8px] font-black uppercase bg-[#ffcc00] border-2 border-black px-2 py-0.5 rounded-none"
  let productTitleClass = "text-sm font-black mt-3 uppercase tracking-tight line-clamp-1"
  let productPriceClass = "text-xs font-black bg-[#ff5c5c] text-white border-2 border-black px-2.5 py-1 w-fit"
  let productBuyButtonClass = "px-4 py-2 bg-black text-white text-[9px] font-black uppercase tracking-wider border-2 border-black hover:bg-[#ffcc00] hover:text-black transition-colors rounded-none"

  // 5. Geolocation / Maps
  let mapSectionClass = "bg-white border-[3px] border-black p-6 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4"
  let mapDistanceClass = "bg-[#ffcc00] border-2 border-black px-2.5 py-1 text-[9px] font-black uppercase"
  let mapCanvasClass = "relative aspect-[21/9] rounded-none bg-[#f7f3eb] border-2 border-black overflow-hidden flex items-center justify-center"
  let mapAvatarClass = "w-8 h-8 rounded-none border-2 border-black overflow-hidden bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
  let mapTextClass = "bg-white border-2 border-black px-2.5 py-0.5 font-black text-[9px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"

  // 6. FAQ Section
  let faqHeaderClass = "text-sm font-black uppercase tracking-wider pb-2 border-b-[3px] border-black"
  let faqItemClass = "border-2 border-black rounded-none overflow-hidden bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
  let faqButtonClass = "w-full p-4.5 text-left text-xs font-black text-black flex justify-between items-center hover:bg-[#f7f3eb] transition-colors"
  let faqTextClass = "px-5 pb-5 text-xs text-zinc-700 leading-relaxed font-bold border-t-2 border-black pt-3"

  // 7. CTA Section
  let ctaSectionClass = "p-8 md:p-10 rounded-none border-[3px] border-black text-center space-y-6 bg-[#ff5c5c] text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
  let ctaButtonClass = "inline-flex items-center gap-2.5 px-8 py-4 bg-white text-black border-2 border-black font-black text-xs uppercase tracking-wider hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer rounded-none"

  if (isSwiss) {
    bgClass = "min-h-screen bg-[#faf9f6] text-[#1a1a1a] font-geist selection:bg-[#d1d5db] pb-24 overflow-hidden relative"
    headerClass = "bg-[#faf9f6] border border-[#1a1a1a] rounded-none px-6 py-3 flex items-center justify-between"
    logoBorder = "w-8 h-8 rounded-none overflow-hidden border border-[#1a1a1a]"
    verifiedBadge = "border border-[#1a1a1a] text-[8px] font-bold px-3 py-1 uppercase tracking-widest rounded-none text-neutral-600 bg-neutral-100 font-mono"
    heroSectionClass = "space-y-8 text-left border border-black p-10 bg-white rounded-none"
    heroBadgeClass = "inline-block px-2.5 py-0.5 bg-neutral-100 text-neutral-800 border border-neutral-300 font-bold text-[8px] uppercase tracking-widest rounded-none font-mono"
    heroTitleClass = "text-4xl md:text-5xl font-mono tracking-tight leading-tight uppercase"
    heroSpanClass = "underline decoration-1 underline-offset-4 inline-block font-extrabold"
    heroTextClass = "text-xs md:text-sm text-neutral-600 max-w-2xl font-light leading-relaxed border-l border-black pl-4 font-mono"
    heroButtonClass = "inline-flex items-center gap-2 px-6 py-3 bg-[#1a1a1a] text-white border border-[#1a1a1a] hover:bg-transparent hover:text-black font-bold text-xs uppercase tracking-wider transition-all cursor-pointer rounded-none font-mono"
    aboutSectionClass = "bg-[#faf9f6] border border-black rounded-none p-8 space-y-6"
    aboutTitleBadge = "text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-1 w-fit rounded-none font-mono"
    aboutTextClass = "text-xs md:text-sm leading-relaxed text-neutral-800"
    linkCardClass = "flex items-center gap-3 p-4 bg-transparent border border-black hover:bg-black hover:text-white transition-all rounded-none font-mono"
    productsHeaderClass = "flex justify-between items-end pb-3 border-b border-black font-mono"
    countBadgeClass = "text-[9px] font-mono uppercase px-2 py-0.5 border border-black"
    productEmptyClass = "p-12 text-center border border-black bg-white rounded-none text-xs font-mono"
    productCardClass = "bg-white border border-black rounded-none p-6 flex flex-col justify-between"
    productImageContainer = "aspect-[16/10] w-full rounded-none overflow-hidden mb-4 border border-neutral-200 bg-neutral-50"
    productCatClass = "text-[8px] font-mono uppercase border border-neutral-300 px-2 py-0.5 text-neutral-500 w-fit"
    productTitleClass = "text-xs font-bold mt-3 uppercase tracking-tight line-clamp-1"
    productPriceClass = "text-xs font-mono font-bold text-neutral-800"
    productBuyButtonClass = "px-4 py-2 bg-[#1a1a1a] text-white text-[9px] font-bold uppercase tracking-wider border border-black hover:bg-transparent hover:text-black transition-all rounded-none font-mono"
    mapSectionClass = "bg-[#faf9f6] border border-black p-6 rounded-none space-y-4 font-mono"
    mapDistanceClass = "border border-black px-2 py-0.5 text-[8px] font-mono uppercase"
    mapCanvasClass = "relative aspect-[21/9] rounded-none bg-neutral-50 border border-neutral-300 overflow-hidden flex items-center justify-center"
    mapAvatarClass = "w-8 h-8 rounded-none border border-black overflow-hidden bg-white"
    mapTextClass = "bg-white border border-neutral-300 px-2 py-0.5 font-mono text-[8px] uppercase"
    faqHeaderClass = "text-xs font-bold uppercase tracking-wider pb-2 border-b border-black font-mono"
    faqItemClass = "border border-black rounded-none overflow-hidden bg-white"
    faqButtonClass = "w-full p-4 text-left text-xs font-mono text-black flex justify-between items-center hover:bg-[#faf9f6] transition-colors"
    faqTextClass = "px-5 pb-5 text-xs text-neutral-600 leading-relaxed border-t border-black pt-3 font-mono"
    ctaSectionClass = "p-8 md:p-10 rounded-none border border-black text-center space-y-6 bg-[#1a1a1a] text-white font-mono"
    ctaButtonClass = "inline-flex items-center gap-2 px-6 py-3 bg-white text-black border border-black hover:bg-transparent hover:text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer rounded-none font-mono"
  }

  if (isDeStijl) {
    bgClass = "min-h-screen bg-[#ffffff] text-[#000000] font-sans pb-24 overflow-hidden relative"
    headerClass = "bg-white border-b-4 border-black px-6 py-4 flex items-center justify-between"
    logoBorder = "w-8 h-8 rounded-none overflow-hidden border-2 border-black"
    verifiedBadge = "bg-[#2563eb] text-white border-2 border-black text-[9px] font-bold px-3 py-1 uppercase tracking-wider rounded-none"
    heroSectionClass = "space-y-6 text-left border-4 border-black p-8 bg-white rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
    heroBadgeClass = "inline-block px-3 py-1 bg-[#e11d48] text-white border-2 border-black font-black text-[9px] uppercase tracking-wider rounded-none"
    heroTitleClass = "text-4xl md:text-6xl font-black tracking-tighter leading-none uppercase"
    heroSpanClass = "bg-[#eab308] px-2 text-black border-2 border-black inline-block transform rotate-1"
    heroTextClass = "text-xs md:text-sm text-black max-w-2xl font-semibold leading-relaxed border-l-8 border-black pl-4"
    heroButtonClass = "inline-flex items-center gap-2 px-8 py-4 bg-[#2563eb] text-white border-4 border-black font-black text-xs uppercase tracking-wider hover:bg-[#eab308] hover:text-black transition-all cursor-pointer rounded-none"
    aboutSectionClass = "bg-white border-4 border-black rounded-none p-8 shadow-[6px_6px_0px_0px_rgba(225,29,72,1)] space-y-6"
    aboutTitleBadge = "text-sm font-black uppercase tracking-wider bg-[#e11d48] text-white border-2 border-black px-3 py-1.5 w-fit rounded-none"
    aboutTextClass = "text-xs md:text-sm leading-relaxed font-bold text-black"
    linkCardClass = "flex items-center gap-3 p-4 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(37,99,235,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all rounded-none"
    productsHeaderClass = "flex justify-between items-end pb-3 border-b-4 border-black"
    countBadgeClass = "bg-[#eab308] border-2 border-black text-[9px] font-black px-3 py-1 rounded-none"
    productEmptyClass = "p-12 text-center border-4 border-black bg-white rounded-none text-xs font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
    productCardClass = "bg-white border-4 border-black rounded-none p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between"
    productImageContainer = "aspect-[16/10] w-full rounded-none overflow-hidden mb-4 border-2 border-black bg-neutral-100"
    productCatClass = "text-[8px] font-black uppercase bg-[#2563eb] text-white border-2 border-black px-2 py-0.5 rounded-none"
    productTitleClass = "text-sm font-black mt-3 uppercase tracking-tight line-clamp-1"
    productPriceClass = "text-xs font-black bg-[#e11d48] text-white border-2 border-black px-2.5 py-1 w-fit"
    productBuyButtonClass = "px-4 py-2 bg-[#eab308] text-black text-[9px] font-black uppercase tracking-wider border-2 border-black hover:bg-[#2563eb] hover:text-white transition-all rounded-none"
    mapSectionClass = "bg-white border-4 border-black p-6 rounded-none shadow-[6px_6px_0px_0px_rgba(37,99,235,1)] space-y-4"
    mapDistanceClass = "bg-[#eab308] border-2 border-black px-2.5 py-1 text-[9px] font-black uppercase"
    mapCanvasClass = "relative aspect-[21/9] rounded-none bg-white border-4 border-black overflow-hidden flex items-center justify-center"
    mapAvatarClass = "w-8 h-8 rounded-none border-2 border-black overflow-hidden bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
    mapTextClass = "bg-white border-2 border-black px-2.5 py-0.5 font-black text-[9px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
    faqHeaderClass = "text-sm font-black uppercase tracking-wider pb-2 border-b-4 border-black"
    faqItemClass = "border-2 border-black rounded-none overflow-hidden bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
    faqButtonClass = "w-full p-4.5 text-left text-xs font-black text-black flex justify-between items-center hover:bg-[#eab308]/10 transition-colors"
    faqTextClass = "px-5 pb-5 text-xs text-black leading-relaxed font-bold border-t-2 border-black pt-3"
    ctaSectionClass = "p-8 md:p-10 rounded-none border-4 border-black text-center space-y-6 bg-[#e11d48] text-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
    ctaButtonClass = "inline-flex items-center gap-2.5 px-8 py-4 bg-[#eab308] text-black border-2 border-black font-black text-xs uppercase tracking-wider hover:bg-[#2563eb] hover:text-white transition-all cursor-pointer rounded-none"
  }

  return (
    <div className={bgClass}>
      {/* Heavy Brutalist Navbar */}
      <header className="sticky top-4 z-45 max-w-4xl mx-auto px-4 w-full">
        <div className={headerClass}>
          <div className="flex items-center gap-3">
            <div className={logoBorder}>
              <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-black text-xs uppercase tracking-tight">
              {config.title || user.name}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <span className={verifiedBadge}>
              {user.membershipLevel}
            </span>
            {badges && badges.map((b: any) => (
              <span key={b.id} title={b.desc} className="bg-white border-2 border-black px-2 py-1 text-[8px] font-black uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                {b.label}
              </span>
            ))}
            <UserQRCode
              userId={user.id}
              userName={user.name}
              accentColor={isSwiss ? '#111111' : isDeStijl ? '#2563eb' : '#ffcc00'}
              qrDarkColor="#111111"
              qrLightColor="#ffffff"
              variant="icon-only"
            />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-6 mt-16 space-y-20 relative">
        
        {/* HERO SECTION */}
        <section className={heroSectionClass}>
          <div className={heroBadgeClass}>
            ★ verified merchant
          </div>

          <h1 className={heroTitleClass}>
            WE MAKE <span className={heroSpanClass}>AWESOME</span> LOCAL PRODUCTS.
          </h1>

          <p className={heroTextClass}>
            Membawa kelezatan khas artisan, keunikan kreativitas lokal, dan kualitas layanan terverifikasi langsung ke depan pintu rumah Anda tanpa basa-basi marketing kosong.
          </p>

          <div className="pt-2">
            <a
              href="#products"
              className={heroButtonClass}
            >
              Lihat Produk Usaha
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </section>

        {/* BIO / ABOUT */}
        <section className={aboutSectionClass}>
          <h3 className={aboutTitleBadge}>
            Tentang Usaha Kami
          </h3>
          <p className={aboutTextClass}>
            {config.bio || 'Kami menyajikan kurasi produk berkualitas tinggi yang dikerjakan dengan penuh dedikasi oleh pengrajin lokal profesional.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-xs font-black">
            {config.phone && (
              <a 
                href={`https://wa.me/${config.phone}`}
                target="_blank"
                rel="noopener noreferrer"
                className={linkCardClass}
              >
                <Phone className="w-5 h-5" />
                <div>
                  <span className="block text-[8px] uppercase text-zinc-500 font-bold">WhatsApp</span>
                  <span>{config.phone}</span>
                </div>
              </a>
            )}
            {config.instagram && (
              <a 
                href={`https://instagram.com/${config.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className={linkCardClass}
              >
                <Instagram className="w-5 h-5" />
                <div>
                  <span className="block text-[8px] uppercase text-zinc-500 font-bold">Instagram</span>
                  <span>{config.instagram}</span>
                </div>
              </a>
            )}
          </div>
          
          {badges && badges.length > 0 && (
            <div className="pt-6 border-t-2 border-black space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-[#ff5c5c]">Lencana & Prestasi</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {badges.map((b: any) => (
                  <div key={b.id} className="flex items-center gap-3 p-3 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-none">
                    <span className="text-lg">{b.id.includes('admin') ? '🛡️' : b.id.includes('merchant') ? '⭐' : b.id.includes('graduate') ? '🎓' : '⚡'}</span>
                    <div>
                      <span className="block text-[10px] font-black uppercase">{b.label}</span>
                      <span className="block text-[8px] text-zinc-500 font-bold uppercase tracking-tight mt-0.5">{b.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* PRODUCTS SECTION */}
        <section id="products" className="space-y-6">
          <div className={productsHeaderClass}>
            <h3 className="text-base font-black uppercase tracking-wider">Etalase Produk</h3>
            <span className={countBadgeClass}>
              {products.length} Items
            </span>
          </div>

          {products.length === 0 ? (
            <div className={productEmptyClass}>
              Belum ada produk yang dipublikasikan.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {products.map((p: any) => (
                <div 
                  key={p.id}
                  className={productCardClass}
                >
                  <div>
                    {p.imageUrl && (
                      <div className={productImageContainer}>
                        <img src={p.imageUrl} alt={p.title} className="object-cover w-full h-full" />
                      </div>
                    )}
                    <span className={productCatClass}>
                      {p.category}
                    </span>
                    <h4 className={productTitleClass}>{p.title}</h4>
                    <p className="text-xs text-zinc-600 mt-1 line-clamp-2 leading-relaxed font-semibold">{p.description}</p>
                  </div>

                  <div className="flex justify-between items-center mt-5 pt-3.5 border-t-2 border-black">
                    <span className={productPriceClass}>
                      Rp {p.price.toLocaleString('id-ID')}
                    </span>
                    <a 
                      href={`/market/product/${p.id}`}
                      className={productBuyButtonClass}
                    >
                      Beli / Detail
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* MAP & GEOLOCATION */}
        {user.latitude && user.longitude && (
          <section className={mapSectionClass}>
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black uppercase">
                {user.role === 'MERCHANT' ? 'Lokasi Penjual' : 'Lokasi Pengguna'}
              </h4>
              {distance !== null && (
                <span className={mapDistanceClass}>
                  {distance.toFixed(1)} km dari Anda
                </span>
              )}
            </div>

            {/* High Contrast Radar */}
            <div className={mapCanvasClass}>
              <div className="absolute w-52 h-52 rounded-full border-2 border-black/10 animate-ping" />
              <div className="absolute w-[2px] h-full bg-black/10 origin-center rotate-45" />
              <div className="absolute h-[2px] w-full bg-black/10 origin-center" />

              <div className="absolute z-10 flex flex-col items-center gap-2">
                <div className={mapAvatarClass}>
                  <img src={logoUrl} alt="merchant" className="w-full h-full object-cover" />
                </div>
                <div className={mapTextClass}>
                  {config.locationName || 'Jakarta'}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* FAQ ACCORDION */}
        <section className="space-y-4">
          <h3 className={faqHeaderClass}>
            FAQ
          </h3>
          <div className="space-y-3">
            {[
              { q: 'Bagaimana cara membeli produk/jasa merchant ini?', a: 'Anda dapat mengklik tombol "Beli / Detail" di atas untuk diarahkan ke etalase checkout marketplace, atau klik tombol chat WhatsApp di bawah untuk konsultasi langsung.' },
              { q: 'Apakah ada minimal pemesanan?', a: 'Tidak ada minimal pemesanan untuk eceran. Namun untuk pemesanan grosir/custom corporate, kami menawarkan harga khusus.' }
            ].map((faq, i) => (
              <div key={i} className={faqItemClass}>
                <button
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className={faqButtonClass}
                >
                  <span>{faq.q}</span>
                  <ChevronDown className="w-4 h-4 text-black" />
                </button>
                {activeFaq === i && (
                  <p className={faqTextClass}>
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* FAQ CTA */}
        <section className={ctaSectionClass}>
          <div className="space-y-3">
            <h3 className="text-xl font-black uppercase tracking-tight">KUSTOMISASI PESANAN ANDA!</h3>
            <p className="text-xs max-w-sm mx-auto leading-relaxed font-bold opacity-90 border-t border-white/30 pt-3">
              Hubungi kontak admin resmi kami secara instan untuk pemesanan volume besar atau negosiasi kontrak kerjasama.
            </p>
          </div>
          <a
            href={`https://wa.me/${config.phone || ''}`}
            target="_blank"
            rel="noopener noreferrer"
            className={ctaButtonClass}
          >
            Hubungi via WhatsApp
          </a>
        </section>

        {/* GALLERY SECTION */}
        {config.galleryItems && config.galleryItems.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b-4 border-black">
              <h3 className="text-xl font-black uppercase tracking-tight">{config.galleryTitle || 'GALERI FOTO'}</h3>
              <span className="border-2 border-black px-3 py-1 text-[9px] font-black uppercase">{config.galleryItems.length} Foto</span>
            </div>
            {config.galleryDesc && <p className="text-sm font-bold leading-relaxed">{config.galleryDesc}</p>}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {config.galleryItems.map((item: any) => (
                <div key={item.id} className="border-4 border-black rounded-none overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group">
                  <div className="aspect-[4/3] bg-neutral-200 overflow-hidden">
                    {item.imageUrl
                      ? <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      : <div className="w-full h-full flex items-center justify-center text-xs font-bold">No Image</div>
                    }
                  </div>
                  <div className="p-3 border-t-4 border-black bg-white">
                    <h4 className="text-xs font-black uppercase line-clamp-1">{item.title}</h4>
                    {item.description && <p className="text-[10px] font-bold text-zinc-600 mt-1 line-clamp-2">{item.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* BRANDED FOOTER */}
        <section className="border-t-4 border-black pt-10 space-y-8">
          <div className="flex flex-col md:flex-row justify-between gap-8 items-start">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 border-4 border-black overflow-hidden">
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                </div>
                <span className="font-black text-base uppercase">{config.footerText || config.title || user.name}</span>
              </div>
              {(config.footerTagline || config.bio) && (
                <p className="text-xs font-bold text-zinc-700 max-w-xs leading-relaxed">{config.footerTagline || config.bio}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[8px] font-black uppercase tracking-widest">Kontak</span>
              {config.phone && <a href={`https://wa.me/${config.phone}`} target="_blank" rel="noopener noreferrer" className="border-2 border-black px-4 py-2 text-xs font-black uppercase hover:bg-black hover:text-white transition-colors">📱 WhatsApp</a>}
              {config.instagram && <a href={`https://instagram.com/${config.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="border-2 border-black px-4 py-2 text-xs font-black uppercase hover:bg-black hover:text-white transition-colors">📸 Instagram</a>}
            </div>
          </div>
          <p className="text-[10px] font-bold text-zinc-500 border-t-2 border-black pt-4">
            {config.footerCopyright || `© ${new Date().getFullYear()} ${config.footerText || config.title || user.name}. Hak Cipta Dilindungi.`}
          </p>
        </section>

      </main>
    </div>
  )
}

/* ==========================================================================
   3. MINIMAL NOIR TEMPLATE (Pitch Black, Monospace Codes, Indigo Glows)
   ========================================================================== */
function MinimalNoirTemplate({ user, products, config, logoUrl, distance, badges }: any) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null)

  const activeTemplate = user.landingPageTemplate || 'minimal-noir'
  const isCyber = activeTemplate === 'cyberpunk-dark'
  const isSynth = activeTemplate === 'retro-synthwave'
  const isHpc = activeTemplate === 'hpc-tech'

  // Default: minimal-noir styles
  let bgClass = "min-h-screen bg-[#121212] text-neutral-200 font-geist selection:bg-[#4f46e5]/30 selection:text-white pb-24 overflow-hidden relative"
  let gridBg = <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
  let headerClass = "bg-[#1b1b1b]/90 border border-neutral-800 rounded px-5 py-3.5 flex items-center justify-between backdrop-blur-md"
  let pingClass = "w-1.5 h-1.5 rounded-full bg-[#7c7cff] animate-ping"
  let navTitleClass = "font-mono text-xs tracking-widest text-[#7c7cff] uppercase"
  let navBadgeClass = "font-mono text-[9px] text-neutral-400 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded uppercase"
  
  let heroSectionClass = "space-y-6 text-left border-l-2 border-neutral-800 pl-6 md:pl-10"
  let heroBadgeText = "[ system initialized: online ]"
  let heroBadgeClass = "font-mono text-[10px] text-[#7c7cff] uppercase tracking-wider"
  let heroTitleText = "Deploying "
  let heroTitleClass = "text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight uppercase font-geist"
  let heroTitleHighlightClass = "text-transparent bg-clip-text bg-gradient-to-r from-[#7c7cff] to-[#4f46e5]"
  let heroTitleHighlightText = "Premium Artifacts."
  let heroTextClass = "text-xs text-neutral-400 max-w-xl leading-relaxed font-sans font-light"
  let heroButtonClass = "inline-flex items-center gap-2 px-6 py-3 bg-[#7c7cff] hover:bg-[#4f46e5] text-white font-bold text-xs uppercase tracking-wider rounded transition-colors cursor-pointer"
  let heroButtonText = "cat ./products.json"

  let aboutSectionClass = "bg-[#1b1b1b]/50 border border-neutral-800 rounded p-6 space-y-4"
  let aboutTitleText = "$ cat about_us.md"
  let aboutTextClass = "text-xs leading-relaxed text-neutral-300 font-sans font-light whitespace-pre-line"
  let linkCardClass = "flex items-center gap-3 p-3 bg-neutral-900 border border-neutral-800 rounded hover:border-[#7c7cff]/30 transition-colors"
  let linkCardIconClass = "text-[#7c7cff]"

  let productsHeaderClass = "flex justify-between items-end pb-2 border-b border-neutral-800"
  let productsTitleClass = "text-xs font-bold text-[#7c7cff] uppercase"
  let productsTitleText = "# index_products"
  let productsCountClass = "text-[9px] text-neutral-400"
  let productsEmptyText = "[ empty dataset: no products found ]"

  let productCardClass = "group bg-[#1b1b1b]/30 border border-neutral-800 rounded p-4.5 hover:border-[#7c7cff]/30 transition-all flex flex-col justify-between"
  let productImageClass = "aspect-[16/10] w-full rounded overflow-hidden mb-3 border border-neutral-800/80 bg-neutral-950 relative"
  let productCatBadgeClass = "text-[8px] font-mono tracking-wider bg-neutral-900 border border-neutral-800 px-2 py-0.5 text-neutral-400 uppercase rounded"
  let productTitleClass = "text-xs font-bold text-white mt-3 uppercase tracking-wide line-clamp-1 font-geist"
  let productDescClass = "text-[11px] text-neutral-400 mt-1 font-sans font-light line-clamp-2 leading-relaxed"
  let productPriceClass = "text-xs font-bold text-[#7c7cff]"
  let productBuyButtonClass = "px-3.5 py-1.5 bg-neutral-900 hover:bg-[#7c7cff] text-[#b8b8b8] hover:text-white text-[9px] border border-neutral-800 hover:border-transparent rounded transition-colors uppercase"
  let productBuyButtonText = "cat_details"

  let mapSectionClass = "bg-[#1b1b1b]/40 border border-neutral-800 p-6 rounded space-y-4"
  let mapHeaderClass = "flex justify-between items-center text-[10px]"
  let mapHeaderText = "# GPS COORDINATES"
  let mapHeaderDistanceClass = "text-[#7c7cff]"
  let mapCanvasClass = "relative aspect-[21/9] rounded bg-black border border-neutral-800 overflow-hidden flex items-center justify-center"
  let mapRadarGlowClass = "absolute w-52 h-52 rounded-full border border-[#7c7cff]/5 animate-pulse"
  let mapRadarSweeperClass = "absolute w-[2px] h-1/2 bg-gradient-to-b from-[#7c7cff] to-transparent origin-bottom animate-[spin_10s_linear_infinite] pointer-events-none"
  let mapAvatarBorder = "w-8 h-8 rounded border border-[#7c7cff] overflow-hidden bg-neutral-950"
  let mapTextBadge = "bg-neutral-950 border border-neutral-800 px-2 py-0.5 text-[9px] uppercase"

  let faqHeaderClass = "text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-neutral-800"
  let faqHeaderText = "$ cat faq.json"
  let faqItemClass = "border border-neutral-800 rounded bg-[#1b1b1b]/10"
  let faqButtonClass = "w-full p-4.5 text-left text-xs font-bold text-white flex justify-between items-center hover:bg-neutral-950/40"
  let faqButtonIconColor = "text-[#7c7cff]"
  let faqTextClass = "px-5 pb-5 text-xs text-neutral-400 font-sans font-light leading-relaxed border-t border-neutral-800/60 pt-3.5"

  let ctaSectionClass = "p-8 border border-neutral-800 text-center space-y-6 bg-gradient-to-b from-[#7c7cff]/5 to-transparent rounded"
  let ctaTitleClass = "text-base font-bold text-white uppercase tracking-wide"
  let ctaTitleText = "// ESTABLISH CONNECTION"
  let ctaTextClass = "text-xs text-neutral-400 max-w-sm mx-auto font-sans font-light leading-relaxed"
  let ctaButtonClass = "inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 border border-neutral-800 hover:border-[#7c7cff] text-[#b8b8b8] hover:text-white font-bold text-[10px] uppercase tracking-wider rounded transition-colors cursor-pointer"
  let ctaButtonText = "connect --whatsapp"

  if (isCyber) {
    bgClass = "min-h-screen bg-[#050505] text-[#00f0ff] font-mono selection:bg-[#ff007f]/30 selection:text-white pb-24 overflow-hidden relative"
    gridBg = <div className="absolute inset-0 bg-[linear-gradient(to_right,#00f0ff08_1px,transparent_1px),linear-gradient(to_bottom,#00f0ff08_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
    headerClass = "bg-black/90 border-2 border-[#00f0ff] rounded-none px-5 py-3.5 flex items-center justify-between backdrop-blur-md shadow-[0_0_15px_rgba(0,240,255,0.2)]"
    pingClass = "w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-ping shadow-[0_0_8px_#00f0ff]"
    navTitleClass = "font-mono text-xs tracking-widest text-[#00f0ff] uppercase font-bold"
    navBadgeClass = "font-mono text-[9px] text-black bg-[#ff007f] border border-[#ff007f] px-2 py-0.5 rounded-none uppercase font-bold"
    heroSectionClass = "space-y-6 text-left border-2 border-[#00f0ff] p-8 bg-black/40 relative shadow-[0_0_20px_rgba(0,240,255,0.05)] rounded-none"
    heroBadgeText = "[ network: connected // encryption: active ]"
    heroBadgeClass = "font-mono text-[10px] text-[#ff007f] uppercase tracking-widest animate-pulse font-bold"
    heroTitleClass = "text-3xl md:text-5xl font-black tracking-tighter text-white leading-none uppercase font-mono"
    heroTitleHighlightClass = "text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] via-[#ff007f] to-[#00f0ff] drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]"
    heroTitleHighlightText = "Premium Artifacts."
    heroTitleText = "Deploying "
    heroTextClass = "text-xs text-[#00f0ff]/80 max-w-xl leading-relaxed font-mono"
    heroButtonClass = "inline-flex items-center gap-2 px-6 py-3 bg-[#00f0ff] hover:bg-[#ff007f] text-black font-mono font-black text-xs uppercase tracking-wider rounded-none transition-colors cursor-pointer shadow-[0_0_10px_rgba(0,240,255,0.3)]"
    heroButtonText = "exec ./products.sh"
    aboutSectionClass = "bg-black/60 border-2 border-[#00f0ff]/30 rounded-none p-6 space-y-4 shadow-[0_0_10px_rgba(0,240,255,0.02)]"
    aboutTitleText = "$ query info --about"
    aboutTextClass = "text-xs leading-relaxed text-[#00f0ff]/90 font-mono"
    linkCardClass = "flex items-center gap-3 p-3 bg-black border border-[#00f0ff]/30 rounded-none hover:border-[#00f0ff] hover:shadow-[0_0_10px_rgba(0,240,255,0.2)] transition-all font-mono"
    linkCardIconClass = "text-[#ff007f]"
    productsHeaderClass = "flex justify-between items-end pb-2 border-b-2 border-[#00f0ff]/30"
    productsTitleText = "$ ls -la ./products/"
    productsTitleClass = "text-xs font-bold text-[#00f0ff] uppercase tracking-widest"
    productsCountClass = "text-[9px] text-[#ff007f] font-bold font-mono"
    productsEmptyText = "[ error: zero items indexed ]"
    productCardClass = "group bg-black/40 border border-[#00f0ff]/20 rounded-none p-4.5 hover:border-[#00f0ff] hover:shadow-[0_0_15px_rgba(0,240,255,0.1)] transition-all flex flex-col justify-between"
    productImageClass = "aspect-[16/10] w-full rounded-none overflow-hidden mb-3 border border-[#00f0ff]/20 bg-neutral-950 relative"
    productCatBadgeClass = "text-[8px] font-mono tracking-wider bg-black border border-[#00f0ff]/30 px-2 py-0.5 text-[#00f0ff] uppercase rounded-none"
    productTitleClass = "text-xs font-bold text-white mt-3 uppercase tracking-wide line-clamp-1 font-mono"
    productDescClass = "text-[11px] text-[#00f0ff]/70 mt-1 font-mono line-clamp-2 leading-relaxed"
    productPriceClass = "text-xs font-bold text-[#ff007f] font-mono"
    productBuyButtonClass = "px-3.5 py-1.5 bg-black hover:bg-[#00f0ff] text-[#00f0ff] hover:text-black text-[9px] border border-[#00f0ff]/40 hover:border-transparent rounded-none transition-colors uppercase font-bold"
    productBuyButtonText = "buy_now"
    mapSectionClass = "bg-black/60 border-2 border-[#00f0ff]/30 p-6 rounded-none space-y-4"
    mapHeaderClass = "flex justify-between items-center text-[10px] font-mono"
    mapHeaderText = "// TARGET LOKASI GPS"
    mapHeaderDistanceClass = "text-[#ff007f] font-bold"
    mapCanvasClass = "relative aspect-[21/9] rounded-none bg-black border border-[#00f0ff]/30 overflow-hidden flex items-center justify-center"
    mapRadarGlowClass = "absolute w-52 h-52 rounded-full border border-[#00f0ff]/10 animate-pulse"
    mapRadarSweeperClass = "absolute w-[2px] h-1/2 bg-gradient-to-b from-[#00f0ff] to-transparent origin-bottom animate-[spin_8s_linear_infinite] pointer-events-none"
    mapAvatarBorder = "w-8 h-8 rounded-none border-2 border-[#00f0ff] overflow-hidden bg-neutral-950 shadow-[0_0_8px_rgba(0,240,255,0.4)]"
    mapTextBadge = "bg-black border border-[#00f0ff] px-2 py-0.5 text-[9px] uppercase text-[#00f0ff]"
    faqHeaderClass = "text-xs font-bold text-[#00f0ff] uppercase tracking-widest pb-2 border-b-2 border-[#00f0ff]/30 font-mono"
    faqHeaderText = "$ parse ./faq.db"
    faqItemClass = "border border-[#00f0ff]/20 rounded-none bg-black/40 hover:border-[#00f0ff]/50 transition-colors"
    faqButtonClass = "w-full p-4.5 text-left text-xs font-bold text-white flex justify-between items-center hover:bg-[#00f0ff]/5 font-mono"
    faqButtonIconColor = "text-[#ff007f]"
    faqTextClass = "px-5 pb-5 text-xs text-[#00f0ff]/80 font-mono leading-relaxed border-t border-[#00f0ff]/20 pt-3.5"
    ctaSectionClass = "p-8 border-2 border-[#00f0ff] text-center space-y-6 bg-black shadow-[0_0_20px_rgba(0,240,255,0.08)] rounded-none"
    ctaTitleClass = "text-base font-bold text-[#00f0ff] uppercase tracking-widest font-mono"
    ctaTitleText = "// INITIATE CONTACT"
    ctaTextClass = "text-xs text-[#00f0ff]/70 max-w-sm mx-auto font-mono leading-relaxed"
    ctaButtonClass = "inline-flex items-center gap-2 px-6 py-3 bg-[#00f0ff] hover:bg-[#ff007f] text-black border border-[#00f0ff] hover:border-transparent font-bold text-[10px] uppercase tracking-wider rounded-none transition-colors cursor-pointer font-mono shadow-[0_0_10px_rgba(0,240,255,0.25)]"
    ctaButtonText = "open --whatsapp"
  }

  if (isSynth) {
    bgClass = "min-h-screen bg-[#0c071d] text-[#e879f9] font-sans selection:bg-[#d946ef]/30 selection:text-white pb-24 overflow-hidden relative"
    gridBg = <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(217,70,239,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(217,70,239,0.06)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
    headerClass = "bg-[#130b24]/95 border border-[#d946ef]/30 rounded-xl px-5 py-3.5 flex items-center justify-between backdrop-blur-md shadow-[0_8px_30px_rgba(217,70,239,0.05)]"
    pingClass = "w-1.5 h-1.5 rounded-full bg-[#ec4899] animate-ping shadow-[0_0_8px_#ec4899]"
    navTitleClass = "font-sans text-xs tracking-widest text-[#d946ef] uppercase font-bold"
    navBadgeClass = "font-mono text-[9px] text-[#ec4899] bg-[#d946ef]/10 border border-[#d946ef]/30 px-2 py-0.5 rounded-full uppercase"
    heroSectionClass = "space-y-6 text-left border border-[#d946ef]/30 bg-[#130b24]/40 p-8 rounded-xl relative shadow-[0_4px_20px_rgba(217,70,239,0.02)]"
    heroBadgeText = "[ outrun aesthetic // online ]"
    heroBadgeClass = "font-mono text-[10px] text-[#f97316] uppercase tracking-widest font-bold"
    heroTitleClass = "text-3xl md:text-5xl font-black tracking-normal text-white leading-tight uppercase font-sans italic"
    heroTitleHighlightClass = "text-transparent bg-clip-text bg-gradient-to-r from-[#ec4899] via-[#d946ef] to-[#f97316]"
    heroTitleHighlightText = "Premium Artifacts."
    heroTitleText = "Deploying "
    heroTextClass = "text-xs text-[#e879f9]/80 max-w-xl leading-relaxed font-sans font-medium"
    heroButtonClass = "inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#ec4899] to-[#d946ef] hover:from-[#d946ef] hover:to-[#f97316] text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer shadow-[0_4px_15px_rgba(217,70,239,0.3)]"
    heroButtonText = "open products.dat"
    aboutSectionClass = "bg-[#130b24]/60 border border-[#d946ef]/20 rounded-xl p-6 space-y-4"
    aboutTitleText = "$ load about_profile"
    aboutTextClass = "text-xs leading-relaxed text-[#f472b6] font-sans font-medium"
    linkCardClass = "flex items-center gap-3 p-3 bg-[#1c0f35] border border-[#d946ef]/20 rounded-lg hover:border-[#d946ef] transition-all font-sans"
    linkCardIconClass = "text-[#f97316]"
    productsHeaderClass = "flex justify-between items-end pb-2 border-b border-[#d946ef]/20"
    productsTitleText = "# view --all-products"
    productsTitleClass = "text-xs font-bold text-[#ec4899] uppercase tracking-wider"
    productsCountClass = "text-[9px] text-[#f97316] font-bold font-mono"
    productsEmptyText = "[ database empty: 0 elements ]"
    productCardClass = "group bg-[#130b24]/30 border border-[#d946ef]/15 rounded-xl p-4.5 hover:border-[#d946ef]/40 transition-all flex flex-col justify-between"
    productImageClass = "aspect-[16/10] w-full rounded-lg overflow-hidden mb-3 border border-[#d946ef]/20 bg-[#130b24] relative"
    productCatBadgeClass = "text-[8px] font-mono tracking-wider bg-[#1c0f35] border border-[#d946ef]/35 px-2 py-0.5 text-[#ec4899] uppercase rounded-full"
    productTitleClass = "text-xs font-bold text-white mt-3 uppercase tracking-wide line-clamp-1 font-sans"
    productDescClass = "text-[11px] text-neutral-300 mt-1 font-sans font-medium line-clamp-2 leading-relaxed"
    productPriceClass = "text-xs font-bold text-[#f97316] font-mono"
    productBuyButtonClass = "px-3.5 py-1.5 bg-[#1c0f35] hover:bg-[#ec4899] text-[#ec4899] hover:text-white text-[9px] border border-[#d946ef]/25 hover:border-transparent rounded-lg transition-colors uppercase"
    productBuyButtonText = "buy_item"
    mapSectionClass = "bg-[#130b24]/40 border border-[#d946ef]/20 p-6 rounded-xl space-y-4"
    mapHeaderClass = "flex justify-between items-center text-[10px] font-sans"
    mapHeaderText = "# GEOLOCATION RADAR"
    mapHeaderDistanceClass = "text-[#f97316] font-bold"
    mapCanvasClass = "relative aspect-[21/9] rounded-lg bg-[#0c071d] border border-[#d946ef]/20 overflow-hidden flex items-center justify-center"
    mapRadarGlowClass = "absolute w-52 h-52 rounded-full border border-[#d946ef]/10 animate-pulse"
    mapRadarSweeperClass = "absolute w-[2px] h-1/2 bg-gradient-to-b from-[#d946ef] to-transparent origin-bottom animate-[spin_8s_linear_infinite] pointer-events-none"
    mapAvatarBorder = "w-8 h-8 rounded-full border-2 border-[#ec4899] overflow-hidden bg-neutral-950 shadow-[0_0_10px_rgba(217,70,239,0.3)]"
    mapTextBadge = "bg-[#1c0f35] border border-[#d946ef]/30 px-2.5 py-0.5 rounded text-[9px] uppercase text-[#ec4899]"
    faqHeaderClass = "text-xs font-bold text-[#ec4899] uppercase tracking-wider pb-2 border-b border-[#d946ef]/20 font-sans"
    faqHeaderText = "$ render faq_table"
    faqItemClass = "border border-[#d946ef]/15 rounded-lg bg-[#130b24]/20 hover:border-[#d946ef]/40 transition-colors"
    faqButtonClass = "w-full p-4.5 text-left text-xs font-bold text-white flex justify-between items-center hover:bg-[#d946ef]/5 font-sans"
    faqButtonIconColor = "text-[#f97316]"
    faqTextClass = "px-5 pb-5 text-xs text-[#e879f9]/80 font-sans font-medium leading-relaxed border-t border-[#d946ef]/10 pt-3.5"
    ctaSectionClass = "p-8 border border-[#d946ef]/25 text-center space-y-6 bg-gradient-to-b from-[#d946ef]/5 to-transparent rounded-xl shadow-[0_4px_15px_rgba(217,70,239,0.03)]"
    ctaTitleClass = "text-base font-bold text-[#ec4899] uppercase tracking-wider font-sans"
    ctaTitleText = "// DIAL TELEPHONE"
    ctaTextClass = "text-xs text-neutral-300 max-w-sm mx-auto font-sans leading-relaxed"
    ctaButtonClass = "inline-flex items-center gap-2 px-6 py-3 bg-[#1c0f35] hover:bg-[#ec4899] text-[#ec4899] hover:text-white font-bold text-[10px] uppercase tracking-wider border border-[#d946ef]/30 hover:border-transparent rounded-lg transition-colors cursor-pointer font-sans"
    ctaButtonText = "dial --whatsapp"
  }

  if (isHpc) {
    bgClass = "min-h-screen bg-[#0b0c10] text-[#c5c6c7] font-mono selection:bg-[#dc2626]/30 selection:text-white pb-24 overflow-hidden relative"
    gridBg = <div className="absolute inset-0 bg-[radial-gradient(#dc262606_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
    headerClass = "bg-[#1f2833]/90 border border-[#dc2626]/20 rounded-none px-5 py-3.5 flex items-center justify-between backdrop-blur-md border-t-2 border-t-[#dc2626]"
    pingClass = "w-1.5 h-1.5 rounded-full bg-[#dc2626] animate-ping shadow-[0_0_8px_#dc2626]"
    navTitleClass = "font-mono text-xs tracking-tight text-[#c5c6c7] uppercase font-bold"
    navBadgeClass = "font-mono text-[9px] text-[#dc2626] bg-[#dc2626]/5 border border-[#dc2626]/30 px-2 py-0.5 rounded-none uppercase font-bold"
    heroSectionClass = "space-y-6 text-left border border-[#dc2626]/20 border-l-4 border-l-[#dc2626] p-8 bg-[#1f2833]/30 rounded-none shadow-md"
    heroBadgeText = "[ system status: optimal // core load: stable ]"
    heroBadgeClass = "font-mono text-[10px] text-[#dc2626] uppercase tracking-wider font-bold"
    heroTitleClass = "text-3xl md:text-5xl font-black tracking-tight text-white leading-none uppercase font-mono"
    heroTitleHighlightClass = "text-[#dc2626] font-extrabold underline decoration-2 decoration-neutral-800 underline-offset-8"
    heroTitleHighlightText = "Premium Artifacts."
    heroTitleText = "Deploying "
    heroTextClass = "text-xs text-[#c5c6c7]/80 max-w-xl leading-relaxed font-mono"
    heroButtonClass = "inline-flex items-center gap-2 px-6 py-3 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-mono font-bold text-xs uppercase tracking-wider rounded-none transition-colors cursor-pointer shadow-md"
    heroButtonText = "grep ./products.db"
    aboutSectionClass = "bg-[#1f2833]/20 border border-[#dc2626]/10 rounded-none p-6 space-y-4"
    aboutTitleText = "$ cat merchant_profile.log"
    aboutTextClass = "text-xs leading-relaxed text-[#c5c6c7] font-mono"
    linkCardClass = "flex items-center gap-3 p-3 bg-[#1f2833]/40 border border-neutral-800 rounded-none hover:border-[#dc2626] transition-all font-mono"
    linkCardIconClass = "text-[#dc2626]"
    productsHeaderClass = "flex justify-between items-end pb-2 border-b border-[#dc2626]/20"
    productsTitleText = "# query --available-products"
    productsTitleClass = "text-xs font-bold text-[#dc2626] uppercase tracking-tight"
    productsCountClass = "text-[9px] text-[#c5c6c7] font-bold font-mono"
    productsEmptyText = "[ error: products query failed ]"
    productCardClass = "group bg-[#1f2833]/10 border border-neutral-800 rounded-none p-4.5 hover:border-[#dc2626] transition-all flex flex-col justify-between"
    productImageClass = "aspect-[16/10] w-full rounded-none overflow-hidden mb-3 border border-neutral-800 bg-[#1f2833]/20 relative"
    productCatBadgeClass = "text-[8px] font-mono tracking-wider bg-[#1f2833]/60 border border-neutral-800 px-2 py-0.5 text-neutral-400 uppercase rounded-none"
    productTitleClass = "text-xs font-bold text-white mt-3 uppercase tracking-wide line-clamp-1 font-mono"
    productDescClass = "text-[11px] text-[#c5c6c7]/70 mt-1 font-mono line-clamp-2 leading-relaxed"
    productPriceClass = "text-xs font-bold text-[#dc2626] font-mono"
    productBuyButtonClass = "px-3.5 py-1.5 bg-[#1f2833]/40 hover:bg-[#dc2626] text-neutral-400 hover:text-white text-[9px] border border-neutral-800 hover:border-transparent rounded-none transition-colors uppercase font-bold"
    productBuyButtonText = "buy_prod"
    mapSectionClass = "bg-[#1f2833]/20 border border-[#dc2626]/10 p-6 rounded-none space-y-4"
    mapHeaderClass = "flex justify-between items-center text-[10px] font-mono"
    mapHeaderText = "# GPS COORDINATES RADAR"
    mapHeaderDistanceClass = "text-[#dc2626] font-bold"
    mapCanvasClass = "relative aspect-[21/9] rounded-none bg-black border border-neutral-800 overflow-hidden flex items-center justify-center"
    mapRadarGlowClass = "absolute w-52 h-52 rounded-full border border-[#dc2626]/5 animate-pulse"
    mapRadarSweeperClass = "absolute w-[2px] h-1/2 bg-gradient-to-b from-[#dc2626] to-transparent origin-bottom animate-[spin_10s_linear_infinite] pointer-events-none"
    mapAvatarBorder = "w-8 h-8 rounded-none border-2 border-[#dc2626] overflow-hidden bg-neutral-950 shadow-[0_0_8px_rgba(220,38,38,0.2)]"
    mapTextBadge = "bg-[#1f2833] border border-neutral-800 px-2.5 py-0.5 rounded-none text-[9px] uppercase text-[#c5c6c7]"
    faqHeaderClass = "text-xs font-bold text-[#dc2626] uppercase tracking-tight pb-2 border-b border-[#dc2626]/20 font-mono"
    faqHeaderText = "$ load faq_list.json"
    faqItemClass = "border border-neutral-800 rounded-none bg-[#1f2833]/5 hover:border-[#dc2626]/40 transition-colors"
    faqButtonClass = "w-full p-4.5 text-left text-xs font-bold text-white flex justify-between items-center hover:bg-[#1f2833]/10 font-mono"
    faqButtonIconColor = "text-[#dc2626]"
    faqTextClass = "px-5 pb-5 text-xs text-[#c5c6c7]/80 font-mono leading-relaxed border-t border-neutral-800/60 pt-3.5"
    ctaSectionClass = "p-8 border border-[#dc2626]/20 text-center space-y-6 bg-[#1f2833]/10 rounded-none border-t-4 border-t-[#dc2626]"
    ctaTitleClass = "text-base font-bold text-white uppercase tracking-tight font-mono"
    ctaTitleText = "// CONSTRUCT WA LINK"
    ctaTextClass = "text-xs text-[#c5c6c7]/70 max-w-sm mx-auto font-mono leading-relaxed"
    ctaButtonClass = "inline-flex items-center gap-2 px-6 py-3 bg-[#dc2626] hover:bg-[#b91c1c] text-white border border-[#dc2626] hover:border-transparent font-bold text-[10px] uppercase tracking-wider rounded-none transition-colors cursor-pointer font-mono shadow-md"
    ctaButtonText = "open --whatsapp"
  }

  return (
    <div className={bgClass}>
      {/* Code Grid Lines background */}
      {gridBg}

      {/* Top Simple Monospace Navbar */}
      <header className="sticky top-4 z-40 max-w-4xl mx-auto px-4 w-full">
        <div className={headerClass}>
          <div className="flex items-center gap-2.5">
            <span className={pingClass} />
            <span className={navTitleClass}>
              {config.title || user.name}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end text-[9px] font-mono">
            <span className={navBadgeClass}>
              LV-{user.level} // verified
            </span>
            {badges && badges.map((b: any) => (
              <span key={b.id} title={b.desc} className="text-[#dc2626] border border-[#dc2626]/40 px-2 py-0.5 rounded-none font-bold">
                [{b.label.replace(/[^a-zA-Z0-9 ]/g, '').trim()}]
              </span>
            ))}
            <UserQRCode
              userId={user.id}
              userName={user.name}
              accentColor="#22d3ee"
              qrDarkColor="#0a0a0b"
              qrLightColor="#f0f0f0"
              variant="icon-only"
            />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-6 mt-16 space-y-20 relative z-10 font-mono">
        
        {/* HERO */}
        <section className={heroSectionClass}>
          <span className={heroBadgeClass}>
            {heroBadgeText}
          </span>

          <h1 className={heroTitleClass}>
            {heroTitleText}<span className={heroTitleHighlightClass}>{heroTitleHighlightText}</span>
          </h1>

          <p className={heroTextClass}>
            Kurasi produk lokal terverifikasi, dibuat dengan standar komputasi visual modern. Mengeliminasi redundansi kualitas untuk performa maksimal.
          </p>

          <div className="pt-2">
            <a
              href="#products"
              className={heroButtonClass}
            >
              {heroButtonText}
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </section>

        {/* BIO / ABOUT */}
        <section className={aboutSectionClass}>
          <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
            {aboutTitleText}
          </div>
          <p className={aboutTextClass}>
            {config.bio || 'Kami menyajikan kurasi produk berkualitas tinggi yang dikerjakan dengan penuh dedikasi oleh pengrajin lokal profesional.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-neutral-800 text-[10px]">
            {config.phone && (
              <a 
                href={`https://wa.me/${config.phone}`}
                target="_blank"
                rel="noopener noreferrer"
                className={linkCardClass}
              >
                <Phone className={`w-4 h-4 ${linkCardIconClass}`} />
                <div>
                  <span className="block opacity-50 uppercase">TELECOMMUNICATIONS</span>
                  <span className="font-bold text-white">{config.phone}</span>
                </div>
              </a>
            )}
            {config.instagram && (
              <a 
                href={`https://instagram.com/${config.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className={linkCardClass}
              >
                <Instagram className={`w-4 h-4 ${linkCardIconClass}`} />
                <div>
                  <span className="block opacity-50 uppercase">SOCIAL_INDEX</span>
                  <span className="font-bold text-white">{config.instagram}</span>
                </div>
              </a>
            )}
          </div>
          
          {badges && badges.length > 0 && (
            <div className="pt-6 border-t border-neutral-800 space-y-4 font-mono text-[10px]">
              <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">// ACHIEVEMENTS_LOG</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {badges.map((b: any) => (
                  <div key={b.id} className="flex items-center gap-3 p-3 border border-neutral-800 bg-[#1f2833]/5 rounded-none">
                    <span className="text-[#dc2626] font-bold">[{b.id.includes('admin') ? 'ADMIN' : b.id.includes('merchant') ? 'SELLER' : b.id.includes('graduate') ? 'ACADEMY' : 'LEVEL'}]</span>
                    <div>
                      <span className="block font-bold text-white uppercase">{b.label}</span>
                      <span className="block opacity-60 text-[9px] mt-0.5">{b.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* PRODUCTS */}
        <section id="products" className="space-y-6">
          <div className={productsHeaderClass}>
            <h3 className={productsTitleClass}>{productsTitleText}</h3>
            <span className={productsCountClass}>
              count: {products.length}
            </span>
          </div>

          {products.length === 0 ? (
            <div className="p-12 text-center border border-neutral-800 bg-[#1b1b1b]/20 rounded text-xs text-neutral-500">
              {productsEmptyText}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {products.map((p: any) => (
                <div 
                  key={p.id}
                  className={productCardClass}
                >
                  <div>
                    {p.imageUrl && (
                      <div className={productImageClass}>
                        <img src={p.imageUrl} alt={p.title} className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    )}
                    <span className={productCatBadgeClass}>
                      cat_id: {p.category}
                    </span>
                    <h4 className={productTitleClass}>{p.title}</h4>
                    <p className={productDescClass}>{p.description}</p>
                  </div>

                  <div className="flex justify-between items-center mt-5 pt-3 border-t border-neutral-800">
                    <span className={productPriceClass}>
                      $ Rp {p.price.toLocaleString('id-ID')}
                    </span>
                    <a 
                      href={`/market/product/${p.id}`}
                      className={productBuyButtonClass}
                    >
                      {productBuyButtonText}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* MAP & GEOLOCATION */}
        {user.latitude && user.longitude && (
          <section className={mapSectionClass}>
            <div className={mapHeaderClass}>
              <span>{mapHeaderText}</span>
              {distance !== null && (
                <span className={mapHeaderDistanceClass}>
                  DISTANCE_METRIC: {distance.toFixed(2)} KM
                </span>
              )}
            </div>

            {/* Radar visual */}
            <div className={mapCanvasClass}>
              <div className={mapRadarGlowClass} />
              <div className="absolute w-full h-[1px] bg-neutral-900" />
              <div className="absolute h-full w-[1px] bg-neutral-900" />
              <div className={mapRadarSweeperClass} />

              <div className="absolute z-10 flex flex-col items-center gap-2">
                <div className={mapAvatarBorder}>
                  <img src={logoUrl} alt="merchant" className="w-full h-full object-cover" />
                </div>
                <div className={mapTextBadge}>
                  {config.locationName || 'Jakarta'}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* FAQ ACCORDION */}
        <section className="space-y-4">
          <h3 className={faqHeaderClass}>
            {faqHeaderText}
          </h3>
          <div className="space-y-3">
            {[
              { q: 'Bagaimana cara membeli produk/jasa merchant ini?', a: 'Anda dapat mengklik tombol "cat_details" di atas untuk diarahkan ke etalase checkout marketplace, atau klik tombol chat WhatsApp di bawah untuk konsultasi langsung.' },
              { q: 'Apakah ada minimal pemesanan?', a: 'Tidak ada minimal pemesanan untuk eceran. Namun untuk pemesanan grosir/custom corporate, kami menawarkan harga khusus.' }
            ].map((faq, i) => (
              <div key={i} className={faqItemClass}>
                <button
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className={faqButtonClass}
                >
                  <span>$ {faq.q}</span>
                  <ChevronDown className={`w-4 h-4 ${faqButtonIconColor}`} />
                </button>
                {activeFaq === i && (
                  <p className={faqTextClass}>
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* FAQ CTA */}
        <section className={ctaSectionClass}>
          <div className="space-y-2">
            <h3 className={ctaTitleClass}>{ctaTitleText}</h3>
            <p className={ctaTextClass}>
              Hubungi pengelola channel ini secara langsung via enkripsi instan untuk kustomisasi logistik/grosir.
            </p>
          </div>
          <a
            href={`https://wa.me/${config.phone || ''}`}
            target="_blank"
            rel="noopener noreferrer"
            className={ctaButtonClass}
          >
            {ctaButtonText}
          </a>
        </section>

        {/* GALLERY SECTION */}
        {config.galleryItems && config.galleryItems.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div>
                <span className="block text-[9px] font-mono text-[#7c7cff] uppercase tracking-widest mb-1">$ ls gallery/</span>
                <h3 className="text-sm font-bold text-white">{config.galleryTitle || 'Galeri Foto'}</h3>
              </div>
              <span className="font-mono text-[9px] text-neutral-500 border border-neutral-800 px-2 py-1 rounded">[{config.galleryItems.length} FILES]</span>
            </div>
            {config.galleryDesc && <p className="text-xs text-neutral-400 font-mono leading-relaxed"># {config.galleryDesc}</p>}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {config.galleryItems.map((item: any) => (
                <div key={item.id} className="border border-neutral-800 rounded-lg overflow-hidden group hover:border-neutral-600 transition-colors">
                  <div className="aspect-[4/3] bg-neutral-900 overflow-hidden">
                    {item.imageUrl
                      ? <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      : <div className="w-full h-full flex items-center justify-center text-[9px] font-mono text-neutral-600">null</div>
                    }
                  </div>
                  <div className="p-3 border-t border-neutral-800">
                    <h4 className="text-xs font-bold text-neutral-200 line-clamp-1">{item.title}</h4>
                    {item.description && <p className="text-[9px] font-mono text-neutral-500 mt-1 line-clamp-2"># {item.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* BRANDED FOOTER */}
        <section className="border-t border-neutral-800 pt-10 space-y-8">
          <div className="flex flex-col md:flex-row justify-between gap-8 items-start">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded border border-neutral-700 overflow-hidden">
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                </div>
                <span className="font-bold text-sm text-neutral-100">{config.footerText || config.title || user.name}</span>
              </div>
              {(config.footerTagline || config.bio) && (
                <p className="text-xs font-mono text-neutral-500 max-w-xs leading-relaxed"># {config.footerTagline || config.bio}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[8px] font-mono text-neutral-600 uppercase tracking-widest">$ contact --all</span>
              {config.phone && <a href={`https://wa.me/${config.phone}`} target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-green-400 hover:text-green-300 transition-colors">📱 {config.phone}</a>}
              {config.instagram && <a href={`https://instagram.com/${config.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-pink-400 hover:text-pink-300 transition-colors">📸 @{config.instagram.replace('@', '')}</a>}
            </div>
          </div>
          <p className="text-[10px] font-mono text-neutral-700 border-t border-neutral-900 pt-4">
            {config.footerCopyright || `// © ${new Date().getFullYear()} ${config.footerText || config.title || user.name}. MIT LICENSE.`}
          </p>
        </section>

      </main>
    </div>
  )
}

/* ==========================================================================
   4. CLEAN PROFESSIONAL TEMPLATE (Light theme Slate SaaS - Vercel/Notion Style)
   ========================================================================== */
function CleanProfessionalTemplate({ user, products, config, logoUrl, distance, badges }: any) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null)

  const activeTemplate = user.landingPageTemplate || 'clean-professional'
  const isGlass = activeTemplate === 'alabaster-glass'
  const isStudio = activeTemplate === 'studio'

  // Define defaults (clean-professional style)
  let bgClass = "min-h-screen bg-[#f8fafc] text-[#0f172a] font-inter selection:bg-blue-200 pb-24 overflow-hidden relative"
  let gridBg = <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-60 z-0" />
  let headerContainer = "sticky top-4 z-40 max-w-4xl mx-auto px-4 w-full"
  let headerClass = "bg-white/95 border border-slate-200/80 rounded-2xl px-6 py-3.5 flex items-center justify-between shadow-sm backdrop-blur-md"
  let logoBorder = "w-8 h-8 rounded-full overflow-hidden border border-slate-200"
  let titleTextClass = "font-bold text-xs tracking-tight text-slate-900"
  let verifiedBadge = "text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-200/50 rounded-full px-3 py-1 uppercase tracking-wider"
  let mainContainer = "max-w-4xl mx-auto px-6 mt-16 space-y-20 relative z-10"
  let heroBadge = "inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-[10px] text-blue-600 font-semibold uppercase tracking-wider"
  let heroTitleClass = "text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight"
  let heroTitleText = "Kreativitas Lokal dengan "
  let heroTitleHighlightClass = "text-blue-600"
  let heroTitleHighlightText = "Standar Internasional."
  let heroTitleEnd = ""
  let heroDesc = "Menghubungkan pembeli retail dengan produk kriya, kuliner, dan komoditas kerajinan tangan lokal pilihan terkurasi."
  let buttonPrimaryClass = "inline-flex items-center gap-2 px-7 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm shadow-blue-500/10 cursor-pointer"
  
  let sectionCardClass = "bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm space-y-6"
  let sectionTitleClass = "text-xs font-extrabold uppercase tracking-widest text-slate-400"
  let sectionDescClass = "text-xs md:text-sm leading-relaxed text-slate-700 whitespace-pre-line"
  
  let infoCardLinkClass = "flex items-center gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-200/40 hover:border-blue-400/35 transition-all hover:bg-slate-100/50"
  let infoCardIconClass = "w-5 h-5 text-blue-600"
  let infoCardLabelClass = "block text-[8px] uppercase text-slate-500 font-bold"
  let infoCardValClass = "font-bold text-slate-800"
  
  let bentoCardClass = "bg-white border border-slate-200/80 rounded-2xl p-6 hover:border-blue-400/20 transition-all flex items-start gap-4 shadow-sm"
  let bentoIconContainer = "p-2.5 rounded-lg bg-blue-50 text-blue-600 shrink-0"
  let bentoTitleClass = "text-xs font-bold text-slate-900 mb-1"
  let bentoDescClass = "text-[11px] text-slate-500 leading-relaxed"
  
  let productHeaderBorder = "flex justify-between items-end pb-3 border-b border-slate-200"
  let productHeaderSubClass = "text-[9px] font-bold text-blue-600 uppercase tracking-widest block font-geist"
  let productHeaderTitleClass = "text-sm font-bold text-slate-950 uppercase tracking-wider mt-1"
  let productHeaderCountClass = "text-[10px] text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full"
  
  let productEmptyClass = "p-12 text-center border border-slate-200 bg-white rounded-2xl text-xs text-slate-500 shadow-sm"
  let productGridClass = "grid grid-cols-1 md:grid-cols-2 gap-6"
  let productCardClass = "group bg-white border border-slate-200/80 rounded-2xl p-5 hover:border-blue-500/30 transition-all duration-300 flex flex-col justify-between shadow-sm hover:shadow-md"
  let productImgContainer = "aspect-[16/10] w-full rounded-xl overflow-hidden mb-4 border border-slate-100 relative bg-slate-50"
  let productCategoryBadge = "text-[8px] font-bold tracking-wider text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded border border-blue-100"
  let productTitleClass = "text-xs font-bold text-slate-900 mt-3 group-hover:text-blue-600 transition-colors line-clamp-1"
  let productDescClass = "text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed"
  let productFooterBorder = "flex justify-between items-center mt-5 pt-3.5 border-t border-slate-100"
  let productPriceClass = "text-xs font-bold text-slate-900"
  let productButtonClass = "px-4 py-2 bg-slate-50 group-hover:bg-blue-600 text-slate-700 group-hover:text-white text-[10px] font-bold uppercase rounded-lg border border-slate-200/80 group-hover:border-transparent transition-all shadow-sm"
  
  let mapCardClass = "bg-white border border-slate-200/80 p-6 rounded-2xl space-y-4 shadow-sm"
  let mapHeaderSubClass = "text-[9px] font-bold text-slate-400 uppercase tracking-widest block"
  let mapHeaderTitleClass = "text-xs font-bold text-slate-900 mt-1"
  let mapDistanceBadge = "bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-bold px-3 py-1 rounded-full"
  let mapRadarContainer = "relative aspect-[21/9] rounded-xl bg-slate-950 border border-slate-900 overflow-hidden flex items-center justify-center"
  let mapRadarGlowClass = "absolute w-52 h-52 rounded-full border border-blue-500/5 animate-pulse"
  let mapRadarBorderClass = "absolute w-32 h-32 rounded-full border border-blue-500/10"
  let mapRadarSweeper = "absolute w-[2px] h-1/2 bg-gradient-to-b from-blue-500 to-transparent origin-bottom animate-[spin_8s_linear_infinite] pointer-events-none"
  let mapMerchantLogoBorder = "w-8 h-8 rounded-full border-2 border-blue-500 overflow-hidden bg-white shadow-md"
  let mapMerchantBadge = "bg-slate-950 border border-white/10 px-3 py-1 rounded text-center shadow-lg"
  let mapMerchantText = "text-[9px] font-bold text-blue-400"
  
  let faqHeaderTitle = "text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-200"
  let faqCardClass = "border border-slate-200 bg-white rounded-2xl overflow-hidden shadow-sm"
  let faqButtonClass = "w-full p-4.5 text-left text-xs font-bold text-slate-900 flex justify-between items-center hover:bg-slate-50 transition-colors"
  let faqAnswerClass = "px-5 pb-5 text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-3"
  
  let ctaCardClass = "p-8 md:p-10 rounded-2xl border border-slate-200 text-center space-y-6 bg-white shadow-sm"
  let ctaTitleClass = "text-lg font-bold text-slate-900"
  let ctaDescClass = "text-xs text-slate-500 max-w-sm mx-auto leading-relaxed"
  let ctaButtonClass = "inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm shadow-blue-500/10 cursor-pointer"

  if (isGlass) {
    bgClass = "min-h-screen bg-gradient-to-tr from-[#fbf8cc] via-[#ffcfd2] to-[#cfbaf0] text-[#1e1b4b] font-sans selection:bg-purple-200 pb-24 overflow-hidden relative"
    gridBg = <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.45)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-85 z-0" />
    headerContainer = "sticky top-6 z-40 max-w-4xl mx-auto px-4 w-full"
    headerClass = "bg-white/40 border border-white/60 rounded-full px-6 py-3.5 flex items-center justify-between shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] backdrop-blur-md"
    logoBorder = "w-8 h-8 rounded-full overflow-hidden border border-purple-200/50"
    titleTextClass = "font-extrabold text-xs tracking-wide text-purple-950 uppercase"
    verifiedBadge = "text-[9px] font-extrabold text-purple-700 bg-white/60 border border-purple-200/50 rounded-full px-3 py-1 uppercase tracking-wider"
    mainContainer = "max-w-4xl mx-auto px-6 mt-20 space-y-20 relative z-10"
    heroBadge = "inline-flex items-center gap-1.5 px-4.5 py-1 bg-white/50 border border-white/80 rounded-full text-[10px] text-purple-700 font-bold uppercase tracking-wider backdrop-blur-sm"
    heroTitleClass = "text-4xl md:text-5xl font-black tracking-tight text-purple-950 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-800 to-indigo-900"
    heroTitleText = "Kreativitas Lokal dengan "
    heroTitleHighlightClass = "text-purple-700 font-extrabold"
    heroTitleHighlightText = "Sentuhan Estetik."
    heroTitleEnd = ""
    heroDesc = "Frosted glass aesthetic connecting boutique makers and curators with retail customers worldwide."
    buttonPrimaryClass = "inline-flex items-center gap-2 px-7 py-3 bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs uppercase tracking-wider rounded-full transition-all shadow-lg shadow-purple-500/15 hover:shadow-purple-500/25 cursor-pointer"
    
    sectionCardClass = "bg-white/45 border border-white/60 rounded-3xl p-8 shadow-xl shadow-purple-950/5 backdrop-blur-md space-y-6"
    sectionTitleClass = "text-xs font-extrabold uppercase tracking-widest text-purple-800"
    sectionDescClass = "text-xs md:text-sm leading-relaxed text-indigo-950 font-medium whitespace-pre-line"
    
    infoCardLinkClass = "flex items-center gap-3.5 p-4 rounded-2xl bg-white/30 border border-white/45 hover:border-purple-400/50 transition-all hover:bg-white/55"
    infoCardIconClass = "w-5 h-5 text-purple-700"
    infoCardLabelClass = "block text-[8px] uppercase text-purple-800 font-extrabold"
    infoCardValClass = "font-extrabold text-indigo-950"
    
    bentoCardClass = "bg-white/45 border border-white/60 rounded-3xl p-6 hover:border-purple-400/30 transition-all flex items-start gap-4 shadow-md backdrop-blur-md"
    bentoIconContainer = "p-2.5 rounded-xl bg-purple-100/70 text-purple-700 border border-purple-200/40 shrink-0"
    bentoTitleClass = "text-xs font-extrabold text-purple-950 mb-1"
    bentoDescClass = "text-[11px] text-indigo-950/75 leading-relaxed"
    
    productHeaderBorder = "flex justify-between items-end pb-3 border-b border-white/60"
    productHeaderSubClass = "text-[9px] font-extrabold text-purple-700 uppercase tracking-widest block"
    productHeaderTitleClass = "text-sm font-black text-purple-950 uppercase tracking-widest mt-1"
    productHeaderCountClass = "text-[10px] text-purple-950 bg-white/50 border border-white/85 px-3 py-1 rounded-full font-bold"
    
    productEmptyClass = "p-12 text-center border border-white/60 bg-white/40 rounded-3xl text-xs text-purple-950/70 shadow-lg backdrop-blur-sm"
    productCardClass = "group bg-white/45 border border-white/60 rounded-3xl p-5 hover:border-purple-500/50 hover:bg-white/55 transition-all duration-300 flex flex-col justify-between shadow-md hover:shadow-xl backdrop-blur-sm"
    productImgContainer = "aspect-[16/10] w-full rounded-2xl overflow-hidden mb-4 border border-white/40 relative bg-purple-50/50"
    productCategoryBadge = "text-[8px] font-extrabold tracking-wider text-purple-700 uppercase bg-white/80 px-2 py-0.5 rounded-full border border-purple-200/40"
    productTitleClass = "text-xs font-extrabold text-purple-950 mt-3 group-hover:text-purple-700 transition-colors line-clamp-1"
    productDescClass = "text-[11px] text-indigo-950/70 mt-1 line-clamp-2 leading-relaxed"
    productFooterBorder = "flex justify-between items-center mt-5 pt-3.5 border-t border-white/45"
    productPriceClass = "text-xs font-extrabold text-purple-950"
    productButtonClass = "px-4 py-2 bg-white/50 group-hover:bg-purple-700 text-purple-950 group-hover:text-white text-[10px] font-bold uppercase rounded-full border border-white/60 group-hover:border-transparent transition-all shadow-sm"
    
    mapCardClass = "bg-white/45 border border-white/60 p-6 rounded-3xl space-y-4 shadow-lg backdrop-blur-sm"
    mapHeaderSubClass = "text-[9px] font-extrabold text-purple-800 uppercase tracking-widest block"
    mapHeaderTitleClass = "text-xs font-extrabold text-purple-950 mt-1"
    mapDistanceBadge = "bg-white/50 border border-white/80 text-purple-700 text-[10px] font-bold px-3 py-1 rounded-full"
    mapRadarContainer = "relative aspect-[21/9] rounded-2xl bg-slate-950 border border-slate-900 overflow-hidden flex items-center justify-center shadow-inner"
    mapRadarGlowClass = "absolute w-52 h-52 rounded-full border border-purple-500/10 animate-pulse"
    mapRadarBorderClass = "absolute w-32 h-32 rounded-full border border-purple-500/15"
    mapRadarSweeper = "absolute w-[2px] h-1/2 bg-gradient-to-b from-purple-500 to-transparent origin-bottom animate-[spin_8s_linear_infinite] pointer-events-none"
    mapMerchantLogoBorder = "w-8 h-8 rounded-full border-2 border-purple-500 overflow-hidden bg-white shadow-md"
    mapMerchantBadge = "bg-slate-950 border border-white/10 px-3 py-1 rounded text-center shadow-lg"
    mapMerchantText = "text-[9px] font-bold text-purple-400"
    
    faqHeaderTitle = "text-xs font-extrabold text-purple-950 uppercase tracking-widest pb-2 border-b border-white/60"
    faqCardClass = "border border-white/60 bg-white/40 rounded-2xl overflow-hidden shadow-md backdrop-blur-sm"
    faqButtonClass = "w-full p-4.5 text-left text-xs font-extrabold text-purple-950 flex justify-between items-center hover:bg-white/40 transition-colors"
    faqAnswerClass = "px-5 pb-5 text-xs text-indigo-950/70 leading-relaxed border-t border-white/40 pt-3"
    
    ctaCardClass = "p-8 md:p-10 rounded-3xl border border-white/60 text-center space-y-6 bg-white/40 shadow-lg backdrop-blur-sm"
    ctaTitleClass = "text-lg font-extrabold text-purple-950"
    ctaDescClass = "text-xs text-indigo-950/70 max-w-sm mx-auto leading-relaxed"
    ctaButtonClass = "inline-flex items-center gap-2 px-8 py-3.5 bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs uppercase tracking-wider rounded-full transition-all shadow-lg shadow-purple-500/15 hover:shadow-purple-500/25 cursor-pointer"
  } else if (isStudio) {
    bgClass = "min-h-screen bg-[#f5ebe0] text-[#4a3728] font-serif selection:bg-[#d5bdaf]/50 pb-24 overflow-hidden relative"
    gridBg = <div className="absolute inset-0 bg-[radial-gradient(#e3d5ca_1.5px,transparent_1.5px)] bg-[size:20px_20px] pointer-events-none opacity-40 z-0" />
    headerContainer = "sticky top-0 z-40 max-w-4xl mx-auto w-full"
    headerClass = "bg-[#f5ebe0]/90 border-b border-[#e3d5ca] px-6 py-4 flex items-center justify-between shadow-none backdrop-blur-sm"
    logoBorder = "w-8 h-8 rounded-full overflow-hidden border border-[#d5bdaf]"
    titleTextClass = "font-bold text-sm tracking-tight text-[#4a3728]"
    verifiedBadge = "text-[9px] font-bold text-[#8c7851] bg-[#e3d5ca]/50 border border-[#d5bdaf]/85 rounded px-2.5 py-1 uppercase tracking-wider"
    mainContainer = "max-w-4xl mx-auto px-6 mt-12 space-y-20 relative z-10"
    heroBadge = "inline-flex items-center gap-1.5 px-3 py-1 bg-[#d5bdaf]/40 border border-[#d5bdaf] text-[10px] text-[#4a3728] font-bold uppercase tracking-wider"
    heroTitleClass = "text-4xl md:text-5xl font-serif font-normal text-[#3d2e23] leading-tight"
    heroTitleText = "Kreativitas Lokal dengan "
    heroTitleHighlightClass = "text-[#8c7851] font-semibold italic"
    heroTitleHighlightText = "Sentuhan Tradisi."
    heroTitleEnd = ""
    heroDesc = "Warm organic aesthetics showcasing handcrafted goods, culinary heritage, and bespoke local creations."
    buttonPrimaryClass = "inline-flex items-center gap-2 px-7 py-3 bg-[#4a3728] hover:bg-[#3d2e23] text-[#f5ebe0] font-serif text-xs rounded transition-all cursor-pointer"
    
    sectionCardClass = "bg-[#e3d5ca]/30 border border-[#e3d5ca] rounded-none p-8 space-y-6"
    sectionTitleClass = "text-xs font-bold uppercase tracking-widest text-[#8c7851]"
    sectionDescClass = "text-xs md:text-sm leading-relaxed text-[#4a3728] whitespace-pre-line"
    
    infoCardLinkClass = "flex items-center gap-3.5 p-4 bg-[#e3d5ca]/20 border border-[#e3d5ca] hover:border-[#8c7851] transition-all hover:bg-[#e3d5ca]/40"
    infoCardIconClass = "w-5 h-5 text-[#8c7851]"
    infoCardLabelClass = "block text-[8px] uppercase text-[#8c7851] font-bold"
    infoCardValClass = "text-[#4a3728]"
    
    bentoCardClass = "bg-[#e3d5ca]/20 border border-[#e3d5ca] rounded-none p-6 hover:border-[#8c7851]/50 transition-all flex items-start gap-4"
    bentoIconContainer = "p-2.5 rounded-none bg-[#e3d5ca]/50 text-[#4a3728] shrink-0"
    bentoTitleClass = "text-xs font-bold text-[#4a3728] mb-1"
    bentoDescClass = "text-[11px] text-[#5c4a3c] leading-relaxed"
    
    productHeaderBorder = "flex justify-between items-end pb-3 border-b border-[#e3d5ca]"
    productHeaderSubClass = "text-[9px] font-bold text-[#8c7851] uppercase tracking-widest block"
    productHeaderTitleClass = "text-sm font-bold text-[#4a3728] uppercase tracking-wider mt-1"
    productHeaderCountClass = "text-[10px] text-[#4a3728] bg-[#e3d5ca]/30 border border-[#e3d5ca] px-3 py-1 rounded-none"
    
    productEmptyClass = "p-12 text-center border border-[#e3d5ca] bg-[#e3d5ca]/10 rounded-none text-xs text-[#5c4a3c]"
    productCardClass = "group bg-[#e3d5ca]/30 border border-[#e3d5ca] rounded-none p-5 hover:border-[#8c7851] transition-all duration-300 flex flex-col justify-between"
    productImgContainer = "aspect-[16/10] w-full rounded-none overflow-hidden mb-4 border border-[#e3d5ca] relative bg-[#e3d5ca]/10"
    productCategoryBadge = "text-[8px] font-bold tracking-wider text-[#8c7851] uppercase bg-[#e3d5ca]/50 px-2 py-0.5 rounded-none border border-[#e3d5ca]"
    productTitleClass = "text-xs font-bold text-[#4a3728] mt-3 group-hover:text-[#8c7851] transition-colors line-clamp-1"
    productDescClass = "text-[11px] text-[#5c4a3c] mt-1 line-clamp-2 leading-relaxed"
    productFooterBorder = "flex justify-between items-center mt-5 pt-3.5 border-t border-[#e3d5ca]"
    productPriceClass = "text-xs font-bold text-[#4a3728]"
    productButtonClass = "px-4 py-2 bg-[#e3d5ca]/50 group-hover:bg-[#4a3728] text-[#4a3728] group-hover:text-[#f5ebe0] text-[10px] font-bold uppercase rounded-none border border-[#e3d5ca] group-hover:border-transparent transition-all"
    
    mapCardClass = "bg-[#e3d5ca]/30 border border-[#e3d5ca] p-6 rounded-none space-y-4"
    mapHeaderSubClass = "text-[9px] font-bold text-[#8c7851] uppercase tracking-widest block"
    mapHeaderTitleClass = "text-xs font-bold text-[#4a3728] mt-1"
    mapDistanceBadge = "bg-[#e3d5ca]/50 border border-[#d5bdaf] text-[#4a3728] text-[10px] font-bold px-3 py-1 rounded-none"
    mapRadarContainer = "relative aspect-[21/9] rounded-none bg-slate-950 border border-slate-900 overflow-hidden flex items-center justify-center"
    mapRadarGlowClass = "absolute w-52 h-52 rounded-full border border-amber-500/5 animate-pulse"
    mapRadarBorderClass = "absolute w-32 h-32 rounded-full border border-amber-500/10"
    mapRadarSweeper = "absolute w-[2px] h-1/2 bg-gradient-to-b from-[#8c7851] to-transparent origin-bottom animate-[spin_8s_linear_infinite] pointer-events-none"
    mapMerchantLogoBorder = "w-8 h-8 rounded-full border-2 border-[#8c7851] overflow-hidden bg-white shadow-md"
    mapMerchantBadge = "bg-slate-950 border border-white/10 px-3 py-1 rounded text-center shadow-lg"
    mapMerchantText = "text-[9px] font-bold text-amber-400"
    
    faqHeaderTitle = "text-xs font-bold text-[#4a3728] uppercase tracking-wider pb-2 border-b border-[#e3d5ca]"
    faqCardClass = "border border-[#e3d5ca] bg-[#e3d5ca]/20 rounded-none overflow-hidden"
    faqButtonClass = "w-full p-4.5 text-left text-xs font-bold text-[#4a3728] flex justify-between items-center hover:bg-[#e3d5ca]/40 transition-colors"
    faqAnswerClass = "px-5 pb-5 text-xs text-[#5c4a3c] leading-relaxed border-t border-[#e3d5ca] pt-3"
    
    ctaCardClass = "p-8 md:p-10 border border-[#e3d5ca] text-center space-y-6 bg-[#e3d5ca]/20 rounded-none"
    ctaTitleClass = "text-lg font-bold text-[#4a3728]"
    ctaDescClass = "text-xs text-[#5c4a3c] max-w-sm mx-auto leading-relaxed"
    ctaButtonClass = "inline-flex items-center gap-2 px-8 py-3.5 bg-[#4a3728] hover:bg-[#3d2e23] text-[#f5ebe0] font-serif text-xs rounded transition-all cursor-pointer"
  }

  return (
    <div className={bgClass}>
      {gridBg}

      {/* Floating White Header */}
      <header className={headerContainer}>
        <div className={headerClass}>
          <div className="flex items-center gap-3">
            <div className={logoBorder}>
              <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className={titleTextClass}>
              {config.title || user.name}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <span className={verifiedBadge}>
              {user.membershipLevel} Verified
            </span>
            {badges && badges.map((b: any) => (
              <span key={b.id} title={b.desc} className={`px-2 py-0.5 rounded text-[8px] font-geist font-bold border uppercase tracking-wider ${b.color}`}>
                {b.label}
              </span>
            ))}
            <UserQRCode
              userId={user.id}
              userName={user.name}
              accentColor={isGlass ? '#0ea5e9' : isStudio ? '#8c7851' : '#6366f1'}
              qrDarkColor="#1e1b4b"
              qrLightColor="#f8fafc"
              variant="icon-only"
            />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className={mainContainer}>
        
        {/* HERO SECTION */}
        <section className="text-center space-y-6">
          <div className={heroBadge}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Saloka.id Partner Usaha</span>
          </div>

          <h1 className={heroTitleClass}>
            {heroTitleText}<span className={heroTitleHighlightClass}>{heroTitleHighlightText}</span>{heroTitleEnd}
          </h1>

          <p className={heroDesc}>
            {config.bio ? config.bio.split('\n')[0] : 'Menghubungkan pembeli retail dengan produk kriya, kuliner, dan komoditas kerajinan tangan lokal pilihan terkurasi.'}
          </p>

          <div className="pt-2">
            <a
              href="#products"
              className={buttonPrimaryClass}
            >
              Lihat Katalog Produk
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </section>

        {/* BIO / ABOUT */}
        <section className={sectionCardClass}>
          <h3 className={sectionTitleClass}>
            Tentang Usaha
          </h3>
          <p className={sectionDescClass}>
            {config.bio || 'Kami menyajikan kurasi produk berkualitas tinggi yang dikerjakan dengan penuh dedikasi oleh pengrajin lokal profesional.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-slate-100 text-xs">
            {config.phone && (
              <a 
                href={`https://wa.me/${config.phone}`}
                target="_blank"
                rel="noopener noreferrer"
                className={infoCardLinkClass}
              >
                <Phone className={infoCardIconClass} />
                <div>
                  <span className={infoCardLabelClass}>WhatsApp Admin</span>
                  <span className={infoCardValClass}>{config.phone}</span>
                </div>
              </a>
            )}
            {config.instagram && (
              <a 
                href={`https://instagram.com/${config.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className={infoCardLinkClass}
              >
                <Instagram className={infoCardIconClass} />
                <div>
                  <span className={infoCardLabelClass}>Instagram Merek</span>
                  <span className={infoCardValClass}>{config.instagram}</span>
                </div>
              </a>
            )}
          </div>
          
          {badges && badges.length > 0 && (
            <div className="pt-6 border-t border-slate-100 space-y-4">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sertifikasi & Prestasi</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {badges.map((b: any) => (
                  <div key={b.id} className="flex items-center gap-3 p-3 bg-slate-50/50 border border-slate-100 rounded-lg">
                    <span className="text-lg">{b.id.includes('admin') ? '🛡️' : b.id.includes('merchant') ? '⭐' : b.id.includes('graduate') ? '🎓' : '⚡'}</span>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-700">{b.label}</span>
                      <span className="block text-[9px] text-slate-400 mt-0.5">{b.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* BENTO FEATURES */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={bentoCardClass}>
            <div className={bentoIconContainer}>
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className={bentoTitleClass}>Standard Kualitas Audit</h4>
              <p className={bentoDescClass}>
                Menjamin mutu produk eceran dan logistik bersertifikasi yang terintegrasi dengan ekosistem digital Saloka.id.
              </p>
            </div>
          </div>

          <div className={bentoCardClass}>
            <div className={bentoIconContainer}>
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className={bentoTitleClass}>Pemesanan Kustom Instan</h4>
              <p className={bentoDescClass}>
                Tersambung langsung dengan admin pemesanan kustomisasi/grosir untuk mendukung kebutuhan operasional bisnis Anda.
              </p>
            </div>
          </div>
        </section>

        {/* PRODUCTS SECTION */}
        <section id="products" className="space-y-6">
          <div className={productHeaderBorder}>
            <div>
              <span className={productHeaderSubClass}>Katalog Resmi</span>
              <h3 className={productHeaderTitleClass}>Daftar Produk Usaha</h3>
            </div>
            <span className={productHeaderCountClass}>
              {products.length} Item
            </span>
          </div>

          {products.length === 0 ? (
            <div className={productEmptyClass}>
              Belum ada produk yang dipublikasikan.
            </div>
          ) : (
            <div className={productGridClass}>
              {products.map((p: any) => (
                <div 
                  key={p.id}
                  className={productCardClass}
                >
                  <div>
                    {p.imageUrl && (
                      <div className={productImgContainer}>
                        <img src={p.imageUrl} alt={p.title} className="object-cover w-full h-full group-hover:scale-103 transition-transform duration-500" />
                      </div>
                    )}
                    <span className={productCategoryBadge}>
                      {p.category}
                    </span>
                    <h4 className={productTitleClass}>{p.title}</h4>
                    <p className={productDescClass}>{p.description}</p>
                  </div>

                  <div className={productFooterBorder}>
                    <span className={productPriceClass}>
                      Rp {p.price.toLocaleString('id-ID')}
                    </span>
                    <a 
                      href={`/market/product/${p.id}`}
                      className={productButtonClass}
                    >
                      Beli / Detail
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* MAP & GEOLOCATION */}
        {user.latitude && user.longitude && (
          <section className={mapCardClass}>
            <div className="flex justify-between items-center">
              <div>
                <span className={mapHeaderSubClass}>
                  {user.role === 'MERCHANT' ? 'Lokasi Toko' : 'Lokasi Pengguna'}
                </span>
                <h4 className={mapHeaderTitleClass}>Titik GPS Koordinat Usaha</h4>
              </div>
              {distance !== null && (
                <span className={mapDistanceBadge}>
                  Jarak: {distance.toFixed(1)} km dari Anda
                </span>
              )}
            </div>

            {/* Radar layout light theme */}
            <div className={mapRadarContainer}>
              <div className={mapRadarGlowClass} />
              <div className={mapRadarBorderClass} />
              <div className="absolute w-full h-[1px] bg-white/5" />
              <div className="absolute h-full w-[1px] bg-white/5" />
              <div className={mapRadarSweeper} />

              <div className="absolute z-10 flex flex-col items-center gap-2">
                <div className={mapMerchantLogoBorder}>
                  <img src={logoUrl} alt="merchant" className="w-full h-full object-cover" />
                </div>
                <div className={mapMerchantBadge}>
                  <span className={mapMerchantText}>{config.locationName || 'Jakarta'}</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* FAQ ACCORDION */}
        <section className="space-y-4">
          <h3 className={faqHeaderTitle}>
            Pertanyaan Umum
          </h3>
          <div className="space-y-3">
            {[
              { q: 'Bagaimana cara membeli produk/jasa merchant ini?', a: 'Anda dapat mengklik tombol "Beli / Detail" di atas untuk diarahkan ke etalase checkout marketplace, atau klik tombol chat WhatsApp di bawah untuk konsultasi langsung.' },
              { q: 'Apakah ada minimal pemesanan?', a: 'Tidak ada minimal pemesanan untuk eceran. Namun untuk pemesanan grosir/custom corporate, kami menawarkan harga khusus.' }
            ].map((faq, i) => (
              <div key={i} className={faqCardClass}>
                <button
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className={faqButtonClass}
                >
                  <span>{faq.q}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {activeFaq === i && (
                  <p className={faqAnswerClass}>
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CTA AREA */}
        <section className={ctaCardClass}>
          <div className="space-y-2">
            <h3 className={ctaTitleClass}>Mulai Hubungi Kami</h3>
            <p className={ctaDescClass}>
              Konsultasikan pemesanan kustomisasi logistik produk Anda langsung ke saluran representasi WhatsApp resmi kami.
            </p>
          </div>
          <a
            href={`https://wa.me/${config.phone || ''}`}
            target="_blank"
            rel="noopener noreferrer"
            className={ctaButtonClass}
          >
            Hubungi via WhatsApp
          </a>
        </section>

        {/* GALLERY SECTION */}
        {config.galleryItems && config.galleryItems.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="block text-[9px] font-bold text-blue-600 uppercase tracking-widest mb-1">Portfolio</span>
                <h3 className="text-lg font-bold text-slate-900">{config.galleryTitle || 'Galeri Foto Kami'}</h3>
              </div>
              <span className="text-[9px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">{config.galleryItems.length} Foto</span>
            </div>
            {config.galleryDesc && <p className="text-sm text-slate-600 leading-relaxed">{config.galleryDesc}</p>}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {config.galleryItems.map((item: any) => (
                <div key={item.id} className="border border-slate-200 rounded-2xl overflow-hidden group hover:shadow-md transition-shadow bg-white">
                  <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
                    {item.imageUrl
                      ? <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      : <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">No Image</div>
                    }
                  </div>
                  <div className="p-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{item.title}</h4>
                    {item.description && <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{item.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* BRANDED FOOTER */}
        <section className="border-t border-slate-200 pt-12 space-y-8">
          <div className="flex flex-col md:flex-row justify-between gap-8 items-start">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200">
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                </div>
                <span className="font-bold text-sm text-slate-900">{config.footerText || config.title || user.name}</span>
              </div>
              {(config.footerTagline || config.bio) && (
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed">{config.footerTagline || config.bio}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Hubungi Kami</span>
              {config.phone && <a href={`https://wa.me/${config.phone}`} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-green-600 hover:text-green-500 transition-colors">📱 {config.phone}</a>}
              {config.instagram && <a href={`https://instagram.com/${config.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-pink-600 hover:text-pink-500 transition-colors">📸 @{config.instagram.replace('@', '')}</a>}
            </div>
          </div>
          <p className="text-[10px] text-slate-400 border-t border-slate-100 pt-6 text-center">
            {config.footerCopyright || `© ${new Date().getFullYear()} ${config.footerText || config.title || user.name}. All Rights Reserved.`}
          </p>
        </section>

      </main>
    </div>
  )
}
