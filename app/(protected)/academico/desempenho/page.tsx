import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/roles";
import { carregarDadosEngajamento } from "@/lib/engajamento/queries";
import {
  criarJanelaEstudo,
  lerFiltrosEngajamento,
  montarAlunosEngajamento,
} from "@/lib/engajamento/metricas";
import { PainelEngajamento } from "@/components/engajamento/painel";

export const metadata = { title: "Engajamento e Desempenho — Olimpíadas" };

export default async function EngajamentoDesempenhoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getServerSession();
  if (!session) return null;
  if (!can(session.user.role, "aluno:read")) redirect("/dashboard");
  const filtros = lerFiltrosEngajamento(await searchParams);
  const agora = new Date();
  let dados;
  try {
    dados = await carregarDadosEngajamento(agora);
  } catch (erro) {
    console.error(
      "[engajamento] Não foi possível carregar o painel",
      erro instanceof Error ? erro.message : "Erro desconhecido",
    );
    return (
      <section className="rounded-2xl border border-border bg-card p-6" role="alert">
        <h1 className="text-xl font-semibold">Indicadores temporariamente indisponíveis</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Não foi possível carregar todos os dados. Atualize o painel para consultar os indicadores
          completos.
        </p>
        <Link
          href="/academico/desempenho"
          className="mt-4 inline-block rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Tentar novamente
        </Link>
      </section>
    );
  }
  const janela = criarJanelaEstudo(filtros.periodo, agora);
  return (
    <PainelEngajamento
      alunos={montarAlunosEngajamento(dados, janela)}
      filtros={filtros}
      janela={janela}
    />
  );
}
