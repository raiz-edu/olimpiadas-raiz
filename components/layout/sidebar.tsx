"use client";

import { useState, useEffect, type ReactNode } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
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
      className="h-[18px] w-[18px] shrink-0"
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

// ─── Item base ────────────────────────────────────────────────────────────────
// Todos os itens usam <button> para garantir renderização idêntica.
// Navegação via router.push() — elimina divergência <a> vs <button>.

const ITEM =
  "relative flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm leading-5 outline-none transition-colors";

const SUB_ITEM =
  "relative flex w-full items-center py-1.5 pl-11 pr-4 text-left text-[13px] leading-5 outline-none transition-colors";

function Item({
  active = false,
  disabled = false,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  const cls =
    ITEM +
    (active
      ? " bg-white/[0.07] font-medium text-foreground"
      : disabled
        ? " cursor-not-allowed opacity-40"
        : " text-muted-foreground hover:bg-white/[0.04] hover:text-foreground");

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={cls}>
      {active && <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-r-full bg-primary" />}
      {children}
    </button>
  );
}

function SubItem({
  active = false,
  disabled = false,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  const cls =
    SUB_ITEM +
    (active
      ? " bg-white/[0.07] font-medium text-foreground"
      : disabled
        ? " cursor-not-allowed opacity-40"
        : " text-muted-foreground/70 hover:bg-white/[0.04] hover:text-foreground");

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={cls}>
      {active && <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-r-full bg-primary" />}
      {children}
    </button>
  );
}

function Divider() {
  return <div className="mx-4 my-2 h-px bg-border/40" />;
}

// ─── Conteúdo ─────────────────────────────────────────────────────────────────

const PERSIST_BASES = [
  "/resultados/painel",
  "/olimpiadas",
  "/academico/olimpiadas",
  "/academico/preparacao",
  "/academico/banco-questoes",
  "/academico/banco-questoes/raio-x",
] as const;

function SidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const canConvite = useCan("convite:create");
  const canAudit = useCan("audit_log:read");

  const isInResultados = pathname.startsWith("/resultados/painel");
  const [resultadosOpen, setResultadosOpen] = useState(isInResultados);

  const isInAcademico = pathname.startsWith("/academico");
  const [academicoOpen, setAcademicoOpen] = useState(isInAcademico);

  useEffect(() => {
    for (const base of PERSIST_BASES) {
      if (pathname === base) {
        localStorage.setItem(`nav-search:${base}`, searchParams.toString());
        break;
      }
    }
  }, [pathname, searchParams]);

  function hrefFor(base: string) {
    if (pathname === base) {
      const s = searchParams.toString();
      return s ? `${base}?${s}` : base;
    }
    const saved =
      typeof window !== "undefined" ? (localStorage.getItem(`nav-search:${base}`) ?? "") : "";
    return saved ? `${base}?${saved}` : base;
  }

  function go(base: string) {
    router.push(hrefFor(base));
  }

  return (
    <nav className="flex flex-col py-3">
      <Item active={pathname === "/dashboard"} onClick={() => go("/dashboard")}>
        <NavIcon d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        <span>Dashboard</span>
      </Item>

      <Divider />

      <Item active={isInResultados} onClick={() => setResultadosOpen((v) => !v)}>
        <NavIcon d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        <span className="flex-1">Resultados</span>
        <ChevronIcon open={resultadosOpen} />
      </Item>

      {resultadosOpen && (
        <>
          <SubItem
            active={pathname.startsWith("/resultados/painel")}
            onClick={() => go("/resultados/painel")}
          >
            Painel
          </SubItem>
          <SubItem active={pathname.startsWith("/olimpiadas")} onClick={() => go("/olimpiadas")}>
            Histórico
          </SubItem>
        </>
      )}

      <Item active={isInAcademico} onClick={() => setAcademicoOpen((v) => !v)}>
        <NavIcon d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        <span className="flex-1">Acadêmico</span>
        <ChevronIcon open={academicoOpen} />
      </Item>

      {academicoOpen && (
        <>
          <SubItem
            active={pathname.startsWith("/academico/olimpiadas")}
            onClick={() => go("/academico/olimpiadas")}
          >
            Olimpíadas
          </SubItem>
          <SubItem
            active={pathname.startsWith("/academico/preparacao")}
            onClick={() => go("/academico/preparacao")}
          >
            Projetos
          </SubItem>
          <SubItem
            active={pathname.startsWith("/academico/simulados")}
            onClick={() => go("/academico/simulados")}
          >
            Simulados
          </SubItem>
          <SubItem
            active={pathname.startsWith("/academico/calendario")}
            onClick={() => go("/academico/calendario")}
          >
            Calendário
          </SubItem>
          <SubItem
            active={
              pathname.startsWith("/academico/banco-questoes") &&
              !pathname.startsWith("/academico/banco-questoes/raio-x")
            }
            onClick={() => go("/academico/banco-questoes")}
          >
            Banco de Questões
          </SubItem>
          <SubItem
            active={pathname.startsWith("/academico/banco-questoes/raio-x")}
            onClick={() => go("/academico/banco-questoes/raio-x")}
          >
            Raio-X do Banco de Questões
          </SubItem>
        </>
      )}

      {canAudit && (
        <>
          <Divider />
          <Item active={pathname.startsWith("/analytics")} onClick={() => go("/analytics")}>
            <NavIcon d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            <span>Gestão</span>
          </Item>
        </>
      )}

      {canConvite && (
        <>
          <Divider />
          <Item active={pathname.startsWith("/usuarios")} onClick={() => go("/usuarios")}>
            <NavIcon d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            <span>Usuários</span>
          </Item>
        </>
      )}

      {canAudit && (
        <>
          <Divider />
          <Item onClick={() => window.open("/aluno/login", "_blank")}>
            <NavIcon d="M12 2a6 6 0 100 12 6 6 0 000-12z M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
            <span className="flex-1">Plataforma Olímpica</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              className="h-3 w-3 shrink-0 opacity-50"
              aria-hidden="true"
            >
              <path d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
            </svg>
          </Item>
          <Item active={pathname.startsWith("/configuracoes")} onClick={() => go("/configuracoes")}>
            <NavIcon d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            <span>Vídeo da tela de login</span>
          </Item>
        </>
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
