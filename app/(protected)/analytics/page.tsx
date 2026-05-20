import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { can } from "@/lib/auth/roles";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = { title: "Analytics — Olimpíadas" };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pct(n: number, total: number) {
  return total > 0 ? Math.round((n / total) * 100) : 0;
}

function BarRow({
  label,
  value,
  total,
  sub,
  color = "bg-blue-500",
}: {
  label: string;
  value: number;
  total: number;
  sub?: string;
  color?: string;
}) {
  const p = pct(value, total);
  return (
    <div className="space-y-1 py-2">
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="truncate font-medium text-gray-800 max-w-[55%]">{label}</span>
        <span className="shrink-0 text-gray-500">
          <span className="font-semibold text-gray-900">{value}</span>
          {sub && <span className="ml-1 text-xs text-gray-400">{sub}</span>}
          <span className="ml-2 text-xs text-gray-400">{p}%</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-100">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${p}%` }} />
      </div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h2>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

type SearchParams = { ano?: string };

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getServerSession();
  if (!session) return null;

  if (!can(session.user.role, "audit_log:read")) redirect("/dashboard");

  const sp = await searchParams;
  const anoAtual = new Date().getFullYear();
  const ano = sp.ano ? parseInt(sp.ano, 10) : anoAtual;
  const anos = Array.from({ length: 4 }, (_, i) => anoAtual - 1 + i);

  const supabase = createAdminClient();

  // Todos os dados do ano selecionado
  const [
    { data: inscricoes },
    { data: olimpiadas },
    { data: resultados },
    { count: totalAlunos },
    { count: totalTurmas },
    { count: totalUnidades },
  ] = await Promise.all([
    supabase.from("v_dashboard_inscricoes").select("*").eq("ano_letivo", ano),
    supabase
      .from("olimpiada")
      .select("id, nome, area_conhecimento, classificacao, ativo")
      .eq("ano_letivo", ano),
    supabase.from("resultado").select("tipo, inscricao_id"),
    supabase.from("aluno").select("*", { count: "exact", head: true }).eq("ativo", true),
    supabase.from("turma").select("*", { count: "exact", head: true }).eq("ativo", true),
    supabase.from("unidade").select("*", { count: "exact", head: true }).eq("ativo", true),
  ]);

  const total = inscricoes?.length ?? 0;

  // Agregações
  type InscricaoRow = NonNullable<typeof inscricoes>[number];
  function groupBy(key: keyof InscricaoRow) {
    return (inscricoes ?? []).reduce<Record<string, number>>((acc, row) => {
      const k = String((row as Record<string, unknown>)[key as string] ?? "—");
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {});
  }

  const porStatus = groupBy("status");
  const porMarca = groupBy("marca_nome");
  const porArea = groupBy("area_conhecimento");
  const porClassif = groupBy("classificacao");
  const porUnidade = groupBy("unidade_nome");
  const porOlimpiada = groupBy("olimpiada_nome");

  // Inscrições por mês
  const porMes = (inscricoes ?? []).reduce<Record<number, number>>((acc, row) => {
    const m = new Date(row.inscrito_em).getMonth();
    acc[m] = (acc[m] ?? 0) + 1;
    return acc;
  }, {});

  const MESES_ABREV = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  const maxMes = Math.max(...Object.values(porMes), 1);

  // Resultados por tipo
  const porResultado = (resultados ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.tipo] = (acc[r.tipo] ?? 0) + 1;
    return acc;
  }, {});
  const totalResultados = resultados?.length ?? 0;

  const TIPO_RES_LABEL: Record<string, string> = {
    aprovado: "Aprovado",
    nao_aprovado: "Não aprovado",
    ouro: "🥇 Ouro",
    prata: "🥈 Prata",
    bronze: "🥉 Bronze",
    mencao_honrosa: "Menção Honrosa",
  };
  const TIPO_RES_COLOR: Record<string, string> = {
    aprovado: "bg-green-500",
    nao_aprovado: "bg-red-400",
    ouro: "bg-yellow-400",
    prata: "bg-slate-400",
    bronze: "bg-orange-400",
    mencao_honrosa: "bg-blue-400",
  };

  const sortedMarcas = Object.entries(porMarca).sort((a, b) => b[1] - a[1]);
  const sortedAreas = Object.entries(porArea).sort((a, b) => b[1] - a[1]);
  const sortedOlimpiadas = Object.entries(porOlimpiada)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const sortedUnidades = Object.entries(porUnidade)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const olympiadasAtivas = (olimpiadas ?? []).filter((o) => o.ativo).length;

  return (
    <div className="space-y-8">
      {/* Header com seletor de ano */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Analytics"
          description={`Visão consolidada de inscrições e resultados — ${ano}`}
        />
        <form method="GET" className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-600">Ano letivo</label>
          <select
            name="ano"
            defaultValue={ano}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {anos.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Aplicar
          </button>
        </form>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Olimpíadas", value: olympiadasAtivas, href: "/olimpiadas" },
          { label: "Inscrições", value: total, href: "/inscricoes" },
          {
            label: "Confirmadas",
            value: porStatus["confirmada"] ?? 0,
            href: "/inscricoes?status=confirmada",
          },
          { label: "Resultados", value: totalResultados, href: "/resultados" },
          { label: "Turmas ativas", value: totalTurmas ?? 0, href: "/turmas" },
          { label: "Unidades", value: totalUnidades ?? 0, href: "/unidades" },
        ].map((k) => (
          <Link
            key={k.label}
            href={k.href}
            className="rounded-xl border border-gray-200 bg-white p-4 text-center hover:border-blue-200 hover:bg-blue-50 transition-colors"
          >
            <p className="text-2xl font-bold text-gray-900">{k.value}</p>
            <p className="mt-0.5 text-xs text-gray-500">{k.label}</p>
          </Link>
        ))}
      </div>

      {/* Inscrições por mês */}
      {total > 0 && (
        <SectionCard title={`Inscrições por mês — ${ano}`}>
          <div className="flex items-end gap-1.5 h-28">
            {MESES_ABREV.map((mes, idx) => {
              const v = porMes[idx] ?? 0;
              const h = maxMes > 0 ? Math.round((v / maxMes) * 100) : 0;
              return (
                <div key={mes} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-400">{v > 0 ? v : ""}</span>
                  <div
                    className="w-full rounded-t bg-blue-500"
                    style={{ height: `${h}%`, minHeight: v > 0 ? "4px" : "0" }}
                  />
                  <span className="text-[10px] text-gray-500">{mes}</span>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {/* Grid de breakdowns */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Por marca */}
        <SectionCard title="Por marca">
          {sortedMarcas.length === 0 ? (
            <p className="text-sm text-gray-400">Sem dados.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {sortedMarcas.map(([nome, count]) => (
                <BarRow key={nome} label={nome} value={count} total={total} color="bg-purple-500" />
              ))}
            </div>
          )}
        </SectionCard>

        {/* Por área */}
        <SectionCard title="Por área do conhecimento">
          {sortedAreas.length === 0 ? (
            <p className="text-sm text-gray-400">Sem dados.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {sortedAreas.map(([nome, count]) => (
                <BarRow key={nome} label={nome} value={count} total={total} color="bg-blue-500" />
              ))}
            </div>
          )}
        </SectionCard>

        {/* Por olimpíada */}
        <SectionCard title="Top olimpíadas">
          {sortedOlimpiadas.length === 0 ? (
            <p className="text-sm text-gray-400">Sem dados.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {sortedOlimpiadas.map(([nome, count]) => (
                <BarRow key={nome} label={nome} value={count} total={total} color="bg-amber-500" />
              ))}
            </div>
          )}
        </SectionCard>

        {/* Por unidade */}
        <SectionCard title="Top unidades">
          {sortedUnidades.length === 0 ? (
            <p className="text-sm text-gray-400">Sem dados.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {sortedUnidades.map(([nome, count]) => (
                <BarRow key={nome} label={nome} value={count} total={total} color="bg-green-500" />
              ))}
            </div>
          )}
        </SectionCard>

        {/* Por classificação */}
        <SectionCard title="Classificação das olimpíadas">
          <div className="divide-y divide-gray-50">
            {[
              { key: "obrigatoria", label: "Obrigatória", color: "bg-blue-500" },
              { key: "facultativa", label: "Facultativa", color: "bg-amber-500" },
            ].map(({ key, label, color }) => (
              <BarRow
                key={key}
                label={label}
                value={porClassif[key] ?? 0}
                total={total}
                color={color}
              />
            ))}
          </div>
        </SectionCard>

        {/* Resultados */}
        <SectionCard title="Resultados registrados">
          {totalResultados === 0 ? (
            <p className="text-sm text-gray-400">Nenhum resultado registrado ainda.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {Object.entries(TIPO_RES_LABEL).map(([tipo, label]) => (
                <BarRow
                  key={tipo}
                  label={label}
                  value={porResultado[tipo] ?? 0}
                  total={totalResultados}
                  color={TIPO_RES_COLOR[tipo] ?? "bg-gray-400"}
                />
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Alunos ativos */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Base de alunos
            </p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{totalAlunos ?? 0}</p>
            <p className="text-xs text-gray-500">
              alunos ativos · {totalTurmas ?? 0} turmas · {totalUnidades ?? 0} unidades
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/alunos"
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Ver alunos
            </Link>
            <Link
              href="/turmas"
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Ver turmas
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
