# Adversarial Review — Olimpíadas SPEC v1.0

**Data:** 2026-05-19
**Reviewer:** ag-adversario (autônomo)
**SPEC reviewed:** [olimpiadas-spec.md](./olimpiadas-spec.md)

---

## Veredicto: **REVISE** (5 issues; nenhum bloqueante)

A SPEC é sólida na arquitetura macro mas tem gaps em edge cases de RBAC, transações concorrentes, e LGPD operacional.

---

## Top 5 formas de quebrar o design

### 1. RBAC de Coord_Marca multi-marca quebra cálculo de "marca atual"

**Cenário:** Coord de Marca tem acesso a 2 marcas (Matriz + Apogeu). Ao criar uma olimpíada, qual marca é "default"? Ao filtrar dashboard "Marca", qual mostra?
**Quebra:** SPEC assume "marca atual" implícita mas não modela seletor. Coord pode criar olimpíada associada à marca errada.
**Fix obrigatório:** Adicionar seletor de "marca ativa" no header (persistido em cookie/session) + Server Action validando `marca_id IN user_marca_ids()`.

### 2. Race condition em limite_vagas

**Cenário:** Olimpíada com 1 vaga restante. 2 coordenadores submetem inscrição no mesmo ms.
**Quebra:** Sem lock pessimista, ambos podem inserir → 2 inscrições para 1 vaga. Trigger BEFORE INSERT contando `SELECT count(*)` é vulnerável.
**Fix obrigatório:** Usar `SELECT ... FOR UPDATE` na linha de `olimpiada` dentro de transação, OU `EXCLUDE` constraint, OU advisory lock por `olimpiada_id`.

### 3. Materialized view fica stale

**Cenário:** Refresh diário do `mv_dashboard_inscricoes`. Inscrições feitas hoje só aparecem amanhã.
**Quebra:** Coord cadastra 50 alunos, abre dashboard, vê "0" → reclama "sistema está quebrado".
**Fix obrigatório:** Refresh ON DEMAND após mutações críticas (trigger AFTER INSERT/UPDATE/DELETE em `inscricao` chama `REFRESH MATERIALIZED VIEW CONCURRENTLY`). Alternativa: usar VIEW normal + índices ao invés de MV.

### 4. Upload de planilha com 10.000 linhas trava

**Cenário:** Marca grande importa toda a base anual de uma vez (10k alunos).
**Quebra:** SPEC promete "100 linhas em <30s" mas não dimensiona para 10k. Timeout Vercel (10s default em hobby, 60s pro).
**Fix obrigatório:** Definir limite máximo (ex: 500 linhas/upload) com mensagem clara, OU implementar processamento async (Supabase Edge Function + status polling).

### 5. LGPD: criança/adolescente sem base legal explícita

**Cenário:** Alunos são menores. CPF, data nascimento, dados de responsável.
**Quebra:** LGPD Art. 14 exige consentimento específico do responsável para tratamento de dados de criança/adolescente. SPEC menciona "DPA com Supabase" mas não modela consentimento.
**Fix obrigatório:** Adicionar `aluno.consentimento_responsavel` (boolean) + `data_consentimento` + `documento_consentimento_url`. Bloqueio de inscrição se consentimento ausente.

---

## Suposições implícitas (declarar ou validar)

1. **"Ano letivo" é gregoriano (Jan-Dez).** E se uma marca operar calendário bianual? SPEC fixa em INT.
2. **Inscrição uma única vez por (olimpiada, aluno).** E re-inscrição após cancelamento? Constraint UNIQUE bloqueia.
3. **Toda marca tem identidade visual.** E se nova marca for criada sem logo? UI quebra?
4. **Coordenador de Marca tem permissão de criar usuários (Coord Unidade, Professor) na sua marca.** SPEC menciona "convite" mas RBAC matrix de criação de usuários não está detalhada.
5. **Aluno só pertence a UMA turma por ano letivo.** E aluno reprovado que volta para turma anterior? Histórico?

---

## Edge cases NÃO cobertos

| #   | Caso                                                                                                      | Severidade       |
| --- | --------------------------------------------------------------------------------------------------------- | ---------------- |
| E1  | Coordenador de Marca é desativado durante o ano — o que acontece com olimpíadas que ele criou?            | Média            |
| E2  | Olimpíada é deletada — cascata para inscrições/resultados (loss of history)                               | Alta             |
| E3  | 2 admins editam a mesma olimpíada simultaneamente — quem ganha?                                           | Média            |
| E4  | Aluno transferido entre marcas (caso raro mas existe) — histórico de inscrições antigas continua visível? | Alta (LGPD)      |
| E5  | Comprovante de resultado contém PII de outras pessoas (foto de grupo)                                     | Média            |
| E6  | Email Resend retorna bounce/erro permanente — UI não atualiza, coord não sabe                             | Média            |
| E7  | Olimpíada com 0 fases cadastradas — onde aparece no calendário?                                           | Baixa            |
| E8  | Reset de senha de Admin Rede — escalation de privilégio?                                                  | Alta (segurança) |
| E9  | Backup/restore: como restaurar 1 marca sem afetar outras?                                                 | Alta (LGPD)      |
| E10 | Auditoria: como Coord Unidade vê histórico de quem editou suas inscrições?                                | Média            |

---

## Recomendações para revisão SPEC v1.1

### Críticas (bloqueia BUILD)

1. Modelar **seletor de marca ativa** para coord_marca multi-marca
2. Resolver **race condition de limite_vagas** com FOR UPDATE ou EXCLUDE
3. Trocar **MV diário por refresh on-demand** ou usar VIEW normal
4. Adicionar **consentimento LGPD** ao schema de `aluno`
5. Definir **limite de linhas por upload** ou processamento async

### Recomendadas (melhoram qualidade)

6. Soft delete cascata (não hard delete) em olimpíada/aluno
7. Optimistic locking via `updated_at` em olimpíada
8. Versionamento de resultado (1 aluno pode ter resultado revisado pelo organizador)
9. Status `arquivado` em vez de só `ativo=false` (semântica)
10. Coluna `email_responsavel_alternativo` para alunos com pais separados

### Nice-to-have (V1.1+)

11. Webhooks para integrações futuras
12. API key de leitura para Power BI/Looker
13. Export incremental (apenas novas inscrições)

---

## Próximos passos

1. ag-especificar-solucao incorpora itens **Críticos #1-#5** na SPEC v1.1
2. ADR-0002 (RLS) adiciona detalhe sobre seletor de marca ativa
3. ADR adicional (ADR-0006) sobre estratégia de refresh de dashboard
4. PRD §4 (out-of-scope) revisitado: confirmar V2 inclui transferência de aluno entre marcas
