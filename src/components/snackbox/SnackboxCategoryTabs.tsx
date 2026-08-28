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
    <div className="w-full overflow-x-auto pb-2 scrollbar-none">
      <div className="flex items-center gap-2 min-w-max">
        {categories.map(cat => {
          const isActive = activeCategory === cat
          const count = itemCounts[cat]
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onSelectCategory(cat)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-[#2DB24A] text-white shadow-md shadow-emerald-600/20 scale-100'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/90 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span>{cat}</span>
              {count !== undefined && count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    isActive
                      ? 'bg-white/20 text-white'
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
