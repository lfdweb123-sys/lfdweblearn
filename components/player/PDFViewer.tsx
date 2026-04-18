// components/player/PDFViewer.tsx
'use client'

import { useEffect, useRef } from 'react'

interface PDFViewerProps {
  url: string
  title?: string
}

export default function PDFViewer({ url, title }: PDFViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Bloquer clic droit
    const prevent = (e: MouseEvent) => e.preventDefault()
    container.addEventListener('contextmenu', prevent)

    return () => container.removeEventListener('contextmenu', prevent)
  }, [])

  // URL Cloudinary avec transformation fl_attachment désactivé
  const secureUrl = url.includes('cloudinary')
    ? url.replace('/upload/', '/upload/fl_no_overflow,q_auto/')
    : url

  return (
    <div
      ref={containerRef}
      className="relative bg-slate-100 rounded-2xl overflow-hidden"
      style={{ height: '80vh' }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <iframe
        src={`${secureUrl}#toolbar=0&navpanes=0&scrollbar=1`}
        className="w-full h-full border-none"
        title={title}
      />

      {/* Overlay anti-download */}
      <div className="absolute inset-0 pointer-events-none z-10" />

      {/* Filigrane */}
      <div className="absolute bottom-4 right-4 pointer-events-none z-20">
        <span className="text-slate-400/30 text-xs font-medium select-none">
          LFD Web Learn
        </span>
      </div>
    </div>
  )
}