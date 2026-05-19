-- =============================================================================
-- Migration: 002 — RLS Policies + Helper Functions
-- Sistema de Gestão de Olimpíadas do Conhecimento — Raiz Educação
-- =============================================================================
-- Princípio: toda tabela tenant-scoped tem RLS habilitado.
-- Funções helper resolvem permissões por role sem expor dados de outras marcas.
-- Ref: ADR-0002, SPEC §3.3
-- DOWN: supabase/migrations/20260519_002_rls_policies_down.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- HELPER FUNCTIONS (SECURITY DEFINER — executam com permissão do dono)
-- ---------------------------------------------------------------------------

-- Retorna UUIDs das marcas acessíveis pelo usuário atual
-- Usa (SELECT auth.uid()) como initPlan para evitar avaliação por-row
CREATE OR REPLACE FUNCTION user_marca_ids()
RETURNS uuid[]
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN (SELECT role FROM usuario WHERE id = (SELECT auth.uid())) = 'admin_rede'
      THEN ARRAY(SELECT id FROM marca)
    WHEN (SELECT role FROM usuario WHERE id = (SELECT auth.uid())) = 'coord_marca'
      THEN ARRAY(SELECT marca_id FROM usuario_marca WHERE usuario_id = (SELECT auth.uid()))
    WHEN (SELECT role FROM usuario WHERE id = (SELECT auth.uid())) = 'coord_unidade'
      THEN ARRAY(
        SELECT DISTINCT u.marca_id FROM usuario_unidade uu
        JOIN unidade u ON u.id = uu.unidade_id
        WHERE uu.usuario_id = (SELECT auth.uid())
      )
    WHEN (SELECT role FROM usuario WHERE id = (SELECT auth.uid())) = 'professor'
      THEN ARRAY(
        SELECT DISTINCT u.marca_id FROM usuario_turma ut
        JOIN turma t ON t.id = ut.turma_id
        JOIN unidade u ON u.id = t.unidade_id
        WHERE ut.usuario_id = (SELECT auth.uid())
      )
    ELSE ARRAY[]::uuid[]
  END
$$;

-- Retorna UUIDs das unidades acessíveis pelo usuário atual
CREATE OR REPLACE FUNCTION user_unidade_ids()
RETURNS uuid[]
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN (SELECT role FROM usuario WHERE id = (SELECT auth.uid())) = 'admin_rede'
      THEN ARRAY(SELECT id FROM unidade)
    WHEN (SELECT role FROM usuario WHERE id = (SELECT auth.uid())) = 'coord_marca'
      THEN ARRAY(
        SELECT id FROM unidade
        WHERE marca_id = ANY(user_marca_ids())
      )
    WHEN (SELECT role FROM usuario WHERE id = (SELECT auth.uid())) = 'coord_unidade'
      THEN ARRAY(SELECT unidade_id FROM usuario_unidade WHERE usuario_id = (SELECT auth.uid()))
    WHEN (SELECT role FROM usuario WHERE id = (SELECT auth.uid())) = 'professor'
      THEN ARRAY(
        SELECT DISTINCT t.unidade_id FROM usuario_turma ut
        JOIN turma t ON t.id = ut.turma_id
        WHERE ut.usuario_id = (SELECT auth.uid())
      )
    ELSE ARRAY[]::uuid[]
  END
$$;

-- Retorna UUIDs das turmas acessíveis pelo usuário atual
CREATE OR REPLACE FUNCTION user_turma_ids()
RETURNS uuid[]
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN (SELECT role FROM usuario WHERE id = (SELECT auth.uid())) IN ('admin_rede', 'coord_marca')
      THEN ARRAY(
        SELECT id FROM turma
        WHERE unidade_id = ANY(user_unidade_ids())
      )
    WHEN (SELECT role FROM usuario WHERE id = (SELECT auth.uid())) = 'coord_unidade'
      THEN ARRAY(
        SELECT id FROM turma
        WHERE unidade_id = ANY(user_unidade_ids())
      )
    WHEN (SELECT role FROM usuario WHERE id = (SELECT auth.uid())) = 'professor'
      THEN ARRAY(SELECT turma_id FROM usuario_turma WHERE usuario_id = (SELECT auth.uid()))
    ELSE ARRAY[]::uuid[]
  END
$$;

-- Retorna o role do usuário atual (evita JOIN repetido nas policies)
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS role_usuario
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM usuario WHERE id = (SELECT auth.uid())
$$;

-- ---------------------------------------------------------------------------
-- RLS: marca
-- ---------------------------------------------------------------------------

