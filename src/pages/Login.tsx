import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useIsMobile } from '@/hooks/useIsMobile'
import { Eye, EyeOff, Mail, Globe, Monitor, Code, Briefcase, Layout, MessagesSquare, Video } from 'lucide-react'

type Mode = 'signin' | 'forgot' | 'update'
type State = 'idle' | 'loading' | 'confirm' | 'error' | 'success'

export function Login({ defaultMode = 'signin' }: { defaultMode?: Mode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useIsMobile()
  const [mode, setMode] = useState<Mode>(defaultMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [state, setState] = useState<State>('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    setMode(defaultMode)
    setError('')
    setState('idle')
  }, [defaultMode, location.pathname])

  useEffect(() => {
    const savedEmail = localStorage.getItem('suprompter_saved_email')
    if (savedEmail) {
      setEmail(savedEmail)
      setRememberMe(true)
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (mode === 'update') {
      if (password !== confirmPassword) {
        setError('As senhas não coincidem.')
        return
      }
      if (password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres.')
        return
      }
      setState('loading')
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        setError(translateError(updateError.message))
        setState('error')
      } else {
        setState('success')
        setTimeout(() => navigate('/'), 2000)
      }
      return
    }

    if (mode === 'forgot') {
      if (!email) {
        setError('Digite seu email.')
        return
      }
      setState('loading')
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
      })
      if (authError) {
        setError(translateError(authError.message))
        setState('error')
      } else {
        setState('confirm')
      }
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      setState('error')
      return
    }

    setState('loading')
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError(translateError(authError.message))
      setState('error')
    } else {
      if (rememberMe) {
        localStorage.setItem('suprompter_saved_email', email)
      } else {
        localStorage.removeItem('suprompter_saved_email')
      }
      navigate('/')
    }
  }


  return (
    <div style={styles.page}>
      
      <style>
        {`
          @keyframes orbit {
            from { transform: translate(-50%, -50%) rotate(0deg); }
            to { transform: translate(-50%, -50%) rotate(360deg); }
          }
          @keyframes orbit-reverse {
            from { transform: rotate(0deg); }
            to { transform: rotate(-360deg); }
          }
          .orbit-layer {
            position: absolute;
            top: 50%; left: 50%;
            border-radius: 50%;
            border: 1px dashed var(--border-subtle);
          }
          .orbit-scale {
            width: 560px;
            height: 560px;
            position: relative;
            transform-origin: center;
          }
          @media (max-height: 1000px) {
            .orbit-scale { transform: scale(0.9); }
          }
          @media (max-height: 850px) {
            .orbit-scale { transform: scale(0.8); }
          }
          @media (max-height: 720px) {
            .orbit-scale { transform: scale(0.7); }
          }
          @media (max-height: 600px) {
            .orbit-scale { transform: scale(0.55); }
          }
        `}
      </style>

      {/* Container Principal: Agora ocupando 100% */}
      <div style={{
        display: 'flex',
        width: '100%',
        minHeight: '100dvh',
        background: 'var(--bg-page)',
        overflow: 'hidden',
      }}>
        
        {/* Lado Esquerdo: Formulário */}
        <div style={{
          flex: '1 1 50%',
          width: isMobile ? '100%' : '50%',
          padding: isMobile ? '40px 24px' : '64px 12%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          
          {state === 'confirm' ? (
            <div style={{ textAlign: 'center', maxWidth: '400px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '24px' }}>📬</div>
              <h2 style={{ fontSize: '28px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px', letterSpacing: '-0.5px' }}>
                Email enviado
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginBottom: '32px', lineHeight: 1.6 }}>
                Enviamos as instruções para <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>.<br />
                Verifique sua caixa de entrada.
              </p>
              <Link to="/login" style={{ ...styles.submitBtn, display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', padding: '14px 0' }}>
                Voltar para o login
              </Link>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Video size={24} color="var(--accent-light)" />
                </div>
              </div>

              {state === 'success' ? (
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '24px' }}>✅</div>
                  <h1 style={{ fontSize: '28px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.5px' }}>
                    Senha atualizada!
                  </h1>
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                    Sua nova senha foi salva com sucesso. Entrando na sua conta...
                  </p>
                </div>
              ) : (
                <>
                  <h1 style={{ fontSize: '28px', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'center', marginBottom: '8px', letterSpacing: '-0.5px' }}>
                    {mode === 'signin' ? 'Entre na sua conta!' : mode === 'update' ? 'Criar nova senha' : 'Recuperar senha'}
                  </h1>
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', marginBottom: '40px' }}>
                    {mode === 'signin' 
                      ? 'Digite seu email registrado e senha para entrar.' 
                      : mode === 'update'
                      ? 'Digite sua nova senha abaixo.'
                      : 'Digite seu email abaixo e enviaremos um link de recuperação.'}
                  </p>
                </>
              )}

              {state !== 'success' && <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '400px', width: '100%', margin: '0 auto' }}>
                
                {mode !== 'update' && (
                  <div style={styles.field}>
                    <label style={styles.label}>Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ex: seu@email.com"
                      required
                      disabled={state === 'loading'}
                      style={styles.input}
                    />
                  </div>
                )}

                {(mode === 'signin' || mode === 'update') && (
                  <div style={styles.field}>
                    <label style={styles.label}>{mode === 'update' ? 'Nova Senha' : 'Senha'}</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={mode === 'update' ? 'Mínimo 6 caracteres' : 'Sua senha'}
                        required
                        disabled={state === 'loading'}
                        style={{ ...styles.input, paddingRight: '40px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0,
                        }}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                )}

                {mode === 'update' && (
                  <div style={styles.field}>
                    <label style={styles.label}>Confirmar Nova Senha</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repita a nova senha"
                        required
                        disabled={state === 'loading'}
                        style={{ ...styles.input, paddingRight: '40px' }}
                      />
                    </div>
                  </div>
                )}

                {mode === 'signin' && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '-4px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} style={{ cursor: 'pointer', accentColor: 'var(--accent)' }} />
                      Lembrar-me
                    </label>
                    <Link to="/forgot-password" style={styles.linkBtn}>
                      Esqueci a senha?
                    </Link>
                  </div>
                )}

                {state === 'error' && (
                  <p style={{ fontSize: '13px', color: '#f87171', background: 'rgba(248, 113, 113, 0.1)', padding: '8px 12px', borderRadius: '6px' }}>{error}</p>
                )}

                <button
                  type="submit"
                  disabled={state === 'loading'}
                  style={{
                    ...styles.submitBtn,
                    opacity: state === 'loading' ? 0.6 : 1,
                    cursor: state === 'loading' ? 'not-allowed' : 'pointer',
                  }}
                >
                  {state === 'loading' ? 'Aguarde...' : mode === 'signin' ? 'Entrar' : mode === 'update' ? 'Salvar nova senha' : 'Recuperar minha senha'}
                </button>
                
                {(mode === 'forgot' || mode === 'update') && (
                  <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <Link to="/login" style={{ ...styles.linkBtn, color: 'var(--text-muted)' }}>
                      ← Voltar para o login
                    </Link>
                  </div>
                )}
              </form>}
            </>
          )}
        </div>

        {/* Lado Direito: Gráfico Animado (Omitido no mobile) */}
        {!isMobile && (
          <div style={{
            flex: '1 1 50%',
            width: '50%',
            background: 'var(--bg-surface)',
            borderLeft: '1px solid var(--border-subtle)',
            padding: '64px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
          }}>
            
            {/* Glow de fundo */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: '80%', height: '80%', background: 'radial-gradient(circle, rgba(133, 59, 206, 0.15) 0%, rgba(0,0,0,0) 70%)',
              pointerEvents: 'none',
            }} />

            <h2 style={{ fontSize: '26px', fontWeight: 600, color: 'var(--text-primary)', zIndex: 1, textAlign: 'center' }}>
              O Mundo Acontece. <span style={{ color: 'var(--accent)' }}>Você Opina.</span>
            </h2>

            {/* Container Principal dos Círculos Orbitais */}
            <div style={{
              position: 'relative',
              width: '100%', flex: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1,
              overflow: 'hidden',
            }}>
              <div className="orbit-scale">

              {/* Círculo 3: Externo (4 Ícones) - Rotation 40s */}
              <OrbitLayer radius={520} duration={45}>
                <OrbitIcon icon={<Globe />} angle={0} distance={260} duration={45} />
                <OrbitIcon icon={<Monitor />} angle={90} distance={260} duration={45} />
                <OrbitIcon icon={<Layout />} angle={180} distance={260} duration={45} />
                <OrbitIcon icon={<Globe />} angle={270} distance={260} duration={45} />
              </OrbitLayer>

              {/* Círculo 2: Médio (2 Ícones) - Rotation 30s Reverse */}
              <OrbitLayer radius={360} duration={35} reverse>
                <OrbitIcon icon={<Mail />} angle={45} distance={180} duration={35} reverse />
                <OrbitIcon icon={<Briefcase />} angle={225} distance={180} duration={35} reverse />
              </OrbitLayer>

              {/* Círculo 1: Interno (2 Ícones) - Rotation 20s */}
              <OrbitLayer radius={200} duration={25}>
                <OrbitIcon icon={<Code />} angle={135} distance={100} duration={25} />
                <OrbitIcon icon={<MessagesSquare />} angle={315} distance={100} duration={25} />
              </OrbitLayer>

              {/* Centro Estático */}
              <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: '100px', height: '100px', borderRadius: '50%',
                background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 40px rgba(133, 59, 206, 0.4)', zIndex: 10
              }}>
                <Video size={48} color="var(--accent-light)" />
              </div>
              </div>
            </div>

            <p style={{
              fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '360px',
              lineHeight: 1.6, zIndex: 1,
            }}>
              Crie conteúdos relevantes a partir de acontecimentos reais com a sua voz e perspectiva.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}

