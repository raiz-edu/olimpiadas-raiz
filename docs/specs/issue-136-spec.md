# SPEC — Issue #136: Gerador de Apostilas, Fase 1

> Construtor de receita clicável + histórico de produção. Padrão "a tela decide, o
> pipeline executa": a UI captura decisões e registra histórico; a seleção e o PDF
> continuam na skill `gerar-apostila` (Ferramenta 4, fora deste repo).
> Decisões de revisão do Helio (2026-08-04, comentário na issue) incorporadas.

## Objetivo

Módulo "Apostilas" (nome editável) no sistema: montar receita clicando (série,
assunto, % de dificuldade, origem, estilo, marca), salvar no banco com contadores de
acervo ao vivo, e consultar o histórico de gerações com balanço e PDFs.

## Requisitos

### R1 — Modelo de dados (migration `20260804_047_apostilas.sql`)

- `apostila_receita` (id, nome, titulo, subtitulo, config jsonb, criado_por,
  criado_em, atualizado_em). `config` no schema EXATO da skill (ver R6).
- `apostila_geracao` (id, receita_id FK cascade, seed, total_questoes, balanco jsonb,
  versoes jsonb `{professor, aluno}`, gerado_por, gerado_em). SEM versão impressão
  (decisão: não sobe pro Storage).
- `apostila_questao` (geracao_id FK cascade, questao_id FK, secao, numero_apostila,
  PK composta) — preparada para a Fase 2 (não repetir questão por turma).
- RLS habilitado nas 3, sem policies (acesso só via service_role/adminClient, mesmo
  padrão de `configuracao_sistema`).
- Seed em `configuracao_sistema`: chave `apostilas_nome_modulo`, valor `Apostilas`.
- Bucket privado `apostilas` (paths `apostilas/<geracao_id>/apostila_{professor|aluno}.pdf`).

### R2 — Permissões

- Novo recurso `apostila` em `lib/auth/roles.ts`: `raiz` = create/read/update/delete;
  `LEITURA_GERAL` (todas as demais roles staff) = `apostila:read`.
- **Gestão restrita ao Helio**: `APOSTILA_AUTORES` em `lib/auth/domains.ts` (os 2
  e-mails do Helio) + helper `podeGerirApostilas(email, role)` = role com
  `apostila:create` E e-mail na allowlist. Toda action de escrita valida com ele.

### R3 — Nome do módulo editável

- Lido de `configuracao_sistema.apostilas_nome_modulo` (default "Apostilas").
- Aparece no item do menu (Acadêmico) e no título da lista.
- Editável na própria tela da lista (form inline visível só para quem gere).

### R4 — Telas (`app/(protected)/academico/apostilas/`)

1. **Lista** (`/academico/apostilas`): receitas com última geração (data, total,
   déficit) e link para detalhe; `PageHeader` + `EmptyState`; botão "Nova receita"
   só para gestor; form inline do nome do módulo (R3).
2. **Construtor** (`/nova` e `/[id]/editar`, mesmo form):
   - Identificação: nome, título, subtítulo, marca (rede/escola da capa).
   - Séries (chips multi), origens (chips multi, default todas).
   - Mix global % (fácil/médio/difícil; vazio = sem mix; soma deve dar 100).
   - Seções: cada tópico da taxonomia com checkbox; ao marcar: quantidade,
     subtópicos (chips) e mix próprio opcional.
   - Estilo: colunas (1|2), escala de figuras, fonte (sans/serif), tamanho, espaçamento.
   - **Contadores ao vivo**: botão/refresh "Conferir acervo" chama server action que
     retorna disponibilidade por seção x dificuldade; déficit em vermelho.
   - Salvar valida (mix=100, seções com tópico válido, quantidade > 0) e grava
     `config` no schema da skill.
3. **Detalhe** (`/[id]`): config legível (não JSON cru), botão editar/excluir (gestor),
   gerações com balanço por seção e downloads via signed URL (1h).

### R5 — Menu

- SubItem "Apostilas" (label do R3) no grupo Acadêmico do sidebar, visível para quem
  tem `apostila:read`. Label passa por prop do layout (server) para o Sidebar.

### R6 — Contrato com a skill (fora deste repo)

- `config` = schema de receita da skill: `titulo, subtitulo, marca, series[], origens[],
niveis[], publico, anos{min,max}, seed, mix_dificuldade{}, secoes[{topico, subtopicos[],
quantidade, mix_dificuldade{}}], estilo{colunas, escala_figuras, fonte, tamanho_fonte,
espacamento}, sem_solucoes, compacto`.
- Skill `--receita-id <uuid>`: lê `apostila_receita.config`, gera professor+aluno
  (compactas), sobe pro bucket, insere `apostila_geracao` + `apostila_questao`.
- `lib/questoes/series.ts` = fonte canônica do SERIE_MAP (série -> pares
  olimpiada/nivel); a cópia Python espelha este arquivo.

## Edge cases

- Mix com soma != 100 -> bloquear salvar com mensagem.
- Seção sem quantidade -> válida (leva tudo que casa; contadores mostram o total).
- Receita sem seções -> válida (apostila inteira do filtro).
- Série sem acervo (ex.: 4º ano sem questões publicadas) -> contadores zerados, aviso.
- Excluir receita com gerações -> cascade apaga histórico; exigir confirmação
  (`ConfirmButton`) e avisar no label.
- Usuário raiz fora da allowlist (Hugo/Bernardo/Milena) -> vê tudo, não edita.

## Critérios de aceite

- [ ] Migration 047 com 3 tabelas + RLS + seed de config + bucket
- [ ] `apostila:*` nos roles; escrita bloqueada fora da allowlist (testes)
- [ ] `lib/questoes/series.ts` criado (tabela da issue)
- [ ] Lista com EmptyState, última geração e nome do módulo editável
- [ ] Construtor salva config válida no schema da skill; mix != 100 bloqueado;
      contadores com déficit visível
- [ ] Detalhe com config legível, gerações, balanço e signed URLs
- [ ] Sidebar com o item e label configurável
- [ ] Typecheck, lint, testes e build verdes
- [ ] (pós-merge, depende da migration aplicada) skill `--receita-id` ponta a ponta

## Fora de escopo

Fase 2 (aplicações por marca/turma, excluir já usadas), Fase 3 (PDF self-service),
upload da versão impressão.
