import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTeleprompterStore } from '@/stores/useTeleprompterStore'
import { useIsMobile } from '@/hooks/useIsMobile'
import { Slider } from '@/components/ui/slider'

export function SettingsPage() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const { signOut } = useAuthStore()
  const { speed, fontSize, setSpeed, setFontSize } = useTeleprompterStore()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
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

      {/* Teleprompter */}
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
              <Slider
                min={1}
                max={5}
                step={0.5}
                value={speed}
                onValueChange={(v) => setSpeed(v as number)}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <label style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.7)' }}>Tamanho de fonte padrão</label>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>{fontSize}px</span>
            </div>
            <div style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}>
              <Slider
                min={24}
                max={72}
                step={2}
                value={fontSize}
                onValueChange={(v) => setFontSize(v as number)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Conta */}
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
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; e.currentTarget.style.color = 'rgba(239,68,68,0.8)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
          >
            Sair
          </button>
        </div>
      </div>
    </div>
    </div>
  )
}
