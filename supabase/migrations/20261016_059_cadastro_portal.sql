-- Aplicar antes do aplicativo. Colunas aditivas: rollback mantém dados e vínculos.
BEGIN;

ALTER TABLE public.aluno
  ADD COLUMN tipo_usuario text CHECK (tipo_usuario IN ('pendente', 'aluno', 'professor', 'colaborador')),
  ADD COLUMN unidade_id uuid REFERENCES public.unidade(id) ON DELETE RESTRICT,
  ADD COLUMN serie_cadastro text,
  ADD COLUMN cadastro_concluido_em timestamptz;
-- Não preencher identidades legadas desconhecidas como pendentes.
ALTER TABLE public.aluno ALTER COLUMN tipo_usuario SET DEFAULT 'pendente';

UPDATE public.aluno a SET marca_id = m.id
FROM (VALUES
  ('colegioapogeu.com.br', 'apogeu'), ('matrizeducacao.com.br', 'matriz-educacao'),
  ('colegioqi.com.br', 'qi-bilingue'), ('colegiouniao.com.br', 'uniao'),
  ('americanobilingue.com.br', 'americano'), ('unificado.com.br', 'unificado'),
  ('sapereira.com.br', 'sa-pereira'), ('escolasap.com.br', 'escola-sap'),
  ('cubo.global', 'cubo-global'), ('colegioleonardodavinci.com.br', 'colegio-leonardo-da-vinci'),
  ('crecheglobaltree.com.br', 'global-tree'), ('apggov.com.br', 'apogeu'),
  ('sarahdawsey.com.br', 'sarah-dawsey'), ('raizeducacao.com.br', 'raiz-educacao')
) AS dominios(dominio, slug) JOIN public.marca m ON m.slug = dominios.slug
WHERE a.marca_id IS NULL AND a.turma_id IS NULL AND (split_part(lower(a.email), '@', 2) = dominios.dominio
  OR split_part(lower(a.email), '@', 2) LIKE '%.' || dominios.dominio);

UPDATE public.aluno a SET
  tipo_usuario = 'aluno', unidade_id = u.id, marca_id = u.marca_id,
  serie = t.serie, cadastro_concluido_em = now()
FROM public.turma t JOIN public.unidade u ON u.id = t.unidade_id
WHERE a.turma_id = t.id AND nullif(btrim(t.serie), '') IS NOT NULL
  AND (a.marca_id IS NULL OR a.marca_id = u.marca_id);

UPDATE public.aluno SET tipo_usuario = 'aluno'
WHERE tipo_usuario IS NULL AND (turma_id IS NOT NULL OR nullif(btrim(ra_totvs), '') IS NOT NULL);

ALTER TABLE public.aluno ADD CONSTRAINT aluno_cadastro_portal_completo CHECK (
  cadastro_concluido_em IS NULL OR
  (tipo_usuario IS NOT NULL AND (tipo_usuario IN ('professor', 'colaborador') OR
  (tipo_usuario = 'aluno' AND unidade_id IS NOT NULL AND marca_id IS NOT NULL
    AND coalesce(nullif(btrim(serie), ''), nullif(btrim(serie_cadastro), '')) IS NOT NULL)
  ))
);
CREATE INDEX idx_aluno_unidade_portal ON public.aluno(unidade_id) WHERE unidade_id IS NOT NULL;

CREATE FUNCTION public.portal_email_aluno(p_email text) RETURNS boolean
LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
  SELECT coalesce(
    split_part(lower(p_email), '@', 2) LIKE 'alunos.%'
    OR (split_part(lower(p_email), '@', 2) IN ('matrizeducacao.com.br', 'colegioqi.com.br')
      AND split_part(lower(p_email), '@', 1) ~ '^[a-z][a-z0-9._-]*(qi|me|mt)[0-9]{8}$'), false
  );
