import { notFound, redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { can } from "@/lib/auth/roles";
import { PageHeader } from "@/components/ui/page-header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { UnidadeForm } from "../../_form";

export const metadata = { title: "Editar Unidade — Olimpíadas" };

export default async function EditarUnidadePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await getServerSession();
  if (!session) return null;

  if (!can(session.user.role, "unidade:update")) redirect("/unidades");

  const supabase = createAdminClient();

  const [{ data: unidade }, { data: marcas }] = await Promise.all([
    supabase
      .from("unidade")
      .select("id, nome, cidade, estado, ativo, marca_id")
      .eq("id", id)
      .single(),
    supabase.from("marca").select("id, nome").eq("ativo", true).order("nome"),
  ]);

  if (!unidade) notFound();

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Unidades", href: "/unidades" },
          { label: unidade.nome, href: `/unidades/${id}` },
          { label: "Editar" },
        ]}
      />
      <PageHeader title="Editar Unidade" />
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <UnidadeForm marcas={marcas ?? []} unidade={unidade} />
      </div>
    </div>
  );
}
