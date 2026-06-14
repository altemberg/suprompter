import { useState, useEffect } from 'react'
import { Plus, X, KeyRound, Power, Eye, EyeOff, ShieldCheck, Lock, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import {
  isAdmin,
  adminListUsers,
  adminCreateUser,
  adminSetStatus,
  adminSetApiKey,
  DEFAULT_PASSWORD,
  type AdminUser,
} from '@/lib/admin'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 11px',
  fontSize: '13px',
  background: 'var(--bg-page)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-secondary)',
  fontFamily: 'var(--font-sans)',
  outline: 'none',
  transition: 'border-color 0.15s',
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: 500,
  color: 'var(--text-disabled)',
  textTransform: 'uppercase', letterSpacing: '0.7px',
  marginBottom: '6px',
}

function primaryBtn(disabled?: boolean): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center',
    padding: '8px 16px', fontSize: '13px', fontWeight: 500,
    background: 'var(--btn-primary)', border: 'none',
    borderRadius: 'var(--radius-md)', color: 'var(--btn-primary-text)',
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1,
    fontFamily: 'var(--font-sans)', transition: 'background 0.15s',
  }
}

const ghostBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '6px',
  padding: '6px 10px', fontSize: '12px',
  background: 'transparent', border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)',
  cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'border-color 0.15s',
}

/* ──────────────────────────────────────────────────────────────
   Gate: decide entre tela de login dedicada e o painel.
   Rota /superadmin é isolada — sem sidebar/layout de usuário comum.
   ────────────────────────────────────────────────────────────── */
export function AdminPage() {
  const { user, loading } = useAuthStore()
  const signOut = useAuthStore(s => s.signOut)

  if (loading) {
    return (
      <FullScreen>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Carregando...</p>
      </FullScreen>
    )
  }

  if (!isAdmin(user)) {
    return <SuperadminLogin loggedAsOther={!!user} onSignOut={signOut} />
  }

  return <AdminPanel onSignOut={signOut} />
}

function FullScreen({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100dvh', width: '100%',
      background: 'var(--bg-page)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      {children}
    </div>
  )
}

/* ── Tela de login dedicada do superadmin ── */
function SuperadminLogin({ loggedAsOther, onSignOut }: { loggedAsOther: boolean; onSignOut: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState('')

  const canSubmit = email.trim() && password && !submitting

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setErr('')
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (error) {
      setErr('Email ou senha inválidos.')
      setSubmitting(false)
      return
    }
    if (!isAdmin(data.user)) {
      setErr('Esta conta não tem permissão de superadmin.')
      await supabase.auth.signOut()
      setSubmitting(false)
      return
    }
    // Sucesso: o onAuthStateChange atualiza o store e o gate renderiza o painel.
  }

  return (
    <FullScreen>
      <div style={{ width: '100%', maxWidth: '360px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px',
          }}>
            <Lock size={20} style={{ color: 'var(--accent-light)' }} />
          </div>
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            Painel Superadmin
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px', textAlign: 'center' }}>
            Acesso restrito. Entre com as credenciais de administrador.
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <p style={labelStyle}>Email</p>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@exemplo.com"
              autoFocus
              style={inputStyle}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--border-muted)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
            />
          </div>
          <div>
            <p style={labelStyle}>Senha</p>
            <div style={{ position: 'relative' }}>
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ ...inputStyle, paddingRight: '38px' }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--border-muted)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
              />
              <button
                type="button"
                onClick={() => setShowPwd(p => !p)}
                style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-disabled)', display: 'flex' }}
              >
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {err && <p style={{ fontSize: '12px', color: 'var(--red)' }}>{err}</p>}

          <button
            type="submit"
            disabled={!canSubmit}
            style={{ ...primaryBtn(!canSubmit), padding: '10px 16px', marginTop: '4px' }}
            onMouseEnter={e => { if (canSubmit) e.currentTarget.style.background = 'var(--btn-primary-hover)' }}
            onMouseLeave={e => { if (canSubmit) e.currentTarget.style.background = 'var(--btn-primary)' }}
          >
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {loggedAsOther && (
          <p style={{ fontSize: '12px', color: 'var(--text-disabled)', textAlign: 'center', marginTop: '18px' }}>
            Você está logado em outra conta.{' '}
            <button
              onClick={onSignOut}
              style={{ background: 'none', border: 'none', padding: 0, color: 'var(--accent-light)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px' }}
            >
              Sair dela
            </button>
          </p>
        )}
      </div>
    </FullScreen>
  )
}

