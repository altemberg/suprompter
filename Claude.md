# CLAUDE.md — Teleprompter App

## Visão Geral do Projeto

Aplicação web de teleprompter para produção de conteúdo em vídeo. O usuário digita ou cola um roteiro, ativa a câmera frontal, lê o texto enquanto grava e depois baixa o vídeo.

## Stack Técnica

- **Framework**: React (Vite)
- **Linguagem**: TypeScript
- **Estilização**: CSS Modules ou Tailwind CSS
- **APIs nativas do browser**:
  - `MediaDevices.getUserMedia()` — câmera frontal e microfone
  - `MediaRecorder` — gravação do vídeo
  - `Blob` + `URL.createObjectURL()` — download do vídeo gravado

## Estrutura de Pastas

```
src/
├── components/
│   ├── Teleprompter/
│   │   ├── Teleprompter.tsx        # Componente principal
│   │   ├── ScrollingText.tsx       # Texto rolando sobre o vídeo
│   │   ├── Controls.tsx            # Botões play/pause/stop/download
│   │   └── Settings.tsx            # Velocidade, tamanho da fonte, etc.
│   └── ScriptEditor/
│       └── ScriptEditor.tsx        # Textarea para digitar o roteiro
├── hooks/
│   ├── useCamera.ts                # Gerencia stream da câmera
│   ├── useMediaRecorder.ts         # Gerencia gravação
│   └── useTeleprompter.ts          # Lógica de scroll automático
├── App.tsx
└── main.tsx
```

## Funcionalidades Principais

### 1. Editor de Roteiro
- Textarea para o usuário colar ou digitar o texto
- Botão para iniciar o teleprompter após confirmar o roteiro

### 2. Câmera Frontal
- Solicitar permissão de câmera + microfone ao iniciar
- Exibir preview ao vivo da câmera em tela cheia ou grande
- Usar `facingMode: 'user'` para câmera frontal

### 3. Teleprompter (Texto Rolando)
- Texto sobreposto ao vídeo da câmera (overlay semitransparente)
- Auto-scroll suave e contínuo
- Controles de velocidade de scroll (ex: 1x a 5x)
- Tamanho de fonte ajustável
- Play / Pause do scroll com barra de espaço

### 4. Gravação de Vídeo
- Gravar áudio + vídeo simultaneamente via `MediaRecorder`
- Indicador visual de "gravando" (bolinha vermelha piscando)
- Botão para parar a gravação

### 5. Download do Vídeo
- Após parar, disponibilizar botão de download
- Formato preferido: `webm` (melhor suporte cross-browser)
- Nome do arquivo sugerido: `gravacao-YYYY-MM-DD.webm`

## Fluxo do Usuário

```
1. Usuário abre o app
2. Cola/digita o roteiro na tela inicial
3. Clica em "Iniciar Teleprompter"
4. Browser pede permissão de câmera/microfone
5. Tela muda para modo teleprompter:
   - Câmera ao vivo em tela cheia
   - Texto do roteiro sobreposto, rolando de baixo para cima
6. Usuário clica em "Gravar" (ou tecla R)
7. Lê o roteiro olhando para a câmera
8. Clica em "Parar Gravação"
9. Botão de "Baixar Vídeo" aparece
10. Usuário baixa o .webm
```

## Atalhos de Teclado

| Tecla | Ação |
|-------|------|
| `Espaço` | Play / Pause do scroll |
| `R` | Iniciar / Parar gravação |
| `↑` / `↓` | Aumentar / Diminuir velocidade |
| `Esc` | Voltar para o editor |

## Considerações de UX

- Interface escura por padrão (melhor contraste para leitura)
- Fonte grande e legível por padrão (mínimo 32px)
- Scroll suave (`scroll-behavior: smooth`)
- Texto centralizado, largura máxima ~70% da tela para não distrair
- Opacidade do overlay de texto: ~85% para não cobrir totalmente o preview
- Indicador de progresso do roteiro (quanto falta)

## Limitações Conhecidas

- `MediaRecorder` não suporta MP4 nativo em todos os browsers; usar `.webm`
- Em Safari/iOS, `MediaRecorder` tem suporte limitado — documentar isso
- A gravação captura o stream da câmera, não a tela (o texto do teleprompter não entra no vídeo — isso é intencional)

## Comandos

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build de produção
npm run build
```