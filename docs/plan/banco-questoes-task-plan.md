# Task Plan — Banco de Questões Adaptativo OBMEP

**Goal:** Adicionar ao portal do aluno um módulo de treino com questões OBMEP cadastradas por admins, onde o aluno filtra, responde, vê gabarito e acompanha seu desempenho por nível e assunto.

---

## Conteúdo inicial disponível

144 PDFs OBMEP em `C:\Users\helio.barbosa\Documents\OBMEP`:

- Níveis: Mirim / Nivel-1 / Nivel-2 / Nivel-3
- Fases: 1a-Fase / 2a-Fase
- Anos: 2015–2025
- Formato: \_Prova.pdf + \_Solucao.pdf por combinação

Questões serão cadastradas manualmente via admin (sem parse automático de PDF nesta fase).

---

## Mapa de Dependências

```
Fase 0 (schema)
  └─► Fase 1 (types + roles)
        ├─► Fase 2 (actions admin)
        │     └─► Fase 6 (sidebar)
        └─► Fase 3 (actions aluno)
              └─► Fase 4 (UI treino)
                    └─► Fase 5 (dashboard)
```

F2 e F3 podem rodar em paralelo. F6 pode rodar após F2.

---

## Fase 0 — Schema + RLS (migration 015)

**Depende de:** nada

### Task 0.1 — ENUMs PostgreSQL `P`

Criar `nivel_obmep AS ENUM ('mirim','nivel_1','nivel_2','nivel_3')` e `tipo_questao AS ENUM ('multipla_escolha','aberta')`.
**Done when:** `\dT nivel_obmep` retorna os valores no banco.

### Task 0.2 — Tabela `questao` `P`

Colunas: id, nivel, fase (1|2), ano, numero, enunciado, imagem_url, assunto, tipo, ativo, criado_em.
UNIQUE (nivel, fase, ano, numero). Índices: nivel, ano, assunto, ativo (partial), composto nivel+fase+ano.
**Done when:** INSERT duplicado rejeitado; insert válido aceito.

### Task 0.3 — Tabela `alternativa` `P`

Colunas: id, questao_id (FK CASCADE), letra, texto, correta.
UNIQUE (questao_id, letra). Índice: idx_alternativa_questao.
**Done when:** DELETE em questao faz CASCADE nas alternativas.

### Task 0.4 — Tabela `solucao` `P`

Colunas: id, questao_id (FK CASCADE UNIQUE), texto, imagem_url, criado_em.
**Done when:** Segunda solução para mesma questão viola UNIQUE.

### Task 0.5 — Tabela `resposta_aluno` `M`

Colunas: id, aluno_id (FK CASCADE), questao_id (FK CASCADE), alternativa_id (FK SET NULL, nullable), correta, respondido_em.
Sem UNIQUE em (aluno_id, questao_id) — permite múltiplas tentativas. Dashboard usa DISTINCT ON mais recente.
**Done when:** Múltiplas respostas do mesmo aluno à mesma questão são aceitas.

### Task 0.6 — RLS questao/alternativa/solucao `M`

- staff_full: FOR ALL WHERE usuario existente.
- aluno_read: FOR SELECT WHERE current_aluno_id() IS NOT NULL AND ativo = true (questao); subquery EXISTS para alternativa e solucao.
  **Done when:** Anônimo não vê; aluno vê questões ativas; staff vê tudo.

### Task 0.7 — RLS resposta_aluno `M`

- aluno_own: FOR ALL WHERE aluno_id = current_aluno_id().
- staff_read: FOR SELECT WHERE usuario existente.
  **Done when:** Aluno A não acessa respostas do aluno B.

---

## Fase 1 — Types TypeScript + Roles

**Depende de:** Fase 0

### Task 1.1 — ENUMs em database.ts `P`

Adicionar `NivelObmep` e `TipoQuestao` aos tipos.
**Done when:** Import compila sem erro.

### Task 1.2 — Row/Insert/Update para 4 tabelas `M`

Seguir padrão das outras tabelas em `lib/types/database.ts`.
**Done when:** `const q: Tables<"questao">` infere todos os campos.

### Task 1.3 — Aliases de tipo `P`

`Questao`, `Alternativa`, `Solucao`, `RespostaAluno`.
**Done when:** Importação direta funciona.

### Task 1.4 — Permissões em roles.ts `P`

Adicionar resource `questao` e permissões create/read/update/delete ao role `raiz`.
**Done when:** `can("raiz","questao:create")` = true; `can("direcao_marca","questao:create")` = false.

---

## Fase 2 — Server Actions admin

**Depende de:** Fase 1

### Task 2.1 — `app/(protected)/academico/banco-questoes/actions.ts` `G`

9 funções: criarQuestao, atualizarQuestao, ativar/desativarQuestao, criarAlternativa, atualizarAlternativa, excluirAlternativa, salvarSolucao (upsert), getQuestoes, getQuestaoDetalhe.
Segurança: apenas uma alternativa correta por questão (UPDATE antes do INSERT).
**Done when:** CRUD completo funcional; alternativa duplicada retorna erro de DB.

### Task 2.2 — Listagem `/academico/banco-questoes/page.tsx` `M`

PageHeader + filtros GET + tabela com ações.
**Done when:** Filtro por nivel=mirim reduz lista; toggle ativo funciona.

### Task 2.3 — Criação `/academico/banco-questoes/nova/page.tsx` `M`

Form com useActionState(criarQuestao).
**Done when:** Submit cria e redireciona para detalhe.

