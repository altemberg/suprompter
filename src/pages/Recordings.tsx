import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { useIsMobile } from '@/hooks/useIsMobile'
import type { Recording } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'
import { Film, Video, Trash2 } from 'lucide-react'

function formatDuration(seconds: number | null): string {
  if (seconds === null) return '--:--'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function Recordings() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('Apagar esta gravação do histórico?')) return
    setDeletingId(id)
    const { error } = await supabase.from('recordings').delete().eq('id', id)
    if (error) {
      alert(`Erro ao apagar: ${error.message}`)
    } else {
      setRecordings((prev) => prev.filter((r) => r.id !== id))
    }
    setDeletingId(null)
  }

  useEffect(() => {
    if (!user) return
    let cancelled = false

    supabase
      .from('recordings')
      .select('*')
      .eq('user_id', user.id)
      .order('recorded_at', { ascending: false })
      .then(({ data }) => {
        if (!cancelled) {
          setRecordings((data as Recording[]) ?? [])
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [user])

  return (
    <div style={{ padding: isMobile ? '20px 16px' : '32px 36px', background: 'var(--bg-page)', minHeight: '100%' }}>
    <div style={{ maxWidth: '720px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 500, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.4px', marginBottom: '4px' }}>
          Gravações
        </h1>
        <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.38)' }}>Histórico de sessões gravadas</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full bg-white/[0.06] rounded-xl" />
          ))}
        </div>
      ) : recordings.length === 0 ? (
        <div style={{ background: 'var(--bg-surface)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '48px 24px', textAlign: 'center' }}>
          <Film size={40} style={{ margin: '0 auto 14px', opacity: 0.18, display: 'block' }} strokeWidth={1.2} />
          <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.38)', marginBottom: '4px' }}>Nenhuma gravação ainda</p>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', marginBottom: '20px' }}>Abra o teleprompter e grave seu primeiro vídeo</p>
          <button
            onClick={() => navigate('/teleprompter')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 18px', background: 'var(--teal-bg)', border: '0.5px solid rgba(29,158,117,0.3)', borderRadius: '8px', fontSize: '13px', color: 'var(--teal-light)', cursor: 'pointer', minHeight: '44px' }}
          >
            <Video size={13} strokeWidth={2} />
            Ir ao Teleprompter
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {recordings.map((rec) => (
            <div
              key={rec.id}
              style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-subtle)', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '12px' : '0' }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontSize: '13.5px', fontWeight: 500, color: 'rgba(255,255,255,0.85)', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {rec.title ?? 'Sem título'}
                </p>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {rec.format === 'reels' ? (
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: 'var(--accent-bg)', color: 'var(--accent-light)', border: '0.5px solid var(--accent-border)' }}>Reels</span>
                  ) : rec.format === 'youtube' ? (
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: 'var(--teal-bg)', color: 'var(--teal-light)', border: '0.5px solid rgba(29,158,117,0.25)' }}>YouTube</span>
                  ) : null}
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>{formatDuration(rec.duration_seconds)}</span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>{formatDate(rec.recorded_at)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignSelf: isMobile ? 'flex-end' : 'center' }}>
                {rec.script_id && !isMobile && (
                  <button
                    onClick={() => navigate(`/teleprompter?scriptId=${rec.script_id}`)}
                    style={{ fontSize: '12.5px', padding: '6px 14px', background: 'transparent', border: '0.5px solid rgba(255,255,255,0.10)', borderRadius: '8px', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s', minHeight: '44px' }}
                  >
                    Regravar
                  </button>
                )}
                {rec.script_id && isMobile && (
                  <button
                    onClick={() => navigate(`/teleprompter?scriptId=${rec.script_id}`)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', background: 'transparent', border: '0.5px solid rgba(255,255,255,0.10)', borderRadius: '8px', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s', flexShrink: 0 }}
                    title="Regravar"
                  >
                    <Video size={15} strokeWidth={1.8} />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(rec.id)}
                  disabled={deletingId === rec.id}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', background: 'transparent', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'rgba(255,255,255,0.25)', cursor: deletingId === rec.id ? 'not-allowed' : 'pointer', transition: 'border-color 0.15s, color 0.15s', flexShrink: 0 }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; e.currentTarget.style.color = 'rgba(239,68,68,0.7)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.25)' }}
                >
                  <Trash2 size={15} strokeWidth={1.8} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </div>
  )
}
