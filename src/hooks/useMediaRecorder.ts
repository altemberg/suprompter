import { useState, useRef, useCallback } from 'react'

interface UseMediaRecorderReturn {
  isRecording: boolean
  downloadUrl: string | null
  filename: string | null
  startRecording: () => void
  stopRecording: () => void
  clearRecording: () => void
}

function getSupportedFormat(): { mimeType: string; ext: string } {
  const candidates = [
    { mimeType: 'video/mp4;codecs=avc1,mp4a.40.2', ext: 'mp4' },
    { mimeType: 'video/mp4;codecs=h264,aac', ext: 'mp4' },
    { mimeType: 'video/mp4', ext: 'mp4' },
    { mimeType: 'video/webm;codecs=vp9,opus', ext: 'webm' },
    { mimeType: 'video/webm;codecs=vp8,opus', ext: 'webm' },
    { mimeType: 'video/webm', ext: 'webm' },
  ]
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c.mimeType)) return c
  }
  return { mimeType: '', ext: 'webm' }
}

function generateFilename(ext: string, scriptTitle?: string): string {
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

  return `${safeTitle}_${date}_${time}.${ext}`
}

export function useMediaRecorder(stream: MediaStream | null, scriptTitle?: string): UseMediaRecorderReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [filename, setFilename] = useState<string | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const prevUrlRef = useRef<string | null>(null)
  const scriptTitleRef = useRef(scriptTitle)
  scriptTitleRef.current = scriptTitle

  const startRecording = useCallback(() => {
    if (!stream) return

    if (prevUrlRef.current) {
      URL.revokeObjectURL(prevUrlRef.current)
      prevUrlRef.current = null
    }
    setDownloadUrl(null)
    setFilename(null)
    chunksRef.current = []

    const { mimeType, ext } = getSupportedFormat()
    const recorderOptions: MediaRecorderOptions = {
      videoBitsPerSecond: 8_000_000,  // 8 Mbps — alta qualidade
      audioBitsPerSecond: 128_000,    // 128 kbps
    }
    if (mimeType) recorderOptions.mimeType = mimeType
    const recorder = new MediaRecorder(stream, recorderOptions)
    recorderRef.current = recorder

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' })
      const url = URL.createObjectURL(blob)
      const name = generateFilename(ext, scriptTitleRef.current)
      prevUrlRef.current = url
      setDownloadUrl(url)
      setFilename(name)
      setIsRecording(false)
    }

    recorder.start(100)
    setIsRecording(true)
  }, [stream])

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
  }, [])

  const clearRecording = useCallback(() => {
    if (prevUrlRef.current) {
      URL.revokeObjectURL(prevUrlRef.current)
      prevUrlRef.current = null
    }
    setDownloadUrl(null)
    setFilename(null)
  }, [])

  return { isRecording, downloadUrl, filename, startRecording, stopRecording, clearRecording }
}
