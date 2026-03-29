# FFmpeg WASM — Pós-processamento de vídeo e áudio

## O que isso faz

Após o usuário parar a gravação, em vez de disponibilizar o arquivo bruto do `MediaRecorder` imediatamente, roda um processamento via FFmpeg WebAssembly localmente no browser:

- **Vídeo**: reencoding para H.264 com bitrate controlado, saída em MP4 real
- **Áudio**: normalização de volume (`loudnorm`), filtro de ruído grave (`highpass`), compressor

Tudo acontece no dispositivo do usuário — sem upload, sem servidor.

---

## Instalação

```bash
npm install @ffmpeg/ffmpeg @ffmpeg/util
```

---

## ARQUIVO: `src/lib/ffmpeg.ts`

Crie este arquivo com toda a lógica de pós-processamento:

```ts
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

  // Comando FFmpeg:
  // -i input           → arquivo de entrada
  // -c:v libx264       → encoder de vídeo H.264
  // -preset ultrafast  → velocidade máxima de encoding (menos qualidade que slow, mas muito mais rápido no celular)
  // -crf 23            → qualidade do vídeo (18=ótimo, 23=bom, 28=aceitável) — 23 é o balanço ideal
  // -pix_fmt yuv420p   → pixel format compatível com todos os players (iOS exige isso)
  // -c:a aac           → encoder de áudio AAC
  // -b:a 128k          → bitrate do áudio 128kbps
  // -af filtros        → filtros de áudio:
  //   highpass=f=80    → remove frequências abaixo de 80Hz (ruído de ambiente/ar condicionado)
  //   loudnorm         → normaliza o volume para -16 LUFS (padrão de plataformas de vídeo)
  //   acompressor      → compressor leve para equalizar partes mais baixas e mais altas da voz
  // -movflags +faststart → coloca os metadados no início do MP4 (streaming mais rápido)

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

  return new Blob([data], { type: 'video/mp4' })
}
```

---

## ARQUIVO: `src/hooks/useMediaRecorder.ts`

Atualize o hook para rodar o processamento após `onstop`:

```ts
import { processVideo, ProcessingProgress } from '@/lib/ffmpeg'

export function useMediaRecorder(
  canvasStream: MediaStream | null,
  scriptTitle?: string
) {
  const [isRecording, setIsRecording] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState<ProcessingProgress | null>(null)

  const chunksRef = useRef<BlobPart[]>([])
  const recorderRef = useRef<MediaRecorder | null>(null)

  // Detecta mimeType suportado
  const mimeType = (() => {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4',
    ]
    return types.find(t => MediaRecorder.isTypeSupported(t)) ?? ''
  })()

  function generateFileName(title: string | undefined): string {
    const safeTitle = (title || 'gravacao')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s_-]/g, '')
      .trim()
      .replace(/\s+/g, '_')

    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const date = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`
    const time = `${pad(now.getHours())}-${pad(now.getMinutes())}`

    return `${safeTitle}_${date}_${time}.mp4`   // sempre .mp4 — FFmpeg converte
  }

  const startRecording = useCallback(() => {
    if (!canvasStream) return

    chunksRef.current = []
    const recorder = new MediaRecorder(canvasStream, { mimeType })

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = async () => {
      const rawBlob = new Blob(chunksRef.current, { type: mimeType })

      // Inicia pós-processamento com FFmpeg
      setProcessing(true)
      setProcessingProgress({ stage: 'loading', progress: 0, message: 'Carregando processador...' })

      try {
        const processedBlob = await processVideo(
          rawBlob,
          mimeType,
          (progress) => setProcessingProgress(progress)
        )

        const url = URL.createObjectURL(processedBlob)
        const name = generateFileName(scriptTitle)

        setDownloadUrl(url)
        setFileName(name)
      } catch (err) {
        console.error('Erro no processamento FFmpeg:', err)

        // Fallback: usa o arquivo bruto se o FFmpeg falhar
        const url = URL.createObjectURL(rawBlob)
        const name = generateFileName(scriptTitle)
        setDownloadUrl(url)
        setFileName(name)

        setProcessingProgress({
          stage: 'error',
          progress: 0,
          message: 'Processamento falhou — usando arquivo original.',
        })
      } finally {
        setProcessing(false)
      }
    }

    recorder.start(1000)   // coleta chunks a cada 1s
    recorderRef.current = recorder
    setIsRecording(true)
  }, [canvasStream, mimeType, scriptTitle])

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop()
    setIsRecording(false)
  }, [])

  const clearRecording = useCallback(() => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl)
    setDownloadUrl(null)
    setFileName(null)
    setProcessingProgress(null)
    chunksRef.current = []
  }, [downloadUrl])

  return {
    isRecording,
    startRecording,
    stopRecording,
    downloadUrl,
    fileName,
    processing,
    processingProgress,
    clearRecording,
  }
}
```

---

## ARQUIVO: `src/components/teleprompter/DownloadBanner.tsx`

O banner agora tem dois estados: **processando** e **pronto para download**.

```tsx
import { ProcessingProgress } from '@/lib/ffmpeg'

