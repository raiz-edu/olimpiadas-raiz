# Implantação de Acessos e participação

Área: `/analytics/acessos`, menu Gestão. Requer o mesmo acesso de Gestão
(`audit_log:read`). Raiz consulta a rede; diretor consulta sua marca ativa.

## Ordem

1. Conferir o projeto Supabase já usado por esta aplicação. Aplicar **somente**
   `supabase/migrations/20261019_060_acessos_participacao.sql`, em transação, pelo
   mecanismo de migração administrado da equipe. Não executar push amplo.
2. Conferir tabela, RLS e privilégios antes de publicar o aplicativo:

   ```sql
   SELECT to_regclass('public.acesso_sessao');
   SELECT relrowsecurity FROM pg_class
     WHERE oid = 'public.acesso_sessao'::regclass;
   SELECT
     has_function_privilege('anon', 'public.registrar_acesso(uuid,uuid)', 'execute') AS anon_registra,
     has_function_privilege('authenticated', 'public.gestao_acessos(uuid[],timestamptz,timestamptz)', 'execute') AS cliente_le,
     has_function_privilege('service_role', 'public.registrar_acesso(uuid,uuid)', 'execute') AS servidor_registra;
   ```

   Esperado: tabela existente, RLS `true`, privilégios `false`, `false`, `true`.

3. Publicar pelo fluxo Git/Vercel existente. Não há variável ou serviço novo.
4. Conferir a página com raiz e diretor, incluindo tentativa de filtrar outra
   marca. Conferir portal com cadastro pendente e perfil concluído, sem alterar
   consentimento ou elegibilidade. Na atividade visível, POST `/api/acessos`
   deve responder 204; novas abas no mesmo intervalo mantêm uma sessão.

## Interpretação e falhas

- Sem histórico novo, sessões podem ser zero mesmo com logins antigos disponíveis.
- Novos cadastros incluem importações; não equivalem a primeiros acessos.
- A atividade do navegador é limitada a uma chamada por minuto; após 30 minutos
  sem atividade, o banco inicia outra sessão.
- Perfil confirmado no portal prevalece sobre o papel de acesso. Sem perfil,
  staff aparece como equipe e demais contas como pendentes.
- Erro de leitura apresenta indisponibilidade. Diretor sem marca não recebe dados.
- Falha de registro responde 503 e não impede o estudo. Conferir se a migração
  foi aplicada e se os privilégios estão corretos antes de investigar o navegador.

Rollback: reverter o aplicativo e manter tabela/RPCs e todas as sessões coletadas.
Não há exclusão de dados nem alteração de autenticação na migração.

A Vercel CLI não está instalada nesta máquina. Recomenda-se `npm i -g vercel`
para a etapa de publicação e consulta de logs, se necessária.
