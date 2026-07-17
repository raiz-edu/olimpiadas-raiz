import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/roles";
import { getQuestaoDetalhe, excluirQuestao } from "../actions";
import { QuestaoEditForm } from "./questao-edit-form";
import { AlternativasEditor } from "./alternativas-editor";
import { SolucaoEditor } from "./solucao-editor";
import { ConfirmButton } from "@/components/ui/confirm-button";

const OLIMPIADA_LABEL: Record<string, string> = {
  obmep_mirim: "OBMEP Mirim",
  obmep: "OBMEP",
};

export default async function QuestaoDetalhePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ret?: string }>;
}) {
  const session = await getServerSession();
  if (!session || !can(session.user.role, "questao:read")) redirect("/dashboard");

  const { id } = await params;
  const { ret } = await searchParams;
  const voltarHref = ret
    ? `/academico/banco-questoes?${decodeURIComponent(ret)}`
    : "/academico/banco-questoes";
  const { questao, alternativas, solucao, stats } = await getQuestaoDetalhe(id);
  if (!questao) redirect(voltarHref);

  const total = stats.length;
  const acertos = // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stats.filter((r: any) => r.correta).length;
  const pct = total > 0 ? Math.round((acertos / total) * 100) : null;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href={voltarHref} className="hover:text-foreground">
            Banco de Questões
          </Link>
          <span>/</span>
          <span className="text-foreground">
            {OLIMPIADA_LABEL[questao.olimpiada]} · {questao.fase}ª Fase · {questao.ano} · Q
            {questao.numero}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/academico/banco-questoes/${id}/preview`}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
          >
            Ver como o aluno
          </Link>
          {can(session.user.role, "questao:delete") && (
            <form action={excluirQuestao}>
              <input type="hidden" name="id" value={id} />
              <ConfirmButton
                message={`Excluir esta questão permanentemente? Alternativas, resolução e respostas dos alunos serão removidas.`}
                className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
              >
                Excluir questão
              </ConfirmButton>
            </form>
          )}
        </div>
      </div>

      {/* Estatísticas */}
      {total > 0 && (
        <div className="flex gap-4 rounded-xl border border-border bg-card p-4 text-sm">
          <div className="text-center">
            <div className="text-xl font-bold text-foreground">{total}</div>
            <div className="text-xs text-muted-foreground">respostas</div>
          </div>
          <div className="text-center">
            <div
              className={`text-xl font-bold ${pct! >= 60 ? "text-emerald-400" : "text-amber-400"}`}
            >
              {pct}%
            </div>
            <div className="text-xs text-muted-foreground">acertos</div>
          </div>
        </div>
      )}

      {/* Dados da questão */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Dados da questão</h2>
        <QuestaoEditForm questao={questao} />
      </section>

      {/* Alternativas */}
      {questao.tipo === "multipla_escolha" && (
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Alternativas</h2>
          <AlternativasEditor questaoId={id} alternativas={alternativas} stats={stats} />
        </section>
      )}

      {/* Solução */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Resolução</h2>
        <SolucaoEditor
          questaoId={id}
          solucao={solucao}
          videoUrl={questao.video_url}
          imagemUrl={solucao?.imagem_url}
          temResolucaoVideo={questao.tem_resolucao_video}
          temResolucaoTexto={questao.tem_resolucao_texto}
        />
      </section>
    </div>
  );
}
