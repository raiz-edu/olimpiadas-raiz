"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export const OLIMPIADAS_NACIONAIS = [
  {
    sigla: "OBMEP",
    nome: "Olimpíada Brasileira de Matemática das Escolas Públicas",
    nivel: "EF II · EM",
  },
  { sigla: "OBM", nome: "Olimpíada Brasileira de Matemática", nivel: "EF II · EM" },
  {
    sigla: "OBA",
    nome: "Olimpíada Brasileira de Astronomia e Astronáutica",
    nivel: "EF I · EF II · EM",
  },
  { sigla: "OBF", nome: "Olimpíada Brasileira de Física", nivel: "EF II · EM" },
  {
    sigla: "OBFEP",
    nome: "Olimpíada Brasileira de Física das Escolas Públicas",
    nivel: "EF II · EM",
  },
  { sigla: "OBQ", nome: "Olimpíada Brasileira de Química", nivel: "EF II · EM" },
  { sigla: "OBB", nome: "Olimpíada Brasileira de Biologia", nivel: "EM" },
  { sigla: "OBL", nome: "Olimpíada Brasileira de Linguística", nivel: "EM" },
  { sigla: "OBG", nome: "Olimpíada Brasileira de Geografia", nivel: "EF II · EM" },
  { sigla: "ONHB", nome: "Olimpíada Nacional em História do Brasil", nivel: "EF II · EM" },
  { sigla: "OBI", nome: "Olimpíada Brasileira de Informática", nivel: "EF · EM" },
  { sigla: "OBR", nome: "Olimpíada Brasileira de Robótica", nivel: "EF · EM" },
  { sigla: "OBCT", nome: "Olimpíada Brasileira de Ciências da Terra", nivel: "EF II · EM" },
  { sigla: "ONC", nome: "Olimpíada Nacional de Ciências", nivel: "EF · EM" },
  { sigla: "OBN", nome: "Olimpíada Brasileira de Neurociências", nivel: "EM" },
  {
    sigla: "OBICT",
    nome: "Olimpíada Brasileira de Inovação, Ciência e Tecnologia",
    nivel: "EF II · EM",
  },
  { sigla: "OP", nome: "Olimpíada de Português — Escrevendo o Futuro", nivel: "EF II" },
  { sigla: "OBEF", nome: "Olimpíada Brasileira de Educação Financeira", nivel: "EF II · EM" },
  { sigla: "Canguru", nome: "Canguru de Matemática Brasil", nivel: "EF · EM" },
] as const;

type Olimpiada = (typeof OLIMPIADAS_NACIONAIS)[number];

function OlimpiadaMultiSelectInner({
  olimpiadas,
  selected,
  todosMode,
}: {
  olimpiadas: readonly Olimpiada[];
  selected: string[];
  todosMode: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function navigate(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("olimpiada", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  function toggleTodos() {
    navigate(todosMode ? (olimpiadas[0]?.sigla ?? "todas") : "todas");
  }

  function toggleOlimpiada(sigla: string) {
    let next: string[];
    if (todosMode) {
      next = [sigla];
    } else {
      next = selected.includes(sigla) ? selected.filter((s) => s !== sigla) : [...selected, sigla];
    }
    navigate(next.length === 0 ? "todas" : next.join(","));
  }

  const label = todosMode
    ? "Todas"
    : selected.length === 1
      ? (selected[0] ?? "")
      : `${selected.length} olimpíadas`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm transition-colors hover:bg-background focus:outline-none"
        style={open ? { borderColor: "rgb(91,184,193)" } : {}}
      >
        <span style={{ color: "rgb(91,184,193)" }} className="font-medium">
          {label}
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
        <div className="absolute left-0 top-full z-50 mt-1 w-[300px] rounded-xl border border-border bg-card p-1.5 shadow-lg">
          {/* Opção Todas */}
          <button
            onClick={toggleTodos}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-background"
          >
            <Checkbox checked={todosMode} />
            <span className={todosMode ? "font-medium text-foreground" : "text-muted-foreground"}>
              Todas
            </span>
          </button>

          <div className="my-1 h-px bg-border/50" />

          {/* Lista com scroll */}
          <div className="max-h-72 overflow-y-auto">
            {olimpiadas.map((o) => {
              const checked = todosMode || selected.includes(o.sigla);
              return (
                <button
                  key={o.sigla}
                  onClick={() => toggleOlimpiada(o.sigla)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-background"
                >
                  <Checkbox checked={checked} />
                  <div className="min-w-0 text-left">
                    <span
                      className={`font-medium ${checked ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      {o.sigla}
                    </span>
                    <span className="ml-1.5 truncate text-xs text-muted-foreground">{o.nome}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Checkbox({ checked }: { checked: boolean }) {
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

export function OlimpiadaMultiSelect({
  selected,
  todosMode,
}: {
  selected: string[];
  todosMode: boolean;
}) {
  return (
    <Suspense fallback={null}>
      <OlimpiadaMultiSelectInner
        olimpiadas={OLIMPIADAS_NACIONAIS}
        selected={selected}
        todosMode={todosMode}
      />
    </Suspense>
  );
}
