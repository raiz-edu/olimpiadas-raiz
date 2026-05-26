-- =============================================================================
-- Migration: 008 — Metas por marca
-- Referenciada no código de analytics/metas mas sem migration até agora.
-- =============================================================================
-- DOWN: DROP TABLE meta_marca;
-- =============================================================================

CREATE TABLE meta_marca (
  id          uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  marca_id    uuid  NOT NULL REFERENCES marca(id) ON DELETE CASCADE,
  ano_letivo  int   NOT NULL,
  tipo        text  NOT NULL CHECK (tipo IN ('inscricoes', 'participantes', 'premiados', 'vendas')),
  valor       int   NOT NULL DEFAULT 0,
  UNIQUE (marca_id, ano_letivo, tipo)
);

CREATE INDEX idx_meta_marca_lookup ON meta_marca (marca_id, ano_letivo);

ALTER TABLE meta_marca ENABLE ROW LEVEL SECURITY;

-- Apenas staff autenticado pode ler e escrever metas
CREATE POLICY "staff_full_meta" ON meta_marca
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM usuario WHERE id = (SELECT auth.uid()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM usuario WHERE id = (SELECT auth.uid()))
  );
