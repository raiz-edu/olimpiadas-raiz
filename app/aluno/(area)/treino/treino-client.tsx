/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useActionState, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import {
  responderQuestao,
  getSolucaoQuestao,
  getAlternativasQuestao,
  responderQuestaoAberta,
  toggleFavorito,
} from "./actions";
import type { RespostaAbertaState } from "./actions";
import { FormattedText } from "@/components/ui/formatted-text";
import { RespostaAbertaInput, FeedbackAberto } from "@/components/aluno/resposta-aberta-input";
import type { FeedbackIA } from "@/lib/ai/types";
import type { Questao, Alternativa } from "@/lib/types/database";
import { OLIMPIADA_LABEL, NIVEL_LABEL, faseLabel } from "@/lib/questoes/olimpiadas";
const TEAL = "rgb(91,184,193)";

type RespostaLocal = {
  correta: boolean;
  alternativa_id: string;
  alternativa_correta_id: string | null;
};

type RespostaAbertaLocal = {
  correta: boolean;
  feedback: FeedbackIA | null;
};

type BlocoRes =
  | { tipo: "texto"; conteudo: string }
  | { tipo: "imagem"; url: string; largura?: string };
type GabaritoLocal = {
  texto: string | null;
  imagem_url: string | null;
  blocos?: BlocoRes[] | null;
} | null;

