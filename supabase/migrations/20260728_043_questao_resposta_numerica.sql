-- Coluna que guarda o gabarito das questões de resposta numérica.
--
-- Aplicar DEPOIS da 042 (que cria o valor 'resposta_numerica' no enum
-- tipo_questao) — em transação separada.
--
-- Guardado como TEXT, não INT, de propósito: o gabarito oficial da Jacob Palis
-- é um número de 4 algarismos COM zeros à esquerda ("0009", "0040"). Guardar o
-- texto preserva o gabarito como publicado; a comparação com a resposta do
-- aluno é feita por valor numérico na aplicação, então "9" e "0009" acertam
-- igual.
--
-- DOWN:
--   ALTER TABLE questao DROP CONSTRAINT questao_resposta_numerica_obrigatoria;
--   ALTER TABLE questao DROP CONSTRAINT questao_resposta_numerica_formato;
--   ALTER TABLE questao DROP COLUMN resposta_numerica;

ALTER TABLE questao
  ADD COLUMN IF NOT EXISTS resposta_numerica text;

COMMENT ON COLUMN questao.resposta_numerica IS
  'Gabarito das questões tipo=resposta_numerica: inteiro de 0000 a 9999 como texto, preservando zeros à esquerda. NULL nos demais tipos.';

-- Formato: 1 a 4 algarismos (aceita "9" e "0009"; rejeita "12a", "-3", "10000").
ALTER TABLE questao
  DROP CONSTRAINT IF EXISTS questao_resposta_numerica_formato;
ALTER TABLE questao
  ADD CONSTRAINT questao_resposta_numerica_formato
  CHECK (resposta_numerica IS NULL OR resposta_numerica ~ '^[0-9]{1,4}$');

-- Questão de resposta numérica sem gabarito não entra: sem ele não há como
-- corrigir (não existe fallback por IA como nas questões abertas).
ALTER TABLE questao
  DROP CONSTRAINT IF EXISTS questao_resposta_numerica_obrigatoria;
ALTER TABLE questao
  ADD CONSTRAINT questao_resposta_numerica_obrigatoria
  CHECK (tipo <> 'resposta_numerica' OR resposta_numerica IS NOT NULL);
