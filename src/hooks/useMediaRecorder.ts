import { useState, useRef, useCallback, useEffect } from 'react'
import { preloadFFmpeg, processVideo, type ProcessingProgress } from '@/lib/ffmpeg'

interface UseMediaRecorderReturn {
  isRecording: boolean
  ffmpegReady: boolean
  downloadUrl: string | null
  fileName: string | null
  processing: boolean
  processingProgress: ProcessingProgress | null
  startRecording: () => void
  stopRecording: () => void
  clearRecording: () => void
}

function getSupportedMimeType(): string {
  const types = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4',
  ]
  return types.find(t => MediaRecorder.isTypeSupported(t)) ?? ''
}

function generateFileName(scriptTitle?: string): string {
  const safeTitle = (scriptTitle || 'gravacao')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s_-]/g, '')
    .trim()
    .replace(/\s+/g, '_')

  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const date = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`
  const time = `${pad(now.getHours())}-${pad(now.getMinutes())}`

  return `${safeTitle}_${date}_${time}.mp4`   // sempre .mp4 — FFmpeg converte
}

export function useMediaRecorder(
  canvasStream: MediaStream | null,
  scriptTitle?: string
): UseMediaRecorderReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [ffmpegReady, setFfmpegReady] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState<ProcessingProgress | null>(null)

  // Pré-carrega o FFmpeg assim que o hook monta
  useEffect(() => {
    preloadFFmpeg()
      .then(() => setFfmpegReady(true))
      .catch(() => setFfmpegReady(true)) // em caso de falha, libera o botão mesmo assim
  }, [])

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const prevUrlRef = useRef<string | null>(null)
  const scriptTitleRef = useRef(scriptTitle)
  scriptTitleRef.current = scriptTitle

  const startRecording = useCallback(() => {
    if (!canvasStream) return

    if (prevUrlRef.current) {
      URL.revokeObjectURL(prevUrlRef.current)
      prevUrlRef.current = null
    }
    setDownloadUrl(null)
    setFileName(null)
    setProcessingProgress(null)
    chunksRef.current = []

    const mimeType = getSupportedMimeType()
    const recorder = new MediaRecorder(canvasStream, {
      ...(mimeType ? { mimeType } : {}),
      videoBitsPerSecond: 8_000_000,
      audioBitsPerSecond: 128_000,
    })
    recorderRef.current = recorder

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = async () => {
      const rawBlob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' })

      setProcessing(true)
      setProcessingProgress({ stage: 'loading', progress: 0, message: 'Carregando processador...' })

      try {
        const processedBlob = await processVideo(
          rawBlob,
          mimeType || 'video/webm',
          (p) => setProcessingProgress(p)
        )

        const url = URL.createObjectURL(processedBlob)
        const name = generateFileName(scriptTitleRef.current)
        prevUrlRef.current = url
        setDownloadUrl(url)
        setFileName(name)
      } catch (err) {
        console.error('Erro no processamento FFmpeg:', err)

        // Fallback: entrega o arquivo bruto se FFmpeg falhar
        const url = URL.createObjectURL(rawBlob)
        const name = generateFileName(scriptTitleRef.current)
        prevUrlRef.current = url
        setDownloadUrl(url)
        setFileName(name)

        setProcessingProgress({
          stage: 'error',
          progress: 0,
          message: 'Processamento falhou — usando arquivo original.',
        })
      } finally {
        setProcessing(false)
      }
    }

    recorder.start(1000)   // coleta chunks a cada 1s
    setIsRecording(true)
  }, [canvasStream])

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
    setIsRecording(false)
  }, [])

  const clearRecording = useCallback(() => {
    if (prevUrlRef.current) {
      URL.revokeObjectURL(prevUrlRef.current)
      prevUrlRef.current = null
    }
    setDownloadUrl(null)
    setFileName(null)
    setProcessingProgress(null)
    chunksRef.current = []
  }, [])

  return {
    isRecording,
    ffmpegReady,
    downloadUrl,
    fileName,
    processing,
    processingProgress,
    startRecording,
    stopRecording,
    clearRecording,
  }
}
