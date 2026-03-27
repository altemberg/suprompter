import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type State = 'idle' | 'loading' | 'sent' | 'error'

export function Login() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<State>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState('loading')
    setError('')

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (authError) {
      setError(authError.message)
      setState('error')
    } else {
      setState('sent')
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Suprompter</h1>
          <p className="text-muted-foreground">Entre com seu email para continuar</p>
        </div>

        {state === 'sent' ? (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-center">
            <p className="font-medium">Verifique seu email</p>
            <p className="text-sm text-muted-foreground mt-1">
              Enviamos um link de acesso para <strong>{email}</strong>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={state === 'loading'}
              />
            </div>

            {state === 'error' && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={state === 'loading'}>
              {state === 'loading' ? 'Enviando...' : 'Enviar link de acesso'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
