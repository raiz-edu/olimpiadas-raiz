-- Migration: 019 — Vínculo entre aula de preparação e questão do banco
-- DOWN: DROP TABLE IF EXISTS preparacao_aula_questao;

CREATE TABLE preparacao_aula_questao (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aula_id    uuid NOT NULL REFERENCES preparacao_aula(id) ON DELETE CASCADE,
  questao_id uuid NOT NULL REFERENCES questao(id) ON DELETE CASCADE,
  ordem      int  NOT NULL DEFAULT 0,
  criado_em  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT aula_questao_unique UNIQUE (aula_id, questao_id)
);

CREATE INDEX idx_aula_questao_aula    ON preparacao_aula_questao(aula_id);
CREATE INDEX idx_aula_questao_questao ON preparacao_aula_questao(questao_id);

ALTER TABLE preparacao_aula_questao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_full_aula_questao" ON preparacao_aula_questao
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM usuario WHERE id = (SELECT auth.uid())));
