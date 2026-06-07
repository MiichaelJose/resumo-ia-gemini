import React, { useState, useEffect, useCallback } from 'react'
import { collectMessagesFromActiveTab, getCollectMessagesErrorMessage, openTab } from './services/chromeTabs'
import { generateGeminiSummary } from './services/gemini'
import { getStoredValue, removeStoredValues, setStoredValues } from './services/storage'
import type { Message } from './types'

interface MainScreenProps {
  onLogout: () => void
}

export default function MainScreen({ onLogout }: MainScreenProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isCollecting, setIsCollecting] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [result, setResult] = useState('')
  const [status, setStatus] = useState('')
  const [ticketFormUrl, setTicketFormUrl] = useState('')

  const showTemporaryStatus = useCallback((message: string, timeout = 2000) => {
    setStatus(message)
    setTimeout(() => setStatus(''), timeout)
  }, [])

  const collectMessages = useCallback(async () => {
    setIsCollecting(true)
    setStatus('Coletando mensagens...')

    try {
      const collectedMessages = await collectMessagesFromActiveTab()
      setMessages(collectedMessages)
      setStatus(`${collectedMessages.length} mensagens coletadas`)
      setStoredValues({ collectedMessages })
    } catch (error) {
      setStatus(getCollectMessagesErrorMessage(error))
    } finally {
      setIsCollecting(false)
    }
  }, [])

  const sendToGemini = useCallback(async () => {
    if (messages.length === 0) {
      setStatus('Nenhuma mensagem coletada')
      return
    }

    setIsSending(true)
    setStatus('Enviando para Gemini...')

    try {
      const authData = await getStoredValue('geminiAuth')

      if (!authData) {
        setStatus('Autenticação não encontrada')
        return
      }

      if (authData.type === 'apikey') {
        const summary = await generateGeminiSummary(messages, authData.key)
        setResult(summary)
        setStatus('Resumo gerado com sucesso!')
        setStoredValues({ lastSummary: summary })
      }

      if (authData.type !== 'apikey') {
        setStatus('OAuth ainda não suportado na tela principal')
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setStatus('Tempo limite ao comunicar com o Gemini')
        return
      }

      if (error instanceof TypeError) {
        setStatus('Erro de rede ao comunicar com o Gemini')
        return
      }

      setStatus(error instanceof Error ? error.message : 'Erro na comunicação com a API')
    } finally {
      setIsSending(false)
    }
  }, [messages])

  const copyResult = async () => {
    if (!result) return
    await navigator.clipboard.writeText(result)
    showTemporaryStatus('Copiado para a área de transferência!')
  }

  const clearAll = () => {
    setMessages([])
    setResult('')
    setStatus('')
    removeStoredValues(['collectedMessages', 'lastSummary'])
  }

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + C → Coletar mensagens
      if (e.ctrlKey && e.key.toLowerCase() === 'c') {
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
          return
        }
        e.preventDefault()
        if (!isCollecting) {
          collectMessages()
        }
      }

      // Enter → Enviar para Gemini
      if (e.key === 'Enter') {
        if (!isSending && messages.length > 0) {
          e.preventDefault()
          sendToGemini()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isCollecting, isSending, messages.length, collectMessages, sendToGemini])

  // Carrega dados salvos do popup
  useEffect(() => {
    getStoredValue('collectedMessages').then((storedMessages) => {
      if (storedMessages) {
        setMessages(storedMessages)
      }
    })

    getStoredValue('lastSummary').then((storedSummary) => {
      if (storedSummary) {
        setResult(storedSummary)
      }
    })

    getStoredValue('ticketFormUrl').then((storedTicketFormUrl) => {
      if (storedTicketFormUrl) {
        setTicketFormUrl(storedTicketFormUrl)
      }
    })
  }, [])

  const handleTicketFormUrlChange = (url: string) => {
    setTicketFormUrl(url)
    setStoredValues({ ticketFormUrl: url })
  }

  const sendToTicketSystem = async () => {
    if (!result) return

    // Copia para área de transferência
    await navigator.clipboard.writeText(result)
    setStatus('Resumo copiado!')

    // Abre o formulário em nova aba (se URL configurada)
    if (ticketFormUrl) {
      openTab(ticketFormUrl)
      showTemporaryStatus('Resumo copiado e formulário aberto!', 3000)
    } else {
      showTemporaryStatus('Resumo copiado. Configure a URL do formulário nas configurações.', 3000)
    }
  }

  return (
    <div className="w-[420px] min-h-[520px] bg-[#0A0A0B] text-white p-5">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">Resumo IA</h1>
        <button 
          onClick={onLogout}
          className="text-sm text-white/60 hover:text-white"
        >
          Sair
        </button>
      </div>

      {/* Status */}
      {status && (
        <div className="mb-4 px-3 py-2 bg-white/5 rounded-lg text-sm text-white/80">
          {status}
        </div>
      )}

      {/* Botões de Ação */}
      <div className="space-y-3">
        <button
          onClick={collectMessages}
          disabled={isCollecting}
          className="w-full h-11 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 font-medium disabled:opacity-50"
        >
          {isCollecting ? 'Coletando...' : '📥 Coletar Mensagens'}
        </button>

        <button
          onClick={sendToGemini}
          disabled={isSending || messages.length === 0}
          className="w-full h-11 rounded-xl bg-white text-black font-medium disabled:opacity-50"
        >
          {isSending ? 'Enviando para Gemini...' : '🚀 Enviar para IA'}
        </button>
      </div>

      {/* Contador */}
      <div className="mt-4 text-center text-sm text-white/60">
        {messages.length} mensagens coletadas
      </div>

      {/* Configuração de URL do formulário */}
      <div className="mt-4">
        <label className="block text-xs text-white/50 mb-1">URL do formulário de chamado</label>
        <input
          type="text"
          value={ticketFormUrl}
          onChange={(e) => handleTicketFormUrlChange(e.target.value)}
          placeholder="https://seu-sistema.com/novo-chamado"
          className="w-full h-9 bg-black/40 border border-white/10 rounded-lg px-3 text-sm placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors font-mono"
        />
        <p className="text-[10px] text-white/40 mt-1">Deixe em branco para apenas copiar o resumo.</p>
      </div>

      {/* Resultado */}
      {result && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-white/80">Resumo Gerado</span>
            <div className="flex gap-2">
              <button 
                onClick={copyResult}
                className="text-xs px-3 py-1 bg-white/10 rounded-lg hover:bg-white/20"
              >
                Copiar
              </button>
              <button 
                onClick={sendToTicketSystem}
                className="text-xs px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30"
              >
                Enviar para chamado
              </button>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm whitespace-pre-wrap max-h-[280px] overflow-y-auto">
            {result}
          </div>
        </div>
      )}

      {/* Botão Limpar */}
      {(messages.length > 0 || result) && (
        <button
          onClick={clearAll}
          className="mt-4 w-full text-sm text-white/50 hover:text-white/80"
        >
          Limpar tudo
        </button>
      )}
    </div>
  )
}
