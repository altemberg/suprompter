import { Home, FileText, Video, Film, Settings } from 'lucide-react'
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
  { label: 'Gravações', icon: Film, to: '/gravacoes' },
]

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const { user, signOut } = useAuthStore()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  function handleNavigate(to: string) {
    navigate(to)
    onNavigate?.()
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'U'

  return (
    <Sidebar>
      <SidebarHeader style={{ padding: '20px', borderBottom: '0.5px solid rgba(255,255,255,0.07)' }}>
        <span style={{ fontSize: '15px', fontWeight: 500, letterSpacing: '-0.3px', color: 'white' }}>
          Su<span style={{ color: '#a9a3f0' }}>prompter</span>
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
        <SidebarMenu>
          <SidebarMenuItem>
            <NavLink to="/configuracoes">
              {({ isActive }) => (
                <SidebarMenuButton
                  isActive={isActive}
                  onClick={() => handleNavigate('/configuracoes')}
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
                  <Settings size={15} strokeWidth={1.8} />
                  <span>Configurações</span>
                </SidebarMenuButton>
              )}
            </NavLink>
          </SidebarMenuItem>
        </SidebarMenu>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: 'rgba(127,119,221,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: 500, color: '#a9a3f0', flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </p>
            <button
              onClick={handleSignOut}
              style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Sair
            </button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
