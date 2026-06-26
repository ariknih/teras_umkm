'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { MessageSquare } from 'lucide-react'
import { getMyConversations } from '@/app/actions/chat'

export default function ChatHeaderButton({ userId }: { userId?: string }) {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!userId) return

    const updateUnreadCount = async () => {
      try {
        const list = await getMyConversations()
        const count = list.reduce((sum, c) => sum + (c.unreadCount || 0), 0)
        setUnreadCount(count)
      } catch (e) {
        console.error('Failed to fetch unread count', e)
      }
    }

    updateUnreadCount()

    // Poll every 4 seconds to keep in sync
    const interval = setInterval(updateUnreadCount, 4000)

    return () => clearInterval(interval)
  }, [userId])

  return (
    <Link
      href="/chat"
      className="relative w-8 h-8 rounded-full border border-outline-variant/15 hover:border-primary bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-text-secondary hover:text-primary transition-all duration-300 cursor-pointer shadow-sm outline-none group"
      id="global-chat-header-button"
      title="Chat Obrolan"
    >
      <MessageSquare size={14} className="group-hover:scale-110 transition-transform duration-300" />
      {unreadCount > 0 && (
        <span 
          id="chat-unread-badge"
          className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-1 rounded-full bg-red-500 text-white font-geist font-black text-[8px] flex items-center justify-center border border-white animate-pulse"
        >
          {unreadCount}
        </span>
      )}
    </Link>
  )
}
