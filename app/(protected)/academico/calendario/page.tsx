import { getServerSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  CalendarioAcademicoPage,
  type FaseRow,
  type AulaRow,
  type ProjetoOpt,
} from "@/components/academico/calendario/calendario-page";

export const metadata = { title: "Calendário Acadêmico" };

export default async function CalendarioAcademicoServerPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string }>;
}) {
  const session = await getServerSession();
  if (!session) return null;

  const sp = await searchParams;
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session.user as any;
  const isAdmin = user.role === "raiz";

  const [{ data: fasesData }, { data: aulasData }, marcaResult, todasMarcasResult] =
    await Promise.all([
      supabase
        .from("olimpiada_fase")
        .select(
          "id, tipo, nome, data_inicio, data_fim, observacoes, olimpiada:olimpiada_id(nome, ano_letivo, series_elegiveis)",
        )
        .order("data_inicio", { ascending: true }),
      supabase
        .from("preparacao_aula")
        .select(
          "id, titulo, tipo, data_hora, duracao_minutos, link_aula, polos, projeto:projeto_id(id, nome, olimpiada_sigla, ano_letivo, series_elegiveis)",
        )
        .eq("publicada", true)
        .not("data_hora", "is", null)
        .order("data_hora", { ascending: true }),
      isAdmin || !user.marca_ativa_id
        ? Promise.resolve(null)
        : supabase.from("marca").select("slug").eq("id", user.marca_ativa_id).single(),
      isAdmin
        ? supabase.from("marca").select("nome, slug").eq("ativo", true).order("nome")
        : Promise.resolve(null),
    ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fases: FaseRow[] = (fasesData ?? []).map((f: any) => ({
    id: f.id,
    tipo: f.tipo,
    nome: f.nome,
    data_inicio: f.data_inicio,
    data_fim: f.data_fim,
    observacoes: f.observacoes ?? null,
    olimpiada_nome: f.olimpiada?.nome ?? "—",
    olimpiada_sigla: "",
    olimpiada_ano: f.olimpiada?.ano_letivo ?? 0,
    // normaliza "6º ano" → "6º" para consistência com SERIES_TO_SEG
    series_elegiveis: (f.olimpiada?.series_elegiveis ?? []).map((s: string) =>
      s.replace(/\s+ano$/i, "").trim(),
    ),
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const aulas: AulaRow[] = (aulasData ?? []).map((a: any) => ({
    id: a.id,
    titulo: a.titulo,
    tipo: a.tipo,
    data_hora: a.data_hora,
    duracao_minutos: a.duracao_minutos ?? null,
    link_aula: a.link_aula ?? null,
    polos: a.polos ?? null,
    projeto_id: a.projeto?.id ?? null,
    projeto_nome: a.projeto?.nome ?? "—",
    olimpiada_sigla: a.projeto?.olimpiada_sigla ?? "—",
    projeto_ano: a.projeto?.ano_letivo ?? 0,
    series_elegiveis: (a.projeto?.series_elegiveis ?? []).map((s: string) =>
      s.replace(/\s+ano$/i, "").trim(),
    ),
  }));

  const anosSet = new Set<number>();
  fases.forEach((f) => {
    if (f.olimpiada_ano) anosSet.add(f.olimpiada_ano);
  });
  aulas.forEach((a) => {
    if (a.projeto_ano) anosSet.add(a.projeto_ano);
  });
  const anos = [...anosSet].filter((a) => a >= 2026).sort((a, b) => b - a);

  // Projetos únicos para o filtro
  const projetosMap = new Map<string, ProjetoOpt>();
  aulas.forEach((a) => {
    if (a.projeto_id && !projetosMap.has(a.projeto_id)) {
      projetosMap.set(a.projeto_id, { id: a.projeto_id, nome: a.projeto_nome });
    }
  });
  const projetos = [...projetosMap.values()].sort((a, b) => a.nome.localeCompare(b.nome));

  const marcaSlug: string | null = isAdmin
    ? null
    : // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((marcaResult as any)?.data?.slug ?? null);
  const todasMarcas: Array<{ nome: string; slug: string }> = isAdmin
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((todasMarcasResult as any)?.data ?? [])
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Calendário Acadêmico</h1>
        <p className="mt-1 text-sm text-muted-foreground">Fases olímpicas e aulas de preparação</p>
      </div>
      <CalendarioAcademicoPage
        fases={fases}
        aulas={aulas}
        anos={anos}
        anoParam={sp.ano}
        projetos={projetos}
        isAdmin={isAdmin}
        marcaSlug={marcaSlug}
        todasMarcas={todasMarcas}
      />
    </div>
  );
}
