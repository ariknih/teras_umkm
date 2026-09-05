'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useSnackbox } from '@/context/SnackboxContext'

export default function SnackboxStickyCartBar() {
  const { totalItemTypesCount, setIsCartOpen, cartBumpTick } = useSnackbox()
  const [isWiggling, setIsWiggling] = useState(false)
  const hasMounted = useRef(false)

  const isEmpty = totalItemTypesCount === 0

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true
      return
    }
    if (!isEmpty) {
      setIsWiggling(true)
      const timer = setTimeout(() => setIsWiggling(false), 500)
      return () => clearTimeout(timer)
    }
  }, [cartBumpTick, isEmpty])

  // Hide sticky bar completely when cart is empty so it does not block the screen
  if (isEmpty) return null

  return (
    <div className="fixed inset-x-0 bottom-16 sm:bottom-4 z-30 flex justify-center px-3 sm:px-4 pointer-events-none animate-in fade-in slide-in-from-bottom-3 duration-200">
      <div
        className={`pointer-events-auto w-full max-w-[560px] flex items-center justify-between gap-3 sm:gap-5 p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.12)] ${
          isWiggling ? 'animate-snackbox-wiggle' : ''
        }`}
      >
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="text-left cursor-pointer min-w-0"
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-market-green-500 animate-pulse" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
              Ada {totalItemTypesCount} menu di snackbox
            </h3>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
            Klik untuk atur jumlah box & checkout
          </p>
        </button>

        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="shrink-0 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-market-green-500 hover:bg-market-green-600 text-white shadow-xs cursor-pointer transition-all active:scale-95"
        >
          Lanjut Checkout
        </button>
      </div>
    </div>
  )
}
