import { useEffect, useRef, useState, useCallback } from 'react'
import { useMediaRecorder } from '../hooks/useMediaRecorder'
import { useTeleprompter } from '../hooks/useTeleprompter'
import { ScrollingText } from './ScrollingText'
import { Controls } from './Controls'
import { ProgressBar } from './ProgressBar'
import { DownloadBanner } from './DownloadBanner'

interface TeleprompterProps {
  script: string
  fontSize: number
  initialSpeed: number
  stream: MediaStream
  onBack: () => void
}

export function Teleprompter({ script, fontSize: initialFontSize, initialSpeed, stream, onBack }: TeleprompterProps) {
  const [speed, setSpeed] = useState(initialSpeed)
  const [fontSize, setFontSize] = useState(initialFontSize)
  const [controlsVisible, setControlsVisible] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { isPlaying, progress, play, toggle, reset, scrollRef } = useTeleprompter(speed)
  const { isRecording, downloadUrl, filename, startRecording, stopRecording, clearRecording } = useMediaRecorder(stream)

  // Attach stream to video
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  // Auto-hide controls
  const showControls = useCallback(() => {
    setControlsVisible(true)
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), 3000)
  }, [])

  useEffect(() => {
    showControls()
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [showControls])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          toggle()
          showControls()
          break
        case 'KeyR':
          e.preventDefault()
          if (isRecording) stopRecording()
          else startRecording()
          showControls()
          break
        case 'ArrowUp':
          e.preventDefault()
          setSpeed((s) => Math.min(10, s + 1))
          showControls()
          break
        case 'ArrowDown':
          e.preventDefault()
          setSpeed((s) => Math.max(1, s - 1))
          showControls()
          break
        case 'Escape':
          e.preventDefault()
          handleBack()
          break
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording, toggle, startRecording, stopRecording, showControls])

  const handleBack = useCallback(() => {
    if (isRecording) {
      const confirmed = window.confirm('Você está gravando. Deseja parar e voltar ao editor?')
      if (!confirmed) return
      stopRecording()
    }
    reset()
    onBack()
  }, [isRecording, stopRecording, reset, onBack])

  const handleToggleRecord = useCallback(() => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
      play()  // auto-play ao iniciar gravação
    }
  }, [isRecording, startRecording, stopRecording, play])

  // Regravar: limpa a gravação anterior para poder gravar de novo
  const handleReRecord = useCallback(() => {
    clearRecording()
  }, [clearRecording])

  return (
    <div style={styles.container} onMouseMove={showControls} onTouchStart={showControls}>
      <ProgressBar progress={progress} />

      {downloadUrl && filename && !isRecording && (
        <DownloadBanner
          downloadUrl={downloadUrl}
          filename={filename}
          onDiscard={handleReRecord}
        />
      )}

      <video ref={videoRef} autoPlay playsInline muted style={styles.video} />

      <ScrollingText script={script} fontSize={fontSize} scrollRef={scrollRef} />

      <Controls
        isPlaying={isPlaying}
        isRecording={isRecording}
        downloadUrl={downloadUrl}
        filename={filename}
        speed={speed}
        fontSize={fontSize}
        visible={controlsVisible}
        onTogglePlay={toggle}
        onToggleRecord={handleToggleRecord}
        onReset={reset}
        onReRecord={handleReRecord}
        onSpeedChange={setSpeed}
        onFontSizeChange={setFontSize}
        onBack={handleBack}
      />
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    inset: 0,
    background: '#000',
    overflow: 'hidden',
    animation: 'fadeIn 0.5s ease',
  },
  video: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: 'scaleX(-1)',
  },
}
