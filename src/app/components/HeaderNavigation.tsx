'use client'

import React, { useState, useEffect, useRef, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import CartButton from './CartButton'
import NotificationBell from './NotificationBell'
import { Menu, X, LogOut, Settings, Shield, User as UserIcon, LayoutDashboard, Wallet } from 'lucide-react'
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
      <header className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] transition-all duration-500 ease-in-out group print:hidden ${
        isOpenMobile
          ? 'max-w-[1280px]'
          : `max-w-[260px] min-[400px]:max-w-[350px] sm:max-w-[370px] lg:max-w-[370px] ${
              user ? 'lg:hover:max-w-[1240px]' : 'lg:hover:max-w-[1000px]'
            }`
      }`}>
        <nav className="bg-white/90 dark:bg-surface-dark/90 backdrop-blur-xl border border-outline-variant/35 dark:border-white/10 rounded-full py-2 px-3 md:px-5 shadow-[0_8px_30px_rgba(11,28,48,0.06)] flex items-center justify-between transition-all duration-300 hover:border-primary/45 dark:hover:border-primary/40 h-[56px]">
          {/* Left: Brand logo */}
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 group/logo shrink-0">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shadow-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="font-sora text-sm font-bold tracking-tight text-secondary dark:text-primary transition-colors whitespace-nowrap hidden min-[400px]:inline">
                Saloka<span className="text-tertiary">.id</span>
              </span>
            </Link>

          {/* Desktop Nav links */}
          <div className={`hidden lg:flex gap-1 items-center w-0 opacity-0 overflow-hidden whitespace-nowrap group-hover:opacity-100 group-hover:ml-4 transition-all duration-500 ease-in-out ${
            user ? 'group-hover:w-[610px]' : 'group-hover:w-[490px]'
          }`}>
            <Link href="/market" className="px-3 py-1.5 rounded-full text-text-secondary font-semibold hover:text-primary hover:bg-surface-container-low transition-all duration-200 text-xs uppercase tracking-wider">
              Marketplace
            </Link>
            <Link href="/academy" className="px-3 py-1.5 rounded-full text-text-secondary font-semibold hover:text-primary hover:bg-surface-container-low transition-all duration-200 text-xs uppercase tracking-wider">
              LMS Academy
            </Link>
            <Link href="/affiliate" className="px-3 py-1.5 rounded-full text-text-secondary font-semibold hover:text-primary hover:bg-surface-container-low transition-all duration-200 text-xs uppercase tracking-wider">
              Affiliate Hub
            </Link>
            <Link href="/community" className="px-3 py-1.5 rounded-full text-text-secondary font-semibold hover:text-primary hover:bg-surface-container-low transition-all duration-200 text-xs uppercase tracking-wider">
              Community
            </Link>
            {user && (
              <Link href="/orders" className="px-3 py-1.5 rounded-full text-text-secondary font-semibold hover:text-primary hover:bg-surface-container-low transition-all duration-200 text-xs uppercase tracking-wider">
                Lacak Pesanan
              </Link>
            )}
          </div>
        </div>

        {/* Right: Cart, Notification, User Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3">

          <CartButton />
          
          {user && <NotificationBell />}

          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-3">
              {/* Wallet details pill */}
              <Link href="/wallet" className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-low hover:bg-surface-container border border-outline-variant/15 transition-colors whitespace-nowrap shrink-0">
                <Wallet size={11} className="text-primary shrink-0" />
                <span className="text-[10px] font-extrabold text-primary">
                  Rp&nbsp;{(wallet?.balance ?? 0).toLocaleString("id-ID")}
                </span>
              </Link>

              {user.role === 'MERCHANT' && (
                <div className="w-0 opacity-0 overflow-hidden whitespace-nowrap group-hover:w-[95px] group-hover:opacity-100 transition-all duration-500 ease-in-out hidden lg:flex items-center">
                  <Link href="/merchant/dashboard" className="inline-flex items-center gap-1 px-3.5 py-1 text-[10px] bg-primary hover:bg-primary/90 text-white font-geist font-bold uppercase tracking-wider rounded-full transition-all">
                    Dashboard
                  </Link>
                </div>
              )}

              {user.role === 'ADMIN' && (
                <div className="w-0 opacity-0 overflow-hidden whitespace-nowrap group-hover:w-[75px] group-hover:opacity-100 transition-all duration-500 ease-in-out hidden lg:flex items-center">
                  <Link href="/admin" className="inline-flex items-center gap-1 px-3.5 py-1 text-[10px] bg-red-600 hover:bg-red-700 text-white font-geist font-bold uppercase tracking-wider rounded-full transition-all">
                    Admin
                  </Link>
                </div>
              )}

              {user.role === 'CUSTOMER_SERVICE' && (
                <div className="w-0 opacity-0 overflow-hidden whitespace-nowrap group-hover:w-[90px] group-hover:opacity-100 transition-all duration-500 ease-in-out hidden lg:flex items-center">
                  <Link href="/cs" className="inline-flex items-center gap-1 px-3.5 py-1 text-[10px] bg-[#c6a96b] hover:bg-[#c6a96b]/95 text-surface-dark font-geist font-bold uppercase tracking-wider rounded-full transition-all">
                    CS Panel
                  </Link>
                </div>
              )}

              {/* Profile dropdown container */}
              <div className="relative" ref={profileRef}>
                <div className="flex items-center gap-2.5">
                  <div className="hidden xl:flex flex-col items-end text-right w-0 opacity-0 overflow-hidden whitespace-nowrap group-hover:w-[195px] group-hover:opacity-100 group-hover:mr-2 transition-all duration-500 ease-in-out">
                    <Link href={`/profile/${user.id}`} className="text-[10px] font-bold text-text-primary hover:text-primary leading-tight transition-colors">
                      {user.name.split(' ').slice(0, 2).join(' ')}
                    </Link>
                    <div className="flex items-center gap-1">
                      <span className="text-[8px] font-geist font-bold text-primary uppercase tracking-wider">
                        {user.role === 'CUSTOMER_SERVICE' ? 'CS' : user.role}
                      </span>
                      <span className="text-outline-variant text-[8px]">•</span>
                      <Link href="/setup-landing" className="text-[8px] font-geist font-bold text-[#c6a96b] hover:text-[#c6a96b]/80 uppercase tracking-wider transition-colors">
                        Setup Profil
                      </Link>
                      <span className="text-outline-variant text-[8px]">•</span>
                      <button onClick={handleLogout} className="text-[8px] font-geist font-bold text-red-500 hover:text-red-600 uppercase tracking-wider cursor-pointer bg-transparent border-none p-0 outline-none">
                        Keluar
                      </button>
                    </div>
                  </div>

                  <button
                    id="profile-dropdown-btn"
                    onClick={() => setIsOpenProfile(!isOpenProfile)}
                    className="hidden lg:flex relative w-8 h-8 rounded-full overflow-hidden border border-primary/40 hover:border-primary transition-colors flex items-center justify-center bg-gradient-to-br from-primary to-primary-container shadow shadow-primary/5 shrink-0 outline-none cursor-pointer"
                  >
                    <span className="font-sora font-extrabold text-xs text-white">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </button>
                </div>

                {isOpenProfile && (
                  <div 
                    id="profile-dropdown-menu"
                    className="absolute right-0 mt-3 w-64 bg-surface-dark border border-border-subtle rounded-xl shadow-2xl py-3 z-[60] animate-in fade-in slide-in-from-top-3 duration-300"
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

                      {/* Admin Panel */}
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

                      {/* CS Panel */}
                      {user.role === 'CUSTOMER_SERVICE' && (
                        <Link
                          id="menu-cs-dashboard"
                          href="/cs"
                          onClick={() => setIsOpenProfile(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-xs text-text-primary hover:bg-surface-container-low transition-colors"
                        >
                          <LayoutDashboard size={14} className="text-[#c6a96b]" />
                          <span>CS Panel</span>
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

                      <Link
                        href="/setup-landing"
                        onClick={() => setIsOpenProfile(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-xs text-text-primary hover:bg-surface-container-low transition-colors"
                      >
                        <Settings size={14} className="text-text-secondary" />
                        <span>Setup Storefront</span>
                      </Link>
                    </div>

                    <div className="pt-2 border-t border-border-subtle">
                      <button
                        id="logout-btn"
                        onClick={handleLogout}
                        disabled={isPending}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/5 hover:text-red-500 transition-colors cursor-pointer bg-transparent border-none text-left"
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
            <div className="hidden lg:flex items-center gap-2.5">
              <AuthDialog
                defaultTab="login"
                trigger={
                  <button className="px-4 py-1.5 bg-transparent border border-outline-variant hover:border-outline text-text-secondary hover:text-text-primary font-bold rounded-full transition-all text-[10px] uppercase tracking-wider cursor-pointer outline-none">
                    Masuk
                  </button>
                }
              />
              <AuthDialog
                defaultTab="register"
                trigger={
                  <button className="px-4 py-1.5 bg-primary hover:bg-primary/95 text-white font-extrabold rounded-full transition-colors text-[10px] uppercase tracking-wider shadow shadow-primary/10 cursor-pointer outline-none">
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
            className="lg:hidden w-8 h-8 rounded-full border border-outline-variant/15 bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-text-secondary hover:text-primary transition-all cursor-pointer"
          >
            {isOpenMobile ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </nav>
    </header>

    {/* Mobile Drawer Overlay */}
    {isOpenMobile && (
      <div className="lg:hidden fixed inset-0 top-[72px] left-0 w-full h-[calc(100vh-72px)] bg-bg-dark/98 backdrop-blur-lg z-40 py-8 px-6 animate-in slide-in-from-right duration-300">
        <div className="flex flex-col gap-6 overflow-y-auto h-full pb-10">
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
              <div className="p-4 bg-surface-dark border border-border-subtle rounded-xl flex items-center justify-between">
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
                {user.role === 'CUSTOMER_SERVICE' && (
                  <Link
                    href="/cs"
                    onClick={() => setIsOpenMobile(false)}
                    className="w-full py-2.5 px-4 bg-[#c6a96b] text-surface-dark text-center font-geist font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
                  >
                    CS Panel
                  </Link>
                )}
                <Link
                  href="/orders"
                  onClick={() => setIsOpenMobile(false)}
                  className="w-full py-2.5 px-4 bg-surface-dark border border-border-subtle text-text-primary text-center font-geist font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-surface-container-low transition-colors"
                >
                  Lacak Pesanan
                </Link>
                <Link
                  href={`/profile/${user.id}`}
                  onClick={() => setIsOpenMobile(false)}
                  className="w-full py-2.5 px-4 bg-surface-dark border border-border-subtle text-text-primary text-center font-geist font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-surface-container-low transition-colors"
                >
                  Profil Saya
                </Link>
                <Link
                  href="/setup-landing"
                  onClick={() => setIsOpenMobile(false)}
                  className="w-full py-2.5 px-4 bg-surface-dark border border-border-subtle text-text-primary text-center font-geist font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-surface-container-low transition-colors"
                >
                  Setup Storefront
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
                    className="w-full py-3 text-center bg-primary text-white font-extrabold rounded-xl text-xs uppercase tracking-wider cursor-pointer outline-none"
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
