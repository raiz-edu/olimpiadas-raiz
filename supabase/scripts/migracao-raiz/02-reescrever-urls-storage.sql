-- Reescreve as URLs de imagem gravadas no banco: Storage do projeto antigo → Storage
-- do projeto da Raiz. Rodar no SQL Editor do projeto NOVO, SÓ DEPOIS de:
--   1. copiar o bucket `questoes` (node supabase/scripts/migracao-raiz/copiar-storage.mjs)
--   2. confirmar no navegador que https://<REF_RAIZ>.supabase.co/storage/v1/object/public/questoes/enunciados/CANGURU2021_J_Q02_fig01.png abre
--
-- Colunas afetadas (inventário 2026-08-28): alternativa.imagem_url (715 linhas),
-- solucao.imagem_url (713), solucao.blocos jsonb (874), questao.imagem_url (40),
-- questao.enunciado_blocos jsonb (1178).
--
-- O bloco DO é uma única transação: ou reescreve tudo, ou nada.
-- Runbook: docs/ops/migracao-supabase-raiz.md

-- Passo 1 — dry-run: quantas linhas serão tocadas
select col, n from (
  select 'alternativa.imagem_url'   as col, count(*) as n from alternativa where imagem_url like '%ebdazvyyunilbkygtevn.supabase.co%'
  union all select 'solucao.imagem_url',       count(*) from solucao where imagem_url like '%ebdazvyyunilbkygtevn.supabase.co%'
  union all select 'solucao.blocos',           count(*) from solucao where blocos::text like '%ebdazvyyunilbkygtevn.supabase.co%'
  union all select 'questao.imagem_url',       count(*) from questao where imagem_url like '%ebdazvyyunilbkygtevn.supabase.co%'
  union all select 'questao.enunciado_blocos', count(*) from questao where enunciado_blocos::text like '%ebdazvyyunilbkygtevn.supabase.co%'
) t;

-- Passo 2 — reescrita. Preencha new_host antes de rodar.
do $$
declare
  old_host text := 'ebdazvyyunilbkygtevn.supabase.co';
  new_host text := '<REF_RAIZ>.supabase.co';   -- ex.: abcdefghijklmnopqrst.supabase.co
  n int;
begin
  if new_host like '<%' then
    raise exception 'Preencha new_host com o host do projeto da Raiz antes de rodar.';
  end if;

  update alternativa set imagem_url = replace(imagem_url, old_host, new_host)
   where imagem_url like '%' || old_host || '%';
  get diagnostics n = row_count; raise notice 'alternativa.imagem_url: % linhas', n;

  update solucao set imagem_url = replace(imagem_url, old_host, new_host)
   where imagem_url like '%' || old_host || '%';
  get diagnostics n = row_count; raise notice 'solucao.imagem_url: % linhas', n;

  update solucao set blocos = replace(blocos::text, old_host, new_host)::jsonb
   where blocos::text like '%' || old_host || '%';
  get diagnostics n = row_count; raise notice 'solucao.blocos: % linhas', n;

  update questao set imagem_url = replace(imagem_url, old_host, new_host)
   where imagem_url like '%' || old_host || '%';
  get diagnostics n = row_count; raise notice 'questao.imagem_url: % linhas', n;

  update questao set enunciado_blocos = replace(enunciado_blocos::text, old_host, new_host)::jsonb
   where enunciado_blocos::text like '%' || old_host || '%';
  get diagnostics n = row_count; raise notice 'questao.enunciado_blocos: % linhas', n;
end $$;

-- Passo 3 — conferir: o Passo 1 deve devolver zero em todas as linhas.
-- Depois disso o host antigo pode sair do CSP (NEXT_PUBLIC_CSP_EXTRA_ORIGINS vazio).
