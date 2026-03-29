import type { Format } from '@/types'

const BASE_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'anthropic/claude-sonnet-4-5'

function getApiKey(): string {
  const key = import.meta.env.OPENROUTER_API_KEY ?? import.meta.env.VITE_OPENROUTER_API_KEY
  if (!key) throw new Error('OpenRouter API key não configurada no .env')
  return key
}

const SYSTEM_PROMPT = `Você é um especialista em roteiros para criadores de conteúdo digital.
Seus roteiros são diretos, envolventes e seguem a estrutura: gancho → desenvolvimento → CTA.
Escreva sempre em português brasileiro, em tom conversacional, otimizado para leitura em teleprompter.
Responda apenas com o conteúdo solicitado, sem comentários, prefácios ou explicações.`

async function streamOpenRouter(
  messages: { role: string; content: string }[],
  onChunk: (text: string) => void,
  maxTokens = 1024,
): Promise<void> {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getApiKey()}`,
      'HTTP-Referer': window.location.origin,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      stream: true,
      system: SYSTEM_PROMPT,
      messages,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Erro desconhecido' } }))
    throw new Error(error.error?.message ?? `Erro na API OpenRouter (${response.status})`)
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
      const data = line.slice(6).trim()
      if (data === '[DONE]') continue
      try {
        const parsed = JSON.parse(data)
        const text = parsed.choices?.[0]?.delta?.content
        if (text) onChunk(text)
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

  await streamOpenRouter([{
    role: 'user',
    content: `Crie um roteiro para vídeo com as seguintes características:
- Tema: ${params.topic}
- Formato: ${formatLabel}
- Tom de voz: ${params.tone}
- Duração aproximada: ${durationLabel}
- Público-alvo: ${params.targetAudience}

Escreva apenas o texto do roteiro, sem introdução ou explicações. O roteiro deve ser natural para ser lido em voz alta como teleprompter.`,
  }], onChunk)
}

export async function improveScript(params: {
  currentScript: string
  instruction: string
}, onChunk: (text: string) => void): Promise<void> {
  await streamOpenRouter([{
    role: 'user',
    content: `Melhore o seguinte roteiro conforme a instrução abaixo:

ROTEIRO ATUAL:
${params.currentScript}

INSTRUÇÃO:
${params.instruction}

Escreva apenas o roteiro melhorado, sem comentários ou explicações.`,
  }], onChunk)
}

export async function applyHookOrCTA(params: {
  currentScript: string
  text: string
  type: 'hook' | 'cta'
}, onChunk: (text: string) => void): Promise<void> {
  const typeLabel = params.type === 'hook' ? 'gancho de abertura' : 'CTA de fechamento'
  const placement = params.type === 'hook'
    ? 'substitua ou reescreva o início do roteiro usando este gancho, mantendo o restante do conteúdo'
    : 'substitua ou reescreva o final do roteiro usando este CTA, mantendo o restante do conteúdo'

  await streamOpenRouter([{
    role: 'user',
    content: `Você vai incorporar um ${typeLabel} ao roteiro abaixo de forma natural e coesa.

ROTEIRO ATUAL:
${params.currentScript}

${typeLabel.toUpperCase()} A APLICAR:
${params.text}

Instrução: ${placement}. O resultado final deve soar fluido, como se o roteiro já tivesse sido escrito assim. Retorne apenas o roteiro completo reescrito, sem comentários ou explicações.`,
  }], onChunk, 1024)
}

export async function suggestHooksAndCTAs(params: {
  scriptContent: string
  format: Format
}, onChunk: (text: string) => void): Promise<void> {
  const formatLabel = params.format === 'reels' ? 'Reels/Stories' : 'YouTube'

  await streamOpenRouter([{
    role: 'user',
    content: `Com base no roteiro abaixo para ${formatLabel}, sugira exatamente 3 ganchos de abertura e 3 CTAs (chamadas para ação) de fechamento.

ROTEIRO:
${params.scriptContent}

Responda EXATAMENTE neste formato JSON (sem markdown, sem código, apenas o JSON):
{
  "hooks": ["gancho 1", "gancho 2", "gancho 3"],
  "ctas": ["cta 1", "cta 2", "cta 3"]
}`,
  }], onChunk, 512)
}
