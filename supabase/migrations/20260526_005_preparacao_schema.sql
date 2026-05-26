-- =============================================================================
-- Migration: 005 — Schema de preparação olímpica
-- Tabelas referenciadas no código mas sem migration até agora.
-- =============================================================================
-- DOWN: DROP TABLE preparacao_material, preparacao_aula, preparacao_projeto CASCADE;
-- =============================================================================

-- ---------------------------------------------------------------------------
-- preparacao_projeto
-- ---------------------------------------------------------------------------

CREATE TABLE preparacao_projeto (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  olimpiada_sigla text        NOT NULL,
  olimpiada_id    uuid        REFERENCES olimpiada(id) ON DELETE SET NULL,
  nome            text        NOT NULL,
  descricao       text,
  ano_letivo      int         NOT NULL DEFAULT date_part('year', now())::int,
  publicado       boolean     NOT NULL DEFAULT false,
  ativo           boolean     NOT NULL DEFAULT true,
  criado_em       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_prep_projeto_sigla    ON preparacao_projeto (olimpiada_sigla);
CREATE INDEX idx_prep_projeto_ano      ON preparacao_projeto (ano_letivo);
CREATE INDEX idx_prep_projeto_ativo    ON preparacao_projeto (ativo)    WHERE ativo = true;
CREATE INDEX idx_prep_projeto_publicado ON preparacao_projeto (publicado) WHERE publicado = true;

-- ---------------------------------------------------------------------------
-- preparacao_aula
-- ---------------------------------------------------------------------------

CREATE TABLE preparacao_aula (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id       uuid        NOT NULL REFERENCES preparacao_projeto(id) ON DELETE CASCADE,
  titulo           text        NOT NULL,
  tipo             text        NOT NULL CHECK (tipo IN ('online', 'presencial', 'simulado')),
  data_hora        timestamptz,
  duracao_minutos  int,
  link_aula        text,
  polos            text,
  descricao        text,
  publicada        boolean     NOT NULL DEFAULT false,
  ordem            int         NOT NULL DEFAULT 0,
  criado_em        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_prep_aula_projeto   ON preparacao_aula (projeto_id);
CREATE INDEX idx_prep_aula_data      ON preparacao_aula (data_hora)  WHERE data_hora IS NOT NULL;
CREATE INDEX idx_prep_aula_publicada ON preparacao_aula (publicada)  WHERE publicada = true;

-- ---------------------------------------------------------------------------
-- preparacao_material
-- ---------------------------------------------------------------------------

CREATE TABLE preparacao_material (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  aula_id       uuid        NOT NULL REFERENCES preparacao_aula(id) ON DELETE CASCADE,
  nome          text        NOT NULL,
  arquivo_path  text        NOT NULL,
  criado_em     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_prep_material_aula ON preparacao_material (aula_id);
