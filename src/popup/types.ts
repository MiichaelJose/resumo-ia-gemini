export interface Message {
  id: number
  text: string
  timestamp?: string
}

export interface GeminiApiKeyAuth {
  type: 'apikey'
  key: string
}

export interface OAuthAuth {
  type: 'oauth'
}

export type GeminiAuth = GeminiApiKeyAuth | OAuthAuth

export interface AuthErrorLog {
  type: GeminiAuth['type']
  message: string
  timestamp: string
}
