import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { can } from "@/lib/auth/roles";
import { PageHeader } from "@/components/ui/page-header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { UnidadeForm } from "../_form";

export const metadata = { title: "Nova Unidade — Olimpíadas" };

export default async function NovaUnidadePage() {
  const session = await getServerSession();
  if (!session) return null;

  if (!can(session.user.role, "unidade:create")) redirect("/unidades");

  const supabase = createAdminClient();
  const { data: marcas } = await supabase
    .from("marca")
    .select("id, nome")
    .eq("ativo", true)
    .order("nome");

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Unidades", href: "/unidades" }, { label: "Nova unidade" }]} />
      <PageHeader title="Nova Unidade" />
      <div className="rounded-xl border border-border bg-card p-6">
        <UnidadeForm marcas={marcas ?? []} />
      </div>
    </div>
  );
}
