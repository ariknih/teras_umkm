'use client'

import React, { useState, useEffect, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, getCurrentUserProfile, updateUserLandingPage } from '@/app/actions/auth'
import { getProducts, createProduct, updateProduct, deleteProduct, updateAllProductsAffiliateSettingsAction } from '@/app/actions/products'
import { getWalletDetails } from '@/app/actions/wallet-affiliate'
import { getMerchantOrders, updateOrderTracking, updateShippingLabel } from '@/app/actions/orders'
import { getMerchantAnalytics } from '@/app/actions/analytics'
import { getCourses, getUserProgress } from '@/app/actions/lms'
import { joinBootcampAction } from '@/app/actions/bootcamp'
import { Sparkles, Calendar, Package, TrendingUp, DollarSign, Award, ArrowUpRight, MessageSquare, Clipboard, Globe, Copy, Plus, Trash2, Settings as SettingsIcon, ChevronDown, Check, ArrowLeft, Search, Eye, Layers, X, Info } from 'lucide-react'
import { formatCategoryName } from '@/lib/utils'

interface Product {
  id: string
  title: string
  description: string
  price: number
  category: string
  stock: number
  imageUrl?: string | null
  merchantId: string
  isAffiliateEnabled?: boolean
  affiliateCommissionType?: string
  affiliateCommissionValue?: number
}

const PRODUCT_CATEGORIES = [
  { value: 'TOKO', label: 'Toko & Ritel' },
  { value: 'KAFE', label: 'Kafe & Kuliner' },
  { value: 'JASA', label: 'Jasa & Layanan' },
  { value: 'KERJAAN', label: 'Lowongan Kerja' },
  { value: 'ELEKTRONIK', label: 'Elektronik' },
  { value: 'MAKANAN_MINUMAN', label: 'Makanan & Minuman' },
  { value: 'KOMPUTER_AKSESORIS', label: 'Komputer & Aksesoris' },
  { value: 'PERAWATAN_KECANTIKAN', label: 'Perawatan & Kecantikan' },
  { value: 'HANDPHONE_AKSESORIS', label: 'Handphone & Aksesoris' },
  { value: 'PERLENGKAPAN_RUMAH', label: 'Perlengkapan Rumah' },
  { value: 'PAKAIAN_PRIA', label: 'Pakaian Pria' },
  { value: 'PAKAIAN_WANITA', label: 'Pakaian Wanita' },
  { value: 'SEPATU_PRIA', label: 'Sepatu Pria' },
  { value: 'FASHION_MUSLIM', label: 'Fashion Muslim' },
  { value: 'TAS_PRIA', label: 'Tas Pria' },
  { value: 'FASHION_BAYI_ANAK', label: 'Fashion Bayi & Anak' },
  { value: 'AKSESORIS_FASHION', label: 'Aksesoris Fashion' },
  { value: 'IBU_BAYI', label: 'Ibu & Bayi' },
  { value: 'JAM_TANGAN', label: 'Jam Tangan' },
  { value: 'SEPATU_WANITA', label: 'Sepatu Wanita' },
  { value: 'KESEHATAN', label: 'Kesehatan' },
  { value: 'TAS_WANITA', label: 'Tas Wanita' },
  { value: 'HOBI_KOLEKSI', label: 'Hobi & Koleksi' },
  { value: 'OTOMOTIF', label: 'Otomotif' },
  { value: 'OLAHRAGA_OUTDOOR', label: 'Olahraga & Outdoor' },
  { value: 'BUKU_ALAT_TULIS', label: 'Buku & Alat Tulis' },
  { value: 'SOUVENIR_PERLENGKAPAN_PESTA', label: 'Souvenir & Perlengkapan Pesta' },
  { value: 'FOTOGRAFI', label: 'Fotografi' },
  { value: 'VOUCHER', label: 'Voucher' },
  { value: 'DEALS_SEKITAR', label: 'Deals Sekitar' },
]

