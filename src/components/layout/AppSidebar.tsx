import { useState } from 'react'
import { Home, FileText, Video, Film, Captions, MoreHorizontal, User, HelpCircle, Sun, Moon, LogOut } from 'lucide-react'
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
import { useTheme } from '@/hooks/useTheme'

interface AppSidebarProps {
  onNavigate?: () => void
}

const navItems = [
  { label: 'Início', icon: Home, to: '/' },
  { label: 'Roteiros', icon: FileText, to: '/roteiros' },
  { label: 'Teleprompter', icon: Video, to: '/teleprompter' },
  { label: 'Gravações', icon: Film, to: '/gravacoes' },
  { label: 'Transcritor', icon: Captions, to: '/transcritor' },
]

function DropdownItem({
  icon, label, onClick
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '6px 8px', borderRadius: 'var(--radius-md)',
        fontSize: '13px', color: 'var(--text-muted)',
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'var(--bg-hover)'
        e.currentTarget.style.color = 'var(--text-secondary)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = 'var(--text-muted)'
      }}
    >
      {icon}
      {label}
    </div>
  )
}

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const { user, signOut } = useAuthStore()
  const navigate = useNavigate()
  const { isDark: isDarkTheme, toggleTheme } = useTheme()
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

  return (
    <Sidebar>
      <SidebarHeader style={{ padding: '20px', borderBottom: '0.5px solid rgba(255,255,255,0.07)' }}>
        <span style={{ fontSize: '15px', fontWeight: 500, letterSpacing: '-0.3px', color: 'white' }}>
          Opini<span style={{ color: '#a9a3f0' }}>fy</span>
        </span>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <NavLink to={item.to} end={item.to === '/'}>
                    {({ isActive }) => (
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => handleNavigate(item.to)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '8px',
                          fontSize: '13.5px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          color: isActive ? '#a9a3f0' : 'rgba(255,255,255,0.45)',
                          background: isActive ? 'rgba(127,119,221,0.15)' : 'transparent',
                          transition: 'background 0.15s, color 0.15s',
                          width: '100%',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <item.icon size={15} strokeWidth={1.8} />
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
        {/* Dropdown do usuário */}
        {userMenuOpen && (
          <>
            {/* Overlay para fechar ao clicar fora */}
            <div
              onClick={() => setUserMenuOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 40 }}
            />

            {/* Menu — posicionado acima do footer */}
            <div style={{
              position: 'fixed',
              bottom: '52px',
              left: '8px',
              width: '272px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              zIndex: 50,
              overflow: 'hidden',
            }}>
              {/* Card do usuário */}
              <div style={{
                padding: '16px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
              }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '50%',
                  background: 'var(--accent-bg)',
                  border: '1px solid var(--accent-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '18px', fontWeight: 600, color: 'var(--accent-light)',
                }}>
                  {initials}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {displayName}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {user?.email}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div style={{ padding: '4px' }}>
                <DropdownItem
                  icon={<User size={13} />}
                  label="Configurações da conta"
                  onClick={() => { navigate('/configuracoes'); setUserMenuOpen(false) }}
                />
                <DropdownItem
                  icon={<HelpCircle size={13} />}
                  label="Suporte"
                  onClick={() => { window.open('mailto:suporte@opinify.com'); setUserMenuOpen(false) }}
                />

                <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '4px 0' }} />

                {/* Toggle tema + Log out — mesma linha */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '5px 8px', borderRadius: 'var(--radius-md)',
                }}>
                  <button
                    onClick={toggleTheme}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-muted)', fontSize: '13px',
                      fontFamily: 'var(--font-sans)', padding: 0,
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    {isDarkTheme ? <Sun size={13} /> : <Moon size={13} />}
                    {isDarkTheme ? 'Light Theme' : 'Dark Theme'}
                  </button>

                  <button
                    onClick={() => { handleSignOut(); setUserMenuOpen(false) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'hsl(1, 62%, 60%)', fontSize: '13px',
                      fontFamily: 'var(--font-sans)', padding: 0,
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'hsl(1, 62%, 76%)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'hsl(1, 62%, 60%)'}
                  >
                    Log out
                    <LogOut size={12} />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Linha do footer — avatar + nome + ícone */}
        <div
          onClick={() => setUserMenuOpen(p => !p)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '5px 8px', borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%',
            background: 'var(--accent-bg)',
            border: '1px solid var(--accent-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '10px', fontWeight: 600, color: 'var(--accent-light)',
            flexShrink: 0,
          }}>
            {initials}
          </div>
          <span style={{
            flex: 1, fontSize: '13px', color: 'var(--text-secondary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {displayName}
          </span>
          <MoreHorizontal size={14} style={{ color: 'var(--text-disabled)', flexShrink: 0 }} />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
