import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getStudentSession } from "@/lib/auth/student-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/types/database";
import { getAlternativasQuestao } from "@/app/aluno/(area)/treino/actions";
import { ProjetoPageClient, type AulaCompleta } from "./projeto-page-client";

const TEAL = "rgb(91,184,193)";

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
        getAll() { return cookieStore.getAll(); },
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

  const adminClient = createAdminClient();

  // Busca questões e monta AulaCompleta para cada aula
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const aulasRaw = ((projeto as any).aulas ?? []) as any[];

  const aulasCompletas: AulaCompleta[] = await Promise.all(
    aulasRaw.map(async (aula: any) => {
      // 1. Signed URLs dos materiais
      const materiaisComUrl = await Promise.all(
        (aula.materiais ?? []).map(async (m: any) => {
          const { data } = await (adminClient as any).storage
            .from("preparacao-materiais")
            .createSignedUrl(m.arquivo_path, 3600);
          return { ...m, signedUrl: data?.signedUrl ?? null };
        }),
      );

      // 2. Questões vinculadas à aula
      const { data: aulaQuestoes } = await (adminClient as any)
        .from("preparacao_aula_questao")
        .select(
          "*, questao:questao_id(id, olimpiada, nivel, fase, ano, numero, enunciado, enunciado_blocos, imagem_url, assunto, topico, subtopico, tipo, video_url, ativo)",
        )
        .eq("aula_id", aula.id)
        .order("ordem");

      const questoes = ((aulaQuestoes ?? []) as any[])
        .map((aq: any) => aq.questao)
        .filter((q: any) => q && q.ativo);

      // 3. Alternativas da primeira questão (pré-carregamento)
      const primeiraAlt = questoes.length > 0
        ? await getAlternativasQuestao(questoes[0].id)
        : [];

      return {
        id: aula.id,
        titulo: aula.titulo,
        tipo: aula.tipo,
        data_hora: aula.data_hora,
        duracao_minutos: aula.duracao_minutos,
        link_aula: aula.link_aula,
        descricao: aula.descricao,
        polos: aula.polos,
        ordem: aula.ordem,
        materiais: materiaisComUrl,
        questoes,
        primeiraAlt,
      } satisfies AulaCompleta;
    }),
  );

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/aluno/dashboard" className="hover:text-foreground transition-colors">
          Projetos
        </Link>
        <span>/</span>
        <span className="text-foreground">{projeto.nome}</span>
      </nav>

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

      <ProjetoPageClient projetoId={id} aulas={aulasCompletas} />
    </div>
  );
}
