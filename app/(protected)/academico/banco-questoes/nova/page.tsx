"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { criarQuestao, buscarQuestoesSimilares, uploadSolucaoImagem } from "../actions";
import { inputClass, selectClass } from "@/components/ui/form-field";
import { TopicoSubtopicoSelect } from "@/components/academico/topico-subtopico-select";
import { EnunciadoBlocosEditor } from "../enunciado-blocos-editor";

type SimilaresResult = Awaited<ReturnType<typeof buscarQuestoesSimilares>>;

const DIFICULDADE_OPTIONS = [
  { value: "elementar", label: "Elementar" },
  { value: "facil", label: "Fácil" },
  { value: "medio", label: "Médio" },
  { value: "dificil", label: "Difícil" },
  { value: "muito_dificil", label: "Muito Difícil" },
];

const PUBLICO_OPTIONS = [
  { value: "EFAI", label: "EFAI" },
  { value: "EFAF", label: "EFAF" },
  { value: "EM", label: "EM" },
  { value: "Todos", label: "Todos" },
];

const RESOLUCAO_STATUS = [
  { value: "nao", label: "Não" },
  { value: "em_producao", label: "Em produção" },
  { value: "sim", label: "Sim" },
];

function RadioGroup({
  name,
  label,
  defaultValue = "nao",
}: {
  name: string;
  label: string;
  defaultValue?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-foreground">{label}</label>
      <div className="flex gap-3">
        {RESOLUCAO_STATUS.map((opt) => (
          <label
            key={opt.value}
            className="flex items-center gap-1.5 cursor-pointer text-sm text-muted-foreground hover:text-foreground"
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              defaultChecked={opt.value === defaultValue}
              className="accent-primary"
            />
            {opt.label}
          </label>
        ))}
      </div>
    </div>
  );
}

