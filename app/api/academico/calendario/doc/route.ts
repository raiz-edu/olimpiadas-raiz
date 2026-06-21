import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
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
import { getServerSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

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

// ─── Logo ────────────────────────────────────────────────────────────────────

const SLUG_TO_LOGO: Record<string, string> = {
  americano: "americano",
  apogeu: "apogeu",
  "matriz-educacao": "matriz",
  "qi-bilingue": "qi",
  uniao: "uniao",
  unificado: "unificado",
};

function loadLogo(slug: string) {
  const file = SLUG_TO_LOGO[slug];
  if (!file) return null;
  const p = pathModule.join(process.cwd(), "public", "marcas", `${file}.png`);
  if (!fs.existsSync(p)) return null;
  const data = fs.readFileSync(p);
  const dH = 52;
  const dW = Math.round(dH * (data.readUInt32BE(16) / data.readUInt32BE(20)));
  return { data, width: dW, height: dH };
}

// ─── Helpers DOCX ────────────────────────────────────────────────────────────

function colorBar() {
  return new Paragraph({
    children: [new TextRun({ text: "" })],
    border: { bottom: { style: BorderStyle.THICK, size: 18, color: C.turquoise } },
    spacing: { after: 200 },
  });
}

function sectionHeading(text: string) {
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

function eventRow(
  date: string,
  tipo: string,
  tipoColor: string,
  name: string,
  detail: string,
  shade: boolean,
): TableRow {
  const pad = {
    top: convertInchesToTwip(0.04),
    bottom: convertInchesToTwip(0.04),
    left: convertInchesToTwip(0.08),
    right: convertInchesToTwip(0.08),
  };
  const cell = (text: string, pct: number, color = C.bodyText, bold = false) =>
    new TableCell({
      children: [
        new Paragraph({
          children: [new TextRun({ text, font: FONT_BODY, size: 18, color, bold })],
        }),
      ],
      width: { size: pct, type: WidthType.PERCENTAGE },
      shading: shade ? { type: ShadingType.SOLID, color: C.tableBg } : undefined,
      margins: pad,
    });
  return new TableRow({
    children: [
      cell(date, 12),
      cell(tipo, 14, tipoColor, true),
      cell(name, 46, C.navy, true),
      cell(detail, 28),
    ],
  });
}

function eventsTable(rows: TableRow[]) {
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

// ─── Tipo → cor ───────────────────────────────────────────────────────────────

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

// ─── Mapeamento série → segmento ──────────────────────────────────────────────

const SERIES_TO_SEG: Record<string, string> = {
  "1º": "EFAI",
  "2º": "EFAI",
  "3º": "EFAI",
  "4º": "EFAI",
  "5º": "EFAI",
  "6º": "EFAF",
  "7º": "EFAF",
  "8º": "EFAF",
  "9º": "EFAF",
  "1º EM": "EM",
  "2º EM": "EM",
  "3º EM": "EM",
};

function matchesSeg(series: string[], segmento: string): boolean {
  if (!series.length) return true;
  return series.some((s) => SERIES_TO_SEG[s] === segmento);
}

function matchesSerie(series: string[], serie: string): boolean {
  if (!series.length) return true;
  return series.includes(serie);
}

function fmtDate(dateStr: string) {
  const [, m, d] = dateStr.split("-");
  return `${d}/${m}`;
}

function monthLabel(dateStr: string) {
  const d = new Date(dateStr.length === 10 ? dateStr + "T12:00:00" : dateStr);
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function monthKey(dateStr: string) {
  const d = new Date(dateStr.length === 10 ? dateStr + "T12:00:00" : dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ─── Rota ────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session.user as any;
  const isAdmin = user.role === "raiz";

  const url = req.nextUrl;
  const ano = Number(url.searchParams.get("ano")) || new Date().getFullYear();
  const segmento = url.searchParams.get("segmento") ?? "";
  const seriesParam = url.searchParams.get("series") ?? url.searchParams.get("serie") ?? "";
  const seriesList = seriesParam
    ? seriesParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const projetosParam = url.searchParams.get("projetos") ?? url.searchParams.get("projeto") ?? "";
  const projetosList = projetosParam
    ? projetosParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const mesesParam = url.searchParams.get("meses") ?? url.searchParams.get("mes") ?? "";
  const mesesList = mesesParam ? mesesParam.split(",").map(Number).filter(Boolean) : [];
  const marcaParam = url.searchParams.get("marca") ?? "";
  const includeFases = url.searchParams.get("fases") !== "0";
  const includeAulas = url.searchParams.get("aulas") !== "0";
  const includeSimulados = url.searchParams.get("simulados") !== "0";

  // Determina marca
  let marcaSlug: string | null = null;
  const supabase = createAdminClient();

  if (isAdmin && marcaParam) {
    marcaSlug = marcaParam;
  } else if (!isAdmin && user.marca_ativa_id) {
    const { data } = await supabase
      .from("marca")
      .select("slug")
      .eq("id", user.marca_ativa_id)
      .single();
    marcaSlug = data?.slug ?? null;
  }

  const logo = marcaSlug ? loadLogo(marcaSlug) : null;

  // Busca dados
  const [{ data: fasesData }, { data: aulasData }] = await Promise.all([
    supabase
      .from("olimpiada_fase")
      .select(
        "id, tipo, nome, data_inicio, data_fim, olimpiada:olimpiada_id(nome, ano_letivo, series_elegiveis)" as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      )
      .order("data_inicio", { ascending: true }),
    supabase
      .from("preparacao_aula")
      .select(
        "id, titulo, tipo, data_hora, duracao_minutos, projeto:projeto_id(id, nome, olimpiada_sigla, ano_letivo, series_elegiveis)" as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      )
      .eq("publicada", true)
      .not("data_hora", "is", null)
      .order("data_hora", { ascending: true }),
  ]);

  // Filtra e agrupa eventos por mês
  type Ev = { sortKey: string; monthKey: string; kind: "fase" | "aula"; rows: TableRow[] };
  const evs: Ev[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const f of (fasesData ?? []) as any[]) {
    if (!includeFases) continue; // filtro de visibilidade
    const ol = f.olimpiada;
    if (!ol || ol.ano_letivo !== ano) continue;
    if (projetosList.length > 0) continue; // quando filtrando por projeto, oculta fases
    const seriesEl: string[] = ol.series_elegiveis ?? [];
    if (segmento && !matchesSeg(seriesEl, segmento)) continue;
    if (seriesList.length > 0 && !seriesList.some((s) => matchesSerie(seriesEl, s))) continue;
    if (
      mesesList.length > 0 &&
      !mesesList.includes(new Date(f.data_inicio + "T12:00:00").getMonth() + 1)
    )
      continue;
    if (projetosList.length > 0) continue;

    const label = FASE_LABELS[f.tipo] ?? f.tipo;
    const color = FASE_COLORS[f.tipo] ?? C.subtle;
    const detail = `${fmtDate(f.data_inicio)} → ${fmtDate(f.data_fim)}`;
    const shade =
      evs.filter((e) => monthKey(e.sortKey) === monthKey(f.data_inicio)).length % 2 === 1;

    evs.push({
      sortKey: f.data_inicio,
      monthKey: monthKey(f.data_inicio),
      kind: "fase",
      rows: [eventRow(fmtDate(f.data_inicio), label, color, f.nome, detail, shade)],
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const a of (aulasData ?? []) as any[]) {
    // filtros de visibilidade por tipo
    if (a.tipo === "simulado" && !includeSimulados) continue;
    if (a.tipo !== "simulado" && !includeAulas) continue;
    const proj = a.projeto;
    if (!proj || proj.ano_letivo !== ano) continue;
    if (projetosList.length > 0 && !projetosList.includes(proj.id)) continue;
    const seriesEl: string[] = proj.series_elegiveis ?? [];
    if (segmento && !matchesSeg(seriesEl, segmento)) continue;
    if (seriesList.length > 0 && !seriesList.some((s) => matchesSerie(seriesEl, s))) continue;
    if (mesesList.length > 0 && !mesesList.includes(new Date(a.data_hora).getMonth() + 1)) continue;
    if (projetosList.length > 0 && (!proj.id || !projetosList.includes(proj.id))) continue;

    const label = AULA_LABELS[a.tipo] ?? a.tipo;
    const color = AULA_COLORS[a.tipo] ?? C.subtle;
    const dt = new Date(a.data_hora);
    const dateStr = `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}`;
    const timeStr = dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const detail = `${proj.nome} · ${timeStr}${a.duracao_minutos ? ` · ${a.duracao_minutos}min` : ""}`;
    const shade = evs.filter((e) => monthKey(e.sortKey) === monthKey(a.data_hora)).length % 2 === 1;

    evs.push({
      sortKey: a.data_hora,
      monthKey: monthKey(a.data_hora),
      kind: "aula",
      rows: [eventRow(dateStr, label, color, a.titulo, detail, shade)],
    });
  }

  evs.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  // Agrupa por mês
  const byMonth = new Map<string, { label: string; rows: TableRow[] }>();
  for (const ev of evs) {
    if (!byMonth.has(ev.monthKey)) {
      byMonth.set(ev.monthKey, { label: monthLabel(ev.sortKey), rows: [] });
    }
    byMonth.get(ev.monthKey)!.rows.push(...ev.rows);
  }

  // Monta seções por mês — Cabeçalho
  const headerParagraph = logo
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

  // Subtítulo de filtros ativos
  const nomesMeses = mesesList.map((m) =>
    new Date(ano, m - 1, 1).toLocaleDateString("pt-BR", { month: "short" }),
  );
  const filtrosLabel = [
    segmento ? `Segmento: ${segmento}` : "",
    seriesList.length > 0 ? `Séries: ${seriesList.join(", ")}` : "",
    nomesMeses.length > 0 ? `Meses: ${nomesMeses.join(", ")}` : "",
    projetosList.length > 0 ? "Projeto(s) selecionado(s)" : "",
  ]
    .filter(Boolean)
    .join("  ·  ");

  const docChildren: (Paragraph | Table)[] = [
    headerParagraph as unknown as Paragraph,
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
    ...(filtrosLabel
      ? [
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
        ]
      : [new Paragraph({ children: [], spacing: { after: 240 } })]),
  ];

  const meses = [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b));

  if (meses.length === 0) {
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Nenhum evento encontrado para os filtros selecionados.",
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
      docChildren.push(sectionHeading(label));
      if (rows.length) docChildren.push(eventsTable(rows));
    }
  }

  // Rodapé
  docChildren.push(
    new Paragraph({
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
    }),
  );

  const doc = new Document({
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
        children: docChildren as Paragraph[],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const filename = `calendario-olimpico-${ano}.docx`;

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
