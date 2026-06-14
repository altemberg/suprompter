import { getActiveApiKey } from '@/stores/useUserSettingsStore'

export interface TranscriptionResult {
  text: string
  language?: string
  duration?: number
  segments?: Array<{
    start: number
    end: number
    text: string
  }>
}

// Transcreve via URL — usa a Vercel Function (api/transcribe.py) que roda yt-dlp no servidor
export async function transcribeFromUrl(
  url: string,
  onProgress: (msg: string) => void
): Promise<TranscriptionResult> {
  onProgress('Extraindo áudio...')

  // A chave é lida pelo servidor (OPENROUTER_API_KEY) — não precisa vir do frontend
  const response = await fetch('/api/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })

  const data = await response.json().catch(() => ({})) as {
    text?: string
    language?: string
    duration?: number
    segments?: Array<{ start: number; end: number; text: string }>
    error?: string
  }

  if (!response.ok) {
    throw new Error(data.error ?? `Erro ${response.status}`)
  }

  return {
    text: data.text ?? '',
    language: data.language,
    duration: data.duration,
    segments: data.segments,
  }
}

export async function transcribeAudio(
  file: File,
  onProgress?: (stage: string) => void
): Promise<TranscriptionResult> {
  const apiKey = getActiveApiKey()
  if (!apiKey) throw new Error('API key não configurada. Peça ao admin para configurar a chave da sua conta.')

  onProgress?.('Preparando arquivo...')

  // Whisper aceita: mp4, webm, mp3, wav, m4a, ogg — máximo 25MB
  const MAX_SIZE = 25 * 1024 * 1024
  if (file.size > MAX_SIZE) {
    throw new Error(`Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)}MB). O limite é 25MB.`)
  }

  const formData = new FormData()
  formData.append('file', file, file.name)
  formData.append('model', 'openai/whisper-1')
  formData.append('language', 'pt')
  formData.append('response_format', 'verbose_json')
  formData.append('timestamp_granularities[]', 'segment')

  onProgress?.('Transcrevendo...')

  const response = await fetch('https://openrouter.ai/api/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Opinify',
    },
    body: formData,
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error((err as { error?: { message?: string } })?.error?.message ?? `Erro ${response.status} na API do Whisper`)
  }

  const data = await response.json() as {
    text: string
    language?: string
    duration?: number
    segments?: Array<{ start: number; end: number; text: string }>
  }

  return {
    text: data.text,
    language: data.language,
    duration: data.duration,
    segments: data.segments?.map(s => ({
      start: s.start,
      end: s.end,
      text: s.text.trim(),
    })),
  }
}

// Extrai áudio de vídeo via Web Audio API. Se o arquivo for < 10MB ou já for áudio, usa direto.
export async function extractAudioFromVideo(videoFile: File): Promise<File> {
  if (videoFile.type.startsWith('audio/') || videoFile.size < 10 * 1024 * 1024) {
    return videoFile
  }

  try {
    const arrayBuffer = await videoFile.arrayBuffer()
    const audioCtx = new AudioContext()
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
    await audioCtx.close()

    const offlineCtx = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    )
    const source = offlineCtx.createBufferSource()
    source.buffer = audioBuffer
    source.connect(offlineCtx.destination)
    source.start()

    const rendered = await offlineCtx.startRendering()
    const wavBlob = audioBufferToWav(rendered)
    return new File([wavBlob], videoFile.name.replace(/\.[^.]+$/, '.wav'), { type: 'audio/wav' })
  } catch {
    return videoFile
  }
}

function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = Math.min(buffer.numberOfChannels, 2)
  const sampleRate = buffer.sampleRate
  const bitDepth = 16
  const bytesPerSample = bitDepth / 8
  const blockAlign = numChannels * bytesPerSample
  const dataLength = buffer.length * blockAlign
  const totalLength = 44 + dataLength

  const ab = new ArrayBuffer(totalLength)
  const view = new DataView(ab)

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
  }

  writeString(0, 'RIFF')
  view.setUint32(4, totalLength - 8, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)           // PCM
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitDepth, true)
  writeString(36, 'data')
  view.setUint32(40, dataLength, true)

  let offset = 44
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]))
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true)
      offset += 2
    }
  }

  return new Blob([ab], { type: 'audio/wav' })
}
