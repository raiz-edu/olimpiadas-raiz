@AGENTS.md

## PDFs — sempre via conversão para Markdown

Nunca ler `.pdf`/`.PDF` diretamente (custa ~1.5-2k tokens/página como imagem).
Converter primeiro: `bash .claude/scripts/pdf2md.sh "<arquivo.pdf>"` → `Read "<arquivo.md>"`.
Hook `pdf-read-guard.sh` bloqueia leitura direta não convertida. Análise visual
deliberada (layout/slides/PDF escaneado): `PDF_VISUAL=1`. Detalhes: `.claude/rules/pdf-markitdown.md`.

# Contexto do projeto — olimpiadas-raiz

Sistema de gestão de olimpíadas do conhecimento para a rede Raiz Educação.
Next.js App Router + Supabase + Tailwind CSS.

## Padrões obrigatórios

### Clientes Supabase

- **Server Components / Server Actions que precisam bypassar RLS**: `createAdminClient()` de `@/lib/supabase/admin` (service_role)
- **Server Actions que respeitam RLS**: `createServerClient<Database>` de `@supabase/ssr` com cookies
- **Nunca** expor `SUPABASE_SERVICE_ROLE_KEY` em client components

### Auth e permissões

- Verificar sessão: `const session = await getServerSession()` de `@/lib/auth/session`
- Verificar permissão server-side: `can(session.user.role, "recurso:acao")` de `@/lib/auth/roles`
- Verificar permissão no JSX: `<Can role={user.role} perform="recurso:acao">` de `@/components/auth/can`
- Verificar permissão em client component: `useCan("recurso:acao")` de `@/lib/auth/context`
- Roles disponíveis: `raiz` (admins Helio/Hugo), `diretor_marca`, `gestor_conteudo`, `professor`, `coordenador`, `diretor`

### Formulários com Server Actions

- Usar `useActionState(action, null)` — **nunca** `useFormState` (deprecated)
- `isPending` vem do terceiro elemento: `const [state, formAction, isPending] = useActionState(...)`
- `FormField` recebe prop `id` (não `htmlFor`) — o componente aplica `htmlFor` internamente
- Estilos de input: usar `inputClass` e `selectClass` exportados de `@/components/ui/form-field`

### Queries Supabase com joins

- Joins retornam array OU objeto dependendo da cardinalidade — sempre fazer unwrap:
  ```ts
  const turma = Array.isArray(t.turma) ? t.turma[0] : t.turma;
  ```
- Tipar rows de query: `type XRow = NonNullable<typeof data>[number]`

### Filtros de página (URL params)

- Filtros de lista usam `<form method="GET">` — zero JS, funciona sem hidratação
- `searchParams` é Promise no App Router: `const sp = await searchParams`

### View de inscrições

- `v_dashboard_inscricoes` é a fonte pré-joined para tudo que envolve inscrições
- Colunas úteis: `inscricao_id`, `aluno_nome`, `olimpiada_nome`, `olimpiada_id`, `area_conhecimento`, `classificacao`, `ano_letivo`, `marca_nome`, `unidade_nome`, `turma_nome`, `serie`, `status`, `inscrito_em`

## Componentes UI disponíveis

| Componente      | Import                           | Uso                                  |
| --------------- | -------------------------------- | ------------------------------------ |
| `PageHeader`    | `@/components/ui/page-header`    | Título + botão de ação               |
| `EmptyState`    | `@/components/ui/empty-state`    | Lista vazia com ícone + CTA opcional |
| `StatusBadge`   | `@/components/ui/status-badge`   | Badge ativo/inativo                  |
| `Breadcrumbs`   | `@/components/ui/breadcrumbs`    | Trilha de navegação                  |
| `ConfirmButton` | `@/components/ui/confirm-button` | Submit com window.confirm()          |
| `FormField`     | `@/components/ui/form-field`     | Label + input + erro                 |
| `Can`           | `@/components/auth/can`          | Gate de permissão em JSX             |

## Estrutura de rotas protegidas

```
/dashboard          — página inicial pós-login
/analytics          — apenas admin_rede / coord_marca
/unidades           — lista + /nova + /[id]/editar
/turmas             — lista + /nova + /[id]/editar
/alunos             — lista + /novo + /[id]/editar
/olimpiadas         — lista + /nova + /[id] (detalhe) + /[id]/editar
/inscricoes         — lista + /nova
/calendario         — visualização mensal
/resultados         — registro inline por fase
```

## Banco de dados — pontos de atenção

- `turma` **não tem** coluna `turno` — tem `serie` (text) e `ano_letivo` (int4)
- `aluno` **não tem** coluna `matricula` — tem `cpf` (nullable) e `data_nascimento` (not null)
- `inscrever_com_lock(p_aluno_id, p_olimpiada_id, p_user_id)` — função RPC para inscrição segura com advisory lock
- `olimpiada_fase` tem coluna `ordem` (int) para ordenação das fases
- `resultado.tipo` é enum: `aprovado | nao_aprovado | ouro | prata | bronze | mencao_honrosa`
- `inscricao.status` é enum: `pendente | confirmada | cancelada`

## Padrões de tabela

Toda tabela de lista usa:

- `overflow-x-auto rounded-xl border border-gray-200 bg-white` no wrapper
- `w-full min-w-[NNNpx] text-sm` na `<table>`
- Colunas secundárias com `hidden sm:table-cell` ou `hidden md:table-cell`
- `ConfirmButton` em ações destrutivas (Desativar, Cancelar, Remover)

## Padrões de página de edição

Toda página de criação/edição tem:

1. `<Breadcrumbs items={[...]} />` antes do `<PageHeader>`
2. Form card: `<div className="rounded-xl border border-gray-200 bg-white p-6">`
3. Submit button inline com `isPending` de `useActionState`

## Gotchas conhecidos

- `cancelarInscricao` é uma Server Action de argumento simples `(formData: FormData)` — não usar como 2-arg action state
- `parseDateLocal(iso)` para datas — não usar `new Date(iso)` que interpreta como UTC
- Analytics usa `NonNullable<typeof inscricoes>[number]` como tipo base + cast para acesso por índice string

## Economia de Tokens

1. Filtrar output de comandos: testes → só failures (`| grep -B2 -A8 -iE "fail|error" | head -60`); build/install → `| tail -20`. Nunca log bruto no contexto.
2. Grep/Glob ANTES de Read; Read com `offset`/`limit` em arquivo > 500 linhas.
3. Batch de tool calls independentes na mesma mensagem (menos turnos = menos cache-writes).
4. Cache: MCP set fixo no início da sessão (mudar mid-session invalida tudo); nunca trocar modelo mid-session; evitar gaps > 5min em trabalho ativo (TTL do cache).
5. Browser: snapshot de acessibilidade (texto) > screenshot — screenshot só quando pixel importa (ver `browser-localhost.md`).
6. Subagents: passar PATHS (nunca conteúdo inline); exigir síntese de volta, nunca dump.
7. Formato denso: PDF → `.claude/scripts/pdf2md.sh` (ver seção PDFs acima); HTML → markdown via WebFetch.
8. `/context` periodicamente para medir; `/clear` entre tarefas não relacionadas.
