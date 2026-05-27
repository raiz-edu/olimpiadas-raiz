-- =============================================================================
-- Migration: 013 — Converter duracao_minutos para armazenar segundos
-- O campo continua se chamando duracao_minutos (sem renomear),
-- mas o valor passa a representar segundos para suportar MM:SS.
-- =============================================================================
-- DOWN:
--   UPDATE preparacao_aula SET duracao_minutos = duracao_minutos / 60
--   WHERE duracao_minutos IS NOT NULL;
-- =============================================================================

-- Converte registros existentes de minutos → segundos
UPDATE preparacao_aula
SET duracao_minutos = duracao_minutos * 60
WHERE duracao_minutos IS NOT NULL;
