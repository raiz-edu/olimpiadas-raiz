"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useCan } from "@/lib/auth/context";

function NavIcon({ d }: { d: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
      aria-hidden="true"
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

// Search params persistidos por rota
const PERSIST_BASES = ["/resultados/painel", "/olimpiadas"] as const;

function SidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const canConvite = useCan("convite:create");
  const canAudit = useCan("audit_log:read");

  const isInResultados =
    pathname.startsWith("/resultados/painel") || pathname.startsWith("/olimpiadas");
  const [resultadosOpen, setResultadosOpen] = useState(isInResultados);

  // Persiste search params da rota atual
  useEffect(() => {
    for (const base of PERSIST_BASES) {
      if (pathname.startsWith(base)) {
        localStorage.setItem(`nav-search:${base}`, searchParams.toString());
        break;
      }
    }
  }, [pathname, searchParams]);

  function hrefFor(base: string) {
    if (pathname.startsWith(base)) {
      const s = searchParams.toString();
      return s ? `${base}?${s}` : base;
    }
    const saved =
      typeof window !== "undefined" ? (localStorage.getItem(`nav-search:${base}`) ?? "") : "";
    return saved ? `${base}?${saved}` : base;
  }

  const itemClass = (active: boolean, soon = false) =>
    `flex items-center gap-2.5 border-l-2 px-4 py-2 text-sm transition-colors ${
      active
        ? "border-primary bg-white/[0.06] font-medium text-foreground"
        : soon
          ? "cursor-not-allowed border-transparent text-muted-foreground/40"
          : "border-transparent text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
    }`;

  const subItemClass = (active: boolean) =>
    `flex items-center gap-2.5 border-l-2 py-1.5 pl-10 pr-4 text-sm transition-colors ${
      active
        ? "border-primary bg-white/[0.06] font-medium text-foreground"
        : "border-transparent text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
    }`;

  return (
    <nav className="flex flex-col py-4">
      {/* Dashboard */}
      <Link href="/dashboard" className={itemClass(pathname === "/dashboard")}>
        <NavIcon d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        <span className="flex-1">Dashboard</span>
      </Link>

      {/* Resultados (colapsável) */}
      <button
        type="button"
        onClick={() => setResultadosOpen((v) => !v)}
        className={itemClass(isInResultados)}
      >
        <NavIcon d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        <span className="flex-1">Resultados</span>
        <ChevronIcon open={resultadosOpen} />
      </button>

      {resultadosOpen && (
        <>
          <Link
            href={hrefFor("/resultados/painel")}
            className={subItemClass(pathname.startsWith("/resultados/painel"))}
          >
            <NavIcon d="M3 10h18M3 14h18M3 6h18M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
            <span>Painel</span>
          </Link>
          <Link
            href={hrefFor("/olimpiadas")}
            className={subItemClass(pathname.startsWith("/olimpiadas"))}
          >
            <NavIcon d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            <span>Histórico</span>
          </Link>
        </>
      )}

      {/* Inscrições */}
      <Link href="/inscricoes" className={itemClass(pathname.startsWith("/inscricoes"))}>
        <NavIcon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        <span className="flex-1">Inscrições</span>
      </Link>

      {/* Calendário */}
      <Link href="/calendario" className={itemClass(pathname.startsWith("/calendario"))}>
        <NavIcon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        <span className="flex-1">Calendário</span>
      </Link>

      {/* Usuários (condicional + em breve) */}
      {canConvite && (
        <Link href="#" aria-disabled className={itemClass(false, true)}>
          <NavIcon d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          <span className="flex-1">Usuários</span>
          <span className="rounded-full bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground">
            Em breve
          </span>
        </Link>
      )}

      {/* Analytics (condicional) */}
      {canAudit && (
        <Link href="/analytics" className={itemClass(pathname.startsWith("/analytics"))}>
          <NavIcon d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          <span className="flex-1">Analytics</span>
        </Link>
      )}
    </nav>
  );
}

export function Sidebar() {
  return (
    <Suspense fallback={null}>
      <SidebarContent />
    </Suspense>
  );
}
