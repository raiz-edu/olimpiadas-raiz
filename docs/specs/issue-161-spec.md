# SPEC — Issue #161: Discursivas pela OpenAI com fallback para o Groq

**Issue:** https://github.com/raiz-edu/olimpiadas-raiz/issues/161 · **Data:** 2026-08-28 · **Depende de:** #159 (`getCredencial`)

## 1. Contexto

`lib/ai/groq.ts` chama o Groq direto pelo `groq-sdk`, com modelos fixos no código e sem nenhum plano B: se o Groq falha, o aluno vê "Não foi possível avaliar agora". Decisão do Helio: OpenAI como provedor pago, Groq de reserva.

A API do Groq é compatível com a da OpenAI (`/chat/completions`, mesmas mensagens, mesmos blocos `image_url`). Um adapter único por `fetch` serve os dois — sem dependência nova, e o `groq-sdk` sai.

## 2. Objetivo

Trocar o provedor sem mudar prompts nem contrato das funções; ganhar fallback automático e modelos configuráveis pela tela, sem redeploy.

## 3. Escopo

**Dentro**

- R1. `lib/ai/openai-compatible.ts`: `chatCompletion({ nome, baseUrl, apiKey, model, messages, temperature, maxTokens, campoMaxTokens, extra, timeoutMs })` → conteúdo da primeira escolha. Erros viram `ProvedorIAError` com provedor, status HTTP e mensagem resumida do corpo. Timeout 60 s.
- R2. `lib/ai/provedores.ts`: definições estáticas de `openai` e `groq` (base URL, chave do catálogo, campo de max tokens, modelos default, extras de visão — `reasoning_effort: "none"` no Groq, obrigatório para o qwen).
- R3. `lib/ai/config.ts`: `getConfigIA()` lê `configuracao_sistema` (`ia_provedor`, `ia_fallback`, `ia_<provedor>_modelo_texto`, `ia_<provedor>_modelo_visao`) com defaults e cache de 60 s; valores inválidos caem no default. Default: primário `openai`, fallback `groq`.
- R4. `lib/ai/avaliador.ts`: as mesmas 4 funções de `groq.ts` (`avaliarRespostaAberta`, `transcreverFotoAluno`, `avaliarRespostaAbertaComImagem`, `avaliarFotoAberta`) sobre `completar(tipo, mensagens)`, que tenta o primário e, em chave ausente, rede ou HTTP ≥ 400, o fallback — registrando no log quem falhou e quem respondeu. Ambos falham → `Error` listando os motivos. Prompts idênticos, movidos para `lib/ai/prompts.ts`.
- R5. `lib/ai/groq.ts` e `groq-sdk` removidos; `treino/actions.ts` e testes passam a importar `@/lib/ai/avaliador`.
- R6. Card "Avaliação por IA" em `/configuracoes/credenciais`: provedor primário, fallback (ou nenhum), modelo de texto e de visão por provedor; Salvar (gate `podeGerirCredenciais`) e "Testar modelos" (completion mínima em cada modelo dos provedores com chave).
- R7. Testes do adapter, da cadeia de fallback e da leitura de config.

**Fora**

- Streaming, tool calling, AI Gateway, mudança de prompts.
- Auditoria da config de IA (não há uuid de entidade em `configuracao_sistema`).

## 4. Critérios de aceite

| #   | Critério                                                                                                                                                                                                                                   | Verificação                               |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| CA1 | Adapter monta a request certa (URL, Bearer, `max_completion_tokens` na OpenAI e `max_tokens` no Groq, extras), devolve o conteúdo, e transforma HTTP ≥ 400, corpo sem conteúdo e timeout em `ProvedorIAError` com mensagem útil            | `tests/unit/ai/openai-compatible.test.ts` |
| CA2 | Primário ok → 1 chamada, sem log de erro. Primário sem chave ou com erro → fallback chamado com o modelo do fallback e `console.warn`. Ambos falham → erro com os dois nomes. Visão no Groq leva `reasoning_effort: "none"`; na OpenAI não | `tests/unit/ai/avaliador.test.ts`         |
| CA3 | `avaliarRespostaAberta` continua devolvendo `FeedbackIA` a partir do JSON do modelo (integração com `parseStrictFeedback`)                                                                                                                 | idem                                      |
| CA4 | `getConfigIA`: linhas do banco sobrescrevem os defaults; provedor inválido → default; `ia_fallback` vazio → `null`; cache de 60 s                                                                                                          | `tests/unit/ai/config.test.ts`            |
| CA5 | Testes existentes de `responderQuestaoAberta` continuam verdes mockando `@/lib/ai/avaliador`                                                                                                                                               | suíte                                     |
| CA6 | `typecheck`, `lint`, suíte completa verdes; `groq-sdk` fora do `package.json`                                                                                                                                                              | CI                                        |

## 5. Verificação vs SPEC (preenchida no build)

| Requisito | Status | Evidência                                                                                                                                                         |
| --------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1        | ✅     | `lib/ai/openai-compatible.ts`; CA1 em `tests/unit/ai/openai-compatible.test.ts` (6 testes)                                                                        |
| R2        | ✅     | `lib/ai/provedores.ts`                                                                                                                                            |
| R3        | ✅     | `lib/ai/config.ts`; CA4 em `tests/unit/ai/config.test.ts` (5 testes)                                                                                              |
| R4        | ✅     | `lib/ai/avaliador.ts` + `lib/ai/prompts.ts` (prompts byte a byte iguais); CA2/CA3 em `tests/unit/ai/avaliador.test.ts` (8 testes)                                 |
| R5        | ✅     | `lib/ai/groq.ts` removido; `groq-sdk` fora de `package.json`/lock; imports e mocks em `@/lib/ai/avaliador` — CA5: testes de `responderQuestaoAberta` verdes       |
| R6        | ✅     | `app/(protected)/configuracoes/credenciais/{ia-actions.ts,ia-config-card.tsx}`, card montado em `page.tsx`. Não exercitado em navegador (mesma limitação da #159) |
| R7        | ✅     | 19 testes novos; CA6: `typecheck` limpo, ESLint limpo, `vitest run` — 21 arquivos, 199 testes                                                                     |

## 6. Riscos

- Modelos da OpenAI mudam de nome: os defaults são só ponto de partida; a tela permite trocar e testar sem deploy.
- Modelos de raciocínio da OpenAI rejeitam `temperature` ≠ 1: "Testar modelos" mostra o erro na hora.
- Até a chave da OpenAI ser colada na tela, cada avaliação registra "openai: chave ausente" e responde pelo Groq — comportamento esperado, visível no log.
