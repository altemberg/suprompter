import { Home, FileText, type LucideIcon } from 'lucide-react'

export interface NavItem {
  label: string
  icon: LucideIcon
  to: string
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Início', icon: Home, to: '/' },
  { label: 'Roteiros', icon: FileText, to: '/roteiros' },
]

export const BOTTOM_NAV_ITEMS: NavItem[] = []
