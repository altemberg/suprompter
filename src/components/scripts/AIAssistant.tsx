import { useState, useRef } from 'react'
import type { Format } from '@/types'
import { generateScript, improveScript, suggestHooksAndCTAs, applyHookOrCTA } from '@/lib/claude'
import { Sparkles, Wand2, Zap, Copy, CheckCircle, ArrowRight } from 'lucide-react'

interface AIAssistantProps {
  currentScript: string
  format: Format
  onApply: (text: string) => void
}

interface HooksData {
  hooks: string[]
  ctas: string[]
}

type Tab = 'generate' | 'improve' | 'hooks'

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-page)',
  border: '0.5px solid rgba(255,255,255,0.08)',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '13px',
  color: 'rgba(255,255,255,0.85)',
  outline: 'none',
}

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: 'none',
  lineHeight: 1.6,
  minHeight: '80px',
}

function ApplyButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
        padding: '10px 16px',
        background: 'rgba(29,158,117,0.2)',
        border: '0.5px solid rgba(29,158,117,0.5)',
        borderRadius: '8px',
        fontSize: '13.5px', fontWeight: 600,
        color: '#4ecda4',
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
    >
      <ArrowRight size={15} strokeWidth={2} />
      Aplicar ao editor
    </button>
  )
}

function PrimaryButton({ onClick, disabled, children }: { onClick: () => void; disabled: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
        padding: '8px 16px',
        background: 'var(--accent-bg)',
        border: '0.5px solid var(--accent-border)',
        borderRadius: '8px',
        fontSize: '13px', fontWeight: 500,
        color: 'var(--accent-light)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'background 0.15s',
      }}
    >
      {children}
    </button>
  )
}

