-- Permite auto-provisionamento de alunos via Google SSO.
-- Remove NOT NULL de turma_id e data_nascimento (não disponíveis no primeiro login).
-- Remove constraint UNIQUE baseada em colunas agora nullable.
-- Adiciona coluna de tipo de responsável usada no fluxo de consentimento.

ALTER TABLE aluno ALTER COLUMN data_nascimento DROP NOT NULL;
ALTER TABLE aluno ALTER COLUMN turma_id DROP NOT NULL;

ALTER TABLE aluno DROP CONSTRAINT IF EXISTS aluno_turma_id_nome_data_nascimento_key;

ALTER TABLE aluno
  ADD COLUMN IF NOT EXISTS consentimento_responsavel_tipo text
  CHECK (consentimento_responsavel_tipo IN ('pedagogico', 'financeiro'));

-- DOWN:
-- ALTER TABLE aluno ALTER COLUMN data_nascimento SET NOT NULL;
-- ALTER TABLE aluno ALTER COLUMN turma_id SET NOT NULL;
-- ALTER TABLE aluno ADD CONSTRAINT aluno_turma_id_nome_data_nascimento_key
--   UNIQUE (turma_id, nome, data_nascimento);
-- ALTER TABLE aluno DROP COLUMN IF EXISTS consentimento_responsavel_tipo;
