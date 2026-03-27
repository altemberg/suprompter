import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 flex flex-col min-h-0 overflow-auto">
        <div className="p-2 border-b">
          <SidebarTrigger />
        </div>
        <div className="flex-1 p-6">
          {children}
        </div>
      </main>
    </SidebarProvider>
  )
}
