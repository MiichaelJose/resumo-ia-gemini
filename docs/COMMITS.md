# Commit Best Practices

Este documento define as boas práticas de commits para o projeto **Resumo IA - Gemini**.

## Estrutura do Commit

```
tipo(escopo): descrição curta

[corpo opcional]

[rodapé opcional]
```

## Tipos de Commit

| Tipo       | Descrição                                      | Exemplo                     |
|------------|------------------------------------------------|-----------------------------|
| `feat`     | Nova funcionalidade                            | `feat: adiciona tela de conexão com Google` |
| `fix`      | Correção de bug                                | `fix: corrige erro de OAuth2 Client ID` |
| `docs`     | Alterações em documentação                     | `docs: atualiza README com instruções de build` |
| `style`    | Mudanças que não afetam o código (formatação)  | `style: ajusta espaçamento no MainScreen` |
| `refactor` | Refatoração de código                          | `refactor: unifica tela de conexão e principal` |
| `test`     | Adição ou correção de testes                   | `test: adiciona testes para coleta de mensagens` |
| `chore`    | Tarefas de manutenção                          | `chore: atualiza dependências` |
| `build`    | Mudanças no sistema de build                   | `build: configura Vite para extensão Chrome` |

## Regras Importantes

1. **Use o tempo presente** ("adiciona" em vez de "adicionado")
2. **Mantenha a primeira linha com no máximo 72 caracteres**
3. **Separe o título do corpo com uma linha em branco**
4. **Explique o "por quê" no corpo, não apenas o "o quê"**
5. **Referencie issues quando aplicável** (`Closes #42`)

## Exemplos de Commits

### Bom

```
feat(ui): adiciona tela principal de análise

- Implementa coleta de mensagens via content script
- Adiciona envio para Gemini com API Key
- Cria botão de copiar resultado
- Exibe contador de mensagens coletadas

Closes #15
```

### Ruim

```
atualizei o codigo
```

## Fluxo Recomendado

1. Faça commits pequenos e focados
2. Sempre rode `npm run build` antes de commitar mudanças no React
3. Escreva mensagens claras e descritivas
4. Use `git commit` interativo quando possível

## Referências

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Commit Message Guidelines](https://chris.beams.io/posts/git-commit/)
