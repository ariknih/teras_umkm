'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useSnackbox } from '@/context/SnackboxContext'

export default function SnackboxStickyCartBar() {
  const { cart, totalItemTypesCount, setIsCartOpen, cartBumpTick } = useSnackbox()
  const [isWiggling, setIsWiggling] = useState(false)
  const hasMounted = useRef(false)

  const isEmpty = totalItemTypesCount === 0

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true
      return
    }
    setIsWiggling(true)
    const timer = setTimeout(() => setIsWiggling(false), 500)
    return () => clearTimeout(timer)
  }, [cartBumpTick])

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-5 pointer-events-none">
      <div
        className={`pointer-events-auto w-full max-w-[600px] flex items-center justify-between gap-6 p-5 rounded-3xl bg-white shadow-[0_2px_4px_-2px_rgba(0,0,0,0.10),0_4px_6px_-1px_rgba(0,0,0,0.10)] ${
          isWiggling ? 'animate-snackbox-wiggle' : ''
        }`}
      >
        {isEmpty ? (
          <div>
            <h3 className="text-base font-bold text-slate-900">Keranjang snackbox kosong</h3>
            <p className="text-sm text-slate-500">Pilih snack dulu yuk!</p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="text-left cursor-pointer"
          >
            <h3 className="text-base font-bold text-slate-900">
              Di snackbox ada {cart.items.length} menu
            </h3>
            <p className="text-sm text-slate-500">Masih ada snack yang mau dipilih?</p>
          </button>
        )}

        <button
          type="button"
          disabled={isEmpty}
          onClick={() => setIsCartOpen(true)}
          className={`shrink-0 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
            isEmpty
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-market-green-500 hover:bg-market-green-600 text-white shadow-xs cursor-pointer'
          }`}
        >
          Lanjut Checkout
        </button>
      </div>
    </div>
  )
}
