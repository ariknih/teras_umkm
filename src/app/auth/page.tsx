'use client'

import React, { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { login, register, sendOtpWhatsApp } from '../actions/auth'
import { PasswordInput } from '@/components/ui/password-input'

export default function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') === 'register' ? 'register' : 'login'

  const [tab, setTab] = useState<'login' | 'register'>(initialTab)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'CUSTOMER' | 'MERCHANT' | 'AFFILIATE'>('CUSTOMER')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // WhatsApp OTP Verification States
  const [whatsapp, setWhatsapp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [generatedOtp, setGeneratedOtp] = useState('')
  const [countdown, setCountdown] = useState(60)
  const [isVerified, setIsVerified] = useState(false)
  const [referralCode, setReferralCode] = useState('')

  // Handle countdown timer
  React.useEffect(() => {
    let timer: NodeJS.Timeout
    if (otpSent && countdown > 0 && !isVerified) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [otpSent, countdown, isVerified])

  // Pre-fill referral code from URL
  React.useEffect(() => {
    const ref = searchParams.get('ref') || searchParams.get('aff')
    if (ref) {
      setReferralCode(ref)
    }
  }, [searchParams])

  const handleSendOtp = async () => {
    if (!whatsapp) {
      alert('Silakan masukkan nomor WhatsApp terlebih dahulu.')
      return
    }
    const code = Math.floor(1000 + Math.random() * 9000).toString()
    setGeneratedOtp(code)
    setOtpSent(true)
    setCountdown(60)
    setOtpCode('')
    setError(null)

    await sendOtpWhatsApp(whatsapp, code)
  }

  const handleVerifyOtp = (val: string) => {
    setOtpCode(val)
    if (val === generatedOtp) {
      setIsVerified(true)
      setError(null)
    }
  }

  React.useEffect(() => {
    const err = searchParams.get('error')
    if (err) {
      setError(decodeURIComponent(err))
    }
  }, [searchParams])

  const handleGoogleLogin = () => {
    setError(null)
    const clientId = '802477107090-ic2c0no4o5rtib7b9moph4a3ri0ch19h.apps.googleusercontent.com'
    const redirectUri = encodeURIComponent(`${window.location.origin}/api/auth/google/callback`)
    const state = encodeURIComponent(`role=${role}`)
    const scope = encodeURIComponent('openid profile email')
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}`
    window.location.href = authUrl
  }



  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (tab === 'register') {
      if (!name || !email || !password || !whatsapp) {
        setError('Semua kolom wajib diisi.')
        return
      }

      if (!otpSent) {
        handleSendOtp()
        return
      }

      if (otpCode !== generatedOtp) {
        setError('Kode OTP WhatsApp salah.')
        return
      }
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.append('email', email)
      formData.append('password', password)
      
      if (tab === 'register') {
        formData.append('name', name)
        formData.append('role', role)
        if (referralCode) {
          formData.append('referralCode', referralCode)
        }
        const result = await register(formData)
        if (result.error) {
          setError(result.error)
        } else {
          router.push('/')
          router.refresh()
        }
      } else {
        const result = await login(formData)
        if (result.error) {
          setError(result.error)
        } else {
          if (result.user?.role === 'ADMIN') {
            router.push('/admin')
          } else if (result.user?.role === 'CUSTOMER_SERVICE') {
            router.push('/cs')
          } else {
            router.push('/')
          }
          router.refresh()
        }
      }
    })
  }

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center py-16 px-4 md:px-10 overflow-hidden bg-bg-dark">
      {/* Background Mesh Glow / Ornaments */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-primary-container/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-80 h-80 bg-tertiary-container/10 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="w-full max-w-[480px] z-10 flex flex-col items-center">
        {/* Branding Header */}
        <div className="text-center mb-8">
          <h1 className="font-sora text-3xl font-extrabold text-primary tracking-tight mb-2">
            UMKM Digital
          </h1>
          <p className="text-sm text-on-surface-variant font-medium">
            Pintu gerbang kesuksesan bisnis lokal Anda.
          </p>
        </div>

        {/* Auth Container */}
        <div className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-8 md:p-10 auth-card-shadow glass-accent">
          {/* Toggle Switch */}
          <div className="flex p-1 bg-surface-container-low rounded-lg mb-8 relative">
            <div 
              className="absolute h-[calc(100%-8px)] w-[calc(50%-4px)] bg-surface-container-lowest rounded-md shadow-sm transition-all duration-300 ease-in-out" 
              style={{ left: tab === 'login' ? '4px' : 'calc(50% + 2px)' }}
              id="active-indicator"
            />
            <button 
              id="tab-login"
              type="button"
              onClick={() => { setTab('login'); setError(null); }}
              className={`relative z-10 flex-1 py-2 text-center text-sm font-semibold tracking-wide transition-colors duration-300 ${
                tab === 'login' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Masuk
            </button>
            <button 
              id="tab-register"
              type="button"
              onClick={() => { setTab('register'); setError(null); }}
              className={`relative z-10 flex-1 py-2 text-center text-sm font-semibold tracking-wide transition-colors duration-300 ${
                tab === 'register' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Daftar
            </button>
          </div>

          {/* Auth Title */}
          <div className="mb-8">
            <h2 className="font-sora text-2xl font-bold text-on-surface mb-1">
              {tab === 'login' ? 'Selamat Datang Kembali' : 'Buat Akun Baru'}
            </h2>
            <p className="text-sm text-on-surface-variant">
              {tab === 'login' 
                ? 'Silakan masukkan detail akun Anda untuk melanjutkan.' 
                : 'Mulailah perjalanan digital UMKM Anda hari ini.'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded bg-red-50 border border-red-200 text-xs text-red-700 font-medium animate-fade-in">
              {error}
            </div>
          )}

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {tab === 'register' && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label htmlFor="auth-name" className="block text-xs font-semibold text-on-surface-variant mb-2">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-outline">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                  </div>
                  <input
                    id="auth-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Budi Santoso"
                    className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary-container focus:border-primary transition-all outline-none text-on-surface text-sm placeholder:text-on-surface-variant/40"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className="block text-xs font-semibold text-on-surface-variant mb-2">
                Email Bisnis
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-outline">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                </div>
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@tokoanda.id"
                  className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary-container focus:border-primary transition-all outline-none text-on-surface text-sm placeholder:text-on-surface-variant/40"
                />
              </div>
            </div>

            <div className="relative">
              <PasswordInput
                id="auth-password"
                value={password}
                onChange={setPassword}
                label={tab === 'login' ? 'Kata Sandi' : 'Kata Sandi Baru'}
                showStrength={tab === 'register'}
                required
              />
              {tab === 'login' && (
                <div className="absolute right-0 top-0">
                  <a href="#" className="text-xs text-primary hover:underline font-medium">
                    Lupa sandi?
                  </a>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="auth-role" className="block text-xs font-semibold text-on-surface-variant mb-2">
                {tab === 'register' ? 'Tipe Keanggotaan' : 'Pilihan Role (Khusus Pendaftaran Baru / Google)'}
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-outline">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm-1.2 6.477a3 3 0 0 0-5.1 0 1.875 1.875 0 0 0 2.55 2.25h.1a1.875 1.875 0 0 0 2.45-2.25Z" />
                  </svg>
                </div>
                <select
                  id="auth-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full pl-12 pr-10 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary-container focus:border-primary transition-all outline-none text-on-surface text-sm appearance-none cursor-pointer"
                >
                  <option value="CUSTOMER">Customer (Pembeli & Pelajar)</option>
                  <option value="MERCHANT">Merchant (Penjual & Mitra UMKM)</option>
                  <option value="AFFILIATE">Affiliate (Pemasar Digital)</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>
            </div>

            {tab === 'register' && (
              <>
                {/* WhatsApp Verification Block */}
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label htmlFor="auth-whatsapp" className="block text-xs font-semibold text-on-surface-variant mb-2">
                    Nomor WhatsApp
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-outline">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.557-5.127-3.86-6.683-6.683l1.293-.97c.362-.272.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                      </svg>
                    </div>
                    <input
                      id="auth-whatsapp"
                      type="tel"
                      required
                      disabled={otpSent}
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="081234567890"
                      className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary-container focus:border-primary transition-all outline-none text-on-surface text-sm placeholder:text-on-surface-variant/40 disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {otpSent && !isVerified && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex justify-between items-center">
                      <label htmlFor="auth-otp" className="block text-xs font-semibold text-on-surface-variant">
                        Kode Verifikasi WA
                      </label>
                      <button
                        type="button"
                        onClick={() => { setOtpSent(false); setOtpCode(''); }}
                        className="text-[10px] text-primary hover:underline font-bold"
                      >
                        Ubah Nomor
                      </button>
                    </div>
                    <input
                      id="auth-otp"
                      type="text"
                      maxLength={4}
                      value={otpCode}
                      onChange={(e) => handleVerifyOtp(e.target.value)}
                      placeholder="Masukkan 4 digit kode"
                      className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary-container focus:border-primary transition-all outline-none text-on-surface text-sm text-center tracking-widest font-mono placeholder:tracking-normal placeholder:text-xs"
                    />
                    <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-[11px] text-primary font-medium flex justify-between items-center">
                      <span>Simulasi WA OTP: <span className="font-bold font-mono">{generatedOtp}</span></span>
                      {countdown > 0 ? (
                        <span className="text-[10px] text-text-secondary">{countdown}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          className="text-[10px] text-primary font-bold hover:underline"
                        >
                          Kirim Ulang
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {isVerified && (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-xs text-green-600 font-bold flex items-center gap-2 animate-in fade-in duration-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    WhatsApp terverifikasi!
                  </div>
                )}

                {/* Referral Code Block */}
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label htmlFor="auth-referral" className="block text-xs font-semibold text-on-surface-variant mb-2">
                    Kode Referral / Link Affiliate (Opsional)
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-outline">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-12h9c.621 0 1.125.504 1.125 1.125V17c0 .621-.504 1.125-1.125 1.125h-9A1.125 1.125 0 0 1 3.5 17V7.125C3.5 6.504 4.004 6 4.625 6Z" />
                      </svg>
                    </div>
                    <input
                      id="auth-referral"
                      type="text"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                      placeholder="Masukkan kode referral / email pengundang"
                      className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary-container focus:border-primary transition-all outline-none text-on-surface text-sm placeholder:text-on-surface-variant/40"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              id="auth-submit"
              type="submit"
              disabled={isPending}
              className="w-full py-3 bg-primary text-white font-bold text-sm rounded-lg hover:opacity-90 active:scale-[0.98] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-on-primary-container/20 border-t-on-primary-container rounded-full animate-spin"></span>
                  Memproses...
                </>
              ) : (
                tab === 'login' 
                  ? 'Masuk Sekarang' 
                  : (otpSent && !isVerified ? 'Verifikasi & Daftar Sekarang' : 'Daftar Sekarang')
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-outline-variant/60"></div>
            <span className="px-4 text-xs text-outline uppercase tracking-wider font-semibold">Atau</span>
            <div className="flex-grow border-t border-outline-variant/60"></div>
          </div>

          {/* Social Auth */}
          <button 
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3 border border-outline-variant rounded-lg hover:bg-surface-container-low transition-colors group"
          >
            <img 
              alt="Google" 
              className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBDhgk8NQmx9teiIkIspzlrtOLpf2ToJxlCpoLbMAa45Iiicm45_R5_6-baHXNZyiGuY6wuMsaS6XQOk-zml0Arr1u4fiZKp_fWiO18d_v1qB9FVOH6XUn8-hu4y8GNp7UROHGJVve5vbMHVkiqRPhTQlx1TVabzZosxPRM4h1bUGvnUPlElVwd8Om_F-Jp7orpNLvHWbeBkNB9nF3R2EHsOn5TrmhXUB-ypirvAenFrH7DlgN6SMi5ZmEToIxA5W97NK0IMxv7s1i3"
            />
            <span className="text-sm font-semibold text-on-surface">Lanjutkan dengan Google</span>
          </button>

          {/* Terms */}
          <p className="mt-8 text-center text-xs text-on-surface-variant leading-relaxed">
            Dengan melanjutkan, Anda menyetujui <a className="text-primary hover:underline font-medium animate-transition" href="#">Syarat &amp; Ketentuan</a> serta <a className="text-primary hover:underline font-medium animate-transition" href="#">Kebijakan Privasi</a> kami.
          </p>


        </div>
      </div>
    </div>
  )
}
