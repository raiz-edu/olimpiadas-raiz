"use client";

import { useActionState, useState, useTransition } from "react";
import { inputClass, selectClass } from "@/components/ui/form-field";
import { TOPICOS_QUESTOES } from "@/lib/questoes/taxonomia";
import { OLIMPIADA_LABEL } from "@/lib/questoes/olimpiadas";
import { SERIES_ORDEM, SERIE_LABEL } from "@/lib/questoes/series";
import type {
  ExcluirAplicadas,
  MixDificuldade,
  ReceitaConfig,
  SecaoReceita,
} from "@/lib/apostilas/receita";
import { DIFICULDADES_MIX, DIFICULDADE_LABEL, somaMix } from "@/lib/apostilas/receita";
import { contarAcervo, salvarReceita, type ReceitaState } from "./actions";
import type { ContagemSecao, NivelDificuldade, OpcoesAplicacao } from "@/lib/apostilas/queries";
import { Chip, MixEditor, SecaoCard } from "./secao-card";

const CARD = "rounded-xl border border-border bg-card p-6 space-y-4";

/**
 * Pedido e disponibilidade EFETIVA de um nível, espelhando a dobra da skill:
 * quando o mix não cita elementar/muito_difícil, essas questões contam para o
 * vizinho (fácil/difícil).
 */
function celulaBucket(
  sec: SecaoReceita | undefined,
  global: MixDificuldade | undefined,
  raw: ContagemSecao["porDificuldade"],
  b: NivelDificuldade,
): { alvo: number; disponivel: number } | null {
  const mix = sec?.mix_dificuldade ?? global;
  if (!sec?.quantidade || !mix || !(b in mix)) return null;
  const alvo = Math.round((sec.quantidade * (mix[b] ?? 0)) / 100);
  let disponivel = raw[b];
  if (b === "facil" && !("elementar" in mix)) disponivel += raw.elementar;
  if (b === "dificil" && !("muito_dificil" in mix)) disponivel += raw.muito_dificil;
  return { alvo, disponivel };
}

