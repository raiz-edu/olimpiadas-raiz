-- =============================================================================
-- Migration: 007 — RLS para portal do aluno
-- Alunos autenticados acessam apenas conteúdo publicado.
-- Admins (tabela usuario) mantêm acesso irrestrito.
-- =============================================================================
-- DOWN: DROP FUNCTION current_aluno_id();
--       DROP POLICY ... (cada policy individualmente)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Função helper: resolve o aluno_id a partir do auth.uid() atual
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION current_aluno_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id FROM aluno
  WHERE supabase_auth_id = (SELECT auth.uid())
  LIMIT 1;
$$;

-- ---------------------------------------------------------------------------
-- RLS: preparacao_projeto
-- ---------------------------------------------------------------------------

ALTER TABLE preparacao_projeto ENABLE ROW LEVEL SECURITY;

-- Staff (usuario) tem acesso irrestrito
CREATE POLICY "staff_full_projeto" ON preparacao_projeto
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM usuario WHERE id = (SELECT auth.uid()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM usuario WHERE id = (SELECT auth.uid()))
  );

-- Aluno lê apenas projetos publicados
CREATE POLICY "aluno_read_projeto" ON preparacao_projeto
  FOR SELECT TO authenticated
  USING (
    publicado = true
    AND (SELECT current_aluno_id()) IS NOT NULL
  );

-- ---------------------------------------------------------------------------
-- RLS: preparacao_aula
-- ---------------------------------------------------------------------------

ALTER TABLE preparacao_aula ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_full_aula" ON preparacao_aula
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM usuario WHERE id = (SELECT auth.uid()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM usuario WHERE id = (SELECT auth.uid()))
  );

CREATE POLICY "aluno_read_aula" ON preparacao_aula
  FOR SELECT TO authenticated
  USING (
    publicada = true
    AND (SELECT current_aluno_id()) IS NOT NULL
  );

-- ---------------------------------------------------------------------------
-- RLS: preparacao_material
-- ---------------------------------------------------------------------------

ALTER TABLE preparacao_material ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_full_material" ON preparacao_material
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM usuario WHERE id = (SELECT auth.uid()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM usuario WHERE id = (SELECT auth.uid()))
  );

CREATE POLICY "aluno_read_material" ON preparacao_material
  FOR SELECT TO authenticated
  USING (
    (SELECT current_aluno_id()) IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM preparacao_aula pa
      WHERE pa.id = aula_id AND pa.publicada = true
    )
  );

-- ---------------------------------------------------------------------------
-- RLS: aluno_progresso
-- ---------------------------------------------------------------------------

ALTER TABLE aluno_progresso ENABLE ROW LEVEL SECURITY;

-- Aluno lê/escreve apenas o próprio progresso
CREATE POLICY "aluno_own_progresso" ON aluno_progresso
  FOR ALL TO authenticated
  USING  (aluno_id = (SELECT current_aluno_id()))
  WITH CHECK (aluno_id = (SELECT current_aluno_id()));

-- Staff pode ler o progresso de todos os alunos
CREATE POLICY "staff_read_progresso" ON aluno_progresso
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM usuario WHERE id = (SELECT auth.uid()))
  );

-- ---------------------------------------------------------------------------
-- Índices de suporte às policies (RLS rule: index every policy column)
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_prep_projeto_publicado_rls
  ON preparacao_projeto (publicado);

CREATE INDEX IF NOT EXISTS idx_prep_aula_publicada_rls
  ON preparacao_aula (publicada);

CREATE INDEX IF NOT EXISTS idx_progresso_aluno_rls
  ON aluno_progresso (aluno_id);
