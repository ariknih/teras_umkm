'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import {
  X,
  Trash2,
  Plus,
  Minus,
  Package,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  CheckSquare,
  Square,
  Sparkles
} from 'lucide-react'
import { useSnackbox } from '@/context/SnackboxContext'
import BoxTypeSelector from './BoxTypeSelector'

export default function SnackboxCartDrawer() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeItem,
    updateItemQty,
    toggleItemSelection,
    selectAllItems,
    setBoxCount,
    clearCart,
    totalItemTypesCount,
    totalPiecesCount,
    summary,
    kelurahan
  } = useSnackbox()

  // Handle ESC close and body scroll lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCartOpen(false)
      }
    }
    if (isCartOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isCartOpen, setIsCartOpen])

  if (!isCartOpen) return null

  const isAllSelected = cart.items.length > 0 && cart.items.every(i => i.selected)

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={() => setIsCartOpen(false)} />

      {/* Drawer Container */}
      <div 
        className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#2DB24A] flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-slate-900 leading-tight">Keranjang Snackbox</h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {cart.items.length} Menu
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Pengiriman untuk: <strong className="text-slate-800">Kel. {kelurahan.name}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Body */}
        {cart.items.length === 0 ? (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
            <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#2DB24A] mb-4 shadow-sm animate-pulse">
              <Package className="w-10 h-10" />
            </div>
            <h4 className="font-extrabold text-lg text-slate-900">Keranjang Snackbox Kosong</h4>
            <p className="text-xs text-slate-500 max-w-xs mt-1.5 leading-relaxed">
              Anda belum memilih snack atau kue untuk dimasukkan ke dalam box. Pilih kue favorit Anda dari katalog.
            </p>
            <button
              onClick={() => setIsCartOpen(false)}
              className="mt-6 px-6 py-3 rounded-2xl bg-[#2DB24A] hover:bg-[#24943E] text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              Mulai Pilih Snackbox
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Box Type Selector */}
            <BoxTypeSelector />

            {/* Select All & Clear Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => selectAllItems(!isAllSelected)}
                className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-[#2DB24A] transition-colors"
              >
                {isAllSelected ? (
                  <CheckSquare className="w-4 h-4 text-[#2DB24A]" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span>Pilih Semua Menu ({cart.items.length})</span>
              </button>

              <button
                type="button"
                onClick={clearCart}
                className="text-xs font-semibold text-rose-500 hover:text-rose-700 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Kosongkan</span>
              </button>
            </div>

            {/* Cart Items List */}
            <div className="space-y-3">
              {cart.items.map(item => {
                const itemTotal = item.product.price * item.quantity
                return (
                  <div
                    key={item.product.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center gap-3 ${
                      item.selected
                        ? 'bg-white border-slate-200/90 shadow-sm'
                        : 'bg-slate-50/80 border-slate-200/60 opacity-60'
                    }`}
                  >
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => toggleItemSelection(item.product.id)}
                      className="text-slate-400 hover:text-[#2DB24A] transition-colors shrink-0"
                    >
                      {item.selected ? (
                        <CheckSquare className="w-5 h-5 text-[#2DB24A]" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-400" />
                      )}
                    </button>

                    {/* Image */}
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.title}
                      className="w-14 h-14 rounded-xl object-cover bg-slate-100 shrink-0"
                    />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                        {item.product.title}
                      </h4>
                      <p className="text-[11px] font-semibold text-[#2DB24A]">
                        Rp {item.product.price.toLocaleString('id-ID')}
                        <span className="text-slate-400 font-normal text-[10px]"> / pcs</span>
                      </p>
                    </div>

                    {/* Stepper per item */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                        <button
                          type="button"
                          onClick={() => updateItemQty(item.product.id, item.quantity - 1)}
                          className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors shadow-2xs text-xs font-bold"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateItemQty(item.product.id, item.quantity + 1)}
                          className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors shadow-2xs text-xs font-bold"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-[11px] font-extrabold text-slate-800">
                        Rp {itemTotal.toLocaleString('id-ID')}
                      </span>
                    </div>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => removeItem(item.product.id)}
                      className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                      title="Hapus dari box"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Stepper Jumlah Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/60 to-slate-50 border border-emerald-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-[#2DB24A]" />
                  <span>Jumlah Paket Box</span>
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {cart.boxType === 'reguler'
                    ? `Tiap box berisi ${totalPiecesCount} pcs kue seragam`
                    : `Total ${totalPiecesCount * cart.boxCount} pcs kue untuk ${cart.boxCount} box`}
                </p>
              </div>

              <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                <button
                  type="button"
                  onClick={() => setBoxCount(cart.boxCount - 1)}
                  disabled={cart.boxCount <= 1}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 flex items-center justify-center transition-colors text-xs font-bold"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center text-sm font-extrabold text-slate-900">
                  {cart.boxCount}
                </span>
                <button
                  type="button"
                  onClick={() => setBoxCount(cart.boxCount + 1)}
                  className="w-8 h-8 rounded-xl bg-[#2DB24A] hover:bg-[#24943E] text-white flex items-center justify-center transition-colors text-xs font-bold shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Drawer Footer & Checkout CTA */}
        {cart.items.length > 0 && (
          <div className="p-5 border-t border-slate-100 bg-white space-y-3 shrink-0 shadow-lg">
            {/* Calculation summary */}
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal per Box ({totalPiecesCount} pcs):</span>
                <span className="font-bold text-slate-900">
                  Rp {summary.subtotalPerBox.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Jumlah Pesanan Box:</span>
                <span className="font-bold text-slate-900">× {cart.boxCount} Box</span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-slate-100 text-sm font-extrabold text-slate-900">
                <span className="flex items-center gap-1 text-[#2DB24A]">
                  <Sparkles className="w-4 h-4" /> Total Snackbox:
                </span>
                <span className="text-base text-emerald-800 font-extrabold">
                  Rp {summary.subtotalGross.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Trust badge */}
            <div className="flex items-center gap-2 text-[10px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
              <ShieldCheck className="w-4 h-4 text-[#2DB24A] shrink-0" />
              <span>Semua pesanan digaransikan fresh, higienis & dikirim tepat waktu oleh Saloka.</span>
            </div>

            {/* Checkout Button */}
            <Link
              href="/snackbox/checkout"
              onClick={() => setIsCartOpen(false)}
              className={`w-full py-3.5 px-4 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${
                totalItemTypesCount === 0
                  ? 'bg-slate-200 text-slate-400 pointer-events-none'
                  : 'bg-[#2DB24A] hover:bg-[#24943E] text-white'
              }`}
            >
              <span>Lanjut ke Checkout ({cart.boxCount} Box)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
