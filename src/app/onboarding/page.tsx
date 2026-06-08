'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { 
  getCurrentUserProfile, 
  sendOtpWhatsApp, 
  checkSubdomainAvailability, 
  saveOnboardingData 
} from '../actions/auth'
import { 
  MapPin, 
  ArrowLeft, 
  CheckCircle, 
  Globe, 
  Smartphone, 
  Store, 
  X,
  Loader2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const INDONESIA_REGIONS = [
  'Jakarta Pusat, DKI Jakarta',
  'Jakarta Selatan, DKI Jakarta',
  'Jakarta Barat, DKI Jakarta',
  'Jakarta Utara, DKI Jakarta',
  'Jakarta Timur, DKI Jakarta',
  'Tangerang, Banten',
  'Tangerang Selatan, Banten',
  'Bekasi, Jawa Barat',
  'Depok, Jawa Barat',
  'Bogor, Jawa Barat',
  'Bandung, Jawa Barat',
  'Surabaya, Jawa Timur',
  'Yogyakarta, DIY',
  'Semarang, Jawa Tengah',
  'Medan, Sumatera Utara',
  'Palembang, Sumatera Selatan',
  'Makassar, Sulawesi Selatan',
  'Denpasar, Bali'
]

export default function OnboardingPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [isPending, startTransition] = useTransition()

  // Onboarding Wizard Steps: 1 = WA Verify, 2 = Address Info, 3 = Subdomain, 4 = Welcome Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  
  // Error / Status states
  const [error, setError] = useState<string | null>(null)

  // Step 1: WA Verify States
  const [whatsapp, setWhatsapp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpInputs, setOtpInputs] = useState<string[]>(Array(6).fill(''))
  const [generatedOtp, setGeneratedOtp] = useState('')
  const [countdown, setCountdown] = useState(60)

  // Step 2: Address States
  const [storeName, setStoreName] = useState('')
  const [picName, setPicName] = useState('')
  const [phone, setPhone] = useState('')
  const [region, setRegion] = useState('')
  const [detailAddress, setDetailAddress] = useState('')
  const [showDestinationDetail, setShowDestinationDetail] = useState(false)
  const [regionDropdownOpen, setRegionDropdownOpen] = useState(false)
  const [regionSearch, setRegionSearch] = useState('')

  // GPS States
  const [latitude, setLatitude] = useState<number | undefined>(undefined)
  const [longitude, setLongitude] = useState<number | undefined>(undefined)
  const [gpsLoading, setGpsLoading] = useState(false)

  // Step 3: Subdomain States
  const [subdomain, setSubdomain] = useState('')
  const [checkingSubdomain, setCheckingSubdomain] = useState(false)
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  // Load User details
  useEffect(() => {
    async function loadUser() {
      try {
        const profile = await getCurrentUserProfile()
        if (!profile) {
          router.push('/auth')
          return
        }
        setUser(profile)
        // If already completed onboarding, redirect to dashboard
        if (profile.landingPageSetup) {
          if (typeof window !== 'undefined' && profile.id) {
            localStorage.setItem(`onboarding_completed_${profile.id}`, 'true')
          }
          router.push(profile.role === 'MERCHANT' ? '/merchant/dashboard' : '/')
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingUser(false)
      }
    }
    loadUser()
  }, [router])

  // WA Countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (otpSent && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [otpSent, countdown])

  // Subdomain validation
  useEffect(() => {
    const cleanSub = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '')
    if (cleanSub !== subdomain) {
      setSubdomain(cleanSub)
    }

    if (!cleanSub) {
      setSubdomainAvailable(null)
      return
    }

    setCheckingSubdomain(true)
    const timer = setTimeout(async () => {
      try {
        const res = await checkSubdomainAvailability(cleanSub)
        setSubdomainAvailable(res.available)
      } catch (_) {
        setSubdomainAvailable(false)
      } finally {
        setCheckingSubdomain(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [subdomain])

  // Step 1: Send OTP handler
  const handleSendOtp = async () => {
    setError(null)
    if (!whatsapp) {
      setError('Nomor WhatsApp wajib diisi.')
      return
    }

    // Generate realistic 6 digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    setGeneratedOtp(code)
    setOtpSent(true)
    setCountdown(60)
    setOtpInputs(Array(6).fill(''))

    startTransition(async () => {
      await sendOtpWhatsApp(whatsapp, code)
    })
  }

  // Handle individual OTP Box change
  const handleOtpInputChange = (index: number, value: string) => {
    if (/[^0-9]/.test(value)) return // only numbers

    const newInputs = [...otpInputs]
    newInputs[index] = value.slice(-1)
    setOtpInputs(newInputs)

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-box-${index + 1}`)
      nextInput?.focus()
    }
  }

  // Handle OTP Keydown (backspace)
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpInputs[index] && index > 0) {
      const prevInput = document.getElementById(`otp-box-${index - 1}`)
      prevInput?.focus()
    }
  }

  // Step 1: Verify OTP submit
  const handleVerifyOtpSubmit = () => {
    setError(null)
    const enteredOtp = otpInputs.join('')
    if (enteredOtp.length < 6) {
      setError('Masukkan kode verifikasi 6 digit lengkap.')
      return
    }

    if (enteredOtp !== generatedOtp) {
      setError('Kode verifikasi WhatsApp tidak cocok. Silakan coba lagi.')
      return
    }

    // OTP verified, advance to next step
    setPhone(whatsapp) // Pre-fill phone field in next step
    setStep(2)
  }

  // Step 2: Address Info Submit
  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!storeName || !picName || !phone || !region || !detailAddress) {
      setError('Mohon lengkapi seluruh detail alamat penjemputan toko Anda.')
      return
    }
    setStep(3)
  }

  // Geolocation Handler
  const handleRequestGps = () => {
    if (navigator.geolocation) {
      setGpsLoading(true)
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude
          setLatitude(lat)
          setLongitude(lng)
          setGpsLoading(false)
          
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
            if (res.ok) {
              const data = await res.json()
              if (data && data.display_name) {
                setDetailAddress(data.display_name)
                const addr = data.address
                const cityOrState = addr.city || addr.town || addr.suburb || addr.state || addr.county || ''
                if (cityOrState) {
                  const matched = INDONESIA_REGIONS.find(r => r.toLowerCase().includes(cityOrState.toLowerCase()))
                  if (matched) {
                    setRegion(matched)
                  } else {
                    setRegion(cityOrState)
                  }
                }
              } else {
                setDetailAddress(`Lokasi GPS (${lat.toFixed(6)}, ${lng.toFixed(6)})`)
              }
            } else {
              setDetailAddress(`Lokasi GPS (${lat.toFixed(6)}, ${lng.toFixed(6)})`)
            }
          } catch (e) {
            console.error('Reverse geocoding error:', e)
            setDetailAddress(`Lokasi GPS (${lat.toFixed(6)}, ${lng.toFixed(6)})`)
          }
        },
        (err) => {
          console.error(err)
          setError('Gagal mengakses GPS browser.')
          setGpsLoading(false)
        }
      )
    } else {
      setError('Browser Anda tidak mendukung Geolocation.')
    }
  }

  // Step 3: Subdomain Final Save
  const handleConfirmSubdomain = () => {
    setShowConfirmModal(false)
    setError(null)

    if (subdomainAvailable !== true) {
      setError('Subdomain tidak tersedia atau sedang divalidasi.')
      return
    }

    startTransition(async () => {
      const res = await saveOnboardingData({
        whatsapp,
        storeName,
        picName,
        phone,
        locationName: region,
        detailAddress,
        subdomain,
        latitude,
        longitude
      })

      if (res.error) {
        setError(res.error)
      } else {
        if (typeof window !== 'undefined' && user?.id) {
          localStorage.setItem(`onboarding_completed_${user.id}`, 'true')
        }
        setStep(4)
      }
    })
  }

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-dark">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          <span className="text-xs font-bold text-text-secondary">Menyiapkan Onboarding...</span>
        </div>
      </div>
    )
  }

  const filteredRegions = INDONESIA_REGIONS.filter(r => 
    r.toLowerCase().includes(regionSearch.toLowerCase())
  )

  return (
    <div className="relative min-h-[calc(100vh-72px)] bg-bg-dark py-12 px-4 md:px-10 flex items-center justify-center overflow-hidden">
      {/* Background Animated Gradient Orbs */}
      <motion.div
        animate={{
          x: [0, 50, -30, 0],
          y: [0, -60, 40, 0],
          scale: [1, 1.15, 0.9, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[5%] left-[5%] w-[450px] h-[450px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none z-0"
      />
      <motion.div
        animate={{
          x: [0, -40, 60, 0],
          y: [0, 50, -50, 0],
          scale: [1, 0.95, 1.1, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-[5%] right-[5%] w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none z-0"
      />

      {/* Glassmorphism Main Card */}
      <div className="w-full max-w-[920px] bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border border-slate-100 dark:border-zinc-900 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.08)] z-10 overflow-hidden flex flex-col md:flex-row min-h-[580px] transition-all">
        
        {/* Left Sidebar: Steps Progress Indicator */}
        <div className="w-full md:w-[300px] bg-gradient-to-b from-emerald-950 to-green-900 p-8 text-white flex flex-col justify-between shrink-0 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_60%)] pointer-events-none" />
          
          <div>
            <div className="flex items-center gap-2 mb-10">
              <span className="font-poppins text-xl font-bold tracking-tight text-white">
                Saloka<span className="text-[#FFC107]">.id</span>
              </span>
              <span className="text-[9px] font-extrabold bg-white/20 px-2 py-0.5 rounded uppercase tracking-widest">Onboarding</span>
            </div>

            <h2 className="font-poppins text-[10px] font-extrabold uppercase tracking-widest text-[#FFC107] mb-8">
              Setup Toko Anda
            </h2>

            <div className="space-y-6">
              {[
                { s: 1, label: 'Verifikasi WhatsApp', desc: 'Amankan Akun' },
                { s: 2, label: 'Alamat Toko', desc: 'Lokasi Penjemputan Paket' },
                { s: 3, label: 'Subdomain Toko', desc: 'Atur Link Website' },
                { s: 4, label: 'Selamat Datang', desc: 'Selesai & Mulai Jualan' }
              ].map(item => (
                <div key={item.s} className="flex gap-4 items-center">
                  <div className="relative">
                    <motion.div
                      animate={{
                        scale: step === item.s ? 1.05 : 1,
                        backgroundColor: step === item.s ? '#FFC107' : step > item.s ? '#10B981' : 'rgba(255,255,255,0.08)',
                        color: step === item.s ? '#064e3b' : '#ffffff',
                      }}
                      transition={{ duration: 0.3 }}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-inner"
                    >
                      {step > item.s ? '✓' : item.s}
                    </motion.div>
                  </div>
                  <div>
                    <h3 className={`text-xs font-bold transition-colors duration-300 ${step === item.s ? 'text-white' : 'text-white/60'}`}>{item.label}</h3>
                    <p className="text-[9px] text-white/40 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 text-[10px] text-white/40 font-medium">
            Layanan bantuan merchant:<br/>
            <span className="text-[#FFC107] font-bold">cs@saloka.id</span>
          </div>
        </div>

        {/* Right Content Panel */}
        <div className="flex-grow p-8 md:p-12 flex flex-col justify-between relative bg-white/50 dark:bg-transparent min-h-[480px]">
          
          {/* Back button (Only for steps 2 & 3) */}
          <AnimatePresence>
            {step > 1 && step < 4 && (
              <motion.button 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onClick={() => { setError(null); setStep((step - 1) as any); }}
                className="absolute left-8 top-8 flex items-center gap-1.5 text-xs text-text-secondary hover:text-emerald-600 transition-colors cursor-pointer bg-transparent border-0 font-bold outline-none"
              >
                <ArrowLeft size={14} />
                Kembali
              </motion.button>
            )}
          </AnimatePresence>

          <div className="h-full flex flex-col justify-center py-4">
            
            {/* Error Banner */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 text-xs text-red-600 dark:text-red-400 font-semibold border-l-4 border-red-500 shadow-sm"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {/* STEP 1: WHATSAPP OTP VERIFICATION */}
              {step === 1 && (
                <motion.div 
                  key="step-1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-6 max-w-md mx-auto w-full text-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto text-emerald-600 mb-2 shadow-inner">
                    <Smartphone size={26} />
                  </div>
                  
                  <div>
                    <h2 className="font-poppins text-2xl font-extrabold text-slate-800 dark:text-white">Kode Verifikasi</h2>
                    <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
                      Silakan masukkan nomor WhatsApp aktif Anda untuk menerima kode OTP keamanan akun.
                    </p>
                  </div>

                  {!otpSent ? (
                    <div className="space-y-4 text-left mt-6">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-2">
                          Nomor WhatsApp Aktif
                        </label>
                        <input 
                          type="tel"
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="Contoh: 081234567890"
                          className="w-full px-4 py-3 bg-slate-50/50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-text-primary"
                        />
                      </div>
                      
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={handleSendOtp}
                        disabled={isPending}
                        className="w-full py-3 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isPending ? 'Mengirim...' : 'Kirim Kode Verifikasi via WA'}
                      </motion.button>
                    </div>
                  ) : (
                    <div className="space-y-6 mt-6">
                      <p className="text-xs text-text-secondary">
                        Kode verifikasi 6 digit telah berhasil dikirim melalui WhatsApp ke <strong className="text-slate-800 dark:text-white">{whatsapp}</strong>
                      </p>

                      {/* 6 Digit Input Boxes */}
                      <div className="flex justify-center gap-2.5">
                        {otpInputs.map((digit, idx) => (
                          <input
                            key={idx}
                            id={`otp-box-${idx}`}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpInputChange(idx, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                            className="w-11 h-11 border border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 rounded-xl text-center font-poppins font-extrabold text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-text-primary"
                          />
                        ))}
                      </div>

                      <div className="text-xs text-text-secondary">
                        {countdown > 0 ? (
                          <span>Mohon tunggu dalam <strong className="text-slate-800 dark:text-white">{countdown} detik</strong> untuk kirim ulang</span>
                        ) : (
                          <button 
                            onClick={handleSendOtp}
                            className="text-emerald-600 hover:underline font-bold bg-transparent border-none cursor-pointer"
                          >
                            Kirim Ulang Kode OTP
                          </button>
                        )}
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={handleVerifyOtpSubmit}
                        className="w-full py-3 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                      >
                        Verifikasi
                      </motion.button>

                      <div className="text-[10px] text-text-secondary pt-4 border-t border-slate-100 dark:border-zinc-900 flex items-center justify-center gap-1.5">
                        Ada kendala? <span>Hubungi CS Saloka di WhatsApp:</span> 
                        <a href="https://wa.me/628122222900" target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-bold hover:underline">08122222900</a>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* STEP 2: ADDRESS DETAIL FORM */}
              {step === 2 && (
                <motion.div 
                  key="step-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-6 w-full mt-2"
                >
                  <div className="flex items-center gap-3 border-b border-slate-100 dark:border-zinc-900 pb-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                      <Store size={20} />
                    </div>
                    <div>
                      <h2 className="font-poppins text-lg font-extrabold text-slate-800 dark:text-white">Tambah Alamat</h2>
                      <p className="text-[10px] text-text-secondary">Alamat penjemputan paket oleh kurir logistik terintegrasi</p>
                    </div>
                  </div>

                  <form onSubmit={handleAddressSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                        Nama Toko / UMKM
                      </label>
                      <input
                        type="text"
                        required
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        placeholder="Masukkan nama toko atau nama penjual"
                        className="w-full px-4 py-2.5 bg-slate-50/50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-text-primary"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                          Nama Penanggung Jawab
                        </label>
                        <input
                          type="text"
                          required
                          value={picName}
                          onChange={(e) => setPicName(e.target.value)}
                          placeholder="Nama penanggung jawab"
                          className="w-full px-4 py-2.5 bg-slate-50/50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-text-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                          Nomor HP Penanggung Jawab
                        </label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="Nomor HP aktif"
                          className="w-full px-4 py-2.5 bg-slate-50/50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-text-primary"
                        />
                      </div>
                    </div>

                    {/* Region selection dropdown with local search */}
                    <div className="relative">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                        Provinsi / Kota / Kecamatan / Kelurahan / Kode Pos
                      </label>
                      <div 
                        onClick={() => setRegionDropdownOpen(!regionDropdownOpen)}
                        className="w-full px-4 py-3 bg-slate-50/50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-semibold cursor-pointer flex justify-between items-center select-none text-text-primary"
                      >
                        <span className={region ? 'text-slate-800 dark:text-white' : 'text-text-secondary/40'}>
                          {region || 'Pilih Provinsi, Kota, Kecamatan'}
                        </span>
                        <MapPin size={16} className="text-text-secondary" />
                      </div>

                      {regionDropdownOpen && (
                        <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-2xl p-4 z-20 space-y-2.5 animate-in fade-in zoom-in-95 duration-200">
                          <input
                            type="text"
                            placeholder="Masukkan nama kota / kecamatan..."
                            value={regionSearch}
                            onChange={(e) => setRegionSearch(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950/50 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-semibold focus:outline-none focus:border-emerald-500 text-text-primary"
                          />
                          <div className="max-h-40 overflow-y-auto space-y-1">
                            {filteredRegions.length > 0 ? (
                              filteredRegions.map(reg => (
                                <div
                                  key={reg}
                                  onClick={() => { setRegion(reg); setRegionDropdownOpen(false); }}
                                  className="px-3 py-2.5 text-xs hover:bg-emerald-500/10 hover:text-emerald-500 font-bold rounded-lg cursor-pointer transition-colors text-text-primary"
                                >
                                  {reg}
                                </div>
                              ))
                            ) : (
                              <div className="px-3 py-3 text-xs text-text-secondary/60 italic text-center">Wilayah tidak ditemukan</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                          Alamat Detail
                        </label>
                        <button
                          type="button"
                          onClick={handleRequestGps}
                          disabled={gpsLoading}
                          className="text-[10px] text-emerald-600 hover:underline font-bold flex items-center gap-1 cursor-pointer bg-transparent border-0 outline-none"
                        >
                          <MapPin size={10} />
                          {gpsLoading ? 'Mencari...' : 'Gunakan GPS'}
                        </button>
                      </div>
                      <textarea
                        required
                        rows={2}
                        value={detailAddress}
                        onChange={(e) => setDetailAddress(e.target.value)}
                        placeholder="Contoh: Jalan Merpati No.123 RT 01 RW 01"
                        className="w-full px-4 py-2.5 bg-slate-50/50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none text-text-primary"
                      />
                    </div>

                    <div className="flex items-center gap-2 select-none">
                      <input 
                        type="checkbox"
                        id="dest-chk"
                        checked={showDestinationDetail}
                        onChange={(e) => setShowDestinationDetail(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-500 cursor-pointer"
                      />
                      <label htmlFor="dest-chk" className="text-[10px] font-bold text-text-secondary cursor-pointer hover:text-slate-800 dark:hover:text-white transition-colors">
                        Tampilkan detail tujuan pengiriman
                      </label>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="submit"
                      className="w-full py-3 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                    >
                      Lanjutkan ke Subdomain
                    </motion.button>
                  </form>
                </motion.div>
              )}

              {/* STEP 3: SUBDOMAIN SELECTION */}
              {step === 3 && (
                <motion.div 
                  key="step-3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-6 w-full max-w-md mx-auto"
                >
                  <div className="text-center space-y-2">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto text-emerald-600 shadow-inner">
                      <Globe size={26} />
                    </div>
                    <h2 className="font-poppins text-2xl font-extrabold text-slate-800 dark:text-white">Create Subdomain</h2>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Pastikan subdomain yang Anda isi benar. Subdomain yang telah dibuat tidak dapat diubah kembali di kemudian hari.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-2">
                        Subdomain Toko Anda
                      </label>
                      <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
                        <input
                          type="text"
                          value={subdomain}
                          onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                          placeholder="Contoh: tokobudi"
                          className="flex-grow px-4 py-3 bg-white dark:bg-zinc-950/50 text-xs font-semibold outline-none border-none text-right placeholder:text-left text-text-primary"
                        />
                        <span className="px-5 py-3 bg-slate-100 dark:bg-zinc-900 text-xs font-extrabold text-text-secondary/70 flex items-center select-none border-l border-slate-200 dark:border-zinc-800">
                          .saloka.id
                        </span>
                      </div>

                      {/* Subdomain checking notifications */}
                      {checkingSubdomain && (
                        <span className="text-[9px] text-text-secondary mt-1.5 block animate-pulse">Menghubungkan server...</span>
                      )}
                      {!checkingSubdomain && subdomainAvailable === true && (
                        <span className="text-[9px] text-green-500 mt-1.5 block font-bold">✓ Subdomain tersedia</span>
                      )}
                      {!checkingSubdomain && subdomainAvailable === false && (
                        <span className="text-[9px] text-red-500 mt-1.5 block font-bold">✗ Subdomain sudah digunakan</span>
                      )}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => {
                        if (!subdomain) {
                          setError('Mohon tentukan nama subdomain Anda.')
                          return
                        }
                        if (subdomainAvailable !== true) {
                          setError('Subdomain tidak tersedia atau sudah digunakan.')
                          return
                        }
                        setShowConfirmModal(true)
                      }}
                      disabled={subdomainAvailable !== true || checkingSubdomain}
                      className="w-full py-3 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                    >
                      Buat Subdomain Toko
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* STEP 4: SUCCESS ONBOARDING REDIRECT */}
              {step === 4 && (
                <motion.div 
                  key="step-4"
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="space-y-6 text-center max-w-md mx-auto w-full"
                >
                  <motion.div 
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mx-auto"
                  >
                    <CheckCircle size={44} />
                  </motion.div>

                  <div>
                    <h2 className="font-poppins text-2xl font-extrabold text-slate-800 dark:text-white">Welcome to Saloka.id!</h2>
                    <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
                      Akun merchant Anda telah siap. Teras toko online Anda kini aktif di:
                    </p>
                    <div className="mt-4 px-6 py-3 bg-emerald-500/10 rounded-full inline-block text-sm font-extrabold text-emerald-600 border border-emerald-500/20 shadow-sm">
                      {subdomain}.saloka.id
                    </div>
                  </div>

                  <div className="p-5 bg-slate-50 dark:bg-zinc-900/40 rounded-xl space-y-3.5 text-left border border-slate-100 dark:border-zinc-800">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-white">Langkah selanjutnya:</h3>
                    <div className="space-y-2 text-[11px] text-text-secondary leading-relaxed">
                      <p>✓ <strong>Desain Landing Page:</strong> Kustomisasi warna, logo, spanduk, dan layout etalase Anda.</p>
                      <p>✓ <strong>Upload Produk:</strong> Tambahkan ribuan produk premium Anda ke etalase nasional.</p>
                      <p>✓ <strong>Bagikan Link:</strong> Promosikan link subdomain Anda di Instagram/WhatsApp.</p>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                      window.location.href = '/merchant/dashboard'
                    }}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-950 to-green-900 hover:from-emerald-900 hover:to-green-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    Mulai Berjualan →
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </div>

      {/* STEP 3 CONFIRMATION MODAL */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-7 w-full max-w-[390px] relative z-10 text-center border border-slate-100 dark:border-zinc-800"
            >
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="absolute right-4 top-4 text-text-secondary hover:text-text-primary bg-transparent border-0 cursor-pointer outline-none"
              >
                <X size={18} />
              </button>

              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 mx-auto mb-4">
                <Globe size={30} />
              </div>

              <h3 className="font-poppins text-base font-extrabold text-slate-800 dark:text-white mb-2 leading-snug">
                Make sure your domain is correct and appropriate
              </h3>
              
              <div className="py-2.5 px-5 bg-emerald-500/10 text-emerald-600 rounded-full text-xs font-extrabold inline-block mb-6 border border-emerald-500/20">
                {subdomain}.saloka.id
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-2.5 px-4 border border-slate-200 dark:border-zinc-800 text-text-secondary hover:bg-slate-50 dark:hover:bg-zinc-800/50 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer bg-transparent"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSubdomain}
                  disabled={isPending}
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-green-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer border-none shadow-md shadow-emerald-500/10 flex items-center justify-center gap-1.5"
                >
                  {isPending ? 'Saving...' : 'Continue'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
