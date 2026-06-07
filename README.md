# 🚀 TicketBoost - Extensão Chrome

Extensão profissional Manifest V3 que captura mensagens, otimiza com dados relevantes e agiliza a abertura de chamados com IA. Ideal para times de suporte que utilizam sistemas como GLPI, Jira, TomTicket e Service Desk.

## 📑 Sumário

- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Funcionalidades](#-funcionalidades-implementadas)
- [Instalação](#-instalação-e-desenvolvimento)
- [Pré-requisitos](#-pré-requisitos)
- [Fluxo de Uso](#-fluxo-de-uso)
- [Como Funciona](#-como-funciona)
- [Documentação Complementar](#-documentação-complementar)
- [Segurança](#%EF%B8%8F-segurança---api-key)
- [Testes](#-testes)
- [Limitações Conhecidas](#-limitações-conhecidas)
- [Publicação](#-publicação-no-chrome-web-store-futuro)
- [Logs e Debug](#-logs-e-debug)

## 📁 Estrutura do Projeto

```
puglin-summary-called-grok4.3/
├── src/
│   ├── popup.html              # Entry point do popup React
│   └── popup/                  # Componentes React
│       ├── App.tsx
│       ├── MainScreen.tsx
│       ├── main.tsx
│       ├── services/             # Storage, abas Chrome e Gemini
│       ├── types.ts              # Tipos compartilhados
│       └── index.css
├── dist/                       # Build gerado (não versionar)
├── manifest.json
├── vite.config.ts
├── package.json
├── content.js                  # Content Script (usado pela tela principal)
├── icons/
├── README.md
└── docs/
    ├── PROMPT.md
    ├── ARCHITECTURE.md
    ├── TESTING.md
    └── COMMITS.md
```

> **Nota**: A interface principal é React + Tailwind + Framer Motion (em `src/popup/`), com serviços separados para integração Chrome, storage e Gemini.

## ✅ Funcionalidades Implementadas

- ✅ Captura de mensagens com `querySelector` + `MutationObserver`
- ✅ Limpeza automática de texto e remoção de duplicatas
- ✅ Botão "Coletar Mensagens" com feedback visual
- ✅ Botão "Enviar para IA" com loading e tratamento de erro
- ✅ Integração Gemini 2.5 Flash
- ✅ Prompt padrão para resumo de chamados de suporte (formato corporativo para GLPI, Jira, TomTicket etc)
- ✅ Botão copiar resposta
- ✅ Botão "Enviar para chamado" (copia resumo + abre formulário configurável)
- ✅ Configuração de URL do formulário de chamado
- ✅ Sistema de logs e tratamento de erros
- ✅ Chamada ao Gemini centralizada em serviço dedicado
- ✅ Design moderno e responsivo

## 🔧 Instalação e Desenvolvimento

### 1. Desenvolvimento com React (Recomendado)

```bash
# Instale as dependências
npm install

# Rode em modo desenvolvimento
npm run dev

# Build para produção
npm run build
```

Após o build, carregue a extensão:

1. Abra `chrome://extensions/`
2. Ative **Modo do desenvolvedor**
3. Clique em **"Carregar sem compactação"**
4. Selecione a pasta raiz do projeto

O popup usa a interface React gerada em `dist/src/popup.html`.

**Dica importante:**  
Sempre rode `npm run build` após alterações no React para atualizar a pasta `dist/`.

A extensão agora possui uma interface React unificada com tela de conexão e tela principal de análise.

### Debug de Autenticação

- Clique no ícone de engrenagem no header do popup para imprimir o último erro de autenticação no console.
- Os erros também ficam salvos em `chrome.storage.local` na chave `lastAuthError`.

### 2. Como gerar a API Key do Gemini

1. Acesse: https://makersuite.google.com/app/apikey
2. Faça login com sua conta Google
3. Clique em **Create API Key**
4. Copie a chave gerada

### 3. Configurar a API Key na extensão

Atualmente a chave é configurada na própria tela de conexão e armazenada via `chrome.storage.local`.

**Opção recomendada para desenvolvimento:**
- Informe a API Key no popup.
- Se precisar preparar via DevTools do popup → Console, execute:
  ```js
  chrome.storage.local.set({ geminiAuth: { type: 'apikey', key: 'SUA_CHAVE_AQUI' } })
  ```

**Futuramente (produção):**
- Mova a chave para um backend próprio
- A extensão faz requisição para seu servidor
- Seu servidor proxya para Gemini (mais seguro)

## 📋 Pré-requisitos

- Google Chrome 120 ou superior
- Conta Google com API Key ativa do Gemini (crie gratuitamente em https://makersuite.google.com/app/apikey)
- Acesso a conversas no **Digisac Web** ou **WhatsApp Web**
- Conhecimento básico de DevTools do navegador (para configurar a chave na primeira vez)

## 📋 Fluxo de Uso

1. Abra uma conversa no **Digisac** ou **WhatsApp Web**
2. Clique no ícone da extensão
3. Clique em **📥 Coletar Mensagens**
4. Aguarde a contagem de mensagens
5. Clique em **🚀 Enviar para IA**
6. Aguarde o processamento (pode levar 5-15s)
7. Leia o resumo estruturado
8. Clique em **Copiar** ou **Enviar para chamado**

## 🔄 Como Funciona (Arquitetura)

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

**Resumo do fluxo**:
1. Usuário clica em "Coletar Mensagens"
2. Popup envia mensagem para o content script da aba ativa
3. Content script extrai, limpa e deduplica mensagens do DOM
4. Dados são salvos em `chrome.storage.local`
5. Ao clicar "Enviar para IA", o popup monta o prompt estruturado
6. `services/gemini.ts` faz a chamada ao Gemini
7. Resposta é exibida e salva para uso posterior

Para detalhes técnicos completos, consulte o arquivo **`docs/ARCHITECTURE.md`**.

## 📚 Documentação Complementar

- **`docs/PROMPT.md`** — Explicação completa do prompt técnico de suporte + exemplos reais de input/output
- **`docs/TESTING.md`** — Guia detalhado de testes manuais (10 casos de teste com passos e referências ao código)

- **`docs/ARCHITECTURE.md`** — Diagrama de arquitetura, responsabilidades de cada módulo e decisões técnicas
## 🛡️ Segurança - API Key

**Nunca** deixe a API Key hardcoded no código.

Soluções recomendadas:

| Nível | Solução | Segurança |
|-------|---------|---------|
| Dev | `chrome.storage.local` | Baixa |
| Prod | Backend proxy + autenticação | Alta |
| Enterprise | Google Cloud Vertex AI + OAuth | Máxima |

## 🧪 Testes

### Testes Rápidos Recomendados

- Coleta em Digisac com 50+ mensagens
- Coleta em WhatsApp Web com conversas longas
- Teste de limite de tokens (coletar muitas mensagens)
- Teste sem internet (desconecte o Wi-Fi durante o envio)
- Teste com API Key inválida ou ausente

### Guia Completo de Testes

Para uma bateria completa e sistemática de testes manuais (incluindo todos os cenários de erro, logs esperados e referências de código), leia o arquivo:

📄 **`docs/TESTING.md`** — 10 casos de teste detalhados com passos, resultados esperados e dicas de debug.

## ⚠️ Limitações Conhecidas

- Os seletores de mensagens (`content.js`) são genéricos e podem precisar de ajustes quando Digisac ou WhatsApp Web atualizarem sua interface.
- A API Key fica armazenada em `chrome.storage.local` (visível via DevTools).
- Não existe ainda uma página de configurações bonitas (`options.html`).
- Ícones foram removidos temporariamente do manifest para evitar erro de carregamento (pasta `icons/` está vazia).
- O fetch para o Gemini é feito no contexto do popup (se o popup for fechado durante o processamento, a requisição é cancelada).
- O content script só é injetado automaticamente nas hosts declaradas no manifest.

Para explicação técnica detalhada, consulte **`docs/ARCHITECTURE.md`**.

## 📦 Publicação no Chrome Web Store (Futuro)

1. Crie uma conta de desenvolvedor ($5)
2. Empacote a extensão: `zip -r extension.zip . -x "*.git*" -x "node_modules/*"`
3. Acesse: https://chrome.google.com/webstore/devconsole
4. Preencha informações, screenshots, política de privacidade
5. Envie para revisão

## 📝 Logs e Debug

Todos os módulos possuem logs no console com prefixo claro:

- `[Content]` — extração de mensagens e MutationObserver
- `[Popup]` — fluxo da interface e chamadas
- Serviço Gemini — chamada centralizada em `src/popup/services/gemini.ts`
- Serviço Storage — leitura/escrita centralizada em `src/popup/services/storage.ts`
- `[Background]` — eventos do service worker

**Dica**: Sempre abra o DevTools do popup (botão direito no popup → Inspecionar) para ver os logs durante os testes.

Consulte também a seção de debug em **`docs/TESTING.md`**.

---

**Desenvolvido com React + TypeScript • Manifest V3 • Gemini 2.5 Flash**

**Documentação principal**:
- `README.md` (este arquivo)
- `docs/PROMPT.md`
- `docs/TESTING.md`
- `docs/ARCHITECTURE.md`
- `docs/COMMITS.md`
