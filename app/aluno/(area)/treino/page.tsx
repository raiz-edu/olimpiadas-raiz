import { redirect } from "next/navigation";
import Link from "next/link";
import { getStudentSession } from "@/lib/auth/student-session";
import { getQuestoesTreino, getAlternativasQuestao, getTopicosDisponiveis } from "./actions";
import { TreinoClient } from "./treino-client";

const cls = "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground";

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
  }>;
}) {
  const session = await getStudentSession();
  if (!session) redirect("/aluno/login");

  const sp = await searchParams;
  const [questoes, { topicos, subtopicos }] = await Promise.all([
    getQuestoesTreino({
      olimpiada: sp.olimpiada,
      nivel: sp.nivel,
      fase: sp.fase ? Number(sp.fase) : undefined,
      ano: sp.ano ? Number(sp.ano) : undefined,
      topico: sp.topico,
      subtopico: sp.subtopico,
      modo: (sp.modo ?? "sequencial") as "sequencial" | "aleatorio",
      limit: 30,
    }),
    getTopicosDisponiveis(),
  ]);

  const primeiraAlt = questoes.length > 0 ? await getAlternativasQuestao(questoes[0].id) : [];

  return (
    <div>
      {/* Filtros */}
      <form
        method="GET"
        className="mb-6 flex flex-wrap gap-3 rounded-xl border border-border bg-card p-4"
      >
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Origem
          </span>
          <select
            name="olimpiada"
            defaultValue={sp.olimpiada ?? ""}
            className={`${cls} min-w-[120px]`}
          >
            <option value="">Todas</option>
            <option value="obmep">OBMEP</option>
            <option value="obmep_mirim">OBMEP Mirim</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tópico
          </span>
          <select name="topico" defaultValue={sp.topico ?? ""} className={`${cls} min-w-[140px]`}>
            <option value="">Todos</option>
            {(topicos as string[]).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Subtópico
          </span>
          <select
            name="subtopico"
            defaultValue={sp.subtopico ?? ""}
            className={`${cls} min-w-[160px]`}
          >
            <option value="">Todos</option>
            {(subtopicos as string[]).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Nível
          </span>
          <select name="nivel" defaultValue={sp.nivel ?? ""} className={cls}>
            <option value="">Todos</option>
            <option value="nivel_1">Nível 1</option>
            <option value="nivel_2">Nível 2</option>
            <option value="nivel_3">Nível 3</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Fase
          </span>
          <select name="fase" defaultValue={sp.fase ?? ""} className={cls}>
            <option value="">Todas</option>
            <option value="1">1ª Fase</option>
            <option value="2">2ª Fase</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Ano
          </span>
          <select name="ano" defaultValue={sp.ano ?? ""} className={cls}>
            <option value="">Todos</option>
            {Array.from({ length: 11 }, (_, i) => 2015 + i).map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Modo
          </span>
          <select name="modo" defaultValue={sp.modo ?? "sequencial"} className={cls}>
            <option value="sequencial">Sequencial</option>
            <option value="aleatorio">Aleatório</option>
          </select>
        </div>

        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Filtrar
          </button>
          <Link
            href="/aluno/treino"
            className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Limpar
          </Link>
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