export function AIAssistant({ currentScript, format, onApply }: AIAssistantProps) {
  const [activeTab, setActiveTab] = useState<Tab>('generate')

  // Gerar
  const [genTopic, setGenTopic] = useState('')
  const [genAudience, setGenAudience] = useState('')
  const [genDuration, setGenDuration] = useState('60')
  const [genCustomMinutes, setGenCustomMinutes] = useState('')
  const [genTone, setGenTone] = useState('Descontraído')
  const [genResult, setGenResult] = useState('')
  const [genLoading, setGenLoading] = useState(false)
  const [genError, setGenError] = useState('')

  // Melhorar
  const [improveInstruction, setImproveInstruction] = useState('')
  const [improveResult, setImproveResult] = useState('')
  const [improveLoading, setImproveLoading] = useState(false)
  const [improveError, setImproveError] = useState('')

  // Ganchos
  const [hooksData, setHooksData] = useState<HooksData | null>(null)
  const [hooksLoading, setHooksLoading] = useState(false)
  const [hooksError, setHooksError] = useState('')
  const hooksRawRef = useRef('')

  const [copiedItem, setCopiedItem] = useState<string | null>(null)
  const [applyingItem, setApplyingItem] = useState<string | null>(null)

  async function handleGenerate() {
    if (!genTopic.trim()) return
    setGenLoading(true)
    setGenResult('')
    setGenError('')
    try {
      const durationSeconds = genDuration === 'custom'
        ? Math.max(30, parseInt(genCustomMinutes || '1') * 60)
        : parseInt(genDuration)
      await generateScript(
        { topic: genTopic, format, tone: genTone, duration: durationSeconds, targetAudience: genAudience },
        (chunk) => setGenResult((prev) => prev + chunk)
      )
    } catch (e) {
      setGenError(e instanceof Error ? e.message : 'Erro ao gerar roteiro')
    } finally {
      setGenLoading(false)
    }
  }

  async function handleImprove() {
    if (!improveInstruction.trim() || !currentScript.trim()) return
    setImproveLoading(true)
    setImproveResult('')
    setImproveError('')
    try {
      await improveScript(
        { currentScript, instruction: improveInstruction },
        (chunk) => setImproveResult((prev) => prev + chunk)
      )
    } catch (e) {
      setImproveError(e instanceof Error ? e.message : 'Erro ao melhorar roteiro')
    } finally {
      setImproveLoading(false)
    }
  }

  async function handleHooks() {
    if (!currentScript.trim()) return
    setHooksLoading(true)
    setHooksData(null)
    setHooksError('')
    hooksRawRef.current = ''
    try {
      await suggestHooksAndCTAs(
        { scriptContent: currentScript, format },
        (chunk) => { hooksRawRef.current += chunk }
      )
      const raw = hooksRawRef.current.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
      const parsed = JSON.parse(raw) as HooksData
      setHooksData(parsed)
    } catch (e) {
      setHooksError(e instanceof Error ? e.message : 'Erro ao gerar sugestões')
    } finally {
      setHooksLoading(false)
    }
  }

  async function handleApplyHookOrCTA(text: string, type: 'hook' | 'cta') {
    if (!currentScript.trim() || applyingItem) return
    setApplyingItem(text)
    let result = ''
    try {
      await applyHookOrCTA(
        { currentScript, text, type },
        (chunk) => { result += chunk }
      )
      onApply(result)
    } catch (e) {
      console.error('Erro ao aplicar:', e)
    } finally {
      setApplyingItem(null)
    }
  }

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text)
    setCopiedItem(text)
    setTimeout(() => setCopiedItem(null), 2000)
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'generate', label: 'Gerar' },
    { key: 'improve', label: 'Melhorar' },
    { key: 'hooks', label: 'Ganchos' },
  ]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '2px' }}>
          <Sparkles size={14} strokeWidth={1.8} style={{ color: 'var(--accent-light)' }} />
          Assistente IA
        </h2>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)' }}>Claude Sonnet</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: 'var(--bg-page)', borderRadius: '8px', padding: '3px' }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1, padding: '6px', borderRadius: '6px',
              fontSize: '12.5px', fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
              border: 'none',
              ...(activeTab === tab.key
                ? { background: 'var(--bg-surface)', color: 'rgba(255,255,255,0.85)' }
                : { background: 'transparent', color: 'rgba(255,255,255,0.35)' }
              ),
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Conteúdo das tabs */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>

        {activeTab === 'generate' && (
          <>
            <input
              placeholder="Tema / assunto"
              value={genTopic}
              onChange={(e) => setGenTopic(e.target.value)}
              style={inputStyle}
            />
            <input
              placeholder="Público-alvo"
              value={genAudience}
              onChange={(e) => setGenAudience(e.target.value)}
              style={inputStyle}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <select value={genDuration} onChange={(e) => setGenDuration(e.target.value)} style={inputStyle}>
                <option value="30">30 segundos</option>
                <option value="60">1 minuto</option>
                <option value="90">1 min 30s</option>
                <option value="120">2 minutos</option>
                <option value="180">3 minutos</option>
                <option value="custom">Personalizado</option>
              </select>
              <select value={genTone} onChange={(e) => setGenTone(e.target.value)} style={inputStyle}>
                {['Descontraído', 'Profissional', 'Inspirador', 'Humorístico', 'Educativo'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            {genDuration === 'custom' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="number"
                  min="1"
                  max="60"
                  placeholder="Minutos"
                  value={genCustomMinutes}
                  onChange={(e) => setGenCustomMinutes(e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', flexShrink: 0 }}>minutos</span>
              </div>
            )}

            <PrimaryButton onClick={handleGenerate} disabled={genLoading || !genTopic.trim()}>
              <Wand2 size={14} strokeWidth={1.8} />
              {genLoading ? 'Gerando...' : 'Gerar Roteiro'}
            </PrimaryButton>

            {genError && <p style={{ fontSize: '12px', color: '#f87171' }}>{genError}</p>}

            {genResult && (
              <>
                <textarea value={genResult} readOnly style={{ ...textareaStyle, minHeight: '120px' }} />
                {!genLoading && <ApplyButton onClick={() => onApply(genResult)} />}
              </>
            )}
          </>
        )}

        {activeTab === 'improve' && (
          <>
            {currentScript && (
              <div style={{ background: 'var(--bg-page)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
                {currentScript.slice(0, 200)}{currentScript.length > 200 ? '...' : ''}
              </div>
            )}
            <textarea
              placeholder="O que você quer mudar? Ex: deixa mais direto, adiciona mais energia..."
              value={improveInstruction}
              onChange={(e) => setImproveInstruction(e.target.value)}
              style={textareaStyle}
            />
            <PrimaryButton
              onClick={handleImprove}
              disabled={improveLoading || !improveInstruction.trim() || !currentScript.trim()}
            >
              <Zap size={14} strokeWidth={1.8} />
              {improveLoading ? 'Melhorando...' : 'Melhorar'}
            </PrimaryButton>

            {improveError && <p style={{ fontSize: '12px', color: '#f87171' }}>{improveError}</p>}

            {improveResult && (
              <>
                <textarea value={improveResult} readOnly style={{ ...textareaStyle, minHeight: '120px' }} />
                {!improveLoading && <ApplyButton onClick={() => onApply(improveResult)} />}
              </>
            )}
          </>
        )}

        {activeTab === 'hooks' && (
          <>
            <PrimaryButton onClick={handleHooks} disabled={hooksLoading || !currentScript.trim()}>
              <Sparkles size={14} strokeWidth={1.8} />
              {hooksLoading ? 'Gerando...' : 'Gerar sugestões'}
            </PrimaryButton>

            {hooksError && <p style={{ fontSize: '12px', color: '#f87171' }}>{hooksError}</p>}

            {hooksData && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {([{ label: 'Ganchos de abertura', items: hooksData.hooks, type: 'hook' }, { label: 'CTAs de fechamento', items: hooksData.ctas, type: 'cta' }] as const).map(({ label, items, type }) => (
                  <div key={label}>
                    <p style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.35)', marginBottom: '8px' }}>{label}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {items.map((item, i) => (
                        <div
                          key={i}
                          style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px', background: 'var(--bg-page)', border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: '8px' }}
                        >
                          <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.75)', flex: 1, lineHeight: 1.5 }}>{item}</p>
                          <div style={{ display: 'flex', gap: '8px', flexShrink: 0, marginTop: '2px' }}>
                            <button
                              onClick={() => copyToClipboard(item)}
                              title="Copiar"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                            >
                              {copiedItem === item
                                ? <CheckCircle size={14} style={{ color: 'var(--teal-light)' }} />
                                : <Copy size={14} style={{ color: 'rgba(255,255,255,0.25)' }} />
                              }
                            </button>
                            <button
                              onClick={() => handleApplyHookOrCTA(item, type)}
                              disabled={!!applyingItem || !currentScript.trim()}
                              title={!currentScript.trim() ? 'Escreva um roteiro primeiro' : 'Aplicar ao roteiro com IA'}
                              style={{ background: 'none', border: 'none', cursor: (applyingItem || !currentScript.trim()) ? 'not-allowed' : 'pointer', padding: 0, display: 'flex', opacity: !currentScript.trim() ? 0.3 : 1 }}
                            >
                              {applyingItem === item
                                ? <span style={{ fontSize: '10px', color: 'rgba(29,158,117,0.7)' }}>...</span>
                                : <ArrowRight size={14} style={{ color: 'rgba(29,158,117,0.7)' }} />
                              }
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
