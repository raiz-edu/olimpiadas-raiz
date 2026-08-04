"use client";

import { useActionState, useState, useTransition } from "react";
import { inputClass, selectClass } from "@/components/ui/form-field";
import { TOPICOS_QUESTOES } from "@/lib/questoes/taxonomia";
import { OLIMPIADA_LABEL } from "@/lib/questoes/olimpiadas";
import { SERIES_ORDEM, SERIE_LABEL } from "@/lib/questoes/series";
import type { ReceitaConfig, SecaoReceita } from "@/lib/apostilas/receita";
import { somaMix } from "@/lib/apostilas/receita";
import { contarAcervo, salvarReceita, type ReceitaState } from "./actions";
import type { ContagemSecao } from "@/lib/apostilas/queries";
import { Chip, MixEditor, SecaoCard } from "./secao-card";

const CARD = "rounded-xl border border-gray-200 bg-white p-6 space-y-4";

function alvoBucket(sec: SecaoReceita, global: ReceitaConfig["mix_dificuldade"], b: string) {
  const mix = sec.mix_dificuldade ?? global;
  if (!sec.quantidade || !mix) return null;
  const pct = (mix as Record<string, number | undefined>)[b] ?? 0;
  return Math.round((sec.quantidade * pct) / 100);
}

export function ReceitaForm({
  receitaId,
  nomeInicial,
  configInicial,
}: {
  receitaId?: string;
  nomeInicial?: string;
  configInicial?: ReceitaConfig;
}) {
  const [nome, setNome] = useState(nomeInicial ?? "");
  const [config, setConfig] = useState<ReceitaConfig>(
    configInicial ?? { titulo: "", seed: 1, compacto: true },
  );
  const [contagem, setContagem] = useState<ContagemSecao[] | null>(null);
  const [contando, startContagem] = useTransition();
  const [state, formAction, isPending] = useActionState<ReceitaState, FormData>(
    salvarReceita,
    null,
  );

  const patch = (p: Partial<ReceitaConfig>) => setConfig((c) => ({ ...c, ...p }));
  const secaoDe = (topico: string) => config.secoes?.find((s) => s.topico === topico) ?? null;
  const setSecao = (topico: string, sec: SecaoReceita | null) =>
    setConfig((c) => {
      const outras = (c.secoes ?? []).filter((s) => s.topico !== topico);
      const secoes = sec
        ? [...outras, sec].sort(
            (a, b) => TOPICOS_QUESTOES.indexOf(a.topico) - TOPICOS_QUESTOES.indexOf(b.topico),
          )
        : outras;
      return { ...c, secoes: secoes.length ? secoes : undefined };
    });

  const toggleLista = (chave: "series" | "origens", valor: string) =>
    setConfig((c) => {
      const atual = new Set(c[chave] ?? []);
      if (atual.has(valor)) atual.delete(valor);
      else atual.add(valor);
      const lista = [...atual];
      return { ...c, [chave]: lista.length ? lista : undefined };
    });

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="id" value={receitaId ?? ""} />
      <input type="hidden" name="nome" value={nome} />
      <input type="hidden" name="config" value={JSON.stringify(config)} />

      <div className={CARD}>
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">Identificação</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            Nome interno da receita*
            <input value={nome} onChange={(e) => setNome(e.target.value)} className={inputClass} />
          </label>
          <label className="text-sm">
            Título da apostila*
            <input
              value={config.titulo}
              onChange={(e) => patch({ titulo: e.target.value })}
              className={inputClass}
            />
          </label>
          <label className="text-sm">
            Subtítulo
            <input
              value={config.subtitulo ?? ""}
              onChange={(e) => patch({ subtitulo: e.target.value || undefined })}
              className={inputClass}
              placeholder="ex.: 8º ano"
            />
          </label>
          <label className="text-sm">
            Marca (rede/escola na capa)
            <input
              value={config.marca ?? ""}
              onChange={(e) => patch({ marca: e.target.value || undefined })}
              className={inputClass}
              placeholder="ex.: Colégio QI"
            />
          </label>
        </div>
      </div>

      <div className={CARD}>
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">
          Público e origem
        </h2>
        <div>
          <p className="mb-1.5 text-xs text-gray-500">Séries</p>
          <div className="flex flex-wrap gap-1.5">
            {SERIES_ORDEM.map((s) => (
              <Chip
                key={s}
                ativo={config.series?.includes(s) ?? false}
                onClick={() => toggleLista("series", s)}
              >
                {SERIE_LABEL[s]}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-xs text-gray-500">Origens (nenhuma marcada = todas)</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(OLIMPIADA_LABEL).map(([valor, rotulo]) => (
              <Chip
                key={valor}
                ativo={config.origens?.includes(valor) ?? false}
                onClick={() => toggleLista("origens", valor)}
              >
                {rotulo}
              </Chip>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <label>
            Ano mínimo
            <input
              type="number"
              value={config.anos?.min ?? ""}
              onChange={(e) =>
                patch({
                  anos: {
                    ...config.anos,
                    min: e.target.value === "" ? undefined : Number(e.target.value),
                  },
                })
              }
              className={`${inputClass} w-28`}
            />
          </label>
          <label>
            Ano máximo
            <input
              type="number"
              value={config.anos?.max ?? ""}
              onChange={(e) =>
                patch({
                  anos: {
                    ...config.anos,
                    max: e.target.value === "" ? undefined : Number(e.target.value),
                  },
                })
              }
              className={`${inputClass} w-28`}
            />
          </label>
          <label>
            Seed
            <input
              type="number"
              value={config.seed ?? 1}
              onChange={(e) => patch({ seed: Number(e.target.value) || 1 })}
              className={`${inputClass} w-24`}
            />
          </label>
        </div>
      </div>

      <div className={CARD}>
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">
          Mix de dificuldade global
        </h2>
        <MixEditor
          mix={config.mix_dificuldade}
          onChange={(mix) => patch({ mix_dificuldade: mix })}
        />
        <p className="text-[11px] text-gray-400">
          Vazio = sem mix (dificuldade crescente natural). Seções podem sobrescrever.
        </p>
      </div>

      <div className={CARD}>
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">
          Seções (tópicos e subtópicos)
        </h2>
        <div className="grid gap-3">
          {TOPICOS_QUESTOES.map((t) => (
            <SecaoCard key={t} topico={t} value={secaoDe(t)} onChange={(s) => setSecao(t, s)} />
          ))}
        </div>
        <p className="text-[11px] text-gray-400">
          Nenhuma seção marcada = apostila inteira do filtro.
        </p>
      </div>

      <div className={CARD}>
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">Estilo</h2>
        <div className="flex flex-wrap gap-4 text-sm">
          <label>
            Colunas
            <select
              value={config.estilo?.colunas ?? 1}
              onChange={(e) =>
                patch({ estilo: { ...config.estilo, colunas: Number(e.target.value) as 1 | 2 } })
              }
              className={selectClass}
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
            </select>
          </label>
          <label>
            Escala das figuras
            <input
              type="number"
              step={0.05}
              min={0.3}
              max={2}
              value={config.estilo?.escala_figuras ?? 1}
              onChange={(e) =>
                patch({ estilo: { ...config.estilo, escala_figuras: Number(e.target.value) || 1 } })
              }
              className={`${inputClass} w-24`}
            />
          </label>
          <label>
            Fonte
            <select
              value={config.estilo?.fonte ?? "sans"}
              onChange={(e) => patch({ estilo: { ...config.estilo, fonte: e.target.value } })}
              className={selectClass}
            >
              <option value="sans">Sem serifa</option>
              <option value="serif">Com serifa</option>
            </select>
          </label>
          <label>
            Tamanho (pt)
            <input
              type="number"
              step={0.5}
              value={config.estilo?.tamanho_fonte ?? 10.5}
              onChange={(e) =>
                patch({
                  estilo: { ...config.estilo, tamanho_fonte: Number(e.target.value) || 10.5 },
                })
              }
              className={`${inputClass} w-24`}
            />
          </label>
          <label>
            Espaçamento
            <input
              type="number"
              step={0.1}
              value={config.estilo?.espacamento ?? 1.5}
              onChange={(e) =>
                patch({ estilo: { ...config.estilo, espacamento: Number(e.target.value) || 1.5 } })
              }
              className={`${inputClass} w-24`}
            />
          </label>
        </div>
      </div>

      <div className={CARD}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">
            Acervo disponível
          </h2>
          <button
            type="button"
            disabled={contando}
            onClick={() => startContagem(async () => setContagem(await contarAcervo(config)))}
            className="rounded-lg border border-primary px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/5 disabled:opacity-50"
          >
            {contando ? "Conferindo..." : "Conferir acervo"}
          </button>
        </div>
        {contagem && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500">
                  <th className="py-1.5">Seção</th>
                  <th>Fácil</th>
                  <th>Médio</th>
                  <th>Difícil</th>
                  <th>Sem classif.</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {contagem.map((c) => {
                  const sec = config.secoes?.find((s) => (s.nome || s.topico) === c.secao);
                  return (
                    <tr key={c.secao} className="border-t border-gray-100">
                      <td className="py-1.5 font-medium">{c.secao}</td>
                      {(["facil", "medio", "dificil"] as const).map((b) => {
                        const alvo = sec ? alvoBucket(sec, config.mix_dificuldade, b) : null;
                        const deficit = alvo !== null && alvo > c.porDificuldade[b];
                        return (
                          <td key={b} className={deficit ? "font-semibold text-red-600" : ""}>
                            {c.porDificuldade[b]}
                            {alvo !== null && ` / ${alvo} pedidas`}
                          </td>
                        );
                      })}
                      <td>{c.porDificuldade.sem}</td>
                      <td className="font-semibold">{c.total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-1 text-[11px] text-gray-400">
              Vermelho = pedido maior que o acervo (a skill completa da dificuldade vizinha e
              reporta no balanço).
            </p>
          </div>
        )}
      </div>

      {state && "error" in state && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {config.mix_dificuldade && somaMix(config.mix_dificuldade) !== 100 && (
        <p className="text-sm text-red-600">Mix global precisa somar 100% para salvar.</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? "Salvando..." : receitaId ? "Salvar alterações" : "Criar receita"}
      </button>
    </form>
  );
}
