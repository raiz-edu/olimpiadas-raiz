/**
 * Geração local de docs para preview — sem servidor, sem auth.
 * Uso: bun run scripts/gen-preview-docs.ts
 * Saída: ./preview-docs/
 */

import fs from "fs";
import pathModule from "path";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  WidthType,
  BorderStyle,
  ShadingType,
  convertInchesToTwip,
  LevelFormat,
  ImageRun,
} from "docx";
import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

// ─── Supabase ────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY)
  throw new Error("NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios no .env.local");

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ─── Logo ────────────────────────────────────────────────────────────────────

function loadLogo(slug: string) {
  const files: Record<string, string> = {
    americano: "americano",
    apogeu: "apogeu",
    "matriz-educacao": "matriz",
    "qi-bilingue": "qi",
    uniao: "uniao",
    unificado: "unificado",
  };
  const file = files[slug];
  if (!file) return null;
  const p = pathModule.join(process.cwd(), "public", "marcas", `${file}.png`);
  if (!fs.existsSync(p)) return null;
  const data = fs.readFileSync(p);
  const dH = 52;
  const dW = Math.round(dH * (data.readUInt32BE(16) / data.readUInt32BE(20)));
  return { data, width: dW, height: dH };
}

// ─── Paleta ──────────────────────────────────────────────────────────────────

const C = {
  turquoise: "5BB8C1",
  navy: "1B3A52",
  bodyText: "3D4A52",
  labelText: "1B3A52",
  subtle: "7A8E99",
  tableBg: "F0F7F8",
  white: "FFFFFF",
  border: "C8DCE0",
  emerald: "34D399",
  amber: "FBBF24",
  orange: "FB923C",
  rose: "FB7185",
  sky: "38BDF8",
  violet: "A78BFA",
  indigo: "818CF8",
};
const FONT_TITLE = "Calibri Light";
const FONT_BODY = "Calibri";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function colorBar() {
  return new Paragraph({
    children: [new TextRun({ text: "" })],
    border: { bottom: { style: BorderStyle.THICK, size: 18, color: C.turquoise } },
    spacing: { after: 200 },
  });
}

function makeHeader(slug: string) {
  const logo = loadLogo(slug);
  return logo
    ? new Paragraph({
        children: [
          new ImageRun({
            data: logo.data,
            transformation: { width: logo.width, height: logo.height },
            type: "png",
          }),
        ],
        spacing: { after: 80 },
      })
    : new Paragraph({
        children: [
          new TextRun({
            text: "PROGRAMA RAIZ OLÍMPICA  ·  RAIZ EDUCAÇÃO",
            font: FONT_BODY,
            size: 17,
            color: C.subtle,
            characterSpacing: 20,
          }),
        ],
        spacing: { after: 80 },
      });
}

function footerParagraph() {
  return new Paragraph({
    children: [
      new TextRun({
        text: `Gerado em ${new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}  ·  Sistema Olimpíadas Raiz`,
        font: FONT_BODY,
        size: 17,
        color: C.subtle,
        italics: true,
      }),
    ],
    alignment: AlignmentType.CENTER,
    border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.border, space: 6 } },
    spacing: { before: 320 },
  });
}

const docConfig = {
  styles: { default: { document: { run: { font: FONT_BODY, size: 21, color: C.bodyText } } } },
  numbering: {
    config: [
      {
        reference: "bullet-list",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "•",
            alignment: AlignmentType.LEFT,
            style: {
              paragraph: {
                indent: { left: convertInchesToTwip(0.3), hanging: convertInchesToTwip(0.2) },
              },
            },
          },
        ],
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(1),
            bottom: convertInchesToTwip(1),
            left: convertInchesToTwip(1.25),
            right: convertInchesToTwip(1.25),
          },
        },
      },
      children: [] as Paragraph[],
    },
  ],
};

// ─── Doc OBMEP ────────────────────────────────────────────────────────────────

