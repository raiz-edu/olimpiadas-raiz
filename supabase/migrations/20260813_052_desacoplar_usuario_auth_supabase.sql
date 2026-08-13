-- Cognito e a fonte de identidade no ambiente AWS. A PK historica do perfil
-- local permanece, mas deixa de depender da tabela legada auth.users.
ALTER TABLE public.usuario
  DROP CONSTRAINT IF EXISTS usuario_id_fkey;
