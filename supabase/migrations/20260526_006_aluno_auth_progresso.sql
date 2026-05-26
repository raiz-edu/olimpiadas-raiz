-- =============================================================================
-- Migration: 006 — Vínculo aluno ↔ Supabase Auth + progresso
-- Adiciona email próprio do aluno e link para auth.users.
-- Cria tabela de progresso por aula.
-- =============================================================================
-- DOWN:
--   DROP TABLE aluno_progresso;
--   ALTER TABLE aluno DROP COLUMN supabase_auth_id, DROP COLUMN email;
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Adicionar email e supabase_auth_id à tabela aluno existente
-- ---------------------------------------------------------------------------

ALTER TABLE aluno
  ADD COLUMN email           text,
  ADD COLUMN supabase_auth_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX idx_aluno_email
  ON aluno (email) WHERE email IS NOT NULL;

CREATE UNIQUE INDEX idx_aluno_supabase_auth_id
  ON aluno (supabase_auth_id) WHERE supabase_auth_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Progresso do aluno por aula
-- ---------------------------------------------------------------------------

CREATE TABLE aluno_progresso (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id            uuid        NOT NULL REFERENCES aluno(id)           ON DELETE CASCADE,
  aula_id             uuid        NOT NULL REFERENCES preparacao_aula(id) ON DELETE CASCADE,
  assistido           boolean     NOT NULL DEFAULT false,
  progresso_segundos  int         NOT NULL DEFAULT 0,
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (aluno_id, aula_id)
);

CREATE INDEX idx_progresso_aluno ON aluno_progresso (aluno_id);
CREATE INDEX idx_progresso_aula  ON aluno_progresso (aula_id);
