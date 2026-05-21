"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

function YearMultiSelectInner({ anos, selected }: { anos: number[]; selected: number[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function toggle(ano: number) {
    const next = selected.includes(ano)
      ? selected.filter((a) => a !== ano)
      : [...selected, ano].sort((a, b) => a - b);

    const params = new URLSearchParams(searchParams.toString());
    if (next.length === 0) {
      params.delete("anos");
    } else {
      params.set("anos", next.join(","));
    }
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  }

  const label =
    selected.length === 0
      ? "Selecionar ano"
      : selected.length <= 2
        ? [...selected].sort((a, b) => b - a).join(", ")
        : `${selected.length} anos`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-background"
        style={open ? { borderColor: "rgb(91,184,193)" } : {}}
      >
        <span style={{ color: "rgb(91,184,193)" }}>{label}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-muted-foreground transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[140px] rounded-xl border border-border bg-card p-1.5 shadow-lg">
          {anos.map((ano) => {
            const checked = selected.includes(ano);
            return (
              <label
                key={ano}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-background"
              >
                <span
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors"
                  style={
                    checked
                      ? { backgroundColor: "rgb(91,184,193)", borderColor: "rgb(91,184,193)" }
                      : { borderColor: "var(--border)" }
                  }
                >
                  {checked && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  onChange={() => toggle(ano)}
                />
                <span className={checked ? "font-medium text-foreground" : "text-muted-foreground"}>
                  {ano}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function YearMultiSelect({ anos, selected }: { anos: number[]; selected: number[] }) {
  return (
    <Suspense fallback={null}>
      <YearMultiSelectInner anos={anos} selected={selected} />
    </Suspense>
  );
}
