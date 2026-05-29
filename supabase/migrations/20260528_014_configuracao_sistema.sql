-- =============================================================================
-- Migration: 014 — Tabela de configurações do sistema
-- =============================================================================

CREATE TABLE configuracao_sistema (
  chave        text        PRIMARY KEY,
  valor        text        NOT NULL DEFAULT '',
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

-- Seed: configurações iniciais
INSERT INTO configuracao_sistema (chave, valor) VALUES
  ('video_login_url', '');

-- RLS: apenas service_role lê e escreve (acesso via adminClient no servidor)
ALTER TABLE configuracao_sistema ENABLE ROW LEVEL SECURITY;
-- Down: DROP TABLE configuracao_sistema;
