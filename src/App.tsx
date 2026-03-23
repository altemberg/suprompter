import { useState, useCallback } from 'react'
import { ScriptEditor } from './components/ScriptEditor'
import { Teleprompter } from './components/Teleprompter'
import { useCamera } from './hooks/useCamera'

type Mode = 'editor' | 'teleprompter'

interface TeleprompterConfig {
  script: string
  title: string
  speed: number
  fontSize: number
}

const ERROR_MESSAGES: Record<string, string> = {
  'permission-denied': 'Permissão de câmera negada. Permita o acesso nas configurações do browser.',
  'not-found': 'Nenhuma câmera encontrada. Verifique se há uma câmera conectada.',
  'not-supported': 'Seu browser não suporta acesso à câmera. Tente no Chrome ou Firefox.',
  'insecure-context':
    'Câmera bloqueada: o browser exige HTTPS para acessar a câmera em dispositivos externos. Use um túnel HTTPS (ex: Cloudflare Tunnel ou ngrok) em vez do IP local.',
}

export default function App() {
  const [mode, setMode] = useState<Mode>('editor')
  const [config, setConfig] = useState<TeleprompterConfig | null>(null)

  const { stream, error, isLoading, startCamera, stopCamera } = useCamera()

  const handleStart = useCallback(
    async (script: string, title: string, speed: number, fontSize: number) => {
      await startCamera()
      setConfig({ script, title, speed, fontSize })
      setMode('teleprompter')
    },
    [startCamera],
  )

  const handleBack = useCallback(() => {
    stopCamera()
    setMode('editor')
  }, [stopCamera])

  if (error) {
    return (
      <div style={errorStyles.container}>
        <div style={errorStyles.box}>
          <p style={errorStyles.icon}>⚠</p>
          <p style={errorStyles.msg}>{ERROR_MESSAGES[error] ?? 'Erro desconhecido.'}</p>
          <button
            onClick={() => {
              stopCamera()
              setMode('editor')
            }}
            style={errorStyles.btn}
          >
            Voltar ao editor
          </button>
        </div>
      </div>
    )
  }

  if (mode === 'teleprompter' && stream && config) {
    return (
      <Teleprompter
        script={config.script}
        fontSize={config.fontSize}
        initialSpeed={config.speed}
        stream={stream}
        onBack={handleBack}
      />
    )
  }

  return <ScriptEditor onStart={handleStart} isLoading={isLoading} />
}

const errorStyles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg)',
    padding: '24px',
  },
  box: {
    textAlign: 'center',
    maxWidth: '420px',
  },
  icon: {
    fontSize: '2.5rem',
    marginBottom: '16px',
    color: 'var(--accent)',
  },
  msg: {
    color: 'var(--text-secondary)',
    fontSize: '1rem',
    lineHeight: 1.6,
    marginBottom: '24px',
  },
  btn: {
    padding: '12px 24px',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
    cursor: 'pointer',
  },
}
