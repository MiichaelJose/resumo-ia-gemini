// content.js - Content Script para captura de mensagens em Digisac e WhatsApp Web

(function() {
  'use strict';

  console.log('[Content] Content script carregado');

  const IGNORED_TEXT_PARTS = ['menu', 'enviar', 'digite'];
  const MAX_MESSAGE_LENGTH = 500;
  const MAX_RAW_TEXT_LENGTH = 800;
  const SHORT_UI_TEXT_LENGTH = 80;

  // Detecta qual plataforma está ativa
  function detectPlatform() {
    if (window.location.hostname.includes('digisac')) return 'digisac';
    if (window.location.hostname.includes('whatsapp')) return 'whatsapp';
    return 'unknown';
  }

  const platform = detectPlatform();
  console.log('[Content] Plataforma detectada:', platform);

  // Seletor de mensagens por plataforma
  const SELECTORS = {
    digisac: {
      messageContainer: '.message-list, .chat-messages, [class*="message"]',
      messageBubble: '.message-bubble, .msg, [class*="bubble"], [class*="message-item"]',
      textContent: '.message-text, .text, [class*="text-content"]'
    },
    whatsapp: {
      messageContainer: '#main .copyable-area, .message-list',
      messageBubble: '.message-in, .message-out, [data-testid="msg-container"]',
      textContent: '.selectable-text, [data-testid="conversation-text"]'
    }
  };

  // Função para limpar texto (remove duplicatas, timestamps, etc)
  function cleanText(text) {
    if (!text) return '';
    
    return text
      .trim()
      .replace(/\s+/g, ' ')           // Remove espaços múltiplos
      .replace(/^\d{1,2}:\d{2}\s*/, '') // Remove timestamps no início
      .replace(/\s*\d{1,2}:\d{2}$/, '') // Remove timestamps no final
      .substring(0, MAX_MESSAGE_LENGTH); // Limita tamanho por mensagem
  }

  function getMessageContainers(selectors) {
    const platformContainers = document.querySelectorAll(selectors.messageBubble);

    if (platformContainers.length > 0) {
      return platformContainers;
    }

    return document.querySelectorAll('div[role="row"], .message, [class*="msg"]');
  }

  function isIgnoredText(text) {
    const lowerText = text.toLowerCase();
    const looksLikeUiText = lowerText.length <= SHORT_UI_TEXT_LENGTH && IGNORED_TEXT_PARTS.some((part) => lowerText.includes(part));

    return lowerText.length > MAX_RAW_TEXT_LENGTH || looksLikeUiText;
  }

  function buildMessage(container, index, seenTexts) {
    const text = container.innerText || container.textContent || '';

    if (!text || text.length < 3 || isIgnoredText(text)) {
      return null;
    }

    const cleaned = cleanText(text);

    if (cleaned.length <= 2 || seenTexts.has(cleaned)) {
      return null;
    }

    seenTexts.add(cleaned);

    return {
      id: index,
      text: cleaned,
      timestamp: new Date().toISOString()
    };
  }

  // Extrai mensagens da página
  function extractMessages() {
    const selectors = SELECTORS[platform] || SELECTORS.digisac;
    const messages = [];
    const seenTexts = new Set(); // Para evitar duplicatas

    try {
      const containers = getMessageContainers(selectors);

      containers.forEach((container, index) => {
        const message = buildMessage(container, index, seenTexts);

        if (message) {
          messages.push(message);
        }
      });

      console.log(`[Content] ${messages.length} mensagens extraídas`);
      return messages;

    } catch (error) {
      console.error('[Content] Erro ao extrair mensagens:', error);
      return [];
    }
  }

  // MutationObserver para capturar mensagens dinamicamente
  let observer = null;

  function startObserver() {
    if (observer) observer.disconnect();

    const targetNode = document.body;
    
    observer = new MutationObserver((mutations) => {
      let shouldUpdate = false;
      
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          // Verifica se algum nó adicionado parece mensagem
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              const className = node.className || '';
              if (className.includes('message') || 
                  className.includes('bubble') ||
                  node.querySelector?.('[class*="message"]')) {
                shouldUpdate = true;
              }
            }
          });
        }
      });

      if (shouldUpdate) {
        console.log('[Content] Novas mensagens detectadas via MutationObserver');
      }
    });

    observer.observe(targetNode, {
      childList: true,
      subtree: true
    });

    console.log('[Content] MutationObserver iniciado');
  }

  // Inicia o observer
  if (document.readyState === 'complete') {
    startObserver();
  } else {
    window.addEventListener('load', startObserver);
  }

  // Listener para mensagens do popup/background
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[Content] Mensagem recebida:', request.action);

    if (request.action === 'collectMessages') {
      const messages = extractMessages();
      sendResponse({ 
        success: true, 
        messages: messages,
        count: messages.length,
        platform: platform
      });
    }

    if (request.action === 'ping') {
      sendResponse({ success: true, platform: platform });
    }

    return true; // Mantém o canal aberto para resposta assíncrona
  });

  // Auto-inicialização
  console.log('[Content] Pronto para capturar mensagens em', platform);
})();
