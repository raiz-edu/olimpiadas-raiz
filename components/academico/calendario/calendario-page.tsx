"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { CATALOGO } from "@/lib/olimpiadas/catalogo";

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export type FaseRow = {
  id: string;
  tipo: "inscricao" | "prova_1" | "prova_2" | "final" | "divulgacao";
  nome: string;
  data_inicio: string;
  data_fim: string;
  observacoes: string | null;
  olimpiada_nome: string;
  olimpiada_sigla: string;
  olimpiada_ano: number;
  series_elegiveis: string[];
};

export type AulaRow = {
  id: string;
  titulo: string;
  tipo: "online" | "presencial" | "simulado";
  data_hora: string;
  duracao_minutos: number | null;
  link_aula: string | null;
  polos: string | null;
  projeto_id: string | null;
  projeto_nome: string;
  olimpiada_sigla: string;
  projeto_ano: number;
  series_elegiveis: string[];
};

export type ProjetoOpt = { id: string; nome: string };

type Marca = { nome: string; slug: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}
function fmtDay(d: Date) {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}
function fmtDayNum(d: Date) {
  return d.getDate().toString().padStart(2, "0");
}
function fmtWeekday(d: Date) {
  return d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
function fmtMonthYear(d: Date) {
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}
function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function diffDays(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86400000) + 1;
}

// ─── Mapeamento série → segmento ──────────────────────────────────────────────

