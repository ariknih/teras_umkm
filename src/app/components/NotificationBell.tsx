'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'

interface Notification {
  id: string
  title: string
  body: string
  type: string
  isRead: boolean
  linkUrl?: string | null
  createdAt: string | Date
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter(n => !n.isRead).length

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          setNotifications(data)
        }
      }
    } catch (e) {
      console.error('Gagal mengambil notifikasi:', e)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Poll every 15 seconds
    const interval = setInterval(fetchNotifications, 15000)
    return () => clearInterval(interval)
  }, [])

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/notifications', { method: 'POST' })
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const formatTime = (dateStr: string | Date) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    
    if (diffMins < 1) return 'Baru saja'
    if (diffMins < 60) return `${diffMins}m yang lalu`
    if (diffHours < 24) return `${diffHours}j yang lalu`
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button
        id="notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-8 h-8 rounded-full border border-outline-variant/15 hover:border-primary bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-text-secondary hover:text-primary transition-all duration-300 cursor-pointer shadow-sm outline-none"
      >
        <Bell size={15} />
        {unreadCount > 0 && (
          <span 
            id="notification-badge"
            className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-1 rounded-full bg-red-500 text-white font-geist font-black text-[8px] flex items-center justify-center border border-white animate-bounce"
          >
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div 
          id="notification-dropdown"
          className="absolute right-0 mt-3.5 w-80 bg-surface-dark border border-border-subtle rounded-xl shadow-2xl py-3 z-[60] animate-in fade-in slide-in-from-top-3 duration-300"
        >
          <div className="flex justify-between items-center px-4 pb-2.5 border-b border-border-subtle">
            <h4 className="font-sora text-xs font-bold text-text-primary">Notifikasi</h4>
            {unreadCount > 0 && (
              <button
                id="mark-all-read-btn"
                onClick={handleMarkAllRead}
                className="text-[9px] font-geist font-bold text-primary hover:opacity-85 uppercase tracking-wider cursor-pointer bg-transparent border-none outline-none"
              >
                Tandai semua dibaca
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto mt-2">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[10px] text-text-secondary">Tidak ada notifikasi baru.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={async () => {
                    setIsOpen(false)
                    if (!notif.isRead) {
                      // Optionally mark individual as read, or just let markAllRead handle it
                      // Optimistically update
                      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n))
                    }
                  }}
                  className={`px-4 py-3 hover:bg-surface-container-low transition-colors duration-200 border-b border-border-subtle last:border-none flex flex-col gap-1 cursor-pointer ${
                    !notif.isRead ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                  }`}
                >
                  {notif.linkUrl ? (
                    <Link href={notif.linkUrl} className="block">
                      <div className="flex justify-between items-start gap-2">
                        <span className={`text-[10px] font-bold ${!notif.isRead ? 'text-primary' : 'text-text-primary'}`}>
                          {notif.title}
                        </span>
                        <span className="text-[8px] text-text-secondary font-medium font-geist whitespace-nowrap">
                          {formatTime(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-[10px] text-text-secondary leading-relaxed mt-0.5 line-clamp-2">
                        {notif.body}
                      </p>
                    </Link>
                  ) : (
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <span className={`text-[10px] font-bold ${!notif.isRead ? 'text-primary' : 'text-text-primary'}`}>
                          {notif.title}
                        </span>
                        <span className="text-[8px] text-text-secondary font-medium font-geist whitespace-nowrap">
                          {formatTime(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-[10px] text-text-secondary leading-relaxed mt-0.5 line-clamp-2">
                        {notif.body}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
