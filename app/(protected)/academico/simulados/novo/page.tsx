"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { criarSimulado, getProjetos } from "../actions";
import { SimuladoForm } from "../simulado-form";

type Projeto = { id: string; nome: string; olimpiada_sigla: string; ano_letivo: number };

export default function NovoSimuladoPage() {
  const [state, action] = useActionState(criarSimulado, null);
  const [projetos, setProjetos] = useState<Projeto[]>([]);

  useEffect(() => {
    getProjetos().then(setProjetos);
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
        submitLabel="Criar simulado"
        error={error}
      />
    </div>
  );
}
