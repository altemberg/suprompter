import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useIsMobile } from '@/hooks/useIsMobile'
import type { Script } from '@/types'
import { ScriptEditor } from '@/components/scripts/ScriptEditor'
import { AIAssistant } from '@/components/scripts/AIAssistant'
import { Pencil } from 'lucide-react'

export function ScriptDetail() {
  const { id } = useParams<{ id: string }>()
  const isMobile = useIsMobile()
  const [script, setScript] = useState<Script | null>(null)
  const [loading, setLoading] = useState(true)
  const titleSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false

    supabase
      .from('scripts')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (!cancelled) {
          setScript(data as Script)
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [id])

  if (loading) {
    return (
      <div style={{ padding: isMobile ? '16px' : '32px 36px', background: 'var(--bg-page)', height: '100%' }}>
        <div style={{ height: '28px', width: '200px', background: 'rgba(255,255,255,0.06)', borderRadius: '8px', marginBottom: '16px' }} />
        <div style={{ height: '400px', background: 'rgba(255,255,255,0.06)', borderRadius: '12px' }} />
      </div>
    )
  }

  if (!script) {
    return (
      <div style={{ padding: isMobile ? '16px' : '32px 36px', background: 'var(--bg-page)', height: '100%' }}>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.35)' }}>Roteiro não encontrado.</p>
      </div>
    )
  }

  function handleUpdate(updates: Partial<Script>) {
    setScript((prev) => prev ? { ...prev, ...updates } : prev)
  }

  function handleApplyFromAI(text: string) {
    setScript((prev) => prev ? { ...prev, content: text } : prev)
  }

  function handleMobileTitleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const title = e.target.value.trim() || 'Sem título'
    handleUpdate({ title })
    if (titleSaveTimer.current) clearTimeout(titleSaveTimer.current)
    titleSaveTimer.current = setTimeout(() => {
      if (script) supabase.from('scripts').update({ title }).eq('id', script.id)
    }, 500)
  }

  if (isMobile) {
    return (
      <div style={{ padding: '16px', background: 'var(--bg-page)', overflowY: 'auto', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Título no topo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '0.5px solid rgba(255,255,255,0.10)', paddingBottom: '14px' }}>
          <Pencil size={20} strokeWidth={2} style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
          <input
            defaultValue={script.title}
            placeholder="Título do roteiro"
            onBlur={handleMobileTitleBlur}
            style={{
              flex: 1,
              fontSize: '22px',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.92)',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              letterSpacing: '-0.4px',
            }}
          />
        </div>

        <div>
          <AIAssistant
            currentScript={script.content}
            format={script.format}
            onApply={handleApplyFromAI}
          />
        </div>
        <div>
          <ScriptEditor script={script} onUpdate={handleUpdate} hideTitleBlock />
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px 36px', background: 'var(--bg-page)', height: '100%', display: 'flex', gap: '24px', boxSizing: 'border-box' }}>
      {/* Assistente IA — 40% */}
      <div style={{ flex: 4, minWidth: 0, overflowY: 'auto' }}>
        <AIAssistant
          currentScript={script.content}
          format={script.format}
          onApply={handleApplyFromAI}
        />
      </div>

      {/* Divisor */}
      <div style={{ width: '0.5px', background: 'rgba(255,255,255,0.07)', flexShrink: 0 }} />

      {/* Editor — 60% */}
      <div style={{ flex: 6, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <ScriptEditor script={script} onUpdate={handleUpdate} />
      </div>
    </div>
  )
}
