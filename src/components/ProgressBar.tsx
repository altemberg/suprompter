interface ProgressBarProps {
  progress: number
}

export function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div style={styles.track}>
      <div style={{ ...styles.fill, width: `${progress * 100}%` }} />
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  track: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: 'rgba(255,255,255,0.1)',
    zIndex: 50,
  },
  fill: {
    height: '100%',
    background: 'var(--text-primary)',
    transition: 'width 0.1s linear',
  },
}
