import { useState } from 'react'

interface ScriptEditorProps {
  onStart: (script: string, title: string, speed: number, fontSize: number) => void
  isLoading: boolean
}

export function ScriptEditor({ onStart, isLoading }: ScriptEditorProps) {
  const [script, setScript] = useState('')
  const [title, setTitle] = useState('')
  const [speed, setSpeed] = useState(3)
  const [fontSize, setFontSize] = useState(48)

  const handleStart = () => {
    if (!script.trim()) return
    onStart(script, title, speed, fontSize)
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.heading}>Supra Prompter</h1>
        <p style={styles.subtitle}>Cole ou digite seu roteiro e comece a gravar.</p>

        <div style={styles.field}>
          <label style={styles.label}>Título do vídeo (opcional)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Episódio 1 — Introdução"
            style={styles.input}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Roteiro</label>
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="Cole ou escreva seu roteiro aqui..."
            style={styles.textarea}
          />
        </div>

        <div style={styles.sliders}>
          <div style={styles.sliderGroup}>
            <label style={styles.label}>
              Velocidade do scroll <span style={styles.value}>{speed}x</span>
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              style={styles.range}
            />
          </div>

          <div style={styles.sliderGroup}>
            <label style={styles.label}>
              Tamanho da fonte <span style={styles.value}>{fontSize}px</span>
            </label>
            <input
              type="range"
              min={24}
              max={96}
              step={4}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              style={styles.range}
            />
          </div>
        </div>

        <button
          onClick={handleStart}
          disabled={!script.trim() || isLoading}
          style={{
            ...styles.button,
            opacity: !script.trim() || isLoading ? 0.5 : 1,
            cursor: !script.trim() || isLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {isLoading ? 'Acessando câmera...' : '▶ Iniciar Teleprompter'}
        </button>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    background: 'var(--bg)',
  },
  card: {
    width: '100%',
    maxWidth: '680px',
    animation: 'fadeIn 0.4s ease',
  },
  heading: {
    fontSize: '2rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '6px',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    marginBottom: '36px',
    fontSize: '0.95rem',
  },
  field: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '0.85rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  input: {
    width: '100%',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '1rem',
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  textarea: {
    width: '100%',
    minHeight: '240px',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '16px',
    fontSize: '1rem',
    color: 'var(--text-primary)',
    outline: 'none',
    resize: 'vertical',
    lineHeight: '1.7',
  },
  sliders: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginBottom: '28px',
  },
  sliderGroup: {},
  value: {
    color: 'var(--text-primary)',
    fontWeight: 600,
    marginLeft: '6px',
  },
  range: {
    width: '100%',
    marginTop: '8px',
  },
  button: {
    width: '100%',
    padding: '14px',
    background: 'var(--text-primary)',
    color: 'var(--bg)',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 600,
    transition: 'opacity 0.2s',
  },
}
