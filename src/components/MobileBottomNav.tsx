'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface MobileBottomNavProps {
  isLoggedIn: boolean
}

export default function MobileBottomNav({ isLoggedIn }: MobileBottomNavProps) {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => {
      if (window.scrollY > 60) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    {
      href: '/',
      label: 'Home',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      )
    },
    {
      href: '/market',
      label: 'Market',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      )
    },
    {
      href: '/community',
      label: 'Komunitas',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    },

    {
      href: '/cart',
      label: 'Keranjang',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
      )
    },
    {
      href: isLoggedIn ? '/wallet' : '/auth',
      label: 'Profil',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )
    }
  ];

  return (
    <nav
      className={`md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-full border border-zinc-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.08)] bg-white/95 backdrop-blur-xl transition-all duration-300 ease-in-out print:hidden ${
        scrolled
          ? 'w-[75%] max-w-[340px] h-13 px-3'
          : 'w-[95%] max-w-[460px] h-16 px-5'
      }`}
    >
      <div className="flex justify-around items-center h-full w-full">
        {navItems.map((item) => {
          const isActive = mounted && pathname ? (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))) : false
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center transition-all duration-200 ease-in-out flex-1 active:scale-95 ${
                isActive ? 'text-primary' : 'text-zinc-500 hover:text-primary'
              }`}
            >
              <div className={`transition-all duration-300 ${scrolled ? 'scale-105 translate-y-1.5' : 'scale-100'}`}>
                {item.icon}
              </div>
              <span
                className={`text-[9.5px] font-semibold block transition-all duration-300 origin-center truncate ${
                  scrolled
                    ? 'opacity-0 max-h-0 mt-0 scale-75 pointer-events-none'
                    : 'opacity-100 max-h-4 mt-1 scale-100'
                }`}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
