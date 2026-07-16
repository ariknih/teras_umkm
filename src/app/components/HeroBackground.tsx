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
    <div ref={containerRef} className="absolute inset-0 z-0 overflow-hidden">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.75)_0%,transparent_40%)] z-10 pointer-events-none" />
      {/* Parallax background image */}
      <motion.img 
        src="/images/lamanawal.jpg" 
        alt="Saloka Market" 
        style={{ y, opacity }}
        className="w-full h-full object-cover scale-110 origin-top"
      />
    </div>
  )
}
