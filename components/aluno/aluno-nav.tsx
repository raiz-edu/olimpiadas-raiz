"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAluno } from "@/app/aluno/login/actions";
import type { Aluno } from "@/lib/types/database";

function NavLink({ href, label, exact }: { href: string; label: string; exact?: boolean }) {
  const pathname = usePathname();
  const active = exact
    ? pathname === href
    : pathname.startsWith(href) && (href !== "/aluno/dashboard" || pathname === "/aluno/dashboard");
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-black/8 text-slate-800"
          : "text-slate-500 hover:text-slate-800 hover:bg-black/5"
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

export function AlunoNav({ aluno, marcaSlug }: { aluno: Aluno; marcaSlug?: string | null }) {
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
      <div className="flex h-16 w-full items-center justify-between gap-4 px-6 sm:px-10">
        {/* Logo — lado esquerdo */}
        <Link href="/aluno/dashboard" className="flex shrink-0 items-center gap-3">
          {logoFile ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/marcas/${logoFile}.png`}
              alt={marcaSlug ?? ""}
              className="block max-h-9 max-w-[160px] object-contain"
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

        {/* Lado direito: nav + separador + nome + sair */}
        <div className="hidden sm:flex items-center gap-5">
          {/* Links de navegação */}
          <nav className="flex items-center gap-1">
            <NavLink href="/aluno/dashboard" label="Projetos" />
            <NavLink href="/aluno/treino" label="Banco de Questões" exact />
            <NavLink href="/aluno/treino/dashboard" label="Meu Desempenho" />
          </nav>

          {/* Separador vertical */}
          <div className="h-5 w-px bg-slate-200" />

          {/* Nome e botão Sair */}
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

        {/* Mobile: só o botão Sair */}
        <div className="flex sm:hidden items-center">
          <form action={logoutAluno}>
            <button
              type="submit"
              className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
              style={{ borderColor: "#cbd5e1", color: "#475569", background: "transparent" }}
            >
              Sair
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
