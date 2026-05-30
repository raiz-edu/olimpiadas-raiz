"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAluno } from "@/app/aluno/login/actions";
import type { Aluno } from "@/lib/types/database";

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname.startsWith(href) && (href !== "/aluno/dashboard" || pathname === "/aluno/dashboard");
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${active ? "bg-black/8 text-slate-800" : "text-slate-500 hover:text-slate-800 hover:bg-black/5"}`}
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
      <div className="flex h-24 w-full items-center justify-between px-6 sm:px-10">
        <Link href="/aluno/dashboard" className="flex items-center gap-3">
          {logoFile ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/marcas/${logoFile}.png`}
              alt={marcaSlug ?? ""}
              className={`block object-contain ${
                marcaSlug === "uniao"
                  ? "max-h-16 max-w-[220px]"
                  : ["apogeu", "matriz-educacao", "qi-bilingue"].includes(marcaSlug ?? "")
                    ? "max-h-[77px] max-w-[224px]"
                    : "max-h-20 max-w-[220px]"
              }`}
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

        {/* Links de navegação */}
        <nav className="hidden sm:flex items-center gap-1 ml-4">
          <NavLink href="/aluno/dashboard" label="Projetos" />
          <NavLink href="/aluno/treino" label="Banco de Questões" />
        </nav>

        <div className="flex items-center gap-3 ml-auto">
          <span className="hidden text-right sm:block">
            <p className="text-sm font-medium leading-tight" style={{ color: "#1e293b" }}>
              {aluno.nome}
            </p>
          </span>
          <form action={logoutAluno}>
            <button
              type="submit"
              className="rounded-lg border px-3 py-1.5 text-xs transition-colors"
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
    </header>
  );
}
