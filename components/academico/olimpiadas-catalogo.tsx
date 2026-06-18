"use client";

import { useState, useTransition, useActionState, useRef, useEffect } from "react";
import type { OlimpiadaCatalogo, Segmento, AreaSlug } from "@/lib/olimpiadas/catalogo";
import { AREA_CONFIG, SEGMENTO_CONFIG } from "@/lib/olimpiadas/catalogo";
import { uploadPlanilha, deletePlanilha } from "@/app/(protected)/academico/olimpiadas/actions";

// ─── types ─────────────────────────────────────────────────────────────────

type Planilha = { name: string; created_at: string; fullPath: string };

type Marca = { nome: string; slug: string };

type Props = {
  catalogo: OlimpiadaCatalogo[];
  planilhasMap: Record<string, Planilha[]>;
  isAdmin: boolean;
  marcaSlug: string | null;
  todasMarcas: Marca[];
};

// ─── helpers ───────────────────────────────────────────────────────────────

function displayFileName(name: string) {
  // Remove timestamp prefix (e.g. "1716000000000-arquivo.xlsx" → "arquivo.xlsx")
  return name.replace(/^\d{13}-/, "");
}

function formatDate(iso: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

// ─── SegmentoBadge ─────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SegmentoBadge({ s }: { s: Segmento }) {
  const c = SEGMENTO_CONFIG[s];
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${c.bg} ${c.text}`}>
      {s}
    </span>
  );
}

// ─── AreaBadge ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function AreaBadge({ slug }: { slug: AreaSlug }) {
  const c = AREA_CONFIG[slug];
  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${c.bg} ${c.text} ${c.border}`}
    >
      {c.label}
    </span>
  );
}

// ─── CustoBadge ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function CustoBadge({ gratuita }: { gratuita: boolean }) {
  return gratuita ? (
    <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
      Gratuita
    </span>
  ) : (
    <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[11px] font-medium text-amber-400">
      Paga
    </span>
  );
}

// ─── PlanilhaSection (apenas Canguru) ─────────────────────────────────────

