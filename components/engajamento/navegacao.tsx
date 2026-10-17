import Link from "next/link";
import type { FiltrosEngajamento } from "@/lib/engajamento/metricas";

export function NavegacaoPedagogica({
  atual,
  filtros,
}: {
  atual: "desempenho" | "ranking";
  filtros: Pick<
    FiltrosEngajamento,
    "marca" | "unidade" | "olimpiada" | "nivel" | "fase" | "periodo" | "busca"
  >;
}) {
  const params = new URLSearchParams();
  for (const chave of [
    "marca",
    "unidade",
    "olimpiada",
    "nivel",
    "fase",
    "periodo",
    "busca",
  ] as const) {
    if (filtros[chave] !== "") params.set(chave, String(filtros[chave]));
  }
  return (
    <nav aria-label="Visões de acompanhamento" className="flex flex-wrap gap-2">
      {(["desempenho", "ranking"] as const).map((visao) => (
        <Link
          key={visao}
          href={`/academico/${visao}?${params.toString()}`}
          aria-current={atual === visao ? "page" : undefined}
          className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${atual === visao ? "border-teal-300/40 bg-teal-300/10 text-teal-200" : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"}`}
        >
          {visao === "desempenho" ? "Desempenho dos alunos" : "Ranking por marca"}
        </Link>
      ))}
    </nav>
  );
}
