# Sistema de Gestão de Olimpíadas do Conhecimento — Raiz Educação

> Plataforma web multi-tenant para gestão completa do ciclo de vida de olimpíadas do conhecimento na rede Raiz Educação (6 marcas, ~50 unidades, ~10k alunos).

## Status

| Fase   | Descrição                            | Status        |
| ------ | ------------------------------------ | ------------- |
| F0     | Bootstrap — scaffolding, tooling, CI | ✅ Concluído  |
| F1     | Schema + RLS + Migrations            | ⏳ Próximo    |
| F2-F10 | Auth, módulos, dashboard, docs       | 🔜 Aguardando |

Consulte o [Execution Plan](./docs/plan/olimpiadas-execution-plan.md) para detalhes das 11 fases.

## Desenvolvimento local

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env.local
# Preencher com credenciais Supabase + Resend + Sentry

# 3. Rodar em modo dev
npm run dev
# → http://localhost:3000

# 4. Checar tipagem e lint
npm run typecheck
npm run lint
```

## Documentação

### Produto e arquitetura

- [PRD — Product Requirements](./docs/specs/olimpiadas-prd.md) — problema, personas, escopo, métricas, riscos
- [SPEC — Technical Specification](./docs/specs/olimpiadas-spec.md) — arquitetura, modelo de dados, fluxos, edge cases, critérios de aceite
- [Adversarial Review](./docs/specs/olimpiadas-adversario-review.md) — issues encontrados pelo `ag-adversario`
- [SPEC Addendum v1.1](./docs/specs/olimpiadas-spec-addendum-v1.1.md) — 5 fixes críticos aplicados

### Decisões arquiteturais (ADRs)

- [ADR-0001 — Stack tecnológica](./docs/adr/ADR-0001-stack.md)
- [ADR-0002 — Multitenancy via RLS](./docs/adr/ADR-0002-multitenancy-rls.md)
- [ADR-0003 — Storage de PDFs](./docs/adr/ADR-0003-storage-pdfs.md)
- [ADR-0004 — Export/Import (PDF, Excel, ICS)](./docs/adr/ADR-0004-export-import.md)
- [ADR-0005 — Auth + RBAC + Convite](./docs/adr/ADR-0005-auth-rbac.md)

### Execução

- [Execution Plan](./docs/plan/olimpiadas-execution-plan.md) — 11 PRs, dependências, paralelização, riscos

## Stack

- **Frontend/Backend:** Next.js 15 (App Router) + React 19 + TypeScript
- **UI:** Tailwind CSS + shadcn/ui
- **Database/Auth/Storage:** Supabase (PostgreSQL + RLS)
- **Email:** Resend
- **Deploy:** Vercel
- **Observabilidade:** Sentry

## Perfis

| Perfil           | Escopo      | Volume estimado  |
| ---------------- | ----------- | ---------------- |
| Admin Rede       | Toda a rede | 3-5 usuários     |
| Coord de Marca   | 1+ marcas   | 6-12 usuários    |
| Coord de Unidade | 1 unidade   | 30-50 usuários   |
| Professor/Tutor  | 1+ turmas   | 200-500 usuários |

## Módulos

1. **Catálogo de Olimpíadas** — CRUD multi-marca com regulamento
2. **Calendário** — mensal/anual/lista + exports .ics e PDF + alertas
3. **Modelo de Planilha** — geração .xlsx personalizado por unidade
4. **Gestão de Inscrições** — individual ou lote, com notificação Resend
5. **Registro de Resultados** — por fase, com upload de comprovante
6. **Dashboard** — 4 visões (Rede/Marca/Unidade/Turma) com indicadores

## Decisões pendentes (bloqueiam Fase 0)

Ver [SPEC §10](./docs/specs/olimpiadas-spec.md#10-decisões-pendentes-para-o-usuário):

1. Lista oficial de marcas/unidades para seed
2. CPF obrigatório ou opcional? (PRD diz opcional)
3. Domínio Resend verificado (`noreply@???`)
4. Aluno via Excel inicialmente OK?
5. Tamanho máx de comprovante (5MB OK?)
6. Contas Supabase / Vercel já provisionadas?

## Próximos passos

1. Usuário revisa e aprova PRD + SPEC + ADRs + Plano
2. Responde decisões pendentes
3. `/ag-0-orquestrador docs/plan/olimpiadas-execution-plan.md` → fatia execução em 11 invocações sequenciais
4. Cada fase termina em PR independente com gate de qualidade
