-- Adiciona o valor 'resposta_numerica' ao enum tipo_questao
-- (antes: multipla_escolha | aberta).
--
-- Motivação: a Competição Jacob Palis Júnior de Matemática tem uma seção de
-- "Respostas numéricas" — o aluno não escolhe alternativa nem redige: informa
-- um inteiro de 0000 a 9999. Correção é igualdade exata, sem IA.
--
-- ATENÇÃO: precisa ser aplicada SOZINHA, antes da 043. O Postgres não permite
-- usar um valor de enum recém-criado na mesma transação que o criou, e a 043
-- referencia 'resposta_numerica' num CHECK.
--
-- DOWN: valores de enum Postgres não são removíveis (não existe
-- ALTER TYPE ... DROP VALUE). Reverter exigiria recriar o tipo e migrar a
-- coluna — não fazer sem necessidade real.

ALTER TYPE tipo_questao ADD VALUE IF NOT EXISTS 'resposta_numerica';
