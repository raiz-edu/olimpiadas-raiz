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
  buscarQuestoes,
} from "../actions";
import { SimuladoForm } from "../simulado-form";
import { inputClass } from "@/components/ui/form-field";

type Simulado = Awaited<ReturnType<typeof getSimuladoDetalhe>>;
type Projeto = { id: string; nome: string; olimpiada_sigla: string; ano_letivo: number };
type Turma = {
  id: string;
  nome: string;
  serie: string;
  ano_letivo: number;
  unidade_nome: string;
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
};

function fmtSegundos(s: number | null) {
  if (!s) return "";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((v) => String(v).padStart(2, "0")).join(":");
}

export default function EditarSimuladoPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null);
  const [simulado, setSimulado] = useState<Simulado | null>(null);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<Questao[]>([]);
  const [buscando, startBusca] = useTransition();
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
        <div className="flex gap-2">
          {simulado.publicada ? (
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
        }}
        submitLabel="Salvar alterações"
        cancelHref="/academico/simulados"
        error={error}
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
              return (
                <div
                  key={aq.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {q.olimpiada?.toUpperCase()} {q.fase != null ? `· ${q.fase}ª Fase` : ""} ·{" "}
                      {q.ano} {q.numero != null ? `· Q${q.numero}` : ""}
                      {q.topico ? ` · ${q.topico}` : ""}
                    </p>
                    <p className="text-sm text-foreground truncate">{q.enunciado}</p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await desvincularQuestao(id, q.id);
                      setSimulado({
                        ...simulado,
                        questoes: simulado.questoes.filter((x: any) => x.questao_id !== q.id),
                      });
                    }}
                    className="shrink-0 text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    Remover
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Busca para adicionar */}
        <div className="space-y-2 border-t border-border pt-4">
          <p className="text-xs font-medium text-muted-foreground">Adicionar questão do banco</p>
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
                      <p className="text-xs text-muted-foreground">
                        {q.olimpiada?.toUpperCase()} {q.fase != null ? `· ${q.fase}ª Fase` : ""} ·{" "}
                        {q.ano}
                        {q.numero != null ? ` · Q${q.numero}` : ""}
                      </p>
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
      </div>
    </div>
  );
}
