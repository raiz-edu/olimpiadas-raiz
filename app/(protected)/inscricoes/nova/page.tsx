import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { can } from "@/lib/auth/roles";
import { PageHeader } from "@/components/ui/page-header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { InscricaoForm } from "../_form";

export const metadata = { title: "Nova Inscrição — Olimpíadas" };

export default async function NovaInscricaoPage() {
  const session = await getServerSession();
  if (!session) return null;

  if (!can(session.user.role, "inscricao:create")) redirect("/inscricoes");

  const supabase = createAdminClient();

  const [{ data: olimpiadas }, { data: alunos }] = await Promise.all([
    supabase
      .from("olimpiada")
      .select("id, nome, ano_letivo, limite_vagas_total, series_elegiveis")
      .eq("ativo", true)
      .order("nome"),
    supabase
      .from("aluno")
      .select("id, nome, turma_id, turma:turma_id(nome, serie, unidade:unidade_id(nome))")
      .eq("ativo", true)
      .order("nome"),
  ]);

  type AlunoRow = NonNullable<typeof alunos>[number];

  const alunosFormatted = (alunos ?? []).map((a: AlunoRow) => {
    const turma = Array.isArray(a.turma) ? a.turma[0] : a.turma;
    const unidade =
      turma &&
      (Array.isArray((turma as { unidade: unknown }).unidade)
        ? ((turma as { unidade: unknown[] }).unidade as { nome: string }[])[0]
        : (turma as { unidade: { nome: string } | null }).unidade);
    return {
      id: a.id,
      nome: a.nome,
      turma_nome: turma ? (turma as { nome: string }).nome : null,
      serie: turma ? (turma as { serie: string }).serie : null,
      unidade_nome: unidade ? (unidade as { nome: string }).nome : null,
    };
  });

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[{ label: "Inscrições", href: "/inscricoes" }, { label: "Nova inscrição" }]}
      />
      <PageHeader title="Nova Inscrição" />
      <div className="rounded-xl border border-border bg-card p-6">
        <InscricaoForm olimpiadas={olimpiadas ?? []} alunos={alunosFormatted} />
      </div>
    </div>
  );
}
