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
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-bg-dark">
        <span className="text-xs font-geist font-bold text-primary tracking-widest uppercase animate-pulse">
          Memuat Daftar Pesanan...
        </span>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-bg-dark pt-28 pb-24 px-6 md:px-10">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1400px] h-[350px] bg-[radial-gradient(circle_at_center,rgba(198,169,107,0.03)_0%,transparent_75%)] pointer-events-none z-0" />

      <div className="relative z-10 max-w-[800px] mx-auto">
        <div className="mb-10 pb-6 border-b border-border-subtle">
          <h1 className="font-sora text-2xl font-bold text-text-primary mb-2">
            Pesanan <span className="text-primary">Saya.</span>
          </h1>
          <p className="text-xs text-text-secondary">
            Pantau status pengiriman, rincian produk belanjaan, dan berikan ulasan ulasan.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-border-subtle mb-8 gap-2">
          {(['ALL', 'PENDING', 'COMPLETED', 'CANCELLED'] as const).map(tab => {
            const labels = { ALL: 'Semua', PENDING: 'Menunggu', COMPLETED: 'Selesai', CANCELLED: 'Dibatalkan' }
            return (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`pb-3.5 px-4 text-xs font-geist font-bold uppercase tracking-wider transition-all relative cursor-pointer ${
                  filter === tab ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {labels[tab]}
                {filter === tab && (
                  <span className="btn-primary absolute bottom-0 left-0 right-0" />
                )}
              </button>
            )
          })}
        </div>

        {/* Orders list */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-20 border border-border-subtle rounded-xl bg-surface-dark/40 backdrop-blur-md">
            <div className="btn-primary w-12 bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary mb-4">
              <ShoppingBag size={20} />
            </div>
            <h3 className="font-sora text-sm font-bold text-text-primary mb-1">Belum Ada Transaksi</h3>
            <p className="text-xs text-text-secondary max-w-xs mx-auto mb-6">
              Mulai jelajahi produk artisan unggulan di Saloka Marketplace.
            </p>
            <Link
              href="/market"
              className="btn-primary text-xs inline-block"
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
                  className="border border-border-subtle hover:border-primary/20 bg-surface-dark/50 hover:bg-surface-dark/80 backdrop-blur-md p-5 rounded-xl transition-all duration-300 group shadow-md"
                >
                  <div className="flex flex-wrap justify-between items-center gap-3 border-b border-border-subtle/50 pb-3.5 mb-3.5">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 bg-surface-container border border-border-subtle rounded text-[9px] font-geist font-bold text-text-primary">
                        ID: {order.id.replace('order-', '#')}
                      </span>
                      <span className="text-[10px] text-text-secondary flex items-center gap-1.5">
                        <Calendar size={11} />
                        {dateStr}
                      </span>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[8px] font-geist font-black uppercase tracking-wider border ${
                      order.status === 'COMPLETED'
                        ? 'bg-green-500/10 border-green-500/20 text-green-400'
                        : order.status === 'CANCELLED'
                        ? 'bg-red-500/10 border-red-500/20 text-red-400'
                        : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400 animate-pulse'
                    }`}>
                      {order.status === 'COMPLETED' ? 'Selesai' : order.status === 'CANCELLED' ? 'Batal' : 'Pending'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center gap-4">
                    <div className="space-y-2">
                      {itemsList.map((item: any, idx: number) => (
                        <div key={item.id || idx} className="flex items-center gap-2">
                          <Package size={12} className="text-primary" />
                          <span className="text-xs text-text-primary font-medium line-clamp-1">
                            {item.product?.title || item.productTitle || 'Produk Saloka'}
                          </span>
                          <span className="text-[10px] text-text-secondary whitespace-nowrap">
                            x{item.quantity}
                          </span>
                        </div>
                      ))}

                      <div className="pt-2 text-xs font-geist text-text-secondary flex items-center gap-1">
                        Total Bayar: 
                        <span className="text-primary font-black text-sm ml-1">
                          Rp {order.totalAmount.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/orders/${order.id}`}
                      className="px-4 py-2.5 bg-surface-container hover:bg-surface-container-high border border-border-subtle hover:border-primary/45 rounded-lg text-[10px] font-geist font-bold uppercase tracking-wider text-text-primary transition-all duration-300 flex items-center gap-1 shadow-sm shrink-0"
                    >
                      Lacak Pesanan
                      <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
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
