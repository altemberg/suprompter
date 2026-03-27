import type { Format } from '@/types'

const BASE_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-20250514'

function getApiKey(): string {
  const key = localStorage.getItem('anthropic_api_key')
  if (!key) throw new Error('Anthropic API key não configurada. Acesse Configurações.')
  return key
}

// Helper privado para chamadas com streaming
async function streamClaude(
  payload: object,
  onChunk: (text: string) => void
): Promise<void> {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': getApiKey(),
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ ...payload, stream: true }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Erro desconhecido' } }))
    throw new Error(error.error?.message ?? 'Erro na API da Anthropic')
  }

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value)
    const lines = chunk.split('\n')

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6)
      if (data === '[DONE]') continue
      try {
        const parsed = JSON.parse(data)
        if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
          onChunk(parsed.delta.text)
        }
      } catch {
        // ignora erros de parse
      }
    }
  }
}

export async function generateScript(params: {
  topic: string
  format: Format
  tone: string
  duration: number
  targetAudience: string
}, onChunk: (text: string) => void): Promise<void> {
  const formatLabel = params.format === 'reels' ? 'Reels/Stories (vertical)' : 'YouTube (horizontal)'
  const durationLabel = params.duration < 60 ? `${params.duration} segundos` : `${params.duration / 60} minutos`

  await streamClaude({
    model: MODEL,
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Crie um roteiro para vídeo com as seguintes características:
- Tema: ${params.topic}
- Formato: ${formatLabel}
- Tom de voz: ${params.tone}
- Duração aproximada: ${durationLabel}
- Público-alvo: ${params.targetAudience}

Escreva apenas o texto do roteiro, sem introdução ou explicações. O roteiro deve ser natural para ser lido em voz alta como teleprompter.`
    }]
  }, onChunk)
}

export async function improveScript(params: {
  currentScript: string
  instruction: string
}, onChunk: (text: string) => void): Promise<void> {
  await streamClaude({
    model: MODEL,
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Melhore o seguinte roteiro conforme a instrução abaixo:

ROTEIRO ATUAL:
${params.currentScript}

INSTRUÇÃO:
${params.instruction}

Escreva apenas o roteiro melhorado, sem comentários ou explicações.`
    }]
  }, onChunk)
}

export async function suggestHooksAndCTAs(params: {
  scriptContent: string
  format: Format
}, onChunk: (text: string) => void): Promise<void> {
  const formatLabel = params.format === 'reels' ? 'Reels/Stories' : 'YouTube'

  await streamClaude({
    model: MODEL,
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `Com base no roteiro abaixo para ${formatLabel}, sugira exatamente 3 ganchos de abertura e 3 CTAs (chamadas para ação) de fechamento.

ROTEIRO:
${params.scriptContent}

Responda EXATAMENTE neste formato JSON (sem markdown, sem código, apenas o JSON):
{
  "hooks": ["gancho 1", "gancho 2", "gancho 3"],
  "ctas": ["cta 1", "cta 2", "cta 3"]
}`
    }]
  }, onChunk)
}
