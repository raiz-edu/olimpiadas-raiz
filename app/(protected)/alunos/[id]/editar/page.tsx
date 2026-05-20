import { notFound, redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { can } from "@/lib/auth/roles";
import { PageHeader } from "@/components/ui/page-header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { AlunoForm } from "../../_form";

export const metadata = { title: "Editar Aluno — Olimpíadas" };

export default async function EditarAlunoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await getServerSession();
  if (!session) return null;

  if (!can(session.user.role, "aluno:update")) redirect("/alunos");

  const supabase = createAdminClient();

  const [{ data: aluno }, { data: turmas }] = await Promise.all([
    supabase
      .from("aluno")
      .select("id, nome, turma_id, data_nascimento, cpf, ativo")
      .eq("id", id)
      .single(),
    supabase
      .from("turma")
      .select("id, nome, unidade:unidade_id(nome)")
      .eq("ativo", true)
      .order("nome"),
  ]);

  if (!aluno) notFound();

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
      <Breadcrumbs
        items={[{ label: "Alunos", href: "/alunos" }, { label: aluno.nome }, { label: "Editar" }]}
      />
      <PageHeader title="Editar Aluno" />
      <div className="rounded-xl border border-border bg-card p-6">
        <AlunoForm turmas={turmasFormatted} aluno={aluno} />
      </div>
    </div>
  );
}
