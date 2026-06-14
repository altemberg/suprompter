import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Provider } from '@/lib/admin'

interface UserSettingsStore {
  apiKey: string | null
  provider: Provider | null
  loaded: boolean
  loadApiKey: () => Promise<void>
  clear: () => void
}

// Guarda a API key + provedor do usuário logado (definidos pelo admin em user_settings).
export const useUserSettingsStore = create<UserSettingsStore>((set) => ({
  apiKey: null,
  provider: null,
  loaded: false,
  loadApiKey: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      set({ apiKey: null, provider: null, loaded: true })
      return
    }
    const { data } = await supabase
      .from('user_settings')
      .select('api_key, provider')
      .eq('user_id', user.id)
      .maybeSingle()
    set({
      apiKey: (data?.api_key as string | undefined) ?? null,
      provider: (data?.provider as Provider | undefined) ?? null,
      loaded: true,
    })
  },
  clear: () => set({ apiKey: null, provider: null, loaded: false }),
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

// Provedor ativo: o do usuário ou 'openrouter' como padrão (compatível com o .env).
export function getActiveProvider(): Provider {
  return useUserSettingsStore.getState().provider ?? 'openrouter'
}
