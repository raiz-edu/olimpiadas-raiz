-- =============================================================================
-- Migration: 003 — Functions + Triggers
-- Sistema de Gestão de Olimpíadas do Conhecimento — Raiz Educação
-- =============================================================================
-- Cobre:
--   - inscrever_com_lock (race condition / limite de vagas — Addendum Fix A2)
--   - check_consentimento_inscricao (LGPD — Addendum Fix A5)
--   - trg_resultado_inscricao_cancelada (edge case #6 da SPEC)
--   - audit_log trigger (CRUD em entidades principais)
--   - handle_new_user (hook auth.users → public.usuario)
-- DOWN: supabase/migrations/20260519_003_functions_triggers_down.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. inscrever_com_lock
--    Advisory lock por olimpíada evita race condition na contagem de vagas.
--    Addendum v1.1 Fix A2.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION inscrever_com_lock(
  p_olimpiada_id  uuid,
  p_aluno_id      uuid,
  p_usuario_id    uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limite       int;
  v_atual        int;
  v_inscricao_id uuid;
BEGIN
  -- Lock pessimista: garante que apenas 1 transação conta+insere por vez
  PERFORM pg_advisory_xact_lock(hashtext(p_olimpiada_id::text));

  -- Verificar limite de vagas
  SELECT limite_vagas_total INTO v_limite
  FROM olimpiada
  WHERE id = p_olimpiada_id;

  IF v_limite IS NOT NULL THEN
    SELECT count(*) INTO v_atual
    FROM inscricao
    WHERE olimpiada_id = p_olimpiada_id
      AND status IN ('pendente', 'confirmada');

    IF v_atual >= v_limite THEN
      RAISE EXCEPTION 'LIMITE_VAGAS_ATINGIDO'
        USING ERRCODE = 'P0001',
              DETAIL  = 'A olimpíada atingiu o limite de vagas configurado.';
    END IF;
  END IF;

  -- INSERT — o trigger check_consentimento_inscricao valida LGPD antes
  INSERT INTO inscricao (olimpiada_id, aluno_id, inscrito_por)
  VALUES (p_olimpiada_id, p_aluno_id, p_usuario_id)
  RETURNING id INTO v_inscricao_id;

  RETURN v_inscricao_id;
END;
$$;

COMMENT ON FUNCTION inscrever_com_lock IS
  'Inscreve aluno com advisory lock para evitar race condition em limite_vagas_total.';

-- ---------------------------------------------------------------------------
-- 2. check_consentimento_inscricao
--    Bloqueia inscrição sem consentimento LGPD do responsável.
--    Addendum v1.1 Fix A5.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION check_consentimento_inscricao()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NOT (
    SELECT consentimento_responsavel
    FROM aluno
    WHERE id = NEW.aluno_id
  ) THEN
    RAISE EXCEPTION 'CONSENTIMENTO_LGPD_AUSENTE'
      USING ERRCODE = 'P0002',
            DETAIL  = 'O responsável pelo aluno não forneceu consentimento LGPD.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_inscricao_consentimento
  BEFORE INSERT ON inscricao
  FOR EACH ROW
  EXECUTE FUNCTION check_consentimento_inscricao();

-- ---------------------------------------------------------------------------
-- 3. check_resultado_inscricao_ativa
--    Bloqueia registro de resultado para inscrição cancelada (SPEC edge case #6).
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION check_resultado_inscricao_ativa()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_status status_inscricao;
BEGIN
  SELECT status INTO v_status
  FROM inscricao
  WHERE id = NEW.inscricao_id;

  IF v_status = 'cancelada' THEN
    RAISE EXCEPTION 'INSCRICAO_CANCELADA'
      USING ERRCODE = 'P0003',
            DETAIL  = 'Não é possível registrar resultado para inscrição cancelada.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_resultado_inscricao_ativa
  BEFORE INSERT ON resultado
  FOR EACH ROW
  EXECUTE FUNCTION check_resultado_inscricao_ativa();

-- ---------------------------------------------------------------------------
-- 4. cancelado_em automático
--    Preenche cancelado_em quando status muda para 'cancelada'.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_cancelado_em()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'cancelada' AND OLD.status <> 'cancelada' THEN
    NEW.cancelado_em = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_inscricao_cancelado_em
  BEFORE UPDATE OF status ON inscricao
  FOR EACH ROW
  EXECUTE FUNCTION set_cancelado_em();

-- ---------------------------------------------------------------------------
-- 5. Audit log triggers
--    Registra CRUD em olimpiada, inscricao, resultado, usuario.
--    Mascara PII (cpf, email, telefone) antes de salvar no log.
-- ---------------------------------------------------------------------------

-- mask_pii aceita um segundo parâmetro (table_name) para extensibilidade futura.
-- Atualmente mascara cpf, email_responsavel, telefone_responsavel em qualquer tabela.
CREATE OR REPLACE FUNCTION mask_pii(data jsonb, table_name text DEFAULT '')
RETURNS jsonb
LANGUAGE sql IMMUTABLE
AS $$
  SELECT data
    - 'cpf'
    || CASE WHEN data ? 'cpf' THEN jsonb_build_object('cpf', '***') ELSE '{}'::jsonb END
    - 'email_responsavel'
    || CASE WHEN data ? 'email_responsavel'
         THEN jsonb_build_object('email_responsavel', '***')
         ELSE '{}'::jsonb END
    - 'telefone_responsavel'
    || CASE WHEN data ? 'telefone_responsavel'
         THEN jsonb_build_object('telefone_responsavel', '***')
         ELSE '{}'::jsonb END
$$;

CREATE OR REPLACE FUNCTION audit_trigger_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _usuario_id   uuid;
  _dados_antes  jsonb;
  _dados_depois jsonb;
  _acao         text;
BEGIN
  _usuario_id := (SELECT auth.uid());

  -- Map Postgres TG_OP → nosso enum: create | update | delete
  -- NOTA: lower(TG_OP) retornaria 'insert', que viola o check constraint.
  -- Por isso mapeamos explicitamente 'INSERT' → 'create'.
  IF TG_OP = 'INSERT' THEN
    _acao := 'create';
  ELSIF TG_OP = 'UPDATE' THEN
    _acao := 'update';
  ELSE
    _acao := 'delete';
  END IF;

  -- TG_TABLE_NAME é tipo `name` em PL/pgSQL — cast ::text obrigatório
  IF TG_OP = 'DELETE' THEN
    _dados_antes := mask_pii(to_jsonb(OLD), TG_TABLE_NAME::text);
    INSERT INTO audit_log (usuario_id, entidade, entidade_id, acao, dados_antes, dados_depois)
    VALUES (_usuario_id, TG_TABLE_NAME::text, OLD.id, _acao, _dados_antes, NULL);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    _dados_antes  := mask_pii(to_jsonb(OLD), TG_TABLE_NAME::text);
    _dados_depois := mask_pii(to_jsonb(NEW), TG_TABLE_NAME::text);
    INSERT INTO audit_log (usuario_id, entidade, entidade_id, acao, dados_antes, dados_depois)
    VALUES (_usuario_id, TG_TABLE_NAME::text, NEW.id, _acao, _dados_antes, _dados_depois);
    RETURN NEW;
  ELSE -- INSERT
    _dados_depois := mask_pii(to_jsonb(NEW), TG_TABLE_NAME::text);
    INSERT INTO audit_log (usuario_id, entidade, entidade_id, acao, dados_antes, dados_depois)
    VALUES (_usuario_id, TG_TABLE_NAME::text, NEW.id, _acao, NULL, _dados_depois);
    RETURN NEW;
  END IF;
END;
$$;

-- Aplicar em entidades auditáveis
CREATE TRIGGER audit_olimpiada
  AFTER INSERT OR UPDATE OR DELETE ON olimpiada
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

CREATE TRIGGER audit_inscricao
  AFTER INSERT OR UPDATE OR DELETE ON inscricao
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

CREATE TRIGGER audit_resultado
  AFTER INSERT OR UPDATE OR DELETE ON resultado
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

CREATE TRIGGER audit_usuario
  AFTER INSERT OR UPDATE OR DELETE ON usuario
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

-- ---------------------------------------------------------------------------
-- 6. handle_new_user
--    Cria registro em public.usuario quando um auth.user é criado via convite.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_convite convite%ROWTYPE;
BEGIN
  -- Verificar se existe convite válido para este email
  SELECT * INTO v_convite
  FROM convite
  WHERE email = NEW.email
    AND aceito_em IS NULL
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_convite.id IS NOT NULL THEN
    -- Criar perfil do usuário com o role do convite
    INSERT INTO usuario (id, nome, email, role)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
      NEW.email,
      v_convite.role
    );

    -- Criar vínculo marca se convite é de marca
    IF v_convite.marca_id IS NOT NULL THEN
      INSERT INTO usuario_marca (usuario_id, marca_id)
      VALUES (NEW.id, v_convite.marca_id);

      UPDATE usuario
      SET marca_ativa_id = v_convite.marca_id
      WHERE id = NEW.id;
    END IF;

    -- Criar vínculo unidade se convite é de unidade
    IF v_convite.unidade_id IS NOT NULL THEN
      INSERT INTO usuario_unidade (usuario_id, unidade_id)
      VALUES (NEW.id, v_convite.unidade_id);
    END IF;

    -- Marcar convite como aceito
    UPDATE convite
    SET aceito_em = now()
    WHERE id = v_convite.id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ---------------------------------------------------------------------------
-- 7. cancelar_inscricao_em_lote
--    Utilitário para cancelamento em massa (ex: olimpíada encerrada).
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION cancelar_inscricoes_olimpiada(
  p_olimpiada_id uuid,
  p_motivo       text DEFAULT 'Cancelamento em lote pela administração'
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  -- Somente admin_rede pode usar esta função
  IF (SELECT role FROM usuario WHERE id = auth.uid()) <> 'admin_rede' THEN
    RAISE EXCEPTION 'PERMISSAO_NEGADA'
      USING ERRCODE = 'P0004';
  END IF;

  UPDATE inscricao
  SET status = 'cancelada', cancelado_motivo = p_motivo
  WHERE olimpiada_id = p_olimpiada_id
    AND status IN ('pendente', 'confirmada');

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION cancelar_inscricoes_olimpiada IS
  'Cancela todas as inscrições ativas de uma olimpíada. Somente admin_rede.';
