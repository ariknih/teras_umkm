'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createAdminAction, updateAdminAction, deleteAdminAction } from '@/app/actions/admin'
import { MENUS } from '../nav.config'
import { useToast, Toast } from './Toast'

const ALL_ADMIN_PERMISSIONS = MENUS.map((m) => ({ key: m.key, label: m.label, desc: m.desc }))

type Props = {
  initialAdmins: any[]
  currentUser: any
}

export default function AdminsTab({ initialAdmins, currentUser }: Props) {
  const router = useRouter()
  const [admins, setAdmins] = useState(initialAdmins)
  const [isPending, startTransition] = useTransition()
  const { toast, showToast } = useToast()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<any | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSuper, setIsSuper] = useState(false)
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(ALL_ADMIN_PERMISSIONS.map((p) => p.key))

  const openCreateModal = () => {
    setEditingAdmin(null)
    setName('')
    setEmail('')
    setPassword('')
    setIsSuper(false)
    setSelectedPermissions(ALL_ADMIN_PERMISSIONS.map((p) => p.key))
    setIsModalOpen(true)
  }

  const openEditModal = (adm: any) => {
    setEditingAdmin(adm)
    setName(adm.name || '')
    setEmail(adm.email || '')
    setPassword('')
    setIsSuper(!!adm.isSuperAdmin)
    let perms: string[] = []
    try {
      perms = adm.adminPermissions ? JSON.parse(adm.adminPermissions) : ALL_ADMIN_PERMISSIONS.map((p) => p.key)
    } catch {
      perms = ALL_ADMIN_PERMISSIONS.map((p) => p.key)
    }
    setSelectedPermissions(Array.isArray(perms) && perms.length > 0 ? perms : ALL_ADMIN_PERMISSIONS.map((p) => p.key))
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email) {
      alert('Nama dan email wajib diisi.')
      return
    }
    if (!editingAdmin && !password) {
      alert('Kata sandi wajib diisi untuk admin baru.')
      return
    }

    const formData = new FormData()
    if (editingAdmin) formData.append('id', editingAdmin.id)
    formData.append('name', name)
    formData.append('email', email)
    if (password) formData.append('password', password)
    formData.append('isSuperAdmin', String(isSuper))
    formData.append('adminPermissions', JSON.stringify(selectedPermissions))

    startTransition(async () => {
      const res = editingAdmin ? await updateAdminAction(formData) : await createAdminAction(formData)
      if (res.success) {
        showToast(editingAdmin ? 'Data admin dan hak akses berhasil diperbarui.' : 'Admin baru berhasil ditambahkan.')
        if (editingAdmin) {
          setAdmins((prev) => prev.map((a) => (a.id === editingAdmin.id ? { ...a, ...res.admin, isSuperAdmin: isSuper, adminPermissions: JSON.stringify(selectedPermissions) } : a)))
        } else {
          setAdmins((prev) => [...prev, res.admin])
        }
        setIsModalOpen(false)
        setEditingAdmin(null)
        router.refresh()
      } else {
        showToast(res.error || 'Gagal menyimpan data admin.', 'error')
      }
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus admin ini?')) return
    startTransition(async () => {
      const res = await deleteAdminAction(id)
      if (res.success) {
        showToast('Admin berhasil dihapus.')
        setAdmins((prev) => prev.filter((x) => x.id !== id))
        router.refresh()
      } else {
        showToast(res.error || 'Gagal menghapus admin.', 'error')
      }
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-250">
      <Toast toast={toast} />

      <div className="bg-white border border-[#e2e8f0] p-6 rounded-[var(--radius-brand)] shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="font-sora text-sm font-bold text-slate-800 uppercase tracking-wider">Kelola Akun Administrator & Hak Akses (RBAC)</h3>
            <p className="text-xs text-slate-500 mt-1">Atur hak akses staf administrator. Menu sidebar hanya akan muncul jika staf memiliki izin pada modul terkait.</p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-[#0F5132] hover:bg-[#0a3a24] text-white text-xs font-bold uppercase tracking-widest rounded transition-colors shadow flex items-center gap-1.5 cursor-pointer border-none outline-none"
          >
            <span>+ Tambah Admin Baru</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 border-b border-[#e2e8f0] text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <th className="px-4 py-3">Nama Admin</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Tipe Otoritas</th>
                <th className="px-4 py-3">Modul yang Dapat Diakses</th>
                <th className="px-4 py-3">Tanggal Dibuat</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {admins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-slate-400 italic">
                    Belum ada administrator terdaftar.
                  </td>
                </tr>
              ) : (
                admins.map((adm: any) => {
                  let perms: string[] = []
                  try {
                    perms = adm.adminPermissions ? JSON.parse(adm.adminPermissions) : []
                  } catch {
                    perms = []
                  }
                  const admIsSuper = !!adm.isSuperAdmin

                  return (
                    <tr key={adm.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-800">{adm.name}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">{adm.email}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase border tracking-wider ${
                            admIsSuper ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {admIsSuper ? '⭐ Superadmin' : '👤 Admin Staff'}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        {admIsSuper ? (
                          <span className="text-[11px] font-semibold text-purple-700">Semua Fitur & Modul (Full Access)</span>
                        ) : (
                          <span className="text-[11px] text-slate-600 truncate block">
                            {perms.length > 0 ? `${perms.length} Modul: ${perms.slice(0, 3).join(', ')}${perms.length > 3 ? ` +${perms.length - 3} lainnya` : ''}` : 'Tidak ada izin modul'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(adm.createdAt || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(adm)}
                            className="px-3 py-1.5 bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#006E24] border border-[#A5D6A7] rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            ⚙️ Edit Hak Akses
                          </button>
                          {adm.id === currentUser.id ? (
                            <span className="text-[10px] text-slate-400 italic px-2">Akun Anda</span>
                          ) : (
                            <button
                              onClick={() => handleDelete(adm.id)}
                              className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                            >
                              Hapus
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-[#0F5132]/25 rounded-[var(--radius-brand)] max-w-2xl w-full p-6 sm:p-7 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200 my-8 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 shrink-0">
              <div>
                <h3 className="font-sora text-sm sm:text-base font-bold text-[#0F5132] uppercase tracking-wider">
                  {editingAdmin ? '⚙️ Edit Akun & Hak Akses Admin' : '+ Tambah Administrator Baru'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {editingAdmin ? `Mengatur hak akses dan kredensial untuk ${editingAdmin.name}` : 'Buat akun staf admin baru dan tentukan izin modulnya.'}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false)
                  setEditingAdmin(null)
                }}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs overflow-y-auto pr-1 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Budi Santoso"
                    className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2.5 text-slate-800 placeholder-[#94a3b8] outline-none focus:border-[#0F5132]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Alamat Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. budi.admin@saloka.id"
                    className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2.5 text-slate-800 placeholder-[#94a3b8] outline-none focus:border-[#0F5132]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">
                  Kata Sandi (Password) {editingAdmin && <span className="text-slate-400 font-normal lowercase">(kosongkan jika tidak ingin mengubah)</span>}
                </label>
                <input
                  type="password"
                  required={!editingAdmin}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editingAdmin ? 'Masukkan sandi baru jika ingin diubah' : 'Minimal 6 karakter'}
                  className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2.5 text-slate-800 placeholder-[#94a3b8] outline-none focus:border-[#0F5132]"
                />
              </div>

              {/* Super Admin Switcher */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isSuperModal"
                    checked={isSuper}
                    onChange={(e) => setIsSuper(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0F5132] focus:ring-[#0F5132] cursor-pointer"
                  />
                  <label htmlFor="isSuperModal" className="text-xs text-slate-800 font-bold cursor-pointer flex items-center gap-1.5">
                    <span>⭐ Jadikan Superadmin (Akses Penuh Semua Modul & Distribusi Koin)</span>
                  </label>
                </div>
                <p className="text-[11px] text-slate-500 pl-7">
                  Superadmin otomatis memiliki akses ke semua modul dan dapat mengelola staf admin lainnya.
                </p>
              </div>

              {/* Module Permission Checklist (RBAC) */}
              {!isSuper ? (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-800">
                        Hak Akses Modul Sidebar ({selectedPermissions.length} dari {ALL_ADMIN_PERMISSIONS.length} modul aktif)
                      </label>
                      <p className="text-[10px] text-slate-500">
                        Fitur yang tidak dicentang akan otomatis disembunyikan dari menu sidebar admin ini.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedPermissions(ALL_ADMIN_PERMISSIONS.map((p) => p.key))}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-[#006E24] text-[10px] font-bold rounded cursor-pointer border border-emerald-200"
                      >
                        Pilih Semua
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedPermissions([])}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold rounded cursor-pointer border border-slate-200"
                      >
                        Hapus Semua
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto p-1 border border-slate-200 rounded-xl bg-slate-50/50">
                    {ALL_ADMIN_PERMISSIONS.map((perm) => {
                      const isChecked = selectedPermissions.includes(perm.key)
                      return (
                        <label
                          key={perm.key}
                          className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                            isChecked ? 'bg-emerald-50/70 border-emerald-300 text-slate-900 shadow-xs' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100/60'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPermissions((prev) => [...prev, perm.key])
                              } else {
                                setSelectedPermissions((prev) => prev.filter((k) => k !== perm.key))
                              }
                            }}
                            className="mt-0.5 w-4 h-4 rounded text-[#006E24] focus:ring-[#006E24] cursor-pointer"
                          />
                          <div className="space-y-0.5">
                            <span className="text-[11px] font-bold block leading-snug">{perm.label}</span>
                            <span className="text-[9px] text-slate-500 block leading-tight">{perm.desc}</span>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800 text-xs">
                  <span className="text-base">🛡️</span>
                  <span className="font-semibold">Akun Superadmin memiliki akses otomatis ke seluruh modul sidebar tanpa batasan.</span>
                </div>
              )}

              <div className="pt-4 flex gap-3 shrink-0 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false)
                    setEditingAdmin(null)
                  }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-[var(--radius-brand)] uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2.5 bg-[#006E24] hover:bg-[#084e1b] text-white font-bold rounded-[var(--radius-brand)] uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {isPending ? 'Menyimpan...' : editingAdmin ? 'Simpan Perubahan Hak Akses' : 'Tambah Administrator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
