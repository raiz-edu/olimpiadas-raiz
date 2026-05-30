-- =============================================================================
-- Migration: 015 — Banco de Questões OBMEP
-- Conteúdo-fonte: C:\Users\helio.barbosa\Documents\OBMEP
--   Olimpíadas: OBMEP (N1/N2/N3) e OBMEP Mirim
--   144 PDFs: provas + soluções por nível, fase e ano (2015-2025)
--   Questões cadastradas manualmente pelo admin via área protegida.
-- =============================================================================
-- DOWN:
--   DROP TABLE resposta_aluno, solucao, alternativa, questao;
--   DROP TYPE tipo_questao, olimpiada_questao;
-- =============================================================================

-- ---------------------------------------------------------------------------
-- ENUMs
-- ---------------------------------------------------------------------------

CREATE TYPE olimpiada_questao AS ENUM (
  'obmep_mirim',
  'obmep'
);

CREATE TYPE tipo_questao AS ENUM (
  'multipla_escolha',
  'aberta'
);

-- ---------------------------------------------------------------------------
-- Tabela: questao
-- ---------------------------------------------------------------------------

CREATE TABLE questao (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  olimpiada     olimpiada_questao NOT NULL,
  nivel         text,                            -- 'mirim' | 'nivel_1' | 'nivel_2' | 'nivel_3' (null para Mirim que não tem sub-nível)
  fase          int         NOT NULL CHECK (fase IN (1, 2)),
  ano           int         NOT NULL CHECK (ano BETWEEN 2000 AND 2100),
  numero        int         NOT NULL CHECK (numero > 0),
  enunciado     text        NOT NULL,
  imagem_url    text,                            -- Supabase Storage URL (enunciado com figura)
  assunto       text,
  tipo          tipo_questao NOT NULL DEFAULT 'multipla_escolha',
  ativo         bool        NOT NULL DEFAULT true,
  video_url     text,                            -- URL do vídeo de resolução (YouTube/Vimeo)
  criado_em     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT questao_unique UNIQUE (olimpiada, fase, ano, numero)
);

CREATE INDEX idx_questao_olimpiada   ON questao (olimpiada);
CREATE INDEX idx_questao_fase        ON questao (fase);
CREATE INDEX idx_questao_ano         ON questao (ano);
CREATE INDEX idx_questao_assunto     ON questao (assunto);
CREATE INDEX idx_questao_ativo       ON questao (ativo) WHERE ativo = true;
CREATE INDEX idx_questao_olimpiada_fase_ano ON questao (olimpiada, fase, ano);

-- ---------------------------------------------------------------------------
-- Tabela: alternativa
-- ---------------------------------------------------------------------------

CREATE TABLE alternativa (
  id          uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  questao_id  uuid  NOT NULL REFERENCES questao (id) ON DELETE CASCADE,
  letra       char(1) NOT NULL CHECK (letra IN ('A','B','C','D','E')),
  texto       text,                              -- null quando a alternativa é só imagem
  imagem_url  text,                              -- Supabase Storage URL (alternativa com figura)
  correta     bool  NOT NULL DEFAULT false,
  CONSTRAINT alternativa_unique UNIQUE (questao_id, letra)
);

CREATE INDEX idx_alternativa_questao ON alternativa (questao_id);

-- ---------------------------------------------------------------------------
-- Tabela: solucao
-- ---------------------------------------------------------------------------

CREATE TABLE solucao (
  id          uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  questao_id  uuid  NOT NULL REFERENCES questao (id) ON DELETE CASCADE,
  texto       text,
  imagem_url  text,                              -- Supabase Storage URL (resolução com figura)
  criado_em   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT solucao_unique UNIQUE (questao_id)
);

CREATE INDEX idx_solucao_questao ON solucao (questao_id);

-- ---------------------------------------------------------------------------
-- Tabela: resposta_aluno
-- Sem UNIQUE (aluno_id, questao_id) — permite múltiplas tentativas.
-- Dashboard usa DISTINCT ON (questao_id) ORDER BY respondido_em DESC.
-- ---------------------------------------------------------------------------

CREATE TABLE resposta_aluno (
  id              uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id        uuid  NOT NULL REFERENCES aluno (id) ON DELETE CASCADE,
  questao_id      uuid  NOT NULL REFERENCES questao (id) ON DELETE CASCADE,
  alternativa_id  uuid  REFERENCES alternativa (id) ON DELETE SET NULL,
  correta         bool  NOT NULL,
  respondido_em   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_resposta_aluno_id    ON resposta_aluno (aluno_id);
CREATE INDEX idx_resposta_questao_id  ON resposta_aluno (questao_id);
CREATE INDEX idx_resposta_respondido  ON resposta_aluno (respondido_em DESC);

-- ---------------------------------------------------------------------------
-- RLS: questao
-- ---------------------------------------------------------------------------

ALTER TABLE questao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_full_questao" ON questao
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM usuario WHERE id = (SELECT auth.uid())));

CREATE POLICY "aluno_read_questao" ON questao
  FOR SELECT TO authenticated
  USING (
    ativo = true
    AND (SELECT current_aluno_id()) IS NOT NULL
  );

-- ---------------------------------------------------------------------------
-- RLS: alternativa
-- ---------------------------------------------------------------------------

ALTER TABLE alternativa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_full_alternativa" ON alternativa
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM usuario WHERE id = (SELECT auth.uid())));

CREATE POLICY "aluno_read_alternativa" ON alternativa
  FOR SELECT TO authenticated
  USING (
    (SELECT current_aluno_id()) IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM questao q
      WHERE q.id = questao_id AND q.ativo = true
    )
  );

-- ---------------------------------------------------------------------------
-- RLS: solucao
-- ---------------------------------------------------------------------------

ALTER TABLE solucao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_full_solucao" ON solucao
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM usuario WHERE id = (SELECT auth.uid())));

CREATE POLICY "aluno_read_solucao" ON solucao
  FOR SELECT TO authenticated
  USING (
    (SELECT current_aluno_id()) IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM questao q
      WHERE q.id = questao_id AND q.ativo = true
    )
  );

-- ---------------------------------------------------------------------------
-- RLS: resposta_aluno
-- ---------------------------------------------------------------------------

ALTER TABLE resposta_aluno ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aluno_own_resposta" ON resposta_aluno
  FOR ALL TO authenticated
  USING (aluno_id = (SELECT current_aluno_id()))
  WITH CHECK (aluno_id = (SELECT current_aluno_id()));

CREATE POLICY "staff_read_resposta" ON resposta_aluno
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM usuario WHERE id = (SELECT auth.uid())));
