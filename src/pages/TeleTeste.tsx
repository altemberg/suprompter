import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FlaskConical, ArrowLeft } from 'lucide-react'
import { useCamera } from '@/hooks/useCamera'
import { useMediaRecorder } from '@/hooks/useMediaRecorder'
import { useTeleprompter } from '@/hooks/useTeleprompter'

type Stage = 'loading' | 'ready' | 'recording' | 'done' | 'error'

const TEMAS = [
  'produtividade matinal e como as primeiras 2 horas do dia definem seu resultado',
  'por que a maioria das pessoas nunca atinge seus objetivos e o que fazer diferente',
  'o erro mais comum de quem começa a criar conteúdo nas redes sociais',
  'como construir autoridade online sem precisar de milhões de seguidores',
  'a diferença entre estar ocupado e ser produtivo',
  'por que consistência bate talento no longo prazo',
  'como transformar conhecimento em renda sem precisar de uma audiência grande',
]

function getTemAleatorio() {
  return TEMAS[Math.floor(Math.random() * TEMAS.length)]
}

async function gerarRoteiroTeste(): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY ?? import.meta.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OpenRouter API Key não configurada')

  const tema = getTemAleatorio()

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4-5',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `Crie um roteiro para vídeo curto de até 60 segundos sobre: ${tema}.

