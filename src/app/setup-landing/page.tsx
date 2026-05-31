'use client'

import React, { useState, useEffect, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { updateUserLandingPage, getCurrentUser, getCurrentUserProfile } from '../actions/auth'
import LandingPageRenderer from '../components/LandingPageRenderer'
import { getProducts } from '../actions/products'
import { 
  MapPin, 
  ArrowRight, 
  ArrowLeft, 
  ArrowUp, 
  ArrowDown, 
  Palette, 
  User, 
  Layers, 
  MessageSquare, 
  Trash2, 
  Plus, 
  Check, 
  Upload, 
  Edit3, 
  HelpCircle,
  Eye,
  Star,
  Settings,
  GripVertical
} from 'lucide-react'

interface TemplateOption {
  id: string
  name: string
  desc: string
  bgClass: string
  textClass: string
  borderClass: string
  accentClass: string
  fontFamily: string
}

const TEMPLATES: TemplateOption[] = [
  {
    id: 'template1',
    name: 'Template 1: Premium Elegant',
    desc: 'Desain Premium: Reverent product photography, clean white/dark alternating tiles, Action Blue accents, rounded-pill CTAs.',
    bgClass: 'bg-white text-[#1d1d1f]',
    textClass: 'text-neutral-500',
    borderClass: 'border-neutral-200 bg-white shadow-sm',
    accentClass: 'bg-[#0066cc] text-white hover:bg-blue-600 rounded-full',
    fontFamily: 'font-sans'
  },
  {
    id: 'template2',
    name: 'Template 2: Retro Direct',
    desc: 'Desain Nostalgia: Catalog-era enterprise style, literal page frame, colored product ribbon cards, beveled yellow stickers.',
    bgClass: 'bg-white text-black',
    textClass: 'text-neutral-500',
    borderClass: 'border-black bg-white rounded-none',
    accentClass: 'bg-[#e91d2a] text-white rounded-none border border-black',
    fontFamily: 'font-serif'
  },
  {
    id: 'template3',
    name: 'Template 3: Soft Marketplace',
    desc: 'Desain Marketplace: Soft generous layout, Rausch red primary CTAs, property-card photo grids, search bar pill, rounded corners.',
    bgClass: 'bg-white text-[#222222]',
    textClass: 'text-neutral-500',
    borderClass: 'border-neutral-200 bg-white rounded-2xl shadow-sm',
    accentClass: 'bg-[#ff385c] text-white hover:bg-[#e00b41] rounded-lg',
    fontFamily: 'font-sans'
  },
  {
    id: 'template4',
    name: 'Template 4: Sporty Bold',
    desc: 'Desain Sporty: Near-pure black canvas with confident uppercase display typography, tricolor stripes, and sharp 0px corners.',
    bgClass: 'bg-black text-white',
    textClass: 'text-neutral-400',
    borderClass: 'border-neutral-800 bg-neutral-900 rounded-none',
    accentClass: 'bg-white text-black hover:bg-neutral-200 rounded-none',
    fontFamily: 'font-sans'
  },
  {
    id: 'template5',
    name: 'Template 5: Cinematic Luxury',
    desc: 'Desain Cinematic: Near-black canvas, Rosso Corsa accents, elegant slim typography, weight 500 display, and sharp 0px corners.',
    bgClass: 'bg-[#181818] text-white',
    textClass: 'text-neutral-400',
    borderClass: 'border-[#303030] bg-[#303030]/20 rounded-none',
    accentClass: 'bg-[#da291c] text-white hover:bg-[#b01e0a] rounded-none',
    fontFamily: 'font-sans'
  },
  {
    id: 'brutalist',
    name: 'Neo Brutalism',
    desc: 'Excentric blocky design with thick black outlines, soft yellow canvas, and heavy offsets.',
    bgClass: 'bg-[#fffbeb] text-black border-[3px] border-black',
    textClass: 'text-zinc-800',
    borderClass: 'border-[3px] border-black rounded-none bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
    accentClass: 'bg-[#f59e0b] text-black border-2 border-black hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-black uppercase tracking-wider',
    fontFamily: 'font-geist',
  },
]

const BoltIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 shrink-0">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
)

const StarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-500 shrink-0">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)

const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-500 shrink-0">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)

const GemIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 shrink-0">
    <path d="M6 3h12l4 6-10 13L2 9z" />
    <path d="M11 3 8 9l4 13 4-13-3-6" />
    <path d="M2 9h20" />
  </svg>
)

const defaultAvatar = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&q=80"

