import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTeleprompterStore } from '@/stores/useTeleprompterStore'
import type { Script } from '@/types'
import { useCamera } from '@/hooks/useCamera'
import { useMediaRecorder } from '@/hooks/useMediaRecorder'
import { useTeleprompter } from '@/hooks/useTeleprompter'
import { Controls } from '@/components/Controls'
import { ScrollingText } from '@/components/ScrollingText'
import { ProgressBar } from '@/components/ProgressBar'
import { DownloadBanner } from '@/components/DownloadBanner'

export function TeleprompterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const scriptId = searchParams.get('scriptId')
  const { user } = useAuthStore()
  const { speed, fontSize, setSpeed, setFontSize } = useTeleprompterStore()

  const [script, setScript] = useState<Script | null>(null)
  const [scriptLoading, setScriptLoading] = useState(!!scriptId)
  const [showControls, setShowControls] = useState(true)
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { stream, error: cameraError, startCamera, stopCamera } = useCamera()
  const { isRecording, downloadUrl, filename, startRecording, stopRecording, clearRecording } = useMediaRecorder(stream)
  const { isPlaying, progress, play, pause, toggle, reset, scrollRef } = useTeleprompter(speed)

  // Carrega o roteiro se scriptId fornecido
  useEffect(() => {
    if (!scriptId) {
      setScriptLoading(false)
      return
    }
    let cancelled = false
    supabase.from('scripts').select('*').eq('id', scriptId).single().then(({ data }) => {
      if (!cancelled) {
        setScript(data as Script)
        setScriptLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [scriptId])

  // Inicia câmera ao montar
  useEffect(() => {
    startCamera()
  }, [startCamera])

  // Conecta stream ao elemento de vídeo
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      stopCamera()
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current)
    }
  }, [stopCamera])

  // Auto-esconde controles após inatividade
  function handleActivity() {
    setShowControls(true)
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current)
    controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000)
  }

  // Toggle de gravação unificado (usado pelo Controls via onToggleRecord)
  function handleToggleRecord() {
    if (isRecording) {
      handleStopRecording()
    } else {
      handleStartRecording()
    }
  }

  // Atalhos de teclado
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      switch (e.code) {
        case 'Space':
          e.preventDefault()
          toggle()
          break
        case 'KeyR':
          handleToggleRecord()
          break
        case 'ArrowUp':
          e.preventDefault()
          setSpeed(Math.min(10, speed + 1))
          break
        case 'ArrowDown':
          e.preventDefault()
          setSpeed(Math.max(1, speed - 1))
          break
        case 'Escape':
          handleBack()
          break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isRecording, speed, toggle])

  async function handleStartRecording() {
    startRecording()
    play()
    setRecordingStartTime(Date.now())
  }

  async function handleStopRecording() {
    stopRecording()
    pause()
    const duration = recordingStartTime ? (Date.now() - recordingStartTime) / 1000 : 0

    if (scriptId && script && user) {
      await supabase.from('recordings').insert({
        user_id: user.id,
        script_id: scriptId,
        title: script.title,
        duration_seconds: Math.round(duration),
        format: script.format,
      })
    }
  }

  function handleBack() {
    if (isRecording) {
      if (!confirm('Você está gravando. Deseja sair mesmo assim?')) return
    }
    stopCamera()
    navigate(-1)
  }

  function handleDiscard() {
    clearRecording()
    reset()
  }

  const scriptText = script?.content ?? ''

  if (scriptLoading) {
    return <div className="h-dvh bg-black flex items-center justify-center text-white">Carregando...</div>
  }

  if (cameraError) {
    return (
      <div className="h-dvh bg-black flex flex-col items-center justify-center text-white gap-4 p-8 text-center">
        <p className="text-lg">Não foi possível acessar a câmera</p>
        <p className="text-sm opacity-70">{cameraError}</p>
        <button className="text-sm underline" onClick={() => navigate(-1)}>Voltar</button>
      </div>
    )
  }

  return (
    <div
      className="relative h-dvh w-full bg-black overflow-hidden"
      onMouseMove={handleActivity}
      onTouchStart={handleActivity}
    >
      {/* Feed da câmera */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }}
      />

      {/* Barra de progresso */}
      <ProgressBar progress={progress} />

      {/* Banner de download */}
      {downloadUrl && filename && (
        <DownloadBanner
          downloadUrl={downloadUrl}
          filename={filename}
          onDiscard={handleDiscard}
        />
      )}

      {/* Texto rolando */}
      {scriptText && (
        <ScrollingText
          scrollRef={scrollRef}
          script={scriptText}
          fontSize={fontSize}
        />
      )}

      {/* Controles */}
      <Controls
        isPlaying={isPlaying}
        isRecording={isRecording}
        downloadUrl={downloadUrl}
        filename={filename}
        speed={speed}
        fontSize={fontSize}
        visible={showControls}
        onTogglePlay={toggle}
        onToggleRecord={handleToggleRecord}
        onReset={reset}
        onReRecord={handleDiscard}
        onSpeedChange={setSpeed}
        onFontSizeChange={setFontSize}
        onBack={handleBack}
      />
    </div>
  )
}
