import { useState, useRef, useCallback } from 'react'
import type { Format } from '@/types'

type CameraError = 'permission-denied' | 'not-found' | 'not-supported' | 'insecure-context' | null

interface UseCameraReturn {
  stream: MediaStream | null
  error: CameraError
  isLoading: boolean
  startCamera: (format?: Format) => Promise<void>
  stopCamera: () => void
}

export function useCamera(): UseCameraReturn {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<CameraError>(null)
  const [isLoading, setIsLoading] = useState(false)
  const streamRef = useRef<MediaStream | null>(null)

  const startCamera = useCallback(async (format: Format = 'reels') => {
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      setError('insecure-context')
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('not-supported')
      return
    }

    setIsLoading(true)
    setError(null)

    // Reels/Stories: retrato 9:16 — YouTube: paisagem 16:9
    const videoConstraints = format === 'reels'
      ? { facingMode: 'user', width: { ideal: 1080 }, height: { ideal: 1920 }, frameRate: { ideal: 30 } }
      : { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 48000,
          channelCount: 1,
        },
      })
      streamRef.current = mediaStream
      setStream(mediaStream)
    } catch (err) {
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('permission-denied')
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError('not-found')
        } else {
          setError('not-supported')
        }
      } else {
        setError('not-supported')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setStream(null)
  }, [])

  return { stream, error, isLoading, startCamera, stopCamera }
}