export default function SetupLandingPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'branding' | 'theme' | 'layout' | 'testimonials' | 'gallery'>('branding')
  const [user, setUser] = useState<any>(null)
  
  // Drag and drop state
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null)

  // Profile Info
  const [title, setTitle] = useState('')
  const [bio, setBio] = useState('')
  const [phone, setPhone] = useState('')
  const [instagram, setInstagram] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  
  // Geolocation & Address
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [locationName, setLocationName] = useState('Jakarta, DKI Jakarta')
  const [locStatus, setLocStatus] = useState<'idle' | 'detecting' | 'success' | 'error'>('idle')
  
  // Search Location manually
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  
  // Templates & Components Order
  const [userProducts, setUserProducts] = useState<any[]>([])

  // Templates & Components Order
  const [selectedTemplate, setSelectedTemplate] = useState('brutalist')
  const [sectionOrder, setSectionOrder] = useState<string[]>([
    'hero',
    'profile',
    'features',
    'benefits',
    'products',
    'testimonials',
    'pricing',
    'faq',
    'statistics',
    'social-proof',
    'cta',
    'gallery',
    'team',
    'process',
    'timeline',
    'lead-capture',
    'map',
    'footer'
  ])
  const [activeSections, setActiveSections] = useState<string[]>([
    'hero',
    'profile',
    'features',
    'benefits',
    'products',
    'testimonials',
    'pricing',
    'faq',
    'statistics',
    'social-proof',
    'cta',
    'gallery',
    'team',
    'process',
    'timeline',
    'lead-capture',
    'map',
    'footer'
  ])

  // Custom Gallery Items
  const [galleryTitle, setGalleryTitle] = useState('Galeri Foto Kami')
  const [galleryDesc, setGalleryDesc] = useState('Lihat portofolio, suasana tempat usaha, dan dokumentasi aktivitas kami.')
  const [galleryItems, setGalleryItems] = useState<Array<{ id: string; imageUrl: string; title: string; description: string }>>([
    { id: '1', imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop&q=80', title: 'Bahan Organik Pilihan', description: 'Tepung gandum utuh organik tanpa bahan pengawet buatan.' },
    { id: '2', imageUrl: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400&h=300&fit=crop&q=80', title: 'Freshly Baked Daily', description: 'Dipanggang hangat setiap pagi untuk menjaga cita rasa terbaik.' },
    { id: '3', imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop&q=80', title: 'Kemasan Ramah Lingkungan', description: 'Menggunakan kertas daur ulang food-grade untuk menjaga lingkungan.' }
  ])

  // Custom Footer Details
  const [footerText, setFooterText] = useState('')
  const [footerTagline, setFooterTagline] = useState('Pilihan terbaik untuk produk dan jasa berkualitas premium.')
  const [footerCopyright, setFooterCopyright] = useState('© 2026 Brand. Hak Cipta Dilindungi.')

  // Custom Testimonials
  const [testimonials, setTestimonials] = useState<Array<{ name: string; quote: string; rating: number }>>([
    { name: 'Ananda N.', quote: 'Kualitasnya benar-benar di luar ekspektasi saya. Rapi, premium, dan proses komunikasinya cepat. Rekomendasi bintang lima!', rating: 5 },
    { name: 'Dedi H.', quote: 'Bekerjasama dengan mereka untuk kemitraan cafe kami sangat memuaskan. Pengiriman selalu on-time dan konsisten.', rating: 5 }
  ])

  // Custom FAQ
  const [faq, setFaq] = useState<Array<{ question: string; answer: string }>>([
    { question: 'Bagaimana cara membeli produk/jasa merchant ini?', answer: 'Anda dapat mengklik tombol "Lihat Detail" di atas untuk diarahkan ke etalase checkout marketplace, atau klik tombol chat WhatsApp di bawah untuk konsultasi langsung.' },
    { question: 'Apakah ada minimal pemesanan?', answer: 'Tidak ada minimal pemesanan untuk eceran. Namun untuk pemesanan grosir/custom corporate, kami menawarkan harga khusus.' }
  ])

  // Active FAQ state for preview accordion
  const [activeFaqPreview, setActiveFaqPreview] = useState<number | null>(null)

  // Input refs for visual focus
  const titleInputRef = useRef<HTMLInputElement>(null)
  const bioInputRef = useRef<HTMLTextAreaElement>(null)
  const phoneInputRef = useRef<HTMLInputElement>(null)
  const instaInputRef = useRef<HTMLInputElement>(null)

  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    async function loadUser() {
      const fullProfile = await getCurrentUserProfile()
      if (!fullProfile) {
        router.push('/auth')
        return
      }
      setUser(fullProfile)

      // Fetch user products
      const allProducts = await getProducts()
      const myProducts = allProducts.filter((p: any) => p.merchantId === fullProfile.id)
      setUserProducts(myProducts)
      
      if (fullProfile.landingPageTemplate) {
        setSelectedTemplate(fullProfile.landingPageTemplate)
      }
      
      if (fullProfile.landingPageConfig) {
        try {
          const config = JSON.parse(fullProfile.landingPageConfig)
          setTitle(config.title || fullProfile.name)
          setBio(config.bio || `Selamat datang di halaman personal ${fullProfile.name}! Kami menyediakan produk dan jasa terbaik secara lokal.`)
          setPhone(config.phone || '')
          setInstagram(config.instagram || '')
          setLogoUrl(config.logoUrl || '')
          if (config.locationName) {
            setLocationName(config.locationName)
          }
          if (config.sections) {
            const savedSections = config.sections as string[]
            const defaultSecs = [
              'hero', 'profile', 'features', 'benefits', 'products', 'testimonials',
              'pricing', 'faq', 'statistics', 'social-proof', 'cta', 'gallery',
              'team', 'process', 'timeline', 'lead-capture', 'map', 'footer'
            ]
            const mergedOrder = [...savedSections, ...defaultSecs.filter(s => !savedSections.includes(s))]
            setSectionOrder(mergedOrder)
            setActiveSections(savedSections)
          }
          if (config.testimonials && Array.isArray(config.testimonials)) {
            setTestimonials(config.testimonials)
          }
          if (config.faq && Array.isArray(config.faq)) {
            setFaq(config.faq)
          }
          // Load Gallery
          setGalleryTitle(config.galleryTitle || 'Galeri Foto Kami')
          setGalleryDesc(config.galleryDesc || 'Lihat portofolio, suasana tempat usaha, dan dokumentasi aktivitas kami.')
          if (config.galleryItems && Array.isArray(config.galleryItems)) {
            setGalleryItems(config.galleryItems)
          }
          // Load Footer
          setFooterText(config.footerText || fullProfile.name)
          setFooterTagline(config.footerTagline || 'Pilihan terbaik untuk produk dan jasa berkualitas premium.')
          setFooterCopyright(config.footerCopyright || `© 2026 ${fullProfile.name}. Hak Cipta Dilindungi.`)
        } catch (e) {
          console.error('Failed to parse landingPageConfig:', e)
          setTitle(fullProfile.name)
          setBio(`Selamat datang di halaman personal ${fullProfile.name}! Kami menyediakan produk dan jasa terbaik secara lokal.`)
          setFooterText(fullProfile.name)
        }
      } else {
        setTitle(fullProfile.name)
        setBio(`Selamat datang di halaman personal ${fullProfile.name}! Kami menyediakan produk dan jasa terbaik secara lokal.`)
        setFooterText(fullProfile.name)
      }

      if (fullProfile.latitude && fullProfile.longitude) {
        setLatitude(fullProfile.latitude)
        setLongitude(fullProfile.longitude)
        setLocStatus('success')
        reverseGeocode(fullProfile.latitude, fullProfile.longitude)
      } else {
        detectLocation()
      }
    }
    loadUser()
  }, [])

  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`, {
        headers: { 'User-Agent': 'Teras-UMKM-App' }
      })
      if (res.ok) {
        const data = await res.json()
        const address = data.address || {}
        const city = address.city || address.town || address.municipality || address.city_district || address.county || address.regency || ''
        const province = address.state || ''
        if (city && province) {
          setLocationName(`${city}, ${province}`)
        } else if (city || province) {
          setLocationName(city || province)
        } else {
          const parts = data.display_name?.split(',') || []
          setLocationName(parts.slice(0, 2).join(', ') || 'Jakarta, DKI Jakarta')
        }
      }
    } catch (e) {
      console.error('Failed to reverse geocode:', e)
    }
  }

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocStatus('error')
      setError('Geolokasi tidak didukung oleh browser Anda.')
      return
    }

    setLocStatus('detecting')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lon = position.coords.longitude
        setLatitude(lat)
        setLongitude(lon)
        setLocStatus('success')
        reverseGeocode(lat, lon)
      },
      (err) => {
        console.error(err)
        setLatitude(-6.2088)
        setLongitude(106.8456)
        setLocStatus('error')
        setLocationName('Jakarta, DKI Jakarta')
      }
    )
  }

  const handleSearchLocation = async (query: string) => {
    if (!query || query.trim().length < 2) return
    setIsSearching(true)
    try {
      const res = await fetch(`/api/shipping/destination?keyword=${encodeURIComponent(query)}`)
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data.data || [])
      }
    } catch (e) {
      console.error('Error searching destination:', e)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectLocation = async (loc: any) => {
    const locName = `${loc.city_name || ''}, ${loc.province_name || ''}`
    setLocationName(locName)
    setSearchResults([])
    setSearchQuery('')
    
    setLocStatus('detecting')
    try {
      const queryStr = `${loc.subdistrict_name || ''} ${loc.city_name || ''} ${loc.province_name || ''}`
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryStr)}&limit=1`, {
        headers: { 'User-Agent': 'Teras-UMKM-App' }
      })
      if (res.ok) {
        const data = await res.json()
        if (data && data.length > 0) {
          setLatitude(parseFloat(data[0].lat))
          setLongitude(parseFloat(data[0].lon))
          setLocStatus('success')
        } else {
          setLatitude(-6.2088)
          setLongitude(106.8456)
          setLocStatus('success')
        }
      } else {
        setLatitude(-6.2088)
        setLongitude(106.8456)
        setLocStatus('success')
      }
    } catch (e) {
      setLatitude(-6.2088)
      setLongitude(106.8456)
      setLocStatus('success')
    }
  }

  const handleToggleSection = (sec: string) => {
    if (activeSections.includes(sec)) {
      setActiveSections(activeSections.filter(s => s !== sec))
    } else {
      setActiveSections([...activeSections, sec])
    }
  }

  const moveSection = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= sectionOrder.length) return
    const updated = [...sectionOrder]
    const [moved] = updated.splice(index, 1)
    updated.splice(nextIndex, 0, moved)
    setSectionOrder(updated)
  }

  // ── Drag-and-Drop handlers ──────────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, idx: number) => {
    setDraggedIdx(idx)
    e.dataTransfer.effectAllowed = 'move'
  }
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, idx: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (draggedIdx === null || draggedIdx === idx) return
    const updated = [...sectionOrder]
    const [moved] = updated.splice(draggedIdx, 1)
    updated.splice(idx, 0, moved)
    setSectionOrder(updated)
    setDraggedIdx(idx)
  }
  const handleDragEnd = () => setDraggedIdx(null)

  // ── Gallery CRUD ────────────────────────────────────────────────────────────
  const handleAddGalleryItem = () => {
    if (galleryItems.length >= 6) return
    setGalleryItems([...galleryItems, {
      id: Date.now().toString(),
      imageUrl: '',
      title: 'Foto Baru',
      description: 'Deskripsi singkat foto ini.'
    }])
  }
  const handleRemoveGalleryItem = (id: string) => {
    setGalleryItems(galleryItems.filter(item => item.id !== id))
  }
  const handleUpdateGalleryItem = (id: string, fields: Partial<{ imageUrl: string; title: string; description: string }>) => {
    setGalleryItems(galleryItems.map(item => item.id === id ? { ...item, ...fields } : item))
  }
  const handleGalleryImageUpload = (id: string, file: File) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX = 600
        let { width, height } = img
        if (width > height) { if (width > MAX) { height = height * MAX / width; width = MAX } }
        else { if (height > MAX) { width = width * MAX / height; height = MAX } }
        canvas.width = width; canvas.height = height
        const ctx = canvas.getContext('2d')
        if (ctx) { ctx.drawImage(img, 0, 0, width, height); handleUpdateGalleryItem(id, { imageUrl: canvas.toDataURL('image/jpeg', 0.8) }) }
        else { handleUpdateGalleryItem(id, { imageUrl: reader.result as string }) }
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleAddTestimonial = () => {
    if (testimonials.length >= 4) return
    setTestimonials([...testimonials, { name: 'Customer Baru', quote: 'Ulasan testimonial...', rating: 5 }])
  }

  const handleRemoveTestimonial = (idx: number) => {
    setTestimonials(testimonials.filter((_, i) => i !== idx))
  }

  const handleUpdateTestimonial = (idx: number, fields: any) => {
    const updated = testimonials.map((t, i) => {
      if (i === idx) {
        return { ...t, ...fields }
      }
      return t
    })
    setTestimonials(updated)
  }

  const handleAddFaq = () => {
    if (faq.length >= 4) return
    setFaq([...faq, { question: 'Pertanyaan Baru?', answer: 'Jawaban...' }])
  }

  const handleRemoveFaq = (idx: number) => {
    setFaq(faq.filter((_, i) => i !== idx))
  }

  const handleUpdateFaq = (idx: number, fields: any) => {
    const updated = faq.map((f, i) => {
      if (i === idx) {
        return { ...f, ...fields }
      }
      return f
    })
    setFaq(updated)
  }

  const handleWYSIWYGFocus = (field: string) => {
    setActiveTab('branding')
    setTimeout(() => {
      if (field === 'title' && titleInputRef.current) {
        titleInputRef.current.focus()
        titleInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else if (field === 'bio' && bioInputRef.current) {
        bioInputRef.current.focus()
        bioInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else if (field === 'phone' && phoneInputRef.current) {
        phoneInputRef.current.focus()
        phoneInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else if (field === 'instagram' && instaInputRef.current) {
        instaInputRef.current.focus()
        instaInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 150)
  }

  const handleSubmit = () => {
    setError(null)
    if (!title || !bio) {
      setError('Nama landing page dan bio wajib diisi.')
      return
    }

    startTransition(async () => {
      const config = JSON.stringify({
        title,
        bio,
        phone,
        instagram,
        logoUrl,
        locationName,
        sections: sectionOrder.filter((key) => activeSections.includes(key)),
        testimonials,
        faq,
        galleryTitle,
        galleryDesc,
        galleryItems,
        footerText: footerText || title,
        footerTagline,
        footerCopyright
      })

      const res = await updateUserLandingPage(
        selectedTemplate,
        config,
        latitude || -6.2088,
        longitude || 106.8456
      )

      if (res.error) {
        setError(res.error)
      } else {
        // Use hard redirect to clear router state and refresh all layouts server-side
        window.location.href = `/profile/${user.id}`
      }
    })
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-dark">
        <span className="text-xs font-geist font-bold text-primary tracking-widest uppercase animate-pulse">
          Loading WYSIWYG Engine...
        </span>
      </div>
    )
  }

  const activeTpl = TEMPLATES.find((t) => t.id === selectedTemplate) || TEMPLATES[2]

  return (
    <div className="relative min-h-screen bg-bg-dark py-6 px-4 md:px-10 flex flex-col justify-center items-center">
      {/* Mesh Glow background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1400px] h-[550px] bg-[radial-gradient(circle_at_center,rgba(198,169,107,0.04)_0%,transparent_75%)] pointer-events-none z-0" />

      {/* Editor Main Container */}
      <div className="relative z-10 w-full max-w-[1400px] grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT WORKSPACE - CONTROL PANEL */}
        <div className="lg:col-span-5 flex flex-col border border-border-subtle bg-surface-dark glow-card rounded-2xl overflow-hidden shadow-2xl justify-between h-[85vh] sticky top-6">
          
          {/* Header */}
          <div className="p-5 border-b border-border-subtle bg-surface-dark/90 backdrop-blur flex items-center justify-between shrink-0">
            <div>
              <span className="text-[9px] font-geist font-black text-primary tracking-widest uppercase">
                Visual Customizer v3.0
              </span>
              <h1 className="font-sora text-base font-bold text-text-primary mt-0.5">
                Landing Page Builder
              </h1>
            </div>
            <span className="px-2.5 py-0.5 bg-primary/15 border border-primary/20 text-primary text-[8px] font-black font-geist rounded uppercase tracking-wider">
              {user.role} Editor
            </span>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-border-subtle bg-surface-dark shrink-0 overflow-x-auto">
            <button
              onClick={() => setActiveTab('branding')}
              className={`flex-1 min-w-[72px] py-2.5 text-[9px] font-bold font-geist uppercase tracking-wider flex flex-col items-center gap-1 border-b-2 transition-all ${
                activeTab === 'branding' 
                  ? 'border-primary text-primary bg-primary/[0.02]' 
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-white/[0.01]'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Profil
            </button>
            <button
              onClick={() => setActiveTab('theme')}
              className={`flex-1 min-w-[72px] py-2.5 text-[9px] font-bold font-geist uppercase tracking-wider flex flex-col items-center gap-1 border-b-2 transition-all ${
                activeTab === 'theme' 
                  ? 'border-primary text-primary bg-primary/[0.02]' 
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-white/[0.01]'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              Tema
            </button>
            <button
              onClick={() => setActiveTab('layout')}
              className={`flex-1 min-w-[72px] py-2.5 text-[9px] font-bold font-geist uppercase tracking-wider flex flex-col items-center gap-1 border-b-2 transition-all ${
                activeTab === 'layout' 
                  ? 'border-primary text-primary bg-primary/[0.02]' 
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-white/[0.01]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Layout
            </button>
            <button
              onClick={() => setActiveTab('testimonials')}
              className={`flex-1 min-w-[72px] py-2.5 text-[9px] font-bold font-geist uppercase tracking-wider flex flex-col items-center gap-1 border-b-2 transition-all ${
                activeTab === 'testimonials' 
                  ? 'border-primary text-primary bg-primary/[0.02]' 
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-white/[0.01]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Ulasan
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={`flex-1 min-w-[72px] py-2.5 text-[9px] font-bold font-geist uppercase tracking-wider flex flex-col items-center gap-1 border-b-2 transition-all ${
                activeTab === 'gallery' 
                  ? 'border-primary text-primary bg-primary/[0.02]' 
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-white/[0.01]'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Galeri
            </button>
          </div>

          {/* Scrolling Content Workspace */}
          <div className="flex-grow overflow-y-auto p-5 space-y-5 bg-surface-dark/30 scrollbar-thin">
            {error && (
              <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-[11px] text-red-400 font-medium">
                {error}
              </div>
            )}

            {/* TAB: BRANDING & PROFILE */}
            {activeTab === 'branding' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[9px] font-geist font-black text-text-secondary uppercase tracking-widest mb-1.5">
                    Nama Bisnis / Brand
                  </label>
                  <input
                    ref={titleInputRef}
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Kala Sourdough Bakery"
                    className="w-full px-3.5 py-2 bg-surface-container border border-border-subtle rounded-lg text-xs text-text-primary placeholder:text-text-secondary/30 focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-geist font-black text-text-secondary uppercase tracking-widest mb-1.5">
                    Logo / Foto Profil Usaha
                  </label>
                  <div className="flex items-center gap-4 p-3 border border-border-subtle bg-surface-container/50 rounded-xl">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden border-2 border-primary bg-surface-container flex-shrink-0 flex items-center justify-center text-text-secondary shadow-md">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo Preview" className="w-full h-full object-cover" />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-neutral-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-grow">
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onloadend = () => {
                              const img = new Image()
                              img.onload = () => {
                                const canvas = document.createElement('canvas')
                                const MAX_WIDTH = 250
                                const MAX_HEIGHT = 250
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
                                  setLogoUrl(canvas.toDataURL('image/jpeg', 0.8))
                                } else {
                                  setLogoUrl(reader.result as string)
                                }
                              }
                              img.src = reader.result as string
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                        className="hidden"
                        id="logo-upload-input"
                      />
                      <label
                        htmlFor="logo-upload-input"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container hover:bg-surface-container-high border border-border-subtle hover:border-primary/50 text-text-primary rounded-lg text-[10px] font-bold font-geist transition-all cursor-pointer shadow-sm"
                      >
                        <Upload className="w-3.5 h-3.5" /> Unggah Foto Logo
                      </label>
                      {logoUrl && (
                        <button
                          type="button"
                          onClick={() => setLogoUrl('')}
                          className="text-[9px] text-red-400 font-bold block mt-1 hover:underline cursor-pointer"
                        >
                          Gunakan Default Avatar
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-geist font-black text-text-secondary uppercase tracking-widest mb-1.5">
                    Bio & Cerita Usaha
                  </label>
                  <textarea
                    ref={bioInputRef}
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tuliskan jam operasional, visi, atau keunikan produk Anda..."
                    className="w-full px-3.5 py-2.5 bg-surface-container border border-border-subtle rounded-lg text-xs text-text-primary placeholder:text-text-secondary/30 focus:outline-none focus:border-primary/50 resize-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-geist font-black text-text-secondary uppercase tracking-widest mb-1.5">
                      No. WhatsApp
                    </label>
                    <input
                      ref={phoneInputRef}
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Contoh: 08123456789"
                      className="w-full px-3.5 py-2 bg-surface-container border border-border-subtle rounded-lg text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-geist font-black text-text-secondary uppercase tracking-widest mb-1.5">
                      Username Instagram
                    </label>
                    <input
                      ref={instaInputRef}
                      type="text"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="Contoh: @kala.sourdough"
                      className="w-full px-3.5 py-2 bg-surface-container border border-border-subtle rounded-lg text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>
                </div>

                {/* Geolocation Section */}
                <div className="pt-4 border-t border-border-subtle space-y-3">
                  <span className="block text-[9px] font-geist font-black text-text-secondary uppercase tracking-widest">
                    Peta Lokasi & Geotagging
                  </span>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari Kota / Kecamatan, e.g. Solo, Jogja..."
                      className="flex-grow px-3 py-1.5 bg-surface-container border border-border-subtle rounded-lg text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleSearchLocation(searchQuery)
                        }
                      }}
                    />
                    <button
                      onClick={() => handleSearchLocation(searchQuery)}
                      type="button"
                      className="px-3.5 py-1.5 bg-surface-container border border-border-subtle hover:bg-surface-container-high text-text-primary rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      {isSearching ? '...' : 'Cari'}
                    </button>
                  </div>
                  
                  {searchResults.length > 0 && (
                    <div className="border border-border-subtle bg-surface-dark rounded-xl max-h-[140px] overflow-y-auto divide-y divide-border-subtle shadow-lg">
                      {searchResults.map((loc) => (
                        <button
                          key={loc.id}
                          type="button"
                          onClick={() => handleSelectLocation(loc)}
                          className="w-full text-left px-3 py-2 hover:bg-surface-container text-xs text-text-primary transition-colors flex justify-between items-center"
                        >
                          <span>{loc.label}</span>
                          <span className="text-[8px] text-primary font-bold uppercase shrink-0">Pilih</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3 p-3 bg-surface-container/50 border border-border-subtle rounded-xl text-xs">
                    <div className="min-w-0">
                      <span className="block text-[8px] font-bold text-text-secondary uppercase tracking-wider">Lokasi Sekarang</span>
                      <span className="font-bold text-primary truncate block">{locationName}</span>
                    </div>
                    <button
                      onClick={detectLocation}
                      type="button"
                      className="px-2.5 py-1.5 bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary rounded-lg text-[10px] font-bold transition-all shrink-0 cursor-pointer"
                    >
                      {locStatus === 'detecting' ? 'GPS...' : 'Gunakan GPS'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: THEME STYLE & PRESETS */}
            {activeTab === 'theme' && (
              <div className="space-y-4">
                {/* Quick Industry Presets */}
                <div className="p-3 border border-border-subtle bg-primary/[0.01] rounded-xl space-y-2">
                  <span className="block text-[9px] font-geist font-black text-primary uppercase tracking-widest">
                    ⚡ Preset Cepat
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        name: '☕ Cafe & Bakery',
                        tpl: 'template1',
                        sections: ['hero', 'profile', 'products', 'cta', 'map'],
                        bioText: 'Kami menyajikan aneka roti sourdough artisan, kopi premium specialty, dan hidangan penutup organik yang dipanggang segar setiap hari.'
                      },
                      {
                        name: '👗 Boutique Fashion',
                        tpl: 'template3',
                        sections: ['hero', 'products', 'profile', 'features', 'testimonials', 'cta'],
                        bioText: 'Butik kerajinan busana lokal dengan tenun tangan asli Jogjakarta, mengedepankan keunikan corak, bahan ramah kulit, dan sentuhan warisan budaya modern.'
                      },
                      {
                        name: '🛠️ Professional Jasa',
                        tpl: 'brutalist',
                        sections: ['hero', 'profile', 'features', 'testimonials', 'faq', 'cta', 'map'],
                        bioText: 'Menyediakan jasa identitas brand visual, digital branding audit, fotografi katalog studio, serta konsultasi digital marketing untuk UMKM naik kelas.'
                      },
                      {
                        name: '💻 Portofolio Digital',
                        tpl: 'template5',
                        sections: ['hero', 'profile', 'products', 'cta'],
                        bioText: 'Pusat publikasi proyek digital, penawaran joint-venture program, serta rincian komisi kemitraan afiliasi Teras UMKM.'
                      }
                    ].map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => {
                          setSelectedTemplate(p.tpl)
                          setActiveSections(p.sections)
                          setBio(p.bioText)
                          const defaultSecs = [
                            'hero', 'profile', 'features', 'benefits', 'products', 'testimonials',
                            'pricing', 'faq', 'statistics', 'social-proof', 'cta', 'gallery',
                            'team', 'process', 'timeline', 'lead-capture', 'map'
                          ]
                          setSectionOrder([...p.sections, ...defaultSecs.filter(s => !p.sections.includes(s))])
                        }}
                        className="p-2 bg-surface-container hover:bg-surface-container-high border border-border-subtle hover:border-primary/55 rounded-lg text-[10px] font-bold text-text-primary text-left transition-all cursor-pointer"
                      >
                        <div className="text-primary truncate">{p.name}</div>
                        <span className="text-[7px] text-text-secondary block font-normal capitalize">Layout: {p.tpl}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="block text-[9px] font-geist font-black text-text-secondary uppercase tracking-widest">
                    Pilih Desain Tema Visual
                  </span>
                  <div className="grid grid-cols-1 gap-2.5">
                    {TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => setSelectedTemplate(tpl.id)}
                        className={`p-3 border text-left rounded-xl transition-all flex items-center justify-between gap-3 ${
                          selectedTemplate === tpl.id
                            ? 'border-primary bg-primary/[0.03] shadow-lg shadow-primary/5'
                            : 'border-border-subtle bg-surface-container hover:bg-surface-container-high'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-text-primary font-sora truncate">
                              {tpl.name}
                            </span>
                            {selectedTemplate === tpl.id && (
                              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            )}
                          </div>
                          <p className="text-[9px] text-text-secondary mt-0.5 line-clamp-1">
                            {tpl.desc}
                          </p>
                        </div>
                        <span className={`text-[8px] font-bold px-2 py-0.5 rounded uppercase font-mono shrink-0 border ${
                          selectedTemplate === tpl.id 
                            ? 'bg-primary/20 border-primary/20 text-primary' 
                            : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                        }`}>
                          {tpl.fontFamily.replace('font-', '')}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: LAYOUT SECTIONS - Drag & Drop */}
            {activeTab === 'layout' && (
              <div className="space-y-4">
                <span className="block text-[9px] font-geist font-black text-text-secondary uppercase tracking-widest">
                  Urutan & Tampilan Seksi
                </span>
                <p className="text-[10px] text-text-secondary leading-relaxed flex items-center gap-1.5">
                  <GripVertical className="w-3 h-3 text-primary shrink-0" />
                  Seret baris untuk mengubah urutan. Centang untuk menampilkan, hapus centang untuk menyembunyikan seksi.
                </p>

                <div className="space-y-2">
                  {sectionOrder.map((sec, idx) => {
                    const active = activeSections.includes(sec)
                    const isDragging = draggedIdx === idx
                    return (
                      <div
                        key={sec}
                        draggable
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDragEnd={handleDragEnd}
                        className={`p-3 border rounded-xl flex items-center justify-between transition-all duration-150 select-none ${
                          isDragging
                            ? 'opacity-40 border-dashed border-primary/50 scale-95 shadow-inner'
                            : active
                              ? 'border-primary/30 bg-primary/[0.01] hover:border-primary/50 cursor-grab active:cursor-grabbing'
                              : 'border-border-subtle bg-surface-container opacity-50 cursor-grab'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Grip handle */}
                          <GripVertical className={`w-4 h-4 shrink-0 ${active ? 'text-primary/50' : 'text-neutral-600'}`} />

                          {/* Index badge */}
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 ${active ? 'bg-primary/20 text-primary' : 'bg-neutral-800 text-neutral-400'}`}>
                            {idx + 1}
                          </span>

                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={active}
                              onChange={() => handleToggleSection(sec)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-3.5 h-3.5 accent-primary cursor-pointer shrink-0 rounded border-border-subtle"
                            />
                            <span className="text-xs font-bold text-text-primary capitalize truncate font-geist">
                              {sec === 'hero' && '🏠 Hero Banner'}
                              {sec === 'profile' && '👤 Tentang Usaha'}
                              {sec === 'features' && '⚡ Keunggulan'}
                              {sec === 'benefits' && '🎁 Nilai Tambah'}
                              {sec === 'products' && '🛍️ Etalase Produk'}
                              {sec === 'testimonials' && '⭐ Testimoni'}
                              {sec === 'pricing' && '💰 Paket Harga'}
                              {sec === 'faq' && '❓ FAQ'}
                              {sec === 'statistics' && '📈 Statistik'}
                              {sec === 'social-proof' && '🤝 Social Proof'}
                              {sec === 'cta' && '🎯 CTA Banner'}
                              {sec === 'gallery' && '🖼️ Galeri Foto'}
                              {sec === 'team' && '👥 Tim Kami'}
                              {sec === 'process' && '⚙️ Cara Pemesanan'}
                              {sec === 'timeline' && '⏳ Riwayat Usaha'}
                              {sec === 'lead-capture' && '✉️ Penawaran Khusus'}
                              {sec === 'map' && '📍 Peta Lokasi'}
                              {sec === 'footer' && '🔗 Footer Halaman'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); moveSection(idx, -1) }}
                            disabled={idx === 0}
                            className="w-5 h-5 border border-border-subtle hover:bg-surface-container-high hover:text-primary disabled:hover:text-text-secondary rounded flex items-center justify-center text-[9px] font-bold disabled:opacity-30 transition-all cursor-pointer"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); moveSection(idx, 1) }}
                            disabled={idx === sectionOrder.length - 1}
                            className="w-5 h-5 border border-border-subtle hover:bg-surface-container-high hover:text-primary disabled:hover:text-text-secondary rounded flex items-center justify-center text-[9px] font-bold disabled:opacity-30 transition-all cursor-pointer"
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* TAB: TESTIMONIALS & FAQ */}
            {activeTab === 'testimonials' && (
              <div className="space-y-5">
                {/* Testimonials Manager */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="block text-[9px] font-geist font-black text-text-secondary uppercase tracking-widest">
                      Kelola Ulasan Testimoni ({testimonials.length}/4)
                    </span>
                    <button
                      onClick={handleAddTestimonial}
                      disabled={testimonials.length >= 4}
                      className="px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 rounded text-[9px] font-bold flex items-center gap-1 transition-all disabled:opacity-30 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Tambah
                    </button>
                  </div>

                  <div className="space-y-3">
                    {testimonials.map((t, idx) => (
                      <div key={idx} className="p-3 border border-border-subtle bg-surface-container/50 rounded-xl space-y-2.5 relative">
                        <button
                          onClick={() => handleRemoveTestimonial(idx)}
                          className="absolute top-2.5 right-2.5 text-text-secondary hover:text-red-400 transition-colors cursor-pointer"
                          type="button"
                          title="Hapus Testimonial"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="grid grid-cols-2 gap-2 pr-6">
                          <div>
                            <label className="block text-[8px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-1">
                              Nama Client
                            </label>
                            <input
                              type="text"
                              value={t.name}
                              onChange={(e) => handleUpdateTestimonial(idx, { name: e.target.value })}
                              className="w-full px-2 py-1 bg-surface-container border border-border-subtle rounded text-[11px] text-text-primary focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-1">
                              Rating Bintang
                            </label>
                            <select
                              value={t.rating}
                              onChange={(e) => handleUpdateTestimonial(idx, { rating: parseInt(e.target.value) })}
                              className="w-full px-2 py-1 bg-surface-container border border-border-subtle rounded text-[11px] text-text-primary focus:outline-none"
                            >
                              {[5, 4, 3, 2, 1].map(r => (
                                <option key={r} value={r}>{r} Bintang</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[8px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-1">
                            Kutipan Ulasan
                          </label>
                          <textarea
                            rows={2}
                            value={t.quote}
                            onChange={(e) => handleUpdateTestimonial(idx, { quote: e.target.value })}
                            className="w-full px-2 py-1 bg-surface-container border border-border-subtle rounded text-[11px] text-text-primary focus:outline-none resize-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* FAQ Manager */}
                <div className="space-y-3 pt-4 border-t border-border-subtle">
                  <div className="flex items-center justify-between">
                    <span className="block text-[9px] font-geist font-black text-text-secondary uppercase tracking-widest">
                      Kelola Tanya Jawab FAQ ({faq.length}/4)
                    </span>
                    <button
                      onClick={handleAddFaq}
                      disabled={faq.length >= 4}
                      className="px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 rounded text-[9px] font-bold flex items-center gap-1 transition-all disabled:opacity-30 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Tambah
                    </button>
                  </div>

                  <div className="space-y-3">
                    {faq.map((f, idx) => (
                      <div key={idx} className="p-3 border border-border-subtle bg-surface-container/50 rounded-xl space-y-2 relative">
                        <button
                          onClick={() => handleRemoveFaq(idx)}
                          className="absolute top-2.5 right-2.5 text-text-secondary hover:text-red-400 transition-colors cursor-pointer"
                          type="button"
                          title="Hapus FAQ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="pr-6">
                          <label className="block text-[8px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-1">
                            Pertanyaan
                          </label>
                          <input
                            type="text"
                            value={f.question}
                            onChange={(e) => handleUpdateFaq(idx, { question: e.target.value })}
                            className="w-full px-2.5 py-1 bg-surface-container border border-border-subtle rounded text-[11px] text-text-primary focus:outline-none font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-1">
                            Jawaban
                          </label>
                          <textarea
                            rows={2}
                            value={f.answer}
                            onChange={(e) => handleUpdateFaq(idx, { answer: e.target.value })}
                            className="w-full px-2.5 py-1 bg-surface-container border border-border-subtle rounded text-[11px] text-text-primary focus:outline-none resize-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: GALLERY & FOOTER EDITOR */}
            {activeTab === 'gallery' && (
              <div className="space-y-5">
                {/* Gallery Section Config */}
                <div className="space-y-3">
                  <span className="block text-[9px] font-geist font-black text-text-secondary uppercase tracking-widest">
                    🖼️ Galeri Foto ({galleryItems.length}/6)
                  </span>

                  <div>
                    <label className="block text-[8px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-1">Judul Galeri</label>
                    <input
                      type="text"
                      value={galleryTitle}
                      onChange={(e) => setGalleryTitle(e.target.value)}
                      placeholder="Galeri Foto Kami"
                      className="w-full px-3 py-1.5 bg-surface-container border border-border-subtle rounded-lg text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[8px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-1">Deskripsi Galeri</label>
                    <textarea
                      rows={2}
                      value={galleryDesc}
                      onChange={(e) => setGalleryDesc(e.target.value)}
                      placeholder="Lihat portofolio dan dokumentasi kami..."
                      className="w-full px-3 py-1.5 bg-surface-container border border-border-subtle rounded-lg text-xs text-text-primary focus:outline-none focus:border-primary/50 resize-none transition-colors"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleAddGalleryItem}
                      disabled={galleryItems.length >= 6}
                      className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 rounded-lg text-[9px] font-bold flex items-center gap-1 transition-all disabled:opacity-30 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Tambah Foto
                    </button>
                  </div>

                  <div className="space-y-3">
                    {galleryItems.map((item) => (
                      <div key={item.id} className="p-3 border border-border-subtle bg-surface-container/50 rounded-xl space-y-2 relative">
                        <button
                          onClick={() => handleRemoveGalleryItem(item.id)}
                          className="absolute top-2.5 right-2.5 text-text-secondary hover:text-red-400 transition-colors cursor-pointer"
                          type="button"
                          title="Hapus Foto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex gap-3 items-start">
                          {/* Image preview */}
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-border-subtle bg-surface-container shrink-0 flex items-center justify-center">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[9px] text-text-secondary text-center px-1">Belum ada foto</span>
                            )}
                          </div>
                          {/* Upload button */}
                          <div className="flex-1">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleGalleryImageUpload(item.id, f) }}
                              className="hidden"
                              id={`gallery-img-${item.id}`}
                            />
                            <label
                              htmlFor={`gallery-img-${item.id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface-container hover:bg-surface-container-high border border-border-subtle rounded text-[9px] font-bold text-text-primary cursor-pointer transition-all"
                            >
                              <Upload className="w-3 h-3" /> Upload
                            </label>
                          </div>
                        </div>

                        <div className="pr-8">
                          <label className="block text-[8px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-1">Judul Foto</label>
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => handleUpdateGalleryItem(item.id, { title: e.target.value })}
                            className="w-full px-2 py-1 bg-surface-container border border-border-subtle rounded text-[11px] text-text-primary focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-1">Deskripsi</label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleUpdateGalleryItem(item.id, { description: e.target.value })}
                            className="w-full px-2 py-1 bg-surface-container border border-border-subtle rounded text-[11px] text-text-primary focus:outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Section Config */}
                <div className="space-y-3 pt-5 border-t border-border-subtle">
                  <span className="block text-[9px] font-geist font-black text-text-secondary uppercase tracking-widest">
                    🔗 Custom Footer Halaman
                  </span>

                  <div>
                    <label className="block text-[8px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-1">Nama Brand di Footer</label>
                    <input
                      type="text"
                      value={footerText}
                      onChange={(e) => setFooterText(e.target.value)}
                      placeholder={title || 'Nama Brand Anda'}
                      className="w-full px-3 py-1.5 bg-surface-container border border-border-subtle rounded-lg text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[8px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-1">Tagline Footer</label>
                    <textarea
                      rows={2}
                      value={footerTagline}
                      onChange={(e) => setFooterTagline(e.target.value)}
                      placeholder="Pilihan terbaik untuk produk dan jasa berkualitas premium."
                      className="w-full px-3 py-1.5 bg-surface-container border border-border-subtle rounded-lg text-xs text-text-primary focus:outline-none focus:border-primary/50 resize-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[8px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-1">Teks Copyright</label>
                    <input
                      type="text"
                      value={footerCopyright}
                      onChange={(e) => setFooterCopyright(e.target.value)}
                      placeholder="© 2026 Brand Anda. Hak Cipta Dilindungi."
                      className="w-full px-3 py-1.5 bg-surface-container border border-border-subtle rounded-lg text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Save & Publish Bar */}
          <div className="p-4 border-t border-border-subtle bg-surface-dark/95 backdrop-blur flex justify-between items-center shrink-0">
            <span className="text-[9px] text-text-secondary font-geist max-w-[200px] leading-tight">
              Selesai mengonfigurasi? Klik tombol untuk menyimpan perubahan ke database.
            </span>
            <button
              onClick={handleSubmit}
              disabled={isPending}
              className="px-6 py-2.5 bg-primary hover:bg-primary-container text-surface-dark rounded-xl text-xs font-black font-geist uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-lg active:scale-95 shrink-0"
            >
              {isPending ? 'Menyimpan...' : 'Simpan & Terapkan'}
            </button>
          </div>
        </div>

        {/* RIGHT WORKSPACE - DYNAMIC LIVE PREVIEW (WYSIWYG CANVAS) */}
        <div className="lg:col-span-7 flex flex-col border border-border-subtle bg-[#121314] rounded-2xl overflow-hidden h-[85vh] shadow-2xl relative">
          
          {/* Preview Panel Top Bar */}
          <div className="px-5 py-4 bg-[#18191a] border-b border-border-subtle flex items-center justify-between shrink-0">
            <span className="text-[10px] font-geist font-black text-text-secondary uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" /> WYSIWYG PREVIEW CANVAS
            </span>
            <span className="text-[9px] font-geist font-black text-primary uppercase border border-primary/25 bg-primary/5 px-2.5 py-0.5 rounded-full">
              Style: {activeTpl.name}
            </span>
          </div>

          {/* Real-time WYSIWYG Editable Area */}
          <div className="flex-grow overflow-y-auto scrollbar-thin transition-all duration-300 relative bg-[#121314]">
            <LandingPageRenderer
              templateId={selectedTemplate}
              user={user}
              config={{
                title,
                bio,
                phone,
                instagram,
                logoUrl,
                locationName,
                sections: sectionOrder.filter((key) => activeSections.includes(key)),
                testimonials,
                faq,
                galleryTitle,
                galleryDesc,
                galleryItems,
                footerText: footerText || title,
                footerTagline,
                footerCopyright
              }}
              products={userProducts}
              isEditable={true}
              onWYSIWYGFocus={handleWYSIWYGFocus}
              onSectionControl={(secName, action) => {
                if (action === 'toggle') {
                  handleToggleSection(secName)
                } else {
                  const idx = sectionOrder.indexOf(secName)
                  if (idx !== -1) {
                    const dir = action === 'up' ? -1 : 1
                    moveSection(idx, dir)
                  }
                }
              }}
            />
          </div>
        </div>

      </div>
    </div>
  )
}
