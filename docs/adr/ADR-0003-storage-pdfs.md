# ADR-0003: Storage de PDFs (Regulamentos, Comprovantes, Consentimentos)

**Status:** Aprovado
**Data:** 2026-05-19

## Contexto

Sistema armazena: regulamentos de olimpíadas (PDF público por escopo), comprovantes de resultados (PDF/imagem por aluno), termos de consentimento LGPD (PDF privado).

Volumes estimados: ~50 regulamentos/ano × 2MB, ~5000 comprovantes/ano × 1MB, ~10000 consentimentos × 0.5MB → total ~15GB/ano.

## Decisão

**Supabase Storage** com 3 buckets segregados por sensibilidade:

| Bucket           | Sensibilidade       | Acesso                      | Conteúdo                           |
| ---------------- | ------------------- | --------------------------- | ---------------------------------- |
| `regulamentos`   | Pública por escopo  | Signed URL 1h               | PDFs de regulamento das olimpíadas |
| `comprovantes`   | Privado             | Signed URL 5min             | Certificados de resultado          |
| `consentimentos` | Confidencial (LGPD) | Signed URL 1min + audit log | Termos de consentimento de menores |

Policies RLS aplicadas a `storage.objects` espelham permissões das tabelas relacionadas.

## Alternativas consideradas

### A. Supabase Storage (escolhida)

- Prós: integrado, RLS no storage, signed URLs, canonical
- Contras: limites de upload (50MB/file no plano free)
- **Escolhida**: alinhamento total stack, volume cabe folgado

### B. Vercel Blob

- Prós: integração Vercel
- Contras: sem RLS nativo, complica auth granular
- Rejeitada por falta de RLS

### C. S3 + CloudFront

- Prós: maduro, barato em escala
- Contras: complexidade ops, fora do canonical
- Rejeitada por complexidade

## Consequências

### Positivas

- LGPD audit: cada acesso a `consentimentos` é logado
- Signed URLs evitam vazamento (sem URL eterna)
- RLS no storage: bug em app não vaza arquivos

### Negativas

- Limite de 50MB/upload (mitigado: regulamentos raros excedem)
- Custo cresce com volume (~$0.021/GB/mês)

## Implementação

### Validação de upload

```typescript
const MAX_SIZE_REGULAMENTO = 10 * 1024 * 1024; // 10MB
const MAX_SIZE_COMPROVANTE = 5 * 1024 * 1024; // 5MB
const MAX_SIZE_CONSENTIMENTO = 5 * 1024 * 1024;

const ALLOWED_TYPES_REGULAMENTO = ["application/pdf"];
const ALLOWED_TYPES_COMPROVANTE = ["application/pdf", "image/jpeg", "image/png"];
const ALLOWED_TYPES_CONSENTIMENTO = ["application/pdf", "image/jpeg", "image/png"];
```

### Naming convention

- `regulamentos/{ano_letivo}/{olimpiada_id}/{filename}`
- `comprovantes/{ano_letivo}/{marca_id}/{inscricao_id}/{filename}`
- `consentimentos/{aluno_id}/{timestamp}-{filename}`

### Anti-virus

Ativar Supabase Storage AV scan (built-in) para todos os buckets.

## Referências

- `supabase:supabase`
- SPEC §3, addendum A5
