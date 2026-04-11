interface ScrollingTextProps {
  script: string
  fontSize: number
  scrollRef: React.RefObject<HTMLDivElement | null>
  onDragStart: (clientY: number) => void
  onDragMove: (clientY: number) => void
  onDragEnd: () => void
}

export function ScrollingText({ script, fontSize, scrollRef, onDragStart, onDragMove, onDragEnd }: ScrollingTextProps) {
  return (
    <div style={styles.zone}>
      <div
        ref={scrollRef}
        style={styles.scroll}
        onTouchStart={e => onDragStart(e.touches[0].clientY)}
        onTouchMove={e => { e.preventDefault(); onDragMove(e.touches[0].clientY) }}
        onTouchEnd={onDragEnd}
        onMouseDown={e => onDragStart(e.clientY)}
        onMouseMove={e => { if (e.buttons === 1) onDragMove(e.clientY) }}
        onMouseUp={onDragEnd}
        onMouseLeave={onDragEnd}
      >
        <div style={styles.spacer} />
        <p style={{ ...styles.text, fontSize: `${fontSize}px` }}>{script}</p>
        <div style={styles.spacer} />
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  zone: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '38%',
    display: 'flex',
    justifyContent: 'center',
    pointerEvents: 'none',
    zIndex: 10,
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 70%, transparent 100%)',
  },
  scroll: {
    width: '65%',
    overflowY: 'hidden',
    overflowX: 'hidden',
    scrollbarWidth: 'none',
    pointerEvents: 'auto',
    touchAction: 'none',
    cursor: 'grab',
    userSelect: 'none',
    WebkitUserSelect: 'none',
  },
  spacer: {
    height: '100%',
  },
  text: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    color: '#ffffff',
    lineHeight: 1.55,
    textAlign: 'center',
    whiteSpace: 'pre-wrap',
    userSelect: 'none',
  },
}
