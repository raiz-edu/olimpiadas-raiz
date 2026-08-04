-- =============================================================================
-- Migration: 047 — Gerador de Apostilas, Fase 1 (issue #136)
-- Receitas de apostila + histórico de gerações + questões usadas por geração.
-- Padrão de acesso: RLS habilitado SEM policies — leitura/escrita apenas via
-- service_role (adminClient no servidor), igual configuracao_sistema.
-- =============================================================================

CREATE TABLE apostila_receita (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome          text        NOT NULL,
  titulo        text        NOT NULL,
  subtitulo     text,
  -- Schema EXATO da receita da skill gerar-apostila (Ferramenta 4):
  -- series, origens, niveis, publico, anos{min,max}, seed, mix_dificuldade,
  -- secoes[{topico, subtopicos, quantidade, mix_dificuldade}],
  -- estilo{colunas, escala_figuras, fonte, tamanho_fonte, espacamento},
  -- marca, sem_solucoes, compacto
  config        jsonb       NOT NULL,
  criado_por    uuid        REFERENCES usuario(id),
  criado_em     timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE apostila_geracao (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  receita_id     uuid        NOT NULL REFERENCES apostila_receita(id) ON DELETE CASCADE,
  seed           int         NOT NULL,
  total_questoes int         NOT NULL,
  -- [{secao, dificuldade, pedido, entregue, substituidas, deficit}]
  balanco        jsonb       NOT NULL,
  -- {professor: path no bucket, aluno: path no bucket} — versão impressão NÃO sobe
  versoes        jsonb       NOT NULL,
  gerado_por     uuid        REFERENCES usuario(id),
  gerado_em      timestamptz NOT NULL DEFAULT now()
);

-- Base da Fase 2 (não repetir questão já usada com a turma): quais questões
-- entraram em cada geração, com a seção e o número que receberam na apostila.
CREATE TABLE apostila_questao (
  geracao_id      uuid NOT NULL REFERENCES apostila_geracao(id) ON DELETE CASCADE,
  questao_id      uuid NOT NULL REFERENCES questao(id),
  secao           text NOT NULL,
  numero_apostila int  NOT NULL,
  PRIMARY KEY (geracao_id, questao_id)
);

CREATE INDEX idx_apostila_geracao_receita ON apostila_geracao(receita_id);
CREATE INDEX idx_apostila_questao_questao ON apostila_questao(questao_id);

ALTER TABLE apostila_receita ENABLE ROW LEVEL SECURITY;
ALTER TABLE apostila_geracao ENABLE ROW LEVEL SECURITY;
ALTER TABLE apostila_questao ENABLE ROW LEVEL SECURITY;

-- Nome do módulo editável (decisão da revisão da issue #136)
INSERT INTO configuracao_sistema (chave, valor) VALUES ('apostilas_nome_modulo', 'Apostilas')
ON CONFLICT (chave) DO NOTHING;

-- Bucket privado para os PDFs gerados pela skill
-- (paths: apostilas/<geracao_id>/apostila_{professor|aluno}.pdf)
INSERT INTO storage.buckets (id, name, public) VALUES ('apostilas', 'apostilas', false)
ON CONFLICT (id) DO NOTHING;

-- Down:
--   DELETE FROM storage.buckets WHERE id = 'apostilas';
--   DELETE FROM configuracao_sistema WHERE chave = 'apostilas_nome_modulo';
--   DROP TABLE apostila_questao;
--   DROP TABLE apostila_geracao;
--   DROP TABLE apostila_receita;
