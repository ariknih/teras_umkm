'use client'

import React from 'react'
import { Minus, Plus } from 'lucide-react'

interface QuantityStepperProps {
  value: number
  onDecrement: () => void
  onIncrement: () => void
  disableDecrement?: boolean
  disableIncrement?: boolean
  size?: 'sm' | 'md'
}

export default function QuantityStepper({
  value,
  onDecrement,
  onIncrement,
  disableDecrement = false,
  disableIncrement = false,
  size = 'md'
}: QuantityStepperProps) {
  const circle = size === 'sm' ? 'w-7 h-7' : 'w-9 h-9'
  const icon = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'
  const gap = size === 'sm' ? 'gap-2.5' : 'gap-4'
  const pad = size === 'sm' ? 'p-1' : 'p-1.5'
  const text = size === 'sm' ? 'text-sm' : 'text-base'

  return (
    <div className={`inline-flex items-center ${gap} ${pad} rounded-full border border-slate-200 bg-white`}>
      <button
        type="button"
        onClick={onDecrement}
        disabled={disableDecrement}
        className={`${circle} shrink-0 rounded-full bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 flex items-center justify-center transition-colors cursor-pointer`}
      >
        <Minus className={icon} />
      </button>
      <span className={`${text} font-bold text-slate-900 min-w-[1ch] text-center`}>{value}</span>
      <button
        type="button"
        onClick={onIncrement}
        disabled={disableIncrement}
        className={`${circle} shrink-0 rounded-full bg-market-green-50 hover:bg-market-green-100 disabled:opacity-40 disabled:cursor-not-allowed text-market-green-600 flex items-center justify-center transition-colors cursor-pointer`}
      >
        <Plus className={icon} />
      </button>
    </div>
  )
}
