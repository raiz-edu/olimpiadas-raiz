# ADR-0004: Export e Import (PDF, Excel, ICS)

**Status:** Aprovado
**Data:** 2026-05-19

## Contexto

Sistema precisa exportar/importar:

- Excel: modelo de planilha de inscrições + import de inscrições em lote + export de listas/dashboard
- PDF: cronograma do calendário, relatório de dashboard
- ICS: calendário para Google Calendar/Outlook

## Decisão

| Formato             | Lib                   | Modo                   |
| ------------------- | --------------------- | ---------------------- |
| Excel (gen + parse) | `exceljs`             | Server-side, streaming |
| PDF (gen)           | `@react-pdf/renderer` | Server-side, JSX → PDF |
| ICS                 | `ics` (npm)           | Server-side            |

Todos os exports rodam em API routes Next.js com streaming (não bloqueia thread).

## Alternativas consideradas

### Excel

- **A. exceljs (escolhida)**: read+write, formatação, validações; widely used
- B. xlsx (SheetJS): bom mas community edition limitada
- C. node-xlsx: somente write, sem read

### PDF

- **A. @react-pdf/renderer (escolhida)**: JSX declarativo, server-side, sem Chromium
- B. Puppeteer: requer Chromium (Vercel limita), pesado
- C. pdfkit: imperativo, mais difícil de manter

### ICS

- **A. ics (escolhida)**: simples, RFC5545 compliant
- B. ical-generator: alternativa válida, similar

## Consequências

### Positivas

- Sem dependência de Chromium → roda em Vercel serverless sem hack
- PDF como JSX permite componentes reutilizáveis (Header, Table)
- exceljs gera validações inline (`dataValidation`) na planilha modelo

### Negativas

- @react-pdf não suporta CSS Grid (precisamos usar Flex)
- exceljs em arquivos >10MB pode ficar lento (mitigado: limite 500 linhas)

### Trade-offs

- PDF não tem fontes custom por default (mitigado: registrar Inter explicitamente)
- ICS .ics não suporta editing (mas é apenas readonly para clientes)

## Limites operacionais (V1)

- Upload Excel: max 500 linhas, 5MB
- Export Excel dashboard: max 50.000 linhas (paginação se exceder)
- Export PDF dashboard: max 100 páginas
- Export .ics: filtro obrigatório (período ou marca) para evitar arquivos enormes

## Validação da planilha modelo

```typescript
// Geração: planilha tem cabeçalho com {Marca}-{Unidade}-{Olimpíada}
// e dataValidations:
sheet.getColumn("data_nascimento").numFmt = "dd/mm/yyyy";
sheet.dataValidations.add("E2:E1000", {
  type: "list",
  formulae: ['"5º ano,6º ano,7º ano,8º ano,9º ano"'],
  showErrorMessage: true,
  errorTitle: "Série inválida",
});
```

## Referências

- SPEC §4.2, §5.1
