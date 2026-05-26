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

O prompt atual está definido em `prompts.js` (variável `structuredPrompt`).

Ele foi atualizado para o seguinte prompt padrão de **Resumo de Chamados de Suporte**:

```text
# Prompt Padrão para Resumo de Chamados de Suporte

Você é um analista responsável por gerar resumos técnicos e organizados de atendimentos de suporte...

[Regras obrigatórias + Estrutura completa conforme definido no arquivo prompts.js]
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

Existe também uma versão mais curta em `prompts.js` (útil para atendimentos rápidos).

## Como o Prompt é Montado no Código

Fluxo completo:

1. Mensagens são coletadas pelo content script (`content.js`)
2. Cada mensagem é limpa e truncada (`content.js`)
3. O texto é formatado como lista numerada e injetado no placeholder `{{CONVERSA}}`
4. `Prompts.generatePrompt()` monta o prompt completo
5. `API.sendToGemini()` envia para o Gemini

O prompt atual é bem mais longo e detalhado que versões anteriores, por isso recomenda-se não coletar conversas excessivamente longas para evitar estouro de tokens.

## Parâmetros da Chamada Gemini

```js
generationConfig: {
  temperature: 0.2,        // Valor baixo para maior consistência e aderência à estrutura
  topK: 40,
  topP: 0.9,
  maxOutputTokens: 2048
}
```

**Recomendação**: Mantenha a temperatura baixa (0.2 ~ 0.3) para o modelo respeitar melhor a estrutura rígida exigida.

## Exemplos Práticos

### Exemplo 1 – Site para Loja de Roupas

**Conversa de entrada (simplificada):**

```
[1] Boa tarde! Preciso de um site para minha loja de roupas femininas.
[2] Quero que tenha catálogo de produtos e o cliente consiga comprar pelo WhatsApp.
[3] Também preciso de integração com o estoque que já uso no Excel.
[4] O site tem que ser rápido no celular.
[5] Quanto tempo mais ou menos para ficar pronto?
[6] E se der problema com o pagamento, tem como colocar Pix também?
```

**Saída esperada da IA:**

```
1. Resumo geral do projeto/conversa
Cliente deseja um e-commerce simples para loja de roupas femininas com foco em vendas via WhatsApp e integração básica de estoque.

2. Objetivo do cliente
Aumentar vendas online e facilitar o processo de compra diretamente pelo WhatsApp.

3. Funcionalidades solicitadas
- Catálogo de produtos
- Compra via WhatsApp
- Integração com estoque (Excel)
- Versão mobile otimizada
- Pagamento via Pix

4. Tecnologias mencionadas
Não mencionadas explicitamente (provável uso de WhatsApp Business API + planilha Excel).

5. Problemas identificados
- Controle de estoque manual via Excel pode gerar inconsistências
- Integração com meios de pagamento ainda indefinida

6. Pendências
- Definir plataforma de e-commerce (Shopify, WooCommerce, custom)
- Escolher gateway de pagamento

7. Próximos passos
- Reunião para definição de stack tecnológica
- Levantamento de volume médio de produtos e pedidos

8. Riscos do projeto
- Integração manual com Excel pode não escalar
- Dependência forte do WhatsApp (política de uso pode mudar)

9. Estimativa técnica inicial
Média complexidade (principalmente pela integração com estoque e WhatsApp).
```

### Exemplo 2 – Problema Técnico

**Conversa curta:**

```
[1] O sistema está muito lento depois que adicionamos 3 mil produtos.
[2] O cliente reclama que as fotos demoram para carregar.
[3] Queremos migrar para um servidor melhor ou usar CDN.
```

**Saída esperada (resumida):**

```
5. Problemas identificados
Performance ruim após crescimento do catálogo (3 mil produtos). Carregamento lento de imagens.

8. Riscos do projeto
Perda de conversão por lentidão. Possível necessidade de refatoração de infraestrutura.

9. Estimativa técnica inicial
Média a alta (depende se envolve migração de banco/imagens ou apenas CDN + otimização).
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

1. Edite o arquivo `prompts.js`
2. Modifique o template `structuredPrompt`
3. Recarregue a extensão em `chrome://extensions/`

**Recomendação**: Mantenha a estrutura de seções definida, pois ela foi criada para ser compatível com os padrões de documentação de chamados da empresa.

**Dica**: Sempre teste com atendimentos reais após alterações.

## Boas Práticas

- Colete apenas o necessário. Atendimentos muito longos podem estourar o limite de tokens.
- O prompt atual prioriza **qualidade e padronização** em vez de volume.
- Sempre revise o resumo gerado antes de colar no sistema de chamados.
- Se a loja informar protocolo, loja, CNPJ ou links durante o atendimento, eles costumam aparecer com mais precisão no resumo.

---

**Arquivo de referência**: `prompts.js`  
**Chamado por**: `popup.js`  
**Enviado para**: Gemini (modelo configurado em `api.js`)
