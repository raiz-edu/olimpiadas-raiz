# SPEC: Análise do Banco de Questões (área de Gestão)

**Refs:** `banco-questoes-analytics-prd.md` | Tabela `questao` (migrations 015, 017, 018, 021, 025, 029)
**Status:** Aprovado — MVP = obrigatórias (1, 2) + A + B + C + D + E. F (heatmap) fora do MVP.

## Decisões aprovadas (2026-06-15)

1. **Métricas do MVP**: obrigatórias **1** (tópico/subtópico) e **2** (dificuldade) + **A**
   (pipeline de revisão — `status_cadastro`), **B** (cobertura de resolução —
   `tem_resolucao_video`/`tem_resolucao_texto`), **C** (tipo — múltipla escolha × aberta ×
   V/F), **D** (público-alvo — EFAI/EFAF/EM/Todos) e **E** (matriz Ano × contagem).
   **F** (heatmap Tópico × Dificuldade) **fica de fora** do MVP.
2. **Permissão**: `audit_log:read` (mesma de `/analytics`).
3. **Localização**: sub-página `/analytics/banco-questoes`, com link a partir de
   `/analytics`, seguindo o padrão de `/analytics/metas`.

> **Notas de schema confirmadas no código** (corrigem o PRD/SPEC original):
>
> - `tipo` (enum `tipo_questao` + ampliações): `multipla_escolha | aberta |
verdadeiro_ou_falso`. Labels reaproveitados de `academico/banco-questoes`:
>   "M. Escolha" / "Aberta" / "V. ou Falso".
> - `olimpiada` é **texto livre** desde a migration 017 (não apenas o enum
>   `obmep`/`obmep_mirim`). O select de olimpíada é populado a partir dos valores
>   distintos presentes no acervo; mapa de label só para os conhecidos, fallback = valor cru.
> - `tem_resolucao_video`/`tem_resolucao_texto`: `sim | nao | em_producao` (default `'nao'`).
> - `status_cadastro`: `publicado | aguardando_revisao` (default `'publicado'`).
> - `publico_alvo`: `EFAI | EFAF | EM | Todos` (nullable → bucket "—").

## Objetivo

Adicionar uma sub-página `/analytics/banco-questoes` na área de Gestão com análise do
acervo de questões, segmentada por **Olimpíada × Nível × Fase** (+ filtro de ano e
status de revisão). Server Component puro, sem JS de cliente, seguindo o padrão visual
e arquitetural de `app/(protected)/analytics/page.tsx` e `.../analytics/metas/page.tsx`.

## Arquitetura

```
/analytics/page.tsx  ──(novo card/link "Banco de Questões")──▶  /analytics/banco-questoes/page.tsx
                                                                       │
                                              createAdminClient() ─────┤ 1 query: questao (campos p/ análise)
                                                                       │ + filtros via searchParams (GET form)
                                                                       ▼
                                              agregações em memória ─▶ render (SectionCard / Divider / barras)
```

- **Server Component** (`async function`), sem `"use client"`.
- Dados: **uma** chamada `supabase.from("questao").select(...)` via `createAdminClient()`
  de `@/lib/supabase/admin` (bypassa RLS — consistente com `/analytics`).
- Filtros: `<form method="GET">` → `searchParams` (Promise no App Router).
- Agregação: reduce em memória (acervo de centenas de linhas; mesmo padrão de `groupBy`
  da página atual). Sem view nova, sem dependência nova.

## Permissão

```ts
const session = await getServerSession();
if (!session) return null;
if (!can(session.user.role, "audit_log:read")) redirect("/dashboard");
```

Mesmo gate da página `/analytics` atual (a feature é uma extensão de Gestão). Não usar
`questao:read` para manter consistência de quem vê a área de Gestão.

## Interfaces

### Query (única)

```ts
const { data: questoes } = await supabase
  .from("questao")
  .select(
    "id, olimpiada, nivel, fase, ano, topico, subtopico, assunto, " +
      "dificuldade, publico_alvo, tipo, status_cadastro, " +
      "tem_resolucao_video, tem_resolucao_texto, ativo",
  )
  .eq("ativo", true); // acervo ativo; filtros de recorte aplicados em memória
```

> Os filtros de Olimpíada/Nível/Fase/Ano/Status são aplicados **em memória** após a
> query (acervo pequeno), o que mantém o código de uma única passada e permite calcular
> ao mesmo tempo as opções de dropdown disponíveis (anos/níveis presentes no acervo).
> Alternativa equivalente: aplicar `.eq()` por param na query — decisão de impl., não
> muda o resultado. Manteremos filtro em memória para popular os selects dinamicamente.

### searchParams

```ts
type SP = {
  olimpiada?: string; // 'obmep' | 'obmep_mirim'
  nivel?: string; // 'nivel_1' | 'nivel_2' | 'nivel_3' | 'mirim'
  fase?: string; // '1' | '2'
  ano?: string; // '2015'..'2025'
  status_cadastro?: string; // 'publicado' | 'aguardando_revisao'
};
```

### Mapas de label (constantes no arquivo)

```ts
const OLIMPIADA_LABEL = { obmep: "OBMEP", obmep_mirim: "OBMEP Mirim" };
const NIVEL_LABEL = { nivel_1: "Nível 1", nivel_2: "Nível 2", nivel_3: "Nível 3", mirim: "Mirim" };
const DIFICULDADE_ORDER = ["elementar", "facil", "medio", "dificil", "muito_dificil"]; // + "nao_classificada"
const DIFICULDADE_LABEL = {
  elementar: "Elementar",
  facil: "Fácil",
  medio: "Médio",
  dificil: "Difícil",
  muito_dificil: "Muito Difícil",
};
const TIPO_LABEL = {
  multipla_escolha: "Múltipla escolha",
  aberta: "Aberta",
  verdadeiro_ou_falso: "V ou F",
};
const RESOLUCAO_LABEL = { sim: "Pronta", em_producao: "Em produção", nao: "Pendente" };
```

