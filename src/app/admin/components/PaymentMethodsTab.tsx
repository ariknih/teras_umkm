'use client'

import React, { useState, useEffect, useTransition } from 'react'

interface PaymentMethod {
  id: string
  type: 'BANK' | 'QRIS' | string
  providerName: string
  accountName?: string
  accountNumber?: string
  qrImageUrl?: string
  qrRawString?: string
  isActive: boolean
  createdAt: string
}

export default function PaymentMethodsTab() {
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null)
  const [formType, setFormType] = useState<'BANK' | 'QRIS'>('BANK')
  const [searchQuery, setSearchQuery] = useState('')
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  
  const [formData, setFormData] = useState({
    providerName: '',
    accountName: '',
    accountNumber: '',
    qrImageUrl: '',
    qrRawString: '',
    isActive: true
  })

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type })
    setTimeout(() => setToastMessage(null), 3000)
  }

  const fetchMethods = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/payment-methods')
      if (res.ok) {
        const data = await res.json()
        setMethods(data)
      }
    } catch (e) {
      console.error(e)
      showToast('Gagal memuat daftar metode pembayaran', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMethods()
  }, [])

  const openCreateModal = () => {
    setEditingMethod(null)
    setFormType('BANK')
    setFormData({
      providerName: '',
      accountName: '',
      accountNumber: '',
      qrImageUrl: '',
      qrRawString: '',
      isActive: true
    })
    setIsModalOpen(true)
  }

  const openEditModal = (method: PaymentMethod) => {
    setEditingMethod(method)
    setFormType((method.type as 'BANK' | 'QRIS') || 'BANK')
    setFormData({
      providerName: method.providerName || '',
      accountName: method.accountName || '',
      accountNumber: method.accountNumber || '',
      qrImageUrl: method.qrImageUrl || '',
      qrRawString: method.qrRawString || '',
      isActive: method.isActive ?? true
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      try {
        const isEdit = !!editingMethod
        const url = isEdit ? `/api/admin/payment-methods/${editingMethod.id}` : '/api/admin/payment-methods'
        const method = isEdit ? 'PUT' : 'POST'

        const payload = {
          type: formType,
          providerName: formData.providerName,
          accountName: formData.accountName,
          accountNumber: formData.accountNumber,
          qrImageUrl: formData.qrImageUrl,
          qrRawString: formData.qrRawString,
          isActive: formData.isActive
        }

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if (res.ok) {
          showToast(`Metode pembayaran berhasil ${isEdit ? 'perbarui' : 'ditambahkan'}`)
          setIsModalOpen(false)
          setEditingMethod(null)
          fetchMethods()
        } else {
          const errData = await res.json().catch(() => ({}))
          showToast(errData.error || `Gagal ${isEdit ? 'memperbarui' : 'menambahkan'} metode pembayaran`, 'error')
        }
      } catch (err) {
        showToast('Terjadi kesalahan koneksi server', 'error')
      }
    })
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/payment-methods/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: !currentStatus })
        })
        if (res.ok) {
          showToast(`Status metode pembayaran berhasil di${!currentStatus ? 'aktifkan' : 'nonaktifkan'}`)
          fetchMethods()
        } else {
          showToast('Gagal mengubah status', 'error')
        }
      } catch (err) {
        showToast('Terjadi kesalahan', 'error')
      }
    })
  }

  const handleDelete = async (id: string, providerName: string) => {
    if (!confirm(`Anda yakin ingin menghapus metode pembayaran "${providerName}" secara permanen?`)) return
    
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/payment-methods/${id}`, {
          method: 'DELETE'
        })
        if (res.ok) {
          showToast(`Metode pembayaran "${providerName}" berhasil dihapus`)
          fetchMethods()
        } else {
          showToast('Gagal menghapus metode pembayaran', 'error')
        }
      } catch (err) {
        showToast('Terjadi kesalahan', 'error')
      }
    })
  }

  const filteredMethods = methods.filter(m => {
    const q = searchQuery.toLowerCase()
    return (
      m.providerName.toLowerCase().includes(q) ||
      (m.accountName && m.accountName.toLowerCase().includes(q)) ||
      (m.accountNumber && m.accountNumber.toLowerCase().includes(q)) ||
      m.type.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-xs font-bold flex items-center gap-2 transition-all border ${
          toastMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          <span>{toastMessage.type === 'success' ? '✓' : '⚠️'}</span>
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Kelola Metode Pembayaran</h2>
          <p className="text-sm text-slate-500 mt-1">Atur opsi rekening bank manual dan QRIS untuk checkout pengguna (Full CRUD).</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-[#16A34A] hover:bg-[#15803D] text-white font-bold py-2.5 px-5 rounded-xl transition-colors inline-flex items-center gap-2 text-sm shadow-sm cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Tambah Metode
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Metode</p>
          <p className="text-2xl font-extrabold text-slate-800 mt-1">{methods.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Aktif</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{methods.filter(m => m.isActive).length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nonaktif</p>
          <p className="text-2xl font-extrabold text-slate-500 mt-1">{methods.filter(m => !m.isActive).length}</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">
        <svg className="w-4 h-4 text-slate-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Cari bank, nomor rekening, atau nama pemegang rekening..."
          className="w-full text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-xs text-slate-400 hover:text-slate-600 font-bold ml-2">
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-4 px-6 font-bold text-xs text-slate-500 uppercase tracking-wider">Tipe</th>
                <th className="py-4 px-6 font-bold text-xs text-slate-500 uppercase tracking-wider">Penyedia / Nama Bank</th>
                <th className="py-4 px-6 font-bold text-xs text-slate-500 uppercase tracking-wider">Detail Rekening / QRIS</th>
                <th className="py-4 px-6 font-bold text-xs text-slate-500 uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 font-bold text-xs text-slate-500 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-8 h-8 animate-spin text-[#16A34A]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      <span className="text-sm">Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredMethods.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <span className="text-4xl">💳</span>
                      <p className="text-sm text-slate-500 font-medium">
                        {searchQuery ? 'Tidak ada metode pembayaran yang cocok dengan pencarian.' : 'Belum ada metode pembayaran terdaftar.'}
                      </p>
                      <button
                        onClick={openCreateModal}
                        className="mt-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold py-2 px-4 rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        + Tambah Sekarang
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMethods.map(method => (
                  <tr key={method.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${method.type === 'BANK' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {method.type === 'BANK' ? '🏦 Bank' : '📱 QRIS'}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-700 text-sm">
                      {method.providerName}
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600">
                      {method.type === 'BANK' ? (
                        <div>
                          <p className="font-mono font-bold text-slate-800">{method.accountNumber || '-'}</p>
                          <p className="text-xs text-slate-400">a.n {method.accountName || '-'}</p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <div className="flex gap-2">
                            {method.qrImageUrl ? <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[10px] font-bold">📸 Gambar</span> : <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-400 text-[10px] font-bold">Tanpa Gambar</span>}
                            {method.qrRawString ? <span className="inline-flex items-center px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 text-[10px] font-bold">⚡ Dinamis</span> : <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-400 text-[10px] font-bold">Statis</span>}
                          </div>
                          {method.qrImageUrl && <p className="text-[10px] text-slate-400 truncate max-w-xs">{method.qrImageUrl}</p>}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleToggleStatus(method.id, method.isActive)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${method.isActive ? 'bg-[#16A34A]' : 'bg-slate-300'}`}
                        title={method.isActive ? 'Klik untuk menonaktifkan' : 'Klik untuk mengaktifkan'}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${method.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(method)}
                        className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-bold text-xs transition-colors px-3 py-1.5 rounded-lg cursor-pointer inline-flex items-center gap-1"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(method.id, method.providerName)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 font-bold text-xs transition-colors px-3 py-1.5 rounded-lg cursor-pointer inline-flex items-center gap-1"
                      >
                        🗑️ Hapus
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal CRUD (Create & Update) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                {editingMethod ? 'Edit Metode Pembayaran' : 'Tambah Metode Pembayaran'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer text-lg">✕</button>
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setFormType('BANK')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${formType === 'BANK' ? 'bg-white text-[#16A34A] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                🏦 Transfer Bank
              </button>
              <button
                type="button"
                onClick={() => setFormType('QRIS')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${formType === 'QRIS' ? 'bg-white text-[#16A34A] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                📱 QRIS
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {formType === 'BANK' ? (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nama Bank (Misal: BCA, Mandiri, BRI)</label>
                    <input
                      required
                      type="text"
                      value={formData.providerName}
                      onChange={e => setFormData({ ...formData, providerName: e.target.value })}
                      placeholder="BCA"
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nomor Rekening</label>
                    <input
                      required
                      type="text"
                      value={formData.accountNumber}
                      onChange={e => setFormData({ ...formData, accountNumber: e.target.value })}
                      placeholder="1234567890"
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-mono focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nama Pemilik Rekening</label>
                    <input
                      required
                      type="text"
                      value={formData.accountName}
                      onChange={e => setFormData({ ...formData, accountName: e.target.value })}
                      placeholder="PT Saloka Indonesia"
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nama QRIS / Penyedia (Misal: QRIS Saloka UMKM)</label>
                    <input
                      required
                      type="text"
                      value={formData.providerName}
                      onChange={e => setFormData({ ...formData, providerName: e.target.value })}
                      placeholder="QRIS Saloka"
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">URL Gambar QRIS Statis (Opsional)</label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={formData.qrImageUrl}
                      onChange={e => setFormData({ ...formData, qrImageUrl: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Teks/String QRIS Dinamis (Opsional)</label>
                    <textarea
                      placeholder="00020101021126670016ID.CO.QRIS.WWW..."
                      value={formData.qrRawString}
                      onChange={e => setFormData({ ...formData, qrRawString: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 h-24 focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Jika diisi, QRIS ini bisa menjadi Dinamis di halaman checkout.</p>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <span className="text-slate-600 font-medium">Status Aktif:</span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${formData.isActive ? 'bg-[#16A34A]' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${formData.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2.5 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? (editingMethod ? 'Memperbarui...' : 'Menyimpan...') : (editingMethod ? 'Perbarui' : 'Simpan')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
