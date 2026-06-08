'use client'

import React, { useState, useEffect, useRef, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import CartButton from './CartButton'
import NotificationBell from './NotificationBell'
import { Menu, X, LogOut, Settings, Shield, User as UserIcon, LayoutDashboard, Wallet, Search, MapPin } from 'lucide-react'
import { AuthDialog } from '@/components/AuthDialog'

interface HeaderNavigationProps {
  user: any
  wallet: any
  logoutAction: () => Promise<any>
}

export default function HeaderNavigation({ user, wallet, logoutAction }: HeaderNavigationProps) {
  const router = useRouter()
  const [isOpenMobile, setIsOpenMobile] = useState(false)
  const [isOpenProfile, setIsOpenProfile] = useState(false)
  const [isPending, startTransition] = useTransition()
  const profileRef = useRef<HTMLDivElement>(null)

  const [searchQuery, setSearchQuery] = useState('')

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

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction()
      setIsOpenProfile(false)
      setIsOpenMobile(false)
      router.push('/')
      router.refresh()
    })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/market?query=${encodeURIComponent(searchQuery)}`)
    } else {
      router.push('/market')
    }
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 w-full h-[72px] bg-surface border-b border-border-subtle flex items-center justify-between px-4 md:px-10 shadow-sm print:hidden">
        {/* Left: Brand logo & Kategori */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-1 group/logo shrink-0">
            <span className="font-poppins text-xl font-bold tracking-tight text-[#0F5132] transition-colors">
              Saloka<span className="text-[#FFC107]">.id</span>
            </span>
          </Link>
          
          <Link href="/market" className="hidden md:inline-block text-xs font-semibold text-text-secondary hover:text-[#2DB24A] transition-colors cursor-pointer">
            Kategori
          </Link>
        </div>

        {/* Middle: Tokopedia-style Search Bar */}
        <form onSubmit={handleSearch} className="flex-grow max-w-[600px] mx-4 md:mx-8 relative">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Cari produk, jasa, atau lowongan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-100 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-text-primary text-xs"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary transition-colors">
              <Search size={14} />
            </button>
          </div>
        </form>

        {/* Right: Cart, Notification, User Actions */}
        <div className="flex items-center gap-3">
          <CartButton />
          
          {user && <NotificationBell />}

          {user && <div className="w-[1px] h-5 bg-border/80 mx-1 hidden sm:block" />}

          {user ? (
            <div className="flex items-center gap-3">
              {/* Wallet details pill */}
              <Link href="/wallet" className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 transition-colors whitespace-nowrap shrink-0">
                <Wallet size={11} className="text-primary shrink-0" />
                <span className="text-[10px] font-extrabold text-primary">
                  Rp {(wallet?.balance ?? 0).toLocaleString("id-ID")}
                </span>
              </Link>

              {user.role === 'MERCHANT' && (
                <div className="hidden lg:block">
                  <Link href="/merchant/dashboard" className="inline-flex items-center gap-1 px-3.5 py-1 text-[10px] bg-primary hover:bg-primary/90 text-white font-geist font-bold uppercase tracking-wider rounded-full transition-all">
                    Dashboard
                  </Link>
                </div>
              )}

              {user.role === 'ADMIN' && (
                <div className="hidden lg:block">
                  <Link href="/admin" className="inline-flex items-center gap-1 px-3.5 py-1 text-[10px] bg-red-600 hover:bg-red-700 text-white font-geist font-bold uppercase tracking-wider rounded-full transition-all">
                    Admin
                  </Link>
                </div>
              )}

              {/* Profile dropdown container */}
              <div className="relative" ref={profileRef}>
                <button
                  id="profile-dropdown-btn"
                  onClick={() => setIsOpenProfile(!isOpenProfile)}
                  className="flex relative w-8 h-8 rounded-full overflow-hidden border border-primary/40 hover:border-primary transition-colors items-center justify-center bg-gradient-to-br from-primary to-primary-container shadow shadow-primary/5 shrink-0 outline-none cursor-pointer"
                >
                  <span className="font-sora font-extrabold text-xs text-white">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </button>

                {isOpenProfile && (
                  <div 
                    id="profile-dropdown-menu"
                    className="absolute right-0 mt-3 w-64 bg-surface border border-border-subtle rounded-xl shadow-2xl py-3 z-[60] animate-in fade-in slide-in-from-top-3 duration-300"
                  >
                    <div className="px-4 pb-2.5 border-b border-border-subtle">
                      <p className="text-xs font-extrabold text-text-primary truncate">{user.name}</p>
                      <p className="text-[10px] text-text-secondary truncate mt-0.5">{user.email}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="px-2 py-0.5 bg-primary/10 border border-primary/25 rounded text-[8px] font-geist font-black text-primary uppercase tracking-wider">
                          {user.role}
                        </span>
                        <span className="text-[9px] font-bold text-text-secondary font-geist">
                          Lv. {user.level || 1}
                        </span>
                      </div>
                    </div>

                    <div className="py-1">
                      {/* Merchant Dashboard */}
                      {user.role === 'MERCHANT' && (
                        <Link
                          id="menu-merchant-dashboard"
                          href="/merchant/dashboard"
                          onClick={() => setIsOpenProfile(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-xs text-text-primary hover:bg-surface-container-low transition-colors"
                        >
                          <LayoutDashboard size={14} className="text-primary" />
                          <span>Merchant Dashboard</span>
                        </Link>
                      )}

                      {user.role === 'ADMIN' && (
                        <Link
                          id="menu-admin-dashboard"
                          href="/admin"
                          onClick={() => setIsOpenProfile(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-xs text-text-primary hover:bg-surface-container-low transition-colors"
                        >
                          <Shield size={14} className="text-red-500" />
                          <span>Admin Panel</span>
                        </Link>
                      )}

                      <Link
                        href={`/profile/${user.id}`}
                        onClick={() => setIsOpenProfile(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-xs text-text-primary hover:bg-surface-container-low transition-colors"
                      >
                        <UserIcon size={14} className="text-text-secondary" />
                        <span>Profil Saya</span>
                      </Link>

                      {(user.role === 'CUSTOMER' || user.role === 'AFFILIATE') && (
                        <Link
                          href="/affiliate"
                          onClick={() => setIsOpenProfile(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-xs text-text-primary hover:bg-surface-container-low transition-colors"
                        >
                          <Wallet size={14} className="text-primary" />
                          <span>Dashboard Affiliate</span>
                        </Link>
                      )}

                      <Link
                        href="/merchant/dashboard"
                        onClick={() => setIsOpenProfile(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-xs text-text-primary hover:bg-surface-container-low transition-colors"
                      >
                        <Settings size={14} className="text-text-secondary" />
                        <span>Dashboard Merchant</span>
                      </Link>
                    </div>

                    <div className="pt-2 border-t border-border-subtle">
                      <button
                        id="logout-btn"
                        onClick={handleLogout}
                        disabled={isPending}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/5 hover:text-red-500 dark:hover:bg-red-950/20 transition-colors cursor-pointer bg-transparent border-none text-left"
                      >
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
                defaultTab="login"
                trigger={
                  <button className="px-4 py-1.5 bg-transparent border border-[#2DB24A] text-[#2DB24A] hover:bg-[#2DB24A]/5 font-bold rounded-lg transition-all text-xs cursor-pointer outline-none">
                    Masuk
                  </button>
                }
              />
              <AuthDialog
                defaultTab="register"
                trigger={
                  <button className="px-4 py-1.5 bg-[#2DB24A] hover:bg-[#2DB24A]/90 text-white font-bold rounded-lg transition-colors text-xs shadow-sm cursor-pointer outline-none">
                    Daftar
                  </button>
                }
              />
            </div>
          )}

          {/* Mobile hamburger icon */}
          <button
            id="mobile-menu-toggle"
            onClick={() => setIsOpenMobile(!isOpenMobile)}
            className="lg:hidden w-8 h-8 rounded-full border border-outline-variant/15 bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-text-secondary hover:text-[#2DB24A] transition-all cursor-pointer"
          >
            {isOpenMobile ? <X size={16} /> : <Menu size={16} />}
          </button>
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
              href="/academy"
              onClick={() => setIsOpenMobile(false)}
              className="text-lg font-bold text-text-primary border-b border-border-subtle pb-3 hover:text-primary transition-colors"
            >
              LMS Academy
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

                <div className="flex flex-col gap-2">
                  {user.role === 'MERCHANT' && (
                    <Link
                      href="/merchant/dashboard"
                      onClick={() => setIsOpenMobile(false)}
                      className="w-full py-2.5 px-4 bg-primary text-white text-center font-geist font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
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
                  <Link
                    href="/orders"
                    onClick={() => setIsOpenMobile(false)}
                    className="w-full py-2.5 px-4 bg-surface border border-border-subtle text-text-primary text-center font-geist font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-surface-container-low transition-colors"
                  >
                    Lacak Pesanan
                  </Link>
                  <Link
                    href={`/profile/${user.id}`}
                    onClick={() => setIsOpenMobile(false)}
                    className="w-full py-2.5 px-4 bg-surface border border-border-subtle text-text-primary text-center font-geist font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-surface-container-low transition-colors"
                  >
                    Profil Saya
                  </Link>
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
                      className="w-full py-3 text-center border border-outline-variant text-text-primary font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer bg-transparent outline-none"
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
                      className="w-full py-3 text-center bg-[#2DB24A] text-white font-extrabold rounded-xl text-xs uppercase tracking-wider cursor-pointer outline-none"
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