ALTER TABLE marca ENABLE ROW LEVEL SECURITY;

-- Todos os autenticados veem as marcas às quais têm acesso
CREATE POLICY marca_select ON marca
  FOR SELECT USING (id = ANY(user_marca_ids()));

-- Somente admin_rede pode criar/editar marcas
CREATE POLICY marca_insert ON marca
  FOR INSERT WITH CHECK (current_user_role() = 'admin_rede');

CREATE POLICY marca_update ON marca
  FOR UPDATE USING (current_user_role() = 'admin_rede')
  WITH CHECK (current_user_role() = 'admin_rede');

CREATE POLICY marca_delete ON marca
  FOR DELETE USING (current_user_role() = 'admin_rede');

-- ---------------------------------------------------------------------------
-- RLS: unidade
-- ---------------------------------------------------------------------------

ALTER TABLE unidade ENABLE ROW LEVEL SECURITY;

CREATE POLICY unidade_select ON unidade
  FOR SELECT USING (id = ANY(user_unidade_ids()));

CREATE POLICY unidade_insert ON unidade
  FOR INSERT WITH CHECK (
    current_user_role() IN ('admin_rede', 'coord_marca')
    AND marca_id = ANY(user_marca_ids())
  );

CREATE POLICY unidade_update ON unidade
  FOR UPDATE USING (
    current_user_role() IN ('admin_rede', 'coord_marca')
    AND marca_id = ANY(user_marca_ids())
  )
  WITH CHECK (
    current_user_role() IN ('admin_rede', 'coord_marca')
    AND marca_id = ANY(user_marca_ids())
  );

CREATE POLICY unidade_delete ON unidade
  FOR DELETE USING (
    current_user_role() IN ('admin_rede', 'coord_marca')
    AND marca_id = ANY(user_marca_ids())
  );

-- ---------------------------------------------------------------------------
-- RLS: turma
-- ---------------------------------------------------------------------------

ALTER TABLE turma ENABLE ROW LEVEL SECURITY;

CREATE POLICY turma_select ON turma
  FOR SELECT USING (id = ANY(user_turma_ids()));

CREATE POLICY turma_insert ON turma
  FOR INSERT WITH CHECK (
    current_user_role() IN ('admin_rede', 'coord_marca', 'coord_unidade')
    AND unidade_id = ANY(user_unidade_ids())
  );

CREATE POLICY turma_update ON turma
  FOR UPDATE USING (
    current_user_role() IN ('admin_rede', 'coord_marca', 'coord_unidade')
    AND unidade_id = ANY(user_unidade_ids())
  )
  WITH CHECK (
    current_user_role() IN ('admin_rede', 'coord_marca', 'coord_unidade')
    AND unidade_id = ANY(user_unidade_ids())
  );

CREATE POLICY turma_delete ON turma
  FOR DELETE USING (
    current_user_role() IN ('admin_rede', 'coord_marca', 'coord_unidade')
    AND unidade_id = ANY(user_unidade_ids())
  );

-- ---------------------------------------------------------------------------
-- RLS: aluno
-- ---------------------------------------------------------------------------

ALTER TABLE aluno ENABLE ROW LEVEL SECURITY;

CREATE POLICY aluno_select ON aluno
  FOR SELECT USING (turma_id = ANY(user_turma_ids()));

CREATE POLICY aluno_insert ON aluno
  FOR INSERT WITH CHECK (
    current_user_role() IN ('admin_rede', 'coord_marca', 'coord_unidade', 'professor')
    AND turma_id = ANY(user_turma_ids())
  );

CREATE POLICY aluno_update ON aluno
  FOR UPDATE USING (
    current_user_role() IN ('admin_rede', 'coord_marca', 'coord_unidade', 'professor')
    AND turma_id = ANY(user_turma_ids())
  )
  WITH CHECK (
    current_user_role() IN ('admin_rede', 'coord_marca', 'coord_unidade', 'professor')
    AND turma_id = ANY(user_turma_ids())
  );

CREATE POLICY aluno_delete ON aluno
  FOR DELETE USING (
    current_user_role() IN ('admin_rede', 'coord_marca', 'coord_unidade')
    AND turma_id = ANY(user_turma_ids())
  );

-- ---------------------------------------------------------------------------
-- RLS: usuario (perfil próprio + gestão por admin/coord)
-- ---------------------------------------------------------------------------

ALTER TABLE usuario ENABLE ROW LEVEL SECURITY;

-- Usuário vê o próprio perfil
CREATE POLICY usuario_select_self ON usuario
  FOR SELECT USING (id = (SELECT auth.uid()));

