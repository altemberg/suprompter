export type Format = 'reels' | 'youtube'

export interface Posicionamento {
  id: string
  user_id: string
  nome: string
  descricao: string
  created_at: string
}

export interface Script {
  id: string
  user_id: string
  title: string
  content: string
  format: Format
  tone: string
  tags: string[]
  gancho: string
  desenvolvimento: string
  cta: string
  posicionamento_id: string | null
  video_url: string | null
  transcricao: string | null
  informacoes_extras: string
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
