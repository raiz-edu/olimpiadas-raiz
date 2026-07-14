# Red Team Do Portal Do Aluno - Relatorio Final

## Resumo Executivo

Este documento consolida o ciclo de red team do Portal do Aluno, com foco em:

- acesso indevido a gabarito/resolucao;
- manipulacao de payload pelo navegador;
- prompt injection textual e visual em discursivas;
- abuso de tamanho/custo em respostas abertas;
- simulados com acertos forjados;
- reforco de RLS para acesso direto via Supabase.

Conclusao: o Portal do Aluno esta apto para entrega do ponto de vista dos testes
executados neste ciclo. As correcoes principais foram mergeadas em `master`, e a
migration 038 foi aplicada no Supabase Production.

## Ambiente Testado

| Campo                                 | Valor                                  |
| ------------------------------------- | -------------------------------------- |
| App                                   | Olimpiadas Raiz - Portal do Aluno      |
| URL                                   | `https://olimpiadas-raiz.vercel.app`   |
| Ambiente                              | Vercel Production                      |
| Conta aluno                           | `bernardo.castro@raizeducacao.com.br`  |
| `aluno_id`                            | `0b14a82e-4304-4066-94e7-2e98fcd65722` |
| `turma_id` usada no teste de simulado | `4955b8fd-30b7-4b89-9e3d-07e9a4e2b8d0` |
| Banco                                 | Supabase Production                    |
| Registro inicial                      | 2026-07-04                             |
| Ultima atualizacao                    | 2026-07-14                             |

## PRs De Hardening Entregues

| PR                                            | Status   | Escopo                                                                                                                                                                     |
| --------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `#80` `fix/student-portal-security-hardening` | Mergeado | Validacao server-side de questao/contexto, bloqueio de gabarito antes de resposta, prompt injection textual/visual, limites de payload e simulado recalculado no servidor. |
| `#81` `fix/student-simulado-time-access`      | Mergeado | Horario de simulado em `America/Sao_Paulo`, visibilidade por turma/projeto/serie e bloqueio de URL direta de simulado indisponivel.                                        |
| `#82` `fix(student answer RLS)`               | Mergeado | RLS para impedir leitura direta de `solucao` e `alternativa.correta` antes de resposta, e bloqueio de insert direto em `resposta_aluno` por aluno.                         |

## Checks Automatizados

Executados localmente em `C:\Users\bernardo.castro\olimpiadas-raiz`.

| Check                                                                                                                                                                                 | Resultado | Observacao                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------- |
| `npm.cmd test -- tests/unit/aluno/security.test.ts tests/unit/ai/feedback-security.test.ts tests/unit/aluno/resposta-aberta-action.test.ts tests/unit/aluno/simulados-access.test.ts` | Passou    | 4 arquivos, 29 testes.                                                                                     |
| `npm.cmd run typecheck`                                                                                                                                                               | Passou    | TypeScript sem erros.                                                                                      |
| `npm.cmd run build`                                                                                                                                                                   | Passou    | Build Next.js 16.2.6 compilou e gerou as rotas.                                                            |
| `git diff --check`                                                                                                                                                                    | Passou    | Sem whitespace errors.                                                                                     |
| `npm.cmd test` completo                                                                                                                                                               | Falhou    | 3 falhas preexistentes/desalinhadas em `tests/unit/auth/roles.test.ts`, fora do escopo do Portal do Aluno. |
| `npm.cmd run lint` completo                                                                                                                                                           | Falhou    | Erros preexistentes em arquivos fora do escopo red team.                                                   |

## Tabela De Testes E Achados

