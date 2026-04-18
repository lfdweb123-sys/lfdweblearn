// components/player/Watermark.tsx
'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'

interface WatermarkProps {
  opacity?: number
  floating?: boolean
}

export default function Watermark({
  opacity = 0.08,
  floating = true,
}: WatermarkProps) {
  const { userProfile } = useAuth()
  const [position, setPosition] = useState({ x: 20, y: 20 })

  // Filigrane flottant — change de position toutes les 8 secondes
  useEffect(() => {
    if (!floating) return

    const move = () => {
      setPosition({
        x: Math.floor(Math.random() * 70) + 5,
        y: Math.floor(Math.random() * 70) + 5,
      })
    }

    const interval = setInterval(move, 8000)
    return () => clearInterval(interval)
  }, [floating])

  const text = userProfile?.email || 'LFD Web Learn'

  return (
    <div
      className="absolute inset-0 pointer-events-none z-30 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Filigrane flottant */}
      <div
        className="absolute transition-all duration-[3000ms] ease-in-out"
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`,
          opacity,
          transform: 'rotate(-15deg)',
        }}
      >
        <p className="text-slate-800 text-xs font-medium whitespace-nowrap">
          {text}
        </p>
        <p className="text-slate-800 text-xs whitespace-nowrap">
          LFD Web Learn
        </p>
      </div>

      {/* Filigrane diagonal répété */}
      <div
        className="absolute inset-0"
        style={{
          opacity: opacity * 0.4,
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 120px,
            rgba(0,0,0,0.03) 120px,
            rgba(0,0,0,0.03) 121px
          )`,
        }}
      />
    </div>
  )
}