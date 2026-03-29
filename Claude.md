# CLAUDE.md — Suprompter

## Visão Geral

**Suprompter** é uma aplicação web para produtores de conteúdo que combina geração de roteiros com IA (Claude), teleprompter com câmera ao vivo e histórico de gravações. O usuário escreve ou gera um roteiro com auxílio da IA, usa o teleprompter para gravar olhando para a câmera e baixa o vídeo.

---

## Stack Técnica

| Camada | Tecnologia |
|---|---|
| Framework | React + TypeScript + Vite |
| UI Components | shadcn/ui |
| Roteamento | React Router v6 |
| Backend / Auth / DB | Supabase |
| IA | Claude API (Anthropic) — `claude-sonnet-4-20250514` |
| Estilização | Tailwind CSS (via shadcn) |
| Estado global | Zustand |
| Formulários | React Hook Form + Zod |
| APIs nativas | `MediaDevices.getUserMedia()`, `MediaRecorder`, `Blob` + `URL.createObjectURL()` |

---

## Estrutura de Pastas

```
src/
├── components/
│   ├── layout/
│   │   ├── AppSidebar.tsx         # Sidebar com shadcn/ui Sidebar
│   │   └── AppLayout.tsx          # Layout wrapper com sidebar
│   ├── teleprompter/
│   │   ├── Teleprompter.tsx       # Modo gravação (tela cheia)
│   │   ├── ScrollingText.tsx      # Texto rolando sobre a câmera
│   │   ├── Controls.tsx           # Botões play/pause/gravar/download
│   │   ├── ProgressBar.tsx        # Barra de progresso do roteiro
│   │   └── DownloadBanner.tsx     # Banner pós-gravação
│   ├── scripts/
│   │   ├── ScriptCard.tsx         # Card na listagem de roteiros
│   │   ├── ScriptEditor.tsx       # Editor de texto do roteiro
│   │   └── AIAssistant.tsx        # Painel lateral de IA no editor
│   └── ui/                        # Componentes shadcn gerados
├── hooks/
│   ├── useCamera.ts               # Gerencia stream da câmera
│   ├── useMediaRecorder.ts        # Gerencia gravação
│   └── useTeleprompter.ts         # Lógica de scroll automático
├── lib/
│   ├── supabase.ts                # Client do Supabase
│   ├── claude.ts                  # Funções de chamada à API do Claude
│   └── utils.ts                   # cn() e utilitários
├── pages/
│   ├── Dashboard.tsx              # Início
│   ├── Scripts.tsx                # Listagem de roteiros
│   ├── ScriptDetail.tsx           # Editor de roteiro individual
│   ├── TeleprompterPage.tsx       # Modo teleprompter em tela cheia
│   ├── Recordings.tsx             # Histórico de gravações
│   ├── Settings.tsx               # Configurações
│   ├── Login.tsx                  # Login / cadastro
│   └── AuthCallback.tsx           # Callback OAuth do Supabase
├── stores/
│   ├── useAuthStore.ts            # Estado de autenticação
│   └── useTeleprompterStore.ts    # Configurações do teleprompter
├── types/
│   └── index.ts                   # Tipos globais
├── App.tsx
└── main.tsx
```

---

## Navegação — Sidebar (shadcn/ui)

```
[Logo Suprompter]
─────────────────
Início
Roteiros
Teleprompter
Gravações
─────────────────
Configurações
[Avatar do usuário]
```

Use o componente `Sidebar` do shadcn com `SidebarHeader`, `SidebarContent`, `SidebarGroup`, `SidebarFooter`. A página do Teleprompter **não exibe a sidebar** (tela cheia).

---

## Banco de Dados — Supabase

### Tabela `scripts`
```sql
create table scripts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  content text not null default '',
  format text check (format in ('reels', 'youtube')) default 'reels',
  tone text default 'descontraído',
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table scripts enable row level security;
create policy "Users see own scripts" on scripts
  for all using (auth.uid() = user_id);
```

### Tabela `recordings` (metadata apenas — vídeo fica local)
```sql
create table recordings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  script_id uuid references scripts(id) on delete set null,
  title text,
  duration_seconds int,
  format text,
  recorded_at timestamptz default now()
);

alter table recordings enable row level security;
create policy "Users see own recordings" on recordings
  for all using (auth.uid() = user_id);
```

---

## Autenticação — Supabase Auth

- Método principal: **Magic Link** (email)
- Opcional: Google OAuth
- Todas as rotas são protegidas exceto `/login` e `/auth/callback`
- Usar `supabase.auth.onAuthStateChange` no `useAuthStore` (Zustand)
- Redirecionar para `/login` se não autenticado

---

## Módulo de IA — Claude API

Arquivo: `src/lib/claude.ts`

A chave da API é fornecida pelo usuário em Configurações e lida de `localStorage`. **Nunca** hardcode a chave nem coloque em variáveis de ambiente.

```ts
const apiKey = localStorage.getItem('anthropic_api_key')
```

### Função 1: Gerar roteiro do zero
```ts
generateScript({ topic, format, tone, duration, targetAudience }, onChunk)
```
System prompt: especialista em roteiros para criadores de conteúdo digital. Retorna roteiro em blocos: gancho → desenvolvimento → CTA.

