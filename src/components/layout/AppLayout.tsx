import { useState } from 'react'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Menu } from 'lucide-react'
import { AppSidebar } from './AppSidebar'
import { useIsMobile } from '@/hooks/useIsMobile'

interface AppLayoutProps {
  children: React.ReactNode
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

        {/* Drawer sidebar — mesmo AppSidebar do desktop */}
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetContent side="left" style={{ padding: 0, width: '260px', background: 'var(--bg-sidebar)', border: 'none' }}>
            <SidebarProvider defaultOpen>
              <AppSidebar onNavigate={() => setDrawerOpen(false)} />
            </SidebarProvider>
          </SheetContent>
        </Sheet>

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
