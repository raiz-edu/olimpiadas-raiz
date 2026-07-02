# SPEC — Engajamento e Desempenho dos Alunos

## Contexto

O painel de **Gestão** (`/analytics`) já exibe um bloco "Plataforma do Aluno" com
"Alunos mais frequentes" (top 10 **global**, ordenado por `login_count`), sem qualquer
métrica de desempenho. A liderança pediu uma visão dedicada que:

1. Liste os **20 alunos mais frequentes por marca** (não global).
2. Cruze frequência com **desempenho** desses alunos.

A visão fica sob a seção **Acadêmico** (acessível a professores/coordenadores), e não
em Gestão (restrita a raiz/diretor), por decisão do solicitante.

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
  top-20 alunos por `login_count`, colunas:
  | Aluno | Acessos | Últ. acesso | Questões (treino) | % Acerto | Aulas assistidas | Medalhas |
- Rodapé por marca: nº de alunos exibidos, total de acessos, % de acerto agregado
  (Σacertos/Σrespondidas da marca), total de aulas assistidas, total de medalhas.
- Semáforo no % de acerto: verde ≥ 70, âmbar ≥ 50, vermelho < 50, "—" se sem respostas.

### Fora de escopo (follow-up)

- Filtro por marca do usuário logado (scoping): mantém-se o comportamento atual do app
  (`/alunos` e `/analytics` mostram todas as marcas via `createAdminClient()`). Refinar
  escopo por marca é item futuro.
- Filtros interativos (período, série), export CSV, drill-down por aluno.
- Nova migration/RPC — **não há**; tudo agrega em memória (volumes pequenos).

## Fontes de dados (todas já existentes)

| Métrica           | Fonte                                     | Cálculo                                                |
| ----------------- | ----------------------------------------- | ------------------------------------------------------ |
| Acessos           | `aluno.login_count`                       | direto                                                 |
| Último acesso     | `aluno.last_login_at`                     | direto                                                 |
| Marca             | `aluno.marca_id` → `marca.nome`           | join em memória                                        |
| Questões (treino) | `resposta_aluno` (por `aluno_id`)         | `count(*)`                                             |
| % Acerto          | `resposta_aluno.correta`                  | `Σcorreta / count(*) * 100`                            |
| Aulas assistidas  | `aluno_progresso.assistido = true`        | `count(*)`                                             |
| Medalhas          | `resultado.tipo` via `inscricao.aluno_id` | `count` onde tipo ∈ {ouro,prata,bronze,mencao_honrosa} |

## Implementação (padrão do `/analytics`)

Server Component com `createAdminClient()`:

1. `aluno` (ativo, `last_login_at` not null): `id, nome, marca_id, last_login_at, login_count`.
2. `marca`: `id, nome`.
3. Agrupar alunos por marca → ordenar por `login_count` desc → **top 20 por marca**.
   Coletar união dos `aluno_id` do top-N.
4. Para esses ids (`.in("aluno_id", ids)`):
   - `resposta_aluno`: `aluno_id, correta`.
   - `aluno_progresso` (`assistido = true`): `aluno_id`.
   - `inscricao`: `id, aluno_id` → coletar `inscricao_id` → `resultado`: `inscricao_id, tipo`.
5. Agregar em memória por aluno; montar linhas + rodapé por marca.
6. Renderizar cards por marca (mesma linguagem visual do `/analytics`).

Guards: se não há alunos com acesso, EmptyState. `.in()` protegido contra array vazio.

## Critérios de aceite

- [ ] Rota acessível a professor/coordenador/gestor/diretor/diretor_marca/raiz; nega quem
      não tem `aluno:read`.
- [ ] Cada marca com alunos exibe no máximo 20 alunos, ordenados por acessos desc.
- [ ] % de acerto confere: para um aluno com X respostas e Y corretas, mostra round(Y/X\*100).
- [ ] Aulas assistidas = nº de `aluno_progresso` com `assistido=true` do aluno.
- [ ] Medalhas = nº de resultados premiados do aluno (via inscrição).
- [ ] Rodapé agrega corretamente por marca.
- [ ] SubItem aparece na sidebar sob Acadêmico e fica ativo na rota.
- [ ] `typecheck`, `lint`, `test` verdes; Preview da Vercel gerado no PR.

## Verificação vs SPEC

Após build: conferir cada critério de aceite acima, validar % de acerto contra uma
contagem manual em `resposta_aluno` para um aluno-amostra, e checar a navegação/gate.
