import { useState, useEffect } from 'react'
import { Trash2, Camera } from 'lucide-react'
import { useAuthStore } from '@/stores/useAuthStore'
import { supabase } from '@/lib/supabase'
import type { Posicionamento } from '@/types'

type Tab = 'minha-conta' | 'comunicacao'

const menuItems: { id: Tab; label: string }[] = [
  { id: 'minha-conta', label: 'Minha Conta' },
  { id: 'comunicacao', label: 'Comunicação' },
]

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', fontSize: '14px',
  background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)',
  outline: 'none', fontFamily: 'inherit',
}

export function SettingsPage() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<Tab>('minha-conta')

  // Minha Conta
  const [nome, setNome] = useState(user?.user_metadata?.name ?? user?.email?.split('@')[0] ?? '')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  async function handleSaveNome() {
    setSaving(true)
    await supabase.auth.updateUser({ data: { name: nome } })
    setSaving(false)
    setSavedMsg('Salvo!')
    setTimeout(() => setSavedMsg(''), 2000)
  }

  async function handleResetPassword() {
    if (!user?.email) return
    await supabase.auth.resetPasswordForEmail(user.email)
    setSavedMsg('Email enviado!')
    setTimeout(() => setSavedMsg(''), 3000)
  }

  // Comunicação
  const [posicionamentos, setPosicionamentos] = useState<Posicionamento[]>([])
  const [novoNome, setNovoNome] = useState('')
  const [novaDescricao, setNovaDescricao] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    supabase.from('posicionamentos').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setPosicionamentos(data ?? []))
  }, [])

  async function handleSalvarPosicionamento() {
    if (!novoNome.trim() || !novaDescricao.trim()) return
    setSalvando(true)
    const { data: { user: u } } = await supabase.auth.getUser()
    const { data } = await supabase.from('posicionamentos')
      .insert({ nome: novoNome.trim(), descricao: novaDescricao.trim(), user_id: u?.id })
      .select().single()
    if (data) setPosicionamentos(prev => [data, ...prev])
    setNovoNome('')
    setNovaDescricao('')
    setSalvando(false)
  }

  async function handleDeletar(id: string) {
    await supabase.from('posicionamentos').delete().eq('id', id)
    setPosicionamentos(prev => prev.filter(p => p.id !== id))
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'OP'

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', background: 'var(--bg-page)' }}>

      {/* Sub-menu esquerdo */}
      <aside style={{
        width: '200px', flexShrink: 0, borderRight: '1px solid var(--border-subtle)',
        padding: '28px 12px', display: 'flex', flexDirection: 'column', gap: '2px',
      }}>
        <p style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.7px', color: 'var(--text-disabled)', marginBottom: '8px', paddingLeft: '8px' }}>
          Configurações
        </p>
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '7px 10px', borderRadius: 'var(--radius-md)',
              fontSize: '14px', fontWeight: activeTab === item.id ? 500 : 400,
              color: activeTab === item.id ? 'var(--accent-light)' : 'var(--text-muted)',
              background: activeTab === item.id ? 'var(--bg-active)' : 'transparent',
              border: 'none', cursor: 'pointer', transition: 'background 0.1s, color 0.1s',
            }}
            onMouseEnter={e => { if (activeTab !== item.id) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-secondary)' } }}
            onMouseLeave={e => { if (activeTab !== item.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' } }}
          >
            {item.label}
          </button>
        ))}
      </aside>

      {/* Conteúdo */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '28px 36px' }}>

        {activeTab === 'minha-conta' && (
          <div style={{ maxWidth: '480px' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.3px', marginBottom: '4px' }}>Minha Conta</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '28px' }}>Gerencie suas informações pessoais</p>

            {/* Avatar */}
            <section style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.7px', color: 'var(--text-disabled)', marginBottom: '12px' }}>Avatar</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '60px', height: '60px', borderRadius: '50%',
                  background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '22px', fontWeight: 600, color: 'var(--accent-light)',
                }}>
                  {initials}
                </div>
                <button
                  disabled
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', fontSize: '13px', color: 'var(--text-disabled)', cursor: 'not-allowed' }}
                >
                  <Camera size={13} />
                  Alterar foto
                </button>
              </div>
            </section>

            {/* Nome */}
            <section style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.7px', color: 'var(--text-disabled)', marginBottom: '8px' }}>Nome</label>
              <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome" style={inputStyle} />
            </section>

            {/* Email */}
            <section style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.7px', color: 'var(--text-disabled)', marginBottom: '8px' }}>Email</label>
              <input value={user?.email ?? ''} disabled style={{ ...inputStyle, color: 'var(--text-disabled)', cursor: 'not-allowed' }} />
            </section>

            {/* Senha */}
            <section style={{ marginBottom: '28px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.7px', color: 'var(--text-disabled)', marginBottom: '8px' }}>Senha</label>
              <button
                onClick={handleResetPassword}
                style={{ padding: '7px 14px', background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', fontSize: '14px', color: 'var(--text-secondary)', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-muted)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
              >
                Enviar email de redefinição
              </button>
            </section>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={handleSaveNome}
                disabled={saving}
                style={{ padding: '7px 20px', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', borderRadius: 'var(--radius-md)', fontSize: '14px', fontWeight: 500, color: 'var(--accent-light)', cursor: 'pointer' }}
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
              {savedMsg && <span style={{ fontSize: '13px', color: 'var(--green-text)' }}>{savedMsg}</span>}
            </div>
          </div>
        )}

        {activeTab === 'comunicacao' && (
          <div style={{ maxWidth: '560px' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.3px', marginBottom: '4px' }}>Comunicação</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '28px' }}>Posicionamentos usados na geração de roteiros</p>

            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                <input value={novoNome} onChange={e => setNovoNome(e.target.value)} placeholder="Nome (ex: Posicionamento de Vendas)" style={inputStyle} />
                <textarea
                  value={novaDescricao} onChange={e => setNovaDescricao(e.target.value)}
                  placeholder="Descreva o tom, objetivo e características..." rows={4}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                />
                <button
                  onClick={handleSalvarPosicionamento}
                  disabled={salvando || !novoNome.trim() || !novaDescricao.trim()}
                  style={{
                    padding: '8px 16px', borderRadius: 'var(--radius-md)', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                    background: novoNome.trim() && novaDescricao.trim() ? 'var(--accent-bg)' : 'var(--bg-hover)',
                    border: `1px solid ${novoNome.trim() && novaDescricao.trim() ? 'var(--accent-border)' : 'var(--border-subtle)'}`,
                    color: novoNome.trim() && novaDescricao.trim() ? 'var(--accent-light)' : 'var(--text-disabled)',
                  }}
                >
                  {salvando ? 'Salvando...' : '+ Adicionar Posicionamento'}
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {posicionamentos.map(p => (
                  <div key={p.id} style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '3px' }}>{p.nome}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{p.descricao.slice(0, 120)}{p.descricao.length > 120 ? '...' : ''}</p>
                    </div>
                    <button onClick={() => handleDeletar(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-disabled)', flexShrink: 0, marginLeft: '12px' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-disabled)'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {posicionamentos.length === 0 && (
                  <p style={{ fontSize: '13px', color: 'var(--text-disabled)', textAlign: 'center', padding: '16px 0' }}>Nenhum posicionamento salvo</p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
