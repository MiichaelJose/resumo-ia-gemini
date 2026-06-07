import type { Message } from '../types'

interface CollectMessagesResponse {
  success: boolean
  messages?: Message[]
}

async function getActiveTabId() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  return tab?.id
}

export async function collectMessagesFromActiveTab() {
  const tabId = await getActiveTabId()

  if (!tabId) {
    throw new Error('Nenhuma aba ativa encontrada')
  }

  const response = await chrome.tabs.sendMessage(tabId, { action: 'collectMessages' }) as CollectMessagesResponse

  if (!response?.success) {
    throw new Error('Erro ao coletar mensagens')
  }

  return response.messages ?? []
}

export function openTab(url: string) {
  return chrome.tabs.create({ url })
}

export function getCollectMessagesErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.includes('Could not establish connection')) {
    return 'Abra uma conversa do Digisac ou WhatsApp Web antes de coletar mensagens'
  }

  return error instanceof Error ? error.message : 'Erro ao comunicar com a página'
}
