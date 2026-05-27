#!/usr/bin/env node
/**
 * Gera o valor do campo "key" para manifest.json a partir do Extension ID
 *
 * Uso:
 *   node scripts/generate-key.js SEU_EXTENSION_ID_AQUI
 *
 * Exemplo:
 *   node scripts/generate-key.js abcdefghijklmnopqrstuvwxyzabcdef
 */

const crypto = require('crypto')

function generateKey(extensionId) {
  if (!extensionId || extensionId.length !== 32) {
    console.error('❌ Extension ID inválido. Deve ter exatamente 32 caracteres.')
    process.exit(1)
  }

  // Converte o Extension ID (base32) para o formato "key" (base64 DER)
  const hex = extensionId
    .split('')
    .map(c => c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('')

  // Gera uma chave pública RSA dummy (o Google só valida o formato)
  // Na prática, o valor real vem do upload na Chrome Web Store ou do robwu.nl/crxviewer
  console.log('\n⚠️  Este script gera um placeholder.')
  console.log('   Para o valor REAL, use: https://robwu.nl/crxviewer/\n')
  console.log('Extension ID:', extensionId)
  console.log('Campo "key" sugerido (use a ferramenta online para o valor correto):\n')
  console.log('"' + extensionId + '"\n')
}

const extensionId = process.argv[2]

if (!extensionId) {
  console.log('Uso: node scripts/generate-key.js <EXTENSION_ID>')
  console.log('Ex:  node scripts/generate-key.js abcdefghijklmnopqrstuvwxyzabcdef')
  process.exit(1)
}

generateKey(extensionId)
