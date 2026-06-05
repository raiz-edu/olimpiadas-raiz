-- Simulados podem ser acessíveis por série (em vez de turma individual)
ALTER TABLE preparacao_aula ADD COLUMN IF NOT EXISTS series_elegiveis text[] DEFAULT ARRAY[]::text[];
