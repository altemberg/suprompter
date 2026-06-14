import type { Format } from '@/types'
import type { Provider } from '@/lib/admin'
import { getActiveApiKey, getActiveProvider } from '@/stores/useUserSettingsStore'

// Modelo de chat por provedor.
const CHAT_MODEL: Record<Provider, string> = {
  openrouter: 'anthropic/claude-sonnet-4-5',
  openai: 'gpt-4o',
  anthropic: 'claude-sonnet-4-6',
}

function getApiKey(): string {
  const key = getActiveApiKey()
  if (!key) throw new Error('API key não configurada. Peça ao admin para configurar a chave da sua conta.')
  return key
}

const SYSTEM_PROMPT = `Você é um especialista em criação de roteiros para produtores de conteúdo digital.
Sua tarefa é criar um roteiro estruturado em exatamente 3 partes.

REGRAS DE FORMATAÇÃO — SIGA OBRIGATORIAMENTE:
- Separe CADA ideia em seu próprio parágrafo
- Coloque UMA linha em branco entre cada parágrafo
- Máximo de 2 frases por parágrafo
- NUNCA escreva mais de 2 frases seguidas sem quebrar parágrafo
- O Desenvolvimento deve ter entre 4 e 6 parágrafos curtos

Retorne APENAS neste formato, sem texto antes ou depois:

[GANCHO]
<primeira frase de impacto>

<segunda frase complementar, se houver>

[DESENVOLVIMENTO]
<parágrafo 1 — máx 2 frases>

<parágrafo 2 — máx 2 frases>

<parágrafo 3 — máx 2 frases>

<parágrafo 4 — máx 2 frases>

[CTA]
<chamada para ação direta>

O roteiro deve soar natural para ser lido no teleprompter.`

// Despacha para o provedor configurado na conta do usuário.
async function streamChat(
  messages: { role: string; content: string }[],
  onChunk: (text: string) => void,
  maxTokens = 1024,
): Promise<void> {
  const provider = getActiveProvider()
  const apiKey = getApiKey()
  if (provider === 'anthropic') {
    return streamAnthropic(apiKey, messages, onChunk, maxTokens)
  }
  return streamOpenAICompatible(provider, apiKey, messages, onChunk, maxTokens)
}

// OpenAI e OpenRouter compartilham o formato /chat/completions.
async function streamOpenAICompatible(
  provider: Provider,
  apiKey: string,
  messages: { role: string; content: string }[],
  onChunk: (text: string) => void,
  maxTokens: number,
): Promise<void> {
  const baseUrl = provider === 'openai'
    ? 'https://api.openai.com/v1/chat/completions'
    : 'https://openrouter.ai/api/v1/chat/completions'

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  }
  if (provider === 'openrouter') headers['HTTP-Referer'] = window.location.origin

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: CHAT_MODEL[provider],
      max_tokens: maxTokens,
      stream: true,
      // O system prompt entra como mensagem de sistema (padrão OpenAI).
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Erro desconhecido' } }))
    throw new Error(error.error?.message ?? `Erro na API (${response.status})`)
  }

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const lines = decoder.decode(value).split('\n')
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

