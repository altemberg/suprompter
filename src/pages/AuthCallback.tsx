import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Skeleton } from '@/components/ui/skeleton'

export function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.exchangeCodeForSession(window.location.search).then(() => {
      navigate('/', { replace: true })
    })
  }, [navigate])

  return (
    <div className="flex flex-col gap-4 p-8">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full" />
    </div>
  )
}
