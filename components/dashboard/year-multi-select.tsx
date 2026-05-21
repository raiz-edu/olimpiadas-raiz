"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Suspense } from "react";

function YearMultiSelectInner({ anos, selected }: { anos: number[]; selected: number[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
  }

  return (
    <div className="flex flex-wrap gap-2">
      {anos.map((ano) => {
        const isSelected = selected.includes(ano);
        return (
          <button
            key={ano}
            onClick={() => toggle(ano)}
            className={`rounded-lg border px-4 py-1.5 text-sm font-medium transition-colors ${
              isSelected
                ? "text-white"
                : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}
            style={
              isSelected
                ? { backgroundColor: "rgb(91,184,193)", borderColor: "rgb(91,184,193)" }
                : {}
            }
          >
            {ano}
          </button>
        );
      })}
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