/* ──────────────────────────────────────────────────────────────
   Painel de superadmin (só renderiza quando autenticado como admin)
   ────────────────────────────────────────────────────────────── */
function AdminPanel({ onSignOut }: { onSignOut: () => void }) {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [keyTarget, setKeyTarget] = useState<AdminUser | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function reload() {
    setLoading(true)
    setError('')
    try {
      setUsers(await adminListUsers())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar usuários.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { reload() }, [])

  async function handleToggle(u: AdminUser) {
    setBusyId(u.id)
    try {
      await adminSetStatus(u.id, !u.disabled)
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, disabled: !u.disabled } : x))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao alterar status.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-page)', display: 'flex', justifyContent: 'center', width: '100%', overflowY: 'auto' }}>
      <div style={{ width: '88%', maxWidth: '1100px', padding: '40px 0 80px' }}>

        {/* Cabeçalho */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div>
            <h1 style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              fontSize: '24px', fontWeight: 500,
              color: 'var(--text-primary)', letterSpacing: '-0.5px',
            }}>
              <ShieldCheck size={22} style={{ color: 'var(--accent-light)' }} />
              Painel Superadmin
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '6px' }}>
              Gerencie os membros da plataforma, status de acesso e API keys.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onSignOut}
              style={ghostBtn}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-muted)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
            >
              <LogOut size={13} /> Sair
            </button>
            <button
              onClick={() => setCreateOpen(true)}
              style={primaryBtn()}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--btn-primary-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--btn-primary)'}
            >
              <Plus size={15} /> Adicionar membro
            </button>
          </div>
        </div>

        <hr style={{ border: 'none', borderBottom: '1px solid var(--border-subtle)', margin: '24px 0' }} />

        {error && (
          <div style={{
            padding: '10px 14px', marginBottom: '16px', fontSize: '13px',
            background: 'var(--accent-bg)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)', color: 'var(--red)',
          }}>
            {error}
          </div>
        )}

        {/* Tabela */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}>
          {/* Header da tabela */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1.4fr 1.6fr 0.9fr 1fr 1.4fr',
            padding: '12px 18px', borderBottom: '1px solid var(--border-subtle)',
            fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px',
            color: 'var(--text-disabled)', textTransform: 'uppercase',
          }}>
            <span>Nome</span>
            <span>Email</span>
            <span>Status</span>
            <span>API Key</span>
            <span style={{ textAlign: 'right' }}>Ações</span>
          </div>

          {loading && (
            <div style={{ padding: '32px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
              Carregando...
            </div>
          )}

          {!loading && users.length === 0 && (
            <div style={{ padding: '32px', textAlign: 'center', fontSize: '13px', color: 'var(--text-disabled)' }}>
              Nenhum membro cadastrado ainda.
            </div>
          )}

          {!loading && users.map(u => (
            <div key={u.id} style={{
              display: 'grid', gridTemplateColumns: '1.4fr 1.6fr 0.9fr 1fr 1.4fr',
              alignItems: 'center', padding: '14px 18px',
              borderBottom: '1px solid var(--border-subtle)',
              fontSize: '13px', color: 'var(--text-secondary)',
            }}>
              <span style={{ fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>
                {u.name || '—'}
              </span>
              <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>
                {u.email}
              </span>
              <span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '3px 9px', fontSize: '11px', fontWeight: 500,
                  borderRadius: '99px',
                  background: u.disabled ? 'var(--bg-hover)' : 'var(--accent-bg)',
                  color: u.disabled ? 'var(--text-disabled)' : 'var(--accent-light)',
                  border: `1px solid ${u.disabled ? 'var(--border-subtle)' : 'var(--accent-border)'}`,
                }}>
                  <span style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: u.disabled ? 'var(--text-disabled)' : 'var(--teal-light)',
                  }} />
                  {u.disabled ? 'Desabilitado' : 'Ativo'}
                </span>
              </span>
              <span style={{ fontSize: '12px', color: u.api_key ? 'var(--teal-light)' : 'var(--text-disabled)' }}>
                {u.api_key ? 'Configurada' : 'Não definida'}
              </span>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setKeyTarget(u)}
                  style={ghostBtn}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-muted)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                >
                  <KeyRound size={13} /> API Key
                </button>
                <button
                  onClick={() => handleToggle(u)}
                  disabled={busyId === u.id}
                  style={{
                    ...ghostBtn,
                    color: u.disabled ? 'var(--teal-light)' : 'var(--red)',
                    opacity: busyId === u.id ? 0.5 : 1,
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-muted)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                >
                  <Power size={13} /> {u.disabled ? 'Habilitar' : 'Desabilitar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {createOpen && (
        <CreateMemberModal
          onClose={() => setCreateOpen(false)}
          onCreated={() => { setCreateOpen(false); reload() }}
        />
      )}

      {keyTarget && (
        <ApiKeyModal
          user={keyTarget}
          onClose={() => setKeyTarget(null)}
          onSaved={(key) => {
            setUsers(prev => prev.map(x => x.id === keyTarget.id ? { ...x, api_key: key || null } : x))
            setKeyTarget(null)
          }}
        />
      )}
    </div>
  )
}

