import { redirect } from "next/navigation";
import Link from "next/link";
import { getStudentSession } from "@/lib/auth/student-session";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database, PreparacaoProjeto, PreparacaoAula } from "@/lib/types/database";

export const metadata = { title: "Projetos — Plataforma Olímpica" };

const TEAL = "rgb(91,184,193)";

function isLiveNow(dataHora: string | null) {
  if (!dataHora) return false;
  const d = new Date(dataHora);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  return diffMs >= -3 * 60 * 60 * 1000 && diffMs <= 30 * 60 * 1000;
}

type ProjetoComAulas = PreparacaoProjeto & { aulas: PreparacaoAula[] };

export default async function ProjetosPage() {
  const session = await getStudentSession();
  if (!session) redirect("/aluno/login");

  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cs) {
          cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    },
  );

  const { data: inscricoes } = await supabase
    .from("inscricao")
    .select("olimpiada_id")
    .eq("aluno_id", session.aluno.id)
    .eq("status", "confirmada");

  const olimpiadaIds = (inscricoes ?? []).map((i) => i.olimpiada_id);

  let query = supabase
    .from("preparacao_projeto")
    .select("*, aulas:preparacao_aula(*)")
    .eq("publicado", true)
    .eq("ativo", true);

  if (olimpiadaIds.length > 0) {
    query = query.or(`olimpiada_id.is.null,olimpiada_id.in.(${olimpiadaIds.join(",")})`);
  } else {
    query = query.is("olimpiada_id", null);
  }

  const { data: projetos } = await query.order("criado_em", { ascending: false });
  const lista = (projetos ?? []) as unknown as ProjetoComAulas[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Projetos de preparação</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Aulas e materiais organizados por olimpíada.
        </p>
      </div>

      {lista.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum projeto publicado ainda. Volte em breve!
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {lista.map((projeto) => {
            const totalAulas = projeto.aulas.filter(
              (a) => a.tipo !== "simulado" && a.publicada,
            ).length;
            const aulaViva = projeto.aulas.find(
              (a) => a.tipo === "online" && isLiveNow(a.data_hora),
            );
            return (
              <Link
                key={projeto.id}
                href={`/aluno/projeto/${projeto.id}`}
                className="group rounded-lg border border-border bg-card p-4 hover:border-ring transition-colors"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                    style={{ background: TEAL }}
                  >
                    {projeto.olimpiada_sigla}
                  </div>
                  {aulaViva && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                      AO VIVO
                    </span>
                  )}
                </div>
                <h3 className="mb-1 text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  {projeto.nome}
                </h3>
                {projeto.descricao && (
                  <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">
                    {projeto.descricao}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{projeto.ano_letivo}</span>
                  <span>·</span>
                  <span>
                    {totalAulas} {totalAulas === 1 ? "aula" : "aulas"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
