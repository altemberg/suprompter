# Prompt para o Cursor — Teleprompter App

---

Crie uma aplicação React completa de **teleprompter para gravação de vídeo**. Leia o `CLAUDE.md` para entender o contexto completo antes de começar.

## O que construir

Uma SPA (Single Page Application) com dois modos:

### Modo 1 — Editor de Roteiro
Tela inicial onde o usuário digita ou cola o roteiro. Deve ter:
- Textarea grande e confortável para o texto
- Campo opcional para título do vídeo
- Configurações iniciais: velocidade do scroll (slider de 1 a 10), tamanho da fonte (slider)
- Botão "Iniciar Teleprompter" que solicita permissão de câmera e microfone

### Modo 2 — Teleprompter
Após permissão concedida, exibir:
- **Câmera frontal** (`facingMode: 'user'`) em tela cheia como fundo
- **Overlay de texto** semitransparente com o roteiro rolando de baixo para cima automaticamente
- **Barra de controles** sobreposta na parte inferior com:
  - Botão Play/Pause do scroll (ícone + atalho Espaço)
  - Botão Gravar / Parar Gravação (ícone + atalho R) com indicador piscante vermelho quando ativo
  - Slider de velocidade rápido para ajuste em tempo real
  - Botão Voltar para o editor (Esc)
- **Após parar a gravação**: exibir botão de download proeminente com o arquivo `.webm`

## Requisitos Técnicos

- Use **React + TypeScript** com Vite
- Separe a lógica em hooks customizados:
  - `useCamera()`— gerencia o `getUserMedia`, retorna o stream e trata erros de permissão
  - `useMediaRecorder(stream)`— gerencia `MediaRecorder`, chunks de dados, blob final e URL de download
  - `useTeleprompter(speed)`— gerencia o scroll automático suave via `requestAnimationFrame`, play/pause e reset
- Use `useRef` para o elemento `<video>` e para o container de scroll do texto
- Trate os casos de erro: permissão negada, câmera não encontrada, browser sem suporte a `MediaRecorder`

## Comportamento do Scroll

O scroll do teleprompter deve:
- Usar `requestAnimationFrame` para suavidade (não `setInterval`)
- Ser proporcional à velocidade configurada (pixels por frame)
- Parar automaticamente ao chegar no final do texto
- Poder ser pausado e retomado sem perder a posição

## Estilo e UI

- Tema escuro obrigatório (`#0a0a0a` de fundo)
- Fonte do teleprompter: grande, branca, legível — use `'Georgia'` ou `'DM Serif Display'` do Google Fonts para dar personalidade
- Largura do texto: máximo 65% da largura da tela, centralizado
- Os controles devem desaparecer após 3 segundos de inatividade do mouse (como players de vídeo)
- Animação suave de entrada quando o modo teleprompter ativar
- Indicador de progresso: barra fina no topo mostrando quanto do roteiro já passou

## Atalhos de Teclado

Implemente via `useEffect` + `keydown` event listener:
- `Espaço` → Play/Pause do scroll
- `R` → Iniciar/Parar gravação
- `↑` / `↓` → Aumentar/Diminuir velocidade em 1 unidade
- `Esc` → Voltar ao editor (com confirmação se estiver gravando)

## Arquivo de Download

- Formato: `video/webm;codecs=vp9,opus` com fallback para `video/webm`
- Nome: `teleprompter-YYYY-MM-DD-HHmm.webm`
- Acionar via `<a href={blobUrl} download={filename}>` criado programaticamente

## Organização dos Arquivos

```
src/
  components/
    ScriptEditor.tsx
    Teleprompter.tsx
    ScrollingText.tsx
    Controls.tsx
    ProgressBar.tsx
  hooks/
    useCamera.ts
    useMediaRecorder.ts
    useTeleprompter.ts
  App.tsx
  main.tsx
  index.css
```

## O que NÃO fazer

- Não grave a tela — apenas o stream da câmera entra no vídeo
- Não use bibliotecas de UI pesadas (MUI, Chakra, etc.) — CSS puro ou Tailwind
- Não use `setInterval` para o scroll — use `requestAnimationFrame`
- Não esqueça de fazer `stream.getTracks().forEach(t => t.stop())` ao desmontar o componente

---

Comece scaffoldando o projeto com `npm create vite@latest teleprompter-app -- --template react-ts`, depois implemente os hooks e componentes na ordem: hooks → ScriptEditor → Teleprompter → integração no App.tsx.