function OrbitLayer({ radius, duration, reverse = false, children }: { radius: number, duration: number, reverse?: boolean, children: React.ReactNode }) {
  const dir = reverse ? 'reverse' : 'normal'
  return (
    <div className="orbit-layer" style={{ 
      width: radius, height: radius, 
      animation: `orbit ${duration}s linear infinite ${dir}` 
    }}>
      {children}
    </div>
  )
}

function OrbitIcon({ icon, angle, distance, duration, reverse = false }: { icon: React.ReactNode, angle: number, distance: number, duration: number, reverse?: boolean }) {
  const radian = (angle * Math.PI) / 180
  const x = Math.cos(radian) * distance
  const y = Math.sin(radian) * distance
  const dir = reverse ? 'reverse' : 'normal'

  return (
    <div style={{
      position: 'absolute',
      left: `calc(50% + ${x}px - 28px)`,
      top: `calc(50% + ${y}px - 28px)`,
    }}>
      <div style={{ animation: `orbit-reverse ${duration}s linear infinite ${dir}` }}>
        <div style={{
          width: '56px', height: '56px',
          borderRadius: '50%', background: 'var(--bg-page)', border: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-secondary)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        }}>
          <div style={{ transform: 'scale(1.2)' }}>{icon}</div>
        </div>
      </div>
    </div>
  )
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
    background: 'var(--bg-page)',
  },
  card: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '16px',
    padding: '32px',
  },
  title: {
    fontSize: '20px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--text-muted)',
    lineHeight: 1.5,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
  },
  input: {
    width: '100%',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '10px',
    padding: '12px 14px',
    fontSize: '15px',
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'border-color 0.15s',
  },
  submitBtn: {
    marginTop: '8px',
    padding: '14px',
    background: 'var(--btn-primary)',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--btn-primary-text)',
    transition: 'background 0.15s, opacity 0.15s',
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--accent)',
    fontSize: '13px',
    cursor: 'pointer',
    padding: 0,
    fontWeight: 500,
    textDecoration: 'none',
  },
}
