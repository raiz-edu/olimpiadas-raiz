-- Simulados standalone: projeto_id torna-se opcional
ALTER TABLE preparacao_aula ALTER COLUMN projeto_id DROP NOT NULL;

-- Lista de projetos vinculados (multi-projeto, acesso via series_elegiveis do projeto)
ALTER TABLE preparacao_aula ADD COLUMN IF NOT EXISTS projeto_ids uuid[] DEFAULT ARRAY[]::uuid[];

-- Lista de turmas vinculadas (acesso direto, sem projeto)
ALTER TABLE preparacao_aula ADD COLUMN IF NOT EXISTS turma_ids uuid[] DEFAULT ARRAY[]::uuid[];