async function genObmepDoc(marcaSlug: string) {
  const OBMEP = {
    sigla: "OBMEP",
    nome: "Olimpíada Brasileira de Matemática das Escolas Públicas",
    edicao: "21ª edição (2026)",
    area: "Matemática",
    organizador: "IMPA (Instituto de Matemática Pura e Aplicada) / SBM — apoio MCTI",
    site: "https://www.obmep.org.br",
    portalInscricao: "http://www.obmep.org.br/selecaoEscola.do",
    segmentos: ["EFAF", "EM"],
    series: "Nível 1: 6º–7º EF · Nível 2: 8º–9º EF · Nível 3: Ensino Médio",
    custo: "Escolas públicas: gratuita · Escolas privadas: a partir de R$ 200/nível",
    inscricoes: {
      periodo: "04/02 a 16/03/2026 (encerradas)",
      descricao:
        "Inscrições encerradas em 16/03/2026. Boleto para escolas privadas: a partir de R$ 200 por nível (proporcional ao número de alunos).",
      como: "Escola realiza cadastro no obmep.org.br e inscreve os alunos por nível. Todos os alunos dos níveis correspondentes podem ser inscritos — sem seleção prévia. A lista de alunos é gerenciada pelo sistema.",
    },
    fases: [
      {
        nome: "1ª Fase",
        formato: "20 questões objetivas (cartão-resposta)",
        data: "09/06/2026",
        local: "Na própria escola",
      },
      {
        nome: "Divulgação dos classificados para 2ª Fase",
        formato: "Site oficial",
        data: "03/08/2026",
        local: "Online",
      },
      {
        nome: "Locais da 2ª Fase divulgados",
        formato: "Site oficial",
        data: "28/08/2026",
        local: "Online",
      },
      {
        nome: "2ª Fase",
        formato: "6 questões discursivas",
        data: "17/10/2026",
        local: "Locais externos (polos municipais)",
      },
      {
        nome: "Divulgação dos premiados",
        formato: "Site oficial",
        data: "15/12/2026",
        local: "Online",
      },
    ],
    premiacao: [
      "8.450 medalhas nacionais: 650 ouro, 1.950 prata, 5.850 bronze",
      "51.000 certificados de menção honrosa",
      "Mais de 20.000 medalhas estaduais",
      "Medalhistas nacionais de escolas públicas: convite para o Programa PIC Jr. (IMPA) com bolsa CNPq de R$ 300/mês por até 12 meses",
    ],
    notas:
      "Aberta a escolas privadas, mas premiações com bolsa CNPq são exclusivas para alunos de escolas públicas.",
  };

  function label(l: string, v: string) {
    return new Paragraph({
      children: [
        new TextRun({ text: `${l}  `, font: FONT_BODY, size: 21, bold: true, color: C.labelText }),
        new TextRun({ text: v, font: FONT_BODY, size: 21, color: C.bodyText }),
      ],
      spacing: { after: 80 },
    });
  }
  function heading(text: string) {
    return new Paragraph({
      children: [
        new TextRun({
          text: text.toUpperCase(),
          font: FONT_TITLE,
          size: 24,
          color: C.turquoise,
          characterSpacing: 30,
        }),
      ],
      spacing: { before: 360, after: 100 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.turquoise, space: 4 } },
    });
  }
  function body(text: string) {
    return new Paragraph({
      children: [new TextRun({ text, font: FONT_BODY, size: 21, color: C.bodyText })],
      spacing: { after: 100 },
    });
  }
  function small(text: string) {
    return new Paragraph({
      children: [new TextRun({ text, font: FONT_BODY, size: 20, bold: true, color: C.labelText })],
      spacing: { before: 120, after: 60 },
    });
  }
  function bullet(text: string) {
    return new Paragraph({
      children: [new TextRun({ text, font: FONT_BODY, size: 21, color: C.bodyText })],
      bullet: { level: 0 },
      spacing: { after: 60 },
    });
  }
  function title(text: string) {
    return new Paragraph({
      children: [new TextRun({ text, font: FONT_TITLE, size: 52, color: C.navy })],
      spacing: { after: 80 },
    });
  }
  function subtitle(text: string) {
    return new Paragraph({
      children: [new TextRun({ text, font: FONT_BODY, size: 22, italics: true, color: C.subtle })],
      spacing: { after: 320 },
    });
  }

  const pad = {
    top: convertInchesToTwip(0.05),
    bottom: convertInchesToTwip(0.05),
    left: convertInchesToTwip(0.09),
    right: convertInchesToTwip(0.09),
  };
  const hCell = (text: string, pct: number) =>
    new TableCell({
      children: [
        new Paragraph({
          children: [new TextRun({ text, font: FONT_BODY, size: 19, bold: true, color: C.white })],
        }),
      ],
      shading: { type: ShadingType.SOLID, color: C.turquoise },
      width: { size: pct, type: WidthType.PERCENTAGE },
      margins: pad,
    });
  const dCell = (text: string, shade: boolean, pct: number) =>
    new TableCell({
      children: [
        new Paragraph({
          children: [new TextRun({ text, font: FONT_BODY, size: 19, color: C.bodyText })],
        }),
      ],
      shading: shade ? { type: ShadingType.SOLID, color: C.tableBg } : undefined,
      width: { size: pct, type: WidthType.PERCENTAGE },
      margins: pad,
    });

  const phasesTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: C.border },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [hCell("Fase", 22), hCell("Formato", 40), hCell("Data", 16), hCell("Local", 22)],
        tableHeader: true,
      }),
      ...OBMEP.fases.map(
        (f, i) =>
          new TableRow({
            children: [
              dCell(f.nome, i % 2 === 1, 22),
              dCell(f.formato, i % 2 === 1, 40),
              dCell(f.data ?? "—", i % 2 === 1, 16),
              dCell(f.local, i % 2 === 1, 22),
            ],
          }),
      ),
    ],
  });

  const doc = new Document({
    ...docConfig,
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1.25),
              right: convertInchesToTwip(1.25),
            },
          },
        },
        children: [
          makeHeader(marcaSlug),
          colorBar(),
          title(OBMEP.nome),
          subtitle(OBMEP.edicao),
          heading("Identificação"),
          label("Área do conhecimento", OBMEP.area),
          label("Organizador", OBMEP.organizador),
          label("Segmentos", OBMEP.segmentos.join("  ·  ")),
          label("Séries atendidas", OBMEP.series),
          label("Site oficial", OBMEP.site),
          heading("Inscrições"),
          label("Período", OBMEP.inscricoes.periodo),
          label("Custo", OBMEP.custo),
          new Paragraph({ children: [], spacing: { after: 60 } }),
          body(OBMEP.inscricoes.descricao),
          small("Como inscrever"),
          body(OBMEP.inscricoes.como),
          label("Portal de inscrição", OBMEP.portalInscricao),
          heading("Fases e Calendário"),
          phasesTable,
          new Paragraph({ children: [], spacing: { after: 120 } }),
          heading("Premiação"),
          ...OBMEP.premiacao.map(bullet),
          new Paragraph({ children: [], spacing: { after: 120 } }),
          heading("Observações Importantes"),
          body(OBMEP.notas),
          footerParagraph(),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}

