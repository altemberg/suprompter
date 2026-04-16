import { Sidebar } from '@/components/ui/sidebar'
import { SidebarInner } from './SidebarInner'

interface AppSidebarProps {
  onNavigate?: () => void
}

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  return (
    <Sidebar>
      <SidebarInner onNavigate={onNavigate} />
    </Sidebar>
  )
}