/* ── Modal: Adicionar membro ── */
function CreateMemberModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState(DEFAULT_PASSWORD)
  const [showPwd, setShowPwd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const canSave = email.trim() && password.length >= 6 && !saving

  async function handleSubmit() {
    if (!canSave) return
    setSaving(true)
    setErr('')
    try {
      await adminCreateUser({ name: name.trim(), email: email.trim(), password })
      onCreated()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro ao criar membro.')
      setSaving(false)
    }
  }

  return (
    <ModalShell title="Adicionar membro" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <p style={labelStyle}>Nome</p>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nome do membro"
            style={inputStyle}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--border-muted)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
          />
        </div>
        <div>
          <p style={labelStyle}>Email</p>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="email@exemplo.com"
            style={inputStyle}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--border-muted)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
          />
        </div>
        <div>
          <p style={labelStyle}>Senha</p>
          <div style={{ position: 'relative' }}>
            <input
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ ...inputStyle, paddingRight: '38px' }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--border-muted)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
            />
            <button
              type="button"
              onClick={() => setShowPwd(p => !p)}
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-disabled)', display: 'flex' }}
            >
              {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-disabled)', marginTop: '5px' }}>
            Padrão: <code>{DEFAULT_PASSWORD}</code> — o membro pode alterar depois.
          </p>
        </div>

        {err && <p style={{ fontSize: '12px', color: 'var(--red)' }}>{err}</p>}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
          <button onClick={onClose} style={ghostBtn}>Cancelar</button>
          <button
            onClick={handleSubmit}
            disabled={!canSave}
            style={primaryBtn(!canSave)}
            onMouseEnter={e => { if (canSave) e.currentTarget.style.background = 'var(--btn-primary-hover)' }}
            onMouseLeave={e => { if (canSave) e.currentTarget.style.background = 'var(--btn-primary)' }}
          >
            {saving ? 'Criando...' : 'Criar membro'}
          </button>
        </div>
      </div>
    </ModalShell>
  )
}

/* ── Modal: API Key ── */
function ApiKeyModal({ user, onClose, onSaved }: { user: AdminUser; onClose: () => void; onSaved: (key: string) => void }) {
  const [key, setKey] = useState(user.api_key ?? '')
  const [showKey, setShowKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  async function handleSave() {
    setSaving(true)
    setErr('')
    try {
      await adminSetApiKey(user.id, key.trim())
      onSaved(key.trim())
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro ao salvar API key.')
      setSaving(false)
    }
  }

  return (
    <ModalShell title="API Key do membro" onClose={onClose}>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
        Chave usada por <strong style={{ color: 'var(--text-secondary)' }}>{user.email}</strong> para gerar roteiros e transcrever (OpenRouter).
      </p>
      <p style={labelStyle}>OpenRouter API Key</p>
      <div style={{ position: 'relative' }}>
        <input
          type={showKey ? 'text' : 'password'}
          value={key}
          onChange={e => setKey(e.target.value)}
          placeholder="sk-or-v1-..."
          style={{ ...inputStyle, paddingRight: '38px' }}
          onFocus={e => e.currentTarget.style.borderColor = 'var(--border-muted)'}
          onBlur={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
        />
        <button
          type="button"
          onClick={() => setShowKey(p => !p)}
          style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-disabled)', display: 'flex' }}
        >
          {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>

      {err && <p style={{ fontSize: '12px', color: 'var(--red)', marginTop: '10px' }}>{err}</p>}

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
        <button onClick={onClose} style={ghostBtn}>Cancelar</button>
        <button
          onClick={handleSave}
          disabled={saving}
          style={primaryBtn(saving)}
          onMouseEnter={e => { if (!saving) e.currentTarget.style.background = 'var(--btn-primary-hover)' }}
          onMouseLeave={e => { if (!saving) e.currentTarget.style.background = 'var(--btn-primary)' }}
        >
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </ModalShell>
  )
}

/* ── Wrapper de modal ── */
function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '24px', width: '100%', maxWidth: '440px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-disabled)', display: 'flex' }}>
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
