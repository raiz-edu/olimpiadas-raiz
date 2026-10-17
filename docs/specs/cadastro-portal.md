# Cadastro guiado da Plataforma Olímpica

## Produto

O primeiro acesso deve distinguir alunos, professores e outros profissionais, seguindo o
cadastro do Intensivo ENEM. A equipe pedagógica precisa de marca, unidade e série confiáveis
para interpretar os indicadores. O cadastro de estudo não concede permissões de gestão.

Critérios de sucesso: nenhum perfil profissional ou novo pendente no acompanhamento de
alunos; todo novo aluno conclui unidade oficial e série; vínculos e históricos preservados.

## Decisão e interfaces

Preservar o identificador e a sessão própria da tabela legada `aluno`, que também armazena
as experiências de estudo dos profissionais. Acrescentar `tipo_usuario`, `unidade_id` e
`cadastro_concluido_em` e `serie_cadastro`. Separar a tipagem de perfil do papel RBAC em `usuario`.
Uma nova identidade/tabela exigiria migrar respostas, progressos e inscrições sem benefício
para esta entrega. A mudança é aditiva e não altera essas referências.

Fluxo: Google/senha → `/aluno/cadastro` se incompleto → autorização do responsável para
alunos → área de estudos. Professores e outros profissionais dispensam autorização de
responsável e podem abrir o acesso de gestão existente em `/login`, sujeito ao RBAC atual.
Os dois acessos continuam com sessões independentes.

- Aluno: marca identificada no servidor; unidade ativa dessa marca; 1º ao 9º EF ou 1º ao 3º EM.
- Turma e RA oficiais ou e-mail escolar identificado impedem autodeclaração profissional.
- Vínculo completo de turma existente é aproveitado automaticamente na migração.
- Não inventar turma a partir de unidade/série autodeclaradas nem ampliar elegibilidade.
- Série informada fica em `serie_cadastro`, usada no painel; `serie` continua oficial e
  mantém a autorização de simulados. Um aluno não libera provas ao escolher uma série.
- RPC `concluir_cadastro_portal`: execução exclusiva service_role, ID derivado da sessão,
  bloqueio de linha, validação no banco e conclusão idempotente. Marca nunca vem do formulário.
- `getStudentSession` impede acesso e mutações antes do cadastro/consentimento. Leitura
  autenticada sem esse redirecionamento é reservada ao próprio cadastro/login.
- Handoff de popup só é emitido e aceito após cadastro e autorização aplicável.
- Escolha e campos permanecem preenchidos após falha recuperável.
- Catálogo indisponível ou marca sem unidade impede concluir aluno e permite tentar novamente.

## Legado e implantação

Adicionar tipo nullable sem default e só então definir default `pendente` para novas linhas.
Legado sem classificação fica em lista própria de perfis não confirmados no acompanhamento
pedagógico até confirmação; registros com turma/RA são alunos.
Não deduzir automaticamente que todo login histórico é aluno. Novos cadastros administrativos
e sincronizados têm tipo aluno explícito. Novos acessos Google pendentes aparecem nessa lista,
sem compor os indicadores de alunos.
O painel usa unidade da turma e, na ausência dela, a unidade oficial do cadastro.
Mudanças de marca, coligada ou filial na sincronização de aluno sem turma invalidam a
unidade autodeclarada e pedem sua confirmação novamente, preservando histórico e autorização.

Aplicar a migração antes de publicar o aplicativo. Erros de banco não liberam o cadastro.
Rollback: retornar ao aplicativo anterior mantendo as colunas aditivas e todos os históricos;
não remover colunas nem reverter classificações para executar rollback.

## Plano e validação

1. Migração, tipos e regras puras de perfil; transação e privilégios testados em PostgreSQL
   local embarcado (PGlite, somente dependência de desenvolvimento).
2. Cadastro e sessão, Google/senha, consentimento e popup; testes de redirecionamento,
   adulteração, identidade ativa e recuperação de falhas.
3. Entradas de login e exclusão de profissionais nos indicadores; regressões existentes.
4. Navegação visual com dados sintéticos em desktop/celular, typecheck, testes e build;
   revisão independente de código e segurança antes do PR.

PGlite evita simular semântica SQL em testes ou exigir acesso a dados reais. Não adiciona
serviço ou dependência ao aplicativo em produção. O teste carrega a migração versionada.
