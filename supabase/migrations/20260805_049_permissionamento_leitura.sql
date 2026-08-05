-- =============================================================================
-- Migration: 049 — Permissionamento somente-leitura (decisão do Helio, 2026-08-05)
--
-- O código (lib/auth/roles.ts + domains.ts) define o que cada PAPEL pode fazer,
-- mas o papel de quem já existe está gravado aqui. Esta migration alinha os dados
-- à nova regra: admin é só Helio e Hugo.
--
-- Bernardo e Milena passam de raiz para papel de leitura. Continuam entrando no
-- sistema pelo Google (STAFF_LEITOR_EMAILS em lib/auth/domains.ts) e mantêm o
-- acesso à plataforma do aluno (ALLOWED_STUDENT_EMAILS), que não foi alterada.
--
-- Os 3 diretores de marca (Giovani, Adriana, Luciana) permanecem como estão:
-- a única exceção à regra somente-leitura é justamente o convite, que é deles.
-- =============================================================================

UPDATE usuario
   SET role = 'professor'
 WHERE role = 'raiz'
   AND email NOT IN (
     'helio.barbosa@matrizeducacao.com.br',
     'helio.barbosa@raizeducacao.com.br',
     'hugo.carvalho@raizeducacao.com.br'
   );

-- Conferência (deve retornar apenas os 3 e-mails acima):
--   SELECT email, role FROM usuario WHERE role = 'raiz' ORDER BY email;

-- Down (restaura os 2 admins removidos nesta data):
--   UPDATE usuario SET role = 'raiz'
--    WHERE email IN ('bernardo.castro@raizeducacao.com.br',
--                    'milena.gallotte@raizeducacao.com.br');
