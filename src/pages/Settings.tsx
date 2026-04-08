import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTeleprompterStore } from '@/stores/useTeleprompterStore'
import { useIsMobile } from '@/hooks/useIsMobile'
import { Slider } from '@/components/ui/slider'
import { supabase } from '@/lib/supabase'
import type { Posicionamento } from '@/types'

export function SettingsPage() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const { signOut } = useAuthStore()
  const { speed, fontSize, setSpeed, setFontSize } = useTeleprompterStore()

  // ── Posicionamentos ──
  const [posicionamentos, setPosicionamentos] = useState<Posicionamento[]>([])
  const [novoNome, setNovoNome] = useState('')
  const [novaDescricao, setNovaDescricao] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    supabase
      .from('posicionamentos')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => setPosicionamentos(data ?? []))
  }, [])

  const handleSalvarPosicionamento = async () => {
    if (!novoNome.trim() || !novaDescricao.trim()) return
    setSalvando(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('posicionamentos')
      .insert({ nome: novoNome.trim(), descricao: novaDescricao.trim(), user_id: user?.id })
      .select()
      .single()
    if (data) setPosicionamentos(prev => [data, ...prev])
    setNovoNome('')
    setNovaDescricao('')
    setSalvando(false)
  }

  const handleDeletarPosicionamento = async (id: string) => {
    await supabase.from('posicionamentos').delete().eq('id', id)
    setPosicionamentos(prev => prev.filter(p => p.id !== id))
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    fontSize: '13.5px',
    background: 'rgba(255,255,255,0.04)',
    border: '0.5px solid rgba(255,255,255,0.10)',
    borderRadius: '8px',
    color: 'rgba(255,255,255,0.82)',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
  }

  return (
    <div style={{ padding: isMobile ? '20px 16px' : '32px 36px', background: 'var(--bg-page)', minHeight: '100%' }}>
      <div style={{ maxWidth: '520px', width: '100%' }}>
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 500, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.4px', marginBottom: '4px' }}>
            Configurações
          </h1>
          <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.38)' }}>Preferências do teleprompter e conta</p>
        </div>

        {/* ── Posicionamentos de Comunicação ── */}
        <div style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-subtle)', borderRadius: '12px', padding: '20px', marginBottom: '12px' }}>
          <p style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'rgba(255,255,255,0.35)', marginBottom: '4px' }}>
            Posicionamentos de Comunicação
          </p>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginBottom: '20px', lineHeight: 1.5 }}>
            Defina os contextos de comunicação que serão usados na geração de roteiros.
            Ex: Posicionamento de Vendas, Viralização, Educativo.
          </p>

          {/* Formulário */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            <input
              value={novoNome}
              onChange={e => setNovoNome(e.target.value)}
              placeholder="Nome (ex: Posicionamento de Vendas)"
              style={inputStyle}
            />
            <textarea
              value={novaDescricao}
              onChange={e => setNovaDescricao(e.target.value)}
              placeholder="Descreva o tom, objetivo e características deste posicionamento..."
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
            />
            <button
              onClick={handleSalvarPosicionamento}
              disabled={salvando || !novoNome.trim() || !novaDescricao.trim()}
              style={{
                padding: '10px 16px',
                background: novoNome.trim() && novaDescricao.trim() ? 'rgba(127,119,221,0.2)' : 'rgba(255,255,255,0.04)',
                border: `0.5px solid ${novoNome.trim() && novaDescricao.trim() ? 'rgba(127,119,221,0.35)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 500,
                color: novoNome.trim() && novaDescricao.trim() ? '#a9a3f0' : 'rgba(255,255,255,0.25)',
                cursor: novoNome.trim() && novaDescricao.trim() ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s',
              }}
            >
              {salvando ? 'Salvando...' : '+ Adicionar Posicionamento'}
            </button>
          </div>

          {/* Lista */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {posicionamentos.map(p => (
              <div key={p.id} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '0.5px solid rgba(255,255,255,0.07)',
                borderRadius: '10px', padding: '14px 16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '13.5px', fontWeight: 500, color: 'rgba(255,255,255,0.85)', marginBottom: '4px' }}>
                    {p.nome}
                  </p>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.38)', lineHeight: 1.5 }}>
                    {p.descricao.slice(0, 120)}{p.descricao.length > 120 ? '...' : ''}
                  </p>
                </div>
                <button
                  onClick={() => handleDeletarPosicionamento(p.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)', flexShrink: 0, marginLeft: '12px', padding: '2px' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'rgba(239,68,68,0.6)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {posicionamentos.length === 0 && (
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)', textAlign: 'center', padding: '20px 0' }}>
                Nenhum posicionamento salvo ainda
              </p>
            )}
          </div>
        </div>

        {/* ── Teleprompter ── */}
        <div style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-subtle)', borderRadius: '12px', padding: '20px', marginBottom: '12px' }}>
          <p style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'rgba(255,255,255,0.35)', marginBottom: '20px' }}>
            Teleprompter
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.7)' }}>Velocidade padrão</label>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>{speed}x</span>
              </div>
              <div style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}>
                <Slider min={1} max={5} step={0.5} value={speed} onValueChange={(v) => setSpeed(v as number)} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.7)' }}>Tamanho de fonte padrão</label>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>{fontSize}px</span>
              </div>
              <div style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}>
                <Slider min={24} max={72} step={2} value={fontSize} onValueChange={(v) => setFontSize(v as number)} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Conta ── */}
        <div style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-subtle)', borderRadius: '12px', padding: '20px' }}>
          <p style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'rgba(255,255,255,0.35)', marginBottom: '20px' }}>
            Conta
          </p>
          <div style={{ display: 'flex', alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'space-between', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '16px' : '0' }}>
            <div>
              <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.7)', marginBottom: '3px' }}>Sair da conta</p>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>Você será redirecionado para o login</p>
            </div>
            <button
              onClick={handleSignOut}
              style={{ fontSize: '13px', padding: '7px 16px', background: 'transparent', border: '0.5px solid rgba(255,255,255,0.10)', borderRadius: '8px', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s', width: isMobile ? '100%' : 'auto', minHeight: '44px' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; e.currentTarget.style.color = 'rgba(239,68,68,0.8)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)' }}
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
