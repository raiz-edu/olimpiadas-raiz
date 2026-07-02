# SPEC — Engajamento e Desempenho dos Alunos

## Contexto

O painel de **Gestão** (`/analytics`) já exibe um bloco "Plataforma do Aluno" com
"Alunos mais frequentes" (top 10 **global**, ordenado por `login_count`), sem qualquer
métrica de desempenho. A liderança pediu uma visão dedicada que:

1. Liste os **20 alunos mais frequentes por marca** (não global).
2. Cruze frequência com **desempenho** desses alunos.

A visão fica sob a seção **Acadêmico** (acessível a professores/coordenadores), e não
em Gestão (restrita a raiz/diretor), por decisão do solicitante.

### Revisão da métrica de frequência (2026-07-02)

A primeira versão ordenava por `login_count` / `last_login_at`. Esses campos medem
**eventos de autenticação**, não uso real: a sessão do aluno dura 7 dias, então quem
faz login uma vez e deixa a plataforma aberta no celular por semanas aparece com
`login_count` baixo apesar de estar ativo — e quem faz vários logins sem usar nada
aparece no topo indevidamente. A frequência passa a ser medida por **atividade real**:

- **Dias ativos (30d)** — nº de dias-calendário distintos (fuso de Brasília) em que o
  aluno teve atividade real (resposta de treino em `resposta_aluno` **ou** progresso em
  aula em `aluno_progresso`) nos últimos 30 dias. É o sinal primário de ranking.
- **Última atividade** — timestamp mais recente entre as duas fontes acima.
- **Logins** — `login_count` mantido como **coluna secundária** (referência/comparação),
  não mais como critério de ordenação primário.

Sem nova migration: ambos os sinais derivam de timestamps já existentes.

## Objetivo

Nova página `/academico/desempenho` ("Engajamento e Desempenho") que, para cada marca,
mostra a tabela dos 20 alunos com mais acessos, com colunas de desempenho e um rodapé
com médias/agregados da marca.

## Escopo

### Incluído

- Rota `app/(protected)/academico/desempenho/page.tsx` (Server Component).
- Novo SubItem "Engajamento e Desempenho" na sidebar, dentro de Acadêmico.
- Gate de acesso: `can(session.user.role, "aluno:read")` — cobre raiz, diretor_marca,
  gestor_conteudo, professor, coordenador, diretor. Sem permissão → `redirect("/dashboard")`.
- Por marca (agrupado, todas as marcas com ≥1 aluno com acesso): card com tabela dos
  top-20 alunos por **dias ativos (30d)** — desempate por última atividade → logins →
  nome, colunas:
  | Aluno | Dias ativos (30d) | Última atividade | Logins | Questões (treino) | % Acerto | Aulas assistidas | Medalhas |
- Rodapé por marca: nº de alunos exibidos, média de dias ativos, total de logins,
  % de acerto agregado (Σacertos/Σrespondidas da marca), total de aulas assistidas,
  total de medalhas.
- Ordem dos cards de marca: por soma de dias ativos (marca mais engajada primeiro).
- Semáforo no % de acerto: verde ≥ 70, âmbar ≥ 50, vermelho < 50, "—" se sem respostas.

### Fora de escopo (follow-up)

- Filtro por marca do usuário logado (scoping): mantém-se o comportamento atual do app
  (`/alunos` e `/analytics` mostram todas as marcas via `createAdminClient()`). Refinar
  escopo por marca é item futuro.
- Filtros interativos (período, série), export CSV, drill-down por aluno.
- Nova migration/RPC — **não há**; tudo agrega em memória (volumes pequenos).

## Fontes de dados (todas já existentes)

