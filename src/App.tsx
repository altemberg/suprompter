import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuthStore } from '@/stores/useAuthStore'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'

import { Login } from '@/pages/Login'
import { AuthCallback } from '@/pages/AuthCallback'
import { Dashboard } from '@/pages/Dashboard'
import { Scripts } from '@/pages/Scripts'
import { ScriptDetail } from '@/pages/ScriptDetail'
import { TeleprompterPage } from '@/pages/TeleprompterPage'
import { Recordings } from '@/pages/Recordings'
import { SettingsPage } from '@/pages/Settings'

function AppRoutes() {
  const { initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <Routes>
      {/* Rotas públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Teleprompter — tela cheia, sem sidebar */}
      <Route
        path="/teleprompter"
        element={
          <ProtectedRoute>
            <TeleprompterPage />
          </ProtectedRoute>
        }
      />

      {/* Rotas protegidas com layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/roteiros"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Scripts />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/roteiros/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ScriptDetail />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/gravacoes"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Recordings />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/configuracoes"
        element={
          <ProtectedRoute>
            <AppLayout>
              <SettingsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
