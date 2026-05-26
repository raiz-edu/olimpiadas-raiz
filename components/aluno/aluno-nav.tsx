"use client";

import Link from "next/link";
import { logoutAluno } from "@/app/aluno/login/actions";
import type { Aluno } from "@/lib/types/database";

const TEAL = "rgb(91,184,193)";

export function AlunoNav({ aluno }: { aluno: Aluno }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
        <Link href="/aluno/dashboard" className="flex items-center gap-2">
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
          <span className="text-sm font-semibold text-foreground">Plataforma Olímpica</span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="hidden text-right sm:block">
            <p className="text-sm font-medium text-foreground leading-tight">{aluno.nome}</p>
          </span>
          <form action={logoutAluno}>
            <button
              type="submit"
              className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
            >
              Sair
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
