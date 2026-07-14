-- 038: Reforco de RLS para gabarito e alternativa correta
-- Alunos so podem consultar solucao/alternativas diretamente apos responder.
-- Escrita em resposta_aluno deve continuar centralizada no servidor.

CREATE INDEX IF NOT EXISTS idx_resposta_aluno_aluno_questao
  ON resposta_aluno (aluno_id, questao_id);

DROP POLICY IF EXISTS "aluno_read_solucao" ON solucao;

CREATE POLICY "aluno_read_solucao_after_answer" ON solucao
  FOR SELECT TO authenticated
  USING (
    (SELECT current_aluno_id()) IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM resposta_aluno r
      JOIN questao q ON q.id = solucao.questao_id
      WHERE r.aluno_id = (SELECT current_aluno_id())
        AND r.questao_id = solucao.questao_id
        AND q.ativo = true
        AND q.status_cadastro = 'publicado'
    )
  );

DROP POLICY IF EXISTS "aluno_read_alternativa" ON alternativa;

CREATE POLICY "aluno_read_alternativa_after_answer" ON alternativa
  FOR SELECT TO authenticated
  USING (
    (SELECT current_aluno_id()) IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM resposta_aluno r
      JOIN questao q ON q.id = alternativa.questao_id
      WHERE r.aluno_id = (SELECT current_aluno_id())
        AND r.questao_id = alternativa.questao_id
        AND q.ativo = true
        AND q.status_cadastro = 'publicado'
    )
  );

DROP POLICY IF EXISTS "aluno_own_resposta" ON resposta_aluno;

CREATE POLICY "aluno_read_own_resposta" ON resposta_aluno
  FOR SELECT TO authenticated
  USING (aluno_id = (SELECT current_aluno_id()));
