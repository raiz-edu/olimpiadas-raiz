# Guia de Contribuição

## Fluxo de trabalho

1. Crie uma branch: `git checkout -b feat/nome-da-feature`
2. Desenvolva com commits semânticos (`feat:`, `fix:`, `chore:`, etc.)
3. Certifique-se que `npm run typecheck && npm run lint && npm run build` passam
4. Abra um Pull Request para `main`

## Convenções

- **Branches:** `feat/`, `fix/`, `refactor/`, `docs/`, `chore/`
- **Commits:** Conventional Commits — `feat(auth): add login flow`
- **Arquivos:** `PascalCase` para componentes React, `camelCase` para utilitários
- **Imports:** use `@/` para paths absolutos

## Scripts disponíveis

| Script                 | Descrição                                    |
| ---------------------- | -------------------------------------------- |
| `npm run dev`          | Servidor de desenvolvimento (localhost:3000) |
| `npm run build`        | Build de produção                            |
| `npm run typecheck`    | Verificação TypeScript                       |
| `npm run lint`         | ESLint                                       |
| `npm run lint:fix`     | ESLint com auto-fix                          |
| `npm run format`       | Prettier                                     |
| `npm run format:check` | Verificar formatação sem alterar             |

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` — projeto Supabase
- `SUPABASE_SERVICE_ROLE_KEY` — apenas server-side (nunca expor no client)
- `RESEND_API_KEY` — notificações por email
- `NEXT_PUBLIC_SENTRY_DSN` — observabilidade

## Perfis e RLS

O sistema usa Row Level Security no Supabase. Ao escrever queries:

- Nunca use `service_role` no client-side
- Sempre teste os 4 perfis: `admin_rede`, `coord_marca`, `coord_unidade`, `professor`
- Consulte `docs/specs/olimpiadas-spec.md` para a matriz RLS completa
