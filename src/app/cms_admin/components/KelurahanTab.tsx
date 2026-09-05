'use client'

import { useState } from 'react'
import { mockKelurahans } from '@/lib/mock-snackbox'

export default function KelurahanTab() {
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  // Master Kelurahan State
  const [kelurahans, setKelurahans] = useState<any[]>(mockKelurahans || [])
  const [kelurahanSearch, setKelurahanSearch] = useState('')
  const [isKelurahanModalOpen, setIsKelurahanModalOpen] = useState(false)
  const [editingKelurahan, setEditingKelurahan] = useState<any | null>(null)
  const [kelurahanForm, setKelurahanForm] = useState({
    name: '',
    kecamatan: '',
    kota: '',
    postalCode: ''
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-250">
      {actionSuccess && (
        <div className="mb-6 p-4 rounded-[var(--radius-brand)] bg-green-50 border border-green-200 text-xs text-green-700 font-medium">
          ✅ {actionSuccess}
        </div>
      )}

      {/* Header & Controls */}
      <div className="bg-white border border-[#e2e8f0] p-6 rounded-[var(--radius-brand)] shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#e2e8f0] pb-4 mb-4">
          <div>
            <h3 className="font-sora text-sm font-bold text-slate-800 uppercase tracking-wider text-[#0F5132]">
              Master Kelurahan & Coverage Area Snackbox
            </h3>
            <p className="text-xs text-[#64748b] mt-0.5">
              Kelola wilayah operasional, pemetaan mitra kue lokal, dan jangkauan pengiriman Snackbox Saloka per kelurahan.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingKelurahan(null)
              setKelurahanForm({ name: '', kecamatan: '', kota: 'Jakarta Pusat', postalCode: '' })
              setIsKelurahanModalOpen(true)
            }}
            className="px-4 py-2 bg-[#006E24] hover:bg-[#005a1d] text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-xs border-none flex items-center gap-1.5"
          >
            <span>+ Tambah Kelurahan Baru</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="max-w-md">
          <input
            type="text"
            placeholder="Cari kelurahan, kecamatan, atau kode pos..."
            value={kelurahanSearch}
            onChange={e => setKelurahanSearch(e.target.value)}
            className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-4 py-2.5 text-xs text-slate-800 placeholder-[#94a3b8] focus:outline-none focus:border-[#0F5132]"
          />
        </div>
      </div>

      {/* Kelurahan Table */}
      <div className="bg-white border border-[#e2e8f0] rounded-[var(--radius-brand)] overflow-x-auto shadow-sm">
        <table className="w-full min-w-[850px] text-xs text-left">
          <thead className="bg-[#f8f9fa] border-b border-[#e2e8f0] text-[#64748b] uppercase tracking-wider text-[10px] font-bold">
            <tr>
              <th className="px-5 py-3.5">Nama Kelurahan</th>
              <th className="px-5 py-3.5">Kecamatan & Kota</th>
              <th className="px-5 py-3.5 text-center">Kode Pos</th>
              <th className="px-5 py-3.5 text-center">Mitra Kue Terdaftar</th>
              <th className="px-5 py-3.5 text-center">Status Operasional</th>
              <th className="px-5 py-3.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(() => {
              const filtered = kelurahans.filter(k =>
                k.name.toLowerCase().includes(kelurahanSearch.toLowerCase()) ||
                k.kecamatan.toLowerCase().includes(kelurahanSearch.toLowerCase()) ||
                k.postalCode.includes(kelurahanSearch)
              )

              if (filtered.length === 0) {
                return (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400 italic">
                      Tidak ada kelurahan yang cocok dengan pencarian.
                    </td>
                  </tr>
                )
              }

              return filtered.map(k => (
                <tr key={k.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <span>📍 Kel. {k.name}</span>
                    </p>
                    <span className="text-[10px] font-mono text-slate-400">ID: {k.id}</span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-800">Kec. {k.kecamatan}</p>
                    <p className="text-[11px] text-slate-500">{k.kota}</p>
                  </td>
                  <td className="px-5 py-4 text-center font-mono font-bold text-slate-700">
                    {k.postalCode}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#E8F5E9] text-[#006E24] border border-[#C8E6C9] inline-block">
                      {k.totalSnacksCount || 8} Menu Kue
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                      k.isActive !== false
                        ? 'bg-emerald-50 text-[#006E24] border-[#006E24]/30'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {k.isActive !== false ? 'Aktif (Coverage)' : 'Non-Aktif'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setKelurahans(prev => prev.map(item => item.id === k.id ? { ...item, isActive: item.isActive === false ? true : false } : item))
                          setActionSuccess(`Status operasional Kel. ${k.name} berhasil diperbarui.`)
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold uppercase rounded transition-colors cursor-pointer border border-slate-200"
                      >
                        {k.isActive !== false ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingKelurahan(k)
                          setKelurahanForm({
                            name: k.name,
                            kecamatan: k.kecamatan,
                            kota: k.kota,
                            postalCode: k.postalCode
                          })
                          setIsKelurahanModalOpen(true)
                        }}
                        className="px-2.5 py-1 bg-[#006E24]/10 hover:bg-[#006E24]/20 text-[#006E24] text-[10px] font-bold uppercase rounded transition-colors cursor-pointer border border-[#006E24]/20"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Hapus kelurahan "${k.name}" dari master data?`)) {
                            setKelurahans(prev => prev.filter(item => item.id !== k.id))
                            setActionSuccess(`Kelurahan "${k.name}" berhasil dihapus.`)
                          }
                        }}
                        className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold uppercase rounded transition-colors cursor-pointer border border-red-200"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            })()}
          </tbody>
        </table>
      </div>

      {/* ─── MODAL CREATE / EDIT KELURAHAN ───────────────────────────── */}
      {isKelurahanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#006E24]/30 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-sora text-sm font-bold text-[#006E24] uppercase tracking-wider">
                {editingKelurahan ? 'Edit Data Kelurahan' : 'Tambah Kelurahan Baru'}
              </h3>
              <button onClick={() => setIsKelurahanModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!kelurahanForm.name || !kelurahanForm.kecamatan || !kelurahanForm.postalCode) {
                  alert('Nama, kecamatan, dan kode pos wajib diisi.')
                  return
                }

                if (editingKelurahan) {
                  setKelurahans(prev => prev.map(k => k.id === editingKelurahan.id ? { ...k, ...kelurahanForm } : k))
                  setActionSuccess(`Kelurahan "${kelurahanForm.name}" berhasil diperbarui.`)
                } else {
                  const newId = `kel-${Date.now()}`
                  setKelurahans(prev => [...prev, { id: newId, ...kelurahanForm, totalSnacksCount: 0, isActive: true }])
                  setActionSuccess(`Kelurahan baru "${kelurahanForm.name}" berhasil ditambahkan ke master coverage area.`)
                }
                setIsKelurahanModalOpen(false)
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Nama Kelurahan *</label>
                <input
                  type="text"
                  required
                  value={kelurahanForm.name}
                  onChange={e => setKelurahanForm({ ...kelurahanForm, name: e.target.value })}
                  placeholder="e.g. Menteng, Gondangdia, Gambir"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#006E24]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Kecamatan *</label>
                <input
                  type="text"
                  required
                  value={kelurahanForm.kecamatan}
                  onChange={e => setKelurahanForm({ ...kelurahanForm, kecamatan: e.target.value })}
                  placeholder="e.g. Menteng, Gambir, Sawah Besar"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#006E24]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Kota / Kabupaten *</label>
                  <input
                    type="text"
                    required
                    value={kelurahanForm.kota}
                    onChange={e => setKelurahanForm({ ...kelurahanForm, kota: e.target.value })}
                    placeholder="Jakarta Pusat"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#006E24]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Kode Pos *</label>
                  <input
                    type="text"
                    required
                    value={kelurahanForm.postalCode}
                    onChange={e => setKelurahanForm({ ...kelurahanForm, postalCode: e.target.value })}
                    placeholder="10310"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 outline-none focus:border-[#006E24]"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsKelurahanModalOpen(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#006E24] hover:bg-[#005a1d] text-white font-bold rounded-lg uppercase tracking-wider transition-colors cursor-pointer border-none shadow-xs"
                >
                  {editingKelurahan ? 'Simpan Perubahan' : 'Tambah Kelurahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
