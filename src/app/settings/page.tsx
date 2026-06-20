'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUserProfile } from '@/app/actions/auth'
import { User, Shield, Bell, MapPin, Palette, LogOut, CheckCircle2, Settings, ShieldCheck } from 'lucide-react'
import { updateUserSettingsAction } from '@/app/actions/wallet-affiliate'
import { goeyToast } from 'goey-toast'

type TabType = 'profile' | 'security' | 'address' | 'integrations' | 'notifications' | 'preferences' | 'kyc'

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('profile')
  const [saved, setSaved] = useState(false)

  // State hooks for profile and integrations settings
  const [name, setName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [bio, setBio] = useState('')
  const [waGatewayKeys, setWaGatewayKeys] = useState('')
  const [fbPixelId, setFbPixelId] = useState('')
  const [tiktokPixelId, setTiktokPixelId] = useState('')
  const [zapierWebhookUrl, setZapierWebhookUrl] = useState('')
  const [googleSheetUrl, setGoogleSheetUrl] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [saving, setSaving] = useState(false)

  // KYC State
  const [kycStatus, setKycStatus] = useState<string | null>(null)
  const [kycVerifiedAt, setKycVerifiedAt] = useState<string | null>(null)
  const [kycLoading, setKycLoading] = useState(false)
  const [kycStarting, setKycStarting] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const u = await getCurrentUserProfile()
        if (!u) {
          router.push('/?login=true')
          return
        }
        setUser(u)
        setName(u.name || '')
        setWhatsapp(u.whatsapp || '')
        setBio(u.bio || '')
        setWaGatewayKeys(u.waGatewayKeys || '')
        setFbPixelId(u.fbPixelId || '')
        setTiktokPixelId(u.tiktokPixelId || '')
        setZapierWebhookUrl(u.zapierWebhookUrl || '')
        setGoogleSheetUrl(u.googleSheetUrl || '')
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()

    // Load KYC status
    setKycLoading(true)
    fetch('/api/kyc/status')
      .then(r => r.json())
      .then(d => {
        setKycStatus(d.status)
        setKycVerifiedAt(d.verifiedAt ? new Date(d.verifiedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : null)
      })
      .catch(() => {})
      .finally(() => setKycLoading(false))
  }, [router])

  const handleSave = async () => {
    setSaving(true)
    setErrorMsg('')
    try {
      const res = await updateUserSettingsAction({
        name,
        whatsapp,
        bio,
        waGatewayKeys,
        fbPixelId: fbPixelId || null,
        tiktokPixelId: tiktokPixelId || null,
        zapierWebhookUrl: zapierWebhookUrl || null,
        googleSheetUrl: googleSheetUrl || null
      })
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (err) {
      console.error(err)
      setErrorMsg('Gagal menyimpan pengaturan.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
          <span className="text-xs font-geist font-bold text-text-secondary tracking-widest uppercase">
            Memuat Pengaturan...
          </span>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'profile', label: 'Profil & Biodata', icon: User },
    { id: 'security', label: 'Akun & Keamanan', icon: Shield },
    { id: 'kyc', label: 'Verifikasi Identitas', icon: ShieldCheck },
    { id: 'address', label: 'Buku Alamat', icon: MapPin },
    { id: 'integrations', label: 'Integrasi & WA Gateway', icon: Settings },
    { id: 'notifications', label: 'Notifikasi', icon: Bell },
    { id: 'preferences', label: 'Preferensi Tampilan', icon: Palette },
  ]

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 md:px-10 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-sora text-2xl md:text-3xl font-bold text-foreground">Pengaturan Akun</h1>
        <p className="text-sm text-foreground/70 mt-2">
          Kelola preferensi, keamanan, dan informasi profil Anda.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-[var(--radius-brand)] text-sm font-medium transition-colors outline-none cursor-pointer ${
                  isActive 
                    ? 'bg-primary text-white shadow-md' 
                    : 'text-foreground/70 hover:bg-surface-container hover:text-foreground'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-foreground/50'} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 w-full bg-surface border border-border-subtle shadow-[var(--shadow-md)] rounded-[var(--radius-brand)] p-6 md:p-8 min-h-[500px]">
          
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="font-sora text-xl font-bold text-foreground mb-6">Profil & Biodata</h2>
              
              <div className="flex items-center gap-6 mb-8 pb-8 border-b border-border-subtle">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary-container text-white flex items-center justify-center text-2xl font-extrabold shadow-lg">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <button className="px-4 py-2 bg-surface-container hover:bg-surface-container-high border border-border-subtle rounded-full text-xs font-bold transition-colors cursor-pointer outline-none">
                    Ubah Foto
                  </button>
                  <p className="text-[10px] text-foreground/50 mt-2">JPG, GIF atau PNG maksimal 2MB.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground/70">Nama Lengkap</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    className="w-full h-11 px-4 bg-surface-container border border-border-subtle rounded-[var(--radius-brand)] text-sm focus:outline-none focus:border-primary/50 transition-colors" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground/70">Email</label>
                  <input type="email" defaultValue={user?.email} disabled className="w-full h-11 px-4 bg-surface-container/50 border border-border-subtle rounded-[var(--radius-brand)] text-sm text-foreground/50 cursor-not-allowed" />
                  <p className="text-[10px] text-primary">Email tidak dapat diubah (Terverifikasi)</p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground/70">Nomor Telepon / WhatsApp</label>
                  <input 
                    type="tel" 
                    value={whatsapp} 
                    onChange={e => setWhatsapp(e.target.value)} 
                    className="w-full h-11 px-4 bg-surface-container border border-border-subtle rounded-[var(--radius-brand)] text-sm focus:outline-none focus:border-primary/50 transition-colors" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground/70">Bio Singkat</label>
                  <textarea 
                    rows={3} 
                    value={bio} 
                    onChange={e => setBio(e.target.value)} 
                    placeholder="Ceritakan sedikit tentang Anda..." 
                    className="w-full p-4 bg-surface-container border border-border-subtle rounded-[var(--radius-brand)] text-sm focus:outline-none focus:border-primary/50 transition-colors resize-none"
                  ></textarea>
                </div>
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="font-sora text-xl font-bold text-foreground mb-6">Akun & Keamanan</h2>
              
              <div className="space-y-6">
                <div className="p-5 border border-border-subtle rounded-[var(--radius-brand)]">
                  <h3 className="text-sm font-bold text-foreground mb-4">Ubah Kata Sandi</h3>
                  <div className="space-y-4">
                    <input type="password" placeholder="Kata Sandi Saat Ini" className="w-full max-w-md h-11 px-4 bg-surface-container border border-border-subtle rounded-[var(--radius-brand)] text-sm focus:outline-none focus:border-primary/50" />
                    <input type="password" placeholder="Kata Sandi Baru" className="w-full max-w-md h-11 px-4 bg-surface-container border border-border-subtle rounded-[var(--radius-brand)] text-sm focus:outline-none focus:border-primary/50" />
                    <input type="password" placeholder="Konfirmasi Kata Sandi Baru" className="w-full max-w-md h-11 px-4 bg-surface-container border border-border-subtle rounded-[var(--radius-brand)] text-sm focus:outline-none focus:border-primary/50" />
                  </div>
                </div>

                <div className="p-5 border border-red-500/20 bg-red-500/5 rounded-[var(--radius-brand)]">
                  <h3 className="text-sm font-bold text-red-500 mb-2">Zona Berbahaya</h3>
                  <p className="text-xs text-foreground/70 mb-4">Menghapus akun akan menghilangkan seluruh data Anda secara permanen. Tindakan ini tidak dapat dibatalkan.</p>
                  <button className="px-4 py-2 bg-red-500 text-white rounded-[var(--radius-brand)] text-xs font-bold hover:bg-red-600 transition-colors cursor-pointer outline-none">
                    Hapus Akun Saya
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* KYC TAB */}
          {activeTab === 'kyc' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
              <div>
                <h2 className="font-sora text-xl font-bold text-foreground">Verifikasi Identitas (KYC)</h2>
                <p className="text-xs text-foreground/50 mt-1">
                  Verifikasi identitas membantu membangun kepercayaan dan membuka akses ke fitur premium platform.
                </p>
              </div>

              {/* Status Card */}
              <div className={`p-5 rounded-[var(--radius-brand)] border-2 ${
                kycStatus === 'VERIFIED'
                  ? 'border-green-500/40 bg-green-500/5'
                  : kycStatus === 'REJECTED'
                  ? 'border-red-500/40 bg-red-500/5'
                  : kycStatus === 'PENDING'
                  ? 'border-amber-500/40 bg-amber-500/5'
                  : 'border-border-subtle bg-surface-container/30'
              }`}>
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0 ${
                    kycStatus === 'VERIFIED' ? 'bg-green-500/15' :
                    kycStatus === 'REJECTED' ? 'bg-red-500/15' :
                    kycStatus === 'PENDING' ? 'bg-amber-500/15' : 'bg-surface-container'
                  }`}>
                    {kycStatus === 'VERIFIED' ? '✅' : kycStatus === 'REJECTED' ? '❌' : kycStatus === 'PENDING' ? '🕐' : '🪪'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-foreground">
                        {kycStatus === 'VERIFIED' ? 'Identitas Terverifikasi' :
                         kycStatus === 'REJECTED' ? 'Verifikasi Ditolak' :
                         kycStatus === 'PENDING' ? 'Sedang Ditinjau' : 'Belum Diverifikasi'}
                      </h3>
                      {kycStatus === 'VERIFIED' && (
                        <span className="px-2 py-0.5 bg-green-500/15 text-green-600 text-[9px] font-black uppercase tracking-wider rounded">
                          ✓ Terverifikasi
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-foreground/60 mt-1">
                      {kycStatus === 'VERIFIED'
                        ? `Identitas Anda telah berhasil diverifikasi${kycVerifiedAt ? ` pada ${kycVerifiedAt}` : ''}. Badge KYC aktif di profil Anda.`
                        : kycStatus === 'REJECTED'
                        ? 'Verifikasi ditolak. Pastikan dokumen Anda valid dan foto wajah terlihat jelas, lalu coba lagi.'
                        : kycStatus === 'PENDING'
                        ? 'Verifikasi sedang dalam proses peninjauan. Estimasi selesai dalam 1x24 jam.'
                        : 'Verifikasi identitas Anda untuk mendapatkan badge KYC, meningkatkan kepercayaan pembeli, dan akses fitur premium.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              {kycStatus !== 'VERIFIED' && (
                <div className="p-5 border border-border-subtle rounded-[var(--radius-brand)]">
                  <h4 className="text-sm font-bold text-foreground mb-3">Manfaat Verifikasi KYC</h4>
                  <ul className="space-y-2">
                    {[
                      { icon: '🛡️', text: 'Badge Identitas Terverifikasi di profil dan toko Anda' },
                      { icon: '📈', text: 'Peningkatan kepercayaan dan konversi dari pembeli' },
                      { icon: '💼', text: 'Akses ke fitur pinjaman koperasi dan program UMKM premium' },
                      { icon: '🔓', text: 'Limit transaksi lebih tinggi dan fitur eksklusif' },
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-foreground/70">
                        <span className="text-base leading-none">{item.icon}</span>
                        <span>{item.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* What's needed */}
              {!kycStatus && (
                <div className="p-5 border border-primary/20 bg-primary/5 rounded-[var(--radius-brand)]">
                  <h4 className="text-sm font-bold text-foreground mb-3">Yang Perlu Disiapkan</h4>
                  <ul className="space-y-2">
                    {[
                      '📄 KTP / Paspor / SIM yang masih berlaku',
                      '🤳 Selfie wajah menghadap kamera (liveness check)',
                      '📶 Koneksi internet yang stabil',
                    ].map((item, i) => (
                      <li key={i} className="text-xs text-foreground/70">{item}</li>
                    ))}
                  </ul>
                  <p className="text-[10px] text-foreground/40 mt-3">
                    Powered by <strong>Didit</strong> — verifikasi aman & gratis. Data tidak disimpan di server Saloka.id.
                  </p>
                </div>
              )}

              {/* CTA Button */}
              {kycStatus !== 'VERIFIED' && kycStatus !== 'PENDING' && (
                <button
                  id="btn-start-kyc"
                  disabled={kycStarting}
                  onClick={async () => {
                    setKycStarting(true)
                    try {
                      const res = await fetch('/api/kyc/didit', { method: 'POST' })
                      const data = await res.json()
                      if (data.url) {
                        window.location.href = data.url
                      } else {
                        goeyToast.error(data.error || 'Gagal memulai verifikasi. Coba lagi.')
                      }
                    } catch (e) {
                      goeyToast.error('Terjadi kesalahan jaringan. Silakan coba lagi.')
                    } finally {
                      setKycStarting(false)
                    }
                  }}
                  className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary/90 text-white font-geist font-bold text-sm rounded-[var(--radius-brand)] flex items-center gap-2 justify-center transition-all shadow-lg hover:shadow-primary/30 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {kycStarting ? 'Memulai Verifikasi...' : kycStatus === 'REJECTED' ? 'Coba Verifikasi Ulang' : 'Mulai Verifikasi KYC Gratis'}
                </button>
              )}
            </div>
          )}

          {/* ADDRESS TAB */}
          {activeTab === 'address' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-sora text-xl font-bold text-foreground">Buku Alamat</h2>
                <button className="px-4 py-2 bg-primary text-white rounded-full text-xs font-bold shadow-sm hover:bg-primary/90 transition-colors cursor-pointer outline-none">
                  + Tambah Alamat Baru
                </button>
              </div>

              <div className="p-5 border border-primary bg-primary/5 rounded-[var(--radius-brand)] relative">
                <div className="absolute top-5 right-5 flex items-center gap-2">
                  <span className="px-2 py-1 bg-primary text-white text-[9px] font-black uppercase tracking-wider rounded">Utama</span>
                </div>
                <h3 className="font-bold text-sm text-foreground mb-1">Rumah (GPS Aktif)</h3>
                <p className="text-xs text-foreground/70 font-medium mb-2">{user?.name} — 081234567890</p>
                <p className="text-xs text-foreground/70 leading-relaxed mb-4">
                  Jl. Raya Merdeka No. 45, Kelurahan Senayan, Kecamatan Kebayoran Baru<br />
                  Kota Jakarta Selatan, DKI Jakarta 12345
                </p>
                <div className="flex gap-3">
                  <button className="text-xs font-bold text-primary hover:underline cursor-pointer outline-none">Ubah</button>
                </div>
              </div>
            </div>
          )}

          {/* INTEGRATIONS TAB */}
          {activeTab === 'integrations' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
              <div>
                <h2 className="font-sora text-xl font-bold text-foreground">Integrasi & WA Gateway</h2>
                <p className="text-xs text-foreground/50 mt-1">
                  Konfigurasikan kunci API pihak ketiga Anda untuk mengaktifkan notifikasi WhatsApp otomatis, pelacakan piksel, dan webhook data.
                </p>
              </div>

              <div className="space-y-4">
                {/* WA Gateway Keys */}
                <div className="p-5 border border-border-subtle rounded-[var(--radius-brand)] bg-surface-container/25">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-bold text-foreground">WhatsApp Gateway API Token (Fonnte / Kirimi)</label>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-[#2DB24A] text-[9px] font-bold uppercase tracking-wider rounded">Lite / Premium</span>
                  </div>
                  <input
                    type="password"
                    value={waGatewayKeys}
                    onChange={e => setWaGatewayKeys(e.target.value)}
                    placeholder="Masukkan API Token Fonnte/Kirimi Anda..."
                    className="w-full h-11 px-4 bg-surface-container border border-border-subtle rounded-[var(--radius-brand)] text-sm font-mono focus:outline-none focus:border-primary/50 transition-colors"
                  />
                  <p className="text-[10px] text-foreground/50 mt-1.5 leading-relaxed">
                    Masukkan token API WhatsApp Gateway Anda dari dashboard Fonnte atau Kirimi. Sistem akan menggunakan token ini untuk mengirimkan notifikasi follow-up pesanan dan bukti transaksi kepada pelanggan Anda secara otomatis.
                  </p>
                </div>

                {/* Facebook Pixel */}
                <div className="p-5 border border-border-subtle rounded-[var(--radius-brand)]">
                  <label className="text-sm font-bold text-foreground block mb-2">Facebook Pixel ID</label>
                  <input
                    type="text"
                    value={fbPixelId}
                    onChange={e => setFbPixelId(e.target.value)}
                    placeholder="Contoh: 123456789012345"
                    className="w-full h-11 px-4 bg-surface-container border border-border-subtle rounded-[var(--radius-brand)] text-sm focus:outline-none focus:border-primary/50 transition-colors"
                  />
                  <p className="text-[10px] text-foreground/50 mt-1.5">
                    ID Piksel Meta untuk melacak konversi iklan pada halaman penjualan Anda.
                  </p>
                </div>

                {/* TikTok Pixel */}
                <div className="p-5 border border-border-subtle rounded-[var(--radius-brand)]">
                  <label className="text-sm font-bold text-foreground block mb-2">TikTok Pixel ID</label>
                  <input
                    type="text"
                    value={tiktokPixelId}
                    onChange={e => setTiktokPixelId(e.target.value)}
                    placeholder="Contoh: C1234567890"
                    className="w-full h-11 px-4 bg-surface-container border border-border-subtle rounded-[var(--radius-brand)] text-sm focus:outline-none focus:border-primary/50 transition-colors"
                  />
                  <p className="text-[10px] text-foreground/50 mt-1.5">
                    ID Piksel TikTok untuk melacak efektivitas kampanye video iklan Anda.
                  </p>
                </div>

                {/* Google Sheets Integration */}
                <div className="p-5 border border-border-subtle rounded-[var(--radius-brand)]">
                  <label className="text-sm font-bold text-foreground block mb-2">Google Sheets Spreadsheet URL</label>
                  <input
                    type="text"
                    value={googleSheetUrl}
                    onChange={e => setGoogleSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="w-full h-11 px-4 bg-surface-container border border-border-subtle rounded-[var(--radius-brand)] text-sm focus:outline-none focus:border-primary/50 transition-colors"
                  />
                  <p className="text-[10px] text-foreground/50 mt-1.5">
                    URL spreadsheet Google Sheets yang dibagikan untuk menyinkronkan data pesanan masuk secara real-time.
                  </p>
                </div>

                {/* Zapier / Webhook Integration */}
                <div className="p-5 border border-border-subtle rounded-[var(--radius-brand)]">
                  <label className="text-sm font-bold text-foreground block mb-2">Zapier Webhook URL</label>
                  <input
                    type="text"
                    value={zapierWebhookUrl}
                    onChange={e => setZapierWebhookUrl(e.target.value)}
                    placeholder="https://hooks.zapier.com/hooks/catch/..."
                    className="w-full h-11 px-4 bg-surface-container border border-border-subtle rounded-[var(--radius-brand)] text-sm focus:outline-none focus:border-primary/50 transition-colors"
                  />
                  <p className="text-[10px] text-foreground/50 mt-1.5">
                    Webhook URL Zapier untuk mengirimkan event pesanan baru ke ribuan aplikasi eksternal lainnya.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="font-sora text-xl font-bold text-foreground mb-6">Preferensi Notifikasi</h2>
              
              <div className="space-y-4">
                {[
                  { title: 'Promo & Penawaran Spesial', desc: 'Dapatkan informasi diskon, kupon, dan penawaran menarik lainnya.', defaultChecked: true },
                  { title: 'Update Pesanan', desc: 'Notifikasi saat pesanan Anda diproses, dikirim, atau selesai.', defaultChecked: true },
                  { title: 'Aktivitas Komunitas', desc: 'Pemberitahuan saat ada diskusi baru atau balasan di forum komunitas.', defaultChecked: false },
                  { title: 'Buletin Saloka.id', desc: 'Berita bulanan dan tips berbisnis dari Saloka.id.', defaultChecked: false },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border border-border-subtle rounded-[var(--radius-brand)]">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{item.title}</h4>
                      <p className="text-xs text-foreground/70 mt-1">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked={item.defaultChecked} className="sr-only peer" />
                      <div className="w-11 h-6 bg-surface-container peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary border border-border-subtle"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PREFERENCES TAB */}
          {activeTab === 'preferences' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="font-sora text-xl font-bold text-foreground mb-6">Preferensi Tampilan</h2>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-foreground/70">Tema Visual</label>
                  <div className="grid grid-cols-3 gap-4 max-w-md">
                    <button className="p-4 border-2 border-primary bg-surface rounded-[var(--radius-brand)] flex flex-col items-center gap-2 outline-none cursor-pointer">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-white to-gray-200 border border-gray-300"></div>
                      <span className="text-xs font-bold text-foreground">Terang</span>
                    </button>
                    <button className="p-4 border border-border-subtle bg-surface-container opacity-50 rounded-[var(--radius-brand)] flex flex-col items-center gap-2 outline-none cursor-not-allowed" disabled title="Sedang dikembangkan">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-800 to-black border border-gray-700"></div>
                      <span className="text-xs font-bold text-foreground">Gelap</span>
                    </button>
                    <button className="p-4 border border-border-subtle bg-surface-container opacity-50 rounded-[var(--radius-brand)] flex flex-col items-center gap-2 outline-none cursor-not-allowed" disabled title="Sedang dikembangkan">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-400 to-gray-600 border border-gray-500"></div>
                      <span className="text-xs font-bold text-foreground">Otomatis</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-foreground/50">Saat ini hanya tema Terang yang tersedia secara komprehensif.</p>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-foreground/70">Bahasa</label>
                  <select className="w-full max-w-md h-11 px-4 bg-surface-container border border-border-subtle rounded-[var(--radius-brand)] text-sm focus:outline-none focus:border-primary/50 appearance-none">
                    <option value="id">Bahasa Indonesia</option>
                    <option value="en">English (US)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="mt-10 pt-6 border-t border-border-subtle flex items-center justify-between">
            <div className="flex flex-col gap-1">
              {saved && (
                <span className="text-xs font-bold text-[#2DB24A] flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 size={16} />
                  Pengaturan berhasil disimpan!
                </span>
              )}
              {errorMsg && (
                <span className="text-xs font-bold text-red-500 flex items-center gap-2 animate-in fade-in">
                  <span className="text-sm">⚠️</span>
                  {errorMsg}
                </span>
              )}
            </div>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-[#2DB24A] hover:bg-[#259a3f] text-white font-bold rounded-full text-xs uppercase tracking-wider shadow-sm hover:shadow-md transition-all cursor-pointer outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
