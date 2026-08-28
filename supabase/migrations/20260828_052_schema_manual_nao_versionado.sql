-- 052 — Schema que só existia no projeto antigo (criado à mão, nunca versionado).
--
-- PROBLEMA. Em ago/2026 o banco migrou do projeto Supabase pessoal
-- (ebdazvyyunilbkygtevn) para o projeto da Raiz Educação. Tudo que tinha sido
-- criado pelo Dashboard, sem migration, ficou para trás. Inventário de
-- 2026-08-28 (OpenAPI do PostgREST do projeto antigo × supabase/migrations + seed):
--
--   colunas  alternativa.imagem_largura, solucao.imagem_largura   (2026-06-05, 1c962ee / d066f65)
--            usuario.admin_marca                                    (2026-05-26, 915be7d)
--            preparacao_aula.modalidade_online                      (2026-06-04, 28ddefe)
--   tabelas  simulado_sessao                                        (2026-06-04, 63b0353)
--            serie_classificacao, feriado                           (sem uso no app hoje)
--
-- CONSEQUÊNCIA medida em produção: `select … imagem_largura from alternativa`
-- falha, o erro é engolido (`data ?? []`) e a Plataforma Olímpica fica em
-- "Carregando alternativas…" para sempre. Sem `simulado_sessao`, o simulado
-- cronometrado não abre. Sem `modalidade_online`, a Preparação quebra ao salvar aula.
--
-- IDEMPOTENTE: pode rodar quantas vezes for preciso. No projeto novo cria só o que
-- falta; no antigo acrescenta apenas o índice e liga RLS nas 3 tabelas (o acesso
-- a elas é sempre pelo admin client, então nada muda para o app).
-- Verificação: supabase/scripts/migracao-raiz/01-verificar-schema.sql
-- Runbook:     docs/ops/migracao-supabase-raiz.md

-- ─── Colunas ────────────────────────────────────────────────────────────────

-- Largura da imagem no render ("pequena" | "media" | "grande" ou fração), texto livre.
alter table alternativa     add column if not exists imagem_largura text;
alter table solucao         add column if not exists imagem_largura text;

-- Flag legada de admin de marca; lida por canUser() em lib/auth/roles.ts.
alter table usuario         add column if not exists admin_marca boolean not null default false;

-- "ao_vivo" | "gravada" | null — subtipo da aula online na Preparação.
alter table preparacao_aula add column if not exists modalidade_online text;

-- ─── Tabelas ────────────────────────────────────────────────────────────────

-- Sessão do simulado cronometrado (app/aluno/(area)/simulados/actions.ts).
-- Acesso só pelo admin client (service_role): RLS ligado sem policies.
create table if not exists simulado_sessao (
  id             uuid        primary key default gen_random_uuid(),
  aluno_id       uuid        not null references aluno(id) on delete cascade,
  aula_id        uuid        not null references preparacao_aula(id) on delete cascade,
  status         text        not null default 'em_andamento',
  tempo_restante integer     not null,
  questao_idx    integer     not null default 0,
  respostas      jsonb       not null default '{}'::jsonb,
  iniciado_em    timestamptz not null default now(),
  pausado_em     timestamptz,
  concluido_em   timestamptz
);
create index if not exists idx_simulado_sessao_aluno_aula_status
  on simulado_sessao (aluno_id, aula_id, status);
alter table simulado_sessao enable row level security;

-- Existiam no projeto antigo sem nenhum uso no código atual. Recriadas por
-- paridade, para que um dump/restore entre projetos não falhe.
create table if not exists serie_classificacao (
  serie         text        primary key,
  etapa         text,
  trilha        text,
  atualizado_em timestamptz not null default now()
);
alter table serie_classificacao enable row level security;

create table if not exists feriado (
  id       uuid primary key default gen_random_uuid(),
  data     date not null,
  nome     text not null,
  marca_id uuid references marca(id) on delete cascade
);
alter table feriado enable row level security;

-- Down:
--   drop table if exists feriado;
--   drop table if exists serie_classificacao;
--   drop table if exists simulado_sessao;
--   alter table preparacao_aula drop column if exists modalidade_online;
--   alter table usuario         drop column if exists admin_marca;
--   alter table solucao         drop column if exists imagem_largura;
--   alter table alternativa     drop column if exists imagem_largura;
