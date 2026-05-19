# PRD: Sistema de Gestão de Olimpíadas do Conhecimento — Raiz Educação

**Data:** 2026-05-19
**Autor:** Helio Barbosa (helio.barbosa@matrizeducacao.com.br)
**Status:** Draft (aguarda aprovação)
**Sponsor:** Raiz Educação — Holding
**Versão:** 1.0

---

## 1. Problema

Atualmente a gestão de olimpíadas do conhecimento na rede Raiz Educação acontece de forma descentralizada e manual:

- **Catálogo disperso**: cada marca/unidade mantém sua própria lista (planilhas Excel locais, PDFs em emails). Não há fonte única de verdade sobre quais olimpíadas estão ativas, prazos, regulamentos.
- **Calendário não compartilhado**: prazos de inscrição são perdidos porque cada unidade descobre tarde. Não há alerta de prazo próximo.
- **Inscrições em planilhas livres**: cada unidade monta sua planilha à mão, com campos diferentes, sem validação. Importar resultados depois é um pesadelo.
- **Resultados sem consolidação**: medalhas e aprovações ficam em pastas locais. A rede não consegue medir desempenho por marca, unidade ou área de conhecimento.
- **Sem indicadores estratégicos**: a direção da rede não enxerga ranking de marcas/unidades, evolução histórica, ou áreas em que a rede tem força/fraqueza.

**Custo atual:**

- Inscrições perdidas por prazo (estimativa: 15-20% das oportunidades).
- Retrabalho de coordenadores juntando planilhas (estimativa: 4-6h/mês por unidade).
- Decisões estratégicas sem dado consolidado (orçamento de incentivo a olimpíadas é alocado por intuição).

---

## 2. Personas

### 2.1 Admin Rede (Raiz Educação)

- **Quem:** diretoria pedagógica + coordenação estratégica da holding
- **Volume:** ~3-5 usuários
- **Frequência:** acesso semanal, deep-dive mensal para reunião de board
- **Necessidade primária:** dashboard consolidado, ranking marcas, decisão de investimento

### 2.2 Coordenador de Marca

- **Quem:** coordenador pedagógico de cada uma das 6 marcas (Apogeu, Matriz, QI Bilíngue, União, Unificado, Americano)
- **Volume:** ~6-12 usuários (alguns com 2+ marcas)
- **Frequência:** acesso semanal, intenso em períodos de inscrição
- **Necessidade primária:** gerir catálogo da marca, ver inscrições/resultados de todas suas unidades, dashboard da marca

### 2.3 Coordenador de Unidade

- **Quem:** coordenador pedagógico de cada unidade física
- **Volume:** estimativa de 30-50 unidades na rede → 30-50 usuários
- **Frequência:** acesso semanal, alto durante inscrições
- **Necessidade primária:** operar inscrições da unidade, registrar resultados, ver dashboard local

### 2.4 Professor/Tutor

- **Quem:** professores/tutores responsáveis por turmas
- **Volume:** ~200-500 usuários (maior grupo)
- **Frequência:** acesso pontual (períodos de inscrição), consulta de calendário
- **Necessidade primária:** consultar olimpíadas disponíveis, inscrever alunos da sua turma

---

## 3. Escopo (IN)

### 3.1 Catálogo de Olimpíadas

- CRUD completo de olimpíadas com campos especificados
- Multi-marca (1 olimpíada pode ser aplicável a N marcas)
- Upload de regulamento (PDF) via Supabase Storage
- Rich text para descrição/características
- Filtros e busca

### 3.2 Calendário

- Visualização mensal e anual
- Visualização em lista
- Filtros: marca, área, tipo (obrigatória/facultativa)
- Marcação visual de fases (inscrição, prova, resultado)
- Alerta de prazo (≤ 15 dias) no dashboard e por email
- Exportação PDF (cronograma) e .ics (Google Calendar / Outlook)

### 3.3 Modelo de Planilha de Inscrições

- Geração de .xlsx personalizada por unidade (cabeçalho com marca, unidade, olimpíada)
- Validações inline na planilha (data de nascimento, série/turma, CPF se preenchido)
- Importação em lote com relatório de erros
- Exportação da lista atual de inscritos

### 3.4 Gestão de Inscrições

- Inscrição individual (form)
- Inscrição em lote (upload .xlsx)
- Status: Pendente / Confirmada / Cancelada
- Histórico por aluno
- Limite de vagas configurável por olimpíada
- Notificação email (Resend) ao responsável a cada mudança de status

### 3.5 Registro de Resultados

- Lançamento por olimpíada e fase
- Status do resultado: Aprovado / Não aprovado / Ouro / Prata / Bronze / Menção Honrosa
- Upload de comprovante (certificado PDF/imagem)
- Histórico completo por aluno

### 3.6 Dashboard de Indicadores

- 4 visões hierárquicas: Rede → Marca → Unidade → Turma
- Indicadores:
  - Total de inscritos no período
  - Olimpíadas ativas
  - Distribuição de inscrições por área (%)
  - Proporção obrigatórias vs facultativas
  - Resultados por fase (funnel)
  - Ranking de marcas (por medalhas, por participação)
  - Ranking de unidades
  - Evolução histórica (séries temporais)
