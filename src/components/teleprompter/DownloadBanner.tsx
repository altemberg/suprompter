import type { ProcessingProgress } from '@/lib/ffmpeg'

const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)

interface DownloadBannerProps {
  processing: boolean
  processingProgress: ProcessingProgress | null
  downloadUrl: string | null
  fileName: string | null
  onDiscard: () => void
}

export function DownloadBanner({
  processing,
  processingProgress,
  downloadUrl,
  fileName,
  onDiscard,
}: DownloadBannerProps) {

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      background: processing
        ? 'rgba(20, 20, 30, 0.97)'
        : 'rgba(22, 101, 52, 0.92)',
      backdropFilter: 'blur(8px)',
      padding: '16px 20px',
      paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '10px',
    }}>

      {processing ? (
        <>
          <p style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>
            {processingProgress?.message ?? 'Processando vídeo...'}
          </p>

          {/* Barra de progresso */}
          <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '99px', height: '4px', overflow: 'hidden', width: '100%', maxWidth: '320px' }}>
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
        <>
          <span style={{ fontWeight: 600, fontSize: '1rem', color: '#bbf7d0' }}>
            ✓ Gravação concluída e processada!
          </span>

          <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '400px' }}>
            <a
              href={downloadUrl || undefined}
              download={fileName || undefined}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 20px',
                minHeight: '44px',
                borderRadius: '24px',
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#fff',
                fontSize: '0.85rem',
                fontWeight: 500,
                cursor: 'pointer',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textDecoration: 'none',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {fileName ?? 'Baixar vídeo'}
            </a>

            <button
              onClick={onDiscard}
              style={{
                padding: '10px 16px',
                background: 'none',
                border: 'none',
                color: '#86efac',
                fontSize: '0.8rem',
                cursor: 'pointer',
                textDecoration: 'underline',
                minHeight: '44px',
              }}
            >
              Gravar novamente
            </button>
          </div>

          {isIOS && (
            <p style={{ fontSize: '0.78rem', color: '#86efac' }}>
              No iPhone: segure o vídeo e toque em "Salvar no dispositivo"
            </p>
          )}
        </>
      )}
    </div>
  )
}
