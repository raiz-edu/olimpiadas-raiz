import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getStudentSession } from "@/lib/auth/student-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOlimpiadaIdsConfirmadas } from "@/lib/aluno/projetos-queries";
import { isProjetoVisivelParaAluno } from "@/lib/aluno/simulado-access";
import type { PreparacaoProjeto, PreparacaoAula, PreparacaoMaterial } from "@/lib/types/database";
import { ProjetoPageClient, type AulaCompleta } from "./projeto-page-client";

const TEAL = "rgb(91,184,193)";

type AulaComMateriais = PreparacaoAula & { materiais: PreparacaoMaterial[] };
type ProjetoComAulas = PreparacaoProjeto & { aulas: AulaComMateriais[] };

export default async function ProjetoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await getStudentSession();
  if (!session) redirect("/aluno/login");

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("preparacao_projeto")
    .select("*, aulas:preparacao_aula(*, materiais:preparacao_material(*))")
    .eq("id", id)
    .eq("publicado", true)
    .eq("ativo", true)
    .maybeSingle();

  if (error) {
    console.error("[projetos] Falha ao carregar projeto:", error.message);
    throw new Error("Não foi possível carregar o projeto. Tente novamente.");
  }
  const projeto = data as unknown as ProjetoComAulas | null;
  const olimpiadaIdsConfirmadas = await getOlimpiadaIdsConfirmadas(supabase, session.aluno.id);
  if (!projeto || !isProjetoVisivelParaAluno(projeto, olimpiadaIdsConfirmadas)) notFound();

  // Monta as aulas publicadas com seus materiais de apoio.
  const aulasRaw = projeto.aulas ?? [];

  // Exclui simulados — eles têm área própria em /aluno/simulados
  const aulasCompletas: AulaCompleta[] = await Promise.all(
    aulasRaw
      .filter((a) => a.tipo !== "simulado" && a.publicada)
      .map(async (aula) => {
        // Signed URLs dos materiais
        const materiaisComUrl = await Promise.all(
          (aula.materiais ?? []).map(async (m) => {
            const { data } = await supabase.storage
              .from("preparacao-materiais")
              .createSignedUrl(m.arquivo_path, 3600);
            return { ...m, signedUrl: data?.signedUrl ?? null };
          }),
        );

        return {
          id: aula.id,
          titulo: aula.titulo,
          tipo: aula.tipo,
          modalidade_online: aula.modalidade_online ?? null,
          data_hora: aula.data_hora,
          duracao_minutos: aula.duracao_minutos,
          link_aula: aula.link_aula,
          descricao: aula.descricao,
          polos: aula.polos,
          ordem: aula.ordem,
          materiais: materiaisComUrl,
        } satisfies AulaCompleta;
      }),
  );

  return (
    <div className="space-y-6">
      {/* Botão voltar — destaque para mobile */}
      <Link
        href="/aluno/dashboard"
        className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4"
        >
          <path
            fillRule="evenodd"
            d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
            clipRule="evenodd"
          />
        </svg>
        Projetos
      </Link>

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

      <ProjetoPageClient aulas={aulasCompletas} />
    </div>
  );
}
