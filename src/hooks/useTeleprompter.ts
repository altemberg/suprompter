import { useState, useRef, useCallback, useEffect } from 'react'

interface UseTeleprompterReturn {
  isPlaying: boolean
  progress: number
  play: () => void
  pause: () => void
  toggle: () => void
  reset: () => void
  scrollRef: React.RefObject<HTMLDivElement | null>
}

export function useTeleprompter(speed: number): UseTeleprompterReturn {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const isPlayingRef = useRef(false)
  const speedRef = useRef(speed)

  // keep speedRef in sync
  useEffect(() => {
    speedRef.current = speed
  }, [speed])

  const animate = useCallback(() => {
    const el = scrollRef.current
    if (!el) return

    const pixelsPerFrame = speedRef.current * 1.0

    el.scrollTop += pixelsPerFrame

    const maxScroll = el.scrollHeight - el.clientHeight
    const currentProgress = maxScroll > 0 ? el.scrollTop / maxScroll : 0
    setProgress(Math.min(currentProgress, 1))

    if (el.scrollTop >= maxScroll) {
      isPlayingRef.current = false
      setIsPlaying(false)
      return
    }

    if (isPlayingRef.current) {
      rafRef.current = requestAnimationFrame(animate)
    }
  }, [])

  const play = useCallback(() => {
    if (isPlayingRef.current) return
    isPlayingRef.current = true
    setIsPlaying(true)
    rafRef.current = requestAnimationFrame(animate)
  }, [animate])

  const pause = useCallback(() => {
    isPlayingRef.current = false
    setIsPlaying(false)
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const toggle = useCallback(() => {
    if (isPlayingRef.current) {
      pause()
    } else {
      play()
    }
  }, [play, pause])

  const reset = useCallback(() => {
    pause()
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
    setProgress(0)
  }, [pause])

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return { isPlaying, progress, play, pause, toggle, reset, scrollRef }
}
