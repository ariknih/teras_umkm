import React, { useState } from 'react'
import { Plus, Trash2, Upload, Loader2, Sparkles, AlertCircle } from 'lucide-react'
import { goeyToast } from 'goey-toast'

interface LandingPageEditorProps {
  community: any
  config: any
  onSave: (updatedConfig: any) => Promise<void>
}

export const LandingPageEditor: React.FC<LandingPageEditorProps> = ({
  community,
  config,
  onSave
}) => {
  const nameLower = (community?.name || '').toLowerCase()
  const catLower = (community?.category || '').toLowerCase()
  const typeLower = (community?.type || '').toLowerCase()

  const templateType = community?.templateType || (
    typeLower === 'koperasi' || catLower === 'koperasi' || nameLower.includes('koperasi') ? 'Koperasi' :
    catLower === 'kuliner' || catLower === 'culinary' || nameLower.includes('kuliner') ? 'Culinary' :
    catLower === 'business' || nameLower.includes('kopjaswara') || nameLower.includes('bisnis') || nameLower.includes('umkm') ? 'Business' :
    catLower === 'education' || nameLower.includes('pelajar') || nameLower.includes('pengusaha') || nameLower.includes('pendidikan') ? 'Education' :
    'Community'
  )

  const isKoperasi = templateType === 'Koperasi'
  
  // Local form states
  const [heroBadge, setHeroBadge] = useState(config?.hero?.badge || (isKoperasi ? 'KOPERASI PRO' : 'KOMUNITAS UMKM'))
  const [heroTitle, setHeroTitle] = useState(config?.hero?.title || community?.name || '')
  const [heroSubtitle, setHeroSubtitle] = useState(config?.hero?.subtitle || '')
  const [heroDescription, setHeroDescription] = useState(config?.hero?.description || '')
  const [heroCoverUrl, setHeroCoverUrl] = useState(config?.hero?.coverUrl || '')
  const [heroQuoteText, setHeroQuoteText] = useState(config?.hero?.quoteText || '')
  const [heroQuoteAuthor, setHeroQuoteAuthor] = useState(config?.hero?.quoteAuthor || '')
  const [heroDidirikan, setHeroDidirikan] = useState(config?.hero?.didirikan || '12 Mei 2020')
  const [heroKetua, setHeroKetua] = useState(config?.hero?.ketua || '')
  const [heroLokasi, setHeroLokasi] = useState(config?.hero?.lokasi || '')
  const [heroAnggotaCount, setHeroAnggotaCount] = useState(config?.hero?.anggotaCount || '')

  // Advantages (exactly 5 items)
  const defaultBenefits = [
    { title: 'Jaringan Luas', description: 'Terhubung dengan ratusan UMKM.', icon: 'Users' },
    { title: 'Akses Permodalan', description: 'Pembiayaan mudah dengan syarat ringan.', icon: 'Wallet' },
    { title: 'Edukasi & Pelatihan', description: 'Webinar dan mentoring eksklusif.', icon: 'GraduationCap' },
    { title: 'Produk & Layanan', description: 'Nikmati produk koperasi harga khusus.', icon: 'Building2' },
    { title: 'Bagi Hasil (SHU)', description: 'Raih keuntungan dari partisipasi aktif.', icon: 'PieChart' }
  ]
  const [benefits, setBenefits] = useState<any[]>(
    config?.benefits?.length === 5 ? config.benefits : defaultBenefits
  )

  // Stats (exactly 4 items)
  const defaultStats = [
    { value: '788+', label: 'Anggota Aktif', desc: 'Bergabung bersama kami', icon: 'Users' },
    { value: '120+', label: 'UMKM Bergabung', desc: 'Bersama tumbuh dan berdaya', icon: 'Building2' },
    { value: 'Rp 1,2 M+', label: 'Transaksi Anggota', desc: 'Total transaksi', icon: 'Coins' },
    { value: '50+', label: 'Kegiatan & Event', desc: 'Webinar & bisnis', icon: 'Calendar' }
  ]
  const [stats, setStats] = useState<any[]>(
    config?.stats?.length === 4 ? config.stats : defaultStats
  )

  // Activities (exactly 3 items)
  const defaultActivities = [
    { title: 'Strategi Pemasaran UMKM', category: 'WEBINAR', dateLocation: '18 Mei 2024 • Online', imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400' },
    { title: 'Pelatihan Keuangan', category: 'PELATIHAN', dateLocation: '25 Mei 2024 • Bandung', imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400' },
    { title: 'Business Matching', category: 'NETWORKING', dateLocation: '1 Juni 2024 • Bandung', imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400' }
  ]
  const [activities, setActivities] = useState<any[]>(
    config?.activities?.length === 3 ? config.activities : defaultActivities
  )

  // CTA Banner
  const [ctaText, setCtaText] = useState(config?.ctaBanner?.text || 'Bergabung sekarang dan jadilah bagian dari ekosistem bisnis.')
  const [ctaButtonText, setCtaButtonText] = useState(config?.ctaBanner?.buttonText || 'Menjadi Anggota Sekarang')

  // Vision & Mission states
  const defaultVision = isKoperasi 
    ? 'Menjadi koperasi terdepan dalam memberdayakan pelaku UMKM melalui pemanfaatan teknologi digital, kolaborasi berkelanjutan, dan kemudahan akses finansial demi mewujudkan kemandirian ekonomi kerakyatan.'
    : 'Membangun ekosistem komunitas UMKM yang solid, adaptif, dan berdaya saing global untuk memajukan perekonomian lokal secara inklusif.'
  const defaultMissions = isKoperasi
    ? [
        'Menyediakan platform teknologi digital yang mudah diakses guna mendukung percepatan usaha dan perluasan pasar anggota.',
        'Memfasilitasi pembiayaan usaha mikro secara fleksibel, amanah, dan dengan persyaratan yang memudahkan.',
        'Menyelenggarakan program pelatihan keterampilan bisnis, manajerial, dan keuangan secara berkala demi meningkatkan daya saing.'
      ]
    : [
        'Memperluas jejaring kemitraan strategis antar pelaku UMKM untuk meningkatkan kapasitas produksi dan distribusi.',
        'Menjadi wadah advokasi, berbagi pengalaman, dan pendampingan legalitas serta perizinan usaha bagi para anggota.',
        'Mengembangkan program promosi terintegrasi dan kolaboratif guna memperkuat brand lokal.'
      ]

  const [vision, setVision] = useState(config?.vision || defaultVision)
  const [missions, setMissions] = useState<string[]>(
    config?.missions?.length === 3 ? config.missions : defaultMissions
  )

  const [saving, setSaving] = useState(false)
  const [uploadingHero, setUploadingHero] = useState(false)
  const [uploadingActivity, setUploadingActivity] = useState<number | null>(null)

  const handleUploadImage = async (file: File, type: 'hero' | { activityIdx: number }) => {
    const isHero = type === 'hero'
    const setUploading = isHero ? setUploadingHero : (val: boolean) => setUploadingActivity(val ? type.activityIdx : null)
    
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'community-landing')
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd
      })
      if (!res.ok) throw new Error('Gagal mengunggah gambar.')
      const data = await res.json()
      
      if (isHero) {
        setHeroCoverUrl(data.url)
      } else {
        const updated = [...activities]
        updated[type.activityIdx].imageUrl = data.url
        setActivities(updated)
      }
      goeyToast.success('Gambar berhasil diunggah!')
    } catch (e: any) {
      goeyToast.error(e.message || 'Gagal mengunggah.')
    } finally {
      setUploading(false)
    }
  }

  const handleBenefitChange = (index: number, key: string, value: string) => {
    const updated = [...benefits]
    updated[index][key] = value
    setBenefits(updated)
  }

  const handleStatChange = (index: number, key: string, value: string) => {
    const updated = [...stats]
    updated[index][key] = value
    setStats(updated)
  }

  const handleActivityChange = (index: number, key: string, value: string) => {
    const updated = [...activities]
    updated[index][key] = value
    setActivities(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    const newConfig = {
      hero: {
        badge: heroBadge,
        title: heroTitle,
        subtitle: heroSubtitle,
        description: heroDescription,
        coverUrl: heroCoverUrl,
        quoteText: heroQuoteText,
        quoteAuthor: heroQuoteAuthor,
        didirikan: heroDidirikan,
        ketua: heroKetua,
        lokasi: heroLokasi,
        anggotaCount: heroAnggotaCount
      },
      benefits,
      vision,
      missions,
      stats,
      activities,
      ctaBanner: {
        text: ctaText,
        buttonText: ctaButtonText
      }
    }

    try {
      await onSave(newConfig)
      goeyToast.success('Landing page berhasil diperbarui!')
    } catch (e) {
      goeyToast.error('Gagal memperbarui konfigurasi landing page.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 border border-gray-200/80 rounded-2xl shadow-xs text-xs font-medium text-slate-700">
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-sm font-extrabold text-slate-900 font-sora">Desain & Tampilan Landing Page</h3>
        <p className="text-[10px] text-gray-400 mt-1">Konfigurasi visual landing page publik yang dapat dilihat oleh pengunjung sebelum bergabung.</p>
      </div>

      {/* 1. Hero Section Fields */}
      <div className="space-y-4">
        <h4 className="font-extrabold text-[#0F5132] uppercase tracking-wider border-l-4 border-emerald-600 pl-2">1. Bagian Hero & Identitas Utama</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-bold">Badge Hero</label>
            <input type="text" value={heroBadge} onChange={e => setHeroBadge(e.target.value)} className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:border-[#2DB24A] outline-none" required />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-bold">Nama Komunitas (Judul)</label>
            <input type="text" value={heroTitle} onChange={e => setHeroTitle(e.target.value)} className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:border-[#2DB24A] outline-none" required />
          </div>
          <div className="col-span-full">
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-bold">Sub-Slogan (Slogan Tebal)</label>
            <input type="text" value={heroSubtitle} onChange={e => setHeroSubtitle(e.target.value)} className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:border-[#2DB24A] outline-none" required />
          </div>
          <div className="col-span-full">
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-bold">Deskripsi Hero</label>
            <textarea value={heroDescription} onChange={e => setHeroDescription(e.target.value)} rows={3} className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:border-[#2DB24A] outline-none" required />
          </div>
          <div className="col-span-full">
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-bold">Foto Utama Landing Page (Collage Cover)</label>
            <div className="flex gap-4 items-center">
              <input type="text" value={heroCoverUrl} onChange={e => setHeroCoverUrl(e.target.value)} placeholder="https://..." className="flex-1 px-3.5 py-2 border border-gray-200 rounded-xl focus:border-[#2DB24A] outline-none" />
              <label className="px-4 py-2 bg-slate-50 border border-gray-200 hover:bg-slate-100 rounded-xl cursor-pointer flex items-center gap-1.5 font-bold transition-all shadow-3xs shrink-0">
                {uploadingHero ? <Loader2 className="w-4 h-4 animate-spin text-emerald-700" /> : <Upload className="w-4 h-4 text-gray-500" />}
                Unggah Foto
                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUploadImage(e.target.files[0], 'hero')} />
              </label>
            </div>
          </div>
        </div>

        {/* Hero Metadata */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-bold">Didirikan</label>
            <input type="text" value={heroDidirikan} onChange={e => setHeroDidirikan(e.target.value)} className="w-full px-3.5 py-2 border border-gray-200 rounded-xl outline-none" required />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-bold">Ketua</label>
            <input type="text" value={heroKetua} onChange={e => setHeroKetua(e.target.value)} className="w-full px-3.5 py-2 border border-gray-200 rounded-xl outline-none" required />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-bold">Lokasi</label>
            <input type="text" value={heroLokasi} onChange={e => setHeroLokasi(e.target.value)} className="w-full px-3.5 py-2 border border-gray-200 rounded-xl outline-none" required />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-bold">Stat Anggota</label>
            <input type="text" value={heroAnggotaCount} onChange={e => setHeroAnggotaCount(e.target.value)} className="w-full px-3.5 py-2 border border-gray-200 rounded-xl outline-none" required />
          </div>
        </div>

        {/* Hero Quote details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="md:col-span-2">
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-bold">Kata Kutipan (Quote Card)</label>
            <input type="text" value={heroQuoteText} onChange={e => setHeroQuoteText(e.target.value)} className="w-full px-3.5 py-2 border border-gray-200 rounded-xl outline-none" required />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-bold">Penulis Kutipan (Quote Author)</label>
            <input type="text" value={heroQuoteAuthor} onChange={e => setHeroQuoteAuthor(e.target.value)} className="w-full px-3.5 py-2 border border-gray-200 rounded-xl outline-none" required />
          </div>
        </div>
      </div>

      {/* 1.5. Visi & Misi Fields */}
      <div className="space-y-4 pt-4 border-t border-gray-100">
        <h4 className="font-extrabold text-[#0F5132] uppercase tracking-wider border-l-4 border-emerald-600 pl-2">1.5. Visi & Misi {isKoperasi ? 'Koperasi' : 'Perkumpulan'}</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-bold">Visi Komunitas</label>
            <textarea 
              value={vision} 
              onChange={e => setVision(e.target.value)} 
              rows={3} 
              className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:border-[#2DB24A] outline-none" 
              required 
            />
          </div>
          <div className="space-y-3">
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-bold">Misi Komunitas (3 Poin)</label>
            {missions.map((m, idx) => (
              <div key={idx} className="flex gap-3 items-center">
                <span className="font-bold text-gray-400 text-xs w-6">#{idx + 1}</span>
                <input
                  type="text"
                  value={m}
                  onChange={e => {
                    const updated = [...missions]
                    updated[idx] = e.target.value
                    setMissions(updated)
                  }}
                  className="flex-1 px-3.5 py-2 border border-gray-200 rounded-xl focus:border-[#2DB24A] outline-none"
                  required
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Benefits Fields */}
      <div className="space-y-4 pt-4 border-t border-gray-100">
        <h4 className="font-extrabold text-[#0F5132] uppercase tracking-wider border-l-4 border-emerald-600 pl-2">2. Keuntungan Menjadi Anggota (5 Item Grid)</h4>
        <div className="space-y-3">
          {benefits.map((b, idx) => (
            <div key={idx} className="flex gap-4 items-center bg-gray-50/50 p-4 border border-gray-200/50 rounded-2xl">
              <span className="font-extrabold text-sm text-emerald-800 font-sora">#{idx + 1}</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
                <div>
                  <label className="block text-[9px] text-gray-400 font-bold mb-0.5">Judul Keuntungan</label>
                  <input type="text" value={b.title} onChange={e => handleBenefitChange(idx, 'title', e.target.value)} className="w-full px-3 py-1.5 border border-gray-200 rounded-xl bg-white outline-none" required />
                </div>
                <div>
                  <label className="block text-[9px] text-gray-400 font-bold mb-0.5">Deskripsi Singkat</label>
                  <input type="text" value={b.description} onChange={e => handleBenefitChange(idx, 'description', e.target.value)} className="w-full px-3 py-1.5 border border-gray-200 rounded-xl bg-white outline-none" required />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Statistics Fields */}
      <div className="space-y-4 pt-4 border-t border-gray-100">
        <h4 className="font-extrabold text-[#0F5132] uppercase tracking-wider border-l-4 border-emerald-600 pl-2">3. Data Statistik (4 Item Metric)</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {stats.map((s, idx) => (
            <div key={idx} className="bg-gray-50/50 p-4 border border-gray-200/50 rounded-2xl space-y-3">
              <span className="font-black text-xs text-slate-800 font-sora block">Metrik #{idx + 1}</span>
              <div>
                <label className="block text-[9px] text-gray-400 font-bold mb-0.5">Nilai Utama (e.g. 788+ atau Rp 1,2 M+)</label>
                <input type="text" value={s.value} onChange={e => handleStatChange(idx, 'value', e.target.value)} className="w-full px-3 py-1.5 border border-gray-200 rounded-xl bg-white outline-none" required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] text-gray-400 font-bold mb-0.5">Label (e.g. Anggota Aktif)</label>
                  <input type="text" value={s.label} onChange={e => handleStatChange(idx, 'label', e.target.value)} className="w-full px-3 py-1.5 border border-gray-200 rounded-xl bg-white outline-none" required />
                </div>
                <div>
                  <label className="block text-[9px] text-gray-400 font-bold mb-0.5">Keterangan Kecil</label>
                  <input type="text" value={s.desc} onChange={e => handleStatChange(idx, 'desc', e.target.value)} className="w-full px-3 py-1.5 border border-gray-200 rounded-xl bg-white outline-none" required />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Activities Fields */}
      <div className="space-y-4 pt-4 border-t border-gray-100">
        <h4 className="font-extrabold text-[#0F5132] uppercase tracking-wider border-l-4 border-emerald-600 pl-2">4. Kegiatan Terbaru (3 Item)</h4>
        <div className="space-y-4">
          {activities.map((act, idx) => (
            <div key={idx} className="bg-gray-50/50 p-4 border border-gray-200/50 rounded-2xl space-y-3">
              <span className="font-black text-xs text-slate-800 font-sora block">Kegiatan #{idx + 1}</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[9px] text-gray-400 font-bold mb-0.5">Judul Kegiatan</label>
                  <input type="text" value={act.title} onChange={e => handleActivityChange(idx, 'title', e.target.value)} className="w-full px-3 py-1.5 border border-gray-200 rounded-xl bg-white outline-none" required />
                </div>
                <div>
                  <label className="block text-[9px] text-gray-400 font-bold mb-0.5">Kategori (Badge)</label>
                  <input type="text" value={act.category} onChange={e => handleActivityChange(idx, 'category', e.target.value)} className="w-full px-3 py-1.5 border border-gray-200 rounded-xl bg-white outline-none" required />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] text-gray-400 font-bold mb-0.5">Tanggal & Lokasi (e.g. 18 Mei 2024 • Online)</label>
                  <input type="text" value={act.dateLocation} onChange={e => handleActivityChange(idx, 'dateLocation', e.target.value)} className="w-full px-3 py-1.5 border border-gray-200 rounded-xl bg-white outline-none" required />
                </div>
                <div>
                  <label className="block text-[9px] text-gray-400 font-bold mb-0.5">URL Gambar Kegiatan</label>
                  <div className="flex gap-2 items-center">
                    <input type="text" value={act.imageUrl} onChange={e => handleActivityChange(idx, 'imageUrl', e.target.value)} placeholder="https://..." className="flex-1 px-3 py-1.5 border border-gray-200 rounded-xl bg-white outline-none" required />
                    <label className="px-3 py-1.5 bg-slate-50 border border-gray-200 hover:bg-slate-100 rounded-xl cursor-pointer flex items-center gap-1 font-bold transition-all shrink-0">
                      {uploadingActivity === idx ? <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" /> : <Upload className="w-3.5 h-3.5 text-gray-500" />}
                      Unggah
                      <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUploadImage(e.target.files[0], { activityIdx: idx })} />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. CTA Banner Fields */}
      <div className="space-y-4 pt-4 border-t border-gray-100">
        <h4 className="font-extrabold text-[#0F5132] uppercase tracking-wider border-l-4 border-emerald-600 pl-2">5. Banner Promosi Bawah</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-bold">Teks Ajakan Promosi</label>
            <input type="text" value={ctaText} onChange={e => setCtaText(e.target.value)} className="w-full px-3.5 py-2 border border-gray-200 rounded-xl outline-none" required />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-bold">Label Tombol</label>
            <input type="text" value={ctaButtonText} onChange={e => setCtaButtonText(e.target.value)} className="w-full px-3.5 py-2 border border-gray-200 rounded-xl outline-none" required />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-6 border-t border-gray-100 flex justify-end">
        <button type="submit" disabled={saving} className="px-6 py-3 bg-[#2DB24A] hover:bg-[#0F5132] disabled:bg-emerald-300 text-white font-extrabold rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-2 font-sora">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {saving ? 'Menyimpan...' : 'Perbarui Landing Page'}
        </button>
      </div>
    </form>
  )
}