// ─── Doc Calendário Março ─────────────────────────────────────────────────────

async function genCalendarioDoc(marcaSlug: string, ano: number, mes: number) {
  const FASE_COLORS: Record<string, string> = {
    inscricao: C.emerald,
    prova_1: C.amber,
    prova_2: C.orange,
    final: C.rose,
    divulgacao: C.sky,
  };
  const FASE_LABELS: Record<string, string> = {
    inscricao: "Inscrição",
    prova_1: "1ª Fase",
    prova_2: "2ª Fase",
    final: "Final",
    divulgacao: "Divulgação",
  };
  const AULA_COLORS: Record<string, string> = {
    online: C.turquoise,
    presencial: C.violet,
    simulado: C.indigo,
  };
  const AULA_LABELS: Record<string, string> = {
    online: "Online",
    presencial: "Presencial",
    simulado: "Simulado",
  };

  const pad = {
    top: convertInchesToTwip(0.04),
    bottom: convertInchesToTwip(0.04),
    left: convertInchesToTwip(0.08),
    right: convertInchesToTwip(0.08),
  };
  function cell(text: string, pct: number, color = C.bodyText, bold = false, shade = false) {
    return new TableCell({
      children: [
        new Paragraph({
          children: [new TextRun({ text, font: FONT_BODY, size: 18, color, bold })],
        }),
      ],
      width: { size: pct, type: WidthType.PERCENTAGE },
      shading: shade ? { type: ShadingType.SOLID, color: C.tableBg } : undefined,
      margins: pad,
    });
  }
  function evRow(
    date: string,
    tipo: string,
    tipoColor: string,
    name: string,
    detail: string,
    shade: boolean,
  ) {
    return new TableRow({
      children: [
        cell(date, 12, C.bodyText, false, shade),
        cell(tipo, 14, tipoColor, true, shade),
        cell(name, 46, C.navy, true, shade),
        cell(detail, 28, C.bodyText, false, shade),
      ],
    });
  }
  function evTable(rows: TableRow[]) {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: C.border },
        insideVertical: { style: BorderStyle.NONE },
      },
      rows,
    });
  }
  function sHeading(text: string) {
    return new Paragraph({
      children: [
        new TextRun({
          text: text.toUpperCase(),
          font: FONT_TITLE,
          size: 22,
          color: C.turquoise,
          characterSpacing: 30,
        }),
      ],
      spacing: { before: 320, after: 100 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.turquoise, space: 4 } },
    });
  }
  function fmtDate(dateStr: string) {
    const [, m, d] = dateStr.split("-");
    return `${d}/${m}`;
  }
  function monthKey(dateStr: string) {
    const d = new Date(dateStr.length === 10 ? dateStr + "T12:00:00" : dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }
  function monthLabel(dateStr: string) {
    const d = new Date(dateStr.length === 10 ? dateStr + "T12:00:00" : dateStr);
    return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  }

  // Busca fases
  const { data: fasesData } = await supabase
    .from("olimpiada_fase")
    .select(
      "id, tipo, nome, data_inicio, data_fim, olimpiada:olimpiada_id(nome, ano_letivo, series_elegiveis)",
    )
    .order("data_inicio", { ascending: true });

  // Busca aulas publicadas
  const { data: aulasData } = await supabase
    .from("preparacao_aula")
    .select(
      "id, titulo, tipo, data_hora, duracao_minutos, projeto:projeto_id(id, nome, olimpiada_sigla, ano_letivo, series_elegiveis)",
    )
    .eq("publicada", true)
    .not("data_hora", "is", null)
    .order("data_hora", { ascending: true });

  type Ev = { sortKey: string; monthKey: string; rows: TableRow[] };
  const evs: Ev[] = [];

  for (const f of (fasesData ?? []) as Record<string, unknown>[]) {
    const ol = f.olimpiada;
    if (!ol || ol.ano_letivo !== ano) continue;
    const d = new Date(f.data_inicio + "T12:00:00");
    if (d.getMonth() + 1 !== mes) continue;
    const label = FASE_LABELS[f.tipo] ?? f.tipo;
    const color = FASE_COLORS[f.tipo] ?? C.subtle;
    const detail = `${fmtDate(f.data_inicio)} → ${fmtDate(f.data_fim)}`;
    const shade =
      evs.filter((e) => monthKey(e.sortKey) === monthKey(f.data_inicio)).length % 2 === 1;
    evs.push({
      sortKey: f.data_inicio,
      monthKey: monthKey(f.data_inicio),
      rows: [evRow(fmtDate(f.data_inicio), label, color, f.nome, detail, shade)],
    });
  }

  for (const a of (aulasData ?? []) as Record<string, unknown>[]) {
    const proj = a.projeto;
    if (!proj || proj.ano_letivo !== ano) continue;
    const d = new Date(a.data_hora);
    if (d.getMonth() + 1 !== mes) continue;
    const label = AULA_LABELS[a.tipo] ?? a.tipo;
    const color = AULA_COLORS[a.tipo] ?? C.subtle;
    const dateStr = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
    const timeStr = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const detail = `${proj.nome} · ${timeStr}`;
    const shade = evs.filter((e) => monthKey(e.sortKey) === monthKey(a.data_hora)).length % 2 === 1;
    evs.push({
      sortKey: a.data_hora,
      monthKey: monthKey(a.data_hora),
      rows: [evRow(dateStr, label, color, a.titulo, detail, shade)],
    });
  }

  evs.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  const byMonth = new Map<string, { label: string; rows: TableRow[] }>();
  for (const ev of evs) {
    if (!byMonth.has(ev.monthKey))
      byMonth.set(ev.monthKey, { label: monthLabel(ev.sortKey), rows: [] });
    byMonth.get(ev.monthKey)!.rows.push(...ev.rows);
  }

  const nomeMes = new Date(ano, mes - 1, 1).toLocaleDateString("pt-BR", { month: "short" });
  const filtrosLabel = `Meses: ${nomeMes}`;

  const children: (Paragraph | Table)[] = [
    makeHeader(marcaSlug) as unknown as Paragraph,
    colorBar() as unknown as Paragraph,
    new Paragraph({
      children: [
        new TextRun({
          text: `Calendário Acadêmico Olímpico ${ano}`,
          font: FONT_TITLE,
          size: 44,
          color: C.navy,
        }),
      ],
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: filtrosLabel,
          font: FONT_BODY,
          size: 20,
          italics: true,
          color: C.subtle,
        }),
      ],
      spacing: { after: 240 },
    }),
  ];

  const meses = [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b));
  if (meses.length === 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Nenhum evento encontrado para março.",
            font: FONT_BODY,
            size: 21,
            color: C.subtle,
            italics: true,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 },
      }),
    );
  } else {
    for (const [, { label, rows }] of meses) {
      children.push(sHeading(label) as unknown as Paragraph);
      if (rows.length) children.push(evTable(rows));
    }
  }

  children.push(footerParagraph());

  const doc = new Document({
    ...docConfig,
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1.25),
              right: convertInchesToTwip(1.25),
            },
          },
        },
        children: children as Paragraph[],
      },
    ],
  });

  return Packer.toBuffer(doc);
}

// ─── Main ────────────────────────────────────────────────────────────────────

(async () => {
  const OUT = pathModule.join(process.cwd(), "preview-docs");
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT);

  console.log("Gerando OBMEP-Unificado.docx...");
  const obmepBuf = await genObmepDoc("unificado");
  fs.writeFileSync(pathModule.join(OUT, "OBMEP-Unificado.docx"), obmepBuf);
  console.log("  ✓ preview-docs/OBMEP-Unificado.docx");

  console.log("Gerando Calendario-Marco-2026-Unificado.docx...");
  const calBuf = await genCalendarioDoc("unificado", 2026, 3);
  fs.writeFileSync(pathModule.join(OUT, "Calendario-Marco-2026-Unificado.docx"), calBuf);
  console.log("  ✓ preview-docs/Calendario-Marco-2026-Unificado.docx");

  console.log("\nConcluído! Arquivos em:", OUT);
})();
