/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/refs */
"use client";

import { useState, useEffect, useRef, useCallback, useActionState, useTransition } from "react";
import {
  salvarProgresso,
  pausarSimulado,
  finalizarSimulado,
  type SimuladoSessao,
  type RespostasSalvas,
} from "../actions";
import { responderQuestao } from "@/app/aluno/(area)/treino/actions";
import { FormattedText } from "@/components/ui/formatted-text";
import { faseLabel } from "@/lib/questoes/olimpiadas";
import type { Questao, Alternativa } from "@/lib/types/database";

const TEAL = "rgb(91,184,193)";

// ── Timer ─────────────────────────────────────────────────────────────────────

function fmtTempo(seg: number) {
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  const s = seg % 60;
  if (h > 0)
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function timerColor(seg: number, total: number) {
  const pct = seg / total;
  if (pct > 0.25) return "text-foreground";
  if (pct > 0.1) return "text-amber-400";
  return "text-red-400";
}

// ─── Cliente principal ────────────────────────────────────────────────────────

type RespostaLocal = {
  correta: boolean;
  alternativa_id: string;
  alternativa_correta_id: string | null;
};

export function SimuladoClient({
  sessaoInicial,
  questoes,
  primeiraAlt,
  aulaId,
  aulaTitle,
}: {
  sessaoInicial: SimuladoSessao;
  questoes: Questao[];
  primeiraAlt: Alternativa[];
  aulaId: string;
  aulaTitle: string;
}) {
  const total = questoes.length;
  const tempoTotal = sessaoInicial.tempo_restante;

  // Estado do timer e questão
  const [tempo, setTempo] = useState(sessaoInicial.tempo_restante);
  const [idx, setIdx] = useState(sessaoInicial.questao_idx);
  const [finalizado, setFinalizado] = useState(false);
  const [concluido, setConcluido] = useState(false); // mostra tela de conclusão

  // Respostas carregadas da sessão salva + novas durante esta sessão
  const [respostas, setRespostas] = useState<RespostasSalvas>(
    (sessaoInicial.respostas ?? {}) as RespostasSalvas,
  );
  const altSelecionadaRef = useRef<Record<string, string>>({});

  // Alternativas pré-carregadas
  const initialAlts: Record<string, Alternativa[]> = {};
  if (questoes[0]?.id) initialAlts[questoes[0].id] = primeiraAlt;
  const [altsMap, setAltsMap] = useState<Record<string, Alternativa[]>>(initialAlts);

  // Gabarito cache
  const [gabaritoMap, setGabaritoMap] = useState<Record<string, any>>({});
  const [mostrarResolucao, setMostrarResolucao] = useState(false);

  // Pré-carrega alternativas da próxima questão
  useEffect(() => {
    const prox = questoes[idx + 1];
    if (prox && !altsMap[prox.id]) {
      import("@/app/aluno/(area)/treino/actions").then(({ getAlternativasQuestao }) =>
        getAlternativasQuestao(prox.id).then((a) => setAltsMap((m) => ({ ...m, [prox.id]: a }))),
      );
    }
  }, [idx, questoes, altsMap]);

  // Fecha resolução ao trocar questão
  useEffect(() => {
    setMostrarResolucao(false);
  }, [idx]);

  // Server action de resposta
  const [estado, action, isPending] = useActionState(responderQuestao, null);

  // Quando resposta volta do servidor → salvar no mapa local
  useEffect(() => {
    if (estado && !("error" in estado) && "questao_id" in estado) {
      const qid = estado.questao_id;
      const altId = altSelecionadaRef.current[qid] ?? "";
      setRespostas((prev) => ({
        ...prev,
        [qid]: {
          correta: estado.correta,
          alternativa_id: altId,
          alternativa_correta_id: estado.alternativa_correta_id,
        },
      }));
    }
  }, [estado]);

  // ── Refs para closures de callbacks ─────────────────────────────────────────
  const [salvando, startSalvar] = useTransition();
  const respostasRef = useRef(respostas);
  respostasRef.current = respostas;
  const idxRef = useRef(idx);
  idxRef.current = idx;
  const tempoRef = useRef(tempo);
  tempoRef.current = tempo;

  // ── Ações (declaradas antes dos useEffects que as usam) ───────────────────

  const handlePausar = useCallback(() => {
    if (!confirm("Pausar o simulado? Você poderá retomá-lo depois.")) return;
    startSalvar(async () => {
      await pausarSimulado(
        sessaoInicial.id,
        tempoRef.current,
        idxRef.current,
        respostasRef.current,
      );
      window.location.assign("/aluno/simulados");
    });
  }, [sessaoInicial.id]);

  const handleFinalizar = useCallback(async () => {
    if (finalizado) return;
    setFinalizado(true);
    const tempoUsado = tempoTotal - tempoRef.current;
    await finalizarSimulado(sessaoInicial.id, aulaId, tempoUsado, respostasRef.current);
    setConcluido(true); // mostra tela de conclusão inline
  }, [finalizado, tempoTotal, sessaoInicial.id, aulaId]);

  // Ref para handleFinalizar (evita stale closure no timer)
  const handleFinalizarRef = useRef(handleFinalizar);
  handleFinalizarRef.current = handleFinalizar;

  // ── Timer countdown ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (finalizado || tempo <= 0) return;
    const interval = setInterval(() => {
      setTempo((t) => {
        if (t <= 1) {
          clearInterval(interval);
          handleFinalizarRef.current();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [finalizado]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      if (!finalizado) {
        startSalvar(async () => {
          await salvarProgresso(
            sessaoInicial.id,
            tempoRef.current,
            idxRef.current,
            respostasRef.current,
          );
        });
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [finalizado, sessaoInicial.id]);

  // Bloqueia navegação fora do simulado
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!finalizado) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [finalizado]);

  const handleConfirmarEntrega = useCallback(() => {
    const respondidas = Object.keys(respostasRef.current).length;
    const naoRespondidas = total - respondidas;
    const msg =
      naoRespondidas > 0
        ? `Terminar simulado? Ainda há ${naoRespondidas} questão(ões) não respondida(s).`
        : "Terminar simulado? Esta ação não pode ser desfeita.";
    if (!confirm(msg)) return;
    handleFinalizar();
  }, [total, handleFinalizar]);

  // ── Dados da questão atual ───────────────────────────────────────────────────
  const questao = questoes[idx];
  const alts = (questao?.id ? altsMap[questao.id] : undefined) ?? [];
  const respostaAtual = questao ? respostas[questao.id] : undefined;
  const respondido = !!respostaAtual;
  const altCorretaId = respostaAtual?.alternativa_correta_id ?? null;
  const altRespondidaId = respostaAtual?.alternativa_id ?? null;

  async function handleResolucao() {
    if (!questao) return;
    if (mostrarResolucao) {
      setMostrarResolucao(false);
      return;
    }
    if (!gabaritoMap[questao.id]) {
      const { getSolucaoQuestao } = await import("@/app/aluno/(area)/treino/actions");
      const s = await getSolucaoQuestao(questao.id);
      setGabaritoMap((prev) => ({ ...prev, [questao.id]: s }));
    }
    setMostrarResolucao(true);
  }

  const gabarito = questao ? (gabaritoMap[questao.id] ?? null) : null;
  const respondidas = Object.keys(respostas).length;

  if (!questao) return null;

  /* ── Tela de conclusão ──────────────────────────────────────────────────── */
  if (concluido) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="rounded-2xl border border-border bg-card p-10 text-center max-w-sm w-full mx-4 space-y-6">
          <div>
            <p className="text-2xl font-black text-foreground mb-2">Simulado encerrado!</p>
            <p className="text-sm text-muted-foreground">
              {respondidas} de {total} questões respondidas. Suas respostas foram salvas.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.location.assign(`/aluno/simulados/${aulaId}/relatorio`)}
              className="rounded-xl py-3 text-sm font-bold text-[#0f172a] block w-full"
              style={{ background: TEAL }}
            >
              Ver meu desempenho
            </button>
            <button
              onClick={() => window.location.assign("/aluno/simulados")}
              className="rounded-xl border border-border py-3 text-sm text-muted-foreground hover:text-foreground transition-colors block w-full"
            >
              Voltar aos simulados
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    /* Overlay fullscreen — cobre o AlunoNav durante a avaliação */
    <div className="fixed inset-0 z-50 flex flex-col bg-background overflow-y-auto">
      {/* ── Header do simulado ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-border bg-card shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex-1 min-w-0 mr-4">
            <p className="truncate text-sm font-semibold text-foreground">{aulaTitle}</p>
            <p className="text-xs text-muted-foreground">
              {idx + 1}/{total} questões · {respondidas} respondidas
            </p>
          </div>

          {/* Timer */}
          <div
            className={`flex items-center gap-2 text-2xl font-black tabular-nums mx-4 ${timerColor(tempo, tempoTotal)}`}
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {fmtTempo(tempo)}
          </div>

          <div className="flex items-center gap-2">
            {salvando && <span className="text-[10px] text-muted-foreground">Salvando…</span>}
            <button
              onClick={handlePausar}
              disabled={salvando}
              className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
            >
              Pausar
            </button>
            <button
              onClick={handleConfirmarEntrega}
              disabled={finalizado || salvando}
              className="rounded-lg px-4 py-1.5 text-xs font-bold text-[#0f172a] disabled:opacity-40"
              style={{ background: TEAL }}
            >
              Terminar
            </button>
          </div>
        </div>

        {/* Barra de progresso de questões */}
        <div className="h-1 bg-muted">
          <div
            className="h-full transition-all"
            style={{ width: `${(respondidas / total) * 100}%`, background: TEAL }}
          />
        </div>
      </header>

      {/* ── Conteúdo ──────────────────────────────────────────────────────── */}
      <main className="flex-1 px-4 py-6 sm:px-6 max-w-3xl mx-auto w-full">
        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          {/* Meta */}
          <div className="flex flex-wrap gap-2">
            {questao.topico && (
              <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-400">
                {questao.topico}
              </span>
            )}
            <span className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground">
              {questao.fase != null ? `${faseLabel(questao.olimpiada, questao.fase)} · ` : ""}
              {questao.ano}
            </span>
          </div>

          <p className="text-xs text-muted-foreground">Questão {idx + 1}</p>

          {/* Enunciado */}
          <div>
            {Array.isArray((questao as any).enunciado_blocos) ? (
              ((questao as any).enunciado_blocos as any[]).map((b: any, i: number) =>
                b.tipo === "texto" ? (
                  <p
                    key={i}
                    className="text-[15px] leading-relaxed text-foreground mb-3 whitespace-pre-wrap"
                  >
                    <FormattedText text={b.conteudo} />
                  </p>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={b.url}
                    alt={`Figura ${i + 1}`}
                    className="max-w-full rounded-lg border border-border mb-3"
                    style={
                      b.largura && b.largura !== "completa"
                        ? {
                            maxWidth: (
                              {
                                pequena: "min(200px, 100%)",
                                media: "min(320px, 100%)",
                                grande: "min(480px, 100%)",
                              } as any
                            )[b.largura],
                          }
                        : { maxWidth: "100%" }
                    }
                  />
                ),
              )
            ) : (
              <p className="text-[15px] leading-relaxed text-foreground whitespace-pre-wrap">
                {questao.enunciado}
              </p>
            )}
          </div>

          {/* Alternativas */}
          {questao.tipo === "multipla_escolha" && (
            <div className="space-y-2.5">
              {alts.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Carregando alternativas…</p>
              ) : (
                alts.map((alt) => {
                  const isCorreta = respondido && alt.id === altCorretaId;
                  const isErrada =
                    respondido && alt.id === altRespondidaId && !respostaAtual?.correta;
                  const isNeutra = !respondido;
                  return (
                    <div
                      key={alt.id}
                      className={`rounded-lg border-2 transition-all ${isNeutra ? "border-border cursor-pointer hover:border-sky-400 hover:bg-sky-400/5" : isCorreta ? "border-emerald-500 bg-emerald-500/8" : isErrada ? "border-red-500 bg-red-500/8" : "border-border opacity-60"}`}
                    >
                      <form action={action}>
                        <input type="hidden" name="questao_id" value={questao.id} />
                        <input type="hidden" name="alternativa_id" value={alt.id} />
                        <input type="hidden" name="contexto" value="simulado" />
                        <input type="hidden" name="aula_id" value={aulaId} />
                        <button
                          type="submit"
                          disabled={respondido || isPending}
                          onClick={() => {
                            altSelecionadaRef.current[questao.id] = alt.id;
                          }}
                          className="flex items-start gap-3 w-full p-3 text-left"
                        >
                          <span
                            className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${isCorreta ? "border-emerald-500 text-emerald-400" : isErrada ? "border-red-500 text-red-400" : "border-muted-foreground text-muted-foreground"}`}
                          >
                            {alt.letra}
                          </span>
                          <div className="flex-1">
                            {alt.texto && <p className="text-sm text-foreground">{alt.texto}</p>}
                            {alt.imagem_url && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={alt.imagem_url}
                                alt={`Alt ${alt.letra}`}
                                className="mt-2 rounded border border-border"
                                style={{
                                  width:
                                    (
                                      {
                                        pequena: "120px",
                                        media: "220px",
                                        grande: "360px",
                                        completa: "100%",
                                      } as Record<string, string>
                                    )[(alt as any).imagem_largura ?? "media"] ?? "220px",
                                  maxWidth: "100%",
                                }}
                              />
                            )}
                          </div>
                        </button>
                      </form>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Feedback */}
          {respondido && (
            <div
              className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold ${respostaAtual?.correta ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-red-500/30 bg-red-500/10 text-red-400"}`}
            >
              {respostaAtual?.correta ? "✓ Correto!" : "✗ Resposta incorreta."}
            </div>
          )}

          {/* Resolução inline */}
          {respondido && mostrarResolucao && (
            <div className="rounded-xl border border-border bg-background overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
                <span
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: TEAL }}
                >
                  Resolução
                </span>
              </div>
              <div className="p-5 space-y-3">
                {(gabarito as any)?.blocos?.length ? (
                  <div className="space-y-3">
                    {(
                      (gabarito as any).blocos as Array<{
                        tipo: string;
                        conteudo?: string;
                        url?: string;
                        largura?: string;
                      }>
                    ).map((b, i) =>
                      b.tipo === "texto" ? (
                        <p key={i} className="text-sm text-muted-foreground whitespace-pre-wrap">
                          <FormattedText text={b.conteudo ?? ""} />
                        </p>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={i}
                          src={b.url!}
                          alt="Resolução"
                          className="rounded-lg border border-border"
                          style={{
                            width:
                              (
                                {
                                  pequena: "180px",
                                  media: "360px",
                                  grande: "560px",
                                } as Record<string, string>
                              )[b.largura ?? ""] ?? "100%",
                            maxWidth: "100%",
                          }}
                        />
                      ),
                    )}
                  </div>
                ) : gabarito?.texto ? (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {gabarito.texto}
                  </p>
                ) : gabarito?.imagem_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={gabarito.imagem_url}
                    alt="Resolução"
                    className="rounded-lg border border-border"
                    style={{
                      width:
                        (
                          {
                            pequena: "180px",
                            media: "360px",
                            grande: "560px",
                            completa: "100%",
                          } as Record<string, string>
                        )[(gabarito as any).imagem_largura ?? "completa"] ?? "100%",
                      maxWidth: "100%",
                    }}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground italic">Resolução não disponível.</p>
                )}
              </div>
            </div>
          )}

          {/* Ações de navegação */}
          <div className="flex flex-wrap gap-3 pt-1">
            <button
              onClick={handleResolucao}
              disabled={!respondido}
              className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-35 disabled:cursor-not-allowed ${mostrarResolucao ? "border-sky-400 text-sky-400 bg-sky-400/8" : "border-border text-muted-foreground hover:border-sky-400 hover:text-sky-400"}`}
            >
              {mostrarResolucao ? "Fechar resolução" : "Resolução"}
            </button>
            <button
              onClick={() => setIdx((i) => Math.max(0, i - 1))}
              disabled={idx === 0}
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Voltar
            </button>
            <button
              onClick={() => (idx + 1 < total ? setIdx((i) => i + 1) : handleConfirmarEntrega())}
              className={
                respondido
                  ? "rounded-lg px-5 py-2 text-sm font-bold text-[#0f172a]"
                  : "rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
              }
              style={respondido ? { background: TEAL } : {}}
            >
              {idx + 1 < total
                ? respondido
                  ? "Próxima →"
                  : "Avançar →"
                : respondido
                  ? "Terminar"
                  : "Avançar →"}
            </button>
          </div>
        </div>

        {/* Mini-mapa de questões */}
        <div className="mt-4 rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Questões
          </p>
          <div className="flex flex-wrap gap-1.5">
            {questoes.map((q, i) => {
              const resp = respostas[q.id];
              return (
                <button
                  key={q.id}
                  onClick={() => setIdx(i)}
                  className={`h-8 w-8 rounded-lg text-xs font-bold transition-colors ${i === idx ? "ring-2 ring-offset-1 ring-ring" : ""} ${resp ? (resp.correta ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400") : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
