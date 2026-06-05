"use client";

import { useActionState } from "react";
import Link from "next/link";
import { criarSimulado, getProjetos, getTurmas } from "../actions";
import { SimuladoForm } from "../simulado-form";
import { useEffect, useState } from "react";

type Projeto = { id: string; nome: string; olimpiada_sigla: string; ano_letivo: number };
type Turma = {
  id: string;
  nome: string;
  serie: string;
  ano_letivo: number;
  unidade_nome: string;
};

export default function NovoSimuladoPage() {
  const [state, action] = useActionState(criarSimulado, null);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);

  useEffect(() => {
    getProjetos().then(setProjetos);
    getTurmas().then(setTurmas);
  }, []);

  const error = state && "error" in state ? state.error : null;

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/academico/simulados" className="hover:text-foreground">
          Simulados
        </Link>
        <span>/</span>
        <span className="text-foreground">Novo simulado</span>
      </div>

      <h1 className="mb-6 text-xl font-bold text-foreground">Novo Simulado</h1>

      <SimuladoForm
        action={action}
        projetos={projetos}
        turmas={turmas}
        submitLabel="Criar simulado"
        error={error}
      />
    </div>
  );
}
