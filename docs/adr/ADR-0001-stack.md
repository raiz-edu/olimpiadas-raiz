# ADR-0001: Stack Tecnológica — Next.js + Supabase + Vercel

**Status:** Aprovado
**Data:** 2026-05-19
**Decisores:** Helio Barbosa (Tech Lead)

## Contexto

Precisamos escolher stack para construir aplicação web multi-tenant para gestão de olimpíadas (6 marcas, ~10k alunos, ~30k inscrições/ano). Requisitos críticos: multitenancy com isolamento de dados, auth com roles, exports PDF/Excel, email transacional, deploy simples, equipe enxuta.

Regra global `stack-enforcement.md` exige "Vercel + Supabase first".

## Decisão

Stack canonical Vercel+Supabase:

- **Frontend/Backend:** Next.js 15 (App Router) + React 19 + TypeScript
- **UI:** Tailwind CSS + shadcn/ui
- **Database/Auth/Storage:** Supabase (PostgreSQL + RLS)
- **Email:** Resend + React Email
- **Deploy:** Vercel
- **Observabilidade:** Sentry

## Alternativas consideradas

### A. Next.js + Supabase + Vercel (escolhida)

- Prós: stack canonical aprovado, deploy 1-click, RLS nativo (multitenancy), free tier generoso, equipe já conhece
- Contras: dependência forte de Supabase (vendor lock-in moderado)
- **Escolhida porque**: alinhamento total com stack-enforcement, RLS resolve multitenancy nativamente, Resend já é canonical

### B. Next.js + Prisma + Neon + NextAuth

- Prós: maior flexibilidade ORM, branching de DB
- Contras: NextAuth fora do canonical, Prisma fora do canonical, mais glue code para RLS
- Rejeitada porque: contraria regras globais de stack

### C. Remix + Supabase

- Prós: framework mais simples em alguns aspectos
- Contras: ecossistema menor, sem App Router/RSC equivalente, Vercel suporta mas não é primeiro-classe
- Rejeitada porque: time conhece Next.js, ecossistema Next maior

## Consequências

### Positivas

- Multitenancy via RLS reduz superfície de bug de autorização
- Vercel preview deploys para cada PR
- shadcn permite customização total sem lock-in
- TypeScript end-to-end (incluindo types do Supabase via codegen)

### Negativas

- Vendor lock-in moderado em Supabase (mitigado: PostgreSQL standard, exportável)
- Vercel pode ficar caro em volume alto (mitigado: free tier suficiente para V1)

### Trade-offs aceitos

- Não usar Prisma (menos DX para queries complexas; ganho: less vendor)
- Não usar NextAuth (Supabase Auth tem menos features mas integra direto com RLS)

## Referências

- `stack-enforcement.md` (regra global)
- `vercel:nextjs`, `supabase:supabase` (skills canonical)
- PRD §3, SPEC §2
