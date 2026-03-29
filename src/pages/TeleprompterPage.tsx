import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTeleprompterStore } from '@/stores/useTeleprompterStore'
import { useIsMobile } from '@/hooks/useIsMobile'
import type { Script } from '@/types'
import { useCamera } from '@/hooks/useCamera'
import { useMediaRecorder } from '@/hooks/useMediaRecorder'
import { useTeleprompter } from '@/hooks/useTeleprompter'
import { Controls } from '@/components/teleprompter/Controls'
import { ScrollingText } from '@/components/teleprompter/ScrollingText'
import { ProgressBar } from '@/components/teleprompter/ProgressBar'
import { DownloadBanner } from '@/components/teleprompter/DownloadBanner'

export function TeleprompterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const scriptId = searchParams.get('scriptId')
  const { user } = useAuthStore()
  const { speed, fontSize, setSpeed, setFontSize } = useTeleprompterStore()
  const isMobile = useIsMobile()

  const [script, setScript] = useState<Script | null>(null)
  const [allScripts, setAllScripts] = useState<Script[]>([])
  const [scriptLoading, setScriptLoading] = useState(!!scriptId)
  const [showControls, setShowControls] = useState(true)
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null)

  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { canvasStream, videoRef, canvasRef, error: cameraError, startCamera, stopCamera } = useCamera()
  const { isRecording, downloadUrl, filename, startRecording, stopRecording, clearRecording } = useMediaRecorder(canvasStream, script?.title)
  const { isPlaying, progress, play, pause, toggle, reset, scrollRef } = useTeleprompter(speed)

  // Carrega todos os roteiros do usuário
  useEffect(() => {
    if (!user) return
    supabase
      .from('scripts')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .then(({ data }) => {
        if (data) setAllScripts(data as Script[])
      })
  }, [user])

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

  // Mobile sempre retrato (stories), desktop sempre paisagem
  useEffect(() => {
    startCamera(isMobile ? 'reels' : 'youtube')
  }, [startCamera, isMobile])

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
          setSpeed(Math.min(5, Math.round((speed + 0.5) * 10) / 10))
          break
        case 'ArrowDown':
          e.preventDefault()
          setSpeed(Math.max(1, Math.round((speed - 0.5) * 10) / 10))
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

    if (script && user) {
      await supabase.from('recordings').insert({
        user_id: user.id,
        script_id: script.id,
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

  function handleSelectScript(id: string) {
    const found = allScripts.find((s) => s.id === id)
    if (found) {
      setScript(found)
      reset()
    }
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
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        overflow: 'hidden',
        paddingTop: 'env(safe-area-inset-top)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
      onMouseMove={handleActivity}
      onTouchStart={handleActivity}
    >
      {/* Canvas invisível — rotaciona e grava */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Preview da câmera — só visual */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', background: '#000', transform: 'scaleX(-1)' }}
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
        speed={speed}
        fontSize={fontSize}
        visible={showControls}
        scripts={allScripts}
        currentScriptId={script?.id ?? null}
        onTogglePlay={toggle}
        onToggleRecord={handleToggleRecord}
        onReset={reset}
        onReRecord={handleDiscard}
        onSpeedChange={setSpeed}
        onFontSizeChange={setFontSize}
        onSelectScript={handleSelectScript}
        onBack={handleBack}
      />
    </div>
  )
}
