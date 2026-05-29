'use client'

import React, { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { login, register } from '../actions/auth'

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
  const [showPassword, setShowPassword] = useState(false)

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

  const handleDemoLogin = (demoEmail: string) => {
    setError(null)
    setEmail(demoEmail)
    setPassword('password123')
    
    startTransition(async () => {
      const formData = new FormData()
      formData.append('email', demoEmail)
      formData.append('password', 'password123')
      
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
    })
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const formData = new FormData()
      formData.append('email', email)
      formData.append('password', password)
      
      if (tab === 'register') {
        formData.append('name', name)
        formData.append('role', role)
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

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="auth-password" className="block text-xs font-semibold text-on-surface-variant">
                  Kata Sandi
                </label>
                {tab === 'login' && (
                  <a href="#" className="text-xs text-primary hover:underline font-medium">
                    Lupa sandi?
                  </a>
                )}
              </div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-outline">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                </div>
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary-container focus:border-primary transition-all outline-none text-on-surface text-sm placeholder:text-on-surface-variant/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors flex items-center justify-center"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </button>
              </div>
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

            <button
              id="auth-submit"
              type="submit"
              disabled={isPending}
              className="w-full py-3 bg-primary-container text-on-primary-container font-bold text-sm rounded-lg hover:opacity-90 active:scale-[0.98] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-on-primary-container/20 border-t-on-primary-container rounded-full animate-spin"></span>
                  Memproses...
                </>
              ) : (
                tab === 'login' ? 'Masuk Sekarang' : 'Daftar Sekarang'
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

          {/* Quick Demo Accounts */}
          <div className="mt-8 pt-6 border-t border-outline-variant/60">
            <span className="block text-[10px] font-semibold text-outline uppercase tracking-widest text-center mb-4">
              Sandbox Demo Access
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                id="demo-merchant"
                type="button"
                onClick={() => handleDemoLogin('merchant@teras.com')}
                className="px-2 py-2 bg-surface-container hover:bg-surface-container-high border border-outline-variant/60 hover:border-primary/40 rounded-lg text-[10px] font-semibold text-on-surface text-center transition-all duration-300"
              >
                Merchant
              </button>
              <button
                id="demo-affiliate"
                type="button"
                onClick={() => handleDemoLogin('affiliate@teras.com')}
                className="px-2 py-2 bg-surface-container hover:bg-surface-container-high border border-outline-variant/60 hover:border-primary/40 rounded-lg text-[10px] font-semibold text-on-surface text-center transition-all duration-300"
              >
                Affiliate
              </button>
              <button
                id="demo-customer"
                type="button"
                onClick={() => handleDemoLogin('customer@teras.com')}
                className="px-2 py-2 bg-surface-container hover:bg-surface-container-high border border-outline-variant/60 hover:border-primary/40 rounded-lg text-[10px] font-semibold text-on-surface text-center transition-all duration-300"
              >
                Customer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
