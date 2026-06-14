import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

// Email do superadmin (precisa bater com ADMIN_EMAIL em api/admin.py).
export const ADMIN_EMAIL = 'contato@grpsupra.com.br'

// Senha padrão para novos membros.
export const DEFAULT_PASSWORD = 'opinify123!'

export function isAdmin(user: User | null | undefined): boolean {
  return !!user?.email && user.email.toLowerCase() === ADMIN_EMAIL
}

export interface AdminUser {
  id: string
  email: string
  name: string
  created_at: string
  disabled: boolean
  api_key: string | null
}

async function callAdmin<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) throw new Error('Sessão expirada. Faça login novamente.')

  const res = await fetch('/api/admin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action, ...payload }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = (data as { error?: string; msg?: string })?.error
      ?? (data as { msg?: string })?.msg
      ?? `Erro ${res.status}`
    throw new Error(msg)
  }
  return data as T
}

export function adminListUsers(): Promise<AdminUser[]> {
  return callAdmin<{ users: AdminUser[] }>('list_users').then(r => r.users ?? [])
}

export function adminCreateUser(params: { name: string; email: string; password: string }): Promise<unknown> {
  return callAdmin('create_user', params)
}

export function adminSetStatus(userId: string, disabled: boolean): Promise<unknown> {
  return callAdmin('set_status', { user_id: userId, disabled })
}

export function adminSetApiKey(userId: string, apiKey: string): Promise<unknown> {
  return callAdmin('set_api_key', { user_id: userId, api_key: apiKey })
}
