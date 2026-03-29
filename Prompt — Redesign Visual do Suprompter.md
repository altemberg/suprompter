# Prompt — Redesign Visual do Suprompter

Aplique um redesign completo de UI no projeto. O problema atual é falta de espaçamento, hierarquia visual fraca e ausência de identidade visual. Siga as instruções abaixo para cada arquivo.

---

## Tokens de design — aplique em todo o projeto

Crie ou atualize `src/styles/tokens.css` (e importe no `index.css`):

```css
:root {
  /* Backgrounds */
  --bg-page: #0d0d0d;
  --bg-surface: #161616;
  --bg-sidebar: #111111;
  --bg-hover: #1a1a1a;

  /* Bordas */
  --border-subtle: rgba(255, 255, 255, 0.07);
  --border-muted: rgba(255, 255, 255, 0.10);

  /* Texto */
  --text-primary: rgba(255, 255, 255, 0.92);
  --text-secondary: rgba(255, 255, 255, 0.45);
  --text-muted: rgba(255, 255, 255, 0.28);

  /* Accent roxo (cor principal do Suprompter) */
  --accent: #7F77DD;
  --accent-light: #a9a3f0;
  --accent-bg: rgba(127, 119, 221, 0.15);
  --accent-border: rgba(127, 119, 221, 0.28);

  /* Accent teal (ações secundárias / gravação) */
  --teal: #1D9E75;
  --teal-bg: rgba(29, 158, 117, 0.15);

  /* Espaçamento base */
  --page-padding: 36px;
  --section-gap: 32px;
  --card-radius: 12px;
  --card-padding: 20px;
}
```

---

## `src/index.css` — reset global

```css
@import './styles/tokens.css';

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: var(--bg-page);
  color: var(--text-primary);
  font-family: var(--font-sans, system-ui, sans-serif);
  height: 100dvh;           /* dvh — obrigatório para iOS Safari */
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
}

#root { height: 100dvh; display: flex; }
```

---

## `src/components/layout/AppSidebar.tsx` — redesign completo

### Logo
```tsx
<SidebarHeader className="px-5 py-5 border-b border-white/[0.07]">
  <span className="text-[15px] font-medium tracking-tight text-white">
    Su<span className="text-[#a9a3f0]">prompter</span>
  </span>
</SidebarHeader>
```

### Itens de navegação
Cada `SidebarMenuButton` deve ter:
- Padding: `px-2.5 py-2`
- Estado inativo: texto `text-white/45`, hover `bg-white/5 text-white/75`
- Estado ativo: `bg-[rgba(127,119,221,0.15)] text-[#a9a3f0]`
- Ícone: 15px, `lucide-react`, `strokeWidth={1.8}`
- Fonte: `text-[13.5px]`
- Gap entre ícone e label: `gap-2.5`

Ícones a usar:
- Início → `Home`
- Roteiros → `FileText`
- Teleprompter → `Video`
- Gravações → `Film`
- Configurações → `Settings`

### Footer (usuário)
```tsx
<SidebarFooter className="border-t border-white/[0.07] p-2.5">
  {/* Item Configurações */}
  <SidebarMenuItem>...</SidebarMenuItem>

  {/* Linha do usuário */}
  <div className="flex items-center gap-2.5 px-2.5 py-2 mt-1">
    <div className="w-7 h-7 rounded-full bg-[rgba(127,119,221,0.2)] flex items-center justify-center text-[11px] font-medium text-[#a9a3f0] shrink-0">
      {initials}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[12px] text-white/60 truncate">{email}</p>
      <button onClick={signOut} className="text-[11px] text-white/30 hover:text-white/50 transition-colors">
        Sair
      </button>
    </div>
  </div>
</SidebarFooter>
```

---

## `src/pages/Dashboard.tsx` — redesign completo

### Estrutura e espaçamento
```tsx
<div className="flex-1 overflow-y-auto px-9 py-8">

  {/* Header da página */}
  <div className="mb-7">
    <h1 className="text-[22px] font-medium tracking-tight text-white mb-1">Início</h1>
    <p className="text-[13.5px] text-white/38">Bem-vindo de volta, {firstName}</p>
  </div>

  {/* Stats */}
  <div className="grid grid-cols-2 gap-3 mb-5">
    <StatCard label="Roteiros" value={scriptCount} sub="..." />
    <StatCard label="Gravações" value={recordingCount} sub="..." />
  </div>

  {/* Ações */}
  <div className="grid grid-cols-2 gap-3 mb-8">
    <ActionCard ... />
    <ActionCard ... />
  </div>

  {/* Roteiros recentes */}
  <SectionHeader title="Roteiros recentes" linkLabel="Ver todos" href="/roteiros" />
  {scripts.length === 0 ? <EmptyState /> : <ScriptList scripts={scripts} />}

</div>
```

