-- 058 — URLs de imagem: Storage do Supabase antigo → rota /api/storage do ambiente AWS.
--
-- Na AWS os arquivos foram copiados para o S3 (infra/migration/migrate-storage.mjs)
-- e são servidos por app/api/storage/<bucket>/<caminho>, na mesma origem — mas as
-- linhas importadas do snapshot ainda apontavam para
-- https://ebdazvyyunilbkygtevn.supabase.co/storage/v1/object/public/…, que o CSP
-- da AWS (img-src 'self') bloqueia. Resultado: nenhuma imagem de questão em produção.
--
-- GUARDA: só roda onde existe migration.schema_migrations — a tabela que o
-- bootstrap do Aurora cria (infra/migration/bootstrap-aurora.mjs). Em qualquer
-- projeto Supabase esta migration é no-op, porque lá as URLs absolutas são as certas.
--
-- Idempotente: a segunda execução não encontra mais o prefixo antigo.

do $$
declare
  prefixo_antigo text := 'https://ebdazvyyunilbkygtevn.supabase.co/storage/v1/object/public/';
  prefixo_novo   text := '/api/storage/';
  n int;
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'migration' and table_name = 'schema_migrations'
  ) then
    raise notice '058: fora do ambiente AWS — nada a reescrever';
    return;
  end if;

  update alternativa set imagem_url = replace(imagem_url, prefixo_antigo, prefixo_novo)
   where imagem_url like prefixo_antigo || '%';
  get diagnostics n = row_count; raise notice '058 alternativa.imagem_url: %', n;

  update solucao set imagem_url = replace(imagem_url, prefixo_antigo, prefixo_novo)
   where imagem_url like prefixo_antigo || '%';
  get diagnostics n = row_count; raise notice '058 solucao.imagem_url: %', n;

  update solucao set blocos = replace(blocos::text, prefixo_antigo, prefixo_novo)::jsonb
   where blocos::text like '%' || prefixo_antigo || '%';
  get diagnostics n = row_count; raise notice '058 solucao.blocos: %', n;

  update questao set imagem_url = replace(imagem_url, prefixo_antigo, prefixo_novo)
   where imagem_url like prefixo_antigo || '%';
  get diagnostics n = row_count; raise notice '058 questao.imagem_url: %', n;

  update questao set enunciado_blocos = replace(enunciado_blocos::text, prefixo_antigo, prefixo_novo)::jsonb
   where enunciado_blocos::text like '%' || prefixo_antigo || '%';
  get diagnostics n = row_count; raise notice '058 questao.enunciado_blocos: %', n;
end $$;

-- Down: não há — o prefixo antigo pertence a um projeto que será desligado.
