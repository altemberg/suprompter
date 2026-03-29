import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { useIsMobile } from '@/hooks/useIsMobile'
import type { Script } from '@/types'
import { Plus, Video, FileText } from 'lucide-react'

export function Dashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [scripts, setScripts] = useState<Script[]>([])
  const [scriptCount, setScriptCount] = useState(0)
  const [recordingCount, setRecordingCount] = useState(0)

  useEffect(() => {
    if (!user) return
    let cancelled = false

    async function fetchData() {
      const [scriptsRes, countRes, recordingsRes] = await Promise.all([
        supabase
          .from('scripts')
          .select('*')
          .eq('user_id', user!.id)
          .order('updated_at', { ascending: false })
          .limit(3),
        supabase.from('scripts').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
        supabase.from('recordings').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
      ])

      if (!cancelled) {
        setScripts((scriptsRes.data as Script[]) ?? [])
        setScriptCount(countRes.count ?? 0)
        setRecordingCount(recordingsRes.count ?? 0)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [user])

  async function handleNewScript() {
    if (!user) return
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

    if (error) {
      console.error('Erro ao criar roteiro:', error)
      alert(`Erro ao criar roteiro: ${error.message}`)
      return
    }
    if (data) navigate(`/roteiros/${data.id}`)
  }

  const firstName = user?.email?.split('@')[0]

  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{ padding: isMobile ? '20px 16px' : '32px 36px', background: 'var(--bg-page)' }}
    >

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 500, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.4px', marginBottom: '4px' }}>
          Início
        </h1>
        <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.38)' }}>
          Bem-vindo de volta, {firstName || user?.email?.split('@')[0]}
        </p>
      </div>

      {/* Stats — sempre 2 colunas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <div style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-subtle)', borderRadius: '12px', padding: '20px' }}>
          <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'rgba(255,255,255,0.35)', marginBottom: '8px' }}>Roteiros</p>
          <p style={{ fontSize: '28px', fontWeight: 500, color: 'white', letterSpacing: '-1px', lineHeight: 1 }}>{scriptCount ?? 0}</p>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', marginTop: '4px' }}>criados até agora</p>
        </div>
        <div style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-subtle)', borderRadius: '12px', padding: '20px' }}>
          <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'rgba(255,255,255,0.35)', marginBottom: '8px' }}>Gravações</p>
          <p style={{ fontSize: '28px', fontWeight: 500, color: 'white', letterSpacing: '-1px', lineHeight: 1 }}>{recordingCount ?? 0}</p>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', marginTop: '4px' }}>sessões realizadas</p>
        </div>
      </div>

      {/* Action Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
        <button
          onClick={handleNewScript}
          style={{ background: 'var(--bg-surface)', border: '0.5px solid rgba(127,119,221,0.25)', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s, background 0.15s', minHeight: '44px' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(127,119,221,0.45)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(127,119,221,0.25)'; e.currentTarget.style.background = 'var(--bg-surface)'; }}
        >
          <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Plus size={16} color="var(--accent-light)" strokeWidth={1.8} />
          </div>
          <div>
            <p style={{ fontSize: '13.5px', fontWeight: 500, color: 'rgba(255,255,255,0.85)', marginBottom: '2px' }}>Novo Roteiro</p>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>Criar e editar com IA</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/teleprompter')}
          style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-subtle)', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s, background 0.15s', minHeight: '44px' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(29,158,117,0.35)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.background = 'var(--bg-surface)'; }}
        >
          <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: 'var(--teal-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Video size={16} color="var(--teal-light)" strokeWidth={1.8} />
          </div>
          <div>
            <p style={{ fontSize: '13.5px', fontWeight: 500, color: 'rgba(255,255,255,0.85)', marginBottom: '2px' }}>Abrir Teleprompter</p>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>Gravar com câmera</p>
          </div>
        </button>
      </div>

      {/* Roteiros recentes */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <p style={{ fontSize: '13px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'rgba(255,255,255,0.4)' }}>
          Roteiros recentes
        </p>
        <Link to="/roteiros" style={{ fontSize: '12.5px', color: 'rgba(127,119,221,0.8)', textDecoration: 'none' }}>
          Ver todos →
        </Link>
      </div>

      {/* Empty state */}
      {(!scripts || scripts.length === 0) && (
        <div style={{ background: 'var(--bg-surface)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '40px 24px', textAlign: 'center' }}>
          <FileText size={40} style={{ margin: '0 auto 14px', opacity: 0.18, display: 'block' }} strokeWidth={1.2} />
          <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.38)', marginBottom: '16px' }}>Nenhum roteiro ainda</p>
          <button
            onClick={handleNewScript}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 18px', background: 'var(--accent-bg)', border: '0.5px solid var(--accent-border)', borderRadius: '8px', fontSize: '13px', color: 'var(--accent-light)', cursor: 'pointer', minHeight: '44px' }}
          >
            <Plus size={13} strokeWidth={2} />
            Criar primeiro roteiro
          </button>
        </div>
      )}

      {/* Lista de roteiros (quando houver) */}
      {scripts && scripts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {scripts.slice(0, 3).map(script => (
            <Link
              key={script.id}
              to={`/roteiros/${script.id}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface)', border: '0.5px solid var(--border-subtle)', borderRadius: '12px', padding: '16px 20px', textDecoration: 'none', transition: 'border-color 0.15s' }}
            >
              <div>
                <p style={{ fontSize: '13.5px', fontWeight: 500, color: 'rgba(255,255,255,0.85)', marginBottom: '3px' }}>{script.title}</p>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>{new Date(script.updated_at).toLocaleDateString('pt-BR')}</p>
              </div>
              <span style={{
                fontSize: '11px', padding: '3px 8px', borderRadius: '6px',
                ...(script.format === 'reels'
                  ? { background: 'var(--accent-bg)', color: 'var(--accent-light)', border: '0.5px solid var(--accent-border)' }
                  : { background: 'var(--teal-bg)', color: 'var(--teal-light)', border: '0.5px solid rgba(29,158,117,0.25)' }
                )
              }}>
                {script.format === 'reels' ? 'Reels' : 'YouTube'}
              </span>
            </Link>
          ))}
        </div>
      )}

    </div>
  )
}
