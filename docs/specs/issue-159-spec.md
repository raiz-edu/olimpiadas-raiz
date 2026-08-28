# SPEC — Issue #159: Credenciais de integrações cifradas, tela raiz-only

**Issue:** https://github.com/raiz-edu/olimpiadas-raiz/issues/159 · **Data:** 2026-08-28
**Decisões do Helio (2026-08-28):** provedor pago = OpenAI (issue seguinte); chave vive **no banco, cifrada**.

## 1. Contexto

A avaliação das discursivas usa hoje uma única chave (`GROQ_API_KEY`) em env var. Com a produção na AWS, rotacionar chave exige a infra mexer em env e rebuildar; Hugo não tem esse acesso. A tela de credenciais precisa ser visível só para Helio e Hugo (`ADMIN_EMAILS`), e a chave nunca pode ir ao navegador.

Dois furos pré-existentes viram vazamento assim que uma API key entrar no banco:

- `getConfigValue` exportada de módulo `"use server"` sem checar sessão → qualquer usuário logado a invoca como Server Action.
- `/configuracoes/page.tsx` sem gate server-side; item do sidebar liberado por `audit_log:read` (diretor_marca vê).

## 2. Objetivo

Guardar chaves de integração cifradas no banco, geridas por uma tela restrita, consumidas pelo servidor com fallback em env var — sem quebrar nada enquanto a migration não roda no projeto da Raiz.

## 3. Escopo

**Dentro**

- R1. Migration `053_credencial` (`id uuid pk`, `chave unique`, `valor_cifrado`, `ultimos4`, `atualizado_em`, `atualizado_por → usuario`), RLS sem policies, índice na FK. Tipos em `lib/types/database.ts`.
- R2. `lib/credenciais/crypto.ts`: AES-256-GCM, IV aleatório por gravação, formato `v1:<iv>:<tag>:<ct>` (base64), chave-mestra `CREDENCIAIS_MASTER_KEY` (32 bytes base64). Erro claro se a env faltar ou tiver tamanho errado.
- R3. `lib/credenciais/queries.ts`: `getCredencial(chave)` = banco (decifrado) → env var do catálogo → `null`; cache em memória de 60 s; `invalidarCacheCredencial`. `listarCredenciais()` para a tela: nunca devolve o segredo, só `ultimos4`, origem (`banco` | `env` | `ausente`), quem/quando. Se a tabela não existir, a tela ainda renderiza com o status via env.
- R4. `lib/credenciais/catalogo.ts`: integrações conhecidas; `gerenciavel: true` só para as chaves que o servidor lê por `getCredencial` (OpenAI, Groq). As demais (Resend, Google OAuth, data-engine) aparecem como "gerida pela infra (env var)".
- R5. `lib/credenciais/testar.ts`: `GET /v1/models` do provedor com a chave; 10 s de timeout; mensagens em português.
- R6. Permissões: `credencial:read` e `credencial:update` só para `raiz`; `podeGerirCredenciais(role, email)` = permissão **e** e-mail em `ADMIN_EMAILS` (molde de `podeGerirApostilas`).
- R7. Página `/configuracoes/credenciais` (gate server-side com `podeGerirCredenciais`) + Server Actions `salvarCredencial`, `testarCredencial`, `removerCredencial`, cada uma re-checando o gate. Aviso quando `CREDENCIAIS_MASTER_KEY` não está configurada (salvar desabilitado).
- R8. Auditoria em `audit_log` (`entidade = "credencial"`, `entidade_id = credencial.id`, `dados_*` = `{ chave, ultimos4 }` — nunca o valor) via `lib/audit.ts`.
- R9. `getConfigValue` sai de `"use server"` para `lib/config/queries.ts`; `/configuracoes` ganha gate `raiz`; item do sidebar vira "Configurações", só para quem tem `credencial:read`.
- R10. `lib/ai/groq.ts` lê a chave por `getCredencial("groq_api_key")` (fallback `GROQ_API_KEY`).
- R11. `.env.example`, ONBOARDING e runbook documentam `CREDENCIAIS_MASTER_KEY`.

**Fora**

- Provedor OpenAI, seleção de modelo e fallback entre provedores (issue seguinte).
- Rewire de Resend/Google/data-engine para o banco.
- Rotação automática, versões antigas da chave, KMS.
- Executar a migration e definir a chave-mestra na AWS (operação).

## 4. Critérios de aceite

