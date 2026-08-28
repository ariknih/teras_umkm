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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsCartOpen(false)
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
    <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="absolute inset-0" onClick={() => setIsCartOpen(false)} />

      <div 
        className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="px-4 py-3.5 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E8F5E9] text-[#006E24] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 leading-tight">Keranjang Snackbox</h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#006E24] border border-[#C8E6C9]">
                  {cart.items.length} Menu
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Lokasi: <strong className="text-slate-700">Kel. {kelurahan.name}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Body */}
        {cart.items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#F5F7FA]">
            <div className="w-16 h-16 rounded-full bg-[#E8F5E9] border border-[#C8E6C9] flex items-center justify-center text-[#006E24] mb-3">
              <Package className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">Keranjang Box Masih Kosong</h4>
            <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
              Pilih aneka kue dan jajanan favorit untuk dimasukkan ke dalam paket Snackbox.
            </p>
            <button
              onClick={() => setIsCartOpen(false)}
              className="mt-5 px-5 py-2.5 rounded-lg bg-[#006E24] hover:bg-[#005a1d] text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              Pilih Snack Sekarang
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Box Type Selector */}
            <BoxTypeSelector compact />

            {/* Select All & Clear */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => selectAllItems(!isAllSelected)}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-[#006E24] transition-colors cursor-pointer"
              >
                {isAllSelected ? (
                  <CheckSquare className="w-4 h-4 text-[#006E24]" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span>Pilih Semua ({cart.items.length})</span>
              </button>

              <button
                type="button"
                onClick={clearCart}
                className="text-xs font-medium text-rose-600 hover:underline transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus semua</span>
              </button>
            </div>

            {/* Cart Items List */}
            <div className="space-y-2.5">
              {cart.items.map(item => {
                const itemTotal = item.product.price * item.quantity
                return (
                  <div
                    key={item.product.id}
                    className={`p-2.5 rounded-xl border transition-all flex items-center gap-2.5 ${
                      item.selected
                        ? 'bg-white border-slate-200 shadow-2xs'
                        : 'bg-slate-50 border-slate-200/60 opacity-60'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleItemSelection(item.product.id)}
                      className="text-slate-400 hover:text-[#006E24] transition-colors shrink-0 cursor-pointer"
                    >
                      {item.selected ? (
                        <CheckSquare className="w-4 h-4 text-[#006E24]" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>

                    <img
                      src={item.product.imageUrl}
                      alt={item.product.title}
                      className="w-12 h-12 rounded-lg object-cover bg-slate-100 shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-xs text-slate-900 truncate">
                        {item.product.title}
                      </h4>
                      <p className="text-[11px] font-bold text-slate-900 mt-0.5">
                        Rp {item.product.price.toLocaleString('id-ID')}
                        <span className="text-slate-400 font-normal text-[10px]"> / pcs</span>
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                        <button
                          type="button"
                          onClick={() => updateItemQty(item.product.id, item.quantity - 1)}
                          className="w-5 h-5 rounded bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors text-xs font-bold cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center text-xs font-bold text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateItemQty(item.product.id, item.quantity + 1)}
                          className="w-5 h-5 rounded bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors text-xs font-bold cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-[11px] font-extrabold text-slate-800">
                        Rp {itemTotal.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.product.id)}
                      className="text-slate-300 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                      title="Hapus item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Stepper Jumlah Box */}
            <div className="p-3 rounded-xl bg-[#F5F7FA] border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-[#006E24]" />
                  <span>Jumlah Paket Box</span>
                </span>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {cart.boxType === 'reguler'
                    ? `Setiap box berisi ${totalPiecesCount} pcs kue seragam`
                    : `Total ${totalPiecesCount * cart.boxCount} pcs kue untuk ${cart.boxCount} box`}
                </p>
              </div>

              <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setBoxCount(cart.boxCount - 1)}
                  disabled={cart.boxCount <= 1}
                  className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 flex items-center justify-center transition-colors text-xs font-bold cursor-pointer"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-7 text-center text-xs font-extrabold text-slate-900">
                  {cart.boxCount}
                </span>
                <button
                  type="button"
                  onClick={() => setBoxCount(cart.boxCount + 1)}
                  className="w-7 h-7 rounded-lg bg-[#006E24] hover:bg-[#005a1d] text-white flex items-center justify-center transition-colors text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Drawer Footer */}
        {cart.items.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-white space-y-2.5 shrink-0 shadow-lg">
            <div className="space-y-1 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal per Box ({totalPiecesCount} pcs):</span>
                <span className="font-bold text-slate-900">
                  Rp {summary.subtotalPerBox.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Jumlah Box:</span>
                <span className="font-bold text-slate-900">× {cart.boxCount} Box</span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-slate-100 text-sm font-extrabold text-slate-900">
                <span>Total Snackbox:</span>
                <span className="text-base text-[#006E24] font-extrabold">
                  Rp {summary.subtotalGross.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <Link
                href="/cart"
                onClick={() => setIsCartOpen(false)}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all border border-[#006E24] text-[#006E24] hover:bg-[#E8F5E9] active:scale-95 cursor-pointer ${
                  totalItemTypesCount === 0 ? 'pointer-events-none opacity-50' : ''
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Lanjut ke Keranjang Belanja (/cart)</span>
              </Link>

              <Link
                href="/snackbox/checkout"
                onClick={() => setIsCartOpen(false)}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs active:scale-95 cursor-pointer ${
                  totalItemTypesCount === 0
                    ? 'bg-slate-200 text-slate-400 pointer-events-none'
                    : 'bg-[#006E24] hover:bg-[#005a1d] text-white'
                }`}
              >
                <span>Checkout Langsung Snackbox ({cart.boxCount} Box)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
