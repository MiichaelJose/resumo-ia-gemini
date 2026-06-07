# PROMPT.md - Sistema de Prompts da Extensão Resumo IA

Este documento explica o sistema de prompts utilizado pela extensão, com foco em **resumos de chamados de suporte**.

## Objetivo do Prompt

O prompt padrão foi projetado para transformar atendimentos realizados via Digisac ou WhatsApp Web em **resumos técnicos profissionais**, prontos para serem anexados em sistemas de chamados como:

- TomTicket
- GLPI
- Jira
- Service Desk
- Outros sistemas corporativos

O resumo segue rigorosamente um formato corporativo, sem emojis, sem linguagem informal e com estrutura padronizada.

## Prompt Estruturado Principal (Padrão)

O prompt atual está definido em `src/popup/services/gemini.ts`, na função que monta o prompt enviado ao Gemini.

Ele foi atualizado para o seguinte prompt padrão de **Resumo de Chamados de Suporte**:

```text
# Prompt Padrão para Resumo de Chamados de Suporte

Você é um analista responsável por gerar resumos técnicos e organizados de atendimentos de suporte...

[Regras obrigatórias + conversa coletada pelo content script]
```

O prompt força a IA a produzir a saída exatamente no formato corporativo exigido, com as seções:

- Dados da Loja/Cliente
- Problema Relatado
- Análise Realizada
- Ações Executadas
- Evidências/Links Analisados
- Orientações ao Cliente
- Status Final

## Regras mais importantes do prompt atual

- Tom 100% formal e corporativo (sem emojis, sem gírias)
- Nunca transcrever o chat literal
- Sempre destacar protocolo, loja, CNPJ, sistema, terminal quando disponíveis
- Incluir links, IDs de pedido/caixa e produtos sempre que mencionados
- Informar claramente o Status Final (Resolvido, Em acompanhamento, Pendente, etc.)

## Prompt Alternativo (Conciso)

No momento existe um prompt padrão único. Se for necessário criar versões alternativas, concentre essa lógica em `src/popup/services/gemini.ts`.

## Como o Prompt é Montado no Código

Fluxo completo:

1. Mensagens são coletadas pelo content script (`content.js`)
2. Cada mensagem é limpa e truncada (`content.js`)
3. `services/gemini.ts` formata o texto como lista numerada
4. `buildSummaryPrompt()` monta o prompt completo
5. `generateGeminiSummary()` envia para o Gemini

O prompt atual é bem mais longo e detalhado que versões anteriores, por isso recomenda-se não coletar conversas excessivamente longas para evitar estouro de tokens.

## Parâmetros da Chamada Gemini

Atualmente a chamada usa a configuração padrão do modelo `gemini-2.5-flash`, envia `contents` com o texto do prompt e aplica timeout de 30 segundos.

**Recomendação**: se precisar controlar consistência ou tamanho da resposta, adicione `generationConfig` em `src/popup/services/gemini.ts` mantendo temperatura baixa (0.2 ~ 0.3).

## Exemplos Práticos

### Exemplo 1 – Atendimento de suporte

**Conversa de entrada (simplificada):**

```
[1] Loja 123 com problema no fechamento do caixa.
[2] O terminal 02 apresenta divergência no valor final.
[3] Foi enviado print do relatório e o pedido 98765 aparece duplicado.
[4] Orientamos reprocessar o fechamento após excluir a duplicidade.
```

**Saída esperada da IA:**

```
### Dados da Loja/Cliente
Loja 123. Terminal 02.

### Problema Relatado
Divergência no valor final do fechamento de caixa.

### Análise Realizada
Foi identificado que o pedido 98765 aparece duplicado no relatório enviado pelo cliente.

### Ações Executadas
Cliente orientado a excluir a duplicidade e reprocessar o fechamento.

### Evidências/Links Analisados
Print do relatório mencionado na conversa. Link não informado.

### Orientações ao Cliente
Reprocessar o fechamento após remover a duplicidade do pedido.

### Status Final
Pendente de validação pelo cliente após reprocessamento.
```

### Exemplo 2 – Problema Técnico

**Conversa curta:**

```
[1] Cliente informa que o WhatsApp Web não carrega as mensagens do atendimento.
[2] Após atualizar a página, a conversa voltou, mas algumas mensagens não aparecem.
[3] Orientado limpar cache e testar novamente em janela anônima.
```

**Saída esperada (resumida):**

```
### Problema Relatado
WhatsApp Web com falha no carregamento de mensagens do atendimento.

### Ações Executadas
Cliente orientado a limpar cache e testar novamente em janela anônima.

### Status Final
Em acompanhamento.
```

## Exemplo de Saída Esperada

Resumo do atendimento – GLPI 502558

### Dados da Loja/Cliente

* Loja: H0188 – Shopping Taboão
* CNPJ: 05.232.872/0001-07
* Cliente: Altamira Jesus Neris Oliveira
* Sistema: RS
* Terminal: PDV/Totem

### Problema Relatado

Loja relatou impossibilidade de finalizar operações no totem, mesmo sem pedidos pendentes aparentes.

### Análise Realizada

Foi identificado que existiam vendas pendentes antigas vinculadas ao totem, incluindo pedidos previamente cancelados.

### Ações Executadas

* Validação dos pedidos pendentes;
* Regularização dos caixas diretamente pelo portal;
* Liberação das operações do totem.

### Evidências/Links Analisados

Pedido analisado:
* https://www.portal.colibri.com.br/orders/804ba564-9598-4985-984c-6d2985c4ea2a

### Orientações ao Cliente

Cliente orientado a validar novamente o fechamento após regularização do caixa.

### Status Final

Operação normalizada após fechamento/regularização dos caixas pelo portal.

---

## Como Personalizar o Prompt

1. Edite o arquivo `src/popup/services/gemini.ts`
2. Modifique a função que monta o prompt (`buildSummaryPrompt`)
3. Recarregue a extensão em `chrome://extensions/`

**Recomendação**: Mantenha a estrutura de seções definida, pois ela foi criada para ser compatível com os padrões de documentação de chamados da empresa.

**Dica**: Sempre teste com atendimentos reais após alterações.

## Boas Práticas

- Colete apenas o necessário. Atendimentos muito longos podem estourar o limite de tokens.
- O prompt atual prioriza **qualidade e padronização** em vez de volume.
- Sempre revise o resumo gerado antes de colar no sistema de chamados.
- Se a loja informar protocolo, loja, CNPJ ou links durante o atendimento, eles costumam aparecer com mais precisão no resumo.

---

**Arquivo de referência**: `src/popup/services/gemini.ts`  
**Chamado por**: `src/popup/MainScreen.tsx`  
**Enviado para**: Gemini pelo serviço `src/popup/services/gemini.ts`
