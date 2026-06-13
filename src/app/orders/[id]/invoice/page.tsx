'use client'

import React, { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { getOrderInvoiceData } from '@/app/actions/orders'
import { ArrowLeft, Printer, ShieldCheck, AlertCircle } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function OrderInvoicePage({ params }: PageProps) {
  const { id } = use(params)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getOrderInvoiceData(id)
        setData(res)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id])

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-bg-dark">
        <span className="text-xs font-geist font-bold text-primary tracking-widest uppercase animate-pulse">
          Menyiapkan Invoice...
        </span>
      </div>
    )
  }

  if (!data || !data.order) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-bg-dark p-6 text-center">
        <AlertCircle size={40} className="text-red-400 mb-4" />
        <h2 className="font-sora text-lg font-bold text-text-primary mb-2">Invoice Tidak Ditemukan</h2>
        <p className="text-xs text-text-secondary max-w-xs mb-6">
          Maaf, data invoice untuk ID pesanan tersebut tidak tersedia.
        </p>
        <Link
          href="/orders"
          className="btn-primary text-xs"
        >
          Kembali ke Pesanan Saya
        </Link>
      </div>
    )
  }

  const { order, merchant } = data
  const dateStr = new Date(order.createdAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  const subtotal = (order.items || []).reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0)

  return (
    <div className="relative min-h-screen bg-bg-dark pt-28 pb-24 px-6 md:px-10 print:pt-4 print:pb-4 print:px-4">
      {/* Glow Effects (hidden in print) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1400px] h-[350px] bg-[radial-gradient(circle_at_center,rgba(198,169,107,0.02)_0%,transparent_75%)] pointer-events-none z-0 print:hidden" />

      <div className="relative z-10 max-w-[800px] mx-auto">
        {/* Actions panel (hidden in print) */}
        <div className="flex justify-between items-center mb-8 print:hidden">
          <Link
            href={`/orders/${order.id}`}
            className="inline-flex items-center gap-1.5 text-text-secondary hover:text-primary transition-colors text-xs font-bold uppercase tracking-wider"
          >
            <ArrowLeft size={14} />
            Pelacakan Pesanan
          </Link>

          <button
            onClick={handlePrint}
            className="btn-primary inline-flex items-center gap-2 text-xs shadow-sm cursor-pointer"
          >
            <Printer size={14} />
            Cetak / Simpan PDF
          </button>
        </div>

        {/* Invoice Body Card */}
        <div className="bg-surface-dark border border-border-subtle p-8 md:p-10 rounded-xl shadow-lg print:border-none print:shadow-none print:bg-white print:text-black">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8 border-b border-border-subtle/80">
            <div>
              {/* Brand Logo & Name */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shadow-sm print:bg-black">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white print:text-white">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="font-sora text-base font-bold text-text-primary print:text-black">
                  Saloka<span className="text-primary print:text-black">UMKM</span>
                </span>
              </div>
              <p className="text-[10px] text-text-secondary print:text-gray-500 uppercase tracking-widest font-semibold">
                Platform Digital UMKM Indonesia
              </p>
            </div>

            <div className="text-left md:text-right">
              <h1 className="font-sora text-xl font-extrabold text-primary uppercase tracking-wide print:text-black">
                FAKTUR INVOICE
              </h1>
              <p className="text-xs text-text-secondary print:text-gray-500 mt-1">
                No. Transaksi: <span className="font-mono font-bold text-text-primary print:text-black">{order.id}</span>
              </p>
              <p className="text-[10px] text-text-secondary print:text-gray-500 mt-0.5">
                Tanggal: <span className="font-semibold text-text-primary print:text-black">{dateStr}</span>
              </p>
            </div>
          </div>

          {/* Billing Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-b border-border-subtle/80 text-xs">
            {/* Merchant Details */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-text-secondary print:text-gray-500 uppercase tracking-wider block">
                DITERBITKAN OLEH
              </span>
              <div className="space-y-1">
                <p className="font-sora font-bold text-text-primary print:text-black text-sm">
                  {merchant ? merchant.name : 'Merchant Saloka.id'}
                </p>
                <p className="text-text-secondary print:text-gray-600">
                  Email: {merchant ? merchant.email : '-'}
                </p>
                <p className="text-text-secondary print:text-gray-500 italic text-[10px]">
                  Anggota Resmi Saloka.id Merchant Network
                </p>
              </div>
            </div>

            {/* Buyer Details */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-text-secondary print:text-gray-500 uppercase tracking-wider block">
                DIKIRIM KEPADA
              </span>
              <div className="space-y-1">
                <p className="font-sora font-bold text-text-primary print:text-black text-sm">
                  {order.buyer ? order.buyer.name : 'Pelanggan Setia'}
                </p>
                <p className="text-text-secondary print:text-gray-600">
                  Email: {order.buyer ? order.buyer.email : '-'}
                </p>
                <p className="text-text-secondary print:text-gray-600 font-medium leading-relaxed mt-1">
                  Alamat: {order.shippingAddress || '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Purchased Items Table */}
          <div className="py-8">
            <span className="text-[10px] font-bold text-text-secondary print:text-gray-500 uppercase tracking-wider block mb-4">
              RINCIAN TRANSAKSI
            </span>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border-subtle/80 text-[10px] font-bold text-text-secondary print:text-gray-500 uppercase tracking-wider">
                    <th className="py-3 pr-4 w-8">No</th>
                    <th className="py-3 px-4">Nama Produk</th>
                    <th className="py-3 px-4 text-center w-24">Harga</th>
                    <th className="py-3 px-4 text-center w-16">Jumlah</th>
                    <th className="py-3 pl-4 text-right w-28">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle/50 print:divide-gray-200">
                  {(order.items || []).map((item: any, idx: number) => {
                    const productTitle = item.productTitle || item.product?.title || 'Produk Saloka'
                    return (
                      <tr key={item.productId || idx} className="text-text-primary print:text-black">
                        <td className="py-3 pr-4 font-mono">{idx + 1}</td>
                        <td className="py-3 px-4 font-semibold">{productTitle}</td>
                        <td className="py-3 px-4 text-center font-mono">Rp {item.price.toLocaleString('id-ID')}</td>
                        <td className="py-3 px-4 text-center font-mono">{item.quantity}</td>
                        <td className="py-3 pl-4 text-right font-bold font-mono">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="border-t border-border-subtle/80 pt-6 flex flex-col items-end gap-3 text-xs">
            <div className="w-full sm:max-w-xs space-y-2.5">
              <div className="flex justify-between text-text-secondary print:text-gray-600">
                <span>Subtotal Barang</span>
                <span className="font-mono font-semibold text-text-primary print:text-black">Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-text-secondary print:text-gray-600">
                <span>Ongkos Kirim ({order.courier || 'Kurir'})</span>
                <span className="font-mono font-semibold text-text-primary print:text-black">Rp {(order.shippingFee || 0).toLocaleString('id-ID')}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-red-400 print:text-red-600">
                  <span>Diskon Kupon</span>
                  <span className="font-mono font-semibold">-Rp {order.discountAmount.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border-subtle/85 pt-3 text-sm font-bold">
                <span className="text-text-primary print:text-black">Total Pembayaran</span>
                <span className="text-primary print:text-black font-black font-mono">Rp {order.totalAmount.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          {/* Footer Notes */}
          <div className="mt-12 pt-8 border-t border-border-subtle/80 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-text-secondary print:text-gray-500">
            <div className="flex items-center gap-1.5 font-geist font-bold text-green-400 print:text-green-600 uppercase tracking-widest">
              <ShieldCheck size={14} />
              Pembayaran Terverifikasi Lunas
            </div>
            <div className="text-center sm:text-right leading-relaxed max-w-xs">
              Terima kasih telah bertransaksi di Saloka.id. Simpan invoice digital ini sebagai bukti pembelian yang sah.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
