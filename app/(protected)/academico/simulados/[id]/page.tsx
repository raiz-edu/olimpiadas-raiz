/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useActionState, useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  getSimuladoDetalhe,
  getProjetos,
  getTurmas,
  atualizarSimulado,
  excluirSimulado,
  publicarSimulado,
  despublicarSimulado,
  vincularQuestao,
  desvincularQuestao,
  toggleVisivelAluno,
  buscarQuestoes,
  criarQuestaoParaSimulado,
} from "../actions";
import { SimuladoForm } from "../simulado-form";
import { inputClass } from "@/components/ui/form-field";
import { useUser } from "@/lib/auth/context";

type Simulado = Awaited<ReturnType<typeof getSimuladoDetalhe>>;
type Projeto = { id: string; nome: string; olimpiada_sigla: string; ano_letivo: number };
type Turma = {
  id: string;
  nome: string;
  serie: string;
  ano_letivo: number;
  unidade_nome?: string;
};
type Questao = {
  id: string;
  olimpiada: string;
  nivel: string | null;
  fase: number | null;
  ano: number;
  numero: number | null;
  enunciado: string;
  topico: string | null;
  subtopico: string | null;
  usos?: number;
};

function fmtSegundos(s: number | null) {
  if (!s) return "";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((v) => String(v).padStart(2, "0")).join(":");
}

