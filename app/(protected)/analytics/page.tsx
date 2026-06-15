import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { can } from "@/lib/auth/roles";
import type { MetaRow } from "./metas/actions";

export const metadata = { title: "Gestão — Olimpíadas" };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pct(n: number, total: number) {
  return total > 0 ? Math.round((n / total) * 100) : 0;
}

function fmt(n: number) {
  return n.toLocaleString("pt-BR");
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-4 text-sm font-semibold text-foreground uppercase tracking-wide">
        {title}
      </h2>
      {children}
    </div>
  );
}

function PctBadge({ p }: { p: number | null }) {
  if (p === null) return <span className="text-muted-foreground/40">—</span>;
  const cls = p >= 100 ? "text-emerald-400" : p >= 70 ? "text-amber-400" : "text-red-400";
  return <span className={`font-semibold ${cls}`}>{p}%</span>;
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="h-px flex-1 bg-border" />
      <span
        className="text-[11px] font-semibold uppercase tracking-wider"
        style={{ color: "rgb(91,184,193)" }}
      >
        {label}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AnalyticsPage() {
  const session = await getServerSession();
  if (!session) return null;
  if (!can(session.user.role, "audit_log:read")) redirect("/dashboard");

  const anoAtual = new Date().getFullYear();
  const ano = anoAtual;
  const anosComparacao = Array.from({ length: 3 }, (_, i) => ano - 2 + i).filter((a) => a >= 2021);

  const supabase = createAdminClient();

  const [
    { data: inscricoes },
    { data: olimpiadas },
    { data: resultados },
    { data: multiAnoData },
    { data: projetosPrep },
    { data: aulasPrep },
    { data: marcasData },
    { data: metasData },
    { data: alunosAtividade },
  ] = await Promise.all([
    supabase.from("v_dashboard_inscricoes").select("*").eq("ano_letivo", ano),
    supabase
      .from("olimpiada")
      .select("id, nome, area_conhecimento, classificacao, ativo")
      .eq("ano_letivo", ano),
    supabase.from("resultado").select("tipo, inscricao_id"),
    supabase
      .from("v_dashboard_inscricoes")
      .select("marca_nome, ano_letivo, area_conhecimento, classificacao, status, inscricao_id")
      .in("ano_letivo", anosComparacao),
    supabase.from("preparacao_projeto").select("id, ano_letivo, olimpiada_sigla").eq("ativo", true),
    supabase.from("preparacao_aula").select("id, projeto_id, tipo, duracao_minutos"),
    supabase.from("marca").select("id, nome").order("nome"),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from("meta_marca").select("*").eq("ano_letivo", ano),
    supabase
      .from("aluno")
      .select("id, nome, marca_id, last_login_at, login_count")
      .eq("ativo", true)
      .not("last_login_at", "is", null),
  ]);

  const total = inscricoes?.length ?? 0;

  // ─── Agregações base ──────────────────────────────────────────────────────

  type Row = NonNullable<typeof inscricoes>[number];
  function groupBy(key: keyof Row) {
    return (inscricoes ?? []).reduce<Record<string, number>>((acc, row) => {
      const k = String((row as Record<string, unknown>)[key as string] ?? "—");
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {});
  }

  const porStatus = groupBy("status");
  const porMarca = groupBy("marca_nome");

  const olympiadasAtivas = (olimpiadas ?? []).filter((o) => o.ativo).length;

  // ─── Sprint 1 — Funil multi-ano ──────────────────────────────────────────

  const inscricaoIds = new Set((inscricoes ?? []).map((i) => i.inscricao_id));
  const resultadosAno = (resultados ?? []).filter((r) => inscricaoIds.has(r.inscricao_id));
  const confirmadosAno = porStatus["confirmada"] ?? 0;
  // comResultadoAno mantido para o KPI "Resultados"
  void resultadosAno.length; // used implicitly via resultadosAno filter below

  // Premiados por inscrição (todos os anos) — para cruzar com multiAnoData
  const premiadosTipos = new Set(["ouro", "prata", "bronze", "mencao_honrosa"]);
  // Premiados do ano corrente (para KPI)
  const premiadosAnoAtual = resultadosAno.filter((r) => premiadosTipos.has(r.tipo)).length;
  const premiadosIds = new Set(
    (resultados ?? []).filter((r) => premiadosTipos.has(r.tipo)).map((r) => r.inscricao_id),
  );

  // Agrega funil por ano a partir de multiAnoData
  const funnelMap: Record<number, { inscritos: number; confirmados: number; premiados: number }> =
    {};
  for (const row of multiAnoData ?? []) {
    const a = row.ano_letivo as number;
    if (!funnelMap[a]) funnelMap[a] = { inscritos: 0, confirmados: 0, premiados: 0 };
    funnelMap[a]!.inscritos++;
    if ((row.status as string) === "confirmada") funnelMap[a]!.confirmados++;
    if (premiadosIds.has((row as Record<string, unknown>).inscricao_id as string))
      funnelMap[a]!.premiados++;
  }
  const funnelMultiAno = anosComparacao.map((a) => ({
    ano: a,
    inscritos: funnelMap[a]?.inscritos ?? 0,
    confirmados: funnelMap[a]?.confirmados ?? 0,
    premiados: funnelMap[a]?.premiados ?? 0,
  }));

  // ─── Sprint 1 — Premiação por marca (multi-ano) ───────────────────────────

  const inscricaoMarcaMap = new Map(
    (inscricoes ?? []).map((i) => [i.inscricao_id, (i.marca_nome as string) ?? "—"]),
  );
  type PremiacaoMarca = {
    ouro: number;
    prata: number;
    bronze: number;
    mencao: number;
    total: number;
  };

  // Mapa para metas (ano corrente)
  const premiacaoMap: Record<string, PremiacaoMarca> = {};
  for (const r of resultadosAno) {
    if (!["ouro", "prata", "bronze", "mencao_honrosa"].includes(r.tipo)) continue;
    const marca = inscricaoMarcaMap.get(r.inscricao_id) ?? "—";
    if (!premiacaoMap[marca])
      premiacaoMap[marca] = { ouro: 0, prata: 0, bronze: 0, mencao: 0, total: 0 };
    const p = premiacaoMap[marca]!;
    if (r.tipo === "ouro") p.ouro++;
    else if (r.tipo === "prata") p.prata++;
    else if (r.tipo === "bronze") p.bronze++;
    else p.mencao++;
    p.total++;
  }

  // Multi-ano: usa multiAnoData para mapear inscricao_id → {marca, ano}
  const inscricaoMultiInfo = new Map(
    (multiAnoData ?? []).map((row) => [
      (row as Record<string, unknown>).inscricao_id as string,
      { marca: (row.marca_nome as string) ?? "—", anoR: row.ano_letivo as number },
    ]),
  );
  const premiacaoMultiMap: Record<string, Record<number, PremiacaoMarca>> = {};
  for (const r of resultados ?? []) {
    if (!["ouro", "prata", "bronze", "mencao_honrosa"].includes(r.tipo)) continue;
    const info = inscricaoMultiInfo.get(r.inscricao_id);
    if (!info) continue;
    const { marca, anoR } = info;
    if (!premiacaoMultiMap[marca]) premiacaoMultiMap[marca] = {};
    if (!premiacaoMultiMap[marca]![anoR])
      premiacaoMultiMap[marca]![anoR] = { ouro: 0, prata: 0, bronze: 0, mencao: 0, total: 0 };
    const p = premiacaoMultiMap[marca]![anoR]!;
    if (r.tipo === "ouro") p.ouro++;
    else if (r.tipo === "prata") p.prata++;
    else if (r.tipo === "bronze") p.bronze++;
    else p.mencao++;
    p.total++;
  }
  const premiacaoMultiList = Object.entries(premiacaoMultiMap).sort((a, b) => {
    const totA = anosComparacao.reduce((s, yr) => s + (a[1][yr]?.total ?? 0), 0);
    const totB = anosComparacao.reduce((s, yr) => s + (b[1][yr]?.total ?? 0), 0);
    return totB - totA;
  });

  // ─── Sprint 2 — Olimpíadas obrigatórias × ano (multi-ano) ───────────────────

  // Agrupa multiAnoData filtrando por classificacao = 'obrigatoria'
  const obrigsInsc: Record<string, Record<number, number>> = {};
  const obrigsPart: Record<string, Record<number, number>> = {};
  for (const row of multiAnoData ?? []) {
    if ((row.classificacao as string) !== "obrigatoria") continue;
    const marca = (row.marca_nome as string) ?? "—";
    const a = row.ano_letivo as number;
    if (!obrigsInsc[marca]) obrigsInsc[marca] = {};
    obrigsInsc[marca][a] = (obrigsInsc[marca][a] ?? 0) + 1;
    if ((row.status as string) === "confirmada") {
      if (!obrigsPart[marca]) obrigsPart[marca] = {};
      obrigsPart[marca][a] = (obrigsPart[marca][a] ?? 0) + 1;
    }
  }

  // Premiados em obrigatórias: cruza inscricao_id de obrigatórias com resultados
  const obrigsInscMap = new Map(
    (multiAnoData ?? [])
      .filter((row) => (row.classificacao as string) === "obrigatoria")
      .map((row) => [
        (row as Record<string, unknown>).inscricao_id as string,
        { marca: (row.marca_nome as string) ?? "—", a: row.ano_letivo as number },
      ]),
  );
  const obrigsPrem: Record<string, Record<number, number>> = {};
  for (const r of resultados ?? []) {
    if (!["ouro", "prata", "bronze", "mencao_honrosa"].includes(r.tipo)) continue;
    const info = obrigsInscMap.get(r.inscricao_id);
    if (!info) continue;
    if (!obrigsPrem[info.marca]) obrigsPrem[info.marca] = {};
    obrigsPrem[info.marca]![info.a] = (obrigsPrem[info.marca]![info.a] ?? 0) + 1;
  }

  const obrigsMarcasList = [
    ...new Set([
      ...Object.keys(obrigsInsc),
      ...Object.keys(obrigsPart),
      ...Object.keys(obrigsPrem),
    ]),
  ]
    .map((marca) => ({
      marca,
      anos: anosComparacao.map((a) => ({
        ano: a,
        inscritos: obrigsInsc[marca]?.[a] ?? 0,
        participantes: obrigsPart[marca]?.[a] ?? 0,
        premiados: obrigsPrem[marca]?.[a] ?? 0,
      })),
    }))
    .sort((a, b) => {
      const totA = a.anos.reduce((s, d) => s + d.inscritos, 0);
      const totB = b.anos.reduce((s, d) => s + d.inscritos, 0);
      return totB - totA;
    });

  // ─── Sprint 4 — Metas por marca ──────────────────────────────────────────

  // Mapa marcaId → nome (para cruzar com porMarca que usa nome)
  // marcaIdNomeMap reservado para cruzar IDs de marca com nomes em sprints futuros

  // Mapa marcaId → tipo → valor_meta
  const metasMap: Record<string, Record<string, number>> = {};
  for (const m of (metasData ?? []) as MetaRow[]) {
    if (!metasMap[m.marca_id]) metasMap[m.marca_id] = {};
    metasMap[m.marca_id]![m.tipo] = m.valor;
  }

  // Participantes confirmados por marca (para a meta de participantes)
  const participantesPorMarca = (inscricoes ?? [])
    .filter((i) => (i.status as string) === "confirmada")
    .reduce<Record<string, number>>((acc, row) => {
      const k = (row.marca_nome as string) ?? "—";
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {});

  // Constrói lista de marcas com dados reais + metas
  const metasComparacao = (marcasData ?? [])
    .map((m) => {
      const metas = metasMap[m.id] ?? {};
      const realInsc = porMarca[m.nome] ?? 0;
      const realPart = participantesPorMarca[m.nome] ?? 0;
      const realPrem = premiacaoMap[m.nome]?.total ?? 0;
      return {
        id: m.id,
        nome: m.nome,
        metaInsc: metas["inscricoes"] ?? 0,
        metaPart: metas["participantes"] ?? 0,
        metaPrem: metas["premiados"] ?? 0,
        metaVend: metas["vendas"] ?? 0,
        realInsc,
        realPart,
        realPrem,
      };
    })
    .filter((m) => m.realInsc > 0 || m.metaInsc > 0 || m.metaVend > 0);

  const temMetas = metasComparacao.some(
    (m) => m.metaInsc > 0 || m.metaPart > 0 || m.metaPrem > 0 || m.metaVend > 0,
  );

  // KPI cards de metas — % global atingida por tipo
  const totalMetaInsc = metasComparacao.reduce((s, m) => s + m.metaInsc, 0);
  const totalMetaPart = metasComparacao.reduce((s, m) => s + m.metaPart, 0);
  const totalMetaPrem = metasComparacao.reduce((s, m) => s + m.metaPrem, 0);
  const totalMetaVend = metasComparacao.reduce((s, m) => s + m.metaVend, 0);
  const totalRealInsc = metasComparacao.reduce((s, m) => s + m.realInsc, 0);
  const totalRealPart = metasComparacao.reduce((s, m) => s + m.realPart, 0);
  const totalRealPrem = metasComparacao.reduce((s, m) => s + m.realPrem, 0);

  const pctMetaInsc = totalMetaInsc > 0 ? pct(totalRealInsc, totalMetaInsc) : null;
  const pctMetaPart = totalMetaPart > 0 ? pct(totalRealPart, totalMetaPart) : null;
  const pctMetaPrem = totalMetaPrem > 0 ? pct(totalRealPrem, totalMetaPrem) : null;

  function semaforoCls(p: number | null) {
    if (p === null) return "text-muted-foreground";
    if (p >= 100) return "text-emerald-400";
    if (p >= 70) return "text-amber-400";
    return "text-red-400";
  }

  // ─── Sprint 3 — Indicadores de preparação ────────────────────────────────

  const projetoAnoMap = new Map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (projetosPrep ?? []).map((p: any) => [p.id as string, p.ano_letivo as number]),
  );

  // "Projetos ativos por ano" vem direto de preparacao_projeto (ativo=true),
  // não do número de projetos que têm aula cadastrada.
  const projetosAtivosPorAno: Record<number, number> = {};
  for (const p of projetosPrep ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anoP = (p as any).ano_letivo as number;
    if (anoP == null) continue;
    projetosAtivosPorAno[anoP] = (projetosAtivosPorAno[anoP] ?? 0) + 1;
  }

  const prepStats: Record<number, { aulas: number; simulados: number; minutos: number }> = {};
  // Garante que todo ano com projeto ativo apareça, mesmo sem aulas.
  for (const anoP of Object.keys(projetosAtivosPorAno)) {
    prepStats[Number(anoP)] = { aulas: 0, simulados: 0, minutos: 0 };
  }
  for (const a of aulasPrep ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = a as any;
    const anoA = projetoAnoMap.get(row.projeto_id);
    if (!anoA) continue;
    if (!prepStats[anoA]) prepStats[anoA] = { aulas: 0, simulados: 0, minutos: 0 };
    const s = prepStats[anoA]!;
    if (row.tipo === "simulado") s.simulados++;
    else s.aulas++;
    s.minutos += row.duracao_minutos ?? 0;
  }
  const prepList = Object.entries(prepStats)
    .sort(([a], [b]) => Number(b) - Number(a))
    .map(([anoStr, s]) => ({
      ano: Number(anoStr),
      projetos: projetosAtivosPorAno[Number(anoStr)] ?? 0,
      aulas: s.aulas,
      simulados: s.simulados,
      minutos: s.minutos,
      horas: Math.round((s.minutos / 60) * 10) / 10,
    }));

  const prepAno = prepStats[ano];
  const prepAnoStats = prepAno
    ? {
        projetos: projetosAtivosPorAno[ano] ?? 0,
        aulas: prepAno.aulas,
        simulados: prepAno.simulados,
        horas: Math.round((prepAno.minutos / 60) * 10) / 10,
      }
    : {
        projetos: projetosAtivosPorAno[ano] ?? 0,
        aulas: 0,
        simulados: 0,
        horas: 0,
      };

  // ─── Sprint 5 — Atividade na Plataforma do Aluno ─────────────────────────

  const ONLINE_WINDOW_MS = 30 * 60 * 1000; // 30 minutos
  const agora = new Date().getTime();
  const marcaNomeMap = new Map((marcasData ?? []).map((m) => [m.id, m.nome]));

  type AtividadeMarca = {
    marca: string;
    onlineAgora: number;
    totalComAcesso: number;
    totalAcessos: number;
  };

  const atividadeMarcaMap: Record<string, AtividadeMarca> = {};
  let totalOnlineAgora = 0;

  for (const a of alunosAtividade ?? []) {
    const marca = marcaNomeMap.get(a.marca_id ?? "") ?? "—";
    if (!atividadeMarcaMap[marca]) {
      atividadeMarcaMap[marca] = { marca, onlineAgora: 0, totalComAcesso: 0, totalAcessos: 0 };
    }
    const m = atividadeMarcaMap[marca]!;
    m.totalComAcesso++;
    m.totalAcessos += a.login_count;
    const ultimoAcesso = a.last_login_at ? new Date(a.last_login_at).getTime() : 0;
    if (agora - ultimoAcesso < ONLINE_WINDOW_MS) {
      m.onlineAgora++;
      totalOnlineAgora++;
    }
  }

  const atividadeMarcaList = Object.values(atividadeMarcaMap).sort(
    (a, b) => b.totalAcessos - a.totalAcessos,
  );

  const totalComAcesso = (alunosAtividade ?? []).length;

  const maisFrequentes = (alunosAtividade ?? [])
    .slice()
    .sort((a, b) => b.login_count - a.login_count)
    .slice(0, 10)
    .map((a) => ({
      id: a.id,
      nome: a.nome,
      marca: marcaNomeMap.get(a.marca_id ?? "") ?? "—",
      acessos: a.login_count,
      ultimoAcesso: a.last_login_at,
    }));

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Gestão</h1>
        <p className="mt-1 text-sm text-muted-foreground">Visão consolidada do Programa Olímpico</p>
      </div>

      {/* KPIs */}
      {/* Grupo 1 — Competição */}
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Conversão e Resultados — {ano}
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Olimpíadas ativas", value: fmt(olympiadasAtivas), sub: "no ano" },
            { label: "Inscrições", value: fmt(total), sub: "alunos inscritos" },
            { label: "Participantes", value: fmt(confirmadosAno), sub: "participantes" },
            {
              label: "Premiados",
              value: fmt(premiadosAnoAtual),
              sub: "ouro · prata · bronze · menção",
            },
          ].map((k) => (
            <div key={k.label} className="rounded-xl border border-border bg-card p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{k.value}</p>
              <p className="mt-0.5 text-xs font-medium text-foreground">{k.label}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{k.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Grupo 2 — Preparação */}
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Preparação — {ano}
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Projetos", value: fmt(prepAnoStats.projetos), sub: "projetos ativos" },
            { label: "Aulas", value: fmt(prepAnoStats.aulas), sub: "aulas realizadas" },
            { label: "Simulados", value: fmt(prepAnoStats.simulados), sub: "simulados aplicados" },
            {
              label: "Horas de prep.",
              value: `${prepAnoStats.horas}h`,
              sub: "carga horária total",
            },
          ].map((k) => (
            <div key={k.label} className="rounded-xl border border-border bg-card p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{k.value}</p>
              <p className="mt-0.5 text-xs font-medium text-foreground">{k.label}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{k.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Grupo 3 — Metas */}
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Metas — {ano}
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: "Inscrições",
              pctVal: pctMetaInsc,
              sub:
                totalMetaInsc > 0
                  ? `${fmt(totalRealInsc)} / ${fmt(totalMetaInsc)}`
                  : "sem meta definida",
            },
            {
              label: "Participantes",
              pctVal: pctMetaPart,
              sub:
                totalMetaPart > 0
                  ? `${fmt(totalRealPart)} / ${fmt(totalMetaPart)}`
                  : "sem meta definida",
            },
            {
              label: "Premiados",
              pctVal: pctMetaPrem,
              sub:
                totalMetaPrem > 0
                  ? `${fmt(totalRealPrem)} / ${fmt(totalMetaPrem)}`
                  : "sem meta definida",
            },
            {
              label: "Vendas Prog. Olímpico",
              pctVal: null as null,
              sub: totalMetaVend > 0 ? `meta: ${fmt(totalMetaVend)}` : "sem meta definida",
            },
          ].map((k) => (
            <div key={k.label} className="rounded-xl border border-border bg-card p-4 text-center">
              <p className={`text-2xl font-bold ${semaforoCls(k.pctVal)}`}>
                {k.pctVal !== null ? `${k.pctVal}%` : "—"}
              </p>
              <p className="mt-0.5 text-xs font-medium text-foreground">{k.label}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{k.sub}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">
          Verde ≥ 100% · Âmbar ≥ 70% · Vermelho &lt; 70%
        </p>
      </div>

      {/* ── SPRINT 1 ──────────────────────────────────────────────────────── */}
      <Divider label="Conversão e resultados" />

      {/* Funil multi-ano */}
      <SectionCard title={`Funil de conversão — ${anosComparacao.join(" · ")}`}>
        {total === 0 ? (
          <p className="text-sm text-muted-foreground">Sem inscrições para o período.</p>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-3 sm:gap-6">
              {funnelMultiAno.map((d) => {
                const stages = [
                  {
                    key: "inscritos",
                    label: "Inscritos",
                    color: "bg-blue-500",
                    value: d.inscritos,
                  },
                  {
                    key: "confirmados",
                    label: "Participantes",
                    color: "bg-indigo-500",
                    value: d.confirmados,
                  },
                  {
                    key: "premiados",
                    label: "Premiados",
                    color: "bg-yellow-400",
                    value: d.premiados,
                  },
                ];
                return (
                  <div key={d.ano} className="flex-1 min-w-0">
                    <p className="mb-4 text-center text-sm font-bold text-foreground">{d.ano}</p>
                    {stages.map((s, idx) => {
                      const pct = d.inscritos > 0 ? Math.round((s.value / d.inscritos) * 100) : 0;
                      const barW = idx === 0 ? 100 : Math.max(pct, 8);
                      return (
                        <div key={s.key}>
                          {idx > 0 && (
                            <div className="my-1.5 flex justify-center">
                              <svg
                                className="h-3 w-3 text-muted-foreground/30"
                                viewBox="0 0 12 12"
                                fill="currentColor"
                              >
                                <path d="M6 9L1 3h10L6 9z" />
                              </svg>
                            </div>
                          )}
                          <div
                            className={`${s.color} mx-auto h-8 rounded-sm`}
                            style={{ width: `${barW}%` }}
                          />
                          <div className="mt-1 text-center">
                            <span className="text-[11px] font-semibold text-foreground">
                              {fmt(s.value)}
                            </span>
                            {idx > 0 && (
                              <span className="ml-1 text-[10px] text-muted-foreground/60">
                                ({pct}%)
                              </span>
                            )}
                            <p className="text-[10px] text-muted-foreground">{s.label}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Percentuais calculados sobre o total de inscritos do mesmo ano.
            </p>
          </div>
        )}
      </SectionCard>

      {/* Premiação por marca — 3 anos */}
      <SectionCard title={`Premiação por marca — ${anosComparacao.join(" · ")}`}>
        {premiacaoMultiList.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma premiação registrada para o período.
          </p>
        ) : (
          <div className="space-y-6">
            {premiacaoMultiList.map(([marca, byYear]) => (
              <div key={marca}>
                <p className="mb-1.5 text-sm font-semibold text-foreground">{marca}</p>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-background">
                        <th className="px-3 py-2 text-left text-[11px] font-medium text-muted-foreground">
                          Ano
                        </th>
                        <th className="px-3 py-2 text-center text-[11px] font-medium text-yellow-400">
                          🥇
                        </th>
                        <th className="px-3 py-2 text-center text-[11px] font-medium text-slate-300">
                          🥈
                        </th>
                        <th className="px-3 py-2 text-center text-[11px] font-medium text-orange-400">
                          🥉
                        </th>
                        <th className="px-3 py-2 text-center text-[11px] font-medium text-blue-400">
                          Menção
                        </th>
                        <th className="px-3 py-2 text-right text-[11px] font-medium text-foreground">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {anosComparacao.map((yr) => {
                        const p = byYear[yr];
                        if (!p || p.total === 0)
                          return (
                            <tr key={yr} className="bg-card">
                              <td className="px-3 py-2 text-[11px] text-muted-foreground">{yr}</td>
                              <td
                                className="px-3 py-2 text-center text-[11px] text-muted-foreground/30"
                                colSpan={5}
                              >
                                sem premiações
                              </td>
                            </tr>
                          );
                        return (
                          <tr key={yr} className="bg-card hover:bg-background/50">
                            <td className="px-3 py-2 text-[11px] font-semibold text-muted-foreground">
                              {yr}
                            </td>
                            <td className="px-3 py-2 text-center text-yellow-400">
                              {p.ouro || "—"}
                            </td>
                            <td className="px-3 py-2 text-center text-slate-300">
                              {" "}
                              {p.prata || "—"}
                            </td>
                            <td className="px-3 py-2 text-center text-orange-400">
                              {p.bronze || "—"}
                            </td>
                            <td className="px-3 py-2 text-center text-blue-400">
                              {" "}
                              {p.mencao || "—"}
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-foreground">
                              {p.total}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* ── SPRINT 2 ──────────────────────────────────────────────────────── */}
      <Divider label="Obrigatórias: OBMEP · OBMEP MIRIM · OP · OBA · ONC · CANGURU" />

      {/* Olimpíadas obrigatórias — inscritos, participantes e premiações por marca × ano */}
      <SectionCard
        title={`Olimpíadas obrigatórias — inscritos, participantes e premiações por marca — ${anosComparacao.join(" · ")}`}
      >
        {obrigsMarcasList.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sem inscrições em obrigatórias para o período.
          </p>
        ) : (
          <div className="space-y-6">
            {obrigsMarcasList.map(({ marca, anos }) => (
              <div key={marca}>
                <p className="mb-1.5 text-sm font-semibold text-foreground">{marca}</p>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-background">
                        <th className="px-3 py-2 text-left text-[11px] font-medium text-muted-foreground">
                          Ano
                        </th>
                        <th className="px-3 py-2 text-right text-[11px] font-medium text-blue-400">
                          Inscritos
                        </th>
                        <th className="px-3 py-2 text-right text-[11px] font-medium text-indigo-400">
                          Participantes
                        </th>
                        <th className="px-3 py-2 text-right text-[11px] font-medium text-muted-foreground">
                          % Part.
                        </th>
                        <th className="px-3 py-2 text-right text-[11px] font-medium text-yellow-400">
                          Premiações
                        </th>
                        <th className="px-3 py-2 text-right text-[11px] font-medium text-muted-foreground">
                          % Prem.
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {anos.map((d) => (
                        <tr key={d.ano} className="bg-card hover:bg-background/50">
                          <td className="px-3 py-2 text-[11px] font-semibold text-muted-foreground">
                            {d.ano}
                          </td>
                          <td className="px-3 py-2 text-right text-blue-400">
                            {d.inscritos || "—"}
                          </td>
                          <td className="px-3 py-2 text-right text-indigo-400">
                            {d.participantes || "—"}
                          </td>
                          <td className="px-3 py-2 text-right text-[11px] text-muted-foreground">
                            {d.inscritos > 0 ? `${pct(d.participantes, d.inscritos)}%` : "—"}
                          </td>
                          <td className="px-3 py-2 text-right text-yellow-400">
                            {d.premiados || "—"}
                          </td>
                          <td className="px-3 py-2 text-right text-[11px] text-muted-foreground">
                            {d.inscritos > 0 ? `${pct(d.premiados, d.inscritos)}%` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* ── SPRINT 4 — METAS ─────────────────────────────────────────────── */}
      <Divider label="Metas" />

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
            Metas por marca — {ano}
          </h2>
          <Link
            href={`/analytics/metas?ano=${ano}`}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-ring transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-3.5 w-3.5"
            >
              <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
              <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
            </svg>
            Configurar metas
          </Link>
        </div>

        {!temMetas ? (
          <div className="rounded-lg border border-dashed border-border px-5 py-8 text-center">
            <p className="text-sm text-muted-foreground">Nenhuma meta definida para {ano}.</p>
            <Link
              href={`/analytics/metas?ano=${ano}`}
              className="mt-2 inline-block text-xs underline"
              style={{ color: "rgb(91,184,193)" }}
            >
              Definir metas agora →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left font-semibold text-muted-foreground">Marca</th>
                  <th className="pb-3 text-center font-semibold text-blue-400" colSpan={2}>
                    Inscrições
                  </th>
                  <th className="pb-3 text-center font-semibold text-indigo-400" colSpan={2}>
                    Participantes
                  </th>
                  <th className="pb-3 text-center font-semibold text-yellow-400" colSpan={2}>
                    Premiados
                  </th>
                  <th className="pb-3 text-center font-semibold text-emerald-400" colSpan={2}>
                    Vendas Prog. Olímpico
                  </th>
                </tr>
                <tr className="border-b border-border/40 text-[11px] text-muted-foreground">
                  <th className="pb-2" />
                  <th className="pb-2 text-center font-normal">real / meta</th>
                  <th className="pb-2 text-center font-normal">%</th>
                  <th className="pb-2 text-center font-normal">real / meta</th>
                  <th className="pb-2 text-center font-normal">%</th>
                  <th className="pb-2 text-center font-normal">real / meta</th>
                  <th className="pb-2 text-center font-normal">%</th>
                  <th className="pb-2 text-center font-normal">meta</th>
                  <th className="pb-2 text-center font-normal text-muted-foreground/40">
                    sem dados
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {metasComparacao.map((m) => {
                  const pInsc = m.metaInsc > 0 ? pct(m.realInsc, m.metaInsc) : null;
                  const pPart = m.metaPart > 0 ? pct(m.realPart, m.metaPart) : null;
                  const pPrem = m.metaPrem > 0 ? pct(m.realPrem, m.metaPrem) : null;
                  return (
                    <tr key={m.id} className="hover:bg-background/50">
                      <td className="py-3 font-medium text-foreground">{m.nome}</td>
                      <td className="py-3 text-center text-muted-foreground">
                        <span className="font-semibold text-foreground">{fmt(m.realInsc)}</span>
                        {m.metaInsc > 0 && <> / {fmt(m.metaInsc)}</>}
                      </td>
                      <td className="py-3 text-center">
                        <PctBadge p={pInsc} />
                      </td>
                      <td className="py-3 text-center text-muted-foreground">
                        <span className="font-semibold text-foreground">{fmt(m.realPart)}</span>
                        {m.metaPart > 0 && <> / {fmt(m.metaPart)}</>}
                      </td>
                      <td className="py-3 text-center">
                        <PctBadge p={pPart} />
                      </td>
                      <td className="py-3 text-center text-muted-foreground">
                        <span className="font-semibold text-foreground">{fmt(m.realPrem)}</span>
                        {m.metaPrem > 0 && <> / {fmt(m.metaPrem)}</>}
                      </td>
                      <td className="py-3 text-center">
                        <PctBadge p={pPrem} />
                      </td>
                      <td className="py-3 text-center text-emerald-400">
                        {m.metaVend > 0 ? fmt(m.metaVend) : "—"}
                      </td>
                      <td className="py-3 text-center text-[11px] text-muted-foreground/40">—</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Verde ≥ 100% · Âmbar ≥ 70% · Vermelho &lt; 70% da meta · Vendas Prog. Olímpico: apenas
              meta (dados reais a implementar)
            </p>
          </div>
        )}
      </div>

      {/* ── CONTEÚDO — Banco de Questões ─────────────────────────────────── */}
      <Divider label="Conteúdo" />

      <Link
        href="/analytics/banco-questoes"
        className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-6 transition-colors hover:border-ring"
      >
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
            Banco de Questões
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cobertura do acervo por tópico, dificuldade e pipeline de revisão — segmentado por
            olimpíada, nível e fase.
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground">
          Abrir
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path
              fillRule="evenodd"
              d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </Link>

      {/* ── SPRINT 3 ──────────────────────────────────────────────────────── */}
      <Divider label="Preparação" />

      {/* KPIs de preparação do ano */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Projetos ativos", value: prepAnoStats.projetos, unit: "projetos" },
          { label: "Aulas realizadas", value: prepAnoStats.aulas, unit: "aulas" },
          { label: "Simulados", value: prepAnoStats.simulados, unit: "simulados" },
          { label: "Total de horas", value: prepAnoStats.horas, unit: "h" },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{k.value}</p>
            <p className="text-xs text-muted-foreground">
              {k.label} em {ano}
            </p>
          </div>
        ))}
      </div>

      {/* Histórico de preparação */}
      <SectionCard title="Indicadores de preparação por ano">
        {prepList.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum projeto de preparação com aulas cadastradas.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left font-semibold text-muted-foreground">Ano</th>
                  <th className="pb-3 text-center font-semibold text-muted-foreground">Projetos</th>
                  <th className="pb-3 text-center font-semibold text-muted-foreground">Aulas</th>
                  <th className="pb-3 text-center font-semibold text-indigo-400">Simulados</th>
                  <th className="pb-3 text-right font-semibold text-muted-foreground">
                    Horas totais
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {prepList.map((row) => (
                  <tr
                    key={row.ano}
                    className={`hover:bg-background/50 ${row.ano === ano ? "font-semibold" : ""}`}
                  >
                    <td className="py-3 font-semibold text-foreground">
                      {row.ano}
                      {row.ano === ano && (
                        <span className="ml-2 text-[10px] text-muted-foreground">(atual)</span>
                      )}
                    </td>
                    <td className="py-3 text-center text-foreground">{row.projetos}</td>
                    <td className="py-3 text-center text-foreground">{row.aulas}</td>
                    <td className="py-3 text-center text-indigo-400">{row.simulados || "—"}</td>
                    <td className="py-3 text-right font-medium text-foreground">{row.horas}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Horas calculadas com base na duração cadastrada em cada aula/simulado. Aulas sem duração
          não são contabilizadas.
        </p>
      </SectionCard>

      {/* ── SPRINT 5 ──────────────────────────────────────────────────────── */}
      <Divider label="Plataforma do Aluno" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{fmt(totalOnlineAgora)}</p>
          <p className="mt-0.5 text-xs font-medium text-foreground">Online agora</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">últimos 30 min</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{fmt(totalComAcesso)}</p>
          <p className="mt-0.5 text-xs font-medium text-foreground">Alunos com acesso</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">já entraram na plataforma</p>
        </div>
      </div>

      {/* Atividade por marca */}
      <SectionCard title="Atividade por marca">
        {atividadeMarcaList.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum acesso registrado ainda.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background">
                  <th className="px-3 py-2 text-left text-[11px] font-medium text-muted-foreground">
                    Marca
                  </th>
                  <th className="px-3 py-2 text-center text-[11px] font-medium text-emerald-400">
                    Online agora
                  </th>
                  <th className="px-3 py-2 text-center text-[11px] font-medium text-muted-foreground">
                    Alunos com acesso
                  </th>
                  <th className="px-3 py-2 text-right text-[11px] font-medium text-foreground">
                    Total de acessos
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {atividadeMarcaList.map((m) => (
                  <tr key={m.marca} className="bg-card hover:bg-background/50">
                    <td className="px-3 py-2 font-semibold text-foreground">{m.marca}</td>
                    <td className="px-3 py-2 text-center text-emerald-400">
                      {m.onlineAgora || "—"}
                    </td>
                    <td className="px-3 py-2 text-center text-foreground">
                      {fmt(m.totalComAcesso)}
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-foreground">
                      {fmt(m.totalAcessos)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Alunos mais frequentes */}
      <SectionCard title="Alunos mais frequentes">
        {maisFrequentes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum acesso registrado ainda.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background">
                  <th className="px-3 py-2 text-left text-[11px] font-medium text-muted-foreground">
                    Aluno
                  </th>
                  <th className="px-3 py-2 text-left text-[11px] font-medium text-muted-foreground">
                    Marca
                  </th>
                  <th className="px-3 py-2 text-center text-[11px] font-medium text-foreground">
                    Acessos
                  </th>
                  <th className="px-3 py-2 text-right text-[11px] font-medium text-muted-foreground">
                    Último acesso
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {maisFrequentes.map((a) => (
                  <tr key={a.id} className="bg-card hover:bg-background/50">
                    <td className="px-3 py-2 font-medium text-foreground">{a.nome}</td>
                    <td className="px-3 py-2 text-muted-foreground">{a.marca}</td>
                    <td className="px-3 py-2 text-center font-bold text-foreground">
                      {fmt(a.acessos)}
                    </td>
                    <td className="px-3 py-2 text-right text-[11px] text-muted-foreground">
                      {a.ultimoAcesso
                        ? new Date(a.ultimoAcesso).toLocaleString("pt-BR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
