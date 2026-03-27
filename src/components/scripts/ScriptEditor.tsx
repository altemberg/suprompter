import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Script, Format } from '@/types'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Video } from 'lucide-react'

interface ScriptEditorProps {
  script: Script
  onUpdate: (updates: Partial<Script>) => void
}

const TONES = ['Descontraído', 'Profissional', 'Inspirador', 'Humorístico', 'Educativo']
const WORDS_PER_MINUTE = 130

export function ScriptEditor({ script, onUpdate }: ScriptEditorProps) {
  const navigate = useNavigate()
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const wordCount = script.content.trim()
    ? script.content.trim().split(/\s+/).length
    : 0
  const estimatedMinutes = wordCount > 0 ? (wordCount / WORDS_PER_MINUTE).toFixed(1) : '0'

  const debounceSave = useCallback((updates: Partial<Script>) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    setSaveStatus('saving')
    saveTimer.current = setTimeout(async () => {
      await supabase
        .from('scripts')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', script.id)
      setSaveStatus('saved')
    }, 1500)
  }, [script.id])

  function handleContentChange(content: string) {
    onUpdate({ content })
    debounceSave({ content })
  }

  function handleTitleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const title = e.target.value.trim() || 'Sem título'
    onUpdate({ title })
    debounceSave({ title })
  }

  function handleFormatChange(format: Format) {
    onUpdate({ format })
    debounceSave({ format })
  }

  function handleToneChange(tone: string) {
    onUpdate({ tone })
    debounceSave({ tone })
  }

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [])

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Linha do título */}
      <div className="flex items-center gap-3">
        <input
          className="flex-1 text-xl font-bold bg-transparent border-none outline-none focus:ring-0 placeholder:text-muted-foreground"
          defaultValue={script.title}
          placeholder="Título do roteiro"
          onBlur={handleTitleBlur}
        />
        <span className="text-xs text-muted-foreground min-w-fit">
          {saveStatus === 'saving' ? 'Salvando...' : saveStatus === 'saved' ? 'Salvo' : ''}
        </span>
      </div>

      {/* Linha de metadados */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex gap-2">
          {(['reels', 'youtube'] as Format[]).map((f) => (
            <Badge
              key={f}
              variant={script.format === f ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => handleFormatChange(f)}
            >
              {f === 'reels' ? 'Reels' : 'YouTube'}
            </Badge>
          ))}
        </div>
        <select
          className="h-7 rounded border border-input bg-background px-2 text-xs"
          value={script.tone}
          onChange={(e) => handleToneChange(e.target.value)}
        >
          {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Textarea */}
      <Textarea
        className="flex-1 min-h-64 resize-none text-base leading-relaxed font-serif"
        placeholder="Cole ou escreva o seu roteiro aqui..."
        value={script.content}
        onChange={(e) => handleContentChange(e.target.value)}
      />

      {/* Rodapé */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{wordCount} palavras · ~{estimatedMinutes} min</span>
        <Button
          onClick={() => navigate(`/teleprompter?scriptId=${script.id}`)}
          disabled={!script.content.trim()}
        >
          <Video className="size-4 mr-2" />
          Usar no Teleprompter
        </Button>
      </div>
    </div>
  )
}
