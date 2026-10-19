# SPEC: Acessos e participação

Referência: [PRD](acessos-participacao-prd.md). Base: implementação local do
Intensivo ENEM em `src/app/gestao/acessos`, `src/lib/acessos*` e
`src/components/registrar-acesso.tsx`; componentes e tokens do projeto atual.
O catálogo externo `~/Codex/assets/design-library` não está disponível.

## Fluxo e acesso

- `GET /analytics/acessos`: Server Component; gate `audit_log:read`, igual a Gestão.
  Raiz tem visão da rede; diretor de marca recebe sua `marca_ativa_id` do banco.
  Diretor sem vínculo não recebe dados. Revalidar esse escopo junto da consulta.
- `POST /api/acessos`: mesma origem, JSON apenas com `area: portal|gestao`.
  O ID vem exclusivamente do cookie de portal validado ou Supabase Auth/staff.
  Portal permite coletar cadastro incompleto, sem conceder acesso a estudo.
- Tracker nos layouts do portal e gestão observa navegação e interação visível,
  no máximo uma chamada por minuto; não há heartbeat para página abandonada.
  Login e callbacks não são contados. Falha de telemetria não impede o uso.
- RPCs de registro e leitura e tabela de sessões reservadas a `service_role`.
  RLS ativa, sem leitura/escrita direta de alunos ou usuários autenticados.

## Sessões e identidade

`acesso_sessao` referencia uma identidade ativa de `aluno` (que inclui os perfis
profissionais do portal) ou `usuario` (gestão), com início e última atividade.
Navegação/atividade após 30 minutos sem interação cria outra sessão.
Um lock transacional pela identidade institucional serializa abas e dispositivos.
O e-mail normalizado é usado somente internamente para associar as duas áreas;
sem e-mail, cada ID mantém identidade própria. A RPC de leitura não retorna nomes
ou e-mails. Perfis confirmados no portal prevalecem sobre papéis de acesso.
A classificação e os vínculos atuais reorganizam o histórico, como no Intensivo.

Precedência explícita: perfil confirmado no portal (aluno, professor ou colaborador)
define classificação e vínculo. Na ausência dele, staff ativo aparece como equipe,
com sua marca ativa; o papel RBAC professor não comprova profissão. Depois vêm
perfis pendentes do portal. Staff inativo não sobrepõe portal ativo, mas seu
histórico continua associado à pessoa. Não normalizar aliases, pontos ou sufixos
de provedores de e-mail. O ID de paginação independe da confirmação do perfil;
fontes criadas depois do corte não entram na associação daquela consulta.

Escolha: RPC transacional no Supabase existente, compatível com as duas sessões
atuais. Contador de login não mede visitas; eventos por página duplicam recargas;
novo serviço de analytics não resolve os vínculos acadêmicos. Nenhuma dependência.

## Métricas

- Períodos: últimos 7/30/90 dias corridos até agora e todo o histórico disponível.
- Pessoas únicas: uma identidade com login ou atividade registrada no período.
  Logins antigos servem à recência, nunca viram sessões históricas.
- Sessões: inícios no período. Uma sessão pode atravessar o início do recorte;
  nesse caso a pessoa pode estar ativa sem ter iniciado sessão no período.
- Novos cadastros: criação da identidade no período; importação não prova uso.
  No caso de portal + gestão, usar a primeira criação das identidades associadas.
- Ativos em 7/30 dias: última evidência de acesso nessas janelas, independentemente
  do período selecionado. Não significam presença online ou estudo.
- Estudo: alunos confirmados com resposta ou progresso positivo/conclusão de aula
  no período. Não inferir minutos, presença ou todos os dias a partir do progresso.
- Comparação: todos os alunos cadastrados no recorte, com acesso registrado e com
  estudo registrado; taxas apresentam contagens e bases. Estudo também evidencia
  acesso, inclusive quando uma gravação de login falhou.
- Recortes por marca, unidade, perfil e série; sem vínculos fica explícito.
  A consulta é paginada e ordenada por pessoa, com janela fixa por carregamento.
  Contas criadas depois do instante final ficam de fora. Uma sessão já iniciada
  mantém evidência quando outra aba a atualiza entre páginas, com seu intervalo
  limitado ao instante final; sessões inteiramente posteriores são descartadas.
  Falha de consulta mostra indisponibilidade, nunca indicadores iguais a zero.

## Plano e aceite

1. Migração aditiva, tipos, autenticação do endpoint e controle de concorrência.
2. Agregações e escopo, painel responsivo, navegação e substituição dos indicadores
   legados de login apresentados como online/frequência em Gestão.
3. Testar SQL real/RLS, duplicação entre áreas/abas, janela de inatividade, datas,
   contas sem acesso, imports, perfis, escopo, CSRF, erro e paginação.
4. Typecheck, lint, suíte e build; navegador desktop/celular com componente real
   e dados sintéticos isolados; revisão independente de código e segurança.

Implantação: aplicar somente `20261019_060_acessos_participacao.sql` antes de publicar.
Não usar push amplo de migrações. Rollback reverte aplicativo e preserva as sessões
coletadas. Nenhuma alteração de banco remoto ou publicação nesta tarefa.
