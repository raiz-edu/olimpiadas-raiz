"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAluno } from "@/app/aluno/login/actions";
import type { Aluno } from "@/lib/types/database";

/* ── Desktop nav link ─────────────────────────────────────────────────────── */
function NavLink({
  href,
  label,
  exact,
  onClick,
}: {
  href: string;
  label: string;
  exact?: boolean;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = exact
    ? pathname === href
    : pathname.startsWith(href) && (href !== "/aluno/dashboard" || pathname === "/aluno/dashboard");
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-black/8 text-slate-800"
          : "text-slate-500 hover:bg-black/5 hover:text-slate-800"
      }`}
    >
      {label}
    </Link>
  );
}

/* ── Mobile nav link (tap-target maior) ──────────────────────────────────── */
function MobileNavLink({
  href,
  label,
  exact,
  onClick,
}: {
  href: string;
  label: string;
  exact?: boolean;
  onClick: () => void;
}) {
  const pathname = usePathname();
  const active = exact
    ? pathname === href
    : pathname.startsWith(href) && (href !== "/aluno/dashboard" || pathname === "/aluno/dashboard");
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex w-full items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
        active
          ? "bg-slate-100 text-slate-800"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
      }`}
    >
      {label}
    </Link>
  );
}

const TEAL = "rgb(91,184,193)";

const SLUG_TO_LOGO: Record<string, string> = {
  americano: "americano",
  apogeu: "apogeu",
  "matriz-educacao": "matriz",
  "qi-bilingue": "qi",
  uniao: "uniao",
  unificado: "unificado",
};

/* ── Componente principal ─────────────────────────────────────────────────── */
export function AlunoNav({ aluno, marcaSlug }: { aluno: Aluno; marcaSlug?: string | null }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  const logoFile = marcaSlug ? SLUG_TO_LOGO[marcaSlug] : null;

  return (
    <header
      className="sticky top-0 z-30 border-b"
      style={{
        background: "#ffffff",
        borderColor: "#e2e8f0",
        boxShadow: "0 1px 4px rgba(0,0,0,0.10)",
      }}
    >
      {/* ── Barra principal ─────────────────────────────────────────────── */}
      <div className="flex h-14 w-full items-center justify-between gap-4 px-4 sm:h-20 sm:px-10">
        {/* Logo */}
        <Link href="/aluno/dashboard" className="flex shrink-0 items-center gap-3">
          {logoFile ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/marcas/${logoFile}.png`}
              alt={marcaSlug ?? ""}
              className="block max-h-9 max-w-[160px] object-contain sm:max-h-14 sm:max-w-[200px]"
            />
          ) : (
            <>
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: TEAL }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="8" r="6" />
                  <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                </svg>
              </div>
              <span className="text-sm font-semibold" style={{ color: "#1e293b" }}>
                Plataforma Olímpica
              </span>
            </>
          )}
        </Link>

        {/* Desktop: nav + separador + nome + sair */}
        <div className="hidden sm:flex items-center gap-5">
          <nav className="flex items-center gap-1">
            <NavLink href="/aluno/projetos" label="Projetos" />
            <NavLink href="/aluno/simulados" label="Simulados" />
            <NavLink href="/aluno/treino" label="Questões" exact />
            <NavLink href="/aluno/treino/dashboard" label="Meu Desempenho" />
          </nav>

          <div className="h-5 w-px bg-slate-200" />

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium" style={{ color: "#1e293b" }}>
              {aluno.nome.split(" ")[0]}
            </span>
            <form action={logoutAluno}>
              <button
                type="submit"
                className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
                style={{ borderColor: "#cbd5e1", color: "#475569", background: "transparent" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "#e2e8f0";
                  (e.currentTarget as HTMLButtonElement).style.color = "#1e293b";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color = "#475569";
                }}
              >
                Sair
              </button>
            </form>
          </div>
        </div>

        {/* Mobile: botão hamburger */}
        <button
          className="flex sm:hidden items-center justify-center rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
        >
          {menuOpen ? (
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* ── Menu mobile (dropdown) ──────────────────────────────────────── */}
      {menuOpen && (
        <div
          className="sm:hidden border-t px-4 py-3 space-y-1"
          style={{ borderColor: "#e2e8f0", background: "#ffffff" }}
        >
          <MobileNavLink href="/aluno/projetos" label="Projetos" onClick={closeMenu} />
          <MobileNavLink href="/aluno/simulados" label="Simulados" onClick={closeMenu} />
          <MobileNavLink href="/aluno/treino" label="Questões" exact onClick={closeMenu} />
          <MobileNavLink
            href="/aluno/treino/dashboard"
            label="Meu Desempenho"
            onClick={closeMenu}
          />

          <div
            className="mt-3 pt-3 flex items-center justify-between"
            style={{ borderTop: "1px solid #e2e8f0" }}
          >
            <span className="px-4 text-sm font-medium" style={{ color: "#1e293b" }}>
              {aluno.nome.split(" ")[0]}
            </span>
            <form action={logoutAluno}>
              <button
                type="submit"
                className="rounded-lg border px-4 py-2 text-xs font-medium"
                style={{ borderColor: "#cbd5e1", color: "#475569" }}
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
