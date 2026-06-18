ALTER TABLE olimpiada ADD COLUMN IF NOT EXISTS fases_pendentes boolean NOT NULL DEFAULT false;

-- Sinaliza as 3 olimpíadas com dados de fases incompletos ou não confirmados
UPDATE olimpiada SET fases_pendentes = true
WHERE id IN (
  '182efb82-6766-4b3a-936e-73d19c936e18', -- OBM 2026
  '85ba7a62-7064-4c50-92a1-e4c85968b193', -- OBL 2026
  '98f037f5-b93c-4144-874c-359d7d86488b'  -- OBSMA 2026
);
