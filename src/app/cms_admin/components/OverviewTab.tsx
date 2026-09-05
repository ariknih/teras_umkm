import Link from 'next/link'

type Props = {
  users: any[]
  products: any[]
  orders: any[]
}

/**
 * Read-only dashboard bento grid. No mutations, no local state — pure
 * presentation over the shared admin data snapshot.
 */
export default function OverviewTab({ users, products, orders }: Props) {
  const totalVolume = orders.reduce((sum, o) => sum + o.totalAmount, 0)
  const totalUsers = users.length
  const totalProducts = products.length

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stat Cards Bento Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Financial Performance Card (Span 8) */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-xl border border-[#E5E7EB] shadow-xs p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#eef8e9] rounded-full opacity-50 blur-3xl group-hover:bg-[#b0f1c7]/40 transition-colors duration-500 pointer-events-none" />
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <span className="inline-block px-2.5 py-1 bg-[#eef8e9] text-[#006e24] font-semibold text-[11px] uppercase tracking-wider rounded-md mb-4">
                KINERJA FINANSIAL
              </span>
              <h3 className="font-semibold text-xs text-[#6B7280] mb-2 uppercase tracking-wider">TOTAL VOLUME JUAL BELI</h3>
              <div className="flex items-baseline gap-3">
                <span className="font-sora text-3xl font-extrabold text-primary tracking-tight">
                  Rp {totalVolume.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
            <div className="mt-8 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-semibold text-[#6B7280]">{orders.length} order sukses terverifikasi</span>
            </div>
          </div>
        </div>

        {/* Total Users Card (Span 2) */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-2 bg-white rounded-xl border border-[#E5E7EB] shadow-xs p-5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 flex flex-col justify-between">
          <div>
            <span className="inline-block px-2.5 py-1 bg-[#e0f2fe] text-[#0369a1] font-semibold text-[11px] uppercase tracking-wider rounded-md mb-3">
              KOMUNITAS
            </span>
            <h4 className="font-semibold text-[11px] text-[#6B7280] uppercase tracking-wider mb-1">TOTAL PENGGUNA</h4>
            <div className="font-sora text-2xl font-bold text-[#1e3a8a] mb-2">{totalUsers}</div>
          </div>
          <p className="text-xs text-[#6B7280] leading-tight">Customer, Merchant & Affiliate</p>
        </div>

        {/* Total Products Card (Span 2) */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-2 bg-white rounded-xl border border-[#E5E7EB] shadow-xs p-5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 flex flex-col justify-between">
          <div>
            <span className="inline-block px-2.5 py-1 bg-[#ede9fe] text-[#6d28d9] font-semibold text-[11px] uppercase tracking-wider rounded-md mb-3">
              ETALASE
            </span>
            <h4 className="font-semibold text-[11px] text-[#6B7280] uppercase tracking-wider mb-1">TOTAL PRODUK</h4>
            <div className="font-sora text-2xl font-bold text-[#4c1d95] mb-2">{totalProducts}</div>
          </div>
          <p className="text-xs text-[#6B7280] leading-tight">Aktif di katalog UMKM</p>
        </div>
      </div>

      {/* Row 2: Role Distribution (Span 8) & Top Categories (Span 4) */}
      <div className="grid grid-cols-12 gap-6">
        {/* User Role Distribution Card */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-xl border border-[#E5E7EB] shadow-xs p-6">
          <div className="flex justify-between items-center mb-6 border-b border-[#E5E7EB] pb-4">
            <h3 className="font-sora text-sm font-bold text-[#111111]">DISTRIBUSI PERAN PENGGUNA</h3>
            <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">DEMOGRAFI AKTIF</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { role: 'MERCHANT', count: users.filter((u) => u.role === 'MERCHANT').length, desc: 'Penjual & Mitra Toko', barColor: 'bg-[#f59e0b]', badgeText: 'text-[#b45309]', badgeBg: 'bg-[#fffbeb]' },
              { role: 'AFFILIATE', count: users.filter((u) => u.role === 'AFFILIATE').length, desc: 'Pemasar Jaringan', barColor: 'bg-[#a855f7]', badgeText: 'text-[#7e22ce]', badgeBg: 'bg-[#faf5ff]' },
              { role: 'CUSTOMER', count: users.filter((u) => u.role === 'CUSTOMER').length, desc: 'Pembeli & LMS Learner', barColor: 'bg-[#3b82f6]', badgeText: 'text-[#1d4ed8]', badgeBg: 'bg-[#eff6ff]' }
            ].map((item, idx) => {
              const pct = Math.round((item.count / (totalUsers || 1)) * 100) || 0
              return (
                <div key={idx} className="p-4 bg-[#f8f9fb] rounded-lg border border-[#E5E7EB]">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider ${item.badgeBg} ${item.badgeText}`}>
                    {item.role}
                  </span>
                  <div className="flex items-end gap-2 mt-3 mb-1">
                    <span className="font-sora text-2xl font-bold text-[#111111]">{item.count}</span>
                    <span className="text-xs text-[#6B7280] pb-1 font-medium">({pct}%)</span>
                  </div>
                  <p className="text-[11px] text-[#6B7280] mb-3">{item.desc}</p>
                  <div className="w-full bg-[#E5E7EB] h-1.5 rounded-full overflow-hidden">
                    <div className={`${item.barColor} h-full rounded-full transition-all duration-300`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top Categories Card */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-xl border border-[#E5E7EB] shadow-xs p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6 border-b border-[#E5E7EB] pb-4">
            <h3 className="font-sora text-sm font-bold text-[#111111]">TOP KATEGORI PRODUK</h3>
            <span className="text-[11px] font-semibold text-[#006e24] uppercase tracking-wider">PROPORSIONAL</span>
          </div>
          <div className="flex-1 flex flex-col justify-between gap-3.5">
            {Array.from(new Set(products.map((p) => p.category || 'LAINNYA'))).slice(0, 5).map((cat) => {
              const count = products.filter((p) => p.category === cat).length
              const pct = Math.round((count / (totalProducts || 1)) * 100) || 0
              return (
                <div key={cat}>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-semibold text-[#111111] uppercase text-[11px]">{cat.replace('_', ' ')}</span>
                    <span className="text-[#6B7280] font-medium text-[11px]">{count} item ({pct}%)</span>
                  </div>
                  <div className="w-full bg-[#f2f4f6] h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Grid 3: Latest Transactions */}
      <div className="bg-white border border-[#e2e8f0] rounded-[var(--radius-brand)] p-6 hover:shadow-md transition-shadow duration-300">
        <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-sora text-sm font-extrabold text-slate-800 uppercase tracking-wider">5 Transaksi Terkini</h3>
            <p className="text-[10px] text-slate-400 mt-1">Status dan mutasi penjualan di Teras UMKM</p>
          </div>
          <Link
            href="/cms_admin/transactions"
            className="px-3.5 py-1.5 border border-slate-100 hover:border-[#0F5132] text-[#0F5132] hover:bg-emerald-50/30 text-[9px] font-bold uppercase tracking-widest rounded-xl transition-all duration-200"
          >
            Semua Transaksi →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[9px] font-mono">
                <th className="pb-3 pl-2">ID Order</th>
                <th className="pb-3">Pembeli</th>
                <th className="pb-3">Tanggal Transaksi</th>
                <th className="pb-3 text-right">Total Nominal</th>
                <th className="pb-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orders.slice(0, 5).map((o) => {
                const buyer = users.find((u) => u.id === o.buyerId)
                return (
                  <tr key={o.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                    <td className="py-3.5 pl-2 font-mono font-bold text-[#0F5132]">{o.id}</td>
                    <td className="py-3.5">
                      <p className="font-bold text-slate-800">{buyer?.name || 'Masyarakat/Customer'}</p>
                      <p className="text-[9px] font-mono text-slate-400">{buyer?.email || o.buyerId}</p>
                    </td>
                    <td className="py-3.5 text-slate-500 font-mono">
                      {new Date(o.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3.5 text-right font-mono font-bold text-slate-800">
                      Rp {o.totalAmount.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 text-center">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold uppercase text-[8px] tracking-widest font-mono">
                        {o.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
