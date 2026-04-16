import { Home, FileText, Video, Mic, Settings, type LucideIcon } from 'lucide-react'

export interface NavItem {
  label: string
  icon: LucideIcon
  to: string
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Início', icon: Home, to: '/' },
  { label: 'Roteiros', icon: FileText, to: '/roteiros' },
  { label: 'Transcritor', icon: Mic, to: '/transcritor' },
  { label: 'Gravações', icon: Video, to: '/gravacoes' },
]

export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { label: 'Configurações', icon: Settings, to: '/configuracoes' },
]