function PlanilhaSection({ sigla, initialFiles }: { sigla: string; initialFiles: Planilha[] }) {
  const uploadAction = uploadPlanilha.bind(null, sigla);
  const [state, formAction, isPending] = useActionState(uploadAction, null);
  const [deleting, startDelete] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const prevOk = state && "ok" in state;
  useEffect(() => {
    if (prevOk && formRef.current) formRef.current.reset();
  }, [prevOk]);

  function handleDelete(fullPath: string) {
    if (!confirm("Remover este arquivo?")) return;
    startDelete(async () => {
      await deletePlanilha(fullPath);
    });
  }

  return (
    <div className="space-y-3">
      <p
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: "rgb(91,184,193)" }}
      >
        Planilha de Inscrição
      </p>

      <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2">
        <p className="text-xs text-amber-400/90">
          Baixe o modelo oficial na área reservada do site (após pagar a taxa), preencha com os
          dados dos alunos e faça upload aqui para controle interno.
        </p>
      </div>

      {/* Upload form */}
      <form ref={formRef} action={formAction} className="flex flex-wrap items-center gap-2">
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-ring hover:text-foreground">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4 shrink-0"
          >
            <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
            <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
          </svg>
          Escolher planilha
          <input
            type="file"
            name="file"
            accept=".xlsx,.xls,.csv,.ods"
            className="sr-only"
            required
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50"
          style={{ backgroundColor: "rgb(91,184,193)", color: "white" }}
        >
          {isPending ? "Enviando…" : "Enviar"}
        </button>

        {state && "error" in state && <p className="text-xs text-destructive">{state.error}</p>}
        {state && "ok" in state && (
          <p className="text-xs text-emerald-400">Arquivo enviado com sucesso.</p>
        )}
      </form>

      {/* File list */}
      {initialFiles.length > 0 ? (
        <ul className="space-y-1.5">
          {initialFiles.map((f) => (
            <li
              key={f.fullPath}
              className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-foreground">
                    {displayFileName(f.name)}
                  </p>
                  {f.created_at && (
                    <p className="text-[11px] text-muted-foreground">{formatDate(f.created_at)}</p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <a
                  href={`/api/planilhas/download?path=${encodeURIComponent(f.fullPath)}`}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
                  title="Baixar"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4"
                  >
                    <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                    <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                  </svg>
                </a>
                <button
                  onClick={() => handleDelete(f.fullPath)}
                  disabled={deleting}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
                  title="Remover"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground/60 italic">Nenhuma planilha enviada ainda.</p>
      )}
    </div>
  );
}

// ─── OlimpiadaItem (accordion) ─────────────────────────────────────────────

function OlimpiadaItem({
  olimpiada,
  planilhas,
  defaultOpen,
  isAdmin,
  todasMarcas,
}: {
  olimpiada: OlimpiadaCatalogo;
  planilhas: Planilha[];
  defaultOpen: boolean;
  isAdmin: boolean;
  todasMarcas: Marca[];
}) {
  const [open, setOpen] = useState(defaultOpen);

  const meta = [
    olimpiada.area,
    olimpiada.segmentos.join(" · "),
    olimpiada.gratuita ? "Gratuita" : "Paga",
    ...(olimpiada.inscricoes.periodo ? [`Inscrições: ${olimpiada.inscricoes.periodo}`] : []),
  ].join("  ·  ");

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-0 px-5 py-4 text-left transition-colors hover:bg-white/[0.03]"
      >
        {/* Sigla — largura fixa para alinhar todos os nomes */}
        <span className="w-24 shrink-0 text-center text-sm font-bold uppercase tracking-wide text-muted-foreground">
          {olimpiada.sigla}
        </span>

        {/* Separador */}
        <div className="mx-4 h-8 w-px shrink-0 bg-border" />

        {/* Nome + metadados */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{olimpiada.nome}</p>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground/70">{meta}</p>
        </div>

        {/* Planilha count — só Canguru */}
        {planilhas.length > 0 && (
          <span className="ml-3 shrink-0 text-[11px] text-muted-foreground">
            {planilhas.length} planilha{planilhas.length > 1 ? "s" : ""}
          </span>
        )}

        {/* Download .docx — dropdown para admin, botão direto para demais */}
        {isAdmin ? (
          <MarcaDocDropdown sigla={olimpiada.sigla} marcas={todasMarcas} />
        ) : (
          <a
            href={`/api/olimpiadas/${encodeURIComponent(olimpiada.sigla)}/doc`}
            onClick={(e) => e.stopPropagation()}
            className="ml-2 shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
            title="Baixar informativo Word (.docx)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                clipRule="evenodd"
              />
            </svg>
          </a>
        )}

        {/* Chevron */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`ml-3 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Body */}
      {open && (
        <div className="border-t border-border px-5 py-5">
          <div className="space-y-5">
            {/* Informações */}
            <div className="space-y-5">
              {/* Organizador + site */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Organizador
                </p>
                <p className="mt-1 text-sm text-foreground">{olimpiada.organizador}</p>
                <a
                  href={olimpiada.site}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 inline-flex items-center gap-1 text-xs text-[rgb(91,184,193)] hover:underline"
                >
                  {olimpiada.site}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 12 12"
                    fill="currentColor"
                    className="h-3 w-3"
                  >
                    <path d="M10 1H6.5a.5.5 0 000 1h2.293L4.146 6.646a.5.5 0 00.708.708L9.5 2.707V5a.5.5 0 001 0V1.5A.5.5 0 0010 1z" />
                    <path d="M2 3a1 1 0 00-1 1v6a1 1 0 001 1h6a1 1 0 001-1V7a.5.5 0 00-1 0v3H2V4h3a.5.5 0 000-1H2z" />
                  </svg>
                </a>
              </div>

              {/* Segmentos e séries */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Séries atendidas
                </p>
                <p className="mt-1 text-sm text-foreground">{olimpiada.series}</p>
              </div>

              {/* Fases */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Fases
                </p>
                {olimpiada.avisoFases && (
                  <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-red-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-3.5 w-3.5 shrink-0"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Atenção — datas não confirmadas
                    </p>
                    <p className="mt-1 text-xs text-red-400/80">{olimpiada.avisoFases}</p>
                  </div>
                )}
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-background">
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                          Fase
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                          Data
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                          Local
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {olimpiada.fases.map((f, i) => (
                        <tr key={i} className="hover:bg-white/[0.02]">
                          <td className="px-3 py-2">
                            <p className="font-medium text-foreground">{f.nome}</p>
                            <p className="text-muted-foreground">{f.formato}</p>
                          </td>
                          <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                            {f.data ?? "—"}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">{f.local}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Inscrições */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Inscrições
                </p>
                <div className="mt-1 space-y-1.5">
                  {olimpiada.inscricoes.periodo && (
                    <p className="text-sm">
                      <span className="font-medium text-foreground">Período: </span>
                      <span className="text-muted-foreground">{olimpiada.inscricoes.periodo}</span>
                    </p>
                  )}
                  <p className="text-sm">
                    <span className="font-medium text-foreground">Custo: </span>
                    <span className="text-muted-foreground">{olimpiada.custo}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">{olimpiada.inscricoes.descricao}</p>
                  <div className="rounded-lg border border-border bg-background px-3 py-2">
                    <p className="text-xs font-medium text-foreground">Como inscrever</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {olimpiada.inscricoes.como}
                    </p>
                  </div>
                  <a
                    href={olimpiada.portalInscricao}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[rgb(91,184,193)] hover:underline"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 12 12"
                      fill="currentColor"
                      className="h-3 w-3 shrink-0"
                    >
                      <path d="M10 1H6.5a.5.5 0 000 1h2.293L4.146 6.646a.5.5 0 00.708.708L9.5 2.707V5a.5.5 0 001 0V1.5A.5.5 0 0010 1z" />
                      <path d="M2 3a1 1 0 00-1 1v6a1 1 0 001 1h6a1 1 0 001-1V7a.5.5 0 00-1 0v3H2V4h3a.5.5 0 000-1H2z" />
                    </svg>
                    Acessar portal de inscrição
                  </a>
                </div>
              </div>

              {/* Premiação */}
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Premiação
                </p>
                <ul className="space-y-1">
                  {olimpiada.premiacao.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[rgb(91,184,193)]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Notas */}
              {olimpiada.notas && (
                <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2.5">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-amber-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-3.5 w-3.5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Observações
                  </p>
                  <p className="mt-1 text-xs text-amber-400/80">{olimpiada.notas}</p>
                </div>
              )}
            </div>

            {/* Planilha de inscrição — apenas Canguru */}
            {olimpiada.usaPlanilha && (
              <div className="rounded-xl border border-border bg-background p-4">
                <PlanilhaSection sigla={olimpiada.sigla} initialFiles={planilhas} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── OlimpiadasCatalogo (main) ─────────────────────────────────────────────

const AREAS: Array<{ slug: AreaSlug | "todos"; label: string }> = [
  { slug: "todos", label: "Todas as áreas" },
  { slug: "matematica", label: "Matemática" },
  { slug: "astronomia", label: "Astronomia" },
  { slug: "fisica", label: "Física" },
  { slug: "quimica", label: "Química" },
  { slug: "biologia", label: "Biologia" },
  { slug: "historia", label: "História" },
  { slug: "geografia", label: "Geografia" },
  { slug: "linguistica", label: "Linguística" },
  { slug: "informatica", label: "Informática" },
  { slug: "portugues", label: "Português" },
  { slug: "ciencias", label: "Ciências" },
  { slug: "stem", label: "STEM" },
  { slug: "ambiente", label: "Meio Ambiente" },
  { slug: "economia", label: "Economia" },
  { slug: "robotica", label: "Robótica" },
  { slug: "filosofia", label: "Filosofia" },
];

// ─── MarcaDocDropdown (apenas admin_rede) ────────────────────────────────────

function MarcaDocDropdown({ sigla, marcas }: { sigla: string; marcas: Marca[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative ml-2 shrink-0" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
        title="Baixar informativo Word — escolher marca"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4"
        >
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[168px] rounded-xl border border-border bg-card p-1.5 shadow-lg">
          <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Baixar por marca
          </p>
          {marcas.map((m) => (
            <a
              key={m.slug}
              href={`/api/olimpiadas/${encodeURIComponent(sigla)}/doc?marca=${m.slug}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-white/[0.06]"
            >
              {m.nome}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AreaSelect ────────────────────────────────────────────────────────────

function AreaCheckbox({ checked }: { checked: boolean }) {
  return (
    <span
      className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border transition-colors"
      style={
        checked
          ? { backgroundColor: "rgb(91,184,193)", borderColor: "rgb(91,184,193)" }
          : { borderColor: "var(--border)" }
      }
    >
      {checked && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="9"
          height="9"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </span>
  );
}

function AreaSelect({
  value,
  onChange,
}: {
  value: AreaSlug | "todos";
  onChange: (v: AreaSlug | "todos") => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selected = AREAS.find((a) => a.slug === value) ?? {
    slug: "todos" as const,
    label: "Todas as áreas",
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm transition-colors hover:bg-background focus:outline-none"
        style={open ? { borderColor: "rgb(91,184,193)" } : {}}
      >
        <span style={{ color: "rgb(91,184,193)" }} className="font-medium">
          {selected.label}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-muted-foreground transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded-xl border border-border bg-card p-1.5 shadow-lg">
          {AREAS.map((a) => {
            const checked = value === a.slug;
            return (
              <button
                key={a.slug}
                type="button"
                onClick={() => {
                  onChange(a.slug);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-background"
              >
                <AreaCheckbox checked={checked} />
                <span className={checked ? "font-medium text-foreground" : "text-muted-foreground"}>
                  {a.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── OlimpiadasCatalogo (main) ─────────────────────────────────────────────

export function OlimpiadasCatalogo({ catalogo, planilhasMap, isAdmin, todasMarcas }: Props) {
  const [segmento, setSegmento] = useState<Segmento | "todos">("todos");
  const [area, setArea] = useState<AreaSlug | "todos">("todos");

  const filtered = catalogo.filter((o) => {
    const matchSeg = segmento === "todos" || o.segmentos.includes(segmento);
    const matchArea = area === "todos" || o.areaSlug === area;
    return matchSeg && matchArea;
  });

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="rounded-xl border border-border bg-card px-4 py-3">
        <div className="flex flex-wrap items-center gap-4">
          {/* Segmento */}
          <div className="flex items-center gap-2">
            <span
              className="shrink-0 text-xs font-semibold uppercase tracking-wider"
              style={{ color: "rgb(91,184,193)" }}
            >
              Segmento
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(["todos", "EFAI", "EFAF", "EM"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSegmento(s)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                    segmento === s
                      ? s === "todos"
                        ? "bg-[rgb(91,184,193)]/10 text-[rgb(91,184,193)] ring-1 ring-[rgb(91,184,193)]/40"
                        : `${SEGMENTO_CONFIG[s].bg} ${SEGMENTO_CONFIG[s].text} ring-1`
                      : "text-muted-foreground/50 ring-1 ring-border/40 hover:text-muted-foreground"
                  }`}
                >
                  {s === "todos" ? "Todos" : s}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden h-5 w-px self-center bg-border/60 sm:block" />

          {/* Área */}
          <div className="flex items-center gap-2">
            <span
              className="shrink-0 text-xs font-semibold uppercase tracking-wider"
              style={{ color: "rgb(91,184,193)" }}
            >
              Área
            </span>
            <AreaSelect value={area} onChange={setArea} />
          </div>

          <p className="ml-auto text-xs text-muted-foreground">
            {filtered.length} de {catalogo.length} olimpíadas
          </p>
        </div>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma olimpíada encontrada para os filtros selecionados.
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((o, i) => (
            <OlimpiadaItem
              key={o.sigla}
              olimpiada={o}
              planilhas={planilhasMap[o.sigla] ?? []}
              defaultOpen={i === 0}
              isAdmin={isAdmin}
              todasMarcas={todasMarcas}
            />
          ))}
        </div>
      )}
    </div>
  );
}
