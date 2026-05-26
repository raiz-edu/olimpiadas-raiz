-- =============================================================================
-- Migration 011 — Aluno: sync olimpíadas
-- Permite inserção de alunos sem turma (sync TOTVS para portal olímpico).
-- Adiciona marca_id e serie para rastrear origem e série do aluno.
-- =============================================================================
-- DOWN:
--   ALTER TABLE aluno ALTER COLUMN turma_id SET NOT NULL;
--   ALTER TABLE aluno DROP COLUMN IF EXISTS marca_id;
--   ALTER TABLE aluno DROP COLUMN IF EXISTS serie;
--   DROP INDEX IF EXISTS idx_aluno_marca_id;
--   DROP INDEX IF EXISTS idx_aluno_serie;
-- =============================================================================

-- turma_id opcional: alunos sincronizados do TOTVS para o portal olímpico
-- não precisam necessariamente ter turma mapeada no sistema de gestão.
ALTER TABLE aluno ALTER COLUMN turma_id DROP NOT NULL;

-- Marca de origem (mapeada via slug durante sync)
ALTER TABLE aluno ADD COLUMN IF NOT EXISTS marca_id uuid REFERENCES marca(id);

-- Série/ano do aluno conforme TOTVS (ex: "5EF1", "1EM", "9EF2")
ALTER TABLE aluno ADD COLUMN IF NOT EXISTS serie text;

-- RA do aluno no TOTVS (chave de deduplicação alternativa ao CPF)
ALTER TABLE aluno ADD COLUMN IF NOT EXISTS ra_totvs text;

-- CODCOLIGADA de origem no TOTVS
ALTER TABLE aluno ADD COLUMN IF NOT EXISTS codcoligada_totvs integer;

-- Índices para performance de sync e filtros
CREATE INDEX IF NOT EXISTS idx_aluno_marca_id
  ON aluno (marca_id)
  WHERE marca_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_aluno_serie
  ON aluno (serie)
  WHERE serie IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_aluno_ra_totvs
  ON aluno (ra_totvs, codcoligada_totvs)
  WHERE ra_totvs IS NOT NULL;

-- Índice composto para deduplicação durante sync
CREATE UNIQUE INDEX IF NOT EXISTS idx_aluno_ra_coligada_unique
  ON aluno (ra_totvs, codcoligada_totvs)
  WHERE ra_totvs IS NOT NULL AND codcoligada_totvs IS NOT NULL;
