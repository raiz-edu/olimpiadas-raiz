# Desempenho dos alunos e ranking de preparação por marca

Data: 16/10/2026. Proposta aprovada pelo solicitante após comparação com o Intensivo ENEM.

## Produto e resultado esperado

Professores, coordenação e direção precisam acompanhar a preparação para cada olimpíada
e reconhecer a participação dos alunos de uma marca. Evoluir o painel acadêmico existente
e oferecer uma visão própria de ranking, compartilhando dados, vínculos e autorização.

- Desempenho: todos os alunos confirmados do recorte, filtros atuais mais olimpíada, nível
  e fase/modalidade; comparação do acerto com o período anterior de mesmos dias-calendário.
- Ranking: alunos de uma marca, com olimpíada, nível e fase/modalidade definidos; posição,
  aluno, unidade, questões distintas acertadas, questões respondidas e dias de prática.
- Menu e navegação entre as duas visões em Acadêmico. Manter `/academico/desempenho` e
  acrescentar `/academico/ranking`. Períodos de 7/30/90 dias, padrão 30, em São Paulo.
- Somente `tipo_usuario = 'aluno'` participa. Pendentes mantêm sua lista própria no
  desempenho; profissionais ficam fora das métricas de aluno.

## Contrato das métricas

1. O filtro de olimpíada/nível/fase recorta evidências de questões, preservando todos os
   alunos confirmados da marca/unidade/série, inclusive quem ainda não estudou o recorte.
   Nível é o da questão, não inferência sobre a série ou elegibilidade escolar do aluno.
2. A consulta traz os campos já existentes `questao.nivel` e `questao.fase`. Opções reutilizam
   `lib/questoes/olimpiadas.ts`, incluindo modalidades da Mandacaru e fases únicas. Valores
   observados adicionais e metadados ausentes são identificados; não inferir classificação.
3. Sem filtro de questões, manter as evidências atuais de respostas e progresso em aula.
   Com filtro, usar somente respostas atribuíveis a ele para atividade e desempenho; aulas
   sem esse vínculo não são atribuídas à olimpíada. Explicar o alcance na interface.
4. Desempenho preserva a última resposta por questão/contexto/aula, denominadores e
   correções pendentes. Comparação anterior termina imediatamente antes do início atual;
   variação em pontos percentuais somente com pelo menos 5 corrigidas nos dois períodos.
   O atual inclui hoje em andamento; o anterior contém dias completos. Informar isso.
   Os conjuntos de questões podem variar; não afirmar equivalência ou nota oficial.
5. Ranking mede preparação: cada questão conta uma vez por aluno no período, mesmo
   repetida em outra aula/contexto. Conta como acerto se existe resposta corrigida correta;
   questões abertas sem avaliação e questões removidas não contam como acerto.
   Uma questão é corrigida se alguma tentativa possui correção válida, e só é pendente
   quando nenhuma possui; o percentual considera essas questões distintas corrigidas.
6. Ordenar por questões distintas acertadas, com posição compartilhada em empate (1, 1, 3).
   Sem acerto, mostrar sem posição. Nome/ID estabilizam a exibição, sem desfazer o empate.
   Percentual usa questões distintas corrigidas e aparece a partir de 5; volume e pendências
   ficam explícitos. Dias de prática são dias com respostas, nunca quantidade de logins.
7. Posição considera todas as unidades da marca no mesmo recorte de questões e período.
   Unidade e busca apenas filtram a exibição, preservando posição. Paginação de 25 linhas
   mantém os filtros; mudar os filtros reinicia a página. Marca e olimpíada/nível/fase são
   obrigatórios para classificar; não misturar metadados desconhecidos no ranking.
   Ranking não filtra série. Trocar olimpíada limpa nível/fase; combinações incompatíveis
   solicitam nova seleção e não produzem uma classificação zerada.
8. Premiações continuam históricas e separadas. Sem classificação de provas oficiais ou
   simulados comuns nesta entrega, nem faixas de nota ENEM ou pontuação combinada arbitrária.

## Arquitetura e acesso

Página servidor → `aluno:read` → consulta paginada existente → funções puras → componentes.
Ranking compartilha o carregamento; filtros só reduzem o escopo já autorizado. Preservar
matriz RBAC e alcance de leitura atuais. Nenhuma tabela, migração, integração, dependência,
sessão ou escrita remota adicional; área do aluno permanece fora deste escopo de equipe.

Base visual: componentes e tokens do painel atual e referência local `intensivo-enem`.
Design Library externa indisponível nesta máquina. Preservar contraste, semântica das
tabelas, navegação por teclado e rolagem interna no celular.

Erros de consulta produzem indisponibilidade, não zeros plausíveis. Parâmetros repetidos,
excessivos ou inválidos são normalizados; nomes/labels são renderizados com escape React.

## Plano e critérios de aceite

1. Rever esta especificação com análise adversarial; registrar decisões antes do build.
2. Ampliar metadados, filtros e agregação; comparar períodos sem duplicar consultas remotas.
3. Implementar classificação pura e página de ranking com menu e navegação contextual.
4. Verificar exclusão de perfis, repetições entre contextos, empates, pendências, fuso,
   limites de período, filtros de evidência/coorte, metadados incompletos e bases pequenas.
5. Validar autorização antes das consultas, falhas explícitas e paginação independente.
6. Navegar nos componentes reais com dados sintéticos em computador, tablet e celular;
   verificar troca de olimpíada, níveis/fases, posições, evolução e estado sem dados.
7. Executar suíte, TypeScript, lint, formatação, build e revisões independentes; entregar PR.

Sucesso: filtros realmente alteram as evidências, todos os alunos continuam acompanháveis,
repetições não inflam o ranking, posições sobrevivem ao filtro de unidade, nenhuma consulta
sem autorização e nenhum dado ausente tratado como baixo desempenho.

Rollback: reverter os arquivos da entrega; nenhuma alteração de banco para desfazer.

Revisão adversarial: duas condições resolvidas antes do build. A migration 015 e as
actions de treino/simulado registram tentativas por `insert`, sem substituir a mesma
questão; a comparação usa respostas atualmente registradas. Seleções dependentes serão
reiniciadas no cliente e validadas no agregador antes de classificar.
