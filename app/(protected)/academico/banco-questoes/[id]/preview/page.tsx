/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/roles";
import { getQuestaoDetalhe } from "../../actions";
import { QuestaoRender } from "@/components/questoes/questao-render";
import { OLIMPIADA_LABEL } from "@/lib/questoes/olimpiadas";

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  publicado: {
    label: "Publicado",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  },
  aguardando_revisao: {
    label: "Aguardando revisão",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  },
};

export default async function QuestaoPreviewPage({
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
  // searchParams já decodificado pelo Next — não decodar de novo (corrompe ret aninhado)
  const retDec = ret ?? "";
  const voltarHref = retDec
    ? retDec.startsWith("/")
      ? retDec
      : `/academico/banco-questoes?${retDec}`
    : "/academico/banco-questoes";
  const voltarLabel = retDec.startsWith("/academico/banco-questoes/prova")
    ? "Prova"
    : "Banco de Questões";
  const editarHref = `/academico/banco-questoes/${id}${ret ? `?ret=${encodeURIComponent(ret)}` : ""}`;
  const { questao, alternativas, solucao } = await getQuestaoDetalhe(id);
  if (!questao) redirect(voltarHref);

  const corretaId = alternativas.find((a: any) => a.correta)?.id ?? null;
  const status = STATUS_LABEL[questao.status_cadastro] ?? {
    label: questao.status_cadastro,
    className: "border-border text-muted-foreground",
  };

  return (
    <div className="max-w-2xl" data-questao-id={id} data-status-cadastro={questao.status_cadastro}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href={voltarHref} className="hover:text-foreground">
            {voltarLabel}
          </Link>
          <span>/</span>
          <Link href={editarHref} className="hover:text-foreground">
            {OLIMPIADA_LABEL[questao.olimpiada] ?? questao.olimpiada} · {questao.fase}ª Fase ·{" "}
            {questao.ano} · Q{questao.numero}
          </Link>
          <span>/</span>
          <span className="text-foreground">Preview</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${status.className}`}
          >
            {status.label}
          </span>
          <Link
            href={editarHref}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
          >
            Editar
          </Link>
        </div>
      </div>

      <p className="mb-4 text-xs text-muted-foreground">
        Renderização idêntica à revisão do treino do aluno (gabarito destacado).
      </p>

      <QuestaoRender
        questao={questao}
        alternativas={alternativas}
        solucao={solucao}
        corretaId={corretaId}
      />
    </div>
  );
}