export default function EditarSimuladoPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useUser();
  const isRaiz = user.role === "raiz";
  const [id, setId] = useState<string | null>(null);
  const [simulado, setSimulado] = useState<Simulado | null>(null);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<Questao[]>([]);
  const [buscando, startBusca] = useTransition();
  const [showNovaQuestao, setShowNovaQuestao] = useState(false);
  const [novaQuestaoState, novaQuestaoAction] = useActionState(
    id ? criarQuestaoParaSimulado.bind(null, id ?? "") : async () => null,
    null,
  );
  const [, startPublish] = useTransition();
  const [, startDelete] = useTransition();

  useEffect(() => {
    params.then(({ id: pid }) => {
      setId(pid);
      getSimuladoDetalhe(pid).then(setSimulado);
      getProjetos().then(setProjetos);
      getTurmas().then(setTurmas);
    });
  }, [params]);

  useEffect(() => {
    if (novaQuestaoState && "ok" in novaQuestaoState && id) {
      getSimuladoDetalhe(id).then(setSimulado);
    }
  }, [novaQuestaoState, id]);

  const action = id ? atualizarSimulado.bind(null, id) : async () => null;
  const [state, formAction] = useActionState(action as any, null);

  const error = state && "error" in state ? (state as any).error : null;
  const saved = state && "ok" in state;

  if (!simulado || !id) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Carregando…
      </div>
    );
  }

  const questoesVinculadas = (simulado.questoes ?? []).sort((a: any, b: any) => a.ordem - b.ordem);

  function handleBusca() {
    startBusca(async () => {
      const r = await buscarQuestoes(busca);
      setResultados(r);
    });
  }

  const vinculadasIds = new Set(questoesVinculadas.map((q: any) => q.questao_id));

  return (
    <div className="max-w-2xl space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/academico/simulados" className="hover:text-foreground">
            Simulados
          </Link>
          <span>/</span>
          <span className="text-foreground">{simulado.titulo}</span>
        </div>
        <div className="flex gap-2 items-center">
          {isRaiz ? (
            simulado.publicada ? (
              <button
                type="button"
                onClick={() =>
                  startPublish(async () => {
                    await despublicarSimulado(id);
                    setSimulado({ ...simulado, publicada: false });
                  })
                }
                className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Despublicar
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  startPublish(async () => {
                    await publicarSimulado(id);
                    setSimulado({ ...simulado, publicada: true });
                  })
                }
                className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
              >
                Publicar
              </button>
            )
          ) : (
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                simulado.publicada
                  ? "bg-emerald-400/10 text-emerald-400"
                  : "bg-amber-400/10 text-amber-400"
              }`}
            >
              {simulado.publicada ? "Publicado" : "Aguardando aprovação"}
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              if (!confirm("Excluir este simulado? Esta ação não pode ser desfeita.")) return;
              startDelete(async () => {
                await excluirSimulado(id);
              });
            }}
            className="rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20 transition-colors"
          >
            Excluir
          </button>
        </div>
      </div>

      {saved && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          Salvo com sucesso.
        </div>
      )}

      {/* Form */}
      <SimuladoForm
        action={formAction as any}
        projetos={projetos}
        turmas={turmas}
        defaults={{
          titulo: simulado.titulo,
          modalidade: simulado.link_aula ? "online" : simulado.polos ? "presencial" : "online",
          data_hora: simulado.data_hora ?? undefined,
          duracao: fmtSegundos(simulado.duracao_minutos),
          link: simulado.link_aula ?? undefined,
          polos: simulado.polos ?? undefined,
          descricao: simulado.descricao ?? undefined,
          publicada: simulado.publicada,
          projeto_ids: simulado.projeto_ids ?? [],
          turma_ids: simulado.turma_ids ?? [],
          series_elegiveis: simulado.series_elegiveis ?? [],
        }}
        submitLabel="Salvar alterações"
        cancelHref="/academico/simulados"
        error={error}
        isRaiz={isRaiz}
      />

      {/* Questões */}
      <div className="space-y-4 rounded-xl border border-border bg-card p-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Questões do simulado ({questoesVinculadas.length})
        </h2>

        {questoesVinculadas.length > 0 && (
          <div className="space-y-2">
            {questoesVinculadas.map((aq: any) => {
              const q = aq.questao;
              const visivel = aq.visivel_aluno !== false;
              return (
                <div
                  key={aq.id}
                  className={`flex items-start justify-between gap-3 rounded-lg border px-3 py-2 transition-colors ${
                    visivel
                      ? "border-border bg-background"
                      : "border-border/40 bg-muted/20 opacity-60"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {q.olimpiada?.toUpperCase()} {q.fase != null ? `· ${q.fase}ª Fase` : ""} ·{" "}
                      {q.ano} {q.numero != null ? `· Q${q.numero}` : ""}
                      {q.topico ? ` · ${q.topico}` : ""}
                    </p>
                    <p className="text-sm text-foreground truncate">{q.enunciado}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      title={visivel ? "Ocultar para o aluno" : "Liberar para o aluno"}
                      onClick={async () => {
                        await toggleVisivelAluno(id, aq.id, !visivel);
                        setSimulado({
                          ...simulado,
                          questoes: simulado.questoes.map((x: any) =>
                            x.id === aq.id ? { ...x, visivel_aluno: !visivel } : x,
                          ),
                        });
                      }}
                      className={`text-xs font-medium transition-colors ${
                        visivel
                          ? "text-emerald-400 hover:text-amber-400"
                          : "text-muted-foreground hover:text-emerald-400"
                      }`}
                    >
                      {visivel ? "Visível" : "Oculta"}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await desvincularQuestao(id, q.id);
                        setSimulado({
                          ...simulado,
                          questoes: simulado.questoes.filter((x: any) => x.questao_id !== q.id),
                        });
                      }}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tabs: Nova questão / Buscar no banco */}
        <div className="border-t border-border pt-4 space-y-3">
          <div className="flex gap-1 rounded-lg border border-border bg-background p-1 w-fit">
            <button
              type="button"
              onClick={() => setShowNovaQuestao(false)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                !showNovaQuestao
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Buscar no banco
            </button>
            <button
              type="button"
              onClick={() => setShowNovaQuestao(true)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                showNovaQuestao
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Nova questão
            </button>
          </div>

          {!showNovaQuestao && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Adicionar questão do banco
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleBusca()}
                  placeholder="Número, palavra do enunciado…"
                  className={`${inputClass} flex-1`}
                />
                <button
                  type="button"
                  onClick={handleBusca}
                  disabled={buscando}
                  className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
                >
                  {buscando ? "…" : "Buscar"}
                </button>
              </div>
              {resultados.length > 0 && (
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {resultados.map((q) => {
                    const jaVinculada = vinculadasIds.has(q.id);
                    return (
                      <div
                        key={q.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-0.5">
                            <p className="text-xs text-muted-foreground">
                              {q.olimpiada?.toUpperCase()}{" "}
                              {q.fase != null ? `· ${q.fase}ª Fase` : ""} · {q.ano}
                              {q.numero != null ? ` · Q${q.numero}` : ""}
                            </p>
                            {(q.usos ?? 0) > 0 && (
                              <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] text-amber-400">
                                Usada em {q.usos} {q.usos === 1 ? "avaliação" : "avaliações"}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-foreground truncate">{q.enunciado}</p>
                        </div>
                        <button
                          type="button"
                          disabled={jaVinculada}
                          onClick={async () => {
                            if (jaVinculada) return;
                            await vincularQuestao(id, q.id);
                            const atualizado = await getSimuladoDetalhe(id);
                            setSimulado(atualizado);
                          }}
                          className="shrink-0 text-xs font-medium disabled:opacity-40 text-primary hover:underline transition-colors"
                        >
                          {jaVinculada ? "Já adicionada" : "Adicionar"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {showNovaQuestao && (
            <form
              action={novaQuestaoAction as any}
              className="space-y-3"
              onSubmit={() => {
                if (novaQuestaoState && "ok" in novaQuestaoState) {
                  getSimuladoDetalhe(id).then(setSimulado);
                }
              }}
            >
              {novaQuestaoState && "error" in novaQuestaoState && (
                <p className="text-xs text-destructive">{(novaQuestaoState as any).error}</p>
              )}
              {novaQuestaoState && "ok" in novaQuestaoState && (
                <p className="text-xs text-emerald-400">Questão criada e vinculada.</p>
              )}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <label className="text-xs text-muted-foreground">Origem</label>
                  <input
                    name="olimpiada"
                    type="text"
                    placeholder="obmep…"
                    className={`${inputClass} mt-1`}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Nível</label>
                  <input
                    name="nivel"
                    type="text"
                    placeholder="nivel_1…"
                    className={`${inputClass} mt-1`}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Fase</label>
                  <input
                    name="fase"
                    type="number"
                    placeholder="opcional"
                    className={`${inputClass} mt-1`}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Ano</label>
                  <input
                    name="ano"
                    type="number"
                    defaultValue={new Date().getFullYear()}
                    className={`${inputClass} mt-1`}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Nº</label>
                  <input
                    name="numero"
                    type="number"
                    placeholder="opcional"
                    className={`${inputClass} mt-1`}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Tipo</label>
                  <select name="tipo" className={`${inputClass} mt-1`}>
                    <option value="multipla_escolha">M. Escolha</option>
                    <option value="aberta">Aberta</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Tópico</label>
                  <input
                    name="topico"
                    type="text"
                    placeholder="opcional"
                    className={`${inputClass} mt-1`}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Subtópico</label>
                  <input
                    name="subtopico"
                    type="text"
                    placeholder="opcional"
                    className={`${inputClass} mt-1`}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Categoria</label>
                  <input
                    name="categoria"
                    type="text"
                    placeholder="opcional"
                    className={`${inputClass} mt-1`}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Enunciado *</label>
                <textarea
                  name="enunciado"
                  required
                  rows={3}
                  placeholder="Texto da questão…"
                  className={`${inputClass} mt-1 w-full resize-none`}
                />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
              >
                Criar e vincular
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
