# ARCHITECTURE.md - Arquitetura da Extensão Resumo IA

Este documento descreve a arquitetura técnica da extensão Chrome Manifest V3.

## Visão Geral

A extensão segue o modelo **Manifest V3** com Service Worker (background.js) mínimo. A maior parte da lógica roda no contexto do **popup** e do **content script**.

### Princípios de Design

- **Nova interface**: React + Tailwind + Framer Motion (em `src/popup/`)
- Separação clara de responsabilidades
- Comunicação assíncrona via `chrome.runtime` messaging
- Tratamento centralizado de erros na camada de serviço do Gemini
- Armazenamento local simples via `chrome.storage.local`
- Integração com sistemas de chamados via URL configurável + clipboard (sem preenchimento automático por enquanto)

## Diagrama de Fluxo Principal

```mermaid
flowchart TD
    subgraph Usuário
        U[Abre popup na conversa Digisac/WA]
    end

    U -->|1. Abre o popup React| P[App.tsx]
    P -->|Autenticado| C[Clique "Coletar Mensagens"]
    
    C -->|2. chrome.tabs.sendMessage| CS[content.js: collectMessages]
    CS --> E[extractMessages + cleanText + dedup via Set]
    E -->|3. Retorna array de mensagens| P2[MainScreen.tsx]
    
    P2 -->|4. Salva| S[services/storage.ts]
    S --> UI[Atualiza contador na interface]
    
    UI --> H[Clique "Enviar para IA"]
    
    H -->|5. Monta texto numerado| A[services/gemini.ts]
    A -->|6. Gera prompt| PR[buildSummaryPrompt]
    
    PR -->|7. Chama Gemini| API[generateGeminiSummary]
    API -->|8. POST fetch| G[Gemini 2.5 Flash<br/>generativelanguage.googleapis.com]
    
    G -->|Sucesso| R[Exibe resposta formatada]
    R -->|9. Persiste| SR[services/storage.ts]
    
    G -->|Erro token / rede / resposta inválida| ERR[status amigável no popup]
    
    style U fill:#e0f2fe
    style G fill:#fef3c7
    style ERR fill:#fee2e2
```

## Responsabilidades dos Módulos

### Camada React (Principal)

| Arquivo | Responsabilidade |
|---------|------------------|
| `src/popup/App.tsx` | App principal com duas views (conexão + análise) |
| `src/popup/MainScreen.tsx` | Tela de coleta de mensagens e envio para Gemini |
| `src/popup/services/chromeTabs.ts` | Comunicação com aba ativa e abertura de novas abas |
| `src/popup/services/gemini.ts` | Montagem do prompt e chamada ao Gemini |
| `src/popup/services/storage.ts` | Acesso tipado ao `chrome.storage.local` |
| `src/popup/types.ts` | Tipos compartilhados do popup |
| `vite.config.ts` | Build do React para `dist/` |

### Módulos Utilizados

| Arquivo | Responsabilidade | Chrome APIs principais |
|---------|------------------|------------------------|
| `manifest.json` | Declaração da extensão | — |
| `content.js` | Extração de mensagens da página | `runtime.onMessage` |

## Fluxo de Comunicação Detalhado

### 1. Coleta de Dados (On-demand)

```
MainScreen.tsx
  └── collectMessagesFromActiveTab()
  └── chrome.tabs.sendMessage(tabId, { action: 'collectMessages' })
        └── content.js
              └── extractMessages()
                    └── querySelectorAll + filtros + cleanText
              └── sendResponse({ success, messages, count, platform })
```

- A coleta **nunca é automática**. O usuário precisa clicar no botão.
- O MutationObserver existe apenas para log de debug (`content.js:103-133`).

### 2. Envio para IA

```
MainScreen.tsx
  └── generateGeminiSummary(messages, apiKey)
        └── services/gemini.ts
              └── Monta string numerada a partir das mensagens
              └── Gera prompt técnico estruturado
              └── fetch POST para Gemini 2.5 Flash com timeout
              └── Extrai o texto da resposta ou retorna erro amigável por status HTTP
```

