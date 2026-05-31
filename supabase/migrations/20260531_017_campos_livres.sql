-- Migration: 017 — Olimpíada e Fase como campos livres
-- Antes: olimpiada era enum (obmep_mirim|obmep), fase só aceitava 1 ou 2
-- Agora: ambos aceitam qualquer valor (text e int > 0)
--
-- DOWN:
--   CREATE TYPE olimpiada_questao AS ENUM ('obmep_mirim','obmep');
--   ALTER TABLE questao ALTER COLUMN olimpiada TYPE olimpiada_questao
--     USING olimpiada::olimpiada_questao;
--   ALTER TABLE questao DROP CONSTRAINT IF EXISTS questao_fase_positivo;
--   ALTER TABLE questao ADD CONSTRAINT questao_fase_check CHECK (fase IN (1,2));

ALTER TABLE questao ALTER COLUMN olimpiada TYPE text;
DROP TYPE IF EXISTS olimpiada_questao;

ALTER TABLE questao DROP CONSTRAINT IF EXISTS questao_fase_check;
ALTER TABLE questao ADD CONSTRAINT questao_fase_positivo CHECK (fase > 0);