// API direta da Anthropic — Messages API (formato e streaming diferentes).
async function streamAnthropic(
  apiKey: string,
  messages: { role: string; content: string }[],
  onChunk: (text: string) => void,
  maxTokens: number,
): Promise<void> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      // Necessário para chamar a API da Anthropic direto do browser.
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: CHAT_MODEL.anthropic,
      max_tokens: maxTokens,
      stream: true,
      system: SYSTEM_PROMPT,
      messages,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Erro desconhecido' } }))
    throw new Error(error.error?.message ?? `Erro na API Anthropic (${response.status})`)
  }

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const lines = decoder.decode(value).split('\n')
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      try {
        const parsed = JSON.parse(data)
        // Eventos de texto: content_block_delta com delta.type === 'text_delta'.
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

  await streamChat([{
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
  await streamChat([{
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

  await streamChat([{
    role: 'user',
    content: `Você vai incorporar um ${typeLabel} ao roteiro abaixo de forma natural e coesa.

ROTEIRO ATUAL:
${params.currentScript}

${typeLabel.toUpperCase()} A APLICAR:
${params.text}

Instrução: ${placement}. O resultado final deve soar fluido, como se o roteiro já tivesse sido escrito assim. Retorne apenas o roteiro completo reescrito, sem comentários ou explicações.`,
  }], onChunk, 1024)
}

type FormatoRoteiro = 'reels' | 'youtube' | 'vsl'
type ObjetivoRoteiro = 'educar' | 'vender' | 'autoridade' | 'viralizar'

function buildSystemPrompt(formato: FormatoRoteiro, objetivo: ObjetivoRoteiro): string {
  const objetivoDesc: Record<ObjetivoRoteiro, string> = {
    educar: 'Educar / Gerar Valor — ensinar algo concreto. Linguagem clara, didática, progressiva. Exemplos reais. A pessoa sai sabendo fazer ou entender algo que não sabia antes.',
    vender: 'Vender um Produto ou Serviço — levar a pessoa a tomar uma ação de compra. Linguagem persuasiva, focada em dor e transformação. Prova social. Urgência real.',
    autoridade: 'Construir Autoridade — posicionar o criador como referência. Linguagem confiante, opinativa, baseada em experiência real. Pode ser contraintuitiva.',
    viralizar: 'Viralizar / Alcance Orgânico — ser compartilhado. Linguagem emocional ou provocativa. Gancho irresistível. Ângulo incomum ou contraintuitivo.',
  }

  const estruturas: Record<FormatoRoteiro, string> = {
    reels: `ESTRUTURA OBRIGATÓRIA — Reels / TikTok / Shorts (vídeo curto):
Lógica central: parar o scroll. Você tem 2 segundos.

[GANCHO]
A primeira frase já é o pico ou a provocação (0 a 3 segundos).
Ex: "A maioria das pessoas faz isso errado." / "Ninguém te conta isso sobre X."
Sem introdução, sem "olá".

[DESENVOLVIMENTO]
Um único insight com profundidade real (3s a 40s). Sem rodeios.
Inclua a VIRADA: o elemento que diferencia esse vídeo — dado inesperado, contraintuitivo ou ângulo incomum.

[CTA]
Uma única ação nos últimos 3 a 5 segundos: salva, compartilha, comenta ou segue.
Nunca peça tudo ao mesmo tempo.

Regras: sem introdução, sem "olá", linguagem de 1 para 1, especificidade vende.`,

    youtube: `ESTRUTURA OBRIGATÓRIA — YouTube (vídeo longo):
Lógica central: retenção. Cada bloco precisa puxar o próximo.

[GANCHO]
0 a 30 segundos. Promessa clara do que a pessoa vai ganhar assistindo até o fim.
Gera curiosidade ou urgência imediata. Nunca comece com "olá, seja bem-vindo".

[DESENVOLVIMENTO]
Desenvolva em sequência:
1. PROVA / CREDIBILIDADE (30s a 2min): por que você pode falar sobre isso? Dado concreto, caso real ou experiência pessoal.
2. PROBLEMA: aprofunda a dor que a audiência sente. Quanto mais específico, maior a identificação.
3. CONTEÚDO PRINCIPAL: 3 a 7 pontos. Cada ponto: conceito → exemplo → aplicação prática.
4. RETENÇÃO ATIVA (espalhada): frases que puxam para frente ("Agora vem a parte mais importante...", "O próximo ponto é o que mais surpreende...").
5. CTA INTERMEDIÁRIO (antes do último terço): pede curtida ou inscrição enquanto o engajamento está alto.
6. CONCLUSÃO + SÍNTESE: resume os pontos principais em 3 a 5 linhas.

[CTA]
Uma única ação: próximo vídeo, inscrição ou link na descrição.

Regras: um CTA por vez — nunca empilhe pedidos.`,

    vsl: `ESTRUTURA OBRIGATÓRIA — VSL (Video Sales Letter):
Lógica central: quebrar objeções em sequência. Cada bloco tem função psicológica específica.

[GANCHO]
Promessa ousada e específica.
Modelo: "Como [perfil] consegue [resultado] em [prazo] sem [objeção principal]."

[DESENVOLVIMENTO]
Desenvolva em sequência:
1. IDENTIFICAÇÃO DA DOR: nomeia o problema com precisão. "Ele está falando de mim."
2. AGITAÇÃO: o que acontece se o problema não for resolvido? Custo da inação — sem exagero, mas sem suavizar.
3. VIRADA — A DESCOBERTA: o momento em que a solução foi encontrada. História pessoal ou de cliente real.
4. A SOLUÇÃO — MECANISMO ÚNICO: apresenta o método/produto. Foco no mecanismo, não nas funcionalidades. "O que faz isso funcionar é..."
5. PROVA SOCIAL: resultados de clientes. Específico > genérico. Números > adjetivos.
6. QUEBRA DE OBJEÇÕES: antecipa as 3 a 5 principais razões para não comprar. "Talvez você esteja pensando..."
7. OFERTA: o que está incluso, bônus e garantia. Apresenta o valor total antes de revelar o preço.
8. URGÊNCIA / ESCASSEZ: real, não fabricada.

[CTA]
Instrução clara e única. Sem ambiguidade.
Seguido de FECHAMENTO EMOCIONAL: a última imagem mental — visão do futuro com o problema resolvido.

Regras: nunca apresente o preço antes do valor percebido. Urgência falsa destrói credibilidade.`,
  }

  return `Você é um agente especialista em criação de roteiros para vídeos digitais.
Seu objetivo é produzir roteiros prontos para gravação no teleprompter.

OBJETIVO DO CONTEÚDO: ${objetivoDesc[objetivo]}

${estruturas[formato]}

---

PRINCÍPIOS UNIVERSAIS:
- Gancho que para: os primeiros segundos decidem tudo — nunca desperdice
- Um único inimigo: o problema precisa ser claro, específico e nomeado
- CTA único: pedir muitas coisas ao mesmo tempo dilui a conversão
- Linguagem de 1 para 1: escreva como se fosse para uma pessoa, não para uma audiência
- Especificidade vende: números, nomes e situações concretas são mais persuasivos que generalidades

---

REGRAS DE FORMATAÇÃO — OBRIGATÓRIO:
- Separe CADA ideia em seu próprio parágrafo
- Coloque UMA linha em branco entre cada parágrafo
- Máximo de 2 frases por parágrafo
- NUNCA escreva mais de 2 frases seguidas sem quebrar parágrafo
- O Desenvolvimento deve ter entre 4 e 6 parágrafos curtos

Retorne APENAS neste formato exato, sem texto adicional antes ou depois, sem marcações markdown:

[GANCHO]
<primeira frase de impacto>

<segunda frase complementar, se houver>

[DESENVOLVIMENTO]
<parágrafo 1 — máx 2 frases>

<parágrafo 2 — máx 2 frases>

<parágrafo 3 — máx 2 frases>

<parágrafo 4 — máx 2 frases>

[CTA]
<chamada para ação direta>`
}

export async function generateScriptFromContext(params: {
  posicionamento: string | null
  transcricao: string | null
  informacoesExtras: string
  formato: FormatoRoteiro
  objetivo: ObjetivoRoteiro
}, onChunk: (text: string) => void): Promise<void> {
  const systemPrompt = buildSystemPrompt(params.formato, params.objetivo)

  const parts: string[] = []
  if (params.posicionamento) {
    parts.push(`POSICIONAMENTO DE COMUNICAÇÃO (tom de voz, audiência e contexto):\n${params.posicionamento}`)
  }
  if (params.transcricao) {
    parts.push(`CONTEÚDO DE REFERÊNCIA (transcrição de vídeo):\n${params.transcricao}`)
  }
  if (params.informacoesExtras.trim()) {
    parts.push(`INFORMAÇÕES COMPLEMENTARES:\n${params.informacoesExtras}`)
  }

  const userMessage = parts.length > 0
    ? parts.join('\n\n---\n\n') + '\n\nGere o roteiro agora.'
    : 'Gere um roteiro com base no formato e objetivo definidos.'

  await streamChat(
    [{ role: 'user', content: `${systemPrompt}\n\n${userMessage}` }],
    onChunk,
    3000,
  )
}

export function parseRoteiro(texto: string): { gancho: string; desenvolvimento: string; cta: string } {
  const ganchoMatch = texto.match(/\[GANCHO\]\s*([\s\S]*?)(?=\[DESENVOLVIMENTO\]|$)/)
  const desenvolMatch = texto.match(/\[DESENVOLVIMENTO\]\s*([\s\S]*?)(?=\[CTA\]|$)/)
  const ctaMatch = texto.match(/\[CTA\]\s*([\s\S]*?)$/)
  return {
    gancho: ganchoMatch?.[1]?.trim() ?? '',
    desenvolvimento: desenvolMatch?.[1]?.trim() ?? '',
    cta: ctaMatch?.[1]?.trim() ?? '',
  }
}

export async function suggestHooksAndCTAs(params: {
  scriptContent: string
  format: Format
}, onChunk: (text: string) => void): Promise<void> {
  const formatLabel = params.format === 'reels' ? 'Reels/Stories' : 'YouTube'

  await streamChat([{
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
