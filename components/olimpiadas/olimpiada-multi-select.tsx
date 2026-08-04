"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { OLIMPIADAS_NACIONAIS } from "@/lib/olimpiadas/nacionais";

// Estrutural (e não o literal de OLIMPIADAS_NACIONAIS) porque a lista exibida
// é montada a partir das siglas que têm dados — inclusive as que não constam
// do catálogo fixo.
type Olimpiada = { sigla: string; nome: string; nivel?: string };

function OlimpiadaSelectInner({ olimpiadas }: { olimpiadas: readonly Olimpiada[] | Olimpiada[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const olimpiadaParam = searchParams.get("olimpiada") ?? "todas";
  const selected = olimpiadaParam === "todas" ? null : olimpiadaParam;

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
    setOpen(false);
  }

  function select(sigla: string) {
    if (selected === sigla) return; // já selecionada — não faz nada
    navigate(sigla);
  }

  const label = selected ?? "—";

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
        <div className="absolute left-0 top-full z-50 mt-1 w-[min(400px,calc(100vw-1rem))] rounded-xl border border-border bg-card p-1.5 shadow-lg">
          {olimpiadas.map((o) => {
            const isSelected = selected === o.sigla;
            return (
              <button
                key={o.sigla}
                onClick={() => select(o.sigla)}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-background"
              >
                <Radio checked={isSelected} />
                <div className="min-w-0 text-left">
                  <span
                    className={`font-medium ${isSelected ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {o.sigla}
                  </span>
                  <span className="ml-1.5 text-xs text-muted-foreground">{o.nome}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Radio({ checked }: { checked: boolean }) {
  return (
    <span
      className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border transition-colors"
      style={
        checked
          ? { backgroundColor: "rgb(91,184,193)", borderColor: "rgb(91,184,193)" }
          : { borderColor: "var(--border)" }
      }
    >
      {checked && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
    </span>
  );
}

export function OlimpiadaMultiSelect({
  olimpiadas = OLIMPIADAS_NACIONAIS,
}: {
  olimpiadas?: readonly Olimpiada[];
}) {
  return (
    <Suspense fallback={null}>
      <OlimpiadaSelectInner olimpiadas={olimpiadas} />
    </Suspense>
  );
}
