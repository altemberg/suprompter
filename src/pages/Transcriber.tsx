import { useState, useRef } from 'react'
import { transcribeAudio, transcribeFromUrl, extractAudioFromVideo } from '@/lib/whisper'
import type { TranscriptionResult } from '@/lib/whisper'
import { looksLikeVideoUrl } from '@/lib/video-download'
import { Upload, Link, Copy, Check, Download, ExternalLink } from 'lucide-react'

type Stage = 'idle' | 'processing' | 'done' | 'error'
type Tab = 'file' | 'url'

function getEmbedUrl(url: string): string | null {
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?enablejsapi=1`
  }
  // Instagram e TikTok não têm embed público confiável
  return null
}

function VideoEmbed({ url }: { url: string }) {
  const embedUrl = getEmbedUrl(url)

  if (!embedUrl) {
    return (
      <div style={{
        background: '#161616',
        border: '0.5px solid rgba(255,255,255,0.07)',
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px',
      }}>
        <ExternalLink size={16} color="rgba(255,255,255,0.4)" />
        <div>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '2px' }}>
            Preview não disponível para esta plataforma
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '12px', color: '#a9a3f0', textDecoration: 'none' }}
          >
            Abrir no app original →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      paddingTop: '56.25%',
      borderRadius: '12px',
      overflow: 'hidden',
      background: '#000',
      marginBottom: '16px',
    }}>
      <iframe
        src={embedUrl}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}

interface Segment {
  start: number
  end: number
  text: string
}

function TranscriptViewer({
  segments,
  fullText,
  onTimestampClick,
}: {
  segments: Segment[]
  fullText: string
  onTimestampClick?: (seconds: number) => void
}) {
  const [view, setView] = useState<'segments' | 'full'>('segments')
  const [copied, setCopied] = useState(false)

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(fullText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([fullText], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'transcricao.txt'
    a.click()
  }

  return (
    <div style={{
      background: '#161616',
      border: '0.5px solid rgba(255,255,255,0.07)',
      borderRadius: '12px',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: '0.5px solid rgba(255,255,255,0.07)',
      }}>
        {/* Abas */}
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '3px' }}>
          {(['segments', 'full'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: '4px 12px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 500,
                background: view === v ? '#2a2a2a' : 'transparent',
                color: view === v ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {v === 'segments' ? 'Com timestamps' : 'Texto completo'}
            </button>
          ))}
        </div>

        {/* Ações */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleCopy}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '5px 10px',
              background: 'rgba(127,119,221,0.15)',
              border: '0.5px solid rgba(127,119,221,0.3)',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#a9a3f0',
              cursor: 'pointer',
            }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
          <button
            onClick={handleDownload}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '5px 10px',
              background: 'rgba(255,255,255,0.05)',
              border: '0.5px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
            }}
          >
            <Download size={12} />
            .txt
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      <div style={{ padding: '16px 20px', maxHeight: '420px', overflowY: 'auto' }}>
        {view === 'segments' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {segments.map((seg, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <button
                  onClick={() => onTimestampClick?.(seg.start)}
                  style={{
                    flexShrink: 0,
                    padding: '2px 8px',
                    background: 'rgba(127,119,221,0.1)',
                    border: '0.5px solid rgba(127,119,221,0.2)',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 500,
                    color: '#a9a3f0',
                    cursor: onTimestampClick ? 'pointer' : 'default',
                    fontVariantNumeric: 'tabular-nums',
                    whiteSpace: 'nowrap',
                    marginTop: '2px',
                  }}
                >
                  {formatTime(seg.start)}
                </button>
                <p style={{
                  fontSize: '14px',
                  lineHeight: 1.6,
                  color: 'rgba(255,255,255,0.78)',
                  margin: 0,
                }}>
                  {seg.text}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{
            fontSize: '14px',
            lineHeight: 1.7,
            color: 'rgba(255,255,255,0.78)',
            whiteSpace: 'pre-wrap',
            margin: 0,
          }}>
            {fullText}
          </p>
        )}
      </div>
    </div>
  )
}

export function Transcriber() {
  const [tab, setTab] = useState<Tab>('file')
  const [urlInput, setUrlInput] = useState('')
  const [stage, setStage] = useState<Stage>('idle')
  const [progressMsg, setProgressMsg] = useState('')
  const [result, setResult] = useState<TranscriptionResult | null>(null)
  const [transcribedUrl, setTranscribedUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setStage('processing')
    setError(null)
    setResult(null)
    setTranscribedUrl(null)

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
    setTranscribedUrl(url)

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

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const handleReset = () => {
    setStage('idle')
    setResult(null)
    setTranscribedUrl(null)
    setUrlInput('')
  }

  const isYoutube = transcribedUrl ? /youtube\.com|youtu\.be/.test(transcribedUrl) : false

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
            <div style={{ display: 'flex', gap: '16px' }}>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                Duração: {formatTime(result.duration)}
              </span>
              {result.language && (
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                  Idioma: {result.language}
                </span>
              )}
            </div>
          )}

          {/* Vídeo embedded */}
          {transcribedUrl && <VideoEmbed url={transcribedUrl} />}

          {/* Transcrição */}
          {result.segments && result.segments.length > 0 ? (
            <TranscriptViewer
              segments={result.segments}
              fullText={result.text}
              onTimestampClick={isYoutube ? (seconds) => {
                const iframe = document.querySelector('iframe')
                if (iframe) {
                  iframe.contentWindow?.postMessage(
                    JSON.stringify({ event: 'command', func: 'seekTo', args: [seconds, true] }),
                    '*'
                  )
                }
              } : undefined}
            />
          ) : (
            <div style={{ background: '#161616', border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '20px' }}>
              <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'rgba(255,255,255,0.78)', whiteSpace: 'pre-wrap', margin: 0 }}>
                {result.text}
              </p>
            </div>
          )}

          {/* Nova transcrição */}
          <button
            onClick={handleReset}
            style={{ alignSelf: 'flex-start', fontSize: '13px', color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            ← Transcrever outro vídeo
          </button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
