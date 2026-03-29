# Redesign UI — Suprompter (aplicação direta)

Aplique as mudanças abaixo **exatamente como estão**, arquivo por arquivo. Não interprete, não adapte — substitua o conteúdo indicado.

---

## PASSO 1 — Criar arquivo de tokens

Crie o arquivo `src/styles/tokens.css` com este conteúdo exato:

```css
:root {
  --bg-page: #0d0d0d;
  --bg-surface: #161616;
  --bg-sidebar: #111111;
  --bg-hover: #1a1a1a;

  --border-subtle: rgba(255, 255, 255, 0.07);
  --border-muted: rgba(255, 255, 255, 0.10);

  --text-primary: rgba(255, 255, 255, 0.92);
  --text-secondary: rgba(255, 255, 255, 0.45);
  --text-muted: rgba(255, 255, 255, 0.28);

  --accent: #7F77DD;
  --accent-light: #a9a3f0;
  --accent-bg: rgba(127, 119, 221, 0.15);
  --accent-border: rgba(127, 119, 221, 0.28);

  --teal: #1D9E75;
  --teal-bg: rgba(29, 158, 117, 0.15);
  --teal-light: #4ecda4;
}
```

---

## PASSO 2 — Atualizar `src/index.css`

Adicione no **topo** do arquivo:

```css
@import './styles/tokens.css';
```

Garanta que o body tenha exatamente:

```css
body {
  background: var(--bg-page);
  color: var(--text-primary);
  height: 100dvh;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
}

#root {
  height: 100dvh;
  display: flex;
}
```

---

## PASSO 3 — Atualizar `src/pages/Dashboard.tsx`

Substitua o JSX retornado pelo componente por este (mantendo os hooks/estados existentes, só mudando o markup):

```tsx
return (
  <div className="flex-1 overflow-y-auto" style={{ padding: '32px 36px', background: 'var(--bg-page)' }}>

    {/* Header */}
    <div style={{ marginBottom: '28px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 500, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.4px', marginBottom: '4px' }}>
        Início
      </h1>
      <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.38)' }}>
        Bem-vindo de volta, {firstName || user?.email?.split('@')[0]}
      </p>
    </div>

    {/* Stats */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
      <div style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-subtle)', borderRadius: '12px', padding: '20px' }}>
        <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'rgba(255,255,255,0.35)', marginBottom: '8px' }}>Roteiros</p>
        <p style={{ fontSize: '28px', fontWeight: 500, color: 'white', letterSpacing: '-1px', lineHeight: 1 }}>{scriptCount ?? 0}</p>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', marginTop: '4px' }}>criados até agora</p>
      </div>
      <div style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-subtle)', borderRadius: '12px', padding: '20px' }}>
        <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'rgba(255,255,255,0.35)', marginBottom: '8px' }}>Gravações</p>
        <p style={{ fontSize: '28px', fontWeight: 500, color: 'white', letterSpacing: '-1px', lineHeight: 1 }}>{recordingCount ?? 0}</p>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', marginTop: '4px' }}>sessões realizadas</p>
      </div>
    </div>

    {/* Action Cards */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
      <button
        onClick={() => navigate('/roteiros/novo')}
        style={{ background: 'var(--bg-surface)', border: '0.5px solid rgba(127,119,221,0.25)', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s, background 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(127,119,221,0.45)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(127,119,221,0.25)'; e.currentTarget.style.background = 'var(--bg-surface)'; }}
      >
        <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Plus size={16} color="var(--accent-light)" strokeWidth={1.8} />
        </div>
        <div>
          <p style={{ fontSize: '13.5px', fontWeight: 500, color: 'rgba(255,255,255,0.85)', marginBottom: '2px' }}>Novo Roteiro</p>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>Criar e editar com IA</p>
        </div>
      </button>

      <button
        onClick={() => navigate('/teleprompter')}
        style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border-subtle)', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s, background 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(29,158,117,0.35)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.background = 'var(--bg-surface)'; }}
      >
        <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: 'var(--teal-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Video size={16} color="var(--teal-light)" strokeWidth={1.8} />
        </div>
        <div>
          <p style={{ fontSize: '13.5px', fontWeight: 500, color: 'rgba(255,255,255,0.85)', marginBottom: '2px' }}>Abrir Teleprompter</p>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>Gravar com câmera</p>
        </div>
      </button>
    </div>

    {/* Roteiros recentes */}
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
      <p style={{ fontSize: '13px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'rgba(255,255,255,0.4)' }}>
        Roteiros recentes
      </p>
      <Link to="/roteiros" style={{ fontSize: '12.5px', color: 'rgba(127,119,221,0.8)', textDecoration: 'none' }}>
        Ver todos →
      </Link>
    </div>

    {/* Empty state */}
    {(!scripts || scripts.length === 0) && (
      <div style={{ background: 'var(--bg-surface)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '40px 24px', textAlign: 'center' }}>
        <FileText size={40} style={{ margin: '0 auto 14px', opacity: 0.18, display: 'block' }} strokeWidth={1.2} />
        <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.38)', marginBottom: '16px' }}>Nenhum roteiro ainda</p>
        <button
          onClick={() => navigate('/roteiros/novo')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 18px', background: 'var(--accent-bg)', border: '0.5px solid var(--accent-border)', borderRadius: '8px', fontSize: '13px', color: 'var(--accent-light)', cursor: 'pointer' }}
        >
          <Plus size={13} strokeWidth={2} />
          Criar primeiro roteiro
        </button>
      </div>
    )}

    {/* Lista de roteiros (quando houver) */}
    {scripts && scripts.length > 0 && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {scripts.slice(0, 3).map(script => (
          <Link
            key={script.id}
            to={`/roteiros/${script.id}`}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface)', border: '0.5px solid var(--border-subtle)', borderRadius: '12px', padding: '16px 20px', textDecoration: 'none', transition: 'border-color 0.15s' }}
          >
            <div>
              <p style={{ fontSize: '13.5px', fontWeight: 500, color: 'rgba(255,255,255,0.85)', marginBottom: '3px' }}>{script.title}</p>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>{new Date(script.updated_at).toLocaleDateString('pt-BR')}</p>
            </div>
            <span style={{
              fontSize: '11px', padding: '3px 8px', borderRadius: '6px',
              ...(script.format === 'reels'
                ? { background: 'var(--accent-bg)', color: 'var(--accent-light)', border: '0.5px solid var(--accent-border)' }
                : { background: 'var(--teal-bg)', color: 'var(--teal-light)', border: '0.5px solid rgba(29,158,117,0.25)' }
              )
            }}>
              {script.format === 'reels' ? 'Reels' : 'YouTube'}
            </span>
          </Link>
        ))}
      </div>
    )}

  </div>
)
```

