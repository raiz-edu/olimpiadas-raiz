-- 040 — Dificuldade ABSOLUTA (intrínseca) além da CONTEXTUAL (na prova).
--
-- A coluna `dificuldade` existente é CONTEXTUAL: mede o quão difícil a questão foi
-- DENTRO da própria prova e nível (posição/pontos). A mesma questão reusada entre
-- níveis pode ser "difícil" num nível e "fácil" noutro.
--
-- `dificuldade_absoluta` é INTRÍNSECA: numa régua universal, independente da prova.
-- v1 = mapa determinístico (banda de público-alvo do nível × dificuldade contextual).
-- Coluna GERADA (o Postgres recalcula sozinho quando olimpiada/nivel/dificuldade mudam)
-- — nunca sai de sincronia e não exige mexer no editor nem no pipeline de carga.
-- Quando houver dados de resposta de aluno, a v2 (empírica/IRT) substitui esta função.

CREATE OR REPLACE FUNCTION dificuldade_absoluta_calc(
  p_olimpiada text,
  p_nivel     text,
  p_dificuldade text
) RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_dificuldade IS NULL THEN NULL
    ELSE (ARRAY['elementar','facil','medio','dificil','muito_dificil'])[
      LEAST(4, GREATEST(0,
        FLOOR(
          -- banda de público (0 = mais novo … 5 = 3ª série EM)
          0.5 * (CASE p_nivel
                   WHEN 'P' THEN 0 WHEN 'mirim' THEN 0
                   WHEN 'E' THEN 1
                   WHEN 'nivel_1' THEN 2 WHEN 'B' THEN 2
                   WHEN 'nivel_2' THEN 3 WHEN 'C' THEN 3
                   WHEN 'nivel_3' THEN 4 WHEN 'J' THEN 4
                   WHEN 'S' THEN 5
                   ELSE 2 END)
          -- dificuldade contextual (0 = elementar … 4 = muito difícil)
          + 0.55 * (CASE p_dificuldade
                      WHEN 'elementar' THEN 0 WHEN 'facil' THEN 1
                      WHEN 'medio' THEN 2 WHEN 'dificil' THEN 3
                      WHEN 'muito_dificil' THEN 4 ELSE 2 END)
          + 0.5
        )::int
      )) + 1  -- ARRAY é 1-indexado
    ]
  END
$$;

ALTER TABLE questao
  ADD COLUMN IF NOT EXISTS dificuldade_absoluta text
  GENERATED ALWAYS AS (dificuldade_absoluta_calc(olimpiada::text, nivel, dificuldade)) STORED;

CREATE INDEX IF NOT EXISTS idx_questao_dificuldade_absoluta ON questao (dificuldade_absoluta);

COMMENT ON COLUMN questao.dificuldade IS
  'Dificuldade CONTEXTUAL: relativa à prova e ao nível (posição/pontos na prova).';
COMMENT ON COLUMN questao.dificuldade_absoluta IS
  'Dificuldade ABSOLUTA (intrínseca), derivada de (nivel, dificuldade) por mapa determinístico v1 (coluna gerada). v2 futura = empírica/IRT.';
