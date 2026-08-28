'use client'

import React from 'react'

/**
 * Universal Ghost Skeleton Loading Components with Smooth Shimmer Animation.
 * Matches Saloka.id Marketplace & Enterprise Design System.
 */

export function CommunityCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between animate-pulse">
      <div>
        {/* Top Header */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-xl bg-slate-200 shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-slate-200 rounded-md w-3/4" />
            <div className="h-3 bg-slate-200 rounded-md w-1/2" />
          </div>
        </div>

        {/* Badges */}
        <div className="flex gap-2 mb-3">
          <div className="h-5 bg-slate-200 rounded-md w-20" />
          <div className="h-5 bg-slate-200 rounded-md w-16" />
        </div>

        {/* Description lines */}
        <div className="space-y-2 mb-4">
          <div className="h-3 bg-slate-200 rounded-md w-full" />
          <div className="h-3 bg-slate-200 rounded-md w-5/6" />
        </div>
      </div>

      {/* Footer / CTA */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        <div className="h-4 bg-slate-200 rounded-md w-24" />
        <div className="h-8 bg-slate-200 rounded-lg w-28" />
      </div>
    </div>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs animate-pulse flex flex-col">
      {/* Square Image Placeholder */}
      <div className="w-full aspect-square bg-slate-200" />
      
      {/* Content details */}
      <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          <div className="h-3.5 bg-slate-200 rounded-md w-full" />
          <div className="h-3 bg-slate-200 rounded-md w-2/3" />
        </div>

        <div className="pt-2 space-y-1.5 border-t border-slate-100">
          <div className="h-4 bg-slate-200 rounded-md w-1/2" />
          <div className="flex justify-between items-center">
            <div className="h-3 bg-slate-200 rounded-md w-1/3" />
            <div className="h-3 bg-slate-200 rounded-md w-10" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function ForumPostSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4 animate-pulse">
      {/* Author Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200" />
          <div className="space-y-1.5">
            <div className="h-3.5 bg-slate-200 rounded-md w-32" />
            <div className="h-2.5 bg-slate-200 rounded-md w-20" />
          </div>
        </div>
        <div className="h-5 bg-slate-200 rounded-md w-16" />
      </div>

      {/* Post Content */}
      <div className="space-y-2">
        <div className="h-4 bg-slate-200 rounded-md w-3/4" />
        <div className="h-3 bg-slate-200 rounded-md w-full" />
        <div className="h-3 bg-slate-200 rounded-md w-5/6" />
      </div>

      {/* Image / Attachment Placeholder */}
      <div className="w-full h-44 bg-slate-200 rounded-xl" />

      {/* Interaction Bar */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="flex gap-4">
          <div className="h-4 bg-slate-200 rounded-md w-14" />
          <div className="h-4 bg-slate-200 rounded-md w-14" />
        </div>
        <div className="h-4 bg-slate-200 rounded-md w-16" />
      </div>
    </div>
  )
}

export function MemberListItemSkeleton() {
  return (
    <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-200/70 shadow-2xs animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-slate-200 shrink-0" />
        <div className="space-y-1.5">
          <div className="h-3.5 bg-slate-200 rounded-md w-28" />
          <div className="h-2.5 bg-slate-200 rounded-md w-20" />
        </div>
      </div>
      <div className="h-6 bg-slate-200 rounded-md w-20" />
    </div>
  )
}

export function GridSkeleton({
  count = 6,
  type = 'community'
}: {
  count?: number
  type?: 'community' | 'product' | 'post' | 'member'
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        if (type === 'product') return <ProductCardSkeleton key={i} />
        if (type === 'post') return <ForumPostSkeleton key={i} />
        if (type === 'member') return <MemberListItemSkeleton key={i} />
        return <CommunityCardSkeleton key={i} />
      })}
    </>
  )
}
