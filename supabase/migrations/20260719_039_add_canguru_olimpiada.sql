-- Adiciona o valor 'canguru' (Concurso Canguru de Matemática Brasil) ao enum
-- olimpiada_questao (antes: obmep_mirim | obmep).
--
-- ATENÇÃO: já aplicada manualmente no banco vivo via SQL Editor em 2026-07-19.
-- Esta migration existe para manter o repositório em sincronia com o schema real.
--
-- Níveis do Canguru (coluna questao.nivel, text livre): P (3º-4º ano),
-- E (5º-6º ano), B (7º-8º ano), C (9º ano), J (1ª-2ª série EM), S (3ª série EM).
-- Fase única (fase = 1) e sem soluções oficiais (apenas gabarito).
--
-- DOWN: valores de enum Postgres não são removíveis trivialmente (não existe
-- ALTER TYPE ... DROP VALUE). Reverter exigiria recriar o tipo e migrar a
-- coluna — não fazer sem necessidade real.

ALTER TYPE olimpiada_questao ADD VALUE IF NOT EXISTS 'canguru';
