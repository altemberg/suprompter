export type Format = 'reels' | 'youtube'

export interface Script {
  id: string
  user_id: string
  title: string
  content: string
  format: Format
  tone: string
  tags: string[]
  created_at: string
  updated_at: string
}

export interface Recording {
  id: string
  user_id: string
  script_id: string | null
  title: string | null
  duration_seconds: number | null
  format: Format | null
  recorded_at: string
}

export interface TeleprompterSettings {
  speed: number        // 1–10
  fontSize: number     // px
  theme: 'dark' | 'light'
}
