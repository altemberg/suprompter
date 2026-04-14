import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { ArrowLeft, Video } from 'lucide-react'
import type { Format } from '@/types'

export function ImportScript() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [format, setFormat] = useState<Format>('reels')
  const [saving, setSaving] = useState(false)

  const canProceed = content.trim().length > 0

  async function handleGoToTeleprompter() {
    if (!user || !canProceed) return
    setSaving(true)

    const { data, error } = await supabase
      .from('scripts')
      .insert({
        user_id: user.id,
        title: title.trim() || 'Roteiro Importado',
        content: content.trim(),
        format,
        tone: 'Descontraído',
        tags: [],
      })
      .select()
      .single()

    setSaving(false)
    if (error) {
      console.error('Erro ao salvar roteiro:', error)
      return
    }
    if (data) navigate(`/teleprompter?scriptId=${data.id}`)
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-page)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate('/roteiros')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', borderRadius: 'var(--radius-md)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <ArrowLeft size={18} strokeWidth={1.8} />
          </button>
          <div>
            <h1 style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>Importar Roteiro</h1>
            <p style={{ fontSize: '12px', color: 'var(--text-disabled)' }}>Cole seu roteiro e vá direto ao teleprompter</p>
          </div>
        </div>

        <button
          onClick={handleGoToTeleprompter}
          disabled={!canProceed || saving}
          style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 16px', background: canProceed ? 'var(--btn-primary)' : 'var(--bg-hover)', border: 'none', borderRadius: 'var(--radius-md)', fontSize: '14px', fontWeight: 500, color: canProceed ? 'var(--btn-primary-text)' : 'var(--text-disabled)', cursor: canProceed && !saving ? 'pointer' : 'not-allowed', transition: 'background 0.15s' }}
          onMouseEnter={e => { if (canProceed && !saving) e.currentTarget.style.background = 'var(--btn-primary-hover)' }}
          onMouseLeave={e => { if (canProceed && !saving) e.currentTarget.style.background = 'var(--btn-primary)' }}
        >
          <Video size={14} strokeWidth={1.8} />
          {saving ? 'Salvando...' : 'Ir ao Teleprompter'}
        </button>
      </div>

      {/* Form */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '720px', width: '100%', alignSelf: 'center' }}>

        {/* Título + Formato */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.7px', color: 'var(--text-disabled)', marginBottom: '6px' }}>
              Título
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Roteiro Importado"
              style={{ width: '100%', padding: '8px 12px', fontSize: '14px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', outline: 'none', fontFamily: 'var(--font-sans)', transition: 'border-color 0.15s' }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--border-muted)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
            />
          </div>
          <div style={{ flexShrink: 0 }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.7px', color: 'var(--text-disabled)', marginBottom: '6px' }}>
              Formato
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['reels', 'youtube'] as Format[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  style={{ padding: '8px 14px', borderRadius: 'var(--radius-md)', fontSize: '13px', cursor: 'pointer', transition: 'background 0.15s, border-color 0.15s', fontFamily: 'var(--font-sans)', ...(format === f ? { background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', color: 'var(--accent-light)' } : { background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }) }}
                >
                  {f === 'reels' ? 'Reels' : 'YouTube'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Textarea */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.7px', color: 'var(--text-disabled)', marginBottom: '6px' }}>
            Roteiro
          </label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Cole seu roteiro aqui..."
            style={{ flex: 1, minHeight: '420px', width: '100%', padding: '16px', fontSize: '15px', lineHeight: 1.7, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', color: 'var(--text-secondary)', outline: 'none', fontFamily: 'var(--font-sans)', resize: 'none', transition: 'border-color 0.15s' }}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--border-muted)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
            autoFocus
          />
        </div>
      </div>
    </div>
  )
}
