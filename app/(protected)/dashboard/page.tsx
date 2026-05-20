import Link from "next/link";
import { getServerSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { Can } from "@/components/auth/can";
import { ROLE_LABELS } from "@/lib/auth/roles";

export const metadata = { title: "Dashboard — Olimpíadas" };

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  sub,
  href,
  color = "blue",
}: {
  label: string;
  value: string | number;
  sub?: string;
  href?: string;
  color?: "blue" | "green" | "amber" | "purple";
}) {
  const accent: Record<string, string> = {
    blue: "border-blue-200   bg-blue-50   text-blue-700",
    green: "border-green-200  bg-green-50  text-green-700",
    amber: "border-amber-200  bg-amber-50  text-amber-700",
    purple: "border-purple-200 bg-purple-50 text-purple-700",
  };
  const inner = (
    <div className={`rounded-xl border p-5 ${accent[color]}`}>
      <p className="text-xs font-medium uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
      {sub && <p className="mt-1 text-xs opacity-60">{sub}</p>}
    </div>
  );
  return href ? (
    <Link href={href} className="block hover:opacity-90 transition-opacity">
      {inner}
    </Link>
  ) : (
    inner
  );
}

function MiniBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-700 truncate max-w-[65%]">{label}</span>
        <span className="font-medium text-gray-900">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session) return null;

  const { user } = session;
  const supabase = createAdminClient();
  const anoAtual = new Date().getFullYear();

  // Queries paralelas
  const [
    { count: totalOlimpiadas },
    { count: totalAlunos },
    { data: inscricoes },
    { count: totalResultados },
  ] = await Promise.all([
    supabase.from("olimpiada").select("*", { count: "exact", head: true }).eq("ativo", true),
    supabase.from("aluno").select("*", { count: "exact", head: true }).eq("ativo", true),
    supabase
      .from("v_dashboard_inscricoes")
      .select("status, area_conhecimento, marca_nome, olimpiada_nome, inscrito_em")
      .eq("ano_letivo", anoAtual),
    supabase.from("resultado").select("*", { count: "exact", head: true }),
  ]);

  const totalInscricoes = inscricoes?.length ?? 0;

  // Status breakdown
  const porStatus = (inscricoes ?? []).reduce<Record<string, number>>((acc, i) => {
    acc[i.status] = (acc[i.status] ?? 0) + 1;
    return acc;
  }, {});

  // Top 5 olimpíadas por inscrições
  const porOlimpiada = (inscricoes ?? []).reduce<Record<string, number>>((acc, i) => {
    acc[i.olimpiada_nome] = (acc[i.olimpiada_nome] ?? 0) + 1;
    return acc;
  }, {});
  const topOlimpiadas = Object.entries(porOlimpiada)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Top marcas
  const porMarca = (inscricoes ?? []).reduce<Record<string, number>>((acc, i) => {
    acc[i.marca_nome] = (acc[i.marca_nome] ?? 0) + 1;
    return acc;
  }, {});
  const topMarcas = Object.entries(porMarca)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const maxOlimpiada = topOlimpiadas[0]?.[1] ?? 1;
  const maxMarca = topMarcas[0]?.[1] ?? 1;

  const STATUS_LABEL: Record<string, string> = {
    pendente: "Pendente",
    confirmada: "Confirmada",
    cancelada: "Cancelada",
  };
  const STATUS_COLOR: Record<string, string> = {
    pendente: "bg-yellow-400",
    confirmada: "bg-green-500",
    cancelada: "bg-red-400",
  };

  return (
    <div className="space-y-8">
      {/* Boas-vindas */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Olá, {user.nome.split(" ")[0]} 👋</h1>
        <p className="mt-1 text-sm text-gray-500">
          {ROLE_LABELS[user.role]} · {anoAtual}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Olimpíadas ativas"
          value={totalOlimpiadas ?? 0}
          href="/olimpiadas"
          color="blue"
        />
        <StatCard label="Alunos ativos" value={totalAlunos ?? 0} href="/alunos" color="green" />
        <StatCard
          label={`Inscrições ${anoAtual}`}
          value={totalInscricoes}
          sub={`${porStatus["confirmada"] ?? 0} confirmadas`}
          href="/inscricoes"
          color="amber"
        />
        <StatCard
          label="Resultados registrados"
          value={totalResultados ?? 0}
          href="/resultados"
          color="purple"
        />
      </div>

      {/* Charts row */}
      {totalInscricoes > 0 && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Status */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-gray-700">Inscrições por status</h2>
            <div className="space-y-3">
              {["pendente", "confirmada", "cancelada"].map((s) => (
                <MiniBar
                  key={s}
                  label={STATUS_LABEL[s] ?? s}
                  value={porStatus[s] ?? 0}
                  max={totalInscricoes}
                  color={STATUS_COLOR[s] ?? "bg-gray-400"}
                />
              ))}
            </div>
          </div>

          {/* Top olimpíadas */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-gray-700">Top olimpíadas</h2>
            {topOlimpiadas.length === 0 ? (
              <p className="text-xs text-gray-400">Sem dados.</p>
            ) : (
              <div className="space-y-3">
                {topOlimpiadas.map(([nome, count]) => (
                  <MiniBar
                    key={nome}
                    label={nome}
                    value={count}
                    max={maxOlimpiada}
                    color="bg-blue-500"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Top marcas */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-gray-700">Por marca</h2>
            {topMarcas.length === 0 ? (
              <p className="text-xs text-gray-400">Sem dados.</p>
            ) : (
              <div className="space-y-3">
                {topMarcas.map(([nome, count]) => (
                  <MiniBar
                    key={nome}
                    label={nome}
                    value={count}
                    max={maxMarca}
                    color="bg-purple-500"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Links rápidos */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Acesso rápido</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <Can role={user.role} perform="olimpiada:read">
            <QuickLink href="/olimpiadas" icon="🏆" label="Olimpíadas" />
          </Can>
          <Can role={user.role} perform="inscricao:read">
            <QuickLink href="/inscricoes" icon="📋" label="Inscrições" />
          </Can>
          <Can role={user.role} perform="resultado:read">
            <QuickLink href="/resultados" icon="🎯" label="Resultados" />
          </Can>
          <QuickLink href="/calendario" icon="📅" label="Calendário" />
          <Can role={user.role} perform="aluno:read">
            <QuickLink href="/alunos" icon="👥" label="Alunos" />
          </Can>
          <Can role={user.role} perform="turma:read">
            <QuickLink href="/turmas" icon="🏫" label="Turmas" />
          </Can>
          <Can role={user.role} perform="unidade:read">
            <QuickLink href="/unidades" icon="🏢" label="Unidades" />
          </Can>
          <Can role={user.role} perform="audit_log:read">
            <QuickLink href="/analytics" icon="📊" label="Analytics" />
          </Can>
        </div>
      </div>
    </div>
  );
}

function QuickLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 transition-colors"
    >
      <span aria-hidden="true" className="text-lg">
        {icon}
      </span>
      {label}
    </Link>
  );
}
