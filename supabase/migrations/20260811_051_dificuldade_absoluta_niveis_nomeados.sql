-- 051 — dificuldade_absoluta: ensinar os níveis NOMEADOS à função.
--
-- PROBLEMA. `dificuldade_absoluta_calc` (migration 040) traduz a dificuldade
-- CONTEXTUAL para a régua universal usando a banda de público-alvo do nível.
-- O `CASE p_nivel` só conhecia P/E/B/C/J/S e nivel_1..nivel_3 — todo o resto
-- caía no `ELSE 2`. Duas origens usam nomes fora dessa lista:
--
--   mandacaru  cajuina, luiz_gonzaga, zumbi, lampiao   (158 questões)
--   omerj      junior, nivel_4                         ( 24 questões)
--
-- Consequência medida no banco: os 4 níveis da Mandacaru saíam com distribuição
-- de dificuldade_absoluta IDÊNTICA — uma questão da Cajuína (4º-5º ano) e uma
-- da Lampião (Ensino Médio) com a mesma dificuldade contextual recebiam o mesmo
-- valor absoluto. É exatamente o que a coluna existe para evitar. Passou
-- despercebido porque o `ELSE 2` é, por acaso, a banda correta da Luiz Gonzaga.
--
-- BANDAS. Alinhadas a `lib/questoes/series.ts`, fonte de verdade do mapeamento
-- série -> (olimpiada, nivel):
--
--   cajuina       4º-5º ano   = mesma faixa de obmep_mirim/mirim  -> 0
--   omerj junior  5º ano      = entre mirim (0) e canguru E (1)   -> 1
--   luiz_gonzaga  6º-7º ano   = mesma faixa de obmep/nivel_1      -> 2
--   zumbi         8º-9º ano   = mesma faixa de obmep/nivel_2      -> 3
--   lampiao       EM (1ª-3ª)  = mesma faixa de obmep/nivel_3      -> 4
--   omerj nivel_4 3ª série EM = mesma faixa de canguru S          -> 5
--
-- omerj nivel_1/2/3 já caíam nos casos genéricos e conferem com series.ts.
--
-- ORDEM DOS COMANDOS (importa). A coluna gerada DEPENDE da função, então a
-- dependência é desfeita ANTES de substituí-la:
--     DROP INDEX -> DROP COLUMN -> CREATE OR REPLACE FUNCTION -> ADD -> INDEX
-- Esta é a ordem que foi de fato executada em produção em 11/08/2026. A versão
-- original deste arquivo trazia o CREATE OR REPLACE primeiro e nunca chegou a
-- rodar; o arquivo passa a refletir o que o banco recebeu.
--
-- RECÁLCULO. `GENERATED ... STORED` não recalcula ao trocar a função — por isso
-- a coluna é derrubada e recriada. Nada além das duas páginas de leitura
-- (Raio-X e Analytics) depende dela: sem view, policy ou FK.
--
-- Corpo da função delimitado por $fn$ (e não $$) para sobreviver a editor que
-- fatia o script por ponto-e-vírgula.
-- =============================================================================

-- 1) desfaz a dependência antes de trocar a função
DROP INDEX IF EXISTS idx_questao_dificuldade_absoluta;
ALTER TABLE questao DROP COLUMN IF EXISTS dificuldade_absoluta;

