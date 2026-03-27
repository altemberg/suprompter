import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTeleprompterStore } from '@/stores/useTeleprompterStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Eye, EyeOff } from 'lucide-react'

export function SettingsPage() {
  const navigate = useNavigate()
  const { signOut } = useAuthStore()
  const { speed, fontSize, setSpeed, setFontSize } = useTeleprompterStore()

  const [apiKey, setApiKey] = useState(() => localStorage.getItem('anthropic_api_key') ?? '')
  const [showKey, setShowKey] = useState(false)
  const [keySaved, setKeySaved] = useState(false)

  function handleSaveApiKey() {
    localStorage.setItem('anthropic_api_key', apiKey)
    setKeySaved(true)
    setTimeout(() => setKeySaved(false), 2000)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Configurações</h1>

      {/* API Key */}
      <Card>
        <CardHeader>
          <CardTitle>Anthropic API Key</CardTitle>
          <CardDescription>Necessária para usar o assistente IA</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type={showKey ? 'text' : 'password'}
                placeholder="sk-ant-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowKey((v) => !v)}
              >
                {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <Button onClick={handleSaveApiKey}>
              {keySaved ? 'Salvo!' : 'Salvar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Configurações do teleprompter */}
      <Card>
        <CardHeader>
          <CardTitle>Teleprompter</CardTitle>
          <CardDescription>Configurações padrão de leitura</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Velocidade padrão</label>
              <span className="text-sm text-muted-foreground">{speed}x</span>
            </div>
            <Slider
              min={1}
              max={10}
              step={1}
              value={speed}
              onValueChange={(v) => setSpeed(v as number)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Tamanho de fonte padrão</label>
              <span className="text-sm text-muted-foreground">{fontSize}px</span>
            </div>
            <Slider
              min={24}
              max={72}
              step={2}
              value={fontSize}
              onValueChange={(v) => setFontSize(v as number)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Zona de perigo */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Zona de perigo</CardTitle>
        </CardHeader>
        <CardContent>
          <Separator className="mb-4" />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Sair da conta</p>
              <p className="text-sm text-muted-foreground">Você será redirecionado para o login</p>
            </div>
            <Button variant="destructive" onClick={handleSignOut}>Sair</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
