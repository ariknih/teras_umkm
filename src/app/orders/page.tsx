'use client'

import React, { useState, useEffect, startTransition } from 'react'
import Link from 'next/link'
import { getMyOrders } from '@/app/actions/orders'
import { Package, Calendar, Tag, ChevronRight, ShoppingBag } from 'lucide-react'

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED' | 'CANCELLED'>('ALL')

  useEffect(() => {
    startTransition(async () => {
      const data = await getMyOrders()
      setOrders(data)
      setLoading(false)
    })
  }, [])

  const filteredOrders = orders.filter(o => {
    if (filter === 'ALL') return true
    return o.status === filter
  })

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-slate-200 border-t-[#2DB24A] rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-600 tracking-wider uppercase">
            Memuat Daftar Pesanan...
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-24 pb-24 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-[800px] mx-auto">
        <div className="mb-8 pb-5 border-b border-slate-200">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 mb-1.5">
            Pesanan <span className="text-[#2DB24A]">Saya.</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Pantau status pengiriman, rincian produk belanjaan, dan berikan ulasan pesanan Anda.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-slate-200 mb-8 gap-2 overflow-x-auto no-scrollbar">
          {(['ALL', 'PENDING', 'COMPLETED', 'CANCELLED'] as const).map(tab => {
            const labels = { ALL: 'Semua', PENDING: 'Menunggu', COMPLETED: 'Selesai', CANCELLED: 'Dibatalkan' }
            const isActive = filter === tab
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`pb-3 px-4 text-xs md:text-sm font-bold uppercase tracking-wider transition-colors relative cursor-pointer whitespace-nowrap ${
                  isActive ? 'text-[#2DB24A]' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {labels[tab]}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#2DB24A] rounded-full" />
                )}
              </button>
            )
          })}
        </div>

        {/* Orders list */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 px-6 border border-slate-200/80 rounded-2xl bg-white shadow-xs">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-[#2DB24A] mb-4 shadow-inner">
              <ShoppingBag size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Belum Ada Transaksi</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mb-6 leading-relaxed">
              Mulai jelajahi produk artisan unggulan di Saloka Marketplace.
            </p>
            <Link
              href="/market"
              className="px-6 py-2.5 bg-[#2DB24A] hover:bg-[#24943E] text-white text-xs font-bold rounded-xl shadow-xs transition-colors inline-block"
            >
              Belanja Sekarang
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => {
              const dateStr = new Date(order.createdAt).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })
              const itemsList = order.items || []

              return (
                <div
                  key={order.id}
                  className="border border-slate-200/80 hover:border-[#2DB24A]/40 bg-white hover:shadow-md p-5 rounded-2xl transition-all duration-200 group"
                >
                  <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-100 pb-3 mb-3.5">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 rounded-md text-[10px] font-mono font-bold text-slate-700">
                        ID: {order.id.replace('order-', '#')}
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
                        <Calendar size={12} />
                        {dateStr}
                      </span>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                      order.status === 'COMPLETED'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : order.status === 'CANCELLED'
                        ? 'bg-rose-50 border-rose-200 text-rose-700'
                        : 'bg-amber-50 border-amber-200 text-amber-700 animate-pulse'
                    }`}>
                      {order.status === 'COMPLETED' ? 'Selesai' : order.status === 'CANCELLED' ? 'Batal' : 'Pending'}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-2 flex-1">
                      {itemsList.map((item: any, idx: number) => (
                        <div key={item.id || idx} className="flex items-center gap-2">
                          <Package size={14} className="text-[#2DB24A] shrink-0" />
                          <span className="text-xs text-slate-800 font-semibold line-clamp-1">
                            {item.product?.title || item.productTitle || 'Produk Saloka'}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                            x{item.quantity}
                          </span>
                        </div>
                      ))}

                      <div className="pt-1.5 text-xs text-slate-500 font-medium flex items-center gap-1.5">
                        <span>Total Tagihan:</span>
                        <span className="text-[#2DB24A] font-extrabold text-sm">
                          Rp {order.totalAmount.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/orders/${order.id}`}
                      className="px-4 py-2 bg-slate-50 hover:bg-[#2DB24A] hover:text-white border border-slate-200 hover:border-[#2DB24A] rounded-xl text-xs font-bold text-slate-700 transition-all duration-200 flex items-center gap-1.5 shadow-xs shrink-0 self-end sm:self-auto"
                    >
                      <span>Lacak Pesanan</span>
                      <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
