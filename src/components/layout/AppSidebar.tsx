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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAuthStore } from '@/stores/useAuthStore'

const navItems = [
  { label: 'Início', icon: Home, to: '/' },
  { label: 'Roteiros', icon: FileText, to: '/roteiros' },
  { label: 'Teleprompter', icon: Video, to: '/teleprompter' },
  { label: 'Gravações', icon: Film, to: '/gravacoes' },
]

export function AppSidebar() {
  const { user, signOut } = useAuthStore()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const userInitials = user?.email?.slice(0, 2).toUpperCase() ?? 'U'
  const userEmail = user?.email ?? ''

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <span className="text-xl font-bold tracking-tight">Suprompter</span>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <NavLink to={item.to} end={item.to === '/'}>
                    {({ isActive }) => (
                      <SidebarMenuButton isActive={isActive}>
                        <item.icon className="size-4" />
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

      <SidebarFooter className="p-4 space-y-3">
        <Separator />
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <NavLink to="/configuracoes">
                  {({ isActive }) => (
                    <SidebarMenuButton isActive={isActive}>
                      <Settings className="size-4" />
                      <span>Configurações</span>
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <div className="flex items-center gap-3">
          <Avatar className="size-8">
            <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate">{userEmail}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            Sair
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