### Componente `StatCard`
```tsx
function StatCard({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div className="bg-[#161616] border border-white/[0.07] rounded-xl p-5">
      <p className="text-[11.5px] uppercase tracking-[0.6px] text-white/35 mb-2">{label}</p>
      <p className="text-[28px] font-medium tracking-[-1px] text-white leading-none">{value}</p>
      <p className="text-[12px] text-white/25 mt-1">{sub}</p>
    </div>
  )
}
```

### Componente `ActionCard`
```tsx
function ActionCard({ icon, iconBg, iconColor, title, desc, onClick, accent = false }) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full bg-[#161616] border rounded-xl p-5 flex items-center gap-3.5
        hover:bg-[#1a1a1a] transition-colors text-left
        ${accent
          ? 'border-[rgba(127,119,221,0.25)] hover:border-[rgba(127,119,221,0.4)]'
          : 'border-white/[0.07] hover:border-white/[0.12]'
        }
      `}
    >
      <div className={`w-9 h-9 rounded-[9px] flex items-center justify-center shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div>
        <p className="text-[13.5px] font-medium text-white/85 mb-0.5">{title}</p>
        <p className="text-[12px] text-white/35">{desc}</p>
      </div>
    </button>
  )
}
```

### Componente `SectionHeader`
```tsx
function SectionHeader({ title, linkLabel, href }) {
  return (
    <div className="flex items-center justify-between mb-3.5">
      <p className="text-[13px] font-medium uppercase tracking-[0.6px] text-white/45">{title}</p>
      <Link to={href} className="text-[12.5px] text-[rgba(127,119,221,0.8)] hover:text-[#a9a3f0] transition-colors">
        {linkLabel} →
      </Link>
    </div>
  )
}
```

### Empty state
```tsx
<div className="bg-[#161616] border border-white/[0.06] rounded-xl px-6 py-10 text-center">
  <FileText className="w-10 h-10 mx-auto mb-3.5 text-white/20" strokeWidth={1.2} />
  <p className="text-[13.5px] text-white/40 mb-3.5">Nenhum roteiro ainda</p>
  <button
    onClick={handleNewScript}
    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[rgba(127,119,221,0.15)] border border-[rgba(127,119,221,0.3)] rounded-lg text-[13px] text-[#a9a3f0] hover:bg-[rgba(127,119,221,0.25)] transition-colors"
  >
    <Plus className="w-3.5 h-3.5" />
    Criar primeiro roteiro
  </button>
</div>
```

---

## Padrões globais — aplique em todas as páginas

### Cards de conteúdo (ScriptCard, RecordingCard, etc.)
```tsx
<div className="bg-[#161616] border border-white/[0.07] rounded-xl p-5 hover:border-white/[0.12] hover:bg-[#1a1a1a] transition-colors cursor-pointer">
```

### Headings de página
```tsx
<h1 className="text-[22px] font-medium tracking-tight text-white mb-1">Título</h1>
<p className="text-[13.5px] text-white/38">Subtítulo</p>
```

### Seções internas
- Gap entre seções: `mb-8` (32px)
- Gap entre cards num grid: `gap-3` (12px)
- Padding da área de conteúdo: `px-9 py-8` (36px horizontal, 32px vertical)

### Badges de formato
```tsx
// Reels
<span className="text-[11px] px-2 py-0.5 rounded-md bg-[rgba(127,119,221,0.15)] text-[#a9a3f0] border border-[rgba(127,119,221,0.2)]">
  Reels
</span>

// YouTube
<span className="text-[11px] px-2 py-0.5 rounded-md bg-[rgba(29,158,117,0.15)] text-[#4ecda4] border border-[rgba(29,158,117,0.2)]">
  YouTube
</span>
```

### Inputs e selects
Adicione `className` base em todos os inputs:
```tsx
className="bg-[#161616] border border-white/[0.08] rounded-lg px-3 py-2 text-[13.5px] text-white/85 placeholder:text-white/25 focus:outline-none focus:border-[rgba(127,119,221,0.45)] transition-colors w-full"
```

### Botão primário
```tsx
className="flex items-center gap-2 px-4 py-2 bg-[rgba(127,119,221,0.2)] border border-[rgba(127,119,221,0.35)] rounded-lg text-[13.5px] text-[#a9a3f0] hover:bg-[rgba(127,119,221,0.3)] transition-colors font-medium"
```

---

## Notas finais

- Nunca use `100vh` — sempre `100dvh`
- Nunca use branco puro `#fff` para texto corrido — use `text-white/85` ou `text-white/92`
- Nunca deixe um `gap` ou `padding` zero em cards — mínimo `p-5` (20px)
- Separadores entre seções da sidebar: `border-white/[0.07]`
- Transições: sempre `transition-colors` com `duration` padrão do Tailwind
- Skeleton loaders: `bg-white/[0.06] animate-pulse rounded-lg`