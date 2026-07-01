# Sistema de Gestão de Olimpíadas do Conhecimento — Raiz Educação

> Plataforma web multi-tenant para gestão completa do ciclo de vida de olimpíadas do conhecimento na rede Raiz Educação (6 marcas, ~50 unidades, ~10 mil alunos).

## Status do projeto

| Fase  | Descrição                                            | Status      |
| ----- | ---------------------------------------------------- | ----------- |
| F1–F2 | Setup, schema Supabase, Auth + RBAC                  | ✅ Entregue |
| F3    | CRUD Unidades / Turmas / Alunos                      | ✅ Entregue |
| F4    | Catálogo de Olimpíadas + Fases                       | ✅ Entregue |
| F5    | Inscrições (inscrever_com_lock, confirmar, cancelar) | ✅ Entregue |
| F6    | Calendário mensal com filtros                        | ✅ Entregue |
| F7    | Registro de Resultados por fase                      | ✅ Entregue |
| F8    | Dashboard analítico + Analytics                      | ✅ Entregue |
| F9    | UX Polish (breadcrumbs, confirmação, scroll mobile)  | ✅ Entregue |
| F10   | Documentação + Launch                                | ✅ Entregue |

## Stack

| Camada         | Tecnologia                                        |
| -------------- | ------------------------------------------------- |
| Framework      | Next.js 16.2 (App Router) + React 19 + TypeScript |
| UI             | Tailwind CSS 4 + shadcn + Base UI + lucide-react  |
| Gráficos       | Recharts                                          |
| Banco de dados | Supabase PostgreSQL + RLS                         |
| Auth           | Google OAuth (staff + alunos) + RBAC customizado  |
| Email          | Resend                                            |
| IA             | Groq (avaliação de questões abertas + OCR Vision) |
| Monitoramento  | Sentry                                            |
| Deploy         | Vercel (auto-deploy no merge para `master`)       |

> Nova pessoa no time? Comece pelo [ONBOARDING.md](./ONBOARDING.md).

## Pré-requisitos

- Node.js 20+
- Conta Supabase com projeto criado
- Conta Resend (opcional para email de convite)

## Setup local

```bash
# 1. Clonar e instalar dependências
git clone <repo>
cd olimpiadas-raiz
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env.local
# Editar .env.local com credenciais do projeto Supabase

# 3. Aplicar migrations no Supabase
# (via Supabase CLI ou Dashboard SQL editor)
# supabase/migrations/20260519_001_schema_inicial.sql
# supabase/migrations/20260519_002_rls_policies.sql
# supabase/migrations/20260519_003_functions_triggers.sql

# 4. Aplicar seed (marcas, dados iniciais)
# supabase/seed.sql

# 5. Rodar em modo dev
npm run dev
# → http://localhost:3000
```

## Scripts

| Comando             | Descrição                                |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | Servidor de desenvolvimento (porta 3000) |
| `npm run build`     | Build de produção                        |
| `npm run typecheck` | Verificação TypeScript sem compilar      |
| `npm run lint`      | ESLint                                   |
| `npm run lint:fix`  | ESLint com auto-fix                      |
| `npm run test`      | Testes unitários (Vitest)                |
| `npm run format`    | Prettier                                 |

## Módulos implementados

### Unidades, Turmas e Alunos

Gerenciamento da estrutura organizacional da rede. Suporta múltiplas marcas com isolamento por RLS.

### Olimpíadas

Catálogo com área do conhecimento, classificação (obrigatória/facultativa), fases ordenadas (inscrição, prova_1, prova_2, final, divulgação) e vínculo com marcas.

### Inscrições

Inscrição de alunos em olimpíadas com controle de concorrência via `inscrever_com_lock` (função PostgreSQL com advisory lock). Fluxo: pendente → confirmada | cancelada.

### Calendário

Visualização mensal de fases de olimpíadas com filtros por área e marca. Navegação por ano via query param.

### Resultados

Registro inline de resultados por aluno e fase. Tipos: aprovado, nao_aprovado, ouro, prata, bronze, mencao_honrosa. Barra de progresso mostrando X de Y registrados.

### Dashboard & Analytics

