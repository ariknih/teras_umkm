'use client'

import React, { useState, useEffect, useRef, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import CartButton from './CartButton'
import NotificationBell from './NotificationBell'
import { Menu, X, LogOut, Settings, Shield, User as UserIcon, LayoutDashboard, Wallet, Search, MapPin } from 'lucide-react'
import { AuthDialog } from '@/components/AuthDialog'
import { Logo } from '@/components/Logo'

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

  return (
    <>
      <header className="fixed top-4 left-0 right-0 z-50 w-full flex justify-center px-4 md:px-10 print:hidden pointer-events-none">
        <div className="w-full max-w-[1280px] bg-surface/95 backdrop-blur-md rounded-[9999px] shadow-sm border border-border-subtle px-4 md:px-6 py-2.5 md:py-3 flex items-center justify-between pointer-events-auto">
          {/* Left: Brand logo */}
          <Link href="/" className="flex items-center shrink-0">
            <img src="/images/logo+nama_saloka.png" alt="Saloka.id" className="h-8 md:h-9 object-contain" />
          </Link>

          {/* Middle: Links */}
          <div className="hidden lg:flex flex-1 justify-center items-center gap-6">
            <Link href="/market" className="text-sm font-medium text-text-primary hover:text-primary transition-colors">Marketplace</Link>
            <Link href="/affiliate" className="text-sm font-medium text-text-primary hover:text-primary transition-colors">Affiliate Hub</Link>
            <Link href="/community" className="text-sm font-medium text-text-primary hover:text-primary transition-colors">Community</Link>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {user && <CartButton userId={user.id} />}
            {user && <NotificationBell />}

            {user && <div className="w-[1px] h-5 bg-border/80 mx-1 hidden sm:block" />}

            {user ? (
              <div className="flex items-center gap-3">
                <Link href="/wallet" className="hidden sm:flex items-center gap-1.5 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors whitespace-nowrap shrink-0">
                  <Wallet size={12} className="text-primary shrink-0" />
                  <span className="text-xs font-bold text-primary">
                    Rp {(wallet?.balance ?? 0).toLocaleString("id-ID")}
                  </span>
                </Link>

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
                      className="absolute right-0 mt-4 w-64 bg-surface border border-border-subtle rounded-2xl shadow-xl py-3 z-[60] animate-in fade-in slide-in-from-top-3 duration-300"
                    >
                      <div className="px-4 pb-3 border-b border-border-subtle">
                        <p className="text-xs font-extrabold text-text-primary truncate">{user.name}</p>
                        <p className="text-[10px] text-text-secondary truncate mt-0.5">{user.email}</p>
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
                    <button className="hidden sm:block px-5 py-2 bg-transparent border border-outline-variant hover:border-primary text-text-primary hover:text-primary font-medium rounded-full transition-all text-sm cursor-pointer outline-none">
                      Daftar
                    </button>
                  }
                />
                <AuthDialog
                  defaultTab="login"
                  trigger={
                    <button className="px-5 py-2 bg-[#2DB24A] hover:bg-[#2DB24A]/90 text-white font-medium rounded-full transition-colors text-sm shadow-sm cursor-pointer outline-none">
                      Login
                    </button>
                  }
                />
              </div>
            )}

            <button onClick={() => setIsOpenMobile(!isOpenMobile)} className="hidden w-8 h-8 rounded-full border border-outline-variant/15 bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-text-secondary hover:text-[#2DB24A] transition-all cursor-pointer">
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
