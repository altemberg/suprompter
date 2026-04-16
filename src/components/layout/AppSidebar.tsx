import { useState } from 'react'
import { Home, FileText, Video, Mic, Settings, MoreHorizontal, User, HelpCircle, LogOut } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useAuthStore } from '@/stores/useAuthStore'


interface AppSidebarProps {
  onNavigate?: () => void
}

const navItems = [
  { label: 'Início', icon: Home, to: '/' },
  { label: 'Roteiros', icon: FileText, to: '/roteiros' },
  { label: 'Teleprompter', icon: Video, to: '/teleprompter' },
  { label: 'Transcritor', icon: Mic, to: '/transcritor' },
  { label: 'Gravações', icon: Video, to: '/gravacoes' },
]

const bottomNavItems = [
  { label: 'Configurações', icon: Settings, to: '/configuracoes' },
]

function MenuItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '6px 8px', borderRadius: 'var(--radius-md)',
        fontSize: '14px', color: 'var(--text-muted)', cursor: 'pointer',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
    >
      {icon}{label}
    </div>
  )
}

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const { user, signOut } = useAuthStore()
  const navigate = useNavigate()

  const [userMenuOpen, setUserMenuOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  function handleNavigate(to: string) {
    navigate(to)
    onNavigate?.()
  }

  const displayName = user?.user_metadata?.name ?? user?.email?.split('@')[0] ?? 'Usuário'
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'OP'
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined

  return (
    <Sidebar>
      <SidebarHeader style={{ padding: '20px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu style={{ marginTop: '10px' }}>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.to} style={{ marginBottom: '5px' }}>
                  <NavLink to={item.to} end={item.to === '/'}>
                    {({ isActive }) => (
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => handleNavigate(item.to)}
                        style={{
                          padding: '8px 12px',
                          height: '36px',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '14px',
                          fontWeight: isActive ? 500 : 400,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '9px',
                          color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                          background: isActive ? 'var(--bg-active)' : 'transparent',
                          transition: 'background 0.1s, color 0.1s',
                          width: '100%',
                          border: 'none',
                          cursor: 'pointer',
                        }}
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
                          style={{ flexShrink: 0, color: isActive ? 'var(--accent-light)' : undefined }}
                        />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    )}
                  </NavLink>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup style={{ marginTop: 'auto', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomNavItems.map((item) => (
                <SidebarMenuItem key={item.to} style={{ marginBottom: '5px' }}>
                  <NavLink to={item.to}>
                    {({ isActive }) => (
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => handleNavigate(item.to)}
                        style={{
                          padding: '8px 12px',
                          height: '36px',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '14px',
                          fontWeight: isActive ? 500 : 400,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '9px',
                          color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                          background: isActive ? 'var(--bg-active)' : 'transparent',
                          transition: 'background 0.1s, color 0.1s',
                          width: '100%',
                          border: 'none',
                          cursor: 'pointer',
                        }}
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
                          style={{ flexShrink: 0, color: isActive ? 'var(--accent-light)' : undefined }}
                        />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    )}
                  </NavLink>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter style={{ borderTop: '1px solid var(--border-subtle)', padding: '6px 8px' }}>
        {userMenuOpen && (
          <>
            <div onClick={() => setUserMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
            <div style={{
              position: 'fixed', bottom: '52px', left: '8px', width: '272px',
              background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)', zIndex: 50, overflow: 'hidden',
            }}>
              <div style={{
                padding: '20px 16px 16px', borderBottom: '1px solid var(--border-subtle)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
                background: 'var(--bg-hover)',
              }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '50%',
                  background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '18px', fontWeight: 600, color: 'var(--accent-light)',
                  overflow: 'hidden',
                }}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : initials}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '2px' }}>{displayName}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user?.email}</p>
                </div>
              </div>
              <div style={{ padding: '4px' }}>
                <MenuItem icon={<User size={13} />} label="Configurações da conta" onClick={() => { navigate('/configuracoes'); setUserMenuOpen(false) }} />
                <MenuItem icon={<HelpCircle size={13} />} label="Suporte" onClick={() => { window.open('mailto:suporte@opinify.com'); setUserMenuOpen(false) }} />
                <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '4px 0' }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', padding: '6px 8px' }}>
                  <button
                    onClick={() => { handleSignOut(); setUserMenuOpen(false) }}
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: '13px', fontFamily: 'var(--font-sans)', padding: 0 }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--red-hover)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--red)'}
                  >
                    Sair
                    <LogOut size={12} />
                  </button>
                </div>
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
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : initials}
          </div>
          <span style={{ flex: 1, fontSize: '14px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</span>
          <MoreHorizontal size={14} style={{ color: 'var(--text-disabled)', flexShrink: 0 }} />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
