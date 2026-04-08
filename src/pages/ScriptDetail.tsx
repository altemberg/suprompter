import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Copy, Check, Loader2, Save, Video, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { generateScriptFromContext, parseRoteiro } from '@/lib/claude'
import { transcribeFromUrl } from '@/lib/whisper'
import type { Posicionamento, Objetivo } from '@/types'

function ScriptBlock({
  label, emoji, value, onChange, minHeight, accentColor, bgColor,
}: {
  label: string; emoji: string; value: string; onChange: (v: string) => void
  minHeight: number; accentColor: string; bgColor: string
}) {
  const [hovered, setHovered] = useState(false)
  const [copied, setCopied] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [value])

  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        background: hovered ? bgColor : 'transparent',
        border: `0.5px solid ${hovered ? accentColor.replace(/[\d.]+\)$/, '0.2)') : 'rgba(255,255,255,0.05)'}`,
        borderRadius: '12px',
        padding: '16px 20px 20px',
        transition: 'background 0.2s, border-color 0.2s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: accentColor }}>
          {emoji} {label}
        </span>
        <div style={{ display: 'flex', gap: '4px', opacity: hovered ? 1 : 0, transition: 'opacity 0.15s', pointerEvents: hovered ? 'auto' : 'none' }}>
          <button onClick={handleCopy} title="Copiar" style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: copied ? '#4ecda4' : 'rgba(255,255,255,0.5)' }}>
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </button>
          <button onClick={() => onChange('')} title="Limpar" style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)' }}>
            <X size={12} />
          </button>
        </div>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', minHeight: `${minHeight}px`,
          background: 'transparent', border: 'none', outline: 'none',
          resize: 'none', overflow: 'hidden',
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: '15px', lineHeight: '1.75',
          color: 'rgba(255,255,255,0.85)', padding: 0, letterSpacing: '0.01em',
        }}
      />
    </div>
  )
}

