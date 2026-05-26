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

### Erro Comum: "Could not load icon 'icons/icon16.png'"

Este é o erro exato que você acabou de encontrar.

**Causa:**  
O `manifest.json` estava referenciando arquivos de ícone (`icons/icon16.png`, etc.) que não existem na pasta `icons/`.

**Solução aplicada agora:**
- Removemos temporariamente as referências de ícones do `manifest.json`.
- A extensão agora carrega normalmente usando o ícone padrão do Chrome (peça de quebra-cabeça).

**Como adicionar ícones reais depois:**

1. Crie ou baixe 3 ícones PNG:
   - `icons/icon16.png` (16×16)
   - `icons/icon48.png` (48×48)
   - `icons/icon128.png` (128×128)

2. Adicione de volta no `manifest.json`:

```json
"action": {
  "default_popup": "popup.html",
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

Abra o popup da extensão → clique com botão direito → Inspecionar → Console e execute:

```js
chrome.storage.local.set({ geminiApiKey: 'SUA_CHAVE_AQUI' })
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
- O popup abre e mostra a mensagem "Verificando página..."
- O console do popup (botão direito → Inspecionar) não mostra erros críticos

**Problemas comuns e soluções:**

| Problema | Causa Provável | Solução |
|----------|----------------|---------|
| Botão "Carregar sem compactação" não aparece | Modo desenvolvedor desativado | Ative o toggle no canto superior direito |
| Erro "Manifest file is missing or unreadable" | Selecionou a pasta errada | Selecione a pasta que contém o `manifest.json` (não uma subpasta) |
| Ícone da extensão aparece quebrado / erro ao carregar | Referências a ícones no manifest.json apontam para arquivos que não existem | Solução aplicada: ícones foram removidos temporariamente do manifest. A extensão agora carrega com o ícone padrão do Chrome. |
| Popup não abre ao clicar no ícone | Erro no `popup.html` ou scripts | Abra o console do popup e veja o erro |
| Extensão some após recarregar o Chrome | Normal | Basta recarregar a extensão em `chrome://extensions/` |

**Após modificar código:**
- Sempre clique no botão de **recarregar** (⟳) na página `chrome://extensions/`
- Feche e reabra o popup da extensão

**Onde verificar no código:** `popup.js:249-258` (função `init`) e `manifest.json`

---

### TC02 - Detecção de Página Suportada

**Passos:**
1. Abra uma aba com `https://web.digisac.com.br`
2. Abra o popup da extensão

**Resultado esperado:**
- Status mostra "✅ Página suportada: **Digisac**" com borda verde
- O mesmo teste com WhatsApp Web deve mostrar "WhatsApp Web"

**Onde verificar:** `popup.js:53-78`

---

### TC03 - Coleta de Mensagens

**Passos:**
1. Abra uma conversa com várias mensagens no Digisac ou WhatsApp
2. Clique no botão **📥 Coletar Dados**

**Resultado esperado:**
- Botão fica em estado "Processando..."
- Após alguns segundos aparece "✅ X mensagens coletadas com sucesso!"
- O contador de mensagens é atualizado
- Botão "Enviar para IA" é habilitado

**Onde verificar:** `popup.js:82-126` + `content.js:45-93`

---

### TC04 - Limpeza, Deduplicação e Filtros

**Passos:**
1. Colete mensagens de uma conversa
2. Abra o Console do popup e observe os logs `[Content]`

**O que verificar nos logs:**
- Mensagens com menos de 3 caracteres são ignoradas
- Textos como "menu", "enviar", "digite" são filtrados
- Mensagens duplicadas não aparecem duas vezes
- Cada mensagem é truncada em no máximo 500 caracteres

**Onde verificar:** `content.js:33-42` e `content.js:65-72`

---

### TC05 - Persistência de Dados

**Passos:**
1. Colete mensagens com sucesso
2. Feche completamente o popup
3. Reabra a extensão na mesma aba

**Resultado esperado:**
- O contador de mensagens continua mostrando o mesmo número
- Se já havia resposta da IA, ela continua visível

**Onde verificar:** `popup.js:225-237` + `storage.js`

---

### TC06 - Fluxo Completo "Enviar para IA" (Happy Path)

**Passos:**
1. Tenha mensagens coletadas
2. Clique em **🚀 Enviar para IA**
3. Aguarde o processamento

**Resultado esperado:**
- Botão mostra "⏳ Processando..."
- Após 5-15 segundos o resumo aparece na área "Resumo Gerado"
- Mensagem de sucesso verde é exibida
- A resposta fica salva e aparece ao reabrir o popup

**Onde verificar:** `popup.js:130-168` + `api.js:34-126`

---

### TC07 - Tratamento de Erros da API

Execute cada sub-caso separadamente:

**A. Sem API Key configurada**
- Remova a chave do storage
- Clique em Enviar para IA
- Deve aparecer erro: "API Key do Gemini não configurada..."

**B. Chave inválida**
- Coloque uma chave falsa
- Deve aparecer erro de autenticação

**C. Sem internet**
- Desconecte a internet ou use um bloqueador
- Deve aparecer erro de timeout ou conexão

**D. Rate limit (429)**
- Faça várias requisições rápidas seguidas
- Deve aparecer: "Limite de requisições atingido..."

**E. Texto muito longo (token limit)**
- Colete 150+ mensagens longas
- Deve aparecer erro sobre limite de tokens

**Onde verificar:** `api.js:79-125` (bloco de retry e tratamento de erros)

---

### TC08 - Botões de Ação

**Passos:**
1. Tenha uma resposta gerada pela IA visível
2. Teste cada botão:

- **📋 Copiar Resposta** → Deve copiar o texto e mostrar feedback visual (texto muda para "✅ Copiado!")
- **🗑️ Limpar** → Remove os dados, zera o contador e esconde a resposta
- **⚙️ Ver Prompt Estruturado** → Abre um alert com o prompt atual

**Onde verificar:** `popup.js:172-221`

---

### TC09 - Verificação de Logs no Console

Com o DevTools do popup aberto, execute os fluxos de coleta e envio e confirme os seguintes prefixos aparecem:

- `[Popup]`
- `[Content]`
- `[API]`
- `[Storage]`

Exemplos de logs importantes:
- `[API] Tentativa 1/3`
- `[Content] 47 mensagens extraídas`
- `[Popup] Prompt gerado, enviando para API...`

**Onde verificar:** Todos os arquivos possuem `console.log` com prefixo de módulo.

---

### TC10 - Casos Extremos

**Conversa vazia**
- Clique em Coletar Dados em um chat sem mensagens
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
| Resposta da IA vem truncada | `api.js:55` (maxOutputTokens) |
| Dados somem ao fechar popup | `storage.js` (verificar se `saveData` foi chamado) |
| Muitas mensagens irrelevantes | `content.js:65-72` (filtros de limpeza) |

---

## Testes Futuros (Sugestões)

- Criar testes automatizados com Puppeteer + Chrome Headless
- Mockar respostas da API Gemini
- Testes de performance com 300+ mensagens

---

**Referência principal de código:**
- Coleta → `content.js`
- UI e orquestração → `popup.js`
- Comunicação com IA → `api.js`
- Armazenamento → `storage.js`
- Prompts → `prompts.js`

Boa sorte nos testes!
