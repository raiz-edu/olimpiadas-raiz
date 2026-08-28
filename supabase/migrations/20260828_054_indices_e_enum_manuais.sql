-- 054 — Índices e valores de enum criados à mão no projeto antigo, nunca versionados.
--
-- Origem: dump do schema do projeto antigo (ebdazvyyunilbkygtevn) em 2026-08-28 via
-- supabase/scripts/migracao-raiz/exportar-schema.mjs, cruzado com as migrations.
-- Funções (18), triggers (16) e policies (69) estavam todas versionadas; sobraram
-- estes 7 índices e 3 valores do enum role_usuario. Complementa a 052 (colunas e
-- tabelas) — rodar DEPOIS dela, porque três índices são das tabelas que ela cria.
--
-- IDEMPOTENTE. Runbook: docs/ops/migracao-supabase-raiz.md (Passo 1).

-- ─── Índices ────────────────────────────────────────────────────────────────

-- Um aluno por (RA, coligada) na sincronização com o TOTVS — evita duplicar
-- matrícula quando o raiz-data-engine reprocessa.
create unique index if not exists idx_aluno_ra_coligada_unique
  on aluno (ra_totvs, codcoligada_totvs)
  where ra_totvs is not null and codcoligada_totvs is not null;

-- Um feriado de rede (sem marca) por data.
create unique index if not exists feriado_rede_unico on feriado (data) where marca_id is null;
create index if not exists idx_feriado_data on feriado (data);

create index if not exists idx_meta_marca_ano on meta_marca (ano_letivo);

-- Consultas do dashboard do aluno por contexto (banco / aula / simulado).
create index if not exists idx_resposta_contexto on resposta_aluno (aluno_id, contexto);

-- Sessões do simulado: lookup por aluno e, no máximo, UMA sessão viva por aula.
create index if not exists idx_simulado_sessao_aluno on simulado_sessao (aluno_id);
create unique index if not exists idx_simulado_sessao_ativa
  on simulado_sessao (aluno_id, aula_id)
  where status in ('em_andamento', 'pausado');

-- ─── Enum role_usuario ──────────────────────────────────────────────────────
-- Valores legados presentes no tipo do projeto antigo. Nenhum usuário os usa
-- hoje, mas o tipo precisa aceitá-los para um dump/restore não falhar.
alter type role_usuario add value if not exists 'direcao_marca';
alter type role_usuario add value if not exists 'direcao_unidade';
alter type role_usuario add value if not exists 'coordenacao_unidade';

-- Down:
--   drop index if exists idx_simulado_sessao_ativa;
--   drop index if exists idx_simulado_sessao_aluno;
--   drop index if exists idx_resposta_contexto;
--   drop index if exists idx_meta_marca_ano;
--   drop index if exists idx_feriado_data;
--   drop index if exists feriado_rede_unico;
--   drop index if exists idx_aluno_ra_coligada_unique;
--   (valores de enum não são removíveis sem recriar o tipo)
