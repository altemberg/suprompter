import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useIsMobile } from '@/hooks/useIsMobile'

type Mode = 'signin' | 'signup'
type State = 'idle' | 'loading' | 'confirm' | 'error'

export function Login() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [state, setState] = useState<State>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (mode === 'signup' && password !== confirmPassword) {
      setError('As senhas não coincidem.')
      setState('error')
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      setState('error')
      return
    }

    setState('loading')

    if (mode === 'signin') {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) {
        setError(translateError(authError.message))
        setState('error')
      } else {
        navigate('/')
      }
    } else {
      const { error: authError } = await supabase.auth.signUp({ email, password })
      if (authError) {
        setError(translateError(authError.message))
        setState('error')
      } else {
        setState('confirm')
      }
    }
  }

  function switchMode(next: Mode) {
    setMode(next)
    setError('')
    setState('idle')
    setPassword('')
    setConfirmPassword('')
  }

  const cardPadding = isMobile ? '24px 20px' : '32px 28px'

  if (state === 'confirm') {
    return (
      <div style={{ ...styles.page }}>
        <div style={{ ...styles.card, padding: cardPadding }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📬</div>
            <h2 style={styles.title}>Confirme seu email</h2>
            <p style={styles.subtitle}>
              Enviamos um link de confirmação para <strong style={{ color: 'rgba(255,255,255,0.75)' }}>{email}</strong>.
              Verifique sua caixa de entrada e clique no link para ativar sua conta.
            </p>
          </div>
          <button onClick={() => switchMode('signin')} style={styles.linkBtn}>
            Já confirmei — fazer login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ ...styles.page }}>
      <div style={{ ...styles.card, padding: cardPadding }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.5px' }}>
            Su<span style={{ color: '#a9a3f0' }}>prompter</span>
          </h1>
          <p style={styles.subtitle}>
            {mode === 'signin' ? 'Entre na sua conta' : 'Crie sua conta gratuitamente'}
          </p>
        </div>

        {/* Mode toggle */}
        <div style={styles.toggle}>
          <button
            onClick={() => switchMode('signin')}
            style={{ ...styles.toggleBtn, ...(mode === 'signin' ? styles.toggleActive : {}) }}
          >
            Entrar
          </button>
          <button
            onClick={() => switchMode('signup')}
            style={{ ...styles.toggleBtn, ...(mode === 'signup' ? styles.toggleActive : {}) }}
          >
            Criar conta
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              disabled={state === 'loading'}
              style={{ ...styles.input, minHeight: '48px', fontSize: '16px' }}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              disabled={state === 'loading'}
              style={{ ...styles.input, minHeight: '48px', fontSize: '16px' }}
            />
          </div>

          {mode === 'signup' && (
            <div style={styles.field}>
              <label style={styles.label}>Confirmar senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha"
                required
                disabled={state === 'loading'}
                style={{ ...styles.input, minHeight: '48px', fontSize: '16px' }}
              />
            </div>
          )}

          {state === 'error' && (
            <p style={{ fontSize: '13px', color: '#f87171', marginTop: '-4px' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={state === 'loading'}
            style={{
              ...styles.submitBtn,
              opacity: state === 'loading' ? 0.6 : 1,
              cursor: state === 'loading' ? 'not-allowed' : 'pointer',
              minHeight: '48px',
            }}
          >
            {state === 'loading'
              ? 'Aguarde...'
              : mode === 'signin'
              ? 'Entrar'
              : 'Criar conta'}
          </button>
        </form>

        {mode === 'signin' && (
          <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>
            Esqueceu a senha?{' '}
            <button onClick={handleForgotPassword} style={styles.linkBtn}>
              Redefinir
            </button>
          </p>
        )}
      </div>
    </div>
  )

  async function handleForgotPassword() {
    if (!email) {
      setError('Digite seu email acima antes de redefinir a senha.')
      setState('error')
      return
    }
    setState('loading')
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    })
    if (authError) {
      setError(translateError(authError.message))
      setState('error')
    } else {
      setError('')
      setState('confirm')
    }
  }
}

function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Email ou senha incorretos.'
  if (msg.includes('Email not confirmed')) return 'Confirme seu email antes de entrar.'
  if (msg.includes('User already registered')) return 'Este email já possui uma conta. Faça login.'
  if (msg.includes('Password should be')) return 'A senha deve ter pelo menos 6 caracteres.'
  if (msg.includes('rate limit')) return 'Muitas tentativas. Aguarde alguns minutos.'
  return msg
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    width: '100%',
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    background: 'var(--bg-page)',
  },
  card: {
    width: '100%',
    maxWidth: '600px',
    background: 'var(--bg-surface)',
    border: '0.5px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    padding: '32px 28px',
  },
  title: {
    fontSize: '18px',
    fontWeight: 500,
    color: 'rgba(255,255,255,0.88)',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '13.5px',
    color: 'rgba(255,255,255,0.38)',
    marginTop: '6px',
    lineHeight: 1.5,
  },
  toggle: {
    display: 'flex',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '8px',
    padding: '3px',
    marginBottom: '24px',
    gap: '2px',
  },
  toggleBtn: {
    flex: 1,
    padding: '7px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 500,
    color: 'rgba(255,255,255,0.4)',
    background: 'transparent',
    transition: 'background 0.15s, color 0.15s',
  },
  toggleActive: {
    background: 'rgba(127,119,221,0.2)',
    color: '#a9a3f0',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '12.5px',
    fontWeight: 500,
    color: 'rgba(255,255,255,0.55)',
  },
  input: {
    background: 'rgba(255,255,255,0.05)',
    border: '0.5px solid rgba(255,255,255,0.10)',
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '14px',
    color: 'rgba(255,255,255,0.85)',
    outline: 'none',
    transition: 'border-color 0.15s',
  },
  submitBtn: {
    marginTop: '4px',
    padding: '11px',
    background: 'rgba(127,119,221,0.25)',
    border: '0.5px solid rgba(127,119,221,0.4)',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#a9a3f0',
    transition: 'background 0.15s',
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    color: '#a9a3f0',
    fontSize: '13px',
    cursor: 'pointer',
    textDecoration: 'underline',
    padding: 0,
  },
}