### 3. Armazenamento

Todos os dados são salvos em `chrome.storage.local`:

- `collectedMessages`: array de mensagens
- `lastSummary`: último resumo gerado pela IA
- `geminiAuth`: autenticação do Gemini (`type: "apikey"`, `key`)
- `lastAuthError`: último erro de autenticação registrado
- `ticketFormUrl`: URL opcional do formulário de chamado

**Limite**: ~10 MB (suficiente para centenas de mensagens).

## Chrome APIs Utilizadas

Declaradas no `manifest.json`:

```json
"permissions": ["storage", "activeTab", "scripting"],
"host_permissions": [
  "https://web.digisac.com.br/*",
  "https://web.whatsapp.com/*",
  "https://generativelanguage.googleapis.com/*"
]
```

APIs efetivamente usadas no código:

- `chrome.tabs.query` + `sendMessage`
- `chrome.scripting` (permissão disponível para evolução/fallbacks)
- `chrome.storage.local`
- `chrome.runtime.onMessage` (no content script)
- Service worker `background.js` mínimo para inicialização/log

## Decisões Arquiteturais Importantes

### Por que o fetch para Gemini é feito no popup e não no background?

- Simplicidade (evita complexidade de message passing para o service worker)
- O popup já tem acesso ao DOM e ao storage
- Em MV3 o service worker é efêmero — manter lógica pesada nele é arriscado

**Trade-off**: Se o usuário fechar o popup durante o processamento, a requisição é cancelada.

### Por que os seletores são tão genéricos?

O Digisac e o WhatsApp Web mudam frequentemente suas classes CSS.  
Usamos seletores amplos + filtros agressivos de texto (`content.js:65-72`) como estratégia defensiva.

**Consequência**: Pode capturar lixo em algumas versões → o usuário deve inspecionar o DOM e ajustar os seletores quando necessário.

### Por que não existe página de Options ainda?

Decisão consciente para manter o escopo mínimo.  
Atualmente a chave é configurada na tela de conexão React.  
Futuramente recomenda-se criar uma página de options caso as configurações cresçam.

## Limitações Atuais da Arquitetura

1. **API Key exposta** — Qualquer pessoa com acesso ao DevTools do popup consegue ler a chave armazenada.
2. **Sem injeção automática em todas as abas** — Content script só roda nas hosts declaradas.
3. **Sem tratamento de quota avançado** — Ainda não há retry/backoff dedicado para limites da API.
4. **Response da IA é texto puro** — Não há parsing estruturado (JSON mode ainda não usado).

## Como Estender a Extensão (diretrizes)

- **Novo seletor de plataforma**: edite `content.js` → `SELECTORS` e `detectPlatform()`
- **Novo tipo de prompt**: adicione helpers em `src/popup/services/gemini.ts` e atualize a UI se necessário
- **Melhor tratamento de erro da API**: concentre as mudanças em `src/popup/services/gemini.ts`
- **Persistência entre sessões**: use `src/popup/services/storage.ts` em vez de acessar `chrome.storage` diretamente no React

---

**Resumo**: A arquitetura é simples, modular e fácil de manter. O ponto mais frágil atualmente é a extração de texto via DOM (seletores) e o armazenamento da API Key em local storage.

## Integração com Sistemas de Chamados (Atual)

- Botão "Enviar para chamado" em `MainScreen.tsx`
- Fluxo: copia o resumo para `navigator.clipboard` + abre a URL configurada em nova aba via `chrome.tabs.create`
- URL do formulário é armazenada em `chrome.storage.local` sob a chave `ticketFormUrl`
- **Sem preenchimento automático de campos** (evita dependência de seletores CSS frágil por enquanto)
- Futuro: quando necessário, evoluir para mapeamento de campos por sistema (GLPI, Jira, etc.)
