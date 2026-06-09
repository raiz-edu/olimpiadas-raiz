-- Migration 028 — suporte a respostas abertas em resposta_aluno
-- DOWN: ALTER TABLE resposta_aluno DROP COLUMN IF EXISTS resposta_texto, DROP COLUMN IF EXISTS feedback_ia;

ALTER TABLE resposta_aluno
  ADD COLUMN IF NOT EXISTS resposta_texto text,
  ADD COLUMN IF NOT EXISTS feedback_ia    jsonb;