REGRAS:
- Máximo de 120 palavras no total
- Linguagem direta e coloquial, como se estivesse conversando
- Sem introduções longas — começa impactando
- Termine com uma frase de encerramento clara
- Retorne APENAS o texto do roteiro, sem títulos, sem formatação, sem explicações`,
      }],
    }),
  })

  if (!response.ok) throw new Error('Erro ao gerar roteiro')
  const data = await response.json()
  return data.choices[0].message.content.trim()
}

export function TeleTeste() {
  const navigate = useNavigate()
  const [stage, setStage] = useState<Stage>('loading')
  const [roteiro, setRoteiro] = useState('')
  const [erro, setErro] = useState('')

  const { stream, videoRef, error: cameraError, startCamera, stopCamera } = useCamera()
  const { isRecording, stage: recStage, progress, downloadUrl, fileName, startRecording, stopRecording } = useMediaRecorder(stream, 'teleteste', 'reels')
  const { isPlaying, toggle, reset, progress: scrollProgress, scrollRef, handleDragStart, handleDragMove, handleDragEnd } = useTeleprompter(4)

  useEffect(() => {
    async function init() {
      try {
        setStage('loading')
        const [texto] = await Promise.all([
          gerarRoteiroTeste(),
          startCamera('reels'),
        ])
        setRoteiro(texto)
        setStage('ready')
      } catch (e: unknown) {
        setErro(e instanceof Error ? e.message : 'Erro desconhecido')
        setStage('error')
      }
    }
    init()
    return () => stopCamera()
  }, [startCamera, stopCamera])

  useEffect(() => {
    if (recStage === 'done') setStage('done')
  }, [recStage])

  useEffect(() => {
    if (cameraError) {
      setErro(cameraError)
      setStage('error')
    }
  }, [cameraError])

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = downloadUrl!
    a.download = fileName!
    a.click()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', display: 'flex', flexDirection: 'column' }}>

      {/* Vídeo — preview da câmera (espelhado via CSS) */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scaleX(-1)',
          background: '#000',
        }}
      />

      {/* Badge TeleTeste */}
      <div style={{
        position: 'absolute', top: 16, left: 16,
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '5px 12px', borderRadius: '99px',
        background: 'rgba(255, 200, 80, 0.15)',
        border: '0.5px solid rgba(255, 200, 80, 0.3)',
        zIndex: 10,
      }}>
        <FlaskConical size={12} color="#ffc844" />
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#ffc844', letterSpacing: '0.5px' }}>
          TELETESTE
        </span>
      </div>

      {/* Botão voltar */}
      <button
        onClick={() => { stopCamera(); navigate(-1) }}
        style={{
          position: 'absolute', top: 16, right: 16,
          background: 'rgba(255,255,255,0.1)', border: 'none',
          borderRadius: '99px', padding: '6px 14px',
          color: 'rgba(255,255,255,0.6)', fontSize: '13px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
          zIndex: 10,
        }}
      >
        <ArrowLeft size={13} /> Sair
      </button>

      {/* Loading */}
      {stage === 'loading' && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.7)', zIndex: 20, gap: '12px',
        }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            border: '2px solid rgba(255,200,80,0.3)', borderTopColor: '#ffc844',
            animation: 'spin 0.8s linear infinite',
          }} />
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
            Gerando roteiro de teste...
          </p>
        </div>
      )}

      {/* Erro */}
      {stage === 'error' && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.85)', zIndex: 20, gap: '12px',
        }}>
          <p style={{ fontSize: '14px', color: '#f09595' }}>{erro}</p>
          <button onClick={() => navigate(-1)} style={{ color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px' }}>
            ← Voltar
          </button>
        </div>
      )}

      {/* Upload/processamento */}
      {(recStage === 'uploading' || recStage === 'processing') && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '16px', zIndex: 20, padding: '32px',
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            border: '2px solid rgba(255,200,80,0.3)', borderTopColor: '#ffc844',
            animation: 'spin 0.8s linear infinite',
          }} />
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
            {recStage === 'uploading' ? `Enviando para processar... ${progress}%` : 'Processando vídeo...'}
          </p>
          <div style={{ width: '200px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px' }}>
            <div style={{ height: '100%', background: '#ffc844', borderRadius: '99px', width: `${progress}%`, transition: 'width 0.3s' }} />
          </div>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
            O vídeo está sendo rotacionado e otimizado
          </p>
        </div>
      )}

      {/* Overlay teleprompter — ready ou recording */}
      {(stage === 'ready' || stage === 'recording') && roteiro && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          padding: '0 0 120px',
          zIndex: 5,
        }}>
          {/* Barra de progresso */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'rgba(255,255,255,0.1)' }}>
            <div style={{ height: '100%', background: '#ffc844', width: `${scrollProgress * 100}%`, transition: 'width 0.3s' }} />
          </div>

          {/* Texto rolando */}
          <div
            ref={scrollRef}
            style={{ maxHeight: '45vh', overflowY: 'hidden', padding: '0 28px', touchAction: 'none', cursor: 'grab', userSelect: 'none' }}
            onTouchStart={e => handleDragStart(e.touches[0].clientY)}
            onTouchMove={e => { e.preventDefault(); handleDragMove(e.touches[0].clientY) }}
            onTouchEnd={handleDragEnd}
            onMouseDown={e => handleDragStart(e.clientY)}
            onMouseMove={e => { if (e.buttons === 1) handleDragMove(e.clientY) }}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
          >
            <p style={{
              fontFamily: 'Georgia, serif',
              fontSize: '22px', lineHeight: 1.7,
              color: 'rgba(255,255,255,0.95)',
              textAlign: 'center',
              textShadow: '0 2px 8px rgba(0,0,0,0.8)',
            }}>
              {roteiro}
            </p>
          </div>
        </div>
      )}

      {/* Controles */}
      {(stage === 'ready' || stage === 'recording') && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '16px 24px 40px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px',
          zIndex: 10,
        }}>
          {/* Play/Pause scroll */}
          <button
            onClick={toggle}
            style={{
              width: '48px', height: '48px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)', border: 'none',
              color: 'white', fontSize: '18px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>

          {/* Gravar / Parar */}
          <button
            onClick={() => {
              if (isRecording) {
                stopRecording()
              } else {
                startRecording()
                setStage('recording')
                if (!isPlaying) toggle()
              }
            }}
            style={{
              height: '56px', padding: '0 28px', borderRadius: '99px',
              background: isRecording ? 'rgba(220, 50, 50, 0.9)' : 'rgba(255,255,255,0.15)',
              border: isRecording ? '2px solid rgba(255,80,80,0.8)' : '0.5px solid rgba(255,255,255,0.2)',
              color: 'white', fontSize: '14px', fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
            }}
          >
            <span style={{
              width: '10px', height: '10px', borderRadius: '50%',
              background: isRecording ? 'white' : '#ff4444',
              animation: isRecording ? 'blink 1s step-end infinite' : 'none',
              flexShrink: 0,
            }} />
            {isRecording ? 'Parar' : 'Gravar'}
          </button>

          {/* Reiniciar scroll */}
          <button
            onClick={reset}
            style={{
              width: '48px', height: '48px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)', border: 'none',
              color: 'white', fontSize: '18px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ↺
          </button>
        </div>
      )}

      {/* Banner pós-gravação */}
      {stage === 'done' && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '16px', zIndex: 20, padding: '32px',
        }}>
          <FlaskConical size={32} color="#ffc844" />
          <p style={{ fontSize: '18px', fontWeight: 500, color: 'white' }}>
            Teste concluído!
          </p>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
            Baixe o vídeo e verifique a qualidade da gravação.
          </p>
          <button
            onClick={handleDownload}
            style={{
              padding: '12px 28px', borderRadius: '10px', fontSize: '14px', fontWeight: 500,
              background: 'rgba(255,200,80,0.15)', border: '0.5px solid rgba(255,200,80,0.35)',
              color: '#ffc844', cursor: 'pointer',
            }}
          >
            Baixar vídeo de teste
          </button>
          <button
            onClick={() => { stopCamera(); navigate('/teleteste') }}
            style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Testar novamente
          </button>
          <button
            onClick={() => { stopCamera(); navigate(-1) }}
            style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ← Voltar
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes blink { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }
      `}</style>
    </div>
  )
}

export default TeleTeste
