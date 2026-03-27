import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import type { Recording } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Film, Video } from 'lucide-react'

function formatDuration(seconds: number | null): string {
  if (seconds === null) return '--:--'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function Recordings() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let cancelled = false

    supabase
      .from('recordings')
      .select('*')
      .eq('user_id', user.id)
      .order('recorded_at', { ascending: false })
      .then(({ data }) => {
        if (!cancelled) {
          setRecordings((data as Recording[]) ?? [])
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [user])

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">Gravações</h1>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : recordings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <Film className="size-12 text-muted-foreground" />
            <p className="font-medium">Nenhuma gravação ainda</p>
            <p className="text-sm text-muted-foreground">Abra o teleprompter e grave seu primeiro vídeo</p>
            <Button onClick={() => navigate('/teleprompter')}>
              <Video className="size-4 mr-2" />
              Ir ao Teleprompter
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {recordings.map((rec) => (
            <Card key={rec.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="space-y-1 min-w-0">
                  <p className="font-medium truncate">{rec.title ?? 'Sem título'}</p>
                  <div className="flex gap-2 items-center">
                    {rec.format && <Badge variant="secondary" className="text-xs">{rec.format}</Badge>}
                    <span className="text-xs text-muted-foreground">{formatDuration(rec.duration_seconds)}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(rec.recorded_at)}</span>
                  </div>
                </div>
                {rec.script_id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/teleprompter?scriptId=${rec.script_id}`)}
                  >
                    Regravar
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
