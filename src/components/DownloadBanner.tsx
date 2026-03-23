const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

interface DownloadBannerProps {
  downloadUrl: string
  filename: string
  onDiscard: () => void
}

export function DownloadBanner({ downloadUrl, filename, onDiscard }: DownloadBannerProps) {
  return (
    <div style={styles.banner}>
      <span style={styles.title}>Gravação concluída!</span>

      {isIOS ? (
        <div style={styles.iosHint}>
          <a href={downloadUrl} target="_blank" rel="noreferrer" style={styles.downloadBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {filename}
          </a>
          <span style={styles.hint}>Segure o vídeo e toque em "Salvar"</span>
        </div>
      ) : (
        <a href={downloadUrl} download={filename} style={styles.downloadBtn}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {filename}
        </a>
      )}

      <button onClick={onDiscard} style={styles.discardBtn}>
        Descartar e gravar novamente
      </button>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  banner: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    padding: '16px 20px',
    background: 'rgba(22, 101, 52, 0.88)',
    backdropFilter: 'blur(8px)',
    zIndex: 40,
    animation: 'fadeIn 0.3s ease',
  },
  title: {
    fontWeight: 600,
    fontSize: '1rem',
    color: '#bbf7d0',
  },
  downloadBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    borderRadius: '24px',
    background: 'rgba(255,255,255,0.15)',
    border: '1px solid rgba(255,255,255,0.3)',
    color: '#fff',
    fontSize: '0.85rem',
    fontWeight: 500,
    textDecoration: 'none',
    maxWidth: '90vw',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  iosHint: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
  },
  hint: {
    fontSize: '0.78rem',
    color: '#86efac',
  },
  discardBtn: {
    background: 'none',
    border: 'none',
    color: '#86efac',
    fontSize: '0.8rem',
    cursor: 'pointer',
    textDecoration: 'underline',
    padding: '4px',
  },
}
