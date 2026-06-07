# TESTING.md - Guia de Testes da Extensão Resumo IA

Este documento descreve como testar manualmente a extensão de forma sistemática.

> **Importante**: Atualmente não existem testes automatizados. Todos os testes são manuais.
>
> Antes de começar qualquer teste, certifique-se de que a extensão foi carregada corretamente seguindo a seção **"Como Carregar a Extensão no Chrome"** abaixo.

## Como Carregar a Extensão no Chrome (Passo a Passo)

**Importante:** Para usar e testar esta extensão **não é necessário compactar (zipar)** o projeto.

### Desenvolvimento com React (Recomendado)

```bash
npm install
npm run build
```

A extensão agora possui interface React completa (conexão + análise). Carregue normalmente após o build.

### Quando você precisa compactar (zipar)?

- **Somente** quando for publicar a extensão na **Chrome Web Store**.
- Não é necessário para desenvolvimento, testes ou uso pessoal.

**Resumo:**
- Desenvolvimento/Testes → Use "Carregar sem compactação" (não zipar)
- Publicar na loja → Criar arquivo .zip da pasta raiz

### Recarregando a Extensão Após Alterações

Toda vez que você editar algum arquivo (`.js`, `.html`, `.css`, `manifest.json`), faça o seguinte:

1. Vá em `chrome://extensions/`
2. Localize a extensão "Resumo IA - Digisac & WhatsApp"
3. Clique no ícone de **recarregar** (seta circular ⟳)
4. Feche e reabra o popup da extensão para as mudanças aparecerem

---

### Observação sobre ícones

O `manifest.json` referencia os arquivos `icons/icon16.png`, `icons/icon48.png` e `icons/icon128.png`. Eles precisam existir antes de carregar a extensão no Chrome.

**Como substituir os ícones:**

1. Crie ou baixe 3 ícones PNG:
   - `icons/icon16.png` (16×16)
   - `icons/icon48.png` (48×48)
   - `icons/icon128.png` (128×128)

2. Mantenha o `manifest.json` apontando para o popup gerado pelo Vite e os ícones:

```json
"action": {
  "default_popup": "dist/src/popup.html",
  "default_icon": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
},
"icons": {
  "16": "icons/icon16.png",
  "48": "icons/icon48.png",
  "128": "icons/icon128.png"
}
```

3. Recarregue a extensão em `chrome://extensions/`.

Dica: Você pode gerar ícones simples gratuitamente em sites como:
- https://www.favicon-generator.org/
- https://realfavicongenerator.net/

---

## Ambiente Necessário

