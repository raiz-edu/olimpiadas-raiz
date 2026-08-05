# SPEC — Issue #141: Gerador de Apostilas, Fase 2

> Aplicações por marca/unidade/turma + não repetir questões já usadas.
> Autorizada pelo Helio em 2026-08-04. Depende da Fase 1 (#136) em produção.

## Objetivo

Fechar o ciclo pedagógico: registrar ONDE cada geração de apostila foi aplicada e
permitir que uma receita EXCLUA as questões que os alvos escolhidos já receberam.

## Requisitos

### R1 — Modelo (migration `20260804_048_apostila_aplicacao.sql`)

`apostila_aplicacao`: id, geracao_id (FK cascade), marca_id/unidade_id/turma_id
(nullable, CHECK de pelo menos um preenchido), aplicado_em (date, default hoje),
observacao, criado_por, criado_em. Índices em geracao_id, marca_id, unidade_id,
turma_id. RLS habilitado sem policies (padrão service_role do módulo).

### R2 — Registrar aplicações (detalhe da receita)

Por geração: lista de aplicações ("Marca · Unidade · Turma (série, ano) · data") com
excluir (ConfirmButton), e form de registro: selects de marca, unidade e turma (todos
opcionais, mínimo um; rotulados com o contexto completo), data e observação.
Escrita: mesma allowlist da Fase 1 (`podeGerirApostilas`); leitura: `apostila:read`.

### R3 — Não repetir questões (construtor + contadores + skill)

- `ReceitaConfig.excluir_aplicadas = {marcas?: [], unidades?: [], turmas?: []}`.
- Construtor: card "Não repetir questões já aplicadas" com chips de marcas e selects
  múltiplos de unidades e turmas (rotulados com contexto). Grava ids no config.
- `contarAcervoCore` desconta as questões já aplicadas nos alvos (cadeia
  aplicação -> geração -> apostila_questao) — o "Conferir acervo" mostra o acervo REAL.
- Skill: mesmo desconto ANTES da seleção, com print de quantas questões saíram.

## Edge cases

- Aplicação sem nenhum alvo -> bloqueada (action valida + CHECK no banco).
- Exclusão que zera um bucket do mix -> vira déficit normal (balanço reporta).
- Alvos sem aplicação registrada -> exclusão vazia, seleção normal.
- Excluir geração/receita -> aplicações caem por cascade.

## Critérios de aceite

- [ ] Migration 048 + tipos no database.ts
- [ ] Registrar/listar/excluir aplicação no detalhe com gates corretos
- [ ] Construtor grava `excluir_aplicadas`; contadores descontam
- [ ] Skill exclui e reporta; teste ponta a ponta sem repetição
- [ ] Typecheck, lint, testes e build verdes
