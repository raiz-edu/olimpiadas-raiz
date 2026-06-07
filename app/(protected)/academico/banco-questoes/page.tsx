/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/roles";
import { PageHeader } from "@/components/ui/page-header";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { getQuestoes, excluirQuestao, toggleAtivo, aprovarQuestao } from "./actions";

const OLIMPIADA_LABEL: Record<string, string> = {
  obmep_mirim: "OBMEP Mirim",
  obmep: "OBMEP",
};

const DIFICULDADE_LABEL: Record<string, string> = {
  elementar: "Elementar",
  facil: "Fácil",
  medio: "Médio",
  dificil: "Difícil",
  muito_dificil: "Muito Difícil",
};

const RESOLUCAO_ICON: Record<string, string> = {
  sim: "✓",
  nao: "—",
  em_producao: "⏳",
};

const TIPO_LABEL: Record<string, string> = {
  multipla_escolha: "M. Escolha",
  aberta: "Aberta",
  verdadeiro_ou_falso: "V. ou Falso",
};

export default async function BancoQuestoesPage({
  searchParams,
}: {
  searchParams: Promise<{
    olimpiada?: string;
    fase?: string;
    ano?: string;
    status?: string;
    nivel?: string;
    dificuldade?: string;
    publico_alvo?: string;
    status_cadastro?: string;
    busca?: string;
  }>;
}) {
  const session = await getServerSession();
  if (!session || !can(session.user.role, "questao:read")) redirect("/dashboard");

  const sp = await searchParams;
  const ativoFiltro = sp.status === "ativa" ? true : sp.status === "inativa" ? false : undefined;

  const questoes = await getQuestoes({
    olimpiada: sp.olimpiada || undefined,
    fase: sp.fase ? Number(sp.fase) : undefined,
    ano: sp.ano ? Number(sp.ano) : undefined,
    ativo: ativoFiltro,
    nivel: sp.nivel || undefined,
    dificuldade: sp.dificuldade || undefined,
    publico_alvo: sp.publico_alvo || undefined,
    status_cadastro: sp.status_cadastro || undefined,
    busca: sp.busca || undefined,
  });

  const pendentes = questoes.filter((q: any) => q.status_cadastro === "aguardando_revisao").length;

  const seletorClass =
    "rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground min-w-0";

  return (
    <div>
      <PageHeader
        title="Banco de Questões"
        description={pendentes > 0 ? `${pendentes} aguardando revisão` : undefined}
        action={
          can(session.user.role, "questao:create")
            ? { label: "Nova Questão", href: "/academico/banco-questoes/nova" }
            : undefined
        }
      />

      {/* Filtros */}
      <form method="GET" className="mb-4 space-y-2">
        {/* Linha 1: busca + ações */}
        <div className="flex items-center gap-2">
          <input
            name="busca"
            type="text"
            defaultValue={sp.busca ?? ""}
            placeholder="Buscar por enunciado, tópico…"
            className="w-72 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
          />
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Filtrar
          </button>
          <Link
            href="/academico/banco-questoes"
            className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Limpar
          </Link>
        </div>
        {/* Linha 2: dropdowns */}
        <div className="flex flex-wrap gap-2">
          <select name="olimpiada" defaultValue={sp.olimpiada ?? ""} className={seletorClass}>
            <option value="">Origem</option>
            <option value="obmep">OBMEP</option>
            <option value="obmep_mirim">OBMEP Mirim</option>
            <option value="obm">OBM</option>
            <option value="obf">OBF</option>
            <option value="obi">OBI</option>
          </select>

          <select name="fase" defaultValue={sp.fase ?? ""} className={seletorClass}>
            <option value="">Fase</option>
            <option value="1">1ª Fase</option>
            <option value="2">2ª Fase</option>
          </select>

          <select name="ano" defaultValue={sp.ano ?? ""} className={seletorClass}>
            <option value="">Ano</option>
            {Array.from({ length: 11 }, (_, i) => 2015 + i).map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          <select name="dificuldade" defaultValue={sp.dificuldade ?? ""} className={seletorClass}>
            <option value="">Dificuldade</option>
            <option value="elementar">Elementar</option>
            <option value="facil">Fácil</option>
            <option value="medio">Médio</option>
            <option value="dificil">Difícil</option>
            <option value="muito_dificil">Muito Difícil</option>
          </select>

          <select name="publico_alvo" defaultValue={sp.publico_alvo ?? ""} className={seletorClass}>
            <option value="">Público-alvo</option>
            <option value="EFAI">EFAI</option>
            <option value="EFAF">EFAF</option>
            <option value="EM">EM</option>
            <option value="Todos">Todos</option>
          </select>

          <select
            name="status_cadastro"
            defaultValue={sp.status_cadastro ?? ""}
            className={seletorClass}
          >
            <option value="">Revisão</option>
            <option value="publicado">Publicado</option>
            <option value="aguardando_revisao">Aguardando revisão</option>
          </select>

          <select name="status" defaultValue={sp.status ?? ""} className={seletorClass}>
            <option value="">Ativo/Inativo</option>
            <option value="ativa">Ativa</option>
            <option value="inativa">Inativa</option>
          </select>
        </div>
      </form>

      <p className="mb-3 text-xs text-muted-foreground">
        {questoes.length} {questoes.length !== 1 ? "questões" : "questão"}
      </p>

      {questoes.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
          Nenhuma questão encontrada.{" "}
          {can(session.user.role, "questao:create") && (
            <Link href="/academico/banco-questoes/nova" className="text-primary hover:underline">
              Cadastrar primeira questão →
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[1080px] text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="w-[88px] px-3 py-3 text-left font-semibold">Origem</th>
                <th className="w-[68px] px-3 py-3 text-left font-semibold">Nível</th>
                <th className="w-[44px] px-3 py-3 text-left font-semibold">Fase</th>
                <th className="w-[48px] px-3 py-3 text-left font-semibold">Ano</th>
                <th className="w-[36px] px-3 py-3 text-left font-semibold">Nº</th>
                <th className="w-[88px] px-3 py-3 text-left font-semibold hidden md:table-cell">
                  Tipo
                </th>
                <th className="w-[116px] px-3 py-3 text-left font-semibold hidden lg:table-cell">
                  Tópico
                </th>
                <th className="w-[116px] px-3 py-3 text-left font-semibold hidden xl:table-cell">
                  Subtópico
                </th>
                <th className="w-[92px] px-3 py-3 text-left font-semibold hidden md:table-cell">
                  Dificuldade
                </th>
                <th className="w-[72px] px-3 py-3 text-left font-semibold hidden lg:table-cell">
                  Público-alvo
                </th>
                <th className="w-[72px] px-3 py-3 text-center font-semibold hidden lg:table-cell">
                  Resolução
                </th>
                <th className="w-[80px] px-3 py-3 text-left font-semibold">Status</th>
                <th className="w-[110px] px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {questoes.map((q: any) => (
                <tr
                  key={q.id}
                  className={`border-b border-border/40 hover:bg-background/50 ${
                    q.status_cadastro === "aguardando_revisao" ? "bg-amber-500/5" : ""
                  }`}
                >
                  <td className="px-3 py-2.5 font-medium text-xs whitespace-nowrap">
                    {OLIMPIADA_LABEL[q.olimpiada] ?? q.olimpiada}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                    {q.nivel ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                    {q.fase != null ? `${q.fase}ª` : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-xs whitespace-nowrap">{q.ano}</td>
                  <td className="px-3 py-2.5 text-xs whitespace-nowrap">{q.numero ?? "—"}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground hidden md:table-cell whitespace-nowrap">
                    {TIPO_LABEL[q.tipo] ?? q.tipo}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground hidden lg:table-cell truncate max-w-[116px]">
                    {q.topico ?? q.assunto ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground hidden xl:table-cell truncate max-w-[116px]">
                    {q.subtopico ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground hidden md:table-cell whitespace-nowrap">
                    {DIFICULDADE_LABEL[q.dificuldade] ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground hidden lg:table-cell whitespace-nowrap">
                    {q.publico_alvo ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-center hidden lg:table-cell whitespace-nowrap">
                    <span
                      className="text-xs text-muted-foreground"
                      title={`Vídeo: ${q.tem_resolucao_video} | Texto: ${q.tem_resolucao_texto}`}
                    >
                      {RESOLUCAO_ICON[q.tem_resolucao_video] ?? "—"}
                      {" / "}
                      {RESOLUCAO_ICON[q.tem_resolucao_texto] ?? "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-col gap-1">
                      {/* Status ativo/inativo */}
                      {can(session.user.role, "questao:update") ? (
                        <form action={toggleAtivo.bind(null, q.id, !q.ativo)}>
                          <button
                            type="submit"
                            title={q.ativo ? "Clique para desativar" : "Clique para ativar"}
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold transition-opacity hover:opacity-70 ${q.ativo ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-500/10 text-zinc-400"}`}
                          >
                            {q.ativo ? "Ativa" : "Inativa"}
                          </button>
                        </form>
                      ) : (
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${q.ativo ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-500/10 text-zinc-400"}`}
                        >
                          {q.ativo ? "Ativa" : "Inativa"}
                        </span>
                      )}
                      {/* Badge de revisão */}
                      {q.status_cadastro === "aguardando_revisao" && (
                        <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold bg-amber-500/10 text-amber-400">
                          Revisão
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Botão aprovar — só raiz, só quando aguardando */}
                      {session.user.role === "raiz" &&
                        q.status_cadastro === "aguardando_revisao" && (
                          <form action={aprovarQuestao.bind(null, q.id)}>
                            <button
                              type="submit"
                              className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                            >
                              Aprovar
                            </button>
                          </form>
                        )}
                      <Link
                        href={`/academico/banco-questoes/${q.id}`}
                        className="text-primary hover:underline text-xs"
                      >
                        Editar
                      </Link>
                      {can(session.user.role, "questao:delete") && (
                        <form action={excluirQuestao}>
                          <input type="hidden" name="id" value={q.id} />
                          <ConfirmButton
                            message={`Excluir questão ${q.numero ?? "?"} (${q.fase != null ? `${q.fase}ª fase` : "sem fase"} · ${q.ano})? Esta ação não pode ser desfeita.`}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors"
                          >
                            Excluir
                          </ConfirmButton>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
