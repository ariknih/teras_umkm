'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getIndukCommunities, createIndukCommunity } from '@/app/actions/community'
import { getCurrentUser } from '@/app/actions/auth'
import { goeyToast } from 'goey-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, 
  Users, 
  MapPin, 
  DollarSign, 
  PlusCircle, 
  Search, 
  Info,
  CheckCircle2, 
  AlertTriangle,
  FileText,
  Upload,
  X,
  Loader2
} from 'lucide-react'

export default function CommunityDirectoryPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [communities, setCommunities] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Form states for creating a community
  const [name, setName] = useState('')
  const [type, setType] = useState<'PERKUMPULAN' | 'KOPERASI'>('PERKUMPULAN')
  const [description, setDescription] = useState('')
  const [aktaNotaris, setAktaNotaris] = useState('')
  const [nomorAhu, setNomorAhu] = useState('')
  const [nomorNpwp, setNomorNpwp] = useState('')
  const [domisili, setDomisili] = useState('')
  const [kontakPj, setKontakPj] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [waGroupLink, setWaGroupLink] = useState('')
  const [joinFee, setJoinFee] = useState('')
  const [monthlyFee, setMonthlyFee] = useState('')

  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)

  const handleFileUpload = async (file: File, type: 'avatar' | 'cover') => {
    const setUploading = type === 'avatar' ? setUploadingAvatar : setUploadingCover
    const setUrl = type === 'avatar' ? setAvatarUrl : setCoverUrl

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'community')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Gagal mengunggah file.')
      }

      const data = await res.json()
      setUrl(data.url)
      goeyToast.success(`Foto ${type === 'avatar' ? 'Logo' : 'Sampul'} berhasil diunggah!`)
    } catch (e: any) {
      console.error(e)
      goeyToast.error(e.message || 'Terjadi kesalahan saat mengunggah file.')
    } finally {
      setUploading(false)
    }
  }

  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function loadData() {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)

      const comms = await getIndukCommunities()
      setCommunities(comms || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!name || !description) {
      setFormError('Nama dan Deskripsi wajib diisi.')
      return
    }

    if (type === 'KOPERASI' && (!joinFee || !monthlyFee)) {
      setFormError('Biaya simpanan pokok dan iuran wajib koperasi wajib diisi.')
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.append('name', name)
      formData.append('type', type)
      formData.append('description', description)
      formData.append('aktaNotaris', aktaNotaris)
      formData.append('nomorAhu', nomorAhu)
      formData.append('nomorNpwp', nomorNpwp)
      formData.append('domisili', domisili)
      formData.append('kontakPj', kontakPj)
      formData.append('avatarUrl', avatarUrl)
      formData.append('coverUrl', coverUrl)
      formData.append('waGroupLink', waGroupLink)
      formData.append('joinFee', joinFee)
      formData.append('monthlyFee', monthlyFee)

      const res = await createIndukCommunity(formData)
      if (res.error) {
        setFormError(res.error)
      } else {
        goeyToast.success('Komunitas Induk berhasil dibuat!')
        setCreateModalOpen(false)
        
        // Reset form
        setName('')
        setType('PERKUMPULAN')
        setDescription('')
        setAktaNotaris('')
        setNomorAhu('')
        setNomorNpwp('')
        setDomisili('')
        setKontakPj('')
        setAvatarUrl('')
        setCoverUrl('')
        setWaGroupLink('')
        setJoinFee('')
        setMonthlyFee('')

        loadData()
      }
    })
  }

  const filteredCommunities = communities.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7F9] text-[#111111] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    )
  }

  const isKycApproved = user && user.kycStatus === 'APPROVED'

  return (
    <div className="min-h-screen bg-[#F5F7F9] text-[#111111] pt-28 pb-24 px-4 md:px-10 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1400px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(45,178,74,0.03)_0%,transparent_80%)] pointer-events-none z-0" />

      <div className="relative z-10 max-w-6xl mx-auto space-y-8">
        {/* Banner Card */}
        <div className="border border-black/5 bg-white/60 backdrop-blur-xl p-8 md:p-12 rounded-3xl text-center space-y-4 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(45,178,74,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(45,178,74,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
          
          <span className="px-3 py-1 border border-primary/20 bg-primary/5 text-primary text-[10px] font-bold tracking-widest uppercase rounded-full inline-block">
            SALOKA BUSINESS NETWORK
          </span>
          <h1 className="font-sora text-3xl md:text-5xl font-extrabold text-[#111111] tracking-tight">
            Direktori Komunitas Induk
          </h1>
          <p className="text-xs md:text-sm text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Pilih Komunitas Induk utama Anda sebagai syarat membuka Dashboard Merchant. Jalin kemitraan, diskusikan legalitas usaha, dan akses permodalan koperasi untuk pertumbuhan bisnis UMKM Anda.
          </p>

          <div className="pt-2 flex justify-center">
            {user ? (
              <button
                onClick={() => setCreateModalOpen(true)}
                className="px-6 py-3 bg-primary hover:bg-primary/95 text-black font-geist font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-primary/10 flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                Buat Komunitas Baru
              </button>
            ) : (
              <Link
                href="/auth?tab=register"
                className="px-6 py-3 bg-primary hover:bg-primary/95 text-black font-geist font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg"
              >
                Daftar & Masuk Untuk Buat Komunitas
              </Link>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-black/5 pb-4">
          <h2 className="font-sora text-lg font-bold text-[#111111]">
            Semua Komunitas Terdaftar ({filteredCommunities.length})
          </h2>
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama atau deskripsi komunitas..."
              className="w-full h-10 pl-10 pr-4 bg-white border border-black/10 rounded-xl text-xs text-[#111111] focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>

        {/* Directory Grid */}
        {filteredCommunities.length === 0 ? (
          <div className="text-center py-20 border border-black/5 bg-white/60 rounded-3xl">
            <h3 className="font-sora text-sm font-bold text-[#111111] mb-2">Komunitas Tidak Ditemukan</h3>
            <p className="text-xs text-text-secondary max-w-xs mx-auto">
              Coba cari dengan kata kunci lain atau daftarkan komunitas bisnis Anda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCommunities.map((c) => (
              <div
                key={c.id}
                className="border border-black/5 bg-white rounded-2xl overflow-hidden flex flex-col justify-between shadow-xl hover:border-primary/20 transition-all duration-300 group"
              >
                {/* Banner */}
                <div className="h-28 w-full bg-gradient-to-r from-neutral-200 via-neutral-100 to-green-500/10 relative">
                  {c.coverUrl && (
                    <img src={c.coverUrl} alt={c.name} className="object-cover w-full h-full" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                </div>

                {/* Details */}
                <div className="p-5 flex-grow space-y-4">
                  <div className="flex gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-white border border-primary/20 flex items-center justify-center font-bold text-lg text-primary shadow -mt-10 z-10 shrink-0 overflow-hidden">
                      {c.avatarUrl ? (
                        <img src={c.avatarUrl} alt="" className="object-cover w-full h-full" />
                      ) : (
                        c.name.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    
                    <div>
                      <h3 className="font-sora text-xs font-bold text-[#111111] line-clamp-1 group-hover:text-primary transition-colors">{c.name}</h3>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-geist font-black border uppercase tracking-wider mt-1 ${
                        c.type === 'KOPERASI' ? 'bg-amber-500/10 border-amber-500/35 text-amber-500' : 'bg-cyan-500/10 border-cyan-500/35 text-cyan-500'
                      }`}>
                        {c.type}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-3">{c.description}</p>
                </div>

                {/* Footer Action */}
                <div className="p-5 pt-0 border-t border-black/5 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[10px] text-text-secondary">
                    <Users className="w-3.5 h-3.5" />
                    <span>{c._count?.members || 0} Anggota</span>
                  </div>
                  <Link
                    href={`/community/${c.id}`}
                    className="px-4 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/25 text-primary font-bold text-[10px] uppercase tracking-wider rounded-lg transition-colors"
                  >
                    Buka Komunitas
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── CREATE COMMUNITY MODAL ────────────────────────────────────────── */}
      <AnimatePresence>
        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl border border-black/5 bg-white p-6 md:p-8 rounded-3xl shadow-2xl space-y-6 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-black/5 pb-3">
                <h3 className="font-sora text-sm font-bold text-[#111111] uppercase tracking-wider">
                  Daftarkan Komunitas Induk Baru
                </h3>
                <button onClick={() => setCreateModalOpen(false)} className="text-text-secondary hover:text-[#111111] text-sm font-bold">✕</button>
              </div>

              {!isKycApproved ? (
                <div className="p-6 border border-amber-500/20 bg-amber-500/5 rounded-2xl space-y-4 text-center">
                  <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
                  <h4 className="font-sora font-bold text-[#111111] text-sm">Verifikasi KYC Diperlukan</h4>
                  <p className="text-xs text-text-secondary max-w-md mx-auto leading-relaxed">
                    Sesuai dengan regulasi platform, hanya pengguna yang telah lulus verifikasi KYC (Know Your Customer) yang dapat bertindak sebagai Ketua Komunitas dan mendaftarkan Komunitas Induk baru.
                  </p>
                  <div className="pt-2">
                    <Link
                      href={user ? `/profile/${user.id}` : '/auth?tab=register'}
                      className="inline-block px-5 py-2.5 bg-primary text-white font-geist font-bold text-xs uppercase tracking-wider rounded-xl shadow"
                    >
                      Lengkapi KYC di Profil
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreateCommunity} className="space-y-6">
                  {formError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-500 font-semibold">{formError}</div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Nama Komunitas</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Asosiasi Kuliner Kreatif Jogja"
                        className="w-full h-10 px-3 bg-[#F5F7F9] border border-black/10 rounded-xl text-xs text-[#111111] focus:outline-none focus:border-primary/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Jenis Komunitas</label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value as any)}
                        className="w-full h-10 px-3 bg-[#F5F7F9] border border-black/10 rounded-xl text-xs text-[#111111] focus:outline-none focus:border-primary/50"
                      >
                        <option value="PERKUMPULAN">Perkumpulan (Gratis / Free)</option>
                        <option value="KOPERASI">Koperasi Produksi (Berbayar)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Deskripsi Komunitas</label>
                    <textarea
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Jelaskan visi misi, cakupan anggota merchant, dan target pasar komunitas bisnis Anda..."
                      rows={3}
                      className="w-full px-3 py-2 bg-[#F5F7F9] border border-black/10 rounded-xl text-xs text-[#111111] focus:outline-none focus:border-primary/50 resize-none"
                    />
                  </div>

                  {/* Legalitas */}
                  <div className="space-y-3 pt-2 border-t border-black/5">
                    <h4 className="text-[11px] font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      Legalitas Organisasi
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Akta Notaris Pendirian</label>
                        <input
                          type="text"
                          value={aktaNotaris}
                          onChange={(e) => setAktaNotaris(e.target.value)}
                          placeholder="e.g. Akta Notaris No. 24 Tgl 12 Jan 2026"
                          className="w-full h-10 px-3 bg-[#F5F7F9] border border-black/10 rounded-xl text-xs text-[#111111] focus:outline-none focus:border-primary/50"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Nomor AHU Kemenkumham</label>
                        <input
                          type="text"
                          value={nomorAhu}
                          onChange={(e) => setNomorAhu(e.target.value)}
                          placeholder="e.g. AHU-0001234.AH.01.07"
                          className="w-full h-10 px-3 bg-[#F5F7F9] border border-black/10 rounded-xl text-xs text-[#111111] focus:outline-none focus:border-primary/50"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Nomor NPWP Organisasi</label>
                        <input
                          type="text"
                          value={nomorNpwp}
                          onChange={(e) => setNomorNpwp(e.target.value)}
                          placeholder="e.g. 12.345.678.9-012.000"
                          className="w-full h-10 px-3 bg-[#F5F7F9] border border-black/10 rounded-xl text-xs text-[#111111] focus:outline-none focus:border-primary/50"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Domisili Organisasi</label>
                        <input
                          type="text"
                          value={domisili}
                          onChange={(e) => setDomisili(e.target.value)}
                          placeholder="e.g. Kota Yogyakarta, DIY"
                          className="w-full h-10 px-3 bg-[#F5F7F9] border border-black/10 rounded-xl text-xs text-[#111111] focus:outline-none focus:border-primary/50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Koperasi Financial Fields */}
                  {type === 'KOPERASI' && (
                    <div className="space-y-3 pt-2 border-t border-black/5 animate-in fade-in duration-300">
                      <h4 className="text-[11px] font-bold text-primary uppercase tracking-widest">
                        Pengaturan Finansial Koperasi
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Simpanan Pokok / Biaya Masuk (Rp)</label>
                          <input
                            type="number"
                            required
                            value={joinFee}
                            onChange={(e) => setJoinFee(e.target.value)}
                            placeholder="e.g. 150000"
                            className="w-full h-10 px-3 bg-[#F5F7F9] border border-black/10 rounded-xl text-xs text-[#111111] focus:outline-none focus:border-primary/50"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Iuran Wajib Bulanan (Rp)</label>
                          <input
                            type="number"
                            required
                            value={monthlyFee}
                            onChange={(e) => setMonthlyFee(e.target.value)}
                            placeholder="e.g. 50000"
                            className="w-full h-10 px-3 bg-[#F5F7F9] border border-black/10 rounded-xl text-xs text-[#111111] focus:outline-none focus:border-primary/50"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Media & Links */}
                  <div className="space-y-3 pt-2 border-t border-black/5">
                    <h4 className="text-[11px] font-bold text-primary uppercase tracking-widest">
                      Media, Kontak & Tautan Diskusi
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider font-geist">No. Kontak Penanggung Jawab</label>
                        <input
                          type="text"
                          required
                          value={kontakPj}
                          onChange={(e) => setKontakPj(e.target.value)}
                          placeholder="e.g. 081234567890"
                          className="w-full h-10 px-3 bg-[#F5F7F9] border border-black/10 rounded-xl text-xs text-[#111111] focus:outline-none focus:border-primary/50"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider font-geist">Tautan Grup WhatsApp Diskusi</label>
                        <input
                          type="text"
                          value={waGroupLink}
                          onChange={(e) => setWaGroupLink(e.target.value)}
                          placeholder="e.g. https://chat.whatsapp.com/..."
                          className="w-full h-10 px-3 bg-[#F5F7F9] border border-black/10 rounded-xl text-xs text-[#111111] focus:outline-none focus:border-primary/50"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Logo Komunitas / Avatar</label>
                        {avatarUrl ? (
                          <div className="relative border border-black/10 rounded-xl overflow-hidden bg-[#F5F7F9] p-1.5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <img src={avatarUrl} alt="Logo Preview" className="w-10 h-10 object-cover rounded-lg" />
                              <span className="text-[10px] font-medium text-[#111111] truncate max-w-[120px]">Logo Terpilih</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setAvatarUrl('')}
                              className="p-1 bg-black/5 hover:bg-black/10 text-neutral-600 rounded-full transition-colors cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <label className="border border-dashed border-black/15 hover:border-primary/45 rounded-xl h-14 flex items-center justify-center cursor-pointer bg-[#F5F7F9]/50 hover:bg-[#F5F7F9] transition-all p-3 group">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={uploadingAvatar}
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleFileUpload(file, 'avatar')
                              }}
                            />
                            {uploadingAvatar ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                <span className="text-[10px] text-text-secondary font-medium">Mengunggah...</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Upload className="w-4 h-4 text-text-secondary group-hover:text-primary transition-colors" />
                                <span className="text-[10px] font-bold text-text-primary">Pilih Logo Komunitas</span>
                              </div>
                            )}
                          </label>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Banner Sampul / Cover</label>
                        {coverUrl ? (
                          <div className="relative border border-black/10 rounded-xl overflow-hidden bg-[#F5F7F9] p-1.5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <img src={coverUrl} alt="Cover Preview" className="w-10 h-10 object-cover rounded-lg" />
                              <span className="text-[10px] font-medium text-[#111111] truncate max-w-[120px]">Banner Terpilih</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setCoverUrl('')}
                              className="p-1 bg-black/5 hover:bg-black/10 text-neutral-600 rounded-full transition-colors cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <label className="border border-dashed border-black/15 hover:border-primary/45 rounded-xl h-14 flex items-center justify-center cursor-pointer bg-[#F5F7F9]/50 hover:bg-[#F5F7F9] transition-all p-3 group">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={uploadingCover}
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleFileUpload(file, 'cover')
                              }}
                            />
                            {uploadingCover ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                <span className="text-[10px] text-text-secondary font-medium">Mengunggah...</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Upload className="w-4 h-4 text-text-secondary group-hover:text-primary transition-colors" />
                                <span className="text-[10px] font-bold text-text-primary">Pilih Banner Sampul</span>
                              </div>
                            )}
                          </label>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full py-3 bg-primary text-white font-geist font-bold text-xs uppercase tracking-wider rounded-xl hover:opacity-95 transition-all shadow-lg"
                  >
                    {isPending ? 'Mendaftarkan Komunitas...' : 'Daftarkan Komunitas Bisnis'}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
