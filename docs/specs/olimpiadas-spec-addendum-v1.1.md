# SPEC Addendum v1.1 — Fixes do Adversarial Review

**Aplica sobre:** [olimpiadas-spec.md](./olimpiadas-spec.md)
**Origem:** [olimpiadas-adversario-review.md](./olimpiadas-adversario-review.md) — 5 issues críticos
**Status:** Incorporado à SPEC oficial

---

## Fix A1 — Seletor de marca ativa (multi-marca)

### Mudança no schema

```sql
-- Tabela já existe (usuario_marca). Adicionar:
ALTER TABLE usuario ADD COLUMN marca_ativa_id uuid REFERENCES marca(id);
-- Default: primeira marca do usuario_marca.
```

### Mudança no fluxo UI

- Header global: dropdown "Marca" para coord_marca com 2+ marcas. Persistido em `usuario.marca_ativa_id`.
- Server Actions de CREATE de olimpíada usam `usuario.marca_ativa_id` como default em `olimpiada_marca`.
- Dashboard "Marca" usa marca_ativa por default; pode trocar via dropdown.

### Validação

Toda Server Action que escreve em entidade marca-scoped valida:

```typescript
if (!user_marca_ids.includes(input.marca_id)) throw new ForbiddenError();
```

---

## Fix A2 — Race condition em limite_vagas

### Estratégia: advisory lock + transação

```typescript
async function inscrever(olimpiadaId: string, alunoId: string) {
  return supabase.rpc("inscrever_com_lock", {
    p_olimpiada_id: olimpiadaId,
    p_aluno_id: alunoId,
    p_usuario_id: currentUser.id,
  });
}
```

```sql
CREATE OR REPLACE FUNCTION inscrever_com_lock(
  p_olimpiada_id uuid, p_aluno_id uuid, p_usuario_id uuid
) RETURNS uuid
LANGUAGE plpgsql AS $$
DECLARE
  v_limite int;
  v_atual int;
  v_inscricao_id uuid;
BEGIN
  -- Lock pessimista sobre a olimpíada (advisory por hash do uuid)
  PERFORM pg_advisory_xact_lock(hashtext(p_olimpiada_id::text));

  SELECT limite_vagas_total INTO v_limite FROM olimpiada WHERE id = p_olimpiada_id;

  IF v_limite IS NOT NULL THEN
    SELECT count(*) INTO v_atual
    FROM inscricao
    WHERE olimpiada_id = p_olimpiada_id AND status IN ('pendente', 'confirmada');
    IF v_atual >= v_limite THEN
      RAISE EXCEPTION 'LIMITE_VAGAS_ATINGIDO' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  INSERT INTO inscricao (olimpiada_id, aluno_id, inscrito_por)
  VALUES (p_olimpiada_id, p_aluno_id, p_usuario_id)
  RETURNING id INTO v_inscricao_id;

  RETURN v_inscricao_id;
END;
$$;
```

### UI

Captura erro `LIMITE_VAGAS_ATINGIDO` → mostra alerta amigável.

---

## Fix A3 — Refresh on-demand da Materialized View

### Estratégia

Substituir refresh diário cron por refresh on-demand via trigger pg_notify + worker, OU usar VIEW normal com índices nas tabelas-fonte.

**Decisão:** VIEW normal (mais simples para V1).

```sql
-- Substituir CREATE MATERIALIZED VIEW por VIEW
DROP MATERIALIZED VIEW IF EXISTS mv_dashboard_inscricoes;

CREATE VIEW v_dashboard_inscricoes AS
SELECT
  i.id AS inscricao_id,
  o.id AS olimpiada_id, o.nome AS olimpiada_nome, o.area_conhecimento, o.classificacao,
  m.id AS marca_id, m.nome AS marca_nome,
  u.id AS unidade_id, u.nome AS unidade_nome,
  t.id AS turma_id, t.serie,
  a.id AS aluno_id, a.nome AS aluno_nome,
  i.status, i.inscrito_em,
  o.ano_letivo
FROM inscricao i
JOIN aluno a ON a.id = i.aluno_id
JOIN turma t ON t.id = a.turma_id
JOIN unidade u ON u.id = t.unidade_id
JOIN marca m ON m.id = u.marca_id
JOIN olimpiada o ON o.id = i.olimpiada_id;
```

Índices já existentes em `inscricao(olimpiada_id)`, `aluno(turma_id)`, `unidade(marca_id)` cobrem JOIN.

**Reavaliação V1.1:** se dashboard ficar >3s com volume real, migrar para MV com refresh on-demand.

---

## Fix A4 — Limite de upload em lote

### Estratégia: limite + processamento async para volumes grandes

**V1:** limite hard de **500 linhas por upload**. Mensagem clara: _"Para volumes maiores, divida em múltiplos uploads ou contate suporte."_

```typescript
const MAX_LINHAS_UPLOAD = 500;
if (linhas.length > MAX_LINHAS_UPLOAD) {
  return { erro: `Máximo ${MAX_LINHAS_UPLOAD} linhas por upload. Divida o arquivo.` };
}
```

**V2 (futuro):** Supabase Edge Function processa async com fila + status polling.

---

## Fix A5 — Consentimento LGPD para alunos (menores)

### Schema

```sql
ALTER TABLE aluno
  ADD COLUMN consentimento_responsavel boolean NOT NULL DEFAULT false,
  ADD COLUMN consentimento_data timestamptz,
  ADD COLUMN consentimento_documento_url text,
  ADD COLUMN consentimento_responsavel_nome text,
  ADD COLUMN consentimento_responsavel_documento text;
```

### Regra de negócio

- Inscrição **bloqueada** se `consentimento_responsavel = false`.
- UI exibe banner no perfil do aluno: _"Cadastre o consentimento LGPD do responsável antes de inscrever em olimpíadas."_
- Form de aluno: campo upload do termo assinado (PDF/imagem) → Supabase Storage bucket `consentimentos` (private, signed URLs).
- Política de retenção: documento mantido por 5 anos após desligamento do aluno; depois anonimizado.

### Trigger

```sql
CREATE OR REPLACE FUNCTION check_consentimento_inscricao()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT (SELECT consentimento_responsavel FROM aluno WHERE id = NEW.aluno_id) THEN
    RAISE EXCEPTION 'CONSENTIMENTO_LGPD_AUSENTE' USING ERRCODE = 'P0002';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_inscricao_consentimento
BEFORE INSERT ON inscricao
FOR EACH ROW EXECUTE FUNCTION check_consentimento_inscricao();
```

---

## Critérios de aceite adicionais

- [ ] Coord_Marca com 2 marcas vê dropdown de "Marca ativa" no header
- [ ] Mudança de marca ativa é persistida entre sessões
- [ ] Inscrição concorrente (2 simultâneas na última vaga) → apenas 1 sucede
- [ ] Dashboard reflete inscrição criada nos últimos 5s
- [ ] Upload >500 linhas é rejeitado com mensagem clara
- [ ] Inscrição sem consentimento LGPD é bloqueada
- [ ] Auditoria registra captura de consentimento (audit_log)
