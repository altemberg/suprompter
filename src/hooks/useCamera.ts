import { useState, useRef, useCallback } from 'react'

type CameraError = 'permission-denied' | 'not-found' | 'not-supported' | 'insecure-context' | null

interface UseCameraReturn {
  stream: MediaStream | null
  error: CameraError
  isLoading: boolean
  startCamera: () => Promise<void>
  stopCamera: () => void
}

export function useCamera(): UseCameraReturn {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<CameraError>(null)
  const [isLoading, setIsLoading] = useState(false)
  const streamRef = useRef<MediaStream | null>(null)

  const startCamera = useCallback(async () => {
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

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: { ideal: 48000 },
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
