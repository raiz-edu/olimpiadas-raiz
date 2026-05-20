"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCan } from "@/lib/auth/context";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  soon?: boolean;
};

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

export function Sidebar() {
  const pathname = usePathname();
  const canConvite = useCan("convite:create");
  const canAudit = useCan("audit_log:read");

  const items: NavItem[] = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: (
        <NavIcon d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      ),
    },
    {
      label: "Escola",
      href: "/escola",
      icon: (
        <NavIcon d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      ),
    },
    {
      label: "Olimpíadas",
      href: "/olimpiadas",
      icon: (
        <NavIcon d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      ),
    },
    {
      label: "Inscrições",
      href: "/inscricoes",
      icon: (
        <NavIcon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      ),
    },
    {
      label: "Calendário",
      href: "/calendario",
      icon: (
        <NavIcon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      ),
    },
    {
      label: "Resultados",
      href: "/resultados",
      icon: (
        <NavIcon d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      ),
    },
  ];

  if (canConvite) {
    items.push({
      label: "Usuários",
      href: "/usuarios",
      icon: (
        <NavIcon d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      ),
      soon: true,
    });
  }

  if (canAudit) {
    items.push({
      label: "Analytics",
      href: "/analytics",
      icon: (
        <NavIcon d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      ),
    });
  }

  return (
    <nav className="flex flex-col py-4">
      {items.map((item) => {
        const escolaRoutes = ["/escola", "/unidades", "/turmas", "/alunos"];
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : item.href === "/escola"
              ? escolaRoutes.some((r) => pathname.startsWith(r))
              : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.soon ? "#" : item.href}
            aria-disabled={item.soon}
            className={`flex items-center gap-2.5 border-l-2 px-4 py-2 text-sm transition-colors ${
              isActive
                ? "border-primary bg-white/[0.06] font-medium text-foreground"
                : item.soon
                  ? "cursor-not-allowed border-transparent text-muted-foreground/40"
                  : "border-transparent text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
            }`}
          >
            {item.icon}
            <span className="flex-1">{item.label}</span>
            {item.soon && (
              <span className="rounded-full bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground">
                Em breve
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
