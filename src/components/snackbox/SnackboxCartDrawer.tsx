'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import {
  X,
  Plus,
  Minus,
  Package,
  ShoppingBag,
  ArrowRight,
  Check,
  Trash2
} from 'lucide-react'
import { useSnackbox } from '@/context/SnackboxContext'

export default function SnackboxCartDrawer() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeItem,
    updateItemQty,
    toggleItemSelection,
    selectAllItems,
    setBoxType,
    setBoxCount,
    clearCart,
    summary
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="absolute inset-0" onClick={() => setIsCartOpen(false)} />

      <div
        className="relative w-full max-w-xl max-h-[85vh] bg-white rounded-3xl shadow-2xl flex flex-col z-10 animate-in fade-in zoom-in-95 duration-200 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h3 className="font-bold text-lg text-slate-900">Snackbox</h3>
          <button
            onClick={() => setIsCartOpen(false)}
            className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {cart.items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-market-green-50 border border-market-green-100 flex items-center justify-center text-market-green-600 mb-3">
              <Package className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">Keranjang Box Masih Kosong</h4>
            <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
              Pilih aneka kue dan jajanan favorit untuk dimasukkan ke dalam paket Snackbox.
            </p>
            <button
              onClick={() => setIsCartOpen(false)}
              className="mt-5 px-5 py-2.5 rounded-lg bg-market-green-500 hover:bg-market-green-600 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              Pilih Snack Sekarang
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              {/* Select All & Clear */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => selectAllItems(!isAllSelected)}
                  className="text-xs font-bold text-slate-600 hover:text-market-green-600 transition-colors cursor-pointer"
                >
                  Pilih Semua ({cart.items.length})
                </button>
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs font-medium text-rose-500 hover:underline transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus semua</span>
                </button>
              </div>

              {/* Cart Items List */}
              <div className="space-y-5">
                {cart.items.map(item => (
                  <div key={item.product.id} className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleItemSelection(item.product.id)}
                      className={`shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer ${
                        item.selected
                          ? 'bg-market-green-500 border-market-green-500'
                          : 'bg-white border-slate-300'
                      }`}
                    >
                      {item.selected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                    </button>

                    <img
                      src={item.product.imageUrl}
                      alt={item.product.title}
                      className="w-16 h-16 rounded-xl object-cover bg-slate-100 shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-sm text-slate-900 truncate">
                          {item.product.title}
                        </h4>
                        <span className="text-sm font-bold text-slate-900 shrink-0">
                          Rp {item.product.price.toLocaleString('id-ID')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <button
                          type="button"
                          onClick={() => removeItem(item.product.id)}
                          className="text-xs text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                        >
                          Hapus
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateItemQty(item.product.id, item.quantity - 1)}
                            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-4 text-center text-sm font-bold text-slate-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateItemQty(item.product.id, item.quantity + 1)}
                            className="w-7 h-7 rounded-full bg-market-green-50 hover:bg-market-green-100 border border-market-green-200 text-market-green-600 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tipe Pesanan */}
              <div className="space-y-2 pt-1">
                <h4 className="text-sm font-bold text-slate-900">Tipe Pesanan</h4>

                <button
                  type="button"
                  onClick={() => setBoxType('reguler')}
                  className={`w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                    cart.boxType === 'reguler'
                      ? 'bg-market-green-25 border-market-green-500'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span
                    className={`mt-0.5 shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      cart.boxType === 'reguler' ? 'border-market-green-500' : 'border-slate-300'
                    }`}
                  >
                    {cart.boxType === 'reguler' && (
                      <span className="w-2 h-2 rounded-full bg-market-green-500" />
                    )}
                  </span>
                  <span>
                    <span className="font-bold text-sm text-slate-900">📦 Box Reguler</span>
                    <p className="text-xs text-slate-500 mt-0.5">1 box, isinya sesuai daftar snack di atas.</p>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setBoxType('borongan')}
                  className={`w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                    cart.boxType === 'borongan'
                      ? 'bg-market-green-25 border-market-green-500'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span
                    className={`mt-0.5 shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      cart.boxType === 'borongan' ? 'border-market-green-500' : 'border-slate-300'
                    }`}
                  >
                    {cart.boxType === 'borongan' && (
                      <span className="w-2 h-2 rounded-full bg-market-green-500" />
                    )}
                  </span>
                  <span>
                    <span className="font-bold text-sm text-slate-900">🎁 Box Borongan</span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pilih ini kalau kamu mau pesan beberapa box dengan jumlah snack di atas.
                    </p>
                  </span>
                </button>
              </div>

              {/* Jumlah Box (only for Borongan) */}
              {cart.boxType === 'borongan' && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Jumlah box</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setBoxCount(cart.boxCount - 1)}
                      disabled={cart.boxCount <= 1}
                      className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-4 text-center text-sm font-bold text-slate-900">
                      {cart.boxCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setBoxCount(cart.boxCount + 1)}
                      className="w-7 h-7 rounded-full bg-market-green-50 hover:bg-market-green-100 border border-market-green-200 text-market-green-600 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 space-y-3 shrink-0">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal per box</span>
                  <span className="font-bold text-slate-900">
                    Rp {summary.subtotalPerBox.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-slate-900">
                  <span>Grand Total</span>
                  <span>Rp {summary.subtotalGross.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Link
                  href="/cart"
                  onClick={() => setIsCartOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all border border-market-green-500 text-market-green-600 hover:bg-market-green-25 active:scale-95 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Cek Keranjang Belanja</span>
                </Link>

                <Link
                  href="/snackbox/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xs active:scale-95 cursor-pointer bg-market-green-500 hover:bg-market-green-600 text-white"
                >
                  <span>Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
