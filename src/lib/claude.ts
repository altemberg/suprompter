import type { Format } from '@/types'

const BASE_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'anthropic/claude-sonnet-4-5'

function getApiKey(): string {
  const key = import.meta.env.OPENROUTER_API_KEY ?? import.meta.env.VITE_OPENROUTER_API_KEY
  if (!key) throw new Error('OpenRouter API key não configurada no .env')
  return key
}

const SYSTEM_PROMPT = `Você é um especialista em criação de roteiros para produtores de conteúdo digital.
Sua tarefa é criar um roteiro estruturado em exatamente 3 partes.

REGRAS DE FORMATAÇÃO OBRIGATÓRIAS:
- Separe o texto em parágrafos curtos de 2-3 linhas cada
- Use linha em branco entre cada parágrafo
- Nunca escreva um bloco único de texto corrido
- Cada ideia ou argumento deve ser um parágrafo separado
- Máximo de 3 frases por parágrafo

Retorne o roteiro SEMPRE neste formato exato, sem texto adicional antes ou depois:

[GANCHO]
<parágrafo 1 do gancho>

<parágrafo 2 do gancho, se necessário>

[DESENVOLVIMENTO]
<parágrafo 1>

<parágrafo 2>

<parágrafo 3>

[CTA]
<texto da chamada para ação>

O roteiro deve ser natural, fluido e adequado para ser lido no teleprompter.`

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

Retorne o roteiro SEMPRE neste formato exato, sem texto adicional antes ou depois, sem marcações markdown:

[GANCHO]
<texto do gancho>

[DESENVOLVIMENTO]
<texto do desenvolvimento>

[CTA]
<texto da chamada para ação>`
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

  await streamOpenRouter(
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
