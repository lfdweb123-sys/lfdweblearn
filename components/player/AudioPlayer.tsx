// components/player/AudioPlayer.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { Play, Pause, Volume2, VolumeX } from 'lucide-react'

interface AudioPlayerProps {
  url: string
  title?: string
  onComplete?: () => void
}

export default function AudioPlayer({ url, title, onComplete }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const completed = useRef(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTimeUpdate = () => {
      const pct = (audio.currentTime / audio.duration) * 100
      setProgress(pct)
      if (pct >= 90 && !completed.current) {
        completed.current = true
        onComplete?.()
      }
    }

    const onLoaded = () => setDuration(audio.duration)
    const onEnded = () => setPlaying(false)

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoaded)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoaded)
      audio.removeEventListener('ended', onEnded)
    }
  }, [onComplete])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) { audio.pause() } else { audio.play() }
    setPlaying(!playing)
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return
    audio.muted = !muted
    setMuted(!muted)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return
    const time = (Number(e.target.value) / 100) * audio.duration
    audio.currentTime = time
    setProgress(Number(e.target.value))
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div
      className="bg-gradient-to-br from-sky-900 to-slate-900 rounded-2xl p-6 select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Audio element caché */}
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        controlsList="nodownload"
        style={{ display: 'none' }}
      />

      {/* Illustration */}
      <div className="flex flex-col items-center gap-6">
        <div className="w-32 h-32 rounded-full bg-sky-800/50 flex items-center justify-center">
          <div className={`w-16 h-16 rounded-full bg-sky-500/30 flex items-center justify-center ${playing ? 'animate-pulse' : ''}`}>
            <Volume2 size={32} className="text-sky-300" />
          </div>
        </div>

        <div className="text-center">
          <p className="text-white font-medium truncate max-w-xs">{title}</p>
          <p className="text-sky-300/60 text-sm">Audio</p>
        </div>

        {/* Barre de progression */}
        <div className="w-full space-y-2">
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={handleSeek}
            className="w-full h-1 accent-sky-400 cursor-pointer"
          />
          <div className="flex justify-between text-xs text-sky-300/60">
            <span>{formatTime((progress / 100) * duration)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Contrôles */}
        <div className="flex items-center gap-6">
          <button onClick={toggleMute} className="text-sky-300/60 hover:text-white transition-colors">
            {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <button
            onClick={togglePlay}
            className="w-14 h-14 bg-sky-500 hover:bg-sky-400 rounded-full flex items-center justify-center text-white transition-all shadow-lg"
          >
            {playing ? <Pause size={24} /> : <Play size={24} className="ml-0.5" />}
          </button>
          <div className="w-5" />
        </div>
      </div>
    </div>
  )
}