export default function NovaBancoQuestaoPage() {
  const [state, action, isPending] = useActionState(criarQuestao, null);
  const [similares, setSimilares] = useState<SimilaresResult | null>(null);
  const [isChecking, startCheck] = useTransition();
  const confirmedRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (confirmedRef.current) return;

    const enunciado =
      (
        e.currentTarget.querySelector('[name="enunciado"]') as HTMLInputElement | null
      )?.value?.trim() ?? "";
    if (enunciado.length < 15) return;

    e.preventDefault();
    startCheck(async () => {
      const result = await buscarQuestoesSimilares(enunciado);
      if (result.count === 0) {
        confirmedRef.current = true;
        formRef.current?.requestSubmit();
      } else {
        setSimilares(result);
      }
    });
  };

  const handleConfirmar = () => {
    setSimilares(null);
    confirmedRef.current = true;
    formRef.current?.requestSubmit();
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/academico/banco-questoes" className="hover:text-foreground">
          Banco de Questões
        </Link>
        <span>/</span>
        <span className="text-foreground">Nova Questão</span>
      </div>

      <h1 className="mb-6 text-xl font-bold text-foreground">Nova Questão</h1>

      {state && "error" in state && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {/* Alerta de similaridade */}
      {similares && similares.count > 0 && (
        <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 space-y-3">
          <p className="text-sm font-semibold text-amber-400">
            Encontramos {similares.count} questão{similares.count > 1 ? "ões" : ""} similar
            {similares.count > 1 ? "es" : ""}. Verifique antes de continuar.
          </p>
          <ul className="space-y-1.5">
            {similares.similares.map((q) => (
              <li key={q.id}>
                <a
                  href={`/academico/banco-questoes/${q.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  {q.olimpiada} · {q.ano} — {q.enunciado.slice(0, 90)}
                  {q.enunciado.length > 90 ? "…" : ""}
                </a>
              </li>
            ))}
          </ul>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleConfirmar}
              className="rounded-lg bg-amber-500/20 border border-amber-500/40 px-4 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/30 transition-colors"
            >
              Criar mesmo assim
            </button>
            <button
              type="button"
              onClick={() => setSimilares(null)}
              className="rounded-lg border border-border px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {isChecking && (
        <div className="mb-4 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          Verificando questões similares…
        </div>
      )}

      <form
        ref={formRef}
        action={action}
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border border-border bg-card p-6"
      >
        {/* datalists de sugestões */}
        <datalist id="dl-olimpiada">
          <option value="obmep" />
          <option value="obmep_mirim" />
          <option value="canguru" />
          <option value="obm" />
          <option value="obf" />
          <option value="obi" />
          <option value="obq" />
          <option value="onhb" />
          <option value="oba" />
          <option value="obr" />
        </datalist>
        <datalist id="dl-nivel">
          <option value="nivel_1" />
          <option value="nivel_2" />
          <option value="nivel_3" />
          <option value="mirim" />
          <option value="junior" />
          <option value="senior" />
          <option value="P" label="Canguru P (3º-4º ano)" />
          <option value="E" label="Canguru E (5º-6º ano)" />
          <option value="B" label="Canguru B (7º-8º ano)" />
          <option value="C" label="Canguru C (9º ano)" />
          <option value="J" label="Canguru J (1ª-2ª série EM)" />
          <option value="S" label="Canguru S (3ª série EM)" />
        </datalist>

        {/* Linha 1: Origem + Nível/Categoria */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Origem da questão</label>
            <input
              name="olimpiada"
              type="text"
              list="dl-olimpiada"
              placeholder="ex: obmep, obm, obf…"
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Nível/Categoria</label>
            <input
              name="nivel"
              type="text"
              list="dl-nivel"
              placeholder="ex: nivel_1, nivel_2, mirim…"
              className={inputClass}
            />
          </div>
        </div>

        {/* Linha 2: Fase · Ano · Número */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Fase</label>
            <input name="fase" type="number" placeholder="opcional" className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Ano</label>
            <input
              name="ano"
              type="number"
              min={2000}
              max={2100}
              placeholder="2024"
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Número</label>
            <input name="numero" type="number" placeholder="opcional" className={inputClass} />
          </div>
        </div>

        {/* Linha 3: Tipo + Público-alvo */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Tipo</label>
            <select name="tipo" className={selectClass}>
              <option value="multipla_escolha">Múltipla escolha</option>
              <option value="aberta">Aberta (dissertativa)</option>
              <option value="verdadeiro_ou_falso">Verdadeiro ou Falso</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Público-alvo</label>
            <select name="publico_alvo" className={selectClass}>
              <option value="">Selecione…</option>
              {PUBLICO_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Linha 4: Tópico + Subtópico (taxonomia canônica) */}
        <TopicoSubtopicoSelect />

        {/* Dificuldade */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">Dificuldade</label>
          <select name="dificuldade" className={selectClass}>
            <option value="">Selecione…</option>
            {DIFICULDADE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Enunciado */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">Enunciado</label>
          <p className="text-xs text-muted-foreground mb-2">
            Use blocos de texto e imagem — arranje na ordem que quiser (texto · imagem · texto…).
          </p>
          <EnunciadoBlocosEditor />
        </div>

        {/* Resolução — flags de status + conteúdo */}
        <div className="rounded-lg border border-border/60 bg-background/40 p-4 space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Resolução
          </p>

          <div className="space-y-2">
            <RadioGroup name="tem_resolucao_video" label="Tem resolução em vídeo?" />
            <input
              name="video_url"
              type="url"
              placeholder="URL do vídeo (YouTube, Google Drive…)"
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <RadioGroup name="tem_resolucao_texto" label="Tem resolução em texto/imagem?" />
            <EnunciadoBlocosEditor
              fieldNameBlocos="solucao_blocos"
              fieldNameTexto="solucao_texto"
              placeholder="Digite o texto da resolução…"
              uploadFn={uploadSolucaoImagem}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isPending || isChecking}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {isPending ? "Salvando…" : isChecking ? "Verificando…" : "Criar questão"}
          </button>
          <Link
            href="/academico/banco-questoes"
            className="rounded-lg border border-border px-5 py-2.5 text-sm text-muted-foreground hover:text-foreground"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
