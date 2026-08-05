-- =============================================================================
-- Migration: 048 — Apostilas Fase 2 (issue #141): registro de aplicações.
-- Onde cada geração de apostila foi aplicada (marca, unidade e/ou turma).
-- Base do "não repetir questões já usadas": aplicação -> geração ->
-- apostila_questao dá as questões que aquele público já recebeu.
-- Acesso: RLS sem policies (service_role/adminClient), padrão do módulo.
-- =============================================================================

CREATE TABLE apostila_aplicacao (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  geracao_id  uuid        NOT NULL REFERENCES apostila_geracao(id) ON DELETE CASCADE,
  marca_id    uuid        REFERENCES marca(id),
  unidade_id  uuid        REFERENCES unidade(id),
  turma_id    uuid        REFERENCES turma(id),
  aplicado_em date        NOT NULL DEFAULT CURRENT_DATE,
  observacao  text,
  criado_por  uuid        REFERENCES usuario(id),
  criado_em   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT apostila_aplicacao_alvo CHECK (
    marca_id IS NOT NULL OR unidade_id IS NOT NULL OR turma_id IS NOT NULL
  )
);

CREATE INDEX idx_apostila_aplicacao_geracao ON apostila_aplicacao(geracao_id);
CREATE INDEX idx_apostila_aplicacao_marca   ON apostila_aplicacao(marca_id);
CREATE INDEX idx_apostila_aplicacao_unidade ON apostila_aplicacao(unidade_id);
CREATE INDEX idx_apostila_aplicacao_turma   ON apostila_aplicacao(turma_id);

ALTER TABLE apostila_aplicacao ENABLE ROW LEVEL SECURITY;

-- Down:
--   DROP TABLE apostila_aplicacao;
