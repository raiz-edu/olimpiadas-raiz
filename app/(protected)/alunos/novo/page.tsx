import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { can } from "@/lib/auth/roles";
import { PageHeader } from "@/components/ui/page-header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { AlunoForm } from "../_form";

export const metadata = { title: "Novo Aluno — Olimpíadas" };

export default async function NovoAlunoPage() {
  const session = await getServerSession();
  if (!session) return null;

  if (!can(session.user.role, "aluno:create")) redirect("/alunos");

  const supabase = createAdminClient();
  const { data: turmas } = await supabase
    .from("turma")
    .select("id, nome, unidade:unidade_id(nome)")
    .eq("ativo", true)
    .order("nome");

  type TurmaRow = NonNullable<typeof turmas>[number];

  const turmasFormatted = (turmas ?? []).map((t: TurmaRow) => {
    const unidade = Array.isArray(t.unidade) ? t.unidade[0] : t.unidade;
    return {
      id: t.id,
      nome: t.nome,
      unidade_nome: unidade ? (unidade as { nome: string }).nome : null,
    };
  });

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Alunos", href: "/alunos" }, { label: "Novo aluno" }]} />
      <PageHeader title="Novo Aluno" />
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <AlunoForm turmas={turmasFormatted} />
      </div>
    </div>
  );
}
