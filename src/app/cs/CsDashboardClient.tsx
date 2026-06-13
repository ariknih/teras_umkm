'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { 
  getAgentTickets, 
  assignTicketAction, 
  sendCsMessage, 
  getCsChatHistory, 
  resolveTicketAction, 
  escalateTicketAction, 
  getCsAnalytics 
} from '@/app/actions/cs'

interface CsDashboardClientProps {
  currentUser: any
  initialTickets: any[]
}

export default function CsDashboardClient({ currentUser, initialTickets }: CsDashboardClientProps) {
  const router = useRouter()
  const [tickets, setTickets] = useState<any[]>(initialTickets)
  const [activeTicket, setActiveTicket] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isInternalNote, setIsInternalNote] = useState(false)
  const [uploadImage, setUploadImage] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<any>({
    totalTicketsToday: initialTickets.length,
    openTickets: initialTickets.filter(t => t.status === 'OPEN').length,
    pendingTickets: initialTickets.filter(t => t.status === 'PENDING').length,
    resolvedTickets: initialTickets.filter(t => t.status === 'RESOLVED').length,
    escalatedTickets: initialTickets.filter(t => t.status === 'ESCALATED').length,
    avgResponseTime: '3.4 menit',
    activeAgents: 1,
    resolutionRate: 85,
    csatScore: '4.85 / 5.00'
  })
  const [selectedFilter, setSelectedFilter] = useState<'OPEN' | 'PENDING' | 'RESOLVED' | 'ESCALATED'>('OPEN')

  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Poll support tickets queue & analytics
  useEffect(() => {
    const fetchQueue = async () => {
      const list = await getAgentTickets()
      setTickets(list)
      const stats = await getCsAnalytics()
      if (stats) setAnalytics(stats)
    }

    const interval = setInterval(fetchQueue, 4000)
    return () => clearInterval(interval)
  }, [])

  // Poll active ticket support messages
  useEffect(() => {
    if (!activeTicket) return

    const fetchMessages = async () => {
      const history = await getCsChatHistory(activeTicket.id)
      setMessages(history)
    }

    fetchMessages()
    const interval = setInterval(fetchMessages, 2500)
    return () => clearInterval(interval)
  }, [activeTicket])

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleAssignTicket = async (ticketId: string) => {
    const res = await assignTicketAction(ticketId)
    if (res.success && res.ticket) {
      setActiveTicket(res.ticket)
      // refresh lists
      const list = await getAgentTickets()
      setTickets(list)
    } else {
      alert(res.error || 'Gagal mengambil tiket.')
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() && !uploadImage) return

    const text = newMessage
    const img = uploadImage
    const note = isInternalNote

    setNewMessage('')
    setUploadImage(null)

    // Optimistic UI Message
    const tempMsg = {
      id: `temp-${Date.now()}`,
      senderId: currentUser.id,
      content: text,
      isInternalNote: note,
      imageUrl: img,
      createdAt: new Date(),
      isOptimistic: true
    }
    setMessages(prev => [...prev, tempMsg])

    const res = await sendCsMessage(activeTicket.id, text, note, img || undefined)
    if (res.error) {
      alert(res.error)
    }
  }

  const handleResolveTicket = async () => {
    if (!activeTicket) return
    if (!confirm('Apakah Anda yakin ingin menyelesaikan sesi dukungan ini?')) return

    const res = await resolveTicketAction(activeTicket.id)
    if (res.success) {
      setActiveTicket(null)
      const list = await getAgentTickets()
      setTickets(list)
    } else {
      alert(res.error)
    }
  }

  const handleEscalateTicket = async () => {
    if (!activeTicket) return
    if (!confirm('Eskalasi tiket ini ke Super Admin?')) return

    const res = await escalateTicketAction(activeTicket.id)
    if (res.success) {
      setActiveTicket(null)
      const list = await getAgentTickets()
      setTickets(list)
    } else {
      alert(res.error)
    }
  }

  const handleImageUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setUploadImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Pre-typed quick reply macros
  const handleQuickReply = (text: string) => {
    setNewMessage(text)
  }

  const filteredTickets = tickets.filter(t => t.status === selectedFilter)

  return (
    <div className="min-h-screen bg-bg-dark text-text-primary flex flex-col font-geist">
      {/* CS Top Navigation Header */}
      <header className="w-full bg-surface-dark border-b border-border-subtle px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="btn-primary w-8 bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-sm">
            🎧
          </div>
          <div>
            <h1 className="font-sora text-sm font-bold text-text-primary">
              Saloka<span className="text-primary">CS Support Desk.</span>
            </h1>
            <p className="text-[9px] font-mono text-text-secondary/70 uppercase tracking-widest mt-0.5">
              WORKSPACE PETUGAS CUSTOMER SERVICE
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col text-right">
            <span className="text-[10px] font-semibold text-text-primary">{currentUser.name}</span>
            <span className="text-[8px] text-primary font-bold uppercase tracking-wider">Staff Customer Service</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-primary-container flex items-center justify-center text-white font-bold text-xs">
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* Main Workspace layout */}
      <div className="flex-1 flex overflow-hidden max-h-[calc(100vh-68px)]">
        
        {/* Left Sidebar: Tickets queue */}
        <aside className="w-80 border-r border-border-subtle bg-surface-dark/40 flex flex-col justify-between">
          <div className="flex-1 flex flex-col min-h-0">
            {/* Filter buttons */}
            <div className="grid grid-cols-4 border-b border-border-subtle text-[9px] font-bold font-geist uppercase text-center bg-surface-dark/95">
              {(['OPEN', 'PENDING', 'RESOLVED', 'ESCALATED'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setSelectedFilter(f)}
                  className={`py-3 transition-colors border-r border-border-subtle last:border-0 ${
                    selectedFilter === f 
                      ? 'text-primary bg-primary/5 font-extrabold border-b-2 border-b-primary' 
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {f === 'OPEN' ? 'Antrean' : f === 'PENDING' ? 'Aktif' : f === 'RESOLVED' ? 'Selesai' : 'Eskalasi'}
                </button>
              ))}
            </div>

            {/* Tickets list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <div className="flex justify-between items-center text-[10px] text-text-secondary/70 uppercase tracking-wider pb-1">
                <span>Daftar Sesi {selectedFilter}</span>
                <span className="btn-primary bg-primary/10 border border-primary/20 text-primary text-[8px]">
                  {filteredTickets.length} Tiket
                </span>
              </div>

              {filteredTickets.length === 0 ? (
                <div className="text-center py-12 text-text-secondary/50 text-[10px]">
                  Tidak ada tiket dengan status {selectedFilter}.
                </div>
              ) : (
                filteredTickets.map(t => {
                  const isActive = activeTicket && activeTicket.id === t.id
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTicket(t)}
                      className={`w-full text-left p-3 border rounded-xl transition-all duration-200 ${
                        isActive 
                          ? 'bg-primary/10 border-primary/45 shadow' 
                          : 'bg-surface-dark border-border-subtle hover:border-primary/25'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-mono text-[9px] font-bold text-primary">{t.ticketNumber}</span>
                        <span className="text-[7.5px] text-text-secondary">
                          {new Date(t.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <h4 className="text-[11px] font-bold text-text-primary truncate">{t.customer?.name || 'Pelanggan'}</h4>
                      <p className="text-[9px] text-text-secondary truncate mt-1">
                        {t.lastMessage?.content || 'Belum ada pesan.'}
                      </p>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Quick CS analytics card in sidebar */}
          <div className="p-4 border-t border-border-subtle bg-surface-dark/95 space-y-3">
            <h4 className="text-[9px] font-bold text-text-secondary/80 uppercase tracking-widest pb-1 border-b border-border-subtle">
              Indikator CS Hari Ini
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-surface-container/30 border border-border-subtle p-2 rounded-lg">
                <span className="text-[8px] text-text-secondary block">Total Tiket</span>
                <span className="font-extrabold text-text-primary">{analytics.totalTicketsToday}</span>
              </div>
              <div className="bg-surface-container/30 border border-border-subtle p-2 rounded-lg">
                <span className="text-[8px] text-text-secondary block">CSAT Score</span>
                <span className="font-extrabold text-primary">{analytics.csatScore.split(' ')[0]}</span>
              </div>
              <div className="bg-surface-container/30 border border-border-subtle p-2 rounded-lg">
                <span className="text-[8px] text-text-secondary block">Waktu Respon</span>
                <span className="font-extrabold text-text-primary">{analytics.avgResponseTime}</span>
              </div>
              <div className="bg-surface-container/30 border border-border-subtle p-2 rounded-lg">
                <span className="text-[8px] text-text-secondary block">Selesai</span>
                <span className="font-extrabold text-green-400">{analytics.resolutionRate}%</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Center: Live support chat box */}
        <section className="flex-1 flex flex-col justify-between bg-surface-container/5 relative">
          
          {activeTicket ? (
            <>
              {/* Active Ticket Header & Actions */}
              <div className="bg-surface-dark border-b border-border-subtle px-6 py-4 flex justify-between items-center z-10 shadow-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary">{activeTicket.ticketNumber}</span>
                    <span className={`px-1.5 py-0.5 border rounded text-[7.5px] font-bold uppercase tracking-wider ${
                      activeTicket.status === 'OPEN' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                      activeTicket.status === 'PENDING' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
                      activeTicket.status === 'RESOLVED' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                      'bg-purple-500/10 border-purple-500/30 text-purple-400'
                    }`}>
                      {activeTicket.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-text-primary mt-1">
                    Sesi Chat: {activeTicket.customer?.name || 'Pelanggan'}
                  </h3>
                </div>

                <div className="flex gap-2">
                  {activeTicket.status === 'OPEN' && (
                    <button
                      onClick={() => handleAssignTicket(activeTicket.id)}
                      className="btn-primary text-[10px] shadow"
                    >
                      ✓ Ambil Tiket
                    </button>
                  )}
                  
                  {activeTicket.status === 'PENDING' && (
                    <>
                      <button
                        onClick={handleEscalateTicket}
                        className="px-4 py-2 bg-surface-container border border-border-subtle hover:bg-surface-container-high text-yellow-500 font-geist font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all"
                      >
                        ⚠️ Eskalasi
                      </button>
                      <button
                        onClick={handleResolveTicket}
                        className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-geist font-bold text-[10px] uppercase tracking-wider rounded-lg shadow transition-all"
                      >
                        ✓ Selesaikan
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Chat Canvas Messages list */}
              <div ref={scrollRef} className="flex-grow p-6 overflow-y-auto space-y-4 bg-surface-dark/20">
                {messages.map((m) => {
                  const isMe = m.senderId === currentUser.id
                  const isSystem = m.senderId === 'SYSTEM'

                  if (isSystem) {
                    return (
                      <div key={m.id} className="flex justify-center my-3">
                        <span className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 text-[9px] font-medium px-3 py-1.5 rounded-lg max-w-[80%] text-center">
                          📢 {m.content}
                        </span>
                      </div>
                    )
                  }

                  return (
                    <div
                      key={m.id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-xl p-3.5 shadow-sm text-xs leading-relaxed ${
                          m.isInternalNote
                            ? 'bg-yellow-500/10 border border-yellow-500/20 text-text-primary rounded-tr-none'
                            : isMe
                              ? 'bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 text-text-primary rounded-tr-none'
                              : 'bg-surface-dark border border-border-subtle text-text-primary rounded-tl-none'
                        }`}
                      >
                        {m.isInternalNote && (
                          <span className="block text-[7.5px] font-bold text-yellow-500 uppercase tracking-widest mb-1">
                            📌 CATATAN INTERNAL (Hanya Agen)
                          </span>
                        )}
                        {m.imageUrl && (
                          <img src={m.imageUrl} alt="attached media" className="rounded-lg max-h-48 object-contain mb-2" />
                        )}
                        <p>{m.content}</p>
                        <div className="flex justify-end items-center gap-1 mt-1.5 text-[7px] text-text-secondary/50">
                          <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {isMe && <span>{m.isOptimistic ? '⏳' : '✓'}</span>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Chat composer with Quick Macros */}
              <div className="p-4 bg-surface-dark border-t border-border-subtle space-y-3 z-10">
                {/* Quick reply Macros */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[9px]">
                  <span className="font-bold text-text-secondary uppercase">Macros:</span>
                  {[
                    'Halo, ada yang bisa kami bantu?',
                    'Mohon lampirkan ID transaksi Anda.',
                    'Tiket Anda telah kami teruskan ke Super Admin.',
                    'Mohon maaf atas ketidaknyamanannya.',
                    'Sesi CS ditutup. Terima kasih.'
                  ].map(reply => (
                    <button
                      key={reply}
                      type="button"
                      onClick={() => handleQuickReply(reply)}
                      className="px-3 py-1 bg-surface-container border border-border-subtle rounded-full text-text-secondary hover:text-text-primary hover:border-primary/30 transition-all whitespace-nowrap"
                    >
                      {reply}
                    </button>
                  ))}
                </div>

                {uploadImage && (
                  <div className="relative inline-block border border-border-subtle p-1.5 rounded-lg bg-surface-container">
                    <img src={uploadImage} alt="preview" className="h-16 w-16 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => setUploadImage(null)}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center shadow"
                    >
                      ×
                    </button>
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                  {/* Image attachment trigger */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 border border-border-subtle bg-surface-container rounded-xl hover:text-primary transition-colors text-sm"
                    title="Upload Image"
                  >
                    📷
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUploadChange}
                    accept="image/*"
                    className="hidden"
                  />

                  {/* Mode Toggler: Chat vs Internal Note */}
                  <button
                    type="button"
                    onClick={() => setIsInternalNote(!isInternalNote)}
                    className={`px-3 py-2 border rounded-xl text-[9px] font-geist font-bold uppercase transition-all whitespace-nowrap ${
                      isInternalNote 
                        ? 'bg-yellow-500/20 border-yellow-500/35 text-yellow-500' 
                        : 'bg-surface-container border-border-subtle text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {isInternalNote ? '📌 internal note' : '💬 chat'}
                  </button>

                  <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder={isInternalNote ? 'Tulis catatan internal (Hanya terlihat oleh agen)...' : 'Ketik tanggapan Anda ke pelanggan...'}
                    className={`flex-grow px-4 py-2.5 bg-surface-container border rounded-xl text-xs text-text-primary focus:outline-none transition-colors ${
                      isInternalNote ? 'focus:border-yellow-500/50' : 'focus:border-primary/45'
                    }`}
                  />
                  
                  <button
                    type="submit"
                    className="btn-primary text-xs"
                  >
                    Kirim
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-surface-dark/15 backdrop-blur-sm">
              <span className="text-4xl mb-4 animate-bounce">🎧</span>
              <h3 className="font-sora text-base font-bold text-text-primary mb-2">Workspace Layanan Pelanggan</h3>
              <p className="text-xs text-text-secondary max-w-sm leading-relaxed">
                Silakan pilih tiket di antrean antrean baru atau penugasan aktif Anda di sidebar kiri untuk memulai percakapan bantuan secara real-time.
              </p>
            </div>
          )}
        </section>

        {/* Right sidebar: Customer profile details inspector */}
        {activeTicket && (
          <aside className="w-80 border-l border-border-subtle bg-surface-dark/40 p-6 space-y-6 overflow-y-auto">
            <div>
              <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest pb-1 border-b border-border-subtle mb-4">
                Informasi Pelanggan
              </h4>
              <div className="flex flex-col items-center text-center p-4 bg-surface-dark border border-border-subtle rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-primary-container flex items-center justify-center text-white font-extrabold text-base mb-3 shadow">
                  {activeTicket.customer?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <h4 className="text-xs font-bold text-text-primary">{activeTicket.customer?.name || 'Pelanggan'}</h4>
                <p className="text-[9px] text-text-secondary mt-1">{activeTicket.customer?.email}</p>
                <div className="flex gap-2 mt-3">
                  <span className="btn-primary bg-primary/10 border border-primary/20 text-primary text-[8px]">
                    Level {activeTicket.customer?.level || 1}
                  </span>
                  <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full text-[8px] font-bold uppercase">
                    {activeTicket.customer?.membershipLevel || 'Reseller'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest pb-1 border-b border-border-subtle mb-3">
                Histori Transaksi
              </h4>
              <div className="space-y-2">
                <div className="p-3 bg-surface-dark border border-border-subtle rounded-xl text-[10px]">
                  <div className="flex justify-between font-bold mb-1">
                    <span className="text-primary font-mono">TRX-7791A4</span>
                    <span className="text-green-400">PAID</span>
                  </div>
                  <p className="text-text-secondary">Artisan Sourdough Starter Kit</p>
                  <p className="font-extrabold text-text-primary mt-1">Rp 64.000</p>
                </div>
                <div className="p-3 bg-surface-dark border border-border-subtle rounded-xl text-[10px]">
                  <div className="flex justify-between font-bold mb-1">
                    <span className="text-primary font-mono">TRX-8314BB</span>
                    <span className="text-green-400">PAID</span>
                  </div>
                  <p className="text-text-secondary">Premium Typography Booklet</p>
                  <p className="font-extrabold text-text-primary mt-1">Rp 110.000</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest pb-1 border-b border-border-subtle mb-3">
                Catatan Pengaduan
              </h4>
              <p className="text-[10px] text-text-secondary leading-relaxed bg-yellow-500/5 border border-yellow-500/10 p-3 rounded-xl">
                Pelanggan menanyakan status rute Maps checkout yang sempat tidak terdeteksi. Dipandu menggunakan update penarikan pin manual.
              </p>
            </div>
          </aside>
        )}

      </div>
    </div>
  )
}
