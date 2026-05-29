'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateUserLandingPage, getCurrentUser, getCurrentUserProfile } from '../actions/auth'
import { MapPin, ArrowRight, ArrowLeft, ArrowUp, ArrowDown } from 'lucide-react'

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
    id: 'minimal-noir',
    name: 'Minimal Noir',
    desc: 'Sleek matte black, ultra high-contrast typography, and minimal line art borders.',
    bgClass: 'bg-black text-white',
    textClass: 'text-neutral-400',
    borderClass: 'border-neutral-800',
    accentClass: 'bg-white text-black hover:bg-neutral-200',
    fontFamily: 'font-geist',
  },
  {
    id: 'clean-professional',
    name: 'Clean Professional',
    desc: 'Cool slate gray, professional borders, and deep corporate blue accents.',
    bgClass: 'bg-slate-900 text-slate-100',
    textClass: 'text-slate-400',
    borderClass: 'border-slate-800',
    accentClass: 'bg-blue-600 text-white hover:bg-blue-500',
    fontFamily: 'font-inter',
  },
  {
    id: 'modern-gold',
    name: 'Modern Gold',
    desc: 'Deep charcoal background, sparkling golden typography, and premium glassmorphism.',
    bgClass: 'bg-neutral-950 text-neutral-100',
    textClass: 'text-neutral-400',
    borderClass: 'border-amber-500/20',
    accentClass: 'bg-amber-500 text-black hover:bg-amber-400',
    fontFamily: 'font-sora',
  },
  {
    id: 'creative-bold',
    name: 'Creative Bold',
    desc: 'Vibrant purple & indigo gradient, playful rounded shapes, and creative glows.',
    bgClass: 'bg-gradient-to-tr from-purple-950 via-neutral-950 to-indigo-950 text-neutral-100',
    textClass: 'text-purple-300/70',
    borderClass: 'border-purple-500/20',
    accentClass: 'bg-purple-600 text-white hover:bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]',
    fontFamily: 'font-sora',
  },
  {
    id: 'cyberpunk-dark',
    name: 'Cyberpunk Dark',
    desc: 'Solid pitch black, glowing neon cyan borders, and monospace terminal styling.',
    bgClass: 'bg-neutral-950 text-cyan-400 border border-cyan-500/30',
    textClass: 'text-neutral-400',
    borderClass: 'border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.15)]',
    accentClass: 'bg-cyan-500 text-black hover:bg-cyan-400 font-bold',
    fontFamily: 'font-geist',
  },
  {
    id: 'sunset-gradient',
    name: 'Sunset Gradient',
    desc: 'Rich orange-pink sunset gradient, warm sunset glow, and rounded buttons.',
    bgClass: 'bg-gradient-to-br from-amber-950 via-stone-900 to-rose-950 text-orange-100',
    textClass: 'text-rose-200/70',
    borderClass: 'border-orange-500/20',
    accentClass: 'bg-gradient-to-r from-amber-500 to-rose-500 text-white hover:from-amber-400 hover:to-rose-400 font-bold rounded-full',
    fontFamily: 'font-inter',
  },
  {
    id: 'emerald-garden',
    name: 'Emerald Garden',
    desc: 'Deep forest green colors, organic border accents, and emerald glows.',
    bgClass: 'bg-gradient-to-tr from-emerald-950 via-zinc-950 to-teal-950 text-emerald-100',
    textClass: 'text-emerald-300/70',
    borderClass: 'border-emerald-500/25',
    accentClass: 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]',
    fontFamily: 'font-sora',
  },
  {
    id: 'retro-synthwave',
    name: 'Retro Synthwave',
    desc: '80s neon purple/pink design, neon grid borders, and cyberpunk terminal styling.',
    bgClass: 'bg-zinc-950 text-fuchsia-400 border border-fuchsia-500/30',
    textClass: 'text-neutral-400',
    borderClass: 'border-fuchsia-500/30 shadow-[0_0_10px_rgba(217,70,239,0.2)]',
    accentClass: 'bg-fuchsia-600 text-white hover:bg-fuchsia-500 font-bold',
    fontFamily: 'font-geist',
  },
  {
    id: 'alabaster-glass',
    name: 'Alabaster Glass',
    desc: 'Light frosted glassmorphism, clean light grey background, and dark slate text.',
    bgClass: 'bg-slate-50 text-slate-900 border border-slate-200',
    textClass: 'text-slate-600',
    borderClass: 'border-slate-300 bg-white/40 backdrop-blur-md',
    accentClass: 'bg-slate-900 text-white hover:bg-slate-800 font-bold',
    fontFamily: 'font-inter',
  },
  {
    id: 'studio',
    name: 'Studio Design',
    desc: 'Aesthetic creative studio layout with rounded design elements, beige/brown accents, and clean spacing.',
    bgClass: 'bg-white text-zinc-900',
    textClass: 'text-zinc-500',
    borderClass: 'border-zinc-200 bg-zinc-50/50 rounded-3xl',
    accentClass: 'bg-[#78350f] text-white hover:bg-[#854d0e] rounded-3xl font-bold',
    fontFamily: 'font-sans',
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
  {
    id: 'swiss-minimalist',
    name: 'Swiss Minimalist',
    desc: 'Berdasarkan Design1.md - Grid & Swiss Style (1950s), sharp 0px edges, clean asymmetric layouts, contrast monochromatic aesthetic.',
    bgClass: 'bg-[#F5F1E8] text-black border border-black',
    textClass: 'text-neutral-700',
    borderClass: 'border-black rounded-none bg-white',
    accentClass: 'bg-black text-white hover:bg-neutral-800 rounded-none border border-black',
    fontFamily: 'font-sans',
  },
  {
    id: 'de-stijl',
    name: 'De Stijl Abstract',
    desc: 'Berdasarkan Design2.md - Neoplasticism geometric grid, bold black lines, and flat primary color accents.',
    bgClass: 'bg-white text-black border-2 border-black',
    textClass: 'text-neutral-500',
    borderClass: 'border-[3px] border-black rounded-none bg-white',
    accentClass: 'bg-[#FF0000] text-white hover:bg-[#CC0000] border-[2px] border-black rounded-none font-bold',
    fontFamily: 'font-sans',
  },
  {
    id: 'hpc-tech',
    name: 'HPC Performance',
    desc: 'Berdasarkan Design3.md - Futuristic high-performance computing, pitch black background, electric glows, and performance red borders.',
    bgClass: 'bg-black text-white border border-neutral-800',
    textClass: 'text-neutral-400',
    borderClass: 'border-l-[3px] border-l-[#ED1C24] border-t border-r border-b border-neutral-800 bg-[#333333]/50 rounded-none shadow-[0_0_15px_rgba(237,28,36,0.1)]',
    accentClass: 'bg-[#ED1C24] text-white hover:bg-[#CC0000] shadow-[0_0_15px_rgba(237,28,36,0.4)] rounded-sm',
    fontFamily: 'font-inter',
  },
]

