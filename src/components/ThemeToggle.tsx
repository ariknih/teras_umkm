'use client'

import React, { useState, useEffect } from 'react'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const isDark = document.documentElement.classList.contains('dark')
    setTheme(isDark ? 'dark' : 'light')
  }, [])

  const toggleTheme = () => {
    if (theme === 'dark') {
      setTheme('light')
      localStorage.setItem('theme', 'light')
      document.documentElement.classList.remove('dark')
    } else {
      setTheme('dark')
      localStorage.setItem('theme', 'dark')
      document.documentElement.classList.add('dark')
    }
  }

  if (!mounted) return null

  return (
    <button
      onClick={toggleTheme}
      className={`fixed bottom-24 left-4 md:bottom-6 md:left-6 z-50 w-12 h-12 rounded-full backdrop-blur-xl flex items-center justify-center transition-all duration-300 cursor-pointer shadow-lg outline-none select-none hover:scale-105 active:scale-95 print:hidden group ${
        theme === 'dark'
          ? 'bg-zinc-900/80 border border-white/10 text-amber-500 hover:bg-zinc-800/90 hover:border-white/20'
          : 'bg-white/80 border border-zinc-200/50 text-zinc-700 hover:bg-zinc-50/90 hover:border-zinc-300/60'
      }`}
      aria-label="Toggle Theme"
    >
      <div className="transition-transform duration-500 ease-in-out group-hover:rotate-[360deg] flex items-center justify-center">
        {theme === 'dark' ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
          </svg>
        )}
      </div>
    </button>
  )
}
