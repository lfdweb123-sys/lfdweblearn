// components/player/VideoPlayer.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, Loader } from 'lucide-react'

interface VideoPlayerProps {
  signedUrl: string
  title?: string
  onProgress?: (percentage: number) => void
  onComplete?: () => void
}

export default function VideoPlayer({
  signedUrl,
  title,
  onProgress,
  onComplete,
}: VideoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Désactiver clic droit sur le conteneur
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const preventContextMenu = (e: MouseEvent) => e.preventDefault()
    const preventKeyboard = (e: KeyboardEvent) => {
      // Bloquer F12, Ctrl+Shift+I, Ctrl+U, Ctrl+S
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.key === 'u') ||
        (e.ctrlKey && e.key === 's')
      ) {
        e.preventDefault()
      }
    }

    container.addEventListener('contextmenu', preventContextMenu)
    document.addEventListener('keydown', preventKeyboard)

    return () => {
      container.removeEventListener('contextmenu', preventContextMenu)
      document.removeEventListener('keydown', preventKeyboard)
    }
  }, [])

  // Écouter les messages de l'iframe Bunny
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://iframe.mediadelivery.net') return

      const { event: eventType, data } = event.data || {}

      if (eventType === 'onTimeUpdate' && data) {
        const percentage = Math.round(
          (data.currentTime / data.duration) * 100
        )
        onProgress?.(percentage)

        // Marquer comme complété à 90%
        if (percentage >= 90) {
          onComplete?.()
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onProgress, onComplete])

  const toggleFullscreen = () => {
    const container = containerRef.current
    if (!container) return

    if (!document.fullscreenElement) {
      container.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative bg-black rounded-2xl overflow-hidden group select-none"
      style={{ aspectRatio: '16/9' }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-white/60 text-sm">Chargement du lecteur...</p>
          </div>
        </div>
      )}

      {/* Iframe Bunny — anti-download overlay */}
      <div className="relative w-full h-full">
        <iframe
          ref={iframeRef}
          src={`${signedUrl}&autoplay=false&loop=false&muted=false&preload=true&responsive=true`}
          className="w-full h-full"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          onLoad={() => setLoading(false)}
          style={{ border: 'none' }}
        />

        {/* Overlay transparent pour bloquer le clic droit sur l'iframe */}
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{ background: 'transparent' }}
        />
      </div>

      {/* Barre inférieure personnalisée */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <div className="flex items-center justify-between">
          <p className="text-white/80 text-xs truncate max-w-xs">
            {title}
          </p>
          <button
            onClick={toggleFullscreen}
            className="text-white/70 hover:text-white transition-colors"
          >
            <Maximize size={16} />
          </button>
        </div>
      </div>

      {/* Filigrane discret */}
      <div className="absolute top-3 right-3 z-20 pointer-events-none">
        <span className="text-white/10 text-xs font-medium select-none">
          LFD Web Learn
        </span>
      </div>
    </div>
  )
}