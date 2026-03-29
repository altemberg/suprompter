import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Menu, Home, FileText, Video, Film, Settings } from 'lucide-react'
import { AppSidebar } from './AppSidebar'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useAuthStore } from '@/stores/useAuthStore'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile()
  const [drawerOpen, setDrawerOpen] = useState(false)

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#0d0d0d', overflow: 'hidden' }}>
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
            Su<span style={{ color: '#a9a3f0' }}>prompter</span>
          </span>
        </div>

        {/* Drawer sidebar */}
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetContent side="left" style={{ padding: 0, width: '240px', background: '#111111', border: 'none' }}>
            <MobileNav onClose={() => setDrawerOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', background: '#0d0d0d' }}>
          {children}
        </main>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 flex flex-col min-h-0 overflow-auto bg-[#0d0d0d]">
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

const mobileNavItems = [
  { label: 'Início', icon: Home, to: '/' },
  { label: 'Roteiros', icon: FileText, to: '/roteiros' },
  { label: 'Teleprompter', icon: Video, to: '/teleprompter' },
  { label: 'Gravações', icon: Film, to: '/gravacoes' },
  { label: 'Configurações', icon: Settings, to: '/configuracoes' },
]

function MobileNav({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const { user, signOut } = useAuthStore()
  const currentPath = window.location.pathname

  function go(to: string) {
    navigate(to)
    onClose()
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#111111' }}>
      <div style={{ padding: '20px 16px', borderBottom: '0.5px solid rgba(255,255,255,0.07)' }}>
        <span style={{ fontSize: '15px', fontWeight: 500, letterSpacing: '-0.3px', color: 'white' }}>
          Su<span style={{ color: '#a9a3f0' }}>prompter</span>
        </span>
      </div>

      <nav style={{ flex: 1, padding: '8px' }}>
        {mobileNavItems.map((item) => {
          const isActive = item.to === '/'
            ? currentPath === '/'
            : currentPath.startsWith(item.to)
          return (
            <button
              key={item.to}
              onClick={() => go(item.to)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                width: '100%', padding: '11px 12px', borderRadius: '8px',
                fontSize: '14px', marginBottom: '2px', textAlign: 'left',
                color: isActive ? '#a9a3f0' : 'rgba(255,255,255,0.55)',
                background: isActive ? 'rgba(127,119,221,0.15)' : 'transparent',
                border: 'none', cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              <item.icon size={16} strokeWidth={1.8} />
              {item.label}
            </button>
          )
        })}
      </nav>

      <div style={{ padding: '12px 16px', borderTop: '0.5px solid rgba(255,255,255,0.07)' }}>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user?.email}
        </p>
        <button
          onClick={handleSignOut}
          style={{ fontSize: '13px', color: 'rgba(239,68,68,0.65)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          Sair
        </button>
      </div>
    </div>
  )
}
