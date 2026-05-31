"use client";

import { useActionState, useState, useTransition, useRef } from "react";
import { salvarAlternativa, uploadAlternativaImagem } from "../actions";
import { inputClass } from "@/components/ui/form-field";
import type { Alternativa } from "@/lib/types/database";

const LETRAS = ["A", "B", "C", "D", "E"];

export function AlternativasEditor({
  questaoId,
  alternativas,
  stats,
}: {
  questaoId: string;
  alternativas: Alternativa[];
  stats: { correta: boolean; alternativa_id: string | null }[];
}) {
  const altMap = Object.fromEntries(alternativas.map((a) => [a.letra, a]));

  return (
    <div className="space-y-4">
      {LETRAS.map((letra) => {
        const alt = altMap[letra];
        const count = stats.filter((s) => s.alternativa_id === alt?.id).length;
        return (
          <AlternativaRow
            key={letra}
            letra={letra}
            questaoId={questaoId}
            alternativa={alt}
            count={count}
            totalStats={stats.length}
          />
        );
      })}
    </div>
  );
}

function AlternativaRow({
  letra,
  questaoId,
  alternativa,
  count,
  totalStats,
}: {
  letra: string;
  questaoId: string;
  alternativa?: Alternativa;
  count: number;
  totalStats: number;
}) {
  const [, action, isPending] = useActionState(salvarAlternativa, null);
  const [imagemUrl, setImagemUrl] = useState<string | null>(alternativa?.imagem_url ?? null);
  const [isUploading, startUploadTransition] = useTransition();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    const fd = new FormData();
    fd.append("file", file);
    startUploadTransition(async () => {
      const result = await uploadAlternativaImagem(fd);
      if ("url" in result) {
        setImagemUrl(result.url);
      } else {
        setUploadError(result.error);
      }
    });
    e.target.value = "";
  };

  return (
    <div className="rounded-lg border border-border bg-background p-3 space-y-3">
      <form action={action} className="space-y-3">
        <input type="hidden" name="questao_id" value={questaoId} />
        <input type="hidden" name="letra" value={letra} />
        <input type="hidden" name="imagem_url" value={imagemUrl ?? ""} />

        {/* Linha principal: círculo + texto + correta + salvar + stats */}
        <div className="flex items-start gap-3">
          <div
            className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${
              alternativa?.correta
                ? "border-emerald-500 bg-emerald-500/15 text-emerald-400"
                : "border-border text-muted-foreground"
            }`}
          >
            {letra}
          </div>

          <input
            name="texto"
            defaultValue={alternativa?.texto ?? ""}
            placeholder={`Texto da alternativa ${letra}`}
            className={`${inputClass} flex-1`}
          />

          <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-xs text-muted-foreground mt-2">
            <input
              type="checkbox"
              name="correta"
              value="true"
              defaultChecked={alternativa?.correta ?? false}
              className="h-4 w-4 rounded"
            />
            Correta
          </label>

          <button
            type="submit"
            disabled={isPending}
            className="mt-1 shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-40"
          >
            {isPending ? "…" : "Salvar"}
          </button>

          {totalStats > 0 && (
            <span className="mt-2 w-8 shrink-0 text-center text-xs text-muted-foreground">
              {count}×
            </span>
          )}
        </div>

        {/* Imagem da alternativa */}
        <div className="ml-11 space-y-2">
          {imagemUrl && (
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagemUrl}
                alt={`Alternativa ${letra}`}
                className="max-h-32 rounded border border-border object-contain"
                style={{ maxWidth: "320px" }}
              />
              <button
                type="button"
                onClick={() => setImagemUrl(null)}
                className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border border-red-500/50 bg-card text-[10px] text-red-400 hover:text-red-300"
                title="Remover imagem"
              >
                ✕
              </button>
            </div>
          )}

          {isUploading && <p className="text-xs text-muted-foreground">Enviando imagem…</p>}
          {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}

          <label
            className={`inline-flex cursor-pointer rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors ${
              isUploading ? "pointer-events-none opacity-50" : "hover:text-foreground"
            }`}
          >
            {imagemUrl ? "Trocar imagem" : "+ Imagem"}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
          </label>
        </div>
      </form>
    </div>
  );
}