const SERIES_TO_SEG: Record<string, "EFAI" | "EFAF" | "EM"> = {
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

const SERIES_POR_SEG: Record<"EFAI" | "EFAF" | "EM", string[]> = {
  EFAI: ["1º", "2º", "3º", "4º", "5º"],
  EFAF: ["6º", "7º", "8º", "9º"],
  EM: ["1º EM", "2º EM", "3º EM"],
};

function eventSegmentos(series: string[], sigla?: string): ("EFAI" | "EFAF" | "EM")[] {
  if (series.length > 0) {
    const segs = [...new Set(series.map((s) => SERIES_TO_SEG[s]).filter(Boolean))] as (
      | "EFAI"
      | "EFAF"
      | "EM"
    )[];
    if (segs.length) return segs;
  }
  // fallback: CATALOGO
  if (sigla) {
    const cat = CATALOGO.find((o) => o.sigla === sigla);
    if (cat) return cat.segmentos as ("EFAI" | "EFAF" | "EM")[];
  }
  return ["EFAI", "EFAF", "EM"];
}

function matchSegmento(series: string[], sigla: string, sel: "EFAI" | "EFAF" | "EM"): boolean {
  return eventSegmentos(series, sigla).includes(sel);
}

function matchSerie(series: string[], sel: string): boolean {
  if (!series.length) return true; // evento universal
  return series.includes(sel);
}

// ─── Configuração de tipos ────────────────────────────────────────────────────

const FASE_CONFIG: Record<
  FaseRow["tipo"],
  { label: string; bg: string; text: string; dot: string }
> = {
  inscricao: {
    label: "Inscrição",
    bg: "bg-emerald-400/10",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
  },
  prova_1: { label: "1ª Fase", bg: "bg-amber-400/10", text: "text-amber-400", dot: "bg-amber-400" },
  prova_2: {
    label: "2ª Fase",
    bg: "bg-orange-400/10",
    text: "text-orange-400",
    dot: "bg-orange-400",
  },
  final: { label: "Final", bg: "bg-rose-400/10", text: "text-rose-400", dot: "bg-rose-400" },
  divulgacao: { label: "Divulgação", bg: "bg-sky-400/10", text: "text-sky-400", dot: "bg-sky-400" },
};

const AULA_CONFIG: Record<
  AulaRow["tipo"],
  { label: string; bg: string; text: string; dot: string }
> = {
  online: {
    label: "Online",
    bg: "bg-[rgb(91,184,193)]/10",
    text: "text-[rgb(91,184,193)]",
    dot: "bg-[rgb(91,184,193)]",
  },
  presencial: {
    label: "Presencial",
    bg: "bg-violet-400/10",
    text: "text-violet-400",
    dot: "bg-violet-400",
  },
  simulado: {
    label: "Simulado",
    bg: "bg-indigo-400/10",
    text: "text-indigo-400",
    dot: "bg-indigo-400",
  },
};

const SEG_CONFIG: Record<
  "EFAI" | "EFAF" | "EM",
  { label: string; bg: string; text: string; ring: string }
> = {
  EFAI: {
    label: "EFAI",
    bg: "bg-emerald-400/10",
    text: "text-emerald-400",
    ring: "ring-emerald-400/40",
  },
  EFAF: { label: "EFAF", bg: "bg-blue-400/10", text: "text-blue-400", ring: "ring-blue-400/40" },
  EM: {
    label: "Ens. Médio",
    bg: "bg-purple-400/10",
    text: "text-purple-400",
    ring: "ring-purple-400/40",
  },
};

// ─── Badge ────────────────────────────────────────────────────────────────────

function Badge({ bg, text, label }: { bg: string; text: string; label: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${bg} ${text}`}
    >
      {label}
    </span>
  );
}

// ─── MultiSelectDropdown ─────────────────────────────────────────────────────

function MultiSelectDropdown<T extends string | number>({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  selected: T[];
  onChange: (values: T[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const allSelected = selected.length === 0 || selected.length === options.length;
  const btnLabel =
    selected.length === 0 || selected.length === options.length
      ? "Todos"
      : `${selected.length} selecionado${selected.length > 1 ? "s" : ""}`;

  function toggleAll() {
    onChange(allSelected ? [] : options.map((o) => o.value));
  }

  function toggleOne(val: T) {
    onChange(selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val]);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none ${
          selected.length > 0 && selected.length < options.length
            ? "border-[rgb(91,184,193)]/40 bg-[rgb(91,184,193)]/10 text-[rgb(91,184,193)]"
            : "border-border bg-card text-muted-foreground hover:border-ring hover:text-foreground"
        }`}
        style={open ? { borderColor: "rgb(91,184,193)" } : {}}
      >
        <span className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground/60 mr-0.5">
          {label}
        </span>
        <span>{btnLabel}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-3 w-3 shrink-0 text-muted-foreground/60 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[180px] max-w-[260px] rounded-xl border border-border bg-card shadow-lg">
          {/* Selecionar todos */}
          <div className="border-b border-border px-3 py-2">
            <button
              type="button"
              onClick={toggleAll}
              className="flex w-full items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <span
                className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border transition-colors"
                style={
                  allSelected
                    ? { backgroundColor: "rgb(91,184,193)", borderColor: "rgb(91,184,193)" }
                    : { borderColor: "var(--border)" }
                }
              >
                {allSelected && (
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
              Selecionar todos
            </button>
          </div>

          {/* Lista de opções */}
          <div className="p-1.5">
            {options.map((opt) => {
              const checked = selected.includes(opt.value);
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => toggleOne(opt.value)}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-foreground transition-colors hover:bg-white/[0.06]"
                >
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
                  <span className="truncate">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Dropdown de marca (admin) ────────────────────────────────────────────────

function MarcaCalendarioDropdown({
  marcas,
  buildUrl,
}: {
  marcas: Marca[];
  buildUrl: (slug: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-ring transition-colors"
        title="Baixar calendário Word — escolher marca"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-3.5 w-3.5"
        >
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
            clipRule="evenodd"
          />
        </svg>
        Doc
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-3 w-3 text-muted-foreground/60"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[160px] rounded-xl border border-border bg-card p-1.5 shadow-lg">
          <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Baixar por marca
          </p>
          {marcas.map((m) => (
            <a
              key={m.slug}
              href={buildUrl(m.slug)}
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

// ─── Cards ────────────────────────────────────────────────────────────────────

function FaseCard({ fase }: { fase: FaseRow }) {
  const cfg = FASE_CONFIG[fase.tipo];
  const inicio = parseLocalDate(fase.data_inicio);
  const fim = parseLocalDate(fase.data_fim);
  const dias = diffDays(inicio, fim);
  return (
    <div className="flex gap-4">
      <div className="w-12 shrink-0 text-center">
        <p className="text-lg font-bold leading-none text-foreground">{fmtDayNum(inicio)}</p>
        <p className="text-[10px] uppercase text-muted-foreground">{fmtWeekday(inicio)}</p>
      </div>
      <div className="h-full w-px shrink-0 bg-border self-stretch" />
      <div className="min-w-0 flex-1 pb-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge bg={cfg.bg} text={cfg.text} label={cfg.label} />
          <span className="text-xs font-semibold text-muted-foreground">{fase.olimpiada_nome}</span>
        </div>
        <p className="mt-0.5 text-sm font-medium text-foreground">{fase.nome}</p>
        <p className="text-xs text-muted-foreground">
          {fmtDay(inicio)} → {fmtDay(fim)}
          {dias > 1 && <span className="ml-1 text-muted-foreground/60">({dias} dias)</span>}
        </p>
        {fase.observacoes && (
          <p className="mt-1 text-xs text-muted-foreground/70 italic">{fase.observacoes}</p>
        )}
      </div>
    </div>
  );
}

function AulaCard({ aula }: { aula: AulaRow }) {
  const cfg = AULA_CONFIG[aula.tipo];
  const dt = new Date(aula.data_hora);
  return (
    <div className="flex gap-4">
      <div className="w-12 shrink-0 text-center">
        <p className="text-lg font-bold leading-none text-foreground">{fmtDayNum(dt)}</p>
        <p className="text-[10px] uppercase text-muted-foreground">{fmtWeekday(dt)}</p>
      </div>
      <div className="h-full w-px shrink-0 bg-border self-stretch" />
      <div className="min-w-0 flex-1 pb-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge bg={cfg.bg} text={cfg.text} label={cfg.label} />
          <span className="text-xs font-semibold text-muted-foreground">
            {aula.olimpiada_sigla}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground/70">{aula.projeto_nome}</p>
        <p className="text-sm font-medium text-foreground">{aula.titulo}</p>
        <p className="text-xs text-muted-foreground">
          {fmtTime(aula.data_hora)}
          {aula.duracao_minutos && <> · {aula.duracao_minutos} min</>}
          {aula.tipo === "online" && aula.link_aula && (
            <>
              {" "}
              ·{" "}
              <a
                href={aula.link_aula}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
                style={{ color: "rgb(91,184,193)" }}
              >
                Acessar aula
              </a>
            </>
          )}
          {aula.tipo === "presencial" && aula.polos && (
            <>
              {" "}
              · <span className="text-violet-400">{aula.polos.split("\n")[0]}</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

type Evento =
  | { kind: "fase"; sortKey: string; data: FaseRow }
  | { kind: "aula"; sortKey: string; data: AulaRow };

export function CalendarioAcademicoPage({
  fases,
  aulas,
  anos,
  anoParam,
  projetos: projetosOpts,
  isAdmin,
  marcaSlug,
  todasMarcas,
}: {
  fases: FaseRow[];
  aulas: AulaRow[];
  anos: number[];
  anoParam?: string;
  projetos: ProjetoOpt[];
  isAdmin: boolean;
  marcaSlug: string | null;
  todasMarcas: Marca[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const anoCorrente = new Date().getFullYear();
  const selectedAno = Number(anoParam) || anoCorrente;

  const [showFases, setShowFases] = useState(true);
  const [showAulas, setShowAulas] = useState(true);
  const [showSimulados, setShowSimulados] = useState(true);
  const [segmento, setSegmento] = useState<"todos" | "EFAI" | "EFAF" | "EM">("todos");
  const [series, setSeries] = useState<string[]>([]); // multi-select
  const [meses, setMeses] = useState<number[]>([]); // multi-select
  const [projetos, setProjetos] = useState<string[]>([]); // multi-select

  function setAno(ano: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("ano", String(ano));
    router.push(`${pathname}?${params.toString()}`);
  }

  // Séries disponíveis para o segmento selecionado
  const seriesDisponiveis =
    segmento === "todos"
      ? [...SERIES_POR_SEG.EFAI, ...SERIES_POR_SEG.EFAF, ...SERIES_POR_SEG.EM]
      : SERIES_POR_SEG[segmento];

  // Meses com eventos no ano (antes do filtro de mês)
  const mesesComEventos = new Set<number>();
  for (const f of fases) {
    if (f.olimpiada_ano === selectedAno)
      mesesComEventos.add(parseLocalDate(f.data_inicio).getMonth() + 1);
  }
  for (const a of aulas) {
    if (a.projeto_ano === selectedAno) mesesComEventos.add(new Date(a.data_hora).getMonth() + 1);
  }
  const mesesDisponiveis = [...mesesComEventos].sort((a, b) => a - b);

  // Filtra eventos (lógica multi-select: array vazio = todos)
  const eventos: Evento[] = [];

  if (showFases && projetos.length === 0) {
    for (const f of fases) {
      if (f.olimpiada_ano !== selectedAno) continue;
      if (meses.length > 0 && !meses.includes(parseLocalDate(f.data_inicio).getMonth() + 1))
        continue;
      if (segmento !== "todos" && !matchSegmento(f.series_elegiveis, f.olimpiada_sigla, segmento))
        continue;
      if (series.length > 0 && !series.some((s) => matchSerie(f.series_elegiveis, s))) continue;
      eventos.push({ kind: "fase", sortKey: f.data_inicio, data: f });
    }
  }

  for (const a of aulas) {
    if (a.projeto_ano !== selectedAno) continue;
    if (meses.length > 0 && !meses.includes(new Date(a.data_hora).getMonth() + 1)) continue;
    if (a.tipo === "simulado" && !showSimulados) continue;
    if (a.tipo !== "simulado" && !showAulas) continue;
    if (segmento !== "todos" && !matchSegmento(a.series_elegiveis, a.olimpiada_sigla, segmento))
      continue;
    if (series.length > 0 && !series.some((s) => matchSerie(a.series_elegiveis, s))) continue;
    if (projetos.length > 0 && (!a.projeto_id || !projetos.includes(a.projeto_id))) continue;
    eventos.push({ kind: "aula", sortKey: a.data_hora, data: a });
  }

  eventos.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  // Agrupa por mês
  const porMes = new Map<string, { label: string; eventos: Evento[] }>();
  for (const ev of eventos) {
    const d =
      ev.kind === "fase"
        ? parseLocalDate((ev.data as FaseRow).data_inicio)
        : new Date((ev.data as AulaRow).data_hora);
    const key = monthKey(d);
    if (!porMes.has(key)) porMes.set(key, { label: fmtMonthYear(d), eventos: [] });
    porMes.get(key)!.eventos.push(ev);
  }
  const mesesAgrupados = [...porMes.entries()].sort(([a], [b]) => a.localeCompare(b));

  // URL do doc (com filtros ativos)
  function buildDocUrl(slug?: string) {
    const p = new URLSearchParams();
    p.set("ano", String(selectedAno));
    if (slug) p.set("marca", slug);
    if (segmento !== "todos") p.set("segmento", segmento);
    if (series.length > 0) p.set("series", series.join(","));
    if (projetos.length > 0) p.set("projetos", projetos.join(","));
    if (meses.length > 0) p.set("meses", meses.map(String).join(","));
    return `/api/academico/calendario/doc?${p.toString()}`;
  }

  const hasFilters =
    segmento !== "todos" || series.length > 0 || meses.length > 0 || projetos.length > 0;

  return (
    <>
      {/* ── Controles linha 1: ano + tipo + doc ──── */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {anos.map((ano) => (
            <button
              key={ano}
              type="button"
              onClick={() => setAno(ano)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                ano === selectedAno
                  ? "bg-[rgb(91,184,193)] text-white"
                  : "border border-border text-muted-foreground hover:text-foreground hover:border-ring"
              }`}
            >
              {ano}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Toggles de tipo */}
          {[
            {
              label: "Fases",
              dot: "bg-emerald-400",
              active: showFases,
              set: setShowFases,
              activeCls: "bg-emerald-400/10 text-emerald-400 border-emerald-400/30",
            },
            {
              label: "Aulas",
              dot: "bg-[rgb(91,184,193)]",
              active: showAulas,
              set: setShowAulas,
              activeCls:
                "bg-[rgb(91,184,193)]/10 text-[rgb(91,184,193)] border-[rgb(91,184,193)]/30",
            },
            {
              label: "Simulados",
              dot: "bg-indigo-400",
              active: showSimulados,
              set: setShowSimulados,
              activeCls: "bg-indigo-400/10 text-indigo-400 border-indigo-400/30",
            },
          ].map(({ label, dot, active, set, activeCls }) => (
            <button
              key={label}
              type="button"
              onClick={() => set((v) => !v)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all border ${
                active ? activeCls : "border-border text-muted-foreground/40"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
              {label}
            </button>
          ))}

          <div className="h-4 w-px bg-border" />

          {/* Botão doc */}
          {isAdmin ? (
            <MarcaCalendarioDropdown marcas={todasMarcas} buildUrl={buildDocUrl} />
          ) : (
            <a
              href={buildDocUrl(marcaSlug ?? undefined)}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-ring transition-colors"
              title="Baixar calendário Word (.docx)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-3.5 w-3.5"
              >
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                  clipRule="evenodd"
                />
              </svg>
              Doc
            </a>
          )}
        </div>
      </div>

      {/* ── Controles linha 2: filtros ── */}
      <div className="no-print flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-4 py-3">
        {/* Segmento — pills (conjunto fixo, 4 opções) */}
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => {
              setSegmento("todos");
              setSeries([]);
            }}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-all border ${
              segmento === "todos"
                ? "bg-[rgb(91,184,193)]/10 text-[rgb(91,184,193)] border-[rgb(91,184,193)]/30"
                : "border-border text-muted-foreground/50 hover:text-muted-foreground"
            }`}
          >
            Todos
          </button>
          {(["EFAI", "EFAF", "EM"] as const).map((s) => {
            const cfg = SEG_CONFIG[s];
            return (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setSegmento(s);
                  setSeries([]);
                }}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-all border ${
                  segmento === s
                    ? `${cfg.bg} ${cfg.text} border-transparent`
                    : "border-border text-muted-foreground/50 hover:text-muted-foreground"
                }`}
              >
                {cfg.label}
              </button>
            );
          })}
        </div>

        <div className="hidden h-4 w-px bg-border/60 sm:block" />

        {/* Série — dropdown multi-select */}
        <MultiSelectDropdown
          label="Série"
          options={seriesDisponiveis.map((s) => ({ value: s, label: s }))}
          selected={series}
          onChange={setSeries}
        />

        {/* Mês — dropdown multi-select */}
        <MultiSelectDropdown
          label="Mês"
          options={mesesDisponiveis.map((m) => ({
            value: m,
            label: new Date(selectedAno, m - 1, 1).toLocaleDateString("pt-BR", { month: "long" }),
          }))}
          selected={meses}
          onChange={setMeses}
        />

        {/* Projeto — dropdown multi-select */}
        <MultiSelectDropdown
          label="Projeto"
          options={projetosOpts.map((p) => ({ value: p.id, label: p.nome }))}
          selected={projetos}
          onChange={setProjetos}
        />

        {/* Limpar filtros */}
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setSegmento("todos");
              setSeries([]);
              setMeses([]);
              setProjetos([]);
            }}
            className="ml-auto text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Cabeçalho visível apenas na impressão */}
      <div className="hidden print:block mb-6">
        <p className="text-lg font-bold">Calendário Acadêmico Olímpico {selectedAno}</p>
        <p className="text-sm text-muted-foreground">Raiz Educação</p>
      </div>

      {/* Legenda impressão */}
      <div className="hidden print:flex print:flex-wrap gap-3 mb-4 text-xs">
        {Object.entries(FASE_CONFIG).map(([, cfg]) => (
          <span key={cfg.label} className="flex items-center gap-1">
            <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
        ))}
        {Object.entries(AULA_CONFIG).map(([, cfg]) => (
          <span key={cfg.label} className="flex items-center gap-1">
            <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
        ))}
      </div>

      {/* Timeline */}
      {mesesAgrupados.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-5 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum evento encontrado para os filtros selecionados.
          </p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Ajuste os filtros ou cadastre eventos na Preparação.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {mesesAgrupados.map(([key, { label, eventos: evs }]) => (
            <div key={key}>
              <p
                className="mb-3 text-xs font-semibold uppercase tracking-wider capitalize"
                style={{ color: "rgb(91,184,193)" }}
              >
                {label}
              </p>
              <div className="rounded-xl border border-border bg-card divide-y divide-border/50">
                {evs.map((ev) => (
                  <div key={`${ev.kind}-${ev.data.id}`} className="px-5 py-4">
                    {ev.kind === "fase" ? (
                      <FaseCard fase={ev.data as FaseRow} />
                    ) : (
                      <AulaCard aula={ev.data as AulaRow} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
