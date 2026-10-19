-- Aplicar antes do aplicativo. Sessões novas, sem backfill de logins históricos.
BEGIN;

CREATE TABLE public.acesso_sessao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id uuid REFERENCES public.aluno(id) ON DELETE CASCADE,
  usuario_id uuid REFERENCES public.usuario(id) ON DELETE CASCADE,
  iniciada_em timestamptz NOT NULL DEFAULT now(),
  ultima_atividade_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT acesso_sessao_identidade CHECK (num_nonnulls(aluno_id, usuario_id) = 1),
  CONSTRAINT acesso_sessao_intervalo CHECK (ultima_atividade_em >= iniciada_em)
);
CREATE INDEX acesso_sessao_aluno ON public.acesso_sessao(aluno_id, ultima_atividade_em DESC);
CREATE INDEX acesso_sessao_usuario ON public.acesso_sessao(usuario_id, ultima_atividade_em DESC);
CREATE INDEX acesso_sessao_inicio ON public.acesso_sessao(iniciada_em);
ALTER TABLE public.acesso_sessao ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.acesso_sessao FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.acesso_sessao TO service_role;

CREATE FUNCTION public.registrar_acesso(
  p_aluno_id uuid DEFAULT NULL, p_usuario_id uuid DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
SET statement_timeout = '10s' SET lock_timeout = '3s' AS $$
DECLARE
  v_chave text;
  v_sessao uuid;
  v_agora timestamptz := statement_timestamp();
  v_alunos uuid[];
  v_usuarios uuid[];
BEGIN
  IF num_nonnulls(p_aluno_id, p_usuario_id) <> 1 THEN
    RAISE EXCEPTION 'Identidade de acesso inválida.';
  END IF;
  IF p_aluno_id IS NOT NULL THEN
    SELECT coalesce(nullif(lower(btrim(a.email)), ''), 'portal:' || a.id::text)
      INTO v_chave FROM public.aluno a WHERE a.id = p_aluno_id AND a.ativo;
  ELSE
    SELECT coalesce(nullif(lower(btrim(u.email)), ''), 'gestao:' || u.id::text)
      INTO v_chave FROM public.usuario u WHERE u.id = p_usuario_id AND u.ativo;
  END IF;
  IF v_chave IS NULL THEN RAISE EXCEPTION 'Acesso indisponível.'; END IF;

  -- Mesmo lock para portal/gestão e para todas as abas/dispositivos da pessoa.
  PERFORM pg_advisory_xact_lock(hashtextextended(v_chave, 0));
  SELECT array_agg(a.id) INTO v_alunos FROM public.aluno a
    WHERE coalesce(nullif(lower(btrim(a.email)), ''), 'portal:' || a.id::text) = v_chave;
  SELECT array_agg(u.id) INTO v_usuarios FROM public.usuario u
    WHERE coalesce(nullif(lower(btrim(u.email)), ''), 'gestao:' || u.id::text) = v_chave;
  SELECT s.id INTO v_sessao FROM public.acesso_sessao s
    WHERE (s.aluno_id = ANY(v_alunos) OR s.usuario_id = ANY(v_usuarios))
      AND s.ultima_atividade_em > v_agora - interval '30 minutes'
    ORDER BY s.ultima_atividade_em DESC, s.id LIMIT 1;
  IF v_sessao IS NULL THEN
    INSERT INTO public.acesso_sessao(aluno_id, usuario_id, iniciada_em, ultima_atividade_em)
      VALUES (p_aluno_id, p_usuario_id, v_agora, v_agora) RETURNING id INTO v_sessao;
  ELSE
    UPDATE public.acesso_sessao SET ultima_atividade_em = greatest(ultima_atividade_em, v_agora)
      WHERE id = v_sessao;
  END IF;
  RETURN v_sessao;
END;
$$;
REVOKE ALL ON FUNCTION public.registrar_acesso(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_acesso(uuid, uuid) TO service_role;

CREATE FUNCTION public.gestao_acessos(
  p_marcas uuid[] DEFAULT NULL, p_desde timestamptz DEFAULT NULL,
  p_ate timestamptz DEFAULT now()
) RETURNS TABLE (
  pessoa_id uuid, tipo_usuario text, marca_id uuid, unidade_id uuid, serie text,
  criado_em timestamptz, ultimo_acesso timestamptz, sessoes bigint,
  acessou_periodo boolean, estudou_periodo boolean, medicao_desde timestamptz
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
SET statement_timeout = '15s' AS $$
  WITH fontes AS (
    SELECT coalesce(nullif(lower(btrim(a.email)), ''), 'portal:' || a.id::text) AS chave,
      a.id, a.id AS aluno_id, NULL::uuid AS usuario_id, a.ativo,
      CASE WHEN a.tipo_usuario IN ('aluno', 'professor', 'colaborador') THEN 3 ELSE 1 END AS prioridade,
      CASE WHEN a.tipo_usuario IN ('aluno', 'professor', 'colaborador')
        THEN a.tipo_usuario ELSE 'pendente' END AS perfil,
      CASE WHEN a.tipo_usuario = 'aluno' THEN coalesce(un.marca_id, a.marca_id)
        ELSE a.marca_id END AS marca,
      CASE WHEN a.tipo_usuario = 'aluno' THEN coalesce(t.unidade_id, a.unidade_id)
        ELSE NULL END AS unidade,
      CASE WHEN a.tipo_usuario = 'aluno' THEN coalesce(nullif(btrim(a.serie), ''),
        nullif(btrim(t.serie), ''), nullif(btrim(a.serie_cadastro), '')) ELSE NULL END AS serie,
      a.created_at AS criado, a.last_login_at AS login
    FROM public.aluno a LEFT JOIN public.turma t ON t.id = a.turma_id
      LEFT JOIN public.unidade un ON un.id = coalesce(t.unidade_id, a.unidade_id)
    WHERE a.created_at <= p_ate
    UNION ALL
    SELECT coalesce(nullif(lower(btrim(u.email)), ''), 'gestao:' || u.id::text),
      u.id, NULL::uuid, u.id, u.ativo, 2,
      'equipe',
      u.marca_ativa_id, NULL::uuid, NULL::text, u.created_at, au.last_sign_in_at
    FROM public.usuario u LEFT JOIN auth.users au ON au.id = u.id
    WHERE u.created_at <= p_ate
  ), atuais AS (
    SELECT DISTINCT ON (f.chave) f.* FROM fontes f
    ORDER BY f.chave, f.ativo DESC, f.prioridade DESC, f.id
  ), identidades AS (
    SELECT f.chave, min(f.criado) AS criado, max(f.login) FILTER (WHERE f.login <= p_ate) AS login,
      -- ID estável mesmo quando um perfil pendente é confirmado durante a leitura.
      coalesce(min(f.usuario_id::text) FILTER (WHERE f.ativo),
        min(f.aluno_id::text) FILTER (WHERE f.ativo))::uuid AS pessoa_id,
      array_agg(f.aluno_id) FILTER (WHERE f.aluno_id IS NOT NULL) AS alunos,
      array_agg(f.usuario_id) FILTER (WHERE f.usuario_id IS NOT NULL) AS usuarios
    FROM fontes f GROUP BY f.chave
  ), evidencias AS (
    SELECT i.pessoa_id AS id, p.perfil, p.marca, p.unidade, p.serie, i.criado,
      greatest(i.login, s.ultima, r.ultima, pr.ultima) AS acesso,
      s.total AS sessoes, s.primeira, greatest(r.ultima, pr.ultima) AS estudo
    FROM atuais p JOIN identidades i ON i.chave = p.chave
    LEFT JOIN LATERAL (
      -- Uma sessão existente não desaparece se outra aba a atualizar entre páginas.
      SELECT max(least(s.ultima_atividade_em, p_ate))
          FILTER (WHERE s.iniciada_em <= p_ate) AS ultima,
        min(s.iniciada_em) FILTER (WHERE s.iniciada_em <= p_ate) AS primeira,
        count(*) FILTER (WHERE (p_desde IS NULL OR s.iniciada_em >= p_desde)
          AND s.iniciada_em <= p_ate) AS total
      FROM public.acesso_sessao s
      WHERE s.aluno_id = ANY(i.alunos) OR s.usuario_id = ANY(i.usuarios)
    ) s ON true
    LEFT JOIN LATERAL (
      SELECT max(r.respondido_em) AS ultima FROM public.resposta_aluno r
      WHERE r.aluno_id = ANY(i.alunos) AND r.respondido_em <= p_ate
    ) r ON true
    LEFT JOIN LATERAL (
      SELECT max(pr.updated_at) AS ultima FROM public.aluno_progresso pr
      WHERE pr.aluno_id = ANY(i.alunos) AND pr.updated_at <= p_ate
        AND (pr.assistido OR pr.progresso_segundos > 0)
    ) pr ON true
    WHERE p.ativo AND i.criado <= p_ate
      AND (p_marcas IS NULL OR p.marca = ANY(p_marcas))
  )
  SELECT e.id, e.perfil, e.marca, e.unidade, e.serie, e.criado, e.acesso, e.sessoes,
    coalesce(e.acesso <= p_ate AND (p_desde IS NULL OR e.acesso >= p_desde), false),
    coalesce(e.perfil = 'aluno' AND e.estudo <= p_ate
      AND (p_desde IS NULL OR e.estudo >= p_desde), false),
    min(e.primeira) OVER ()
  FROM evidencias e;
$$;
REVOKE ALL ON FUNCTION public.gestao_acessos(uuid[], timestamptz, timestamptz)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gestao_acessos(uuid[], timestamptz, timestamptz) TO service_role;

COMMENT ON TABLE public.acesso_sessao IS
  'Sessões após 30 minutos sem atividade; login histórico não é convertido em sessão.';
COMMENT ON FUNCTION public.gestao_acessos(uuid[], timestamptz, timestamptz) IS
  'Agregados por identidade institucional, sem nomes/e-mails. O servidor impõe marcas autorizadas.';
COMMIT;
