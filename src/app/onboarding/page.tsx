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
  User as UserIcon,
  X,
  Plus,
  HelpCircle
} from 'lucide-react'

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
        subdomain
      })

      if (res.error) {
        setError(res.error)
      } else {
        setStep(4)
      }
    })
  }

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-dark">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#2DB24A]/20 border-t-[#2DB24A] rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-text-secondary">Menyiapkan Onboarding...</span>
        </div>
      </div>
    )
  }

  const filteredRegions = INDONESIA_REGIONS.filter(r => 
    r.toLowerCase().includes(regionSearch.toLowerCase())
  )

  return (
    <div className="relative min-h-[calc(100vh-104px)] bg-bg-dark py-12 px-4 md:px-10 flex items-center justify-center">
      {/* Background Ornaments */}
      <div className="absolute top-[10%] left-[5%] w-96 h-96 bg-[#2DB24A]/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[10%] right-[5%] w-80 h-80 bg-[#FFC107]/5 rounded-full blur-[100px] pointer-events-none z-0" />

      <div className="w-full max-w-[850px] bg-white rounded-xl shadow-sm z-10 overflow-hidden flex flex-col md:flex-row min-h-[500px]">
        
        {/* Left Sidebar: Steps Progress Indicator */}
        <div className="w-full md:w-[280px] bg-[#0F5132] p-8 text-white flex flex-col justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-8">
              <span className="font-poppins text-lg font-bold tracking-tight text-white">
                Saloka<span className="text-[#FFC107]">.id</span>
              </span>
              <span className="text-[9px] font-bold bg-white/20 px-2 py-0.5 rounded uppercase tracking-wider">Onboarding</span>
            </div>

            <h2 className="font-sora text-sm font-extrabold uppercase tracking-wider text-[#FFC107] mb-8">
              Setup Toko Anda
            </h2>

            <div className="space-y-6">
              {[
                { s: 1, label: 'Verifikasi WhatsApp', desc: 'Amankan Akun' },
                { s: 2, label: 'Alamat Toko', desc: 'Lokasi Penjemputan Paket' },
                { s: 3, label: 'Subdomain Toko', desc: 'Atur Link Website' },
                { s: 4, label: 'Selamat Datang', desc: 'Selesai & Mulai Jualan' }
              ].map(item => (
                <div key={item.s} className="flex gap-3 items-start">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors ${
                    step === item.s 
                      ? 'bg-[#FFC107] text-[#0F5132]' 
                      : step > item.s 
                      ? 'bg-[#2DB24A] text-white' 
                      : 'bg-white/10 text-white/50'
                  }`}>
                    {step > item.s ? '✓' : item.s}
                  </div>
                  <div>
                    <h3 className={`text-xs font-bold ${step === item.s ? 'text-white' : 'text-white/60'}`}>{item.label}</h3>
                    <p className="text-[9px] text-white/40">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 text-[10px] text-white/40">
            Layanan bantuan merchant:<br/>
            <span className="text-[#FFC107] font-bold">cs@saloka.id</span>
          </div>
        </div>

        {/* Right Content Panel */}
        <div className="flex-grow p-6 md:p-10 flex flex-col justify-between relative bg-white min-h-[450px]">
          
          {/* Back button (Only for steps 2 & 3) */}
          {step > 1 && step < 4 && (
            <button 
              onClick={() => { setError(null); setStep((step - 1) as any); }}
              className="absolute left-6 top-6 flex items-center gap-1 text-[11px] text-text-secondary hover:text-[#2DB24A] transition-colors cursor-pointer bg-transparent border-0 font-bold"
            >
              <ArrowLeft size={12} />
              Kembali
            </button>
          )}

          <div className="h-full flex flex-col justify-center py-4">
            
            {/* Error Banner */}
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 text-xs text-red-600 font-semibold border-l-4 border-red-500 animate-in fade-in duration-200">
                {error}
              </div>
            )}

            {/* STEP 1: WHATSAPP OTP VERIFICATION */}
            {step === 1 && (
              <div className="space-y-6 max-w-md mx-auto w-full text-center">
                <div className="w-12 h-12 rounded-full bg-[#E8F5E9] flex items-center justify-center mx-auto text-[#2DB24A] mb-2">
                  <Smartphone size={24} />
                </div>
                
                <div>
                  <h2 className="font-sora text-xl font-extrabold text-[#0F5132]">Kode Verifikasi</h2>
                  <p className="text-xs text-text-secondary mt-1">
                    Silakan masukkan nomor WhatsApp untuk mengirimkan kode OTP pengamanan akun.
                  </p>
                </div>

                {!otpSent ? (
                  <div className="space-y-4 text-left">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-2">
                        Nomor WhatsApp Aktif
                      </label>
                      <input 
                        type="tel"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="Contoh: 081234567890"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#2DB24A] transition-colors"
                      />
                    </div>
                    
                    <button
                      onClick={handleSendOtp}
                      disabled={isPending}
                      className="w-full py-2.5 bg-[#2DB24A] hover:bg-[#2DB24A]/90 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      {isPending ? 'Mengirim...' : 'Kirim Kode Verifikasi via WA'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <p className="text-xs text-text-secondary">
                      Kode verifikasi 6 digit telah berhasil dikirim melalui WhatsApp ke <strong className="text-text-primary">{whatsapp}</strong>
                    </p>

                    {/* 6 Digit Input Boxes */}
                    <div className="flex justify-center gap-2">
                      {otpInputs.map((digit, idx) => (
                        <input
                          key={idx}
                          id={`otp-box-${idx}`}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpInputChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          className="w-10 h-10 border border-slate-200 rounded-lg text-center font-sora font-extrabold text-sm focus:outline-none focus:border-[#2DB24A] focus:ring-1 focus:ring-[#2DB24A]"
                        />
                      ))}
                    </div>

                    {/* Developer OTP simulation box */}
                    <div className="p-3 bg-[#E8F5E9] rounded-lg text-[11px] text-[#0F5132] font-semibold inline-block">
                      Simulasi WA OTP: <span className="font-mono font-bold text-xs underline">{generatedOtp}</span>
                    </div>

                    <div className="text-[11px] text-text-secondary">
                      {countdown > 0 ? (
                        <span>Mohon tunggu dalam <strong className="text-text-primary">{countdown} detik</strong> untuk kirim ulang</span>
                      ) : (
                        <button 
                          onClick={handleSendOtp}
                          className="text-[#2DB24A] hover:underline font-bold"
                        >
                          Kirim Ulang Kode OTP
                        </button>
                      )}
                    </div>

                    <button
                      onClick={handleVerifyOtpSubmit}
                      className="w-full py-2.5 bg-[#2DB24A] hover:bg-[#2DB24A]/90 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-sm"
                    >
                      Verifikasi
                    </button>

                    <div className="text-[10px] text-text-secondary pt-4 border-t border-slate-100 flex items-center justify-center gap-1">
                      Ada kendala? <span>Hubungi CS Saloka di WhatsApp:</span> 
                      <a href="https://wa.me/628122222900" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline">08122222900</a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: ADDRESS DETAIL FORM */}
            {step === 2 && (
              <div className="space-y-6 w-full">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-[#E8F5E9] flex items-center justify-center text-[#2DB24A]">
                    <Store size={18} />
                  </div>
                  <div>
                    <h2 className="font-sora text-base font-extrabold text-[#0F5132]">Tambah Alamat</h2>
                    <p className="text-[10px] text-text-secondary">Alamat penjemputan paket oleh kurir logistik terintegrasi</p>
                  </div>
                </div>

                <form onSubmit={handleAddressSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">
                      Nama Toko / UMKM
                    </label>
                    <input
                      type="text"
                      required
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="Masukkan nama toko atau nama penjual"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#2DB24A] transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">
                        Nama Penanggung Jawab
                      </label>
                      <input
                        type="text"
                        required
                        value={picName}
                        onChange={(e) => setPicName(e.target.value)}
                        placeholder="Nama penanggung jawab penjemputan"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#2DB24A] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">
                        Nomor HP Penanggung Jawab
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="Nomor HP aktif"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#2DB24A] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Region selection dropdown with local search */}
                  <div className="relative">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">
                      Provinsi / Kota / Kecamatan / Kelurahan / Kode Pos
                    </label>
                    <div 
                      onClick={() => setRegionDropdownOpen(!regionDropdownOpen)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-semibold cursor-pointer flex justify-between items-center select-none"
                    >
                      <span className={region ? 'text-text-primary' : 'text-text-secondary/40'}>
                        {region || 'Pilih Provinsi, Kota, Kecamatan'}
                      </span>
                      <MapPin size={14} className="text-text-secondary" />
                    </div>

                    {regionDropdownOpen && (
                      <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-100 rounded-lg shadow-xl p-3 z-20 space-y-2">
                        <input
                          type="text"
                          placeholder="Masukkan nama kota / kecamatan (min. 3 karakter)..."
                          value={regionSearch}
                          onChange={(e) => setRegionSearch(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-100 rounded text-xs font-semibold focus:outline-none focus:border-[#2DB24A]"
                        />
                        <div className="max-h-40 overflow-y-auto space-y-1">
                          {filteredRegions.length > 0 ? (
                            filteredRegions.map(reg => (
                              <div
                                key={reg}
                                onClick={() => { setRegion(reg); setRegionDropdownOpen(false); }}
                                className="px-3 py-2 text-xs hover:bg-[#E8F5E9] hover:text-[#0F5132] font-semibold rounded cursor-pointer transition-colors"
                              >
                                {reg}
                              </div>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-xs text-text-secondary/60 italic text-center">Wilayah tidak ditemukan</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">
                      Alamat Detail
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={detailAddress}
                      onChange={(e) => setDetailAddress(e.target.value)}
                      placeholder="Contoh: Jalan Merpati No.123 RT 01 RW 01"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#2DB24A] transition-colors resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 select-none">
                    <input 
                      type="checkbox"
                      id="dest-chk"
                      checked={showDestinationDetail}
                      onChange={(e) => setShowDestinationDetail(e.target.checked)}
                      className="w-3.5 h-3.5 accent-[#2DB24A]"
                    />
                    <label htmlFor="dest-chk" className="text-[10px] font-bold text-text-secondary cursor-pointer">
                      Tampilkan detail tujuan pengiriman
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#2DB24A] hover:bg-[#2DB24A]/90 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-sm"
                  >
                    Lanjutkan ke Subdomain
                  </button>
                </form>
              </div>
            )}

            {/* STEP 3: SUBDOMAIN SELECTION */}
            {step === 3 && (
              <div className="space-y-6 w-full max-w-md mx-auto">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-[#E8F5E9] flex items-center justify-center mx-auto text-[#2DB24A] mb-2">
                    <Globe size={24} />
                  </div>
                  <h2 className="font-sora text-lg font-extrabold text-[#0F5132]">Create Subdomain</h2>
                  <p className="text-xs text-text-secondary mt-1">
                    Make sure your subdomains are correct. Subdomains that have been created cannot be changed.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                      Subdomain Toko Anda
                    </label>
                    <div className="flex rounded-lg overflow-hidden border border-slate-200 bg-slate-50 focus-within:border-[#2DB24A] focus-within:ring-1 focus-within:ring-[#2DB24A] transition-all">
                      <input
                        type="text"
                        value={subdomain}
                        onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        placeholder="Contoh: tokobudi"
                        className="flex-grow px-3 py-2.5 bg-white text-xs font-semibold outline-none border-none text-right placeholder:text-left"
                      />
                      <span className="px-4 py-2.5 bg-slate-100 text-xs font-bold text-text-secondary/70 flex items-center select-none">
                        .saloka.id
                      </span>
                    </div>

                    {/* Subdomain checking notifications */}
                    {checkingSubdomain && (
                      <span className="text-[9px] text-text-secondary mt-1 block animate-pulse">Menghubungkan server...</span>
                    )}
                    {!checkingSubdomain && subdomainAvailable === true && (
                      <span className="text-[9px] text-green-500 mt-1 block font-bold">✓ Subdomain tersedia</span>
                    )}
                    {!checkingSubdomain && subdomainAvailable === false && (
                      <span className="text-[9px] text-red-500 mt-1 block font-bold">✗ Subdomain sudah digunakan</span>
                    )}
                  </div>

                  <button
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
                    className="w-full py-2.5 bg-[#2DB24A] hover:bg-[#2DB24A]/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-sm"
                  >
                    Create Subdomain
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: SUCCESS ONBOARDING REDIRECT */}
            {step === 4 && (
              <div className="space-y-6 text-center max-w-md mx-auto w-full">
                <div className="w-16 h-16 rounded-full bg-[#E8F5E9] flex items-center justify-center text-[#2DB24A] mx-auto animate-bounce">
                  <CheckCircle size={36} />
                </div>

                <div>
                  <h2 className="font-sora text-xl font-extrabold text-[#0F5132]">Welcome to Saloka.id!</h2>
                  <p className="text-xs text-text-secondary mt-1">
                    Akun merchant Anda telah siap. Teras toko online Anda kini aktif di:
                  </p>
                  <div className="mt-3 p-3 bg-slate-50 rounded-lg inline-block text-xs font-bold text-[#0F5132] border border-[#2DB24A]/20">
                    {subdomain}.saloka.id
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl space-y-3 text-left">
                  <h3 className="text-xs font-bold text-text-primary">Langkah selanjutnya:</h3>
                  <div className="space-y-2 text-[11px] text-text-secondary leading-relaxed">
                    <p>✓ <strong>Desain Landing Page:</strong> Kustomisasi warna, logo, spanduk, dan layout etalase Anda.</p>
                    <p>✓ <strong>Upload Produk:</strong> Tambahkan ribuan produk premium Anda ke etalase nasional.</p>
                    <p>✓ <strong>Bagikan Link:</strong> Promosikan link subdomain Anda di Instagram/WhatsApp.</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    // Redirect to landing page builder to start customising
                    router.push('/setup-landing')
                  }}
                  className="w-full py-3 bg-[#0F5132] hover:bg-[#0F5132]/95 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-md"
                >
                  Create Page
                </button>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* STEP 3 CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-[90%] max-w-[380px] relative animate-in zoom-in-95 duration-200 text-center">
            
            <button 
              onClick={() => setShowConfirmModal(false)}
              className="absolute right-4 top-4 text-text-secondary hover:text-text-primary"
            >
              <X size={16} />
            </button>

            <div className="w-16 h-16 rounded-full bg-[#E8F5E9] flex items-center justify-center text-[#0F5132] mx-auto mb-4">
              <Globe size={28} />
            </div>

            <h3 className="font-sora text-sm font-bold text-text-primary mb-2">
              Make sure your domain is correct and appropriate
            </h3>
            
            <div className="py-2.5 px-4 bg-[#E8F5E9] text-[#0F5132] rounded-full text-xs font-bold inline-block mb-6">
              {subdomain}.saloka.id
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2 px-4 border border-slate-200 text-text-secondary hover:bg-slate-50 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSubdomain}
                disabled={isPending}
                className="flex-1 py-2 px-4 bg-[#0F5132] hover:bg-[#0F5132]/95 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
              >
                {isPending ? 'Saving...' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
