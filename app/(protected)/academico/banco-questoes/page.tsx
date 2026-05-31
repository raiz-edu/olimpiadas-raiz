/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/roles";
import { PageHeader } from "@/components/ui/page-header";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { getQuestoes, excluirQuestao } from "./actions";

const OLIMPIADA_LABEL: Record<string, string> = {
  obmep_mirim: "OBMEP Mirim",
  obmep: "OBMEP",
};

export default async function BancoQuestoesPage({
  searchParams,
}: {
  searchParams: Promise<{ olimpiada?: string; fase?: string; ano?: string }>;
}) {
  const session = await getServerSession();
  if (!session || !can(session.user.role, "questao:read")) redirect("/dashboard");

  const sp = await searchParams;
  const questoes = await getQuestoes({
    olimpiada: sp.olimpiada as "obmep_mirim" | "obmep" | undefined,
    fase: sp.fase ? Number(sp.fase) : undefined,
    ano: sp.ano ? Number(sp.ano) : undefined,
  });

  return (
    <div>
      <PageHeader
        title="Banco de Questões"
        description="OBMEP · Questões de múltipla escolha e abertas"
        action={
          can(session.user.role, "questao:create")
            ? { label: "Nova Questão", href: "/academico/banco-questoes/nova" }
            : undefined
        }
      />

      {/* Filtros */}
      <form method="GET" className="mb-6 flex flex-wrap gap-3">
        <select
          name="olimpiada"
          defaultValue={sp.olimpiada ?? ""}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        >
          <option value="">Todas as olimpíadas</option>
          <option value="obmep">OBMEP</option>
          <option value="obmep_mirim">OBMEP Mirim</option>
        </select>
        <select
          name="fase"
          defaultValue={sp.fase ?? ""}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        >
          <option value="">Todas as fases</option>
          <option value="1">1ª Fase</option>
          <option value="2">2ª Fase</option>
        </select>
        <select
          name="ano"
          defaultValue={sp.ano ?? ""}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        >
          <option value="">Todos os anos</option>
          {Array.from({ length: 11 }, (_, i) => 2015 + i).map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Filtrar
        </button>
        <Link
          href="/academico/banco-questoes"
          className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          Limpar
        </Link>
      </form>

      {questoes.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
          Nenhuma questão encontrada.{" "}
          {can(session.user.role, "questao:create") && (
            <Link href="/academico/banco-questoes/nova" className="text-primary hover:underline">
              Cadastrar primeira questão →
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="px-4 py-3 text-left font-semibold">Olimpíada</th>
                <th className="px-4 py-3 text-left font-semibold">Nível</th>
                <th className="px-4 py-3 text-left font-semibold">Fase</th>
                <th className="px-4 py-3 text-left font-semibold">Ano</th>
                <th className="px-4 py-3 text-left font-semibold">Nº</th>
                <th className="px-4 py-3 text-left font-semibold">Assunto</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {questoes.map((q: any) => (
                <tr key={q.id} className="border-b border-border/40 hover:bg-background/50">
                  <td className="px-4 py-3 font-medium">
                    {OLIMPIADA_LABEL[q.olimpiada] ?? q.olimpiada}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{q.nivel ?? "—"}</td>
                  <td className="px-4 py-3">{q.fase}ª</td>
                  <td className="px-4 py-3">{q.ano}</td>
                  <td className="px-4 py-3">{q.numero}</td>
                  <td className="px-4 py-3 text-muted-foreground">{q.assunto ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${q.ativo ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-500/10 text-zinc-400"}`}
                    >
                      {q.ativo ? "Ativa" : "Inativa"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/academico/banco-questoes/${q.id}`}
                        className="text-primary hover:underline text-xs"
                      >
                        Editar
                      </Link>
                      {can(session.user.role, "questao:delete") && (
                        <form action={excluirQuestao}>
                          <input type="hidden" name="id" value={q.id} />
                          <ConfirmButton
                            message={`Excluir questão ${q.numero} (${q.fase}ª fase · ${q.ano})? Esta ação não pode ser desfeita.`}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors"
                          >
                            Excluir
                          </ConfirmButton>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
