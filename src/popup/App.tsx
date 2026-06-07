import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Key, Settings, Shield } from 'lucide-react'
import MainScreen from './MainScreen'
import { getStoredValue, saveAuthError, setStoredValues } from './services/storage'

interface ConnectionState {
  status: 'idle' | 'connecting' | 'connected' | 'error'
  message?: string
}

type View = 'connection' | 'main'

export default function GeminiApp() {
  const [view, setView] = useState<View>('connection')
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  const [apiKey, setApiKey] = useState('')
  const [connection, setConnection] = useState<ConnectionState>({ status: 'idle' })
  const [showApiKey, setShowApiKey] = useState(false)

  // Verifica se já existe autenticação salva
  useEffect(() => {
    getStoredValue('geminiAuth').then((auth) => {
      if (auth) {
        setView('main')
      }
      setIsCheckingAuth(false)
    })
  }, [])

  const handleApiKeyConnect = () => {
    if (!apiKey.trim()) return

    setConnection({ status: 'connecting' })

    const key = apiKey.trim()

    if (!key.startsWith('AIza')) {
      const errorMsg = 'Formato de API Key inválido (deve começar com AIza)'

      saveAuthError(errorMsg)
      setConnection({ status: 'error', message: errorMsg })
      return
    }

    setStoredValues({ geminiAuth: { type: 'apikey', key } }).then(() => {
      setConnection({ status: 'connected' })
      setTimeout(() => setView('main'), 800)
    })
  }

  const logLastAuthError = () => {
    getStoredValue('lastAuthError').then((lastAuthError) => {
      if (lastAuthError) {
        console.log('%c[Gemini Auth Error]', 'color:#f87171', lastAuthError)
        return
      }

      console.log('%c[Gemini Auth] Nenhum erro registrado', 'color:#4ade80')
    })
  }

  const resetState = () => {
    setConnection({ status: 'idle' })
    setApiKey('')
  }

  if (isCheckingAuth) {
    return (
      <div className="w-[420px] h-[200px] bg-[#0A0A0B] flex items-center justify-center text-white/60">
        Carregando...
      </div>
    )
  }

  // Tela Principal de Análise
  if (view === 'main') {
    return <MainScreen onLogout={() => setView('connection')} />
  }

  // Tela de Conexão - API Key
  return (
    <div className="w-[420px] min-h-[520px] bg-[#0A0A0B] text-white font-sans overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img src="/icons/logo.svg" alt="TicketBoost" className="w-9 h-9" />
          <div>
            <div className="font-semibold tracking-tight">TicketBoost</div>
            <div className="text-[10px] text-white/50 -mt-0.5">Gemini</div>
          </div>
        </div>

        <button
          onClick={logLastAuthError}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          title="Ver último erro de autenticação no console"
        >
          <Settings className="w-4 h-4 text-white/60" />
        </button>
      </div>

      {/* Title */}
      <div className="px-5 pt-6 pb-1">
        <h1 className="text-2xl font-semibold tracking-tighter">Conectar ao Gemini</h1>
        <p className="text-sm text-white/60 mt-1">Insira sua API Key do Gemini</p>
      </div>

      {/* API Key Card */}
      <div className="px-5 pt-5">
        <div className="rounded-2xl border border-white/10 bg-white/[0.015] p-5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center ring-1 ring-white/10">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold">API Key do Gemini</div>
              <p className="text-sm text-white/60">Conecte sua chave Gemini</p>
            </div>
          </div>

          <div className="mt-4">
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full h-10 bg-black/40 border border-white/10 rounded-xl px-4 text-sm placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors font-mono"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleApiKeyConnect()
                  }
                }}
              />
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/40 hover:text-white/70"
              >
                {showApiKey ? 'OCULTAR' : 'MOSTRAR'}
              </button>
            </div>

            <button
              onClick={handleApiKeyConnect}
              disabled={!apiKey.trim() || connection.status === 'connecting'}
              className="mt-3 w-full h-10 rounded-xl bg-white text-black font-medium text-sm flex items-center justify-center gap-2 hover:bg-white/90 active:scale-[0.985] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {connection.status === 'connecting' ? 'Conectando...' : 'Conectar'}
            </button>

            <div className="flex items-center justify-between mt-3 text-xs">
              <a
                href="https://makersuite.google.com/app/apikey"
                target="_blank"
                className="text-white/50 hover:text-white/80 transition-colors"
              >
                Como obter minha key?
              </a>
              <div className="text-white/40 flex items-center gap-1" title="Sua chave é armazenada localmente no navegador.">
                <Shield className="w-3 h-3" /> Seguro
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 pt-6 pb-5 mt-auto">
        <div className="h-px bg-white/10 mb-4" />

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-white/50">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
            Gemini desconectado
          </div>

          <div className="flex items-center gap-1.5 text-white/40">
            <Shield className="w-3 h-3" />
            <span>Nenhum dado é enviado sem sua permissão</span>
          </div>
        </div>
      </div>

      {/* Connection Feedback */}
      <AnimatePresence>
        {connection.status !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-4 left-4 right-4"
          >
            {connection.status === 'connected' && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-2xl text-sm flex items-center gap-2">
                ✓ Conectado com sucesso
              </div>
            )}
            {connection.status === 'error' && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-2xl text-sm flex items-center justify-between">
                {connection.message}
                <button onClick={resetState} className="underline">
                  Tentar novamente
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
