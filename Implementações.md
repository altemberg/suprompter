# Claude Code Prompt — Suprompter

Leia o `CLAUDE.md` antes de começar. Ele contém a visão completa do projeto, stack, estrutura de pastas, schema do banco e todas as decisões de arquitetura.

---

## Setup do projeto

```bash
npm create vite@latest suprompter -- --template react-ts
cd suprompter
npm install react-router-dom zustand react-hook-form zod @supabase/supabase-js
npx shadcn@latest init
npx shadcn@latest add sidebar button input textarea card badge sheet dialog avatar separator tooltip skeleton
```

Crie o `.env` na raiz:
```env
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
```

---

## Ordem de implementação

Siga esta ordem exata:

1. Tipos globais
2. Lib (Supabase client, Claude, utils)
3. Stores (Zustand)
4. Hooks do teleprompter
5. Layout (Sidebar + AppLayout)
6. Páginas de Auth
7. Roteamento no App.tsx
8. Páginas (Dashboard → Roteiros → Editor → Teleprompter → Gravações → Configurações)
9. Componentes filhos de cada página

---

## 1. Tipos — `src/types/index.ts`

```ts
export type Format = 'reels' | 'youtube'

export interface Script {
  id: string
  user_id: string
  title: string
  content: string
  format: Format
  tone: string
  tags: string[]
  created_at: string
  updated_at: string
}

export interface Recording {
  id: string
  user_id: string
  script_id: string | null
  title: string | null
  duration_seconds: number | null
  format: Format | null
  recorded_at: string
}

export interface TeleprompterSettings {
  speed: number        // 1–10
  fontSize: number     // px
  theme: 'dark' | 'light'
}
```

---

## 2. Supabase Client — `src/lib/supabase.ts`

```ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

---

## 3. Claude API — `src/lib/claude.ts`

Implemente três funções com **streaming via fetch**. A API key é sempre lida de `localStorage.getItem('anthropic_api_key')`.

```ts
const BASE_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-20250514'

function getApiKey(): string {
  const key = localStorage.getItem('anthropic_api_key')
  if (!key) throw new Error('Anthropic API key não configurada. Acesse Configurações.')
  return key
}

// Função auxiliar para fazer chamadas com streaming
// Recebe o payload e um callback onChunk(text: string)
async function streamClaude(
  payload: object,
  onChunk: (text: string) => void
): Promise<void>

// Gerar roteiro do zero
export async function generateScript(params: {
  topic: string
  format: Format
  tone: string
  duration: number  // segundos
  targetAudience: string
}, onChunk: (text: string) => void): Promise<void>

// Melhorar roteiro existente
export async function improveScript(params: {
  currentScript: string
  instruction: string
}, onChunk: (text: string) => void): Promise<void>

// Sugerir ganchos e CTAs
export async function suggestHooksAndCTAs(params: {
  scriptContent: string
  format: Format
}, onChunk: (text: string) => void): Promise<void>
```

Para o streaming, use:
```ts
const reader = response.body!.getReader()
const decoder = new TextDecoder()
// Itere os chunks, parse as linhas SSE (data: {...})
// Extraia delta.text dos eventos content_block_delta
```

---

## 4. Stores — Zustand

### `src/stores/useAuthStore.ts`
```ts
interface AuthStore {
  user: User | null
  loading: boolean
  setUser: (user: User | null) => void
  initialize: () => void  // chama supabase.auth.onAuthStateChange
  signOut: () => Promise<void>
}
```

### `src/stores/useTeleprompterStore.ts`
```ts
interface TeleprompterStore {
  speed: number        // default: 4
  fontSize: number     // default: 40
  setSpeed: (n: number) => void
  setFontSize: (n: number) => void
}
// Persista com localStorage
```

---

## 5. Hooks

### `src/hooks/useCamera.ts`
- `startCamera(format: Format)` — chama `getUserMedia` com:
  - Reels: `{ width: 1080, height: 1920, facingMode: 'user' }`
  - YouTube: `{ width: 1920, height: 1080, facingMode: 'user' }`
- Trate os erros: `NotAllowedError` → mensagem de permissão; `NotFoundError` → câmera não encontrada
- Retorne: `{ stream, error, loading, startCamera, stopCamera }`

### `src/hooks/useMediaRecorder.ts`
- Recebe `stream: MediaStream | null`
- Detecte mimeType suportado na ordem: `video/webm;codecs=vp9,opus` → `video/webm;codecs=vp8,opus` → `video/webm` → `video/mp4`
- Colete chunks em `ondataavailable`
- No `onstop`: monte o Blob, crie a URL, defina o nome do arquivo como `suprompter-YYYY-MM-DD-HHmm.webm` (ou `.mp4`)
- Retorne: `{ isRecording, startRecording, stopRecording, downloadUrl, fileName, mimeType, clearRecording }`

### `src/hooks/useTeleprompter.ts`
- Recebe `speed: number` e `containerRef: RefObject<HTMLDivElement>`
- Use `requestAnimationFrame` — nunca `setInterval`
- `pixelsPerFrame = speed * 0.4`
- Calcule `progress` (0–100) baseado em `scrollTop / (scrollHeight - clientHeight)`
- Pare automaticamente ao chegar no fim
- Retorne: `{ isPlaying, play, pause, toggle, reset, progress }`

---

## 6. Layout

### `src/components/layout/AppSidebar.tsx`

Use os componentes do shadcn: `Sidebar`, `SidebarHeader`, `SidebarContent`, `SidebarGroup`, `SidebarGroupContent`, `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton`, `SidebarFooter`.

Estrutura:
```
SidebarHeader → Logo "Suprompter" (texto estilizado ou SVG simples)
SidebarContent →
  SidebarGroup →
    Menu items com ícones (lucide-react):
    - Início → Home → /
    - Roteiros → FileText → /roteiros
    - Teleprompter → Video → /teleprompter
    - Gravações → Film → /gravacoes