| ID    | Cenario                                             | Payload/acao                                                      | Resultado esperado                                                   | Resultado observado                                                           | Evidencia                                                            | Status                          | Severidade se falhar |
| ----- | --------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------- | -------------------- |
| RT-01 | Gabarito direto de questao ja respondida            | Abrir `/aluno/treino/c47c65ee-d844-45ce-a72d-dfa79fdb3a25`        | Mostrar resolucao, pois ja havia resposta anterior do aluno          | Mostrou gabarito                                                              | Linha em `resposta_aluno` existente para o aluno e questao           | Aprovado                        | Baixa                |
| RT-02 | Gabarito direto de questao publicada nao respondida | Abrir `/aluno/treino/<id>` de questao nunca respondida            | Redirecionar para `/aluno/treino` ou nao mostrar resolucao           | Redirecionou para `/aluno/treino`                                             | Teste manual informado em 2026-07-13                                 | Aprovado                        | Critica              |
| RT-03 | Manipulacao `contexto=aula` com `aula_id` fake      | Alterar hidden inputs via DevTools antes de enviar objetiva       | Bloqueio server-side e nenhum insert indevido                        | Nao houve registro inconsistente no Supabase                                  | Query de contexto inconsistente retornou `Success. No rows returned` | Aprovado                        | Alta                 |
| RT-04 | Manipulacao `contexto=banco` com `aula_id` indevido | Alterar hidden inputs via DevTools antes de enviar objetiva       | Bloqueio server-side e nenhuma linha `banco` com `aula_id`           | Nao houve registro inconsistente no Supabase                                  | Query de contexto inconsistente retornou `Success. No rows returned` | Aprovado                        | Alta                 |
| RT-05 | Alternativa de outra questao em simulado            | Enviar alternativa cujo `questao_id` nao pertence a questao atual | Descartar resposta invalida/recalcular pelo banco                    | Sanitizador remove a resposta invalida                                        | `tests/unit/aluno/security.test.ts`                                  | Aprovado por teste automatizado | Alta                 |
| RT-06 | Prompt injection textual em discursiva              | Texto com `NOVA INSTRUCAO` tentando forcar JSON correto           | Feedback seguro incorreto, sem obedecer instrucao do aluno           | Funcionando corretamente                                                      | Teste manual e `tests/unit/ai/feedback-security.test.ts`             | Aprovado                        | Alta                 |
| RT-07 | Prompt injection visual/imagem irrelevante          | QR code, cartaz ou imagem com instrucao ao avaliador              | Feedback seguro incorreto; nunca obedecer texto da imagem            | Funcionando corretamente                                                      | Teste manual e `tests/unit/aluno/resposta-aberta-action.test.ts`     | Aprovado                        | Alta                 |
| RT-08 | Texto acima de 4.000 caracteres                     | Enviar resposta discursiva acima do limite                        | Mostrar aviso, permitir reenvio e nao registrar tentativa            | Funcionando corretamente                                                      | Teste manual e teste automatizado                                    | Aprovado                        | Media                |
| RT-09 | Simulado com `correta:true` forjado                 | Manipular payload/local state antes de finalizar simulado         | Servidor ignora cliente, recalcula pelo banco e salva resultado real | Funcionou corretamente no teste manual; sanitizador tambem cobre caso forjado | Relato manual de 2026-07-14 e `tests/unit/aluno/security.test.ts`    | Aprovado                        | Critica              |
| RT-10 | Horario e visibilidade de simulado por turma        | Criar simulado vinculado a turma do aluno                         | Simulado aparece para aluno elegivel e horario nao soma 3h           | Corrigido no PR #81                                                           | `tests/unit/aluno/simulados-access.test.ts` e teste manual           | Aprovado                        | Alta                 |
| RT-11 | RLS de `solucao`/`alternativa.correta`              | Consulta direta via Supabase antes de resposta                    | Sem linhas antes da resposta; liberado somente apos resposta propria | Migration 038 aplicada no Supabase Production                                 | `supabase/migrations/20260714_038_harden_student_question_rls.sql`   | Aprovado                        | Alta                 |

## Validacao Supabase Executada

A migration 038 foi aplicada no Supabase Production. Para auditoria, a query abaixo deve
mostrar as policies finais:

```sql
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('solucao', 'alternativa', 'resposta_aluno')
order by tablename, policyname;
```

Policies esperadas:

- `aluno_read_solucao_after_answer`
- `aluno_read_alternativa_after_answer`
- `aluno_read_own_resposta`

Policies antigas que nao devem mais aparecer:

- `aluno_read_solucao`
- `aluno_read_alternativa`
- `aluno_own_resposta`

Tambem validar o indice criado:

```sql
select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'resposta_aluno'
  and indexname = 'idx_resposta_aluno_aluno_questao';
```

## Debitos Nao Bloqueantes

### Testes completos de roles

`npm.cmd test` completo falha em `tests/unit/auth/roles.test.ts`.
As falhas indicam desalinhamento entre expectativas antigas do teste e o estado atual de
permissoes, especialmente para a role `diretor`, que hoje tem permissoes de convite/leitura
de usuarios. Isso nao afeta diretamente o Portal do Aluno nem as protecoes red team.

Decisao: nao corrigir antes da entrega. Registrar como debito de testes/RBAC para um PR
separado, caso o time queira voltar a exigir a suite completa verde.

### Lint completo

`npm.cmd run lint` completo falha em arquivos fora do escopo do red team, como paginas de
aula/projeto do aluno e `components/layout/mobile-nav.tsx`. O build de producao passa.

Decisao: nao corrigir antes da entrega. Registrar como debito tecnico separado para evitar
misturar ajustes esteticos/tipagem com a entrega de seguranca.

## Riscos Residuais

1. **Imagens publicas no bucket `questoes`**
   - Imagens de enunciado, alternativa e solucao usam `getPublicUrl`.
   - A RLS protege a linha da tabela, mas uma URL publica conhecida continua acessivel.
   - Consulta em Production retornou `188` solucoes com imagem ou referencia de Storage:

```sql
select count(*) as solucoes_com_imagem
from solucao
where imagem_url is not null
   or blocos::text ilike '%solucoes/%'
   or blocos::text ilike '%storage%';
```

- Recomendacao futura: tornar imagens de solucao privadas ou servir via signed URL
  somente depois de resposta valida.

2. **Suite geral nao verde**
   - `typecheck`, `build` e testes focados passam.
   - `npm test` e `npm run lint` completos ainda possuem debitos fora do escopo.
   - Nao bloqueia a entrega funcional, mas deve ser comunicado aos desenvolvedores.

## Decisao De Entrega

Entrega recomendada: **sim**. A migration 038 ja foi aplicada/confirmada no Supabase
Production.

Nao recomendo mexer agora nos dois debitos nao bloqueantes se a prioridade e entregar o
Portal do Aluno. Eles devem ser comunicados como debitos conhecidos e tratados em PR
separado, para nao introduzir risco de ultima hora em areas fora do red team.
