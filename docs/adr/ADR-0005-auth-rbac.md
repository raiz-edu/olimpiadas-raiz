# ADR-0005: Auth + RBAC + Convite de Usuários

**Status:** Aprovado
**Data:** 2026-05-19

## Contexto

Sistema tem 4 perfis (admin_rede, coord_marca, coord_unidade, professor) com escopo hierárquico. Precisamos:

- Login email/senha (PRD §3.7)
- Convite via email (responsável da hierarquia superior convida)
- RBAC enforcement em UI + API + DB (RLS)
- Reset de senha
- Auditoria

## Decisão

**Supabase Auth (email/senha)** + tabela `usuario` extension + fluxo de convite custom + RBAC matrix declarativa em `lib/auth/rbac.ts`.

### Fluxo de convite

1. Usuário superior (ex: admin_rede) cadastra novo coord_marca informando email + role + escopo (marca_ids)
2. Sistema gera token único (expires_at = now() + 7 dias), grava em `convite` table
3. Resend dispara email com link `/aceitar-convite/{token}`
4. Convidado abre link, cadastra senha, é criado em `auth.users` + `usuario` + `usuario_marca`
5. Convite marcado como `aceito_em`

### Schema adicional

```sql
CREATE TABLE convite (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  email text NOT NULL,
  nome text NOT NULL,
  role role_usuario NOT NULL,
  escopo_marca_ids uuid[],
  escopo_unidade_ids uuid[],
  escopo_turma_ids uuid[],
  convidado_por uuid REFERENCES usuario(id),
  expires_at timestamptz NOT NULL,
  aceito_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### RBAC enforcement (3 camadas)

1. **UI**: links/botões escondidos por role via `<Can role="admin_rede">`
2. **API/Server Actions**: validação no início de cada action
3. **DB**: RLS policies (ADR-0002)

Defesa em profundidade: as 3 precisam falhar para vazamento.

### Quem pode convidar quem

| Convida       | admin_rede | coord_marca       | coord_unidade     | professor           |
| ------------- | ---------- | ----------------- | ----------------- | ------------------- |
| admin_rede    | sim        | sim               | sim               | sim                 |
| coord_marca   | não        | sim (mesma marca) | sim (mesma marca) | sim (mesma marca)   |
| coord_unidade | não        | não               | não               | sim (mesma unidade) |
| professor     | não        | não               | não               | não                 |

## Alternativas consideradas

### A. Supabase Auth (escolhida)

- Prós: canonical, integra com RLS via auth.uid(), reset senha incluso
- Contras: customização limitada
- **Escolhida**

### B. Clerk

- Prós: UX mais polida, org/multi-tenancy nativo
- Contras: custo, fora do canonical para single-org no V1
- Rejeitada (regra stack: Clerk só se multi-org externa)

### C. Auth.js / NextAuth

- Prós: flexível
- Contras: fora do canonical, glue code com RLS
- Rejeitada

## Consequências

### Positivas

- auth.uid() flui automático para RLS
- Reset de senha out-of-the-box
- MFA disponível para upgrade futuro

### Negativas

- Convite custom precisa ser implementado (Supabase auth invite tem UX limitada)
- Sessão JWT requer refresh middleware

## Segurança

- Tokens de convite: 32 bytes random, single-use, expira 7 dias
- Senha: mínimo 10 chars, validação client + server
- Rate limit em /login e /aceitar-convite (Vercel WAF ou middleware)
- Audit log em login/logout/password_reset

## Referências

- `vercel:auth`, `supabase:supabase`
- ADR-0002 (RLS)
- SPEC §3.2
