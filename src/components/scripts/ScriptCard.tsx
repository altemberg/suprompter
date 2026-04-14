import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Script } from '@/types'

interface ScriptCardProps {
  script: Script
  onDelete?: (id: string) => void
}

export function ScriptCard({ script, onDelete }: ScriptCardProps) {
  const navigate = useNavigate()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    if (!confirm(`Excluir "${script.title}"?`)) return
    setDeleting(true)
    await supabase.from('scripts').delete().eq('id', script.id)
    onDelete?.(script.id)
  }

  return (
    <div
      onClick={() => navigate(`/roteiros/${script.id}`)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg-surface)', border: '0.5px solid var(--border-subtle)',
        borderRadius: '12px', padding: '16px 20px',
        textDecoration: 'none', transition: 'border-color 0.15s, opacity 0.2s',
        cursor: 'pointer', opacity: deleting ? 0.4 : 1, gap: '12px',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-muted)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontSize: '13.5px', fontWeight: 500, color: 'rgba(255,255,255,0.85)', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {script.title}
        </p>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
          {new Date(script.updated_at).toLocaleDateString('pt-BR')}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <span style={{
          fontSize: '11px', padding: '3px 8px', borderRadius: '6px',
          ...(script.format === 'reels'
            ? { background: 'var(--accent-bg)', color: 'var(--accent-light)', border: '0.5px solid var(--accent-border)' }
            : { background: 'var(--teal-bg)', color: 'var(--teal-light)', border: '0.5px solid rgba(29,158,117,0.25)' }
          ),
        }}>
          {script.format === 'reels' ? 'Reels' : 'YouTube'}
        </span>

        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{
            background: 'none', border: 'none', cursor: deleting ? 'not-allowed' : 'pointer',
            color: 'rgba(255,255,255,0.25)', padding: '4px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '4px', transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(239,68,68,0.7)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
          aria-label="Excluir roteiro"
        >
          <Trash2 size={14} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  )
}
