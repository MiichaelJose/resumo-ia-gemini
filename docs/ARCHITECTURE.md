# ARCHITECTURE.md - Arquitetura da Extensão Resumo IA

Este documento descreve a arquitetura técnica da extensão Chrome Manifest V3.

## Visão Geral

A extensão segue o modelo **Manifest V3** com Service Worker (background.js) mínimo. A maior parte da lógica roda no contexto do **popup** e do **content script**.

### Princípios de Design

- **Nova interface**: React + Tailwind + Framer Motion (em `src/popup/`)
- Separação clara de responsabilidades
- Comunicação assíncrona via `chrome.runtime` messaging
- Tratamento robusto de erros e retry na camada de API
- Armazenamento local simples via `chrome.storage.local`
- Integração com sistemas de chamados via URL configurável + clipboard (sem preenchimento automático por enquanto)

## Diagrama de Fluxo Principal

```mermaid
flowchart TD
    subgraph Usuário
        U[Abre popup na conversa Digisac/WA]
    end

    U -->|1. Verifica página ativa| P[payload.js: checkCurrentPage]
    P -->|Página suportada| C[Clique "Coletar Dados"]
    
    C -->|2. chrome.tabs.sendMessage| CS[content.js: collectMessages]
    CS --> E[extractMessages + cleanText + dedup via Set]
    E -->|3. Retorna array de mensagens| P2[payload.js]
    
    P2 -->|4. Salva| S[storage.js: saveData]
    S --> UI[Atualiza contador na interface]
    
    UI --> H[Clique "Enviar para IA"]
    
    H -->|5. Monta texto numerado| A[payload.js:140-143]
    A -->|6. Gera prompt| PR[prompts.js: generatePrompt]
    
    PR -->|7. Chama com retry| API[api.js: sendToGemini]
    API -->|8. POST fetch com timeout| G[Gemini 2.5 Flash<br/>generativelanguage.googleapis.com]
    
    G -->|Sucesso| R[Exibe resposta formatada]
    R -->|9. Persiste| SR[storage.js: saveResponse]
    
    G -->|Erro 429 / token / rede| ERR[showStatus com mensagem amigável<br/>api.js:82-125]
    
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
| `vite.config.ts` | Build do React para `dist/` |

### Módulos Utilizados

| Arquivo | Responsabilidade | Chrome APIs principais |
|---------|------------------|------------------------|
| `manifest.json` | Declaração da extensão | — |
| `content.js` | Extração de mensagens da página | `runtime.onMessage` |

## Fluxo de Comunicação Detalhado

### 1. Coleta de Dados (On-demand)

```
popup.js
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
popup.js:140
  └── Monta string numerada a partir das mensagens
  └── Prompts.generatePrompt(texto, 'structured')
  └── API.sendToGemini(prompt)
        └── (dentro de api.js)
              └── 3 tentativas com backoff
              └── AbortController + timeout de 30s
              └── fetch POST para Gemini
              └── Tratamento específico de 429 e erros de token
```

### 3. Armazenamento

Todos os dados são salvos em `chrome.storage.local`:

- `collectedData`: array de mensagens
- `lastResponse`: último resumo gerado pela IA
- `geminiApiKey`: chave da API (armazenada pelo usuário manualmente)

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
- `chrome.scripting.executeScript` (fallback de injeção)
- `chrome.storage.local`
- `chrome.runtime.onMessage` (no content script)
- `chrome.runtime.onInstalled` (no background)

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
Atualmente a chave é configurada via DevTools/console.  
Futuramente recomenda-se criar `options.html` + `options.js` com formulário bonito.

## Limitações Atuais da Arquitetura

1. **API Key exposta** — Qualquer pessoa com acesso ao DevTools do popup consegue ler a chave armazenada.
2. **Sem injeção automática em todas as abas** — Content script só roda nas hosts declaradas.
3. **Ícones faltando** — A pasta `icons/` está vazia (extensão usa ícone padrão do Chrome).
4. **Sem tratamento de quota avançado** — Apenas retry simples.
5. **Response da IA é texto puro** — Não há parsing estruturado (JSON mode ainda não usado).

## Como Estender a Extensão (diretrizes)

- **Novo seletor de plataforma**: edite `content.js` → `SELECTORS` e `detectPlatform()`
- **Novo tipo de prompt**: adicione em `prompts.js` e atualize o botão no popup se necessário
- **Melhor tratamento de erro da API**: concentre as mudanças em `api.js:104-125`
- **Persistência entre sessões**: use o módulo `storage.js` (não acesse `chrome.storage` diretamente)

---

**Resumo**: A arquitetura é simples, modular e fácil de manter. O ponto mais frágil atualmente é a extração de texto via DOM (seletores) e o armazenamento da API Key em local storage.

## Integração com Sistemas de Chamados (Atual)

- Botão "Enviar para chamado" em `MainScreen.tsx`
- Fluxo: copia o resumo para `navigator.clipboard` + abre a URL configurada em nova aba via `chrome.tabs.create`
- URL do formulário é armazenada em `chrome.storage.local` sob a chave `ticketFormUrl`
- **Sem preenchimento automático de campos** (evita dependência de seletores CSS frágil por enquanto)
- Futuro: quando necessário, evoluir para mapeamento de campos por sistema (GLPI, Jira, etc.)
