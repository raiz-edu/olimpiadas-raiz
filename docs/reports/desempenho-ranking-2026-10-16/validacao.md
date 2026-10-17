# Desempenho e ranking olímpico — validação de 16/10/2026

O painel de desempenho ganhou filtros por olimpíada, nível e fase/modalidade e comparação
de acerto com o período anterior. O novo ranking reconhece a preparação dos alunos dentro
de cada marca, por questões distintas acertadas; empates compartilham posição e o filtro
de unidade ou busca preserva a classificação da marca.

Referência: [produto, especificação e plano](../../specs/desempenho-ranking-olimpico.md).

| Verificação                                                      | Resultado                                                                                      |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Suíte Vitest completa, um worker                                 | 371 aprovados; 3 ignorados e 14 pendentes anteriores                                           |
| Testes dirigidos de acompanhamento e ranking                     | 46 aprovados                                                                                   |
| TypeScript, sem emissão/cache incremental, e compilação no build | Aprovados                                                                                      |
| ESLint nos 20 arquivos de código da entrega                      | Aprovado                                                                                       |
| Prettier e `git diff --check`                                    | Aprovados                                                                                      |
| `npm run build -- --webpack`                                     | Aprovado, incluindo nova rota acadêmica                                                        |
| Navegador em componentes reais com dados sintéticos              | 21 verificações aprovadas; desktop 1440px, tablet 768px e celular 390px; zero erros de console |
| Revisões independentes de código, segurança e usabilidade        | Aprovadas; nenhum P0–P2 restante                                                               |
| Secretlint no escopo da entrega                                  | Aprovado na revisão de segurança                                                               |

## Regressões e regras verificadas

- O filtro recorta as evidências e mantém os alunos sem estudo. Aulas sem vínculo com a
  olimpíada não entram no recorte específico. Perfis pendentes continuam em lista própria;
  professores e colaboradores não participam das métricas nem do ranking.
- Questões repetidas entre treino, aula e simulado contam uma vez no ranking. Correção
  válida prevalece sobre pendência da mesma questão; basta uma correção correta para o
  acerto distinto. Questões sem correção não reduzem artificialmente o percentual.
- Empates seguem 1, 1, 3; alunos sem acertos aparecem sem posição. Unidade e busca não
  recalculam a posição. Paginação foi exercitada com 25 + 7 linhas e reinício por filtro.
- Trocar olimpíada reinicia nível/fase; fases únicas e modalidades são reaproveitadas.
  Seleções incompatíveis, metadados ausentes e marca sem alunos confirmados têm estados
  explícitos. Valores livres coincidentes com propriedades de JavaScript são tratados.
- Os períodos respeitam São Paulo e não se sobrepõem. O atual inclui hoje em andamento;
  o anterior possui o mesmo número de dias-calendário completos. Variação exige cinco
  respostas corrigidas em cada período, com bases e ressalvas sobre questões diferentes.
- As tentativas são gravadas por `insert` nas actions de treino e simulado. A comparação
  usa respostas atualmente registradas e suas avaliações, sem presumir uma prova comum.
- Sessão e `aluno:read` são verificados antes do carregamento; falhas produzem alerta de
  indisponibilidade. Nenhuma mudança em sessões, RBAC, coleta, migrações ou dependências.

As duas sugestões opcionais de UX foram aplicadas: regra principal antecipada junto da
lista e indicação de rolagem horizontal no celular. Foram revistos padrões React e os
componentes/tokens locais; a Design Library corporativa não está disponível nesta máquina.
Não foi realizada medição instrumental de contraste.

O navegador usa um harness isolado com os componentes reais e navegação por URL; nenhum
bypass de autenticação foi acrescentado ao aplicativo. Não houve autenticação real,
consulta a dados remotos, implantação manual ou teste de indicadores em produção.
Os alertas de dependências anteriores permanecem documentados na
[validação do cadastro](../cadastro-portal-2026-10-16/validacao.md#alertas-anteriores-de-dependências).

## Evidências

- [Resultado das 21 verificações](resultado.json)
- [Desempenho com filtros](desempenho-filtros.png), [comparação de períodos](comparacao-periodos.png)
  e [análise individual](desempenho-recorte.png)
- [Ranking em desktop](ranking-desktop.png), [ranking no celular](ranking-celular.png)
  e [tabela no celular](ranking-tabela-celular.png)
- [Visão geral em desktop](desktop.png), [visão geral no celular](celular.png) e
  [análise de aluno no celular](celular-aluno.png)
- [Perfis pendentes em desktop](desktop-perfis.png), [no celular](celular-perfis.png) e
  [recorte somente com pendentes](somente-pendentes.png)
