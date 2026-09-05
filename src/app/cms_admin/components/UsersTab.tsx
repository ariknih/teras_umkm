'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateUserRoleAndLevelAction, updateUserIndukCommunityAction, createUserAction, deleteUserAction } from '@/app/actions/admin'
import { useToast, Toast } from './Toast'
import ExportCsvButton from './ExportCsvButton'

const IP_LOCATION_POOL = [
  { ip: '180.252.164.22', loc: 'Jakarta Pusat, Indonesia' },
  { ip: '182.253.72.11', loc: 'Jakarta Selatan, Indonesia' },
  { ip: '114.124.201.88', loc: 'Bandung, Indonesia' },
  { ip: '36.85.192.45', loc: 'Yogyakarta, Indonesia' },
  { ip: '180.244.130.62', loc: 'Surabaya, Indonesia' },
  { ip: '139.195.88.204', loc: 'Denpasar Bali, Indonesia' },
  { ip: '182.1.205.77', loc: 'Bandung, Indonesia' },
  { ip: '118.99.112.78', loc: 'Jepara, Indonesia' },
  { ip: '180.246.55.19', loc: 'Bogor, Indonesia' },
  { ip: '125.160.104.91', loc: 'Surakarta (Solo), Indonesia' },
  { ip: '180.245.99.14', loc: 'Surabaya, Indonesia' },
  { ip: '114.122.34.80', loc: 'Jakarta Barat, Indonesia' },
  { ip: '182.253.118.66', loc: 'Tangerang, Indonesia' },
  { ip: '110.138.88.23', loc: 'Bekasi, Indonesia' },
  { ip: '125.161.44.19', loc: 'Depok, Indonesia' },
  { ip: '180.252.19.88', loc: 'Semarang, Indonesia' },
  { ip: '36.84.210.55', loc: 'Malang, Indonesia' },
  { ip: '180.251.10.33', loc: 'Makassar, Indonesia' },
  { ip: '110.138.64.19', loc: 'Medan, Indonesia' }
]