export function TreinoClient({
  questoes,
  primeiraAlt,
  numeracaoSequencial = false,
  completionUrl,
  completionLabel: _completionLabel,
  contexto = "banco",
  aulaId,
  totalDisponivel,
  favoritoIdsIniciais = [],
}: {
  questoes: Questao[];
  primeiraAlt: Alternativa[];
  numeracaoSequencial?: boolean;
  completionUrl?: string;
  completionLabel?: string;
  contexto?: "banco" | "aula" | "simulado";
  aulaId?: string;
  totalDisponivel?: number;
  favoritoIdsIniciais?: string[];
}) {
  const [idx, setIdx] = useState(0);
  const total = questoes.length;

  /* ── Alternativas pré-carregadas ─────────────────────────────────────────── */
  const initialAlts: Record<string, Alternativa[]> = {};
  if (questoes[0]?.id) initialAlts[questoes[0].id] = primeiraAlt;
  const [altsMap, setAltsMap] = useState<Record<string, Alternativa[]>>(initialAlts);

  /* ── Respostas da sessão (persistem ao navegar) ───────────────────────────── */
  const [respostas, setRespostas] = useState<Record<string, RespostaLocal>>({});
  const [respostasAbertas, setRespostasAbertas] = useState<Record<string, RespostaAbertaLocal>>({});
  // Ref que captura qual alternativa o aluno clicou antes da resposta do servidor
  const altSelecionadaRef = useRef<Record<string, string>>({});

  /* ── Seleção pendente (antes de confirmar) ───────────────────────────────── */
  const [altPendente, setAltPendente] = useState<Record<string, string>>({});

  /* ── Favoritos ───────────────────────────────────────────────────────────── */
  const [favoritos, setFavoritos] = useState<Set<string>>(new Set(favoritoIdsIniciais));
  const [, startFavTransition] = useTransition();

  function handleFavorito(questaoId: string) {
    const novoEstado = !favoritos.has(questaoId);
    setFavoritos((prev) => {
      const next = new Set(prev);
      novoEstado ? next.add(questaoId) : next.delete(questaoId);
      return next;
    });
    startFavTransition(async () => {
      await toggleFavorito(questaoId);
    });
  }

  /* ── Gabarito por questão (cache) ────────────────────────────────────────── */
  const [gabaritoMap, setGabaritoMap] = useState<Record<string, GabaritoLocal>>({});
  const [mostrarGabarito, setMostrarGabarito] = useState(false);

  /* ── Finalizar treino ────────────────────────────────────────────────────── */
  const [finalizado, setFinalizado] = useState(false);
  const [mostrarDesempenhoAula, setMostrarDesempenhoAula] = useState(false);

  /* ── Server actions ─────────────────────────────────────────────────────── */
  const [estado, action, isPending] = useActionState(responderQuestao, null);
  const [estadoAberta, actionAberta, isPendingAberta] = useActionState<
    RespostaAbertaState,
    FormData
  >(responderQuestaoAberta, null);

  // Quando chega nova resposta do servidor, persiste no mapa local
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

  // Pré-carrega alternativas da próxima questão
  useEffect(() => {
    const prox = questoes[idx + 1];
    if (prox && !altsMap[prox.id]) {
      getAlternativasQuestao(prox.id).then((a) => setAltsMap((m) => ({ ...m, [prox.id]: a })));
    }
  }, [idx, questoes, altsMap]);

  // Captura resposta aberta avaliada
  useEffect(() => {
    if (estadoAberta && !("error" in estadoAberta) && "questao_id" in estadoAberta) {
      const qid = estadoAberta.questao_id;
      const feedback = "feedback" in estadoAberta ? estadoAberta.feedback : null;
      setRespostasAbertas((prev) => ({
        ...prev,
        [qid]: {
          correta: feedback ? feedback.itens.every((i) => i.status === "correto") : false,
          feedback,
        },
      }));
    }
  }, [estadoAberta]);

  // Fecha gabarito ao trocar de questão
  useEffect(() => {
    setMostrarGabarito(false);
  }, [idx]);

  /* ── Dados da questão atual ──────────────────────────────────────────────── */
  const questao = questoes[idx];
  const alts = (questao?.id ? altsMap[questao.id] : undefined) ?? [];

  const respostaAtual: RespostaLocal | undefined = questao ? respostas[questao.id] : undefined;
  const respondido = !!respostaAtual;
  const correta = respostaAtual?.correta ?? null;
  const altCorretaId = respostaAtual?.alternativa_correta_id ?? null;
  const altRespondidaId = respostaAtual?.alternativa_id ?? null;

  const gabarito: GabaritoLocal = questao ? (gabaritoMap[questao.id] ?? null) : null;
  const altCorretaLetra = alts.find((a) => a.id === altCorretaId)?.letra ?? null;

  const respostaAbertaAtual: RespostaAbertaLocal | undefined = questao
    ? respostasAbertas[questao.id]
    : undefined;
  const respondidoAberto = !!respostaAbertaAtual;
  const respondidoQuestao = questao?.tipo === "aberta" ? respondidoAberto : respondido;

  async function handleGabarito() {
    if (!questao) return;
    if (mostrarGabarito) {
      setMostrarGabarito(false);
      return;
    }
    if (gabaritoMap[questao.id] === undefined) {
      const s = await getSolucaoQuestao(questao.id);
      setGabaritoMap((prev) => ({ ...prev, [questao.id]: s }));
    }
    setMostrarGabarito(true);
  }

  /* ── Tela de conclusão ───────────────────────────────────────────────────── */
  const respondidas = Object.keys(respostas).length;

  if (finalizado || idx >= total) {
    // ── Desempenho inline da sessão da aula ──────────────────────────────────
    if (completionUrl && mostrarDesempenhoAula) {
      const acertosTotal = Object.values(respostas).filter((r) => r.correta).length;
      const pctGeral = respondidas > 0 ? Math.round((acertosTotal / respondidas) * 100) : 0;

      // Agrupar por tópico
      const porTopico: Record<string, { total: number; acertos: number }> = {};
      questoes.forEach((q) => {
        if (respostas[q.id]) {
          const t = (q as any).topico ?? "Sem tópico";
          if (!porTopico[t]) porTopico[t] = { total: 0, acertos: 0 };
          porTopico[t]!.total++;
          if (respostas[q.id]!.correta) porTopico[t]!.acertos++;
        }
      });

      return (
        <div className="rounded-xl border border-border bg-card p-8 space-y-6">
          <div className="text-center">
            <p className="text-lg font-bold text-foreground mb-1">Desempenho desta aula</p>
            <p className="text-xs text-muted-foreground">
              {respondidas} de {total} questões respondidas
            </p>
          </div>

          {/* Resumo */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="text-2xl font-black text-foreground">{respondidas}</p>
              <p className="text-xs text-muted-foreground mt-1">Respondidas</p>
            </div>
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="text-2xl font-black text-emerald-400">{acertosTotal}</p>
              <p className="text-xs text-muted-foreground mt-1">Acertos</p>
            </div>
            <div className="rounded-xl border border-border bg-background p-4">
              <p
                className="text-2xl font-black"
                style={{
                  color: pctGeral >= 70 ? "#4ade80" : pctGeral >= 50 ? "#fbbf24" : "#f87171",
                }}
              >
                {pctGeral}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">Acerto</p>
            </div>
          </div>

          {/* Por tópico */}
          {Object.keys(porTopico).length > 0 && (
            <div className="rounded-xl border border-border bg-background overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Por tópico
                </p>
              </div>
              <div className="divide-y divide-border/40">
                {Object.entries(porTopico).map(([topico, data]) => {
                  const pctT = Math.round((data.acertos / data.total) * 100);
                  return (
                    <div key={topico} className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-foreground">{topico}</span>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-muted-foreground">
                          {data.total} questão{data.total !== 1 ? "ões" : ""}
                        </span>
                        <span
                          className="font-bold"
                          style={{
                            color: pctT >= 70 ? "#4ade80" : pctT >= 50 ? "#fbbf24" : "#f87171",
                          }}
                        >
                          {pctT}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-center gap-3">
            <button
              onClick={() => setMostrarDesempenhoAula(false)}
              className="rounded-lg border border-border px-5 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Fechar
            </button>
            <button
              onClick={() => {
                setFinalizado(false);
                setIdx(0);
                setMostrarDesempenhoAula(false);
              }}
              className="rounded-lg px-5 py-2.5 text-sm font-bold text-[#0f172a]"
              style={{ background: TEAL }}
            >
              Concluir
            </button>
          </div>
        </div>
      );
    }

    // ── Tela de conclusão padrão ─────────────────────────────────────────────
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <p className="text-xl font-bold text-foreground mb-2">Sessão concluída!</p>
        <div className="mb-6">
          <p className="text-muted-foreground">
            Você respondeu {respondidas} de {total} questões nesta sessão.
          </p>
          {!completionUrl && typeof totalDisponivel === "number" && totalDisponivel > total && (
            <p className="mt-2 text-sm text-muted-foreground">
              Esses filtros têm {totalDisponivel} questões disponíveis ao todo — cada nova sessão
              sorteia uma seleção diferente. Clique em &quot;Nova sessão&quot; para continuar
              treinando com outras questões.
            </p>
          )}
        </div>
        <div className="flex justify-center gap-3">
          {completionUrl ? (
            // Contexto de aula: Ver desempenho + Concluir
            <>
              <button
                onClick={() => setMostrarDesempenhoAula(true)}
                className="rounded-lg border border-border px-5 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Ver desempenho
              </button>
              <button
                onClick={() => {
                  setFinalizado(false);
                  setIdx(0);
                  setMostrarDesempenhoAula(false);
                }}
                className="rounded-lg px-5 py-2.5 text-sm font-bold text-[#0f172a]"
                style={{ background: TEAL }}
              >
                Concluir
              </button>
            </>
          ) : (
            // Contexto de treino livre: Ver meu desempenho + Nova sessão
            <>
              <Link
                href="/aluno/treino/dashboard"
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Ver meu desempenho
              </Link>
              <button
                onClick={() => window.location.assign("/aluno/treino")}
                className="rounded-lg border border-border px-5 py-2.5 text-sm text-muted-foreground hover:text-foreground"
              >
                Nova sessão
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!questao) return null;

  /* ── Render principal ────────────────────────────────────────────────────── */
  return (
    <div>
      {/* Progresso + botão Finalizar */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex-1">
          <div className="h-1.5 rounded-full bg-card overflow-hidden mb-1.5">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(idx / total) * 100}%`, background: TEAL }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Questão {idx + 1} de {total}
            {respondidas > 0 && (
              <span className="ml-2 text-muted-foreground/60">· {respondidas} respondidas</span>
            )}
          </p>
        </div>
        <button
          onClick={() => {
            if (window.confirm("Finalizar o treino agora?")) setFinalizado(true);
          }}
          className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-red-500/50 hover:text-red-400"
        >
          Finalizar Treino
        </button>
      </div>

      {/* Card da questão */}
      <div className="relative rounded-xl border border-border bg-card p-6 mb-4">
        {/* Favoritar */}
        <button
          type="button"
          onClick={() => handleFavorito(questao.id)}
          aria-label={favoritos.has(questao.id) ? "Remover dos favoritos" : "Favoritar questão"}
          className="absolute top-3 right-3 p-1 text-muted-foreground transition-colors hover:text-amber-400"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill={favoritos.has(questao.id) ? "#fbbf24" : "none"}
            stroke={favoritos.has(questao.id) ? "#fbbf24" : "currentColor"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>

        {/* Meta */}
        <div className="flex flex-wrap gap-2 mb-3 pr-8">
          <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
            {OLIMPIADA_LABEL[questao.olimpiada] ?? questao.olimpiada}
          </span>
          {questao.nivel && (
            <span className="inline-flex items-center rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-bold text-sky-400">
              {NIVEL_LABEL[questao.nivel] ?? questao.nivel}
            </span>
          )}
          {questao.fase != null && (
            <span className="inline-flex items-center rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-bold text-violet-400">
              {faseLabel(questao.olimpiada, questao.fase)}
            </span>
          )}
          <span className="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-0.5 text-[11px] text-muted-foreground">
            {questao.ano}
          </span>
          {((questao as any).topico ?? questao.assunto) && (
            <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-400">
              {(questao as any).topico ?? questao.assunto}
            </span>
          )}
        </div>

        <p className="text-xs text-muted-foreground mb-3">
          Questão {numeracaoSequencial ? idx + 1 : questao.numero}
        </p>

        {/* Enunciado (blocos texto+imagem ou texto plano legado) */}
        <div className="mb-4">
          {Array.isArray((questao as any).enunciado_blocos) ? (
            (
              (questao as any).enunciado_blocos as Array<{
                tipo: string;
                conteudo?: string;
                url?: string;
                largura?: string;
              }>
            ).map((b, i) =>
              b.tipo === "texto" ? (
                <p
                  key={i}
                  className="text-[15px] leading-relaxed text-foreground mb-3 whitespace-pre-wrap"
                >
                  <FormattedText text={b.conteudo ?? ""} />
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
                            } as Record<string, string>
                          )[b.largura],
                        }
                      : { maxWidth: "100%" }
                  }
                />
              ),
            )
          ) : (
            <>
              <p className="text-[15px] leading-relaxed text-foreground mb-4 whitespace-pre-wrap">
                {questao.enunciado}
              </p>
              {questao.imagem_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={questao.imagem_url}
                  alt="Figura da questão"
                  className="max-w-full rounded-lg border border-border"
                />
              )}
            </>
          )}
        </div>

        {/* Input — questão aberta */}
        {questao.tipo === "aberta" && !respondidoAberto && (
          <>
            {estadoAberta && "error" in estadoAberta && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/8 px-4 py-3 text-sm text-amber-400 mb-3">
                {(estadoAberta as { error: string }).error}
              </div>
            )}
            <RespostaAbertaInput
              questaoId={questao.id}
              contexto={contexto}
              aulaId={aulaId}
              action={actionAberta}
              isPending={isPendingAberta}
            />
          </>
        )}

        {/* Alternativas */}
        {questao.tipo === "multipla_escolha" && (
          <div className="space-y-2.5 mb-5">
            {alts.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Carregando alternativas…</p>
            ) : (
              alts.map((alt) => {
                const isPendente = !respondido && altPendente[questao.id] === alt.id;
                const isCorreta = respondido && alt.id === altCorretaId;
                const isErrada = respondido && alt.id === altRespondidaId && !correta;
                const isNeutra = !respondido && !isPendente;
                return (
                  <div
                    key={alt.id}
                    className={`rounded-lg border-2 transition-all ${
                      isNeutra
                        ? "border-border cursor-pointer hover:border-sky-400 hover:bg-sky-400/5"
                        : isPendente
                          ? "border-sky-400 bg-sky-400/8 cursor-pointer"
                          : isCorreta
                            ? "border-emerald-500 bg-emerald-500/8"
                            : isErrada
                              ? "border-red-500 bg-red-500/8"
                              : "border-border opacity-60"
                    }`}
                  >
                    <button
                      type="button"
                      disabled={respondido || isPending}
                      onClick={() => {
                        if (!respondido) {
                          setAltPendente((prev) => ({ ...prev, [questao.id]: alt.id }));
                        }
                      }}
                      className="flex items-start gap-3 w-full p-3 text-left"
                    >
                      <span
                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                          isCorreta
                            ? "border-emerald-500 text-emerald-400"
                            : isErrada
                              ? "border-red-500 text-red-400"
                              : isPendente
                                ? "border-sky-400 text-sky-400"
                                : "border-muted-foreground text-muted-foreground"
                        }`}
                      >
                        {alt.letra}
                      </span>
                      <div className="flex-1">
                        {alt.texto && <p className="text-sm text-foreground">{alt.texto}</p>}
                        {alt.imagem_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={alt.imagem_url}
                            alt={`Alternativa ${alt.letra}`}
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
                                )[(alt as any).imagem_largura ?? "pequena"] ?? "120px",
                              maxWidth: "100%",
                            }}
                          />
                        )}
                      </div>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Feedback — múltipla escolha */}
        {respondido && questao.tipo !== "aberta" && (
          <div
            className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold mb-4 ${correta ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-red-500/30 bg-red-500/10 text-red-400"}`}
          >
            {correta ? "✓ Correto!" : "✗ Resposta incorreta."}
          </div>
        )}

        {/* Feedback — questão aberta */}
        {questao.tipo === "aberta" &&
          respondidoAberto &&
          respostaAbertaAtual &&
          (respostaAbertaAtual.feedback ? (
            <FeedbackAberto feedback={respostaAbertaAtual.feedback} />
          ) : (
            <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground mb-4">
              Resposta registrada. Esta questão não tem avaliação automática — clique em
              &quot;Resolução&quot; abaixo para conferir o gabarito.
            </div>
          ))}

        {/* Gabarito expandido */}
        {respondidoQuestao && mostrarGabarito && (
          <div className="rounded-xl border border-border bg-background overflow-hidden mb-4">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke={TEAL}
                strokeWidth="2"
              >
                <path d="M9 12l2 2 4-4" />
                <circle cx="12" cy="12" r="10" />
              </svg>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: TEAL }}>
                Gabarito
              </span>
              {altCorretaLetra && (
                <span
                  className="ml-2 flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-bold"
                  style={{ borderColor: TEAL, color: TEAL }}
                >
                  {altCorretaLetra}
                </span>
              )}
            </div>
            <div className="p-5 space-y-4">
              {gabarito?.blocos?.length ? (
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Resolução
                  </p>
                  {gabarito.blocos.map((b, i) =>
                    b.tipo === "texto" ? (
                      <p
                        key={i}
                        className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap"
                      >
                        <FormattedText text={b.conteudo} />
                      </p>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={b.url}
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
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Resolução
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {gabarito.texto}
                  </p>
                </div>
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
                <p className="text-sm text-muted-foreground italic">
                  Resolução não disponível para esta questão.
                </p>
              )}
              {questao.video_url && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Resolução em vídeo
                  </p>
                  <a
                    href={questao.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-violet-500/30 bg-violet-500/8 px-4 py-3 hover:bg-violet-500/15 transition-colors"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-500">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                        <polygon points="5,3 19,12 5,21" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Assistir resolução</p>
                      <p className="text-xs text-violet-400">Abre em nova aba</p>
                    </div>
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="flex flex-wrap gap-3">
          {/* Voltar — sempre visível */}
          <button
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={idx === 0}
            className="min-w-[110px] rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Voltar
          </button>

          {/* Avançar / Próxima — sempre visível */}
          <button
            onClick={() => setIdx((i) => i + 1)}
            className={
              respondidoQuestao
                ? "min-w-[110px] rounded-lg px-5 py-2 text-sm font-bold text-[#0f172a]"
                : "min-w-[110px] rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
            }
            style={respondidoQuestao ? { background: TEAL } : {}}
          >
            {respondidoQuestao
              ? idx + 1 < total
                ? "Próxima questão →"
                : "Concluir sessão →"
              : "Avançar →"}
          </button>

          {/* Confirmar — só para múltipla escolha, antes de responder */}
          {questao.tipo === "multipla_escolha" && !respondido && (
            <form action={action}>
              <input type="hidden" name="questao_id" value={questao.id} />
              <input type="hidden" name="alternativa_id" value={altPendente[questao.id] ?? ""} />
              <input type="hidden" name="contexto" value={contexto} />
              {aulaId && <input type="hidden" name="aula_id" value={aulaId} />}
              <button
                type="submit"
                disabled={!altPendente[questao.id] || isPending}
                onClick={() => {
                  const aid = altPendente[questao.id];
                  if (aid) altSelecionadaRef.current[questao.id] = aid;
                }}
                className={`min-w-[110px] rounded-lg px-5 py-2 text-sm font-bold transition-all disabled:opacity-35 disabled:cursor-not-allowed ${
                  altPendente[questao.id]
                    ? "text-[#0f172a]"
                    : "border border-border text-muted-foreground"
                }`}
                style={altPendente[questao.id] ? { background: TEAL } : {}}
              >
                {isPending ? "Confirmando…" : "Confirmar"}
              </button>
            </form>
          )}

          <button
            onClick={handleGabarito}
            disabled={!respondidoQuestao}
            className={`min-w-[110px] rounded-lg border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-35 disabled:cursor-not-allowed ${mostrarGabarito ? "border-sky-400 text-sky-400 bg-sky-400/8" : "border-border text-muted-foreground hover:border-sky-400 hover:text-sky-400"}`}
          >
            {mostrarGabarito ? "Fechar resolução" : "Resolução"}
          </button>
        </div>
      </div>
    </div>
  );
}
