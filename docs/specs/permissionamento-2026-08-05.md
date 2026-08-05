# Permissionamento do sistema olímpico — regra vigente (2026-08-05)

> Decisão do Helio: o **sistema** (área de staff) fica **somente leitura** para todos,
> com **uma única exceção**: o Diretor de Marca convida usuários da própria marca.
> Admins são apenas **Helio e Hugo**. A **plataforma do aluno não foi alterada**.
> Esta regra é temporária por escolha: o permissionamento será revisto adiante.

## Quem é admin

`ADMIN_EMAILS` (lib/auth/domains.ts): `helio.barbosa@matrizeducacao.com.br`,
`helio.barbosa@raizeducacao.com.br`, `hugo.carvalho@raizeducacao.com.br`.

`STAFF_LEITOR_EMAILS`: `bernardo.castro@`, `milena.gallotte@` — staff da rede **sem**
poderes de admin. A lista existe porque o domínio `raizeducacao.com.br` é fechado:
sem ela, eles perderiam o login no sistema. Mantêm a plataforma do aluno por
`ALLOWED_STUDENT_EMAILS`.

Quem entra pelo Google no portal staff: `podeEntrarNoPortalStaff` = admins +
staff-leitores. Domínios de marca continuam entrando por e-mail e senha, via convite.

## Matriz por papel

| Recurso                                                       | raiz                 | diretor_marca                            | gestor_conteudo · diretor · coordenador · professor |
| ------------------------------------------------------------- | -------------------- | ---------------------------------------- | --------------------------------------------------- |
| Marca, unidade, turma, aluno, olimpíada, inscrição, resultado | CRUD (+export)       | somente leitura (+export)                | somente leitura (+export)                           |
| Questão, simulado, projeto, apostila                          | CRUD                 | leitura                                  | leitura                                             |
| Usuário                                                       | CRUD                 | **leitura**                              | sem acesso                                          |
| Convite                                                       | criar, ler, cancelar | **criar, ler, cancelar** (própria marca) | sem acesso                                          |
| Log de auditoria (Gestão)                                     | leitura              | leitura                                  | sem acesso                                          |

Regras que não estão na matriz e seguem valendo:

- **Escopo por marca**: diretor_marca só vê e convida dentro da própria marca.
- **Anti-escalonamento**: não-raiz só convida papéis de leitura
  (`ROLES_ATRIBUIVEIS_NAO_RAIZ`).
- **Publicar é da raiz**: questão, projeto, aula e simulado só são publicados por
  admin; edição de não-admin devolve a questão para `aguardando_revisao`.
- **Apostilas**: além de ser raiz, exige e-mail em `APOSTILA_AUTORES` (só o Helio).

## Auditoria de escrita (feita nesta mudança)

Varredura de todas as server actions que escrevem no banco, conferindo o gate de cada
uma. Resultado: todas exigem permissão de escrita ou papel raiz, **exceto** os três
uploads de imagem do banco de questões (`uploadQuestaoImagem`, `uploadAlternativaImagem`,
`uploadSolucaoImagem`), que exigiam apenas `questao:read` e permitiam a qualquer leitor
gravar arquivos no Storage. Corrigido para `questao:update` nesta mesma mudança.

Também corrigido: a tela de Usuários decidia por PAPEL (`isDiretor`), o que divergia da
matriz; passou a decidir por CAPACIDADE (`convite:create`, `usuario:create`,
`usuario:update`, `convite:delete`), sempre igual ao que a server action aceita.

## Como voltar atrás ou evoluir

Toda a regra está em `lib/auth/roles.ts` (matriz) e `lib/auth/domains.ts` (quem entra e
quem é admin). Papéis de leitura hoje são idênticos de propósito: os rótulos
(gestor_conteudo, diretor, coordenador, professor) foram preservados para a revisão
futura do permissionamento, bastando devolver permissões ao papel desejado.