interface DownloadBannerProps {
  processing: boolean
  processingProgress: ProcessingProgress | null
  downloadUrl: string | null
  fileName: string | null
  onRecordAgain: () => void
}

export function DownloadBanner({
  processing,
  processingProgress,
  downloadUrl,
  fileName,
  onRecordAgain,
}: DownloadBannerProps) {

  function handleDownload() {
    if (!downloadUrl || !fileName) return
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = fileName
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      background: processing
        ? 'rgba(20, 20, 30, 0.97)'
        : 'rgba(15, 80, 50, 0.95)',
      padding: '16px 20px',
      paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    }}>

      {processing ? (
        /* Estado: processando */
        <>
          <p style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>
            {processingProgress?.message ?? 'Processando vídeo...'}
          </p>

          {/* Barra de progresso */}
          <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '99px', height: '4px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              borderRadius: '99px',
              background: '#a9a3f0',
              width: `${processingProgress?.progress ?? 0}%`,
              transition: 'width 0.3s ease',
            }} />
          </div>

          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
            Melhorando qualidade de áudio e vídeo...
          </p>
        </>
      ) : (
        /* Estado: pronto */
        <>
          <p style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>
            ✓ Gravação concluída e processada!
          </p>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleDownload}
              style={{
                flex: 1,
                padding: '10px',
                background: 'rgba(255,255,255,0.15)',
                border: '0.5px solid rgba(255,255,255,0.25)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                minHeight: '44px',
              }}
            >
              Baixar {fileName}
            </button>

            <button
              onClick={onRecordAgain}
              style={{
                padding: '10px 16px',
                background: 'transparent',
                border: '0.5px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: 'rgba(255,255,255,0.6)',
                fontSize: '13px',
                cursor: 'pointer',
                minHeight: '44px',
              }}
            >
              Gravar novamente
            </button>
          </div>

          {isIOS && (
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
              No iPhone: se abrir nova aba, segure o vídeo e toque em "Salvar no dispositivo"
            </p>
          )}
        </>
      )}
    </div>
  )
}
```

---

## ARQUIVO: `src/pages/TeleprompterPage.tsx`

Atualize o uso do `DownloadBanner` e bloqueie os controles durante o processamento:

```tsx
const {
  isRecording,
  startRecording,
  stopRecording,
  downloadUrl,
  fileName,
  processing,
  processingProgress,
  clearRecording,
} = useMediaRecorder(canvasStream, script?.title)

// Exibe o banner quando está processando OU quando já tem download pronto
const showBanner = processing || !!downloadUrl

return (
  <>
    {/* ... layout do teleprompter ... */}

    {/* Botão Gravar — desabilitado durante processamento */}
    <button
      onClick={isRecording ? stopRecording : startRecording}
      disabled={processing}
      style={{
        opacity: processing ? 0.4 : 1,
        cursor: processing ? 'not-allowed' : 'pointer',
        // ... demais estilos
      }}
    >
      {isRecording ? 'Parar' : 'Gravar'}
    </button>

    {showBanner && (
      <DownloadBanner
        processing={processing}
        processingProgress={processingProgress}
        downloadUrl={downloadUrl}
        fileName={fileName}
        onRecordAgain={() => {
          clearRecording()
        }}
      />
    )}
  </>
)
```

---

## Considerações de performance

**Tempo estimado de processamento** (via WASM no celular):
- 30 segundos de vídeo → ~20–40s de processamento
- 1 minuto → ~40–80s
- 3 minutos → ~2–4 min

O `-preset ultrafast` é essencial para manter o tempo razoável no celular. Qualidade ainda é boa.

**Primeira execução** vai baixar os arquivos WASM (~30MB). As execuções seguintes são instantâneas pois o browser faz cache.

**Se o FFmpeg falhar** (memória insuficiente, etc.), o código tem fallback automático que entrega o arquivo bruto sem processamento — o usuário não fica sem o vídeo.

---

## Checklist

- [ ] `@ffmpeg/ffmpeg` e `@ffmpeg/util` instalados
- [ ] `src/lib/ffmpeg.ts` criado
- [ ] `useMediaRecorder` exporta `processing` e `processingProgress`
- [ ] `DownloadBanner` mostra barra de progresso durante processamento
- [ ] Botão Gravar desabilitado durante processamento
- [ ] Fallback implementado no `catch` do processamento
- [ ] Teste: grave 15s, pare, aguarde o processamento, baixe e verifique qualidade do áudio