-- admin_rede vê todos; coord_marca vê usuários das suas marcas
CREATE POLICY usuario_select_admin ON usuario
  FOR SELECT USING (
    current_user_role() = 'admin_rede'
    OR (
      current_user_role() = 'coord_marca'
      AND id IN (
        SELECT usuario_id FROM usuario_marca
        WHERE marca_id = ANY(user_marca_ids())
      )
    )
  );

CREATE POLICY usuario_insert ON usuario
  FOR INSERT WITH CHECK (
    current_user_role() IN ('admin_rede', 'coord_marca')
  );

CREATE POLICY usuario_update_self ON usuario
  FOR UPDATE USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY usuario_update_admin ON usuario
  FOR UPDATE USING (current_user_role() = 'admin_rede')
  WITH CHECK (current_user_role() = 'admin_rede');

-- ---------------------------------------------------------------------------
-- RLS: usuario_marca / usuario_unidade / usuario_turma
-- ---------------------------------------------------------------------------

ALTER TABLE usuario_marca    ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_unidade  ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_turma    ENABLE ROW LEVEL SECURITY;

CREATE POLICY usuario_marca_select ON usuario_marca
  FOR SELECT USING (
    usuario_id = (SELECT auth.uid())
    OR current_user_role() IN ('admin_rede', 'coord_marca')
  );

CREATE POLICY usuario_marca_write ON usuario_marca
  FOR ALL USING (current_user_role() IN ('admin_rede', 'coord_marca'));

CREATE POLICY usuario_unidade_select ON usuario_unidade
  FOR SELECT USING (
    usuario_id = (SELECT auth.uid())
    OR current_user_role() IN ('admin_rede', 'coord_marca', 'coord_unidade')
  );

CREATE POLICY usuario_unidade_write ON usuario_unidade
  FOR ALL USING (
    current_user_role() IN ('admin_rede', 'coord_marca', 'coord_unidade')
  );

CREATE POLICY usuario_turma_select ON usuario_turma
  FOR SELECT USING (
    usuario_id = (SELECT auth.uid())
    OR current_user_role() IN ('admin_rede', 'coord_marca', 'coord_unidade')
  );

CREATE POLICY usuario_turma_write ON usuario_turma
  FOR ALL USING (
    current_user_role() IN ('admin_rede', 'coord_marca', 'coord_unidade')
  );

-- ---------------------------------------------------------------------------
-- RLS: convite
-- ---------------------------------------------------------------------------

ALTER TABLE convite ENABLE ROW LEVEL SECURITY;

CREATE POLICY convite_select ON convite
  FOR SELECT USING (
    criado_por = (SELECT auth.uid())
    OR current_user_role() = 'admin_rede'
    OR (
      current_user_role() = 'coord_marca'
      AND marca_id = ANY(user_marca_ids())
    )
  );

CREATE POLICY convite_insert ON convite
  FOR INSERT WITH CHECK (
    current_user_role() IN ('admin_rede', 'coord_marca')
  );

CREATE POLICY convite_update ON convite
  FOR UPDATE USING (
    criado_por = (SELECT auth.uid())
    OR current_user_role() = 'admin_rede'
  );

-- ---------------------------------------------------------------------------
-- RLS: olimpiada
-- ---------------------------------------------------------------------------

ALTER TABLE olimpiada ENABLE ROW LEVEL SECURITY;

-- Leitura: apenas olimpíadas das marcas do usuário
CREATE POLICY olimpiada_select ON olimpiada
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM olimpiada_marca om
      WHERE om.olimpiada_id = olimpiada.id
        AND om.marca_id = ANY(user_marca_ids())
    )
  );

-- Escrita: admin_rede e coord_marca
CREATE POLICY olimpiada_insert ON olimpiada
  FOR INSERT WITH CHECK (
    current_user_role() IN ('admin_rede', 'coord_marca')
  );

CREATE POLICY olimpiada_update ON olimpiada
  FOR UPDATE USING (
    current_user_role() IN ('admin_rede', 'coord_marca')
    AND EXISTS (
      SELECT 1 FROM olimpiada_marca om
      WHERE om.olimpiada_id = olimpiada.id
        AND om.marca_id = ANY(user_marca_ids())
    )
  )
  WITH CHECK (
    current_user_role() IN ('admin_rede', 'coord_marca')
  );

CREATE POLICY olimpiada_delete ON olimpiada
  FOR DELETE USING (
    current_user_role() = 'admin_rede'
  );

-- ---------------------------------------------------------------------------
-- RLS: olimpiada_marca
-- ---------------------------------------------------------------------------

