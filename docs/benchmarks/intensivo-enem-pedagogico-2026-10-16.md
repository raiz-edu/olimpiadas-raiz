# Benchmark do Intensivo ENEM: acompanhamento pedagógico

16/10/2026 · referência: repositório local `intensivo-enem`.

## Decisão de escopo

O pedido foi refinado pelo solicitante para **somente visualização e análise de
desempenho para a equipe pedagógica**. A implementação fica em
`/academico/desempenho`. Login, área do aluno, coleta de dados, banco e regras de
acesso permanecem fora da entrega. Nenhum deploy ou gravação de dados foi realizado.

## O que o benchmark ensina

| Tema                     | Intensivo ENEM                                                                                     | Olimpíadas antes desta entrega                                                                        | Aplicação no painel pedagógico                                                                                    |
| ------------------------ | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Base de alunos           | Gestão inclui todos os alunos elegíveis, com cadastro concluído, por unidade                       | Somente alunos com login; exibição limitada aos vinte mais ativos por marca                           | Incluir todos os cadastros ativos, com paginação e busca, sem esconder quem precisa iniciar                       |
| Recortes                 | Marca, unidade e indicador na gestão; perfil, série e período na visão de acessos                  | Uma tabela por marca, sem filtros                                                                     | Marca, unidade, série, nome e períodos de 7/30/90 dias                                                            |
| Acesso e estudo          | Sessões de uso separadas da atividade pedagógica                                                   | Gestão chama autenticações de frequência; painel acadêmico usa respostas e último progresso           | No painel acadêmico, frequência de prática usa dias distintos com respostas; login fica como histórico secundário |
| Ausência de participação | Mostra sem atividade, diagnóstico pendente e necessidade de retomar contato                        | Ranking favorece quem já participa                                                                    | Sinais clicáveis para retomada, primeiro estudo, conferência de acesso e apoio nas questões                       |
| Desempenho               | Acertos aparecem desde as primeiras respostas, separados de diagnóstico, estimativa e consolidação | Total de respostas sem separação por contexto, combinando desempenho histórico com frequência recente | Mesmo período para prática e acerto; separar treino livre, exercícios de aula e simulados                         |
| Evidência                | Percentual acompanhado de acertos/total; estimativas têm data e amostra                            | Percentual isolado e agregado apenas dos alunos exibidos                                              | Numerador e denominador em cada taxa; grupos usam soma de acertos / soma de respostas corrigidas                  |
| Ação pedagógica          | Situação e área permitem localizar necessidade de acompanhamento                                   | Visão limitada aos alunos mais frequentes                                                             | Lista priorizada, detalhes individuais e tópicos de revisão com base mínima                                       |
| Confiabilidade           | Consulta paginada e erro explícito; autorização antes de consultar                                 | Consultas sem paginação e falhas convertidas silenciosamente em listas vazias                         | Consultas em páginas de 500, lotes de IDs e indisponibilidade explícita se faltar uma página                      |

Fontes do benchmark:

- `src/app/gestao/page.tsx` e `src/lib/gestao-desempenho.ts`: gestão por unidade,
  separação entre prática/diagnóstico, taxa ponderada e sinal de retomada.
- `src/app/gestao/acessos/page.tsx`, `src/lib/acessos.ts` e
  `src/lib/acessos-servidor.ts`: acesso como dimensão própria e denominadores claros.
- `src/lib/paginacao.ts`: consultas completas, além do limite padrão da API.
- `reports/diagnostico-desempenho-2026-10-07.md`: demonstra que 0% consolidado
  não significava ausência de respostas nem baixo acerto. A lição aproveitada é
  mostrar evidência disponível e explicar precisamente cada indicador.
- `src/components/registrar-acesso.tsx` e migration
  `20261006160000_acessos_sessoes.sql`: sessões independentes de login e de estudo.

Fontes da situação anterior nas Olimpíadas: versão anterior de
`app/(protected)/academico/desempenho/page.tsx`, a SPEC
`docs/specs/engajamento-desempenho-alunos-spec.md` e a seção de atividade em
`app/(protected)/analytics/page.tsx`. Esta última não foi alterada nesta entrega.

## O que foi implementado

1. Resumo do recorte: cadastros ativos, alunos com evidência de estudo, tentativas
   registradas e taxa de acerto com a quantidade de respostas que a sustenta.
2. Gráfico interativo de alunos distintos com respostas por dia, com tabela
   acessível dos valores; contagem no calendário de São Paulo.
3. Desempenho separado entre treino livre, exercícios de aula e simulados.
4. Comparação por marca e detalhamento por unidade, com links para aprofundar o recorte.
5. Sinais para localizar alunos sem estudo recente, com dificuldade, sem primeiro
   estudo ou sem acesso registrado. Nenhuma mensagem é enviada automaticamente.
