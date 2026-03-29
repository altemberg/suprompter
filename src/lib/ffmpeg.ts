import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

let ffmpeg: FFmpeg | null = null
let loaded = false

async function loadFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg && loaded) return ffmpeg

  ffmpeg = new FFmpeg()

  // Carrega os arquivos core do FFmpeg via CDN
  // Usa a versão 0.12.x que tem melhor suporte a iOS Safari
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  })

  loaded = true
  return ffmpeg
}

// Pré-carrega o FFmpeg em background (singleton — seguro chamar várias vezes)
export async function preloadFFmpeg(): Promise<void> {
  await loadFFmpeg()
}

export interface ProcessingProgress {
  stage: 'loading' | 'processing' | 'done' | 'error'
  progress: number   // 0–100
  message: string
}

export async function processVideo(
  inputBlob: Blob,
  inputMimeType: string,
  onProgress: (p: ProcessingProgress) => void
): Promise<Blob> {

  onProgress({ stage: 'loading', progress: 0, message: 'Carregando processador...' })

  const ff = await loadFFmpeg()

  // Detecta extensão do arquivo de entrada
  const inputExt = inputMimeType.includes('mp4') ? 'mp4' : 'webm'
  const inputName = `input.${inputExt}`
  const outputName = 'output.mp4'

  // Progresso do FFmpeg
  ff.on('progress', ({ progress }) => {
    const pct = Math.round(Math.min(progress * 100, 99))
    onProgress({
      stage: 'processing',
      progress: pct,
      message: `Processando... ${pct}%`,
    })
  })

  // Escreve o arquivo de entrada no sistema de arquivos virtual do FFmpeg
  onProgress({ stage: 'processing', progress: 5, message: 'Preparando arquivo...' })
  await ff.writeFile(inputName, await fetchFile(inputBlob))

  // -c:v libx264       → encoder H.264
  // -preset ultrafast  → velocidade máxima (essencial no celular)
  // -crf 23            → qualidade boa sem pesar muito
  // -pix_fmt yuv420p   → compatível com todos os players (exigido pelo iOS)
  // -c:a aac           → encoder AAC
  // -b:a 128k          → bitrate 128kbps
  // -af filtros        → highpass remove ruído grave, loudnorm normaliza volume, acompressor equaliza voz
  // -movflags +faststart → metadados no início do MP4 (streaming mais rápido)
  await ff.exec([
    '-i', inputName,
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-crf', '23',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-af', 'highpass=f=80,loudnorm=I=-16:LRA=11:TP=-1.5,acompressor=threshold=-20dB:ratio=4:attack=5:release=50',
    '-movflags', '+faststart',
    outputName,
  ])

  // Lê o arquivo processado
  onProgress({ stage: 'processing', progress: 99, message: 'Finalizando...' })
  const data = await ff.readFile(outputName)

  // Limpa os arquivos do sistema virtual para liberar memória
  await ff.deleteFile(inputName)
  await ff.deleteFile(outputName)

  onProgress({ stage: 'done', progress: 100, message: 'Pronto!' })

  // FileData pode ser Uint8Array<SharedArrayBuffer> — copia para ArrayBuffer normal
  const raw = data as Uint8Array
  const copy = new Uint8Array(raw.length)
  copy.set(raw)
  return new Blob([copy.buffer], { type: 'video/mp4' })
}