SidebarFooter →
  SidebarGroup →
    - Configurações → Settings → /configuracoes
    - Avatar + nome do usuário + botão logout
```

Use `NavLink` do React Router para `isActive` no `SidebarMenuButton`.

### `src/components/layout/AppLayout.tsx`
- Wrapper com `SidebarProvider` + `SidebarTrigger`
- Renderize `<AppSidebar />` + `<main>{children}</main>`
- A página do Teleprompter **não usa** este layout (tela cheia sem sidebar)

---

## 7. Roteamento — `src/App.tsx`

```tsx
// Inicialize useAuthStore na montagem
// Rotas públicas: /login, /auth/callback
// Rotas privadas (wrapped em ProtectedRoute): /, /roteiros, /roteiros/:id,
//   /gravacoes, /configuracoes
// /teleprompter também é privada mas sem AppLayout (tela cheia)
```

Crie um `ProtectedRoute` que redireciona para `/login` se não autenticado.

---

## 8. Páginas

### `src/pages/Login.tsx`
- Formulário com email para Magic Link via `supabase.auth.signInWithOtp`
- Estado: `idle` | `sent` | `loading` | `error`
- Após envio: mensagem "Verifique seu email"
- Design limpo e centralizado, sem sidebar

### `src/pages/AuthCallback.tsx`
- Chame `supabase.auth.exchangeCodeForSession` na montagem
- Redirecione para `/` após sucesso

### `src/pages/Dashboard.tsx`
- Busque os últimos 3 roteiros do Supabase (ordenados por `updated_at desc`)
- Exiba total de roteiros e total de gravações
- Cards de ação rápida: "Novo Roteiro" e "Abrir Teleprompter"

### `src/pages/Scripts.tsx`
- Busque todos os roteiros do usuário no Supabase
- Grid responsivo de `ScriptCard`
- Filtro por formato (Reels / YouTube / Todos) com `Badge` clicável
- Campo de busca por título
- Botão "Novo Roteiro" → cria registro no Supabase com título "Rascunho" + redireciona para `/roteiros/:id`

### `src/pages/ScriptDetail.tsx` + `src/components/scripts/ScriptEditor.tsx` + `src/components/scripts/AIAssistant.tsx`

**ScriptDetail**: layout de duas colunas (editor 60% | painel IA 40%)

**ScriptEditor**:
- Textarea grande com auto-save (debounce 1.5s) via `supabase.from('scripts').update()`
- Campo de título editável inline (input simples, salva no blur)
- Select de formato (Reels / YouTube)
- Select de tom de voz: Descontraído, Profissional, Inspirador, Humorístico, Educativo
- Contagem de palavras + tempo estimado (`palavras / 130` minutos, arredondado)
- Botão "Usar no Teleprompter" → `/teleprompter?scriptId=ID`

**AIAssistant** — painel colapsável à direita:
- Três abas usando `Tabs` do shadcn:

  **Aba "Gerar do zero"**:
  - Inputs: Tema/assunto, Público-alvo, Duração (select: 30s / 60s / 90s / 3min), Tom de voz
  - Botão "Gerar Roteiro"
  - Durante geração: textarea de preview com texto chegando em streaming
  - Botão "Aplicar ao editor" após geração completa

  **Aba "Melhorar"**:
  - Mostra preview do roteiro atual (primeiros 200 chars)
  - Textarea: "O que você quer mudar?" (ex: "deixa mais direto", "adiciona mais energia")
  - Botão "Melhorar"
  - Preview do resultado em streaming + botão "Aplicar"

  **Aba "Ganchos & CTAs"**:
  - Botão "Gerar sugestões"
  - Lista de 3 ganchos + 3 CTAs como cards clicáveis
  - Clicou → copia para o clipboard OU insere no início/fim do editor (toggleável)

### `src/pages/TeleprompterPage.tsx`

**Tela cheia, sem sidebar, fundo preto.**

Leia `scriptId` de `useSearchParams`. Carregue o roteiro do Supabase.

Estrutura de camadas (todas `position: absolute, inset: 0`):
1. `<video>` — câmera ao vivo como fundo
2. `<ScrollingText>` — overlay com o roteiro
3. `<ProgressBar>` — barra no topo
4. `<Controls>` — controles na parte inferior
5. `<DownloadBanner>` — aparece após gravação

**ScrollingText** (`src/components/teleprompter/ScrollingText.tsx`):
- Texto branco, fonte Georgia, tamanho configurável, largura máx 65%, centralizado
- Fundo: gradiente `rgba(0,0,0,0)` no topo → `rgba(0,0,0,0.85)` no centro → `rgba(0,0,0,0)` na base (efeito fade nas bordas)

**ProgressBar** (`src/components/teleprompter/ProgressBar.tsx`):
- Linha de 3px no topo, branca, animação de largura

**Controls** (`src/components/teleprompter/Controls.tsx`):
- Aparecem sempre; somem após 3s de inatividade de toque/mouse; reaparecem ao tocar
- Botão Play/Pause (ícone lucide)
- Botão Gravar: vermelho com pulse animation quando ativo
- Slider de velocidade (1–10)
- Botão Voltar (com `confirm()` se estiver gravando)
- Todos com min 44x44px para toque

**DownloadBanner** (`src/components/teleprompter/DownloadBanner.tsx`):
- Fundo verde escuro semitransparente
- "Gravação concluída!"
- Botão de download (`<a href={downloadUrl} download={fileName}>`)
- Detecção de iOS: se `navigator.userAgent` contém `iPhone|iPad`, exibir "Segure o vídeo e escolha 'Salvar'"
- Botão "Gravar novamente" → limpa estado e reseta

**Após parar a gravação**: salve metadados na tabela `recordings` do Supabase:
```ts
await supabase.from('recordings').insert({
  script_id: scriptId,
  title: script.title,
  duration_seconds: Math.round(duration),
  format: script.format,
})
```

**Atalhos de teclado** via `useEffect` + `keydown`:
- Espaço → toggle scroll
- R → toggle gravação
- ↑/↓ → velocidade ±1
- Esc → voltar (com confirm se gravando)

### `src/pages/Recordings.tsx`
- Busque `recordings` do Supabase ordenados por `recorded_at desc`
- Lista com: título, badge de formato, duração formatada (mm:ss), data
- Botão "Gravar novamente" → `/teleprompter?scriptId=ID` (se `script_id` não for null)
- Estado vazio: ilustração simples + CTA para ir ao teleprompter

### `src/pages/Settings.tsx`
- **Anthropic API Key**: input de senha, salvo em `localStorage` com botão "Salvar"
- Tom de voz padrão (select)
- Velocidade padrão do teleprompter (slider 1–10) — persiste no `useTeleprompterStore`
- Tamanho de fonte padrão (slider 24–72px) — persiste no `useTeleprompterStore`
- Tema: claro / escuro (toggle)
- Zona de perigo: botão "Sair da conta"

---

## 9. CSS Global — `src/index.css`

```css
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  font-family: 'Inter', system-ui, sans-serif;
  height: 100dvh;
  overflow: hidden;
}

#root { height: 100dvh; display: flex; }

/* Teleprompter usa Georgia para leitura */
.teleprompter-text {
  font-family: 'Georgia', 'Times New Roman', serif;
}
```

---

## Observações finais

- Use `100dvh` — nunca `100vh`
- `<video>` sempre com `playsInline muted autoPlay`
- `stream.getTracks().forEach(t => t.stop())` no cleanup do useCamera
- `URL.revokeObjectURL()` no cleanup do useMediaRecorder
- Auto-save do editor com debounce de 1.5s — exibir indicador "Salvando..." / "Salvo"
- Skeleton loaders nos estados de loading (use o componente `Skeleton` do shadcn)
- Todos os fetches do Supabase dentro de `useEffect` com cleanup adequado