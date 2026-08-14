'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ShoppingBag, Wrench, Users, Wallet, User as UserIcon } from 'lucide-react'

export default function MobileBottomNav({ isLoggedIn, user }: { isLoggedIn?: boolean; user?: any }) {
  const pathname = usePathname() || ''

  // Hide on admin routes or chat view
  if (pathname.startsWith('/admin') || pathname.startsWith('/chat') || pathname.startsWith('/merchant/builder')) {
    return null
  }

  const isUserLogged = isLoggedIn || !!user

  const navItems = [
    {
      label: 'Beranda',
      href: '/',
      icon: Home,
      isActive: pathname === '/'
    },
    {
      label: 'Market',
      href: '/market',
      icon: ShoppingBag,
      isActive: pathname.startsWith('/market')
    },
    {
      label: 'Jasa',
      href: '/jasa',
      icon: Wrench,
      isActive: pathname.startsWith('/jasa')
    },
    {
      label: 'Komunitas',
      href: '/community',
      icon: Users,
      isActive: pathname.startsWith('/community')
    },
    {
      label: isUserLogged ? 'Dompet' : 'Masuk',
      href: isUserLogged ? '/wallet' : '/auth',
      icon: isUserLogged ? Wallet : UserIcon,
      isActive: pathname.startsWith('/wallet') || pathname.startsWith('/auth')
    }
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-2 py-1.5 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] print:hidden">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-150 ${
                item.isActive
                  ? 'text-[#2DB24A] font-extrabold scale-105'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <div className="relative">
                <Icon size={20} strokeWidth={item.isActive ? 2.5 : 2} />
                {item.isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#2DB24A]" />
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
