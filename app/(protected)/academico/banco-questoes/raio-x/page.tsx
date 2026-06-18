import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Raio-X do Banco de Questões" };

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

function BarRow({
  label,
  value,
  total,
  indent = false,
  color = "rgb(91,184,193)",
}: {
  label: string;
  value: number;
  total: number;
  indent?: boolean;
  color?: string;
}) {
  const p = pct(value, total);
  return (
    <div className={indent ? "pl-5" : ""}>
      <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
        <span className={indent ? "text-muted-foreground" : "font-medium text-foreground"}>
          {label}
        </span>
        <span className="shrink-0 tabular-nums text-muted-foreground">
          <span className="font-semibold text-foreground">{fmt(value)}</span>
          <span className="ml-1.5 text-[11px]">({p}%)</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded bg-background">
        <div className="h-full rounded" style={{ width: `${p}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

// ─── Mapas de label ────────────────────────────────────────────────────────────

const OLIMPIADA_LABEL: Record<string, string> = {
  obmep: "OBMEP",
  obmep_mirim: "OBMEP Mirim",
};

const NIVEL_LABEL: Record<string, string> = {
  nivel_1: "Nível 1",
  nivel_2: "Nível 2",
  nivel_3: "Nível 3",
  mirim: "Mirim",
};

const DIFICULDADE_ORDER = ["elementar", "facil", "medio", "dificil", "muito_dificil"];
const DIFICULDADE_LABEL: Record<string, string> = {
  elementar: "Elementar",
  facil: "Fácil",
  medio: "Médio",
  dificil: "Difícil",
  muito_dificil: "Muito Difícil",
};

const TIPO_LABEL: Record<string, string> = {
  multipla_escolha: "Múltipla escolha",
  aberta: "Aberta",
  verdadeiro_ou_falso: "V ou F",
};

const STATUS_LABEL: Record<string, string> = {
  publicado: "Publicado",
  aguardando_revisao: "Aguardando revisão",
};

const RESOLUCAO_ORDER = ["sim", "em_producao", "nao"];
const RESOLUCAO_LABEL: Record<string, string> = {
  sim: "Pronta",
  em_producao: "Em produção",
  nao: "Pendente",
};

const olimpiadaLabel = (v: string) => OLIMPIADA_LABEL[v] ?? v;
const nivelLabel = (v: string | null) => (v ? (NIVEL_LABEL[v] ?? v) : "Mirim");

// ─── Tipos ───────────────────────────────────────────────────────────────────

type QuestaoRow = {
  id: string;
  olimpiada: string;
  nivel: string | null;
  fase: number;
  ano: number;
  topico: string | null;
  subtopico: string | null;
  assunto: string | null;
  dificuldade: string | null;
  publico_alvo: string | null;
  tipo: string;
  status_cadastro: string;
  tem_resolucao_video: string;
  tem_resolucao_texto: string;
};

type SP = {
  olimpiada?: string;
  nivel?: string;
  fase?: string;
  ano?: string;
  status_cadastro?: string;
};

const selectClass =
  "rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-ring focus:outline-none";

// ─── Página ──────────────────────────────────────────────────────────────────

export default async function RaioXBancoQuestoesPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const sp = await searchParams;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("questao")
    .select(
      "id, olimpiada, nivel, fase, ano, topico, subtopico, assunto, " +
        "dificuldade, publico_alvo, tipo, status_cadastro, " +
        "tem_resolucao_video, tem_resolucao_texto, ativo",
    )
    .eq("ativo", true);

  const acervo = (data ?? []) as unknown as QuestaoRow[];

  const olimpiadasDisp = [...new Set(acervo.map((q) => q.olimpiada))].sort();
  const niveisDisp = [...new Set(acervo.map((q) => q.nivel ?? "mirim"))].sort();
  const anosDisp = [...new Set(acervo.map((q) => q.ano))].sort((a, b) => b - a);

  const questoes = acervo.filter((q) => {
    if (sp.olimpiada && q.olimpiada !== sp.olimpiada) return false;
    if (sp.nivel && (q.nivel ?? "mirim") !== sp.nivel) return false;
    if (sp.fase && q.fase !== Number(sp.fase)) return false;
    if (sp.ano && q.ano !== Number(sp.ano)) return false;
    if (sp.status_cadastro && q.status_cadastro !== sp.status_cadastro) return false;
    return true;
  });

  const total = questoes.length;

  const recorteParts: string[] = [];
  if (sp.olimpiada) recorteParts.push(olimpiadaLabel(sp.olimpiada));
  if (sp.nivel) recorteParts.push(nivelLabel(sp.nivel));
  if (sp.fase) recorteParts.push(`${sp.fase}ª Fase`);
  if (sp.ano) recorteParts.push(sp.ano);
  if (sp.status_cadastro) recorteParts.push(STATUS_LABEL[sp.status_cadastro] ?? sp.status_cadastro);
  const recorteLabel = recorteParts.length > 0 ? recorteParts.join(" · ") : "Todo o acervo ativo";

  // ─── Agregações ──────────────────────────────────────────────────────────────

  type TopicoAgg = { total: number; subs: Record<string, number> };
  const topicoMap: Record<string, TopicoAgg> = {};
  for (const q of questoes) {
    const t = q.topico ?? q.assunto ?? "Sem tópico";
    if (!topicoMap[t]) topicoMap[t] = { total: 0, subs: {} };
    topicoMap[t]!.total++;
    const sub = q.subtopico ?? "—";
    topicoMap[t]!.subs[sub] = (topicoMap[t]!.subs[sub] ?? 0) + 1;
  }
  const topicoList = Object.entries(topicoMap)
    .sort((a, b) => b[1].total - a[1].total)
    .map(([nome, agg]) => ({
      nome,
      total: agg.total,
      subs: Object.entries(agg.subs)
        .sort((a, b) => b[1] - a[1])
        .map(([sub, n]) => ({ sub, n })),
    }));

  const difCount: Record<string, number> = {};
  for (const q of questoes) {
    const d =
      q.dificuldade && DIFICULDADE_LABEL[q.dificuldade] ? q.dificuldade : "nao_classificada";
    difCount[d] = (difCount[d] ?? 0) + 1;
  }
  const difList = [
    ...DIFICULDADE_ORDER.map((d) => ({
      key: d,
      label: DIFICULDADE_LABEL[d]!,
      n: difCount[d] ?? 0,
    })),
    { key: "nao_classificada", label: "Não classificada", n: difCount["nao_classificada"] ?? 0 },
  ].filter((d) => d.n > 0 || d.key !== "nao_classificada");

  const statusCount: Record<string, number> = {};
  for (const q of questoes)
    statusCount[q.status_cadastro] = (statusCount[q.status_cadastro] ?? 0) + 1;
  const aguardandoRevisao = statusCount["aguardando_revisao"] ?? 0;
  const statusList = Object.keys({ publicado: 1, aguardando_revisao: 1, ...statusCount })
    .map((k) => ({ key: k, label: STATUS_LABEL[k] ?? k, n: statusCount[k] ?? 0 }))
    .filter((s) => s.n > 0);

  function resolucaoDist(field: "tem_resolucao_video" | "tem_resolucao_texto") {
    const c: Record<string, number> = {};
    for (const q of questoes) c[q[field]] = (c[q[field]] ?? 0) + 1;
    return RESOLUCAO_ORDER.map((k) => ({ key: k, label: RESOLUCAO_LABEL[k]!, n: c[k] ?? 0 }));
  }
  const resVideo = resolucaoDist("tem_resolucao_video");
  const resTexto = resolucaoDist("tem_resolucao_texto");
  const comAlgumaResolucao = questoes.filter(
    (q) => q.tem_resolucao_video === "sim" || q.tem_resolucao_texto === "sim",
  ).length;

  const tipoCount: Record<string, number> = {};
  for (const q of questoes) tipoCount[q.tipo] = (tipoCount[q.tipo] ?? 0) + 1;
  const tipoList = Object.entries(tipoCount)
    .sort((a, b) => b[1] - a[1])
    .map(([k, n]) => ({ key: k, label: TIPO_LABEL[k] ?? k, n }));

  const pubCount: Record<string, number> = {};
  for (const q of questoes)
    pubCount[q.publico_alvo ?? "—"] = (pubCount[q.publico_alvo ?? "—"] ?? 0) + 1;
  const PUBLICO_ORDER = ["EFAI", "EFAF", "EM", "Todos"];
  const pubList = [
    ...PUBLICO_ORDER.map((k) => ({ key: k, label: k, n: pubCount[k] ?? 0 })),
    { key: "—", label: "Não definido", n: pubCount["—"] ?? 0 },
  ].filter((p) => p.n > 0);

  const anoCount: Record<number, number> = {};
  for (const q of questoes) anoCount[q.ano] = (anoCount[q.ano] ?? 0) + 1;
  const anoList = Object.entries(anoCount)
    .map(([ano, n]) => ({ ano: Number(ano), n }))
    .sort((a, b) => b.ano - a.ano);
  const maxAno = Math.max(1, ...anoList.map((a) => a.n));

  const topicosDistintos = topicoList.length;
  const pctComResolucao = pct(comAlgumaResolucao, total);

  const kpis = [
    { label: "Total de questões", value: fmt(total), sub: "no recorte" },
    { label: "Tópicos distintos", value: fmt(topicosDistintos), sub: "categorias" },
    { label: "Aguardando revisão", value: fmt(aguardandoRevisao), sub: "pendentes" },
    { label: "Com resolução", value: `${pctComResolucao}%`, sub: "vídeo ou texto" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Raio-X do Banco de Questões</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Análise do acervo por origem, nível/categoria e fase — cobertura, dificuldade e pipeline
          de conteúdo.
        </p>
      </div>

      {/* Filtros */}
      <form
        method="GET"
        key={`${sp.olimpiada}-${sp.nivel}-${sp.fase}-${sp.ano}-${sp.status_cadastro}`}
        className="rounded-xl border border-border bg-card p-4"
      >
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Origem</label>
            <select name="olimpiada" defaultValue={sp.olimpiada ?? ""} className={selectClass}>
              <option value="">Todas</option>
              {olimpiadasDisp.map((o) => (
                <option key={o} value={o}>
                  {olimpiadaLabel(o)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Nível/Categoria</label>
            <select name="nivel" defaultValue={sp.nivel ?? ""} className={selectClass}>
              <option value="">Todos</option>
              {niveisDisp.map((n) => (
                <option key={n} value={n}>
                  {nivelLabel(n)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Fase</label>
            <select name="fase" defaultValue={sp.fase ?? ""} className={selectClass}>
              <option value="">Todas</option>
              <option value="1">1ª Fase</option>
              <option value="2">2ª Fase</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Ano</label>
            <select name="ano" defaultValue={sp.ano ?? ""} className={selectClass}>
              <option value="">Todos</option>
              {anosDisp.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Status de revisão</label>
            <select
              name="status_cadastro"
              defaultValue={sp.status_cadastro ?? ""}
              className={selectClass}
            >
              <option value="">Todos</option>
              <option value="publicado">Publicado</option>
              <option value="aguardando_revisao">Aguardando revisão</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                recorteParts.length > 0 ? "text-[#0f172a]" : "bg-secondary hover:bg-secondary/80"
              }`}
              style={recorteParts.length > 0 ? { background: "rgb(91,184,193)" } : {}}
            >
              Filtrar
            </button>
            <Link
              href="/academico/banco-questoes/raio-x"
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:border-ring transition-colors"
            >
              Limpar
            </Link>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Recorte: <span className="font-semibold text-foreground">{recorteLabel}</span>
        </p>
      </form>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{k.value}</p>
            <p className="mt-0.5 text-xs font-medium text-foreground">{k.label}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* 1 — Cobertura por tópico */}
      <Divider label="Cobertura por tópico" />
      <SectionCard title="Questões por tópico e subtópico">
        {total === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma questão para este recorte.</p>
        ) : (
          <div className="space-y-4">
            {topicoList.map((t) => (
              <div key={t.nome} className="space-y-2">
                <BarRow label={t.nome} value={t.total} total={total} />
                <div className="space-y-1.5">
                  {t.subs.map((s) => (
                    <BarRow
                      key={s.sub}
                      label={s.sub}
                      value={s.n}
                      total={total}
                      indent
                      color="rgba(91,184,193,0.55)"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* 2 — Dificuldade */}
      <Divider label="Dificuldade" />
      <SectionCard title="Distribuição por nível de dificuldade">
        {total === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma questão para este recorte.</p>
        ) : (
          <div className="space-y-3">
            {difList.map((d) => (
              <BarRow key={d.key} label={d.label} value={d.n} total={total} />
            ))}
          </div>
        )}
      </SectionCard>

      {/* Pipeline de conteúdo */}
      <Divider label="Pipeline de conteúdo" />
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Status de cadastro">
          {total === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma questão para este recorte.</p>
          ) : (
            <div className="space-y-3">
              {statusList.map((s) => (
                <BarRow
                  key={s.key}
                  label={s.label}
                  value={s.n}
                  total={total}
                  color={s.key === "aguardando_revisao" ? "rgb(245,158,11)" : "rgb(16,185,129)"}
                />
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Tipo de questão">
          {total === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma questão para este recorte.</p>
          ) : (
            <div className="space-y-3">
              {tipoList.map((t) => (
                <BarRow key={t.key} label={t.label} value={t.n} total={total} />
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Cobertura de resolução">
        {total === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma questão para este recorte.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Resolução em vídeo
              </p>
              {resVideo.map((r) => (
                <BarRow key={r.key} label={r.label} value={r.n} total={total} />
              ))}
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Resolução em texto
              </p>
              {resTexto.map((r) => (
                <BarRow key={r.key} label={r.label} value={r.n} total={total} />
              ))}
            </div>
          </div>
        )}
      </SectionCard>

      {/* Segmentação */}
      <Divider label="Segmentação" />
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Público-alvo">
          {total === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma questão para este recorte.</p>
          ) : (
            <div className="space-y-3">
              {pubList.map((p) => (
                <BarRow key={p.key} label={p.label} value={p.n} total={total} />
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Questões por ano de prova">
          {total === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma questão para este recorte.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-background">
                    <th className="px-3 py-2 text-left text-[11px] font-medium text-muted-foreground">
                      Ano
                    </th>
                    <th className="px-3 py-2 text-right text-[11px] font-medium text-muted-foreground">
                      Questões
                    </th>
                    <th className="px-3 py-2 text-left text-[11px] font-medium text-muted-foreground">
                      Proporção
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {anoList.map((a) => (
                    <tr key={a.ano} className="bg-card hover:bg-background/50">
                      <td className="px-3 py-2 font-semibold text-foreground">{a.ano}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-foreground">
                        {fmt(a.n)}
                      </td>
                      <td className="px-3 py-2">
                        <div className="h-2 overflow-hidden rounded bg-background">
                          <div
                            className="h-full rounded"
                            style={{
                              width: `${pct(a.n, maxAno)}%`,
                              backgroundColor: "rgb(91,184,193)",
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
