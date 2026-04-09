import { useState, useRef, useCallback, useEffect } from 'react'

export type CameraFormat = 'reels' | 'youtube'

export interface UseCameraReturn {
  stream: MediaStream | null
  videoRef: React.RefObject<HTMLVideoElement | null>
  error: string | null
  loading: boolean
  startCamera: (format: CameraFormat, audioDeviceId?: string) => Promise<void>
  stopCamera: () => void
}

export function useCamera(): UseCameraReturn {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startCamera = useCallback(async (_format: CameraFormat, audioDeviceId?: string) => {
    setLoading(true)
    setError(null)

    try {
      const rawStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          ...(audioDeviceId && audioDeviceId !== 'default'
            ? { deviceId: { exact: audioDeviceId } }
            : {}),
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: { ideal: 48000 },
          channelCount: 1,
        },
        video: {
          facingMode: 'user',
          frameRate: { ideal: 30, max: 30 },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      })

      streamRef.current = rawStream
      setStream(rawStream)

      if (videoRef.current) {
        videoRef.current.srcObject = rawStream
        await videoRef.current.play().catch(() => {})
      }
    } catch (err: unknown) {
      const domErr = err as DOMException
      if (domErr.name === 'NotAllowedError') {
        setError('Permissão de câmera negada. Libere o acesso nas configurações do navegador.')
      } else if (domErr.name === 'NotFoundError') {
        setError('Câmera não encontrada neste dispositivo.')
      } else {
        setError('Erro ao acessar a câmera: ' + (domErr.message ?? String(err)))
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setStream(null)
    if (videoRef.current) videoRef.current.srcObject = null
  }, [])

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  return { stream, videoRef, error, loading, startCamera, stopCamera }
}
