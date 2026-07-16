'use client'

import { motion } from 'framer-motion'
import React from 'react'

interface ScrollRevealProps {
  children: React.ReactNode
  delay?: number
  duration?: number
  y?: number
}

export default function ScrollReveal({ children, delay = 0, duration = 0.8, y = 30 }: ScrollRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }} // smooth easeOutExpo
    >
      {children}
    </motion.div>
  )
}
