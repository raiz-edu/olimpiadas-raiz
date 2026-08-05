import { redirect } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PageHeader } from "@/components/ui/page-header";
import { getServerSession } from "@/lib/auth/session";
import { podeGerirApostilas } from "@/lib/auth/roles";
import { getNomeModulo, getOpcoesAplicacao } from "@/lib/apostilas/queries";
import { ReceitaForm } from "../receita-form";

export const dynamic = "force-dynamic";

export default async function NovaReceitaPage() {
  const session = await getServerSession();
  if (!session || !podeGerirApostilas(session.user.role, session.user.email)) {
    redirect("/academico/apostilas");
  }
  const [nomeModulo, opcoes] = await Promise.all([getNomeModulo(), getOpcoesAplicacao()]);

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[{ label: nomeModulo, href: "/academico/apostilas" }, { label: "Nova receita" }]}
      />
      <PageHeader
        title="Nova receita"
        description="Monte a apostila clicando: séries, origens, seções por tópico, mix de dificuldade e estilo."
      />
      <ReceitaForm opcoes={opcoes} />
    </div>
  );
}
