-- 045 — Classificação das olimpíadas obrigatórias
--
-- Contexto: a coluna `olimpiada.classificacao` estava incompleta. Só OBMEP
-- (2024-2026) e OBF (2026) constavam como obrigatória; as 25 olimpíadas de 2026
-- entraram numa carga em lote e ficaram todas facultativa, sem revisão.
-- Isso deixava a seção "Olimpíadas obrigatórias" da Gestão quase vazia — e,
-- em 2024, totalmente vazia, já que o único dado do ano é da Canguru.
--
-- Lista correta do programa: OBMEP, OBF, Canguru e OBA.
--
-- Aplicada a todos os anos em que cada olimpíada existe (2024-2026), para que a
-- comparação multi-ano da Gestão fique coerente. Se alguma delas passou a ser
-- obrigatória só a partir de determinado ano, restringir com ano_letivo.
--
-- Declarativa e idempotente: reafirma o conjunto inteiro, então pode ser
-- reexecutada e serve como fonte da verdade do que é obrigatório.
--
-- IMPORTANTE: a sigla sai do padrão de nome "SIGLA ANO — Nome" via regex, e não
-- de split por espaço. "OBMEP MIRIM 2026 — ..." extrai "OBMEP MIRIM", não
-- "OBMEP" — a Mirim NÃO é obrigatória e não pode ser arrastada junto.
--
-- Depois desta migration, rodar a carga para propagar a classificação para a
-- camada de agregados:
--   node supabase/scripts/sync-olimpiada-stats.mjs --apply

update olimpiada
set classificacao = case
      when upper((regexp_match(nome, '^(.+?)\s+\d{4}\s*—'))[1])
           in ('OBMEP', 'OBF', 'CANGURU', 'OBA')
      then 'obrigatoria'::classificacao_olimpiada
      else 'facultativa'::classificacao_olimpiada
    end,
    updated_at = now()
where classificacao is distinct from (
  case
    when upper((regexp_match(nome, '^(.+?)\s+\d{4}\s*—'))[1])
         in ('OBMEP', 'OBF', 'CANGURU', 'OBA')
    then 'obrigatoria'::classificacao_olimpiada
    else 'facultativa'::classificacao_olimpiada
  end
);

-- ─── DOWN ────────────────────────────────────────────────────────────────────
-- Volta ao estado anterior: só OBMEP (todos os anos) e OBF 2026 obrigatórias.
--
-- update olimpiada
-- set classificacao = case
--       when nome like 'OBMEP 20%' then 'obrigatoria'::classificacao_olimpiada
--       when nome like 'OBF 2026%' then 'obrigatoria'::classificacao_olimpiada
--       else 'facultativa'::classificacao_olimpiada
--     end,
--     updated_at = now();
