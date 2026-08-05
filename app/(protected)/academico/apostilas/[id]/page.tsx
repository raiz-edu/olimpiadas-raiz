import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PageHeader } from "@/components/ui/page-header";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerSession } from "@/lib/auth/session";
import { can, podeGerirApostilas } from "@/lib/auth/roles";
import {
  getNomeModulo,
  getOpcoesAplicacao,
  getReceita,
  type GeracaoRow,
} from "@/lib/apostilas/queries";
import { inputClass, selectClass } from "@/components/ui/form-field";
import { SERIE_LABEL, serieKey } from "@/lib/questoes/series";
import { OLIMPIADA_LABEL } from "@/lib/questoes/olimpiadas";
import { DIFICULDADE_LABEL, type ReceitaConfig } from "@/lib/apostilas/receita";
import { excluirAplicacao, excluirReceita, registrarAplicacao } from "../actions";

export const dynamic = "force-dynamic";

function resumoConfig(c: ReceitaConfig): { rotulo: string; valor: string }[] {
  const linhas: { rotulo: string; valor: string }[] = [];
  if (c.series?.length) {
    linhas.push({
      rotulo: "Séries",
      valor: c.series.map((s) => SERIE_LABEL[serieKey(s) ?? "8"] ?? s).join(", "),
    });
  }
  if (c.publico) linhas.push({ rotulo: "Público", valor: c.publico });
  if (c.origens?.length) {
    linhas.push({
      rotulo: "Origens",
      valor: c.origens.map((o) => OLIMPIADA_LABEL[o] ?? o).join(", "),
    });
  }
  if (c.mix_dificuldade) {
    linhas.push({
      rotulo: "Mix global",
      valor: Object.entries(c.mix_dificuldade)
        .map(([d, p]) => `${DIFICULDADE_LABEL[d] ?? d} ${p}%`)
        .join(" · "),
    });
  }
  for (const s of c.secoes ?? []) {
    linhas.push({
      rotulo: `Seção ${s.nome || s.topico}`,
      valor:
        `${s.quantidade ? `${s.quantidade} questões` : "todas"}` +
        (s.subtopicos?.length ? ` · ${s.subtopicos.join(", ")}` : "") +
        (s.mix_dificuldade
          ? ` · mix próprio ${Object.entries(s.mix_dificuldade)
              .map(([d, p]) => `${DIFICULDADE_LABEL[d] ?? d} ${p}%`)
              .join("/")}`
          : ""),
    });
  }
  if (c.estilo) {
    const e = c.estilo;
    linhas.push({
      rotulo: "Estilo",
      valor: [
        e.colunas ? `${e.colunas} coluna(s)` : null,
        e.escala_figuras ? `figuras x${e.escala_figuras}` : null,
        e.fonte ? `fonte ${e.fonte}` : null,
        e.tamanho_fonte ? `${e.tamanho_fonte}pt` : null,
        e.espacamento ? `espaçamento ${e.espacamento}` : null,
      ]
        .filter(Boolean)
        .join(" · "),
    });
  }
  if (c.marca) linhas.push({ rotulo: "Marca na capa", valor: c.marca });
  if (c.seed !== undefined) linhas.push({ rotulo: "Seed", valor: String(c.seed) });
  return linhas;
}

async function urlsAssinadas(g: GeracaoRow): Promise<{ rotulo: string; url: string }[]> {
  const admin = createAdminClient();
  const saida: { rotulo: string; url: string }[] = [];
  for (const [rotulo, path] of Object.entries(g.versoes ?? {})) {
    if (!path) continue;
    const { data } = await admin.storage.from("apostilas").createSignedUrl(path, 3600);
    if (data?.signedUrl) saida.push({ rotulo, url: data.signedUrl });
  }
  return saida;
}

