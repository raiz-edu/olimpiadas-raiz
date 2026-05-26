import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getStudentSession } from "@/lib/auth/student-session";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database, PreparacaoAula, PreparacaoMaterial } from "@/lib/types/database";

type AulaComMateriais = PreparacaoAula & { materiais: PreparacaoMaterial[] };

const TEAL = "rgb(91,184,193)";

function tipoIcon(tipo: string) {
  if (tipo === "online")
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.9L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
      </svg>
    );
  if (tipo === "presencial")
    return (
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    );
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  );
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ProjetoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

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
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    },
  );

  const { data: projeto } = await supabase
    .from("preparacao_projeto")
    .select("*, aulas:preparacao_aula(*, materiais:preparacao_material(*))")
    .eq("id", id)
    .eq("publicado", true)
    .single();

  if (!projeto) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const aulas = ((projeto as any).aulas ?? []) as AulaComMateriais[];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/aluno/dashboard" className="hover:text-foreground transition-colors">
          Projetos
        </Link>
        <span>/</span>
        <span className="text-foreground">{projeto.nome}</span>
      </nav>

      {/* Header */}
      <div>
        <div
          className="mb-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
          style={{ background: TEAL }}
        >
          {projeto.olimpiada_sigla} · {projeto.ano_letivo}
        </div>
        <h1 className="text-2xl font-bold text-foreground">{projeto.nome}</h1>
        {projeto.descricao && (
          <p className="mt-2 text-sm text-muted-foreground">{projeto.descricao}</p>
        )}
      </div>

      {/* Lista de aulas */}
      {aulas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhuma aula publicada ainda. Volte em breve!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {aulas
            .sort((a, b) => a.ordem - b.ordem)
            .map((aula, idx) => (
              <Link
                key={aula.id}
                href={`/aluno/aula/${aula.id}`}
                className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:border-ring transition-colors"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-card">
                  {tipoIcon(aula.tipo)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    <span className="mr-2 text-muted-foreground">{idx + 1}.</span>
                    {aula.titulo}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {aula.data_hora && <span>{fmtDateTime(aula.data_hora)}</span>}
                    {aula.duracao_minutos && <span>· {aula.duracao_minutos} min</span>}
                    {aula.materiais.length > 0 && (
                      <span>
                        · {aula.materiais.length}{" "}
                        {aula.materiais.length === 1 ? "material" : "materiais"}
                      </span>
                    )}
                  </div>
                </div>
                <svg
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}
