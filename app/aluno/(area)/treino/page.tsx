import { redirect } from "next/navigation";
import { getStudentSession } from "@/lib/auth/student-session";
import {
  getQuestoesTreino,
  getAlternativasQuestao,
  getTopicosDisponiveis,
  getFavoritos,
} from "./actions";
import { TreinoClient } from "./treino-client";
import { TreinoFiltros } from "./treino-filtros";

export default async function TreinoPage({
  searchParams,
}: {
  searchParams: Promise<{
    olimpiada?: string;
    nivel?: string;
    fase?: string;
    ano?: string;
    topico?: string;
    subtopico?: string;
    modo?: string;
    favoritas?: string;
    erradas?: string;
  }>;
}) {
  const session = await getStudentSession();
  if (!session) redirect("/aluno/login");

  const sp = await searchParams;
  const favoritasAtivo = sp.favoritas === "1";
  const erradasAtivo = sp.erradas === "1";

  const [{ questoes, totalDisponivel }, { olimpiadas, topicosMap, subtopicosMap }, favoritoIds] =
    await Promise.all([
      getQuestoesTreino({
        olimpiada: sp.olimpiada,
        nivel: sp.nivel,
        fase: sp.fase ? Number(sp.fase) : undefined,
        ano: sp.ano ? Number(sp.ano) : undefined,
        topico: sp.topico,
        subtopico: sp.subtopico,
        modo: (sp.modo ?? "sequencial") as "sequencial" | "aleatorio",
        favoritas: favoritasAtivo,
        erradas: erradasAtivo,
      }),
      getTopicosDisponiveis(),
      getFavoritos(),
    ]);

  const primeiraAlt = questoes.length > 0 ? await getAlternativasQuestao(questoes[0].id) : [];

  return (
    <div>
      <TreinoFiltros
        key={`${sp.olimpiada}-${sp.topico}-${sp.subtopico}-${sp.nivel}-${sp.fase}-${sp.ano}-${sp.modo}-${sp.favoritas}`}
        olimpiadas={olimpiadas}
        topicosMap={topicosMap}
        subtopicosMap={subtopicosMap}
        defaults={sp}
        favoritasAtivo={favoritasAtivo}
      />

      {questoes.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
          {favoritasAtivo
            ? "Você ainda não favoritou nenhuma questão."
            : erradasAtivo
              ? "Nenhuma questão errada encontrada."
              : "Nenhuma questão encontrada com esses filtros."}
        </div>
      ) : (
        <TreinoClient
          questoes={questoes}
          primeiraAlt={primeiraAlt}
          totalDisponivel={totalDisponivel}
          favoritoIdsIniciais={favoritoIds}
        />
      )}
    </div>
  );
}
