# Onboarding — olimpiadas-raiz

Guia de entrada para desenvolvedores(as) que estão chegando ao projeto. Leia isto
antes de tudo; o [README.md](./README.md) tem o detalhe de módulos e o
[CONTRIBUTING.md](./CONTRIBUTING.md) o fluxo de contribuição.

## 1. O que é

Plataforma web **multi-tenant** para gestão de olimpíadas do conhecimento na rede
Raiz Educação (6 marcas, ~50 unidades, ~10 mil alunos). Tem **duas superfícies**:

| Superfície            | Rota base                      | Público                                            | Login                                      |
| --------------------- | ------------------------------ | -------------------------------------------------- | ------------------------------------------ |
| **Sistema de gestão** | `/dashboard`, `/(protected)/*` | Equipe (coordenação, professores, diretores, Raiz) | Google OAuth institucional                 |
| **Portal do aluno**   | `/aluno/*`                     | Alunos                                             | Google (`@alunos.<marca>`) ou e-mail/senha |

## 2. Stack

| Camada             | Tecnologia                                                                      | Observação                                         |
| ------------------ | ------------------------------------------------------------------------------- | -------------------------------------------------- |
| Framework          | **Next.js 16.2** (App Router) + React 19                                        | ⚠️ Versão com _breaking changes_ — ver `AGENTS.md` |
| Linguagem          | TypeScript 5                                                                    | `npm run typecheck`                                |
| Banco + Auth       | **Supabase** (Postgres + RLS)                                                   | Auth via Google OAuth                              |
| Hospedagem / CI-CD | **Vercel**                                                                      | Auto-deploy no merge para `master`; preview por PR |
| UI                 | Tailwind CSS 4 + shadcn + Base UI + lucide-react                                | —                                                  |
| Gráficos           | Recharts 3                                                                      | Dashboards de desempenho                           |
| E-mail             | **Resend**                                                                      | Convites e notificações                            |
| IA                 | **Groq** (`groq-sdk`)                                                           | Avaliação de questões abertas + OCR Vision         |
| Monitoramento      | **Sentry** (`@sentry/nextjs`)                                                   | Erros em produção                                  |
| Qualidade          | ESLint 9, Prettier, **Vitest**, **Playwright**, Husky + lint-staged, secretlint | pre-commit + pre-deploy gate                       |

## 3. Pré-requisitos

- **Node.js 20+** (não há `engines` fixo; use 20 LTS)
- Gerenciador: **npm** (lockfile = `package-lock.json`) — não usar bun/pnpm/yarn
- Acesso a: **GitHub** (repo), **Vercel** (projeto) e **Supabase** (projeto) — ver §8
- Contas para chaves de dev: Google Cloud (OAuth), Groq, Resend, Sentry (opcionais em dev local)

## 4. Variáveis de ambiente

Copie o template e preencha:

```bash
cp .env.example .env.local
```

| Variável                                    | Obrigatória em dev              | Onde obter                                                      |
| ------------------------------------------- | ------------------------------- | --------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`                  | ✅                              | Supabase → Settings → API                                       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`             | ✅                              | Supabase → Settings → API                                       |
| `SUPABASE_SERVICE_ROLE_KEY`                 | ✅                              | Supabase → Settings → API (⚠️ segredo — nunca no client)        |
| `SUPABASE_PAT`                              | ⬜                              | Supabase → Account → Access Tokens (só p/ scripts de migration) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | ✅ (p/ login)                   | Google Cloud Console → Credentials                              |
| `SESSION_SIGNING_SECRET`                    | ✅ (p/ portal aluno)            | gere: `openssl rand -base64 32`                                 |
| `GROQ_API_KEY`                              | ⬜ (só p/ questões abertas/OCR) | console.groq.com/keys                                           |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL`      | ⬜ (só p/ convites)             | resend.com/api-keys                                             |
| `NEXT_PUBLIC_SENTRY_DSN` + `SENTRY_*`       | ⬜                              | sentry.io                                                       |
| `RAIZ_DATA_ENGINE_URL` / `_TOKEN`           | ⬜                              | integração interna Raiz                                         |
| `NEXT_PUBLIC_APP_URL`                       | ✅                              | `http://localhost:3000` em dev                                  |

