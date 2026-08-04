-- 044 — Camada de agregados de olimpíadas por marca
--
-- Contexto: o histórico de participação da rede (2024–2026) vive no projeto
-- "DEP à vista" em formato agregado (contagem por marca × competição × ano).
-- Não existe registro por aluno na origem, então não há como materializar
-- `inscricao`/`resultado` sem inventar alunos. Esta tabela guarda o agregado
-- como agregado; Painel, Histórico e Gestão somam esta tabela com o detalhe
-- linha-a-linha que o sistema produz no uso corrente.
--
-- Carga: supabase/scripts/sync-olimpiada-stats.mjs (idempotente, upsert por
-- marca_id + olimpiada_sigla + ano_letivo).

-- ─── Marcas presentes na origem que ainda não existiam no destino ────────────

insert into marca (id, nome, slug, cor_primaria, ativo) values
  ('11111111-0000-0000-0000-000000000007', 'Colégio Leonardo da Vinci', 'colegio-leonardo-da-vinci', '#0D9488', true),
  ('11111111-0000-0000-0000-000000000008', 'Cubo Global',               'cubo-global',               '#4F46E5', true),
  ('11111111-0000-0000-0000-000000000009', 'Escola SAP',                'escola-sap',                '#DB2777', true),
  ('11111111-0000-0000-0000-000000000010', 'Sá Pereira',                'sa-pereira',                '#65A30D', true)
on conflict (id) do nothing;

-- ─── Agregado ────────────────────────────────────────────────────────────────

create table if not exists olimpiada_stats_marca (
  id                uuid        primary key default gen_random_uuid(),
  marca_id          uuid        not null references marca(id) on delete cascade,
  olimpiada_sigla   text        not null,
  olimpiada_nome    text        not null,
  ano_letivo        integer     not null,

  inscritos         integer     not null default 0 check (inscritos >= 0),
  participantes     integer     not null default 0 check (participantes >= 0),
  ouro              integer     not null default 0 check (ouro >= 0),
  prata             integer     not null default 0 check (prata >= 0),
  bronze            integer     not null default 0 check (bronze >= 0),
  mencao_honrosa    integer     not null default 0 check (mencao_honrosa >= 0),
  classificado      integer     not null default 0 check (classificado >= 0),

  -- Preenchidos quando a sigla casa com uma linha de `olimpiada`; usados pelos
  -- recortes por área/obrigatoriedade da tela de Gestão.
  area_conhecimento text,
  classificacao     classificacao_olimpiada,

  fonte             text        not null default 'dep-a-vista',
  sincronizado_em   timestamptz not null default now(),

  unique (marca_id, olimpiada_sigla, ano_letivo)
);

comment on table olimpiada_stats_marca is
  'Participação e premiação agregadas por marca × olimpíada × ano. Origem sem granularidade de aluno (projeto DEP à vista). Somada ao detalhe de inscricao/resultado nas telas de Resultados e Gestão.';

create index if not exists idx_olimpiada_stats_marca_ano   on olimpiada_stats_marca(ano_letivo);
create index if not exists idx_olimpiada_stats_marca_sigla on olimpiada_stats_marca(upper(olimpiada_sigla));
create index if not exists idx_olimpiada_stats_marca_marca on olimpiada_stats_marca(marca_id);

alter table olimpiada_stats_marca enable row level security;

drop policy if exists olimpiada_stats_marca_select on olimpiada_stats_marca;
create policy olimpiada_stats_marca_select on olimpiada_stats_marca
  for select using (marca_id = any (user_marca_ids()));

drop policy if exists olimpiada_stats_marca_write on olimpiada_stats_marca;
create policy olimpiada_stats_marca_write on olimpiada_stats_marca
  for all
  using      (current_user_role() = any (array['admin_rede'::role_usuario, 'raiz'::role_usuario]))
  with check (current_user_role() = any (array['admin_rede'::role_usuario, 'raiz'::role_usuario]));

-- ─── Histórico: RPC passa a somar detalhe + agregado ─────────────────────────