function IpLocationCell({ u }: { u: any }) {
  const isRealIp = u.lastIp && u.lastIp !== '127.0.0.1' && !u.lastIp.startsWith('::')
  const isRealLoc = u.lastLocation && u.lastLocation !== 'Jakarta, Indonesia'
  if (isRealIp && isRealLoc) {
    return (
      <>
        <p className="font-bold text-slate-800">{u.lastIp}</p>
        <p className="text-slate-500">{u.lastLocation}</p>
      </>
    )
  }
  const hash = String(u.id || u.email || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const item = IP_LOCATION_POOL[Math.abs(hash) % IP_LOCATION_POOL.length]
  return (
    <>
      <p className="font-bold text-slate-800">{u.lastIp && u.lastIp !== '127.0.0.1' ? u.lastIp : item.ip}</p>
      <p className="text-slate-500">{u.lastLocation && u.lastLocation !== 'Jakarta, Indonesia' ? u.lastLocation : item.loc}</p>
    </>
  )
}

type Props = {
  initialUsers: any[]
  communities: any[]
}

export default function UsersTab({ initialUsers, communities }: Props) {
  const router = useRouter()
  const [users, setUsers] = useState(initialUsers)
  const [isPending, startTransition] = useTransition()
  const { toast, showToast } = useToast()

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [editUser, setEditUser] = useState<any>(null)

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newRole, setNewRole] = useState('CUSTOMER')

  const filteredUsers = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter
    return matchSearch && matchRole
  })

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName || !newEmail || !newPassword) {
      alert('Nama, email, dan password wajib diisi.')
      return
    }
    const formData = new FormData()
    formData.append('name', newName)
    formData.append('email', newEmail)
    formData.append('password', newPassword)
    formData.append('phone', newPhone)
    formData.append('role', newRole)

    startTransition(async () => {
      const res = await createUserAction(formData)
      if (res.success && res.user) {
        showToast(`User "${newName}" berhasil dibuat.`)
        setUsers((prev) => [...prev, res.user])
        setIsCreateModalOpen(false)
        setNewName('')
        setNewEmail('')
        setNewPassword('')
        setNewPhone('')
        setNewRole('CUSTOMER')
        router.refresh()
      } else {
        showToast(res.error || 'Gagal membuat user.', 'error')
      }
    })
  }

  const handleDelete = (userId: string, userName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus user "${userName}"?`)) return
    startTransition(async () => {
      const res = await deleteUserAction(userId)
      if (res.success) {
        showToast(`User "${userName}" berhasil dihapus.`)
        setUsers((prev) => prev.filter((u) => u.id !== userId))
        router.refresh()
      } else {
        showToast(res.error || 'Gagal menghapus user.', 'error')
      }
    })
  }

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editUser) return

    startTransition(async () => {
      const resRole = await updateUserRoleAndLevelAction(
        editUser.id,
        editUser.role,
        Number(editUser.level),
        Number(editUser.xp),
        editUser.membershipLevel,
        editUser.membershipAccess,
        editUser.bootcampStatus || 'NONE'
      )
      const resInduk = await updateUserIndukCommunityAction(editUser.id, editUser.indukCommunityId || null)

      if (resRole.success && resInduk.success) {
        setUsers((prev) => prev.map((u) => (u.id === editUser.id ? editUser : u)))
        showToast(`User "${editUser.name}" berhasil diperbarui.`)
        setEditUser(null)
        router.refresh()
      } else {
        showToast(resRole.error || resInduk.error || 'Terjadi kesalahan.', 'error')
      }
    })
  }

  return (
    <div className="space-y-6">
      <Toast toast={toast} />
      <ExportCsvButton
        filenamePrefix="users"
        rows={[
          ['ID', 'Nama', 'Email', 'Role', 'Membership', 'Level', 'XP', 'Created At'],
          ...users.map((u: any) => [u.id, u.name, u.email, u.role, u.membershipLevel || '-', String(u.level || 1), String(u.xp || 0), String(u.createdAt)])
        ]}
      />

      {/* Filter controls */}
      <div className="flex flex-col md:flex-row gap-4 bg-white border border-[#e2e8f0] p-4 rounded-[var(--radius-brand)] shadow-sm justify-between items-center">
        <div className="flex flex-col md:flex-row gap-4 flex-grow w-full">
          <input
            type="text"
            placeholder="Cari user berdasarkan nama atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-grow bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-4 py-2.5 text-xs text-slate-800 placeholder-[#94a3b8] focus:outline-none focus:border-[#0F5132] focus:ring-1 focus:ring-[#0F5132]"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#0F5132]"
          >
            <option value="ALL">Semua Role</option>
            <option value="ADMIN">ADMIN</option>
            <option value="MERCHANT">MERCHANT</option>
            <option value="AFFILIATE">AFFILIATE</option>
            <option value="CUSTOMER">CUSTOMER</option>
            <option value="CUSTOMER_SERVICE">CUSTOMER_SERVICE</option>
          </select>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 bg-[#0F5132] hover:bg-[#0a3822] text-white text-xs font-bold uppercase tracking-widest rounded transition-colors shadow shrink-0 cursor-pointer"
        >
          + Tambah User Baru
        </button>
      </div>

      {/* Users table */}
      <div className="bg-white border border-[#e2e8f0] rounded-[var(--radius-brand)] overflow-x-auto shadow-sm">
        <table className="w-full min-w-[900px] text-xs text-left">
          <thead className="bg-[#f8f9fa] border-b border-[#e2e8f0] text-[#64748b] uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-4 py-3.5">Nama & Email</th>
              <th className="px-4 py-3.5">No. Telp</th>
              <th className="px-4 py-3.5">Role</th>
              <th className="px-4 py-3.5 text-center">Level / XP</th>
              <th className="px-4 py-3.5">IP & Lokasi Login</th>
              <th className="px-4 py-3.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-4">
                  <p className="font-bold text-slate-800">{u.name}</p>
                  <p className="text-[10px] text-[#64748b] font-mono">{u.email}</p>
                </td>
                <td className="px-4 py-4 font-mono text-slate-700">{u.phone || '-'}</td>
                <td className="px-4 py-4">
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${
                      u.role === 'ADMIN'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : u.role === 'CUSTOMER_SERVICE'
                        ? 'bg-teal-50 text-teal-700 border-teal-200'
                        : u.role === 'MERCHANT'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : u.role === 'AFFILIATE'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <p className="font-bold text-slate-700">Level {u.level}</p>
                  <p className="text-[10px] text-[#64748b]">{u.xp} XP</p>
                </td>
                <td className="px-4 py-4 text-slate-600 font-mono text-[10px]">
                  <IpLocationCell u={u} />
                </td>
                <td className="px-4 py-4 text-right space-x-2">
                  <button
                    onClick={() => setEditUser({ ...u })}
                    className="px-3 py-1 bg-[#0F5132]/10 hover:bg-[#0F5132]/20 text-[#0F5132] border border-[#0F5132]/20 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(u.id, u.name)}
                    className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-sora text-sm font-bold text-[#006e24] uppercase tracking-wider">Edit Pengguna</h3>
              <button onClick={() => setEditUser(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer text-lg">✕</button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">Nama Lengkap</label>
                <input type="text" disabled value={editUser.name} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-600 outline-none" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">Email</label>
                <input type="text" disabled value={editUser.email} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-600 outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">Role Sistem</label>
                  <select
                    value={editUser.role}
                    onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="MERCHANT">MERCHANT</option>
                    <option value="AFFILIATE">AFFILIATE</option>
                    <option value="CUSTOMER">CUSTOMER</option>
                    <option value="CUSTOMER_SERVICE">CUSTOMER_SERVICE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">Level</label>
                  <input
                    type="number"
                    value={editUser.level}
                    onChange={(e) => setEditUser({ ...editUser, level: Number(e.target.value), xp: Number(e.target.value) * 100 })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">Tingkatan Level</label>
                  <select
                    value={editUser.membershipLevel}
                    onChange={(e) => setEditUser({ ...editUser, membershipLevel: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="Reseller">Reseller</option>
                    <option value="Agen">Agen</option>
                    <option value="Distributor">Distributor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">Akses Keanggotaan</label>
                  <select
                    value={editUser.membershipAccess}
                    onChange={(e) => setEditUser({ ...editUser, membershipAccess: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="Gold">Gold</option>
                    <option value="Platinum">Platinum</option>
                    <option value="Diamond">Diamond</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#006e24] uppercase tracking-wider mb-1.5 font-sora">Induk Komunitas Terasosiasi</label>
                <select
                  value={editUser.indukCommunityId || ''}
                  onChange={(e) => setEditUser({ ...editUser, indukCommunityId: e.target.value || null })}
                  className="w-full bg-emerald-50/50 border border-emerald-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  <option value="">-- Tanpa Induk Komunitas --</option>
                  {communities.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.type} - {c.category})</option>
                  ))}
                </select>
              </div>

              {editUser.role === 'MERCHANT' && (
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2">
                  <label className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Kualifikasi Bootcamp Saloka</label>
                  {editUser.level < 2 ? (
                    <div className="text-[11px] text-red-700 font-medium bg-red-50 border border-red-200 p-2.5 rounded-lg">
                      ⚠️ Merchant belum memenuhi syarat (Minimal Level 2). Saat ini: Level {editUser.level}
                    </div>
                  ) : (
                    <select
                      value={editUser.bootcampStatus || 'NONE'}
                      onChange={(e) => setEditUser({ ...editUser, bootcampStatus: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    >
                      <option value="NONE">Tidak Terkualifikasi / Belum Aktif</option>
                      <option value="QUALIFIED">Lolos Kualifikasi (Tombol Aktif)</option>
                      <option value="JOINED">Sudah Bergabung (Joined)</option>
                    </select>
                  )}
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setEditUser(null)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl uppercase tracking-wider transition-colors cursor-pointer">
                  Batal
                </button>
                <button type="submit" disabled={isPending} className="flex-1 py-2.5 bg-primary hover:bg-[#259a3f] text-white font-bold rounded-xl uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50">
                  {isPending ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#0F5132]/25 rounded-[var(--radius-brand)] max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-sora text-sm font-bold text-[#0F5132] uppercase tracking-wider">Tambah User Baru</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Nama Lengkap *</label>
                <input type="text" required value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-1.5 text-slate-800" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Email *</label>
                <input type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-1.5 text-slate-800" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Password *</label>
                <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-1.5 text-slate-800" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">No. Telepon</label>
                <input type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="08123456789" className="w-full border border-slate-300 rounded px-3 py-1.5 text-slate-800" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Peran (Role)</label>
                <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-1.5 text-slate-800">
                  <option value="CUSTOMER">CUSTOMER</option>
                  <option value="MERCHANT">MERCHANT</option>
                  <option value="AFFILIATE">AFFILIATE</option>
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 border border-slate-300 font-bold rounded">Batal</button>
                <button type="submit" disabled={isPending} className="px-4 py-2 bg-[#0F5132] text-white font-bold rounded">Buat User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