## Layout (de cima para baixo)

1. **Header**: back-link `← Gestão` (→ `/analytics`) + `<h1>Banco de Questões</h1>` +
   subtítulo. (padrão de `metas/page.tsx`).
2. **Barra de filtros** `<form method="GET">`: selects Olimpíada, Nível, Fase, Ano,
   Status de revisão + botões Filtrar / Limpar. Selects de Ano/Nível populados a partir
   dos valores realmente presentes no acervo. Legenda do recorte ativo (ex.: "OBMEP ·
   Nível 1 · 2ª Fase · 2024").
3. **KPI cards** (grid 2/4): Total de questões (no recorte) · Tópicos distintos ·
   Aguardando revisão · % com resolução (vídeo ou texto = sim).
4. `Divider "Cobertura por tópico"` → **SectionCard**: tabela Tópico → contagem, % e
   barra, ordenada desc. Cada tópico expande em linhas de **subtópico** (indentadas).
   Fallback de tópico: `topico ?? assunto ?? "Sem tópico"`.
5. `Divider "Dificuldade"` → **SectionCard**: distribuição por dificuldade na ordem
   `DIFICULDADE_ORDER` + bucket "Não classificada", com contagem/%/barra.
6. `Divider "Pipeline de conteúdo"`:
   - **A** Status de cadastro: publicado vs aguardando revisão (contagem/%/barra).
   - **B** Cobertura de resolução: distribuição de `tem_resolucao_texto` e
     `tem_resolucao_video` (Pronta / Em produção / Pendente), lado a lado.
   - **C** Tipo: múltipla escolha vs aberta vs V/F (contagem/%/barra).
7. `Divider "Segmentação"`:
   - **D** Público-alvo: EFAI / EFAF / EM / Todos + "—" (null) (contagem/%/barra).
   - **E** Matriz Ano × contagem: tabela ano (desc) → contagem + barra, mostrando quais
     provas históricas já foram digitalizadas no recorte.
   - **F** (heatmap Tópico × Dificuldade): **fora do MVP**.

## Componentes reutilizados (copiados localmente, padrão da página atual)

`SectionCard`, `Divider`, `pct(n,total)`, `fmt(n)` já existem em `analytics/page.tsx`
mas **não são exportados**. Duas opções:

- **(escolhida)** Replicar os helpers no novo arquivo (são triviais, ~20 linhas) —
  mantém isolamento e zero refactor da página existente (menor risco).
- (rejeitada) Extrair para `@/components/analytics/ui` e importar nas duas — refactor
  maior, fora do escopo single-PR.

Barras: `<div className="h-2 rounded bg-..." style={{ width: `${pct}%` }} />` no estilo
das barras de funil/metas já presentes.

## Edge cases

- Acervo vazio / recorte sem resultados → `EmptyState`-like ("Nenhuma questão para este
  recorte.") em cada SectionCard (padrão `total === 0` da página atual).
- `topico` e `assunto` ambos null → "Sem tópico".
- `dificuldade`/`tipo`/`publico_alvo` null → bucket "Não classificada"/"—".
- `nivel` null (mirim) → exibir "Mirim"; filtro de nível esconde opções inexistentes
  para a olimpíada selecionada (best-effort, sem JS: mostra todos os níveis presentes).
- `fase` sempre 1 ou 2 (CHECK constraint) — sem null.
- Divisão por zero em `pct` já tratada (`total > 0 ? ... : 0`).

## Critérios de aceite

- [ ] Existe `/analytics/banco-questoes` e um link para ela na página `/analytics`.
- [ ] Sem filtro, mostra o acervo ativo inteiro agregado.
- [ ] Filtros Olimpíada/Nível/Fase/Ano/Status funcionam via URL (GET) e são combináveis.
- [ ] Tabela "por tópico" ordenada desc, com drill-down por subtópico e fallback de tópico.
- [ ] Distribuição por dificuldade nas 5 categorias + "Não classificada", com %/barra.
- [ ] KPIs de topo refletem o recorte filtrado.
- [ ] Métricas A (status), B (resolução), C (tipo), D (público-alvo), E (ano) renderizadas.
- [ ] Gate `audit_log:read`; `coord_unidade`/`professor` são redirecionados.
- [ ] `bun run typecheck` e `bun run lint` passam; visual consistente com `/analytics`.

## Test plan

- **Manual (interativo)**: navegar `/analytics` → clicar card → `/analytics/banco-questoes`;
  aplicar recorte "OBMEP · Nível 1 · 2ª Fase" e conferir que as contagens batem com uma
  query SQL de verificação (`select count(*) ... where olimpiada='obmep' and nivel='nivel_1'
and fase=2 and ativo`). Verificar recorte sem dados (estado vazio) e bucket "Não
  classificada" (questão com `dificuldade` null).
- **Typecheck/lint**: arquivos tocados.
- Sem testes unitários novos (página de leitura, agregação pura; segue padrão atual de
  `/analytics` que não tem testes dedicados).

## Rollback

Feature aditiva e isolada (novo arquivo de rota + 1 link na página existente). Rollback =
remover o diretório `app/(protected)/analytics/banco-questoes/` e o card adicionado em
`analytics/page.tsx`. Sem migration, sem mudança de schema, sem nova dependência.

## Arquivos

- **Novo**: `app/(protected)/analytics/banco-questoes/page.tsx`
- **Editado**: `app/(protected)/analytics/page.tsx` (adicionar card/link de acesso —
  provavelmente perto do bloco de Metas ou em um novo Divider "Conteúdo").