export function ReceitaForm({
  receitaId,
  nomeInicial,
  configInicial,
  opcoes,
}: {
  receitaId?: string;
  nomeInicial?: string;
  configInicial?: ReceitaConfig;
  opcoes: OpcoesAplicacao;
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
  const patchExcluir = (p: Partial<ExcluirAplicadas>) =>
    setConfig((c) => {
      const novo = { ...(c.excluir_aplicadas ?? {}), ...p };
      const limpo = Object.fromEntries(Object.entries(novo).filter(([, v]) => v && v.length));
      return { ...c, excluir_aplicadas: Object.keys(limpo).length ? limpo : undefined };
    });
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
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Identificação
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-foreground">
            Nome interno da receita*
            <input value={nome} onChange={(e) => setNome(e.target.value)} className={inputClass} />
          </label>
          <label className="text-sm text-foreground">
            Título da apostila*
            <input
              value={config.titulo}
              onChange={(e) => patch({ titulo: e.target.value })}
              className={inputClass}
            />
          </label>
          <label className="text-sm text-foreground">
            Subtítulo
            <input
              value={config.subtitulo ?? ""}
              onChange={(e) => patch({ subtitulo: e.target.value || undefined })}
              className={inputClass}
              placeholder="ex.: 8º ano"
            />
          </label>
          <label className="text-sm text-foreground">
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
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Público e origem
        </h2>
        <div>
          <p className="mb-1.5 text-xs text-muted-foreground">Séries</p>
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
          <p className="mb-1.5 text-xs text-muted-foreground">Origens (nenhuma marcada = todas)</p>
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
        <div className="flex flex-wrap gap-4 text-sm text-foreground">
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
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Mix de dificuldade global
        </h2>
        <MixEditor
          mix={config.mix_dificuldade}
          onChange={(mix) => patch({ mix_dificuldade: mix })}
        />
        <p className="text-[11px] text-muted-foreground">
          Vazio = sem mix (dificuldade crescente natural). Seções podem sobrescrever.
        </p>
      </div>

      <div className={CARD}>
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Seções (tópicos e subtópicos)
        </h2>
        <div className="grid gap-3">
          {TOPICOS_QUESTOES.map((t) => (
            <SecaoCard key={t} topico={t} value={secaoDe(t)} onChange={(s) => setSecao(t, s)} />
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Nenhuma seção marcada = apostila inteira do filtro.
        </p>
      </div>

      <div className={CARD}>
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Estilo</h2>
        <div className="flex flex-wrap gap-4 text-sm text-foreground">
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
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Não repetir questões já aplicadas
        </h2>
        <p className="text-[11px] text-muted-foreground">
          Questões que os alvos abaixo já receberam (aplicações registradas no histórico) ficam FORA
          desta apostila. O Conferir acervo já desconta.
        </p>
        <div>
          <p className="mb-1.5 text-xs text-muted-foreground">Marcas</p>
          <div className="flex flex-wrap gap-1.5">
            {opcoes.marcas.map((m) => {
              const marcado = config.excluir_aplicadas?.marcas?.includes(m.id) ?? false;
              return (
                <Chip
                  key={m.id}
                  ativo={marcado}
                  onClick={() => {
                    const atual = new Set(config.excluir_aplicadas?.marcas ?? []);
                    if (marcado) atual.delete(m.id);
                    else atual.add(m.id);
                    patchExcluir({ marcas: [...atual] });
                  }}
                >
                  {m.nome}
                </Chip>
              );
            })}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs text-muted-foreground">
            Unidades (Ctrl+clique para várias)
            <select
              multiple
              size={5}
              value={config.excluir_aplicadas?.unidades ?? []}
              onChange={(e) =>
                patchExcluir({
                  unidades: [...e.target.selectedOptions].map((o) => o.value),
                })
              }
              className={`${selectClass} mt-1 h-auto`}
            >
              {opcoes.unidades.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.rotulo}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">
            Turmas (Ctrl+clique para várias)
            <select
              multiple
              size={5}
              value={config.excluir_aplicadas?.turmas ?? []}
              onChange={(e) =>
                patchExcluir({
                  turmas: [...e.target.selectedOptions].map((o) => o.value),
                })
              }
              className={`${selectClass} mt-1 h-auto`}
            >
              {opcoes.turmas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.rotulo}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className={CARD}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
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
            <table className="w-full min-w-[720px] text-sm text-foreground">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="py-1.5">Seção</th>
                  {DIFICULDADES_MIX.map((b) => (
                    <th key={b}>{DIFICULDADE_LABEL[b]}</th>
                  ))}
                  <th>Sem classif.</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {contagem.map((c) => {
                  const sec = config.secoes?.find((s) => (s.nome || s.topico) === c.secao);
                  return (
                    <tr key={c.secao} className="border-t border-border/60">
                      <td className="py-1.5 font-medium text-foreground">{c.secao}</td>
                      {DIFICULDADES_MIX.map((b) => {
                        const cel = celulaBucket(sec, config.mix_dificuldade, c.porDificuldade, b);
                        const deficit = cel !== null && cel.alvo > cel.disponivel;
                        return (
                          <td key={b} className={deficit ? "font-semibold text-red-400" : ""}>
                            {c.porDificuldade[b]}
                            {cel !== null && ` / ${cel.alvo} pedidas`}
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
            <p className="mt-1 text-[11px] text-muted-foreground">
              Vermelho = pedido maior que o acervo (a skill completa da dificuldade vizinha e
              reporta no balanço). Quando o mix não cita Elementar/Muito difícil, essas questões
              contam para Fácil/Difícil.
            </p>
          </div>
        )}
      </div>

      {state && "error" in state && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {state.error}
        </p>
      )}
      {config.mix_dificuldade && somaMix(config.mix_dificuldade) !== 100 && (
        <p className="text-sm text-red-400">Mix global precisa somar 100% para salvar.</p>
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
