-- =============================================================================
-- Migration: 001 — Schema inicial
-- Sistema de Gestão de Olimpíadas do Conhecimento — Raiz Educação
-- =============================================================================
-- DOWN: supabase/migrations/20260519_001_schema_inicial_down.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------

CREATE TYPE classificacao_olimpiada AS ENUM ('obrigatoria', 'facultativa');
CREATE TYPE status_inscricao       AS ENUM ('pendente', 'confirmada', 'cancelada');
CREATE TYPE tipo_resultado         AS ENUM ('aprovado', 'nao_aprovado', 'ouro', 'prata', 'bronze', 'mencao_honrosa');
CREATE TYPE role_usuario           AS ENUM ('admin_rede', 'coord_marca', 'coord_unidade', 'professor');
CREATE TYPE tipo_fase              AS ENUM ('inscricao', 'prova_1', 'prova_2', 'final', 'divulgacao');

-- ---------------------------------------------------------------------------
-- TENANCY — marca / unidade / turma
-- ---------------------------------------------------------------------------

CREATE TABLE marca (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        text        NOT NULL UNIQUE,
  slug        text        NOT NULL UNIQUE,
  cor_primaria text,
  logo_url    text,
  ativo       boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_marca_slug ON marca (slug);

-- -----

CREATE TABLE unidade (
  id        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  marca_id  uuid        NOT NULL REFERENCES marca(id) ON DELETE RESTRICT,
  nome      text        NOT NULL,
  cidade    text,
  estado    text,
  ativo     boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (marca_id, nome)
);

CREATE INDEX idx_unidade_marca ON unidade (marca_id);

-- -----

CREATE TABLE turma (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id  uuid    NOT NULL REFERENCES unidade(id) ON DELETE RESTRICT,
  nome        text    NOT NULL,
  serie       text    NOT NULL,
  ano_letivo  int     NOT NULL,
  ativo       boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (unidade_id, nome, ano_letivo)
);

CREATE INDEX idx_turma_unidade ON turma (unidade_id);

-- -----

CREATE TABLE aluno (
  id                              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id                        uuid    NOT NULL REFERENCES turma(id) ON DELETE RESTRICT,
  nome                            text    NOT NULL,
  data_nascimento                 date    NOT NULL,
  cpf                             text,
  email_responsavel               text,
  telefone_responsavel            text,
  -- LGPD (Addendum v1.1 Fix A5)
  consentimento_responsavel       boolean     NOT NULL DEFAULT false,
  consentimento_data              timestamptz,
  consentimento_documento_url     text,
  consentimento_responsavel_nome  text,
  consentimento_responsavel_documento text,
  -- --
  ativo       boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (turma_id, nome, data_nascimento)
);

CREATE INDEX idx_aluno_turma ON aluno (turma_id);
CREATE INDEX idx_aluno_cpf   ON aluno (cpf) WHERE cpf IS NOT NULL;

-- ---------------------------------------------------------------------------
-- USUÁRIOS / RBAC
-- ---------------------------------------------------------------------------

CREATE TABLE usuario (
  id             uuid         PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome           text         NOT NULL,
  email          text         NOT NULL UNIQUE,
  role           role_usuario NOT NULL,
  marca_ativa_id uuid         REFERENCES marca(id),  -- Addendum v1.1 Fix A1
  ativo          boolean      NOT NULL DEFAULT true,
  created_at     timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX idx_usuario_email ON usuario (email);
CREATE INDEX idx_usuario_role  ON usuario (role);

-- -----

CREATE TABLE usuario_marca (
  usuario_id uuid REFERENCES usuario(id) ON DELETE CASCADE,
  marca_id   uuid REFERENCES marca(id)   ON DELETE CASCADE,
  PRIMARY KEY (usuario_id, marca_id)
);

CREATE INDEX idx_usuario_marca_usuario ON usuario_marca (usuario_id);
CREATE INDEX idx_usuario_marca_marca   ON usuario_marca (marca_id);

-- -----

CREATE TABLE usuario_unidade (
  usuario_id  uuid REFERENCES usuario(id)  ON DELETE CASCADE,
  unidade_id  uuid REFERENCES unidade(id)  ON DELETE CASCADE,
  PRIMARY KEY (usuario_id, unidade_id)
);

CREATE INDEX idx_usuario_unidade_usuario  ON usuario_unidade (usuario_id);
CREATE INDEX idx_usuario_unidade_unidade  ON usuario_unidade (unidade_id);

-- -----

CREATE TABLE usuario_turma (
  usuario_id uuid REFERENCES usuario(id) ON DELETE CASCADE,
  turma_id   uuid REFERENCES turma(id)   ON DELETE CASCADE,
  PRIMARY KEY (usuario_id, turma_id)
);

CREATE INDEX idx_usuario_turma_usuario ON usuario_turma (usuario_id);
CREATE INDEX idx_usuario_turma_turma   ON usuario_turma (turma_id);

-- ---------------------------------------------------------------------------
-- CONVITES (suporte ao fluxo F2 — Auth)
-- ---------------------------------------------------------------------------

CREATE TABLE convite (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text        NOT NULL,
  role        role_usuario NOT NULL,
  marca_id    uuid        REFERENCES marca(id)   ON DELETE CASCADE,
  unidade_id  uuid        REFERENCES unidade(id) ON DELETE CASCADE,
  token       text        NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  criado_por  uuid        REFERENCES usuario(id),
  expires_at  timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  aceito_em   timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_convite_token     ON convite (token);
CREATE INDEX idx_convite_email     ON convite (email);
CREATE INDEX idx_convite_expires   ON convite (expires_at) WHERE aceito_em IS NULL;

-- ---------------------------------------------------------------------------
-- OLIMPÍADAS
-- ---------------------------------------------------------------------------

CREATE TABLE olimpiada (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome                    text        NOT NULL,
  area_conhecimento       text        NOT NULL,
  classificacao           classificacao_olimpiada NOT NULL,
  organizacao_promotora   text,
  descricao_html          text,
  caracteristicas_html    text,
  regulamento_url         text,
  regulamento_link_externo text,
  premiacao               text,
  series_elegiveis        text[]      NOT NULL DEFAULT '{}',
  faixa_etaria_min        int,
  faixa_etaria_max        int,
  ano_letivo              int         NOT NULL,
  limite_vagas_total      int,
  ativo                   boolean     NOT NULL DEFAULT true,
  created_at              timestamptz NOT NULL DEFAULT now(),
  created_by              uuid        REFERENCES usuario(id),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT faixa_etaria_coerente CHECK (
    faixa_etaria_max IS NULL OR faixa_etaria_min IS NULL OR
    faixa_etaria_max >= faixa_etaria_min
  )
);

CREATE INDEX idx_olimpiada_ano       ON olimpiada (ano_letivo);
CREATE INDEX idx_olimpiada_area      ON olimpiada (area_conhecimento);
CREATE INDEX idx_olimpiada_classif   ON olimpiada (classificacao);
CREATE INDEX idx_olimpiada_ativo     ON olimpiada (ativo) WHERE ativo = true;

-- -----

CREATE TABLE olimpiada_marca (
  olimpiada_id uuid REFERENCES olimpiada(id) ON DELETE CASCADE,
  marca_id     uuid REFERENCES marca(id)     ON DELETE CASCADE,
  PRIMARY KEY (olimpiada_id, marca_id)
);

CREATE INDEX idx_olimpiada_marca_olimpiada ON olimpiada_marca (olimpiada_id);
CREATE INDEX idx_olimpiada_marca_marca     ON olimpiada_marca (marca_id);

-- -----

CREATE TABLE olimpiada_fase (
  id           uuid     PRIMARY KEY DEFAULT gen_random_uuid(),
  olimpiada_id uuid     NOT NULL REFERENCES olimpiada(id) ON DELETE CASCADE,
  tipo         tipo_fase NOT NULL,
  nome         text     NOT NULL,
  data_inicio  date     NOT NULL,
  data_fim     date     NOT NULL,
  ordem        int      NOT NULL,
  observacoes  text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT data_coerente CHECK (data_fim >= data_inicio)
);

CREATE INDEX idx_fase_olimpiada ON olimpiada_fase (olimpiada_id);
CREATE INDEX idx_fase_datas     ON olimpiada_fase (data_inicio, data_fim);
CREATE INDEX idx_fase_tipo      ON olimpiada_fase (tipo);

-- ---------------------------------------------------------------------------
-- INSCRIÇÕES
-- ---------------------------------------------------------------------------

CREATE TABLE inscricao (
  id             uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  olimpiada_id   uuid            NOT NULL REFERENCES olimpiada(id)  ON DELETE RESTRICT,
  aluno_id       uuid            NOT NULL REFERENCES aluno(id)      ON DELETE RESTRICT,
  status         status_inscricao NOT NULL DEFAULT 'pendente',
  inscrito_em    timestamptz     NOT NULL DEFAULT now(),
  inscrito_por   uuid            REFERENCES usuario(id),
  observacoes    text,
  cancelado_em   timestamptz,
  cancelado_motivo text,
  UNIQUE (olimpiada_id, aluno_id)
);

CREATE INDEX idx_inscricao_olimpiada ON inscricao (olimpiada_id);
CREATE INDEX idx_inscricao_aluno     ON inscricao (aluno_id);
CREATE INDEX idx_inscricao_status    ON inscricao (status);
CREATE INDEX idx_inscricao_inscrito_em ON inscricao (inscrito_em DESC);

-- ---------------------------------------------------------------------------
-- RESULTADOS
-- ---------------------------------------------------------------------------

CREATE TABLE resultado (
  id              uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  inscricao_id    uuid           NOT NULL REFERENCES inscricao(id)     ON DELETE CASCADE,
  fase_id         uuid           NOT NULL REFERENCES olimpiada_fase(id) ON DELETE RESTRICT,
  tipo            tipo_resultado NOT NULL,
  pontuacao       numeric(10,2),
  observacoes     text,
  comprovante_url text,
  registrado_em   timestamptz    NOT NULL DEFAULT now(),
  registrado_por  uuid           REFERENCES usuario(id),
  UNIQUE (inscricao_id, fase_id)
);

CREATE INDEX idx_resultado_inscricao ON resultado (inscricao_id);
CREATE INDEX idx_resultado_fase      ON resultado (fase_id);
CREATE INDEX idx_resultado_tipo      ON resultado (tipo);

-- ---------------------------------------------------------------------------
-- AUDIT LOG
-- ---------------------------------------------------------------------------

CREATE TABLE audit_log (
  id          bigserial   PRIMARY KEY,
  usuario_id  uuid        REFERENCES usuario(id),
  entidade    text        NOT NULL,
  entidade_id uuid        NOT NULL,
  acao        text        NOT NULL CHECK (acao IN ('create', 'update', 'delete')),
  dados_antes jsonb,
  dados_depois jsonb,
  ip          text,
  user_agent  text,
  ocorreu_em  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_entidade ON audit_log (entidade, entidade_id);
CREATE INDEX idx_audit_usuario  ON audit_log (usuario_id, ocorreu_em DESC);
CREATE INDEX idx_audit_ocorreu  ON audit_log (ocorreu_em DESC);

-- ---------------------------------------------------------------------------
-- VIEW para Dashboard (Addendum v1.1 Fix A3 — VIEW normal, não MV)
-- ---------------------------------------------------------------------------

CREATE VIEW v_dashboard_inscricoes AS
SELECT
  i.id              AS inscricao_id,
  o.id              AS olimpiada_id,
  o.nome            AS olimpiada_nome,
  o.area_conhecimento,
  o.classificacao,
  o.ano_letivo,
  m.id              AS marca_id,
  m.nome            AS marca_nome,
  u.id              AS unidade_id,
  u.nome            AS unidade_nome,
  t.id              AS turma_id,
  t.serie,
  t.ano_letivo      AS turma_ano_letivo,
  a.id              AS aluno_id,
  a.nome            AS aluno_nome,
  i.status,
  i.inscrito_em
FROM inscricao i
JOIN aluno    a ON a.id = i.aluno_id
JOIN turma    t ON t.id = a.turma_id
JOIN unidade  u ON u.id = t.unidade_id
JOIN marca    m ON m.id = u.marca_id
JOIN olimpiada o ON o.id = i.olimpiada_id;

-- ---------------------------------------------------------------------------
-- updated_at automático para olimpiada
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_olimpiada_updated_at
BEFORE UPDATE ON olimpiada
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
