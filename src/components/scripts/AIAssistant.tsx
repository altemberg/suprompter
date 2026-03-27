import { useState, useRef } from 'react'
import type { Format } from '@/types'
import { generateScript, improveScript, suggestHooksAndCTAs } from '@/lib/claude'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles, Wand2, Zap, Copy, CheckCircle } from 'lucide-react'

interface AIAssistantProps {
  currentScript: string
  format: Format
  onApply: (text: string) => void
}

interface HooksData {
  hooks: string[]
  ctas: string[]
}

export function AIAssistant({ currentScript, format, onApply }: AIAssistantProps) {
  // Estado da aba Gerar
  const [genTopic, setGenTopic] = useState('')
  const [genAudience, setGenAudience] = useState('')
  const [genDuration, setGenDuration] = useState('60')
  const [genTone, setGenTone] = useState('Descontraído')
  const [genResult, setGenResult] = useState('')
  const [genLoading, setGenLoading] = useState(false)
  const [genError, setGenError] = useState('')

  // Estado da aba Melhorar
  const [improveInstruction, setImproveInstruction] = useState('')
  const [improveResult, setImproveResult] = useState('')
  const [improveLoading, setImproveLoading] = useState(false)
  const [improveError, setImproveError] = useState('')

  // Estado da aba Ganchos
  const [hooksData, setHooksData] = useState<HooksData | null>(null)
  const [hooksLoading, setHooksLoading] = useState(false)
  const [hooksError, setHooksError] = useState('')
  const hooksRawRef = useRef('')

  // Estados de cópia
  const [copiedItem, setCopiedItem] = useState<string | null>(null)

  async function handleGenerate() {
    if (!genTopic.trim()) return
    setGenLoading(true)
    setGenResult('')
    setGenError('')
    try {
      await generateScript(
        { topic: genTopic, format, tone: genTone, duration: parseInt(genDuration), targetAudience: genAudience },
        (chunk) => setGenResult((prev) => prev + chunk)
      )
    } catch (e) {
      setGenError(e instanceof Error ? e.message : 'Erro ao gerar roteiro')
    } finally {
      setGenLoading(false)
    }
  }

  async function handleImprove() {
    if (!improveInstruction.trim() || !currentScript.trim()) return
    setImproveLoading(true)
    setImproveResult('')
    setImproveError('')
    try {
      await improveScript(
        { currentScript, instruction: improveInstruction },
        (chunk) => setImproveResult((prev) => prev + chunk)
      )
    } catch (e) {
      setImproveError(e instanceof Error ? e.message : 'Erro ao melhorar roteiro')
    } finally {
      setImproveLoading(false)
    }
  }

  async function handleHooks() {
    if (!currentScript.trim()) return
    setHooksLoading(true)
    setHooksData(null)
    setHooksError('')
    hooksRawRef.current = ''
    try {
      await suggestHooksAndCTAs(
        { scriptContent: currentScript, format },
        (chunk) => { hooksRawRef.current += chunk }
      )
      const parsed = JSON.parse(hooksRawRef.current) as HooksData
      setHooksData(parsed)
    } catch (e) {
      setHooksError(e instanceof Error ? e.message : 'Erro ao gerar sugestões')
    } finally {
      setHooksLoading(false)
    }
  }

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text)
    setCopiedItem(text)
    setTimeout(() => setCopiedItem(null), 2000)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Sparkles className="size-4" /> Assistente IA
        </h2>
        <p className="text-sm text-muted-foreground">Claude Sonnet</p>
      </div>

      <Tabs defaultValue="generate" className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="generate" className="text-xs">Gerar</TabsTrigger>
          <TabsTrigger value="improve" className="text-xs">Melhorar</TabsTrigger>
          <TabsTrigger value="hooks" className="text-xs">Ganchos</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="flex-1 space-y-3 mt-4">
          <div className="space-y-2">
            <Input
              placeholder="Tema / assunto"
              value={genTopic}
              onChange={(e) => setGenTopic(e.target.value)}
            />
            <Input
              placeholder="Público-alvo"
              value={genAudience}
              onChange={(e) => setGenAudience(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                value={genDuration}
                onChange={(e) => setGenDuration(e.target.value)}
              >
                <option value="30">30 segundos</option>
                <option value="60">60 segundos</option>
                <option value="90">90 segundos</option>
                <option value="180">3 minutos</option>
              </select>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                value={genTone}
                onChange={(e) => setGenTone(e.target.value)}
              >
                {['Descontraído', 'Profissional', 'Inspirador', 'Humorístico', 'Educativo'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <Button className="w-full" onClick={handleGenerate} disabled={genLoading || !genTopic.trim()}>
            <Wand2 className="size-4 mr-2" />
            {genLoading ? 'Gerando...' : 'Gerar Roteiro'}
          </Button>

          {genError && <p className="text-sm text-destructive">{genError}</p>}

          {genResult && (
            <div className="space-y-2">
              <Textarea
                value={genResult}
                readOnly
                className="min-h-32 text-sm resize-none"
              />
              {!genLoading && (
                <Button variant="outline" size="sm" className="w-full" onClick={() => onApply(genResult)}>
                  Aplicar ao editor
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="improve" className="flex-1 space-y-3 mt-4">
          {currentScript && (
            <div className="rounded-md border p-3 text-sm text-muted-foreground">
              {currentScript.slice(0, 200)}{currentScript.length > 200 ? '...' : ''}
            </div>
          )}

          <Textarea
            placeholder="O que você quer mudar? Ex: deixa mais direto, adiciona mais energia..."
            value={improveInstruction}
            onChange={(e) => setImproveInstruction(e.target.value)}
            className="min-h-20"
          />

          <Button
            className="w-full"
            onClick={handleImprove}
            disabled={improveLoading || !improveInstruction.trim() || !currentScript.trim()}
          >
            <Zap className="size-4 mr-2" />
            {improveLoading ? 'Melhorando...' : 'Melhorar'}
          </Button>

          {improveError && <p className="text-sm text-destructive">{improveError}</p>}

          {improveResult && (
            <div className="space-y-2">
              <Textarea
                value={improveResult}
                readOnly
                className="min-h-32 text-sm resize-none"
              />
              {!improveLoading && (
                <Button variant="outline" size="sm" className="w-full" onClick={() => onApply(improveResult)}>
                  Aplicar ao editor
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="hooks" className="flex-1 space-y-3 mt-4">
          <Button
            className="w-full"
            onClick={handleHooks}
            disabled={hooksLoading || !currentScript.trim()}
          >
            <Sparkles className="size-4 mr-2" />
            {hooksLoading ? 'Gerando...' : 'Gerar sugestões'}
          </Button>

          {hooksError && <p className="text-sm text-destructive">{hooksError}</p>}

          {hooksData && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Ganchos de abertura</p>
                <div className="space-y-2">
                  {hooksData.hooks.map((hook, i) => (
                    <Card key={i} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => copyToClipboard(hook)}>
                      <CardContent className="flex items-start gap-2 p-3">
                        <p className="text-sm flex-1">{hook}</p>
                        {copiedItem === hook
                          ? <CheckCircle className="size-4 text-green-500 shrink-0 mt-0.5" />
                          : <Copy className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                        }
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">CTAs de fechamento</p>
                <div className="space-y-2">
                  {hooksData.ctas.map((cta, i) => (
                    <Card key={i} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => copyToClipboard(cta)}>
                      <CardContent className="flex items-start gap-2 p-3">
                        <p className="text-sm flex-1">{cta}</p>
                        {copiedItem === cta
                          ? <CheckCircle className="size-4 text-green-500 shrink-0 mt-0.5" />
                          : <Copy className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                        }
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
