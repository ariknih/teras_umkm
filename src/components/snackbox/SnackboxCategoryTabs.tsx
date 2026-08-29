'use client'

import React from 'react'
import { SnackboxCategory } from '@/types/snackbox'

interface SnackboxCategoryTabsProps {
  categories: SnackboxCategory[]
  activeCategory: SnackboxCategory
  onSelectCategory: (category: SnackboxCategory) => void
  itemCounts?: Record<string, number>
}

export default function SnackboxCategoryTabs({
  categories,
  activeCategory,
  onSelectCategory,
  itemCounts = {}
}: SnackboxCategoryTabsProps) {
  return (
    <div className="relative w-full">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map(cat => {
          const isActive = activeCategory === cat
          const count = itemCounts[cat]
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onSelectCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#006E24] text-white border-[#006E24] shadow-xs'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-[#006E24]/50 hover:text-gray-900'
              }`}
            >
              <span>{cat}</span>
              {count !== undefined && count > 0 && (
                <span
                  className={`ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive
                      ? 'bg-white/25 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