- **Dashboard** — KPIs do ano corrente, breakdowns por status/olimpíada/marca
- **Analytics** — visão consolidada com seletor de ano, gráfico de inscrições por mês, breakdowns completos (apenas para `admin_rede` / `coord_marca`)

## Perfis e permissões

| Perfil            | Escopo        | Permissões-chave                                                    |
| ----------------- | ------------- | ------------------------------------------------------------------- |
| `raiz`            | Rede inteira  | Admin total; **único que publica conteúdo** (fila de aprovação)     |
| `diretor_marca`   | 1 marca       | Vê e cria usuários **apenas da sua marca**                          |
| `gestor_conteudo` | Conteúdo      | Cria questões/simulados/projetos → entram como _aguardando revisão_ |
| `professor`       | Turmas        | Preparação, questões, inscrever alunos                              |
| `coordenador`     | Unidade       | Gestão acadêmica da unidade                                         |
| `diretor`         | Unidade/marca | Leitura ampla                                                       |

Conteúdo criado por não-`raiz` entra como `aguardando_revisao` e só o `raiz` publica;
o aluno nunca vê conteúdo não publicado. A matriz completa está em `lib/auth/roles.ts`.

## Estrutura de arquivos relevante

```
app/
  (protected)/          # Rotas autenticadas
    dashboard/          # Página inicial pós-login
    analytics/          # Analytics (admin/coord_marca)
    unidades/           # CRUD unidades
    turmas/             # CRUD turmas
    alunos/             # CRUD alunos
    olimpiadas/         # Catálogo + detalhe + fases
    inscricoes/         # Lista + nova inscrição
    calendario/         # Calendário mensal
    resultados/         # Registro de resultados
  login/                # Página de login
  aceitar-convite/      # Aceite de convite por email

components/
  auth/                 # <Can>, LoginForm, LogoutButton
  layout/               # Sidebar com navegação
  ui/                   # Breadcrumbs, EmptyState, ConfirmButton,
                        # FormField, PageHeader, StatusBadge

lib/
  auth/                 # session, roles, context
  supabase/             # admin (service_role), middleware
  types/                # database.ts (gerado pelo Supabase)

supabase/
  migrations/           # 3 migrations: schema, RLS, funções
  seed.sql              # Dados iniciais (marcas, unidades)
```

## Banco de dados — tabelas principais

| Tabela                   | Descrição                        |
| ------------------------ | -------------------------------- |
| `marca`                  | Marcas da rede (Qi, Sá Pereira…) |
| `unidade`                | Unidades de ensino por marca     |
| `turma`                  | Turmas por unidade               |
| `aluno`                  | Alunos por turma                 |
| `usuario`                | Usuários do sistema com role     |
| `olimpiada`              | Olimpíadas com metadados         |
| `olimpiada_fase`         | Fases ordenadas por olimpíada    |
| `olimpiada_marca`        | Vínculo M:N olimpíada ↔ marca    |
| `inscricao`              | Inscrição aluno ↔ olimpíada      |
| `resultado`              | Resultado por inscrição e fase   |
| `v_dashboard_inscricoes` | View pré-joined para dashboards  |

## Segurança

- **RLS ativo** em todas as tabelas — usuários só veem dados da sua marca/unidade
- **Service Role** (`createAdminClient`) usado apenas em Server Components/Actions — nunca exposto ao client
- **Headers de segurança** configurados em `next.config.ts` (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- **Lock de concorrência** via `pg_advisory_xact_lock` na função `inscrever_com_lock`

## Deploy

Ver [docs/deploy.md](./docs/deploy.md) para o guia completo (Vercel + Supabase).

## Documentação técnica

- [PRD](./docs/specs/olimpiadas-prd.md) — requisitos de produto
- [SPEC](./docs/specs/olimpiadas-spec.md) — especificação técnica
- [ADR-0001](./docs/adr/ADR-0001-stack.md) — decisão de stack
- [ADR-0002](./docs/adr/ADR-0002-multitenancy-rls.md) — multitenancy via RLS
- [ADR-0005](./docs/adr/ADR-0005-auth-rbac.md) — Auth + RBAC
- [CONTRIBUTING.md](./CONTRIBUTING.md) — guia de contribuição