create or replace function public.get_olimpiadas_stats(
  p_anos    integer[],
  p_marcas  text[],
  p_siglas  text[]
)
returns table (
  olimpiada_nome text,
  marca_nome     text,
  ano_letivo     integer,
  inscritos      bigint,
  participantes  bigint,
  ouro           bigint,
  prata          bigint,
  bronze         bigint,
  mencao         bigint
)
language sql
stable
security definer
set search_path to 'public'
as $function$
  with detalhe as (
    select
      o.nome                                                       as olimpiada_nome,
      m.nome                                                       as marca_nome,
      o.ano_letivo                                                 as ano_letivo,
      count(distinct i.id)                                         as inscritos,
      count(distinct i.id) filter (where i.status = 'confirmada')  as participantes,
      count(distinct i.id) filter (where r.tipo = 'ouro')          as ouro,
      count(distinct i.id) filter (where r.tipo = 'prata')         as prata,
      count(distinct i.id) filter (where r.tipo = 'bronze')        as bronze,
      count(distinct i.id) filter (where r.tipo = 'mencao_honrosa') as mencao
    from inscricao i
    join aluno     a on a.id = i.aluno_id
    join turma     t on t.id = a.turma_id
    join unidade   u on u.id = t.unidade_id
    join marca     m on m.id = u.marca_id
    join olimpiada o on o.id = i.olimpiada_id
    left join resultado r on r.inscricao_id = i.id
    where o.ano_letivo = any(p_anos)
      and (array_length(p_marcas, 1) is null or m.nome = any(p_marcas))
      and (
        array_length(p_siglas, 1) is null
        or exists (
          select 1 from unnest(p_siglas) as s(sigla)
          where upper(o.nome) = upper(s.sigla)
             or upper(o.nome) like upper(s.sigla) || ' %'
             or upper(o.nome) like upper(s.sigla) || '-%'
        )
      )
    group by o.nome, o.ano_letivo, m.nome
  ),
  agregado as (
    select
      s.olimpiada_nome                as olimpiada_nome,
      m.nome                          as marca_nome,
      s.ano_letivo                    as ano_letivo,
      sum(s.inscritos)::bigint        as inscritos,
      sum(s.participantes)::bigint    as participantes,
      sum(s.ouro)::bigint             as ouro,
      sum(s.prata)::bigint            as prata,
      sum(s.bronze)::bigint           as bronze,
      sum(s.mencao_honrosa)::bigint   as mencao
    from olimpiada_stats_marca s
    join marca m on m.id = s.marca_id
    where s.ano_letivo = any(p_anos)
      and (array_length(p_marcas, 1) is null or m.nome = any(p_marcas))
      and (
        array_length(p_siglas, 1) is null
        or exists (
          select 1 from unnest(p_siglas) as s2(sigla)
          where upper(s.olimpiada_sigla) = upper(s2.sigla)
        )
      )
    group by s.olimpiada_nome, m.nome, s.ano_letivo
  ),
  uniao as (
    select * from detalhe
    union all
    select * from agregado
  )
  select
    u.olimpiada_nome,
    u.marca_nome,
    u.ano_letivo,
    sum(u.inscritos)::bigint,
    sum(u.participantes)::bigint,
    sum(u.ouro)::bigint,
    sum(u.prata)::bigint,
    sum(u.bronze)::bigint,
    sum(u.mencao)::bigint
  from uniao u
  group by u.olimpiada_nome, u.marca_nome, u.ano_letivo
$function$;

-- ─── DOWN ────────────────────────────────────────────────────────────────────
-- Reverte a camada de agregados. As 4 marcas inseridas acima NÃO são removidas:
-- podem ter passado a ser referenciadas por unidade/turma/aluno depois da carga.
-- Para removê-las, verifique as dependências antes.
--
-- drop table if exists olimpiada_stats_marca;
--
-- create or replace function public.get_olimpiadas_stats(
--   p_anos integer[], p_marcas text[], p_siglas text[]
-- )
-- returns table (
--   olimpiada_nome text, marca_nome text, ano_letivo integer,
--   inscritos bigint, participantes bigint,
--   ouro bigint, prata bigint, bronze bigint, mencao bigint
-- )
-- language sql stable security definer set search_path to 'public'
-- as $function$
--   SELECT
--     o.nome, m.nome, o.ano_letivo,
--     count(DISTINCT i.id),
--     count(DISTINCT i.id) FILTER (WHERE i.status = 'confirmada'),
--     count(DISTINCT i.id) FILTER (WHERE r.tipo = 'ouro'),
--     count(DISTINCT i.id) FILTER (WHERE r.tipo = 'prata'),
--     count(DISTINCT i.id) FILTER (WHERE r.tipo = 'bronze'),
--     count(DISTINCT i.id) FILTER (WHERE r.tipo = 'mencao_honrosa')
--   FROM inscricao i
--   JOIN aluno a ON a.id = i.aluno_id
--   JOIN turma t ON t.id = a.turma_id
--   JOIN unidade u ON u.id = t.unidade_id
--   JOIN marca m ON m.id = u.marca_id
--   JOIN olimpiada o ON o.id = i.olimpiada_id
--   LEFT JOIN resultado r ON r.inscricao_id = i.id
--   WHERE o.ano_letivo = ANY(p_anos)
--     AND (array_length(p_marcas, 1) IS NULL OR m.nome = ANY(p_marcas))
--     AND (
--       array_length(p_siglas, 1) IS NULL
--       OR EXISTS (
--         SELECT 1 FROM unnest(p_siglas) AS s(sigla)
--         WHERE upper(o.nome) = upper(s.sigla)
--            OR upper(o.nome) LIKE upper(s.sigla) || ' %'
--            OR upper(o.nome) LIKE upper(s.sigla) || '-%'
--       )
--     )
--   GROUP BY o.nome, o.ano_letivo, m.nome
-- $function$;
