import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getStudentSession } from "@/lib/auth/student-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOlimpiadaIdsConfirmadas } from "@/lib/aluno/projetos-queries";
import { isProjetoVisivelParaAluno } from "@/lib/aluno/simulado-access";
import type { PreparacaoProjeto, PreparacaoAula, PreparacaoMaterial } from "@/lib/types/database";
import { AulaPlayer } from "@/components/aluno/aula-player";
import { MaterialList } from "@/components/aluno/material-list";

type ProjetoDaAula = Pick<
  PreparacaoProjeto,
  "id" | "nome" | "olimpiada_sigla" | "olimpiada_id" | "publicado" | "ativo"
>;
type AulaComMateriais = PreparacaoAula & {
  materiais: PreparacaoMaterial[];
  projeto: ProjetoDaAula | null;
};

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

function isLiveNow(dataHora: string | null) {
  if (!dataHora) return false;
  const d = new Date(dataHora);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  return diffMs >= -3 * 60 * 60 * 1000 && diffMs <= 30 * 60 * 1000;
}

function isBeforeLive(dataHora: string | null) {
  if (!dataHora) return false;
  return new Date(dataHora).getTime() - Date.now() > 30 * 60 * 1000;
}

export default async function AulaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await getStudentSession();
  if (!session) redirect("/aluno/login");

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("preparacao_aula")
    .select(
      "*, materiais:preparacao_material(*), projeto:preparacao_projeto(id, nome, olimpiada_sigla, olimpiada_id, publicado, ativo)",
    )
    .eq("id", id)
    .eq("publicada", true)
    .neq("tipo", "simulado")
    .maybeSingle();

  if (error) {
    console.error("[projetos] Falha ao carregar aula:", error.message);
    throw new Error("Não foi possível carregar a aula. Tente novamente.");
  }
  const aula = data as unknown as AulaComMateriais | null;
  const olimpiadaIdsConfirmadas = await getOlimpiadaIdsConfirmadas(supabase, session.aluno.id);
  if (
    !aula ||
    !aula.publicada ||
    aula.tipo === "simulado" ||
    !isProjetoVisivelParaAluno(aula.projeto, olimpiadaIdsConfirmadas)
  )
    notFound();

  const materiais = aula.materiais ?? [];
  const materiaisComUrl = await Promise.all(
    materiais.map(async (m) => {
      const { data } = await supabase.storage
        .from("preparacao-materiais")
        .createSignedUrl(m.arquivo_path, 300);
      return { ...m, signedUrl: data?.signedUrl ?? null };
    }),
  );

  const projeto = aula.projeto;
  const isLive = aula.tipo === "online" && isLiveNow(aula.data_hora);
  const waitingForLive = aula.tipo === "online" && isBeforeLive(aula.data_hora);

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/aluno/dashboard" className="hover:text-foreground transition-colors">
          Projetos
        </Link>
        {projeto && (
          <>
            <span>/</span>
            <Link
              href={`/aluno/projeto/${projeto.id}`}
              className="hover:text-foreground transition-colors"
            >
              {projeto.nome}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-foreground">{aula.titulo}</span>
      </nav>

      <div>
        <div className="mb-1 flex flex-wrap items-center gap-2">
          {isLive && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-500">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              AO VIVO
            </span>
          )}
          <span className="text-xs text-muted-foreground capitalize">{aula.tipo}</span>
          {aula.duracao_minutos && (
            <span className="text-xs text-muted-foreground">
              · {String(Math.floor(aula.duracao_minutos / 3600)).padStart(2, "0")}:
              {String(Math.floor((aula.duracao_minutos % 3600) / 60)).padStart(2, "0")}:
              {String(aula.duracao_minutos % 60).padStart(2, "0")}
            </span>
          )}
        </div>
        <h1 className="text-xl font-bold text-foreground">{aula.titulo}</h1>
        {aula.data_hora && (
          <p className="mt-1 text-sm text-muted-foreground">{fmtDateTime(aula.data_hora)}</p>
        )}
        {aula.descricao && <p className="mt-2 text-sm text-muted-foreground">{aula.descricao}</p>}
      </div>

      {aula.link_aula && !waitingForLive && (
        <AulaPlayer url={aula.link_aula} titulo={aula.titulo} isLive={isLive} />
      )}

      {waitingForLive && !isLive && (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
            <svg
              className="h-5 w-5 text-red-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <p className="font-medium text-foreground">Aula ainda não iniciada</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Acesse esta página no horário da aula para assistir ao vivo.
          </p>
          {aula.data_hora && (
            <p className="mt-2 text-sm font-medium" style={{ color: "rgb(91,184,193)" }}>
              {fmtDateTime(aula.data_hora)}
            </p>
          )}
        </div>
      )}

      {materiaisComUrl.length > 0 && <MaterialList materiais={materiaisComUrl} />}

      {aula.polos && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Polos
          </p>
          <p className="mt-1 text-sm text-foreground">{aula.polos}</p>
        </div>
      )}
    </div>
  );
}
