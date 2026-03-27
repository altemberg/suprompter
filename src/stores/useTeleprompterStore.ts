import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TeleprompterStore {
  speed: number
  fontSize: number
  setSpeed: (n: number) => void
  setFontSize: (n: number) => void
}

export const useTeleprompterStore = create<TeleprompterStore>()(
  persist(
    (set) => ({
      speed: 4,
      fontSize: 40,
      setSpeed: (speed) => set({ speed }),
      setFontSize: (fontSize) => set({ fontSize }),
    }),
    { name: 'teleprompter-settings' }
  )
)
