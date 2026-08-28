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
    window.addEventListener('focus', fetchNotifications)
    const interval = setInterval(fetchNotifications, 30000)
    return () => {
      window.removeEventListener('focus', fetchNotifications)
      clearInterval(interval)
    }
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
        aria-label="Notifikasi"
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-8 h-8 rounded-full border border-outline-variant/15 hover:border-primary bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-text-secondary hover:text-primary transition-all duration-300 cursor-pointer shadow-sm outline-none"
      >
        <img
          src="/images/Notifications.svg"
          alt="Notifikasi"
          className="w-4 h-4 object-contain transition-transform duration-300"
        />
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
          className="fixed left-3.5 right-3.5 top-18 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-3.5 w-auto sm:w-88 md:w-96 max-w-[calc(100vw-28px)] bg-white border border-slate-200/90 rounded-2xl shadow-2xl py-3 z-[100] animate-in fade-in slide-in-from-top-2 duration-200 text-slate-900"
        >
          <div className="flex justify-between items-center px-4 pb-2.5 border-b border-slate-100">
            <h4 className="text-xs font-bold text-slate-900">Notifikasi</h4>
            {unreadCount > 0 && (
              <button
                id="mark-all-read-btn"
                onClick={handleMarkAllRead}
                className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider cursor-pointer bg-transparent border-none outline-none"
              >
                Tandai semua dibaca
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto mt-1 divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs text-slate-400">Tidak ada notifikasi baru.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={async () => {
                    setIsOpen(false)
                    if (!notif.isRead) {
                      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n))
                    }
                  }}
                  className={`px-4 py-3 hover:bg-slate-50 transition-colors duration-150 flex flex-col gap-1 cursor-pointer ${
                    !notif.isRead ? 'bg-[#E8F5E9]/40 border-l-3 border-l-primary' : ''
                  }`}
                >
                  {notif.linkUrl ? (
                    <Link href={notif.linkUrl} className="block">
                      <div className="flex justify-between items-start gap-2">
                        <span className={`text-[11px] ${!notif.isRead ? 'font-bold text-primary' : 'font-semibold text-slate-800'}`}>
                          {notif.title}
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium whitespace-nowrap">
                          {formatTime(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5 line-clamp-2">
                        {notif.body}
                      </p>
                    </Link>
                  ) : (
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <span className={`text-[11px] ${!notif.isRead ? 'font-bold text-primary' : 'font-semibold text-slate-800'}`}>
                          {notif.title}
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium whitespace-nowrap">
                          {formatTime(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5 line-clamp-2">
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
