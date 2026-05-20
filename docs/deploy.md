# Guia de Deploy — olimpiadas-raiz

## Visão geral

```
Vercel (Next.js)  ←→  Supabase (Postgres + Auth + Storage)
                  ←→  Resend (email de convite)
```

---

## 1. Supabase — configuração inicial

### 1.1 Criar projeto

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. Anote: **Project URL**, **anon key**, **service_role key**
   - Settings → API → Project API keys

### 1.2 Aplicar migrations

Execute as migrations na ordem no **SQL Editor** do Dashboard (ou via Supabase CLI):

```sql
-- 1. Schema inicial (tabelas, enums, índices)
-- Conteúdo: supabase/migrations/20260519_001_schema_inicial.sql

-- 2. RLS policies
-- Conteúdo: supabase/migrations/20260519_002_rls_policies.sql

-- 3. Funções e triggers
-- Conteúdo: supabase/migrations/20260519_003_functions_triggers.sql
```

Ou via CLI:

```bash
supabase db push
```

### 1.3 Aplicar seed (dados iniciais)

```sql
-- Conteúdo: supabase/seed.sql
-- Contém: marcas, configurações base
```

### 1.4 Criar primeiro usuário admin

Após o deploy, crie o primeiro usuário manualmente:

```sql
-- 1. Criar usuário pelo Supabase Auth (Authentication → Users → Invite user)
-- 2. Inserir na tabela usuario com role admin_rede
INSERT INTO usuario (id, email, nome, role)
VALUES (
  '<uuid-do-auth-user>',
  'admin@raizeducacao.com.br',
  'Administrador',
  'admin_rede'
);
```

---

## 2. Resend — email de convite

1. Acesse [resend.com](https://resend.com) e crie uma conta
2. Crie uma API key
3. Verifique o domínio de envio (ex: `noreply@raizeducacao.com.br`)
4. Anote: **API Key**, **email remetente**

---

## 3. Vercel — deploy

### 3.1 Conectar repositório

1. Acesse [vercel.com](https://vercel.com) → New Project
2. Importe o repositório GitHub
3. Framework: **Next.js** (detectado automaticamente)

### 3.2 Variáveis de ambiente

Configure no painel Vercel (Settings → Environment Variables) para **Production** e **Preview**:

| Variável                        | Descrição                          | Obrigatória |
| ------------------------------- | ---------------------------------- | ----------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | URL do projeto Supabase            | ✅          |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima Supabase             | ✅          |
| `SUPABASE_SERVICE_ROLE_KEY`     | Chave service role (apenas server) | ✅          |
| `RESEND_API_KEY`                | Chave da API Resend                | Para email  |
| `RESEND_FROM_EMAIL`             | Email remetente verificado         | Para email  |
| `NEXT_PUBLIC_APP_URL`           | URL pública da aplicação           | ✅          |
| `NEXT_PUBLIC_SENTRY_DSN`        | DSN do Sentry                      | Opcional    |
| `SENTRY_AUTH_TOKEN`             | Token de autenticação Sentry       | Opcional    |

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` nunca deve ser prefixada com `NEXT_PUBLIC_` — ela só existe no servidor.

### 3.3 Deploy

```bash
# Opção 1: via Git (recomendado)
git push origin main
# → Vercel detecta o push e faz deploy automático

# Opção 2: via CLI
vercel --prod
```

### 3.4 Configurar domínio (opcional)

Settings → Domains → Add Domain

---

## 4. Supabase — configurar Auth redirect URLs

Após ter a URL de produção, configure no Supabase:

- Authentication → URL Configuration
- **Site URL**: `https://seu-dominio.vercel.app`
- **Redirect URLs**: `https://seu-dominio.vercel.app/**`

---

## 5. Verificação pós-deploy

Checklist após o primeiro deploy:

- [ ] Login funciona (`/login`)
- [ ] Dashboard carrega sem erros
- [ ] Criar unidade → aparece na lista
- [ ] Criar turma → aparece vinculada à unidade
- [ ] Criar aluno → aparece na lista
- [ ] Criar olimpíada → aparece no catálogo
- [ ] Inscrever aluno → status pendente aparece
- [ ] Confirmar inscrição → status muda para confirmada
- [ ] Calendário exibe fases
- [ ] Resultados — registrar para uma fase
- [ ] Analytics → carrega gráficos (como admin_rede)
- [ ] Email de convite enviado (se Resend configurado)

---

## 6. Rollback

```bash
# Via Vercel CLI
vercel rollback

# Via Dashboard: Deployments → escolher deploy anterior → Promote to Production
```

---

## 7. Manutenção

### Migrations futuras

Sempre aplicar migrations em desenvolvimento antes de produção:

```bash
# 1. Aplicar em dev/staging
supabase db push --project-ref <dev-project-ref>

# 2. Testar
# 3. Aplicar em produção
supabase db push --project-ref <prod-project-ref>
```

### Rollback de migration

Cada migration tem um arquivo `_down.sql` correspondente em `supabase/migrations/`.
