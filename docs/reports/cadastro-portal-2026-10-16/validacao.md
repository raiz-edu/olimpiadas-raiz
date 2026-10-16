# Cadastro por perfil — validação de 16/10/2026

O primeiro acesso identifica aluno, professor ou outro profissional. Alunos confirmam
unidade ativa da marca e série; o consentimento do responsável continua obrigatório.
Profissionais podem conhecer a área de estudos e ficam fora dos indicadores de alunos.
O perfil informado não concede permissões de gestão.

Referência: [especificação](../../specs/cadastro-portal.md).

## Verificações concluídas

| Verificação                                            | Resultado                                                         |
| ------------------------------------------------------ | ----------------------------------------------------------------- |
| Suíte Vitest completa, um worker                       | 348 aprovados; 3 ignorados e 14 pendentes anteriores              |
| Migração real em PostgreSQL embarcado (PGlite)         | 20 testes aprovados                                               |
| Fluxos de sessão, Google, senha, consentimento e popup | 22 testes aprovados                                               |
| ESLint nos 31 arquivos de código da tarefa             | Aprovado                                                          |
| Prettier nos arquivos da tarefa e `git diff --check`   | Aprovados                                                         |
| `npm run build -- --webpack`                           | Aprovado, incluindo TypeScript e geração das rotas                |
| Interface com dados sintéticos                         | Desktop 1440px, celular 390px e tema escuro; sem erros de console |
| Smoke no aplicativo compilado                          | Seis verificações aprovadas; sem erros de página                  |
| Revisões independentes de código e segurança           | Nenhum P0–P2 introduzido restante                                 |
| Secretlint no diff e arquivos novos                    | Aprovado; nenhum segredo encontrado                               |

As verificações de navegador não efetuam login com uma conta real nem escrevem dados
de usuários. O teste visual usa o formulário real com uma action sintética para simular
falhas; a migração e seus privilégios são executados no banco local dos testes. O smoke
usa `next start`, verifica os dois acessos e seus redirecionamentos sem sessão, incluindo
recusa de cookie adulterado e manutenção de `popup=1`.

## Correções verificadas na revisão

- A série declarada fica em `serie_cadastro`; não altera a série oficial que autoriza
  simulados. O teste cobre tanto listagem quanto tentativa de iniciar um simulado restrito.
- Mudanças de marca, coligada ou filial invalidam a unidade declarada de um aluno sem
  turma, pedindo confirmação novamente. Preservam identidade, consentimento e histórico.
  As três regressões falharam antes da correção e passaram depois; sincronização sem
  alteração de origem mantém o cadastro concluído.
- Cadastro sem sessão retorna ao login preservando o modo popup, tanto na página
  quanto na action. A regressão do popup falhou antes da correção e passou depois.
- A falha na consulta de marca interrompe o novo provisionamento Google. Contas
  inativas não são recriadas; cadastro, consentimento e handoff validam a mesma identidade.

## Implantação

Aplicar `supabase/migrations/20261016_059_cadastro_portal.sql` no banco do ambiente
antes de publicar esta versão do aplicativo. A migração está transacionada e adiciona
colunas, funções, índice e trigger; preserva os identificadores e históricos existentes.
Neste trabalho, ela foi executada apenas no banco local dos testes.

Depois da aplicação, executar [verificar-cadastro.sql](verificar-cadastro.sql): as quatro
colunas devem existir; a RPC deve permitir somente `service_role`; a consulta de
integridade não deve encontrar aluno completo com unidade de outra marca.

Após publicar, validar um primeiro acesso de aluno e um profissional no ambiente alvo,
incluindo autorização do responsável e popup. O OAuth real e o banco remoto não foram
alterados por estas verificações. Rollback: retornar ao aplicativo anterior mantendo as
colunas aditivas e os históricos; não remover dados ou classificações.

## Alertas anteriores de dependências

`npm audit --omit=dev` encontrou 17 alertas já presentes na base: 2 críticos, 10 altos e
5 moderados. As versões de produção não foram alteradas; o único pacote acrescentado é
PGlite 0.5.8, restrito ao desenvolvimento.

O alerta crítico de Next.js 16.3.4 depende do uso de `next/og` com SVG controlado pelo
solicitante. Não há importação de `next/og`, `ImageResponse` ou rota de imagem dinâmica
no código examinado. Essa avaliação de alcance combina a busca local com o
[advisory oficial do Next.js](https://github.com/vercel/next.js/security/advisories/GHSA-vcvr-r3jv-pc5j).

O `proxy-addr` vulnerável pertence à árvore `shadcn → MCP SDK → Express`; o aplicativo
usa o CSS do shadcn e não executa esse servidor. O
[advisory de proxy-addr](https://github.com/advisories/GHSA-jqcg-44mw-7w3h) permanece
registrado para atualização de dependências separada desta entrega.

## Evidências

- [Formulário de aluno em desktop](aluno-desktop.png)
- [Formulário no celular em tema escuro](aluno-celular-escuro.png)
- [Perfil de professor no celular](professor-celular.png)
- [Login de estudos no aplicativo compilado](login-build-desktop.png)
- [Login da equipe no celular, aplicativo compilado](equipe-build-celular.png)
- [Resultado das interações sintéticas](resultado.json)
- [Resultado do smoke do build](smoke-build.json)