| Métrica           | Fonte                                                         | Cálculo                                                      |
| ----------------- | ------------------------------------------------------------- | ------------------------------------------------------------ |
| Dias ativos (30d) | `resposta_aluno.respondido_em` + `aluno_progresso.updated_at` | nº de dias-calendário distintos (TZ SP) com atividade em 30d |
| Última atividade  | `resposta_aluno.respondido_em` + `aluno_progresso.updated_at` | `max(timestamp)` entre as duas fontes                        |
| Logins            | `aluno.login_count`                                           | direto (coluna secundária de referência)                     |
| Marca             | `aluno.marca_id` → `marca.nome`                               | join em memória                                              |
| Questões (treino) | `resposta_aluno` (por `aluno_id`)                             | `count(*)` (acumulado, all-time)                             |
| % Acerto          | `resposta_aluno.correta`                                      | `Σcorreta / count(*) * 100` (acumulado)                      |
| Aulas assistidas  | `aluno_progresso.assistido = true`                            | `count(*)` (acumulado)                                       |
| Medalhas          | `resultado.tipo` via `inscricao.aluno_id`                     | `count` onde tipo ∈ {ouro,prata,bronze,mencao_honrosa}       |

> **Dias ativos** usa a janela de 30 dias; as métricas de desempenho (questões, % acerto,
> aulas, medalhas) permanecem **acumuladas** (all-time), pois refletem histórico de
> aprendizado, não frequência recente.

## Implementação (padrão do `/analytics`)

Server Component com `createAdminClient()`:

1. `aluno` (ativo, `last_login_at` not null): `id, nome, marca_id, login_count`.
2. `marca`: `id, nome`.
3. Atividade da janela (todos os alunos, `.gte(campo, cutoff)` onde `cutoff = now − 30d`):
   - `resposta_aluno`: `aluno_id, respondido_em`.
   - `aluno_progresso`: `aluno_id, updated_at`.
     Para cada aluno: `diasAtivos` = tamanho do Set de dias-calendário SP distintos;
     `ultimaAtividade` = max timestamp.
4. Agrupar alunos por marca → ordenar por `(diasAtivos desc, ultimaAtividade desc,
login_count desc, nome)` → **top 20 por marca**. Coletar união dos `aluno_id` do top-N.
5. Para esses ids (`.in("aluno_id", ids)`) — métricas acumuladas:
   - `resposta_aluno`: `aluno_id, correta`.
   - `aluno_progresso` (`assistido = true`): `aluno_id`.
   - `inscricao`: `id, aluno_id` → coletar `inscricao_id` → `resultado`: `inscricao_id, tipo`.
6. Agregar em memória por aluno; montar linhas + rodapé por marca; ordenar marcas por
   soma de dias ativos. Renderizar cards por marca.

Nota de pureza: o `cutoff` (que usa `Date.now()`) é calculado em helper fora do corpo do
Server Component, para não violar a regra `react-hooks/purity` do ESLint.

Guards: se não há alunos com acesso, EmptyState. `.in()` protegido contra array vazio.

## Critérios de aceite

- [ ] Rota acessível a professor/coordenador/gestor/diretor/diretor_marca/raiz; nega quem
      não tem `aluno:read`.
- [ ] Cada marca com alunos exibe no máximo 20 alunos, ordenados por dias ativos (30d) desc.
- [ ] Um aluno com mais dias ativos aparece acima de outro com mais logins porém menos
      dias ativos (a frequência real prevalece sobre eventos de autenticação).
- [ ] Dias ativos conta dias-calendário distintos (fuso de Brasília), não nº de respostas.
- [ ] % de acerto confere: para um aluno com X respostas e Y corretas, mostra round(Y/X\*100).
- [ ] Aulas assistidas = nº de `aluno_progresso` com `assistido=true` do aluno.
- [ ] Medalhas = nº de resultados premiados do aluno (via inscrição).
- [ ] Rodapé agrega corretamente por marca (média de dias ativos, total de logins, etc.).
- [ ] SubItem aparece na sidebar sob Acadêmico e fica ativo na rota.
- [ ] `typecheck`, `lint`, `test` verdes; Preview da Vercel gerado no PR.

## Verificação vs SPEC

Após build: conferir cada critério de aceite acima, validar % de acerto contra uma
contagem manual em `resposta_aluno` para um aluno-amostra, e checar a navegação/gate.