// Custom premium SVG Icons instead of plain emojis
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
  const [step, setStep] = useState(1)
  const [user, setUser] = useState<any>(null)
  
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
  const [selectedTemplate, setSelectedTemplate] = useState('modern-gold')
  const [sectionOrder, setSectionOrder] = useState<string[]>([
    'hero',
    'profile',
    'features',
    'testimonials',
    'products',
    'faq',
    'cta',
    'map'
  ])
  const [activeSections, setActiveSections] = useState<string[]>([
    'hero',
    'profile',
    'features',
    'products',
    'cta',
    'map'
  ])

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
            const defaultSecs = ['hero', 'profile', 'features', 'testimonials', 'products', 'faq', 'cta', 'map']
            const mergedOrder = [...savedSections, ...defaultSecs.filter(s => !savedSections.includes(s))]
            setSectionOrder(mergedOrder)
            setActiveSections(savedSections)
          }
        } catch (e) {
          console.error('Failed to parse landingPageConfig:', e)
          setTitle(fullProfile.name)
          setBio(`Selamat datang di halaman personal ${fullProfile.name}! Kami menyediakan produk dan jasa terbaik secara lokal.`)
        }
      } else {
        setTitle(fullProfile.name)
        setBio(`Selamat datang di halaman personal ${fullProfile.name}! Kami menyediakan produk dan jasa terbaik secara lokal.`)
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
        router.push('/')
        router.refresh()
      }
    })
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-dark">
        <span className="text-xs font-geist font-bold text-primary tracking-widest uppercase animate-pulse">
          Loading Setup Engine...
        </span>
      </div>
    )
  }

  const activeTpl = TEMPLATES.find((t) => t.id === selectedTemplate) || TEMPLATES[2]

  return (
    <div className="relative min-h-screen bg-bg-dark py-12 px-6 md:px-10 flex flex-col justify-center items-center">
      {/* Mesh Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1400px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(198,169,107,0.05)_0%,transparent_75%)] pointer-events-none z-0" />

      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* WIZARD SETTINGS PANEL */}
        <div className="lg:col-span-6 flex flex-col border border-border-subtle bg-surface-dark glow-card p-6 md:p-8 rounded-lg justify-between">
          <div>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border-subtle">
              <div>
                <span className="text-[10px] font-geist font-bold text-primary tracking-widest uppercase">
                  Langkah {step} dari 4
                </span>
                <h1 className="font-sora text-xl font-bold text-text-primary">
                  Setup Landing Page <span className="text-primary">Teras.</span>
                </h1>
              </div>
              <span className="px-2.5 py-1 bg-primary/10 border border-primary/20 text-primary text-[9px] font-bold font-geist rounded uppercase tracking-wider">
                {user.role} Profile Setup
              </span>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-medium">
                {error}
              </div>
            )}

            {/* STEP 1: Profile Details */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="font-sora text-sm font-bold text-text-primary mb-2">Lengkapi Detail Profil</h2>
                <p className="text-xs text-text-secondary mb-4 leading-relaxed">
                  Informasi ini akan ditampilkan langsung pada halaman landing page Anda agar pelanggan dapat mengenali bisnis atau profil Anda.
                </p>
                <div>
                  <label className="block text-[10px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                    Nama Bisnis / Brand
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Kala Sourdough Bakery"
                    className="w-full px-4 py-2.5 bg-surface-container border border-border-subtle rounded text-xs text-text-primary placeholder:text-text-secondary/35 focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                    Unggah Logo / Foto Profil Usaha (JPG/PNG)
                  </label>
                  <div className="flex items-center gap-4 p-3 border border-border-subtle bg-surface-container/50 rounded-lg">
                    <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-primary bg-surface-container flex-shrink-0 flex items-center justify-center text-text-secondary shadow-md">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo Preview" className="w-full h-full object-cover" />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-neutral-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
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
                                  const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8)
                                  setLogoUrl(compressedDataUrl)
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
                        className="inline-block px-4 py-2 bg-surface-container hover:bg-surface-container-high border border-border-subtle hover:border-primary/50 text-text-primary rounded text-xs font-bold font-geist transition-all cursor-pointer shadow-sm active:scale-95"
                      >
                        Pilih File Foto / Logo
                      </label>
                      <p className="text-[9px] text-text-secondary mt-1.5 leading-tight">
                        Format yang didukung: PNG, JPG, JPEG. Ukuran disarankan: persegi 1:1.
                      </p>
                      {logoUrl && (
                        <button
                          type="button"
                          onClick={() => setLogoUrl('')}
                          className="text-[9px] text-red-400 font-bold block mt-1 hover:underline cursor-pointer"
                        >
                          Hapus Foto & Gunakan Default
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                    Deskripsi Singkat / Bio
                  </label>
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tuliskan cerita singkat, jam operasional, atau spesialisasi Anda..."
                    className="w-full px-4 py-2.5 bg-surface-container border border-border-subtle rounded text-xs text-text-primary placeholder:text-text-secondary/35 focus:outline-none focus:border-primary/50 resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                      No. WhatsApp / Kontak
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Contoh: 08123456789"
                      className="w-full px-4 py-2.5 bg-surface-container border border-border-subtle rounded text-xs text-text-primary focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                      Instagram Merek
                    </label>
                    <input
                      type="text"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="Contoh: @kala.sourdough"
                      className="w-full px-4 py-2.5 bg-surface-container border border-border-subtle rounded text-xs text-text-primary focus:outline-none focus:border-primary/50"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Location Access & Coordinates */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="font-sora text-sm font-bold text-text-primary mb-2">Penetapan Lokasi Geografis</h2>
                <p className="text-xs text-text-secondary mb-4 leading-relaxed">
                  Kami membutuhkan akses lokasi Anda untuk memberikan rekomendasi jarak terdekat bagi pelanggan di marketplace dan jasa secara real-time.
                </p>

                <div className="p-4 border border-border-subtle bg-surface-container rounded-lg flex items-center justify-between gap-4">
                  <div>
                    <span className="block text-[10px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-1">
                      Status Lokasi GPS
                    </span>
                    <span className="text-xs font-bold text-text-primary">
                      {locStatus === 'idle' && 'Menunggu deteksi...'}
                      {locStatus === 'detecting' && '⌛ Mendeteksi satelit GPS...'}
                      {locStatus === 'success' && '✓ Lokasi terdeteksi dengan sukses!'}
                      {locStatus === 'error' && '✗ Gagal mengakses sensor lokasi. Gunakan pencarian manual di bawah.'}
                    </span>
                  </div>
                  <button
                    onClick={detectLocation}
                    type="button"
                    className="px-4 py-2 bg-primary hover:bg-primary-container text-surface-dark rounded text-xs font-bold font-geist transition-colors flex-shrink-0 cursor-pointer"
                  >
                    Deteksi Ulang GPS
                  </button>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-[10px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                      Lokasi Terpilih (Kota & Provinsi)
                    </label>
                    <div className="w-full px-4 py-3 bg-surface-container border border-border-subtle rounded text-xs font-bold text-primary flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary shrink-0" />
                      <span>{locationName || 'Belum dipilih (gunakan GPS atau cari secara manual di bawah)'}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border-subtle">
                    <label className="block text-[10px] font-geist font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                      Cari Kota / Kecamatan Indonesia Secara Manual
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Masukkan nama kota, kecamatan, e.g. Bandung, Surabaya..."
                        className="flex-grow px-4 py-2 bg-surface-container border border-border-subtle rounded text-xs text-text-primary focus:outline-none focus:border-primary/50"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSearchLocation(searchQuery);
                          }
                        }}
                      />
                      <button
                        onClick={() => handleSearchLocation(searchQuery)}
                        type="button"
                        className="px-4 py-2 bg-surface-container border border-border-subtle hover:bg-surface-container-high text-text-primary rounded text-xs font-bold transition-all cursor-pointer"
                      >
                        {isSearching ? 'Mencari...' : 'Cari'}
                      </button>
                    </div>
                    
                    {searchResults.length > 0 && (
                      <div className="mt-2 border border-border-subtle bg-surface-dark rounded-lg max-h-[160px] overflow-y-auto divide-y divide-border-subtle">
                        {searchResults.map((loc) => (
                          <button
                            key={loc.id}
                            type="button"
                            onClick={() => handleSelectLocation(loc)}
                            className="w-full text-left px-4 py-2.5 hover:bg-surface-container text-xs text-text-primary transition-colors flex items-center justify-between"
                          >
                            <span>{loc.label}</span>
                            <span className="text-[10px] text-text-secondary font-geist uppercase font-bold">Pilih</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Template Selector */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="font-sora text-sm font-bold text-text-primary mb-2">Pilih Template Landing Page</h2>
                <p className="text-xs text-text-secondary mb-4 leading-relaxed">
                  Pilih gaya visual premium yang cocok dengan identitas brand Anda. Setiap template memiliki nuansa warna, layout, dan tipografi unik.
                </p>

                {/* Quick Industry Presets */}
                <div className="p-4 border border-border-subtle bg-primary/[0.02] rounded-xl space-y-2 mb-4">
                  <span className="block text-[10px] font-geist font-bold text-primary uppercase tracking-wider">
                    ⚡ Preset Industri (Konfigurasi Gaya Cepat)
                  </span>
                  <p className="text-[10px] text-text-secondary leading-tight">
                    Klik salah satu preset untuk mengonfigurasi template, bio, dan susunan seksi secara otomatis sesuai bidang usaha Anda.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1.5">
                    {[
                      {
                        name: 'Preset Kuliner & Kafe',
                        tpl: 'modern-gold',
                        sections: ['hero', 'profile', 'products', 'cta', 'map'],
                        bioText: 'Kami menyajikan aneka roti sourdough artisan, kopi premium nusantara, dan hidangan penutup berkualitas tinggi. Diproduksi fresh setiap hari secara higienis menggunakan bahan organik pilihan.'
                      },
                      {
                        name: 'Preset Retail & Fashion',
                        tpl: 'creative-bold',
                        sections: ['hero', 'products', 'profile', 'features', 'testimonials', 'cta'],
                        bioText: 'Boutique fashion lokal premium dengan kurasi pakaian modern, kain tenun buatan tangan, dan aksesoris eksklusif. Mengutamakan bahan premium yang breathable dan kenyamanan sepanjang hari.'
                      },
                      {
                        name: 'Preset Jasa & Agency',
                        tpl: 'clean-professional',
                        sections: ['hero', 'profile', 'features', 'testimonials', 'faq', 'cta', 'map'],
                        bioText: 'Layanan terintegrasi penyusunan identitas visual (branding) UMKM, sesi foto studio produk katalog, serta digital marketing campaign terukur.'
                      },
                      {
                        name: 'Preset Portfolio Minimalis',
                        tpl: 'minimal-noir',
                        sections: ['hero', 'profile', 'products', 'cta'],
                        bioText: 'Kanal personal untuk mempublikasikan proyek pilihan, rilisan produk kolaboratif, serta kontak korespondensi bisnis kreatif.'
                      }
                    ].map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setSelectedTemplate(preset.tpl)
                          setActiveSections(preset.sections)
                          setBio(preset.bioText)
                          const defaultSecs = ['hero', 'profile', 'features', 'testimonials', 'products', 'faq', 'cta', 'map']
                          const mergedOrder = [...preset.sections, ...defaultSecs.filter(s => !preset.sections.includes(s))]
                          setSectionOrder(mergedOrder)
                        }}
                        className="px-3 py-2 bg-surface-container hover:bg-surface-container-high border border-border-subtle hover:border-primary/45 rounded-lg text-[10px] font-bold text-text-primary transition-all text-left cursor-pointer"
                      >
                        <div className="text-primary font-bold">{preset.name}</div>
                        <div className="text-[8px] text-text-secondary mt-0.5 font-normal line-clamp-1">
                          Style: {preset.tpl} | {preset.sections.length} Seksi
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1">
                  {TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => setSelectedTemplate(tpl.id)}
                      className={`p-4 border text-left rounded-lg transition-all duration-300 ${
                        selectedTemplate === tpl.id
                          ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                          : 'border-border-subtle bg-surface-container hover:bg-surface-container-high'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-text-primary font-sora">
                          {tpl.name}
                        </span>
                        {selectedTemplate === tpl.id && (
                          <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="text-[10px] text-text-secondary leading-relaxed">
                        {tpl.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4: Component Toggle & Reordering */}
            {step === 4 && (
              <div className="space-y-4">
                <h2 className="font-sora text-sm font-bold text-text-primary mb-2">Urutan & Aktifkan Komponen</h2>
                <p className="text-xs text-text-secondary mb-4 leading-relaxed">
                  Gunakan tombol panah ⬆️ / ⬇️ untuk menyusun tata letak landing page secara kustom (Drag & Drop ordering). Aktifkan/nonaktifkan modul dengan mencentang kotak.
                </p>

                <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                  {sectionOrder.map((sec, idx) => {
                    const active = activeSections.includes(sec)
                    return (
                      <div
                        key={sec}
                        className={`p-4 border rounded-xl flex items-center justify-between transition-all duration-200 ${
                          active
                            ? 'border-primary/40 bg-primary/[0.03] shadow-[0_2px_8px_rgba(115,92,0,0.02)]'
                            : 'border-border-subtle bg-surface-container opacity-50'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          {/* Drag handle decorator */}
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-text-secondary/40 shrink-0 select-none">
                            <circle cx="9" cy="5" r="1"></circle>
                            <circle cx="9" cy="12" r="1"></circle>
                            <circle cx="9" cy="19" r="1"></circle>
                            <circle cx="15" cy="5" r="1"></circle>
                            <circle cx="15" cy="12" r="1"></circle>
                            <circle cx="15" cy="19" r="1"></circle>
                          </svg>

                          {/* Index circle */}
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${active ? 'bg-primary/20 text-primary' : 'bg-neutral-800 text-neutral-400'}`}>
                            {idx + 1}
                          </span>

                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={active}
                              onChange={() => handleToggleSection(sec)}
                              className="w-4 h-4 accent-primary cursor-pointer rounded border-border-subtle"
                            />
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-text-primary capitalize font-geist">
                                {sec === 'hero' && 'Welcome Hero Banner'}
                                {sec === 'profile' && 'Bio & Kontak Sosial'}
                                {sec === 'features' && 'Keunggulan & Fitur'}
                                {sec === 'testimonials' && 'Testimoni Premium'}
                                {sec === 'products' && 'Produk Showcase'}
                                {sec === 'faq' && 'Pertanyaan Umum (FAQ)'}
                                {sec === 'cta' && 'Call to Action (CTA)'}
                                {sec === 'map' && 'Radar Peta Geografis'}
                              </span>
                              <span className="text-[8px] text-text-secondary uppercase tracking-widest font-semibold mt-0.5">
                                {active ? 'Tampil di Halaman' : 'Disembunyikan'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => moveSection(idx, -1)}
                            disabled={idx === 0}
                            className="w-7 h-7 border border-border-subtle hover:bg-surface-container-high hover:text-primary disabled:hover:text-text-secondary rounded-lg flex items-center justify-center text-xs font-bold disabled:opacity-30 transition-all cursor-pointer shadow-sm active:scale-90"
                            title="Naikkan Posisi"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() => moveSection(idx, 1)}
                            disabled={idx === sectionOrder.length - 1}
                            className="w-7 h-7 border border-border-subtle hover:bg-surface-container-high hover:text-primary disabled:hover:text-text-secondary rounded-lg flex items-center justify-center text-xs font-bold disabled:opacity-30 transition-all cursor-pointer shadow-sm active:scale-90"
                            title="Turunkan Posisi"
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="p-4 border border-border-subtle bg-primary/5 rounded text-xs text-primary font-medium leading-relaxed">
                  ✓ Menyiapkan landing page akan menambah <strong>+50 XP</strong> untuk meningkatkan Level profil Anda.
                </div>
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-between items-center pt-6 mt-8 border-t border-border-subtle">
            <button
              onClick={() => step > 1 && setStep(step - 1)}
              disabled={step === 1}
              className="px-4 py-2 border border-border-subtle hover:bg-surface-container text-text-secondary hover:text-text-primary rounded text-xs font-bold transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              Kembali
            </button>

            {step < 4 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="px-5 py-2.5 bg-surface-container hover:bg-surface-container-high border border-border-subtle text-primary rounded text-xs font-bold transition-all cursor-pointer"
              >
                Lanjut
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isPending}
                className="px-6 py-2.5 bg-primary hover:bg-primary-container text-surface-dark rounded text-xs font-bold font-geist uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
              >
                {isPending ? 'Menyimpan...' : 'Terapkan & Selesaikan'}
              </button>
            )}
          </div>
        </div>

        {/* DYNAMIC LIVE PREVIEW DISPLAY */}
        <div className="lg:col-span-6 flex flex-col border border-border-subtle bg-surface-dark rounded-lg overflow-hidden min-h-[450px]">
          <div className="px-4 py-3 bg-surface-container border-b border-border-subtle flex items-center justify-between">
            <span className="text-[10px] font-geist font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse inline-block" /> Live Preview
            </span>
            <span className="text-[10px] font-geist font-bold text-primary uppercase">
              Template: {activeTpl.name}
            </span>
          </div>

          <div className={`p-6 flex-grow flex flex-col justify-between transition-all duration-300 ${activeTpl.bgClass} ${activeTpl.fontFamily}`}>
            
            <div className="flex-grow space-y-6">
              {sectionOrder.filter(sec => activeSections.includes(sec)).map((secName) => {
                if (secName === 'hero') {
                  return (
                    <div key="hero" className="border-b border-white/5 pb-4">
                      <div className="flex items-center gap-4">
                        <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-primary shadow-md">
                          <img
                            src={logoUrl || defaultAvatar}
                            alt="Logo Usaha"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="inline-block px-2 py-0.5 border border-primary/20 bg-primary/10 rounded text-[9px] font-bold tracking-widest text-primary uppercase">
                            Premium {user.role}
                          </div>
                          <h2 className="text-lg font-bold tracking-tight mt-0.5">
                            {title || 'Nama Bisnis Anda'}
                          </h2>
                        </div>
                      </div>
                      <div className="w-12 h-0.5 bg-primary mt-3" />
                    </div>
                  )
                }

                if (secName === 'profile') {
                  return (
                    <div key="profile" className="space-y-3">
                      <p className="text-xs leading-relaxed max-w-sm">
                        {bio || 'Bio singkat Anda...'}
                      </p>

                      <div className="space-y-2 text-[10px]">
                        {phone && (
                          <div className="flex items-center gap-2">
                            <span className="text-primary font-bold">WA:</span>
                            <span>{phone}</span>
                          </div>
                        )}
                        {instagram && (
                          <div className="flex items-center gap-2">
                            <span className="text-primary font-bold">IG:</span>
                            <span>{instagram}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                }

                if (secName === 'features') {
                  return (
                    <div key="features" className={`p-4 border ${activeTpl.borderClass} rounded bg-white/5 backdrop-blur`}>
                      <span className="block text-[8px] font-bold uppercase tracking-wider mb-3 text-primary">
                        Keunggulan & Layanan
                      </span>
                      <div className="grid grid-cols-2 gap-3 text-[9px]">
                        <div className="p-2 bg-neutral-900/25 rounded flex items-center gap-2">
                          <BoltIcon />
                          <span>Layanan Instan</span>
                        </div>
                        <div className="p-2 bg-neutral-900/25 rounded flex items-center gap-2">
                          <StarIcon />
                          <span>Rating 5 Bintang</span>
                        </div>
                        <div className="p-2 bg-neutral-900/25 rounded flex items-center gap-2">
                          <ShieldIcon />
                          <span>Transaksi Aman</span>
                        </div>
                        <div className="p-2 bg-neutral-900/25 rounded flex items-center gap-2">
                          <GemIcon />
                          <span>Kualitas Premium</span>
                        </div>
                      </div>
                    </div>
                  )
                }

                if (secName === 'testimonials') {
                  return (
                    <div key="testimonials" className={`p-4 border ${activeTpl.borderClass} rounded bg-white/5 backdrop-blur`}>
                      <span className="block text-[8px] font-bold uppercase tracking-wider mb-2 text-primary">
                        Testimoni Premium (Swipe Carousel)
                      </span>
                      
                      <div className="flex gap-3 overflow-x-auto pb-2 snap-x scrollbar-hide">
                        <div className={`min-w-[180px] snap-center p-3 bg-neutral-900/30 rounded border ${activeTpl.borderClass} text-[9px] italic flex flex-col justify-between`}>
                          <p className="leading-tight">"Produk roti sourdoughnya juara, renyah diluar dan lembut didalam!"</p>
                          <span className="block text-[8px] text-right text-text-secondary mt-2 font-bold">- Rian A.</span>
                        </div>
                        <div className={`min-w-[180px] snap-center p-3 bg-neutral-900/30 rounded border ${activeTpl.borderClass} text-[9px] italic flex flex-col justify-between`}>
                          <p className="leading-tight">"Pelayanan kopinya cepat dan aromanya wangi nusantara sekali."</p>
                          <span className="block text-[8px] text-right text-text-secondary mt-2 font-bold">- Sisca K.</span>
                        </div>
                      </div>
                    </div>
                  )
                }

                if (secName === 'products') {
                  return (
                    <div key="products" className={`p-4 border ${activeTpl.borderClass} rounded bg-white/5 backdrop-blur`}>
                      <span className="block text-[8px] font-bold uppercase tracking-wider mb-3 text-primary">
                        Etalase Unggulan (Slide Carousel)
                      </span>
                      
                      <div className="flex gap-3 overflow-x-auto pb-2 snap-x scrollbar-hide">
                        <div className={`min-w-[170px] snap-center p-3 bg-neutral-900/30 rounded border ${activeTpl.borderClass} flex flex-col justify-between h-[120px]`}>
                          <div>
                            <h4 className="text-[10px] font-bold">Artisan Sourdough</h4>
                            <p className="text-[8px] text-text-secondary mt-0.5 line-clamp-2">Roti sourdough premium.</p>
                          </div>
                          <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
                            <span className="text-[7px] px-1 bg-white/5 text-neutral-400 rounded">KAFE</span>
                            <span className="text-[9px] font-bold text-primary">Rp 65K</span>
                          </div>
                        </div>

                        <div className={`min-w-[170px] snap-center p-3 bg-neutral-900/30 rounded border ${activeTpl.borderClass} flex flex-col justify-between h-[120px]`}>
                          <div>
                            <h4 className="text-[10px] font-bold">Kopi Gayo Organik</h4>
                            <p className="text-[8px] text-text-secondary mt-0.5 line-clamp-2">Biji kopi gayo specialty.</p>
                          </div>
                          <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
                            <span className="text-[7px] px-1 bg-white/5 text-neutral-400 rounded">TOKO</span>
                            <span className="text-[9px] font-bold text-primary">Rp 150K</span>
                          </div>
                        </div>

                        <div className={`min-w-[170px] snap-center p-3 bg-neutral-900/30 rounded border ${activeTpl.borderClass} flex flex-col justify-between h-[120px]`}>
                          <div>
                            <h4 className="text-[10px] font-bold">Vertex Design Agency</h4>
                            <p className="text-[8px] text-text-secondary mt-0.5 line-clamp-2">Jasa pembuatan identitas brand.</p>
                          </div>
                          <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
                            <span className="text-[7px] px-1 bg-white/5 text-neutral-400 rounded">JASA</span>
                            <span className="text-[9px] font-bold text-primary">Rp 500K</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                }

                if (secName === 'faq') {
                  return (
                    <div key="faq" className={`p-3 border ${activeTpl.borderClass} rounded bg-white/5 backdrop-blur`}>
                      <span className="block text-[8px] font-bold uppercase tracking-wider mb-2 text-primary">
                        Tanya Jawab / FAQ
                      </span>
                      <div className="space-y-1.5 text-[9px]">
                        <div>
                          <strong className="block text-primary">Apakah bisa kirim hari ini?</strong>
                          <span className="text-text-secondary">Bisa, untuk pemesanan sebelum jam 14:00.</span>
                        </div>
                      </div>
                    </div>
                  )
                }

                if (secName === 'cta') {
                  return (
                    <div key="cta" className="p-3 bg-primary/10 border border-primary/20 rounded text-center">
                      <span className="block text-[9px] font-bold text-primary mb-1 uppercase tracking-wide">
                        🎁 PROMO AKHIR PEKAN!
                      </span>
                      <p className="text-[8px] text-text-secondary leading-tight">
                        Gunakan kode voucher <strong>TERASUMKM</strong> untuk diskon 15%!
                      </p>
                    </div>
                  )
                }

                if (secName === 'map') {
                  return (
                    <div key="map" className={`p-4 border ${activeTpl.borderClass} rounded bg-white/5 backdrop-blur`}>
                      <span className="block text-[8px] font-bold uppercase tracking-wider mb-2 text-primary">
                        Lokasi Usaha (Kota & Provinsi)
                      </span>
                      <div className="text-[10px] font-bold text-text-primary">
                        {locationName || 'Jakarta, DKI Jakarta'}
                      </div>
                      <div className="mt-2 text-[8px] text-text-secondary leading-relaxed">
                        ✓ Pelanggan dapat menghitung jarak pengiriman presisi dari lokasi ini.
                      </div>
                    </div>
                  )
                }

                return null
              })}
            </div>

            {/* ACTION BUTTON */}
            <div className="mt-8 pt-4 border-t border-white/10">
              <button
                type="button"
                className={`w-full py-2.5 rounded text-xs font-bold transition-all ${activeTpl.accentClass} cursor-pointer`}
              >
                Hubungi Kami
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