### Task 2.4 — Detalhe/Edição `/academico/banco-questoes/[id]/page.tsx` `G`

3 seções: dados da questão, alternativas (CRUD inline A-E), solução.
**Done when:** Edição persiste; toggle correta move flag; solução salva via upsert.

### Task 2.5 — Estatísticas globais por questão `M`

Query: total respostas + % acerto + frequência por alternativa.
**Done when:** Exibe dados corretos; zeros para questão nova.

---

## Fase 3 — Server Actions aluno

**Depende de:** Fase 1

### Task 3.1 — `app/aluno/(area)/treino/actions.ts` `G`

- getQuestoesTreino(filtros): ordena sequencial ou RANDOM().
- responderQuestao: recebe questao_id + alternativa_id; calcula correta no servidor via adminClient; insere em resposta_aluno.
- getRespostaAluno(questaoId): última resposta.
- getSolucaoQuestao(questaoId): revela só após resposta.

**Segurança crítica:** campo `correta` de alternativa nunca vai ao client. Cálculo feito no servidor.
**Done when:** resposta correta registra correta=true; incorreta registra false; `correta` não aparece no JSON do client.

### Task 3.2 — `app/aluno/(area)/treino/dashboard/actions.ts` `M`

- getDashboardAluno(): GROUP BY nivel, assunto com COUNT.
- getUltimasErradas(limit=10): DISTINCT ON questao_id, correta=false, ORDER BY respondido_em DESC.
  **Done when:** 5 respostas (3 certas, 2 erradas) → acertos=3, total=5; últimas erradas = 2 itens.

---

## Fase 4 — UI aluno: tela de treino

**Depende de:** Fase 3

### Task 4.1 — `app/aluno/(area)/treino/page.tsx` `G`

Server Component com filtros GET (nivel, fase, ano, assunto, modo) + TreinoClient.
**Done when:** `/aluno/treino?nivel=mirim&ano=2023` filtra corretamente.

### Task 4.2 — `components/aluno/treino-client.tsx` `G`

"use client". Estado: questaoAtual, respondido, alternativaSelecionada, mostrarSolucao.
Fluxo: clicar alternativa → chamar responderQuestao → feedback visual → habilitar "Ver Solução" + "Próxima". Última questão → tela de conclusão com link ao dashboard.
**Done when:** Certa=verde; errada=vermelho; não repete resposta; solução só após responder.

### Task 4.3 — `components/aluno/questao-card.tsx` `M`

Display-only. Enunciado, imagem opcional, alternativas com letras circulares e estados: neutro/selecionado/correto/incorreto.
**Done when:** Estados visuais corretos após respondido=true.

### Task 4.4 — `app/aluno/(area)/treino/[questaoId]/page.tsx` `P`

Read-only: questão + resposta do aluno marcada + gabarito destacado.
**Done when:** Acessar rota mostra questão com gabarito visível.

---

## Fase 5 — UI aluno: dashboard de desempenho

**Depende de:** Fase 4

### Task 5.1 — `app/aluno/(area)/treino/dashboard/page.tsx` `M`

Cards: total respondidas, % acerto geral. Tabelas: por nível, por assunto. Lista "Últimas erradas" com links de revisão.
**Done when:** EmptyState sem dados; stats corretas com dados; link abre questão.

### Task 5.2 — Link "Treino" na nav do aluno `P`

Adicionar item em aluno-nav.tsx com `/aluno/treino`.
**Done when:** Link visível e ativo quando pathname começa com /aluno/treino.

---

## Fase 6 — Link admin na sidebar

**Depende de:** Fase 2

### Task 6.1 — "Banco de Questões" na sidebar `P`

Sob grupo "Acadêmico", guard can(role, "questao:read").
**Done when:** role raiz vê; direcao_marca não vê.

---

## Arquivos a criar/editar

```
supabase/migrations/20260530_015_banco_questoes.sql   ← Fases 0.1-0.7
lib/types/database.ts                                  ← Editar F1.1-1.3
lib/auth/roles.ts                                      ← Editar F1.4
app/(protected)/academico/banco-questoes/
  actions.ts                                           ← F2.1
  page.tsx                                             ← F2.2
  nova/page.tsx                                        ← F2.3
  [id]/page.tsx                                        ← F2.4-2.5
app/aluno/(area)/treino/
  page.tsx                                             ← F4.1
  actions.ts                                           ← F3.1
  [questaoId]/page.tsx                                 ← F4.4
  dashboard/
    page.tsx                                           ← F5.1
    actions.ts                                         ← F3.2
components/aluno/
  treino-client.tsx                                    ← F4.2
  questao-card.tsx                                     ← F4.3
  aluno-nav.tsx                                        ← Editar F5.2
components/layout/
  sidebar.tsx                                          ← Editar F6.1
```

## Estimativa total

| Fase            | Tasks  | Tamanho | ~horas   |
| --------------- | ------ | ------- | -------- |
| 0 Schema        | 7      | P-M     | 2h       |
| 1 Types         | 4      | P-M     | 1h       |
| 2 Admin         | 5      | M-G     | 4h       |
| 3 Actions aluno | 2      | M-G     | 3h       |
| 4 UI treino     | 4      | M-G     | 4h       |
| 5 Dashboard     | 2      | P-M     | 2h       |
| 6 Nav           | 1      | P       | 0.5h     |
| **Total**       | **25** |         | **~16h** |

Com F2+F3 em paralelo: ~12h.
