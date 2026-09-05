'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { generateDummyAffiliatesAction } from '@/app/actions/admin'
import { useToast, Toast } from './Toast'

type Props = {
  users: any[]
  products: any[]
  orders: any[]
}

export default function AffiliatesTab({ users, products, orders }: Props) {
  const router = useRouter()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const { toast, showToast } = useToast()

  const affiliates = users.filter((u) => u.role === 'AFFILIATE')

  const handleGenerateDummy = () => {
    if (!confirm('Bikin 10 akun dummy dan referral secara instan untuk keperluan demo?')) return
    startTransition(async () => {
      const res = await generateDummyAffiliatesAction(10)
      if (res.success) {
        showToast('10 Akun Dummy & Referral berhasil digenerate.')
        router.refresh()
      } else {
        showToast(res.error || 'Gagal generate.', 'error')
      }
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Toast toast={toast} />

      <div className="bg-white border border-[#e2e8f0] p-6 rounded-[var(--radius-brand)] shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-sora text-sm font-bold text-slate-800 uppercase tracking-widest">Monitor Sistem Affiliate</h3>
            <p className="text-xs text-slate-500 mt-1">Pantau performa partner Affiliate (JV), total referral, dan kelola simulasi data dummy.</p>
          </div>
          <button
            disabled={isPending}
            onClick={handleGenerateDummy}
            className="px-4 py-2 bg-[#0F5132] hover:bg-[#0a3a24] text-white text-xs font-bold uppercase tracking-widest rounded transition-colors disabled:opacity-50"
          >
            {isPending ? 'Generating...' : '🔥 Generate Dummy Affiliate'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 border-b border-[#e2e8f0] text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <th className="px-4 py-3">User Affiliate</th>
                <th className="px-4 py-3">Total Downline / Referral</th>
                <th className="px-4 py-3">Level / XP</th>
                <th className="px-4 py-3">Tgl Bergabung</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {affiliates.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-4 text-slate-400 italic">Belum ada user Affiliate.</td>
                </tr>
              ) : (
                affiliates.map((aff) => {
                  const downlines = users.filter((u) => u.parentAffiliateId === aff.id)
                  const totalReferrals = downlines.length
                  const downlineIds = downlines.map((d) => d.id)
                  const affiliateOrders = orders.filter((o) => downlineIds.includes(o.buyerId))

                  return (
                    <React.Fragment key={aff.id}>
                      <tr
                        className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                        onClick={() => setExpandedId(expandedId === aff.id ? null : aff.id)}
                      >
                        <td className="px-4 py-3 font-medium text-slate-800">
                          <div className="flex items-center gap-2">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform duration-200 ${expandedId === aff.id ? 'rotate-90 text-[#0F5132]' : 'text-slate-400'}`}>
                              <path d="M9 18l6-6-6-6" />
                            </svg>
                            <div>{aff.name}<br /><span className="text-[10px] text-slate-500 font-normal">{aff.email}</span></div>
                          </div>
                        </td>
                        <td className="px-4 py-3"><span className="px-2 py-1 bg-[#E8F5E9] text-[#0F5132] font-bold rounded text-[10px] border border-[#0F5132]/10">{totalReferrals} Orang</span></td>
                        <td className="px-4 py-3">Lv.{aff.level} ({aff.xp} XP)</td>
                        <td className="px-4 py-3 text-slate-500">{new Date(aff.createdAt).toLocaleDateString('id-ID')}</td>
                      </tr>

                      {expandedId === aff.id && (
                        <tr className="bg-slate-50/80 border-b border-[#e2e8f0]">
                          <td colSpan={4} className="px-8 py-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              {/* Downline Tree */}
                              <div>
                                <h4 className="font-sora text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#0F5132]"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                                  Pohon Jaringan (Downline)
                                </h4>
                                {downlines.length === 0 ? (
                                  <p className="text-[10px] text-slate-500 italic">Belum ada anggota di jaringan ini.</p>
                                ) : (
                                  <div className="space-y-2 border-l-2 border-[#E8F5E9] pl-4 ml-2">
                                    {downlines.map((d) => (
                                      <div key={d.id} className="text-[10px] bg-white border border-slate-200 p-2 rounded shadow-sm">
                                        <span className="font-bold text-slate-700">{d.name}</span> <span className="text-slate-400">({d.email})</span>
                                        <div className="text-emerald-600 mt-0.5 font-medium">Bergabung: {new Date(d.createdAt).toLocaleDateString('id-ID')}</div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Affiliate Products & Sales */}
                              <div>
                                <h4 className="font-sora text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-600"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                                  Produk Terjual & Komisi Affiliate
                                </h4>
                                {affiliateOrders.length === 0 ? (
                                  <p className="text-[10px] text-slate-500 italic">Belum ada penjualan dari jaringan ini.</p>
                                ) : (
                                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                    {affiliateOrders.map((o) => (
                                      <div key={o.id} className="text-[10px] bg-white border border-slate-200 p-3 rounded shadow-sm">
                                        <div className="flex justify-between items-start mb-1">
                                          <span className="font-bold text-slate-800">Order #{o.id.split('-').pop()}</span>
                                          <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded text-[8px]">
                                            Komisi: +Rp {Math.round(o.totalAmount * 0.1).toLocaleString('id-ID')}
                                          </span>
                                        </div>
                                        <div className="text-slate-500 mb-1">Pembeli: {users.find((u) => u.id === o.buyerId)?.name || o.buyerId}</div>
                                        <div className="space-y-1 mt-2 pt-2 border-t border-slate-100">
                                          {o.items?.map((item: any, idx: number) => {
                                            const p = products.find((prod) => prod.id === item.productId)
                                            return (
                                              <div key={idx} className="flex justify-between text-[9px]">
                                                <span>{p?.title || 'Produk'} (x{item.quantity})</span>
                                                <span className="text-slate-600 font-medium">Rp {((p?.price || 0) * item.quantity).toLocaleString('id-ID')}</span>
                                              </div>
                                            )
                                          })}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
