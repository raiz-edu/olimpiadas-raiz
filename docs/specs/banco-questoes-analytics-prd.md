# PRD: Análise do Banco de Questões (área de Gestão)

**Data:** 2026-06-15 | **Autor:** profheliogeo | **Status:** Draft (aguardando aprovação)

## 1. Problema

A área de Gestão (`/analytics`) hoje mede competição, preparação, metas e atividade
na plataforma — mas **não tem visibilidade sobre o próprio acervo de questões**. O
banco (`tabela questao`) já tem centenas de questões cadastradas manualmente (OBMEP e
OBMEP Mirim, fases 1/2, níveis 1/2/3, anos 2015-2025), porém o gestor de conteúdo não
consegue responder perguntas básicas sem abrir o SQL:

- "Quantas questões já temos para **OBMEP Nível 1, 2ª Fase**?"
- "Quais **tópicos** estão bem cobertos e quais têm poucas questões?"
- "A distribuição de **dificuldade** está equilibrada ou só temos questões fáceis?"
- "Quantas questões ainda estão **aguardando revisão** (pipeline de conteúdo)?"

Sem isso, o planejamento de cadastro de novas questões é feito "no escuro".

## 2. Personas

| Persona                              | Papel                                                  | Frequência de uso |
| ------------------------------------ | ------------------------------------------------------ | ----------------- |
| Coordenador de conteúdo / admin_rede | Planeja o que cadastrar, acompanha pipeline de revisão | Semanal           |
| Coordenador de marca (coord_marca)   | Avalia cobertura para preparação dos alunos            | Mensal            |

Mesma audiência da página `/analytics` atual — gate por `audit_log:read`.

## 3. Escopo (IN)

Nova **sub-página** `/analytics/banco-questoes` ("Banco de Questões — Gestão"),
acessível a partir de um card/link na página `/analytics` (padrão igual ao de "Metas").

Toda análise é **segmentada por OLIMPÍADA × NÍVEL × FASE** (ex.: "OBMEP · Nível 1 · 2ª Fase"),
selecionável via filtros `<form method="GET">` (URL params, zero-JS, igual ao resto do app).
Default sem filtro = visão consolidada de todo o acervo ativo.

Métricas obrigatórias (MVP fixo):

1. **Quantidade de questões por tópico** — tabela ordenada por contagem desc, com
   barra proporcional. Drill-down por **subtópico** (linhas agrupadas sob cada tópico).
2. **Distribuição por nível de dificuldade** — elementar / fácil / médio / difícil /
   muito difícil, com contagem + % + barra. Inclui bucket "não classificada" (null).

KPIs de topo (cards): total de questões (no recorte), nº de tópicos distintos,
nº aguardando revisão, % com alguma resolução.

## 4. Métricas adicionais — ESCOLHER para o MVP

Todas usam campos **já existentes** na tabela `questao`. Marque quais entram:

| #   | Métrica                                                              | Campo(s)                                     | Valor para o gestor                                             | Recomendação             |
| --- | -------------------------------------------------------------------- | -------------------------------------------- | --------------------------------------------------------------- | ------------------------ |
| A   | **Pipeline de revisão** — publicado vs aguardando revisão            | `status_cadastro`                            | Acompanhar produção de conteúdo; ver gargalo de revisão         | **Forte**                |
| B   | **Cobertura de resolução** — % com vídeo / texto / em produção / sem | `tem_resolucao_video`, `tem_resolucao_texto` | Saber quantas questões ainda precisam de resolução              | **Forte**                |
| C   | **Distribuição por tipo** — múltipla escolha vs aberta vs V/F        | `tipo`                                       | Equilíbrio do formato de avaliação                              | Média                    |
| D   | **Distribuição por público-alvo** — EFAI / EFAF / EM / Todos         | `publico_alvo`                               | Cobertura por segmento escolar                                  | Média                    |
| E   | **Matriz Ano × contagem** — quantas questões por ano de prova        | `ano`                                        | Ver quais provas históricas já foram digitalizadas              | Média                    |
| F   | **Cruzamento Tópico × Dificuldade** — heatmap de lacunas             | `topico` + `dificuldade`                     | Identificar lacunas finas (ex: tópico X só tem questões fáceis) | Opcional (mais complexo) |

**Proposta de MVP do construtor:** obrigatórias (1, 2) + **A** + **B** + **C**.
São as de maior valor operacional e baixo custo de implementação (mesma query base,
só agregações adicionais em memória). D/E como "fast-follow"; F fica fora do MVP por
custo de UI (heatmap).

> **Pergunta ao usuário:** confirma o MVP (1, 2, A, B, C)? Quer incluir D e/ou E?
> Quer F (heatmap tópico×dificuldade) já nesta entrega?

## 5. Fora de escopo (OUT)

- Edição/cadastro de questões (já existe em `/academico/banco-questoes`).
- Análise de **desempenho dos alunos** nas questões (`resposta_aluno`) — outra feature.
- Exportação para Excel/PDF.
- Gráficos com biblioteca de charting (Recharts etc.) — usaremos barras em CSS/Tailwind
  como o resto de `/analytics`, sem nova dependência (stack decision: Vercel+Supabase first).
- Filtro por marca/unidade (banco de questões é global, não segmentado por marca).

## 6. Métricas de sucesso

- Gestor consegue responder "quantas questões para OBMEP N1 2ª fase por tópico" em < 10s,
  sem SQL. (qualitativo)
- Cobertura visível: a página mostra nº de questões "aguardando revisão" e "sem resolução"
  para priorização. (funcional — existe na tela)

## 7. Riscos e dependências

- **Dados sujos**: `topico` pode ser null (dados antigos usavam `assunto`). Mitigação:
  fallback `topico ?? assunto ?? "Sem tópico"`. `dificuldade`/`publico_alvo` podem ser
  null → bucket "Não classificada".
- **Volume**: acervo é de centenas (não milhares) de questões → uma query `select` dos
  campos necessários + agregação em memória (padrão atual de `/analytics`) é suficiente,
  sem view materializada.
- **`nivel` textual**: armazenado como `nivel_1`/`nivel_2`/`nivel_3` / null (mirim).
  Precisa de mapa de labels para exibição amigável.
