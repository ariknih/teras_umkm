'use client'

import React, { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  getCustomAffiliateLinks,
  createCustomAffiliateLink,
  upgradeMembershipAccess,
  getAffiliateLeaderboard,
  getAffiliateDownline,
  getReminders
} from '../actions/affiliate-extra'
import {
  updateUserLandingPage,
  getCurrentUserProfile
} from '../actions/auth'
import { getWalletDetails, getAffiliateStats } from '../actions/wallet-affiliate'
import { getProducts } from '../actions/products'

interface Referral {
  id: string
  buyer: {
    name: string
    email: string
  } | null
  amount: number
  status: string
  createdAt: string | Date
}

interface AffiliateStats {
  referrals: Referral[]
  totalEarnings: number
  commissionByTier: {
    tier1: number
    tier2: number
    tier3: number
  }
  clicksCount: number
  customLinks: any[]
  trafficSources: Record<string, number>
}

interface Product {
  id: string
  title: string
  price: number
}

interface DownlineNodeProps {
  node: any
  depth: number
}

function DownlineNode({ node, depth = 1 }: DownlineNodeProps) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="pl-4 border-l border-primary/20 mt-3 font-geist">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-surface-container/30 border border-border-subtle rounded hover:border-primary/20 transition-all">
        <div className="flex items-center gap-3">
          <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
            depth === 1 ? 'bg-primary/25 text-primary border border-primary/30' :
            depth === 2 ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
            'bg-pink-500/10 text-pink-400 border border-pink-500/20'
          }`}>
            Tier {depth}
          </span>
          <div>
            <span className="text-xs font-bold text-text-primary block">{node.name}</span>
            <span className="text-[10px] text-text-secondary block">{node.email}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 justify-between sm:justify-start">
          <span className="text-[9px] px-2 py-0.5 bg-white/5 border border-white/10 rounded uppercase font-bold text-text-secondary">
            Lv {node.level} {node.membershipLevel} ({node.membershipAccess})
          </span>
          {node.children && node.children.length > 0 && (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 text-text-secondary hover:text-primary transition-colors text-xs"
            >
              {isOpen ? '▼' : '►'}
            </button>
          )}
        </div>
      </div>
      {isOpen && node.children && node.children.length > 0 && (
        <div className="space-y-1">
          {node.children.map((child: any) => (
            <DownlineNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

const TEMPLATE_OPTIONS = [
  { 
    id: 'minimal-noir', 
    name: 'Minimal Noir', 
    desc: 'Serba hitam minimalis', 
    bg: 'bg-black text-white', 
    accent: 'bg-white text-black border border-neutral-700',
    fontFamily: 'font-mono',
    borderClass: 'border-neutral-800 bg-neutral-950/30',
    accentClass: 'bg-white text-black hover:bg-neutral-200 border border-neutral-700'
  },
  { 
    id: 'clean-professional', 
    name: 'Clean Professional', 
    desc: 'Biru & abu korporat', 
    bg: 'bg-slate-900 text-slate-100', 
    accent: 'bg-blue-600 text-white',
    fontFamily: 'font-sans',
    borderClass: 'border-slate-800 bg-slate-950/40',
    accentClass: 'bg-blue-600 text-white hover:bg-blue-500'
  },
  { 
    id: 'modern-gold', 
    name: 'Modern Gold', 
    desc: 'Hitam arang & aksen emas', 
    bg: 'bg-neutral-950 text-neutral-100', 
    accent: 'bg-amber-500 text-black',
    fontFamily: 'font-serif',
    borderClass: 'border-amber-500/20 bg-amber-950/5',
    accentClass: 'bg-amber-500 text-black hover:bg-amber-400'
  },
  { 
    id: 'creative-bold', 
    name: 'Creative Bold', 
    desc: 'Gradasi ungu-indigo', 
    bg: 'bg-gradient-to-tr from-purple-950 via-neutral-950 to-indigo-950 text-neutral-100', 
    accent: 'bg-purple-600 text-white shadow-purple-500/20',
    fontFamily: 'font-sans',
    borderClass: 'border-purple-500/20 bg-purple-950/20',
    accentClass: 'bg-purple-600 text-white hover:bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
  },
  { 
    id: 'cyberpunk-dark', 
    name: 'Cyberpunk Dark', 
    desc: 'Neon cyan terminal', 
    bg: 'bg-neutral-950 text-cyan-400 border border-cyan-500/20', 
    accent: 'bg-cyan-500 text-black',
    fontFamily: 'font-mono',
    borderClass: 'border-cyan-500/30 bg-cyan-950/5 shadow-[0_0_10px_rgba(6,182,212,0.1)]',
    accentClass: 'bg-cyan-500 text-black hover:bg-cyan-400 font-bold'
  },
  { 
    id: 'sunset-gradient', 
    name: 'Sunset Gradient', 
    desc: 'Gradasi senja rose-amber', 
    bg: 'bg-gradient-to-br from-amber-950 via-stone-900 to-rose-950 text-orange-100', 
    accent: 'bg-gradient-to-r from-amber-500 to-rose-500 text-white rounded-full',
    fontFamily: 'font-sans',
    borderClass: 'border-orange-500/20 bg-orange-950/20',
    accentClass: 'bg-gradient-to-r from-amber-500 to-rose-500 text-white hover:from-amber-400 hover:to-rose-400 font-bold rounded-full'
  },
  { 
    id: 'emerald-garden', 
    name: 'Emerald Garden', 
    desc: 'Hijau hutan organik', 
    bg: 'bg-gradient-to-tr from-emerald-950 via-zinc-950 to-teal-950 text-emerald-100', 
    accent: 'bg-emerald-600 text-white shadow-emerald-500/20',
    fontFamily: 'font-sans',
    borderClass: 'border-emerald-500/25 bg-emerald-950/10',
    accentClass: 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
  },
  { 
    id: 'retro-synthwave', 
    name: 'Retro Synthwave', 
    desc: 'Fuchsia neon 80-an', 
    bg: 'bg-zinc-950 text-fuchsia-400 border border-fuchsia-500/20', 
    accent: 'bg-fuchsia-600 text-white',
    fontFamily: 'font-mono',
    borderClass: 'border-fuchsia-500/30 bg-fuchsia-950/5 shadow-[0_0_10px_rgba(217,70,239,0.15)]',
    accentClass: 'bg-fuchsia-600 text-white hover:bg-fuchsia-500 font-bold'
  },
  { 
    id: 'alabaster-glass', 
    name: 'Alabaster Glass', 
    desc: 'Frosted putih transparan', 
    bg: 'bg-slate-50 text-slate-900 border border-slate-200', 
    accent: 'bg-slate-900 text-white',
    fontFamily: 'font-sans',
    borderClass: 'border-slate-300 bg-white/60 backdrop-blur-md',
    accentClass: 'bg-slate-900 text-white hover:bg-slate-800 font-bold'
  },
  {
    id: 'studio',
    name: 'Studio Design',
    desc: 'Desain 4: Layout kreatif, margin bulat',
    bg: 'bg-white text-zinc-900',
    accent: 'bg-[#78350f] text-white rounded-3xl',
    fontFamily: 'font-sans',
    borderClass: 'border-zinc-200 bg-zinc-50/50 rounded-3xl',
    accentClass: 'bg-[#78350f] text-white hover:bg-[#854d0e] rounded-3xl font-bold'
  },
  {
    id: 'brutalist',
    name: 'Neo Brutalism',
    desc: 'Desain 5: Aksen tebal, kuning cerah',
    bg: 'bg-[#fffbeb] text-black border-[3px] border-black',
    accent: 'bg-[#f59e0b] text-black border-2 border-black rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]',
    fontFamily: 'font-geist',
    borderClass: 'border-[3px] border-black rounded-none bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
    accentClass: 'bg-[#f59e0b] text-black border-2 border-black hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-black uppercase tracking-wider'
  },
  { 
    id: 'swiss-minimalist', 
    name: 'Swiss Minimalist', 
    desc: 'Desain 1: Swiss grid & border tajam', 
    bg: 'bg-[#F5F1E8] text-black', 
    accent: 'bg-black text-white border border-black rounded-none',
    fontFamily: 'font-sans',
    borderClass: 'border-black bg-white rounded-none',
    accentClass: 'bg-black text-white hover:bg-neutral-800 rounded-none border border-black'
  },
  { 
    id: 'de-stijl', 
    name: 'De Stijl Abstract', 
    desc: 'Desain 2: Grid & aksen warna primer', 
    bg: 'bg-white text-black', 
    accent: 'bg-[#FF0000] text-white border-2 border-black rounded-none',
    fontFamily: 'font-sans',
    borderClass: 'border-[3px] border-black bg-white rounded-none',
    accentClass: 'bg-[#FF0000] text-white hover:bg-[#CC0000] border-[2px] border-black rounded-none font-bold'
  },
  { 
    id: 'hpc-tech', 
    name: 'HPC Performance', 
    desc: 'Desain 3: Tech server, neon merah', 
    bg: 'bg-black text-white', 
    accent: 'bg-[#ED1C24] text-white shadow-red-500/20',
    fontFamily: 'font-sans',
    borderClass: 'border-l-[3px] border-l-[#ED1C24] border-t border-r border-b border-neutral-800 bg-[#333333]/50 rounded-none',
    accentClass: 'bg-[#ED1C24] text-white hover:bg-[#ff3b45] shadow-[0_0_15px_rgba(237,28,36,0.4)] rounded-sm'
  }
]

export default function AffiliatePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') || 'dashboard'

  const [activeTab, setActiveTab] = useState<string>(initialTab)
  const [user, setUser] = useState<any>(null)
  const [wallet, setWallet] = useState<any>(null)
  const [stats, setStats] = useState<AffiliateStats | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [downline, setDownline] = useState<any[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [reminders, setReminders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Custom Links Form State
  const [selectedProductId, setSelectedProductId] = useState('')
  const [customSlug, setCustomSlug] = useState('')
  const [linkSource, setLinkSource] = useState('direct')
  const [linkError, setLinkError] = useState<string | null>(null)
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null)
  const [isCreatingLink, startCreateLink] = useTransition()
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Upgrade State
  const [isUpgrading, startUpgrade] = useTransition()
  const [upgradeError, setUpgradeError] = useState<string | null>(null)
  const [upgradeSuccess, setUpgradeSuccess] = useState<string | null>(null)

  // Customizer Form State
  const [custTemplate, setCustTemplate] = useState('modern-gold')
  const [custTitle, setCustTitle] = useState('')
  const [custBio, setCustBio] = useState('')
  const [custPhone, setCustPhone] = useState('')
  const [custInstagram, setCustInstagram] = useState('')
  const [custSections, setCustSections] = useState<string[]>(['hero', 'profile', 'products', 'map', 'cta'])
  const [custLat, setCustLat] = useState<number | null>(null)
  const [custLng, setCustLng] = useState<number | null>(null)
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'detecting' | 'success' | 'error'>('idle')
  const [custSuccess, setCustSuccess] = useState<string | null>(null)
  const [custError, setCustError] = useState<string | null>(null)
  const [isSavingCust, startSavingCust] = useTransition()

  async function loadData() {
    try {
      const u = await getCurrentUserProfile()
      if (u) {
        setUser(u)
        // Set Customizer defaults
        setCustTemplate(u.landingPageTemplate || 'modern-gold')
        setCustLat(u.latitude || null)
        setCustLng(u.longitude || null)
        if (u.landingPageConfig) {
          try {
            const conf = JSON.parse(u.landingPageConfig)
            setCustTitle(conf.title || u.name)
            setCustBio(conf.bio || '')
            setCustPhone(conf.phone || '')
            setCustInstagram(conf.instagram || '')
            setCustSections(conf.sections || ['hero', 'profile', 'products', 'map', 'cta'])
          } catch (_) {
            setCustTitle(u.name)
          }
        } else {
          setCustTitle(u.name)
          setCustBio(`Selamat datang di halaman personal ${u.name}! Kami menyediakan produk dan jasa terbaik secara lokal.`)
        }

        const w = await getWalletDetails()
        setWallet(w)

        if (u.role === 'AFFILIATE') {
          const s = await getAffiliateStats()
          setStats(s as any)
          
          const list = await getProducts()
          setProducts(list)
          if (list.length > 0) {
            setSelectedProductId(list[0].id)
          }

          const dl = await getAffiliateDownline()
          setDownline(dl)

          const lb = await getAffiliateLeaderboard()
          setLeaderboard(lb)

          const rems = await getReminders()
          setReminders(rems)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleCreateCustomLink = (e: React.FormEvent) => {
    e.preventDefault()
    setLinkError(null)
    setLinkSuccess(null)

    if (!selectedProductId || !customSlug) {
      setLinkError('Mohon isi semua kolom.')
      return
    }

    startCreateLink(async () => {
      const res = await createCustomAffiliateLink(selectedProductId, customSlug, linkSource)
      if (res.error) {
        setLinkError(res.error)
      } else {
        setLinkSuccess('Link affiliate kustom berhasil dibuat!')
        setCustomSlug('')
        setLinkSource('direct')
        // reload stats for updated list
        const s = await getAffiliateStats()
        setStats(s as any)
      }
    })
  }

  const handleUpgrade = (tier: 'Platinum' | 'Diamond') => {
    setUpgradeError(null)
    setUpgradeSuccess(null)

    const cost = tier === 'Platinum' ? 250000 : 500000
    if (!wallet || wallet.balance < cost) {
      setUpgradeError(`Saldo tidak mencukupi. Anda membutuhkan Rp ${cost.toLocaleString('id-ID')} untuk upgrade ke ${tier}.`)
      return
    }

    if (confirm(`Apakah Anda yakin ingin melakukan upgrade ke akses ${tier}? Saldo dompet sebesar Rp ${cost.toLocaleString('id-ID')} akan didebit.`)) {
      startUpgrade(async () => {
        const res = await upgradeMembershipAccess(tier)
        if (res.error) {
          setUpgradeError(res.error)
        } else {
          setUpgradeSuccess(`Selamat! Keanggotaan Anda berhasil di-upgrade ke akses ${tier}.`)
          await loadData()
          router.refresh()
        }
      })
    }
  }

  const getGpsCoords = () => {
    if (!navigator.geolocation) {
      setGpsStatus('error')
      setCustError('Geolokasi tidak didukung oleh browser ini.')
      return
    }

    setGpsStatus('detecting')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCustLat(pos.coords.latitude)
        setCustLng(pos.coords.longitude)
        setGpsStatus('success')
        setCustSuccess(`Koordinat GPS berhasil diperoleh: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`)
      },
      (err) => {
        console.error(err)
        setGpsStatus('error')
        setCustError('Gagal mendapatkan lokasi. Pastikan izin lokasi aktif.')
      },
      { enableHighAccuracy: true }
    )
  }

  const handleSaveCustomizer = (e: React.FormEvent) => {
    e.preventDefault()
    setCustSuccess(null)
    setCustError(null)

    if (!custTitle || !custBio) {
      setCustError('Judul dan Bio Landing Page wajib diisi.')
      return
    }

    startSavingCust(async () => {
      const configStr = JSON.stringify({
        title: custTitle,
        bio: custBio,
        phone: custPhone,
        instagram: custInstagram,
        sections: custSections
      })

      const res = await updateUserLandingPage(
        custTemplate,
        configStr,
        custLat || undefined,
        custLng || undefined
      )

      if (res.error) {
        setCustError(res.error)
      } else {
        setCustSuccess('Landing Page Anda berhasil diperbarui dan dipublikasikan!')
        await loadData()
        router.refresh()
      }
    })
  }

  const toggleSection = (sec: string) => {
    setCustSections(prev =>
      prev.includes(sec) ? prev.filter(s => s !== sec) : [...prev, sec]
    )
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-bg-dark">
        <span className="text-xs font-geist font-bold text-primary tracking-widest uppercase animate-pulse">
          Memuat Ledger Afiliasi Premium...
        </span>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center bg-bg-dark py-12 px-6">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(198,169,107,0.06)_0%,transparent_65%)] pointer-events-none z-0" />
        <div className="relative z-10 w-full max-w-md text-center border border-border-subtle bg-surface-dark glow-card p-8 rounded-lg">
          <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0V10.5m-2.25 13.5h13.5c.621 0 1.125-.504 1.125-1.125V11.25c0-.621-.504-1.125-1.125-1.125H4.25c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125Z" />
            </svg>
          </div>
          <h2 className="font-sora text-2xl font-bold text-text-primary mb-3">Akses Portal Terbatas</h2>
          <p className="text-xs text-text-secondary leading-relaxed mb-8">
            Silakan masuk dengan akun Anda untuk mengelola portal pemasaran affiliate dan membership.
          </p>
          <Link
            id="aff-login-btn"
            href="/auth"
            className="w-full py-4 bg-primary hover:bg-primary-container text-surface-dark font-geist font-bold text-xs uppercase tracking-wider rounded transition-colors inline-block"
          >
            Masuk Ke Terminal
          </Link>
        </div>
      </div>
    )
  }

  if (user.role !== 'AFFILIATE') {
    return (
      <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center bg-bg-dark py-12 px-6">
        <div className="relative z-10 w-full max-w-md text-center border border-border-subtle bg-surface-dark p-8 rounded-lg">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <h2 className="font-sora text-xl font-bold text-text-primary mb-3">Tipe Akun Tidak Sesuai</h2>
          <p className="text-xs text-text-secondary leading-relaxed mb-8">
            Halaman ini eksklusif bagi mitra dengan peran <span className="text-primary font-bold">AFFILIATE</span>. Anda saat ini bertindak sebagai <span className="text-primary font-bold">{user.role}</span>.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              id="aff-switch-account"
              href="/auth"
              className="py-3.5 bg-primary hover:bg-primary-container text-surface-dark font-geist font-bold text-xs uppercase tracking-wider rounded transition-colors"
            >
              Beralih Akun / Daftar
            </Link>
            <Link
              href="/"
              className="py-3.5 bg-surface-container border border-border-subtle text-text-primary font-geist font-bold text-xs uppercase tracking-wider rounded transition-colors"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'

  return (
    <div className="relative min-h-screen bg-bg-dark pt-12 pb-24 px-6 md:px-10">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1400px] h-[400px] bg-[radial-gradient(circle_at_center,rgba(198,169,107,0.04)_0%,transparent_70%)] pointer-events-none z-0" />

      <div className="relative z-10 max-w-[1280px] mx-auto">
        
        {/* Header Branding */}
        <div className="mb-10 pb-6 border-b border-border-subtle flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="font-sora text-3xl font-bold text-text-primary mb-1">
              Affiliate <span className="text-primary">Ecosystem.</span>
            </h1>
            <p className="text-xs text-text-secondary">
              Kelola link affiliate kustom, downline jaringan, dan visual landing page Anda secara terintegrasi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/profile/${user.id}`}
              className="px-3 py-2 bg-surface-container hover:bg-surface-container-high border border-border-subtle rounded text-xs font-geist text-text-primary transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 text-primary">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              Lihat Halaman Landing Anda
            </Link>
            <span className="px-3 py-2 bg-primary/10 border border-primary/25 rounded text-[10px] font-geist font-bold text-primary uppercase tracking-wider">
              Akses: {user.membershipAccess} ({user.membershipLevel})
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border-subtle mb-8 overflow-x-auto pb-px scrollbar-none gap-2">
          {[
            { id: 'dashboard', name: 'Dashboard' },
            { id: 'links', name: 'Link Kustom' },
            { id: 'network', name: 'Downline Jaringan' },
            { id: 'leaderboard', name: 'Leaderboard' },
            { id: 'upgrades', name: 'Pusat Upgrade' },
            { id: 'customizer', name: 'Customizer Landing Page' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3.5 text-xs font-geist font-bold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-white/5'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* TAB CONTENTS */}
        
        {/* 1. DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Reminders Row */}
            {reminders.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-geist font-bold uppercase tracking-wider text-amber-500/80 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  Notifikasi & Pengingat Penting
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reminders.map((rem: any) => (
                    <div
                      key={rem.id}
                      className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/25 rounded text-amber-500 font-bold uppercase tracking-wider">
                          {rem.type}
                        </span>
                        <h4 className="text-xs font-bold text-text-primary font-sora pt-1">{rem.title}</h4>
                        <p className="text-[10px] text-text-secondary leading-relaxed">{rem.description}</p>
                      </div>
                      <Link
                        href={rem.actionUrl}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-black font-geist font-bold text-[9px] uppercase tracking-wider rounded transition-colors flex-shrink-0"
                      >
                        Buka
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Earnings */}
              <div className="border border-border-subtle bg-surface-dark p-6 rounded-lg flex flex-col justify-between min-h-[140px] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none" />
                <div>
                  <span className="block text-[9px] font-geist font-bold text-text-secondary uppercase tracking-widest mb-3">
                    Total Komisi Akumulatif
                  </span>
                  <h2 className="font-sora text-2xl font-extrabold text-primary">
                    Rp {(stats?.totalEarnings ?? 0).toLocaleString('id-ID')}
                  </h2>
                </div>
                <div className="text-[9px] text-text-secondary">
                  Diperbarui secara real-time
                </div>
              </div>

              {/* Clicks */}
              <div className="border border-border-subtle bg-surface-dark p-6 rounded-lg flex flex-col justify-between min-h-[140px]">
                <div>
                  <span className="block text-[9px] font-geist font-bold text-text-secondary uppercase tracking-widest mb-3">
                    Total Klik Tautan
                  </span>
                  <h2 className="font-sora text-2xl font-extrabold text-text-primary">
                    {(stats?.clicksCount ?? 0).toLocaleString('id-ID')} Klik
                  </h2>
                </div>
                <div className="text-[9px] text-text-secondary">
                  Dari semua custom link affiliate
                </div>
              </div>

              {/* Transactions */}
              <div className="border border-border-subtle bg-surface-dark p-6 rounded-lg flex flex-col justify-between min-h-[140px]">
                <div>
                  <span className="block text-[9px] font-geist font-bold text-text-secondary uppercase tracking-widest mb-3">
                    Transaksi Referral
                  </span>
                  <h2 className="font-sora text-2xl font-extrabold text-text-primary">
                    {stats?.referrals.length ?? 0} Transaksi
                  </h2>
                </div>
                <div className="text-[9px] text-text-secondary">
                  Order terselesaikan via rujukan
                </div>
              </div>

              {/* Wallet Balance */}
              <div className="border border-border-subtle bg-surface-dark p-6 rounded-lg flex flex-col justify-between min-h-[140px] border-primary/20 bg-gradient-to-b from-primary/5 to-transparent">
                <div>
                  <span className="block text-[9px] font-geist font-bold text-text-secondary uppercase tracking-widest mb-3">
                    Saldo Dompet Saat Ini
                  </span>
                  <h2 className="font-sora text-2xl font-extrabold text-primary">
                    Rp {(wallet?.balance ?? 0).toLocaleString('id-ID')}
                  </h2>
                </div>
                <Link
                  href="/wallet"
                  className="text-[9px] text-primary font-bold hover:underline tracking-wider uppercase"
                >
                  Tarik Saldo / Deposit →
                </Link>
              </div>
            </div>

            {/* Commissions by Tier & Sources */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Commissions breakdown */}
              <div className="border border-border-subtle bg-surface-dark p-6 rounded-lg lg:col-span-2 space-y-6">
                <h3 className="font-sora text-sm font-bold text-text-primary">
                  Distribusi Pendapatan Tier
                </h3>
                <div className="space-y-4">
                  {/* Tier 1 */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-text-primary">Tier 1 - Referral Langsung (10%)</span>
                      <span className="font-bold text-primary">Rp {(stats?.commissionByTier.tier1 ?? 0).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${stats?.totalEarnings ? ((stats.commissionByTier.tier1 / stats.totalEarnings) * 100) : 0}%`
                        }}
                      />
                    </div>
                  </div>

                  {/* Tier 2 */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-text-primary">Tier 2 - Downline Level 1 (5%)</span>
                      <span className="font-bold text-cyan-400">Rp {(stats?.commissionByTier.tier2 ?? 0).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-400"
                        style={{
                          width: `${stats?.totalEarnings ? ((stats.commissionByTier.tier2 / stats.totalEarnings) * 100) : 0}%`
                        }}
                      />
                    </div>
                  </div>

                  {/* Tier 3 */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-text-primary">Tier 3 - Downline Level 2 (2%)</span>
                      <span className="font-bold text-pink-400">Rp {(stats?.commissionByTier.tier3 ?? 0).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="h-full bg-pink-400"
                        style={{
                          width: `${stats?.totalEarnings ? ((stats.commissionByTier.tier3 / stats.totalEarnings) * 100) : 0}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Traffic Sources */}
              <div className="border border-border-subtle bg-surface-dark p-6 rounded-lg space-y-6">
                <h3 className="font-sora text-sm font-bold text-text-primary">
                  Sumber Klik (Traffic Analytics)
                </h3>
                
                {!stats || Object.keys(stats.trafficSources).length === 0 ? (
                  <div className="text-center py-8 text-xs text-text-secondary/60">
                    Belum ada data klik tercatat.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(stats.trafficSources).map(([src, count]) => {
                      const total = stats.clicksCount || 1
                      const pct = Math.round((count / total) * 100)
                      return (
                        <div key={src} className="flex items-center justify-between text-xs">
                          <span className="text-text-secondary capitalize font-geist">{src}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-text-secondary/80 font-mono">{count} klik</span>
                            <span className="font-bold text-primary w-10 text-right">{pct}%</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Referrals ledger table */}
            <div className="border border-border-subtle bg-surface-dark rounded-lg overflow-hidden">
              <div className="px-6 py-5 border-b border-border-subtle bg-surface-container/50">
                <h3 className="font-sora text-sm font-bold text-text-primary">
                  Log Transaksi Rujukan Terkini
                </h3>
              </div>

              <div className="overflow-x-auto">
                {!stats?.referrals || stats.referrals.length === 0 ? (
                  <div className="text-center py-12 text-xs text-text-secondary">
                    Belum ada riwayat transaksi rujukan terdaftar.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border-subtle text-text-secondary bg-surface-container/20">
                        <th className="p-4 font-geist font-bold uppercase tracking-wider">Tanggal</th>
                        <th className="p-4 font-geist font-bold uppercase tracking-wider">Pelanggan</th>
                        <th className="p-4 font-geist font-bold uppercase tracking-wider">Status</th>
                        <th className="p-4 font-geist font-bold uppercase tracking-wider text-right">Komisi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {stats.referrals.map((ref) => {
                        const date = new Date(ref.createdAt)
                        return (
                          <tr key={ref.id} className="hover:bg-surface-container/10 transition-colors">
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
                            <td className="p-4 text-right font-geist font-bold text-sm text-primary">
                              + Rp {ref.amount.toLocaleString('id-ID')}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. CUSTOM LINKS TAB */}
        {activeTab === 'links' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Create form */}
            <div className="border border-border-subtle bg-surface-dark p-6 rounded-lg">
              <h3 className="font-sora text-base font-bold text-text-primary mb-2">
                Buat Tautan Afiliasi Kustom (Custom Slug Builder)
              </h3>
              <p className="text-xs text-text-secondary mb-6">
                Personalisasikan tautan produk Anda agar mudah diingat dan dipasarkan melalui kanal media sosial.
              </p>

              <form onSubmit={handleCreateCustomLink} className="space-y-4">
                {linkError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-xs text-red-400 rounded">
                    {linkError}
                  </div>
                )}
                {linkSuccess && (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 text-xs text-green-400 rounded">
                    {linkSuccess}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-[10px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-2">
                      Pilih Produk Katalog
                    </label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full h-11 px-3 bg-surface-container border border-border-subtle rounded text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-2">
                      Slug Kustom (e.g. roti-enak)
                    </label>
                    <input
                      type="text"
                      required
                      value={customSlug}
                      onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                      placeholder="roti-sehat-diet"
                      className="w-full h-11 px-3 bg-surface-container border border-border-subtle rounded text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-2">
                      Sumber Pemasaran (e.g. instagram, wa)
                    </label>
                    <input
                      type="text"
                      required
                      value={linkSource}
                      onChange={(e) => setLinkSource(e.target.value)}
                      className="w-full h-11 px-3 bg-surface-container border border-border-subtle rounded text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>
                </div>

                <div className="bg-surface-container border border-border-subtle p-3.5 rounded text-xs font-mono text-text-secondary select-all">
                  Hasil Tautan: <span className="text-primary font-bold">{originUrl}/ref/{customSlug || '[slug]'}?src={linkSource}</span>
                </div>

                <button
                  type="submit"
                  disabled={isCreatingLink}
                  className="px-6 py-3 bg-primary hover:bg-primary-container text-surface-dark font-geist font-bold text-xs uppercase tracking-wider rounded transition-colors disabled:opacity-50"
                >
                  {isCreatingLink ? 'Membuat...' : 'Terbitkan Tautan Kustom'}
                </button>
              </form>
            </div>

            {/* List Tautan */}
            <div className="border border-border-subtle bg-surface-dark rounded-lg overflow-hidden">
              <div className="px-6 py-5 border-b border-border-subtle bg-surface-container/50">
                <h3 className="font-sora text-sm font-bold text-text-primary">
                  Daftar Tautan Afiliasi Kustom Anda
                </h3>
              </div>

              <div className="overflow-x-auto">
                {!stats?.customLinks || stats.customLinks.length === 0 ? (
                  <div className="text-center py-12 text-xs text-text-secondary">
                    Belum ada tautan kustom terdaftar. Gunakan builder di atas untuk membuatnya.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border-subtle text-text-secondary bg-surface-container/20">
                        <th className="p-4 font-geist font-bold uppercase tracking-wider">Slug Kustom</th>
                        <th className="p-4 font-geist font-bold uppercase tracking-wider">Produk Terkait</th>
                        <th className="p-4 font-geist font-bold uppercase tracking-wider">Kanal/Sumber</th>
                        <th className="p-4 font-geist font-bold uppercase tracking-wider">Jumlah Klik</th>
                        <th className="p-4 font-geist font-bold uppercase tracking-wider text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {stats.customLinks.map((link: any) => {
                        const targetUrl = `${originUrl}/ref/${link.customSlug}?src=${link.source}`
                        const prod = products.find(p => p.id === link.productId)
                        return (
                          <tr key={link.id} className="hover:bg-surface-container/10 transition-colors">
                            <td className="p-4 font-mono font-bold text-primary">
                              /{link.customSlug}
                            </td>
                            <td className="p-4 text-text-primary font-medium">
                              {prod ? prod.title : 'Produk'}
                            </td>
                            <td className="p-4 text-text-secondary font-geist capitalize">
                              {link.source}
                            </td>
                            <td className="p-4 text-text-primary font-bold font-geist">
                              {link.clicks || 0} klik
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => handleCopyText(targetUrl, link.id)}
                                className={`px-3 py-1.5 font-geist font-bold text-[10px] uppercase tracking-wider rounded transition-all duration-300 ${
                                  copiedId === link.id
                                    ? 'bg-green-950 border border-green-500/50 text-green-400'
                                    : 'bg-surface-container border border-border-subtle text-text-primary hover:border-primary/50'
                                }`}
                              >
                                {copiedId === link.id ? 'Copied' : 'Salin'}
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3. NETWORK TREE TAB */}
        {activeTab === 'network' && (
          <div className="border border-border-subtle bg-surface-dark p-6 rounded-lg space-y-6 animate-fadeIn">
            <div className="border-b border-border-subtle pb-4">
              <h3 className="font-sora text-base font-bold text-text-primary mb-1">
                Pohon Jaringan Downline Afiliasi
              </h3>
              <p className="text-xs text-text-secondary">
                Ekosistem multi-level berjenjang. Dapatkan komisi tier (Tier 1: 10%, Tier 2: 5%, Tier 3: 2%) dari downline Anda.
              </p>
            </div>

            {downline.length === 0 ? (
              <div className="text-center py-16 text-xs text-text-secondary border border-dashed border-border-subtle rounded-lg bg-surface-container/10">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-primary/50 mx-auto mb-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                </svg>
                Anda belum memiliki downline terdaftar di bawah jaringan rujukan Anda.
              </div>
            ) : (
              <div className="space-y-4">
                {downline.map((node) => (
                  <DownlineNode key={node.id} node={node} depth={1} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. LEADERBOARD TAB */}
        {activeTab === 'leaderboard' && (
          <div className="border border-border-subtle bg-surface-dark rounded-lg overflow-hidden animate-fadeIn">
            <div className="px-6 py-5 border-b border-border-subtle bg-surface-container/50">
              <h3 className="font-sora text-sm font-bold text-text-primary">
                Leaderboard Afiliasi Tergacor
              </h3>
            </div>

            <div className="overflow-x-auto">
              {leaderboard.length === 0 ? (
                <div className="text-center py-12 text-xs text-text-secondary">
                  Belum ada data performa leaderboard terkumpul.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border-subtle text-text-secondary bg-surface-container/20">
                      <th className="p-4 font-geist font-bold uppercase tracking-wider w-16 text-center">Rank</th>
                      <th className="p-4 font-geist font-bold uppercase tracking-wider">Mitra</th>
                      <th className="p-4 font-geist font-bold uppercase tracking-wider">Akses & Level</th>
                      <th className="p-4 font-geist font-bold uppercase tracking-wider text-right">Total Akumulasi Earnings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {leaderboard.map((item, idx) => {
                      const isCurrentUser = item.id === user.id
                      return (
                        <tr
                          key={item.id}
                          className={`transition-colors ${
                            isCurrentUser
                              ? 'bg-primary/5 hover:bg-primary/10'
                              : 'hover:bg-surface-container/10'
                          }`}
                        >
                          <td className="p-4 text-center font-bold text-text-primary font-geist text-sm">
                            {idx === 0 && '🥇'}
                            {idx === 1 && '🥈'}
                            {idx === 2 && '🥉'}
                            {idx > 2 && `${idx + 1}`}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="text-text-primary font-bold">
                                {item.name} {isCurrentUser && <span className="text-primary text-[10px] ml-1">(Anda)</span>}
                              </span>
                              <span className="text-[10px] text-text-secondary">{item.email}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded uppercase font-geist font-semibold text-text-secondary text-[10px]">
                              Lv {item.level} {item.membershipLevel} ({item.membershipAccess})
                            </span>
                          </td>
                          <td className="p-4 text-right font-geist font-bold text-sm text-primary">
                            Rp {item.totalEarnings.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* 5. UPGRADES TAB */}
        {activeTab === 'upgrades' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Status Keanggotaan */}
            <div className="border border-border-subtle bg-surface-dark p-6 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <span className="block text-[9px] font-geist font-bold text-text-secondary uppercase tracking-widest mb-1">
                  Status Akses Anda Saat Ini
                </span>
                <h2 className="font-sora text-xl font-bold text-text-primary">
                  Akses <span className="text-primary font-extrabold">{user.membershipAccess}</span> — Level {user.membershipLevel}
                </h2>
                <p className="text-xs text-text-secondary mt-1">
                  Meningkatkan level membuka kelas akademi eksklusif, standard komisi, dan fitur-fitur ekosistem premium.
                </p>
              </div>

              <div className="bg-surface-container border border-border-subtle px-5 py-3 rounded-lg text-center md:text-right">
                <span className="block text-[9px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-1">Saldo Anda</span>
                <span className="font-sora font-extrabold text-lg text-primary">
                  Rp {(wallet?.balance ?? 0).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {upgradeError && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-xs text-red-400 rounded">
                {upgradeError}
              </div>
            )}
            {upgradeSuccess && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 text-xs text-green-400 rounded">
                {upgradeSuccess}
              </div>
            )}

            {/* Upgrade Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Platinum Card */}
              <div className={`border rounded-lg p-8 bg-surface-dark flex flex-col justify-between space-y-6 transition-all ${
                user.membershipAccess === 'Platinum' || user.membershipAccess === 'Diamond'
                  ? 'border-border-subtle opacity-70'
                  : 'border-cyan-500/20 hover:border-cyan-500/40 shadow-lg hover:shadow-cyan-500/5'
              }`}>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold rounded uppercase tracking-wider">
                      PLATINUM ACCESS
                    </span>
                    <span className="text-xs font-geist text-text-secondary">Level: Agen</span>
                  </div>
                  
                  <h3 className="font-sora text-3xl font-extrabold text-text-primary">
                    Rp 250.000 <span className="text-xs text-text-secondary font-normal">/ sekali bayar</span>
                  </h3>
                  
                  <div className="w-12 h-1 bg-cyan-500 rounded" />
                  
                  <ul className="space-y-2.5 text-xs text-text-secondary">
                    <li className="flex items-center gap-2">
                      <span className="text-cyan-400">✓</span> Membuka Kelas Akademi: **Artisan Baking**
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-cyan-400">✓</span> Komisi Penjualan Afiliasi Tier 2 (5%) aktif
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-cyan-400">✓</span> Bonus +100 XP untuk Akun Anda
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handleUpgrade('Platinum')}
                  disabled={isUpgrading || user.membershipAccess === 'Platinum' || user.membershipAccess === 'Diamond'}
                  className={`w-full py-3.5 rounded text-xs font-geist font-bold uppercase tracking-wider transition-colors ${
                    user.membershipAccess === 'Platinum' || user.membershipAccess === 'Diamond'
                      ? 'bg-surface-container border border-border-subtle text-text-secondary cursor-not-allowed'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                  }`}
                >
                  {user.membershipAccess === 'Platinum' || user.membershipAccess === 'Diamond'
                    ? 'Akses Dimiliki'
                    : 'Upgrade Sekarang'}
                </button>
              </div>

              {/* Diamond Card */}
              <div className={`border rounded-lg p-8 bg-surface-dark flex flex-col justify-between space-y-6 transition-all ${
                user.membershipAccess === 'Diamond'
                  ? 'border-border-subtle opacity-70'
                  : 'border-primary/20 hover:border-primary/45 shadow-lg hover:shadow-primary/5'
              }`}>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="px-2.5 py-1 bg-primary/10 border border-primary/25 text-primary text-[10px] font-bold rounded uppercase tracking-wider">
                      DIAMOND ACCESS
                    </span>
                    <span className="text-xs font-geist text-text-secondary">Level: Distributor</span>
                  </div>
                  
                  <h3 className="font-sora text-3xl font-extrabold text-primary">
                    Rp 500.000 <span className="text-xs text-text-secondary font-normal">/ sekali bayar</span>
                  </h3>
                  
                  <div className="w-12 h-1 bg-primary rounded" />
                  
                  <ul className="space-y-2.5 text-xs text-text-secondary">
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> Membuka Kelas Akademi: **Digital Branding & Packaging**
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> Komisi Penjualan Afiliasi Tier 3 (2%) aktif
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> Halaman Landing Page custom tanpa batas
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> Bonus +100 XP untuk Akun Anda
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handleUpgrade('Diamond')}
                  disabled={isUpgrading || user.membershipAccess === 'Diamond'}
                  className={`w-full py-3.5 rounded text-xs font-geist font-bold uppercase tracking-wider transition-colors ${
                    user.membershipAccess === 'Diamond'
                      ? 'bg-surface-container border border-border-subtle text-text-secondary cursor-not-allowed'
                      : 'bg-primary hover:bg-primary-container text-surface-dark'
                  }`}
                >
                  {user.membershipAccess === 'Diamond'
                    ? 'Akses Teratas Aktif'
                    : 'Upgrade Sekarang'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 6. CUSTOMIZER TAB */}
        {activeTab === 'customizer' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
            {/* Visual Builder Sidebar (Left, 5 cols) */}
            <div className="lg:col-span-5 border border-border-subtle bg-surface-dark p-6 rounded-lg space-y-6">
              <div>
                <h3 className="font-sora text-base font-bold text-text-primary mb-1">
                  Elementor Landing Page Builder
                </h3>
                <p className="text-xs text-text-secondary">
                  Gunakan visual panel ini untuk mengatur desain visual, kontak usaha, dan geolokasi Anda.
                </p>
              </div>

              {custSuccess && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 text-xs text-green-400 rounded">
                  {custSuccess}
                </div>
              )}
              {custError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-xs text-red-400 rounded">
                  {custError}
                </div>
              )}

              <form onSubmit={handleSaveCustomizer} className="space-y-5 text-xs">
                {/* Select Template */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-geist font-bold text-text-secondary uppercase tracking-wider">
                    Pilih Desain Tema Halaman
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {TEMPLATE_OPTIONS.map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => setCustTemplate(tpl.id)}
                        className={`p-3 rounded text-left border text-[11px] transition-all flex flex-col justify-between min-h-[70px] ${
                          custTemplate === tpl.id
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border-subtle bg-surface-container/50 text-text-secondary hover:border-white/10'
                        }`}
                      >
                        <span className="font-bold">{tpl.name}</span>
                        <span className="text-[9px] opacity-75">{tpl.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-2">
                      Nama Brand / Judul Halaman
                    </label>
                    <input
                      type="text"
                      required
                      value={custTitle}
                      onChange={(e) => setCustTitle(e.target.value)}
                      placeholder="e.g. Kala Artisan Bakery"
                      className="w-full h-10 px-3 bg-surface-container border border-border-subtle rounded text-xs text-text-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-2">
                      Bio Ringkas Usaha
                    </label>
                    <textarea
                      required
                      value={custBio}
                      onChange={(e) => setCustBio(e.target.value)}
                      placeholder="Tulis deskripsi bisnis premium Anda..."
                      rows={3}
                      className="w-full p-3 bg-surface-container border border-border-subtle rounded text-xs text-text-primary focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-2">
                        WhatsApp (e.g. 62812345)
                      </label>
                      <input
                        type="text"
                        value={custPhone}
                        onChange={(e) => setCustPhone(e.target.value)}
                        placeholder="62812345678"
                        className="w-full h-10 px-3 bg-surface-container border border-border-subtle rounded text-xs text-text-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-2">
                        Instagram (e.g. @username)
                      </label>
                      <input
                        type="text"
                        value={custInstagram}
                        onChange={(e) => setCustInstagram(e.target.value)}
                        placeholder="@kala.studio"
                        className="w-full h-10 px-3 bg-surface-container border border-border-subtle rounded text-xs text-text-primary focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Section Toggles */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-geist font-bold text-text-secondary uppercase tracking-wider">
                    Aktifkan Modul Komponen Halaman
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'hero', name: 'Hero Header' },
                      { id: 'profile', name: 'Tentang & Kontak' },
                      { id: 'features', name: 'Fitur Unggulan' },
                      { id: 'products', name: 'Produk Showcase' },
                      { id: 'map', name: 'GPS Radar Map' },
                      { id: 'cta', name: 'Hubungi WhatsApp' }
                    ].map((sec) => {
                      const isActive = custSections.includes(sec.id)
                      return (
                        <button
                          key={sec.id}
                          type="button"
                          onClick={() => toggleSection(sec.id)}
                          className={`flex items-center justify-between p-2.5 rounded border text-[11px] font-medium transition-all ${
                            isActive
                              ? 'border-primary/40 bg-primary/5 text-text-primary'
                              : 'border-border-subtle bg-surface-container/20 text-text-secondary hover:border-white/5'
                          }`}
                        >
                          <span>{sec.name}</span>
                          <span className={isActive ? 'text-primary' : 'text-text-secondary/50'}>
                            {isActive ? '✓ ON' : '✗ OFF'}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* GPS Location Panel */}
                <div className="border border-border-subtle p-4 rounded-lg bg-surface-container/50 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-geist font-bold uppercase tracking-wider text-text-secondary">
                      Lokasi GPS Merchant
                    </span>
                    <button
                      type="button"
                      onClick={getGpsCoords}
                      className="px-2 py-1 bg-primary hover:bg-primary-container text-surface-dark font-geist font-bold text-[9px] uppercase tracking-wider rounded transition-colors"
                    >
                      Dapatkan GPS Anda
                    </button>
                  </div>
                  
                  {gpsStatus === 'detecting' && (
                    <span className="text-[10px] text-primary animate-pulse block">⌛ Menghubungi satelit GPS browser...</span>
                  )}

                  <div className="grid grid-cols-2 gap-3 text-[10px] font-mono text-text-secondary">
                    <div>
                      <span>LATITUDE:</span>
                      <span className="block p-2 bg-black rounded border border-white/5 text-white font-bold mt-1">
                        {custLat ? custLat.toFixed(5) : '-'}
                      </span>
                    </div>
                    <div>
                      <span>LONGITUDE:</span>
                      <span className="block p-2 bg-black rounded border border-white/5 text-white font-bold mt-1">
                        {custLng ? custLng.toFixed(5) : '-'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[9px] text-text-secondary/80 leading-relaxed block">
                    * Lokasi GPS digunakan untuk mengukur jarak relatif dan mengurutkan produk di marketplace jasa.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSavingCust}
                  className="w-full py-4 bg-primary hover:bg-primary-container text-surface-dark font-geist font-bold text-xs uppercase tracking-wider rounded transition-colors disabled:opacity-50"
                >
                  {isSavingCust ? 'Menyimpan...' : 'Simpan & Publikasikan Landing Page (+50 XP)'}
                </button>
              </form>
            </div>

            {/* Visual Builder Live Preview (Right, 7 cols) */}
            <div className="lg:col-span-7 flex flex-col">
              <span className="text-[10px] font-geist font-bold text-text-secondary uppercase tracking-widest mb-2 block">
                Live Preview (Simulasi Responsif)
              </span>

              {/* Preview Window */}
              <div className="flex-grow border border-border-subtle rounded-lg bg-black overflow-hidden flex flex-col min-h-[500px]">
                {/* Browser bar */}
                <div className="h-10 bg-surface-container border-b border-border-subtle px-4 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                  </div>
                  <div className="bg-black/40 border border-white/5 rounded px-3 py-1 text-[10px] text-text-secondary font-mono flex-grow max-w-xs text-center truncate select-all">
                    {originUrl}/profile/{user.id}
                  </div>
                </div>

                {/* Simulated Content */}
                {(() => {
                  const selectedTpl = TEMPLATE_OPTIONS.find(t => t.id === custTemplate) || TEMPLATE_OPTIONS[2]
                  return (
                    <div className={`p-8 flex-grow space-y-6 ${selectedTpl.bg} ${selectedTpl.fontFamily} max-h-[550px] overflow-y-auto`}>
                      <div className="flex justify-between items-center pb-2 border-b border-white/10 text-[9px] uppercase tracking-widest text-primary">
                        <span>Teras UMKM Verified Profile</span>
                        <span>Lv {user.level} {user.membershipLevel}</span>
                      </div>

                      {/* Preview Hero */}
                      {custSections.includes('hero') && (
                        <div className="space-y-2">
                          <h1 className="text-2xl font-bold font-sora">{custTitle || user.name}</h1>
                          <p className="text-[9px] uppercase tracking-wider text-primary font-bold">
                            Level {user.membershipLevel} ({user.membershipAccess} Access)
                          </p>
                          <div className="w-12 h-0.5 bg-primary" />
                        </div>
                      )}

                      {/* Preview Bio & contacts */}
                      {custSections.includes('profile') && (
                        <div className={`p-4 rounded border ${selectedTpl.borderClass} space-y-3 bg-white/5`}>
                          <span className="text-[8px] font-geist font-bold uppercase tracking-wider text-primary block">Bio & Kontak</span>
                          <p className="text-[10px] leading-relaxed opacity-90">{custBio || 'Selamat datang!'}</p>
                          
                          <div className="grid grid-cols-2 gap-2 text-[9px] pt-2 border-t border-white/5">
                            {custPhone && <span className="truncate">📞 WA: {custPhone}</span>}
                            {custInstagram && <span className="truncate">📷 IG: {custInstagram}</span>}
                          </div>
                        </div>
                      )}

                      {/* Preview Features */}
                      {custSections.includes('features') && (
                        <div className="grid grid-cols-2 gap-2">
                          <div className={`p-3 rounded border ${selectedTpl.borderClass} bg-white/5`}>
                            <span className="font-bold text-[9px] block">01 Standard Ekstra</span>
                            <span className="text-[8px] text-text-secondary block">Produk diolah dengan dedikasi tinggi</span>
                          </div>
                          <div className={`p-3 rounded border ${selectedTpl.borderClass} bg-white/5`}>
                            <span className="font-bold text-[9px] block">02 Logistik Cepat</span>
                            <span className="text-[8px] text-text-secondary block">Ketersediaan stok diselaraskan lokasi</span>
                          </div>
                        </div>
                      )}

                      {/* Preview GPS map */}
                      {custSections.includes('map') && custLat && custLng && (
                        <div className={`p-4 rounded border ${selectedTpl.borderClass} space-y-2 bg-white/5`}>
                          <span className="text-[8px] font-geist font-bold uppercase tracking-wider text-primary block">Radar Geografis</span>
                          <div className="h-16 bg-black rounded flex items-center justify-center relative overflow-hidden border border-white/5">
                            <span className="text-[8px] font-mono text-text-secondary">
                              LAT: {custLat.toFixed(4)} | LON: {custLng.toFixed(4)}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Preview CTA */}
                      {custSections.includes('cta') && (
                        <div className={`p-4 rounded border ${selectedTpl.borderClass} text-center space-y-2 bg-gradient-to-b from-white/5 to-transparent`}>
                          <span className="text-[9px] text-text-secondary block">Tertarik Bekerjasama?</span>
                          <span className={`inline-block px-4 py-2 text-[9px] font-bold uppercase tracking-wider rounded ${selectedTpl.accentClass}`}>
                            Hubungi via WhatsApp
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
