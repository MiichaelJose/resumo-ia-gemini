import type { AuthErrorLog, GeminiAuth, Message } from '../types'

interface StorageSchema {
  collectedMessages: Message[]
  geminiAuth: GeminiAuth
  lastAuthError: AuthErrorLog
  lastSummary: string
  ticketFormUrl: string
}

type StorageKey = keyof StorageSchema

export async function getStoredValue<Key extends StorageKey>(key: Key) {
  const result = await chrome.storage.local.get([key])
  return result[key] as StorageSchema[Key] | undefined
}

export function setStoredValues(values: Partial<StorageSchema>) {
  return chrome.storage.local.set(values)
}

export function removeStoredValues(keys: StorageKey[]) {
  return chrome.storage.local.remove(keys)
}

export function saveAuthError(message: string) {
  return setStoredValues({
    lastAuthError: {
      type: 'apikey',
      message,
      timestamp: new Date().toISOString()
    }
  })
}