-- 2) função com os níveis nomeados
CREATE OR REPLACE FUNCTION dificuldade_absoluta_calc(
  p_olimpiada text,
  p_nivel     text,
  p_dificuldade text
) RETURNS text
LANGUAGE sql
IMMUTABLE
AS $fn$
  SELECT CASE
    WHEN p_dificuldade IS NULL THEN NULL
    ELSE (ARRAY['elementar','facil','medio','dificil','muito_dificil'])[
      LEAST(4, GREATEST(0,
        FLOOR(
          -- banda de público (0 = mais novo … 5 = 3ª série EM)
          0.5 * (CASE p_nivel
                   WHEN 'P' THEN 0 WHEN 'mirim' THEN 0
                   WHEN 'cajuina' THEN 0                       -- Mandacaru 4º-5º
                   WHEN 'E' THEN 1
                   WHEN 'junior' THEN 1                        -- OMERJ 5º
                   WHEN 'nivel_1' THEN 2 WHEN 'B' THEN 2
                   WHEN 'luiz_gonzaga' THEN 2                  -- Mandacaru 6º-7º
                   WHEN 'nivel_2' THEN 3 WHEN 'C' THEN 3
                   WHEN 'zumbi' THEN 3                         -- Mandacaru 8º-9º
                   WHEN 'nivel_3' THEN 4 WHEN 'J' THEN 4
                   WHEN 'lampiao' THEN 4                       -- Mandacaru EM
                   WHEN 'S' THEN 5
                   WHEN 'nivel_4' THEN 5                       -- OMERJ 3ª série EM
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
$fn$;

-- 3) recria a coluna (recalcula todas as linhas) e o índice
ALTER TABLE questao
  ADD COLUMN dificuldade_absoluta text
  GENERATED ALWAYS AS (dificuldade_absoluta_calc(olimpiada::text, nivel, dificuldade)) STORED;

CREATE INDEX idx_questao_dificuldade_absoluta ON questao (dificuldade_absoluta);

COMMENT ON COLUMN questao.dificuldade_absoluta IS
  'Dificuldade ABSOLUTA (intrínseca), derivada de (nivel, dificuldade) por mapa determinístico v1 (coluna gerada). Bandas de nível alinhadas a lib/questoes/series.ts. v2 futura = empírica/IRT.';

-- Conferência (a Cajuína deve ficar MAIS FÁCIL que a Lampião na régua absoluta):
-- select nivel, dificuldade_absoluta, count(*)
--   from questao where olimpiada='mandacaru'
--  group by 1,2 order by 1,2;
--   cajuina  facil 26 · medio 14      |  zumbi    medio 10 · dificil 26 · muito_dificil 2
--   lg       medio 26 · dificil 14    |  lampiao  dificil 26 · muito_dificil 14


-- =============================================================================
-- DOWN — volta ao mapa da migration 040 (sem os níveis nomeados).
-- Mesma ordem: derruba a coluna, restaura a função, recria a coluna.
-- Reverte o VALOR das 182 questões de mandacaru/omerj-junior/omerj-nivel_4;
-- as demais origens não são afetadas nem na ida nem na volta.
-- =============================================================================
--
-- DROP INDEX IF EXISTS idx_questao_dificuldade_absoluta;
-- ALTER TABLE questao DROP COLUMN IF EXISTS dificuldade_absoluta;
--
-- CREATE OR REPLACE FUNCTION dificuldade_absoluta_calc(
--   p_olimpiada text, p_nivel text, p_dificuldade text
-- ) RETURNS text LANGUAGE sql IMMUTABLE AS $fn$
--   SELECT CASE
--     WHEN p_dificuldade IS NULL THEN NULL
--     ELSE (ARRAY['elementar','facil','medio','dificil','muito_dificil'])[
--       LEAST(4, GREATEST(0,
--         FLOOR(
--           0.5 * (CASE p_nivel
--                    WHEN 'P' THEN 0 WHEN 'mirim' THEN 0
--                    WHEN 'E' THEN 1
--                    WHEN 'nivel_1' THEN 2 WHEN 'B' THEN 2
--                    WHEN 'nivel_2' THEN 3 WHEN 'C' THEN 3
--                    WHEN 'nivel_3' THEN 4 WHEN 'J' THEN 4
--                    WHEN 'S' THEN 5
--                    ELSE 2 END)
--           + 0.55 * (CASE p_dificuldade
--                       WHEN 'elementar' THEN 0 WHEN 'facil' THEN 1
--                       WHEN 'medio' THEN 2 WHEN 'dificil' THEN 3
--                       WHEN 'muito_dificil' THEN 4 ELSE 2 END)
--           + 0.5
--         )::int
--       )) + 1
--     ]
--   END
-- $fn$;
--
-- ALTER TABLE questao
--   ADD COLUMN dificuldade_absoluta text
--   GENERATED ALWAYS AS (dificuldade_absoluta_calc(olimpiada::text, nivel, dificuldade)) STORED;
--
-- CREATE INDEX idx_questao_dificuldade_absoluta ON questao (dificuldade_absoluta);