export function ScriptDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // ── Dados do roteiro ──
  const [title, setTitle] = useState('Novo Roteiro')
  const [format, setFormat] = useState<'reels' | 'youtube' | 'vsl'>('reels')
  const [objetivo, setObjetivo] = useState<Objetivo>('educar')
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [saving, setSaving] = useState(false)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Seção 1: Posicionamento ──
  const [posicionamentos, setPosicionamentos] = useState<Posicionamento[]>([])
  const [posicionamentoId, setPosicionamentoId] = useState<string | null>(null)

  // ── Seção 2: Vídeo de referência ──
  const [videoAtivo, setVideoAtivo] = useState(false)
  const [videoUrl, setVideoUrl] = useState('')
  const [transcricao, setTranscricao] = useState<string | null>(null)
  const [transcrevendo, setTranscrevendo] = useState(false)
  const [erroTranscricao, setErroTranscricao] = useState<string | null>(null)
  const [modalTranscricaoAberto, setModalTranscricaoAberto] = useState(false)

  // ── Seção 3: Informações extras ──
  const [informacoesExtras, setInformacoesExtras] = useState('')

  // ── Preview do roteiro ──
  const [gerando, setGerando] = useState(false)
  const [roteiroStream, setRoteiroStream] = useState('')
  const [gancho, setGancho] = useState('')
  const [desenvolvimento, setDesenvolvimento] = useState('')
  const [cta, setCta] = useState('')
  const [roteiroGerado, setRoteiroGerado] = useState(false)

  // ── Carrega posicionamentos e dados do roteiro ──
  useEffect(() => {
    supabase.from('posicionamentos').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setPosicionamentos(data ?? []))

    if (id && id !== 'novo') {
      supabase.from('scripts').select('*').eq('id', id).single()
        .then(({ data }) => {
          if (!data) return
          setTitle(data.title)
          setFormat(data.format)
          if (data.objetivo) setObjetivo(data.objetivo)
          setPosicionamentoId(data.posicionamento_id ?? null)
          setVideoUrl(data.video_url ?? '')
          setVideoAtivo(!!data.video_url)
          setTranscricao(data.transcricao ?? null)
          setInformacoesExtras(data.informacoes_extras ?? '')
          if (data.gancho || data.desenvolvimento || data.cta) {
            setGancho(data.gancho ?? '')
            setDesenvolvimento(data.desenvolvimento ?? '')
            setCta(data.cta ?? '')
            setRoteiroGerado(true)
          }
        })
    }
  }, [id])

  // ── Auto-save ──
  const salvar = useCallback(async (extras?: Record<string, unknown>) => {
    setSaving(true)
    const payload: Record<string, unknown> = {
      title,
      format,
      objetivo,
      posicionamento_id: posicionamentoId,
      video_url: videoAtivo ? videoUrl : null,
      transcricao,
      informacoes_extras: informacoesExtras,
      gancho,
      desenvolvimento,
      cta,
      updated_at: new Date().toISOString(),
      ...extras,
    }

    if (id && id !== 'novo') {
      await supabase.from('scripts').update(payload).eq('id', id)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { data } = await supabase.from('scripts').insert({
        ...payload,
        user_id: user?.id,
      }).select().single()
      if (data) navigate(`/roteiros/${data.id}`, { replace: true })
    }

    setSavedAt(new Date())
    setSaving(false)
  }, [title, format, objetivo, posicionamentoId, videoAtivo, videoUrl, transcricao, informacoesExtras, gancho, desenvolvimento, cta, id, navigate])

  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => salvar(), 2000)
  }, [salvar])

  // ── Transcrever vídeo ──
  const handleTranscrever = async () => {
    if (!videoUrl.trim()) return
    setTranscrevendo(true)
    setErroTranscricao(null)
    try {
      const result = await transcribeFromUrl(videoUrl.trim(), () => {})
      setTranscricao(result.text)
      triggerAutoSave()
    } catch (err: unknown) {
      setErroTranscricao(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setTranscrevendo(false)
    }
  }

  // ── Gerar roteiro ──
  const handleGerarRoteiro = async () => {
    const posicionamentoSelecionado = posicionamentos.find(p => p.id === posicionamentoId)
    setGerando(true)
    setRoteiroStream('')
    setGancho('')
    setDesenvolvimento('')
    setCta('')
    setRoteiroGerado(false)

    let textoCompleto = ''
    try {
      await generateScriptFromContext(
        {
          posicionamento: posicionamentoSelecionado?.descricao ?? null,
          transcricao,
          informacoesExtras,
          formato: format,
          objetivo,
        },
        (chunk) => {
          textoCompleto += chunk
          setRoteiroStream(textoCompleto)
        }
      )

      const parsed = parseRoteiro(textoCompleto)
      setGancho(parsed.gancho)
      setDesenvolvimento(parsed.desenvolvimento)
      setCta(parsed.cta)
      setRoteiroGerado(true)
      await salvar({ gancho: parsed.gancho, desenvolvimento: parsed.desenvolvimento, cta: parsed.cta })
    } catch (err: unknown) {
      console.error('Erro ao gerar roteiro:', err)
    } finally {
      setGerando(false)
    }
  }

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', background: '#0d0d0d' }}>

      {/* ══════════════════ COLUNA ESQUERDA ══════════════════ */}
      <div style={{
        width: '50%', overflowY: 'auto', padding: '32px 28px',
        borderRight: '0.5px solid rgba(255,255,255,0.07)',
        display: 'flex', flexDirection: 'column', gap: '8px',
      }}>

        {/* Título + formato */}
        <div style={{ marginBottom: '8px' }}>
          <input
            value={title}
            onChange={e => { setTitle(e.target.value); triggerAutoSave() }}
            style={{
              fontSize: '20px', fontWeight: 500, color: 'rgba(255,255,255,0.92)',
              background: 'none', border: 'none', outline: 'none', width: '100%',
              letterSpacing: '-0.3px', marginBottom: '8px',
            }}
            placeholder="Título do roteiro"
          />
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            {([
              { value: 'reels', label: 'Vídeo Curto' },
              { value: 'youtube', label: 'YouTube' },
              { value: 'vsl', label: 'VSL' },
            ] as const).map(f => (
              <button key={f.value} onClick={() => { setFormat(f.value); triggerAutoSave() }} style={{
                padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 500,
                border: '0.5px solid',
                background: format === f.value ? 'rgba(127,119,221,0.15)' : 'transparent',
                borderColor: format === f.value ? 'rgba(127,119,221,0.3)' : 'rgba(255,255,255,0.08)',
                color: format === f.value ? '#a9a3f0' : 'rgba(255,255,255,0.35)',
                cursor: 'pointer',
              }}>
                {f.label}
              </button>
            ))}
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', marginLeft: 'auto' }}>
              {saving ? 'Salvando...' : savedAt ? `Salvo às ${savedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : ''}
            </span>
          </div>

          {/* Objetivo */}
          <div style={{ marginTop: '14px' }}>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '8px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Objetivo do conteúdo
            </p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {([
                { value: 'educar', label: '📚 Educar' },
                { value: 'vender', label: '💰 Vender' },
                { value: 'autoridade', label: '🏆 Autoridade' },
                { value: 'viralizar', label: '🚀 Viralizar' },
              ] as const).map(o => (
                <button key={o.value} onClick={() => { setObjetivo(o.value); triggerAutoSave() }} style={{
                  padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 500,
                  border: '0.5px solid',
                  background: objetivo === o.value ? 'rgba(255,165,0,0.12)' : 'transparent',
                  borderColor: objetivo === o.value ? 'rgba(255,165,0,0.3)' : 'rgba(255,255,255,0.08)',
                  color: objetivo === o.value ? 'rgba(255,200,80,0.9)' : 'rgba(255,255,255,0.35)',
                  cursor: 'pointer',
                }}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── SEÇÃO 1: Posicionamento ── */}
        <div style={{ background: '#111', border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '20px' }}>
          <p style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'rgba(255,255,255,0.35)', marginBottom: '12px' }}>
            1. Posicionamento de Comunicação
          </p>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginBottom: '14px' }}>
            Selecione o contexto de comunicação para este roteiro. Configure seus posicionamentos em{' '}
            <span onClick={() => navigate('/configuracoes')} style={{ color: '#a9a3f0', cursor: 'pointer' }}>
              Configurações
            </span>.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => { setPosicionamentoId(null); triggerAutoSave() }}
              style={{
                padding: '10px 14px', borderRadius: '8px', textAlign: 'left',
                border: '0.5px solid',
                background: posicionamentoId === null ? 'rgba(255,255,255,0.05)' : 'transparent',
                borderColor: posicionamentoId === null ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.4)', fontSize: '13px', cursor: 'pointer',
              }}
            >
              Sem posicionamento específico
            </button>
            {posicionamentos.map(p => (
              <button
                key={p.id}
                onClick={() => { setPosicionamentoId(p.id); triggerAutoSave() }}
                style={{
                  padding: '10px 14px', borderRadius: '8px', textAlign: 'left',
                  border: '0.5px solid',
                  background: posicionamentoId === p.id ? 'rgba(127,119,221,0.12)' : 'transparent',
                  borderColor: posicionamentoId === p.id ? 'rgba(127,119,221,0.3)' : 'rgba(255,255,255,0.06)',
                  cursor: 'pointer',
                }}
              >
                <p style={{ fontSize: '13.5px', fontWeight: 500, color: posicionamentoId === p.id ? '#a9a3f0' : 'rgba(255,255,255,0.7)', marginBottom: '2px' }}>
                  {p.nome}
                </p>
                <p style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.3)', lineHeight: 1.4 }}>
                  {p.descricao.slice(0, 80)}{p.descricao.length > 80 ? '...' : ''}
                </p>
              </button>
            ))}
            {posicionamentos.length === 0 && (
              <button
                onClick={() => navigate('/configuracoes')}
                style={{
                  padding: '9px', background: 'transparent',
                  border: '1px dashed rgba(127,119,221,0.2)', borderRadius: '8px',
                  color: 'rgba(127,119,221,0.6)', fontSize: '12px', cursor: 'pointer',
                }}
              >
                + Criar posicionamentos em Configurações
              </button>
            )}
          </div>
        </div>

        {/* ── SEÇÃO 2: Vídeo de referência ── */}
        <div style={{ background: '#111', border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <p style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'rgba(255,255,255,0.35)' }}>
              2. Vídeo de Referência
            </p>
            <button
              onClick={() => {
                const next = !videoAtivo
                setVideoAtivo(next)
                if (!next) { setTranscricao(null); setVideoUrl('') }
              }}
              style={{
                width: '40px', height: '22px', borderRadius: '11px', border: 'none',
                background: videoAtivo ? 'rgba(127,119,221,0.6)' : 'rgba(255,255,255,0.1)',
                cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
              }}
            >
              <div style={{
                width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
                position: 'absolute', top: '3px',
                left: videoAtivo ? '21px' : '3px',
                transition: 'left 0.2s',
              }} />
            </button>
          </div>

          {!videoAtivo ? (
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)' }}>
              Ative para importar um conteúdo do Instagram ou YouTube como base para o roteiro.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  value={videoUrl}
                  onChange={e => setVideoUrl(e.target.value)}
                  placeholder="https://www.instagram.com/reel/... ou youtube.com/watch?v=..."
                  style={{
                    flex: 1, padding: '9px 12px', fontSize: '13px',
                    background: '#161616', border: '0.5px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px', color: 'white', outline: 'none',
                  }}
                />
                <button
                  onClick={handleTranscrever}
                  disabled={transcrevendo || !videoUrl.trim()}
                  style={{
                    padding: '9px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
                    background: 'rgba(127,119,221,0.15)', border: '0.5px solid rgba(127,119,221,0.3)',
                    color: '#a9a3f0', cursor: videoUrl.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap',
                    opacity: !videoUrl.trim() ? 0.5 : 1,
                  }}
                >
                  {transcrevendo
                    ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />
                    : <Video size={13} />}
                  {transcrevendo ? 'Transcrevendo...' : 'Transcrever'}
                </button>
              </div>

              {erroTranscricao && (
                <p style={{ fontSize: '12px', color: '#f09595' }}>{erroTranscricao}</p>
              )}

              {transcricao && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    flex: 1, padding: '8px 12px', background: 'rgba(29,158,117,0.1)',
                    border: '0.5px solid rgba(29,158,117,0.25)', borderRadius: '8px',
                    fontSize: '12px', color: '#4ecda4',
                  }}>
                    ✓ Transcrição disponível (~{Math.round(transcricao.split(' ').length)} palavras)
                  </div>
                  <button
                    onClick={() => setModalTranscricaoAberto(true)}
                    style={{
                      padding: '8px 14px', background: 'rgba(255,255,255,0.05)',
                      border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                      fontSize: '12px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Ver
                  </button>
                  <button
                    onClick={() => setTranscricao(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── SEÇÃO 3: Informações complementares ── */}
        <div style={{ background: '#111', border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '20px' }}>
          <p style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'rgba(255,255,255,0.35)', marginBottom: '6px' }}>
            3. Informações Complementares
          </p>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginBottom: '12px' }}>
            Adicione contexto, ideias, dados ou qualquer informação que queira incluir no roteiro.
          </p>
          <textarea
            value={informacoesExtras}
            onChange={e => { setInformacoesExtras(e.target.value); triggerAutoSave() }}
            placeholder="Ex: Quero falar sobre X assunto, mencionar meu produto Y, usar tom descontraído..."
            rows={5}
            style={{
              width: '100%', padding: '12px', fontSize: '13.5px', lineHeight: 1.6,
              background: '#161616', border: '0.5px solid rgba(255,255,255,0.08)',
              borderRadius: '8px', color: 'rgba(255,255,255,0.82)',
              outline: 'none', resize: 'vertical', fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Botão gerar roteiro */}
        <button
          onClick={handleGerarRoteiro}
          disabled={gerando}
          style={{
            padding: '14px', borderRadius: '10px', fontSize: '14px', fontWeight: 500,
            background: gerando ? 'rgba(127,119,221,0.1)' : 'rgba(127,119,221,0.2)',
            border: '0.5px solid rgba(127,119,221,0.35)',
            color: gerando ? 'rgba(255,255,255,0.3)' : '#a9a3f0',
            cursor: gerando ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'all 0.15s',
          }}
        >
          {gerando
            ? <><Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> Gerando roteiro...</>
            : '✨ Gerar Roteiro com IA'}
        </button>

        {roteiroGerado && (
          <button
            onClick={() => salvar()}
            disabled={saving}
            style={{
              padding: '11px', borderRadius: '10px', fontSize: '13px', fontWeight: 500,
              background: 'transparent', border: '0.5px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}
          >
            <Save size={13} />
            {saving ? 'Salvando...' : 'Salvar roteiro'}
          </button>
        )}
      </div>

      {/* ══════════════════ COLUNA DIREITA ══════════════════ */}
      <div style={{ width: '50%', overflowY: 'auto', padding: '32px 28px' }}>

        {!gerando && !roteiroGerado && (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', userSelect: 'none' }}>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.15)', textAlign: 'center', lineHeight: 1.6 }}>
              O roteiro será gerado aqui
            </p>
          </div>
        )}

        {gerando && !roteiroGerado && (
          <div style={{ background: '#111', border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Loader2 size={14} color="#a9a3f0" style={{ animation: 'spin 0.8s linear infinite' }} />
              <span style={{ fontSize: '13px', color: '#a9a3f0' }}>Gerando seu roteiro...</span>
            </div>
            <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'rgba(255,255,255,0.6)', whiteSpace: 'pre-wrap' }}>
              {roteiroStream}
              <span style={{ display: 'inline-block', width: '2px', height: '16px', background: '#a9a3f0', marginLeft: '2px', animation: 'blink 1s step-end infinite', verticalAlign: 'text-bottom' }} />
            </p>
          </div>
        )}

        {roteiroGerado && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => navigate(`/teleprompter?scriptId=${id}`)}
                style={{
                  padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
                  background: 'rgba(29,158,117,0.15)', border: '0.5px solid rgba(29,158,117,0.3)',
                  color: '#4ecda4', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}
              >
                <Video size={13} />
                Usar no Teleprompter
              </button>
            </div>

            <ScriptBlock
              label="Gancho" emoji="🎣"
              value={gancho}
              onChange={(v) => { setGancho(v); triggerAutoSave() }}
              minHeight={80}
              accentColor="rgba(160, 150, 255, 0.8)"
              bgColor="rgba(127, 119, 221, 0.07)"
            />
            <ScriptBlock
              label="Desenvolvimento" emoji="📖"
              value={desenvolvimento}
              onChange={(v) => { setDesenvolvimento(v); triggerAutoSave() }}
              minHeight={160}
              accentColor="rgba(160, 150, 255, 0.8)"
              bgColor="rgba(127, 119, 221, 0.07)"
            />
            <ScriptBlock
              label="Chamada para Ação" emoji="📣"
              value={cta}
              onChange={(v) => { setCta(v); triggerAutoSave() }}
              minHeight={80}
              accentColor="rgba(160, 150, 255, 0.8)"
              bgColor="rgba(127, 119, 221, 0.07)"
            />
          </div>
        )}
      </div>

      {/* ══════════════════ MODAL TRANSCRIÇÃO ══════════════════ */}
      {modalTranscricaoAberto && transcricao && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: '24px',
        }}>
          <div style={{
            background: '#161616', border: '0.5px solid rgba(255,255,255,0.1)',
            borderRadius: '16px', width: '100%', maxWidth: '600px',
            maxHeight: '80vh', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', borderBottom: '0.5px solid rgba(255,255,255,0.07)',
            }}>
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>
                Transcrição do vídeo
              </p>
              <button onClick={() => setModalTranscricaoAberto(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'rgba(255,255,255,0.75)', whiteSpace: 'pre-wrap' }}>
                {transcricao}
              </p>
            </div>
            <div style={{
              padding: '16px 20px', borderTop: '0.5px solid rgba(255,255,255,0.07)',
              display: 'flex', gap: '8px', justifyContent: 'flex-end',
            }}>
              <button
                onClick={() => { setTranscricao(null); setModalTranscricaoAberto(false) }}
                style={{
                  padding: '9px 18px', borderRadius: '8px', fontSize: '13px',
                  background: 'transparent', border: '0.5px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
                }}
              >
                Descartar
              </button>
              <button
                onClick={() => setModalTranscricaoAberto(false)}
                style={{
                  padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
                  background: 'rgba(127,119,221,0.15)', border: '0.5px solid rgba(127,119,221,0.3)',
                  color: '#a9a3f0', cursor: 'pointer',
                }}
              >
                Usar como base do roteiro
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes blink { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }
      `}</style>
    </div>
  )
}

export default ScriptDetail
