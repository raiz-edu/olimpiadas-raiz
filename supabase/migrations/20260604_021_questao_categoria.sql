-- Adiciona campo categoria (nullable) na tabela questao
ALTER TABLE questao ADD COLUMN IF NOT EXISTS categoria text;
