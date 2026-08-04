import { notFound, redirect } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PageHeader } from "@/components/ui/page-header";
import { getServerSession } from "@/lib/auth/session";
import { podeGerirApostilas } from "@/lib/auth/roles";
import { getNomeModulo, getReceita } from "@/lib/apostilas/queries";
import { ReceitaForm } from "../../receita-form";

export const dynamic = "force-dynamic";

export default async function EditarReceitaPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session || !podeGerirApostilas(session.user.role, session.user.email)) {
    redirect("/academico/apostilas");
  }
  const { id } = await params;
  const [nomeModulo, receita] = await Promise.all([getNomeModulo(), getReceita(id)]);
  if (!receita) notFound();

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: nomeModulo, href: "/academico/apostilas" },
          { label: receita.nome, href: `/academico/apostilas/${receita.id}` },
          { label: "Editar" },
        ]}
      />
      <PageHeader title={`Editar: ${receita.nome}`} />
      <ReceitaForm
        receitaId={receita.id}
        nomeInicial={receita.nome}
        configInicial={receita.config}
      />
    </div>
  );
}
