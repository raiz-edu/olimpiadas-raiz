"use client";

import { createContext, useContext } from "react";
import type { Aluno } from "@/lib/types/database";

export type AlunoContextValue = {
  aluno: Aluno;
};

const AlunoContext = createContext<AlunoContextValue | null>(null);

export function AlunoProvider({ aluno, children }: { aluno: Aluno; children: React.ReactNode }) {
  return <AlunoContext.Provider value={{ aluno }}>{children}</AlunoContext.Provider>;
}

export function useAluno(): AlunoContextValue {
  const ctx = useContext(AlunoContext);
  if (!ctx) throw new Error("useAluno deve ser usado dentro de AlunoProvider");
  return ctx;
}
