# SPEC — Produção na AWS + Supabase da Raiz: schema, CSP e Storage

**Tipo:** hotfix (produção degradada) — SPEC retroativa, conforme `issue-spec-workflow`
**Data:** 2026-08-28 · **Runbook operacional:** `docs/ops/migracao-supabase-raiz.md`

## 1. Contexto

O app foi movido da Vercel para a AWS (CloudFront) e o banco do projeto Supabase pessoal (`ebdazvyyunilbkygtevn`) para o projeto Supabase da Raiz Educação. Em produção, `/aluno/treino` exibe imagens quebradas e fica em "Carregando alternativas…".

## 2. Causas (diagnosticadas em produção, 2026-08-28)

1. CSP servido sem o host do Supabase em `img-src`/`connect-src` (o host estava hardcoded no `next.config.ts` e foi removido fora do repositório).
2. Schema criado à mão no projeto antigo, sem migration, ausente no novo: 4 colunas e 3 tabelas (ver migration 052). Os loaders de alternativas engolem o erro (`data ?? []`).
3. URLs absolutas de imagem no banco apontam para o Storage do projeto antigo (3.101 objetos).
4. Build na AWS anterior ao PR #152.

## 3. Objetivo

Tornar o repositório suficiente para restaurar a produção e impedir a recorrência: o schema manual passa a ser versionado, o CSP passa a seguir o projeto configurado, falhas de infra nos loaders passam a aparecer no log, e a operação (Storage, URLs, env, deploy) fica documentada e instrumentada.

## 4. Escopo

**Dentro**

- R1. Migration idempotente `052` com todas as colunas/tabelas do inventário.
- R2. `next.config.ts` deriva os hosts do CSP de `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_CSP_EXTRA_ORIGINS`, com fallback para o host antigo quando o env não existe no build.
- R3. `getAlternativasQuestao` (treino) e o loader de alternativas do simulado registram `error.message` em vez de devolver `[]` em silêncio.
- R4. Scripts em `supabase/scripts/migracao-raiz/`: verificação de schema (SQL), reescrita de URLs (SQL, transacional, com dry-run), cópia de Storage (Node, idempotente, dry-run), inventário/diff de projeto (Node).
- R5. Runbook com ordem de execução, header CSP exato, tabela de env vars (build × runtime), verificação final e rollback.
- R6. `.env.example` e `docs/deploy.md` refletem a infra atual.

**Fora**

- Executar a migração (SQL Editor, cópia de Storage, env na AWS, rebuild) — depende de acesso ao projeto da Raiz e à AWS.
- Pipeline de deploy para a AWS (recomendado no runbook; PR próprio).
- Migrar `auth.users` (procedimento no runbook; depende do estado do projeto novo).
- Página de credenciais / troca do provedor de IA (trabalho seguinte, separado).

## 5. Critérios de aceite

| #   | Critério                                                                                                                                                                                       | Como verificar                                                         |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| CA1 | 052 roda sem erro duas vezes seguidas (idempotente) e cria exatamente os 7 objetos do inventário                                                                                               | Rodar 2× no SQL Editor; bloco A do `01-verificar-schema.sql` todo `ok` |
| CA2 | Com `NEXT_PUBLIC_SUPABASE_URL=https://x.supabase.co` e `NEXT_PUBLIC_CSP_EXTRA_ORIGINS=https://y.supabase.co`, o CSP contém os dois em `img-src` e `connect-src`; sem env, contém o host antigo | Avaliar `headers()` do `next.config.ts` com os envs                    |
| CA3 | Erro no select de alternativas aparece em `console.error` com o id da questão                                                                                                                  | Teste unitário da action com mock retornando `{ error }`               |
| CA4 | `copiar-storage.mjs --dry-run` não escreve nada e lista contagens por bucket; sem flag, objeto já existente com mesmo tamanho é pulado                                                         | Execução contra os dois projetos (Helio)                               |
| CA5 | `02-reescrever-urls-storage.sql` zera o dry-run do próprio arquivo após rodar                                                                                                                  | SQL Editor (Helio)                                                     |
| CA6 | `typecheck`, `lint` e a suíte de testes passam                                                                                                                                                 | CI                                                                     |

## 6. Verificação vs SPEC (preenchida no build)

| Requisito | Status | Evidência                                                                                                                            |
| --------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| R1        | ✅     | `supabase/migrations/20260828_052_schema_manual_nao_versionado.sql`                                                                  |
| R2        | ✅     | `next.config.ts` — CA2 verificado localmente com envs                                                                                |
| R3        | ✅     | `app/aluno/(area)/treino/actions.ts`, `app/aluno/(area)/simulados/actions.ts`; teste em `tests/unit/aluno/alternativas-erro.test.ts` |
| R4        | ✅     | `supabase/scripts/migracao-raiz/*` (CA4/CA5 dependem do projeto da Raiz — executados pelo Helio)                                     |
| R5        | ✅     | `docs/ops/migracao-supabase-raiz.md`                                                                                                 |
| R6        | ✅     | `.env.example`, `docs/deploy.md`                                                                                                     |

## 7. Riscos

- CloudFront sobrescrevendo o CSP torna R2 inócuo em produção — o runbook exige ajuste da política.
- Se o projeto novo foi criado por dump completo, 052 é no-op e a causa das alternativas é outra — o bloco A do script de verificação decide em segundos.
- Reescrever URLs antes de copiar o Storage quebra tudo de vez; a ordem no runbook é obrigatória.
