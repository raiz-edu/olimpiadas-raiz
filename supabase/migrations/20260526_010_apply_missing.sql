-- =============================================================================
-- Migration: 010 — Aplica colunas e tabelas que ainda não existem no banco
-- Idempotente: usa IF NOT EXISTS / ADD COLUMN IF NOT EXISTS
-- =============================================================================

-- preparacao_projeto: colunas novas
ALTER TABLE preparacao_projeto
  ADD COLUMN IF NOT EXISTS olimpiada_id uuid REFERENCES olimpiada(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS publicado boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_prep_projeto_publicado ON preparacao_projeto (publicado) WHERE publicado = true;
CREATE INDEX IF NOT EXISTS idx_prep_projeto_sigla ON preparacao_projeto (olimpiada_sigla);
CREATE INDEX IF NOT EXISTS idx_prep_projeto_ano ON preparacao_projeto (ano_letivo);

-- preparacao_aula: coluna publicada
ALTER TABLE preparacao_aula
  ADD COLUMN IF NOT EXISTS publicada boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_prep_aula_publicada ON preparacao_aula (publicada) WHERE publicada = true;
CREATE INDEX IF NOT EXISTS idx_prep_aula_data ON preparacao_aula (data_hora) WHERE data_hora IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prep_material_aula ON preparacao_material (aula_id);

-- aluno: email + supabase_auth_id
ALTER TABLE aluno
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS supabase_auth_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS consentimento_responsavel_tipo text
    CHECK (consentimento_responsavel_tipo IN ('pedagogico', 'financeiro'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_aluno_email
  ON aluno (email) WHERE email IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_aluno_supabase_auth_id
  ON aluno (supabase_auth_id) WHERE supabase_auth_id IS NOT NULL;

-- aluno_progresso
CREATE TABLE IF NOT EXISTS aluno_progresso (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id            uuid        NOT NULL REFERENCES aluno(id)           ON DELETE CASCADE,
  aula_id             uuid        NOT NULL REFERENCES preparacao_aula(id) ON DELETE CASCADE,
  assistido           boolean     NOT NULL DEFAULT false,
  progresso_segundos  int         NOT NULL DEFAULT 0,
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (aluno_id, aula_id)
);

CREATE INDEX IF NOT EXISTS idx_progresso_aluno ON aluno_progresso (aluno_id);
CREATE INDEX IF NOT EXISTS idx_progresso_aula  ON aluno_progresso (aula_id);

-- Função helper para RLS
CREATE OR REPLACE FUNCTION current_aluno_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id FROM aluno
  WHERE supabase_auth_id = (SELECT auth.uid())
  LIMIT 1;
$$;

-- RLS: preparacao_projeto
ALTER TABLE preparacao_projeto ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_full_projeto" ON preparacao_projeto;
CREATE POLICY "staff_full_projeto" ON preparacao_projeto
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM usuario WHERE id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM usuario WHERE id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "aluno_read_projeto" ON preparacao_projeto;
CREATE POLICY "aluno_read_projeto" ON preparacao_projeto
  FOR SELECT TO authenticated
  USING (publicado = true AND (SELECT current_aluno_id()) IS NOT NULL);

-- RLS: preparacao_aula
ALTER TABLE preparacao_aula ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_full_aula" ON preparacao_aula;
CREATE POLICY "staff_full_aula" ON preparacao_aula
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM usuario WHERE id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM usuario WHERE id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "aluno_read_aula" ON preparacao_aula;
CREATE POLICY "aluno_read_aula" ON preparacao_aula
  FOR SELECT TO authenticated
  USING (publicada = true AND (SELECT current_aluno_id()) IS NOT NULL);

-- RLS: preparacao_material
ALTER TABLE preparacao_material ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_full_material" ON preparacao_material;
CREATE POLICY "staff_full_material" ON preparacao_material
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM usuario WHERE id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM usuario WHERE id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "aluno_read_material" ON preparacao_material;
CREATE POLICY "aluno_read_material" ON preparacao_material
  FOR SELECT TO authenticated
  USING (
    (SELECT current_aluno_id()) IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM preparacao_aula pa
      WHERE pa.id = aula_id AND pa.publicada = true
    )
  );

-- RLS: aluno_progresso
ALTER TABLE aluno_progresso ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "aluno_own_progresso" ON aluno_progresso;
CREATE POLICY "aluno_own_progresso" ON aluno_progresso
  FOR ALL TO authenticated
  USING  (aluno_id = (SELECT current_aluno_id()))
  WITH CHECK (aluno_id = (SELECT current_aluno_id()));

DROP POLICY IF EXISTS "staff_read_progresso" ON aluno_progresso;
CREATE POLICY "staff_read_progresso" ON aluno_progresso
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM usuario WHERE id = (SELECT auth.uid())));

-- RLS: meta_marca
ALTER TABLE meta_marca ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_full_meta" ON meta_marca;
CREATE POLICY "staff_full_meta" ON meta_marca
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM usuario WHERE id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM usuario WHERE id = (SELECT auth.uid())));
