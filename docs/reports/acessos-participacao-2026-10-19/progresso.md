# Acessos e participação — execução

- Branch: `feat/acessos-participacao`, pasta principal existente.
- Alterações anteriores em `.gitignore`, `eslint.config.mjs` e relatórios preservadas.
- Script global `repo-health.sh` não está disponível; conferidos status, worktrees
  e ausência de lock de Git antes da escrita. Trabalho sequencial; revisão somente leitura.
- Implementados: migração aditiva, RPCs, API, tracker, métricas, painel e navegação.
- Revisão independente aprovada após corrigir classificação por papel RBAC e
  associação de identidades criadas depois do instante de corte.

## Verificação

| Verificação                       | Resultado                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------------ |
| Suíte completa                    | 432 aprovados; 3 ignorados e 14 pendentes anteriores                                             |
| Novos testes de acessos           | 61 aprovados, incluindo SQL real/PGlite, RLS, API, escopo, proxy e consulta acima de mil pessoas |
| TypeScript                        | Aprovado, também conferido pelo build                                                            |
| Build de produção                 | Aprovado com Next.js 16.3.4; novas rotas incluídas                                               |
| ESLint dos arquivos alterados     | Aprovado                                                                                         |
| Formatação dos arquivos alterados | Aprovada                                                                                         |
| Navegador                         | 7 verificações aprovadas; zero erros de console                                                  |
| HTTP no Next de produção local    | 9 verificações aprovadas de rotas, origem, autenticação e corpo                                  |
| Revisão independente              | Aprovada                                                                                         |

O lint geral mantém dois erros anteriores em `scripts/extract_solutions.js` e
`scripts/parse-obmep.js` (imports `require`) e um aviso anterior em
`app/aluno/(area)/treino/treino-client.tsx`. Os scripts são locais/ignorados;
esses arquivos e as alterações anteriores de ESLint não pertencem à entrega.

## Evidências e limites

- [Desktop](desktop.png), [celular](celular.png), [navegador](navegador.json),
  [HTTP no Next](rotas-next.json), [build](build.log).
- O navegador renderiza o painel e tracker reais em servidor de teste separado,
  com dados sintéticos; não há rota de demonstração ou bypass no aplicativo.
- O SQL real foi executado em PostgreSQL local embarcado com fixtures; as rotas
  do Next foram conferidas sem sessão real. Nenhum dado pessoal foi consultado.
- O fluxo autenticado conectado ao banco remoto depende de aplicar a migração
  e da publicação. Banco remoto e produção não foram alterados.
- Não houve nova dependência nem mudança no cadastro, permissões ou provas.

Reproduzir: `npx vitest run tests/unit/acessos --maxWorkers=1` e
`node tests/browser/acessos-visual.mjs` (Chrome instalado).
Após build e `next start` em porta isolada 3105:
`node tests/browser/acessos-next-smoke.mjs`.

Implantação: [runbook](../../ops/acessos-participacao.md).