Certifique-se de que os imports no topo do arquivo incluem:
```tsx
import { Plus, Video, FileText } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
```

---

## PASSO 4 — Atualizar `src/components/layout/AppSidebar.tsx`

Localize os estilos dos itens de navegação e aplique:

### No `SidebarHeader`, garanta:
```tsx
// padding interno: 20px horizontal, 20px vertical
// borda inferior: 0.5px solid rgba(255,255,255,0.07)
style={{ padding: '20px', borderBottom: '0.5px solid rgba(255,255,255,0.07)' }}
```

### Em cada `SidebarMenuButton`, substitua as classes/estilos por:
```tsx
style={{
  padding: '8px 10px',
  borderRadius: '8px',
  fontSize: '13.5px',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  color: isActive ? '#a9a3f0' : 'rgba(255,255,255,0.45)',
  background: isActive ? 'rgba(127,119,221,0.15)' : 'transparent',
  transition: 'background 0.15s, color 0.15s',
  width: '100%',
  border: 'none',
  cursor: 'pointer',
}}
```

### No `SidebarFooter`, garanta:
```tsx
style={{ borderTop: '0.5px solid rgba(255,255,255,0.07)', padding: '10px' }}
```

### O bloco do usuário (avatar + email + sair):
```tsx
<div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px' }}>
  <div style={{
    width: '28px', height: '28px', borderRadius: '50%',
    background: 'rgba(127,119,221,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '11px', fontWeight: 500, color: '#a9a3f0', flexShrink: 0
  }}>
    {initials}
  </div>
  <div style={{ flex: 1, minWidth: 0 }}>
    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      {user?.email}
    </p>
    <button onClick={signOut} style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
      Sair
    </button>
  </div>
</div>
```

---

## PASSO 5 — Verificação final

Após aplicar, confira:

- [ ] `src/styles/tokens.css` existe e é importado no `index.css`
- [ ] `body` usa `height: 100dvh` (não `100vh`)
- [ ] O Dashboard tem padding `32px 36px` na área de conteúdo
- [ ] Os cards de stats têm `padding: 20px` e `borderRadius: 12px`
- [ ] Os action cards têm ícone colorido dentro de um container com fundo sutil
- [ ] O empty state tem o ícone centralizado + texto + botão roxo
- [ ] A sidebar tem borda inferior no header e borda superior no footer
- [ ] Itens ativos da sidebar têm fundo `rgba(127,119,221,0.15)` e cor `#a9a3f0`

Rode `npm run dev` e compare com o mockup fornecido.