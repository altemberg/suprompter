import { useState, useRef } from 'react'
import { transcribeAudio, transcribeFromUrl, extractAudioFromVideo } from '@/lib/whisper'
import type { TranscriptionResult } from '@/lib/whisper'
import { looksLikeVideoUrl } from '@/lib/video-download'
import { Upload, Link, Copy, Check, Download } from 'lucide-react'

type Stage = 'idle' | 'processing' | 'done' | 'error'
type Tab = 'file' | 'url'

export function Transcriber() {
  const [tab, setTab] = useState<Tab>('file')
  const [urlInput, setUrlInput] = useState('')
  const [stage, setStage] = useState<Stage>('idle')
  const [progressMsg, setProgressMsg] = useState('')
  const [result, setResult] = useState<TranscriptionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showSegments, setShowSegments] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setStage('processing')
    setError(null)
    setResult(null)

    try {
      const audioFile = await extractAudioFromVideo(file)
      const transcription = await transcribeAudio(audioFile, setProgressMsg)
      setResult(transcription)
      setStage('done')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      setStage('error')
    }
  }

  const handleUrl = async () => {
    const url = urlInput.trim()
    if (!url) return

    setStage('processing')
    setError(null)
    setResult(null)

    try {
      const transcription = await transcribeFromUrl(url, setProgressMsg)
      setResult(transcription)
      setStage('done')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      setStage('error')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleCopy = () => {
    if (!result) return
    navigator.clipboard.writeText(result.text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    if (!result) return
    const blob = new Blob([result.text], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'transcricao.txt'
    a.click()
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${String(s).padStart(2, '0')}`
  }

  return (
    <div style={{ padding: '32px 36px', overflowY: 'auto', height: '100%' }}>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 500, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.4px', marginBottom: '4px' }}>
          Transcritor
        </h1>
        <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.38)' }}>
          Envie um vídeo ou áudio e receba a transcrição em texto
        </p>
      </div>

      {/* Tabs + conteúdo idle */}
      {stage === 'idle' && (
        <div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: '#161616', border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
            {([['file', Upload, 'Arquivo'], ['url', Link, 'URL']] as const).map(([key, Icon, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '6px 14px', borderRadius: '7px', fontSize: '13px',
                  border: 'none', cursor: 'pointer',
                  background: tab === key ? 'rgba(127,119,221,0.2)' : 'transparent',
                  color: tab === key ? '#a9a3f0' : 'rgba(255,255,255,0.4)',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                <Icon size={13} strokeWidth={1.8} />
                {label}
              </button>
            ))}
          </div>

          {/* Aba: Arquivo */}
          {tab === 'file' && (
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '1px dashed rgba(255,255,255,0.15)',
                borderRadius: '12px',
                padding: '48px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.02)',
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(127,119,221,0.4)'
                e.currentTarget.style.background = 'rgba(127,119,221,0.05)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
              }}
            >
              <Upload size={32} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} strokeWidth={1.5} />
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>
                Arraste um vídeo ou clique para selecionar
              </p>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.28)' }}>
                MP4, WebM, MOV, MP3, M4A — máx. 25MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*,audio/*,.mp4,.webm,.mov,.mp3,.m4a,.wav,.ogg"
                style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
              />
            </div>
          )}

          {/* Aba: URL */}
          {tab === 'url' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="url"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleUrl() }}
                  placeholder="https://youtube.com/watch?v=... ou instagram.com/reel/..."
                  style={{
                    flex: 1, minHeight: '44px', fontSize: '14px', padding: '0 12px',
                    background: 'rgba(255,255,255,0.04)',
                    border: `0.5px solid ${looksLikeVideoUrl(urlInput) ? 'rgba(127,119,221,0.4)' : 'rgba(255,255,255,0.10)'}`,
                    borderRadius: '8px', color: 'rgba(255,255,255,0.8)', outline: 'none',
                    transition: 'border-color 0.15s',
                  }}
                  autoFocus
                />
                <button
                  onClick={handleUrl}
                  disabled={!urlInput.trim()}
                  style={{
                    padding: '0 18px', minHeight: '44px', borderRadius: '8px', fontSize: '13px',
                    background: urlInput.trim() ? 'rgba(127,119,221,0.2)' : 'rgba(255,255,255,0.05)',
                    border: `0.5px solid ${urlInput.trim() ? 'rgba(127,119,221,0.35)' : 'rgba(255,255,255,0.08)'}`,
                    color: urlInput.trim() ? '#a9a3f0' : 'rgba(255,255,255,0.25)',
                    cursor: urlInput.trim() ? 'pointer' : 'default',
                    transition: 'all 0.15s', whiteSpace: 'nowrap',
                  }}
                >
                  Transcrever
                </button>
              </div>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.28)', lineHeight: 1.5 }}>
                Suporta YouTube, Instagram Reels, TikTok, Twitter/X e mais. O vídeo precisa ser público.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Processando */}
      {stage === 'processing' && (
        <div style={{ background: '#161616', border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '32px 24px', textAlign: 'center' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            border: '2px solid rgba(127,119,221,0.3)',
            borderTopColor: '#a9a3f0',
            margin: '0 auto 16px',
            animation: 'spin 0.8s linear infinite',
          }} />
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>{progressMsg || 'Processando...'}</p>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>Isso pode levar alguns segundos</p>
        </div>
      )}

      {/* Erro */}
      {stage === 'error' && (
        <div style={{ background: 'rgba(162,45,45,0.15)', border: '0.5px solid rgba(162,45,45,0.3)', borderRadius: '12px', padding: '20px 24px', marginBottom: '16px' }}>
          <p style={{ fontSize: '14px', color: '#f09595', marginBottom: '12px' }}>{error}</p>
          <button
            onClick={() => setStage('idle')}
            style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            ← Tentar novamente
          </button>
        </div>
      )}

      {/* Resultado */}
      {stage === 'done' && result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Meta info */}
          {result.duration && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                Duração: {formatTime(result.duration)}
              </span>
              {result.language && (
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                  Idioma detectado: {result.language}
                </span>
              )}
            </div>
          )}

          {/* Texto completo */}
          <div style={{ background: '#161616', border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <p style={{ fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'rgba(255,255,255,0.4)' }}>
                Transcrição
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleCopy}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'rgba(127,119,221,0.15)', border: '0.5px solid rgba(127,119,221,0.3)', borderRadius: '6px', fontSize: '12px', color: '#a9a3f0', cursor: 'pointer' }}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
                <button
                  onClick={handleDownload}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
                >
                  <Download size={12} />
                  .txt
                </button>
              </div>
            </div>
            <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'rgba(255,255,255,0.82)', whiteSpace: 'pre-wrap' }}>
              {result.text}
            </p>
          </div>

          {/* Segmentos com timestamps (toggle) */}
          {result.segments && result.segments.length > 0 && (
            <div style={{ background: '#161616', border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: '12px', overflow: 'hidden' }}>
              <button
                onClick={() => setShowSegments(s => !s)}
                style={{ width: '100%', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.55)', fontSize: '13px' }}
              >
                <span>Ver segmentos com timestamps</span>
                <span>{showSegments ? '↑' : '↓'}</span>
              </button>
              {showSegments && (
                <div style={{ padding: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {result.segments.map((seg, i) => (
                    <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', flexShrink: 0, paddingTop: '2px', fontVariantNumeric: 'tabular-nums' }}>
                        {formatTime(seg.start)}
                      </span>
                      <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                        {seg.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Nova transcrição */}
          <button
            onClick={() => { setStage('idle'); setResult(null) }}
            style={{ alignSelf: 'flex-start', fontSize: '13px', color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            ← Transcrever outro arquivo
          </button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
