import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import type { Script, Recording } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { FileText, Video, Plus, ChevronRight } from 'lucide-react'

export function Dashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [recentScripts, setRecentScripts] = useState<Script[]>([])
  const [scriptCount, setScriptCount] = useState(0)
  const [recordingCount, setRecordingCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let cancelled = false

    async function fetchData() {
      const [scriptsRes, countRes, recordingsRes] = await Promise.all([
        supabase
          .from('scripts')
          .select('*')
          .eq('user_id', user!.id)
          .order('updated_at', { ascending: false })
          .limit(3),
        supabase.from('scripts').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
        supabase.from('recordings').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
      ])

      if (!cancelled) {
        setRecentScripts((scriptsRes.data as Script[]) ?? [])
        setScriptCount(countRes.count ?? 0)
        setRecordingCount(recordingsRes.count ?? 0)
        setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [user])

  async function createNewScript() {
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

    if (!error && data) {
      navigate(`/roteiros/${data.id}`)
    }
  }

  // Recording type used for count only; suppress unused warning
  void (0 as unknown as Recording)

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Início</h1>
        <p className="text-muted-foreground">Bem-vindo de volta!</p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Roteiros</CardDescription>
            {loading ? <Skeleton className="h-8 w-12" /> : <CardTitle className="text-3xl">{scriptCount}</CardTitle>}
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Gravações</CardDescription>
            {loading ? <Skeleton className="h-8 w-12" /> : <CardTitle className="text-3xl">{recordingCount}</CardTitle>}
          </CardHeader>
        </Card>
      </div>

      {/* Ações rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={createNewScript}>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-primary/10 p-3">
              <Plus className="size-5" />
            </div>
            <div>
              <p className="font-medium">Novo Roteiro</p>
              <p className="text-sm text-muted-foreground">Criar e editar com IA</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate('/teleprompter')}>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-primary/10 p-3">
              <Video className="size-5" />
            </div>
            <div>
              <p className="font-medium">Abrir Teleprompter</p>
              <p className="text-sm text-muted-foreground">Gravar com câmera</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Roteiros recentes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Roteiros recentes</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/roteiros')}>
            Ver todos <ChevronRight className="size-4 ml-1" />
          </Button>
        </div>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : recentScripts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
              <FileText className="size-8 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhum roteiro ainda</p>
              <Button size="sm" onClick={createNewScript}>Criar primeiro roteiro</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentScripts.map((script) => (
              <Card
                key={script.id}
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => navigate(`/roteiros/${script.id}`)}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{script.title}</p>
                    <p className="text-sm text-muted-foreground">{script.format} · {script.tone}</p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
