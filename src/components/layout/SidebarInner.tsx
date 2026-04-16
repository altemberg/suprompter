import { useState } from 'react'
import { Video, MoreHorizontal, User, HelpCircle, LogOut } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/useAuthStore'
import { NAV_ITEMS, BOTTOM_NAV_ITEMS } from './nav-config'

interface SidebarInnerProps {
  onNavigate?: () => void
}

const navButtonStyle = (isActive: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '9px',
  width: '100%',
  padding: '8px 12px',
  marginBottom: '4px',
  height: '36px',
  borderRadius: 'var(--radius-md)',
  border: 'none',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: isActive ? 500 : 400,
  color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
  background: isActive ? 'var(--bg-active)' : 'transparent',
  textAlign: 'left',
  fontFamily: 'var(--font-sans)',
  transition: 'background 0.1s, color 0.1s',
})

export function SidebarInner({ onNavigate }: SidebarInnerProps) {
  const { user, signOut } = useAuthStore()
  const navigate = useNavigate()
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const displayName = user?.user_metadata?.name ?? user?.email?.split('@')[0] ?? 'Usuário'
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'OP'
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined

  function handleNavigate(to: string) {
    navigate(to)
    onNavigate?.()
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login')
    onNavigate?.()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: 'var(--radius-md)',
          background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Video size={18} color="var(--accent-light)" />
        </div>
        <span style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
          Opinify
        </span>
      </div>

      {/* Nav principal */}
      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} style={{ textDecoration: 'none' }}>
            {({ isActive }) => (
              <button
                onClick={() => handleNavigate(item.to)}
                style={navButtonStyle(isActive)}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--bg-hover)'
                    e.currentTarget.style.color = 'var(--text-secondary)'
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--text-muted)'
                  }
                }}
              >
                <item.icon
                  size={15}
                  strokeWidth={1.8}
                  style={{ flexShrink: 0, color: isActive ? 'var(--accent-light)' : 'currentColor' }}
                />
                {item.label}
              </button>
            )}
          </NavLink>
        ))}

        {/* Separador + nav inferior */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '8px', paddingTop: '8px' }}>
          {BOTTOM_NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} style={{ textDecoration: 'none' }}>
              {({ isActive }) => (
                <button
                  onClick={() => handleNavigate(item.to)}
                  style={navButtonStyle(isActive)}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'var(--bg-hover)'
                      e.currentTarget.style.color = 'var(--text-secondary)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = 'var(--text-muted)'
                    }
                  }}
                >
                  <item.icon
                    size={15}
                    strokeWidth={1.8}
                    style={{ flexShrink: 0, color: isActive ? 'var(--accent-light)' : 'currentColor' }}
                  />
                  {item.label}
                </button>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Footer — usuário */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '6px 8px', flexShrink: 0, position: 'relative' }}>
        {userMenuOpen && (
          <>
            <div onClick={() => setUserMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
            <div style={{
              position: 'absolute', bottom: '52px', left: '8px', right: '8px',
              background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)', zIndex: 50, overflow: 'hidden',
            }}>
              <div style={{
                padding: '16px', borderBottom: '1px solid var(--border-subtle)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                background: 'var(--bg-hover)',
              }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '16px', fontWeight: 600, color: 'var(--accent-light)', overflow: 'hidden',
                }}>
                  {avatarUrl
                    ? <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : initials}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>{displayName}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{user?.email}</p>
                </div>
              </div>
              <div style={{ padding: '4px' }}>
                <button
                  onClick={() => { handleNavigate('/configuracoes'); setUserMenuOpen(false) }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '6px 8px', borderRadius: 'var(--radius-md)', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '14px', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}
                >
                  <User size={13} /> Configurações da conta
                </button>
                <button
                  onClick={() => { window.open('mailto:suporte@opinify.com'); setUserMenuOpen(false) }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '6px 8px', borderRadius: 'var(--radius-md)', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '14px', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}
                >
                  <HelpCircle size={13} /> Suporte
                </button>
                <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '4px 0' }} />
                <button
                  onClick={() => { handleSignOut(); setUserMenuOpen(false) }}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', width: '100%', padding: '6px 8px', borderRadius: 'var(--radius-md)', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '13px', color: 'var(--red)', fontFamily: 'var(--font-sans)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--red-hover)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--red)'}
                >
                  Sair <LogOut size={12} />
                </button>
              </div>
            </div>
          </>
        )}
        <div
          onClick={() => setUserMenuOpen(p => !p)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 8px', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'background 0.1s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 600, color: 'var(--accent-light)', flexShrink: 0, overflow: 'hidden' }}>
            {avatarUrl
              ? <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : initials}
          </div>
          <span style={{ flex: 1, fontSize: '14px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</span>
          <MoreHorizontal size={14} style={{ color: 'var(--text-disabled)', flexShrink: 0 }} />
        </div>
      </div>
    </div>
  )
}