$$;
REVOKE ALL ON FUNCTION public.portal_email_aluno(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.portal_email_aluno(text) TO service_role;

CREATE FUNCTION public.concluir_cadastro_portal(
  p_aluno_id uuid, p_tipo text, p_unidade_id uuid DEFAULT NULL, p_serie text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  a public.aluno%ROWTYPE;
  unidade public.unidade%ROWTYPE;
  turma public.turma%ROWTYPE;
BEGIN
  SELECT * INTO a FROM public.aluno WHERE id = p_aluno_id FOR UPDATE;
  IF NOT FOUND OR NOT a.ativo THEN RAISE EXCEPTION 'Acesso indisponível.'; END IF;
  IF p_tipo IS NULL OR p_tipo NOT IN ('aluno', 'professor', 'colaborador') THEN
    RAISE EXCEPTION 'Selecione um perfil válido.';
  END IF;
  IF (a.tipo_usuario = 'aluno' OR a.turma_id IS NOT NULL OR nullif(btrim(a.ra_totvs), '') IS NOT NULL
      OR public.portal_email_aluno(a.email)) AND p_tipo <> 'aluno' THEN
    RAISE EXCEPTION 'Seu vínculo escolar identifica um aluno. Fale com a coordenação para corrigir.';
  END IF;

  IF a.cadastro_concluido_em IS NOT NULL THEN
    IF a.tipo_usuario = p_tipo AND (p_tipo <> 'aluno' OR
      (a.unidade_id = p_unidade_id AND coalesce(a.serie_cadastro, a.serie) = p_serie)) THEN RETURN; END IF;
    RAISE EXCEPTION 'Cadastro já concluído. Solicite uma correção à coordenação.';
  END IF;

  IF p_tipo = 'aluno' THEN
    SELECT * INTO unidade FROM public.unidade WHERE id = p_unidade_id AND ativo FOR SHARE;
    IF NOT FOUND OR a.marca_id IS NULL OR unidade.marca_id <> a.marca_id THEN
      RAISE EXCEPTION 'Selecione uma unidade ativa da sua marca.';
    END IF;
    IF p_serie IS NULL OR (p_serie NOT IN ('1º', '2º', '3º', '4º', '5º', '6º', '7º', '8º', '9º', '1º EM', '2º EM', '3º EM')
      AND a.serie IS DISTINCT FROM p_serie) THEN
      RAISE EXCEPTION 'Selecione uma série válida.';
    END IF;
    IF a.turma_id IS NOT NULL THEN
      SELECT * INTO turma FROM public.turma WHERE id = a.turma_id;
      IF turma.unidade_id IS DISTINCT FROM p_unidade_id OR turma.serie IS DISTINCT FROM p_serie THEN
        RAISE EXCEPTION 'O vínculo de turma deve ser corrigido pela coordenação.';
      END IF;
    END IF;
    IF nullif(btrim(a.serie), '') IS NOT NULL
       AND a.serie <> p_serie THEN
      RAISE EXCEPTION 'A série oficial deve ser corrigida pela coordenação.';
    END IF;
  END IF;

  UPDATE public.aluno SET tipo_usuario = p_tipo,
    unidade_id = CASE WHEN p_tipo = 'aluno' THEN p_unidade_id ELSE NULL END,
    -- Série autodeclarada serve ao acompanhamento, nunca à autorização de simulados.
    serie_cadastro = CASE WHEN p_tipo = 'aluno' THEN p_serie ELSE NULL END,
    cadastro_concluido_em = now()
  WHERE id = a.id;
END;
$$;
-- O servidor deriva o ID do cookie próprio validado; auth.uid() não representa esta sessão.
REVOKE ALL ON FUNCTION public.concluir_cadastro_portal(uuid, text, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.concluir_cadastro_portal(uuid, text, uuid, text) TO service_role;

-- RLS existente continua válida. As novas colunas de identidade não são graváveis
-- diretamente pelo cliente autenticado, mesmo que tenha UPDATE legado na tabela.
CREATE FUNCTION public.proteger_perfil_portal() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE t public.turma%ROWTYPE; u public.unidade%ROWTYPE;
BEGIN
  IF current_user NOT IN ('postgres', 'service_role') THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.tipo_usuario IS DISTINCT FROM 'pendente' OR NEW.unidade_id IS NOT NULL OR NEW.serie_cadastro IS NOT NULL OR NEW.cadastro_concluido_em IS NOT NULL THEN
        RAISE EXCEPTION 'Cadastro de perfil reservado ao servidor.';
      END IF;
    ELSIF NEW.tipo_usuario IS DISTINCT FROM OLD.tipo_usuario
      OR NEW.unidade_id IS DISTINCT FROM OLD.unidade_id
      OR NEW.serie_cadastro IS DISTINCT FROM OLD.serie_cadastro
      OR NEW.cadastro_concluido_em IS DISTINCT FROM OLD.cadastro_concluido_em THEN
      RAISE EXCEPTION 'Cadastro de perfil reservado ao servidor.';
    END IF;
  END IF;
  -- A origem oficial pode mudar em uma transferência sem trocar o RA.
  -- Sem turma para resolver a nova unidade, pedir confirmação do vínculo novamente.
  IF TG_OP = 'UPDATE' AND NEW.turma_id IS NULL
    AND (NEW.tipo_usuario = 'aluno' OR nullif(btrim(NEW.ra_totvs), '') IS NOT NULL)
    AND (NEW.marca_id IS DISTINCT FROM OLD.marca_id
      OR NEW.codcoligada_totvs IS DISTINCT FROM OLD.codcoligada_totvs
      OR NEW.codfilial_totvs IS DISTINCT FROM OLD.codfilial_totvs) THEN
    NEW.unidade_id := NULL; NEW.serie_cadastro := NULL; NEW.cadastro_concluido_em := NULL;
  END IF;
  -- Cadastros administrativos de turma e a sincronização oficial continuam alunos.
  -- RLS existente controla quem pode criar/editar esses vínculos.
  IF NEW.turma_id IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.turma_id IS DISTINCT FROM OLD.turma_id) THEN
    SELECT * INTO t FROM public.turma WHERE id = NEW.turma_id;
    SELECT * INTO u FROM public.unidade WHERE id = t.unidade_id;
    IF t.id IS NOT NULL AND u.id IS NOT NULL AND (NEW.marca_id IS NULL OR NEW.marca_id = u.marca_id) THEN
      NEW.tipo_usuario := 'aluno'; NEW.unidade_id := u.id; NEW.marca_id := u.marca_id;
      NEW.serie := t.serie; NEW.cadastro_concluido_em := now();
    END IF;
  ELSIF nullif(btrim(NEW.ra_totvs), '') IS NOT NULL AND NEW.tipo_usuario IS DISTINCT FROM 'aluno' THEN
    NEW.tipo_usuario := 'aluno'; NEW.cadastro_concluido_em := NULL;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_proteger_perfil_portal BEFORE INSERT OR UPDATE ON public.aluno
FOR EACH ROW EXECUTE FUNCTION public.proteger_perfil_portal();

COMMIT;