- Google Chrome (versão 120 ou superior)
- Extensão carregada corretamente via "Carregar sem compactação" (veja seção acima)
- Conta Google com API Key do Gemini válida (crie em https://makersuite.google.com/app/apikey)
- Acesso a uma conversa real no **Digisac** ou **WhatsApp Web**
- DevTools do navegador abertos (F12)

## Como Configurar a API Key para Testes

Abra o popup da extensão e informe a chave na tela **Conectar ao Gemini**.

Para preparar o estado via console, use o formato atual do storage:

```js
chrome.storage.local.set({ geminiAuth: { type: 'apikey', key: 'SUA_CHAVE_AQUI' } })
```

Recarregue o popup após configurar.

## Casos de Teste Manuais

### TC01 - Carregamento da Extensão no Chrome

**Passos detalhados:**

1. Abra `chrome://extensions/`
2. Ative o **Modo do desenvolvedor**
3. Clique em **"Carregar sem compactação"**
4. Selecione a pasta raiz do projeto (onde está o `manifest.json`)
5. Verifique se a extensão aparece na lista sem mensagens de erro vermelhas
6. Clique no ícone da extensão na barra de ferramentas do Chrome
7. Observe se o popup abre normalmente

**Resultado esperado:**
- A extensão aparece na lista de extensões
- Não há erros vermelhos na página `chrome://extensions/`
- O popup abre e mostra a tela de conexão ou a tela principal, se já existir autenticação salva
- O console do popup (botão direito → Inspecionar) não mostra erros críticos

**Problemas comuns e soluções:**

| Problema | Causa Provável | Solução |
|----------|----------------|---------|
| Botão "Carregar sem compactação" não aparece | Modo desenvolvedor desativado | Ative o toggle no canto superior direito |
| Erro "Manifest file is missing or unreadable" | Selecionou a pasta errada | Selecione a pasta que contém o `manifest.json` (não uma subpasta) |
| Ícone da extensão aparece quebrado / erro ao carregar | Arquivos em `icons/` ausentes ou caminho incorreto no manifest | Confirme `icons/icon16.png`, `icons/icon48.png` e `icons/icon128.png` |
| Popup não abre ao clicar no ícone | Build ausente ou erro no popup React | Rode `npm run build` e abra o console do popup |
| Extensão some após recarregar o Chrome | Normal | Basta recarregar a extensão em `chrome://extensions/` |

**Após modificar código:**
- Sempre clique no botão de **recarregar** (⟳) na página `chrome://extensions/`
- Feche e reabra o popup da extensão

**Onde verificar no código:** `src/popup/App.tsx`, `src/popup/MainScreen.tsx` e `manifest.json`

---

### TC02 - Coleta em Página Suportada

**Passos:**
1. Abra uma aba com `https://web.digisac.com.br`
2. Abra o popup da extensão
3. Clique em **📥 Coletar Mensagens**

**Resultado esperado:**
- O status de coleta aparece no popup
- O mesmo teste com WhatsApp Web deve conseguir coletar a conversa ativa

**Onde verificar:** `content.js` e `src/popup/services/chromeTabs.ts`

---

### TC03 - Coleta de Mensagens

**Passos:**
1. Abra uma conversa com várias mensagens no Digisac ou WhatsApp
2. Clique no botão **📥 Coletar Mensagens**

**Resultado esperado:**
- Botão fica em estado "Coletando..."
- Após alguns segundos aparece "X mensagens coletadas"
- O contador de mensagens é atualizado
- Botão "Enviar para IA" é habilitado

**Onde verificar:** `src/popup/MainScreen.tsx`, `src/popup/services/chromeTabs.ts` e `content.js`

---

### TC04 - Limpeza, Deduplicação e Filtros

**Passos:**
1. Colete mensagens de uma conversa
2. Abra o DevTools da aba do Digisac/WhatsApp e observe os logs `[Content]`

**O que verificar nos logs:**
- Mensagens com menos de 3 caracteres são ignoradas
- Textos como "menu", "enviar", "digite" são filtrados
- Mensagens duplicadas não aparecem duas vezes
- Cada mensagem é truncada em no máximo 500 caracteres

**Onde verificar:** `content.js` (`cleanText`, `isIgnoredText` e `buildMessage`)

---

### TC05 - Persistência de Dados

**Passos:**
1. Colete mensagens com sucesso
2. Feche completamente o popup
3. Reabra a extensão na mesma aba

**Resultado esperado:**
- O contador de mensagens continua mostrando o mesmo número
- Se já havia resposta da IA, ela continua visível

**Onde verificar:** `src/popup/MainScreen.tsx` + `src/popup/services/storage.ts`

---

### TC06 - Fluxo Completo "Enviar para IA" (Happy Path)

**Passos:**
1. Tenha mensagens coletadas
2. Clique em **🚀 Enviar para IA**
3. Aguarde o processamento

**Resultado esperado:**
- Botão mostra "Enviando para Gemini..."
- Após 5-15 segundos o resumo aparece na área "Resumo Gerado"
- Mensagem de sucesso verde é exibida
- A resposta fica salva e aparece ao reabrir o popup

**Onde verificar:** `src/popup/MainScreen.tsx` + `src/popup/services/gemini.ts`

---

### TC07 - Tratamento de Erros da API

Execute cada sub-caso separadamente:

**A. Sem API Key configurada**
- Remova a chave do storage
- Clique em Enviar para IA
- Deve aparecer erro: "Autenticação não encontrada"

**B. Chave inválida**
- Coloque uma chave falsa
- Deve aparecer erro de autenticação

**C. Sem internet**
- Desconecte a internet ou use um bloqueador
- Deve aparecer erro de comunicação, rede ou resposta inválida

**D. Rate limit (429)**
- Faça várias requisições rápidas seguidas
- Deve aparecer: "Limite de uso do Gemini atingido. Tente novamente mais tarde"

**E. Texto muito longo (token limit)**
- Colete 150+ mensagens longas
- Deve aparecer erro de comunicação com a API ou resposta inválida

**Onde verificar:** `src/popup/services/gemini.ts` e tratamento de status em `src/popup/MainScreen.tsx`

---

### TC08 - Botões de Ação

**Passos:**
1. Tenha uma resposta gerada pela IA visível
2. Teste cada botão:

- **Copiar** → copia o texto e mostra "Copiado para a área de transferência!"
- **Enviar para chamado** → copia o resumo e abre a URL configurada, quando houver
- **Limpar tudo** → remove os dados, zera o contador e esconde a resposta

**Onde verificar:** `src/popup/MainScreen.tsx`

---

### TC09 - Verificação de Logs no Console

Com o DevTools aberto, execute os fluxos de coleta e envio e confirme os pontos de debug disponíveis:

- `[Content]`
- botão de engrenagem no popup para imprimir o último erro de autenticação

Exemplos de logs importantes:
- `[Content] 47 mensagens extraídas`
- `[Gemini Auth Error]` quando houver erro salvo

**Onde verificar:** `content.js` e `src/popup/App.tsx`.

---

### TC10 - Casos Extremos

**Conversa vazia**
- Clique em Coletar Mensagens em um chat sem mensagens
- Deve mostrar quantidade 0 e manter botão Enviar desabilitado

**Página não suportada**
- Abra qualquer site (ex: google.com)
- Popup deve mostrar aviso amarelo

**Recarregar página durante coleta**
- Inicie uma coleta e recarregue a aba do Digisac/WhatsApp
- O content script será reinjetado automaticamente na próxima coleta

---

## Como Inspecionar as Chamadas para o Gemini

1. No popup da extensão, abra DevTools (botão direito → Inspecionar)
2. Vá na aba **Network**
3. Filtre por `generativelanguage`
4. Clique em "Enviar para IA"
5. Clique na requisição → veja o `prompt` completo no payload e a resposta da IA

---

## Dicas de Debug Rápido

| Problema | Onde olhar primeiro |
|----------|---------------------|
| Extensão não aparece após carregar | Verifique se selecionou a pasta correta (deve conter `manifest.json`) |
| Erro "Could not load icon..." | Ícones no manifest não existem (já corrigido temporariamente — veja seção acima) |
| Erro "Manifest file is missing" | Selecionou subpasta em vez da raiz do projeto |
| Popup não abre ou fica em branco | Abra o console do popup (botão direito no popup → Inspecionar) |
| Nenhuma mensagem é coletada | `content.js:52-57` (seletores) + inspecione o DOM da página |
| Erro ao injetar script | Console da aba (não do popup) |
| Resposta da IA vem truncada | `src/popup/services/gemini.ts` (adicionar `generationConfig` se necessário) |
| Dados somem ao fechar popup | `src/popup/services/storage.ts` (verificar gravação de `collectedMessages`/`lastSummary`) |
| Muitas mensagens irrelevantes | `content.js:65-72` (filtros de limpeza) |

---

## Testes Futuros (Sugestões)

- Criar testes automatizados com Puppeteer + Chrome Headless
- Mockar respostas da API Gemini
- Testes de performance com 300+ mensagens

---

**Referência principal de código:**
- Coleta → `content.js`
- UI e orquestração → `src/popup/App.tsx` e `src/popup/MainScreen.tsx`
- Comunicação com IA → `src/popup/services/gemini.ts`
- Armazenamento → `src/popup/services/storage.ts`
- Prompts → `src/popup/services/gemini.ts`

Boa sorte nos testes!
