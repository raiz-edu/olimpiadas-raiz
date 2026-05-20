import Link from "next/link";
import { getServerSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = { title: "Calendário — Olimpíadas" };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const TIPO_FASE_LABEL: Record<string, string> = {
  inscricao: "Inscrição",
  prova_1: "Prova 1",
  prova_2: "Prova 2",
  final: "Final",
  divulgacao: "Divulgação",
};

const TIPO_FASE_COLOR: Record<string, string> = {
  inscricao: "border-blue-400   bg-blue-50   text-blue-700",
  prova_1: "border-amber-400  bg-amber-50  text-amber-700",
  prova_2: "border-orange-400 bg-orange-50 text-orange-700",
  final: "border-purple-400 bg-purple-50 text-purple-700",
  divulgacao: "border-green-400  bg-green-50  text-green-700",
};

const TIPO_FASE_DOT: Record<string, string> = {
  inscricao: "bg-blue-400",
  prova_1: "bg-amber-400",
  prova_2: "bg-orange-400",
  final: "bg-purple-400",
  divulgacao: "bg-green-400",
};

function parseDateLocal(iso: string): Date {
  const parts = iso.split("-");
  const y = parseInt(parts[0]!, 10);
  const m = parseInt(parts[1]!, 10);
  const d = parseInt(parts[2]!, 10);
  return new Date(y, m - 1, d);
}

function formatDay(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

type SearchParams = { ano?: string; area?: string; marca?: string };

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getServerSession();
  if (!session) return null;

  const sp = await searchParams;
  const anoAtual = new Date().getFullYear();
  const ano = sp.ano ? parseInt(sp.ano, 10) : anoAtual;
  const filterArea = sp.area ?? "";
  const filterMarca = sp.marca ?? "";

  const supabase = createAdminClient();

  // Fases do ano selecionado (com olimpíada e marcas)
  const query = supabase
    .from("olimpiada_fase")
    .select(
      `
      id, nome, tipo, data_inicio, data_fim, ordem, observacoes,
      olimpiada:olimpiada_id (
        id, nome, area_conhecimento, ativo,
        marcas:olimpiada_marca ( marca:marca_id ( id, nome, cor_primaria ) )
      )
    `,
    )
    .gte("data_inicio", `${ano}-01-01`)
    .lte("data_fim", `${ano}-12-31`)
    .order("data_inicio");

  const [{ data: fases }, { data: areas }, { data: marcas }] = await Promise.all([
    query,
    supabase.from("olimpiada").select("area_conhecimento").order("area_conhecimento"),
    supabase.from("marca").select("id, nome, cor_primaria").eq("ativo", true).order("nome"),
  ]);

  // Áreas únicas para o filtro
  const areasUnicas = [...new Set((areas ?? []).map((a) => a.area_conhecimento))];

  // Filtrar fases
  type FaseRow = NonNullable<typeof fases>[number];
  const fasesFiltradas = (fases ?? ([] as FaseRow[])).filter((f) => {
    const olimpiada = Array.isArray(f.olimpiada) ? f.olimpiada[0] : f.olimpiada;
    if (!olimpiada) return false;
    if (!(olimpiada as { ativo: boolean }).ativo) return false;
    if (filterArea && (olimpiada as { area_conhecimento: string }).area_conhecimento !== filterArea)
      return false;
    if (filterMarca) {
      const marcasOlimpiada =
        (olimpiada as { marcas: { marca: { id: string } | { id: string }[] | null }[] }).marcas ??
        [];
      const marcaIds = marcasOlimpiada
        .map((m) => {
          const marca = Array.isArray(m.marca) ? m.marca[0] : m.marca;
          return marca ? (marca as { id: string }).id : null;
        })
        .filter(Boolean);
      if (!marcaIds.includes(filterMarca)) return false;
    }
    return true;
  });

  // Agrupar por mês (uma fase pode aparecer em múltiplos meses se ultrapassar o limite)
  const porMes: Map<number, FaseRow[]> = new Map();
  for (let m = 0; m < 12; m++) porMes.set(m, []);

  for (const fase of fasesFiltradas) {
    const inicio = parseDateLocal(fase.data_inicio);
    const fim = parseDateLocal(fase.data_fim);
    const mesInicio = inicio.getMonth();
    const mesFim = Math.min(fim.getMonth(), 11);
    for (let m = mesInicio; m <= mesFim; m++) {
      porMes.get(m)!.push(fase);
    }
  }

  const mesesComFases = Array.from(porMes.entries()).filter(([, fs]) => fs.length > 0);

  const buildUrl = (params: Record<string, string>) => {
    const current: Record<string, string> = {};
    if (sp.ano) current.ano = sp.ano;
    if (sp.area) current.area = sp.area;
    if (sp.marca) current.marca = sp.marca;
    const merged = { ...current, ...params };
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(merged).filter(([, v]) => v)),
    ).toString();
    return `/calendario${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Calendário" description="Fases das olimpíadas ao longo do ano" />

      {/* Controles */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Navegação de ano */}
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-1">
          <Link
            href={buildUrl({ ano: String(ano - 1) })}
            className="rounded px-2 py-1.5 text-sm text-gray-500 hover:bg-gray-100"
            aria-label="Ano anterior"
          >
            ‹
          </Link>
          <span className="min-w-[3.5rem] text-center text-sm font-semibold text-gray-900">
            {ano}
          </span>
          <Link
            href={buildUrl({ ano: String(ano + 1) })}
            className="rounded px-2 py-1.5 text-sm text-gray-500 hover:bg-gray-100"
            aria-label="Próximo ano"
          >
            ›
          </Link>
        </div>

        {/* Filtro área */}
        <form method="GET" className="flex flex-wrap items-center gap-2">
          {sp.ano && <input type="hidden" name="ano" value={sp.ano} />}
          {sp.marca && <input type="hidden" name="marca" value={sp.marca} />}
          <select
            name="area"
            defaultValue={filterArea}
            onChange={(e) => (e.currentTarget.form as HTMLFormElement)?.requestSubmit()}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Todas as áreas</option>
            {areasUnicas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          {sp.ano && <input type="hidden" name="ano" value={sp.ano} />}
          {sp.area && <input type="hidden" name="area" value={sp.area} />}
          <select
            name="marca"
            defaultValue={filterMarca}
            onChange={(e) => (e.currentTarget.form as HTMLFormElement)?.requestSubmit()}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Todas as marcas</option>
            {(marcas ?? []).map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Filtrar
          </button>
          {(filterArea || filterMarca) && (
            <Link
              href={buildUrl({ area: "", marca: "" })}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Limpar
            </Link>
          )}
        </form>

        <span className="ml-auto text-xs text-gray-400">
          {fasesFiltradas.length} {fasesFiltradas.length === 1 ? "fase" : "fases"}
        </span>
      </div>

      {/* Legenda de tipos */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(TIPO_FASE_LABEL).map(([tipo, label]) => (
          <span key={tipo} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span
              className={`h-2.5 w-2.5 rounded-full ${TIPO_FASE_DOT[tipo]}`}
              aria-hidden="true"
            />
            {label}
          </span>
        ))}
      </div>

      {/* Timeline */}
      {mesesComFases.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center">
          <p className="text-sm font-medium text-gray-700">Nenhuma fase encontrada em {ano}</p>
          <p className="mt-1 text-xs text-gray-400">Ajuste os filtros ou navegue para outro ano.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {mesesComFases.map(([mesIdx, fasesDoMes]) => (
            <section key={mesIdx}>
              {/* Cabeçalho do mês */}
              <div className="mb-3 flex items-center gap-3">
                <h2 className="text-sm font-semibold text-gray-900">{MESES[mesIdx]}</h2>
                <div className="flex-1 border-t border-gray-200" />
                <span className="text-xs text-gray-400">
                  {fasesDoMes.length} {fasesDoMes.length === 1 ? "fase" : "fases"}
                </span>
              </div>

              {/* Cards de fases */}
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {fasesDoMes.map((f) => {
                  const olimpiada = Array.isArray(f.olimpiada) ? f.olimpiada[0] : f.olimpiada;
                  const colorClass =
                    TIPO_FASE_COLOR[f.tipo] ?? "border-gray-300 bg-gray-50 text-gray-700";
                  const marcasOlimpiada = olimpiada
                    ? ((olimpiada as { marcas: { marca: unknown }[] }).marcas ?? [])
                    : [];

                  return (
                    <div
                      key={`${f.id}-${mesIdx}`}
                      className={`rounded-lg border-l-4 p-3 ${colorClass}`}
                    >
                      {/* Tipo badge + datas */}
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-xs font-medium">
                          {TIPO_FASE_LABEL[f.tipo] ?? f.tipo}
                        </span>
                        <span className="text-xs opacity-70 shrink-0">
                          {formatDay(f.data_inicio)} – {formatDay(f.data_fim)}
                        </span>
                      </div>

                      {/* Nome da fase */}
                      <p className="text-sm font-semibold text-gray-900 leading-snug">{f.nome}</p>

                      {/* Olimpíada */}
                      {olimpiada && (
                        <Link
                          href={`/olimpiadas/${(olimpiada as { id: string }).id}`}
                          className="mt-0.5 block text-xs text-gray-600 hover:underline truncate"
                        >
                          {(olimpiada as { nome: string }).nome}
                        </Link>
                      )}

                      {/* Marcas */}
                      {marcasOlimpiada.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {marcasOlimpiada.slice(0, 3).map((mv, i) => {
                            const m = Array.isArray((mv as { marca: unknown }).marca)
                              ? (
                                  (mv as { marca: unknown[] }).marca as {
                                    nome: string;
                                    cor_primaria: string | null;
                                  }[]
                                )[0]
                              : (
                                  mv as {
                                    marca: { nome: string; cor_primaria: string | null } | null;
                                  }
                                ).marca;
                            if (!m) return null;
                            return (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 rounded-full bg-white/60 px-1.5 py-0.5 text-[10px] text-gray-600"
                              >
                                <span
                                  className="h-1.5 w-1.5 rounded-full"
                                  style={{ backgroundColor: m.cor_primaria ?? "#6b7280" }}
                                />
                                {m.nome}
                              </span>
                            );
                          })}
                          {marcasOlimpiada.length > 3 && (
                            <span className="text-[10px] text-gray-400">
                              +{marcasOlimpiada.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Observações */}
                      {f.observacoes && (
                        <p className="mt-1 text-[11px] text-gray-500 italic">{f.observacoes}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
