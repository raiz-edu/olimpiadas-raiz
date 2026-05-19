-- DOWN: reverte migration 001
-- ATENÇÃO: destrói todos os dados. Usar somente em desenvolvimento.

DROP VIEW IF EXISTS v_dashboard_inscricoes;

DROP TRIGGER IF EXISTS trg_olimpiada_updated_at ON olimpiada;
DROP FUNCTION IF EXISTS set_updated_at();

DROP TABLE IF EXISTS audit_log        CASCADE;
DROP TABLE IF EXISTS resultado        CASCADE;
DROP TABLE IF EXISTS inscricao        CASCADE;
DROP TABLE IF EXISTS olimpiada_fase   CASCADE;
DROP TABLE IF EXISTS olimpiada_marca  CASCADE;
DROP TABLE IF EXISTS olimpiada        CASCADE;
DROP TABLE IF EXISTS convite          CASCADE;
DROP TABLE IF EXISTS usuario_turma    CASCADE;
DROP TABLE IF EXISTS usuario_unidade  CASCADE;
DROP TABLE IF EXISTS usuario_marca    CASCADE;
DROP TABLE IF EXISTS usuario          CASCADE;
DROP TABLE IF EXISTS aluno            CASCADE;
DROP TABLE IF EXISTS turma            CASCADE;
DROP TABLE IF EXISTS unidade          CASCADE;
DROP TABLE IF EXISTS marca            CASCADE;

DROP TYPE IF EXISTS tipo_fase              CASCADE;
DROP TYPE IF EXISTS role_usuario           CASCADE;
DROP TYPE IF EXISTS tipo_resultado         CASCADE;
DROP TYPE IF EXISTS status_inscricao       CASCADE;
DROP TYPE IF EXISTS classificacao_olimpiada CASCADE;
