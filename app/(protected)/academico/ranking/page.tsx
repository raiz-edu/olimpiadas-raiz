import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/roles";
import { carregarDadosEngajamento } from "@/lib/engajamento/queries";
import { criarJanelaEstudo } from "@/lib/engajamento/metricas";
import { lerFiltrosRanking, urlRanking } from "@/lib/engajamento/ranking";
import { PainelRanking } from "@/components/engajamento/ranking";

export const metadata = { title: "Ranking por marca — Olimpíadas" };

export default async function RankingMarcaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getServerSession();
  if (!session) return null;
  if (!can(session.user.role, "aluno:read")) redirect("/dashboard");
  const filtros = lerFiltrosRanking(await searchParams);
  const agora = new Date();
  let dados;
  try {
    dados = await carregarDadosEngajamento(agora);
  } catch (erro) {
    console.error(
      "[ranking] Não foi possível carregar a preparação",
      erro instanceof Error ? erro.message : "Erro desconhecido",
    );
    return (
      <section className="rounded-2xl border border-border bg-card p-6" role="alert">
        <h1 className="text-xl font-semibold">Ranking temporariamente indisponível</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Não foi possível carregar todos os dados. Atualize a página para consultar o ranking
          completo.
        </p>
        <Link
          href={urlRanking(filtros)}
          className="mt-4 inline-block rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Tentar novamente
        </Link>
      </section>
    );
  }
  return (
    <PainelRanking
      dados={dados}
      filtros={filtros}
      janela={criarJanelaEstudo(filtros.periodo, agora)}
    />
  );
}
