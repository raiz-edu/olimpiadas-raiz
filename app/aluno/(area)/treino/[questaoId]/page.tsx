/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import Link from "next/link";
import { getStudentSession } from "@/lib/auth/student-session";
import { getRespostaAluno, getSolucaoQuestao, getAlternativasQuestao } from "../actions";
import { createAdminClient } from "@/lib/supabase/admin";

const OLIMPIADA_LABEL: Record<string, string> = { obmep_mirim: "OBMEP Mirim", obmep: "OBMEP" };
const TEAL = "rgb(91,184,193)";

export default async function RevisaoQuestaoPage({
  params,
}: {
  params: Promise<{ questaoId: string }>;
}) {
  const session = await getStudentSession();
  if (!session) redirect("/aluno/login");

  const { questaoId } = await params;

  const admin = createAdminClient() as any;
  const [{ data: questao }, alternativas, solucao, resposta] = await Promise.all([
    admin.from("questao").select("*").eq("id", questaoId).single(),
    getAlternativasQuestao(questaoId),
    getSolucaoQuestao(questaoId),
    getRespostaAluno(questaoId),
  ]);

  if (!questao) redirect("/aluno/treino");

  // Busca a alternativa correta para exibir no gabarito
  const { data: altCorreta } = await admin
    .from("alternativa")
    .select("id")
    .eq("questao_id", questaoId)
    .eq("correta", true)
    .maybeSingle();

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/aluno/treino/dashboard" className="hover:text-foreground">
          Desempenho
        </Link>
        <span>/</span>
        <span className="text-foreground">Revisão</span>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        {/* Meta */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
            {OLIMPIADA_LABEL[questao.olimpiada] ?? questao.olimpiada}
          </span>
          <span className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground">
            {questao.fase != null ? `${questao.fase}ª Fase · ` : ""}
            {questao.ano}
          </span>
          {questao.assunto && (
            <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-400">
              {questao.assunto}
            </span>
          )}
        </div>

        {/* Enunciado (blocos texto+imagem ou texto plano legado) */}
        {Array.isArray((questao as any).enunciado_blocos) ? (
          (
            (questao as any).enunciado_blocos as Array<{
              tipo: string;
              conteudo?: string;
              url?: string;
              largura?: string;
            }>
          ).map((b, i) =>
            b.tipo === "texto" ? (
              <p
                key={i}
                className="text-[15px] leading-relaxed text-foreground whitespace-pre-wrap"
              >
                {b.conteudo}
              </p>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={b.url}
                alt={`Figura ${i + 1}`}
                className="rounded-lg border border-border"
                style={
                  b.largura && b.largura !== "completa"
                    ? {
                        maxWidth: (
                          { pequena: "200px", media: "320px", grande: "480px" } as Record<
                            string,
                            string
                          >
                        )[b.largura],
                      }
                    : { maxWidth: "100%" }
                }
              />
            ),
          )
        ) : (
          <>
            <p className="text-[15px] leading-relaxed text-foreground whitespace-pre-wrap">
              {questao.enunciado}
            </p>
            {questao.imagem_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={questao.imagem_url}
                alt="Figura"
                className="max-w-full rounded-lg border border-border"
              />
            )}
          </>
        )}

        {/* Alternativas (read-only com gabarito) */}
        <div className="space-y-2">
          {alternativas.map((alt: any) => {
            const isCorreta = alt.id === altCorreta?.id;
            const isAluno = alt.id === resposta?.alternativa_id;
            return (
              <div
                key={alt.id}
                className={`flex items-start gap-3 rounded-lg border-2 p-3 ${isCorreta ? "border-emerald-500 bg-emerald-500/8" : isAluno && !resposta?.correta ? "border-red-500 bg-red-500/8" : "border-border opacity-60"}`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${isCorreta ? "border-emerald-500 text-emerald-400" : "border-muted-foreground text-muted-foreground"}`}
                >
                  {alt.letra}
                </span>
                <div className="flex-1">
                  {alt.texto && <p className="text-sm text-foreground">{alt.texto}</p>}
                  {alt.imagem_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={alt.imagem_url}
                      alt={`Alt ${alt.letra}`}
                      className="mt-1 rounded border border-border"
                      style={{
                        width:
                          (
                            {
                              pequena: "120px",
                              media: "220px",
                              grande: "360px",
                              completa: "100%",
                            } as Record<string, string>
                          )[(alt as any).imagem_largura ?? "media"] ?? "220px",
                        maxWidth: "100%",
                      }}
                    />
                  )}
                  {isAluno && !resposta?.correta && (
                    <p className="text-xs text-red-400 mt-1">← sua resposta</p>
                  )}
                  {isCorreta && <p className="text-xs text-emerald-400 mt-1">✓ resposta correta</p>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Gabarito / Resolução */}
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke={TEAL}
              strokeWidth="2"
            >
              <path d="M9 12l2 2 4-4" />
              <circle cx="12" cy="12" r="10" />
            </svg>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: TEAL }}>
              Gabarito
            </span>
          </div>
          <div className="p-5 space-y-4">
            {solucao?.texto ? (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Resolução
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {solucao.texto}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Resolução em texto não disponível.
              </p>
            )}
            {solucao?.imagem_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={solucao.imagem_url}
                alt="Resolução"
                className="max-w-full rounded-lg border border-border"
              />
            )}
            {questao.video_url && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Resolução em vídeo
                </p>
                <a
                  href={questao.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-violet-500/30 bg-violet-500/8 px-4 py-3 hover:bg-violet-500/15 transition-colors"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-500">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                      <polygon points="5,3 19,12 5,21" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Assistir resolução</p>
                    <p className="text-xs text-violet-400">Abre em nova aba</p>
                  </div>
                </a>
              </div>
            )}
          </div>
        </div>

        <Link
          href="/aluno/treino/dashboard"
          className="inline-block text-sm text-muted-foreground hover:text-foreground"
        >
          ← Voltar ao desempenho
        </Link>
      </div>
    </div>
  );
}
