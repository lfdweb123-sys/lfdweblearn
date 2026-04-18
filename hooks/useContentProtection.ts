// hooks/useContentProtection.ts
'use client'

import { useEffect } from 'react'

interface ContentProtectionOptions {
  disableRightClick?: boolean
  disableDevTools?: boolean
  disableSelection?: boolean
  disablePrintScreen?: boolean
  watermarkText?: string
}

export function useContentProtection(
  options: ContentProtectionOptions = {}
) {
  const {
    disableRightClick = true,
    disableDevTools = true,
    disableSelection = false,
    disablePrintScreen = true,
    watermarkText = 'LFD Web Learn',
  } = options

  useEffect(() => {
    // ── Bloquer clic droit ───────────────────────────────
    const handleContextMenu = (e: MouseEvent) => {
      if (disableRightClick) e.preventDefault()
    }

    // ── Bloquer raccourcis clavier dangereux ─────────────
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!disableDevTools) return

      const blockedKeys = [
        // DevTools
        e.key === 'F12',
        e.ctrlKey && e.shiftKey && e.key === 'I',
        e.ctrlKey && e.shiftKey && e.key === 'J',
        e.ctrlKey && e.shiftKey && e.key === 'C',
        e.metaKey && e.altKey && e.key === 'I',
        // Source
        e.ctrlKey && e.key === 'u',
        e.ctrlKey && e.key === 'U',
        // Save
        e.ctrlKey && e.key === 's',
        e.ctrlKey && e.key === 'S',
        // Print
        e.ctrlKey && e.key === 'p',
        e.ctrlKey && e.key === 'P',
        // PrintScreen
        disablePrintScreen && e.key === 'PrintScreen',
      ]

      if (blockedKeys.some(Boolean)) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
    }

    // ── Bloquer sélection texte ──────────────────────────
    const handleSelectStart = (e: Event) => {
      if (disableSelection) e.preventDefault()
    }

    // ── Détecter ouverture DevTools (taille fenêtre) ─────
    const detectDevTools = () => {
      if (!disableDevTools) return

      const threshold = 160
      const widthDiff = window.outerWidth - window.innerWidth
      const heightDiff = window.outerHeight - window.innerHeight

      if (widthDiff > threshold || heightDiff > threshold) {
        // DevTools probablement ouvert → brouiller le contenu
        document.body.style.filter = 'blur(10px)'
        setTimeout(() => {
          document.body.style.filter = ''
        }, 3000)
      }
    }

    // ── Bloquer drag & drop des médias ───────────────────
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === 'IMG' ||
        target.tagName === 'VIDEO' ||
        target.tagName === 'IFRAME'
      ) {
        e.preventDefault()
      }
    }

    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('selectstart', handleSelectStart)
    document.addEventListener('dragstart', handleDragStart)

    const devToolsInterval = setInterval(detectDevTools, 2000)

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('selectstart', handleSelectStart)
      document.removeEventListener('dragstart', handleDragStart)
      clearInterval(devToolsInterval)
    }
  }, [disableRightClick, disableDevTools, disableSelection, disablePrintScreen])
}