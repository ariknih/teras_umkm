'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type TabType = 'marketplace' | 'affiliate' | 'community'

interface TabData {
  id: TabType
  label: string
  badgeText: string
  image: string
  bgClass: string
  borderClass: string
  badgeBgClass: string
  badgeTextClass: string
  badgeBorderClass: string
  accentColor: string
}

const tabs: TabData[] = [
  {
    id: 'marketplace',
    label: 'Marketplace',
    badgeText: 'Marketplace menawarkan produk & jasa!',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=600',
    bgClass: 'bg-indigo-50/50 dark:bg-indigo-950/20',
    borderClass: 'border-indigo-100 dark:border-indigo-900/30',
    badgeBgClass: 'bg-indigo-100 dark:bg-indigo-900/50',
    badgeTextClass: 'text-indigo-900 dark:text-indigo-200',
    badgeBorderClass: 'border-indigo-200 dark:border-indigo-800/50',
    accentColor: '#4f46e5',
  },
  {
    id: 'affiliate',
    label: 'Affiliate Hub',
    badgeText: 'Program Afiliasi dengan bagi hasil otomatis!',
    image: 'https://images.unsplash.com/photo-1434626881859-194d67b2b86f?auto=format&fit=crop&q=80&w=600',
    bgClass: 'bg-blue-50/50 dark:bg-blue-950/20',
    borderClass: 'border-blue-100 dark:border-blue-900/30',
    badgeBgClass: 'bg-blue-100 dark:bg-blue-900/50',
    badgeTextClass: 'text-blue-900 dark:text-blue-200',
    badgeBorderClass: 'border-blue-200 dark:border-blue-800/50',
    accentColor: '#2563eb',
  },
  {
    id: 'community',
    label: 'Community',
    badgeText: 'Forum Diskusi dan Jejaring UMKM Indonesia!',
    image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&q=80&w=600',
    bgClass: 'bg-emerald-50/50 dark:bg-emerald-950/20',
    borderClass: 'border-emerald-100 dark:border-emerald-900/30',
    badgeBgClass: 'bg-emerald-100 dark:bg-emerald-900/50',
    badgeTextClass: 'text-emerald-900 dark:text-emerald-200',
    badgeBorderClass: 'border-emerald-200 dark:border-emerald-800/50',
    accentColor: '#059669',
  },
]

export default function InteractiveFeatures() {
  const [activeTab, setActiveTab] = useState<TabType>('marketplace')
  const currentTab = tabs.find((t) => t.id === activeTab)!

  return (
    <div className="flex-1 flex flex-col gap-6">
      {/* Tab Screen/Preview Container */}
      <div
        className={`w-full h-64 md:h-96 relative rounded-2xl overflow-hidden flex items-center justify-center border transition-all duration-500 ${currentTab.bgClass} ${currentTab.borderClass}`}
      >
        {/* Dynamic decorative blur */}
        <div
          className="absolute opacity-10 blur-3xl w-full h-full scale-150 transition-colors duration-500"
          style={{ backgroundColor: currentTab.accentColor }}
        />

        {/* Animated image & badge content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center p-6"
          >
            {/* Styled Mockup Phone/Card */}
            <div className="relative w-full max-w-[280px] md:max-w-[340px] aspect-[9/16] bg-surface-container rounded-3xl border border-border-subtle shadow-2xl overflow-hidden transform rotate-6 hover:rotate-0 transition-transform duration-300">
              <img
                src={currentTab.image}
                alt={currentTab.label}
                className="w-full h-full object-cover"
              />
              {/* Overlay shading */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/30 pointer-events-none" />
            </div>

            {/* Float Badge */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className={`absolute top-6 left-6 md:top-8 md:left-8 px-4 py-2 rounded-xl text-xs md:text-sm font-medium shadow-lg max-w-[220px] border ${currentTab.badgeBgClass} ${currentTab.badgeTextClass} ${currentTab.badgeBorderClass}`}
            >
              {currentTab.badgeText}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Feature Tabs Nav */}
      <div className="flex gap-2 w-full overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[120px] px-4 py-3 rounded-xl border text-center font-semibold text-sm transition-all duration-300 relative overflow-hidden ${
                isActive
                  ? 'bg-surface text-text-primary shadow-md border-border-subtle'
                  : 'bg-background hover:bg-surface-container/50 text-text-secondary border-border hover:text-text-primary'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: tab.accentColor }}
                />
              )}
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
