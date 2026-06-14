import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/useAuthStore'
import { isAdmin } from '@/lib/admin'
import { Skeleton } from '@/components/ui/skeleton'

interface AdminRouteProps {
  children: React.ReactNode
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin(user)) return <Navigate to="/" replace />

  return <>{children}</>
}
