import React from 'react'

export default function GlobalLoading() {
  return (
    <div className="w-full bg-surface p-4 md:p-8 animate-pulse flex flex-col items-center">
      <div className="w-full max-w-[1280px] mt-4 md:mt-6">
        {/* Header / Title Skeleton */}
        <div className="w-1/3 md:w-1/4 h-8 bg-surface-container-high rounded-lg mb-8"></div>
        
        {/* Content Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar / Info Box Skeleton */}
          <div className="hidden md:block col-span-1 h-64 bg-surface-container-low rounded-[var(--radius-brand)]"></div>
          
          {/* Main Grid Skeleton */}
          <div className="col-span-1 md:col-span-3 space-y-6">
            <div className="w-full h-12 bg-surface-container-low rounded-lg mb-6"></div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex flex-col gap-3">
                  <div className="w-full h-40 bg-surface-container-low rounded-[var(--radius-brand)]"></div>
                  <div className="w-3/4 h-5 bg-surface-container-high rounded"></div>
                  <div className="w-1/2 h-4 bg-surface-container-low rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
