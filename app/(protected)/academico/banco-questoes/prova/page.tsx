/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { QuestaoRender } from "@/components/questoes/questao-render";

const OLIMPIADA_LABEL: Record<string, string> = {
  obmep_mirim: "OBMEP Mirim",
  obmep: "OBMEP",
};

const NIVEL_LABEL: Record<string, string> = {
  nivel_1: "Nível 1",
  nivel_2: "Nível 2",
  nivel_3: "Nível 3",
};

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  publicado: {
    label: "Publicado",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  },
  aguardando_revisao: {
    label: "Aguardando revisão",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  },
};

export default async function ProvaPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{
    olimpiada?: string;
    nivel?: string;
    fase?: string;
    ano?: string;
    ret?: string;
  }>;
}) {
  const session = await getServerSession();
  if (!session || !can(session.user.role, "questao:read")) redirect("/dashboard");

  const { olimpiada, nivel, fase, ano, ret } = await searchParams;
  const voltarHref = ret
    ? `/academico/banco-questoes?${decodeURIComponent(ret)}`
    : "/academico/banco-questoes";
  if (!olimpiada || !nivel || !fase || !ano) redirect(voltarHref);

  const supabase = createAdminClient() as any;
  const { data: questoes } = await supabase
    .from("questao")
    .select("*, alternativa(*), solucao(*)")
    .eq("olimpiada", olimpiada)
    .eq("nivel", nivel)
    .eq("fase", Number(fase))
    .eq("ano", Number(ano))
    .order("numero");

  if (!questoes?.length) redirect(voltarHref);

  const titulo = `${OLIMPIADA_LABEL[olimpiada] ?? olimpiada} · ${fase}ª Fase · ${ano} · ${
    NIVEL_LABEL[nivel] ?? nivel
  }`;
  // Editar volta PARA A PROVA (na questão editada), não para a lista: o ret passado
  // é o path completo da prova + âncora. A página de edição reconhece ret que começa
  // com "/" como caminho absoluto de retorno.
  const provaPath = `/academico/banco-questoes/prova?olimpiada=${olimpiada}&nivel=${nivel}&fase=${fase}&ano=${ano}${
    ret ? `&ret=${encodeURIComponent(ret)}` : ""
  }`;
  const pendentes = questoes.filter((q: any) => q.status_cadastro === "aguardando_revisao").length;

  return (
    <div className="max-w-2xl" data-prova-preview>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href={voltarHref} className="hover:text-foreground">
            Banco de Questões
          </Link>
          <span>/</span>
          <span className="text-foreground">Prova · {titulo}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {questoes.length} questões
          {pendentes > 0 ? ` · ${pendentes} aguardando revisão` : ""}
        </span>
      </div>

      <p className="mb-3 text-xs text-muted-foreground">
        Renderização idêntica à do aluno (gabarito destacado), na ordem da prova.
      </p>

      {/* Índice: pula direto pra questão; âmbar = aguardando revisão */}
      <div className="mb-6 flex flex-wrap gap-1.5">
        {questoes.map((q: any) => (
          <a
            key={q.id}
            href={`#q${q.numero}`}
            className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold transition-colors ${
              q.status_cadastro === "aguardando_revisao"
                ? "border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                : "border-border text-muted-foreground hover:text-foreground hover:bg-card"
            }`}
          >
            {q.numero}
          </a>
        ))}
      </div>

      <div className="space-y-10">
        {questoes.map((q: any) => {
          const alternativas = [...(q.alternativa ?? [])].sort((a: any, b: any) =>
            (a.letra ?? "").localeCompare(b.letra ?? ""),
          );
          const solucao = Array.isArray(q.solucao) ? q.solucao[0] : q.solucao;
          const corretaId = alternativas.find((a: any) => a.correta)?.id ?? null;
          const badge = STATUS_BADGE[q.status_cadastro] ?? {
            label: q.status_cadastro,
            className: "border-border text-muted-foreground",
          };
          return (
            <section
              key={q.id}
              id={`q${q.numero}`}
              className="scroll-mt-24"
              data-prova-questao
              data-numero={q.numero}
              data-questao-id={q.id}
              data-status={q.status_cadastro}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">Questão {q.numero}</span>
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </div>
                <Link
                  href={`/academico/banco-questoes/${q.id}?ret=${encodeURIComponent(`${provaPath}#q${q.numero}`)}`}
                  className="rounded-lg border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
                >
                  Editar
                </Link>
              </div>
              <QuestaoRender
                questao={q}
                alternativas={alternativas}
                solucao={solucao}
                corretaId={corretaId}
              />
            </section>
          );
        })}
      </div>
    </div>
  );
}
