'use client'

import React, { useState, useEffect, useRef, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import CartButton from './CartButton'
import NotificationBell from './NotificationBell'
import ChatHeaderButton from './ChatHeaderButton'
import { Menu, X, LogOut, Settings, Shield, User as UserIcon, LayoutDashboard, Wallet, Search, MapPin, MessageSquare, Store, Briefcase, Tag, Users } from 'lucide-react'
import { AuthDialog } from '@/components/AuthDialog'
import { Logo } from '@/components/Logo'

interface HeaderNavigationProps {
  user: any
  wallet: any
  logoutAction: () => Promise<any>
}

export default function HeaderNavigation({ user, wallet, logoutAction }: HeaderNavigationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const communityMatch = pathname?.match(/\/community\/([^/]+)/)
  const activeCommunityId = communityMatch ? communityMatch[1] : null

  const [isOpenMobile, setIsOpenMobile] = useState(false)
  const [isOpenProfile, setIsOpenProfile] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isPending, startTransition] = useTransition()
  const profileRef = useRef<HTMLDivElement>(null)

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsOpenProfile(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/market?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction()
      setIsOpenProfile(false)
      setIsOpenMobile(false)
      window.location.href = '/'
    })
  }

  return (
    <>
      <header className="fixed top-4 left-0 right-0 z-50 w-full flex justify-center px-2 sm:px-4 md:px-8 print:hidden pointer-events-none">
        <div className="w-full max-w-[1280px] bg-white/95 backdrop-blur-md rounded-full shadow-md border border-[#2DB24A]/20 px-3 sm:px-4 md:px-5 py-2 flex items-center justify-between pointer-events-auto gap-2 md:gap-4">
          
          {/* Left: Brand logo */}
          <Link href="/" className="flex items-center shrink-0">
            {/* Desktop & Tablet: Full Logo */}
            <img 
              src="/images/Variant=Full.webp" 
              alt="Saloka.id" 
              width={160} 
              height={40} 
              fetchPriority="high" 
              className="h-7 sm:h-8 md:h-9 w-auto object-contain shrink-0 hidden sm:block" 
            />
            {/* Mobile (<640px): Icon Logo */}
            <img 
              src="/images/Variant=Icon.webp" 
              alt="Saloka.id" 
              width={32} 
              height={32} 
              fetchPriority="high" 
              className="h-7 w-7 object-contain shrink-0 sm:hidden" 
            />
          </Link>

          {/* Search Bar Input (Figma Pill Search) */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-[180px] sm:max-w-[220px] md:max-w-[260px] lg:max-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#2DB24A]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari semuanya di Saloka!"
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-[#2DB24A]/40 focus:border-[#2DB24A] rounded-full text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#2DB24A]/30 transition-all font-medium"
            />
          </form>

          {/* Middle: Links with Icons (Figma style) */}
          <div className="hidden lg:flex items-center gap-4 xl:gap-5">
            <Link href="/market" className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-[#2DB24A] transition-colors whitespace-nowrap">
              <Store size={14} className="text-[#2DB24A]" />
              <span>Market</span>
            </Link>
            <Link href="/jasa" className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-[#2DB24A] transition-colors whitespace-nowrap">
              <Briefcase size={14} className="text-[#2DB24A]" />
              <span>Jasa</span>
            </Link>
            <Link href="/affiliate" className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-[#2DB24A] transition-colors whitespace-nowrap">
              <Tag size={14} className="text-[#2DB24A]" />
              <span>Affiliate</span>
            </Link>
            <Link href="/community" className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-[#2DB24A] transition-colors whitespace-nowrap">
              <Users size={14} className="text-[#2DB24A]" />
              <span>Community</span>
            </Link>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user && <CartButton userId={user.id} communityId={activeCommunityId || undefined} />}
            {user && <NotificationBell />}
            {user && <ChatHeaderButton userId={user.id} />}

            {user ? (
              <div className="flex items-center gap-2.5">
                {/* Stacked Wallet & Coin Info (Figma spec!) */}
                <Link href="/wallet" className="hidden sm:flex flex-col items-end text-[10px] font-bold leading-snug px-2.5 py-1 bg-slate-50 border border-slate-200/80 rounded-xl hover:border-[#2DB24A]/40 transition-colors shrink-0">
                  <div className="flex items-center gap-1 text-[#2DB24A]">
                    <span className="text-[11px]">💵</span>
                    <span>Rp {(wallet?.balance ?? 0).toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500">
                    <span className="text-[11px]">🪙</span>
                    <span>{(user?.coinBalance ?? 0).toLocaleString("id-ID")} Koin</span>
                  </div>
                </Link>

                <div className="relative" ref={profileRef}>
                  <button
                    id="profile-dropdown-btn"
                    aria-label="Menu Profil"
                    onClick={() => setIsOpenProfile(!isOpenProfile)}
                    className="flex relative w-8 h-8 rounded-full overflow-hidden border border-[#2DB24A]/40 hover:border-[#2DB24A] transition-colors items-center justify-center bg-gradient-to-br from-[#2DB24A] to-[#24943E] shadow-sm shrink-0 outline-none cursor-pointer"
                  >
                    {user.image ? (
                      <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-sora font-extrabold text-xs text-white">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    )}
                  </button>

                  {isOpenProfile && (
                    <div 
                      id="profile-dropdown-menu"
                      className="fixed right-3.5 left-auto top-18 sm:absolute sm:right-0 sm:top-full sm:mt-3.5 w-64 max-w-[calc(100vw-28px)] bg-white border border-slate-200/90 rounded-2xl shadow-2xl py-3 z-[100] animate-in fade-in slide-in-from-top-2 duration-200 text-slate-900"
                    >
                      <div className="px-4 pb-3 border-b border-slate-100">
                        <p className="text-xs font-extrabold text-slate-900 truncate">{user.name}</p>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">{user.email}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="btn-primary bg-primary/10 border border-primary/25 text-[8px] font-black text-primary">
                            {user.role}
                          </span>
                          <span className="text-[9px] font-bold text-text-secondary font-geist">
                            Lv. {user.level || 1}
                          </span>
                        </div>
                      </div>

                      <div className="py-1">
                        {user.role === 'MERCHANT' && (
                          <Link href="/merchant/dashboard" onClick={() => setIsOpenProfile(false)} className="flex items-center gap-3 px-4 py-2.5 text-xs text-text-primary hover:bg-surface-container-low transition-colors">
                            <LayoutDashboard size={14} className="text-primary" />
                            <span>Merchant Dashboard</span>
                          </Link>
                        )}

                        {user.role === 'ADMIN' && (
                          <Link href="/admin" onClick={() => setIsOpenProfile(false)} className="flex items-center gap-3 px-4 py-2.5 text-xs text-text-primary hover:bg-surface-container-low transition-colors">
                            <Shield size={14} className="text-red-500" />
                            <span>Admin Panel</span>
                          </Link>
                        )}

                        {user.role === 'CUSTOMER_SERVICE' && (
                          <Link href="/cs" onClick={() => setIsOpenProfile(false)} className="flex items-center gap-3 px-4 py-2.5 text-xs text-text-primary hover:bg-surface-container-low transition-colors">
                            <LayoutDashboard size={14} className="text-primary" />
                            <span>CS Dashboard</span>
                          </Link>
                        )}

                        {user.role !== 'ADMIN' && (
                          <Link href={`/profile/${user.id}`} onClick={() => setIsOpenProfile(false)} className="flex items-center gap-3 px-4 py-2.5 text-xs text-text-primary hover:bg-surface-container-low transition-colors">
                            <UserIcon size={14} className="text-text-secondary" />
                            <span>Profil Saya</span>
                          </Link>
                        )}

                        {(user.role === 'CUSTOMER' || user.role === 'AFFILIATE') && (
                          <Link href="/affiliate" onClick={() => setIsOpenProfile(false)} className="flex items-center gap-3 px-4 py-2.5 text-xs text-text-primary hover:bg-surface-container-low transition-colors">
                            <Wallet size={14} className="text-primary" />
                            <span>Dashboard Affiliate</span>
                          </Link>
                        )}

                        <Link href="/wallet/coin" onClick={() => setIsOpenProfile(false)} className="flex items-center gap-3 px-4 py-2.5 text-xs text-text-primary hover:bg-surface-container-low transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-amber-500">
                            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM9 7.5A.75.75 0 0 0 9 9h1.5v2.25H9a.75.75 0 0 0 0 1.5h1.5V15a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-3V9H15a.75.75 0 0 0 0-1.5H9Z" clipRule="evenodd" />
                          </svg>
                          <span>Dompet Koin</span>
                        </Link>

                        <Link href="/chat" onClick={() => setIsOpenProfile(false)} className="flex items-center gap-3 px-4 py-2.5 text-xs text-text-primary hover:bg-surface-container-low transition-colors">
                          <MessageSquare size={14} className="text-primary" />
                          <span>Chat Obrolan</span>
                        </Link>

                        <Link href="/settings" onClick={() => setIsOpenProfile(false)} className="flex items-center gap-3 px-4 py-2.5 text-xs text-text-primary hover:bg-surface-container-low transition-colors">
                          <Settings size={14} className="text-text-secondary" />
                          <span>Pengaturan</span>
                        </Link>
                      </div>

                      <div className="pt-2 border-t border-border-subtle">
                        <button onClick={handleLogout} disabled={isPending} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-red-500 hover:bg-red-50 transition-colors cursor-pointer bg-transparent border-none text-left">
                          <LogOut size={14} />
                          <span>{isPending ? 'Keluar...' : 'Keluar'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <AuthDialog
                  defaultTab="register"
                  trigger={
                    <button className="hidden sm:block px-5 py-1.5 bg-transparent border border-[#2DB24A] text-[#2DB24A] font-bold hover:bg-[#2DB24A]/10 rounded-full transition-all text-xs cursor-pointer outline-none">
                      Daftar
                    </button>
                  }
                />
                <AuthDialog
                  defaultTab="login"
                  trigger={
                    <button className="px-5 py-1.5 bg-[#2DB24A] hover:bg-[#24943E] text-white font-bold rounded-full transition-colors text-xs shadow-sm cursor-pointer outline-none">
                      Masuk
                    </button>
                  }
                />
              </div>
            )}

            <button aria-label="Menu Navigasi Mobile" onClick={() => setIsOpenMobile(!isOpenMobile)} className="hidden w-8 h-8 rounded-full border border-outline-variant/15 bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-text-secondary hover:text-[#2DB24A] transition-all cursor-pointer">
              {isOpenMobile ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 top-[72px] left-0 w-full h-[calc(100vh-72px)] bg-bg-dark/98 backdrop-blur-lg z-40 py-8 px-6 overflow-y-auto animate-in slide-in-from-right duration-300">
          <div className="flex flex-col gap-6 pb-10">
            <Link
              href="/market"
              onClick={() => setIsOpenMobile(false)}
              className="text-lg font-bold text-text-primary border-b border-border-subtle pb-3 hover:text-primary transition-colors"
            >
              Marketplace
            </Link>

            <Link
              href="/jasa"
              onClick={() => setIsOpenMobile(false)}
              className="text-lg font-bold text-text-primary border-b border-border-subtle pb-3 hover:text-primary transition-colors"
            >
              Jasa & Layanan
            </Link>

            <Link
              href="/affiliate"
              onClick={() => setIsOpenMobile(false)}
              className="text-lg font-bold text-text-primary border-b border-border-subtle pb-3 hover:text-primary transition-colors"
            >
              Affiliate Hub
            </Link>
            <Link
              href="/community"
              onClick={() => setIsOpenMobile(false)}
              className="text-lg font-bold text-text-primary border-b border-border-subtle pb-3 hover:text-primary transition-colors"
            >
              Community
            </Link>

            {user ? (
              <div className="flex flex-col gap-4 mt-4">
                <div className="p-4 bg-surface border border-border-subtle rounded-xl flex items-center justify-between">
                  <span className="text-xs text-text-secondary font-geist uppercase tracking-wider">Saldo Dompet</span>
                  <span className="text-sm font-black text-primary">
                    Rp {(wallet?.balance ?? 0).toLocaleString("id-ID")}
                  </span>
                </div>

                <Link
                  href="/wallet/coin"
                  onClick={() => setIsOpenMobile(false)}
                  className="p-4 bg-surface border border-border-subtle rounded-xl flex items-center justify-between hover:bg-surface-container-low transition-all cursor-pointer"
                >
                  <span className="text-xs text-text-secondary font-geist uppercase tracking-wider">Saldo Koin</span>
                  <span className="text-sm font-black text-amber-600 flex items-center gap-1">
                    🪙 {(user?.coinBalance ?? 0).toLocaleString("id-ID")} Koin
                  </span>
                </Link>

                <div className="flex flex-col gap-2">
                  {user.role === 'MERCHANT' && (
                    <Link
                      href="/merchant/dashboard"
                      onClick={() => setIsOpenMobile(false)}
                      className="btn-primary w-full text-center text-xs"
                    >
                      Merchant Dashboard
                    </Link>
                  )}
                  {user.role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      onClick={() => setIsOpenMobile(false)}
                      className="w-full py-2.5 px-4 bg-red-600 text-white text-center font-geist font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
                    >
                      Admin Panel
                    </Link>
                  )}
                  {user.role === 'CUSTOMER_SERVICE' && (
                    <Link
                      href="/cs"
                      onClick={() => setIsOpenMobile(false)}
                      className="btn-primary w-full text-center text-xs"
                    >
                      CS Dashboard
                    </Link>
                  )}
                  <Link
                    href="/orders"
                    onClick={() => setIsOpenMobile(false)}
                    className="w-full py-2.5 px-4 bg-surface border border-border-subtle text-text-primary text-center font-geist font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-surface-container-low transition-colors"
                  >
                    Lacak Pesanan
                  </Link>
                  {user.role !== 'ADMIN' && (
                    <Link
                      href={`/profile/${user.id}`}
                      onClick={() => setIsOpenMobile(false)}
                      className="w-full py-2.5 px-4 bg-surface border border-border-subtle text-text-primary text-center font-geist font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-surface-container-low transition-colors"
                    >
                      Profil Saya
                    </Link>
                  )}
                  <Link
                    href="/merchant/dashboard"
                    onClick={() => setIsOpenMobile(false)}
                    className="w-full py-2.5 px-4 bg-surface border border-border-subtle text-text-primary text-center font-geist font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-surface-container-low transition-colors"
                  >
                    Dashboard Merchant
                  </Link>
                </div>

                <button
                  onClick={handleLogout}
                  disabled={isPending}
                  className="w-full py-3.5 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 text-red-500 font-geist font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  {isPending ? 'Keluar...' : 'Keluar'}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 mt-6">
                <AuthDialog
                  defaultTab="login"
                  trigger={
                    <button
                      onClick={() => setIsOpenMobile(false)}
                      className="w-full py-3 text-center bg-[#2DB24A] text-white font-extrabold rounded-xl text-xs uppercase tracking-wider cursor-pointer outline-none shadow-sm"
                    >
                      Masuk
                    </button>
                  }
                />
                <AuthDialog
                  defaultTab="register"
                  trigger={
                    <button
                      onClick={() => setIsOpenMobile(false)}
                      className="w-full py-3 text-center border border-outline-variant text-text-primary font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer bg-transparent outline-none"
                    >
                      Daftar
                    </button>
                  }
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
