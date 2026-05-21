"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

function YearSelectInner({ anos, selected }: { anos: number[]; selected: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("ano", e.target.value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={selected}
        onChange={onChange}
        className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-background focus:outline-none"
        style={{ color: "rgb(91,184,193)" }}
      >
        {anos.map((ano) => (
          <option key={ano} value={ano} style={{ color: "inherit", backgroundColor: "#1e293b" }}>
            {ano}
          </option>
        ))}
      </select>
    </div>
  );
}

export function YearMultiSelect({ anos, selected }: { anos: number[]; selected: number }) {
  return (
    <Suspense fallback={null}>
      <YearSelectInner anos={anos} selected={selected} />
    </Suspense>
  );
}
