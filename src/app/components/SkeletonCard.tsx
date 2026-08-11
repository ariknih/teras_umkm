import React from 'react'

export default function SkeletonCard({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-4 shadow-sm">
          <div className="w-full h-40 rounded-xl skeleton-shimmer" />
          <div className="space-y-2">
            <div className="w-3/4 h-4 rounded-md skeleton-shimmer" />
            <div className="w-1/2 h-3 rounded-md skeleton-shimmer" />
          </div>
          <div className="flex justify-between items-center pt-2">
            <div className="w-20 h-5 rounded-md skeleton-shimmer" />
            <div className="w-16 h-7 rounded-full skeleton-shimmer" />
          </div>
        </div>
      ))}
    </div>
  )
}
