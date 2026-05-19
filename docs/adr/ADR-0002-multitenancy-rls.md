# ADR-0002: Multitenancy via Row Level Security (RLS)

**Status:** Aprovado
**Data:** 2026-05-19

## Contexto

Sistema serve 6 marcas + ~50 unidades + ~200-500 professores. Isolamento de dados entre marcas é requisito não negociável (LGPD + competição interna). Coord de Marca A NÃO pode ler dados da Marca B.

Opções: separação física (1 schema por marca), RLS PostgreSQL, aplicação valida em código.

## Decisão

**Multitenancy lógica via RLS PostgreSQL nativo do Supabase**, com função helper `user_marca_ids()` resolvendo permissões por role.

Toda tabela tenant-scoped tem `ENABLE ROW LEVEL SECURITY` + policies SELECT/INSERT/UPDATE/DELETE alinhadas com role do usuário (admin_rede / coord_marca / coord_unidade / professor).

## Alternativas consideradas

### A. RLS PostgreSQL (escolhida)

- Prós: enforcement no banco (defesa em profundidade), nativo Supabase, policies declarativas e auditáveis, testes em SQL
- Contras: queries complexas exigem políticas pensadas, debug de policies pode ser sutil
- **Escolhida**: alinhamento canonical Supabase, segurança máxima

### B. Validação só em código (Server Actions)

- Prós: lógica em um lugar
- Contras: bug numa rota pula validação inteira; sem defesa em profundidade
- Rejeitada por risco de bypass

### C. Schema por marca

- Prós: isolamento físico total
- Contras: 6+ schemas, migrations 6x mais complexas, joins cross-marca impossíveis (relatórios Rede), não escala para 50+ unidades
- Rejeitada por complexidade operacional

## Consequências

### Positivas

- Mesmo se Server Action tiver bug, RLS bloqueia acesso indevido
- Policies versionadas em migration files (review obrigatório em PR)
- Testes de RLS rodam em CI (matrix role × entidade × ação)

### Negativas

- Queries de admin_rede (cross-marca) precisam ser cuidadosas para usar role correto
- Bypass deliberado (service_role key) só em scripts admin/CI

### Trade-offs aceitos

- Materialized views precisam policy específica (refresh por service_role)
- Performance: RLS adiciona overhead em joins (mitigado por índices)

## Detalhes de implementação

### Helper functions

```sql
CREATE OR REPLACE FUNCTION current_role() RETURNS role_usuario
LANGUAGE sql STABLE AS $$
  SELECT role FROM usuario WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION user_marca_ids() RETURNS uuid[]
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT CASE current_role()
    WHEN 'admin_rede' THEN ARRAY(SELECT id FROM marca)
    WHEN 'coord_marca' THEN ARRAY(SELECT marca_id FROM usuario_marca WHERE usuario_id = auth.uid())
    WHEN 'coord_unidade' THEN ARRAY(
      SELECT DISTINCT u.marca_id FROM usuario_unidade uu
      JOIN unidade u ON u.id = uu.unidade_id WHERE uu.usuario_id = auth.uid()
    )
    WHEN 'professor' THEN ARRAY(
      SELECT DISTINCT u.marca_id FROM usuario_turma ut
      JOIN turma t ON t.id = ut.turma_id
      JOIN unidade u ON u.id = t.unidade_id WHERE ut.usuario_id = auth.uid()
    )
  END
$$;
```

### Matriz RBAC (READ/WRITE por entidade)

| Entidade  | admin_rede | coord_marca         | coord_unidade         | professor             |
| --------- | ---------- | ------------------- | --------------------- | --------------------- |
| marca     | R/W        | R                   | R                     | R                     |
| unidade   | R/W        | R/W (própria marca) | R                     | R                     |
| turma     | R/W        | R/W (própria marca) | R/W (própria unidade) | R                     |
| aluno     | R/W        | R/W (própria marca) | R/W (própria unidade) | R (própria turma)     |
| olimpiada | R/W        | R/W (própria marca) | R                     | R                     |
| inscricao | R/W        | R/W (própria marca) | R/W (própria unidade) | W (própria turma) / R |
| resultado | R/W        | R/W (própria marca) | R/W (própria unidade) | R                     |
| audit_log | R (todos)  | R (própria marca)   | R (própria unidade)   | —                     |

### Testes obrigatórios

- Para cada (role, entidade, ação): cenário pass + cenário fail (cross-marca)
- Rodam em CI antes de merge
- Suite em `tests/integration/rls/`

## Referências

- `supabase:supabase-postgres-best-practices`
- SPEC §3.3
