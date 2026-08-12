-- Identidade AWS: preserva PKs históricas e vincula o identificador imutável Cognito.
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS cognito_sub text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuario_cognito_sub
  ON usuario(cognito_sub) WHERE cognito_sub IS NOT NULL;

ALTER TABLE aluno ADD COLUMN IF NOT EXISTS cognito_sub text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_aluno_cognito_sub
  ON aluno(cognito_sub) WHERE cognito_sub IS NOT NULL;

CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  WITH claim AS (
    SELECT NULLIF(
      COALESCE(
        current_setting('request.jwt.claim.sub', true),
        NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'
      ), ''
    ) AS cognito_sub
  )
  SELECT COALESCE(
    (SELECT u.id FROM public.usuario u, claim c WHERE u.cognito_sub = c.cognito_sub LIMIT 1),
    (SELECT a.supabase_auth_id FROM public.aluno a, claim c WHERE a.cognito_sub = c.cognito_sub LIMIT 1),
    CASE WHEN (SELECT cognito_sub FROM claim) ~* '^[0-9a-f-]{36}$'
      THEN (SELECT cognito_sub::uuid FROM claim)
    END
  )
$$;