export default function MerchantDashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [wallet, setWallet] = useState<any>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  
  // Page list and custom domain states
  const [editingPage, setEditingPage] = useState<any | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDomainModal, setShowDomainModal] = useState(false)
  const [searchPageQuery, setSearchPageQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [customDomainInput, setCustomDomainInput] = useState('')
  const [pageThumbUrl, setPageThumbUrl] = useState('')

  // Create page states
  const [createPageName, setCreatePageName] = useState('')
  const [createPageTemplate, setCreatePageTemplate] = useState('template1')
  const [createPagePreview, setCreatePagePreview] = useState<'mobile' | 'desktop'>('mobile')
  
  // Tabs: 'overview' | 'catalog' | 'add' | 'orders' | 'analytics' | 'pages' | 'customization' | 'academy'
  const [activeTab, setActiveTab] = useState<'overview' | 'catalog' | 'add' | 'orders' | 'analytics' | 'pages' | 'customization' | 'academy'>('overview')
  
  // LMS Academy state
  const [courses, setCourses] = useState<any[]>([])
  const [userProgress, setUserProgress] = useState<any[]>([])
  
  // Storefront customization state
  const [storefrontTemplate, setStorefrontTemplate] = useState<'gold' | 'noir' | 'clean' | 'studio' | 'brutalist' | 'swiss' | 'destijl' | 'hpc'>('gold')
  const [storefrontLayout, setStorefrontLayout] = useState<'standard' | 'split'>('standard')
  const [storefrontTheme, setStorefrontTheme] = useState<'light' | 'dark'>('light')
  const [storefrontBanner, setStorefrontBanner] = useState<string>('https://lh3.googleusercontent.com/aida-public/AB6AXuDaITYZkmc6L_1XKCS4fqpRs3YoL8ZLot8R_Ygodw4DenCwlBeA5j7rhqHEKINUTocw_63YHqnETRmtW3sxG65jlwg7nT1ijTNJIWavsMPFwj99WCpZ3RF9qhsuRRzRddvRaDQAzW-7rDyaS3JRv2QoFVaI62welKcSNK7QaapBVKj6N-51sktfNABs01JwQGUYbQ1K7NaB2ZwoM1tFYi5m_Z3qE4d2VCqHrTjjB8CwQxebUtQA4gsGbKiTCd_qK9zRqY4pTwpYA99N')
  const [showHero, setShowHero] = useState<boolean>(true)
  const [showProducts, setShowProducts] = useState<boolean>(true)
  const [showTestimonials, setShowTestimonials] = useState<boolean>(false)
  const [previewScale, setPreviewScale] = useState<number>(0.9)
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [isGalleryOpen, setIsGalleryOpen] = useState<boolean>(false)

  // Orders & Analytics
  const [orders, setOrders] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [statusNotes, setStatusNotes] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [shippingLabelInput, setShippingLabelInput] = useState('')

  // AI Copywriter
  const [generatingAiText, setGeneratingAiText] = useState(false)
  const [showAiModal, setShowAiModal] = useState(false)
  const [aiKeywords, setAiKeywords] = useState('')
  const [aiCategory, setAiCategory] = useState('TOKO')
  const [targetFormType, setTargetFormType] = useState<'create' | 'edit'>('create')

  // Edit states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  // Image upload states
  const [createImageUrl, setCreateImageUrl] = useState<string>('')
  const [editImageUrl, setEditImageUrl] = useState<string>('')

  // Global Affiliate Settings State
  const [globalAffEnabled, setGlobalAffEnabled] = useState(false)
  const [globalCommType, setGlobalCommType] = useState('PERCENT')
  const [globalCommValue, setGlobalCommValue] = useState(0)
  const [globalStatus, setGlobalStatus] = useState<string | null>(null)
  const [isApplyingGlobal, startApplyGlobal] = useTransition()

  const parsedSubdomain = (() => {
    if (!profile) return ''
    try {
      const config = JSON.parse(profile.landingPageConfig || '{}')
      if (config.subdomain) return config.subdomain
    } catch (e) {}
    return profile.name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'mitra'
  })()

  const handleImageUpload = (file: File, callback: (base64: string) => void) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 500
        const MAX_HEIGHT = 500
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height
            height = MAX_HEIGHT
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8)
          callback(compressedDataUrl)
        } else {
          callback(reader.result as string)
        }
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent, callback: (base64: string) => void) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files?.[0]
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg')) {
      handleImageUpload(file, callback)
    }
  }

  const handleApplyGlobalAffiliate = (e: React.FormEvent) => {
    e.preventDefault()
    setGlobalStatus(null)
    startApplyGlobal(async () => {
      const res = await updateAllProductsAffiliateSettingsAction(globalAffEnabled, globalCommType, globalCommValue)
      if (res.error) {
        setGlobalStatus(`Gagal: ${res.error}`)
      } else {
        setGlobalStatus('Berhasil: Pengaturan affiliate telah diterapkan ke semua produk Anda.')
        loadData()
      }
    })
  }
  
  // Error / Success notifications
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [isPending, startTransition] = useTransition()

  // Define template configurations
  const getTemplateStyles = () => {
    const isDark = storefrontTheme === 'dark';
    switch (storefrontTemplate) {
      case 'noir':
        return {
          font: 'font-geist tracking-tight',
          bg: isDark ? 'bg-black text-white' : 'bg-white text-black',
          headerBorder: isDark ? 'border-white/10' : 'border-black/10',
          logoColor: 'text-white bg-black dark:text-black dark:bg-white px-2.5 py-0.5 font-bold uppercase tracking-widest font-mono text-xs',
          heroBg: isDark ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-black',
          buttonClass: 'px-5 py-2.5 bg-black hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-black text-[9px] font-bold tracking-widest uppercase rounded-none transition-all border border-transparent shadow-none',
          cardClass: 'bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-none p-3.5 space-y-2',
          badgeClass: 'border border-black dark:border-white px-2.5 py-0.5 text-[8px] font-mono font-bold tracking-widest uppercase rounded-none',
          accentText: 'text-zinc-600 dark:text-zinc-400 font-bold',
          testimonialBg: isDark ? 'bg-zinc-900 border border-zinc-800 text-zinc-300' : 'bg-zinc-50 border border-zinc-200 text-zinc-600',
          testimonialRound: 'rounded-none'
        };
      case 'clean':
        return {
          font: 'font-inter antialiased',
          bg: isDark ? 'bg-[#0f172a] text-[#f1f5f9]' : 'bg-[#f8fafc] text-[#0f172a]',
          headerBorder: isDark ? 'border-slate-800' : 'border-slate-200',
          logoColor: 'text-[#0284c7] font-semibold tracking-normal font-sans text-sm',
          heroBg: isDark ? 'bg-[#1e293b] text-slate-100' : 'bg-[#e2e8f0] text-slate-900',
          buttonClass: 'px-4 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white text-[9px] font-semibold rounded-md shadow-sm transition-all',
          cardClass: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2 shadow-sm',
          badgeClass: 'bg-[#e0f2fe] text-[#0369a1] dark:bg-[#0c4a6e] dark:text-[#bae6fd] px-2 py-0.5 text-[8px] font-semibold rounded-full',
          accentText: 'text-[#0284c7] font-bold',
          testimonialBg: isDark ? 'bg-[#1e293b] border border-slate-800 text-slate-300' : 'bg-white border border-slate-200 text-slate-600 shadow-sm',
          testimonialRound: 'rounded-xl'
        };
      case 'studio':
        return {
          font: 'font-sans antialiased',
          bg: isDark ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-900',
          headerBorder: isDark ? 'border-zinc-800' : 'border-zinc-200',
          logoColor: 'text-zinc-900 dark:text-white font-bold tracking-tight text-sm',
          heroBg: isDark ? 'bg-zinc-900/50 text-white' : 'bg-zinc-50 text-zinc-900',
          buttonClass: 'px-5 py-2.5 bg-[#78350f] hover:bg-[#854d0e] text-white text-[9px] font-bold rounded-3xl transition-all scale-100 hover:scale-105 shadow-sm',
          cardClass: 'bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 shadow-sm transition-all duration-300 hover:shadow-md',
          badgeClass: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-3 py-1 rounded-3xl text-[8px] font-bold uppercase tracking-wider',
          accentText: 'text-primary font-semibold',
          testimonialBg: isDark ? 'bg-zinc-900 border border-zinc-800 text-zinc-300' : 'bg-zinc-50 border border-zinc-200 text-zinc-700 shadow-sm',
          testimonialRound: 'rounded-3xl'
        };
      case 'brutalist':
        return {
          font: 'font-geist font-black',
          bg: isDark ? 'bg-[#18181b] text-white' : 'bg-[#fffbeb] text-black',
          headerBorder: 'border-[3px] border-black',
          logoColor: 'bg-yellow-400 text-black px-3 py-1 font-black uppercase border-2 border-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
          heroBg: isDark ? 'bg-zinc-900' : 'bg-yellow-100',
          buttonClass: 'px-5 py-2.5 bg-[#f59e0b] text-black border-2 border-black text-[9px] font-black uppercase tracking-wider rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none',
          cardClass: 'bg-white border-[3px] border-black rounded-none p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-2 text-black',
          badgeClass: 'bg-cyan-300 text-black px-2.5 py-0.5 text-[8px] font-black uppercase border border-black rounded-none shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]',
          accentText: 'text-black underline font-black',
          testimonialBg: 'bg-pink-200 border-2 border-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]',
          testimonialRound: 'rounded-none'
        };
      case 'swiss':
        return {
          font: 'font-sans',
          bg: 'bg-[#F5F1E8] text-black',
          headerBorder: 'border-black',
          logoColor: 'text-black font-extrabold uppercase text-xs tracking-wider',
          heroBg: 'bg-white',
          buttonClass: 'px-5 py-2.5 bg-black text-white hover:bg-zinc-800 text-[9px] font-bold rounded-none border border-black',
          cardClass: 'bg-white border border-black rounded-none p-4',
          badgeClass: 'bg-black text-white px-2.5 py-0.5 text-[8px] font-bold rounded-none',
          accentText: 'text-black font-bold',
          testimonialBg: 'bg-white border border-black text-black',
          testimonialRound: 'rounded-none'
        };
      case 'destijl':
        return {
          font: 'font-sans',
          bg: 'bg-white text-black',
          headerBorder: 'border-[3px] border-black',
          logoColor: 'bg-[#FF0000] text-white px-3 py-1 font-bold border-2 border-black text-xs',
          heroBg: 'bg-[#FFFF00]/10',
          buttonClass: 'px-5 py-2.5 bg-[#FF0000] text-white hover:bg-[#CC0000] border-2 border-black text-[9px] font-bold rounded-none',
          cardClass: 'bg-white border-[3px] border-black rounded-none p-4',
          badgeClass: 'bg-[#0000FF] text-white px-2.5 py-0.5 text-[8px] font-bold rounded-none',
          accentText: 'text-black font-bold',
          testimonialBg: 'bg-[#FFFF00]/20 border-2 border-black text-black',
          testimonialRound: 'rounded-none'
        };
      case 'hpc':
        return {
          font: 'font-inter',
          bg: 'bg-black text-white',
          headerBorder: 'border-neutral-800',
          logoColor: 'text-white border-l-[3px] border-l-[#ED1C24] pl-2 font-bold text-xs',
          heroBg: 'bg-[#333333]/30',
          buttonClass: 'px-5 py-2.5 bg-[#ED1C24] text-white hover:bg-[#ff3b45] text-[9px] font-bold shadow-[0_0_10px_rgba(237,28,36,0.3)] rounded-sm',
          cardClass: 'border-l-[3px] border-l-[#ED1C24] border-t border-r border-b border-neutral-800 bg-[#333333]/50 rounded-none',
          badgeClass: 'border border-[#ED1C24]/30 bg-[#ED1C24]/10 text-[#ED1C24] px-2.5 py-0.5 text-[8px] font-bold rounded-none',
          accentText: 'text-[#ED1C24] font-bold',
          testimonialBg: 'border border-neutral-800 bg-[#333333]/20 text-neutral-300',
          testimonialRound: 'rounded-none'
        };
      case 'gold':
      default:
        return {
          font: 'font-sora tracking-wide',
          bg: isDark ? 'bg-[#0B0B0C] text-[#e5e2e1]' : 'bg-[#f8f9ff] text-[#0b1c30]',
          headerBorder: isDark ? 'border-white/5' : 'border-black/5',
          logoColor: 'text-primary font-extrabold tracking-tight text-sm font-sora',
          heroBg: isDark ? 'bg-black/50 text-white' : 'bg-white/80 text-[#0b1c30]',
          buttonClass: 'px-5 py-2.5 bg-primary-container hover:bg-primary-container/90 text-on-surface text-[9px] font-bold rounded-full shadow-md transition-all scale-100 hover:scale-105',
          cardClass: 'bg-white dark:bg-zinc-900/60 border border-outline-variant/30 rounded-2xl p-3 space-y-2 shadow-md transition-all duration-300 hover:shadow-lg',
          badgeClass: 'bg-white/95 dark:bg-black/90 px-3 py-1 rounded-full text-[8px] font-bold text-on-surface tracking-widest uppercase border border-outline-variant/50',
          accentText: 'text-primary font-bold',
          testimonialBg: isDark ? 'bg-[#121214] border border-outline-variant/20 text-[#a3a3a3]' : 'bg-[#f1f3f9] border border-outline-variant/30 text-on-surface-variant',
          testimonialRound: 'rounded-2xl'
        };
    }
  };

  const tStyles = getTemplateStyles();

  // Sync with Local Storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTemplate = localStorage.getItem('storefront_template')
      const savedLayout = localStorage.getItem('storefront_layout')
      const savedTheme = localStorage.getItem('storefront_theme')
      const savedBanner = localStorage.getItem('storefront_banner')
      const savedShowHero = localStorage.getItem('storefront_show_hero')
      const savedShowProducts = localStorage.getItem('storefront_show_products')
      const savedShowTestimonials = localStorage.getItem('storefront_show_testimonials')

      if (savedTemplate) setStorefrontTemplate(savedTemplate as any)
      if (savedLayout) setStorefrontLayout(savedLayout as any)
      if (savedTheme) setStorefrontTheme(savedTheme as any)
      if (savedBanner) setStorefrontBanner(savedBanner)
      if (savedShowHero) setShowHero(savedShowHero === 'true')
      if (savedShowProducts) setShowProducts(savedShowProducts === 'true')
      if (savedShowTestimonials) setShowTestimonials(savedShowTestimonials === 'true')
    }
  }, [])

  const handleSaveStorefront = () => {
    localStorage.setItem('storefront_template', storefrontTemplate)
    localStorage.setItem('storefront_layout', storefrontLayout)
    localStorage.setItem('storefront_theme', storefrontTheme)
    localStorage.setItem('storefront_banner', storefrontBanner)
    localStorage.setItem('storefront_show_hero', String(showHero))
    localStorage.setItem('storefront_show_products', String(showProducts))
    localStorage.setItem('storefront_show_testimonials', String(showTestimonials))
    setSuccess('Konfigurasi visual storefront berhasil disimpan!')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function loadData() {
    try {
      const u = await getCurrentUser()
      if (u) {
        setUser(u)
        const fullProfile = await getCurrentUserProfile()
        setProfile(fullProfile)
        if (u.role === 'MERCHANT') {
          const list = await getProducts()
          const myProducts = list.filter((p) => p.merchantId === u.id)
          setProducts(myProducts as any)
          const w = await getWalletDetails()
          setWallet(w)
          
          // Load orders and analytics
          const oList = await getMerchantOrders()
          setOrders(oList)
          const analyticData = await getMerchantAnalytics()
          setAnalytics(analyticData)
          
          // Load LMS courses and user progress
          const lmsCourses = await getCourses()
          setCourses(lmsCourses)
          const progress = await getUserProgress()
          setUserProgress(progress)
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

  useEffect(() => {
    if (editingPage) {
      setPageThumbUrl(editingPage.imageUrl || '')
    } else {
      setPageThumbUrl('')
    }
  }, [editingPage])

const getDefaultComponents = (templateId: string, pageName: string, profileName: string) => {
  const defaultStyle = { textAlign: 'left', fontSize: 'default', fontWeight: 'default', color: '', bgColor: '', paddingTop: 16, paddingBottom: 16, paddingLeft: 16, paddingRight: 16, opacity: 100, textDecoration: 'none', textTransform: 'none', borderRadius: 0 }
  const defaultAdvance = { marginTop: 0, marginBottom: 0, animation: 'none', showDesktop: true, showTablet: true, showMobile: true, customClass: '', customId: '' }

  const makeComp = (type: string, content: any, style = {}, advance = {}) => ({
    id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type,
    content,
    style: { ...defaultStyle, ...style },
    advance: { ...defaultAdvance, ...advance }
  })

  switch (templateId) {
    case 'template2': // Simple Storefront
      return [
        makeComp('banner_announcement', { text: '🔥 Promo Hari Ini! Dapatkan penawaran menarik.', bgColor: '#2DB24A', textColor: '#FFFFFF', link: '' }),
        makeComp('navigation', { links: [{ label: 'Beranda', url: '#' }, { label: 'Produk', url: '#produk' }, { label: 'Hubungi Kami', url: '#kontak' }], logoText: profileName || 'Toko Saya' }),
        makeComp('headline', { text: `Selamat Datang di ${profileName || 'Toko Kami'}`, tag: 'h1' }, { textAlign: 'center', paddingTop: 32, paddingBottom: 8 }),
        makeComp('subheadline', { text: 'Kami menyediakan barang & jasa berkualitas tinggi dengan pelayanan prima.', tag: 'h2' }, { textAlign: 'center', paddingTop: 8, paddingBottom: 24, color: '#6B7280' }),
        makeComp('product_showcase', { productIds: [], layout: 'grid', columns: 2, title: 'Katalog Produk Pilihan', showPrice: true, showStock: true, showBuyBtn: true, buyBtnLabel: 'Beli Sekarang' }),
        makeComp('space', { height: 32 }),
        makeComp('testimonials', { items: [{ name: 'Ahmad Santoso', role: 'Pelanggan Setia', text: 'Kualitas barangnya sangat bagus dan pengirimannya cepat sekali!' }, { name: 'Dewi Lestari', role: 'Customer', text: 'Penjual sangat ramah dan responsif saat ditanya-tanya.' }] }),
      ]
    case 'template3': // Product Solution
      return [
        makeComp('headline', { text: 'Solusi Praktis & Efektif untuk Kebutuhan Anda', tag: 'h1' }, { textAlign: 'center', paddingTop: 40, paddingBottom: 8 }),
        makeComp('subheadline', { text: 'Temukan kemudahan hidup dengan produk inovatif terbaru kami.', tag: 'h2' }, { textAlign: 'center', paddingTop: 8, paddingBottom: 32, color: '#6B7280' }),
        makeComp('feature_list', { items: ['Kualitas Terjamin & Bergaransi Resmi', 'Mudah Digunakan & Ramah Lingkungan', 'Dukungan Layanan Pelanggan 24 Jam'], icon: 'check' }),
        makeComp('space', { height: 24 }),
        makeComp('rating', { score: 4.9, total: 328, label: 'Kepuasan Pengguna' }, { textAlign: 'center' }),
        makeComp('space', { height: 16 }),
        makeComp('whatsapp_button', { label: 'Konsultasi & Pesan Sekarang', phone: '6281234567890', message: `Halo, saya tertarik dengan halaman ${pageName}.` }, { textAlign: 'center' }),
        makeComp('space', { height: 32 }),
        makeComp('testimonials', { items: [{ name: 'Budi Raharjo', role: 'Wiraswasta', text: 'Produk ini benar-benar menyelesaikan masalah harian saya. Sangat berharga!' }] }),
      ]
    case 'template4': // Product Fisik
      return [
        makeComp('navigation', { links: [{ label: 'Katalog', url: '#' }, { label: 'Cara Order', url: '#order' }], logoText: profileName || 'Katalog Usaha' }),
        makeComp('headline', { text: 'Katalog Produk Fisik Terbaru', tag: 'h1' }, { paddingTop: 32, paddingBottom: 8 }),
        makeComp('subheadline', { text: 'Pilih produk favorit Anda dari koleksi lengkap kami.', tag: 'h2' }, { paddingTop: 8, paddingBottom: 24, color: '#6B7280' }),
        makeComp('product_showcase', { productIds: [], layout: 'grid', columns: 2, title: 'Koleksi Barang', showPrice: true, showStock: true, showBuyBtn: true, buyBtnLabel: 'Pesan Sekarang' }),
        makeComp('space', { height: 24 }),
        makeComp('visitor_counter', { count: 1420, label: 'pengunjung telah melihat katalog ini' }),
        makeComp('space', { height: 16 }),
        makeComp('faq', { items: [{ question: 'Apakah pengiriman bisa COD?', answer: 'Ya, kami melayani sistem Cash on Delivery (COD) untuk wilayah tertentu.' }, { question: 'Berapa lama garansi produk?', answer: 'Kami memberikan garansi penukaran produk selama 7 hari jika terdapat cacat produksi.' }] }),
      ]
    case 'template1':
    default:
      return []
  }
}

  // Page management helper actions
  const handleCreatePage = (pageName: string, templateId: string) => {
    if (!profile) return
    try {
      const config = JSON.parse(profile.landingPageConfig || '{}')
      const currentPages = config.pages && Array.isArray(config.pages) ? [...config.pages] : [
        {
          id: 'page-main',
          name: 'Main Storefront',
          slug: '',
          template: profile.landingPageTemplate || 'template1',
          status: 'PUBLISHED',
          customDomain: config.customDomain || '',
          headDesktop: '',
          headMobile: '',
          footerAny: '',
          footerDesktop: '',
          footerMobile: '',
          allowSearch: 'Yes',
          followLinks: 'Yes',
          lastModified: new Date().toISOString()
        }
      ]

      const slug = pageName.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-')
      
      const newPage = {
        id: `page-${Date.now()}`,
        name: pageName,
        slug: slug,
        template: templateId,
        status: 'PUBLISHED',
        customDomain: '',
        headDesktop: '',
        headMobile: '',
        footerAny: '',
        footerDesktop: '',
        footerMobile: '',
        allowSearch: 'Yes',
        followLinks: 'Yes',
        lastModified: new Date().toISOString(),
        builderComponents: getDefaultComponents(templateId, pageName, profile.name)
      }

      config.pages = [...currentPages, newPage]

      startTransition(async () => {
        const res = await updateUserLandingPage(
          profile.landingPageTemplate || 'template1',
          JSON.stringify(config),
          profile.latitude || -6.2088,
          profile.longitude || 106.8456
        )
        if (res.error) {
          setError(res.error)
        } else {
          setSuccess('Halaman baru berhasil dibuat!')
          setShowCreateModal(false)
          setCreatePageName('')
          await loadData()
        }
      })
    } catch (e: any) {
      setError(e.message || 'Gagal membuat halaman.')
    }
  }

  const handleDuplicatePage = (page: any) => {
    if (!profile) return
    try {
      const config = JSON.parse(profile.landingPageConfig || '{}')
      const currentPages = config.pages && Array.isArray(config.pages) ? [...config.pages] : [
        {
          id: 'page-main',
          name: 'Main Storefront',
          slug: '',
          template: profile.landingPageTemplate || 'template1',
          status: 'PUBLISHED',
          customDomain: config.customDomain || '',
          headDesktop: '',
          headMobile: '',
          footerAny: '',
          footerDesktop: '',
          footerMobile: '',
          allowSearch: 'Yes',
          followLinks: 'Yes',
          lastModified: new Date().toISOString()
        }
      ]

      const duplicated = {
        ...page,
        id: `page-${Date.now()}`,
        name: `${page.name} (Copy)`,
        slug: page.slug ? `${page.slug}-copy` : 'copy',
        lastModified: new Date().toISOString()
      }

      config.pages = [...currentPages, duplicated]

      startTransition(async () => {
        const res = await updateUserLandingPage(
          profile.landingPageTemplate || 'template1',
          JSON.stringify(config),
          profile.latitude || -6.2088,
          profile.longitude || 106.8456
        )
        if (res.error) {
          setError(res.error)
        } else {
          setSuccess('Halaman berhasil diduplikasi!')
          await loadData()
        }
      })
    } catch (e: any) {
      setError(e.message || 'Gagal menduplikasi halaman.')
    }
  }

  const handleSavePageSettings = (updatedPage: any) => {
    if (!profile) return
    try {
      const config = JSON.parse(profile.landingPageConfig || '{}')
      const currentPages = config.pages && Array.isArray(config.pages) ? [...config.pages] : [
        {
          id: 'page-main',
          name: 'Main Storefront',
          slug: '',
          template: profile.landingPageTemplate || 'template1',
          status: 'PUBLISHED',
          customDomain: config.customDomain || '',
          headDesktop: '',
          headMobile: '',
          footerAny: '',
          footerDesktop: '',
          footerMobile: '',
          allowSearch: 'Yes',
          followLinks: 'Yes',
          lastModified: new Date().toISOString()
        }
      ]

      const idx = currentPages.findIndex(p => p.id === updatedPage.id)
      if (idx !== -1) {
        currentPages[idx] = {
          ...updatedPage,
          imageUrl: pageThumbUrl,
          lastModified: new Date().toISOString()
        }
      } else {
        currentPages.push({
          ...updatedPage,
          imageUrl: pageThumbUrl,
          lastModified: new Date().toISOString()
        } as any)
      }

      config.pages = currentPages
      if (updatedPage.id === 'page-main') {
        config.title = updatedPage.name
        config.customDomain = updatedPage.customDomain
      }

      startTransition(async () => {
        const res = await updateUserLandingPage(
          profile.landingPageTemplate || 'template1',
          JSON.stringify(config),
          profile.latitude || -6.2088,
          profile.longitude || 106.8456
        )
        if (res.error) {
          setError(res.error)
        } else {
          setSuccess('Pengaturan halaman berhasil disimpan!')
          setEditingPage(null)
          await loadData()
        }
      })
    } catch (e: any) {
      setError(e.message || 'Gagal menyimpan pengaturan halaman.')
    }
  }

  const handleDeletePage = (pageId: string) => {
    if (pageId === 'page-main') {
      alert('Halaman utama (Main Storefront) tidak dapat dihapus.')
      return
    }
    if (!confirm('Apakah Anda yakin ingin menghapus halaman ini secara permanen?')) return
    if (!profile) return

    try {
      const config = JSON.parse(profile.landingPageConfig || '{}')
      const currentPages = config.pages && Array.isArray(config.pages) ? [...config.pages] : []
      const updatedPages = currentPages.filter(p => p.id !== pageId)
      config.pages = updatedPages

      startTransition(async () => {
        const res = await updateUserLandingPage(
          profile.landingPageTemplate || 'template1',
          JSON.stringify(config),
          profile.latitude || -6.2088,
          profile.longitude || 106.8456
        )
        if (res.error) {
          setError(res.error)
        } else {
          setSuccess('Halaman berhasil dihapus.')
          await loadData()
        }
      })
    } catch (e: any) {
      setError(e.message || 'Gagal menghapus halaman.')
    }
  }

  const handleSaveCustomDomain = (domainName: string) => {
    if (!profile) return
    try {
      const config = JSON.parse(profile.landingPageConfig || '{}')
      config.customDomain = domainName.toLowerCase().trim()
      
      if (config.pages && Array.isArray(config.pages)) {
        const main = config.pages.find((p: any) => p.id === 'page-main')
        if (main) main.customDomain = domainName.toLowerCase().trim()
      }

      startTransition(async () => {
        const res = await updateUserLandingPage(
          profile.landingPageTemplate || 'template1',
          JSON.stringify(config),
          profile.latitude || -6.2088,
          profile.longitude || 106.8456
        )
        if (res.error) {
          setError(res.error)
        } else {
          setSuccess(`Custom domain berhasil dikonfigurasi ke: ${domainName}`)
          setShowDomainModal(false)
          setCustomDomainInput('')
          await loadData()
        }
      })
    } catch (e: any) {
      setError(e.message || 'Gagal mengonfigurasi custom domain.')
    }
  }

  const handleJoinBootcamp = () => {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const res = await joinBootcampAction()
      if (res.error) {
        setError(res.error)
      } else {
        setSuccess('Selamat! Anda telah resmi bergabung ke Saloka Bootcamp.')
        await loadData()
      }
    })
  }

  // Create Product Submit
  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      const res = await createProduct(formData)
      if (res.error) {
        setError(res.error)
      } else {
        setSuccess('Produk baru berhasil ditambahkan!')
        setCreateImageUrl('')
        setActiveTab('catalog')
        await loadData()
      }
    })
  }

  // Edit Product Submit
  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!editingProduct) return
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await updateProduct(editingProduct.id, formData)
      if (res.error) {
        setError(res.error)
      } else {
        setSuccess('Detail produk berhasil diperbarui!')
        setEditingProduct(null)
        setEditImageUrl('')
        await loadData()
      }
    })
  }

  // Delete Product
  const handleDelete = (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini secara permanen dari katalog?')) return
    setError(null)
    setSuccess(null)

    startTransition(async () => {
      const res = await deleteProduct(id)
      if (res.error) {
        setError(res.error)
      } else {
        setSuccess('Produk berhasil dihapus dari sistem.')
        await loadData()
      }
    })
  }

  const handleGenerateAiText = async () => {
    setGeneratingAiText(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'product',
          context: {
            title: aiKeywords,
            category: aiCategory,
            keywords: aiKeywords
          }
        })
      })

      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else if (data.text) {
        if (targetFormType === 'create') {
          const el = document.getElementById('create-description') as HTMLTextAreaElement
          if (el) el.value = data.text
        } else {
          const el = document.getElementById('edit-description') as HTMLTextAreaElement
          if (el) el.value = data.text
        }
        setSuccess('Deskripsi berhasil di-generate menggunakan AI!')
        setShowAiModal(false)
      }
    } catch (err: any) {
      setError(err.message || 'Gagal generate deskripsi.')
    } finally {
      setGeneratingAiText(false)
    }
  }

  if (loading) {
    return (
      <div className="relative min-h-screen bg-[#F5F7F9] pt-12 pb-24 px-6 md:px-10 animate-pulse">
        <div className="relative z-10 max-w-[1200px] mx-auto">
          {/* Header Skeleton */}
          <div className="mb-10 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-slate-100">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-slate-200 rounded-lg"></div>
              <div className="h-4 w-72 bg-slate-200 rounded-lg"></div>
            </div>
            <div className="h-8 w-36 bg-slate-200 rounded-lg"></div>
          </div>

          {/* Navigation Tabs Skeleton */}
          <div className="flex gap-4 border-b border-slate-100 mb-8 pb-3 overflow-x-auto">
            <div className="h-6 w-24 bg-slate-200 rounded-md shrink-0"></div>
            <div className="h-6 w-32 bg-slate-200 rounded-md shrink-0"></div>
            <div className="h-6 w-28 bg-slate-200 rounded-md shrink-0"></div>
            <div className="h-6 w-24 bg-slate-200 rounded-md shrink-0"></div>
            <div className="h-6 w-32 bg-slate-200 rounded-md shrink-0"></div>
          </div>

          {/* Cards Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 h-36 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="h-3 w-32 bg-slate-200 rounded"></div>
                <div className="h-8 w-44 bg-slate-200 rounded-lg"></div>
              </div>
              <div className="h-3 w-28 bg-slate-200 rounded"></div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 h-36 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="h-3 w-32 bg-slate-200 rounded"></div>
                <div className="h-8 w-24 bg-slate-200 rounded-lg"></div>
              </div>
              <div className="h-3 w-28 bg-slate-200 rounded"></div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 h-36 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="h-3 w-32 bg-slate-200 rounded"></div>
                <div className="h-8 w-20 bg-slate-200 rounded-lg"></div>
              </div>
              <div className="h-3 w-28 bg-slate-200 rounded"></div>
            </div>
          </div>

          {/* Table/List Area Skeleton */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="h-5 w-36 bg-slate-200 rounded"></div>
              <div className="h-8 w-24 bg-slate-200 rounded-lg"></div>
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
                    <div className="space-y-1.5">
                      <div className="h-4 w-40 bg-slate-200 rounded"></div>
                      <div className="h-3 w-24 bg-slate-200 rounded"></div>
                    </div>
                  </div>
                  <div className="h-6 w-16 bg-slate-200 rounded-full"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center bg-bg-dark py-12 px-6">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(198,169,107,0.06)_0%,transparent_65%)] pointer-events-none z-0" />
        <div className="relative z-10 w-full max-w-md text-center border border-border-subtle bg-surface-dark glow-card p-8 rounded-lg">
          <div className="btn-primary w-16 bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0V10.5m-2.25 13.5h13.5c.621 0 1.125-.504 1.125-1.125V11.25c0-.621-.504-1.125-1.125-1.125H4.25c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125Z" />
            </svg>
          </div>
          <h2 className="font-sora text-2xl font-bold text-text-primary mb-3">Akses Dibatasi</h2>
          <p className="text-xs text-text-secondary leading-relaxed mb-8">
            Silakan masuk dengan akun Merchant Anda untuk mengoperasikan inventory, statistik toko, dan saldo modal.
          </p>
          <Link
            id="merchant-login-btn"
            href="/auth"
            className="btn-primary w-full text-xs inline-block"
          >
            Masuk Ke Terminal
          </Link>
        </div>
      </div>
    )
  }

  if (user.role !== 'MERCHANT') {
    return (
      <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center bg-bg-dark py-12 px-6">
        <div className="relative z-10 w-full max-w-md text-center border border-border-subtle bg-surface-dark p-8 rounded-lg">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <h2 className="font-sora text-xl font-bold text-text-primary mb-3">Role Anda Bukan Merchant</h2>
          <p className="text-xs text-text-secondary leading-relaxed mb-8">
            Terminal Merchant Dashboard ini dikhususkan bagi mitra dengan keanggotaan <span className="text-primary font-bold">MERCHANT</span>. Akun Anda saat ini bertipe <span className="text-primary font-bold">{user.role}</span>.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              id="merchant-switch-account"
              href="/auth"
              className="btn-primary text-xs"
            >
              Masuk dengan Akun Merchant
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

  if (user.role === 'MERCHANT' && !profile?.indukCommunityId) {
    return (
      <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center bg-bg-dark py-12 px-6">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(198,169,107,0.06)_0%,transparent_65%)] pointer-events-none z-0" />
        <div className="relative z-10 w-full max-w-lg text-center border border-border-subtle bg-surface-dark p-8 rounded-2xl shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-500 mb-2">
            <Info className="w-8 h-8" />
          </div>
          <h2 className="font-sora text-xl font-bold text-text-primary">Komunitas Induk Diperlukan</h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            Untuk mengaktifkan dan membuka Dashboard Merchant, Anda wajib bergabung ke salah satu <strong>Komunitas Induk</strong> (Perkumpulan atau Koperasi) terlebih dahulu.
          </p>
          <div className="pt-2">
            <Link
              href="/community"
              className="btn-primary w-full text-xs inline-block text-center py-3 bg-primary text-black font-bold uppercase tracking-wider rounded-xl shadow-lg"
            >
              Pilih Komunitas Induk Sekarang
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Calculate statistics
  const outOfStockItems = products.filter((p) => p.stock <= 0).length
  const totalItems = products.length

  // Pages management helpers
  const pagesList = (() => {
    if (!profile) return []
    try {
      const config = JSON.parse(profile.landingPageConfig || '{}')
      if (config.pages && Array.isArray(config.pages)) {
        return config.pages
      }
    } catch (e) {
      console.error(e)
    }
    return [
      {
        id: 'page-main',
        name: 'Main Storefront',
        slug: '',
        template: profile?.landingPageTemplate || 'template1',
        status: 'PUBLISHED',
        customDomain: profile?.customDomain || '',
        headDesktop: '',
        headMobile: '',
        footerAny: '',
        footerDesktop: '',
        footerMobile: '',
        allowSearch: 'Yes',
        followLinks: 'Yes',
        lastModified: new Date().toISOString()
      }
    ]
  })()

  const filteredPages = pagesList.filter((p: any) => {
    const matchesSearch = p.name.toLowerCase().includes(searchPageQuery.toLowerCase()) || 
                          (p.slug || '').toLowerCase().includes(searchPageQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus
    return matchesSearch && matchesStatus
  })

  return (
    <div className="relative min-h-screen bg-[#F5F7F9] pt-12 pb-24 px-6 md:px-10">
      <div className="relative z-10 max-w-[1200px] mx-auto">
        {/* Title Header */}
        <div className="mb-10 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h1 className="font-poppins text-2xl font-bold text-[#0F5132] mb-1">
              Merchant <span className="text-[#2DB24A]">Center</span>
            </h1>
            <p className="text-xs text-text-secondary">
              Kelola katalog produk, edit rincian stok barang, dan periksa buku penjualan Anda.
            </p>
          </div>
          <span className="btn-primary bg-primary/10 border border-primary/20 text-[10px] text-[#0F5132] shadow-sm">
            Merchant: {user.name}
          </span>
        </div>

        {/* Global Notifications */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-xs text-red-600 font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-100 text-xs text-primary font-medium">
            {success}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-slate-100 mb-8 overflow-x-auto whitespace-nowrap scrollbar-none pb-px">
          {[
            { id: 'overview', label: 'Ringkasan Toko' },
            { id: 'catalog', label: `Katalog Produk (${totalItems})` },
            { id: 'add', label: 'Tambah Produk' },
            { id: 'orders', label: `Pesanan Masuk (${orders.length})` },
            { id: 'analytics', label: 'Analitik Bisnis' },
            { id: 'pages', label: 'Daftar Halaman & Domain' },
            { id: 'academy', label: 'LMS Academy' },
          ].map(tab => (
            <button
              key={tab.id}
              id={`tab-merchant-${tab.id}`}
              onClick={() => { setActiveTab(tab.id as any); setEditingProduct(null); setEditingPage(null); }}
              className={`pb-3 px-5 text-xs font-bold transition-all relative shrink-0 cursor-pointer ${
                activeTab === tab.id
                  ? 'text-[#2DB24A] font-extrabold border-b-2 border-[#2DB24A]'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
                <span className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-3">
                  Saldo Penjualan Merchant
                </span>
                <h2 className="font-sora text-2xl font-black text-[#2DB24A] mb-4">
                  Rp {(wallet?.balance ?? 0).toLocaleString('id-ID')}
                </h2>
                <Link
                  href="/wallet"
                  className="text-[10px] font-bold text-[#0F5132] hover:text-[#2DB24A] uppercase tracking-wider flex items-center gap-1 transition-colors"
                >
                  Buka Ledger Penarikan
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
                <span className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-3">
                  Jumlah Produk Aktif
                </span>
                <h2 className="font-sora text-2xl font-black text-text-primary mb-4">
                  {totalItems} Item
                </h2>
                <button
                  onClick={() => setActiveTab('catalog')}
                  className="text-[10px] font-bold text-[#0F5132] hover:text-[#2DB24A] uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                >
                  Lihat Semua Produk
                </button>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
                <span className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-3">
                  Stok Menipis / Habis
                </span>
                <h2 className={`font-sora text-2xl font-black mb-4 ${outOfStockItems > 0 ? 'text-red-500 animate-pulse' : 'text-text-primary'}`}>
                  {outOfStockItems} Item
                </h2>
                <span className="text-[10px] text-text-secondary">
                  Lakukan pembaruan inventaris secara berkala.
                </span>
              </div>
            </div>

            {/* Additional Banners Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Showcase Quick Banner */}
              <div className="bg-white p-6 md:p-8 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                <div>
                  <h3 className="font-sora text-sm font-bold text-[#0F5132] mb-2">Pecinta Brand Visual Identity</h3>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Setiap merchant di Saloka.id Premium memiliki visual storefront storefront eksklusif. Pelajari tips mendesain brand premium Anda di modul LMS Academy kami untuk menarik lebih banyak pembeli high-end.
                  </p>
                </div>
              </div>

              {/* Saloka Bootcamp Banner */}
              <div className="bg-white p-6 md:p-8 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] border border-slate-100/80 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-sora text-sm font-bold text-[#0F5132]">Saloka Bootcamp Mentoring</h3>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#E8F5E9] text-[#0F5132] uppercase tracking-wider">
                      Oleh Saloka.id
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed mb-4">
                    Program inkubasi eksklusif UMKM Saloka untuk meningkatkan penjualan, legalitas bisnis, dan kesiapan modal kerja.
                  </p>
                </div>

                <div className="pt-2">
                  {/* Status & Action */}
                  {user?.level < 2 ? (
                    <div className="space-y-2">
                      <div className="text-[11px] font-semibold text-red-600 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                        Kualifikasi Belum Terpenuhi
                      </div>
                      <p className="text-[10px] text-text-secondary leading-normal">
                        Raih minimal <strong>Level 2</strong> untuk membuka akses pendaftaran Bootcamp. (Tingkat saat ini: Level {user?.level}).
                      </p>
                      <button disabled className="w-full py-2.5 bg-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider rounded-xl cursor-not-allowed">
                        Gabung Bootcamp
                      </button>
                    </div>
                  ) : !user?.bootcampStatus || user?.bootcampStatus === 'NONE' ? (
                    <div className="space-y-2">
                      <div className="text-[11px] font-semibold text-amber-600 flex items-center gap-1.5 animate-pulse">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Menunggu Aktivasi dari Admin
                      </div>
                      <p className="text-[10px] text-text-secondary leading-normal">
                        Anda telah mencapai Level {user?.level}. Silakan tunggu admin memverifikasi kualifikasi Anda untuk mengaktifkan tombol pendaftaran.
                      </p>
                      <button disabled className="w-full py-2.5 bg-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider rounded-xl cursor-not-allowed">
                        Gabung Bootcamp
                      </button>
                    </div>
                  ) : user?.bootcampStatus === 'QUALIFIED' ? (
                    <div className="space-y-2">
                      <div className="text-[11px] font-semibold text-green-600 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Lolos Kualifikasi - Akses Terbuka!
                      </div>
                      <p className="text-[10px] text-text-secondary leading-normal">
                        Anda memenuhi kualifikasi dari Admin. Klik tombol di bawah untuk bergabung ke Bootcamp Saloka.
                      </p>
                      <button
                        onClick={handleJoinBootcamp}
                        disabled={isPending}
                        className="w-full py-2.5 bg-[#0F5132] hover:bg-[#0c4028] text-white font-geist font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer"
                      >
                        {isPending ? 'Memproses...' : '🚀 Gabung Bootcamp'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-primary flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Sudah Terdaftar di Bootcamp
                      </div>
                      <p className="text-[10px] text-text-secondary leading-normal">
                        Selamat! Anda telah terdaftar sebagai peserta Bootcamp Saloka. Mentor kami akan segera menghubungi Anda untuk jadwal mentoring.
                      </p>
                      <button disabled className="w-full py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold uppercase tracking-wider rounded-xl cursor-default">
                        ✓ Terdaftar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'catalog' && (
          <div className="space-y-6">
            {/* Edit Panel Drawer/Form if editingProduct is active */}
            {editingProduct && (
              <div className="border border-primary/30 bg-surface-container/50 p-6 rounded-lg mb-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-sora text-sm font-bold text-text-primary">
                    Edit Detail Produk: {editingProduct.title}
                  </h3>
                  <button
                    onClick={() => setEditingProduct(null)}
                    className="text-xs font-semibold text-text-secondary hover:text-text-primary"
                  >
                    Batal Edit
                  </button>
                </div>

                <form onSubmit={handleUpdate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="edit-title" className="block text-[10px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-2">Nama Produk</label>
                      <input id="edit-title" type="text" name="title" defaultValue={editingProduct.title} required className="w-full h-11 px-4 bg-surface-container border border-border-subtle rounded text-xs text-text-primary focus:outline-none" />
                    </div>
                    <div>
                      <label htmlFor="edit-price" className="block text-[10px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-2">Harga (Rp)</label>
                      <input id="edit-price" type="number" name="price" defaultValue={editingProduct.price} required className="w-full h-11 px-4 bg-surface-container border border-border-subtle rounded text-xs text-text-primary focus:outline-none" />
                    </div>
                    <div>
                      <label htmlFor="edit-stock" className="block text-[10px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-2">Stok</label>
                      <input id="edit-stock" type="number" name="stock" defaultValue={editingProduct.stock} required className="w-full h-11 px-4 bg-surface-container border border-border-subtle rounded text-xs text-text-primary focus:outline-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="edit-category" className="block text-[10px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-2">Kategori</label>
                      <select id="edit-category" name="category" defaultValue={editingProduct.category} className="w-full h-11 px-4 bg-surface-container border border-border-subtle rounded text-xs text-text-primary focus:outline-none">
                        {PRODUCT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-2">Gambar Produk (Format: JPG, JPEG, PNG)</label>
                      <div className="flex-grow">
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/jpg"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              handleImageUpload(file, setEditImageUrl)
                            }
                          }}
                          className="hidden"
                          id="product-edit-upload"
                        />
                        
                        {editImageUrl ? (
                          <div className="relative group border border-border-subtle bg-surface-container rounded-lg overflow-hidden h-28 flex items-center justify-center">
                            <img src={editImageUrl} alt="Product Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity duration-300">
                              <label
                                htmlFor="product-edit-upload"
                                className="px-3 py-1.5 bg-white hover:bg-neutral-100 text-black rounded text-[10px] font-bold font-geist transition-all cursor-pointer shadow-md uppercase tracking-wider"
                              >
                                Ganti Gambar
                              </label>
                              <button
                                type="button"
                                onClick={() => setEditImageUrl('')}
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold font-geist transition-all cursor-pointer shadow-md uppercase tracking-wider"
                              >
                                Hapus
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label
                            htmlFor="product-edit-upload"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, setEditImageUrl)}
                            className="flex flex-col items-center justify-center border-2 border-dashed border-border-subtle hover:border-primary/50 bg-surface-container hover:bg-surface-container-high rounded-lg p-4 h-28 cursor-pointer transition-all group"
                          >
                            <div className="flex flex-col items-center gap-1.5">
                              <div className="p-1.5 bg-surface-dark rounded-full border border-border-subtle group-hover:border-primary/30 group-hover:text-primary transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-text-secondary group-hover:text-primary">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
                                </svg>
                              </div>
                              <div className="text-center">
                                <p className="text-[10px] font-bold text-text-primary group-hover:text-primary transition-colors">
                                  Pilih atau Tarik File Gambar
                                </p>
                                <p className="text-[8px] text-text-secondary mt-0.5">
                                  PNG, JPG, JPEG (Maks. 5MB)
                                </p>
                              </div>
                            </div>
                          </label>
                        )}
                        <input type="hidden" name="imageUrl" value={editImageUrl} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label htmlFor="edit-description" className="block text-[10px] font-geist font-bold text-text-secondary uppercase tracking-wider">Deskripsi Produk</label>
                      <button
                        type="button"
                        onClick={() => {
                          setTargetFormType('edit')
                          setAiCategory(editingProduct?.category || 'TOKO')
                          setAiKeywords(editingProduct?.title || '')
                          setShowAiModal(true)
                        }}
                        className="btn-primary bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-[10px] flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles size={11} className="animate-pulse" />
                        Generate dengan AI
                      </button>
                    </div>
                    <textarea id="edit-description" name="description" defaultValue={editingProduct.description} required rows={4} className="w-full px-4 py-3 bg-surface-container border border-border-subtle rounded text-xs text-text-primary focus:outline-none" />
                  </div>

                  {/* Affiliate Settings */}
                  <div className="border border-border-subtle bg-surface-container/30 p-4 rounded-lg space-y-4">
                    <h4 className="text-xs font-bold text-primary font-sora">Pengaturan Program Affiliate</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <div className="flex items-center gap-2 h-11">
                        <input
                          id="edit-isAffiliateEnabled"
                          type="checkbox"
                          name="isAffiliateEnabled"
                          defaultChecked={editingProduct.isAffiliateEnabled || false}
                          className="w-4 h-4 text-primary focus:ring-primary border-border-subtle rounded cursor-pointer"
                        />
                        <label htmlFor="edit-isAffiliateEnabled" className="text-xs font-bold text-text-primary cursor-pointer">Aktifkan Affiliate</label>
                      </div>
                      <div>
                        <label htmlFor="edit-affiliateCommissionType" className="block text-[10px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-2">Tipe Komisi</label>
                        <select
                          id="edit-affiliateCommissionType"
                          name="affiliateCommissionType"
                          defaultValue={editingProduct.affiliateCommissionType || 'PERCENT'}
                          className="w-full h-11 px-3 bg-surface-container border border-border-subtle rounded text-xs text-text-primary focus:outline-none"
                        >
                          <option value="PERCENT">Persentase (%)</option>
                          <option value="FIXED">Fix Komisi (Rupiah)</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="edit-affiliateCommissionValue" className="block text-[10px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-2">Nilai Komisi</label>
                        <input
                          id="edit-affiliateCommissionValue"
                          type="number"
                          step="any"
                          name="affiliateCommissionValue"
                          defaultValue={editingProduct.affiliateCommissionValue || 0}
                          className="w-full h-11 px-3 bg-surface-container border border-border-subtle rounded text-xs text-text-primary focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    id="edit-submit"
                    type="submit"
                    disabled={isPending}
                    className="btn-primary text-xs shadow-lg disabled:opacity-50"
                  >
                    {isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </form>
              </div>
            )}

            {/* Pengaturan Affiliate Global */}
            <div className="border border-border-subtle bg-surface-dark p-6 rounded-lg mb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
                <div>
                  <h3 className="font-sora text-sm font-bold text-text-primary flex items-center gap-2">
                    <Award size={16} className="text-primary" />
                    Pengaturan Affiliate Global
                  </h3>
                  <p className="text-[11px] text-text-secondary">
                    Terapkan pengaturan affiliate ke seluruh produk katalog Anda sekaligus.
                  </p>
                </div>
              </div>

              <form onSubmit={handleApplyGlobalAffiliate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="flex items-center gap-2 h-11">
                    <input
                      id="global-aff-enabled"
                      type="checkbox"
                      checked={globalAffEnabled}
                      onChange={(e) => setGlobalAffEnabled(e.target.checked)}
                      className="w-4 h-4 text-primary focus:ring-primary border-border-subtle rounded cursor-pointer"
                    />
                    <label htmlFor="global-aff-enabled" className="text-xs font-bold text-text-primary cursor-pointer">
                      Aktifkan Affiliate Global
                    </label>
                  </div>

                  <div>
                    <label htmlFor="global-aff-type" className="block text-[10px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-2">
                      Tipe Komisi
                    </label>
                    <select
                      id="global-aff-type"
                      value={globalCommType}
                      onChange={(e) => setGlobalCommType(e.target.value)}
                      className="w-full h-11 px-3 bg-surface-container border border-border-subtle rounded text-xs text-text-primary focus:outline-none"
                    >
                      <option value="PERCENT">Persentase (%)</option>
                      <option value="FIXED">Fix Komisi (Rupiah)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="global-aff-value" className="block text-[10px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-2">
                      Nilai Komisi
                    </label>
                    <input
                      id="global-aff-value"
                      type="number"
                      step="any"
                      value={globalCommValue}
                      onChange={(e) => setGlobalCommValue(Number(e.target.value))}
                      className="w-full h-11 px-3 bg-surface-container border border-border-subtle rounded text-xs text-text-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={isApplyingGlobal}
                      className="w-full h-11 bg-primary hover:bg-primary-container text-surface-dark font-geist font-bold text-xs uppercase tracking-wider rounded transition-colors shadow-lg disabled:opacity-50"
                    >
                      {isApplyingGlobal ? 'Menerapkan...' : 'Terapkan Masal'}
                    </button>
                  </div>
                </div>

                {globalStatus && (
                  <p className={`text-[11px] font-semibold ${globalStatus.startsWith('Berhasil') ? 'text-green-400' : 'text-red-400'}`}>
                    {globalStatus}
                  </p>
                )}
              </form>
            </div>

            {/* Catalog Grid list */}
            {products.length === 0 ? (
              <div className="text-center py-20 border border-border-subtle rounded bg-surface-dark">
                <h3 className="font-sora text-sm font-bold text-text-primary mb-2">Katalog Anda Kosong</h3>
                <p className="text-xs text-text-secondary max-w-xs mx-auto mb-6">
                  Anda belum menerbitkan produk apapun. Mulai tambahkan barang jualan Anda.
                </p>
                <button
                  onClick={() => setActiveTab('add')}
                  className="btn-primary text-xs"
                >
                  Tambah Produk Baru
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 border border-border-subtle bg-surface-dark rounded-lg flex items-center gap-4 justify-between"
                  >
                    <div className="flex items-center gap-4">
                      {/* Image Preview */}
                      <div className="w-16 h-16 bg-surface-container rounded border border-border-subtle overflow-hidden relative flex items-center justify-center flex-shrink-0">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.title} className="object-cover w-full h-full" />
                        ) : (
                          <span className="text-[8px] font-bold text-primary/40 uppercase">{formatCategoryName(p.category)}</span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-sora text-xs font-bold text-text-primary mb-1 line-clamp-1">
                          {p.title}
                        </h4>
                        <div className="flex gap-2 items-center mb-1">
                          <span className="btn-primary bg-primary/10 border border-primary/25 text-[8px] text-primary">
                            {formatCategoryName(p.category)}
                          </span>
                          <span className={`text-[10px] font-semibold ${p.stock <= 0 ? 'text-red-400' : 'text-text-secondary'}`}>
                            Stok: {p.stock}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-primary font-geist">
                          Rp {p.price.toLocaleString('id-ID')}
                        </div>
                      </div>
                    </div>

                    {/* Manage actions */}
                    <div className="flex gap-2">
                      <button
                        id={`btn-edit-prod-${p.id}`}
                        onClick={() => { setEditingProduct(p); setEditImageUrl(p.imageUrl || ''); setError(null); setSuccess(null); }}
                        className="px-3 py-2 bg-surface-container hover:bg-surface-container-high border border-border-subtle hover:border-primary/45 rounded text-[10px] font-geist font-bold uppercase tracking-wider text-text-primary transition-all duration-300"
                      >
                        Edit
                      </button>
                      <button
                        id={`btn-delete-prod-${p.id}`}
                        onClick={() => handleDelete(p.id)}
                        className="px-3 py-2 bg-surface-container hover:bg-surface-container-high border border-border-subtle hover:border-red-500/40 rounded text-[10px] font-geist font-bold uppercase tracking-wider text-red-400 transition-all duration-300"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'add' && (
          <div className="border border-border-subtle bg-surface-dark p-6 md:p-8 rounded-lg">
            <h3 className="font-sora text-base font-bold text-text-primary mb-2">
              Tambah Produk Ke Katalog
            </h3>
            <p className="text-xs text-text-secondary mb-8">
              Masukkan detail produk dengan lengkap. Produk akan segera didistribusikan ke Saloka Marketplace.
            </p>

            <form onSubmit={handleCreate} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="create-title" className="block text-[10px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-2">Nama Produk</label>
                  <input id="create-title" type="text" name="title" required placeholder="cth: Artisan Linen Shirt" className="w-full h-11 px-4 bg-surface-container border border-border-subtle rounded text-xs text-text-primary focus:outline-none" />
                </div>
                <div>
                  <label htmlFor="create-price" className="block text-[10px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-2">Harga (Rp)</label>
                  <input id="create-price" type="number" name="price" required placeholder="cth: 350000" className="w-full h-11 px-4 bg-surface-container border border-border-subtle rounded text-xs text-text-primary focus:outline-none" />
                </div>
                <div>
                  <label htmlFor="create-stock" className="block text-[10px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-2">Stok Barang</label>
                  <input id="create-stock" type="number" name="stock" required placeholder="cth: 50" className="w-full h-11 px-4 bg-surface-container border border-border-subtle rounded text-xs text-text-primary focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="create-category" className="block text-[10px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-2">Kategori Bisnis</label>
                  <select id="create-category" name="category" className="w-full h-11 px-4 bg-surface-container border border-border-subtle rounded text-xs text-text-primary focus:outline-none">
                    {PRODUCT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-2">Gambar Produk (Format: JPG, JPEG, PNG)</label>
                  <div className="flex-grow">
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleImageUpload(file, setCreateImageUrl)
                        }
                      }}
                      className="hidden"
                      id="product-create-upload"
                    />
                    
                    {createImageUrl ? (
                      <div className="relative group border border-border-subtle bg-surface-container rounded-lg overflow-hidden h-28 flex items-center justify-center">
                        <img src={createImageUrl} alt="Product Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity duration-300">
                          <label
                            htmlFor="product-create-upload"
                            className="px-3 py-1.5 bg-white hover:bg-neutral-100 text-black rounded text-[10px] font-bold font-geist transition-all cursor-pointer shadow-md uppercase tracking-wider"
                          >
                            Ganti Gambar
                          </label>
                          <button
                            type="button"
                            onClick={() => setCreateImageUrl('')}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold font-geist transition-all cursor-pointer shadow-md uppercase tracking-wider"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label
                        htmlFor="product-create-upload"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, setCreateImageUrl)}
                        className="flex flex-col items-center justify-center border-2 border-dashed border-border-subtle hover:border-primary/50 bg-surface-container hover:bg-surface-container-high rounded-lg p-4 h-28 cursor-pointer transition-all group"
                      >
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="p-1.5 bg-surface-dark rounded-full border border-border-subtle group-hover:border-primary/30 group-hover:text-primary transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-text-secondary group-hover:text-primary">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
                            </svg>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] font-bold text-text-primary group-hover:text-primary transition-colors">
                              Pilih atau Tarik File Gambar
                            </p>
                            <p className="text-[8px] text-text-secondary mt-0.5">
                              PNG, JPG, JPEG (Maks. 5MB)
                            </p>
                          </div>
                        </div>
                      </label>
                    )}
                    <input type="hidden" name="imageUrl" value={createImageUrl} />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="create-description" className="block text-[10px] font-geist font-bold text-text-secondary uppercase tracking-wider">Deskripsi Produk</label>
                  <button
                    type="button"
                    onClick={() => {
                      setTargetFormType('create')
                      setAiCategory((document.getElementById('create-category') as HTMLSelectElement)?.value || 'TOKO')
                      setAiKeywords((document.getElementById('create-title') as HTMLInputElement)?.value || '')
                      setShowAiModal(true)
                    }}
                    className="btn-primary bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-[10px] flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles size={11} className="animate-pulse" />
                    Generate dengan AI
                  </button>
                </div>
                <textarea id="create-description" name="description" required placeholder="Jelaskan spesifikasi, material, dan kelebihan premium produk Anda..." rows={5} className="w-full px-4 py-3 bg-surface-container border border-border-subtle rounded text-xs text-text-primary focus:outline-none" />
              </div>

              {/* Affiliate Settings */}
              <div className="border border-border-subtle bg-surface-container/30 p-4 rounded-lg space-y-4">
                <h4 className="text-xs font-bold text-primary font-sora">Pengaturan Program Affiliate</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div className="flex items-center gap-2 h-11">
                    <input
                      id="create-isAffiliateEnabled"
                      type="checkbox"
                      name="isAffiliateEnabled"
                      className="w-4 h-4 text-primary focus:ring-primary border-border-subtle rounded cursor-pointer"
                    />
                    <label htmlFor="create-isAffiliateEnabled" className="text-xs font-bold text-text-primary cursor-pointer">Aktifkan Affiliate</label>
                  </div>
                  <div>
                    <label htmlFor="create-affiliateCommissionType" className="block text-[10px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-2">Tipe Komisi</label>
                    <select
                      id="create-affiliateCommissionType"
                      name="affiliateCommissionType"
                      defaultValue="PERCENT"
                      className="w-full h-11 px-3 bg-surface-container border border-border-subtle rounded text-xs text-text-primary focus:outline-none"
                    >
                      <option value="PERCENT">Persentase (%)</option>
                      <option value="FIXED">Fix Komisi (Rupiah)</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="create-affiliateCommissionValue" className="block text-[10px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-2">Nilai Komisi</label>
                    <input
                      id="create-affiliateCommissionValue"
                      type="number"
                      step="any"
                      name="affiliateCommissionValue"
                      defaultValue={0}
                      className="w-full h-11 px-3 bg-surface-container border border-border-subtle rounded text-xs text-text-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                id="create-submit"
                type="submit"
                disabled={isPending}
                className="btn-primary w-full mt-2 text-xs shadow-lg disabled:opacity-50"
              >
                {isPending ? 'Menerbitkan...' : 'Terbitkan Produk Sekarang'}
              </button>
            </form>
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {selectedOrder ? (
              <div className="border border-primary/30 bg-surface-container/50 p-6 rounded-lg">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-sora text-sm font-bold text-text-primary">
                    Update Status Pesanan: {selectedOrder.id.replace('order-', '#')}
                  </h3>
                  <button
                    onClick={() => { setSelectedOrder(null); setStatusNotes(''); }}
                    className="text-xs font-semibold text-text-secondary hover:text-text-primary cursor-pointer"
                  >
                    Kembali ke Daftar
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                  <div className="space-y-4 text-xs text-text-secondary">
                    <p><strong className="text-text-primary">Pembeli:</strong> {selectedOrder.buyer?.name || 'Customer'}</p>
                    <p><strong className="text-text-primary">Alamat Kirim:</strong> {selectedOrder.shippingAddress || 'Tidak Ada'}</p>
                    <p><strong className="text-text-primary">Kurir:</strong> {selectedOrder.courier || 'Tidak Ada'}</p>
                    <p><strong className="text-text-primary">Total Pembayaran:</strong> Rp {selectedOrder.totalAmount.toLocaleString('id-ID')}</p>
                    
                    {selectedOrder.shippingLabel && (
                      <p><strong className="text-primary font-bold">Resi Pengiriman:</strong> <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-mono">{selectedOrder.shippingLabel}</span></p>
                    )}
                    
                    <div className="border-t border-border-subtle/50 pt-4 mt-4">
                      <h4 className="font-bold text-text-primary mb-2">Item Pesanan:</h4>
                      {selectedOrder.items?.map((item: any, idx: number) => (
                        <div key={item.id || idx} className="flex justify-between mb-1.5">
                          <span>{item.product?.title || item.productTitle} x{item.quantity}</span>
                          <span className="font-bold">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-sora text-xs font-bold text-text-primary mb-4 uppercase tracking-wider">Pilih Status Baru</h4>
                    <div className="space-y-3">
                      {(['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const).map((status) => {
                        const labels = {
                          PROCESSING: 'Proses Pesanan',
                          SHIPPED: 'Kirim Barang (Kurir)',
                          DELIVERED: 'Tandai Selesai (Diterima)',
                          CANCELLED: 'Batalkan Pesanan'
                        }
                        const isCurrent = selectedOrder.tracking?.some((t: any) => t.status === status)

                        return (
                          <button
                            key={status}
                            disabled={updatingStatus || isCurrent}
                            onClick={async () => {
                              setUpdatingStatus(true)
                              const res = await updateOrderTracking(selectedOrder.id, status, statusNotes)
                              if (res.error) {
                                setError(res.error)
                              } else {
                                setSuccess(`Status pesanan berhasil diperbarui menjadi ${status}!`)
                                setSelectedOrder(null)
                                setStatusNotes('')
                                await loadData()
                              }
                              setUpdatingStatus(false)
                            }}
                            className={`w-full py-3 px-4 border rounded-lg text-xs font-bold uppercase tracking-wider transition-all text-left flex items-center justify-between cursor-pointer ${
                              isCurrent
                                ? 'bg-primary/5 border-primary text-primary opacity-60 cursor-not-allowed'
                                : 'bg-surface-container hover:bg-surface-container-high border-border-subtle text-text-primary'
                            }`}
                          >
                            <span>{labels[status]}</span>
                            {isCurrent && <span className="text-[9px] font-bold">SELESAI</span>}
                          </button>
                        )
                      })}
                    </div>

                    {!selectedOrder.shippingLabel && selectedOrder.tracking?.some((t: any) => t.status === 'PROCESSING') && (
                      <div className="mt-6 p-4 border border-primary/30 bg-primary/5 rounded-lg mb-6">
                        <label className="block text-[10px] font-geist font-bold text-primary uppercase tracking-wider mb-2">
                          Input Resi Kurir (Live Tracking)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={shippingLabelInput}
                            onChange={(e) => setShippingLabelInput(e.target.value)}
                            placeholder="JNE123456789"
                            className="flex-1 px-4 py-2 bg-surface-container border border-primary/30 rounded text-xs text-text-primary focus:outline-none focus:border-primary"
                          />
                          <button
                            disabled={updatingStatus || !shippingLabelInput}
                            onClick={async () => {
                              setUpdatingStatus(true)
                              const res = await updateShippingLabel(selectedOrder.id, shippingLabelInput)
                              if (res.error) {
                                setError(res.error)
                              } else {
                                setSuccess('Resi berhasil diinput dan pesanan otomatis berstatus SHIPPED!')
                                setShippingLabelInput('')
                                setSelectedOrder(null)
                                await loadData()
                              }
                              setUpdatingStatus(false)
                            }}
                            className="px-4 py-2 bg-primary hover:bg-primary/90 text-on-surface rounded text-xs font-bold disabled:opacity-50 transition-colors"
                          >
                            Simpan Resi
                          </button>
                        </div>
                        <p className="text-[9px] text-text-secondary mt-2">Menyimpan resi akan otomatis memperbarui status menjadi <strong className="text-text-primary uppercase">SHIPPED</strong>.</p>
                      </div>
                    )}

                    <div className="mt-6">
                      <label htmlFor="status-note" className="block text-[10px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-2">
                        Catatan Update Status (Opsional)
                      </label>
                      <textarea
                        id="status-note"
                        value={statusNotes}
                        onChange={(e) => setStatusNotes(e.target.value)}
                        placeholder="Pesanan sedang dipacking / Nomor Resi: JNE123456789"
                        rows={2}
                        className="w-full px-4 py-3 bg-surface-container border border-border-subtle rounded text-xs text-text-primary focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-border-subtle bg-surface-dark p-6 rounded-lg">
                <h3 className="font-sora text-sm font-bold text-text-primary mb-6 uppercase tracking-wider">Pesanan Masuk</h3>
                {orders.length === 0 ? (
                  <p className="text-xs text-text-secondary py-8 text-center">Belum ada pesanan masuk untuk produk Anda.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left text-text-secondary border-collapse">
                      <thead>
                        <tr className="border-b border-border-subtle text-[10px] uppercase tracking-wider font-bold">
                          <th className="py-3 px-4">ID Pesanan</th>
                          <th className="py-3 px-4">Tanggal</th>
                          <th className="py-3 px-4">Pembeli</th>
                          <th className="py-3 px-4">Total Penjualan</th>
                          <th className="py-3 px-4">Status Kurir</th>
                          <th className="py-3 px-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((o) => {
                          const dateStr = new Date(o.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })
                          const lastTracking = o.tracking?.length > 0 ? o.tracking[o.tracking.length - 1].status : 'CONFIRMED'
                          
                          return (
                            <tr key={o.id} className="border-b border-border-subtle/50 hover:bg-surface-container-low transition-colors">
                              <td className="py-3 px-4 font-bold text-text-primary">{o.id.replace('order-', '#')}</td>
                              <td className="py-3 px-4">{dateStr}</td>
                              <td className="py-3 px-4">{o.buyer?.name || 'Customer'}</td>
                              <td className="py-3 px-4 font-bold text-primary">Rp {o.totalAmount.toLocaleString('id-ID')}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                                  lastTracking === 'DELIVERED'
                                    ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                    : lastTracking === 'CANCELLED'
                                    ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                    : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400 animate-pulse'
                                }`}>
                                  {lastTracking}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  id={`btn-manage-order-${o.id}`}
                                  onClick={() => setSelectedOrder(o)}
                                  className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high border border-border-subtle hover:border-primary/45 rounded text-[10px] font-geist font-bold uppercase tracking-wider text-text-primary transition-all duration-300 cursor-pointer"
                                >
                                  Kelola Status
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {/* Revenue Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="border border-border-subtle bg-surface-dark p-6 rounded-xl shadow-md flex items-center justify-between">
                <div>
                  <span className="block text-[8px] font-geist font-bold text-text-secondary uppercase tracking-widest mb-1.5">Revenue Hari Ini</span>
                  <h2 className="font-sora text-xl font-extrabold text-primary">Rp {(analytics?.revenueToday ?? 0).toLocaleString('id-ID')}</h2>
                </div>
                <div className="btn-primary w-10 bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <DollarSign size={18} />
                </div>
              </div>

              <div className="border border-border-subtle bg-surface-dark p-6 rounded-xl shadow-md flex items-center justify-between">
                <div>
                  <span className="block text-[8px] font-geist font-bold text-text-secondary uppercase tracking-widest mb-1.5">7 Hari Terakhir</span>
                  <h2 className="font-sora text-xl font-extrabold text-primary">Rp {(analytics?.revenue7Days ?? 0).toLocaleString('id-ID')}</h2>
                </div>
                <div className="btn-primary w-10 bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <TrendingUp size={18} />
                </div>
              </div>

              <div className="border border-border-subtle bg-surface-dark p-6 rounded-xl shadow-md flex items-center justify-between">
                <div>
                  <span className="block text-[8px] font-geist font-bold text-text-secondary uppercase tracking-widest mb-1.5">30 Hari Terakhir</span>
                  <h2 className="font-sora text-xl font-extrabold text-primary">Rp {(analytics?.revenue30Days ?? 0).toLocaleString('id-ID')}</h2>
                </div>
                <div className="btn-primary w-10 bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Calendar size={18} />
                </div>
              </div>

              <div className="border border-border-subtle bg-surface-dark p-6 rounded-xl shadow-md flex items-center justify-between">
                <div>
                  <span className="block text-[8px] font-geist font-bold text-text-secondary uppercase tracking-widest mb-1.5">Total Penjualan</span>
                  <h2 className="font-sora text-xl font-extrabold text-primary">Rp {(analytics?.totalRevenue ?? 0).toLocaleString('id-ID')}</h2>
                </div>
                <div className="btn-primary w-10 bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Award size={18} />
                </div>
              </div>
            </div>

            {/* Charts and stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Native SVG Chart */}
              <div className="lg:col-span-2 border border-border-subtle bg-surface-dark p-6 rounded-xl shadow-md">
                <h3 className="font-sora text-xs font-bold text-text-primary mb-6 uppercase tracking-wider">Tren Pendapatan (7 Hari Terakhir)</h3>
                
                {analytics?.dailyRevenue && (
                  <div className="h-64 flex flex-col justify-end">
                    {/* SVG Bar Chart */}
                    <div className="flex-1 flex items-end justify-between gap-3 px-2">
                      {analytics.dailyRevenue.map((d: any, idx: number) => {
                        const maxVal = Math.max(...analytics.dailyRevenue.map((x: any) => x.amount), 100000)
                        const barHeight = `${Math.min(100, Math.max(8, (d.amount / maxVal) * 100))}%`
                        
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end relative">
                            <span className="absolute -top-7 scale-0 group-hover:scale-100 bg-surface-container border border-border-subtle text-[9px] px-2 py-1 rounded text-primary font-bold transition-transform shadow z-25 whitespace-nowrap">
                              Rp {d.amount.toLocaleString('id-ID')}
                            </span>
                            
                            <div 
                              style={{ height: barHeight }} 
                              className="w-full bg-gradient-to-t from-primary to-primary-container rounded-t-md group-hover:opacity-95 transition-all duration-300 shadow shadow-primary/20"
                            />
                            
                            <span className="text-[8px] text-text-secondary font-geist uppercase whitespace-nowrap">{d.label}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Top Selling Products */}
              <div className="border border-border-subtle bg-surface-dark p-6 rounded-xl shadow-md">
                <h3 className="font-sora text-xs font-bold text-text-primary mb-6 uppercase tracking-wider">5 Produk Terlaris</h3>
                
                {(!analytics?.topProducts || analytics.topProducts.length === 0) ? (
                  <p className="text-xs text-text-secondary py-8 text-center">Belum ada data produk terjual.</p>
                ) : (
                  <div className="space-y-4">
                    {analytics.topProducts.map((p: any, idx: number) => (
                      <div key={p.id || idx} className="flex items-center justify-between border-b border-border-subtle/40 last:border-none pb-3 last:pb-0">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-text-primary truncate">{p.title}</p>
                          <p className="text-[9px] text-text-secondary font-geist mt-0.5">{p.quantity} Item Terjual</p>
                        </div>
                        <span className="text-xs font-bold text-primary whitespace-nowrap pl-2">
                          Rp {p.revenue.toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Inventory Status */}
            <div className="border border-border-subtle bg-surface-dark p-6 rounded-xl shadow-md">
              <h3 className="font-sora text-xs font-bold text-text-primary mb-4 uppercase tracking-wider">Status Inventaris Produk</h3>
              <div className="grid grid-cols-3 gap-6 text-center text-xs">
                <div className="bg-surface-container-low p-4 border border-border-subtle rounded-lg">
                  <span className="text-text-secondary block mb-1">Total Produk</span>
                  <span className="text-lg font-black text-text-primary">{analytics?.productStats?.total ?? 0}</span>
                </div>
                <div className="bg-green-500/5 p-4 border border-green-500/10 rounded-lg">
                  <span className="text-green-400 block mb-1">Aktif (Tersedia)</span>
                  <span className="text-lg font-black text-green-400">{analytics?.productStats?.active ?? 0}</span>
                </div>
                <div className="bg-red-500/5 p-4 border border-red-500/10 rounded-lg">
                  <span className="text-red-400 block mb-1">Stok Habis</span>
                  <span className="text-lg font-black text-red-400">{analytics?.productStats?.soldOut ?? 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'customization' && (
          <div className="flex flex-col lg:flex-row border border-border-subtle rounded-xl overflow-hidden bg-surface-dark glow-card min-h-[700px] text-text-primary">
            {/* Customization Sidebar */}
            <div className="w-full lg:w-80 bg-surface-container-lowest border-r border-border-subtle flex flex-col p-6 space-y-6 shrink-0">
              <div>
                <h3 className="font-sora text-sm font-bold text-text-primary">Storefront Editor</h3>
                <p className="text-[11px] text-text-secondary">Sesuaikan tampilan toko online Anda</p>
              </div>

              {/* Template Picker */}
              <div className="space-y-2">
                <button
                  type="button"
                  className="w-full group flex items-center justify-between p-4 bg-surface-container-low rounded-xl border border-border-subtle hover:border-primary transition-all"
                  onClick={() => setIsGalleryOpen(true)}
                >
                  <div className="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-primary">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L12 7.5l4.179 2.25m-11.142 4.5L12 16.5l4.179-2.25m1.142-2.25 4.179 2.25-4.179 2.25" />
                    </svg>
                    <div className="text-left">
                      <p className="text-[11px] font-bold text-text-primary">Pilih Template</p>
                      <p className="text-[9px] text-text-secondary uppercase">
                        {storefrontTemplate === 'gold' && 'Modern Gold Aktif'}
                        {storefrontTemplate === 'noir' && 'Minimal Noir Aktif'}
                        {storefrontTemplate === 'clean' && 'Clean Professional Aktif'}
                        {storefrontTemplate === 'studio' && 'Studio Design Aktif'}
                        {storefrontTemplate === 'brutalist' && 'Neo Brutalism Aktif'}
                        {storefrontTemplate === 'swiss' && 'Swiss Minimalist Aktif'}
                        {storefrontTemplate === 'destijl' && 'De Stijl Abstract Aktif'}
                        {storefrontTemplate === 'hpc' && 'HPC Performance Aktif'}
                      </p>
                    </div>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-text-secondary group-hover:translate-x-1 transition-transform">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>

              {/* Layout Options */}
              <div className="space-y-3">
                <label className="text-[10px] font-geist font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-text-secondary">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h12A2.25 2.25 0 0 1 20.25 6v12A2.25 2.25 0 0 1 18 20.25H6A2.25 2.25 0 0 1 3.75 18V6ZM9 3.75v16.5M9 12h11.25" />
                  </svg> Layout
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setStorefrontLayout('standard')}
                    className={`p-3 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${
                      storefrontLayout === 'standard'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border-subtle text-text-secondary hover:bg-surface-container-low'
                    }`}
                  >
                    <div className="w-full h-10 bg-surface-container rounded flex items-center justify-center">
                      <div className="w-6 h-6 bg-surface-container-lowest rounded-sm shadow-sm"></div>
                    </div>
                    <span className="text-[10px] font-bold">Standard</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStorefrontLayout('split')}
                    className={`p-3 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${
                      storefrontLayout === 'split'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border-subtle text-text-secondary hover:bg-surface-container-low'
                    }`}
                  >
                    <div className="w-full h-10 bg-surface-container rounded flex items-center justify-center">
                      <div className="w-full h-5 px-1 flex gap-1">
                        <div className="flex-1 bg-surface-container-lowest rounded-sm"></div>
                        <div className="flex-1 bg-surface-container-lowest rounded-sm"></div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold">Split View</span>
                  </button>
                </div>
              </div>

              {/* Theme Selector */}
              <div className="space-y-3">
                <label className="text-[10px] font-geist font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-text-secondary">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1-1.622-3.395m3.42-3.42a15.995 15.995 0 0 0 3.394-1.622m4.73-4.73a.75.75 0 0 0-1.06 0L4.836 12.016a3 3 0 0 0-.642 1.063l-.707 2.121a.75.75 0 0 0 .949.949l2.121-.707a3 3 0 0 0 1.063-.642L18.664 4.836Zm0 0a.75.75 0 0 1 1.06 0l1.414 1.414a.75.75 0 0 1 0 1.061L18.664 4.836Z" />
                  </svg> Tema Tampilan
                </label>
                <div className="flex bg-surface-container rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setStorefrontTheme('light')}
                    className={`flex-1 py-1.5 rounded text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                      storefrontTheme === 'light'
                        ? 'bg-surface-container-lowest text-primary shadow-sm'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21M4.22 4.22l1.59 1.59m12.38 12.38l1.59 1.59M3 12h2.25m13.5 0H21M4.22 19.78l1.59-1.59m12.38-12.38l1.59-1.59M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z" />
                    </svg> Light
                  </button>
                  <button
                    type="button"
                    onClick={() => setStorefrontTheme('dark')}
                    className={`flex-1 py-1.5 rounded text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                      storefrontTheme === 'dark'
                        ? 'bg-surface-container-lowest text-primary shadow-sm'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                    </svg> Dark
                  </button>
                </div>
              </div>

              {/* Banner Image Input */}
              <div className="space-y-3">
                <label className="text-[10px] font-geist font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-text-secondary">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                  </svg> Gambar Banner
                </label>
                <input
                  type="text"
                  value={storefrontBanner}
                  onChange={(e) => setStorefrontBanner(e.target.value)}
                  placeholder="https://..."
                  className="w-full h-9 px-3 bg-surface-container border border-border-subtle rounded text-[11px] text-text-primary focus:outline-none"
                />
                <div className="relative group aspect-video rounded-lg overflow-hidden border border-dashed border-outline-variant hover:border-primary transition-all">
                  <img src={storefrontBanner} alt="Banner Preview" className="w-full h-full object-cover" />
                </div>
              </div>

              {/* Sections Selector */}
              <div className="space-y-3">
                <label className="text-[10px] font-geist font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-text-secondary">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L12 7.5l4.179 2.25m-11.142 4.5L12 16.5l4.179-2.25m1.142-2.25 4.179 2.25-4.179 2.25" />
                  </svg> Bagian Halaman
                </label>
                <div className="space-y-2">
                  <label className="flex items-center justify-between p-2.5 bg-surface-container-low rounded-lg cursor-pointer">
                    <span className="text-[11px] font-bold text-text-primary">Hero Section</span>
                    <input
                      type="checkbox"
                      checked={showHero}
                      onChange={(e) => setShowHero(e.target.checked)}
                      className="rounded text-primary focus:ring-primary h-4 w-4"
                    />
                  </label>
                  <label className="flex items-center justify-between p-2.5 bg-surface-container-low rounded-lg cursor-pointer">
                    <span className="text-[11px] font-bold text-text-primary">Katalog Produk</span>
                    <input
                      type="checkbox"
                      checked={showProducts}
                      onChange={(e) => setShowProducts(e.target.checked)}
                      className="rounded text-primary focus:ring-primary h-4 w-4"
                    />
                  </label>
                  <label className="flex items-center justify-between p-2.5 bg-surface-container-low rounded-lg cursor-pointer">
                    <span className="text-[11px] font-bold text-text-primary">Testimoni</span>
                    <input
                      type="checkbox"
                      checked={showTestimonials}
                      onChange={(e) => setShowTestimonials(e.target.checked)}
                      className="rounded text-primary focus:ring-primary h-4 w-4"
                    />
                  </label>
                </div>
              </div>

              {/* Save changes */}
              <button
                type="button"
                onClick={handleSaveStorefront}
                className="btn-primary w-full text-xs active:scale-95 shadow-md"
              >
                Simpan Perubahan
              </button>
            </div>

            {/* Right scaled preview canvas */}
            <div className="flex-grow bg-surface-container-low relative flex flex-col p-6 min-h-[700px] items-center justify-center overflow-hidden">
              <div
                className="w-full bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300"
                style={{
                  transform: `scale(${previewScale})`,
                  transformOrigin: 'center center',
                  maxWidth: previewDevice === 'mobile' ? '375px' : previewDevice === 'tablet' ? '768px' : '100%',
                  aspectRatio: previewDevice === 'mobile' ? '9/16' : previewDevice === 'tablet' ? '3/4' : 'auto',
                }}
              >
                {/* Dynamic Storefront Preview Shell */}
                <div className={`w-full h-full flex flex-col min-h-[600px] text-left transition-colors duration-300 ${tStyles.bg} ${tStyles.font}`}>
                  {/* Header */}
                  <header className={`h-16 flex items-center justify-between px-8 border-b ${tStyles.headerBorder}`}>
                    <span className={tStyles.logoColor}>
                      {`TOKO ${user?.name ? user.name.toUpperCase() : 'MITRA UMKM'}`}
                    </span>
                    <div className="flex gap-4 text-[10px] font-bold opacity-80">
                      <span>Beranda</span>
                      <span>Koleksi</span>
                      <span>Tentang</span>
                    </div>
                  </header>

                  <div className={`flex-1 ${storefrontLayout === 'split' && previewDevice !== 'mobile' ? 'grid grid-cols-12 divide-x ' + tStyles.headerBorder : 'flex flex-col'}`}>
                    {/* Left/Main Column (Hero & Testimonials) */}
                    <div className={`${storefrontLayout === 'split' && previewDevice !== 'mobile' ? 'col-span-5 flex flex-col justify-between' : 'w-full'}`}>
                      {showHero && (
                        storefrontLayout === 'split' && previewDevice !== 'mobile' ? (
                          <div className="relative h-full min-h-[350px] overflow-hidden flex flex-col justify-center">
                            <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/80 to-black/40 z-0">
                              <img src={storefrontBanner} alt="Hero Banner" className="w-full h-full object-cover opacity-35 mix-blend-overlay" />
                            </div>
                            <div className="relative z-10 p-6 space-y-3 text-white">
                              <h4 className={`text-base font-bold leading-tight ${tStyles.font}`}>
                                Elevasi Bisnis Lokal Anda
                              </h4>
                              <p className="text-[9px] opacity-80 leading-relaxed">
                                Dapatkan koleksi kerajinan tangan terbaik langsung dari pengrajin lokal di lingkungan Anda.
                              </p>
                              <div>
                                <button
                                  type="button"
                                  className={tStyles.buttonClass}
                                >
                                  Belanja Sekarang
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="relative h-[240px] overflow-hidden flex-shrink-0">
                            <img src={storefrontBanner} alt="Hero Banner" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 flex items-center px-10 bg-gradient-to-r from-black/85 via-black/55 to-transparent text-white">
                              <div className="max-w-[280px] space-y-2">
                                <h4 className={`text-xl font-bold leading-tight ${tStyles.font}`}>
                                  Elevasi Bisnis Lokal Anda
                                </h4>
                                <p className="text-[10px] opacity-80 leading-relaxed">
                                  Dapatkan koleksi kerajinan tangan terbaik langsung dari pengrajin lokal di lingkungan Anda.
                                </p>
                                <button
                                  type="button"
                                  className={tStyles.buttonClass}
                                >
                                  Belanja Sekarang
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                      {showTestimonials && (
                        <div className="p-8 border-t border-outline-variant/10 space-y-4">
                          <h5 className="text-xs font-bold text-center">Testimoni Pelanggan</h5>
                          <div className={`p-4 text-center ${tStyles.testimonialBg} ${tStyles.testimonialRound}`}>
                            <p className="text-[10px] italic">"Produk sangat berkualitas, pelayanan ramah and pengiriman sangat cepat."</p>
                            <p className={`text-[9px] font-bold mt-2 ${tStyles.accentText}`}>- Ahmad S.</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right/Second Column (Product Grid) */}
                    <div className={`${storefrontLayout === 'split' && previewDevice !== 'mobile' ? 'col-span-7 p-8' : 'p-8'} space-y-6`}>
                      {showProducts && (
                        <>
                          <div className="flex justify-between items-end border-b pb-2 border-outline-variant/20">
                            <div>
                              <p className="text-primary font-bold text-[9px] tracking-widest uppercase">Katalog Pilihan</p>
                              <h5 className="text-xs font-bold">Produk Unggulan</h5>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            {products.length > 0 ? (
                              products.slice(0, 3).map((prod) => (
                                <div key={prod.id} className={tStyles.cardClass}>
                                  <div className="aspect-square bg-surface-container rounded-lg overflow-hidden border border-border-subtle relative flex items-center justify-center">
                                    {prod.imageUrl ? (
                                      <img src={prod.imageUrl} alt={prod.title} className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="text-[9px] font-bold opacity-30 uppercase">{prod.category}</span>
                                    )}
                                    <div className="absolute top-2 left-2">
                                      <span className={tStyles.badgeClass}>{prod.category}</span>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="font-bold text-xs line-clamp-1">{prod.title}</p>
                                    <p className={`${tStyles.accentText} text-xs`}>Rp {prod.price.toLocaleString('id-ID')}</p>
                                    <p className="text-[9px] opacity-75">Stok: {prod.stock}</p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <>
                                <div className={tStyles.cardClass}>
                                  <div className="aspect-square bg-surface-container rounded-lg overflow-hidden border border-border-subtle relative">
                                    <img
                                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCXRepciMT1C4odmYI32imX7EceRCGBJaNd2p3npTCXOuUlEzFpAe4n6mJdmYM7Nl4jq73ZmSPnO8gjqWKyECJOvDv-Wj6_bDSs764eh3VSeA1YEWGPz6NCXpD0IBAANBQkwszW_8oz7SdtMF6eDW1qgSabimjIUT6XsOzIglTtd9T2_VMd4H6hsjD11SbxUSwzB5WBZsn6zv5XujKB20N_lzzcDT-k_xr0dn5ml46DiO8yNkoo4E8VTFoard5eKiPCz8jFtfgNYKhK"
                                      alt="Mock 1"
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-2 left-2">
                                      <span className={tStyles.badgeClass}>TOKO</span>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="font-bold text-xs">Vas Keramik Minimalis</p>
                                    <p className={`${tStyles.accentText} text-xs`}>Rp 249.000</p>
                                  </div>
                                </div>
                                <div className={tStyles.cardClass}>
                                  <div className="aspect-square bg-surface-container rounded-lg overflow-hidden border border-border-subtle relative">
                                    <img
                                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBGhJFBJsfTd1sg2PB4JWl9wxNHlddcR4Tspx_5LNWHPBpyvhecnASZOLS8nWNdvQ_RqjSIh4akLcz4UxVKt0IOxYCS-kFO8rO2srCaMgwvGyiGl81ov9HQHUhPvnVKFZUlcA9INZGpjygEVpgBOc0XxAR2Or3WBIpTIRijoddouaDGZTOirsGTc6M6IoKsNR5F9697eBKJ8xk8gitMlxFMpg4F2QVk4Lep6b-Qzndh8XpoFODMmZjZJKrU6TGsno5AMPJPY3T3X9bc"
                                      alt="Mock 2"
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-2 left-2">
                                      <span className={tStyles.badgeClass}>TOKO</span>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="font-bold text-xs">Kain Tenun Tradisional</p>
                                    <p className={`${tStyles.accentText} text-xs`}>Rp 750.000</p>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating controls */}
              <div className="absolute bottom-6 flex items-center gap-4 bg-white/95 backdrop-blur-md px-5 py-3 rounded-2xl shadow-xl border border-border-subtle z-10 text-on-surface">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1.5 rounded hover:bg-surface-container-low flex items-center justify-center ${previewDevice === 'desktop' ? 'text-primary bg-primary/10' : 'text-text-secondary'}`}
                  title="Desktop View"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('tablet')}
                  className={`p-1.5 rounded hover:bg-surface-container-low flex items-center justify-center ${previewDevice === 'tablet' ? 'text-primary bg-primary/10' : 'text-text-secondary'}`}
                  title="Tablet View"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5h3m-6.75 1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V5.25a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v13.5a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1.5 rounded hover:bg-surface-container-low flex items-center justify-center ${previewDevice === 'mobile' ? 'text-primary bg-primary/10' : 'text-text-secondary'}`}
                  title="Mobile View"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H13.5M10.5 22.5H13.5M6.75 22.5H17.25A2.25 2.25 0 0 0 19.5 20.25V3.75A2.25 2.25 0 0 0 17.25 1.5H6.75A2.25 2.25 0 0 0 4.5 3.75V20.25A2.25 2.25 0 0 0 6.75 22.5Z" />
                  </svg>
                </button>
                <div className="w-px h-5 bg-outline-variant/50"></div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-text-secondary">{Math.round(previewScale * 100)}%</span>
                  <button
                    type="button"
                    onClick={() => setPreviewScale((s) => Math.max(0.5, s - 0.1))}
                    className="p-1 hover:bg-surface-container-low rounded text-text-primary flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewScale((s) => Math.min(1.2, s + 0.1))}
                    className="p-1 hover:bg-surface-container-low rounded text-text-primary flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'pages' && (
          <div className="space-y-6">
            {/* Custom Domain Connected Status */}
            {(() => {
              try {
                const config = JSON.parse(profile?.landingPageConfig || '{}')
                if (config.customDomain) {
                  return (
                    <div className="bg-[#2DB24A]/5 border border-[#2DB24A]/10 rounded-2xl p-5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="btn-primary w-10 bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <Globe size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-text-primary">Custom Domain Terhubung</p>
                          <p className="text-text-secondary mt-0.5">
                            Domain kustom Anda <strong className="text-primary">{config.customDomain}</strong> berhasil dipetakan ke storefront.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setCustomDomainInput(config.customDomain)
                          setShowDomainModal(true)
                        }}
                        className="btn-primary border border-primary text-primary hover:bg-primary/5 cursor-pointer outline-none"
                      >
                        Kelola Domain
                      </button>
                    </div>
                  )
                }
              } catch (e) {}
              return null
            })()}

            {editingPage ? (
              /* PAGE SETTINGS DETAILED SCREEN */
              <div className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingPage(null)}
                    className="p-2 hover:bg-slate-50 rounded-xl text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <div>
                    <h3 className="font-sora text-sm font-bold text-text-primary">
                      Edit Pengaturan Halaman: {editingPage.name}
                    </h3>
                    <p className="text-[11px] text-text-secondary">Konfigurasi data identitas halaman, custom scripts header/footer, dan SEO indexing</p>
                  </div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    const fd = new FormData(e.currentTarget)
                    const updated = {
                      ...editingPage,
                      name: fd.get('pageName') as string,
                      slug: editingPage.id === 'page-main' ? '' : (fd.get('pageSlug') as string).toLowerCase().trim().replace(/[^a-z0-9-]/g, '-'),
                      status: fd.get('pageStatus') as string,
                      headDesktop: fd.get('headDesktop') as string,
                      headMobile: fd.get('headMobile') as string,
                      footerAny: fd.get('footerAny') as string,
                      footerDesktop: fd.get('footerDesktop') as string,
                      footerMobile: fd.get('footerMobile') as string,
                      allowSearch: fd.get('allowSearch') as string,
                      followLinks: fd.get('followLinks') as string,
                    }
                    handleSavePageSettings(updated)
                  }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: General & SEO */}
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h4 className="font-sora text-xs font-bold text-[#0F5132] uppercase tracking-wider">Informasi Halaman</h4>
                        <div>
                          <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">Nama Halaman</label>
                          <input
                            type="text"
                            name="pageName"
                            defaultValue={editingPage.name}
                            required
                            className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">Slug URL Halaman</label>
                          <div className="flex items-center">
                            <span className="h-11 px-3 bg-slate-100 border border-r-0 border-slate-100 rounded-l-xl text-xs text-text-secondary flex items-center">
                              {parsedSubdomain ? `${parsedSubdomain}.saloka.id/` : 'saloka.id/'}
                            </span>
                            <input
                              type="text"
                              name="pageSlug"
                              defaultValue={editingPage.slug}
                              disabled={editingPage.id === 'page-main'}
                              placeholder={editingPage.id === 'page-main' ? '(Halaman Utama Storefront)' : 'slug-path-halaman'}
                              className="flex-grow h-11 px-4 bg-slate-50 border border-slate-100 rounded-r-xl text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all disabled:opacity-60 disabled:cursor-not-allowed font-mono text-[11px]"
                            />
                          </div>
                          {editingPage.id === 'page-main' && (
                            <p className="text-[10px] text-text-secondary mt-1.5">Halaman utama (Main Storefront) tidak menggunakan slug URL tambahan.</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">Status Publikasi Halaman</label>
                          <select
                            name="pageStatus"
                            defaultValue={editingPage.status}
                            className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                          >
                            <option value="PUBLISHED">Aktif & Publikasikan (PUBLISHED)</option>
                            <option value="DRAFT">Simpan sebagai Draft (DRAFT)</option>
                            <option value="ARCHIVED">Arsipkan (ARCHIVED)</option>
                          </select>
                        </div>
                      </div>

                      {/* Thumbnail Preview */}
                      <div className="space-y-4 pt-2">
                        <h4 className="font-sora text-xs font-bold text-[#0F5132] uppercase tracking-wider">Gambar Thumbnail / Cover Halaman</h4>
                        <div className="flex-grow">
                          <input
                            type="file"
                            accept="image/png, image/jpeg, image/jpg"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                handleImageUpload(file, setPageThumbUrl)
                              }
                            }}
                            className="hidden"
                            id="page-edit-thumb-upload"
                          />
                          
                          {pageThumbUrl ? (
                            <div className="relative group border border-slate-100 bg-slate-50 rounded-2xl overflow-hidden h-36 flex items-center justify-center shadow-inner">
                              <img src={pageThumbUrl} alt="Thumbnail Preview" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity duration-300">
                                <label
                                  htmlFor="page-edit-thumb-upload"
                                  className="px-3.5 py-1.5 bg-white hover:bg-neutral-100 text-black rounded-xl text-[10px] font-bold transition-all cursor-pointer shadow-md uppercase tracking-wider"
                                >
                                  Ganti Gambar
                                </label>
                                <button
                                  type="button"
                                  onClick={() => setPageThumbUrl('')}
                                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-bold transition-all cursor-pointer shadow-md uppercase tracking-wider"
                                >
                                  Hapus
                                </button>
                              </div>
                            </div>
                          ) : (
                            <label
                              htmlFor="page-edit-thumb-upload"
                              className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-primary/50 bg-slate-50 hover:bg-slate-100/50 rounded-2xl p-6 h-36 cursor-pointer transition-all group"
                            >
                              <div className="flex flex-col items-center gap-2">
                                <div className="p-2 bg-white rounded-full border border-slate-100 group-hover:border-primary/30 group-hover:text-primary transition-all">
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-text-secondary group-hover:text-primary">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                                  </svg>
                                </div>
                                <div className="text-center">
                                  <p className="text-[10px] font-bold text-text-primary group-hover:text-primary transition-colors">
                                    Pilih atau Tarik File Gambar Cover
                                  </p>
                                  <p className="text-[9px] text-text-secondary mt-0.5">PNG, JPG, JPEG (Maks. 5MB)</p>
                                </div>
                              </div>
                            </label>
                          )}
                        </div>
                      </div>

                      {/* SEO Settings Option Block */}
                      <div className="space-y-4 pt-2">
                        <h4 className="font-sora text-xs font-bold text-[#0F5132] uppercase tracking-wider">SEO Settings</h4>
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
                          <div>
                            <p className="text-xs font-semibold text-text-primary mb-2.5">Allow search engines to display this post in search results?</p>
                            <div className="flex gap-4">
                              <label className="flex items-center gap-2 cursor-pointer text-xs">
                                <input
                                  type="radio"
                                  name="allowSearch"
                                  value="Yes"
                                  defaultChecked={editingPage.allowSearch !== 'No'}
                                  className="w-4 h-4 text-primary focus:ring-primary"
                                />
                                <span>Yes</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer text-xs">
                                <input
                                  type="radio"
                                  name="allowSearch"
                                  value="No"
                                  defaultChecked={editingPage.allowSearch === 'No'}
                                  className="w-4 h-4 text-primary focus:ring-primary"
                                />
                                <span>No</span>
                              </label>
                            </div>
                          </div>
                          <div className="border-t border-slate-100 pt-3">
                            <p className="text-xs font-semibold text-text-primary mb-2.5">Should search engines follow the links in this post?</p>
                            <div className="flex gap-4">
                              <label className="flex items-center gap-2 cursor-pointer text-xs">
                                <input
                                  type="radio"
                                  name="followLinks"
                                  value="Yes"
                                  defaultChecked={editingPage.followLinks !== 'No'}
                                  className="w-4 h-4 text-primary focus:ring-primary"
                                />
                                <span>Yes</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer text-xs">
                                <input
                                  type="radio"
                                  name="followLinks"
                                  value="No"
                                  defaultChecked={editingPage.followLinks === 'No'}
                                  className="w-4 h-4 text-primary focus:ring-primary"
                                />
                                <span>No</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Custom scripts header/footers */}
                    <div className="space-y-6">
                      <h4 className="font-sora text-xs font-bold text-[#0F5132] uppercase tracking-wider">Custom Head & Footer Scripts</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">Header Script - Desktop (Facebook Pixel, GTM, CSS Kustom)</label>
                          <textarea
                            name="headDesktop"
                            defaultValue={editingPage.headDesktop}
                            rows={3}
                            placeholder="<script>...</script> atau <style>...</style>"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">Header Script - Mobile Only</label>
                          <textarea
                            name="headMobile"
                            defaultValue={editingPage.headMobile}
                            rows={3}
                            placeholder="<script>...</script>"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">Footer Script - All Devices (Chat Widget, Analytics)</label>
                          <textarea
                            name="footerAny"
                            defaultValue={editingPage.footerAny}
                            rows={3}
                            placeholder="<script>...</script>"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">Footer Script - Desktop Only</label>
                          <textarea
                            name="footerDesktop"
                            defaultValue={editingPage.footerDesktop}
                            rows={3}
                            placeholder="<script>...</script>"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">Footer - Mobile Only</label>
                          <textarea
                            name="footerMobile"
                            defaultValue={editingPage.footerMobile}
                            rows={3}
                            placeholder="<script>...</script>"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 flex justify-end gap-3.5">
                    <button
                      type="button"
                      onClick={() => setEditingPage(null)}
                      className="px-5 py-2.5 text-text-secondary hover:text-text-primary font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="px-6 py-2.5 bg-[#2DB24A] hover:bg-[#2DB24A]/95 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      {isPending ? 'Menyimpan...' : 'Simpan Pengaturan Halaman'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* NORMAL PAGE LISTING VIEW */
              <>
                {/* Stats cards grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Total Halaman</span>
                    <h3 className="font-sora text-2xl font-black text-text-primary mt-2">{pagesList.length}</h3>
                  </div>
                  <div className="bg-white p-5 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Halaman Terbit</span>
                    <h3 className="font-sora text-2xl font-black text-[#2DB24A] mt-2">
                      {pagesList.filter((p: any) => p.status === 'PUBLISHED').length}
                    </h3>
                  </div>
                  <div className="bg-white p-5 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Draft</span>
                    <h3 className="font-sora text-2xl font-black text-amber-500 mt-2">
                      {pagesList.filter((p: any) => p.status === 'DRAFT').length}
                    </h3>
                  </div>
                  <div className="bg-white p-5 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Diarsipkan</span>
                    <h3 className="font-sora text-2xl font-black text-text-secondary mt-2">
                      {pagesList.filter((p: any) => p.status === 'ARCHIVED').length}
                    </h3>
                  </div>
                </div>

                {/* Toolbar options */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-grow max-w-md">
                    <div className="relative flex-grow">
                      <input
                        type="text"
                        placeholder="Cari nama atau slug halaman..."
                        value={searchPageQuery}
                        onChange={(e) => setSearchPageQuery(e.target.value)}
                        className="w-full h-10 pl-10 pr-4 bg-white border border-slate-100 rounded-xl text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                      />
                      <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
                    </div>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="h-10 px-4 bg-white border border-slate-100 rounded-xl text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer"
                    >
                      <option value="all">Semua Status</option>
                      <option value="PUBLISHED">Diterbitkan</option>
                      <option value="DRAFT">Draft</option>
                      <option value="ARCHIVED">Diarsipkan</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        try {
                          const config = JSON.parse(profile?.landingPageConfig || '{}')
                          setCustomDomainInput(config.customDomain || '')
                        } catch (e) {}
                        setShowDomainModal(true)
                      }}
                      className="btn-primary border border-[#2DB24A] text-[#2DB24A] hover:bg-primary/5 text-xs flex items-center gap-1.5 cursor-pointer outline-none"
                    >
                      <Globe size={14} />
                      Hubungkan Domain
                    </button>
                    <button
                      onClick={() => {
                        setCreatePageName('')
                        setCreatePageTemplate('template1')
                        setShowCreateModal(true)
                      }}
                      className="btn-primary text-xs flex items-center gap-1.5 cursor-pointer outline-none shadow-sm"
                    >
                      <Plus size={14} />
                      Buat Halaman Baru
                    </button>
                  </div>
                </div>

                {/* Page list table */}
                <div className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left text-text-secondary border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider font-bold text-text-secondary bg-slate-50/50">
                          <th className="py-4 px-5">Halaman</th>
                          <th className="py-4 px-5">URL / Alamat Web</th>
                          <th className="py-4 px-5">Status</th>
                          <th className="py-4 px-5">Terakhir Diubah</th>
                          <th className="py-4 px-5 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPages.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-16 text-center text-text-secondary">
                              Tidak ada halaman toko yang cocok dengan filter pencarian.
                            </td>
                          </tr>
                        ) : (
                          filteredPages.map((page: any) => {
                            const customDomain = (() => {
                              try {
                                return JSON.parse(profile?.landingPageConfig || '{}').customDomain || ''
                              } catch (e) {
                                return ''
                              }
                            })()
                            
                            const displayDomain = customDomain || `${parsedSubdomain}.saloka.id`
                            const displayUrl = page.slug ? `${displayDomain}/${page.slug}` : displayDomain
                            const dateStr = new Date(page.lastModified || new Date()).toLocaleDateString('id-ID', {
                              day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            })

                            // Determine subdomain URL path structure
                            const isLocal = typeof window !== 'undefined' && window.location.hostname.includes('localhost')
                            const hostBase = customDomain || (
                              isLocal
                                ? `${parsedSubdomain}.localhost:3000`
                                : `${parsedSubdomain}.saloka.id`
                            )
                            const finalHref = page.slug ? `${isLocal ? 'http' : 'https'}://${hostBase}/${page.slug}` : `${isLocal ? 'http' : 'https'}://${hostBase}`

                            return (
                              <tr key={page.id} className="border-b border-slate-50 hover:bg-slate-50/40 transition-colors">
                                <td className="py-4 px-5">
                                  <div className="flex items-center gap-3">
                                    <div className="w-12 h-9 bg-slate-50 border border-slate-100 rounded-lg overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                                      {page.imageUrl ? (
                                        <img src={page.imageUrl} alt={page.name} className="object-cover w-full h-full" />
                                      ) : (
                                        <Layers className="text-slate-300" size={16} />
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-bold text-text-primary">{page.name}</p>
                                      
                                      {/* Action links under page name */}
                                      <div className="flex items-center gap-1.5 text-[10px] text-text-secondary mt-1">
                                        <button onClick={() => setEditingPage(page)} className="hover:text-primary cursor-pointer font-medium">Edit</button>
                                        <span>|</span>
                                        <button onClick={() => router.push(`/merchant/builder/${page.id}`)} className="hover:text-primary cursor-pointer font-medium">Edit with Builder</button>
                                        <span>|</span>
                                        <button onClick={() => handleDuplicatePage(page)} className="hover:text-primary cursor-pointer font-medium">Duplicate</button>
                                        <span>|</span>
                                        <a href={finalHref} target="_blank" rel="noreferrer" className="hover:text-primary font-medium text-text-secondary">Visit Page</a>
                                      </div>

                                      {page.id === 'page-main' && (
                                        <span className="btn-primary text-[8px] bg-primary/10 border border-primary/20 text-primary font-black mt-2 inline-block">Halaman Utama</span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-5 font-mono text-[11px] text-[#2DB24A] hover:underline">
                                  <a href={finalHref} target="_blank" rel="noreferrer">
                                    {displayUrl}
                                  </a>
                                </td>
                                <td className="py-4 px-5">
                                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                                    page.status === 'PUBLISHED'
                                      ? 'bg-green-500/10 border-green-500/25 text-[#2DB24A]'
                                      : page.status === 'DRAFT'
                                      ? 'bg-amber-500/10 border-amber-500/25 text-amber-500'
                                      : 'bg-slate-100 border-slate-200 text-text-secondary'
                                  }`}>
                                    {page.status || 'PUBLISHED'}
                                  </span>
                                </td>
                                <td className="py-4 px-5 text-text-secondary">{dateStr}</td>
                                <td className="py-4 px-5 text-right">
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={() => setEditingPage(page)}
                                      className="px-2.5 py-1.5 hover:bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold uppercase tracking-wider text-text-primary transition-all cursor-pointer"
                                      title="Edit Info & SEO"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => router.push(`/merchant/builder/${page.id}`)}
                                      className="btn-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 text-[10px] text-primary cursor-pointer"
                                      title="Buka Builder Visual"
                                    >
                                      Builder
                                    </button>
                                    <button
                                      onClick={() => handleDuplicatePage(page)}
                                      className="px-2.5 py-1.5 hover:bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold uppercase tracking-wider text-text-secondary transition-all cursor-pointer"
                                      title="Duplikat Halaman"
                                    >
                                      Duplicate
                                    </button>
                                    <button
                                      onClick={() => handleDeletePage(page.id)}
                                      disabled={page.id === 'page-main'}
                                      className="px-2.5 py-1.5 hover:bg-red-500/5 border border-slate-100 hover:border-red-500/20 rounded-xl text-[10px] font-bold uppercase tracking-wider text-red-500 transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-slate-100 cursor-pointer"
                                      title="Hapus Halaman"
                                    >
                                      Hapus
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'academy' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] mb-6">
              <h3 className="font-sora text-sm font-bold text-[#0F5132] mb-2">Saloka Premium LMS Academy</h3>
              <p className="text-xs text-text-secondary leading-relaxed max-w-2xl">
                Tingkatkan omset bisnis Anda dengan mempelajari modul branding, pemasaran media sosial, sains fermentasi, dan manajemen finansial dari para mentor top.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {courses.map((course) => {
                const courseLessons = course.lessons || [];
                const totalLessons = courseLessons.length;
                const completedLessons = new Set(
                  userProgress.filter((p) => p.completed).map((p) => p.lessonId)
                );
                const completedCount = courseLessons.filter((l: any) => completedLessons.has(l.id)).length;
                const percent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

                return (
                  <div
                    key={course.id}
                    className="group bg-white rounded-2xl overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.02)] border border-slate-100/80 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      {/* Course Image */}
                      <div className="aspect-[21/9] w-full bg-slate-50 relative overflow-hidden flex items-center justify-center">
                        {course.coverImage ? (
                          <img
                            src={course.coverImage}
                            alt={course.title}
                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-60" />
                        )}
                        <span className="absolute top-4 left-4 px-2.5 py-1 bg-white/95 rounded-lg text-[9px] font-bold text-primary uppercase tracking-wider shadow-sm">
                          {course.accessRequired || 'Gold'} Module
                        </span>
                      </div>

                      {/* Course Info */}
                      <div className="p-6">
                        <h3 className="font-sora text-base font-bold text-text-primary mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                          {course.title}
                        </h3>
                        <p className="text-xs text-text-secondary leading-relaxed mb-6">
                          {course.description}
                        </p>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-[10px] font-bold text-text-secondary uppercase">
                            <span>Progress Belajar</span>
                            <span className="text-primary font-bold">{percent}% Selesai</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary duration-500 rounded-full"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <div className="text-[10px] text-text-secondary pt-1">
                            {completedCount} dari {totalLessons} pelajaran selesai dipelajari.
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="p-6 pt-0">
                      <Link
                        id={`btn-course-${course.id}`}
                        href={`/academy/course/${course.id}`}
                        className="w-full py-3 bg-primary hover:bg-primary/95 text-black font-geist font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all text-center"
                      >
                        Mulai Belajar
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-3.5 h-3.5"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Create Page Modal Overlay */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[99] flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-text-primary">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                <div>
                  <h3 className="font-sora text-base font-bold text-text-primary">Buat Halaman Baru</h3>
                  <p className="text-[11px] text-text-secondary">Pilih template awal dan tentukan nama halaman Anda</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 hover:bg-slate-50 rounded-full transition-colors flex items-center justify-center cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6 bg-slate-50/50">
                {/* Left side settings */}
                <div className="flex-grow space-y-5">
                  <div>
                    <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">Nama Halaman</label>
                    <input
                      type="text"
                      placeholder="Landing Page Promo Domestik"
                      value={createPageName}
                      onChange={(e) => setCreatePageName(e.target.value)}
                      className="w-full h-11 px-4 bg-white border border-slate-100 rounded-xl text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-3">Pilih Template Awal</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'template1', title: 'Blank Template', desc: 'Mulai dari halaman kosong' },
                        { id: 'template2', title: 'Simple Storefront', desc: 'Layout minimalis bersih' },
                        { id: 'template3', title: 'Product Solution', desc: 'Fokus konversi promosi tunggal' },
                        { id: 'template4', title: 'Product Fisik', desc: 'Katalog grid produk beruntun' },
                      ].map(tpl => (
                        <div
                          key={tpl.id}
                          onClick={() => setCreatePageTemplate(tpl.id)}
                          className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                            createPageTemplate === tpl.id
                              ? 'border-primary bg-primary/5'
                              : 'border-slate-100 bg-white hover:border-slate-200'
                          }`}
                        >
                          <p className="font-bold text-xs text-text-primary">{tpl.title}</p>
                          <p className="text-[10px] text-text-secondary mt-1">{tpl.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right side preview block */}
                <div className="w-full md:w-80 shrink-0 flex flex-col">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Preview Layout</span>
                    <div className="flex bg-white rounded-lg p-0.5 border border-slate-100 text-[9px] font-bold">
                      <button
                        onClick={() => setCreatePagePreview('mobile')}
                        className={`px-2 py-1 rounded transition-colors cursor-pointer ${createPagePreview === 'mobile' ? 'bg-[#2DB24A] text-white' : 'text-text-secondary'}`}
                      >
                        Mobile
                      </button>
                      <button
                        onClick={() => setCreatePagePreview('desktop')}
                        className={`px-2 py-1 rounded transition-colors cursor-pointer ${createPagePreview === 'desktop' ? 'bg-[#2DB24A] text-white' : 'text-text-secondary'}`}
                      >
                        Desktop
                      </button>
                    </div>
                  </div>

                  <div className="flex-grow bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-center min-h-[300px] max-h-[320px] relative overflow-hidden shadow-inner">
                    <div 
                      className={`transition-all duration-300 bg-white border border-slate-200 shadow-sm flex flex-col justify-between overflow-y-auto overflow-x-hidden ${
                        createPagePreview === 'mobile' 
                          ? 'w-[160px] h-[260px] rounded-[24px] border-4 border-slate-800 p-2.5 relative' 
                          : 'w-full h-full p-4 rounded-lg'
                      }`}
                    >
                      {createPagePreview === 'mobile' && (
                        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-12 h-3 bg-slate-800 rounded-full z-10 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-900 absolute right-2" />
                        </div>
                      )}
                      <div className={`w-full h-full flex flex-col justify-between ${createPagePreview === 'mobile' ? 'pt-2' : ''}`}>
                        {createPageTemplate === 'template1' && (
                          <div className="text-center space-y-2 my-auto flex flex-col items-center justify-center h-full">
                            <Layers className="mx-auto text-slate-300 animate-pulse" size={24} />
                            <p className="font-bold text-[10px]">Blank Template</p>
                            <p className="text-[8px] text-text-secondary max-w-[120px]">Halaman kosong tanpa bagian default.</p>
                          </div>
                        )}
                        {createPageTemplate === 'template2' && (
                          <div className="w-full h-full flex flex-col justify-between py-1 space-y-1.5">
                            <div className="h-3 bg-slate-100 rounded-sm w-1/3"></div>
                            <div className="h-10 bg-slate-50 border border-dashed border-slate-200 rounded flex items-center justify-center text-[7px] text-text-secondary">Hero Banner</div>
                            <div className="grid grid-cols-2 gap-1">
                              <div className="h-8 bg-slate-50 rounded"></div>
                              <div className="h-8 bg-slate-50 rounded"></div>
                            </div>
                          </div>
                        )}
                        {createPageTemplate === 'template3' && (
                          <div className="w-full h-full flex flex-col justify-between py-1 space-y-1.5">
                            <div className="h-3 bg-slate-100 rounded-sm w-1/3"></div>
                            <div className="flex gap-1 items-center">
                              <div className="w-1/2 h-12 bg-slate-50 rounded"></div>
                              <div className="w-1/2 space-y-1">
                                <div className="h-2 bg-slate-100 rounded"></div>
                                <div className="h-1.5 bg-slate-100 rounded w-5/6"></div>
                                <div className="btn-primary bg-primary/20"></div>
                              </div>
                            </div>
                            <div className="h-6 bg-slate-50 rounded flex items-center justify-center text-[7px] text-text-secondary">Testimonial</div>
                          </div>
                        )}
                        {createPageTemplate === 'template4' && (
                          <div className="w-full h-full flex flex-col justify-between py-1 space-y-1.5">
                            <div className="h-3 bg-slate-100 rounded-sm w-full"></div>
                            <div className="grid grid-cols-3 gap-1 flex-1 items-center">
                              <div className="h-10 bg-slate-50 rounded border border-slate-100"></div>
                              <div className="h-10 bg-slate-50 rounded border border-slate-100"></div>
                              <div className="h-10 bg-slate-50 rounded border border-slate-100"></div>
                            </div>
                            <div className="h-3 bg-slate-100 rounded w-1/2 mx-auto"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-white">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 text-text-secondary hover:text-text-primary font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    if (!createPageName.trim()) {
                      alert('Masukkan nama halaman terlebih dahulu.')
                      return
                    }
                    handleCreatePage(createPageName, createPageTemplate)
                  }}
                  disabled={isPending}
                  className="px-6 py-2.5 bg-[#2DB24A] hover:bg-[#2DB24A]/95 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isPending ? 'Memproses...' : 'Buat Halaman'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Domain Modal Overlay */}
        {showDomainModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[99] flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-text-primary">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                <div>
                  <h3 className="font-sora text-base font-bold text-text-primary">Hubungkan Custom Domain</h3>
                  <p className="text-[11px] text-text-secondary">Gunakan domain Anda sendiri untuk landing page Anda</p>
                </div>
                <button
                  onClick={() => setShowDomainModal(false)}
                  className="p-1.5 hover:bg-slate-50 rounded-full transition-colors flex items-center justify-center cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/50">
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">Nama Domain</label>
                  <input
                    type="text"
                    placeholder="www.tokosaya.com atau katalog.bisnis.id"
                    value={customDomainInput}
                    onChange={(e) => setCustomDomainInput(e.target.value)}
                    className="w-full h-11 px-4 bg-white border border-slate-100 rounded-xl text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  />
                  <p className="text-[9px] text-text-secondary mt-1.5">Masukkan nama domain Anda tanpa protokol https://</p>
                </div>

                <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
                  <h4 className="font-sora text-xs font-bold text-[#0F5132] flex items-center gap-1.5">
                    <Globe size={14} className="text-primary" />
                    Panduan Konfigurasi DNS
                  </h4>
                  <p className="text-[11px] text-text-secondary leading-relaxed">
                    Masuk ke panel domain provider Anda (Niagahoster, Rumahweb, Domainesia, dsb) lalu tambahkan record berikut pada pengaturan DNS Anda:
                  </p>

                  <div className="border border-slate-100 rounded-xl overflow-hidden text-[11px] font-geist">
                    <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 grid grid-cols-3 font-bold text-text-secondary uppercase tracking-wider text-[9px]">
                      <span>Tipe (Type)</span>
                      <span>Nama (Host)</span>
                      <span>Target (Value)</span>
                    </div>
                    <div className="px-4 py-3 grid grid-cols-3 items-center border-b border-slate-50">
                      <span className="font-bold text-text-primary">CNAME</span>
                      <span className="font-mono text-text-secondary">www</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-primary font-bold">cname.saloka.id</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText('cname.saloka.id')
                            alert('Target CNAME disalin ke clipboard!')
                          }}
                          className="p-1 hover:bg-slate-50 border border-slate-100 rounded-lg text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                          title="Salin Target"
                        >
                          <Copy size={10} />
                        </button>
                      </div>
                    </div>
                    <div className="px-4 py-3 grid grid-cols-3 items-center">
                      <span className="font-bold text-text-primary">CNAME</span>
                      <span className="font-mono text-text-secondary">@</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-primary font-bold">cname.saloka.id</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText('cname.saloka.id')
                            alert('Target CNAME disalin ke clipboard!')
                          }}
                          className="p-1 hover:bg-slate-50 border border-slate-100 rounded-lg text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                          title="Salin Target"
                        >
                          <Copy size={10} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl text-[10px] text-amber-700 leading-relaxed">
                    <strong>Catatan:</strong> Proses propagasi DNS CNAME biasanya memerlukan waktu 5 menit hingga maksimal 24 jam tergantung penyedia domain Anda.
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 flex justify-between gap-3 bg-white">
                {(() => {
                  try {
                    const config = JSON.parse(profile?.landingPageConfig || '{}')
                    if (config.customDomain) {
                      return (
                        <button
                          onClick={() => {
                            if (confirm('Apakah Anda yakin ingin menghapus custom domain ini?')) {
                              handleSaveCustomDomain('')
                            }
                          }}
                          disabled={isPending}
                          className="px-4 py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Hapus Domain
                        </button>
                      )
                    }
                  } catch (e) {}
                  return null
                })()}
                <div className="flex gap-3 ml-auto">
                  <button
                    onClick={() => setShowDomainModal(false)}
                    className="px-5 py-2.5 text-text-secondary hover:text-text-primary font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => {
                      if (!customDomainInput.trim()) {
                        alert('Masukkan nama domain terlebih dahulu.')
                        return
                      }
                      handleSaveCustomDomain(customDomainInput)
                    }}
                    disabled={isPending}
                    className="px-6 py-2.5 bg-[#2DB24A] hover:bg-[#2DB24A]/95 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {isPending ? 'Menyimpan...' : 'Hubungkan Domain'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Template Gallery Modal */}
      {isGalleryOpen && (
        <div className="fixed inset-0 bg-[#0b1c30]/40 backdrop-blur-sm z-[99] flex items-center justify-center p-8">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-on-surface">
            <div className="p-6 border-b border-border-subtle flex justify-between items-center">
              <div>
                <h3 className="font-sora text-xl font-bold">Pilih Template Landing Page</h3>
                <p className="text-xs text-text-secondary">Template siap pakai untuk meningkatkan konversi jualan Anda</p>
              </div>
              <button
                type="button"
                className="p-2 hover:bg-surface-container rounded-full transition-colors flex items-center justify-center"
                onClick={() => setIsGalleryOpen(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Minimal Noir */}
                <div
                  onClick={() => { setStorefrontTemplate('noir'); setIsGalleryOpen(false); }}
                  className={`group cursor-pointer rounded-2xl overflow-hidden relative border-2 transition-all ${
                    storefrontTemplate === 'noir' ? 'border-primary ring-4 ring-primary/10 shadow-lg' : 'border-transparent hover:border-primary/50'
                  }`}
                >
                  <div className="aspect-[4/5] bg-gray-900 flex flex-col justify-end p-6 text-white relative">
                    {storefrontTemplate === 'noir' && (
                      <span className="btn-primary absolute top-4 right-4 text-[8px]">Aktif</span>
                    )}
                    <div className="space-y-1 z-10">
                      <h4 className="font-bold text-sm">Minimal Noir</h4>
                      <p className="text-[10px] text-white/70">Elegan, berani, dan fokus pada satu produk utama.</p>
                    </div>
                  </div>
                </div>

                {/* Clean Professional */}
                <div
                  onClick={() => { setStorefrontTemplate('clean'); setIsGalleryOpen(false); }}
                  className={`group cursor-pointer rounded-2xl overflow-hidden relative border-2 transition-all ${
                    storefrontTemplate === 'clean' ? 'border-primary ring-4 ring-primary/10 shadow-lg' : 'border-transparent hover:border-primary/50'
                  }`}
                >
                  <div className="aspect-[4/5] bg-surface-container flex flex-col justify-end p-6 text-text-primary relative">
                    {storefrontTemplate === 'clean' && (
                      <span className="btn-primary absolute top-4 right-4 text-[8px]">Aktif</span>
                    )}
                    <div className="space-y-1 z-10">
                      <h4 className="font-bold text-sm">Clean Professional</h4>
                      <p className="text-[10px] text-text-secondary">Terorganisir, rapi, dan cocok untuk korporasi lokal.</p>
                    </div>
                  </div>
                </div>

                {/* Modern Gold */}
                <div
                  onClick={() => { setStorefrontTemplate('gold'); setIsGalleryOpen(false); }}
                  className={`group cursor-pointer rounded-2xl overflow-hidden relative border-2 transition-all ${
                    storefrontTemplate === 'gold' ? 'border-primary ring-4 ring-primary/10 shadow-lg' : 'border-transparent hover:border-primary/50'
                  }`}
                >
                  <div className="aspect-[4/5] bg-white flex flex-col justify-end p-6 text-text-primary relative">
                    {storefrontTemplate === 'gold' && (
                      <span className="btn-primary absolute top-4 right-4 text-[8px]">Aktif</span>
                    )}
                    <div className="space-y-1 z-10">
                      <h4 className="font-bold text-sm">Modern Gold</h4>
                      <p className="text-[10px] text-text-secondary">Mewah, hangat, dan sangat mudah digunakan.</p>
                    </div>
                  </div>
                </div>

                {/* Studio Design */}
                <div
                  onClick={() => { setStorefrontTemplate('studio'); setIsGalleryOpen(false); }}
                  className={`group cursor-pointer rounded-2xl overflow-hidden relative border-2 transition-all ${
                    storefrontTemplate === 'studio' ? 'border-primary ring-4 ring-primary/10 shadow-lg' : 'border-transparent hover:border-primary/50'
                  }`}
                >
                  <div className="aspect-[4/5] bg-zinc-800 flex flex-col justify-end p-6 text-white relative">
                    {storefrontTemplate === 'studio' && (
                      <span className="btn-primary absolute top-4 right-4 text-[8px]">Aktif</span>
                    )}
                    <div className="space-y-1 z-10">
                      <h4 className="font-bold text-sm">Studio Design</h4>
                      <p className="text-[10px] text-white/70">Aesthetic creative agency layout, clean typography.</p>
                    </div>
                  </div>
                </div>

                {/* Neo Brutalism */}
                <div
                  onClick={() => { setStorefrontTemplate('brutalist'); setIsGalleryOpen(false); }}
                  className={`group cursor-pointer rounded-2xl overflow-hidden relative border-2 transition-all ${
                    storefrontTemplate === 'brutalist' ? 'border-primary ring-4 ring-primary/10 shadow-lg' : 'border-transparent hover:border-primary/50'
                  }`}
                >
                  <div className="aspect-[4/5] bg-yellow-400 flex flex-col justify-end p-6 text-black relative">
                    {storefrontTemplate === 'brutalist' && (
                      <span className="absolute top-4 right-4 bg-black text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-black">Aktif</span>
                    )}
                    <div className="space-y-1 z-10">
                      <h4 className="font-bold text-sm text-black">Neo Brutalism</h4>
                      <p className="text-[10px] text-black/85 font-bold">Tebal, eksentrik, berani dengan kontras tinggi.</p>
                    </div>
                  </div>
                </div>

                {/* Swiss Minimalist */}
                <div
                  onClick={() => { setStorefrontTemplate('swiss'); setIsGalleryOpen(false); }}
                  className={`group cursor-pointer rounded-2xl overflow-hidden relative border-2 transition-all ${
                    storefrontTemplate === 'swiss' ? 'border-primary ring-4 ring-primary/10 shadow-lg' : 'border-transparent hover:border-primary/50'
                  }`}
                >
                  <div className="aspect-[4/5] bg-[#F5F1E8] flex flex-col justify-end p-6 text-black relative">
                    {storefrontTemplate === 'swiss' && (
                      <span className="absolute top-4 right-4 bg-black text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Aktif</span>
                    )}
                    <div className="space-y-1 z-10">
                      <h4 className="font-bold text-sm">Swiss Minimalist</h4>
                      <p className="text-[10px] text-black/75">Design1.md - Grid rapi & border tajam tanpa radius.</p>
                    </div>
                  </div>
                </div>

                {/* De Stijl Abstract */}
                <div
                  onClick={() => { setStorefrontTemplate('destijl'); setIsGalleryOpen(false); }}
                  className={`group cursor-pointer rounded-2xl overflow-hidden relative border-2 transition-all ${
                    storefrontTemplate === 'destijl' ? 'border-primary ring-4 ring-primary/10 shadow-lg' : 'border-transparent hover:border-primary/50'
                  }`}
                >
                  <div className="aspect-[4/5] bg-white flex flex-col justify-end p-6 text-black relative border-l-8 border-l-red-500">
                    {storefrontTemplate === 'destijl' && (
                      <span className="absolute top-4 right-4 bg-[#0000FF] text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Aktif</span>
                    )}
                    <div className="space-y-1 z-10">
                      <h4 className="font-bold text-sm">De Stijl Abstract</h4>
                      <p className="text-[10px] text-black/75">Design2.md - Blok warna primer & garis asimetris.</p>
                    </div>
                  </div>
                </div>

                {/* HPC Performance */}
                <div
                  onClick={() => { setStorefrontTemplate('hpc'); setIsGalleryOpen(false); }}
                  className={`group cursor-pointer rounded-2xl overflow-hidden relative border-2 transition-all ${
                    storefrontTemplate === 'hpc' ? 'border-primary ring-4 ring-primary/10 shadow-lg' : 'border-transparent hover:border-primary/50'
                  }`}
                >
                  <div className="aspect-[4/5] bg-[#000] flex flex-col justify-end p-6 text-white relative border-l-4 border-l-[#ED1C24]">
                    {storefrontTemplate === 'hpc' && (
                      <span className="absolute top-4 right-4 bg-[#ED1C24] text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Aktif</span>
                    )}
                    <div className="space-y-1 z-10">
                      <h4 className="font-bold text-sm">HPC Performance</h4>
                      <p className="text-[10px] text-white/70">Design3.md - Glow server center, performa tinggi.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border-subtle flex justify-end gap-4 bg-surface-container-low">
              <button
                type="button"
                className="px-6 py-2.5 text-text-secondary font-bold text-xs uppercase tracking-wider hover:text-text-primary transition-colors"
                onClick={() => setIsGalleryOpen(false)}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Copywriter Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-dark border border-border-subtle rounded-lg max-w-md w-full p-6 space-y-6 shadow-2xl text-text-primary">
            <div className="flex justify-between items-center border-b border-border-subtle pb-3">
              <h3 className="font-sora text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={16} className="animate-pulse text-primary" />
                AI Description Assistant
              </h3>
              <button onClick={() => setShowAiModal(false)} className="text-text-secondary hover:text-text-primary">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-2">Nama Produk / Topik</label>
                <input
                  type="text"
                  value={aiKeywords}
                  onChange={(e) => setAiKeywords(e.target.value)}
                  placeholder="Masukkan kata kunci/nama produk..."
                  className="w-full h-11 px-4 bg-surface-container border border-border-subtle rounded text-xs text-text-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-2">Kategori Bisnis</label>
                <select
                  value={aiCategory}
                  onChange={(e) => setAiCategory(e.target.value)}
                  className="w-full h-11 px-4 bg-surface-container border border-border-subtle rounded text-xs text-text-primary focus:outline-none"
                >
                  {PRODUCT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  className="flex-1 py-3 bg-surface-container hover:bg-surface-container-high border border-border-subtle text-text-primary font-bold rounded uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleGenerateAiText}
                  disabled={generatingAiText}
                  className="btn-primary flex-1 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {generatingAiText ? 'Generating...' : 'Generate Deskripsi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
