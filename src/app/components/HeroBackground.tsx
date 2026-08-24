'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'

export default function HeroBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Track scroll position of this container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start']
  })

  // Smooth parallax scroll (translates 0% to 15% depth) and fade out (1 to 0.4)
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '15%'])
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.45])

  return (
    <div ref={containerRef} className="absolute inset-0 z-0 overflow-hidden bg-gradient-to-b from-emerald-50/60 via-slate-50 to-white">
      {/* Ambient gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,178,74,0.08)_0%,transparent_50%)] z-10 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,184,0,0.06)_0%,transparent_50%)] z-10 pointer-events-none" />
    </div>
  )
}
