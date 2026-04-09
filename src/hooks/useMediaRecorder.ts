import { useState, useRef, useCallback } from 'react'

const VIDEO_PROCESSOR_URL = import.meta.env.VITE_VIDEO_PROCESSOR_URL || ''

export type RecordingStage = 'idle' | 'recording' | 'uploading' | 'processing' | 'done' | 'error'

export interface UseMediaRecorderReturn {
  isRecording: boolean
  stage: RecordingStage
  progress: number
  downloadUrl: string | null
  fileName: string | null
  startRecording: () => void
  stopRecording: () => void
  clearRecording: () => void
  error: string | null
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
  return `${safeTitle}_${date}_${time}.mp4`
}

export function useMediaRecorder(
  stream: MediaStream | null,
  scriptTitle?: string
): UseMediaRecorderReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [stage, setStage] = useState<RecordingStage>('idle')
  const [progress, setProgress] = useState(0)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const downloadUrlRef = useRef<string | null>(null)
  const scriptTitleRef = useRef(scriptTitle)
  scriptTitleRef.current = scriptTitle

  async function uploadToRailway(blob: Blob): Promise<void> {
    setStage('uploading')
    setProgress(0)

    if (!VIDEO_PROCESSOR_URL) {
      console.warn('[MediaRecorder] VITE_VIDEO_PROCESSOR_URL não configurado — baixando bruto')
      const url = URL.createObjectURL(blob)
      downloadUrlRef.current = url
      setDownloadUrl(url)
      setFileName(generateFileName(scriptTitleRef.current))
      setStage('done')
      return
    }

    try {
      const formData = new FormData()
      const ext = blob.type.includes('mp4') ? 'mp4' : 'webm'
      formData.append('video', blob, `recording.${ext}`)

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 80))
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            setStage('processing')
            setProgress(90)

            const processedBlob = xhr.response as Blob
            const url = URL.createObjectURL(processedBlob)
            downloadUrlRef.current = url
            setDownloadUrl(url)
            setFileName(generateFileName(scriptTitleRef.current))
            setProgress(100)
            setStage('done')
            resolve()
          } else {
            reject(new Error(`Servidor retornou ${xhr.status}`))
          }
        })

        xhr.addEventListener('error', () => reject(new Error('Erro de conexão com o servidor')))
        xhr.addEventListener('timeout', () => reject(new Error('Timeout — vídeo muito longo')))

        xhr.open('POST', `${VIDEO_PROCESSOR_URL}/process`)
        xhr.responseType = 'blob'
        xhr.timeout = 300000
        xhr.send(formData)
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[upload] erro:', msg)
      setError(msg)

      // Fallback: oferece o bruto se o Railway falhar
      const url = URL.createObjectURL(blob)
      downloadUrlRef.current = url
      setDownloadUrl(url)
      setFileName(generateFileName(scriptTitleRef.current))
      setStage('done')
    }
  }

  const startRecording = useCallback(() => {
    if (!stream) return

    chunksRef.current = []
    setError(null)

    const mimeTypes = [
      'video/mp4',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ]
    const mimeType = mimeTypes.find(m => MediaRecorder.isTypeSupported(m)) ?? ''

    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 8_000_000,
      audioBitsPerSecond: 128_000,
    })

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: mimeType || 'video/mp4' })
      console.log(`[MediaRecorder] Blob: ${(blob.size / 1024 / 1024).toFixed(1)}MB`)
      await uploadToRailway(blob)
    }

    recorder.onerror = (e) => {
      console.error('[MediaRecorder] erro:', e)
      setStage('error')
      setError('Erro na gravação')
    }

    recorder.start(500)
    recorderRef.current = recorder
    setIsRecording(true)
    setStage('recording')
  }, [stream])

  const stopRecording = useCallback(() => {
    if (recorderRef.current?.state !== 'inactive') {
      recorderRef.current?.stop()
    }
    setIsRecording(false)
  }, [])

  const clearRecording = useCallback(() => {
    if (downloadUrlRef.current) {
      URL.revokeObjectURL(downloadUrlRef.current)
      downloadUrlRef.current = null
    }
    setDownloadUrl(null)
    setFileName(null)
    setStage('idle')
    setProgress(0)
    setError(null)
    chunksRef.current = []
  }, [])

  return {
    isRecording, stage, progress,
    downloadUrl, fileName, error,
    startRecording, stopRecording, clearRecording,
  }
}
