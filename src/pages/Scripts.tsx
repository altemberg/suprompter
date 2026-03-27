import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import type { Script, Format } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Search, FileText, ChevronRight } from 'lucide-react'

export function Scripts() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [scripts, setScripts] = useState<Script[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [formatFilter, setFormatFilter] = useState<Format | 'all'>('all')

  useEffect(() => {
    if (!user) return
    let cancelled = false

    supabase
      .from('scripts')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .then(({ data }) => {
        if (!cancelled) {
          setScripts((data as Script[]) ?? [])
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [user])

  async function createScript() {
    const { data, error } = await supabase
      .from('scripts')
      .insert({
        user_id: user!.id,
        title: 'Rascunho',
        content: '',
        format: 'reels',
        tone: 'Descontraído',
        tags: [],
      })
      .select()
      .single()

    if (!error && data) navigate(`/roteiros/${data.id}`)
  }

  const filtered = scripts.filter((s) => {
    const matchesFormat = formatFilter === 'all' || s.format === formatFilter
    const matchesSearch = s.title.toLowerCase().includes(search.toLowerCase())
    return matchesFormat && matchesSearch
  })

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Roteiros</h1>
        <Button onClick={createScript}>
          <Plus className="size-4 mr-2" /> Novo Roteiro
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar roteiros..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'reels', 'youtube'] as const).map((f) => (
            <Badge
              key={f}
              variant={formatFilter === f ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setFormatFilter(f)}
            >
              {f === 'all' ? 'Todos' : f === 'reels' ? 'Reels' : 'YouTube'}
            </Badge>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-12 text-center">
            <FileText className="size-10 text-muted-foreground" />
            <p className="font-medium">Nenhum roteiro encontrado</p>
            <Button size="sm" onClick={createScript}>Criar roteiro</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((script) => (
            <Card
              key={script.id}
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => navigate(`/roteiros/${script.id}`)}
            >
              <CardContent className="flex items-center justify-between p-4">
                <div className="min-w-0 space-y-1">
                  <p className="font-medium truncate">{script.title}</p>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-xs">{script.format}</Badge>
                    <span className="text-xs text-muted-foreground">{script.tone}</span>
                  </div>
                </div>
                <ChevronRight className="size-4 text-muted-foreground shrink-0 ml-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
