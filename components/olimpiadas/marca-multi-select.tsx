"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

function MarcaMultiSelectInner({ marcas }: { marcas: { id: string; nome: string }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Deriva o estado diretamente da URL — nunca fica desatualizado durante navegação
  const marcaParam = searchParams.get("marca") ?? "todas";
  const todosMode = marcaParam === "todas";
  const selected = todosMode ? [] : marcaParam.split(",").filter(Boolean);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function navigate(marcaValue: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("marca", marcaValue);
    router.push(`${pathname}?${params.toString()}`);
  }

  function toggleTodos() {
    if (!todosMode) navigate("todas");
    // Se já está em "todas", não faz nada
  }

  function toggleMarca(nome: string) {
    let next: string[];
    if (todosMode) {
      next = [nome];
    } else {
      next = selected.includes(nome) ? selected.filter((n) => n !== nome) : [...selected, nome];
    }
    navigate(next.length === 0 ? "todas" : next.join(","));
  }

  const label = todosMode
    ? "Todas"
    : selected.length === 1
      ? (selected[0] ?? "")
      : `${selected.length} marcas`;

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
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded-xl border border-border bg-card p-1.5 shadow-lg">
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

          {marcas.map((m) => {
            const checked = todosMode || selected.includes(m.nome);
            return (
              <button
                key={m.id}
                onClick={() => toggleMarca(m.nome)}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-background"
              >
                <Checkbox checked={checked} />
                <span className={checked ? "font-medium text-foreground" : "text-muted-foreground"}>
                  {m.nome}
                </span>
              </button>
            );
          })}
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

export function MarcaMultiSelect({ marcas }: { marcas: { id: string; nome: string }[] }) {
  return (
    <Suspense fallback={null}>
      <MarcaMultiSelectInner marcas={marcas} />
    </Suspense>
  );
}
