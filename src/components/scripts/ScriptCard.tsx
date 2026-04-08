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
    if (!confirm(`Excluir "${script.title}"?`)) return
    setDeleting(true)
    await supabase.from('scripts').delete().eq('id', script.id)
    onDelete?.(script.id)
  }

  return (
    <div
      onClick={() => navigate(`/roteiros/${script.id}`)}
      className="bg-[#161616] border border-white/[0.07] rounded-xl p-5 hover:border-white/[0.12] hover:bg-[#1a1a1a] transition-colors cursor-pointer"
      style={{ position: 'relative', opacity: deleting ? 0.4 : 1, transition: 'opacity 0.2s' }}
    >
      <p className="text-[13.5px] font-medium text-white/85 truncate mb-2 pr-7">{script.title}</p>
      <div className="flex gap-2 items-center">
        {script.format === 'reels' ? (
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-[rgba(127,119,221,0.15)] text-[#a9a3f0] border border-[rgba(127,119,221,0.2)]">Reels</span>
        ) : (
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-[rgba(29,158,117,0.15)] text-[#4ecda4] border border-[rgba(29,158,117,0.2)]">YouTube</span>
        )}
        <span className="text-[12px] text-white/30">{script.tone}</span>
      </div>

      {/* Botão deletar */}
      <button
        onClick={handleDelete}
        disabled={deleting}
        style={{
          position: 'absolute', top: '14px', right: '14px',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.2)', padding: '2px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: '4px', transition: 'color 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'rgba(239,68,68,0.7)'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}
