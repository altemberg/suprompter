import { useState } from 'react'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Menu, Video, MoreHorizontal, User, HelpCircle, LogOut } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { AppSidebar } from './AppSidebar'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useAuthStore } from '@/stores/useAuthStore'
import { NAV_ITEMS, BOTTOM_NAV_ITEMS } from './nav-config'

interface AppLayoutProps {
  children: React.ReactNode
}

function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, signOut } = useAuthStore()
  const navigate = useNavigate()
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const displayName = user?.user_metadata?.name ?? user?.email?.split('@')[0] ?? 'Usuário'
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'OP'
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined

  function handleNavigate(to: string) {
    navigate(to)
    onClose()
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login')
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" style={{ padding: 0, width: '260px', background: 'var(--bg-sidebar)', border: 'none', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '10px' }}>
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

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} style={{ textDecoration: 'none' }}>
              {({ isActive }) => (
                <button
                  onClick={() => handleNavigate(item.to)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '9px',
                    width: '100%', padding: '8px 12px', marginBottom: '4px',
                    borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer',
                    fontSize: '14px', fontWeight: isActive ? 500 : 400,
                    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                    background: isActive ? 'var(--bg-active)' : 'transparent',
                    textAlign: 'left', fontFamily: 'var(--font-sans)',
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

          {/* Bottom nav (Configurações, etc.) */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '8px', paddingTop: '8px' }}>
            {BOTTOM_NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} style={{ textDecoration: 'none' }}>
                {({ isActive }) => (
                  <button
                    onClick={() => handleNavigate(item.to)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '9px',
                      width: '100%', padding: '8px 12px', marginBottom: '4px',
                      borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer',
                      fontSize: '14px', fontWeight: isActive ? 500 : 400,
                      color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                      background: isActive ? 'var(--bg-active)' : 'transparent',
                      textAlign: 'left', fontFamily: 'var(--font-sans)',
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

        {/* Footer — user */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '6px 8px' }}>
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
                    {avatarUrl ? <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>{displayName}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{user?.email}</p>
                  </div>
                </div>
                <div style={{ padding: '4px' }}>
                  <button onClick={() => { handleNavigate('/configuracoes'); setUserMenuOpen(false) }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '6px 8px', borderRadius: 'var(--radius-md)', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '14px', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
                    <User size={13} /> Configurações da conta
                  </button>
                  <button onClick={() => { window.open('mailto:suporte@opinify.com'); setUserMenuOpen(false) }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '6px 8px', borderRadius: 'var(--radius-md)', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '14px', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
                    <HelpCircle size={13} /> Suporte
                  </button>
                  <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '4px 0' }} />
                  <button onClick={handleSignOut} style={{ display: 'flex', alignItems: 'center', gap: '5px', width: '100%', padding: '6px 8px', borderRadius: 'var(--radius-md)', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '13px', color: 'var(--red)', fontFamily: 'var(--font-sans)' }}>
                    Sair <LogOut size={12} />
                  </button>
                </div>
              </div>
            </>
          )}
          <div
            onClick={() => setUserMenuOpen(p => !p)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 8px', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
          >
            <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 600, color: 'var(--accent-light)', flexShrink: 0, overflow: 'hidden' }}>
              {avatarUrl ? <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
            </div>
            <span style={{ flex: 1, fontSize: '14px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</span>
            <MoreHorizontal size={14} style={{ color: 'var(--text-disabled)', flexShrink: 0 }} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile()
  const [drawerOpen, setDrawerOpen] = useState(false)

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100dvh', background: '#13111c', overflow: 'hidden' }}>
        {/* Top bar mobile */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: '0.5px solid rgba(255,255,255,0.07)',
          flexShrink: 0,
          background: '#141414',
        }}>
          <button
            onClick={() => setDrawerOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.6)',
              borderRadius: '8px',
              marginRight: '12px',
            }}
            aria-label="Abrir menu"
          >
            <Menu size={20} strokeWidth={1.8} />
          </button>
          <span style={{ fontSize: '15px', fontWeight: 500, letterSpacing: '-0.3px', color: 'white' }}>
            Opini<span style={{ color: '#a9a3f0' }}>fy</span>
          </span>
        </div>

        <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', background: '#13111c' }}>
          {children}
        </main>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 flex flex-col min-h-0 overflow-auto bg-[#13111c]">
        <div className="px-2 py-2 md:hidden border-b border-white/[0.07]">
          <SidebarTrigger />
        </div>
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </SidebarProvider>
  )
}