- Filtros: período, marca, unidade, área, tipo
- Exportação PDF e Excel

### 3.7 Autenticação e Autorização

- Supabase Auth (email/senha)
- 4 roles com permissões hierárquicas
- RLS PostgreSQL garantindo isolamento por marca/unidade
- Convite de usuários via email (Resend)

---

## 4. Fora de escopo (OUT)

- **App mobile nativo** — apenas web responsiva (desktop + tablet)
- **SSO / OAuth Google/Microsoft** — V2 (apenas email/senha no V1)
- **Inscrição direta de aluno/responsável** — apenas via coordenador/professor no V1
- **Pagamentos de inscrição** — fora do escopo (olimpíadas pagas ficam apenas com link externo)
- **Chat interno / comunicação** — V2
- **Integração com sistema acadêmico (TOTVS/RM)** — V2; no V1, alunos são cadastrados manualmente ou importados via planilha
- **Geração automática de certificado** — V1 apenas armazena upload de comprovante
- **Multilíngue (i18n)** — apenas pt-BR no V1
- **API pública para integrações de terceiros** — V2

---

## 5. Métricas de sucesso

| KPI                                 | Baseline (hoje)      | Target (6 meses pós-launch)            | Como medir                                                    |
| ----------------------------------- | -------------------- | -------------------------------------- | ------------------------------------------------------------- |
| Cobertura de olimpíadas catalogadas | ~30% (estimativa)    | ≥ 90%                                  | Contagem manual vs cadastros no sistema                       |
| Inscrições perdidas por prazo       | 15-20% (estimativa)  | < 5%                                   | Survey trimestral com coordenadores                           |
| Tempo de consolidação de resultados | 2-3 semanas          | < 48h                                  | Diferença entre data da prova e data de lançamento no sistema |
| Adoção por coordenadores            | 0%                   | ≥ 80% MAU                              | Login mensal único / total de coordenadores cadastrados       |
| Decisões com dado consolidado       | 0 reuniões/trimestre | ≥ 1 reunião/trimestre usando dashboard | Ata de reunião de board mencionando o dashboard               |
| NPS interno                         | n/a                  | ≥ 40                                   | Survey pós-uso (3 meses, 6 meses)                             |

---

## 6. Riscos e dependências

| Risco                                          | Probabilidade | Impacto               | Mitigação                                                              |
| ---------------------------------------------- | ------------- | --------------------- | ---------------------------------------------------------------------- |
| RLS mal configurado vaza dados entre marcas    | Média         | Alto (incidente LGPD) | ag-verificar-seguranca obrigatório + testes de RLS em CI               |
| Adoção baixa por coordenadores (resistência)   | Média         | Alto                  | Onboarding presencial por marca + champions + UX simplificada          |
| Upload de planilha com encoding/formato errado | Alta          | Médio                 | Validação rigorosa + template pre-built + mensagens de erro claras     |
| Volume de emails Resend excede free tier       | Baixa         | Baixo                 | Monitorar volume, plano pago se necessário (~3000/mês)                 |
| LGPD: dados de menores (alunos)                | Alta          | Alto                  | DPA, base legal documentada, mascaramento PII em logs, retenção 5 anos |
| Performance do dashboard com volume alto       | Média         | Médio                 | Materialized views + cache no Supabase, paginação em listas            |

### Dependências

- Lista oficial das 6 marcas + identidade visual (logos, cores)
- Lista de unidades por marca
- Conta Vercel + Supabase + Resend provisionadas
- Domínio (ex: olimpiadas.raizeducacao.com.br) e DNS configurado
- DPA e política de privacidade revisados pelo jurídico

---

## 7. Premissas

- Cada aluno pertence a **uma única turma** (a turma identifica unidade e marca).
- Olimpíadas seguem fases lineares (1ª fase → 2ª fase → final). Fora de escopo: olimpíadas com fluxos complexos (eliminatórias regionais simultâneas).
- Coordenador de Marca pode ter acesso a múltiplas marcas (raro mas existe).
- Volume estimado: ~10.000 alunos na rede, ~50 olimpíadas ativas/ano, ~30.000 inscrições/ano.
- Resultado pode ser registrado mesmo após a fase encerrada (admin pode editar histórico).

---

## 8. Roadmap macro (alta-nível)

- **V1.0** (este escopo): 6 módulos + auth + RLS + dashboard básico
- **V1.1** (3 meses pós-launch): refinos de UX, alertas adicionais, melhorias de dashboard
- **V2.0** (6-12 meses): integração TOTVS, inscrição pelo responsável, certificado auto-gerado, mobile app

---

## 9. Aprovação

| Stakeholder             | Papel     | Status   |
| ----------------------- | --------- | -------- |
| Diretoria Pedagógica    | Sponsor   | Pendente |
| Coordenação Estratégica | Sponsor   | Pendente |
| Jurídico (LGPD)         | Aprovador | Pendente |
| TI/Infraestrutura       | Aprovador | Pendente |
