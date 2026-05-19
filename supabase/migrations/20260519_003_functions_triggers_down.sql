-- DOWN: reverte migration 003 (functions + triggers)

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

DROP TRIGGER IF EXISTS audit_usuario   ON usuario;
DROP TRIGGER IF EXISTS audit_resultado ON resultado;
DROP TRIGGER IF EXISTS audit_inscricao ON inscricao;
DROP TRIGGER IF EXISTS audit_olimpiada ON olimpiada;
DROP FUNCTION IF EXISTS audit_trigger_fn() CASCADE;
DROP FUNCTION IF EXISTS mask_pii(jsonb) CASCADE;

DROP TRIGGER IF EXISTS trg_inscricao_cancelado_em ON inscricao;
DROP FUNCTION IF EXISTS set_cancelado_em() CASCADE;

DROP TRIGGER IF EXISTS trg_resultado_inscricao_ativa ON resultado;
DROP FUNCTION IF EXISTS check_resultado_inscricao_ativa() CASCADE;

DROP TRIGGER IF EXISTS trg_inscricao_consentimento ON inscricao;
DROP FUNCTION IF EXISTS check_consentimento_inscricao() CASCADE;

DROP FUNCTION IF EXISTS cancelar_inscricoes_olimpiada(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS inscrever_com_lock(uuid, uuid, uuid) CASCADE;
