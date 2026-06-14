import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

interface UserSettingsStore {
  apiKey: string | null
  loaded: boolean
  loadApiKey: () => Promise<void>
  clear: () => void
}

// Guarda a API key do usuário logado (definida pelo admin na tabela user_settings).
export const useUserSettingsStore = create<UserSettingsStore>((set) => ({
  apiKey: null,
  loaded: false,
  loadApiKey: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      set({ apiKey: null, loaded: true })
      return
    }
    const { data } = await supabase
      .from('user_settings')
      .select('api_key')
      .eq('user_id', user.id)
      .maybeSingle()
    set({ apiKey: (data?.api_key as string | undefined) ?? null, loaded: true })
  },
  clear: () => set({ apiKey: null, loaded: false }),
}))

// Chave ativa: a do usuário (definida pelo admin) ou o fallback do .env.
export function getActiveApiKey(): string {
  return (
    useUserSettingsStore.getState().apiKey
    ?? import.meta.env.OPENROUTER_API_KEY
    ?? import.meta.env.VITE_OPENROUTER_API_KEY
    ?? ''
  )
}
