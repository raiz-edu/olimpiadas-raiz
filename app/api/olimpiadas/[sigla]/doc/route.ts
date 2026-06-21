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
import { CATALOGO } from "@/lib/olimpiadas/catalogo";
import { getServerSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── Mapeamento slug → arquivo de logo ──────────────────────────────────────

const SLUG_TO_LOGO: Record<string, string> = {
  americano: "americano",
  apogeu: "apogeu",
  "matriz-educacao": "matriz",
  "qi-bilingue": "qi",
  uniao: "uniao",
  unificado: "unificado",
};

function loadLogo(slug: string): { data: Buffer; width: number; height: number } | null {
  const logoFile = SLUG_TO_LOGO[slug];
  if (!logoFile) return null;
  const logoPath = pathModule.join(process.cwd(), "public", "marcas", `${logoFile}.png`);
  if (!fs.existsSync(logoPath)) return null;
  const data = fs.readFileSync(logoPath);
  const imgW = data.readUInt32BE(16);
  const imgH = data.readUInt32BE(20);
  const displayH = 52;
  const displayW = Math.round(displayH * (imgW / imgH));
  return { data, width: displayW, height: displayH };
}

// ─── Paleta ─────────────────────────────────────────────────────────────────

const C = {
  turquoise: "5BB8C1", // cor principal do projeto
  navy: "1B3A52", // títulos e destaques escuros
  bodyText: "3D4A52", // texto corrido
  labelText: "1B3A52", // labels (bold)
  subtle: "7A8E99", // texto secundário / rodapé
  tableBg: "F0F7F8", // linha par da tabela
  white: "FFFFFF",
  border: "C8DCE0", // bordas suaves
};

const FONT_TITLE = "Calibri Light";
const FONT_BODY = "Calibri";

// ─── Primitivos ──────────────────────────────────────────────────────────────

function docTitle(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT_TITLE, size: 52, bold: false, color: C.navy })],
    spacing: { after: 80 },
  });
}

function docSubtitle(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT_BODY, size: 22, italics: true, color: C.subtle })],
    spacing: { after: 320 },
  });
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: text.toUpperCase(),
        font: FONT_TITLE,
        size: 24,
        bold: false,
        color: C.turquoise,
        characterSpacing: 30,
      }),
    ],
    spacing: { before: 360, after: 100 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.turquoise, space: 4 } },
  });
}

function labelValue(label: string, value: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: `${label}  `,
        font: FONT_BODY,
        size: 21,
        bold: true,
        color: C.labelText,
      }),
      new TextRun({ text: value, font: FONT_BODY, size: 21, color: C.bodyText }),
    ],
    spacing: { after: 80 },
  });
}

function bodyParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT_BODY, size: 21, color: C.bodyText })],
    spacing: { after: 100 },
  });
}

function smallLabel(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT_BODY, size: 20, bold: true, color: C.labelText })],
    spacing: { before: 120, after: 60 },
  });
}

function bulletItem(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT_BODY, size: 21, color: C.bodyText })],
    bullet: { level: 0 },
    spacing: { after: 60 },
  });
}

function spacer(size = 120): Paragraph {
  return new Paragraph({ children: [], spacing: { after: size } });
}

// ─── Tabela de fases ─────────────────────────────────────────────────────────

function phasesTable(
  fases: { nome: string; formato: string; data?: string; local: string }[],
): Table {
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
    rows: [
      new TableRow({
        children: [hCell("Fase", 22), hCell("Formato", 40), hCell("Data", 16), hCell("Local", 22)],
        tableHeader: true,
      }),
      ...fases.map(
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
}

// ─── Linha decorativa colorida ───────────────────────────────────────────────

function colorBar(): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: "" })],
    border: { bottom: { style: BorderStyle.THICK, size: 18, color: C.turquoise } },
    spacing: { after: 200 },
  });
}

// ─── Rota ────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest, { params }: { params: Promise<{ sigla: string }> }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { sigla } = await params;
  const olimpiada = CATALOGO.find((o) => o.sigla === decodeURIComponent(sigla));
  if (!olimpiada) {
    return NextResponse.json({ error: "Olimpíada não encontrada" }, { status: 404 });
  }

  // ── Determina marca do usuário ─────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session.user as any;
  const isAdmin = user.role === "raiz";
  const marcaParam = req.nextUrl.searchParams.get("marca");

  let marcaSlug: string | null = null;
  if (isAdmin && marcaParam) {
    marcaSlug = marcaParam;
  } else if (!isAdmin && user.marca_ativa_id) {
    const { data } = await createAdminClient()
      .from("marca")
      .select("slug")
      .eq("id", user.marca_ativa_id)
      .single();
    marcaSlug = data?.slug ?? null;
  }

  const logo = marcaSlug ? loadLogo(marcaSlug) : null;

  // Cabeçalho: logo da marca OU texto genérico
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

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: FONT_BODY, size: 21, color: C.bodyText },
        },
      },
    },
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
                  indent: {
                    left: convertInchesToTwip(0.3),
                    hanging: convertInchesToTwip(0.2),
                  },
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
        children: [
          // Topo: logo da marca ou label genérico
          headerParagraph,

          // Barra colorida
          colorBar(),

          // Título e edição
          docTitle(olimpiada.nome),
          ...(olimpiada.edicao ? [docSubtitle(olimpiada.edicao)] : [spacer(240)]),

          // ── Identificação
          sectionHeading("Identificação"),
          labelValue("Área do conhecimento", olimpiada.area),
          labelValue("Organizador", olimpiada.organizador),
          labelValue("Segmentos", olimpiada.segmentos.join("  ·  ")),
          labelValue("Séries atendidas", olimpiada.series),
          labelValue("Site oficial", olimpiada.site),

          // ── Inscrições
          sectionHeading("Inscrições"),
          ...(olimpiada.inscricoes.periodo
            ? [labelValue("Período", olimpiada.inscricoes.periodo)]
            : []),
          labelValue("Custo", olimpiada.custo),
          spacer(60),
          bodyParagraph(olimpiada.inscricoes.descricao),
          smallLabel("Como inscrever"),
          bodyParagraph(olimpiada.inscricoes.como),
          labelValue("Portal de inscrição", olimpiada.portalInscricao),

          // ── Fases
          sectionHeading("Fases e Calendário"),
          phasesTable(olimpiada.fases),
          spacer(),

          // ── Premiação
          sectionHeading("Premiação"),
          ...olimpiada.premiacao.map(bulletItem),
          spacer(),

          // ── Observações
          ...(olimpiada.notas
            ? [sectionHeading("Observações Importantes"), bodyParagraph(olimpiada.notas), spacer()]
            : []),

          // Rodapé
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
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const filename = `${olimpiada.sigla.replace(/\s+/g, "-")}-informativo.docx`;

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
