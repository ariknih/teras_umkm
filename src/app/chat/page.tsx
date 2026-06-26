'use client'

import React, { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getMyConversations, getChatHistory, sendChat, startChatWithSeller, markChatAsReadAction } from '@/app/actions/chat'
import { getCurrentUser } from '@/app/actions/auth'
import { Send, Image as ImageIcon, ArrowLeft, MessageSquare, ShieldAlert, Loader2, Sparkles, Smile } from 'lucide-react'
import Link from 'next/link'
import { goeyToast } from 'goey-toast'

function ChatClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sellerIdParam = searchParams.get('sellerId')
  const productIdParam = searchParams.get('productId')

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [conversations, setConversations] = useState<any[]>([])
  const [activeRoom, setActiveRoom] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [uploadImage, setUploadImage] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 1. Load current user details
  useEffect(() => {
    async function loadUser() {
      try {
        const u = await getCurrentUser()
        if (!u) {
          router.push('/?login=true')
          return
        }
        setCurrentUser(u)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadUser()
  }, [router])

  // 2. Start chat with seller from URL params if provided
  useEffect(() => {
    if (!currentUser || !sellerIdParam) return

    async function initSellerChat() {
      try {
        const res = await startChatWithSeller(sellerIdParam!, productIdParam || undefined)
        if (res.success && res.room) {
          setActiveRoom(res.room)
          // Clear query params to prevent re-triggering on reload
          router.replace('/chat')
        } else if (res.error) {
          goeyToast.error(res.error)
        }
      } catch (err) {
        console.error(err)
      }
    }
    initSellerChat()
  }, [currentUser, sellerIdParam, productIdParam, router])

  // 3. Poll conversations list
  useEffect(() => {
    if (!currentUser) return

    const fetchConvs = async () => {
      const list = await getMyConversations()
      setConversations(list)
    }

    fetchConvs()
    const interval = setInterval(fetchConvs, 4000)
    return () => clearInterval(interval)
  }, [currentUser])

  // 4. Poll messages in active room
  useEffect(() => {
    if (!activeRoom) return

    const fetchMessages = async () => {
      const history = await getChatHistory(activeRoom.id)
      setMessages(history)
    }

    fetchMessages()
    const interval = setInterval(fetchMessages, 2000)
    return () => clearInterval(interval)
  }, [activeRoom])

  // 5. Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // 6. Handle sending message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() && !uploadImage) return
    if (!activeRoom) return

    const text = newMessage
    const img = uploadImage
    setNewMessage('')
    setUploadImage(null)

    // Optimistically prepend locally
    const tempMsg = {
      id: `temp-${Date.now()}`,
      content: text,
      imageUrl: img,
      senderId: currentUser.id,
      createdAt: new Date().toISOString(),
      isPending: true
    }
    setMessages((prev) => [...prev, tempMsg])

    try {
      const res = await sendChat(activeRoom.id, text, img || undefined)
      if (res.error) {
        goeyToast.error(res.error)
        // Remove temp message if failed
        setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id))
      } else {
        // Fetch latest messages
        const history = await getChatHistory(activeRoom.id)
        setMessages(history)
      }
    } catch (err) {
      console.error(err)
      goeyToast.error('Gagal mengirim pesan.')
    }
  }

  // 7. Handle Image attachment upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('folder', 'chat')

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Gagal mengunggah gambar.')
      }
      setUploadImage(data.url)
      goeyToast.success('Gambar berhasil dilampirkan!')
    } catch (err: any) {
      goeyToast.error(err.message || 'Gagal mengunggah gambar.')
    } finally {
      setUploadingImage(false)
    }
  }

  // Helper to determine recipient details in room
  const getRecipient = (room: any) => {
    if (!currentUser) return null
    return room.buyerId === currentUser.id ? room.seller : room.buyer
  }

  // Filter room list by search query
  const filteredConversations = conversations.filter((c) => {
    const r = getRecipient(c)
    return r?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#2DB24A] animate-spin mb-3" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Memuat Chat...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] pt-24 pb-12 px-4 md:px-10">
      <div className="max-w-[1280px] mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex h-[78vh]">
        
        {/* LEFT PANEL: Chat rooms list */}
        <div className="w-full md:w-[350px] border-r border-slate-200 flex flex-col shrink-0 bg-white">
          <div className="p-4 border-b border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <h1 className="font-sora font-extrabold text-slate-800 text-base flex items-center gap-2">
                <span>💬</span> Hubungi Penjual
              </h1>
              <Link href="/market" className="text-[10px] text-[#2DB24A] hover:underline font-bold uppercase tracking-wider flex items-center gap-1">
                <ArrowLeft size={10} /> Kembali Belanja
              </Link>
            </div>
            <input
              type="text"
              placeholder="Cari toko atau pembeli..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#2DB24A]"
            />
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <MessageSquare className="w-8 h-8 mx-auto opacity-50" />
                <p className="text-xs font-bold">Belum ada obrolan</p>
                <p className="text-[10px] text-slate-400 leading-normal">Mulai chat dengan merchant/toko dari halaman produk atau keranjang.</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const recipient = getRecipient(conv)
                const isSelected = activeRoom?.id === conv.id
                const unread = conv.unreadCount || 0

                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={async () => {
                      setActiveRoom(conv)
                      await markChatAsReadAction(conv.id)
                    }}
                    className={`w-full p-4 flex gap-3 text-left transition-colors items-center hover:bg-slate-50 ${isSelected ? 'bg-slate-50/80 border-l-4 border-l-[#2DB24A]' : ''}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2DB24A] to-[#0F5132] text-white font-extrabold flex items-center justify-center shrink-0 shadow-sm relative overflow-hidden">
                      {recipient?.image ? (
                        <img src={recipient.image} alt={recipient.name} className="w-full h-full object-cover" />
                      ) : (
                        recipient?.name?.charAt(0).toUpperCase() || 'U'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="font-sora font-bold text-xs text-slate-800 truncate">{recipient?.name || 'Toko Saloka'}</span>
                        <span className="text-[9px] text-slate-400 font-medium">
                          {conv.lastMessage?.createdAt 
                            ? new Date(conv.lastMessage.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) 
                            : ''
                          }
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">
                        {conv.lastMessage?.content || (conv.lastMessage?.imageUrl ? '📷 [Gambar]' : 'Belum ada pesan')}
                      </p>
                    </div>
                    {unread > 0 && (
                      <span className="w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[8px] font-black shrink-0">
                        {unread}
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Chat message workspace */}
        <div className="flex-1 flex flex-col bg-slate-50/50">
          {activeRoom ? (
            <>
              {/* Room Header */}
              {(() => {
                const recipient = getRecipient(activeRoom)
                return (
                  <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#2DB24A] text-white font-extrabold flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                        {recipient?.image ? (
                          <img src={recipient.image} alt={recipient.name} className="w-full h-full object-cover" />
                        ) : (
                          recipient?.name?.charAt(0).toUpperCase() || 'U'
                        )}
                      </div>
                      <div>
                        <h3 className="font-sora font-extrabold text-xs text-slate-800">{recipient?.name || 'Toko UMKM'}</h3>
                        <span className="text-[9px] text-emerald-600 font-bold block mt-0.5">🟢 Online • Siap melayani</span>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Messages Body */}
              <div ref={scrollRef} className="flex-1 p-5 overflow-y-auto space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-20 text-slate-400 space-y-2">
                    <Sparkles className="w-6 h-6 mx-auto text-[#2DB24A] opacity-60" />
                    <p className="text-[11px] font-bold text-slate-600">Mulai Obrolan Baru</p>
                    <p className="text-[10px] text-slate-400 leading-normal max-w-xs mx-auto">Kirim pesan ke toko untuk menanyakan ketersediaan produk atau proses pengiriman barang.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === currentUser?.id
                    const msgTime = new Date(msg.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] space-y-1.5`}>
                          <div className={`p-3.5 rounded-2xl shadow-sm text-xs leading-relaxed ${
                            isMe 
                              ? 'bg-[#2DB24A] text-white rounded-tr-none' 
                              : 'bg-white border border-slate-200/60 text-slate-800 rounded-tl-none'
                          }`}>
                            {msg.imageUrl && (
                              <div className="mb-2 max-w-[200px] rounded-lg overflow-hidden border border-black/5 bg-slate-100">
                                <img src={msg.imageUrl} alt="Lampiran" className="object-cover w-full h-full max-h-[160px]" />
                              </div>
                            )}
                            {msg.content && <p>{msg.content}</p>}
                          </div>
                          <span className={`block text-[8px] font-medium text-slate-400 mt-1 px-1 ${isMe ? 'text-right' : 'text-left'}`}>
                            {msgTime} {msg.isPending && ' • Mengirim...'}
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Input Area */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 bg-white space-y-3">
                {uploadImage && (
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2 rounded-xl w-fit relative animate-in fade-in slide-in-from-bottom-2">
                    <img src={uploadImage} alt="Preview" className="w-12 h-12 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => setUploadImage(null)}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold"
                    >
                      ✕
                    </button>
                  </div>
                )}
                
                <div className="flex gap-2.5 items-center">
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploadingImage}
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-400 hover:text-slate-600 disabled:opacity-50 cursor-pointer"
                    title="Kirim Gambar"
                  >
                    {uploadingImage ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#2DB24A]" />
                    ) : (
                      <ImageIcon size={18} />
                    )}
                  </button>

                  <input
                    type="text"
                    placeholder="Ketik pesan Anda di sini..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-grow h-10 px-4 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#2DB24A] bg-slate-50/50"
                  />

                  <button
                    type="submit"
                    disabled={!newMessage.trim() && !uploadImage}
                    className="h-10 w-10 bg-[#2DB24A] hover:bg-[#2DB24A]/90 text-white rounded-lg transition-colors flex items-center justify-center shadow disabled:opacity-50 cursor-pointer"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/30">
              <div className="w-16 h-16 rounded-full bg-[#EAF5ED] text-[#2DB24A] flex items-center justify-center mb-4 border border-emerald-100">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h2 className="font-sora text-sm font-bold text-slate-800 mb-1">Mulai Obrolan Real-Time</h2>
              <p className="text-[11px] text-slate-500 max-w-xs leading-normal">
                Pilih obrolan aktif dari panel sebelah kiri atau hubungi penjual dari halaman produk untuk berkonsultasi mengenai detail belanjaan Anda.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#2DB24A] animate-spin mb-3" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Memuat Chat...</span>
      </div>
    }>
      <ChatClient />
    </Suspense>
  )
}
