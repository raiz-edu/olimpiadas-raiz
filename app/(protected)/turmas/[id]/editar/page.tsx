import { notFound, redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { can } from "@/lib/auth/roles";
import { PageHeader } from "@/components/ui/page-header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { TurmaForm } from "../../_form";

export const metadata = { title: "Editar Turma — Olimpíadas" };

export default async function EditarTurmaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await getServerSession();
  if (!session) return null;

  if (!can(session.user.role, "turma:update")) redirect("/turmas");

  const supabase = createAdminClient();

  const [{ data: turma }, { data: unidades }] = await Promise.all([
    supabase
      .from("turma")
      .select("id, nome, unidade_id, serie, ano_letivo, ativo")
      .eq("id", id)
      .single(),
    supabase
      .from("unidade")
      .select("id, nome, marca:marca_id(nome)")
      .eq("ativo", true)
      .order("nome"),
  ]);

  if (!turma) notFound();

  type UnidadeRow = NonNullable<typeof unidades>[number];

  const unidadesFormatted = (unidades ?? []).map((u: UnidadeRow) => {
    const marca = Array.isArray(u.marca) ? u.marca[0] : u.marca;
    return {
      id: u.id,
      nome: u.nome,
      marca_nome: marca ? (marca as { nome: string }).nome : null,
    };
  });

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[{ label: "Turmas", href: "/turmas" }, { label: turma.nome }, { label: "Editar" }]}
      />
      <PageHeader title="Editar Turma" />
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <TurmaForm unidades={unidadesFormatted} turma={turma} />
      </div>
    </div>
  );
}
