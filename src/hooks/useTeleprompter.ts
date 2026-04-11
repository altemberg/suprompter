import { useState, useRef, useCallback, useEffect } from 'react'

interface UseTeleprompterReturn {
  isPlaying: boolean
  progress: number
  play: () => void
  pause: () => void
  toggle: () => void
  reset: () => void
  scrollRef: React.RefObject<HTMLDivElement | null>
  handleDragStart: (clientY: number) => void
  handleDragMove: (clientY: number) => void
  handleDragEnd: () => void
}

export function useTeleprompter(speed: number): UseTeleprompterReturn {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const isPlayingRef = useRef(false)
  const speedRef = useRef(speed)

  // drag state
  const isDraggingRef = useRef(false)
  const dragStartYRef = useRef(0)
  const dragStartScrollRef = useRef(0)
  const wasPlayingRef = useRef(false)
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  const handleDragStart = useCallback((clientY: number) => {
    isDraggingRef.current = true
    dragStartYRef.current = clientY
    dragStartScrollRef.current = scrollRef.current?.scrollTop ?? 0
    wasPlayingRef.current = isPlayingRef.current

    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)

    // pausa o auto-scroll durante o arraste
    if (isPlayingRef.current) {
      isPlayingRef.current = false
      setIsPlaying(false)
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [])

  const handleDragMove = useCallback((clientY: number) => {
    if (!isDraggingRef.current || !scrollRef.current) return
    const delta = dragStartYRef.current - clientY
    scrollRef.current.scrollTop = dragStartScrollRef.current + delta
  }, [])

  const handleDragEnd = useCallback(() => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false

    // retoma só se estava rodando antes do arraste
    if (wasPlayingRef.current) {
      resumeTimerRef.current = setTimeout(() => {
        isPlayingRef.current = true
        setIsPlaying(true)
        rafRef.current = requestAnimationFrame(animate)
      }, 2000)
    }
  }, [animate])

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
    }
  }, [])

  return { isPlaying, progress, play, pause, toggle, reset, scrollRef, handleDragStart, handleDragMove, handleDragEnd }
}
