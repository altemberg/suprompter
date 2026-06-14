import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUserSettingsStore } from '@/stores/useUserSettingsStore'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminRoute } from '@/components/AdminRoute'

import { Login } from '@/pages/Login'
import { AuthCallback } from '@/pages/AuthCallback'
import { Dashboard } from '@/pages/Dashboard'
import { Scripts } from '@/pages/Scripts'
import { ScriptDetail } from '@/pages/ScriptDetail'
import { TeleprompterPage } from '@/pages/TeleprompterPage'
import { TeleTeste } from '@/pages/TeleTeste'
import { Recordings } from '@/pages/Recordings'
import { SettingsPage } from '@/pages/Settings'
import { Transcriber } from '@/pages/Transcriber'
import { ImportScript } from '@/pages/ImportScript'
import { AdminPage } from '@/pages/Admin'

function AppRoutes() {
  const { initialize, user } = useAuthStore()
  const loadApiKey = useUserSettingsStore(s => s.loadApiKey)

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (user) loadApiKey()
  }, [user, loadApiKey])

  return (
    <Routes>
      {/* Rotas públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<Login defaultMode="forgot" />} />
      <Route path="/update-password" element={<Login defaultMode="update" />} />
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

      {/* TeleTeste — tela cheia, sem sidebar */}
      <Route
        path="/teleteste"
        element={
          <ProtectedRoute>
            <TeleTeste />
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
        path="/roteiros/importar"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ImportScript />
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
        path="/transcritor"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Transcriber />
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
      <Route
        path="/superadmin"
        element={
          <AdminRoute>
            <AppLayout>
              <AdminPage />
            </AppLayout>
          </AdminRoute>
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
