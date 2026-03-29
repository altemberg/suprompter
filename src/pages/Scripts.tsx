import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { useIsMobile } from '@/hooks/useIsMobile'
import type { Script, Format } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'
import { ScriptCard } from '@/components/scripts/ScriptCard'
import { Plus, Search, FileText } from 'lucide-react'

export function Scripts() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [scripts, setScripts] = useState<Script[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')
  const [formatFilter, setFormatFilter] = useState<Format | 'all'>('all')

  useEffect(() => {
    if (!user) return
    let cancelled = false

    supabase
      .from('scripts')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .then(({ data }) => {
        if (!cancelled) {
          setScripts((data as Script[]) ?? [])
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [user])

  async function createScript() {
    if (!user) return
    setCreating(true)
    const { data, error } = await supabase
      .from('scripts')
      .insert({
        user_id: user.id,
        title: 'Rascunho',
        content: '',
        format: 'reels',
        tone: 'Descontraído',
        tags: [],
      })
      .select()
      .single()

    setCreating(false)
    if (error) {
      console.error('Erro ao criar roteiro:', error)
      alert(`Erro ao criar roteiro: ${error.message}`)
      return
    }
    if (data) navigate(`/roteiros/${data.id}`)
  }

  const filtered = scripts.filter((s) => {
    const matchesFormat = formatFilter === 'all' || s.format === formatFilter
    const matchesSearch = s.title.toLowerCase().includes(search.toLowerCase())
    return matchesFormat && matchesSearch
  })

  return (
    <div style={{ padding: isMobile ? '20px 16px' : '32px 36px', background: 'var(--bg-page)', minHeight: '100%' }}>
    <div style={{ maxWidth: '720px', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 500, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.4px', marginBottom: '4px' }}>
            Roteiros
          </h1>
          <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.38)' }}>Gerencie seus roteiros</p>
        </div>
        <button
          onClick={createScript}
          disabled={creating}
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '8px 16px',
            background: 'rgba(127,119,221,0.2)',
            border: '0.5px solid rgba(127,119,221,0.35)',
            borderRadius: '8px',
            fontSize: '13.5px', fontWeight: 500,
            color: '#a9a3f0',
            cursor: creating ? 'not-allowed' : 'pointer',
            opacity: creating ? 0.6 : 1,
            transition: 'background 0.15s',
            minHeight: '44px',
            flexShrink: 0,
          }}
        >
          <Plus size={15} strokeWidth={2} />
          {creating ? 'Criando...' : 'Novo Roteiro'}
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: isMobile ? 'nowrap' : 'wrap', overflowX: isMobile ? 'auto' : 'visible', WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'] }}>
        <div style={{ position: 'relative', flex: 1, minWidth: isMobile ? '160px' : '180px', flexShrink: 0 }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)' }} />
          <input
            placeholder="Buscar roteiros..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg-surface)',
              border: '0.5px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              padding: '8px 12px 8px 34px',
              fontSize: '13.5px',
              color: 'rgba(255,255,255,0.85)',
              outline: 'none',
              minHeight: '44px',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          {(['all', 'reels', 'youtube'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFormatFilter(f)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'background 0.15s, border-color 0.15s',
                flexShrink: 0,
                minHeight: '44px',
                ...(formatFilter === f
                  ? { background: 'rgba(127,119,221,0.15)', border: '0.5px solid rgba(127,119,221,0.3)', color: '#a9a3f0' }
                  : { background: 'transparent', border: '0.5px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }
                ),
              }}
            >
              {f === 'all' ? 'Todos' : f === 'reels' ? 'Reels' : 'YouTube'}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full bg-white/[0.06] rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: 'var(--bg-surface)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '40px 24px', textAlign: 'center' }}>
          <FileText size={40} style={{ margin: '0 auto 14px', opacity: 0.18, display: 'block' }} strokeWidth={1.2} />
          <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.38)', marginBottom: '16px' }}>Nenhum roteiro encontrado</p>
          <button
            onClick={createScript}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 18px', background: 'var(--accent-bg)', border: '0.5px solid var(--accent-border)', borderRadius: '8px', fontSize: '13px', color: 'var(--accent-light)', cursor: 'pointer', minHeight: '44px' }}
          >
            <Plus size={13} strokeWidth={2} />
            Criar roteiro
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
          {filtered.map((script) => (
            <ScriptCard key={script.id} script={script} />
          ))}
        </div>
      )}
    </div>
    </div>
  )
}
