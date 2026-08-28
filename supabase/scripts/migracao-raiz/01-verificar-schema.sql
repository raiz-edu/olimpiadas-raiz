-- Verificação do projeto Supabase da Raiz após a migração (rodar no SQL Editor).
-- Cada bloco é independente. Valores "esperado" = projeto antigo em 2026-08-28.
-- Runbook: docs/ops/migracao-supabase-raiz.md

-- A. Colunas e tabelas que só existiam no projeto antigo (migration 052) ─────
select item, ok from (
  select 'alternativa.imagem_largura'        as item, exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'alternativa'     and column_name = 'imagem_largura')    as ok
  union all select 'solucao.imagem_largura',           exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'solucao'         and column_name = 'imagem_largura')
  union all select 'usuario.admin_marca',              exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'usuario'         and column_name = 'admin_marca')
  union all select 'preparacao_aula.modalidade_online', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'preparacao_aula' and column_name = 'modalidade_online')
  union all select 'tabela simulado_sessao',           exists (select 1 from information_schema.tables  where table_schema = 'public' and table_name = 'simulado_sessao')
  union all select 'tabela serie_classificacao',       exists (select 1 from information_schema.tables  where table_schema = 'public' and table_name = 'serie_classificacao')
  union all select 'tabela feriado',                   exists (select 1 from information_schema.tables  where table_schema = 'public' and table_name = 'feriado')
) t order by ok, item;

-- B. Funções (RPC) que o app chama — todas devem existir ──────────────────────
with esperadas(nome) as (values
  ('inscrever_com_lock'), ('registrar_login_aluno'), ('cancelar_inscricoes_olimpiada'),
  ('get_olimpiadas_stats'), ('dificuldade_absoluta_calc'), ('mask_pii'),
  ('current_aluno_id'), ('current_user_role'), ('user_marca_ids'), ('user_turma_ids'), ('user_unidade_ids')
)
select e.nome, exists (
  select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = e.nome
) as ok from esperadas e order by ok, nome;

-- C. View usada pelo dashboard de inscrições ─────────────────────────────────
select 'v_dashboard_inscricoes' as view, exists (
  select 1 from information_schema.views where table_schema = 'public' and table_name = 'v_dashboard_inscricoes'
) as ok;

-- D. Contagem de linhas × projeto antigo (2026-08-28) ─────────────────────────
-- Diferença grande = cópia incompleta. audit_log pode divergir (cresce sozinho).
select t.tabela, t.esperado, t.atual, t.atual - t.esperado as diff from (
  select 'questao'     as tabela, 1914  as esperado, (select count(*) from questao)     as atual
  union all select 'alternativa',      8030, (select count(*) from alternativa)
  union all select 'solucao',          950,  (select count(*) from solucao)
  union all select 'aluno',            155,  (select count(*) from aluno)
  union all select 'usuario',          32,   (select count(*) from usuario)
  union all select 'usuario_marca',    26,   (select count(*) from usuario_marca)
  union all select 'marca',            13,   (select count(*) from marca)
  union all select 'unidade',          32,   (select count(*) from unidade)
  union all select 'turma',            240,  (select count(*) from turma)
  union all select 'olimpiada',        33,   (select count(*) from olimpiada)
  union all select 'olimpiada_fase',   95,   (select count(*) from olimpiada_fase)
  union all select 'olimpiada_marca',  50,   (select count(*) from olimpiada_marca)
  union all select 'olimpiada_stats_marca', 145, (select count(*) from olimpiada_stats_marca)
  union all select 'meta_marca',       24,   (select count(*) from meta_marca)
  union all select 'convite',          104,  (select count(*) from convite)
  union all select 'resposta_aluno',   630,  (select count(*) from resposta_aluno)
  union all select 'apostila_questao', 72,   (select count(*) from apostila_questao)
  union all select 'configuracao_sistema', 2, (select count(*) from configuracao_sistema)
  union all select 'audit_log',        46439, (select count(*) from audit_log)
) t order by abs(t.atual - t.esperado) desc;

-- E. URLs ainda apontando para o Storage do projeto antigo ─────────────────────
-- Antes de copiar o bucket + rodar 02-reescrever-urls-storage.sql: ~715/713/874/40/1178.
-- Depois: tudo zero.
select col, n from (
  select 'alternativa.imagem_url'  as col, count(*) as n from alternativa where imagem_url like '%ebdazvyyunilbkygtevn.supabase.co%'
  union all select 'solucao.imagem_url',      count(*) from solucao     where imagem_url like '%ebdazvyyunilbkygtevn.supabase.co%'
  union all select 'solucao.blocos',          count(*) from solucao     where blocos::text like '%ebdazvyyunilbkygtevn.supabase.co%'
  union all select 'questao.imagem_url',      count(*) from questao     where imagem_url like '%ebdazvyyunilbkygtevn.supabase.co%'
  union all select 'questao.enunciado_blocos', count(*) from questao    where enunciado_blocos::text like '%ebdazvyyunilbkygtevn.supabase.co%'
) t order by n desc;

-- F. Buckets do Storage (esperado: questoes PÚBLICO; apostilas, preparacao-materiais,
--    planilhas-olimpiadas privados) e quantidade de objetos ────────────────────
select b.id as bucket, b.public, count(o.id) as objetos
from storage.buckets b left join storage.objects o on o.bucket_id = b.id
group by b.id, b.public order by b.id;
-- esperado 2026-08-28: questoes 3101 (enunciados 2040, solucoes 994, alternativas 43, questoes 6),
--                      apostilas 4, preparacao-materiais 1, planilhas-olimpiadas 0

-- G. Auth do staff: usuario.id É o id em auth.users. Sem o auth user correspondente,
--    a pessoa não consegue logar (ou loga e cai como usuário novo sem papel) ────
select
  (select count(*) from auth.users)                                                        as auth_users,
  (select count(*) from usuario)                                                           as usuarios,
  (select count(*) from usuario u where not exists (select 1 from auth.users a where a.id = u.id)) as usuarios_sem_auth,
  (select count(*) from usuario u where u.role = 'raiz')                                  as admins_raiz;
