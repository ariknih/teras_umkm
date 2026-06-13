'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getMyConversations, getChatHistory, sendChat, startChatWithSeller, markChatAsReadAction } from '@/app/actions/chat'
import { createTicketAction, sendCsMessage, getCsChatHistory } from '@/app/actions/cs'
import { getCurrentUser } from '@/app/actions/auth'

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [conversations, setConversations] = useState<any[]>([])
  const [activeRoom, setActiveRoom] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [uploadImage, setUploadImage] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [unreadTotal, setUnreadTotal] = useState(0)
  
  // CS Ticketing states for customer
  const [csTicket, setCsTicket] = useState<any>(null)
  const [isCsMode, setIsCsMode] = useState(false)

  // Responsive mobile view state
  const [activeMobileView, setActiveMobileView] = useState<'list' | 'chat'>('list')

  // 3-Row Contact Option Menu State
  const [showMenu, setShowMenu] = useState(false)

  // Custom alert & prompt dialog states
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false)
  const [ticketMessage, setTicketMessage] = useState('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load user details
  useEffect(() => {
    async function loadUser() {
      const u = await getCurrentUser()
      setCurrentUser(u)
    }
    loadUser()
  }, [])

  // Poll conversation list & unread count
  useEffect(() => {
    if (!currentUser || currentUser.role === 'CUSTOMER_SERVICE') return

    const fetchConvs = async () => {
      const list = await getMyConversations()
      setConversations(list)
      const unread = list.reduce((sum, c) => sum + (c.unreadCount || 0), 0)
      setUnreadTotal(unread)
    }

    fetchConvs()
    const interval = setInterval(fetchConvs, 4000)
    return () => clearInterval(interval)
  }, [currentUser, isOpen])

  // Poll messages inside active chat room
  useEffect(() => {
    if (!activeRoom || !isOpen) return

    const fetchMessages = async () => {
      const history = await getChatHistory(activeRoom.id)
      setMessages(history)
    }

    fetchMessages()
    const interval = setInterval(fetchMessages, 2000)
    return () => clearInterval(interval)
  }, [activeRoom, isOpen])

  // Poll CS messages inside support ticket
  useEffect(() => {
    if (!csTicket || !isOpen || !isCsMode) return

    const fetchCsMessages = async () => {
      const history = await getCsChatHistory(csTicket.id)
      setMessages(history)
      // Check if ticket resolved
      const res = await fetch(`/api/cs/ticket-status?ticketId=${csTicket.id}`)
      if (res.ok) {
        const data = await res.json()
        if (data.status === 'RESOLVED') {
          setCsTicket(null)
          setIsCsMode(false)
          showToast('Tiket bantuan Anda telah diselesaikan oleh CS.')
        }
      }
    }

    fetchCsMessages()
    const interval = setInterval(fetchCsMessages, 2000)
    return () => clearInterval(interval)
  }, [csTicket, isOpen, isCsMode])

  // Auto scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  // Global window event listener to open chat from product pages
  useEffect(() => {
    const handleOpenChatEvent = async (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (!detail || !detail.sellerId) return

      setIsOpen(true)
      setIsCsMode(false)
      setActiveMobileView('chat')
      
      const res = await startChatWithSeller(detail.sellerId, detail.productId)
      if (res.success && res.room) {
        setActiveRoom(res.room)
      } else if (res.error) {
        showToast(res.error)
      }
    }

    window.addEventListener('openTerasChat', handleOpenChatEvent)
    return () => window.removeEventListener('openTerasChat', handleOpenChatEvent)
  }, [])

  if (currentUser?.role === 'CUSTOMER_SERVICE') {
    // Customer Service agents use the dedicated CS panel at /cs, not this floating widget
    return null
  }

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(null)
    }, 4500)
  }

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() && !uploadImage) return

    const text = newMessage
    const img = uploadImage
    setNewMessage('')
    setUploadImage(null)

    // Optimistic UI update
    const tempMsg = {
      id: `temp-${Date.now()}`,
      senderId: currentUser.id,
      content: text,
      imageUrl: img,
      createdAt: new Date(),
      isOptimistic: true
    }
    setMessages(prev => [...prev, tempMsg])

    if (isCsMode && csTicket) {
      const res = await sendCsMessage(csTicket.id, text, false, img || undefined)
      if (res.error) console.error(res.error)
    } else if (activeRoom) {
      const res = await sendChat(activeRoom.id, text, img || undefined)
      if (res.error) console.error(res.error)
    }
  }

  const handleOpenCsCreation = () => {
    setTicketMessage('')
    setIsTicketModalOpen(true)
  }

  const submitTicketModal = async () => {
    if (!ticketMessage.trim()) return
    const msg = ticketMessage
    setTicketMessage('')
    setIsTicketModalOpen(false)

    const res = await createTicketAction(msg)
    if (res.success && res.ticket) {
      setCsTicket(res.ticket)
      setIsCsMode(true)
      setActiveRoom(null)
      setMessages([])
      setActiveMobileView('chat')
      showToast('Tiket dukungan baru berhasil diajukan!')
    } else {
      showToast(res.error || 'Gagal menghubungi Customer Service.')
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

  return (
    <div className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50 font-geist">
      {/* 3-Row Contact Options Menu */}
      <AnimatePresence>
        {showMenu && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="absolute bottom-16 right-0 w-48 bg-surface/95 backdrop-blur-md border border-[#2DB24A]/35 rounded-2xl p-2.5 shadow-2xl flex flex-col gap-1 z-50"
          >
            {/* Livechat Option */}
            <button
              onClick={() => {
                if (!currentUser) {
                  showToast("Silakan login terlebih dahulu untuk menggunakan Livechat Saloka.");
                  return;
                }
                setIsOpen(true)
                setShowMenu(false)
              }}
              className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-[#2DB24A]/10 text-left transition-colors cursor-pointer w-full border-none bg-transparent group"
            >
              <div className="w-6 h-6 rounded-lg bg-[#2DB24A]/10 text-[#2DB24A] flex items-center justify-center text-xs group-hover:bg-[#2DB24A] group-hover:text-white transition-colors shrink-0">
                💬
              </div>
              <div className="leading-tight">
                <span className="block text-[10px] font-extrabold text-foreground">Livechat Saloka</span>
                <span className="block text-[7px] text-foreground/50 font-bold tracking-tight uppercase">Platform Support</span>
              </div>
            </button>

            {/* WhatsApp Option */}
            <a
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setShowMenu(false)}
              className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-green-500/10 text-left transition-colors cursor-pointer w-full group"
            >
              <div className="w-6 h-6 rounded-lg bg-green-500/10 text-green-600 flex items-center justify-center text-xs group-hover:bg-green-500 group-hover:text-white transition-colors shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.739-1.451L0 24zm6.59-4.846c1.666.988 3.311 1.5 5.353 1.502 5.52.002 10.011-4.486 10.014-10.009.002-2.677-1.04-5.193-2.932-7.087-1.892-1.893-4.41-2.934-7.093-2.936-5.525 0-10.016 4.488-10.019 10.012-.001 2.01.523 3.655 1.514 5.323L1.51 21.054l4.908-1.285-.23-.393-.14-.236z"/>
                </svg>
              </div>
              <div className="leading-tight">
                <span className="block text-[10px] font-extrabold text-foreground">WhatsApp Chat</span>
                <span className="block text-[7px] text-green-600 font-bold tracking-tight uppercase">Admin WhatsApp</span>
              </div>
            </a>

            {/* Telegram Option */}
            <a
              href="https://t.me/teras_umkm"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setShowMenu(false)}
              className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-sky-500/10 text-left transition-colors cursor-pointer w-full group"
            >
              <div className="w-6 h-6 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center text-xs group-hover:bg-sky-600 group-hover:text-white transition-colors shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0C5.337 0 0 5.348 0 12c0 6.652 5.337 12 11.944 12 6.607 0 11.944-5.348 11.944-12 0-6.652-5.337-12-11.944-12zm5.728 8.232l-2.008 9.472c-.152.67-.549.835-1.11.519l-3.059-2.257-1.478 1.423c-.164.163-.3.3-.615.3l.22-3.11 5.666-5.116c.246-.22-.054-.34-.383-.12l-7.001 4.41-3.018-.944c-.656-.205-.67-.655.137-.971l11.782-4.542c.546-.2.102.13.003.836z"/>
                </svg>
              </div>
              <div className="leading-tight">
                <span className="block text-[10px] font-extrabold text-foreground">Telegram Support</span>
                <span className="block text-[7px] text-sky-600 font-bold tracking-tight uppercase">CS Telegram</span>
              </div>
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Chat Bubble Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          if (isOpen) {
            setIsOpen(false)
            setShowMenu(false)
          } else {
            setShowMenu(!showMenu)
          }
        }}
        className="w-14 h-14 bg-gradient-to-tr from-[#2DB24A] to-[#259a3f] border border-[#2DB24A]/35 text-white rounded-full shadow-[0_8px_30px_rgba(198,169,107,0.3)] flex items-center justify-center relative cursor-pointer group"
      >
        {isOpen || showMenu ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z" />
          </svg>
        )}
        {unreadTotal > 0 && !isOpen && !showMenu && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center animate-bounce border border-white">
            {unreadTotal}
          </span>
        )}
      </motion.button>

      {/* Slide up Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="absolute bottom-18 right-0 w-[calc(100vw-32px)] sm:w-[420px] max-w-[420px] h-[520px] max-h-[80vh] sm:max-h-none bg-surface/95 backdrop-blur-xl border border-[#2DB24A]/30 rounded-2xl shadow-[0_12px_40px_rgba(115,92,0,0.12)] flex overflow-hidden"
          >
            {/* Left sidebar: Conversations list */}
            <div 
              className={`w-full sm:w-1/3 border-r border-[#2DB24A]/20 bg-surface-container-low/90 flex flex-col justify-between ${
                activeMobileView === 'list' ? 'flex' : 'hidden sm:flex'
              }`}
            >
              <div className="flex-1 overflow-y-auto">
                <div className="p-3 border-b border-border-subtle bg-[#2DB24A]/5">
                  <h4 className="text-[10px] font-extrabold text-[#2DB24A] uppercase tracking-widest">Pesan Masuk</h4>
                </div>
                
                {/* CS Ticket row */}
                <button
                  onClick={() => {
                    setIsCsMode(true)
                    setActiveRoom(null)
                    setActiveMobileView('chat')
                  }}
                  className={`w-full p-2.5 flex items-center gap-2 border-b border-border-subtle text-left transition-colors ${
                    isCsMode ? 'bg-[#2DB24A]/15' : 'hover:bg-surface-container-low'
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-[#2DB24A]/10 flex items-center justify-center text-[#2DB24A] font-bold text-xs">
                    🎧
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-foreground truncate">Bantuan CS</p>
                    <p className="text-[8px] text-foreground/70 truncate font-medium">Hubungi Customer Service</p>
                  </div>
                </button>

                {/* Conversation List */}
                {conversations.length === 0 ? (
                  <p className="text-[9px] text-foreground/50 text-center mt-12 p-3 font-medium">Belum ada obrolan.</p>
                ) : (
                  conversations.map((conv) => {
                    const recipient = conv.buyerId === currentUser.id ? conv.seller : conv.buyer
                    const isActive = activeRoom && activeRoom.id === conv.id && !isCsMode
                    return (
                      <button
                        key={conv.id}
                        onClick={() => {
                          setActiveRoom(conv)
                          setIsCsMode(false)
                          markChatAsReadAction(conv.id)
                          setActiveMobileView('chat')
                        }}
                        className={`w-full p-2.5 flex items-center gap-2 border-b border-border-subtle text-left transition-colors ${
                          isActive ? 'bg-[#2DB24A]/15' : 'hover:bg-surface-container-low'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#2DB24A] to-[#259a3f] flex items-center justify-center text-white font-bold text-[10px]">
                          {recipient?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <p className="text-[10px] font-bold text-foreground truncate">{recipient?.name}</p>
                            {conv.unreadCount > 0 && (
                              <span className="w-3.5 h-3.5 bg-[#2DB24A] text-white font-extrabold text-[8px] rounded-full flex items-center justify-center">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-[8px] text-foreground/70 truncate font-light mt-0.5">
                            {conv.lastMessage?.content || 'Kirim gambar...'}
                          </p>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
              <div className="p-2 border-t border-border-subtle bg-surface-container-low/50">
                <button
                  type="button"
                  onClick={handleOpenCsCreation}
                  className="w-full py-1.5 bg-[#2DB24A]/10 hover:bg-[#2DB24A]/20 border border-[#2DB24A]/30 text-[#2DB24A] font-geist font-bold text-[9px] uppercase tracking-wider rounded-lg transition-colors"
                >
                  🎧 Ajukan Tiket CS
                </button>
              </div>
            </div>

            {/* Right: Active chat window */}
            <div 
              className={`w-full sm:w-2/3 flex flex-col justify-between bg-surface-container-low/30 ${
                activeMobileView === 'chat' ? 'flex' : 'hidden sm:flex'
              }`}
            >
              {/* Header */}
              <div className="p-3 bg-surface border-b border-border-subtle flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                  {/* Mobile Back Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMobileView('list')
                      setActiveRoom(null)
                      setIsCsMode(false)
                    }}
                    className="sm:hidden p-1 text-[#2DB24A] hover:text-[#1e7d32] text-xs font-bold font-geist"
                  >
                    ← Kembali
                  </button>
                  <div>
                    <h4 className="text-[11px] font-bold text-foreground">
                      {isCsMode 
                        ? 'Layanan Customer Service' 
                        : (activeRoom?.buyerId === currentUser?.id ? activeRoom?.seller?.name : activeRoom?.buyer?.name) || 'Pilih Obrolan'}
                    </h4>
                    <p className="text-[7px] font-mono text-foreground/50 uppercase tracking-widest mt-0.5 font-semibold">
                      {isCsMode 
                        ? (csTicket ? `TICKET: ${csTicket.ticketNumber}` : 'Hubungi Dukungan CS') 
                        : (activeRoom ? 'Saloka Live Chat' : 'Pilih percakapan')}
                    </p>
                  </div>
                </div>
                {!isCsMode && activeRoom?.product && (
                  <div className="text-[8px] bg-[#2DB24A]/10 border border-[#2DB24A]/20 px-2 py-0.5 rounded-md text-[#2DB24A] font-semibold truncate max-w-[100px]">
                    🎁 {activeRoom.product.title}
                  </div>
                )}
              </div>

              {/* Chat Canvas Messages */}
              <div ref={scrollRef} className="flex-1 p-3 overflow-y-auto space-y-3 bg-surface/60">
                {isCsMode && !csTicket ? (
                  <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                    <span className="text-3xl mb-3">🎧</span>
                    <p className="text-xs font-bold text-foreground mb-1">Butuh bantuan operasional?</p>
                    <p className="text-[10px] text-foreground/70 leading-relaxed mb-4 font-medium">
                      Silakan hubungi customer service kami untuk keluhan produk, komplain pesanan, atau bantuan ledger saldo.
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenCsCreation}
                      className="px-4 py-2 bg-[#2DB24A] hover:bg-[#1e7d32] text-white font-geist font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all shadow-md shadow-[#2DB24A]/20"
                    >
                      Buka Tiket CS
                    </button>
                  </div>
                ) : !activeRoom && !isCsMode ? (
                  <div className="h-full flex flex-col items-center justify-center p-6 text-center text-foreground/50">
                    <span className="text-2xl mb-2">💬</span>
                    <p className="text-[10px] leading-relaxed font-medium">Silakan pilih salah satu obrolan dari menu kiri atau ajukan tiket bantuan CS baru.</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderId === currentUser.id
                    const isSystem = m.senderId === 'SYSTEM'
                    
                    if (isSystem) {
                      return (
                        <div key={m.id} className="flex justify-center my-2">
                          <span className="bg-[#2DB24A]/10 border border-[#2DB24A]/20 text-[#2DB24A] text-[8px] font-medium px-2 py-1 rounded-md max-w-[85%] text-center leading-relaxed">
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
                          className={`max-w-[80%] rounded-2xl p-2.5 shadow-sm text-xs leading-relaxed ${
                            isMe
                              ? 'bg-gradient-to-br from-[#2DB24A]/20 to-[#2DB24A]/10 border border-[#2DB24A]/30 text-foreground rounded-tr-none'
                              : 'bg-surface border border-border-subtle text-foreground rounded-tl-none shadow-sm'
                          }`}
                        >
                          {m.imageUrl && (
                            <img src={m.imageUrl} alt="attached media" className="rounded-lg max-h-36 object-contain mb-1.5" />
                          )}
                          <p className="text-[10px] whitespace-pre-wrap font-medium">{m.content}</p>
                          <div className="flex justify-end items-center gap-1 mt-1 text-[7px] text-foreground/50 font-semibold">
                            <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isMe && (
                              <span>{m.isOptimistic ? '⏳' : '✓'}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-surface border border-border-subtle shadow-sm rounded-xl px-3 py-2 text-[10px] text-foreground/50 font-medium">
                      Sedang mengetik...
                    </div>
                  </div>
                )}
              </div>

              {/* Composer Input Bar */}
              {(activeRoom || (isCsMode && csTicket)) && (
                <div className="p-3 bg-surface border-t border-border-subtle space-y-2">
                  {uploadImage && (
                    <div className="relative inline-block border border-border-subtle p-1 rounded-lg bg-surface-container">
                      <img src={uploadImage} alt="preview" className="h-10 w-10 object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={() => setUploadImage(null)}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 text-[9px] flex items-center justify-center font-bold"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  <form onSubmit={handleSendChat} className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 border border-border-subtle bg-surface-container hover:bg-surface-container-low hover:border-[#2DB24A]/30 rounded-lg hover:text-[#2DB24A] transition-colors text-xs flex items-center justify-center shrink-0 cursor-pointer"
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
                    <input
                      type="text"
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      placeholder="Tulis pesan..."
                      className="flex-1 px-3 py-1.5 bg-surface-container border border-border-subtle rounded-lg text-xs text-foreground placeholder:text-foreground/50 focus:outline-none focus:border-[#2DB24A]/40 font-medium"
                    />
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-[#2DB24A] hover:bg-[#1e7d32] text-white font-geist font-bold text-xs uppercase rounded-lg transition-colors shrink-0 cursor-pointer shadow-md shadow-[#2DB24A]/10"
                    >
                      Kirim
                    </button>
                  </form>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Premium Gold/Dark Modal Overlay for CS Ticket Creation */}
      <AnimatePresence>
        {isTicketModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-surface border border-[#2DB24A]/30 rounded-2xl p-6 shadow-[0_20px_50px_rgba(115,92,0,0.15)]"
            >
              <div className="flex items-center gap-3 mb-4 border-b border-border-subtle pb-3">
                <span className="w-8 h-8 rounded-full bg-[#2DB24A]/10 flex items-center justify-center text-[#2DB24A] text-sm">
                  🎧
                </span>
                <div>
                  <h3 className="font-sora text-sm font-bold text-foreground">Buka Tiket Bantuan CS</h3>
                  <p className="text-[8px] text-foreground/50 font-geist uppercase tracking-wider mt-0.5 font-bold">Saloka Customer Service</p>
                </div>
              </div>
              
              <p className="text-xs text-foreground/80 leading-relaxed mb-4 font-medium">
                Silakan tuliskan keluhan, pertanyaan produk, atau kendala transaksi/saldo Anda. Agen CS kami akan segera merespon secara real-time.
              </p>
              
              <textarea
                rows={4}
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                placeholder="Tulis keluhan atau pertanyaan Anda secara lengkap di sini..."
                className="w-full px-4 py-3 bg-surface-container border border-border-subtle focus:border-[#2DB24A]/40 rounded-lg text-xs text-foreground placeholder:text-foreground/50 outline-none resize-none mb-4 transition-all font-medium"
              />
              
              <div className="flex justify-end gap-2 text-xs font-geist">
                <button
                  type="button"
                  onClick={() => { setIsTicketModalOpen(false); setTicketMessage(''); }}
                  className="px-4 py-2 border border-border-subtle hover:bg-surface-container-low text-foreground/70 font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={submitTicketModal}
                  className="px-4 py-2 bg-[#2DB24A] hover:bg-[#1e7d32] text-white font-extrabold rounded-lg transition-colors cursor-pointer shadow-md shadow-[#2DB24A]/15"
                >
                  Ajukan Tiket
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Premium Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 right-6 z-50 px-4 py-3 bg-[#2DB24A] text-white font-bold text-xs rounded-lg shadow-2xl flex items-center gap-2"
          >
            <span>✓</span>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