### Função 2: Melhorar roteiro existente
```ts
improveScript({ currentScript, instruction }, onChunk)
```
Recebe o roteiro atual + instrução do usuário ("deixa mais direto", "encurta para 60s", etc.)

### Função 3: Sugerir ganchos e CTAs
```ts
suggestHooksAndCTAs({ scriptContent, format }, onChunk)
```
Retorna 3 opções de gancho de abertura e 3 opções de CTA.

Todas as funções usam **streaming** via `fetch` com `stream: true`. Modelo: `claude-sonnet-4-20250514`.

---

## Módulo Teleprompter

### Formatos suportados

| Formato | Orientação | Resolução ideal |
|---|---|---|
| Reels / Stories | Retrato (9:16) | 1080x1920 |
| YouTube | Paisagem (16:9) | 1920x1080 |

### Câmera
- Usar `facingMode: 'user'` para câmera frontal
- Reels: `{ width: 1080, height: 1920 }` — YouTube: `{ width: 1920, height: 1080 }`
- `frameRate: { ideal: 30 }`

### Detecção de codec (iOS Safari compatível)
```ts
const mimeTypes = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
  'video/mp4', // fallback iOS
]
const mimeType = mimeTypes.find(m => MediaRecorder.isTypeSupported(m)) ?? ''
```

### Hooks
- `useCamera()` — stream da câmera, trata `NotAllowedError` e `NotFoundError`
- `useMediaRecorder(stream)` — gravação, chunks, blob, URL de download
- `useTeleprompter(speed, containerRef)` — scroll via `requestAnimationFrame` (nunca `setInterval`)

### Fluxo do Usuário

```
1. Usuário abre o app e faz login
2. Cria ou abre um roteiro existente
3. Opcionalmente usa a IA para gerar ou melhorar o roteiro
4. Clica em "Usar no Teleprompter"
5. Browser pede permissão de câmera/microfone
6. Tela cheia: câmera ao vivo + texto rolando de baixo para cima
7. Clica em "Gravar" (ou tecla R)
8. Lê o roteiro olhando para a câmera
9. Clica em "Parar Gravação"
10. Banner de download aparece → usuário baixa o .webm (ou .mp4 no iOS)
11. Metadados da gravação salvos no Supabase
```

### Atalhos de Teclado

| Tecla | Ação |
|-------|------|
| `Espaço` | Play / Pause do scroll |
| `R` | Iniciar / Parar gravação |
| `↑` / `↓` | Aumentar / Diminuir velocidade |
| `Esc` | Voltar para o editor |

---

## Módulo Gravações

- Metadados salvos no **Supabase** (tabela `recordings`)
- Arquivo de vídeo fica **apenas local** — o usuário baixa após gravar
- Página exibe histórico de sessões: título, formato, duração, data
- Sem player de vídeo (arquivo é local)
- Botão "Gravar novamente" leva ao teleprompter com o mesmo roteiro

---

## Considerações de UX

- Interface escura por padrão (melhor contraste para leitura)
- Fonte do teleprompter: Georgia, mínimo 32px, branca
- Texto centralizado, largura máxima ~65–70% da tela
- Overlay de texto: gradiente semitransparente (fade nas bordas superior e inferior)
- Indicador de progresso do roteiro (barra fina no topo)
- Controles do teleprompter somem após 3s de inatividade, reaparecem ao tocar
- Todos os botões tocáveis: mínimo 44×44px (guideline Apple)
- Skeleton loaders nos estados de carregamento
- Auto-save do editor com debounce de 1.5s + indicador "Salvando..." / "Salvo"

---

## Limitações Conhecidas

- `MediaRecorder` não suporta MP4 nativo em todos os browsers — usar `.webm` com fallback para `.mp4`
- Em Safari/iOS, o download de `.mp4` pode abrir em nova aba — exibir: "Segure o vídeo e escolha 'Salvar'"
- A gravação captura o stream da câmera, **não a tela** — o texto do teleprompter não entra no vídeo (intencional)
- Câmeras frontais de notebook geralmente limitadas a 720p — app é otimizado para celular

---

## Variáveis de Ambiente

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

A chave Anthropic **nunca** vai em `.env` — é inserida pelo usuário em Configurações e guardada em `localStorage`.

---

## Observações Técnicas Importantes

1. Usar `100dvh` em todo o app — nunca `100vh` (Safari iOS com barra de endereço)
2. `<video>` sempre com atributos `playsInline muted autoPlay`
3. Sempre chamar `stream.getTracks().forEach(t => t.stop())` ao sair do teleprompter
4. Sempre chamar `URL.revokeObjectURL()` após download ou ao iniciar nova gravação
5. Não usar `setInterval` para o scroll — usar `requestAnimationFrame`

---

## Comandos

```bash
# Setup
npm create vite@latest suprompter -- --template react-ts
cd suprompter
npm install react-router-dom zustand react-hook-form zod @supabase/supabase-js

# shadcn
npx shadcn@latest init
npx shadcn@latest add sidebar button input textarea card badge sheet dialog avatar separator tooltip skeleton

# Dev
npm run dev

# Build
npm run build
```