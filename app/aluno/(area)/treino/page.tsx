import { redirect } from "next/navigation";
import { getStudentSession } from "@/lib/auth/student-session";
import { getQuestoesTreino, getAlternativasQuestao } from "./actions";
import { TreinoClient } from "./treino-client";

export default async function TreinoPage({
  searchParams,
}: {
  searchParams: Promise<{
    olimpiada?: string;
    nivel?: string;
    fase?: string;
    ano?: string;
    assunto?: string;
    modo?: string;
  }>;
}) {
  const session = await getStudentSession();
  if (!session) redirect("/aluno/login");

  const sp = await searchParams;
  const filtros = {
    olimpiada: sp.olimpiada,
    nivel: sp.nivel,
    fase: sp.fase ? Number(sp.fase) : undefined,
    ano: sp.ano ? Number(sp.ano) : undefined,
    assunto: sp.assunto,
    modo: (sp.modo ?? "sequencial") as "sequencial" | "aleatorio",
    limit: 30,
  };

  const questoes = await getQuestoesTreino(filtros);

  // Pré-carrega alternativas da primeira questão (sem o campo correta)
  const primeiraAlt = questoes.length > 0 ? await getAlternativasQuestao(questoes[0].id) : [];

  return (
    <div>
      {/* Filtros */}
      <form method="GET" className="mb-6 flex flex-wrap gap-3 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Olimpíada</span>
          <select name="olimpiada" defaultValue={sp.olimpiada ?? ""} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground min-w-[150px]">
            <option value="">Todas</option>
            <option value="obmep">OBMEP</option>
            <option value="obmep_mirim">OBMEP Mirim</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nível</span>
          <select name="nivel" defaultValue={sp.nivel ?? ""} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
            <option value="">Todos</option>
            <option value="nivel_1">Nível 1</option>
            <option value="nivel_2">Nível 2</option>
            <option value="nivel_3">Nível 3</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fase</span>
          <select name="fase" defaultValue={sp.fase ?? ""} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
            <option value="">Todas</option>
            <option value="1">1ª Fase</option>
            <option value="2">2ª Fase</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ano</span>
          <select name="ano" defaultValue={sp.ano ?? ""} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
            <option value="">Todos</option>
            {Array.from({ length: 11 }, (_, i) => 2015 + i).map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Modo</span>
          <select name="modo" defaultValue={sp.modo ?? "sequencial"} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
            <option value="sequencial">Sequencial</option>
            <option value="aleatorio">Aleatório</option>
          </select>
        </div>
        <div className="flex items-end">
          <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Filtrar
          </button>
        </div>
      </form>

      {questoes.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
          Nenhuma questão encontrada com esses filtros.
        </div>
      ) : (
        <TreinoClient questoes={questoes} primeiraAlt={primeiraAlt} />
      )}
    </div>
  );
}
