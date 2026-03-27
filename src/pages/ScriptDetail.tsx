import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Script } from '@/types'
import { ScriptEditor } from '@/components/scripts/ScriptEditor'
import { AIAssistant } from '@/components/scripts/AIAssistant'
import { Skeleton } from '@/components/ui/skeleton'

export function ScriptDetail() {
  const { id } = useParams<{ id: string }>()
  const [script, setScript] = useState<Script | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    let cancelled = false

    supabase
      .from('scripts')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (!cancelled) {
          setScript(data as Script)
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [id])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!script) return <p className="text-muted-foreground">Roteiro não encontrado.</p>

  function handleUpdate(updates: Partial<Script>) {
    setScript((prev) => prev ? { ...prev, ...updates } : prev)
  }

  function handleApplyFromAI(text: string) {
    setScript((prev) => prev ? { ...prev, content: text } : prev)
  }

  return (
    <div className="h-full flex gap-6">
      {/* Editor — 60% */}
      <div className="flex-[6] min-w-0 flex flex-col">
        <ScriptEditor script={script} onUpdate={handleUpdate} />
      </div>

      {/* Assistente IA — 40% */}
      <div className="flex-[4] min-w-0 border-l pl-6 overflow-y-auto">
        <AIAssistant
          currentScript={script.content}
          format={script.format}
          onApply={handleApplyFromAI}
        />
      </div>
    </div>
  )
}
