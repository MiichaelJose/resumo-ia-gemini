import type { Message } from '../types'

const GEMINI_MODEL_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
const REQUEST_TIMEOUT_MS = 30000

function buildConversationText(messages: Message[]) {
  return messages.map((message, index) => `[${index + 1}] ${message.text}`).join('\n\n')
}

function buildSummaryPrompt(messages: Message[]) {
  return `Você é um analista responsável por gerar resumos técnicos e organizados de atendimentos de suporte.

Transforme a conversa abaixo em um resumo profissional para sistema de chamados.

Regras obrigatórias:
- Use tom formal, objetivo e corporativo.
- Não transcreva o chat literalmente.
- Destaque protocolo, loja, CNPJ, sistema, terminal, links, IDs de pedido/caixa e produtos quando estiverem presentes.
- Se uma informação não existir na conversa, informe "Não informado".
- Não use emojis.

Estrutura obrigatória da resposta:

### Dados da Loja/Cliente

### Problema Relatado

### Análise Realizada

### Ações Executadas

### Evidências/Links Analisados

### Orientações ao Cliente

### Status Final

Conversa:
${buildConversationText(messages)}`
}

function extractSummaryFromResponse(data: any) {
  return data?.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined
}

export async function generateGeminiSummary(messages: Message[], apiKey: string) {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${GEMINI_MODEL_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildSummaryPrompt(messages) }] }]
      })
    })

    if (!response.ok) {
      throw new Error(getGeminiErrorMessage(response.status))
    }

    const data = await response.json()
    const summary = extractSummaryFromResponse(data)

    if (!summary) {
      throw new Error('Erro ao gerar resumo')
    }

    return summary
  } finally {
    window.clearTimeout(timeoutId)
  }
}

function getGeminiErrorMessage(status: number) {
  if (status === 401 || status === 403) {
    return 'API Key inválida ou sem permissão para usar o Gemini'
  }

  if (status === 400) {
    return 'Requisição inválida para o Gemini. Verifique a API Key e o conteúdo coletado'
  }

  if (status === 429) {
    return 'Limite de uso do Gemini atingido. Tente novamente mais tarde'
  }

  return 'Erro na comunicação com a API do Gemini'
}
