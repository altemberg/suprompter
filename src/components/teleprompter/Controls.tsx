import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'

const SPEED_OPTIONS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]
const FONT_OPTIONS = [24, 28, 32, 36, 40, 48, 56, 64, 72, 80, 96]

interface ScriptOption {
  id: string
  title: string
}

interface ControlsProps {
  isPlaying: boolean
  isRecording: boolean
  downloadUrl: string | null
  filename: string | null
  speed: number
  fontSize: number
  visible: boolean
  scripts: ScriptOption[]
  currentScriptId: string | null
  onTogglePlay: () => void
  onToggleRecord: () => void
  onReset: () => void
  onReRecord: () => void
  onSpeedChange: (speed: number) => void
  onFontSizeChange: (size: number) => void
  onSelectScript: (id: string) => void
  onBack: () => void
}

export function Controls({
  isPlaying,
  isRecording,
  downloadUrl,
  filename,
  speed,
  fontSize,
  visible,
  scripts,
  currentScriptId,
  onTogglePlay,
  onToggleRecord,
  onReset,
  onReRecord,
  onSpeedChange,
  onFontSizeChange,
  onSelectScript,
  onBack,
}: ControlsProps) {
  return (
    <div
      style={{
        ...styles.bar,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'all' : 'none',
      }}
    >
      {/* Row 1: selects (hidden while recording) */}
      {!isRecording && (
        <div style={styles.selectRow}>
          {/* Script selector */}
          <div style={styles.selectGroup}>
            <span style={styles.selectLabel}>Roteiro</span>
            <Select
              value={currentScriptId ?? ''}
              onValueChange={(v) => { if (v) onSelectScript(v) }}
            >
              <SelectTrigger className="h-8 min-w-[160px] max-w-[220px] bg-white/10 border-white/20 text-white/80 text-xs rounded-lg">
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentScriptId
                    ? (scripts.find((s) => s.id === currentScriptId)?.title || 'Sem título')
                    : 'Selecionar roteiro'}
                </span>
              </SelectTrigger>
              <SelectContent side="top">
                {scripts.length === 0 ? (
                  <SelectItem value="__none" disabled>Nenhum roteiro salvo</SelectItem>
                ) : (
                  scripts.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.title || 'Sem título'}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Speed */}
          <div style={styles.selectGroup}>
            <span style={styles.selectLabel}>Velocidade</span>
            <Select value={String(speed)} onValueChange={(v) => onSpeedChange(Number(v))}>
              <SelectTrigger className="h-8 w-[88px] bg-white/10 border-white/20 text-white/80 text-xs rounded-lg">
                <span>{speed}x</span>
              </SelectTrigger>
              <SelectContent side="top">
                {SPEED_OPTIONS.map((v) => (
                  <SelectItem key={v} value={String(v)}>{v}x</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Font size */}
          <div style={styles.selectGroup}>
            <span style={styles.selectLabel}>Fonte</span>
            <Select value={String(fontSize)} onValueChange={(v) => onFontSizeChange(Number(v))}>
              <SelectTrigger className="h-8 w-[88px] bg-white/10 border-white/20 text-white/80 text-xs rounded-lg">
                <span>{fontSize}px</span>
              </SelectTrigger>
              <SelectContent side="top">
                {FONT_OPTIONS.map((v) => (
                  <SelectItem key={v} value={String(v)}>{v}px</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Row 2: action buttons */}
      <div style={styles.btnRow}>
        {/* Back */}
        <button onClick={onBack} style={styles.iconBtn} title="Voltar (Esc)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Reset */}
        <button onClick={onReset} style={styles.iconBtn} title="Reiniciar texto">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 .49-3.1" />
          </svg>
        </button>

        {/* Play/Pause */}
        <button onClick={onTogglePlay} style={styles.primaryBtn} title="Play/Pause (Espaço)">
          {isPlaying ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
          <span>{isPlaying ? 'Pausar' : 'Play'}</span>
        </button>

        {/* Record / Stop */}
        <button
          onClick={onToggleRecord}
          style={{
            ...styles.primaryBtn,
            background: isRecording ? 'rgba(229,62,62,0.25)' : 'rgba(255,255,255,0.1)',
            border: isRecording ? '1px solid rgba(229,62,62,0.6)' : '1px solid transparent',
          }}
          title="Gravar (R)"
        >
          {isRecording ? (
            <>
              <span style={styles.recDot} />
              <span>Parar</span>
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--accent)">
                <circle cx="12" cy="12" r="8" />
              </svg>
              <span>Gravar</span>
            </>
          )}
        </button>

        {/* Re-record (only after recording is done) */}
        {downloadUrl && !isRecording && (
          <button onClick={onReRecord} style={styles.iconBtn} title="Regravar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
            </svg>
          </button>
        )}

        {/* Download */}
        {downloadUrl && filename && !isRecording && (
          <a href={downloadUrl} download={filename} style={styles.downloadBtn}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Baixar
          </a>
        )}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  bar: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '12px 20px 20px',
    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
    zIndex: 30,
    transition: 'opacity 0.3s ease',
  },
  selectRow: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  },
  selectGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  selectLabel: {
    fontSize: '10px',
    fontWeight: 500,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    color: 'rgba(255,255,255,0.4)',
    paddingLeft: '2px',
  },
  btnRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  iconBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.1)',
    color: 'var(--text-primary)',
    flexShrink: 0,
  },
  primaryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    padding: '10px 18px',
    minHeight: '44px',
    borderRadius: '24px',
    background: 'rgba(255,255,255,0.1)',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    fontWeight: 500,
    border: '1px solid transparent',
  },
  recDot: {
    display: 'inline-block',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: 'var(--accent)',
    animation: 'blink 1s ease-in-out infinite',
    flexShrink: 0,
  },
  downloadBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    padding: '10px 18px',
    minHeight: '44px',
    borderRadius: '24px',
    background: 'rgba(56,161,105,0.2)',
    border: '1px solid rgba(56,161,105,0.5)',
    color: '#68d391',
    fontSize: '0.9rem',
    fontWeight: 500,
    textDecoration: 'none',
  },
}