| #   | Critério                                                                                                                                                                                                                             | Verificação                                      |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| CA1 | `cifrar` → `decifrar` devolve o original; dois `cifrar` do mesmo texto diferem (IV); ciphertext adulterado ou chave errada → erro; env ausente → `MasterKeyAusenteError`                                                             | `tests/unit/credenciais/crypto.test.ts`          |
| CA2 | `getCredencial`: banco vence env; sem linha → env; erro do banco → env + `console.error`; segunda chamada em 60 s não consulta o banco; `invalidarCacheCredencial` força nova leitura                                                | `tests/unit/credenciais/queries.test.ts`         |
| CA3 | `salvarCredencial`: professor → "Não autorizado"; raiz com e-mail fora de `ADMIN_EMAILS` → "Não autorizado"; Helio → grava `valor_cifrado` (≠ texto claro), `ultimos4` certos, audita; chave curta ou integração desconhecida → erro | `tests/unit/credenciais/actions.test.ts`         |
| CA4 | `can()`: só raiz tem `credencial:*`; `podeGerirCredenciais` verdadeiro para Helio (2 e-mails) e Hugo, falso para outro raiz e para professor                                                                                         | `tests/unit/auth/credenciais-perms.test.ts`      |
| CA5 | A resposta de `listarCredenciais` e o HTML da página não contêm `valor_cifrado` nem o valor em claro                                                                                                                                 | Revisão do código + teste de `listarCredenciais` |
| CA6 | `/configuracoes` e `/configuracoes/credenciais` redirecionam não-raiz para `/dashboard`; sidebar não mostra "Configurações" para diretor_marca                                                                                       | Verificação local (dev server)                   |
| CA7 | `typecheck`, `lint`, suíte completa verdes                                                                                                                                                                                           | CI                                               |

## 5. Verificação vs SPEC (preenchida no build)

| Requisito | Status | Evidência                                                                                                                                                                                                                                                                                                |
| --------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1        | ✅     | `supabase/migrations/20260828_053_credencial.sql`; tipos em `lib/types/database.ts`                                                                                                                                                                                                                      |
| R2        | ✅     | `lib/credenciais/crypto.ts`; CA1 em `tests/unit/credenciais/crypto.test.ts` (9 testes)                                                                                                                                                                                                                   |
| R3        | ✅     | `lib/credenciais/queries.ts`; CA2 e CA5 em `tests/unit/credenciais/queries.test.ts` (8 testes)                                                                                                                                                                                                           |
| R4        | ✅     | `lib/credenciais/catalogo.ts` — OpenAI e Groq gerenciáveis; Resend, Google, data-engine só status                                                                                                                                                                                                        |
| R5        | ✅     | `lib/credenciais/testar.ts` — `GET /v1/models`, timeout 10 s, 401/403 com mensagem própria                                                                                                                                                                                                               |
| R6        | ✅     | `lib/auth/roles.ts` (`credencial:*` só raiz, `podeGerirCredenciais`); CA4 em `tests/unit/auth/credenciais-perms.test.ts`                                                                                                                                                                                 |
| R7        | ✅     | `app/(protected)/configuracoes/credenciais/{page,actions,credenciais-tabela}.tsx`; CA3 em `tests/unit/credenciais/actions.test.ts` (10 testes). CA6 (redirect) coberto pelo gate testado nas actions; a tela não foi exercitada em navegador — exige o projeto da Raiz com a migration 053 e login staff |
| R8        | ✅     | `lib/audit.ts`; testes das actions verificam `create`/`update`/`delete` só com `{ chave, ultimos4 }`                                                                                                                                                                                                     |
| R9        | ✅     | `lib/config/queries.ts`; `app/aluno/login/page.tsx` e `/configuracoes` passam a importar dali; gate em `/configuracoes`; sidebar com `credencial:read`                                                                                                                                                   |
| R10       | ✅     | `lib/ai/groq.ts` — `getClient()` assíncrono via `getCredencial("groq_api_key")`                                                                                                                                                                                                                          |
| R11       | ✅     | `.env.example`, `ONBOARDING.md`, `docs/ops/migracao-supabase-raiz.md` (Passo 4)                                                                                                                                                                                                                          |
| CA7       | ✅     | `npm run typecheck` limpo; ESLint limpo; `vitest run` — 18 arquivos, 180 testes verdes                                                                                                                                                                                                                   |

## 6. Riscos

- Chave-mestra perdida = credenciais irrecuperáveis → guardar a env em dois lugares (AWS + cofre da equipe); a tela mostra "ausente" e o fallback em env mantém o serviço.
- Cache de 60 s: após rotacionar, instâncias antigas usam a chave anterior por até 1 min — aceitável; a ação invalida o cache da própria instância.
- Sentry/`console.error` nunca recebem o valor: as mensagens de erro carregam só `chave` e `error.message` do Postgres.
