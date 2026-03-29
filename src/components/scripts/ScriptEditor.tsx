import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useIsMobile } from '@/hooks/useIsMobile'
import type { Script, Format } from '@/types'
import { Video, Save, Pencil } from 'lucide-react'

interface ScriptEditorProps {
  script: Script
  onUpdate: (updates: Partial<Script>) => void
  hideTitleBlock?: boolean
}

const WORDS_PER_MINUTE = 130

export function ScriptEditor({ script, onUpdate, hideTitleBlock = false }: ScriptEditorProps) {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'idle'>('idle')
  const [saveError, setSaveError] = useState('')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sempre aponta para o script mais recente — evita stale closure no debounce
  const scriptRef = useRef(script)
  useEffect(() => { scriptRef.current = script }, [script])

  const wordCount = script.content.trim()
    ? script.content.trim().split(/\s+/).length
    : 0
  const estimatedMinutes = wordCount > 0 ? (wordCount / WORDS_PER_MINUTE).toFixed(1) : '0'

  async function persist(): Promise<string | null> {
    const { title, content, format, tone } = scriptRef.current
    const { data, error } = await supabase
      .from('scripts')
      .update({ title, content, format, tone, updated_at: new Date().toISOString() })
      .eq('id', scriptRef.current.id)
      .select('id')

    if (error) return error.message
    if (!data || data.length === 0) return 'Nenhuma linha atualizada — verifique as permissões RLS no Supabase'
    return null
  }

  const debounceSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    setSaveStatus('saving')
    saveTimer.current = setTimeout(async () => {
      const errMsg = await persist()
      if (errMsg) {
        setSaveStatus('error')
        setSaveError(errMsg)
        console.error('Auto-save falhou:', errMsg)
      } else {
        setSaveStatus('saved')
      }
    }, 1500)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [script.id])

  async function handleManualSave() {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    setSaveStatus('saving')
    const errMsg = await persist()
    if (errMsg) {
      setSaveStatus('error')
      setSaveError(errMsg)
      alert(`Erro ao salvar: ${errMsg}`)
    } else {
      setSaveStatus('saved')
    }
  }

  async function handleGoToTeleprompter() {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    setSaveStatus('saving')
    const errMsg = await persist()
    if (errMsg) {
      setSaveStatus('error')
      setSaveError(errMsg)
      alert(`Erro ao salvar: ${errMsg}`)
      return
    }
    setSaveStatus('saved')
    navigate(`/teleprompter?scriptId=${script.id}`)
  }

  function handleContentChange(content: string) {
    onUpdate({ content })
    debounceSave()
  }

  function handleTitleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const title = e.target.value.trim() || 'Sem título'
    onUpdate({ title })
    debounceSave()
  }

  function handleFormatChange(format: Format) {
    onUpdate({ format })
    debounceSave()
  }

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [])

  const saveLabel =
    saveStatus === 'saving' ? 'Salvando...' :
    saveStatus === 'saved'  ? 'Salvo' :
    saveStatus === 'error'  ? `Erro: ${saveError}` :
    ''

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Título + status */}
      {!hideTitleBlock && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '0.5px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
          <Pencil size={14} strokeWidth={1.8} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
          <input
            defaultValue={script.title}
            placeholder="Título do roteiro"
            onBlur={handleTitleBlur}
            style={{
              flex: 1,
              fontSize: '18px',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.92)',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              letterSpacing: '-0.3px',
            }}
          />
          <span style={{
            fontSize: '12px',
            color: saveStatus === 'error' ? '#f87171' : 'rgba(255,255,255,0.25)',
            flexShrink: 0,
          }}>
            {saveLabel}
          </span>
        </div>
      )}

      {/* Formato */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {(['reels', 'youtube'] as Format[]).map((f) => (
          <button
            key={f}
            onClick={() => handleFormatChange(f)}
            style={{
              fontSize: '11px', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer',
              transition: 'background 0.15s',
              minHeight: '32px',
              ...(script.format === f
                ? { background: 'var(--accent-bg)', color: 'var(--accent-light)', border: '0.5px solid var(--accent-border)' }
                : { background: 'transparent', color: 'rgba(255,255,255,0.35)', border: '0.5px solid rgba(255,255,255,0.10)' }
              ),
            }}
          >
            {f === 'reels' ? 'Reels' : 'YouTube'}
          </button>
        ))}
      </div>

      {/* Textarea */}
      <textarea
        value={script.content}
        onChange={(e) => handleContentChange(e.target.value)}
        placeholder="Cole ou escreva o seu roteiro aqui..."
        style={{
          flex: 1,
          minHeight: isMobile ? '260px' : '240px',
          resize: 'none',
          background: 'var(--bg-surface)',
          border: '0.5px solid rgba(255,255,255,0.07)',
          borderRadius: '12px',
          padding: '16px',
          fontSize: '16px',
          lineHeight: 1.7,
          color: 'rgba(255,255,255,0.85)',
          outline: 'none',
          fontFamily: 'inherit',
        }}
      />

      {/* Rodapé */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.28)' }}>
          {wordCount} palavras · ~{estimatedMinutes} min
        </span>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={handleManualSave}
            disabled={saveStatus === 'saving'}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px',
              background: 'transparent',
              border: '0.5px solid rgba(255,255,255,0.12)',
              borderRadius: '8px',
              fontSize: '13px',
              color: 'rgba(255,255,255,0.5)',
              cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer',
              opacity: saveStatus === 'saving' ? 0.5 : 1,
              transition: 'border-color 0.15s, color 0.15s',
              minHeight: '44px',
            }}
          >
            <Save size={14} strokeWidth={1.8} />
            Salvar
          </button>

          <button
            onClick={handleGoToTeleprompter}
            disabled={!script.content.trim()}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '8px 16px',
              background: 'rgba(29,158,117,0.2)',
              border: '0.5px solid rgba(29,158,117,0.35)',
              borderRadius: '8px',
              fontSize: '13.5px', fontWeight: 500,
              color: 'var(--teal-light)',
              cursor: script.content.trim() ? 'pointer' : 'not-allowed',
              opacity: script.content.trim() ? 1 : 0.4,
              transition: 'background 0.15s',
              minHeight: '44px',
            }}
          >
            <Video size={15} strokeWidth={1.8} />
            Usar no Teleprompter
          </button>
        </div>
      </div>
    </div>
  )
}
