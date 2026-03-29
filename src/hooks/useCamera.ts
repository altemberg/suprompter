import { useState, useRef, useCallback, useEffect } from 'react'

export type CameraFormat = 'reels' | 'youtube'

interface UseCameraReturn {
  stream: MediaStream | null
  canvasStream: MediaStream | null
  videoRef: React.RefObject<HTMLVideoElement | null>
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  error: string | null
  loading: boolean
  startCamera: (format: CameraFormat) => Promise<void>
  stopCamera: () => void
}

export function useCamera(): UseCameraReturn {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [canvasStream, setCanvasStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)
  const formatRef = useRef<CameraFormat>('reels')

  // Loop de desenho no canvas
  const startDrawLoop = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = () => {
      if (video.readyState < 2) {
        animFrameRef.current = requestAnimationFrame(draw)
        return
      }

      const isReels = formatRef.current === 'reels'
      const vw = video.videoWidth
      const vh = video.videoHeight

      if (isReels) {
        // Retrato: canvas 1080x1920, vídeo chega em paisagem → rotacionar 90°
        canvas.width = 1080
        canvas.height = 1920

        ctx.save()
        ctx.translate(canvas.width / 2, canvas.height / 2)
        ctx.rotate(Math.PI / 2) // 90° no sentido horário

        // Escalar para preencher o canvas após a rotação
        const scale = Math.max(canvas.width / vh, canvas.height / vw)
        ctx.scale(scale, scale)

        ctx.drawImage(video, -vw / 2, -vh / 2, vw, vh)
        ctx.restore()
      } else {
        // Paisagem: canvas 1920x1080, desenha direto sem rotação
        canvas.width = 1920
        canvas.height = 1080

        const scale = Math.max(canvas.width / vw, canvas.height / vh)
        const sw = vw * scale
        const sh = vh * scale
        const sx = (canvas.width - sw) / 2
        const sy = (canvas.height - sh) / 2

        ctx.drawImage(video, sx, sy, sw, sh)
      }

      animFrameRef.current = requestAnimationFrame(draw)
    }

    animFrameRef.current = requestAnimationFrame(draw)
  }, [])

  const startCamera = useCallback(async (format: CameraFormat) => {
    setLoading(true)
    setError(null)
    formatRef.current = format

    try {
      const rawStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 48000,
          channelCount: 1,
        },
        video: {
          facingMode: 'user',
          frameRate: { ideal: 30, max: 60 },
          aspectRatio: format === 'reels'
            ? { ideal: 9 / 16 }
            : { ideal: 16 / 9 },
        },
      })

      setStream(rawStream)

      if (videoRef.current) {
        videoRef.current.srcObject = rawStream
        await videoRef.current.play()
      }

      startDrawLoop()

      const canvas = canvasRef.current
      if (canvas) {
        const audioTracks = rawStream.getAudioTracks()
        const canvasVideoStream = canvas.captureStream(30)
        const combined = new MediaStream([
          ...canvasVideoStream.getVideoTracks(),
          ...audioTracks,
        ])
        setCanvasStream(combined)
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
  }, [startDrawLoop])

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current)

    if (stream) {
      stream.getTracks().forEach(t => t.stop())
      setStream(null)
    }

    setCanvasStream(null)

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [stream])

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current)
      stream?.getTracks().forEach(t => t.stop())
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { stream, canvasStream, videoRef, canvasRef, error, loading, startCamera, stopCamera }
}
