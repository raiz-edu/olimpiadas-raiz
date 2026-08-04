# Plan — Issue #136: Gerador de Apostilas, Fase 1

Ordem de implementação (cada passo compila sozinho):

1. **Migration** `supabase/migrations/20260804_047_apostilas.sql`
   3 tabelas + RLS + seed `apostilas_nome_modulo` + bucket `apostilas`.
   Aplicação: manual pelo Helio no SQL Editor (fluxo padrão do projeto).
2. **Tipos** `lib/types/database.ts`: Row/Insert/Update das 3 tabelas.
3. **Domínio**
   - `lib/questoes/series.ts`: SERIE_MAP canônico + labels + helpers.
   - `lib/auth/domains.ts`: `APOSTILA_AUTORES` (2 e-mails do Helio).
   - `lib/auth/roles.ts`: recurso `apostila` (raiz CRUD; leitura geral read)
     - `podeGerirApostilas(role, email)`.
   - `lib/apostilas/receita.ts`: tipos do config (schema da skill), validação
     (mix soma 100, tópicos da taxonomia, quantidades), labels de exibição.
4. **Server actions** `app/(protected)/academico/apostilas/actions.ts`:
   salvar/atualizar/excluir receita (gate allowlist), contarAcervo (contadores),
   salvarNomeModulo, urlsDownload (signed URLs das versões).
5. **Telas**: lista (server) -> construtor `receita-form.tsx` (client, useActionState)
   usado por `/nova` e `/[id]/editar` -> detalhe `/[id]`.
6. **Sidebar**: label via prop (layout server lê config e passa ao Sidebar).
7. **Testes** `tests/unit/apostilas/receita.test.ts` (validação) +
   `tests/unit/auth/apostila-perms.test.ts` (matriz + allowlist).
8. **Gates**: typecheck, lint, vitest, build. Commits incrementais a cada bloco.
9. **PR** `closes #136` com verificação vs SPEC documentada.
10. **Pós-merge** (fora do repo): skill `--receita-id` + teste ponta a ponta após o
    Helio aplicar a migration.

Riscos mapeados: sidebar é client (label vem por prop do layout server); tabelas
acessadas só via adminClient (RLS sem policies, padrão configuracao_sistema);
contadores usam 1 query agregada por chamada (sem N+1).