export default async function ReceitaDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session || !can(session.user.role, "apostila:read")) redirect("/dashboard");
  const gestor = podeGerirApostilas(session.user.role, session.user.email);

  const { id } = await params;
  const [nomeModulo, receita, opcoes] = await Promise.all([
    getNomeModulo(),
    getReceita(id),
    getOpcoesAplicacao(),
  ]);
  if (!receita) notFound();

  const downloads = await Promise.all(receita.geracoes.map((g) => urlsAssinadas(g)));
  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[{ label: nomeModulo, href: "/academico/apostilas" }, { label: receita.nome }]}
      />
      <PageHeader
        title={receita.nome}
        description={receita.titulo + (receita.subtitulo ? ` · ${receita.subtitulo}` : "")}
        action={
          gestor
            ? { label: "Editar", href: `/academico/apostilas/${receita.id}/editar` }
            : undefined
        }
      />

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Receita
        </h2>
        <dl className="grid gap-2 text-sm text-foreground">
          {resumoConfig(receita.config).map((l) => (
            <div key={l.rotulo} className="grid grid-cols-[160px_1fr] gap-2">
              <dt className="font-medium text-muted-foreground">{l.rotulo}</dt>
              <dd>{l.valor}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Gerações ({receita.geracoes.length})
        </h2>
        {receita.geracoes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma geração ainda. A skill gerar-apostila registra aqui ao rodar com --receita-id{" "}
            {receita.id}.
          </p>
        ) : (
          <div className="space-y-4">
            {receita.geracoes.map((g, i) => (
              <div key={g.id} className="rounded-lg border border-border/60 p-4">
                <div className="flex flex-wrap items-center gap-3 text-sm text-foreground">
                  <span className="font-semibold">
                    {new Date(g.gerado_em).toLocaleString("pt-BR")}
                  </span>
                  <span className="text-muted-foreground">{g.total_questoes} questões</span>
                  <span className="text-muted-foreground/70">seed {g.seed}</span>
                  {(downloads[i] ?? []).map((d) => (
                    <Link
                      key={d.rotulo}
                      href={d.url}
                      className="rounded-full border border-primary px-3 py-0.5 text-xs font-medium text-primary hover:bg-primary/5"
                    >
                      PDF {d.rotulo}
                    </Link>
                  ))}
                </div>
                <div className="mt-3 border-t border-border/60 pt-3">
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Aplicações
                  </p>
                  {(receita.aplicacoesPorGeracao[g.id] ?? []).length === 0 ? (
                    <p className="text-xs text-muted-foreground">Nenhuma aplicação registrada.</p>
                  ) : (
                    <ul className="space-y-1 text-sm text-foreground">
                      {(receita.aplicacoesPorGeracao[g.id] ?? []).map((a) => (
                        <li key={a.id} className="flex flex-wrap items-center gap-2">
                          <span>{a.rotulo}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(`${a.aplicado_em}T12:00:00`).toLocaleDateString("pt-BR")}
                            {a.observacao ? ` · ${a.observacao}` : ""}
                          </span>
                          {gestor && (
                            <form action={excluirAplicacao}>
                              <input type="hidden" name="id" value={a.id} />
                              <input type="hidden" name="receita_id" value={receita.id} />
                              <ConfirmButton
                                message="Remover este registro de aplicação?"
                                className="text-xs text-red-400 hover:underline"
                              >
                                remover
                              </ConfirmButton>
                            </form>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  {gestor && (
                    <form
                      action={registrarAplicacao}
                      className="mt-2 flex flex-wrap items-end gap-2 text-xs text-foreground"
                    >
                      <input type="hidden" name="geracao_id" value={g.id} />
                      <input type="hidden" name="receita_id" value={receita.id} />
                      <label className="flex flex-col gap-1 text-muted-foreground">
                        Marca
                        <select name="marca_id" className={`${selectClass} w-40`} defaultValue="">
                          <option value="">—</option>
                          {opcoes.marcas.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.nome}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="flex flex-col gap-1 text-muted-foreground">
                        Unidade
                        <select name="unidade_id" className={`${selectClass} w-52`} defaultValue="">
                          <option value="">—</option>
                          {opcoes.unidades.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.rotulo}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="flex flex-col gap-1 text-muted-foreground">
                        Turma
                        <select name="turma_id" className={`${selectClass} w-60`} defaultValue="">
                          <option value="">—</option>
                          {opcoes.turmas.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.rotulo}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="flex flex-col gap-1 text-muted-foreground">
                        Data
                        <input
                          type="date"
                          name="aplicado_em"
                          defaultValue={hoje}
                          className={`${inputClass} w-36`}
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-muted-foreground">
                        Observação
                        <input name="observacao" className={`${inputClass} w-48`} />
                      </label>
                      <button
                        type="submit"
                        className="rounded-lg border border-primary px-3 py-2 font-medium text-primary hover:bg-primary/5"
                      >
                        Registrar aplicação
                      </button>
                    </form>
                  )}
                </div>
                {g.balanco?.length > 0 && (
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[520px] text-xs text-foreground">
                      <thead>
                        <tr className="text-left text-muted-foreground">
                          <th className="py-1">Seção</th>
                          <th>Dificuldade</th>
                          <th>Pedido</th>
                          <th>Entregue</th>
                          <th>Substituídas</th>
                          <th>Déficit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.balanco.map((l, j) => (
                          <tr key={j} className="border-t border-border/60">
                            <td className="py-1">{l.secao}</td>
                            <td>{DIFICULDADE_LABEL[l.dificuldade] ?? l.dificuldade}</td>
                            <td>{l.pedido}</td>
                            <td>{l.entregue}</td>
                            <td>{l.substituidas}</td>
                            <td className={l.deficit > 0 ? "font-semibold text-red-400" : ""}>
                              {l.deficit}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {gestor && (
        <form action={excluirReceita}>
          <input type="hidden" name="id" value={receita.id} />
          <ConfirmButton
            message={`Excluir a receita "${receita.nome}"? O histórico de gerações vai junto (os PDFs no Storage permanecem).`}
            className="rounded-lg border border-red-500/40 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10"
          >
            Excluir receita
          </ConfirmButton>
        </form>
      )}
    </div>
  );
}
