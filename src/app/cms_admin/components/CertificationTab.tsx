'use client'

import { useState } from 'react'

export default function CertificationTab({ users }: { users: any[] }) {
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<any>(null)

  const certUsers = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    return matchSearch && u.level >= 3
  })

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#e2e8f0] p-5 rounded-[var(--radius-brand)] shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-grow">
          <h3 className="font-sora text-xs font-bold text-[#0F5132] uppercase tracking-wider mb-1">Generate Sertifikat Level Up</h3>
          <p className="text-[11px] text-[#64748b] mb-3">Pilih user bisnis yang telah mencapai minimal Level 3 untuk mengunduh / generate sertifikat resmi mereka secara otomatis.</p>
          <input
            type="text"
            placeholder="Cari user (e.g. Kala Sourdough, Herba, dll)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-4 py-2.5 text-xs text-slate-850 placeholder-[#94a3b8] focus:outline-none focus:border-[#0F5132]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white border border-[#e2e8f0] rounded-[var(--radius-brand)] overflow-hidden shadow-sm h-[420px] overflow-y-auto">
          <div className="px-4 py-3 bg-[#f8f9fa] border-b border-[#e2e8f0] text-[10px] font-bold text-[#64748b] uppercase tracking-wider sticky top-0 z-10">
            Pengguna Level 3+ Terkualifikasi
          </div>
          <div className="divide-y divide-slate-100">
            {certUsers.map((u) => (
              <div
                key={u.id}
                onClick={() => setSelectedUser(u)}
                className={`p-3.5 transition-all duration-150 cursor-pointer flex justify-between items-center ${
                  selectedUser?.id === u.id ? 'bg-[#E8F5E9] border-l-4 border-[#0F5132]' : 'hover:bg-slate-50'
                }`}
              >
                <div>
                  <p className="text-xs font-bold text-slate-800">{u.name}</p>
                  <p className="text-[9px] text-[#64748b]">{u.email}</p>
                </div>
                <div className="text-right">
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-[#0F5132]/10 border border-[#0F5132]/20 text-[#0F5132] uppercase">
                    Lv.{u.level}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white border border-[#e2e8f0] rounded-[var(--radius-brand)] p-6 shadow-sm flex flex-col items-center">
          {selectedUser ? (
            <div className="w-full flex flex-col items-center">
              <div className="w-full border-4 border-double border-[#0F5132]/60 bg-black text-[#e2e8f0] rounded-[var(--radius-brand)] p-8 shadow-2xl max-w-lg aspect-[1.414/1] relative overflow-hidden flex flex-col justify-between items-center text-center">
                <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-[#0F5132]/40 pointer-events-none" />
                <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-[#0F5132]/40 pointer-events-none" />
                <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-[#0F5132]/40 pointer-events-none" />
                <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-[#0F5132]/40 pointer-events-none" />

                <div>
                  <h4 className="font-sora text-xs font-bold text-[#0F5132] tracking-[0.25em] uppercase leading-none mt-2">Sertifikat Penghargaan</h4>
                  <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-[#0F5132] to-transparent mx-auto mt-2" />
                </div>

                <div className="my-auto space-y-3">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest leading-none">Diberikan secara terhormat kepada:</p>
                  <h3 className="font-sora text-lg md:text-xl font-bold text-white tracking-tight uppercase border-b border-[#2b2c34] pb-2 px-6">{selectedUser.name}</h3>
                  <p className="text-[10px] text-slate-400 leading-relaxed max-w-sm mx-auto">
                    Atas dedikasi luar biasa dalam mengembangkan ekosistem UMKM Digital Indonesia dan berhasil mencapai tingkat keanggotaan bisnis elit
                  </p>
                  <p className="font-sora text-[#0F5132] font-bold text-xs uppercase tracking-widest">
                    Level {selectedUser.level} - {selectedUser.membershipLevel} Elite
                  </p>
                </div>

                <div className="w-full flex justify-between items-end border-t border-slate-800 pt-4 text-[9px] text-slate-400">
                  <div className="text-left font-mono">
                    <span className="block font-sans">No. Serial Sertifikat:</span>
                    <span className="text-[#0F5132] uppercase">TR-{selectedUser.id.toUpperCase()}-{selectedUser.level}</span>
                  </div>
                  <div className="text-right">
                    <span className="block italic text-white font-mono font-bold">TERAS_OFFICIAL_STAMP</span>
                    <span className="block mt-0.5">Tanggal: {new Date().toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => alert(`Unduhan Sertifikat untuk "${selectedUser.name}" berhasil diproses!`)}
                className="mt-6 px-6 py-2.5 bg-primary hover:bg-[#259a3f] text-white text-xs font-bold uppercase tracking-widest rounded-[var(--radius-brand)] shadow-lg cursor-pointer transition-colors"
              >
                Cetak / Download PDF Sertifikat
              </button>
            </div>
          ) : (
            <div className="h-[300px] flex flex-col items-center justify-center text-center p-6 text-[#64748b] italic">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mb-2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
              <span>Pilih pengguna di daftar sebelah kiri untuk melihat preview sertifikat level up otomatis.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
