import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthStore {
  user: User | null
  loading: boolean
  setUser: (user: User | null) => void
  initialize: () => void
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  initialize: () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ user: session?.user ?? null, loading: false })
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null, loading: false })
    })
  },
  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null })
  },
}))
