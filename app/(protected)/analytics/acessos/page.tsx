import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/roles";
import { carregarDadosAcessos } from "@/lib/acessos/queries";
import { inicioPeriodoAcesso, lerFiltrosAcesso, type ParamsAcesso } from "@/lib/acessos/metricas";
import { PainelAcessos } from "@/components/acessos/painel";

export const metadata = { title: "Acessos e participação — Olimpíadas" };

export default async function PaginaAcessos({
  searchParams,
}: {
  searchParams: Promise<ParamsAcesso>;
}) {
  const session = await getServerSession();
  if (!session) redirect("/login");
  if (!can(session.user.role, "audit_log:read")) redirect("/dashboard");
  const filtros = lerFiltrosAcesso(await searchParams);
  const agora = new Date();
  let dados;
  try {
    dados = await carregarDadosAcessos(inicioPeriodoAcesso(filtros.periodo, agora), agora);
  } catch {
    return (
      <div className="max-w-2xl space-y-4 rounded-2xl border border-border bg-card p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Acadêmico</p>
        <h1 className="text-2xl font-bold">Acessos e participação</h1>
        <p role="alert" className="text-sm text-muted-foreground">
          Os indicadores estão indisponíveis no momento. Tente novamente. Se o problema continuar,
          peça à administração para conferir a implantação e o vínculo da sua marca.
        </p>
        <Link
          href="/analytics/acessos"
          className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Tentar novamente
        </Link>
        <Link href="/analytics" className="ml-4 text-sm text-primary underline underline-offset-4">
          Voltar à gestão
        </Link>
      </div>
    );
  }
  if (dados.escopo) {
    if (filtros.marca && !dados.escopo.includes(filtros.marca)) redirect("/analytics/acessos");
    filtros.marca = dados.escopo[0]!;
  } else if (
    filtros.marca &&
    filtros.marca !== "sem-marca" &&
    !dados.marcas.some((m) => m.id === filtros.marca)
  ) {
    filtros.marca = "";
  }
  return (
    <PainelAcessos {...dados} filtros={filtros} agora={agora} restrito={dados.escopo !== null} />
  );
}
