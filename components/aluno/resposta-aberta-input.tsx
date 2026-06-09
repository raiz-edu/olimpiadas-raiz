"use client";

import { useState, useRef } from "react";
import type { FeedbackIA, ItemAvaliacao } from "@/lib/ai/types";

const TEAL = "rgb(91,184,193)";

const STATUS_CONFIG: Record<
  ItemAvaliacao["status"],
  { border: string; bg: string; text: string; label: string }
> = {
  correto: {
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/8",
    text: "text-emerald-400",
    label: "✓ Correto",
  },
  parcial: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/8",
    text: "text-amber-400",
    label: "◑ Parcial",
  },
  incorreto: {
    border: "border-red-500/30",
    bg: "bg-red-500/8",
    text: "text-red-400",
    label: "✗ Incorreto",
  },
  nao_respondido: {
    border: "border-border",
    bg: "bg-card",
    text: "text-muted-foreground",
    label: "— Não respondido",
  },
};

interface InputProps {
  questaoId: string;
  contexto: string;
  aulaId?: string;
  action: (payload: FormData) => void;
  isPending: boolean;
}

export function RespostaAbertaInput({
  questaoId,
  contexto,
  aulaId,
  action,
  isPending,
}: InputProps) {
  const [tab, setTab] = useState<"texto" | "foto">("texto");
  const [texto, setTexto] = useState("");
  const [ocrStatus, setOcrStatus] = useState<"idle" | "processing" | "done" | "error">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function processarFoto(file: File) {
    setOcrStatus("processing");
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker(["por", "eng"]);
      const { data } = await worker.recognize(file);
      await worker.terminate();
      setTexto(data.text.trim());
      setOcrStatus("done");
      setTab("texto");
    } catch {
      setOcrStatus("error");
    }
  }

  return (
    <div className="space-y-3 mb-5">
      {/* Tabs */}
      <div className="flex gap-2">
        {(["texto", "foto"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              tab === t
                ? "text-[#0f172a]"
                : "border border-border text-muted-foreground hover:text-foreground"
            }`}
            style={tab === t ? { background: TEAL } : {}}
          >
            {t === "texto" ? "✏ Digitar" : "📷 Foto"}
          </button>
        ))}
      </div>

      {/* Foto */}
      {tab === "foto" && (
        <div className="rounded-xl border border-dashed border-border p-5 text-center space-y-3">
          {ocrStatus === "idle" && (
            <>
              <p className="text-sm text-muted-foreground">
                Tire uma foto da sua resolução escrita no papel.
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Selecionar imagem
              </button>
            </>
          )}
          {ocrStatus === "processing" && (
            <p className="text-sm text-muted-foreground animate-pulse">Lendo sua resposta…</p>
          )}
          {ocrStatus === "done" && (
            <p className="text-sm text-emerald-400">
              ✓ Leitura concluída. Revise o texto na aba Digitar.
            </p>
          )}
          {ocrStatus === "error" && (
            <p className="text-sm text-amber-400">
              Não foi possível ler a imagem. Digite sua resposta manualmente.
            </p>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) processarFoto(file);
            }}
          />
          <p className="text-xs text-muted-foreground/40">
            A imagem é processada localmente — nunca é enviada nem armazenada.
          </p>
        </div>
      )}

      {/* Textarea + form */}
      {tab === "texto" && (
        <form action={action}>
          <input type="hidden" name="questao_id" value={questaoId} />
          <input type="hidden" name="contexto" value={contexto} />
          {aulaId && <input type="hidden" name="aula_id" value={aulaId} />}
          <input type="hidden" name="resposta_texto" value={texto} />

          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={
              ocrStatus === "done"
                ? "Texto extraído da foto — revise antes de enviar."
                : "Escreva sua solução aqui (itens a, b, c…)"
            }
            rows={7}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[rgb(91,184,193)] resize-none mb-3"
          />

          {ocrStatus === "done" && (
            <p className="text-xs text-amber-400/80 mb-3">
              A leitura automática pode ter erros — revise antes de enviar.
            </p>
          )}

          <button
            type="submit"
            disabled={isPending || !texto.trim()}
            className="rounded-lg px-5 py-2.5 text-sm font-bold text-[#0f172a] disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            style={{ background: TEAL }}
          >
            {isPending ? "Avaliando…" : "Enviar resposta"}
          </button>
        </form>
      )}
    </div>
  );
}

export function FeedbackAberto({ feedback }: { feedback: FeedbackIA }) {
  return (
    <div className="rounded-xl border border-border bg-background overflow-hidden mb-4">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2">
          <path d="M9 12l2 2 4-4" />
          <circle cx="12" cy="12" r="10" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: TEAL }}>
          Avaliação
        </span>
      </div>

      <div className="p-5 space-y-3">
        {feedback.itens.map((item) => {
          const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.incorreto;
          return (
            <div key={item.item} className={`rounded-lg border px-4 py-3 ${cfg.border} ${cfg.bg}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold uppercase ${cfg.text}`}>Item {item.item}</span>
                <span className={`text-xs font-semibold ${cfg.text}`}>{cfg.label}</span>
              </div>
              {item.comentario && (
                <p className="text-xs text-muted-foreground leading-relaxed">{item.comentario}</p>
              )}
            </div>
          );
        })}

        {feedback.resumo && (
          <p className="text-sm text-muted-foreground leading-relaxed pt-2 border-t border-border/40">
            {feedback.resumo}
          </p>
        )}
      </div>
    </div>
  );
}
