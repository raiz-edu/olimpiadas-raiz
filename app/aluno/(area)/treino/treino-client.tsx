/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useActionState, useEffect } from "react";
import Link from "next/link";
import { responderQuestao, getSolucaoQuestao, getAlternativasQuestao } from "./actions";
import type { Questao, Alternativa } from "@/lib/types/database";

const OLIMPIADA_LABEL: Record<string, string> = { obmep_mirim: "OBMEP Mirim", obmep: "OBMEP" };
const TEAL = "rgb(91,184,193)";

export function TreinoClient({
  questoes,
  primeiraAlt,
}: {
  questoes: Questao[];
  primeiraAlt: Alternativa[];
}) {
  const [idx, setIdx] = useState(0);
  const initialAlts: Record<string, Alternativa[]> = {};
  if (questoes[0]?.id) initialAlts[questoes[0].id] = primeiraAlt;
  const [altsMap, setAltsMap] = useState<Record<string, Alternativa[]>>(initialAlts);
  const [gabarito, setGabarito] = useState<{
    texto: string | null;
    imagem_url: string | null;
  } | null>(null);
  const [mostrarGabarito, setMostrarGabarito] = useState(false);

  const questao = questoes[idx];
  const alts = (questao?.id ? altsMap[questao.id] : undefined) ?? [];
  const total = questoes.length;

  const [estado, action, isPending] = useActionState(responderQuestao, null);
  // Verifica se o estado pertence à questão ATUAL — impede que a resposta da Q anterior
  // desabilite os botões da próxima questão (useActionState persiste entre renders).
  const respondido =
    estado !== null &&
    !("error" in estado) &&
    "questao_id" in estado &&
    estado.questao_id === questao?.id;
  const correta = respondido && "correta" in estado ? estado.correta : null;
  const altCorretaId =
    respondido && "alternativa_correta_id" in estado ? estado.alternativa_correta_id : null;

  // Pré-carrega alternativas da próxima questão
  useEffect(() => {
    const prox = questoes[idx + 1];
    if (prox && !altsMap[prox.id]) {
      getAlternativasQuestao(prox.id).then((a) => setAltsMap((m) => ({ ...m, [prox.id]: a })));
    }
  }, [idx, questoes, altsMap]);

  // Reset gabarito ao trocar questão — usa ref para evitar setState síncrono no effect
  const prevIdx = useState(idx)[0];
  useEffect(() => {
    if (prevIdx !== idx) {
      setGabarito(null);
      setMostrarGabarito(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  async function handleGabarito() {
    if (mostrarGabarito) {
      setMostrarGabarito(false);
      return;
    }
    if (!questao) return;
    if (!gabarito) {
      const s = await getSolucaoQuestao(questao.id);
      setGabarito(s);
    }
    setMostrarGabarito(true);
  }

  if (!questao) return null;

  if (idx >= total) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <p className="text-xl font-bold text-foreground mb-2">Sessão concluída! 🎉</p>
        <p className="text-muted-foreground mb-6">
          Você respondeu todas as {total} questões desta sessão.
        </p>
        <div className="flex justify-center gap-3">
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
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Progresso */}
      <div className="mb-4">
        <div className="h-1.5 rounded-full bg-card overflow-hidden mb-1.5">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${(idx / total) * 100}%`, background: TEAL }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Questão {idx + 1} de {total}
        </p>
      </div>

      {/* Card da questão */}
      <div className="rounded-xl border border-border bg-card p-6 mb-4">
        {/* Meta */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
            {OLIMPIADA_LABEL[questao.olimpiada] ?? questao.olimpiada}
          </span>
          {questao.nivel && (
            <span className="inline-flex items-center rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-bold text-sky-400">
              {{ nivel_1: "Nível 1", nivel_2: "Nível 2", nivel_3: "Nível 3", mirim: "Mirim" }[
                questao.nivel
              ] ?? questao.nivel}
            </span>
          )}
          <span className="inline-flex items-center rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-bold text-violet-400">
            {questao.fase}ª Fase
          </span>
          <span className="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-0.5 text-[11px] text-muted-foreground">
            {questao.ano}
          </span>
          {questao.assunto && (
            <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-400">
              {questao.assunto}
            </span>
          )}
        </div>

        <p className="text-xs text-muted-foreground mb-3">Questão {questao.numero}</p>

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
                  {b.conteudo}
                </p>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={b.url}
                  alt={`Figura ${i + 1}`}
                  className="rounded-lg border border-border mb-3"
                  style={
                    b.largura && b.largura !== "completa"
                      ? {
                          maxWidth: (
                            { pequena: "200px", media: "320px", grande: "480px" } as Record<
                              string,
                              string
                            >
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

        {/* Alternativas */}
        {questao.tipo === "multipla_escolha" && (
          <div className="space-y-2.5 mb-5">
            {alts.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Carregando alternativas…</p>
            ) : (
              alts.map((alt) => {
                const isCorreta = respondido && alt.id === altCorretaId;
                const isErrada =
                  respondido && alt.id === (estado as any)?.alternativa_id && !correta;
                const isNeutra = !respondido;
                return (
                  <div
                    key={alt.id}
                    className={`rounded-lg border-2 transition-all ${isNeutra ? "border-border cursor-pointer hover:border-sky-400 hover:bg-sky-400/5" : isCorreta ? "border-emerald-500 bg-emerald-500/8" : isErrada ? "border-red-500 bg-red-500/8" : "border-border opacity-60"}`}
                  >
                    <form action={action}>
                      <input type="hidden" name="questao_id" value={questao.id} />
                      <input type="hidden" name="alternativa_id" value={alt.id} />
                      <button
                        type="submit"
                        disabled={respondido || isPending}
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
                              alt={`Alternativa ${alt.letra}`}
                              className="mt-2 max-w-xs rounded border border-border"
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
            className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold mb-4 ${correta ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-red-500/30 bg-red-500/10 text-red-400"}`}
          >
            {correta ? "✓ Correto!" : "✗ Resposta incorreta."}
          </div>
        )}

        {/* Gabarito expandido */}
        {respondido && mostrarGabarito && (
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
            </div>
            <div className="p-5 space-y-4">
              {/* Resolução em texto */}
              {gabarito?.texto ? (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Resolução
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {gabarito.texto}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Resolução em texto não disponível para esta questão.
                </p>
              )}
              {gabarito?.imagem_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={gabarito.imagem_url}
                  alt="Resolução"
                  className="max-w-full rounded-lg border border-border"
                />
              )}
              {/* Vídeo */}
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
          <button
            onClick={handleGabarito}
            disabled={!respondido}
            className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-35 disabled:cursor-not-allowed ${mostrarGabarito ? "border-sky-400 text-sky-400 bg-sky-400/8" : "border-border text-muted-foreground hover:border-sky-400 hover:text-sky-400"}`}
          >
            {mostrarGabarito ? "Fechar gabarito" : "Gabarito"}
          </button>

          {/* Voltar — sempre visível, desabilitado apenas na primeira questão */}
          <button
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={idx === 0}
            className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Voltar
          </button>

          {/* Avançar / Próxima questão — sempre visível, muda estilo após responder */}
          <button
            onClick={() => setIdx((i) => i + 1)}
            className={
              respondido
                ? "rounded-lg px-5 py-2 text-sm font-bold text-[#0f172a]"
                : "rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
            }
            style={respondido ? { background: TEAL } : {}}
          >
            {respondido
              ? idx + 1 < total
                ? "Próxima questão →"
                : "Concluir sessão →"
              : "Avançar →"}
          </button>
        </div>
      </div>
    </div>
  );
}
