"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

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
        const active = selected.includes(ano);
        return (
          <button
            key={ano}
            onClick={() => toggle(ano)}
            className="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
            style={
              active
                ? {
                    backgroundColor: "rgb(91,184,193)",
                    borderColor: "rgb(91,184,193)",
                    color: "#0f172a",
                  }
                : {
                    backgroundColor: "transparent",
                    borderColor: "var(--border)",
                    color: "var(--muted-foreground)",
                  }
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
