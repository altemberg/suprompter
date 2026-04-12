import { Home, FileText, Video, Film, Captions, Settings, HelpCircle, Sun, Moon, LogOut } from 'lucide-react'
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

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const { user, signOut } = useAuthStore()
  const navigate = useNavigate()
  const { isDark: isDarkTheme, toggleTheme } = useTheme()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  function handleNavigate(to: string) {
    navigate(to)
    onNavigate?.()
  }

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

      <SidebarFooter style={{ borderTop: '0.5px solid rgba(255,255,255,0.07)', padding: '10px' }}>
        {/* Suporte */}
        <div
          className="nav-item"
          onClick={() => window.open('mailto:suporte@opinify.com', '_blank')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '5px 8px', borderRadius: 'var(--radius-md)',
            fontSize: '13px', color: 'var(--text-muted)',
            cursor: 'pointer', marginBottom: '1px',
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
          <HelpCircle size={14} />
          Suporte
        </div>

        {/* Configurações da conta */}
        <div
          className="nav-item"
          onClick={() => navigate('/configuracoes')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '5px 8px', borderRadius: 'var(--radius-md)',
            fontSize: '13px', color: 'var(--text-muted)',
            cursor: 'pointer', marginBottom: '4px',
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
          <Settings size={14} />
          Configurações
        </div>

        {/* Divisor */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '4px 0' }} />

        {/* Linha: Toggle de tema + Sair */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '4px 8px',
        }}>
          <button
            onClick={toggleTheme}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'transparent', border: 'none',
              color: 'var(--text-muted)', fontSize: '12px',
              cursor: 'pointer', padding: '3px 0',
              fontFamily: 'var(--font-sans)',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            {isDarkTheme ? <Sun size={13} /> : <Moon size={13} />}
            {isDarkTheme ? 'Light Theme' : 'Dark Theme'}
          </button>

          <button
            onClick={handleSignOut}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              background: 'transparent', border: 'none',
              color: 'hsl(1, 62%, 60%)',
              fontSize: '12px', cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              padding: '3px 0',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'hsl(1, 62%, 76%)'}
            onMouseLeave={e => e.currentTarget.style.color = 'hsl(1, 62%, 60%)'}
          >
            Sair
            <LogOut size={12} />
          </button>
        </div>

        {/* Divisor */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '4px 0' }} />

        {/* Avatar + email */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '5px 8px', borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{
            width: '24px', height: '24px',
            borderRadius: '50%',
            background: 'var(--accent-bg)',
            border: '1px solid var(--accent-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '10px', fontWeight: 600,
            color: 'var(--accent-light)',
            flexShrink: 0,
          }}>
            {user?.email?.slice(0, 2).toUpperCase() ?? 'OP'}
          </div>

          <span style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
          }}>
            {user?.email ?? ''}
          </span>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
