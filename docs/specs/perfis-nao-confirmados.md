# Perfis não confirmados nos indicadores

## Objetivo

Separar cadastros ainda sem identificação dos indicadores de alunos, mantendo a
visibilidade para a equipe pedagógica e a confirmação obrigatória no próximo acesso.

## Regras e interfaces

- Somente `tipo_usuario = 'aluno'` compõe participação, desempenho, comparativos e
  rankings de alunos. A identificação pode vir do cadastro ou de vínculo escolar oficial.
- Perfis legados sem tipo e novos `pendente` aparecem em "Perfil não confirmado".
  Professores e colaboradores confirmados não pertencem a nenhum desses dois grupos.
- A lista de pendentes mostra nome, marca/unidade disponíveis, série informada e último
  acesso. Não atribui desempenho ou situação pedagógica a quem ainda não é aluno confirmado.
- Marca, unidade, série e busca filtram os dois grupos. As opções incluem marcas presentes
  somente nos perfis pendentes. Período e situação de estudo não definem a pendência cadastral.
- A lista tem paginação própria de 25 registros por `pagina_perfis`, preservando os demais
  filtros e a página de alunos. Quando há somente pendentes, o painel explica os indicadores
  vazios e apresenta a lista aberta. A navegação explícita mantém a lista aberta inclusive
  ao retornar à página 1; refinar situação ou ordenação de alunos preserva a página dos perfis.
- A consulta carrega os metadados dos dois grupos, mas busca respostas, progresso e
  premiações somente dos alunos confirmados.
- A seção de uso de `/analytics` também considera somente alunos confirmados e aponta
  para a lista de pendências no painel acadêmico.
- Ao concluir o cadastro como aluno, o usuário passa aos indicadores na próxima consulta;
  ao confirmar perfil profissional, sai das pendências sem entrar nos indicadores.

## Limites e validação

Sem migração, alteração de dados remotos, logout, mudança de permissões ou de sessões.
Preservar cadastros e históricos. O acesso continua protegido por `aluno:read`.

Validar mistura de perfis, exclusão das respostas de pendentes dos denominadores,
transição após confirmação, filtros com marcas exclusivas dos pendentes, paginação
independente, ausência de alunos confirmados, falha de consultas e navegação em desktop
e celular. Executar testes, lint, TypeScript, build e revisão independente antes do PR.