6. Até cinco tópicos para revisar, com menos de 70% e pelo menos cinco respostas
   corrigidas; sem amostra suficiente, o painel explica a ausência de indicação.
7. Lista completa paginada, com situação, dias de prática, volume e taxa de acerto.
   Cada aluno tem análise expansível por atividade e histórico de logins/premiações.
8. Cartões individuais no celular; tabela no desktop. Os filtros da lista não
   alteram os denominadores dos indicadores do grupo.

## Adaptações e limites necessários

- **Volume e desempenho são diferentes.** Tentativas contam todas as respostas;
  a taxa considera a última resposta por questão, contexto e aula dentro do período.
  Repetições não recebem peso extra no desempenho, mas continuam no volume.
- **Aberta ainda não corrigida não é erro.** O código existente grava `correta=false`
  quando uma resposta aberta não tem solução disponível nem avaliação. O painel
  identifica essa ausência de avaliação e mostra pendência fora do denominador.
- **Frequência aqui é de prática na plataforma.** Não é presença em encontro.
  O registro mutável de progresso em aula só preserva sua última atualização;
  não permite reconstituir todos os dias de visualização ou minutos estudados.
- **Retomada tem janela própria e explícita:** ausência de evidência nos últimos
  sete dias-calendário, mesmo quando a análise está em 30 ou 90 dias. Apoio em
  questões exige pelo menos cinco respostas corrigidas e menos de 50% no período.
  São sinais para análise humana, não diagnósticos de aprendizagem.
- **Não importar a escala ENEM/TRI.** O Intensivo tem diagnóstico, incidência de
  tópicos e faixas de nota específicos do seu produto. Olimpíadas têm contextos e
  dificuldades diferentes; acerto não equivale a uma nota oficial comparável.
- **Dados de vínculo ausentes ficam visíveis.** Marca e série podem ser recuperadas
  da turma; sem vínculo suficiente, aparece “Sem unidade/série informada”. Não
  inferir unidade a partir do e-mail. Cadastro guiado do benchmark exigiria outra entrega.
- **Sem mudança de permissões.** Mantidos o gate `aluno:read` e o escopo de leitura
  da página anterior. Filtros refinam a visão, não concedem acesso.
- **A consulta carrega o histórico necessário à última evidência de estudo.** O
  contrato das consultas foi validado por leitura no ambiente disponível. Para
  volumes muito maiores, considerar agregação no banco em uma entrega própria;
  não adicionada sem necessidade.

## Verificação e reprodução

| Verificação                   | Resultado                                                          |
| ----------------------------- | ------------------------------------------------------------------ |
| TypeScript                    | Aprovado                                                           |
| ESLint dos arquivos alterados | Aprovado                                                           |
| Suíte completa                | 290 aprovados; 3 ignorados e 14 pendentes já existentes            |
| Testes novos do painel        | 21 aprovados                                                       |
| Build de produção             | Aprovado; rota acadêmica incluída                                  |
| Navegador isolado             | 8 verificações aprovadas; nenhum erro de console                   |
| Contrato PostgREST            | Consulta e relacionamento de questão validados somente por leitura |
| Revisão independente          | Achado de sincronização corrigido e conferido novamente            |
| Rota sem sessão, no Next real | Redirecionamento HTTP 307 para login, como antes                   |

O lint geral ainda aponta dois erros anteriores, ambos na linha 1 de
`scripts/extract_solutions.js` e `scripts/parse-obmep.js` (`no-require-imports`).
Esses arquivos e a configuração de lint não foram alterados nesta entrega.

- [SPEC e contrato das métricas](../specs/acompanhamento-pedagogico-spec.md).
- Unitários: `npx vitest run tests/unit/engajamento --maxWorkers=1`.
- Visual: `node tests/browser/engajamento-visual.mjs`.
- Evidências visuais e resultado: `docs/reports/engajamento-pedagogico-2026-10-16/`.

Prévias com dados sintéticos: [desktop](../reports/engajamento-pedagogico-2026-10-16/desktop.png),
[celular](../reports/engajamento-pedagogico-2026-10-16/celular.png) e
[análise individual no celular](../reports/engajamento-pedagogico-2026-10-16/celular-aluno.png).

O teste visual usa o componente real, o CSS do projeto e **dados sintéticos** em
um ambiente isolado. Simula a atualização de parâmetros sem remontar a árvore
React, para conferir que os seletores acompanham links de marca e situação.
Não cria rota pública de teste, não substitui autenticação na aplicação e não
insere alunos de exemplo no banco.

Revisão independente conferiu cálculos e fronteira servidor/cliente; o ajuste de
sincronização dos seletores foi aplicado. A validação visual cobriu desktop,
celular e tablet, filtros, paginação, estados vazios e análise individual.
