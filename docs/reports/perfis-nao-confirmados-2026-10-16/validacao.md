# Perfis não confirmados — validação de 16/10/2026

O acompanhamento pedagógico e a seção de uso da plataforma em `/analytics` contam
somente identidades classificadas como aluno. Perfis legados sem tipo e novos pendentes
ficam em lista própria, com nome, vínculo disponível e último acesso. Professores e
colaboradores confirmados ficam fora dos dois grupos.

Referência: [especificação](../../specs/perfis-nao-confirmados.md).

| Verificação                                       | Resultado                                                                                      |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Suíte Vitest completa, um worker                  | 355 aprovados; 3 ignorados e 14 pendentes anteriores                                           |
| TypeScript sem emissão e sem cache incremental    | Aprovado                                                                                       |
| ESLint nos 13 arquivos de código da tarefa        | Aprovado                                                                                       |
| Prettier e `git diff --check`                     | Aprovados                                                                                      |
| `npm run build -- --webpack`                      | Aprovado, incluindo TypeScript e geração das rotas                                             |
| Navegação no componente real com dados sintéticos | 14 verificações aprovadas; desktop 1440px, celular 390px e tablet 768px; zero erros de console |
| Revisões independentes de código e segurança      | Aprovadas; nenhum achado P0–P2 restante                                                        |
| Secretlint nos arquivos examinados                | Aprovado na revisão de segurança                                                               |

Os testes cobrem a separação de alunos, legados, pendentes e profissionais; exclusão das
respostas de pendentes dos indicadores; transição após confirmação preservando identidade
e histórico; consultas de estudo apenas para alunos confirmados; autorização antes da
consulta de dados; e falhas de carregamento sem produzir indicadores falsos iguais a zero.

O navegador valida filtros por marca/unidade/série exclusivas de pendentes, busca, recorte
sem alunos, períodos e situações de estudo, paginação independente e ausência de overflow
da página. Os dois ajustes identificados na revisão têm cenários de regressão: voltar à
página 1 mantém a lista aberta, e refinar alunos preserva a página de perfis pendentes.

O navegador usa o componente real em um harness isolado; não faz autenticação real nem
consulta dados remotos. A revisão confirmou os gates existentes `aluno:read` no painel e
`audit_log:read` em analytics. Nenhum dado, sessão, cookie, permissão ou migração foi alterado.

As dependências permanecem idênticas à base. A auditoria anterior e seus alertas estão em
[cadastro por perfil](../cadastro-portal-2026-10-16/validacao.md#alertas-anteriores-de-dependências).

Evidências: [resultado do navegador](resultado.json), [desktop](desktop.png),
[lista de perfis](desktop-perfis.png), [recorte somente com pendentes](somente-pendentes.png),
[celular](celular.png), [análise de aluno](celular-aluno.png) e [perfis no celular](celular-perfis.png).