> Em produção, todas as variáveis vivem nas **env vars da Vercel** (Production +
> Preview + Development) — nunca em arquivo commitado.

## 5. Setup local

```bash
git clone https://github.com/bomhelio/olimpiadas-raiz.git
cd olimpiadas-raiz
npm install
cp .env.example .env.local     # preencher credenciais

# Banco: aplicar migrations + seed no projeto Supabase
#   supabase/migrations/*.sql  (40 arquivos, em ordem cronológica)
#   supabase/seed.sql          (marcas, dados iniciais)
# via Supabase CLI (supabase db push) ou SQL Editor do Dashboard

npm run dev                    # http://localhost:3000
```

Verificação rápida antes de abrir PR:

```bash
npm run typecheck && npm run lint && npm run test
```

## 6. Modelo de permissões (6 roles)

Definido em `lib/auth/roles.ts`. Verificação: `can(role, "recurso:acao")` no servidor,
`useCan("recurso:acao")` / `<Can>` no client.

| Role              | Escopo        | Resumo                                                              |
| ----------------- | ------------- | ------------------------------------------------------------------- |
| `raiz`            | Rede inteira  | Admin total; **único que publica conteúdo** (fila de aprovação)     |
| `diretor_marca`   | 1 marca       | Vê e cria usuários **só da sua marca**                              |
| `gestor_conteudo` | Conteúdo      | Cria questões/simulados/projetos → entram como _aguardando revisão_ |
| `professor`       | Turmas        | Preparação, questões, inscrever alunos                              |
| `coordenador`     | Unidade       | Gestão acadêmica da unidade                                         |
| `diretor`         | Unidade/marca | Leitura ampla                                                       |

> **Fila de aprovação:** conteúdo criado por não-`raiz` entra como `aguardando_revisao`
> e só o `raiz` publica. Aluno nunca vê conteúdo não publicado.

## 7. Fluxo de trabalho (Git + Deploy)

- **Nunca** commit direto em `master` — sempre **feature branch → PR → squash merge**.
- Branch naming: `feat/…`, `fix/…`, `refactor/…`, `docs/…`, `chore/…`.
- Não referenciar "Claude"/"AI" nas mensagens de commit (conventional commits).
- **Vercel** faz deploy automático: PR gera **preview URL**; merge em `master` vai para **produção**.
- O `buildCommand` roda um **pre-deploy gate** (typecheck → lint → test) — build falha aborta o deploy.

## 8. Acessos que o time precisa (3 sistemas separados)

Transferir/entrar no GitHub **não** dá acesso a Vercel nem Supabase. Cada dev precisa de:

1. **GitHub** — colaborador no repo `bomhelio/olimpiadas-raiz` (ou membro da org, se migrado).
2. **Vercel** — Project → Settings → Members (papel _Member_/_Developer_).
3. **Supabase** — Project → Settings → Team (papel _Developer_).

## 9. Nota de segurança (histórico do repo)

- O repositório é **público**. Nenhum `.env` é rastreado e `.gitignore` cobre `.env*`.
- Uma `service_role` legada foi commitada em scripts em commits antigos
  (`b8e1f13`, `0f2a0f5`) e **já foi revogada** no Supabase (JWT Legacy HS256 →
  Revoked; projeto migrou para ECC P-256). O token no histórico está inativo.
- **Regra:** segredos vivem só nas env vars (Vercel/Supabase). Ao rodar scripts em
  `scripts/`, use `process.env` — nunca hardcode chave. O `secretlint` roda no pre-commit.

## 10. Documentação de referência

- [README.md](./README.md) — módulos, tabelas, estrutura de pastas
- [CONTRIBUTING.md](./CONTRIBUTING.md) — guia de contribuição
- [docs/deploy.md](./docs/deploy.md) — deploy Vercel + Supabase
- [AGENTS.md](./AGENTS.md) — aviso sobre a versão do Next.js
- `docs/specs/` — PRDs e SPECs; `docs/adr/` — decisões de arquitetura
