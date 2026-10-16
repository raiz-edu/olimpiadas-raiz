-- Somente leitura. Executar DEPOIS da migração 059, no banco do ambiente alvo.
-- Esperado: quatro colunas; anon/authenticated false; service_role true;
-- nenhuma identidade completa com unidade de outra marca.
SELECT column_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'aluno'
  AND column_name IN ('tipo_usuario', 'unidade_id', 'serie_cadastro', 'cadastro_concluido_em')
ORDER BY column_name;

SELECT
  has_function_privilege('anon', 'public.concluir_cadastro_portal(uuid,text,uuid,text)', 'execute') AS anon,
  has_function_privilege('authenticated', 'public.concluir_cadastro_portal(uuid,text,uuid,text)', 'execute') AS authenticated,
  has_function_privilege('service_role', 'public.concluir_cadastro_portal(uuid,text,uuid,text)', 'execute') AS service_role;

SELECT tipo_usuario, count(*) AS quantidade
FROM public.aluno
GROUP BY tipo_usuario
ORDER BY tipo_usuario NULLS FIRST;

SELECT count(*) AS cadastros_com_marca_divergente
FROM public.aluno a
JOIN public.unidade u ON u.id = a.unidade_id
WHERE a.tipo_usuario = 'aluno' AND a.cadastro_concluido_em IS NOT NULL
  AND a.marca_id IS DISTINCT FROM u.marca_id;
