import { useState, useEffect, useRef } from 'react'
import { Trash2, Camera, User, MessageSquare, Puzzle } from 'lucide-react'
import { useAuthStore } from '@/stores/useAuthStore'
import { supabase } from '@/lib/supabase'
import type { Posicionamento } from '@/types'

type Tab = 'conta' | 'comunicacao' | 'integracoes'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '7px 10px',
  fontSize: '13px',
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-secondary)',
  fontFamily: 'var(--font-sans)',
  outline: 'none',
  transition: 'border-color 0.15s',
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: '11px', fontWeight: 500,
      color: 'var(--text-disabled)',
      textTransform: 'uppercase', letterSpacing: '0.7px',
      marginBottom: '6px',
    }}>
      {children}
    </p>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  )
}

export function SettingsPage() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<Tab>('conta')

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'conta', label: 'Minha Conta', icon: <User size={16} /> },
    { id: 'comunicacao', label: 'Comunicação', icon: <MessageSquare size={16} /> },
    { id: 'integracoes', label: 'Integrações', icon: <Puzzle size={16} /> },
  ]

  return (
    <div style={{ display: 'flex', justifyContent: 'center', height: '100%', background: 'var(--bg-page)', width: '100%' }}>
      <div style={{ display: 'flex', width: '80%', maxWidth: '1200px', height: '100%' }}>
      {/* Menu Lateral */}
      <div style={{
        width: '200px',
        marginRight: '50px',
        padding: '64px 0',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <h1 style={{
          fontSize: '20px', fontWeight: 500,
          color: 'var(--text-secondary)', letterSpacing: '-0.3px',
          marginBottom: '24px', paddingLeft: '12px'
        }}>
          Configurações
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {tabs.map(tab => {
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 12px',
                  fontSize: '14px',
                  fontWeight: active ? 'bold' : 400,
                  color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                  background: active ? '#ffffff0f' : 'transparent',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.color = 'var(--text-secondary)'
                    e.currentTarget.style.background = 'var(--bg-hover)'
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.color = 'var(--text-muted)'
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                <span style={{ 
                  color: 'var(--accent)',
                  display: 'flex', alignItems: 'center' 
                }}>
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div style={{ flex: 1, padding: '64px 48px', overflowY: 'auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{
            fontSize: '24px', fontWeight: 500,
            color: 'var(--text-primary)', letterSpacing: '-0.5px',
            marginBottom: '16px',
          }}>
            {tabs.find(t => t.id === activeTab)?.label}
          </h2>
          <hr style={{ border: 'none', borderBottom: '1px solid var(--border-subtle)' }} />
        </div>

        {activeTab === 'conta' && <TabConta user={user} />}
        {activeTab === 'comunicacao' && <TabComunicacao />}
        {activeTab === 'integracoes' && <TabIntegracoes />}
      </div>
      </div>
    </div>
  )
}

/* ── Aba: Minha Conta ── */
function TabConta({ user }: { user: any }) {
  const [nome, setNome] = useState(user?.user_metadata?.name ?? user?.email?.split('@')[0] ?? '')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.user_metadata?.avatar_url ?? null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarErr, setAvatarErr] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
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

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return

    if (!file.type.startsWith('image/')) {
      setAvatarErr('Selecione uma imagem.')
      setTimeout(() => setAvatarErr(''), 3000)
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarErr('Imagem deve ter menos de 2MB.')
      setTimeout(() => setAvatarErr(''), 3000)
      return
    }

    setUploadingAvatar(true)
    setAvatarErr('')
    const ext = file.name.split('.').pop() || 'png'
    const path = `${user.id}/avatar-${Date.now()}.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, cacheControl: '3600' })

    if (uploadErr) {
      setAvatarErr(`Erro no upload: ${uploadErr.message}`)
      setUploadingAvatar(false)
      return
    }

    const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(path)
    const newUrl = publicData.publicUrl

    const { error: updateErr } = await supabase.auth.updateUser({
      data: { avatar_url: newUrl },
    })

    if (updateErr) {
      setAvatarErr(`Erro ao salvar: ${updateErr.message}`)
    } else {
      setAvatarUrl(newUrl)
    }
    setUploadingAvatar(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'OP'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>

      {/* Avatar */}
      <div>
        <Label>Avatar</Label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '50%',
            background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', fontWeight: 600, color: 'var(--accent-light)',
            flexShrink: 0, overflow: 'hidden',
          }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : initials}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', fontSize: '12px',
              background: 'transparent',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: uploadingAvatar ? 'var(--text-disabled)' : 'var(--text-secondary)',
              cursor: uploadingAvatar ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-sans)',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => { if (!uploadingAvatar) e.currentTarget.style.borderColor = 'var(--border-muted)' }}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
          >
            <Camera size={12} />
            {uploadingAvatar ? 'Enviando...' : 'Alterar foto'}
          </button>

          {avatarErr && (
            <span style={{ fontSize: '12px', color: 'var(--red)' }}>{avatarErr}</span>
          )}
        </div>
      </div>

      {/* Nome */}
      <Field label="Nome">
        <input
          type="text"
          value={nome}
          onChange={e => setNome(e.target.value)}
          placeholder="Seu nome"
          style={inputStyle}
          onFocus={e => e.currentTarget.style.borderColor = 'var(--border-muted)'}
          onBlur={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
        />
      </Field>

      {/* Email */}
      <Field label="Email">
        <input
          type="email"
          value={user?.email ?? ''}
          disabled
          style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }}
        />
      </Field>

      {/* Senha */}
      <Field label="Senha">
        <button
          onClick={handleResetPassword}
          style={{
            padding: '7px 14px', fontSize: '13px',
            background: 'transparent',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-muted)', cursor: 'pointer',
            fontFamily: 'var(--font-sans)', textAlign: 'left',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--border-muted)'
            e.currentTarget.style.color = 'var(--text-secondary)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)'
            e.currentTarget.style.color = 'var(--text-muted)'
          }}
        >
          Enviar email de redefinição
        </button>
      </Field>

      {/* Salvar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={handleSaveNome}
          disabled={saving}
          style={{
            padding: '7px 20px', fontSize: '13px', fontWeight: 500,
            background: 'var(--btn-primary)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            color: 'var(--btn-primary-text)', cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.6 : 1,
            fontFamily: 'var(--font-sans)', transition: 'background 0.15s',
          }}
          onMouseEnter={e => { if (!saving) e.currentTarget.style.background = 'var(--btn-primary-hover)' }}
          onMouseLeave={e => { if (!saving) e.currentTarget.style.background = 'var(--btn-primary)' }}
        >
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
        {savedMsg && (
          <span style={{ fontSize: '13px', color: 'var(--teal-light)' }}>{savedMsg}</span>
        )}
      </div>
    </div>
  )
}

/* ── Aba: Comunicação ── */
function TabComunicacao() {
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

  const canSave = novoNome.trim() && novaDescricao.trim()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      <div>
        <p style={{ fontSize: '16px', color: 'var(--text-muted)', marginBottom: '20px' }}>
          Posicionamentos usados na geração de roteiros
        </p>

        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          marginBottom: '16px',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            <input
              value={novoNome}
              onChange={e => setNovoNome(e.target.value)}
              placeholder="Nome (ex: Posicionamento de Vendas)"
              style={inputStyle}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--border-muted)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
            />
            <textarea
              value={novaDescricao}
              onChange={e => setNovaDescricao(e.target.value)}
              placeholder="Descreva o tom, objetivo e características..."
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--border-muted)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
            />
            <button
              onClick={handleSalvarPosicionamento}
              disabled={salvando || !canSave}
              style={{
                padding: '8px 16px', fontSize: '13px', fontWeight: 500,
                borderRadius: 'var(--radius-md)', cursor: canSave ? 'pointer' : 'not-allowed',
                background: canSave ? 'var(--btn-primary)' : 'transparent',
                border: canSave ? 'none' : '1px solid var(--border-subtle)',
                color: canSave ? 'var(--btn-primary-text)' : 'var(--text-disabled)',
                fontFamily: 'var(--font-sans)', transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (canSave) e.currentTarget.style.background = 'var(--btn-primary-hover)' }}
              onMouseLeave={e => { if (canSave) e.currentTarget.style.background = 'var(--btn-primary)' }}
            >
              {salvando ? 'Salvando...' : '+ Adicionar Posicionamento'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {posicionamentos.map(p => (
              <div
                key={p.id}
                style={{
                  background: 'var(--bg-hover)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '3px' }}>
                    {p.nome}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {p.descricao.slice(0, 120)}{p.descricao.length > 120 ? '...' : ''}
                  </p>
                </div>
                <button
                  onClick={() => handleDeletar(p.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-disabled)', flexShrink: 0, marginLeft: '12px' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-disabled)'}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {posicionamentos.length === 0 && (
              <p style={{ fontSize: '13px', color: 'var(--text-disabled)', textAlign: 'center', padding: '16px 0' }}>
                Nenhum posicionamento salvo
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Aba: Integrações ── */
function TabIntegracoes() {
  const [openAiKey, setOpenAiKey] = useState('')
  const [claudeKey, setClaudeKey] = useState('')
  const [openRouterKey, setOpenRouterKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  const isOpenAiDisabled = !!claudeKey || !!openRouterKey
  const isClaudeDisabled = !!openAiKey || !!openRouterKey
  const isOpenRouterDisabled = !!openAiKey || !!claudeKey

  async function handleSave() {
    setSaving(true)
    // Placeholder para salvamento futuro no banco
    await new Promise(r => setTimeout(r, 600))
    setSaving(false)
    setSavedMsg('Salvo!')
    setTimeout(() => setSavedMsg(''), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
        Conecte sua conta a um provedor de Inteligência Artificial. Apenas uma integração pode estar ativa por vez.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <Field label="OpenAI API Key">
          <input
            type="password"
            value={openAiKey}
            onChange={e => setOpenAiKey(e.target.value)}
            disabled={isOpenAiDisabled}
            placeholder={isOpenAiDisabled ? "Indisponível (outra API já configurada)" : "sk-... "}
            style={{ 
              ...inputStyle, 
              opacity: isOpenAiDisabled ? 0.5 : 1,
              cursor: isOpenAiDisabled ? 'not-allowed' : 'text'
            }}
            onFocus={e => !isOpenAiDisabled && (e.currentTarget.style.borderColor = 'var(--border-muted)')}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
          />
        </Field>

        <Field label="Claude API Key">
          <input
            type="password"
            value={claudeKey}
            onChange={e => setClaudeKey(e.target.value)}
            disabled={isClaudeDisabled}
            placeholder={isClaudeDisabled ? "Indisponível (outra API já configurada)" : "sk-ant-... "}
            style={{ 
              ...inputStyle, 
              opacity: isClaudeDisabled ? 0.5 : 1,
              cursor: isClaudeDisabled ? 'not-allowed' : 'text'
            }}
            onFocus={e => !isClaudeDisabled && (e.currentTarget.style.borderColor = 'var(--border-muted)')}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
          />
        </Field>

        <Field label="OpenRouter API Key">
          <input
            type="password"
            value={openRouterKey}
            onChange={e => setOpenRouterKey(e.target.value)}
            disabled={isOpenRouterDisabled}
            placeholder={isOpenRouterDisabled ? "Indisponível (outra API já configurada)" : "sk-or-v1-... "}
            style={{ 
              ...inputStyle, 
              opacity: isOpenRouterDisabled ? 0.5 : 1,
              cursor: isOpenRouterDisabled ? 'not-allowed' : 'text'
            }}
            onFocus={e => !isOpenRouterDisabled && (e.currentTarget.style.borderColor = 'var(--border-muted)')}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
          />
        </Field>

        {/* Salvar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '7px 20px', fontSize: '13px', fontWeight: 500,
              background: 'var(--btn-primary)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              color: 'var(--btn-primary-text)', cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
              fontFamily: 'var(--font-sans)', transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.background = 'var(--btn-primary-hover)' }}
            onMouseLeave={e => { if (!saving) e.currentTarget.style.background = 'var(--btn-primary)' }}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          {savedMsg && (
            <span style={{ fontSize: '13px', color: 'var(--teal-light)' }}>{savedMsg}</span>
          )}
        </div>
      </div>
    </div>
  )
}
