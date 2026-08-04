-- 046 — get_olimpiadas_stats passa a devolver classificados
--
-- "Classificado" = avançou de fase sem medalha. São 685 registros no histórico
-- e até agora só apareciam numa tabela da Gestão (e só os de olimpíadas
-- obrigatórias). O Histórico ganha a coluna para permitir o recorte por
-- olimpíada, marca e ano.
--
-- Categoria disjunta das medalhas: na origem existe caso com 2 classificados e
-- 8 medalhas, o que descarta a hipótese de `classificado` ser superconjunto de
-- quem medalhou. Por isso soma sem dupla contagem — e por isso segue fora do
-- total de medalhas, que continua significando premiação.
--
-- No detalhe linha-a-linha o equivalente é resultado.tipo = 'aprovado'.

-- O Postgres não deixa `create or replace` alterar o tipo de retorno de uma
-- função, e esta ganha a coluna `classificados` — por isso o drop antes.
drop function if exists public.get_olimpiadas_stats(integer[], text[], text[]);

create function public.get_olimpiadas_stats(
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
  mencao         bigint,
  classificados  bigint
)
language sql
stable
security definer
set search_path to 'public'
as $function$
  with detalhe as (
    select
      o.nome                                                        as olimpiada_nome,
      m.nome                                                        as marca_nome,
      o.ano_letivo                                                  as ano_letivo,
      count(distinct i.id)                                          as inscritos,
      count(distinct i.id) filter (where i.status = 'confirmada')   as participantes,
      count(distinct i.id) filter (where r.tipo = 'ouro')           as ouro,
      count(distinct i.id) filter (where r.tipo = 'prata')          as prata,
      count(distinct i.id) filter (where r.tipo = 'bronze')         as bronze,
      count(distinct i.id) filter (where r.tipo = 'mencao_honrosa') as mencao,
      count(distinct i.id) filter (where r.tipo = 'aprovado')       as classificados
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
      sum(s.mencao_honrosa)::bigint   as mencao,
      sum(s.classificado)::bigint     as classificados
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
    sum(u.mencao)::bigint,
    sum(u.classificados)::bigint
  from uniao u
  group by u.olimpiada_nome, u.marca_nome, u.ano_letivo
$function$;

-- ─── DOWN ────────────────────────────────────────────────────────────────────
-- Recriar a versão da migration 044 (sem a coluna `classificados`).
-- Nota: mudar a assinatura de retorno exige drop antes do create, porque o
-- Postgres não permite alterar o OUT de uma função com create or replace.
--
-- drop function if exists public.get_olimpiadas_stats(integer[], text[], text[]);
-- (e então recriar o corpo de 20260804_044_olimpiada_stats_marca.sql)
