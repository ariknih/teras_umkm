'use client'

import React from 'react'
import Link from 'next/link'
import { useSnackbox } from '@/context/SnackboxContext'

export default function SnackboxStickyCartBar() {
  const { cart, totalItemTypesCount, setIsCartOpen } = useSnackbox()

  const isEmpty = totalItemTypesCount === 0

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex flex-col items-center bg-white shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
      <div className="w-full max-w-[1200px] mx-auto px-5 py-3.5 flex items-center justify-between gap-4">
        {isEmpty ? (
          <div>
            <h3 className="text-sm font-bold text-slate-900">Keranjang snackbox kosong</h3>
            <p className="text-xs text-slate-500">Pilih snack dulu yuk!</p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="text-left cursor-pointer"
          >
            <h3 className="text-sm font-bold text-slate-900">
              Di snackbox ada {cart.items.length} menu
            </h3>
            <p className="text-xs text-slate-500">Masih ada snack yang mau dipilih?</p>
          </button>
        )}

        <Link
          href="/snackbox/checkout"
          aria-disabled={isEmpty}
          className={`shrink-0 px-6 py-2.5 rounded-lg text-xs font-bold transition-all ${
            isEmpty
              ? 'bg-slate-100 text-slate-400 pointer-events-none'
              : 'bg-market-green-500 hover:bg-market-green-600 text-white shadow-xs cursor-pointer'
          }`}
        >
          Lanjut Checkout
        </Link>
      </div>
    </div>
  )
}
