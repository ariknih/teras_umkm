'use client'

import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Users } from 'lucide-react'

export interface UserCommunitySummary {
  communityId: string
  communityName: string
  avatarUrl?: string | null
  roleLabel: string
}

export default function CommunityPickerModal({
  communities,
  onSelect,
  onClose
}: {
  communities: UserCommunitySummary[]
  onSelect: (communityId: string) => void
  onClose: () => void
}) {
  // Portal straight to <body>: the header this renders under uses backdrop-blur,
  // which creates a CSS containing block for fixed-position descendants, so a
  // plain `fixed inset-0` here would size/position itself against the header
  // pill instead of the viewport.
  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] overflow-y-auto p-6 space-y-4"
        >
          <div className="flex justify-between items-center border-b border-black/5 pb-3">
            <h3 className="font-sora text-sm font-bold text-[#111111] uppercase tracking-wider">
              Pilih Komunitas
            </h3>
            <button onClick={onClose} className="text-text-secondary hover:text-[#111111] text-sm font-bold">✕</button>
          </div>
          <div className="space-y-2">
            {communities.map((c) => (
              <button
                key={c.communityId}
                onClick={() => onSelect(c.communityId)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl border border-black/5 hover:border-primary/40 hover:bg-primary/5 transition-colors text-left"
              >
                {c.avatarUrl ? (
                  <img src={c.avatarUrl} alt={c.communityName} className="w-10 h-10 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#111111] truncate">{c.communityName}</p>
                  <p className="text-xs text-text-secondary">{c.roleLabel}</p>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  )
}
