"use client";

import { useState, useRef, useTransition } from "react";
import { uploadQuestaoImagem } from "./actions";
import { inputClass } from "@/components/ui/form-field";

export type BlocoLargura = "pequena" | "media" | "grande" | "completa";
export type BlocoEnunciado =
  | { tipo: "texto"; conteudo: string }
  | { tipo: "imagem"; url: string; largura?: BlocoLargura };

export function imgStyle(largura?: BlocoLargura): React.CSSProperties {
  const map: Record<string, string> = { pequena: "200px", media: "320px", grande: "480px" };
  return largura && map[largura] ? { maxWidth: map[largura] } : {};
}

export function EnunciadoBlocosEditor({
  initialBlocos,
  initialEnunciado,
}: {
  initialBlocos?: BlocoEnunciado[] | null;
  initialEnunciado?: string;
}) {
  const initial: BlocoEnunciado[] = initialBlocos?.length
    ? initialBlocos
    : initialEnunciado
      ? [{ tipo: "texto", conteudo: initialEnunciado }]
      : [{ tipo: "texto", conteudo: "" }];

  const [blocos, setBlocos] = useState<BlocoEnunciado[]>(initial);
  const [isPending, startTransition] = useTransition();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const update = (i: number, bloco: BlocoEnunciado) =>
    setBlocos((prev) => prev.map((b, j) => (j === i ? bloco : b)));

  const remove = (i: number) => setBlocos((prev) => prev.filter((_, j) => j !== i));

  const swap = (i: number, delta: -1 | 1) =>
    setBlocos((prev) => {
      const j = i + delta;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      const temp = next[i]!;
      next[i] = next[j]!;
      next[j] = temp;
      return next;
    });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    const fd = new FormData();
    fd.append("file", file);
    startTransition(async () => {
      const result = await uploadQuestaoImagem(fd);
      if ("url" in result) {
        setBlocos((prev) => [...prev, { tipo: "imagem", url: result.url }]);
      } else {
        setUploadError(result.error);
      }
    });
    e.target.value = "";
  };

  const textoPlano = blocos
    .filter((b): b is { tipo: "texto"; conteudo: string } => b.tipo === "texto")
    .map((b) => b.conteudo)
    .join("\n\n");

  return (
    <div className="space-y-3">
      <div className="space-y-3">
        {blocos.map((bloco, i) => (
          <div key={i} className="group relative rounded-lg border border-border bg-background p-3">
            {/* Controles hover */}
            <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={() => swap(i, -1)}
                disabled={i === 0}
                title="Mover para cima"
                className="rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-20"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => swap(i, 1)}
                disabled={i === blocos.length - 1}
                title="Mover para baixo"
                className="rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-20"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => remove(i)}
                title="Remover bloco"
                className="rounded px-1.5 py-0.5 text-xs text-red-400 hover:text-red-300"
              >
                ✕
              </button>
            </div>

            {bloco.tipo === "texto" ? (
              <>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Texto
                </p>
                <textarea
                  value={bloco.conteudo}
                  onChange={(e) => update(i, { tipo: "texto", conteudo: e.target.value })}
                  rows={4}
                  placeholder="Digite o texto do enunciado…"
                  className={inputClass + " pr-16"}
                />
              </>
            ) : (
              <>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Imagem
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={bloco.url}
                  alt={`Bloco ${i + 1}`}
                  className="rounded border border-border object-contain"
                  style={{ maxHeight: "16rem", ...imgStyle(bloco.largura) }}
                />
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">Largura:</span>
                  <select
                    value={bloco.largura ?? "completa"}
                    onChange={(e) =>
                      update(i, { ...bloco, largura: e.target.value as BlocoLargura })
                    }
                    className="rounded border border-border bg-background px-2 py-0.5 text-xs text-foreground"
                  >
                    <option value="pequena">Pequena (~200px)</option>
                    <option value="media">Média (~320px)</option>
                    <option value="grande">Grande (~480px)</option>
                    <option value="completa">Completa</option>
                  </select>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {isPending && <p className="text-xs text-muted-foreground">Enviando imagem…</p>}
      {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setBlocos((prev) => [...prev, { tipo: "texto", conteudo: "" }])}
          className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          + Bloco de texto
        </button>
        <label
          className={`cursor-pointer rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors ${
            isPending ? "pointer-events-none opacity-50" : "hover:text-foreground"
          }`}
        >
          + Imagem
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
        </label>
      </div>

      {/* Hidden inputs para submissão do form */}
      <input type="hidden" name="enunciado_blocos" value={JSON.stringify(blocos)} />
      <input type="hidden" name="enunciado" value={textoPlano} />
    </div>
  );
}
