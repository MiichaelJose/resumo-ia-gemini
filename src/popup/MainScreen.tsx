import React, { useState, useEffect, useCallback } from 'react'

interface Message {
  id: number
  text: string
}

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

  const collectMessages = useCallback(async () => {
    setIsCollecting(true)
    setStatus('Coletando mensagens...')

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      
      if (!tab?.id) {
        setStatus('Nenhuma aba ativa encontrada')
        setIsCollecting(false)
        return
      }

      const response = await chrome.tabs.sendMessage(tab.id, { action: 'collectMessages' })

      if (response?.success) {
        setMessages(response.messages || [])
        setStatus(`${response.messages?.length || 0} mensagens coletadas`)
        
        // Salva no storage
        chrome.storage.local.set({ collectedMessages: response.messages })
      } else {
        setStatus('Erro ao coletar mensagens')
      }
    } catch (error) {
      setStatus('Erro ao comunicar com a página')
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
      // Recupera a chave
      const auth = await chrome.storage.local.get(['geminiAuth'])
      const authData = auth.geminiAuth

      if (!authData) {
        setStatus('Autenticação não encontrada')
        setIsSending(false)
        return
      }

      let apiKey = ''
      if (authData.type === 'apikey') {
        apiKey = authData.key
      } else {
        setStatus('OAuth ainda não suportado na tela principal')
        setIsSending(false)
        return
      }

      // Monta o prompt
      const conversationText = messages
        .map((msg, i) => `[${i + 1}] ${msg.text}`)
        .join('\n\n')

      const prompt = `Analise a conversa abaixo e gere um resumo técnico estruturado.

Conversa:
${conversationText}`

      // Chama a API do Gemini
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      )

      const data = await response.json()

      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        const summary = data.candidates[0].content.parts[0].text
        setResult(summary)
        setStatus('Resumo gerado com sucesso!')
        
        // Salva o resultado
        chrome.storage.local.set({ lastSummary: summary })
      } else {
        setStatus('Erro ao gerar resumo')
      }
    } catch (error) {
      setStatus('Erro na comunicação com a API')
    } finally {
      setIsSending(false)
    }
  }, [messages])

  const copyResult = async () => {
    if (!result) return
    await navigator.clipboard.writeText(result)
    setStatus('Copiado para a área de transferência!')
    setTimeout(() => setStatus(''), 2000)
  }

  const clearAll = () => {
    setMessages([])
    setResult('')
    setStatus('')
    chrome.storage.local.remove(['collectedMessages', 'lastSummary'])
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

  // Carrega URL do formulário de chamado
  useEffect(() => {
    chrome.storage.local.get(['ticketFormUrl'], (result) => {
      if (result.ticketFormUrl) {
        setTicketFormUrl(result.ticketFormUrl)
      }
    })
  }, [])

  const sendToTicketSystem = async () => {
    if (!result) return

    // Copia para área de transferência
    await navigator.clipboard.writeText(result)
    setStatus('Resumo copiado!')

    // Abre o formulário em nova aba (se URL configurada)
    if (ticketFormUrl) {
      chrome.tabs.create({ url: ticketFormUrl })
      setStatus('Resumo copiado e formulário aberto!')
    } else {
      setStatus('Resumo copiado. Configure a URL do formulário nas configurações.')
    }

    setTimeout(() => setStatus(''), 3000)
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
          onChange={(e) => {
            const url = e.target.value
            setTicketFormUrl(url)
            chrome.storage.local.set({ ticketFormUrl: url })
          }}
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
