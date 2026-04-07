// Extrai áudio de URLs de vídeo para envio ao Whisper.
//
// YouTube  → API pública do Invidious (sem auth, CORS ok, retorna stream URLs do YouTube)
// Outros   → mensagem clara para baixar e usar upload de arquivo

export type UrlPlatform = 'youtube' | 'instagram' | 'tiktok' | 'twitter' | 'facebook' | 'vimeo' | 'other' | null

export function detectPlatform(input: string): UrlPlatform {
  try {
    const { hostname } = new URL(input)
    if (hostname.endsWith('youtube.com') || hostname.endsWith('youtu.be')) return 'youtube'
    if (hostname.endsWith('instagram.com')) return 'instagram'
    if (hostname.endsWith('tiktok.com')) return 'tiktok'
    if (hostname.endsWith('twitter.com') || hostname.endsWith('x.com')) return 'twitter'
    if (hostname.endsWith('facebook.com')) return 'facebook'
    if (hostname.endsWith('vimeo.com')) return 'vimeo'
    return 'other'
  } catch {
    return null
  }
}

export function looksLikeVideoUrl(input: string): boolean {
  return detectPlatform(input) !== null
}

// Plataformas que bloqueiam download direto no browser
const UNSUPPORTED_PLATFORMS: UrlPlatform[] = ['instagram', 'tiktok', 'facebook']

// Instâncias públicas do Invidious — tenta em ordem até uma responder
const INVIDIOUS_INSTANCES = [
  'https://invidious.privacyredirect.com',
  'https://inv.nadeko.net',
  'https://invidious.lunar.icu',
  'https://yt.drgnz.club',
]

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.endsWith('youtu.be')) return u.pathname.slice(1).split('?')[0]
    return u.searchParams.get('v')
  } catch {
    return null
  }
}

async function fetchYouTubeAudio(url: string, onProgress?: (msg: string) => void): Promise<File> {
  const videoId = extractYouTubeId(url)
  if (!videoId) throw new Error('URL do YouTube inválida. Use o formato youtube.com/watch?v=...')

  onProgress?.('Buscando áudio no YouTube...')

  // Tenta cada instância Invidious até uma responder
  let videoData: Record<string, unknown> | null = null
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const res = await fetch(`${instance}/api/v1/videos/${videoId}?fields=adaptiveFormats`, {
        signal: AbortSignal.timeout(8000),
      })
      if (res.ok) {
        videoData = await res.json() as Record<string, unknown>
        break
      }
    } catch {
      continue
    }
  }

  if (!videoData) {
    throw new Error('Não foi possível obter o vídeo do YouTube. Tente novamente ou faça o upload do arquivo.')
  }

  interface AdaptiveFormat {
    type: string
    bitrate: number
    url: string
  }

  const formats = (videoData.adaptiveFormats as AdaptiveFormat[] | undefined) ?? []
  const audioFormats = formats
    .filter(f => f.type?.startsWith('audio/'))
    .sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0))

  const best = audioFormats[0]
  if (!best?.url) throw new Error('Nenhum formato de áudio encontrado neste vídeo.')

  onProgress?.('Baixando áudio...')

  const audioRes = await fetch(best.url).catch(() => null)
  if (!audioRes?.ok) {
    throw new Error('Falha ao baixar o áudio do YouTube. O link pode ter expirado.')
  }

  const blob = await audioRes.blob()
  const ext = best.type.includes('webm') ? 'webm' : 'mp4'
  return new File([blob], `audio.${ext}`, { type: best.type.split(';')[0] })
}

export async function fetchAudioFromUrl(url: string, onProgress?: (msg: string) => void): Promise<File> {
  const platform = detectPlatform(url)

  if (UNSUPPORTED_PLATFORMS.includes(platform)) {
    const name = { instagram: 'Instagram', tiktok: 'TikTok', facebook: 'Facebook' }[platform as string] ?? 'Esta plataforma'
    throw new Error(
      `${name} bloqueia o download direto de vídeos no navegador. ` +
      `Baixe o vídeo pelo app e envie pela aba Arquivo.`
    )
  }

  if (platform === 'youtube') {
    return fetchYouTubeAudio(url, onProgress)
  }

  throw new Error(
    `URL não suportada. Plataformas suportadas via URL: YouTube. ` +
    `Para outros vídeos, baixe e envie pela aba Arquivo.`
  )
}
