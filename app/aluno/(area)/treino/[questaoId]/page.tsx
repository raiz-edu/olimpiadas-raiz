/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import Link from "next/link";
import { getStudentSession } from "@/lib/auth/student-session";
import { getRespostaAluno, getSolucaoQuestao, getAlternativasQuestao } from "../actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { QuestaoRender } from "@/components/questoes/questao-render";

export default async function RevisaoQuestaoPage({
  params,
}: {
  params: Promise<{ questaoId: string }>;
}) {
  const session = await getStudentSession();
  if (!session) redirect("/aluno/login");

  const { questaoId } = await params;

  const admin = createAdminClient() as any;
  const [{ data: questao }, resposta] = await Promise.all([
    admin
      .from("questao")
      .select("*")
      .eq("id", questaoId)
      .eq("ativo", true)
      .eq("status_cadastro", "publicado")
      .single(),
    getRespostaAluno(questaoId),
  ]);

  if (!questao) redirect("/aluno/treino");
  if (!resposta) redirect("/aluno/treino");

  const [alternativas, solucao] = await Promise.all([
    getAlternativasQuestao(questaoId),
    getSolucaoQuestao(questaoId),
  ]);

  let altCorreta: { id: string } | null = null;
  if (questao.tipo === "multipla_escolha") {
    const { data } = await admin
      .from("alternativa")
      .select("id")
      .eq("questao_id", questaoId)
      .eq("correta", true)
      .maybeSingle();
    altCorreta = data;
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/aluno/treino/dashboard" className="hover:text-foreground">
          Desempenho
        </Link>
        <span>/</span>
        <span className="text-foreground">Revisão</span>
      </div>

      <QuestaoRender
        questao={questao}
        alternativas={alternativas}
        solucao={solucao}
        corretaId={altCorreta?.id ?? null}
        resposta={resposta}
      >
        <Link
          href="/aluno/treino/dashboard"
          className="inline-block text-sm text-muted-foreground hover:text-foreground"
        >
          ← Voltar ao desempenho
        </Link>
      </QuestaoRender>
    </div>
  );
}
