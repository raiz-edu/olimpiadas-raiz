import { notFound, redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { can } from "@/lib/auth/roles";
import { PageHeader } from "@/components/ui/page-header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { OlimpiadaForm } from "../../_form";

export const metadata = { title: "Editar Olimpíada — Olimpíadas" };

export default async function EditarOlimpiadaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await getServerSession();
  if (!session) return null;

  if (!can(session.user.role, "olimpiada:update")) redirect("/olimpiadas");

  const supabase = createAdminClient();
  const { data: olimpiada } = await supabase
    .from("olimpiada")
    .select(
      "id, nome, area_conhecimento, classificacao, ano_letivo, organizacao_promotora, premiacao, regulamento_link_externo, faixa_etaria_min, faixa_etaria_max, limite_vagas_total, series_elegiveis, ativo",
    )
    .eq("id", id)
    .single();

  if (!olimpiada) notFound();

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Olimpíadas", href: "/olimpiadas" },
          { label: olimpiada.nome, href: `/olimpiadas/${id}` },
          { label: "Editar" },
        ]}
      />
      <PageHeader title="Editar Olimpíada" />
      <div className="rounded-xl border border-border bg-card p-6">
        <OlimpiadaForm olimpiada={olimpiada} />
      </div>
    </div>
  );
}