ALTER TABLE olimpiada_marca ENABLE ROW LEVEL SECURITY;

CREATE POLICY olimpiada_marca_select ON olimpiada_marca
  FOR SELECT USING (marca_id = ANY(user_marca_ids()));

CREATE POLICY olimpiada_marca_write ON olimpiada_marca
  FOR ALL USING (
    current_user_role() IN ('admin_rede', 'coord_marca')
    AND marca_id = ANY(user_marca_ids())
  );

-- ---------------------------------------------------------------------------
-- RLS: olimpiada_fase
-- ---------------------------------------------------------------------------

ALTER TABLE olimpiada_fase ENABLE ROW LEVEL SECURITY;

CREATE POLICY fase_select ON olimpiada_fase
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM olimpiada_marca om
      WHERE om.olimpiada_id = olimpiada_fase.olimpiada_id
        AND om.marca_id = ANY(user_marca_ids())
    )
  );

CREATE POLICY fase_write ON olimpiada_fase
  FOR ALL USING (
    current_user_role() IN ('admin_rede', 'coord_marca')
    AND EXISTS (
      SELECT 1 FROM olimpiada_marca om
      WHERE om.olimpiada_id = olimpiada_fase.olimpiada_id
        AND om.marca_id = ANY(user_marca_ids())
    )
  );

-- ---------------------------------------------------------------------------
-- RLS: inscricao
-- ---------------------------------------------------------------------------

ALTER TABLE inscricao ENABLE ROW LEVEL SECURITY;

-- Leitura: quem tem acesso ao aluno (via turma_ids) OU à olimpíada (via marcas)
CREATE POLICY inscricao_select ON inscricao
  FOR SELECT USING (
    aluno_id IN (SELECT id FROM aluno WHERE turma_id = ANY(user_turma_ids()))
  );

-- Escrita: todos os roles autenticados, mas apenas para alunos acessíveis
CREATE POLICY inscricao_insert ON inscricao
  FOR INSERT WITH CHECK (
    aluno_id IN (SELECT id FROM aluno WHERE turma_id = ANY(user_turma_ids()))
  );

CREATE POLICY inscricao_update ON inscricao
  FOR UPDATE USING (
    current_user_role() IN ('admin_rede', 'coord_marca', 'coord_unidade')
    AND aluno_id IN (SELECT id FROM aluno WHERE turma_id = ANY(user_turma_ids()))
  )
  WITH CHECK (
    aluno_id IN (SELECT id FROM aluno WHERE turma_id = ANY(user_turma_ids()))
  );

CREATE POLICY inscricao_delete ON inscricao
  FOR DELETE USING (
    current_user_role() IN ('admin_rede', 'coord_marca')
  );

-- ---------------------------------------------------------------------------
-- RLS: resultado
-- ---------------------------------------------------------------------------

ALTER TABLE resultado ENABLE ROW LEVEL SECURITY;

CREATE POLICY resultado_select ON resultado
  FOR SELECT USING (
    inscricao_id IN (
      SELECT id FROM inscricao
      WHERE aluno_id IN (SELECT id FROM aluno WHERE turma_id = ANY(user_turma_ids()))
    )
  );

CREATE POLICY resultado_insert ON resultado
  FOR INSERT WITH CHECK (
    current_user_role() IN ('admin_rede', 'coord_marca', 'coord_unidade')
    AND inscricao_id IN (
      SELECT id FROM inscricao
      WHERE aluno_id IN (SELECT id FROM aluno WHERE turma_id = ANY(user_turma_ids()))
    )
  );

CREATE POLICY resultado_update ON resultado
  FOR UPDATE USING (
    current_user_role() IN ('admin_rede', 'coord_marca', 'coord_unidade')
    AND inscricao_id IN (
      SELECT id FROM inscricao
      WHERE aluno_id IN (SELECT id FROM aluno WHERE turma_id = ANY(user_turma_ids()))
    )
  )
  WITH CHECK (
    inscricao_id IN (
      SELECT id FROM inscricao
      WHERE aluno_id IN (SELECT id FROM aluno WHERE turma_id = ANY(user_turma_ids()))
    )
  );

CREATE POLICY resultado_delete ON resultado
  FOR DELETE USING (current_user_role() = 'admin_rede');

-- ---------------------------------------------------------------------------
-- RLS: audit_log (somente leitura para admins)
-- ---------------------------------------------------------------------------

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_select ON audit_log
  FOR SELECT USING (current_user_role() = 'admin_rede');

CREATE POLICY audit_insert ON audit_log
  FOR INSERT WITH CHECK (true);  -- triggers internos sempre podem inserir
